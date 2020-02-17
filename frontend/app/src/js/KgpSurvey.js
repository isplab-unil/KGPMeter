import {cookie} from "./lib/iframeCookiesLocalStorage.js"

export class KgpSurvey{
  constructor(api_endpoint, userId, i18n, launchWaitTimeBasis=60, launchWaitTimePoissonMean=90, launchWaitTimeMax = 300, cookieLocalStoragePrefix="kgpmeter-"){
    this.api_endpoint = api_endpoint
    this.questions = ["prior-knowledge","score-exp","you-or-family","utility-website","nps","survey-comment","survey-sex","survey-age", "survey-own-sequence", "survey-other-sequence"]
    this.userId = userId
    this.i18n = i18n 
    this.cookieName = cookieLocalStoragePrefix+"survey-status"

    let self = this
    
    // Waiting time: 1m + poisson at mean 1m30
    this.timestampFirstRequest = null
    this.launchWaitTimeBasis = launchWaitTimeBasis
    this.launchWaitTimePoissonMean = launchWaitTimePoissonMean
    this.launchWaitTimeMax = launchWaitTimeMax
    this.launchWaitTime = 10*launchWaitTimeMax
    while(this.launchWaitTime>this.launchWaitTimeMax){
      this.launchWaitTime = this.launchWaitTimeBasis + poissonProcess.sample(this.launchWaitTimePoissonMean)
    }

    // survey launch conditions
    this.signaturesRequestedTrees = new Set()
    this.twoNodesAdded = false
    this.threeRequestsAsked = false
    this.oneTarget = false
    this.surveyNotStarted = true

    this.surveyTrigger =  undefined
  
    // send question answer on change 
    this.questions.forEach(questionId => {
      $("#"+questionId+" input").on("change",function(a,b,c){
        let json_to_send = {
          question_code:questionId,
          answer:$(this).val(),
          survey_trigger:self.surveyTrigger,
          user:{
            id: self.userId,
            lng: self.i18n.lng
          }
        }
        fetch(self.api_endpoint, {
          method: 'POST',
          body: JSON.stringify(json_to_send)
        })
      })
      // success!
    });
  
    // comment: different
    $("#survey-comment-text").on("change",function(a,b,c){
      let json_to_send = {
        question_code:"survey-comment",
        answer:$(this).val(),
        survey_trigger:self.surveyTrigger,
        user:{
          id: self.userId,
          lng: self.i18n.lng
        }
      }
      fetch(self.api_endpoint, {
        method: 'POST',
        body: JSON.stringify(json_to_send)
      })
    });
  
    this.updateSurveyVolunteerButton(0)
    
    document.getElementById("survey-finish-step-1-button").addEventListener("click", ()=>self.changePageSurvey())
    document.getElementById("survey-left-button").addEventListener("click", ()=>self.surveyPrevious())
    document.getElementById("survey-right-button").addEventListener("click", ()=>self.closeSurvey())

  }

  /**
   * Check that conditions to launch the survey are filled.
   */
  checkSurveyLaunchConditions(target){
    let nodes = ftree.nodesArray().filter(n=>!n.id.match(/f|F/))
    this.twoNodesAdded = nodes.length >= 3
    //let oneNodeSequenced = nodes.filter(n => n.sequencedDNA).length >= 1
    this.threeRequestsAsked = this.signaturesRequestedTrees.size>=3
    this.oneTarget = Boolean(target)
    //this.surveyNotStarted = !this.getSurveyStatus()
    //console.log("twoNodesAdded=",twoNodesAdded,", threeRequestsAsked=",threeRequestsAsked,", oneTarget=",oneTarget,", !surveyStarted", !surveyStarted)
  
    return this.twoNodesAdded && this.threeRequestsAsked && this.oneTarget && this.surveyNotStarted
  }

  /**
   * launch the survey
   * @param {*} trigger either "volunteer", "automatic", "resume"
   */
  launchSurvey(trigger){
    let self = this
    this.getSurveyStatus().then(status => {
      if(status!="finished"){
        self.surveyTrigger = trigger
        self.surveyNotStarted=false
        self.setSurveyStatus("launched")
        $("#modal-survey").modal('show')
      }
    })
    //$('#modal-survey').on('hidden.bs.modal', function (e) {if(getSurveyStatus()!="finished"){ showSurveyVolunteerButton() }})
  }

  await(kgpPromise, request, previousResponse){
    let self = this
    kgpPromise.then(kgpSuccess => {
      this.signaturesRequestedTrees.add(kgpSuccess.tree_signature)
      // if needed, set timestamp of first request
      if(!this.timestampFirstRequest){
        this.timestampFirstRequest = kgpSuccess.timestamp_js
      }
      // if launch conditions filled: launch survey (after required timeout)
      if(this.checkSurveyLaunchConditions(request.family_tree.target)){
        let now = +(new Date())
        let timeSinceFirstRequest = now - this.timestampFirstRequest
        let timeout;
        if(timeSinceFirstRequest > (1000*this.launchWaitTime)){
          // if the launchWaitTime is elapsed: launch after 5 seconds
          timeout = 5000;
        } else{
          // if the launchWaitTime isn't elapsed yet: launch after the time delta
          timeout = (1000*this.launchWaitTime) - timeSinceFirstRequest
        }
        setTimeout(()=>self.launchSurvey("automatic"),timeout)
      }
    }).catch(()=>{})
  }
  
  updateSurveyVolunteerButton(transitionSpeed=500){
    let self = this
    //
    this.getSurveyStatus().then(surveyStatus => {
      $("#survey-launch-button").off("click")
      // not launched: volunteer
      if(!surveyStatus){
        $("#survey-launch-button span").attr(self.i18n.keyAttr, "survey-volunteer")
        $("#survey-launch-button").stop(true).slideDown(transitionSpeed)
        $("#survey-launch-button").on("click",()=>self.launchSurvey("volunteer"))
      // launched: resume
      } else if(surveyStatus=="launched" || surveyStatus=="step-1-done"){
        $("#survey-launch-button span").attr(self.i18n.keyAttr, "survey-resume")
        $("#survey-launch-button").stop(true).slideDown(transitionSpeed)
        $("#survey-launch-button").on("click",()=>self.launchSurvey("resume"))
      // finished: hide
      } else if(surveyStatus=="finished"){
        $("#survey-launch-button").stop(true).slideUp(transitionSpeed)
      }
    })
    
  }
    /** from step 1 to step 2 */
  changePageSurvey(){
    $("#survey-finish-step-1-button").hide()
    $("#survey-finish-step-2-button").show()
    $("#survey-step-1").hide()
    $("#survey-step-2").show()
    this.setSurveyStatus("step-1-done")
  }

  /** back to step 1 from step 2 */
  surveyPrevious(){
    $("#survey-step-2").hide()
    $("#survey-finish-step-2-button").hide()
    $("#survey-step-1").show()
    $("#survey-finish-step-1-button").show()
    this.setSurveyStatus("launched")
  }

  /** finish at step 2 */
   closeSurvey(){
    $("#modal-survey").modal('hide')
    $("#survey-step-2").hide()
    $("#survey-finish-step-2-button").hide()
    $("#survey-step-1").show()
    $("#survey-finish-step-1-button").show()
    this.setSurveyStatus("finished")
  }

  /**
   * getSurveyStatus(): reads the survey-status cookie...
   * 
   * @returns undefined if not launched,
   *          "launched" if launched and step 1 not done,
   *          "step-1-done" if step 1 is done, but not step 2 (=user clicked on first finish button)
   *          "finished" if finished (=user clicked on second finish button)
   */
  getSurveyStatus(){
    return cookie.getItem(this.cookieName)
  }
  setSurveyStatus(status){
    cookie.setItem(this.cookieName,status,1)
    this.updateSurveyVolunteerButton()
  }
}
