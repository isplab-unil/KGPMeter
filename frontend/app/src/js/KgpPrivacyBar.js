


export class KgpPrivacyBar{
  /** init() method should be called after constructor */
  constructor(
    parentId,
    id,
    x, y,
    width, height, r,
    colorScale, 
    i18n,
    showScoreValue=false,
    showBoxes = true,
    showContour = false,
    strokeWidth = 4,
    backgroundColor = "rgb(230,230,230)",
    nbBoxes = 5
  ){
    this.parentId = parentId
    this.id = id
    this.width = width
    this.height = height
    this.r = r
    this.nbBoxes = nbBoxes
    this.strokeWidth = strokeWidth
    this.colorScale = colorScale
    this.backgroundColor = backgroundColor
    this.privacyStatus = 1
    this.i18n = i18n
    this.showScoreValue=showScoreValue
    this.showBoxes=showBoxes
    this.showContour=showContour
    this.x = x
    this.y = y

  }

  init(x, y, transitionDuration=500){
    if(x || x===0){
      this.x = x
    }
    if(y || y===0){
      this.y = y
    }
    
    let self = this
    this.g = d3.select("#"+this.parentId).append("g")
        .attr("transform","translate("+self.x+","+self.y+")")
        .attr("id", this.id)

    let startColor = this.colorScale(1)
    let barBasis = '<rect x="0" y="0" rx="'+
      (this.showContour? 0 : this.r)+'" ry="'+
      (this.showContour? 0 : this.r)+'" height="'+this.height+'" width="'+this.width+'"'
    this.g.html(barBasis+' fill="'+this.backgroundColor+'" class="privacy-bar-background"/>'+
                        barBasis+' fill="'+startColor+'" class="privacy-bar" />')
    this.bar = this.g.select(".privacy-bar")

    // boxes
    if(this.showBoxes){
      let boxSize = this.height / this.nbBoxes
      let yboxes = d3.range(0, this.height, boxSize)
      this.boxesG = this.g.append("g")
        .attr("id","privacy-bar-boxes-group")
      this.boxesG.selectAll("rect").data(yboxes).enter()
        .append("rect")
        .attr("class","privacy-bar-boxes")
        .attr("x","0")
        .attr("y",d=>d)
        .attr("rx",this.showContour? 0 : this.r)
        .attr("ry",this.showContour? 0 : this.r)
        .attr("width",this.width)
        .attr("height",boxSize)
        .attr("fill","none")
        .attr("stroke","white")
        .attr("stroke-width", this.strokeWidth+'px')
    }
    // contour
    if(this.showContour){
      this.g.append("rect")
        .attr("id", "privacy-bar-contour-background")
        .attr("x",-4*this.strokeWidth)
        .attr("y",-4*this.strokeWidth)
        .attr("rx",this.strokeWidth)
        .attr("ry",this.strokeWidth)
        .attr("height",this.height+(8*this.strokeWidth))
        .attr("width",this.width+(8*this.strokeWidth))
        .attr("fill","none")
        .attr("stroke-width",(2+8*this.strokeWidth)+"px")
        .attr("stroke","white")
      this.g.append("rect")
        .attr("id", "privacy-bar-contour")
        .attr("x",0)
        .attr("y",0)
        .attr("rx",this.r)
        .attr("ry",this.r)
        .attr("height",this.height)
        .attr("width",this.width)
        .attr("fill","none")
        .attr("stroke-width",this.strokeWidth+"px")
        .attr("stroke",this.colorScale(1))
    
      //'<rect class="'+privacyBar.elementClass+'" id="privacy-bar-contour" x="0" y="0" rx="5" ry="5" height="'+privacyBar.height+'" width="'+privacyBar.width+'" fill="none" stroke="'+startColor+'" stroke-width="'+privacyBar.strokeWidth+'px"/>')
      //rx="'+this.r+'" ry="'+this.r+'" height="'+this.height+'" width="'+this.width+'"'
      
    }

    this.scale = d3.scaleLinear()
      .range([this.height,0])
      .domain([0,1])

    if(this.showScoreValue){
      this.scoreG = this.g.append("g")
        .attr("transform","translate(0,3)")
        .attr("id","privacy-score")
      this.scoreG.html('<polygon points="-10,-6 -4,0 -10,6" fill="'+startColor+'"/>'+
                            '<text x="-14" y="5" fill="black" text-anchor="end">100%</text> <!--uncomment to see privacy-score value-->')
      this.scorePolygon = d3.select("#privacy-score polygon")
      this.text = d3.select("#privacy-score text")
    }

    this.scoreWaitingElements = d3.selectAll(this.initScoreWaitingElement())
    const scoreColoredElements = this.initScoreColoredElements()
    this.scoreFillColoredElements = d3.selectAll(scoreColoredElements.fill)
    this.scoreStrokeColoredElements = d3.selectAll(scoreColoredElements.stroke)
    this.update(1, transitionDuration)
  }

  /** abstract method: initialize elements that should have opacity=0.5 when waiting for score 
   * 
   * should return an array of DOM nodes
   * subclasses should always call the super method and&extend its return array
  */
  initScoreWaitingElement(){
    return Array.from(document.getElementsByClassName("privacy-bar-background")).concat(
      Array.from(document.getElementsByClassName("privacy-bar"))
    ).push(document.getElementById("privacy-bar-contour"))
  }
  /** abstract method: initialize elements whose "fill" attributes must be updated on score change
   * 
   * Also scoreColoredElements are greyed out when an unscorable tree is on (no target/no seq relative).
   * should return an object with 2 properties "fill" and "stroke", each are an array of DOM nodes of whose corresponding attribute is colored
   * subclasses should always call the super method and&extend its return array
   */
  initScoreColoredElements(){
    


    const bar = document.getElementsByClassName("privacy-bar")[0]
    const scorePolygon = this.showScoreValue? this.scorePolygon.nodes() : []
    return {
      fill: [bar].concat(scorePolygon),
      stroke: [document.getElementById("privacy-bar-contour")]
    }
  }

  /** update() updates the KgpPrivacyBar with a new score */
  update(privacyMeasure, transitionDuration=500, forceColor=null){
    this.privacyStatus = privacyMeasure
    let transition = d3.transition().duration(transitionDuration).ease(function(t){return d3.easeBackOut(t,0.8)})
    this.bar.transition(transition)
      .attr("y",this.scale(privacyMeasure))
      .attr("height",this.height - this.scale(this.privacyStatus))

    const scoreColor = forceColor? forceColor : this.colorScale(privacyMeasure)
    this.scoreFillColoredElements.transition(transition)
      .attr("fill", scoreColor)
    this.scoreStrokeColoredElements.transition(transition)
      .attr("stroke", scoreColor)
  
    this.scoreWaitingElements.transition(200).attr("opacity",1)
    // show score value
    if(this.showScoreValue){
      this.scoreG.attr("visibility","visible")
      this.scoreG
        .transition(transition)//d3.easeBackOut)//d3.easeExpInOut)//d3.easeCubicIn)
        .attr("transform","translate(0,"+Math.max(this.scale(privacyMeasure),4)+")")
      this.text.html((100*privacyMeasure).toFixed(0)+"%")
    }
  }

  /** awaitScore() puts the KgpPrivacyBar in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */
  awaitScore(kgpPromise, request, previousResponse){
    this.scoreWaitingElements.transition(200).attr("opacity",0.5)
    if( (!request.family_tree.target) || (request.family_tree.sequenced_relatives.length==0)){
      this.reset()
    }
    else{
      const self = this
      kgpPromise.then(kgpSuccess=>{
        self.update(kgpSuccess.result.privacy_metric)
      }).catch(kgpr=>{
        if(kgpr.status=="error"){
          if(kgpr.code==4){
            self.reset()
          }
        }
      })
    }
  }

  /** reset() updates the privacyBar to show that there is currently no score */
  reset(transitionDuration=500){
    const noScoreColor="darkgrey"
    this.scoreWaitingElements.transition(transitionDuration).attr("opacity",1)
    this.update(1, transitionDuration, noScoreColor)
    if(this.showScoreValue){
      this.scoreG.attr("visibility","hidden")
    }
  }

  static oldPrivacyBar(
    parentId,
    id,
    x, y,
    width, height, r,
    colorScale, 
    i18n
  ){
    return new KgpPrivacyBar(
      parentId,
      id,
      x, y,
      width, height, r,
      colorScale, 
      i18n,
      true,false, true,2,"rgb(255,255,255)"
    )
  }

  static newPrivacyBar(
    parentId,
    id,
    x, y,
    width, height, r,
    colorScale, 
    i18n
  ){
    return new KgpPrivacyBar(
      parentId,
      id,
      x, y,
      width, height, r,
      colorScale, 
      i18n,
      false,true, false
    )
  }
}