export class KgpTutorialButton{
  constructor(domId, kgp, listeners = {}){
    this.domId = domId
    this.kgp = kgp
    this.listeners = listeners
    this.init()
  }
  init(){
    d3.select("#"+this.domId).remove()
    // trash button
    this.tutoButton = this.kgp.addSvgButton("\uf059",this.domId,"hint-tuto",0,57, 22, 0, 60)
    this.tutoButton
    let self = this
    Object.keys(this.listeners).forEach(k=>self.tutoButton.on(k, self.listeners[k]))
  }

  on(event, listener){
    this.listeners[event] = listener
    this.tutoButton.on(event, listener)
  }
  remove(){
    this.tutoButton.remove()
  }
}

export function kgpTutorial(i18n, video_url_prefix = "./tuto/"){
  $('#tuto-modal').modal()

  //intro1: 'Construisez votre arbre de famille: <img class="tutorial-img" src="../img/tool/tuto1_build.png">'
  //intro2: 'Indiquez qui est séquencé dans votre famille: <img class="tutorial-img" src="../img/tool/tuto2_sequence.png">'
  //intro3: 'Observez votre score: <video controls="false" autoplay width="365px" height="348px" name="Video Name" src="../img/tool/tuto3_score.mov"></video>'+'<script type="javascript">var vids = $("video");$.each(vids, function(){this.controls = false;});</script>'

  let tutoStep=0
  const nbTutoSteps = 4
  let prevKey = "previous-button"
  let nextKey = "next-button"
  let closeKey = "close-button"

  let leftButton = document.getElementById("tuto-left-button")
  leftButton.setAttribute(i18n.keyAttr,prevKey)
  leftButton.addEventListener("click",previousTutoStep)
  let rightButton = document.getElementById("tuto-right-button")
  // puce events
  for(let i in d3.range(nbTutoSteps)){
    d3.select("#tuto-puce"+i).on("click",function(d){
      tutoStep=i
      loadTutoStep()
    })
  }

  function previousTutoStep(){
    tutoStep--
    loadTutoStep()
  }
  function nextTutoStep(){
    tutoStep++
    loadTutoStep()
  }
  function hideModal(){
    $('#tuto-modal').modal('hide')
    cloneReplaceElement(rightButton)
    cloneReplaceElement(leftButton)
  }
  function cloneReplaceElement(el){
    let elClone = el.cloneNode(true);
    el.parentNode.replaceChild(elClone, el);
    return elClone
  }

  function loadTutoStep(){
    $("#tuto-title").attr(i18n.keyAttr,"tuto-title-"+tutoStep)
    $("#tuto-text").attr(i18n.keyAttr,"tuto-text-"+tutoStep)
    let video_lng = i18n.lng=="fr"?  i18n.lng : "en" // video only in french or english
    $("#tuto-video").attr("src", video_url_prefix+"tuto_"+video_lng+"_"+tutoStep+".mp4")
    $("#tuto-video").currentTime=0
    d3.selectAll(".tuto-puce").transition(500).attr("fill","#f0f0f0")
    d3.select("#tuto-puce"+tutoStep).transition(500).attr("fill","grey")

    // left-hand button
    if(tutoStep==0){
      leftButton.classList.add("disabled")
    }
    else{
      leftButton.classList.remove("disabled")
    }

    // right-hand button
    if(tutoStep>=(nbTutoSteps-1)){
      rightButton = cloneReplaceElement(rightButton)
      rightButton.setAttribute(i18n.keyAttr,closeKey)
      rightButton.addEventListener("click",hideModal)
    }
    else{
      rightButton = cloneReplaceElement(rightButton)
      rightButton.setAttribute(i18n.keyAttr,nextKey)
      rightButton.addEventListener("click",nextTutoStep)
    }
  }

  loadTutoStep()

  // text formatters: add buttons svgs in text 
  function tuto0formatter(text,data){
    text = text.replace("{#add}",    "<svg style='position:relative;top:6px;' height='24px' width='24px'><g transform='translate(12,12)'><circle r='12' class='node-button-circle'></circle><text class='fas node-button-fas' x='-6px' y='5px' style='font-size:12px'>&#xf234;</text></g></svg>")
    text = text.replace("{#remove}", "<svg style='position:relative;top:6px;' height='24px' width='24px'><g transform='translate(12,12)'><circle r='12' class='node-button-circle'></circle><text class='fas node-button-fas' x='-7px' y='5px' style='font-size:12px'>&#xf506;</text></g></svg>")
    return text
  }
  i18n.dynamic["tuto-text-0"] = tuto0formatter

  function tuto1formatter(text,data){
    text = text.replace("{#sequence}",   "<svg style='position:relative;top:6px;' height='24px' width='24px'><g transform='translate(12,12)'><circle r='12' class='node-button-circle'></circle><text class='fas node-button-fas' x='-7px' y='5px' style='font-size:12px'>&#xf471;+</text></g></svg>")
    text = text.replace("{#unsequence}", "<svg style='position:relative;top:6px;' height='24px' width='24px'><g transform='translate(12,12)'><circle r='12' class='node-button-circle'></circle><text class='fas node-button-fas' x='-7px' y='5px' style='font-size:12px'>&#xf471;-</text></g></svg>")
    return text
  }
  i18n.dynamic["tuto-text-1"] = tuto1formatter

  function tuto2formatter(text,data){
    text = text.replace("{#target}",   "<svg style='position:relative;top:6px;' height='24px' width='24px'><g transform='translate(12,12)'><circle r='12' class='node-button-circle'></circle><text class='fas node-button-fas' x='-6px' y='5px' style='font-size:12px'>&#xf05b;</text></g></svg>")
    return text
  }
  i18n.dynamic["tuto-text-2"] = tuto2formatter

  function tuto3formatter(text,data){
    text = text.replace("{#sex}",   "<svg style='position:relative;top:6px;' height='24px' width='24px'><g transform='translate(12,12)'><circle r='12' class='node-button-circle'></circle><text class='fas node-button-fas' x='-6px' y='5px' style='font-size:12px'>&#xf228;</text></g></svg>")
    return text
  }
  i18n.dynamic["tuto-text-3"] = tuto3formatter
}
