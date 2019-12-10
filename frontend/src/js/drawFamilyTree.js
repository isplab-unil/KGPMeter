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
    this.target = youNodeId
    this.privacyMetric = 1
    this.relationships = KinGenomicPrivacyMeter.getRelationships()

    this.indiNodeSize = {width:100,height:100}
    this.famNodeSize = {width:7,height:7}

    this.updateSvgWidth()

    // api urls
    this.api_base_url = api_base_url
    this.privacyScoreApiEndpoint = this.api_base_url+"/privacy-score"
    this.surveyApiEndpoint = this.api_base_url+"/survey"

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
    kgpMeterScoreRequestHandler.addListener((...args) => privacyBar.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => privacyWordedScore.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => privacyBackendStatus.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => privacyScoreNumberExplainer.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => kgpsurvey.await(...args))
    kgpMeterScoreRequestHandler.addListener((...args) => otherThingsToDoOnKgpMeterScoreResponse(...args))
    
    // trash button
    this.trashButton = new TrashButton("trash-button", this, {"click.trash": d=>self.reset()})

    // user id&source
    let idCookie = cookieLocalStoragePrefix+"user-id"
    let sourceCookie = cookieLocalStoragePrefix+"user-source"
    this.userId = cookie.read(idCookie)
    this.userSource = cookie.read(sourceCookie)
    if(!this.userId){
      this.userId = (+new Date())+"-"+Math.random()
      cookie.create(idCookie,this.userId,1)
      this.userSource = document.URL
      if(Boolean(this.userSource.match(/\/privacy-dev\//))){
        this.userSource = this.userSource+"?test"
      }
      cookie.create(sourceCookie,this.userSource,1)

      // initializationRequest
      kgpMeterScoreRequestHandler.requestScore(
        "i1",
        [["i1","f1"],["f1","i2"]], [],
        this.userId, this.userSource, self.i18n.lng,
        true // silent request
      )
    }

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

    // once this is done (after 800ms), reset the empty ftree from GEDCOM data
    setTimeout(function(){
      parseGed()
      d3.select("#familytree-g").remove()
      familyTreeArtist.init(0)
      saveFamilyTreeToLocalStorage()
    },transitionDuration+2)
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
    mobileBlock()
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




/** adds a 100ms without resize to window.onresize() before executing func (to avoid redraws every msec) */
function onWindowResize(func,timeout=100){
  let doit;
  window.onresize = function(){
    clearTimeout(doit);
    doit = setTimeout(func, timeout);
  }
}


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
  
    if(this.kgp.target){
      selectTarget(this.kgp.target)
    }

    this.nodeButtons = createNodeButtons(this.svgg)

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
              saveFamilyTreeToLocalStorage()
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

/** Debugging: show node ids on hover */
function showNodesIds(){
  kgp.svgg.selectAll(".nodeg")
    .append('text')
      .text(d => d.id)
      //.attr("class","node-id")
      .attr("transform","translate("+-50+",0)");
}


function saveFamilyTreeToLocalStorage(){
  localStorage.setItem("ftree.nodes",JSON.stringify(ftree.serialize(["sequencedDNA","lastSequencedDNA","i18nName"])))
  localStorage.setItem("ftree_save_date",+new Date())
  if(kgp.target){
    localStorage.setItem("kgp.target.id",kgp.target.id)
  }else{
    localStorage.setItem("kgp.target.id",null)
  }
}

function loadFamilyTreeFromLocalStorage(ftreeKey = "ftree.nodes", targetKey = "kgp.target.id", saveDateKey = "ftree_save_date"){
  let ftl = localStorage.getItem(ftreeKey)
  let targetId = localStorage.getItem(targetKey)
  let saveDate = +localStorage.getItem(saveDateKey)
  //console.log("LOADING family tree, ftl = ", ftl, ", targetId = ",targetId, ", saveDate = ",saveDate)
  if(Boolean(ftl) & (saveDate+2*3600*1000>=+new Date()) ){
    ftl = FamilyTreeLayout.unserialize(ftl)
    kgp.target = targetId? ftl.nodes[targetId] : null
    return ftl
  }
  return null
}


/** block IE if detected, not the same as mobile as foreignObject not supported */
function IEBlock(){
  if(detectIE11()){
    kgp.svg.append("rect")
        .attr("width",kgp.svgWidth)
        .attr("height",kgp.svgHeight)
        .attr("fill","white")
        .attr("opacity","0.8")

    privacyBackendStatus.displayDanger("IE-block-error",10000000000)
  }
}



/** Block mobile browsers when detected, not the same as IE as foreignObject allows text to wrap in multiple lines on small screens. */
function mobileBlock(){
  if(detectMobile()){
    kgp.svg.append("rect")
        .attr("width",kgp.svgWidth)
        .attr("height",kgp.svgHeight)
        .attr("fill","white")
        .attr("opacity","0.8")
    
    kgp.svg.append("foreignObject")
        .attr("y",kgp.svgHeight/4)
        .attr("width",kgp.svgWidth)
        .attr("height",kgp.svgHeight)
      .append("xhtml:div")
        .attr("style","max:width:100%;")
        .attr("data-i18n","mobile-block")
    
    privacyBackendStatus.displayDanger("mobile-block",10000000000)
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