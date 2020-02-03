import {kgpSetLanguageEvent, kgpSetSourceEvent, kgpSetIframeMaxDimensionEvent} from "../../../app/src/js/KgpIframeInterface.js"


class KgpMeter{
  constructor(divId, apiUrl, lng, maxHeight){
    this.divId = divId
    this.apiUrl = apiUrl
    this.lng = lng
    let self = this

    this.div = document.getElementById(divId)
    this.div.innerHTML = "<iframe src='{src}/app/'></iframe>".replace("{src}",this.apiUrl)
    this.iframe = this.div.getElementsByTagName("iframe")[0]
    this.iframe.setAttribute("style",'border:none; width:100%; height:100%;')


    // ======== send data to iframe ========
    this.iframe.contentWindow.addEventListener("load",()=>{
      setTimeout(() => {
        console.log("self.iframe.contentWindow LOADED!!")
        // set language
        this.setLanguage(self.lng)
        // set source
        this.setSource(document.URL)
        // set max height
        this.setMaxheight(maxHeight)
        console.log("KgpMeter: downwards events sent")
      }, 50);
    })
    // =================================== TEST iframe to parent communication and vice-versa ===================================
    console.log("huhuhaha")
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
}
// export KgpMeter to glboal namespace
window.KgpMeter = KgpMeter
    