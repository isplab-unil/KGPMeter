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
  constructor(motherGroup, indiNodeSizeWidth, DOMid = "nodeg-action-buttons"){
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
    this.g.append("circle").attr("r", indiNodeSizeWidth /2+10) //kgp.indiNodeSize.width/2+10)
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



