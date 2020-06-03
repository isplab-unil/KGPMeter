


export class TrashButton{
  constructor(domId, kgp, listeners = {}){
    this.domId = domId
    this.kgp = kgp
    this.listeners = listeners
    this.init()
  }
  init(){
    d3.select("#"+this.domId).remove()
    // trash button
    this.trashButton = this.kgp.addSvgButton("\uf2ed",this.domId,"hint-trash", 3, 27, 28)
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