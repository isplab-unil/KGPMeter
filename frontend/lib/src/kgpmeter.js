import {KgpSetLanguageEvent, KgpSetSourceEvent, KgpSetIframeMaxDimensionEvent} from "../../app/src/js/KgpIframeInterface.js"


class KgpMeter{
  constructor(divId, apiUrl, lang, maxHeight){
    this.divId = divId
    this.apiUrl = apiUrl
    this.lang = lang
    let self = this

    this.div = document.getElementById(divId)
    this.div.innerHTML = "<iframe src='{src}/app/'></iframe>".replace("{src}",this.apiUrl)
    this.iframe = this.div.getElementsByTagName("iframe")[0]
    this.iframe.setAttribute("style",'border:none; width:100%; height:100%;')

    // ======== send data to iframe ========
    self.iframe.contentDocument.onload = ()=>{
      console.log("self.iframe.contentDocument LOADED!!")
      // set language
      let setLanguageEvent = new KgpSetLanguageEvent(self.lang)
      self.iframe.contentDocument.dispatchEvent(setLanguageEvent)
      // set source
      let setSourceEvent = new KgpSetSourceEvent(document.URL)
      self.iframe.contentDocument.dispatchEvent(setSourceEvent)
      // set max height
      let setIframeMaxDimensionEvent = new KgpSetIframeMaxDimensionEvent(maxHeight)
      self.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent)
    }
    // =================================== TEST iframe to parent communication and vice-versa ===================================

    // parent to iframe:
    setTimeout(() => {
      var data = { orientation: 'down' }
      var event = new CustomEvent('myCustomEvent', { detail: data })
      self.iframe.contentDocument.dispatchEvent(event)
    }, 500);

    // iframe to parent
    function handleEvent(e) {
      console.log("Communication kgp-iframe to kgpmeter success! detail:", e.detail) // outputs: {foo: 'bar'}
    }
    window.document.addEventListener('myCustomEvent', handleEvent, false)
  }
}
