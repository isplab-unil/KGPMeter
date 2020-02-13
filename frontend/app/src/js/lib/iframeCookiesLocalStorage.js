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

function readCookie(name, callback=()=>{}) {
  if(window.parent==window){
    callback(vanillaCookie.read(name))
  }else{
    let id = (+new Date())+"-"+Math.random()
    let data = {"type": "cookie.read", "id": id, "name":name}
    readCookieCalls[id] = callback
    window.parent.postMessage(data, "*")
  }
}
//to put it into action in a parent window: window.addEventListener('message', cookie.readActionListener, false)
let readCookieCalls = {}
function readCookieActionListener(e){
  console.log("readCookieActionListener() e:", e)
  if(e.data.type && e.data.type=="cookie.read.result" && e.data.id){
      readCookieCalls[e.data.id](e.data.result)
      delete readCookieCalls[e.data.id]
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
  readActionListener: readCookieActionListener,
  erase: eraseCookie,
}

// ============== upstream cookie event listener ============== 

export class CookieActionListener{
  constructor(iframe){
    this.iframe = iframe
    let self = this
    // put here because of this/self problematic
    this.listener = function listener(e){
      if( e.source==self.iframe.contentWindow &&  e.data.type){
        if(e.data.type.startsWith("cookie")){
          //console.log("CookieActionListener.listener() e.source==this.iframe.contentWindow: ", e.source==self.iframe.contentWindow, ", e:", e)
          console.log("CookieActionListener.listener() e.data.type: ",e.data.type,", e.data.name: ",e.data.name)
          console.log("CookieActionListener.listener() e.data.name: ",e.data.name, " e.data.value: ",e.data.value, " e.data.days: ",e.data.days)
        }
        switch(e.data.type){
          case "cookie.create":
            
            vanillaCookie.create(e.data.name, e.data.value, e.data.days)
            break
          case "cookie.read":
            let result = vanillaCookie.read(e.data.name)
            let data = {"type": "cookie.read.result", "id": e.data.id, "result":result}
            self.iframe.contentWindow.postMessage(data, "*")
            break
          case "cookie.erase":
            vanillaCookie.erase(e.data.name)
            break
        }
      }
    }
    window.addEventListener('message', this.listener, false)
  }
}

// ============== downstream LocalStorage functions ==============
/*

function setItem(name, value) {
  let data = {"type": "LocalStorage.setItem", "name":name, "value":value}
  window.parent.postMessage(data, "*")
}

function getItem(name) {
  let data = {"type": "LocalStorage.getItem", "name":name}
  window.parent.postMessage(data, "*")
}

export let IframeLocalStorage = {
  setItem: setItem,
  getItem: getItem
}

// ============== upstream LocalStorage event listener ============== 

//to put it into action in a parent window: window.addEventListener('message', LocalStorageActionListener, false)
export function LocalStorageActionListener(e){
  if(e.data.type){
    switch(e.data.type){
      case "LocalStorage.setItem":
        LocalStorage.setItem(e.data.name, e.data.value)
        break
      case "LocalStorage.getItem":
        LocalStorage.getItem(e.data.name)
        break
    }
  }
}*/