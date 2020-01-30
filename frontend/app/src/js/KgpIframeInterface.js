import {cookie} from "./lib/cookies.js"
let cl = console.log

export class KgpInnerClient{
  constructor(i18n, sourceCookieName, kgp){

    // set language event
    function setLanguage(e){
      cl("-- KgpInnerClient setLanguage()!")
      i18n.changeLanguage(e.lng)
    }
    window.document.addEventListener('KgpSetLanguageEvent', setLanguage, false)

    // set source event
    function setSource(e){
      cl("-- KgpInnerClient setsource()!")
      let userSource = cookie.read(sourceCookieName)
      if(!userSource){
        cookie.create(sourceCookieName, e.source, 1)
      }
    }
    window.document.addEventListener('KgpSetSourceEvent', setSource, false)

    // set max dimensions event
    function setIframeMaxDimensionEvent(e){
      cl("-- KgpInnerClient setIframeMaxDimensionEvent()!")
    }
    window.document.addEventListener('KgpSetIframeMaxDimensionEvent', setIframeMaxDimensionEvent, false)
  }
}


export class KgpOuterClient{
  constructor(iframeElementid, language, max_height){
    this.iframe = document.getElementById(iframeElementid)
    this.userSource = document.URL

    let self = this
    self.iframe.contentDocument.onload = ()=>{
      console.log("self.iframe.contentDocument LOADED!!")
      // set language
      let setLanguageEvent = kgpSetLanguageEvent(language)
      self.iframe.contentDocument.dispatchEvent(setLanguageEvent)
      // set source
      let setSourceEvent = kgpSetSourceEvent(document.URL)
      self.iframe.contentDocument.dispatchEvent(setSourceEvent)
      // set max height
      let setIframeMaxDimensionEvent = kgpSetIframeMaxDimensionEvent(max_height)
      self.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent)
    }

  }
  
}

/******** down events ********/

export function kgpSetSourceEvent(source){
  return new CustomEvent("KgpSetSourceEvent", {source:source})
}


export function kgpSetLanguageEvent(source){
  return new CustomEvent("KgpSetLanguageEvent", {lng:lng})
}

/** Event from kgpmeter to kgp-iframe to signale iframe max dimensions */
export function kgpSetIframeMaxDimensionEvent(maxHeight){
  return new CustomEvent("KgpSetIframeMaxDimensionEvent", {maxHeight:maxHeight})
}


/******** up events ********/

/** Event from kgp-iframe to kgpmeter to change height */
export function kgpSetHeightEvent(height){
  return new CustomEvent("KgpSetHeightEvent", {height:height})
}