import {kgpSetLanguageEvent, kgpSetSourceEvent, kgpSetIframeMaxDimensionEvent} from "../../../app/src/js/KgpIframeInterface.js"


class KgpMeter{
  constructor(divId, apiUrl, lng, maxHeight){
    this.divId = divId
    this.apiUrl = apiUrl
    this.lng = lng
    this.height = 0
    let self = this

    this.div = document.getElementById(divId)
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
        this.setMaxheight(maxHeight)
      }, 50);
    })

    // ======== handle height updates ========
    function handleHeightUpdate(e) {
      self.setHeight(e.detail.height, e.detail.transitionDuration)
    }
    window.document.addEventListener('KgpSetHeightEvent', handleHeightUpdate, false)
  }

  setLanguage(lng){
    let setLanguageEvent = kgpSetLanguageEvent(lng)
    this.iframe.contentDocument.dispatchEvent(setLanguageEvent)
  }
  setSource(source){
    let setSourceEvent = kgpSetSourceEvent(source)
    this.iframe.contentDocument.dispatchEvent(setSourceEvent)
  }
  setMaxheight(maxHeight){
    let setIframeMaxDimensionEvent = kgpSetIframeMaxDimensionEvent(maxHeight)
    this.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent)
  }

  setHeight(height, transitionDuration){
    transitionDuration = transitionDuration * (height>this.height? 0.9:2) / 1000
    this.setDivStyle(this.height+"px", height+"px", transitionDuration)
    this.height = height
  }
  setDivStyle(oldHeightstr, heightStr, transitionDuration){
    let divStyle = 'border:none; width:100%; height: '+oldHeightstr+'; transition-property: height; transition-duration: '+transitionDuration+'s; transition-timing-function: easeInOutQuart;'
    this.div.setAttribute("style",divStyle)
    divStyle = 'border:none; width:100%; height: '+heightStr+'; transition-property: height; transition-duration: '+transitionDuration+'s; transition-timing-function: easeInOutQuart;'
    this.div.setAttribute("style",divStyle)
  }
}
// export KgpMeter to glboal namespace
window.KgpMeter = KgpMeter
    