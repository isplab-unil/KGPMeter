"use strict";


let standardNodeButtons = ["add-relative", "remove-node", "toggle-dna", "set-as-target"]
let targetNodeButtons = [ "add-relative"]
let youNodeButtons = ["add-relative", "change-sex", "toggle-dna", "set-as-target"]
let youTargetNodeButtons = ["add-relative", "change-sex"]

/**
 * Singleton class to handle buttons for a given node
 *
 */
class NodeButtonsGroup{
  /**
   *
   * @param {d3-selection} motherGroup a d3-selection containing the <g> group where the tree will be drawn (=familyTreeArtist.svgg)
   * @param {string} DOMid an id for the node buttons'<g> mother tag
   */
  constructor(motherGroup, DOMid = "nodeg-action-buttons"){
    this.DOMid = DOMid
    this.currentNode = undefined
    this.buttons = {}
    this.onWakeCallbacks = []
    this.onHideCallbacks = []

    // ensure there is only 1 NodeButtonsGroup on svg
    d3.select("#"+this.DOMid,).remove()
    this.g = motherGroup.append("g")
        .attr("id",this.DOMid)

    // add a circle hitbox as trigger for nodeButtons mouseleave
    this.g.append("circle").attr("r",kgp.indiNodeSize.width/2+10)
        .attr("fill","none")
        .attr("stroke-width","20px")
        .attr("stroke","white")
        .attr("stroke-opacity",0)

  }

  /**
   * Wake the node buttons for a given node
   *
   * @param {Object} node a node of the family tree with a "buttons" property.
   */
  wake(node){
    this.hide()
    this.currentNode = node
    this.g
      .attr("transform","translate(" + node.x + "," + node.y + ")")
      .attr("visibility","visible").datum(node)
    this.g.node().parentNode.appendChild(this.g.node())
    for(let btn of node.buttons){
        this.buttons[btn].attr("visibility","visible").datum(node)
    }
    this.onWakeCallbacks.forEach(cb => cb(node))
  }

  /**
   * Hide the node buttons
   */
  hide(){
    this.g
      .attr("visibility","hidden")
    for(let btn in this.buttons){
        this.buttons[btn].attr("visibility","hidden")
    }
    let node = this.currentNode
    this.onHideCallbacks.forEach(cb => cb(node))
  }

  /**
   * Creates the button svg, including circle, Font-Awesome logo and tooltip
   *
   * @param {string} buttonName the unique reference name for that button
   * @param {int} x the button x position, relative to node center
   * @param {int} y the button y position, relative to node center
   * @param {string} FAunicode the button's Font-Awesome logo unicode code
   * @param {int} options.FAx FAunicode's x position, relative to button position, defaults to -13
   * @param {int} options.FAy FAunicode's y position, relative to button position, defaults to 6
   * @param {int} options.tooltipx tooltip's x position, relative to button position, defaults to 24
   * @param {int} options.tooltipy tooltip's y position, relative to button position, defaults to -22
   * @param {int} tooltipWidth tooltip svg <text> tag width
   * @param {int} tooltipHeight  tooltip svg <text> tag height (most often 45)
   * @param {string} i18nKey the i18n key of the text for the tooltip
   */
  addButton(buttonName,x,y, FAunicode, tooltipWidth, tooltipHeight,i18nKey, options={}){
    let defaultSettings = {
      FAx:-13, FAy:6, tooltipx:24,tooltipy:-22
    }

    let button = this.g.append("g")
        .attr("transform","translate("+x+","+y+")")
        .attr("style","cursor:pointer;")
        .classed("button-with-tooltip",true)
    button.append("circle")
        .attr("r",20)
        .classed("node-button-circle",true)
    button.append("text")
        .attr("class","fas node-button-fas")
        .attr("x",options.FAx? options.FAx : defaultSettings.FAx)
        .attr("y",options.FAy? options.FAy : defaultSettings.FAy)
        .text(FAunicode)
    button.append("foreignObject")
        .attr("x",options.tooltipx? options.tooltipx : defaultSettings.tooltipx)
        .attr("y",options.tooltipy? options.tooltipy : defaultSettings.tooltipy)
        .attr("width",tooltipWidth)
        .attr("height",tooltipHeight)
        .classed("tooltip",true)
      .append("xhtml:div").append("span")
        .classed("tooltip-text",true)
        .attr(i18n.keyAttr,i18nKey)

    this.buttons[buttonName] = button
    return button
  }

}


function createNodeButtons(svgg){

  let nodeButtons = new NodeButtonsGroup(svgg)

  // ------------------------ remove node button ------------------------
  function removeNode(node){
    ftree.deleteNode(node.id,kgp.youNodeId)
    nodeButtons.hide()
    kgpMeterScoreRequestHandler.requestScore(
      kgp.target?kgp.target.id:"",
      ftree.getLinksAsIds(), ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
      kgp.userId, kgp.userSource, i18n.lng)
    familyTreeArtist.update()
    saveFamilyTreeToLocalStorage()
  }

  nodeButtons.addButton("remove-node",25,-50, "\uf506", "80px","50px", "hint-delete-node")
      .on("click.remove",removeNode)


  // ------------------------ toggle DNA sequencing button ------------------------


  // HOW TO HANDLE +-: d =>'\uf471'+(d.sequencedDNA?"-":"+") IN OLD CODE?
  let toggleDNAbutton = nodeButtons.addButton("toggle-dna",25,50, "\uf471+", "170px", "70px", "hint-sequence-node")
      .on("click.sequenced-dna",toggleDNA)
  function toggleDnaButtonText(node){
    toggleDNAbutton.select("text").node().innerHTML = '\uf471'+(node.sequencedDNA?"-":"+")
  }
  nodeButtons.onWakeCallbacks.push(toggleDnaButtonText)

  function toggleDNA(node){
    node.sequencedDNA = !node.sequencedDNA
    toggleDnaButtonText(node)
    d3.select("#"+FamilyTreeArtist.nodeGroupId(node.id)+" .dna-logo").classed("invisible-dna", !node.sequencedDNA)
    kgpMeterScoreRequestHandler.requestScore(
      kgp.target?kgp.target.id:"",
      ftree.getLinksAsIds(), ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
      kgp.userId, kgp.userSource, i18n.lng)
    saveFamilyTreeToLocalStorage()

  }

  // ------------------------ set as target button ------------------------

  nodeButtons.addButton("set-as-target",-50,0, "\uf05b",
    "120px", "45px",
    "change-target", {
      FAx:-10, FAy:7,
      tooltipx:"-144px",
    })
      .on("click.set-as-target", n=>kgp.selectTarget(n))


  // ------------------------ add relatives button ------------------------
  let addRelativeButton = nodeButtons.addButton("add-relative",50,0, "\uf234",
    0, 0,
    undefined, {
      FAx:-10, FAy:6,
      tooltipx:0, tooltipy:0,
    })

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
  nodeButtons.onHideCallbacks.push(removeAddRelativeMenu)
  //nodeButtons.onWakeCallbacks.push(removeAddRelativeMenu)

  // TODO: this is not super clean, in the future improve the architecture of addRelativeMenu()
  async function addRelativeMenu(node){
    //fix: node doesn't propagate to circle
    node = nodeButtons.g.datum()
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
            relativeNode.i18nName = kgp.relationToYou(node.i18nName,relative)
            familyTreeArtist.update(node)
            nodeButtons.hide()
            addRelativeHitbox.remove()
            saveFamilyTreeToLocalStorage()
          })
    }

    if(canAddMother){_addAddRelativeSpan("mother",d=> ftree.addParent("","F",d.id),true)}
    if(canAddFather){_addAddRelativeSpan("father",d=> ftree.addParent("","M",d.id),true)}
    if(spouseMissing & node.sex=="M"){_addAddRelativeSpan("partner",d=> ftree.addSpouse("",d.id),true)}
    if(spouseMissing & node.sex=="F"){_addAddRelativeSpan("partner",d=> ftree.addSpouse("",d.id),true)}
    if(canAddChildren){_addAddRelativeSpan("daughter",d=> ftree.addChild("","F",d.id,false),true)}
    if(canAddChildren){_addAddRelativeSpan("son",d=> ftree.addChild("","M",d.id,false),true)}
  }


  // ------------------------ Toggle your sex Button ------------------------
  nodeButtons.addButton("change-sex", -25, 50, "\uf228", 80, 45, "hint-change-sex",
    {
      FAx:-10, FAy:6,
      tooltipx:-104,
    })
    .on("click.change-sex",toggleYourSex)


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
    saveFamilyTreeToLocalStorage()
  }

  return nodeButtons
}


