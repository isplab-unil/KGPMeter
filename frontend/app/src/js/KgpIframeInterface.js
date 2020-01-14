import {cookie} from "./lib/cookies.js"
let cl = console.log

export class KgpInnerClient{
  constructor(i18n, sourceCookieName){

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
    window.document.addEventListener('KgpSetSourceEvent', setLanguage, false)
  }
}


export class KgpOuterClient{
  constructor(iframeElementid, timeoutBeforeCommunication){
    this.iframe = document.getElementById(iframeElementid)
    
    this.userSource = document.URL

    let self = this
    setTimeout(() => {
      // set source
      let setSourceEvent = new KgpSetSourceEvent(document.URL)
      self.iframe.contentDocument.dispatchEvent(setSourceEvent)
    }, timeoutBeforeCommunication);
  }
  
}

/** abstract mother class for all other Kgp iframe events */
export class KgpIframeEvent extends CustomEvent{
  constructor(...args){
    super(...args)
  }
}

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

/** Event from kgp-iframe to kgpmeter to change height */
export class KgpSetHeightEvent extends KgpIframeEvent{
  constructor(height){
    super("KgpSetHeightEvent")
    this.height=height
  }
}

/** Event from kgpmeter to kgp-iframe to signale iframe max dimensions */
export class KgpSetIframeMaxDimensionEvent extends KgpIframeEvent{
  constructor(maxHeight, maxWidth){
    super("KgpSetIframeMaxDimensionEvent")
    this.maxHeight=maxHeight
    this.maxWidth=maxWidth
  }
}