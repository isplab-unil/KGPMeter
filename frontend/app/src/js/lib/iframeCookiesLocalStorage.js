import {cookie as vanillaCookie} from "./cookies.js"

// ============== downstream cookie functions ==============

function cookieSetItem(name, value, durationMsec) {
  if(window.parent==window){
    vanillaCookie.setItem(name, value, durationMsec)
  }else{
    let data = {"type": "cookie.setItem", name, value, durationMsec}
    window.parent.postMessage(data, "*")
  }
}

/** set a cookie in the parent frame (or the page itself if no parent), the cookie is passed as arg to the callback and to the Promise resolve */
async function cookieGetItem(name, callback=()=>{}) {
  // not in an iframe: straightforward
  if(window.parent==window){
    let result = vanillaCookie.getItem(name)
    callback(result)
    return Promise.resolve(result)
  //in an iframe..
  }else{
    let id = (+new Date())+"-"+Math.random()
    let data = {"type": "cookie.getItem", id, name}
    let el
    let promise = new Promise((resolve, reject)=>{
      el = function readCookieActionListener(e){
        if(e.data.type && e.data.type=="cookie.getItem.result" && e.data.id==id){
          resolve(e.data.result)
          callback(e.data.result)
          window.removeEventListener('message', el, false)
        }
      }
      window.addEventListener('message', el, false)
    }) 
    window.parent.postMessage(data, "*")
    return promise
  }
  
}

export const cookie = {
  setItem: cookieSetItem,
  getItem: cookieGetItem
}

// ============== upstream cookie event listener ============== 

export class IframeCookieActionListener{
  constructor(iframe, prefix=""){
    this.prefix = prefix
    this.iframe = iframe
    let self = this
    // put here because of this/self problematic
    this.listener = function listener(e){
      if( e.source==self.iframe.contentWindow &&  e.data.type){
        if(e.data.type.startsWith("cookie")){
        }
        switch(e.data.type){
          case "cookie.setItem":
            vanillaCookie.setItem(self.prefix+e.data.name, e.data.value, e.data.durationMsec)
            break
          case "cookie.getItem":
            let result = vanillaCookie.getItem(self.prefix+e.data.name)
            let data = {"type": "cookie.getItem.result", "id": e.data.id, "name": e.data.name, "result":result}
            self.iframe.contentWindow.postMessage(data, "*")
            break
          case "cookie.erase":
            vanillaCookie.erase(self.prefix+"."+e.data.name)
            break
        }
      }
    }
    window.addEventListener('message', this.listener, false)
  }
}

// ============== localStorage with expires ==============


function localStorageSetItemWithExpires(name, value, durationMsec, timestampSuffix=".expires") {
  localStorage.setItem(name, value)
  if(durationMsec){
    let date = new Date()
    date.setTime(date.getTime() + durationMsec)
    localStorage.setItem(name+timestampSuffix, date.toGMTString())
  }
}
function localStorageGetItemWithExpires(name, timestampSuffix=".expires"){
  let value = localStorage.getItem(name)
  let expirationDate = new Date(localStorage.getItem(name+timestampSuffix))
  console.log("exp LS getItem expirationDate: "+ (+expirationDate)+", value: ", value)
  if(expirationDate){
    let date = +new Date()
    console.log("exp LS getItem expirationDate: "+ (+expirationDate)+", date: ", date, ", date<=+expirationDate=",date<= +expirationDate)
    if(date<= +expirationDate){
      return value
    }else{
      localStorageRemoveItemWithExpires(name)
      return null
    }
  }
  else{
    return value
  }
}
function localStorageRemoveItemWithExpires(name, timestampSuffix=".expires") {
  localStorage.removeItem(name)
  localStorage.removeItem(name+timestampSuffix)
}

export const expiringLocalStorage = {
  setItem: localStorageSetItemWithExpires,
  getItem: localStorageGetItemWithExpires,
  removeItem: localStorageRemoveItemWithExpires
}

// ============== downstream LocalStorage functions ==============

function setItem(name, value, durationMsec, timestampSuffix=".expires") {
  if(window.parent==window){
    expiringLocalStorage.setItem(name, value, durationMsec, timestampSuffix)
  }else{
    let data = {"type": "iframeLocalStorage.setItem", name, value, durationMsec, timestampSuffix}
    window.parent.postMessage(data, "*")
  }
}


/** gets an item from localstorage in the parent frame, the cookie is passed as arg to the callback and to the Promise resolve */
async function getItem(name, timestampSuffix=".expires") {
  // not in an iframe: straightforward
  if(window.parent==window){
    let result = expiringLocalStorage.getItem(name, timestampSuffix)
    return Promise.resolve(result)
  //in an iframe..
  }else{
    let id = (+new Date())+"-"+Math.random()
    let data = {"type": "iframeLocalStorage.getItem", id, name, timestampSuffix}
    let el
    let promise = new Promise((resolve, reject)=>{
      el = function iframeLocalStorageGetItemActionListener(e){
        if(e.data.type && e.data.type=="iframeLocalStorage.getItem.result" && e.data.id==id){
          resolve(e.data.result)
          window.removeEventListener('message', el, false)
        }
      }
      window.addEventListener('message', el, false)
    }) 
    window.parent.postMessage(data, "*")
    return promise
  }
  
}

export const iframeLocalStorage = {
  setItem,
  getItem,
}

// ============== upstream LocalStorage event listener ============== 

export class IframeLocalStorageActionListener{
  constructor(iframe, prefix=""){
    this.iframe = iframe
    this.prefix = prefix
    let self = this
    // put here because of this/self problematic
    this.listener = function listener(e){
      if( e.source==self.iframe.contentWindow &&  e.data.type){
        if(e.data.type.startsWith("iframeLocalStorage")){
        }
        switch(e.data.type){
          case "iframeLocalStorage.setItem":
            expiringLocalStorage.setItem(self.prefix+e.data.name, e.data.value, e.data.durationMsec, e.data.timestampSuffix)
            break
          case "iframeLocalStorage.getItem":
            let result = expiringLocalStorage.getItem(self.prefix+e.data.name, e.data.timestampSuffix)
            let data = {"type": "iframeLocalStorage.getItem.result", "id": e.data.id, "name": e.data.name, "result":result}
            self.iframe.contentWindow.postMessage(data, "*")
            break
        }
      }
    }
    window.addEventListener('message', this.listener, false)
  }
}