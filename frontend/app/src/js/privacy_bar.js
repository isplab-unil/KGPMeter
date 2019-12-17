"use strict";


let privacyBar
let privacyWordedScore
let privacyBackendStatus
let privacyScoreNumberExplainer
let kgpMeterScoreRequestHandler

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




class PrivacyWordedScore{
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

    this.i18n.dynamic[self.i18nKey] = this.i18nFormat
    this.hide(0)
  }

  hide(transitionDuration=3000){
    this.text.transition(transitionDuration).attr("opacity",0)
  }

  /** update() updates the PrivacyWordedScore with a new score */
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

  /** await() puts the PrivacyWordedScore in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */
  await(kgpPromise, request, previousResponse){
    if(this.text.attr("opacity")==1){
      this.text.transition(200).attr("opacity",0.5)
    }

    kgpPromise.then(kgpSuccess=>{
      this.update(kgpSuccess.result.privacy_metric)
    },()=>{})
  }

  async i18nFormat(text, data){
    let qualifier = await i18n.t("privacy-bar-score-"+data)
    return text.replace("{}", qualifier? qualifier : "...")
  }
}


class KgpMeterScoreRequestHandler{
  constructor(api_endpoint){
    this.api_endpoint = api_endpoint
    this.lastRequest = {}
    // necessary dummy
    this.latestResponse = new KgpMeterScoreSuccess(-1, {}, "", 1.0001, 0, 0, 0)
    this.listeners = []
  }

  /** Adds a listener to requests, returns true if not already in array*/
  addListener(listener){
    if(!this.listeners.includes(listener)){
      this.listeners.push(listener)
      return true;
    }
    return false;
  }
  /** remove a listener to requests, returns removed listener */
  removeListener(listener){
    let index = this.listeners.indexOf(listener)
    if(index!=-1){
      return this.listeners.splice(index,1)
    }
    return [];
  }

  requestScore(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng, silent=false){
    let self = this
    let currentRequest = new KgpMeterScoreRequest(
      target_id,
      familyTreeEdges, familyTreeSequencedRelatives,
      user_id, user_source, lng
    )
    let previousResponse = this.latestResponse
    this.lastRequest = currentRequest

    let kgpPromise = fetch(self.api_endpoint, {
      method: 'POST',
      body: JSON.stringify(currentRequest)
    })
    .then(resp=>resp.json())
    // handle connexion error
    .catch( () => Promise.reject(new KgpMeterScoreError(currentRequest.timestamp_js, currentRequest, null, 5, {"message":'Erreur de connexion au serveur.'})))
    // parse response
    .then(json=>{
      let kgpr = KgpMeterScoreResponse.parse(json, currentRequest)
      // check if it's stale or not
      if(kgpr.timestamp_js!=self.lastRequest.timestamp_js){
        return Promise.reject(new KgpMeterScoreStale(kgpr))
      }
      // if it's an error -> reject
      if(kgpr.status=="error"){
        return Promise.reject(kgpr)
      }
      // success!
      self.latestResponse = kgpr
      return kgpr
    })

    if(!silent){
      this.listeners.forEach(l => l(kgpPromise, currentRequest, previousResponse))
    }

    return kgpPromise
  }
}

class KgpMeterScoreResponse{
  constructor(status, timestamp_js, request, tree_signature, extras=null){
    this.status = status
    this.timestamp_js = timestamp_js
    this.request = request
    this.tree_signature = tree_signature
    this.extras = extras
  }
  static parseJSON(json, request){
    return KgpMeterScoreResponse.parse(JSON.parse(json), request)
  }
  static parse(raw, request){
    if(raw.status=="OK"){
      return new KgpMeterScoreSuccess(
        raw.timestamp_js,
        request,
        raw.tree_signature,
        raw.result.privacy_metric,
        raw.result.cached,
        raw.result.execution_time,
        raw.extras,
      )
    }
    else if(raw.status=="error"){
      return new KgpMeterScoreError(
        raw.timestamp_js,
        request,
        raw.tree_signature,
        raw.code,
        raw.extras,
      )
    }
    else{
      throw new Error({"msg":"KgpMeterScoreResponse.parse(): argument raw is not a parsable KgpMeterScoreResponse.", "raw":raw})
    }
  }
}
class KgpMeterScoreSuccess extends KgpMeterScoreResponse{
  constructor(timestamp_js, request, tree_signature, privacy_metric, cached, execution_time, extras=null){
    super("OK", timestamp_js, request, tree_signature, extras)
    this.result = {
      "privacy_metric": privacy_metric,
      "cached": cached,
      "execution_time": execution_time
    }
    this.request = {} // empty on initialisation, must be set later on
  }
}
class KgpMeterScoreError extends KgpMeterScoreResponse{
  constructor(timestamp_js, request, tree_signature, code, extras=null){
    super("error", timestamp_js, request, tree_signature, extras)
    this.code = code
  }
}
class KgpMeterScoreStale extends KgpMeterScoreResponse{
  constructor(kgpResp){
    super("stale", kgpResp.timestamp_js, kgpResp.request, kgpResp.tree_signature, kgpResp.extras)
    this.resp = kgpResp
  }
}


/** temporary solution for small things to do on KGP score request() */
let kgpMeterScoreUpdateCallbacks = {
  start:[],
  end:[],
  error:[]
}
function otherThingsToDoOnKgpMeterScoreResponse(kgpPromise, request, previousResponse){
  // for tutorial videos, comment this following line (glitches in video):
  kgpMeterScoreUpdateCallbacks.start.forEach(f => f(kgpPromise, request, previousResponse))
  $("body").css({'cursor':'progress'})
  return kgpPromise.then(kgpSuccess=>{
    // success
    $("body").css({'cursor':'auto'})
    kgpMeterScoreUpdateCallbacks.end.forEach(f => f(kgpPromise, request, previousResponse))
    //console.log("kgp score success: ", kgpSuccess)
  }).catch(kgpError=>{
    $("body").css({'cursor':'auto'})
    kgpMeterScoreUpdateCallbacks.error.forEach(f => f(kgpPromise, request, previousResponse))
    //console.log("kgp score error: ", kgpError)
  })
}

/** Creates the request that'll be sent to the KgpMeter server, with instant timestamp */
class KgpMeterScoreRequest{
  constructor(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng){
    let timestamp_js = +new Date()
    //let family_tree_edges = ftree.getLinksAsIds()
    // building list of sequenced relatives
    //let sequenced_relatives_ids = ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id)
    this.timestamp_js = timestamp_js
    this.family_tree = {
      "edges":familyTreeEdges,
      "sequenced_relatives":familyTreeSequencedRelatives,
      "target":target_id
    }
    this.user = {
      "id": user_id,
      "source": user_source,
      "lng":lng
    }
  }
}

// -------------------- Messages display --------------------

class PrivacyBackendStatus{
  constructor(parentId, i18n){
    this.parentId = parentId
    this.i18n = i18n

    this.init()
  }

  init(){
    document.getElementById(this.parentId).innerHTML = ' \
    <div class="alert" style="display:none"><div class="kgp-alert-content"></div></div> '
    /*
    <div class="alert alert-success" style="display:none" id="response-success"><div class="alert-content" data-i18n="response-success"></div></div>
    <div class="alert alert-info" style="display:none" id="response-info"><div class="alert-content"></div></div>
    <div class="alert alert-warning" style="display:none" id="response-warning"><div class="alert-content"></div></div>
    <div class="alert alert-danger" style="display:none" id="response-danger"><div class="alert-content"></div></div>
    '*/
    this.element = $("#"+this.parentId+" .alert")
    this.content = $("#"+this.parentId+" .kgp-alert-content")
    this.i18n.dynamic["response-success"] = this.i18nFormatSuccessMessage
  }

  /** await() puts the PrivacyBackendStatus in a waiting state and updates it properly once the promise has fulfilled */
  await(kgpPromise, request, previousResponse){
    let self = this
    this.displayOngoing()
    return kgpPromise.then(kgpSuccess=>{
      // success
      let same_signature = previousResponse.tree_signature == kgpSuccess.tree_signature
      self.displaySuccess(
        kgpSuccess.result.privacy_metric,
        kgpSuccess.result.execution_time,
        kgpSuccess.result.cached,
        same_signature
      )  
    }).catch(kgpError=>{
      if(kgpError.status=="error"){
        // error code 2
        if(kgpError.code==2){
          self.displayDanger("response-error-"+kgpError.code)
          self.i18n.data("response-error-2",[kgpError.extras.error_identifier])
        }
        // error code 4
        else if(kgpError.code==4){
          self.displayInfo("response-error-4",100000)
        }
        // error code 5
        else if(kgpError.code==5){
          self.displayDanger("response-error-5")
        }
        // other error codes
        else{
          self.displayWarning("response-error-"+kgpError.code)
        }
      }
    })
  }


  hide(){
    // Hide the previous alert + explainer
    this.content.attr(this.i18n.dataAttr,null)
    this.element.stop(true).hide().removeClass("alert-success alert-info alert-warning alert-danger")
  }

  /** Display the result message from the server */
  displayMessage(type, messageKey, timeout){
    this.hide()
    this.element.addClass("alert-"+type)
    this.content.attr(i18n.keyAttr,messageKey)
    this.element.stop(true).slideDown(500).fadeTo(timeout, 500).slideUp(500)
  }

  displayOngoing(){
    this.hide()
    this.element.addClass("alert-warning")
    this.content.attr(this.i18n.keyAttr,"response-ongoing")
    this.element.slideDown(500);
  }

  displayWarning(messageKey, timeout=5000){
    this.displayMessage("warning", messageKey, timeout);
  }
  
  displayInfo(messageKey, timeout=5000){
    this.displayMessage("info", messageKey, timeout);
  }

  displayDanger(errorKey, timeout=5000){
    this.displayMessage("danger", errorKey, timeout)
}


  displaySuccess(score, time, cached, similar, timeout=5000){
    this.hide()
    this.element.addClass("alert-success")
    this.content.attr(i18n.keyAttr,"response-success")
    this.i18n.data("response-success",{
      time:time.toFixed(2),
      cached:cached,
      similar:similar
    })
    this.element.stop(true).slideDown(500).fadeTo(timeout, 500).slideUp(500)
  }

  /** success formatter function for i18n */
  i18nFormatSuccessMessage(text, data){
    //"Réponse calculée en {#1} secondes{#2 (en cache)}.{#3 Le score est inchangé, <a href='../faq#change' target='_blank'>en savoir plus</a>.}",
    text = text.replace("{#1}",data.time)
    text = text.replace(/{#2(.+?)}/,data.cached? "$1":"")
    text = text.replace(/{#3(.+?)}/,data.similar? "$1":"")
    return text
  }
}

// -------------------- Explainer --------------------

class PrivacyScoreNumberExplainer{
  constructor(parentId, i18n, i18nKey){
    this.parentId = parentId
    this.i18n = i18n
    this.i18nKey = i18nKey
    this.parent = $("#"+this.parentId)

    this.init()
  }

  init(){
    this.parent.hide().html(
    '<div class="alert alert-info text-justified"> \
      <i class="far fa-lightbulb"></i> \
      <span class="kgp-explainer-text"></span> \
    </div>')
    this.text = $("#"+this.parentId+" .kgp-explainer-text").attr(this.i18n.keyAttr,this.i18nKey)

    this.i18n.dynamic[this.i18nKey] = this.i18nFormat
  }

  hide(){
    this.parent.stop(true).slideUp(500)
  }

  update(privacyMeasure, transitionDuration=500){
    if(this.parent.is(':hidden')){
      this.parent.stop(true).slideDown(transitionDuration)
    }
    this.i18n.data(this.i18nKey,{privacy_metric:privacyMeasure})
    $("#"+this.parentId+" .alert").stop(true).slideDown(transitionDuration)//.fadeTo(5000, 500).slideUp(500)
  }

  /** await() puts the PrivacyWordedScore in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */
  await(kgpPromise, request, previousResponse){
    kgpPromise.then(kgpSuccess=>{
      this.update(kgpSuccess.result.privacy_metric)
    },()=>{})
  }

  i18nFormat(text, data){
    //"{#1}% de l’information génomique de la cible peut-être déduite. Son score de confidentialité est donc de {#2}%.",
    let score = Math.round(100*data.privacy_metric)
    text = text.replace("{#1}",100-score)
    text = text.replace(/{#2(.+?)?}/,score)
    return text
  }
}


