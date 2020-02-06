import {kgpSetLanguageEvent, kgpSetSourceEvent, kgpSetIframeMaxDimensionEvent, kgpLaunchTutorialEvent} from "../../../app/src/js/KgpIframeInterface.js"
import { KinGenomicPrivacyMeter } from "../../../app/src/js/KinGenomicPrivacyMeter.js"


class KgpMeter{
  constructor(divId, apiUrl, lng, maxHeight){
    this.divId = divId
    this.div = document.getElementById(divId)

    this.apiUrl = apiUrl? apiUrl : this.div.getAttribute("data-api-url")
    if(!this.apiUrl){
      throw "KgpMeter error: no apiUrl. API url provided: "+apiUrl
    }
    this.lng = lng? lng : this.div.getAttribute("data-lng")
    this.lng = lng? lng : "en" // default
    this.maxHeight = maxHeight? maxHeight : this.div.getAttribute("data-max-height")
    this.maxHeight = maxHeight? maxHeight : 2000 // default
    this.height = 0
    let self = this

    this.div.innerHTML = "<iframe src='{src}/app/'></iframe>".replace("{src}",this.apiUrl)
    this.iframe = this.div.getElementsByTagName("iframe")[0]
    this.iframe.setAttribute("style",'border:none; width:100%; height:100%')
    this.setDivStyle(this.div.scrollHeight+"px")

    // ======== send data to iframe ========
    this.iframe.contentWindow.addEventListener("load",()=>{
      setTimeout(() => {
        // set language
        this.setLanguage(self.lng)
        // set source
        this.setSource(document.URL)
        // set max height
        this.setMaxheight(self.maxHeight)
      }, 50);
    })

    // ======== handle height updates ========
    function handleHeightUpdate(e) {
      self.setHeight(e.detail.height, e.detail.transitionDuration)
    }
    window.document.addEventListener('KgpSetHeightEvent', handleHeightUpdate, false)
  }

  setLanguage(lng){
    this.lng = lng
    let setLanguageEvent = kgpSetLanguageEvent(lng)
    this.iframe.contentDocument.dispatchEvent(setLanguageEvent)
  }
  setSource(source){
    let setSourceEvent = kgpSetSourceEvent(source)
    this.iframe.contentDocument.dispatchEvent(setSourceEvent)
  }
  setMaxheight(maxHeight){
    this.maxHeight = maxHeight
    let setIframeMaxDimensionEvent = kgpSetIframeMaxDimensionEvent(maxHeight)
    this.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent)
  }
  launchTutorial(){
    this.iframe.contentDocument.dispatchEvent(kgpLaunchTutorialEvent())
  }

  setHeight(height, transitionDuration){
    transitionDuration = transitionDuration * (height>this.height? 0.9:2) / 1000
    this.setDivStyle(this.height+"px", height+"px", transitionDuration)
    this.height = height
  }
  setDivStyle(oldHeightstr, heightStr, transitionDuration){
    let divStyle = 'border:none; width:100%; height: '+oldHeightstr+'; transition-property: height; transition-duration: '+transitionDuration+'s; transition-timing-function: ease;'
    this.div.setAttribute("style",divStyle)
    divStyle = 'border:none; width:100%; height: '+heightStr+'; transition-property: height; transition-duration: '+transitionDuration+'s; transition-timing-function: ease;'
    this.div.setAttribute("style",divStyle)
  }
}
// export KgpMeter to global namespace
window.KgpMeter = KgpMeter

// create default kgpmeter if div#kin-genomic-privacy-meter exists
let defaultKgpmeterDivId = "kin-genomic-privacy-meter"
let kgpmeter
if(document.getElementById(defaultKgpmeterDivId)){
  kgpmeter = new KgpMeter(defaultKgpmeterDivId, "https://santeperso.unil.ch/api-dev/app/?test")
  window.kgpmeter = kgpmeter
}
    