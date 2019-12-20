


export class KgpWordedScore{
  constructor(
    parentId,
    id,
    elementClass,
    x, y,
    height,
    colorScale,
    i18n,
    i18nKey,
  ){
    this.parentId = parentId
    this.id = id
    this.elementClass = elementClass
    this.x = x
    this.y = y
    this.height = height
    this.colorScale = colorScale
    this.i18n = i18n
    this.i18nKey = i18nKey
    this.privacyStatus = 1

    this.init()
  }

  init(){
    let self = this

    d3.select("#"+this.id).remove()

    this.text = d3.select("#"+this.parentId).append("text")
        .attr("x",this.x)
        .attr("y",this.y)
        .attr("height",this.height)
        .attr("text-anchor","end")
        .attr("fill","darkgrey")
        .attr("id",this.id)
        .attr("class",this.elementClass)
        //TODO: fix i18n.keyAttr reference
        .attr(this.i18n.keyAttr,self.i18nKey)
    this.scale = d3.scaleLinear()
        .range([self.height,0])
        .domain([0,1])

    this.i18n.dynamic[self.i18nKey] = (t,d)=>self.i18nFormat(t,d)
    this.hide(0)
  }

  hide(transitionDuration=3000){
    this.text.transition(transitionDuration).attr("opacity",0)
  }

  /** update() updates the KgpWordedScore with a new score */
  update(privacyMeasure, transitionDuration = 3000){
    let self = this
    //TODO: use a proper instance nbBoxes...
    if(privacyMeasure>0.99){
      this.privacyStatus = 100
    } else if(privacyMeasure>=0.8){
      this.privacyStatus = 5
    } else if(privacyMeasure>=0.6){
      this.privacyStatus = 4
    } else if(privacyMeasure>=0.4){
      this.privacyStatus = 3
    } else if(privacyMeasure>=0.2){
      this.privacyStatus = 2
    } else {
      this.privacyStatus = 1
    }
    //if(kgp.target){
    this.text
      .attr("opacity",0.2)
      .transition(transitionDuration).attr("opacity",1)
    this.i18n.data(this.i18nKey, this.privacyStatus)
    setTimeout(()=>d3.select("#"+self.id+" tspan").attr("fill", self.colorScale(privacyMeasure)), 50)
    /*} else{
      this.hide()
    }*/
  }

  /** await() puts the KgpWordedScore in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */
  await(kgpPromise, request, previousResponse){
    if(this.text.attr("opacity")==1){
      this.text.transition(200).attr("opacity",0.5)
    }

    kgpPromise.then(kgpSuccess=>{
      this.update(kgpSuccess.result.privacy_metric)
    },()=>{})
  }

  async i18nFormat(text, data){
    let qualifier = await this.i18n.t("privacy-bar-score-"+data)
    return text.replace("{}", qualifier? qualifier : "...")
  }
}