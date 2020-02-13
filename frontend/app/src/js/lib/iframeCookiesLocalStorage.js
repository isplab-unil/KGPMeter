import {cookie as vanillaCookie} from "./cookies.js"

// ============== downstream cookie functions ==============

function createCookie(name, value, days) {
  if(window.parent==window){
    vanillaCookie.create(name, value, days)
  }else{
    let data = {"type": "cookie.create", "name":name, "value":value, "days":days}
    window.parent.postMessage(data, "*")
  }
}

/** Reads a cookie in the parent frame, the cookie is passed as arg to the callback and to the Promise resolve */
async function readCookie(name, callback=()=>{}) {
  // not in an iframe: straightforward
  if(window.parent==window){
    let result = vanillaCookie.read(name)
    callback(result)
    return new Promise((resolve, reject)=>{
      resolve(result)
    })
  //in an iframe..
  }else{
    let id = (+new Date())+"-"+Math.random()
    let data = {"type": "cookie.read", "id": id, "name":name}
    let el
    let promise = new Promise((resolve, reject)=>{
      //console.log("MY NAME SI ARCHIBALD...")
      el = function readCookieActionListener(e){
        //console.log("readCookieActionListener() e.data.result:", e.data.result)
        if(e.data.type && e.data.type=="cookie.read.result" && e.data.id==id){
          resolve(e.data.result)
          callback(e.data.result)
          window.removeEventListener('message', el, false)
          //console.log("...THE WIELDER OF PROMISES!!, e.data.name=",e.data.name+", e.data.result=",e.data.result)
        }
      }
      window.addEventListener('message', el, false)
    }) 
    window.parent.postMessage(data, "*")
    return promise
  }
  
}

function eraseCookie(name) {
  if(window.parent==window){
    callback(vanillaCookie.erase(name))
  }else{
    let data = {"type": "cookie.erase", "name":name}
    window.parent.postMessage(data, "*")
  }
}

export let cookie = {
  create: createCookie,
  read: readCookie,
  erase: eraseCookie,
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
          //console.log("CookieActionListener.listener() e.source==this.iframe.contentWindow: ", e.source==self.iframe.contentWindow, ", e:", e)
          console.log("IframeCookieActionListener.listener() e.data.type: ",e.data.type,", e.data.name: ",e.data.name)
          console.log("IframeCookieActionListener.listener() e.data.name: ",e.data.name, " e.data.value: ",e.data.value, " e.data.days: ",e.data.days)
        }
        switch(e.data.type){
          case "cookie.create":
            vanillaCookie.create(self.prefix+"."+e.data.name, e.data.value, e.data.days)
            break
          case "cookie.read":
            let result = vanillaCookie.read(self.prefix+"."+e.data.name)
            let data = {"type": "cookie.read.result", "id": e.data.id, "name": e.data.name, "result":result}
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


function setItem(name, value) {
  if(window.parent==window){
    localStorage.setItem(name, value)
  }else{
    let data = {"type": "iframeLocalStorage.setItem", "name":name, "value":value}
    window.parent.postMessage(data, "*")
  }
}


/** Reads a cookie in the parent frame, the cookie is passed as arg to the callback and to the Promise resolve */
async function getItem(name, callback=()=>{}) {
  // not in an iframe: straightforward
  if(window.parent==window){
    let result = localStorage.getItem(name)
    callback(result)
    return new Promise((resolve, reject)=>{
      resolve(result)
    })
  //in an iframe..
  }else{
    let id = (+new Date())+"-"+Math.random()
    let data = {"type": "iframeLocalStorage.getItem", "id": id, "name":name}
    let el
    let promise = new Promise((resolve, reject)=>{
      console.log("MY NAME SI ARCHIBALD...")
      el = function iframeLocalStorageGetItemActionListener(e){
        //console.log("iframeLocalStorageGetItemActionListener() e.data.result:", e.data.result)
        if(e.data.type && e.data.type=="iframeLocalStorage.getItem.result" && e.data.id==id){
          resolve(e.data.result)
          callback(e.data.result)
          window.removeEventListener('message', el, false)
          console.log("...THE WIELDER OF LS PROMISES!!, e.data.name=",e.data.name+", e.data.result=",e.data.result)
        }
      }
      window.addEventListener('message', el, false)
    }) 
    window.parent.postMessage(data, "*")
    return promise
  }
  
}

export let iframeLocalStorage = {
  setItem: setItem,
  getItem: getItem,
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
          //console.log("IframeLocalStorageActionListener.listener() e.source==this.iframe.contentWindow: ", e.source==self.iframe.contentWindow, ", e:", e)
          //console.log("IframeLocalStorageActionListener.listener() e.data.type: ",e.data.type,", e.data.name: ",e.data.name)
          //console.log("IframeLocalStorageActionListener.listener() e.data.name: ",e.data.name, " e.data.value: ",e.data.value, " e.data.days: ",e.data.days)
        }
        switch(e.data.type){
          case "iframeLocalStorage.setItem":
            localStorage.setItem(self.prefix+"."+e.data.name, e.data.value)
            break
          case "iframeLocalStorage.getItem":
            let result = localStorage.getItem(self.prefix+"."+e.data.name)
            let data = {"type": "iframeLocalStorage.getItem.result", "id": e.data.id, "name": e.data.name, "result":result}
            self.iframe.contentWindow.postMessage(data, "*")
            break
        }
      }
    }
    window.addEventListener('message', this.listener, false)
  }
}