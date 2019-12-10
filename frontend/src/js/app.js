"use strict";

// will be called on window resizes
/*function updateSvgWidth(){
  kgp.svgWidth = kgp.svg.node().parentNode.clientWidth
  kgp.svg.attr("width",kgp.svgWidth)
}*/


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
let DEV_SUFFIX = Boolean(document.URL.match(/\/privacy-dev\//))? "-dev" : ""
let BASEURL = "/privacy" + DEV_SUFFIX
let API_URL = (document.domain=="localhost"? "": "/api" + DEV_SUFFIX )
let LANGUAGE_FILES_URL = BASEURL+"/assets/translations/"
let PRIVACY_SCORE_API_ENDPOINT = API_URL+"privacy-score"
let SURVEY_API_ENDPOINT = API_URL+"survey"
let resp;
let gedData = 0


// languageLoader and i18n object: Internationalisation
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


// only launch Kin Genomic Privacy tool if we're on the tool page
if(document.URL.match("/tool/|app.html")){

  //constructor(api_base_url, svgId, youNodeId, i18n, maxFamilyTreeDepth=5, cookieLocalStoragePrefix="kgpmeter-"){
  kgp = new KinGenomicPrivacyMeter(
    API_URL,
    "svg-kin-genomics-privacy-app",
    "@I1@",
    i18n
  )

  /*kgp.svgSelector = "#svg-kin-genomics-privacy-app"
  kgp.privacyMetrics = undefined // will be filled in after 1st request
  kgp.svg = d3.select(kgp.svgSelector)
  kgp.svgHeight = parseInt(kgp.svg.attr("height"))
  kgp.svgOriginalHeight = kgp.svgHeight
  kgp.svgMaxHeight = parseInt(kgp.svg.attr("data-max-height"))
  kgp.svgMaxHeight =  kgp.svgMaxHeight? kgp.svgMaxHeight : kgp.svgHeight
  kgp.youNodeId = "@I1@"
  kgp.signaturesRequestedTrees = new Set()
  kgp.surveyTrigger = undefined
  updateSvgWidth()
  onWindowResize(resizeSvg)*/

  // ==================== LOAD initial GEDCOM FROM SERVER ====================

  let gedcome_files = [
    "assets/start_family2.ged",
    "assets/example_gedcom.ged", //ok
    "assets/GeorgeWashingtonFamilyBig.ged", // big tree, buggy! interesting
    "assets/HouseofHabsburg.ged", // 1 mistake
    "assets/KennedyFamily.ged", // wide family tree: many errors, nodes cramped together
    "assets/KoranFamilyTree.ged",
    "assets/royal92.ged",// too large!
    "assets/family.ged"
  ].map(f => BASEURL+"/"+f)
  resp = $.get( gedcome_files[0] ,function(data){
    gedData = data
    
    //initSurvey()
    kgpsurvey = new KgpSurvey(SURVEY_API_ENDPOINT, kgpMeterScoreUpdateCallbacks, i18n, 20, 10, 40)

    ftree = loadFamilyTreeFromLocalStorage()


    let savedFtree = Boolean(ftree)
    if(!savedFtree){
      //console.log("NO FAMILY TREE IN STORAGE")
      parseGed()
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




  });
}
