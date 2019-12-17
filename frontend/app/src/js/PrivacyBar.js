"use strict";



class PrivacyBar{
  constructor(
    parentId,
    id,
    x, y,
    width, height, r,
    colorScale, 
    i18n,
    nbBoxes = 5,
    strokeWidth = 4,
    elementClass = "privacy-bar-element",
    backgroundColor = "rgb(230,230,230)"
  ){
    this.parentId = parentId
    this.id = id
    this.width = width
    this.height = height
    this.r = r
    this.nbBoxes = nbBoxes
    this.strokeWidth = strokeWidth
    this.colorScale = colorScale
    this.elementClass = elementClass
    this.backgroundColor = backgroundColor
    this.privacyStatus = 1
    this.i18n = i18n

    this.init(x, y, 0)
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
    let barBasis = '<rect x="0" y="0" rx="'+this.r+'" ry="'+this.r+'" height="'+this.height+'" width="'+this.width+'"'
    this.g.html(barBasis+' fill="'+this.backgroundColor+'" class="privacy-bar-background '+this.elementClass+'"/>'+
                        barBasis+' fill="'+startColor+'" class="privacy-bar '+this.elementClass+'" />')
    this.bar = this.g.select(".privacy-bar")

    let boxSize = this.height / this.nbBoxes
    let yboxes = d3.range(0, this.height, boxSize)
    this.boxesG = this.g.append("g")
      .attr("id","privacy-bar-contour-group")
    this.boxesG.selectAll("rect").data(yboxes).enter()
      .append("rect")
      .attr("class","privacy-bar-contour")
      .attr("x","0")
      .attr("y",d=>d)
      .attr("rx",5)
      .attr("ry",5)
      .attr("width",this.width)
      .attr("height",boxSize)
      .attr("fill","none")
      .attr("stroke","white")
      .attr("stroke-width", this.strokeWidth+'px')

    this.g.append("text")
      .attr("x",+this.width)
      .attr("y",-16)
      .attr("height",20)
      .attr("text-anchor","end")
      .attr("fill","darkgrey")
      .attr("id","privacy-bar-title")
      .attr("class",this.elementClass)
      .attr(this.i18n.keyAttr,"privacy-bar-title")
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

    this.elements = d3.selectAll("."+this.elementClass)
    this.update(1, transitionDuration)
  }

  /** update() updates the PrivacyBar with a new score */
  update(privacyMeasure, transitionDuration=500){
    this.privacyStatus = privacyMeasure
    let transition = d3.transition().duration(transitionDuration).ease(function(t){return d3.easeBackOut(t,0.8)})
    this.bar.transition(transition)
      .attr("fill",this.colorScale(privacyMeasure))
      .attr("y",this.scale(privacyMeasure))
      .attr("height",this.height - this.scale(this.privacyStatus))
  
    this.elements.transition(200).attr("opacity",1)
    // show score value
    if(this.showScoreValue){
      this.scoreG
        .transition(transition)//d3.easeBackOut)//d3.easeExpInOut)//d3.easeCubicIn)
        .attr("transform","translate(0,"+Math.max(this.scale(privacyMeasure),4)+")")
      this.scorePolygon.transition(transition)
        .attr("fill",this.colorScale(privacyMeasure))
      this.text.html((100*privacyMeasure).toFixed(0)+"%")
    }
  }

  /** await() puts the PrivacyBar in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */
  await(kgpPromise, request, previousResponse){
    this.elements.transition(200).attr("opacity",0.5)
    kgpPromise.then(kgpSuccess=>{
      this.update(kgpSuccess.result.privacy_metric)
    }).catch(kgpr=>{
      if(kgpr.status=="error"){
        if(kgpr.code==4){
          this.elements.transition(200).attr("opacity",1)
        }
      }
    })
  }
}