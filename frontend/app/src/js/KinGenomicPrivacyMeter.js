import {cookie} from "./lib/cookies.js"
import {FamilyTreeLayout} from "./FamilyTreeLayout.js"
import {FamilyTreeArtist} from "./FamilyTreeArtist.js"
import {KgpScoreRequestHandler} from "./KgpScoreRequestHandler.js"
import {KgpBackendStatus} from "./KgpBackendStatus.js"
import {KgpScoreNumberExplainer} from "./KgpScoreNumberExplainer.js"
import {KgpWordedScore} from "./KgpWordedScore.js"
import {KgpPrivacyBar} from "./KgpPrivacyBar.js"
import {TrashButton} from "./TrashButton.js"
import {detectIE11, detectMobile, onWindowResize} from "./utils.js"

export class KinGenomicPrivacyMeter{
  constructor(api_base_url, svgId, youNodeId, i18n, maxFamilyTreeDepth=5, cookieLocalStoragePrefix="kgpmeter-"){
    let self = this
    this.i18n = i18n
    
    this.svg = d3.select("#"+svgId)
    this.svgHeight = parseInt(this.svg.attr("height"))
    this.svgOriginalHeight = this.svgHeight
    let dataSvgMaxHeight = parseInt(this.svg.attr("data-max-height"))
    this.setSvgMaxHeight(dataSvgMaxHeight? dataSvgMaxHeight : this.svgHeight)
    
    this.maxFamilyTreeDepth = maxFamilyTreeDepth
    this.youNodeId = youNodeId // "@I1@"
    this.privacyMetric = 1
    this.relationships = KinGenomicPrivacyMeter.getRelationships()

    this.indiNodeSize = {width:100,height:100}
    this.famNodeSize = {width:7,height:7}

    this.updateSvgWidth()

    // user id&source
    let idCookie = cookieLocalStoragePrefix+"user-id"
    let sourceCookie = cookieLocalStoragePrefix+"user-source"
    this.userId = cookie.read(idCookie)
    this.userSource = cookie.read(sourceCookie)
    let new_user = !this.userId
    if(new_user){
      this.userId = (+new Date())+"-"+Math.random()
      cookie.create(idCookie,this.userId,1)
      this.userSource = document.URL
      // TODO: remove or refine ?test
      if(Boolean(this.userSource.match(/\/privacy-dev\//))){
        this.userSource = this.userSource+"?test"
      }
      cookie.create(sourceCookie,this.userSource,1)
    }

    // set language event
    function setLanguage(e){
      console.log("-- KgpInnerClient setLanguage()! e.detail.lng: ", e.detail.lng)
      i18n.changeLanguage(e.detail.lng)
    }
    window.document.addEventListener('KgpSetLanguageEvent', setLanguage, false)

    // set source event
    function setSource(e){
      console.log("-- KgpInnerClient setsource()! e.detail.source: ", e.detail.source)
      let userSource = cookie.read(sourceCookie)
      if(!userSource){
        cookie.create(sourceCookie, e.detail.source, 1)
      }
    }
    window.document.addEventListener('KgpSetSourceEvent', setSource, false)

    // set max dimensions event
    function setIframeMaxDimensionEvent(e){
      console.log("-- KgpInnerClient setIframeMaxDimensionEvent()! e.detail.maxHeight: ", e.detail.maxHeight)
    }
    window.document.addEventListener('KgpSetIframeMaxDimensionEvent', setIframeMaxDimensionEvent, false)

    // api urls
    this.setApiUrl(api_base_url)


    // privacy bar
    let privacyBarWidth = 30
    let privacyBarStrokeWidth = 4
    this.privacyBar = new KgpPrivacyBar(
      this.svg.attr("id"),
      "privacy-bar-g",
      this.svgWidth - privacyBarWidth - privacyBarStrokeWidth, 30, 
      30, 400, 5,
      d3.interpolateRgbBasis(["rgb(255,0,0)","rgb(255,125,0)","rgb(255,255,0)","rgb(0,195,0)"]),
      self.i18n
    )

    // privacy worded score
    this.privacyWordedScore = new KgpWordedScore(
      this.privacyBar.g.attr("id"),
      "privacy-bar-title",
      "privacy-bar-element", 
      this.privacyBar.width, -16, 20,
      this.privacyBar.colorScale,
      self.i18n,
      "privacy-bar-title"
    )

    // backend status
    this.backendStatus = new KgpBackendStatus("kgp-response-container", self.i18n)

    // explainer
    this.scoreNumberExplainer = new KgpScoreNumberExplainer("kgp-explainer-container", self.i18n, "explainer-text")

    // request handler
    this.scoreRequestHandler = new KgpScoreRequestHandler(this.privacyScoreApiEndpoint)
    // update privacyMetric
    this.scoreRequestHandler.addListener(kgpPromise => {
      kgpPromise.then(
        kgpSuccess => self.privacyMetric = kgpSuccess.result.privacy_metric,
        ()=>{}
      )
    })
    // update cursor
    this.scoreRequestHandler.addListener(kgpPromise => {
      $("body").css({'cursor':'progress'})
      kgpPromise.then(
        kgpSuccess => $("body").css({'cursor':'auto'}),
        kgpError => $("body").css({'cursor':'auto'}))
    })
    // ...other listeners
    this.scoreRequestHandler.addListener((...args) => self.privacyBar.await(...args))
    this.scoreRequestHandler.addListener((...args) => self.privacyWordedScore.await(...args))
    this.scoreRequestHandler.addListener((...args) => self.backendStatus.await(...args))
    this.scoreRequestHandler.addListener((...args) => self.scoreNumberExplainer.await(...args))
    
    // new user: send init request
    if(new_user){
      this.scoreRequestHandler.requestScore(
        "i1",
        [["i1","f1"],["f1","i2"]], [],
        this.userId, this.userSource, self.i18n.lng,
        true // silent request
      )
    }
    
    // trash button
    this.trashButton = new TrashButton("trash-button", this, {"click.trash": d=>self.reset()})

    onWindowResize(()=>self.resizeSvg())

    this.ftree = this.loadFamilyTreeFromLocalStorage()
    let savedFtree = Boolean(this.ftree)
    if(!savedFtree){
      //console.log("NO FAMILY TREE IN STORAGE")
      this.ftree = KinGenomicPrivacyMeter.getEmptyFamilyTree()
    }

    this.familyTreeArtist = new FamilyTreeArtist(this, this.i18n,0)

    if(this.target){
      this.selectTarget(this.target, true)
    }
    if(savedFtree){
      this.scoreRequestHandler.requestScore(
        self.target?self.target.id:"",
        this.ftree.getLinksAsIds(), this.ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
        self.userId, self.userSource, this.i18n.lng
      )
    }
    this.mobileBlock()
    this.IEBlock()
  }

  /** Resets the family tree in a pleasant way */
  reset(transitionDuration=800){
    
    let self = this
    // delete all nodes except you
    this.ftree.nodesArray().forEach(n =>{
      if(n.id!=self.youNodeId){
        self.ftree.deleteNode(n.id,self.youNodeId)
    }})
    this.familyTreeArtist.nodeButtons.hide()
    // set privacy score back to 1:
    self.privacyMetric = 1
    self.target = null
    this.privacyBar.elements.transition(200).attr("opacity",1)
    this.privacyBar.update(1)
    this.backendStatus.hide()
    this.privacyWordedScore.hide()
    this.scoreNumberExplainer.hide()

    // smoothly transition back to original position
    this.familyTreeArtist.update(false, transitionDuration)

    // once this is done (after 800ms), reset to the empty ftree
    setTimeout(function(){
      self.ftree = KinGenomicPrivacyMeter.getEmptyFamilyTree()
      d3.select("#familytree-g").remove()
      self.familyTreeArtist.init(0)
      self.saveFamilyTreeToLocalStorage()
    },transitionDuration+2)
  }

  saveFamilyTreeToLocalStorage(familyTreeKey="kgp-familyTree", targetKey="kgp-targetId", saveDateKey="kgp-saveDate"){
    localStorage.setItem(familyTreeKey,JSON.stringify(this.ftree.serialize(["sequencedDNA","lastSequencedDNA","i18nName"])))
    localStorage.setItem(saveDateKey,+new Date())
    if(this.target){
      localStorage.setItem(targetKey, this.target.id)
    }else{
      localStorage.setItem(targetKey,null)
    }
  }
  
  loadFamilyTreeFromLocalStorage(familyTreeKey="kgp-familyTree", targetKey="kgp-targetId", saveDateKey="kgp-saveDate", familyTreeClass=FamilyTreeLayout){
    let familyTree = null
    let ftl = localStorage.getItem(familyTreeKey)
    let targetId = localStorage.getItem(targetKey)
    let saveDate = +localStorage.getItem(saveDateKey)
    //console.log("LOADING family tree, ftl = ", ftl, ", targetId = ",targetId, ", saveDate = ",saveDate)
    if(Boolean(ftl) & (saveDate+2*3600*1000>=+new Date()) ){
      familyTree = familyTreeClass.unserialize(ftl)
      this.target = targetId? familyTree.nodes[targetId] : null
    }
    return familyTree
  }

  selectTarget(newTarget, forceUpdate=false){
    let self = this
    if(!newTarget.id){
      newTarget = this.ftree.nodesArray().filter(n =>n.id==newTarget)[0]
    }
    if( forceUpdate || (!this.target) || newTarget.id!=this.target.id){
      let oldTarget = self.target
      this.target = newTarget
      this.familyTreeArtist.setAsTarget(newTarget, oldTarget)
      this.scoreRequestHandler.requestScore(
        self.target?self.target.id:"",
        this.ftree.getLinksAsIds(), this.ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
        self.userId, self.userSource, self.i18n.lng
      )
      self.saveFamilyTreeToLocalStorage()
    }
  }

  setApiUrl(api_base_url){
    this.api_base_url = api_base_url
    this.privacyScoreApiEndpoint = (this.api_base_url+"/privacy-score").replace("//","/")
  }

  setSvgMaxHeight(svgMaxHeight){
    this.svgMaxHeight = svgMaxHeight
  }

  /** Update the svg width, called on window resizes */
  updateSvgWidth(){
    this.svgWidth = this.svg.node().parentNode.clientWidth
    this.svg.attr("width",this.svgWidth)
  }

  /**
  * function correctly resizing svg, family tree and privacy bar according to svg's parent node
  */
  resizeSvg(){
    // remove all children of svg
    let svgNode = this.svg.node()
    while (svgNode.firstChild) {svgNode.removeChild(svgNode.firstChild);}
    // resize svg
    this.updateSvgWidth()
    // redraw tree&privacy bar
    this.privacyBar.init( self.svgWidth - this.privacyBar.width - this.privacyBar.strokeWidth, this.privacyBar.y, 0)
    this.privacyWordedScore.init()
    this.privacyWordedScore.hide()
    this.trashButton.init()

    if(self.target){
      this.privacyBar.update(this.privacyMetric, 0)
      this.privacyWordedScore.update(this.privacyMetric, 0)
    }
    this.familyTreeArtist.init(0)
    this.mobileBlock()
    this.IEBlock()
  }

  /** Returns the family relation to center node ("you") of target relation
   * 
   * for rexample relationToYou("father", "son") will return "brother" (the "son" of your "father" is your "brother")
  */
  relationToYou(sourceRelation,targetRelation){
    if( this.relationships[sourceRelation] && this.relationships[sourceRelation][targetRelation] ){
      return this.relationships[sourceRelation][targetRelation]
    }

    let sex = KinGenomicPrivacyMeter.getSex(targetRelation,sourceRelation)
    if(sex=="F"){return "woman"}
    if(sex=="M"){return "man"}
    return undefined
  }


  /** use by TrashButton, TrashButtonWithConfirmation */
  addSvgButton(FAunicode,gId,i18nKey,x=0,tooltipX=0,tooltipY=25,tooltipWidth=80,tooltipHeight=50){
    let button = this.svg.append("g")
        .attr("id",gId)
        .attr("transform","translate("+x+",27)")
        .attr("style","cursor:pointer;")
        .classed("button-with-tooltip",true)
    button.append("rect")
        .classed("svg-button",true)
        .attr("width",60) // big width to allow button to reduce tooltip hide sensitivity
        .attr("height",25)
        .attr("fill","white")
        .attr("opacity",0)

    button.append("text")
        .attr("class","fas svg-button-fas")
        .attr("y",20)
        .text(FAunicode)
    button.append("foreignObject")
        .attr("x",tooltipX)
        .attr("y",tooltipY)
        .attr("width",tooltipWidth)
        .attr("height",tooltipHeight)
        .classed("tooltip",true)
      .append("xhtml:div").append("span")
        .classed("tooltip-text",true)
        .attr(this.i18n.keyAttr,i18nKey)

    return button
  }

  /** block IE if detected, not the same as mobile as foreignObject not supported */
  IEBlock(){
    let self = this
    if(detectIE11()){
      self.svg.append("rect")
          .attr("width",self.svgWidth)
          .attr("height",self.svgHeight)
          .attr("fill","white")
          .attr("opacity","0.8")

      this.backendStatus.displayDanger("IE-block-error",10000000000)
    }
  }

  /** Block mobile browsers when detected, not the same as IE as foreignObject allows text to wrap in multiple lines on small screens. */
  mobileBlock(){
    let self = this
    if(detectMobile()){
      self.svg.append("rect")
          .attr("width",self.svgWidth)
          .attr("height",self.svgHeight)
          .attr("fill","white")
          .attr("opacity","0.8")
      
      self.svg.append("foreignObject")
          .attr("y",self.svgHeight/4)
          .attr("width",self.svgWidth)
          .attr("height",self.svgHeight)
        .append("xhtml:div")
          .attr("style","max:width:100%;")
          .attr("data-i18n","mobile-block")
      
      this.backendStatus.displayDanger("mobile-block",10000000000)
    }
  }

  /** Debugging: show node ids on hover */
  showNodesIds(){
    self.svgg.selectAll(".nodeg")
      .append('text')
        .text(d => d.id)
        //.attr("class","node-id")
        .attr("transform","translate("+-50+",0)");
  }

  /** Creates a depth 2 dictionary to encode relationships in a family
   * 
   * index1 represents "source relation" and index2 "target relation"
   * It is not complete, hence relationToYou(source, target) should be used to find a relation*/
  static getRelationships(){
    // handling family relationships
    let relationships= {
      "grandmother":{
        "partner":"grandfather",
        "daughter":"aunt",
        "son":"uncle"
      },
      "mother":{
        "father":"grandfather",
        "mother":"grandmother",
        "partner":"father",
        "daughter":"sister",
        "son":"brother"
      },
      "motherinlaw":{
        "partner":"fatherinlaw",
        "daughter":"sisterinlaw",
        "son":"brotherinlaw",
      },
      "aunt":{
        "partner":"uncleinlaw",
        "daughter":"cousinf",
        "son":"cousinm"
      },
      "auntinlaw":{
        "partner":"uncle",
        "daughter":"cousinf",
        "son":"cousinm"
      },
      "you":{
        "father":"father",
        "mother":"mother",
        "partner":"partner",
        "daughter":"daughter",
        "son":"son"
      },
      "partner":{
        "father":"fatherinlaw",
        "mother":"motherinlaw",
        "partner":"you",
        "daughter":"daughter",
        "son":"son"
      },
      "sister":{
        "father":"father",
        "mother":"mother",
        "partner":"brotherinlaw",
        "daughter":"niece",
        "son":"nephew"
      },
      "sisterinlaw":{
        "daughter":"niece",
        "son":"nephew"
      },
      "daughter":{
        "father":"partner",
        "mother":"partner",
        "partner":"soninlaw",
        "daughter":"granddaughter",
        "son":"grandson"
      },
      "daughterinlaw":{
        "partner":"son",
        "daughter":"granddaughter",
        "son":"grandson"
      },
      "granddaughter":{
        "father":"soninlaw",
        "mother":"daughterinlaw",
      }
    }
    //translating for males
    let relationshipsEquiv= [
    ["grandfather","grandmother","grandmother"],
    ["father","mother","mother"],
    ["fatherinlaw","motherinlaw","motherinlaw"],
    ["uncle","aunt","auntinlaw"],
    ["uncleinlaw","auntinlaw","aunt"],
    ["brother","sister","sisterinlaw"],
    ["brotherinlaw","sisterinlaw","woman"],
    ["son","daughter","daughterinlaw"],
    ["soninlaw","daughterinlaw","daughter"],
    ["grandson","granddaughter","woman"],
    ]
    relationshipsEquiv.forEach(tuple=>{
      relationships[tuple[0]] = JSON.parse(JSON.stringify(relationships[tuple[1]]))
      relationships[tuple[0]]["partner"] = tuple[2]
    })
    return relationships
  }

  static getEmptyFamilyTree(){
    let emptyFamilyTree = {
      "class": "FamilyTreeLayout",
      "nodes": [
        {
          "id": "@I1@",
          "sex": "F",
          "tag": "INDI",
          "fams": [],
          "famc": null,
          "chil": [],
          "wife": null,
          "husb": null,
          "sequencedDNA": false,
          "i18nName": "you"
        }
      ],
      "properties": [
        "id", "name", "sex", "tag", "fams", "famc", "chil", "wife",
        "husb", "sequencedDNA", "lastSequencedDNA", "i18nName"
      ],
      "centerNodeId": 0
    }
    return FamilyTreeLayout.unserialize(JSON.stringify(emptyFamilyTree))
  }

  /** getSex() returns "F" if given relation is female, "M" if male */
  static getSex(relation,partnerRelation=false){
    let males = ["man","grandfather", "father", "fatherinlaw", "uncle", "uncleinlaw", "brother", "brotherinlaw","cousinm", "son","soninlaw","nephew","grandson"]
    let females = ["woman","grandmother", "mother", "motherinlaw", "aunt","auntinlaw", "sister", "sisterinlaw","cousinf", "daughter","daughterinlaw","niece","granddaughter"]
    if( males.findIndex(r=>r==relation)!=-1 ){return "M"}
    if( females.findIndex(r=>r==relation)!=-1 ){return "F"}
    if( males.findIndex(r=>r==partnerRelation)!=-1 ){return "F"}
    if( females.findIndex(r=>r==partnerRelation)!=-1 ){return "M"}
  
    return undefined
  }
}



