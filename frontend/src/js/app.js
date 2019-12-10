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

// ==================== LOAD initial GEDCOM FROM SERVER ====================


//initSurvey()
kgpsurvey = new KgpSurvey("/survey", kgpMeterScoreUpdateCallbacks, i18n, 20, 10, 40)

ftree = loadFamilyTreeFromLocalStorage()


let savedFtree = Boolean(ftree)
if(!savedFtree){
  //console.log("NO FAMILY TREE IN STORAGE")
  let start_ftree = {
    "class": "FamilyTreeLayout",
    "nodes": [
      {
        "id": "@I1@",
        "sex": "F",
        "tag": "INDI",
        "fams": [],
        "famc": null,
        "chil": [],
        "wife": null,
        "husb": null,
        "sequencedDNA": false,
        "i18nName": "you"
      }
    ],
    "properties": [
      "id", "name", "sex", "tag", "fams", "famc", "chil", "wife",
      "husb", "sequencedDNA", "lastSequencedDNA", "i18nName"
    ],
    "centerNodeId": 0
  }
  ftree = FamilyTreeLayout.unserialize(JSON.stringify(start_ftree))
}

//console.log("kgp.target: ", kgp.target, ", kgp.target.id: ", kgp.target.id)
console.log("ftree.nodesArray().filter(n =>n.id==kgp.target)[0]: ",ftree.nodesArray().filter(n =>n.id==kgp.target)[0])
if(kgp.target){
  if(!kgp.target.id){
    kgp.target = ftree.nodesArray().filter(n =>n.id==kgp.target)[0]
  }
  selectTarget(kgp.target)
}

familyTreeArtist = new FamilyTreeArtist(kgp, i18n,0)
mobileBlock()
IEBlock()
if(savedFtree){
  kgpMeterScoreRequestHandler.requestScore(
    kgp.target?kgp.target.id:"",
    ftree.getLinksAsIds(), ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id),
    kgp.userId, kgp.userSource, i18n.lng
  )
}


