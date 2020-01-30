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
      let setLanguageEvent = new KgpSetLanguageEvent(language)
      self.iframe.contentDocument.dispatchEvent(setLanguageEvent)
      // set source
      let setSourceEvent = new KgpSetSourceEvent(document.URL)
      self.iframe.contentDocument.dispatchEvent(setSourceEvent)
      // set max height
      let setIframeMaxDimensionEvent = new KgpSetIframeMaxDimensionEvent(max_height)
      self.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent)
    }

  }
  
}

/** abstract mother class for all other Kgp iframe events */
export class KgpIframeEvent extends Event{
  constructor(...args){
    super(...args)
  }
}

/******** down events ********/

export class KgpSetSourceEvent extends KgpIframeEvent{
  constructor(source){
    super("KgpSetSourceEvent")
    this.source=source
  }
}

export class KgpSetLanguageEvent extends KgpIframeEvent{
  constructor(lng){
    super("KgpSetLanguageEvent")
    this.lng=lng
  }
}

/** Event from kgpmeter to kgp-iframe to signale iframe max dimensions */
export class KgpSetIframeMaxDimensionEvent extends KgpIframeEvent{
  constructor(maxHeight){
    super("KgpSetIframeMaxDimensionEvent")
    console.log("maxHeight", maxHeight, "maxWidth", maxWidth)
    this.maxHeight=maxHeight
  }
}


/******** up events ********/

/** Event from kgp-iframe to kgpmeter to change height */
export class KgpSetHeightEvent extends KgpIframeEvent{
  constructor(height){
    super("KgpSetHeightEvent")
    this.height=height
  }
}