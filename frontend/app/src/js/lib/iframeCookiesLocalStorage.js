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
    readCookieCallbacks[id] = callback
    window.parent.postMessage(data, "*")
  }
}
//to put it into action in a parent window: window.addEventListener('message', cookie.readActionListener, false)
function readCookieActionListener(e){
  console.log("readCookieActionListener() e.data.result:", e.data.result)
  if(e.data.type && e.data.type=="cookie.read.result" && e.data.id){
    readCookieCallbacks[e.data.id](e.data.result)
    delete readCookieCallbacks[e.data.id]
  }
}
let readCookieCallbacks = {}

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
          console.log("CookieActionListener.listener() e.data.type: ",e.data.type,", e.data.name: ",e.data.name)
          console.log("CookieActionListener.listener() e.data.name: ",e.data.name, " e.data.value: ",e.data.value, " e.data.days: ",e.data.days)
        }
        switch(e.data.type){
          case "cookie.create":
            vanillaCookie.create(self.prefix+"."+e.data.name, e.data.value, e.data.days)
            break
          case "cookie.read":
            let result = vanillaCookie.read(self.prefix+"."+e.data.name)
            let data = {"type": "cookie.read.result", "id": e.data.id, "result":result}
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

function getItem(name, callback=()=>{}) {
  if(window.parent==window){
    callback(localStorage.getItem(name))
  }else{
    let id = (+new Date())+"-"+Math.random()
    let data = {"type": "iframeLocalStorage.getItem", "id":id, "name":name}
    iframeLocalStorageGetItemCallbacks[id] = callback
    window.parent.postMessage(data, "*")
  }
}

//to put it into action in a parent window: window.addEventListener('message', iframeLocalStorage.getItemActionListener, false)
function iframeLocalStorageGetItemActionListener(e){
  console.log("iframeLocalStorageGetItemActionListener() e.data.result:", e.data.result)
  if(e.data.type && e.data.type=="iframeLocalStorage.getItem.result" && e.data.id){
    iframeLocalStorageGetItemCallbacks[e.data.id](e.data.result)
    delete iframeLocalStorageGetItemCallbacks[e.data.id]
  }
}
let iframeLocalStorageGetItemCallbacks = {}

export let iframeLocalStorage = {
  setItem: setItem,
  getItem: getItem,
  getItemActionListener: iframeLocalStorageGetItemActionListener
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
          //console.log("LocalStorageActionListener.listener() e.source==this.iframe.contentWindow: ", e.source==self.iframe.contentWindow, ", e:", e)
          console.log("LocalStorageActionListener.listener() e.data.type: ",e.data.type,", e.data.name: ",e.data.name)
          console.log("LocalStorageActionListener.listener() e.data.name: ",e.data.name, " e.data.value: ",e.data.value, " e.data.days: ",e.data.days)
        }
        switch(e.data.type){
          case "iframeLocalStorage.setItem":
            localStorage.setItem(self.prefix+"."+e.data.name, e.data.value)
            break
          case "iframeLocalStorage.getItem":
            let result = localStorage.getItem(self.prefix+"."+e.data.name)
            let data = {"type": "iframeLocalStorage.getItem.result", "id": e.data.id, "result":result}
            self.iframe.contentWindow.postMessage(data, "*")
            break
        }
      }
    }
    window.addEventListener('message', this.listener, false)
  }
}