


import {NodeButtonsGroup, standardNodeButtons, targetNodeButtons, youNodeButtons, youTargetNodeButtons} from "./NodeButtonsGroup.js"

export class FamilyTreeArtist{
  constructor(kgp, i18n, transitionDuration=800){
    this.kgp = kgp
    this.ftree = this.kgp.ftree
    this.i18n = i18n
    this.heightFtree = 0
    this.init(transitionDuration)
  }

  init(transitionDuration=800){
    this.ftree = this.kgp.ftree
    let self = this
    this.svgg = this.kgp.svg.append("g").attr("id","familytree-g")

    this.update(false, transitionDuration);
  
    // distinguish you node
    //this.kgp.target = this.ftree.nodes[this.kgp.youNodeId]
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
    this.ftree.computeLayout(false)
    this.ftree.center(true, false)

    // rescale tree if gets out of svg
    let ftreeLeftMargin = 70 // 20 pix for target button, 50 for first node circle
    let ftreeRightMargin = 170 // 120 for add-relative menu, 50 for last node circle
    let widthFtree = ftreeLeftMargin+ this.ftree.width() + ftreeRightMargin

    let miny = this.ftree.minY()
    this.heightFtree = this.ftree.maxY() - miny + 150
    // if we can still resize the svg -> let's do it!

    let widthScaleFactor = d3.min([1, this.kgp.svgWidth/widthFtree])
    this.kgp.updateSvgHeight(this.heightFtree*widthScaleFactor, transitionsDuration)
    
    let scaleFactor = d3.min([1, widthScaleFactor, this.kgp.svgHeight/this.heightFtree])

    let translateX = widthFtree<this.kgp.svgWidth-ftreeRightMargin/2?
        this.kgp.svgWidth/2 :
        scaleFactor * (this.ftree.width() / 2 + ftreeLeftMargin)

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

    // remove links whose source or target is no longer in this.ftree
    let keepLink = d=> Boolean(this.ftree.nodes[d[0].id]) && Boolean(this.ftree.nodes[d[1].id])
    let linkExit = link.filter(d=> !keepLink(d))
    linkExit.transition()
        .duration(transitionsDuration)
        .attr("d", d=> FamilyTreeArtist.renderLink(d[1],d[1]))
        .remove();

    link = link.filter(keepLink).data(this.ftree.getLinks(),
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
    // let nodes = this.ftree.nodesArray()

    // adds each node as a group
    let node = this.svgg.selectAll(".nodeg")

    // remove nodes whose d is no longer in ftree
    let keepNode = d=> Boolean(this.ftree.nodes[d.id])
    node.filter(d=> !keepNode(d)).remove()


    node = node.filter(keepNode).data(this.ftree.nodesArray().filter(n=>!n.hidden))
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
    this.nodeButtons = new NodeButtonsGroup(this.svgg, self.kgp.indiNodeSize.width)
  
    // ------------------------ remove node button ------------------------
    function removeNode(node){
      self.ftree.deleteNode(node.id, self.kgp.youNodeId)
      self.nodeButtons.hide()
      self.kgp.scoreRequestHandler.requestScore(
        self.kgp.target? self.kgp.target.id:"",
        self.ftree.getLinksAsIds(), self.ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
        self.kgp.userId, self.kgp.userSource, self.i18n.lng
      )
      self.update()
      self.kgp.saveFamilyTreeToLocalStorage()
    }
  
    self.nodeButtons.addButton("remove-node",25,-50, "\uf506", "80px","50px", self.i18n, "hint-delete-node")
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
      self.kgp.scoreRequestHandler.requestScore(
        self.kgp.target? self.kgp.target.id:"",
        self.ftree.getLinksAsIds(), self.ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
        self.kgp.userId, self.kgp.userSource, self.i18n.lng)
        self.kgp.saveFamilyTreeToLocalStorage()
  
    }
    let toggleDNAbutton = self.nodeButtons.addButton("toggle-dna",25,50, "\uf471+", "170px", "70px", self.i18n, "hint-sequence-node")
        .on("click.sequenced-dna",toggleDNA)
    self.nodeButtons.onWakeCallbacks.push(toggleDnaButtonText)
  
    // ------------------------ set as target button ------------------------
  
    self.nodeButtons.addButton("set-as-target",-50,0, "\uf05b",
      "120px", "45px", self.i18n, 
      "change-target", {
        FAx:-10, FAy:7,
        tooltipx:"-144px",
      })
        .on("click.set-as-target", n=>self.kgp.selectTarget(n))
  
  
    // ------------------------ add relatives button ------------------------
    let addRelativeButton = self.nodeButtons.addButton("add-relative",50,0, "\uf234",
      0, 0, self.i18n, 
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
      let canAddChildren = node.depth<self.kgp.options.maxFamilyTreeDepth-1
      let canAddParents = (self.ftree.maxDepth<self.kgp.options.maxFamilyTreeDepth-1 || node.depth!=0)
  
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
            .attr(self.i18n.keyAttr,"node-name-"+relative)
            .on("click",function(node){
              let relativeNode = addRelative(node)
              relativeNode.i18nName = self.kgp.relationToYou(node.i18nName,relative)
              self.update(node)
              self.nodeButtons.hide()
              addRelativeHitbox.remove()
              self.kgp.saveFamilyTreeToLocalStorage()
            })
      }
  
      if(canAddMother){_addAddRelativeSpan("mother",d=> self.ftree.addParent("","F",d.id),true)}
      if(canAddFather){_addAddRelativeSpan("father",d=> self.ftree.addParent("","M",d.id),true)}
      if(spouseMissing & node.sex=="M"){_addAddRelativeSpan("partner",d=> self.ftree.addSpouse("",d.id),true)}
      if(spouseMissing & node.sex=="F"){_addAddRelativeSpan("partner",d=> self.ftree.addSpouse("",d.id),true)}
      if(canAddChildren){_addAddRelativeSpan("daughter",d=> self.ftree.addChild("","F",d.id,false),true)}
      if(canAddChildren){_addAddRelativeSpan("son",d=> self.ftree.addChild("","M",d.id,false),true)}
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
    self.nodeButtons.addButton("change-sex", -25, 50, "\uf228", 80, 45, self.i18n, "hint-change-sex",
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

