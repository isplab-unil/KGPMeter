"use strict";




class KinGenomicPrivacyMeter{
  constructor(api_base_url, svgId, youNodeId, i18n, maxFamilyTreeDepth=5, cookieLocalStoragePrefix="kgpmeter-"){
    let self = this
    this.i18n = i18n
    
    this.svg = d3.select("#"+svgId)
    this.svgHeight = parseInt(this.svg.attr("height"))
    this.svgOriginalHeight = this.svgHeight
    this.svgMaxHeight = parseInt(this.svg.attr("data-max-height"))
    this.svgMaxHeight =  this.svgMaxHeight? this.svgMaxHeight : this.svgHeight
    
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

    // api urls
    this.api_base_url = api_base_url
    this.privacyScoreApiEndpoint = this.api_base_url+"/privacy-score"
    this.surveyApiEndpoint = this.api_base_url+"/survey"

    kgpsurvey = new KgpSurvey(this.surveyApiEndpoint, this.userId, this.i18n)

    // privacy bar
    let privacyBarWidth = 30
    let privacyBarStrokeWidth = 4
    privacyBar = new PrivacyBar(
      this.svg.attr("id"),
      "privacy-bar-g",
      this.svgWidth - privacyBarWidth - privacyBarStrokeWidth, 30, 
      30, 400, 5,
      d3.interpolateRgbBasis(["rgb(255,0,0)","rgb(255,125,0)","rgb(255,255,0)","rgb(0,195,0)"]),
      self.i18n
    )

    // privacy worded score
    privacyWordedScore = new PrivacyWordedScore(
      privacyBar.g.attr("id"),
      "privacy-bar-title",
      "privacy-bar-element", 
      privacyBar.width, -16, 20,
      privacyBar.colorScale,
      self.i18n,
      "privacy-bar-title"
    )

    // backend status
    privacyBackendStatus = new PrivacyBackendStatus("kgp-response-container", self.i18n)

    // explainer
    privacyScoreNumberExplainer = new PrivacyScoreNumberExplainer("kgp-explainer-container", self.i18n, "explainer-text")

    // request handler
    kgpMeterScoreRequestHandler = new KgpMeterScoreRequestHandler(this.privacyScoreApiEndpoint)
    kgpMeterScoreRequestHandler.addListener(kgpPromise => {
      kgpPromise.then(kgpSuccess=>kgp.privacyMetric = kgpSuccess.result.privacy_metric,()=>{})
    })
    kgpMeterScoreRequestHandler.addListener((...args) => privacyBar.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => privacyWordedScore.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => privacyBackendStatus.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => privacyScoreNumberExplainer.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => kgpsurvey.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => otherThingsToDoOnKgpMeterScoreResponse(...args))
    
    // new user: send init request
    if(new_user){
      kgpMeterScoreRequestHandler.requestScore(
        "i1",
        [["i1","f1"],["f1","i2"]], [],
        this.userId, this.userSource, self.i18n.lng,
        true // silent request
      )
    }
    
    // trash button
    this.trashButton = new TrashButton("trash-button", this, {"click.trash": d=>self.reset()})

    onWindowResize(()=>self.resizeSvg())

  }

  /** Resets the family tree in a pleasant way */
  reset(transitionDuration=800){
    console.log("KgpMeter.reset(): transitionDuration=",transitionDuration)
    
    let self = this
    // delete all nodes except you
    ftree.nodesArray().forEach(n =>{
      if(n.id!=self.youNodeId){
        ftree.deleteNode(n.id,self.youNodeId)
    }})
    familyTreeArtist.nodeButtons.hide()
    // set privacy score back to 1:
    self.privacyMetric = 1
    self.target = null
    resp = null
    privacyBar.elements.transition(200).attr("opacity",1)
    privacyBar.update(1)
    privacyBackendStatus.hide()
    privacyWordedScore.hide()
    privacyScoreNumberExplainer.hide()

    // smoothly transition back to original position
    familyTreeArtist.update(false, transitionDuration)

    // once this is done (after 800ms), reset to the empty ftree
    setTimeout(function(){
      ftree = KinGenomicPrivacyMeter.getEmptyFamilyTree()
      d3.select("#familytree-g").remove()
      familyTreeArtist.init(0)
      self.saveFamilyTreeToLocalStorage()
    },transitionDuration+2)
  }

  saveFamilyTreeToLocalStorage(familyTreeKey="kgp-familyTree", targetKey="kgp-targetId", saveDateKey="kgp-saveDate"){
    localStorage.setItem(familyTreeKey,JSON.stringify(ftree.serialize(["sequencedDNA","lastSequencedDNA","i18nName"])))
    localStorage.setItem(saveDateKey,+new Date())
    if(this.target){
      localStorage.setItem(targetKey,kgp.target.id)
    }else{
      localStorage.setItem(targetKey,null)
    }
  }
  
  loadFamilyTreeFromLocalStorage(familyTreeKey="kgp-familyTree", targetKey="kgp-targetId", saveDateKey="kgp-saveDate", familyTreeClass=FamilyTreeLayout){
    let ftl = localStorage.getItem(familyTreeKey)
    let targetId = localStorage.getItem(targetKey)
    let saveDate = +localStorage.getItem(saveDateKey)
    //console.log("LOADING family tree, ftl = ", ftl, ", targetId = ",targetId, ", saveDate = ",saveDate)
    if(Boolean(ftl) & (saveDate+2*3600*1000>=+new Date()) ){
      ftl = familyTreeClass.unserialize(ftl)
      self.target = targetId? ftl.nodes[targetId] : null
      return ftl
    }
    return null
  }

  selectTarget(newTarget, forceUpdate=false){
    let self = this
    if(!newTarget.id){
      newTarget = ftree.nodesArray().filter(n =>n.id==newTarget)[0]
    }
    if( forceUpdate || (!this.target) || newTarget.id!=this.target.id){
      let oldTarget = self.target
      this.target = newTarget
      familyTreeArtist.setAsTarget(newTarget, oldTarget)
      kgpMeterScoreRequestHandler.requestScore(
        self.target?self.target.id:"",
        ftree.getLinksAsIds(), ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
        self.userId, self.userSource, i18n.lng
      )
      self.saveFamilyTreeToLocalStorage()
    }
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
    privacyBar.init(kgp.svgWidth - privacyBar.width - privacyBar.strokeWidth, privacyBar.y, 0)
    privacyWordedScore.init()
    privacyWordedScore.hide()
    this.trashButton.init()

    if(kgp.target){
      privacyBar.update(this.privacyMetric, 0)
      privacyWordedScore.update(this.privacyMetric, 0)
    }
    familyTreeArtist.init(0)
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

      privacyBackendStatus.displayDanger("IE-block-error",10000000000)
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
      
      privacyBackendStatus.displayDanger("mobile-block",10000000000)
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








// ****************************************************************************************************





// ****************************************************************************************************

let familyTreeArtist;
class FamilyTreeArtist{
  constructor(kgp, i18n, transitionDuration=800){
    this.kgp = kgp
    this.i18n = i18n
    this.init(transitionDuration)
  }

  init(transitionDuration=800){
    let self = this
    this.svgg = this.kgp.svg.append("g").attr("id","familytree-g")

    this.update(false, transitionDuration);
  
    // distinguish you node
    //this.kgp.target = ftree.nodes[this.kgp.youNodeId]
    let meNodeGroup = d3.select("#"+FamilyTreeArtist.nodeGroupId(this.kgp.youNodeId))
      .classed("you",true)
      .each(d=>{
        d.buttons = youNodeButtons//youTargetNodeButtons
        d.i18nName = "you"
      })
    meNodeGroup.select(".node-name")
      .each(async function(d){
        let nodeNameYou = await self.i18n.t("node-name-you")
        if(Boolean(d.name) & d.name!=nodeNameYou){
          this.innerHTML = d.name
        } else{
          this.setAttribute(self.i18n.keyAttr, "node-name-you")
        }
      })

      this.initNodeButtons()

    // hide on mouseleave
    this.nodeButtons.g.on("mouseleave.hide",d => self.nodeButtons.hide())

    // highlight links on hover
    this.nodeButtons.g.on("mouseover.toggleHighlightNodeLinks",self.generateToggleHighlightNodeLinks(true))
    this.nodeButtons.g.on("mouseleave.toggleHighlightNodeLinks",self.generateToggleHighlightNodeLinks(false))
    this.nodeButtons.g.on("click.toggleHighlightNodeLinks",self.generateToggleHighlightNodeLinks(false))
  }

  update(updateSource, transitionsDuration=800){
    let self = this
    updateSource = updateSource? {x:updateSource.x,y:updateSource.y} : false
    ftree.computeLayout(false)
    ftree.center(true, false)

    // rescale tree if gets out of svg
    let ftreeLeftMargin = 70 // 20 pix for target button, 50 for first node circle
    let ftreeRightMargin = 170 // 120 for add-relative menu, 50 for last node circle
    let widthFtree = ftreeLeftMargin+ ftree.width() + ftreeRightMargin

    let miny = ftree.minY()
    let heightFtree = ftree.maxY() - miny + 150
    // if we can still resize the svg -> let's do it!
    let newSvgHeight = this.kgp.svgHeight
    if(heightFtree<this.kgp.svgOriginalHeight){ //tree height smaller than minimum
      newSvgHeight = this.kgp.svgOriginalHeight
    }
    // tree height between minimum and max
    if(heightFtree>this.kgp.svgOriginalHeight && heightFtree< this.kgp.svgMaxHeight){
      newSvgHeight = heightFtree
    }
    // tree height taller than maximum
    if(heightFtree>this.kgp.svgMaxHeight){
      newSvgHeight = this.kgp.svgMaxHeight
    }
    // if needed -> change it
    if(newSvgHeight!=this.kgp.svgHeight){
      this.kgp.svg.transition()
        .duration(transitionsDuration)
        .attr("height",newSvgHeight)
      this.kgp.svgHeight = newSvgHeight
    }
    let scaleFactor = d3.min([1, this.kgp.svgWidth/widthFtree, this.kgp.svgHeight/heightFtree])
    let translateX = widthFtree<this.kgp.svgWidth-ftreeRightMargin/2?
        this.kgp.svgWidth/2 :
        scaleFactor * (ftree.width() / 2 + ftreeLeftMargin)

    this.svgg.transition()
      .duration(transitionsDuration)
      .attr("transform","translate("+translateX+","+(scaleFactor*(80-miny))+") scale("+scaleFactor+")")
      // for tutorial videos, use these settings:
      //.attr("transform","translate("+550+","+(scaleFactor*(75-miny))+") scale("+scaleFactor+")")

    // updateSource:
    updateSource = updateSource? updateSource : {x:translateX+(widthFtree-ftreeRightMargin)/2,y:50}
    this.updateLinks(updateSource,transitionsDuration)
    this.updateNodes(updateSource,transitionsDuration)
  }


  updateLinks(source, transitionsDuration){
    let self = this

    // adds the links between the nodes
    let link = this.svgg.selectAll(".link")

    // remove links whose source or target is no longer in ftree
    let keepLink = d=> Boolean(ftree.nodes[d[0].id]) && Boolean(ftree.nodes[d[1].id])
    let linkExit = link.filter(d=> !keepLink(d))
    linkExit.transition()
        .duration(transitionsDuration)
        .attr("d", d=> FamilyTreeArtist.renderLink(d[1],d[1]))
        .remove();

    link = link.filter(keepLink).data(ftree.getLinks(),
      // add key function: make sure each ftree-link is assigned to the right svg-link-path
      function(d){return d? FamilyTreeArtist.linkNodeId(d[0].id,d[1].id):this.id})
    let linkEnter = link.enter().insert("path",".nodeg")
      .attr("id", d => FamilyTreeArtist.linkNodeId(d[0].id,d[1].id))
      .attr("class", d => "link "+FamilyTreeArtist.linkNodeClass(d[0].id)+" "+FamilyTreeArtist.linkNodeClass(d[1].id))
      .attr("d", FamilyTreeArtist.renderLink(source,source))
      .attr("fill","none")
      .attr("stroke","lightgrey")

    let linkUpdate = linkEnter.merge(link)
    linkUpdate.transition()
      .duration(transitionsDuration)
      .attr("d", d=> FamilyTreeArtist.renderLink(d[0],d[1]))

  }

  updateNodes(source, transitionsDuration){
    let self = this

    // maps the node data to the tree layout
    // let nodes = ftree.nodesArray()

    // adds each node as a group
    let node = this.svgg.selectAll(".nodeg")

    // remove nodes whose d is no longer in ftree
    let keepNode = d=> Boolean(ftree.nodes[d.id])
    node.filter(d=> !keepNode(d)).remove()


    node = node.filter(keepNode).data(ftree.nodesArray().filter(n=>!n.hidden))
    //disable action buttons during the transition
    //node.on("mouseenter.actionButtons",null)

    // nodeEnter: all the new nodes
    let nodeEnter = node.enter().append("g")
      .attr("id", d => FamilyTreeArtist.nodeGroupId(d.id) )
      .attr("class", "nodeg")
      .attr("transform", "translate(" + source.x + "," + source.y + ")")

    // fam nodes: add height salt, for a different branching height for all famc
    let famNodes = nodeEnter.filter(d => d.tag==="FAM")
    famNodes.insert("circle",".nodeg")
        .attr("r", self.kgp.famNodeSize.width/2)
        // add man/woman/family classes
        .attr("class", function(d){
          let tr = "node-circle "
          // family classes: one for each member of the family
          tr += d.husb? FamilyTreeArtist.famNodeClass(d.husb.id)+" ": ""
          tr += d.wife? FamilyTreeArtist.famNodeClass(d.wife.id)+" ": ""
          if(d.chil){
            d.chil.forEach(c =>{tr += FamilyTreeArtist.famNodeClass(c.id)+" "})
          }
          return tr
        })
        .attr("fill","lightgrey")
    famNodes.each(d=>{
      // @F1@ is special case: it is only famc whose wife and husb aren't targets in links
      d.heightSalt = d.id=="@F1@"? 0 : 15-Math.random()*30
    })

    // nodes of individuals
    let indiNodes = nodeEnter.filter(d => d.tag==="INDI")
    indiNodes.append("circle")
        .attr("r", self.kgp.indiNodeSize.width/2 )
        // add man/woman/family classes
        .attr("class", function(d){
          let tr = "node-circle "
          if(d.sex=="M"){
            tr+=" man"
          }else if(d.sex=="F"){
            tr+=" woman"
          }
          return tr
        })
    // draw buttons on mouseenter&click
    indiNodes.on("mouseenter.actionButtons",node => self.nodeButtons.wake(node))
    indiNodes.on("click.actionButtons",node => self.nodeButtons.wake(node))
    // add buttons to nodes
    indiNodes.each(d=>{
      d.buttons = standardNodeButtons
    })

    // adds the DNA logo
    indiNodes.append("text")
        .attr("class", "fas fa-dna dna-logo node-logo node-logo-large")
        .classed("invisible-dna",d => !d.sequencedDNA)
        .attr("x","-16px")
        .attr("y"," 0px")
        .attr("width","40px")
        .attr("height","40px")
        .attr('font-family', 'FontAwesome')
        .attr('font-size', "36px")
        .text('\uf471');

    // Node name: a div that has contenteditable
    indiNodes.append("foreignObject")
        .attr("x","-40px")
        .attr("y","14px")
        .attr("width","80px")
        .attr("height","2em")
      .append("xhtml:div")
        .attr("contenteditable","true")
        .attr("class","node-name")
        .attr("spellcheck","false")
          // select all text on focus
          .on("focus",function(d){
            let el = this;
            requestAnimationFrame(function() {
              let range = document.createRange()
              range.selectNodeContents(el)
              let sel = window.getSelection()
              sel.removeAllRanges()
              sel.addRange(range)
            })
          })
          .each(async function(d){
            let nodeNameMan = await self.i18n.t("node-name-man")
            let nodeNameWoman = await self.i18n.t("node-name-woman")
            let nodeNameYou = await self.i18n.t("node-name-you")
            if(Boolean(d.name) & d.name!=nodeNameMan & d.name!=nodeNameWoman){
              // only set innerHTML if the name is truly non-standard
              this.innerHTML = d.name
            } else if(d.name!=nodeNameYou & this.getAttribute(self.i18n.keyAttr)!= "node-name-you"){
              // only set self.i18n.keyAttr if it's not the "you" node
              //this.setAttribute(self.i18n.keyAttr, d.sex=="F"? "node-name-woman":"node-name-man")
              this.setAttribute(self.i18n.keyAttr, "node-name-"+d.i18nName)
            }
            // remove i18n attribute on keydown and quit name editing on enter
            // using addEventListener and not d3.on() as accessing the event 
            // with d3.event might cause problem with webpack/bundler
            this.addEventListener("keydown",function(event){
              this.removeAttribute(self.i18n.keyAttr)
              d.name = this.innerHTML
              self.kgp.saveFamilyTreeToLocalStorage()
              // if line return: remove selection and unselect element
              if(event.keyCode==13){
                window.getSelection().removeAllRanges()
                this.blur()
              }
              return false;
            })
          })

    // old&new nodes together
    let nodeUpdate = nodeEnter.merge(node)
    // hide families with only 1 spouse
    nodeUpdate.filter(d => d.tag==="FAM").classed("hidden",d=> !(d.wife&&d.husb))
    // highlight links
    nodeUpdate.on("mouseenter.toggleHighlightNodeLinks",self.generateToggleHighlightNodeLinks(true))
    nodeUpdate.on("mouseleave.toggleHighlightNodeLinks",self.generateToggleHighlightNodeLinks(false))
    // transition nodes to new positions smoothly
    nodeUpdate.transition()
      .duration(transitionsDuration)
      .attr("transform", d => "translate(" + d.x + "," + d.y + ")")

  }

  setAsTarget(newTarget, oldTarget){
    this.nodeButtons.hide()
    // reset old target's buttons, logo & sequenced state
    if(oldTarget){
      oldTarget.buttons = oldTarget.id == this.kgp.youNodeId? youNodeButtons : standardNodeButtons
      d3.select("#"+ FamilyTreeArtist.nodeGroupId(oldTarget.id)+" .node-logo")
        .attr("class", "fas fa-dna dna-logo node-logo node-logo-large "+ (oldTarget.lastSequencedDNA? "":"invisible-dna"))
        .attr("x","-16px")
        .text('\uf471');
      oldTarget.sequencedDNA = oldTarget.lastSequencedDNA
      oldTarget.lastSequencedDNA = undefined
    }
    // set new target
    newTarget.buttons = newTarget.id == this.kgp.youNodeId? youTargetNodeButtons : targetNodeButtons
    // ...ensure it's not sequenced
    newTarget.lastSequencedDNA = newTarget.sequencedDNA
    newTarget.sequencedDNA = false
    //nodeg.select(".dna-logo").classed("invisible-dna", !node.sequencedDNA)
  
    // change the logo
    d3.select("#"+FamilyTreeArtist.nodeGroupId(newTarget.id)+" .node-logo")
        .attr("class", "fas fa-crosshairs crosshairs-logo node-logo node-logo-large")
        .attr("x","-18px")
        .text('\uf05b');
  }

  initNodeButtons(){
    let self = this
    this.nodeButtons = new NodeButtonsGroup(this.svgg)
  
    // ------------------------ remove node button ------------------------
    function removeNode(node){
      ftree.deleteNode(node.id,kgp.youNodeId)
      self.nodeButtons.hide()
      kgpMeterScoreRequestHandler.requestScore(
        self.kgp.target?kgp.target.id:"",
        ftree.getLinksAsIds(), ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
        self.kgp.userId, self.kgp.userSource, i18n.lng)
      familyTreeArtist.update()
      self.kgp.saveFamilyTreeToLocalStorage()
    }
  
    self.nodeButtons.addButton("remove-node",25,-50, "\uf506", "80px","50px", "hint-delete-node")
        .on("click.remove",removeNode)
  
  
    // ------------------------ toggle DNA sequencing button ------------------------
  
  
    // HOW TO HANDLE +-: d =>'\uf471'+(d.sequencedDNA?"-":"+") IN OLD CODE?
    function toggleDnaButtonText(node){
      toggleDNAbutton.select("text").node().innerHTML = '\uf471'+(node.sequencedDNA?"-":"+")
    }
    function toggleDNA(node){
      node.sequencedDNA = !node.sequencedDNA
      toggleDnaButtonText(node)
      d3.select("#"+FamilyTreeArtist.nodeGroupId(node.id)+" .dna-logo").classed("invisible-dna", !node.sequencedDNA)
      kgpMeterScoreRequestHandler.requestScore(
        self.kgp.target?kgp.target.id:"",
        ftree.getLinksAsIds(), ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
        self.kgp.userId, self.kgp.userSource, i18n.lng)
        self.kgp.saveFamilyTreeToLocalStorage()
  
    }
    let toggleDNAbutton = self.nodeButtons.addButton("toggle-dna",25,50, "\uf471+", "170px", "70px", "hint-sequence-node")
        .on("click.sequenced-dna",toggleDNA)
    self.nodeButtons.onWakeCallbacks.push(toggleDnaButtonText)
  
    // ------------------------ set as target button ------------------------
  
    self.nodeButtons.addButton("set-as-target",-50,0, "\uf05b",
      "120px", "45px",
      "change-target", {
        FAx:-10, FAy:7,
        tooltipx:"-144px",
      })
        .on("click.set-as-target", n=>self.kgp.selectTarget(n))
  
  
    // ------------------------ add relatives button ------------------------
    let addRelativeButton = self.nodeButtons.addButton("add-relative",50,0, "\uf234",
      0, 0,
      undefined, {
        FAx:-10, FAy:6,
        tooltipx:0, tooltipy:0,
      })
  
    // TODO: this is not super clean, in the future improve the architecture of addRelativeMenu()
    async function addRelativeMenu(node){
      //fix: node doesn't propagate to circle
      node = self.nodeButtons.g.datum()
      removeAddRelativeMenu()
  
      // can only add children/parents if tree not too deep
      let canAddChildren = node.depth<kgp.maxFamilyTreeDepth-1
      let canAddParents = (ftree.maxDepth<kgp.maxFamilyTreeDepth-1 || node.depth!=0)
  
      let canAddMother = (!node.famc || !node.famc.wife) && canAddParents
      let canAddFather = (!node.famc || !node.famc.husb) && canAddParents
      let spouseMissing = !node.fams || node.fams.length==0 || !node.fams[0].husb || !node.fams[0].wife
      // FO stands for foreignObject
      let FOw = 100
      let FOh = ((canAddChildren?2:0)+canAddMother+canAddFather+spouseMissing)*26
      let FOx = 20
      let FOy = -(FOh/2)
      let hitboxMargin = 20
  
      // hitbox so that menu doesn't disappear unexpectedly
      let addRelativeHitbox = addRelativeButton.append("path").classed("add-relatives-hitbox",true)
          .attr("d",
            " M"+(FOx-2*hitboxMargin)+" "+(-hitboxMargin)+
            " L"+(FOx)+" "+(FOy-hitboxMargin)+
            " L"+(FOx+FOw+hitboxMargin)+" "+(FOy-hitboxMargin)+
            " L"+(FOx+FOw+hitboxMargin)+" "+(-FOy+hitboxMargin)+
            " L"+(FOx)+" "+(-FOy+hitboxMargin)+
            " L"+(FOx-2*hitboxMargin)+" "+(hitboxMargin)+
            " Z")
          .attr("fill","red").attr("opacity",0)
  
      let addRelativeFO = addRelativeButton.append("foreignObject").classed("add-relatives-fo",true)
          .attr("x",FOx+"px").attr("y",FOy+"px")
          .attr("width",(FOw+10)+"px").attr("height",(FOh+10)+"px")
      let addRelativeDiv = addRelativeFO.append("xhtml:div")
          .attr("style","cursor:pointer;")
          .classed("add-relatives-list",true)
          .on("mouseleave.hitbox", removeAddRelativeMenu)
  
      function _addAddRelativeSpan(relative, addRelative){
        addRelativeDiv.append("span")
            .attr(i18n.keyAttr,"node-name-"+relative)
            .on("click",function(node){
              let relativeNode = addRelative(node)
              relativeNode.i18nName = self.kgp.relationToYou(node.i18nName,relative)
              familyTreeArtist.update(node)
              self.nodeButtons.hide()
              addRelativeHitbox.remove()
              self.kgp.saveFamilyTreeToLocalStorage()
            })
      }
  
      if(canAddMother){_addAddRelativeSpan("mother",d=> ftree.addParent("","F",d.id),true)}
      if(canAddFather){_addAddRelativeSpan("father",d=> ftree.addParent("","M",d.id),true)}
      if(spouseMissing & node.sex=="M"){_addAddRelativeSpan("partner",d=> ftree.addSpouse("",d.id),true)}
      if(spouseMissing & node.sex=="F"){_addAddRelativeSpan("partner",d=> ftree.addSpouse("",d.id),true)}
      if(canAddChildren){_addAddRelativeSpan("daughter",d=> ftree.addChild("","F",d.id,false),true)}
      if(canAddChildren){_addAddRelativeSpan("son",d=> ftree.addChild("","M",d.id,false),true)}
    }
    addRelativeButton.select("circle")
      .on("mouseover.addRelative",addRelativeMenu)
    addRelativeButton.select("text")
      .on("mouseover.addRelative",addRelativeMenu)
    // correctly remove add relative menu on hide&wake
    function removeAddRelativeMenu(){
      //setTimeout(d => {
      addRelativeButton.select(".add-relatives-fo").remove()
      addRelativeButton.select(".add-relatives-hitbox").remove()
      //},20)
    }
    self.nodeButtons.onHideCallbacks.push(removeAddRelativeMenu)
    //self.nodeButtons.onWakeCallbacks.push(removeAddRelativeMenu)
  
  
    // ------------------------ Toggle your sex Button ------------------------
    function toggleYourSex(node){
      let circle = d3.select("#"+FamilyTreeArtist.nodeGroupId(node.id)+" .node-circle")
  
      node.sex = node.sex=="M"? "F":"M"
      let isWoman = node.sex=="F"
      circle.classed("man", !isWoman)
      circle.classed("woman", isWoman)
      // exchange role in marriages
      if(node.fams){
        node.fams.forEach(f=>{
          let h=f.husb;
          f.husb = f.wife;
          f.wife = h;
        })
      }
      // take care of spouse
      let spouse = node.spouse()
      if(spouse){
        spouse.sex = spouse.sex=="M"? "F":"M"
        isWoman = spouse.sex=="F"
        let spouseCircle = d3.select("#"+FamilyTreeArtist.nodeGroupId(spouse.id)+" .node-circle")
        spouseCircle.classed("man", !isWoman)
        spouseCircle.classed("woman", isWoman)
        //document.querySelector("#"+nodeGroupId(spouse.id)+" .node-name").setAttribute(i18n.keyAttr, isWoman? "node-name-woman":"node-name-man")
      }
      self.kgp.saveFamilyTreeToLocalStorage()
    }
    self.nodeButtons.addButton("change-sex", -25, 50, "\uf228", 80, 45, "hint-change-sex",
      {
        FAx:-10, FAy:6,
        tooltipx:-104,
      })
      .on("click.change-sex",toggleYourSex)

  }

  static idToString(id){
    return id? id.replace(/@/g,""):""
  }

  static linkNodeId(id1,id2){
    return "link-"+FamilyTreeArtist.idToString(id1)+"-"+FamilyTreeArtist.idToString(id2)
  }

  static linkNodeClass(id){
    return "link-"+FamilyTreeArtist.idToString(id)
  }

  static famNodeClass(id){
    return "fam-"+FamilyTreeArtist.idToString(id)
  }

  static nodeGroupId(id){
    return "node-"+FamilyTreeArtist.idToString(id)
  }

  static renderCurvedLink(source,target){
    return "M" + source.x + "," + source.y
    + "C" + source.x + "," + (source.y + target.y) / 2
    + " " + target.x + "," +  (source.y + target.y) / 2
    + " " + target.x + "," + target.y
  }

  static renderSquareLink(source,target){
    let heightSalt = source.heightSalt? source.heightSalt : 0
    return "M" + source.x + "," + source.y
    + "L" + source.x + "," + (heightSalt+(source.y + target.y) / 2)
    + "L" + target.x + "," +  (heightSalt+(source.y + target.y) / 2)
    + "L" + target.x + "," + target.y
  }

  static renderLink(source,target){
    return FamilyTreeArtist.renderSquareLink(source,target)
  }

  generateToggleHighlightNodeLinks(active){
    return function toggleHighlightNodeLinks(d){
      let links = [
        d.id,
        d.famc? d.famc.id:undefined,
        d.fams && d.fams.length>0? d.fams[0].id:undefined,
      ].filter(Boolean)
      links.map(FamilyTreeArtist.linkNodeClass).forEach(l =>{
        let links = d3.selectAll("."+l)
        links.classed("highlight-link",active)
      })
  
      if(d.famc){
        d3.select("#"+FamilyTreeArtist.nodeGroupId(d.famc.id)+" .node-circle").classed("highlight-fam",active)
      }
      if(d.fams && d.fams.length>0){
        d3.select("#"+FamilyTreeArtist.nodeGroupId(d.fams[0].id)+" .node-circle").classed("highlight-fam",active)
      }
    }
  }
}








class TrashButton{
  constructor(domId, kgp, listeners = {}){
    this.domId = domId
    this.kgp = kgp
    this.listeners = listeners
    this.init()
  }
  init(){
    d3.select("#"+this.domId).remove()
    // trash button
    this.trashButton = this.kgp.addSvgButton("\uf2ed",this.domId,"hint-trash",0)
    let self = this
    Object.keys(this.listeners).forEach(k=>self.trashButton.on(k, self.listeners[k]))
  }

  on(event, listener){
    this.listeners[event] = listener
    this.trashButton.on(event, listener)
  }
}

// 9.12.2019: untested and unused
class TrashButtonWithConfirmation{
  /**
   * Creates the trash button
   */
  constructor(domId, kgp, confirmListeners = []){
    this.domId = domId
    this.kgp = kgp
    this.listeners = confirmListeners
    d3.select("#"+domId).remove()
    // trash button
    let self = this
    let trashButton = this.kgp.addSvgButton("\uf2ed",domId,"hint-trash",0)
    trashButton.on("click.confirm", d=>{
      trashButton.select(".tooltip").remove()
      let confirmDiv = trashButton.append("foreignObject")
          .attr("x",0).attr("y",25)
          .attr("width",250).attr("height",80)
          .classed("tooltip",true)
        .append("xhtml:div")
          .classed("tooltip-text",true)
          .html("<span style='display:block;' "+self.kgp.i18n.keyAttr+"='trash-sure'></span>")
      // cancel button
      confirmDiv.append("button")
          .classed("btn btn-large btn-primary",true)
          .attr("style","float:center;margin:2px;")
          .html('<span '+self.kgp.i18n.keyAttr+'="trash-cancel"></span> <i class="fas fa-times"></i>')
          .on("click.cancel",d=>{
            new TrashButtonWithConfirmation(self.domId, self.kgp, self.listeners)
          })
      // confirm button
      this.trashButton = confirmDiv.append("button")
          .classed("btn btn-large btn-danger",true)
          .attr("style","float:center;margin:2px;")
          .html('<span '+self.kgp.i18n.keyAttr+'="trash-confirm"></span> <i class="far fa-trash-alt"></i>')
          .on("click.listeners", d=> {
            self.listeners.forEach(f=>f(d))
            new TrashButtonWithConfirmation(self.domId, self.kgp, self.listeners)
          })
      // weird: manual rfresh needed...
      self.i18n.refresh()
    })
  }

  on(event, listener){
    this.trashButton.on(event, listener)
  }
}