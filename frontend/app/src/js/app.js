"use strict";



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

let ftree = 0
let resp;
let gedData = 0

// FTA
let familyTreeArtist
// privacy_bar.js
let privacyBar
let privacyWordedScore
let privacyBackendStatus
let privacyScoreNumberExplainer
let kgpMeterScoreRequestHandler
// surveys.js
let kgpsurvey;

// languageLoader and i18n object: Internationalisation
let LANGUAGE_FILES_URL = "./i18n/"
async function languageLoader(lng){
  let translation = await fetch(LANGUAGE_FILES_URL+lng+".json")
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


//initSurvey()

kgp.loadFamilyTreeFromLocalStorage()
let savedFtree = Boolean(ftree)
if(!savedFtree){
  //console.log("NO FAMILY TREE IN STORAGE")
  ftree = KinGenomicPrivacyMeter.getEmptyFamilyTree()
}


familyTreeArtist = new FamilyTreeArtist(kgp, i18n,0)

if(kgp.target){
  kgp.selectTarget(kgp.target, true)
}

kgp.mobileBlock()
kgp.IEBlock()
if(savedFtree){
  kgpMeterScoreRequestHandler.requestScore(
    kgp.target?kgp.target.id:"",
    ftree.getLinksAsIds(), ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
    kgp.userId, kgp.userSource, i18n.lng
  )
}


