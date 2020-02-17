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

export let cookie = {
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

// ============== downstream LocalStorage functions ==============


function setItem(name, value, durationMsec, timestampSuffix=".expires") {
  if(window.parent==window){
    localStorage.setItem(name, value)
    localStorage.setItem(name+timestampSuffix, value)
  }else{
    let data = {"type": "iframeLocalStorage.setItem", name, value, durationMsec, timestampSuffix}
    window.parent.postMessage(data, "*")
  }
}


/** gets an item from localstorage in the parent frame, the cookie is passed as arg to the callback and to the Promise resolve */
async function getItem(name) {
  // not in an iframe: straightforward
  if(window.parent==window){
    let result = localStorage.getItem(name)
    return Promise.resolve(result)
  //in an iframe..
  }else{
    let id = (+new Date())+"-"+Math.random()
    let data = {"type": "iframeLocalStorage.getItem", id, name}
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

export let iframeLocalStorage = {
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
            localStorage.setItem(self.prefix+e.data.name, e.data.value)
            break
          case "iframeLocalStorage.getItem":
            let result = localStorage.getItem(self.prefix+e.data.name)
            let data = {"type": "iframeLocalStorage.getItem.result", "id": e.data.id, "name": e.data.name, "result":result}
            self.iframe.contentWindow.postMessage(data, "*")
            break
        }
      }
    }
    window.addEventListener('message', this.listener, false)
  }
}