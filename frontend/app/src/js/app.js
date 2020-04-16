
import {KinGenomicPrivacyMeter} from "./KinGenomicPrivacyMeter.js"
import {Internationalisation} from "./lib/i18n.js"
import {iframeLocalStorage} from "./lib/iframeCookiesLocalStorage.js"

import {onWindowResize, log} from "./utils.js"


/* NodeList polyfill for IE11: not included in Babel (->?!?) */
if ('NodeList' in window && !NodeList.prototype.forEach) {
  console.info('polyfill for IE11');
  NodeList.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

// languageLoader and i18n object: Internationalisation
async function languageLoader(lng){
  let translation = await fetch("./i18n/"+lng+".json")
  if(translation.status==200){
    translation = await translation.json()
    return translation
  }else{
    throw {
      message: 'loading of translation "'+lng+'" failed',
      lng: lng,
      response: translation
    }
  }
}

function onChangeLanguage(oldLng, newLng){
  iframeLocalStorage.setItem("lng",newLng,30 *24*60*60*1000)
  // ensure external links target is blank to open them in a new page. Timeout, otherwise doesn't work
  setTimeout(()=>{ d3.selectAll(".ext-link").attr("target","blank") },1)
}

let i18n = new Internationalisation(["en","fr","de","it","es"], languageLoader, null, true,"kgpmeter.")
iframeLocalStorage.getItem("lng").then(lng=>lng? i18n.changeLanguage(lng): null)
i18n.languageChangeCallbacks.push(onChangeLanguage)
i18n.observe(document)
//i18n.dynamic["cookie-text"] = (t,d) => t.replace("{#1}",Boolean(document.URL.match(/\/privacy-dev\//))? "/privacy-dev" : "/privacy")



//constructor(api_base_url, svgId, youNodeId, i18n, maxFamilyTreeDepth=5, cookieLocalStoragePrefix="kgpmeter-"){
let kgp
function initKgp(options){
  kgp = new KinGenomicPrivacyMeter(
    "../",
    "svg-kin-genomics-privacy-app",
    "@I1@",
    i18n,
    "kgpmeter-",
    options
  )
}
if(window.parent != window){
  /*window.document.addEventListener(
    'KgpSetKgpOptionsEvent',
    (e)=>{
      initKgp(e.details.options)
    }, false)*/
  initKgp({})
}else{
  initKgp({})
}
window.kgp = kgp
log("app.js loaded")

function logWindowOrientation(){
  log("window.orientation: "+window.orientation)
  log('window.matchMedia("(orientation: portrait)").matches: '+ window.matchMedia("(orientation: portrait)").matches)
  log('window.matchMedia("(orientation: landscape)").matches: '+ window.matchMedia("(orientation: landscape)").matches)
}
setInterval(logWindowOrientation,2000)

window.addEventListener("orientationchange", function() {
  // Announce the new orientation number
  log("-- orientationchange event! --");
}, false);