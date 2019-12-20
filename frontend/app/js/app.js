
import {KinGenomicPrivacyMeter} from "./KinGenomicPrivacyMeter.js"
import {Internationalisation} from "./lib/i18n.js"



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

let kgp


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
  cookie.create("lng",newLng,30)
  // ensure external links target is blank to open them in a new page. Timeout, otherwise doesn't work
  setTimeout(()=>{ d3.selectAll(".ext-link").attr("target","blank") },1)
}

let i18n = new Internationalisation(["en","fr","de","it","es"], languageLoader, cookie.read("lng"), true)
i18n.languageChangeCallbacks.push(onChangeLanguage)
i18n.observe(document)
//i18n.dynamic["cookie-text"] = (t,d) => t.replace("{#1}",Boolean(document.URL.match(/\/privacy-dev\//))? "/privacy-dev" : "/privacy")



//constructor(api_base_url, svgId, youNodeId, i18n, maxFamilyTreeDepth=5, cookieLocalStoragePrefix="kgpmeter-"){
kgp = new KinGenomicPrivacyMeter(
  "",
  "svg-kin-genomics-privacy-app",
  "@I1@",
  i18n
)



// =================================== TEST iframe to parent communication and vice-versa ===================================

// parent to iframe:
function handleEvent(e) {
  console.log("Communication kgpmeter to kgp-iframe success! detail:", e.detail) // outputs: {foo: 'bar'}
}
window.document.addEventListener('myCustomEvent', handleEvent, false)

// iframe to parent:
var data = { direction: 'up' }
var event = new CustomEvent('myCustomEvent', { detail: data })
window.parent.document.dispatchEvent(event)