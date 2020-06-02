
import {KinGenomicPrivacyMeter} from "./KinGenomicPrivacyMeter.js"
import {Internationalisation} from "./lib/i18n.js"
import {iframeLocalStorage} from "./lib/iframeCookiesLocalStorage.js"
import { FamilyTreeLayout } from "./FamilyTreeLayout.js";
import {addLinksToNodes, addTagToNode } from "./utils.js"


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

let i18n = new Internationalisation(["en","fr","de","it","es"], languageLoader, null, false,"kgpmeter.")
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



// ================ TEST GEDCOM ================




/** Transforms a gedcom string into a proper node representations
 * 
 * @param {*} gedData a gedcom string
 * @returns nodesDict a dict of nodes, with nodes' links as references to each other
 */
function parseGed(gedData) {
  console.log("gedData: ", gedData)
  gedData = parseGedcom.parse(gedData)

  let d3ized_ged = parseGedcom.d3ize(gedData);

  // add sex tag + sequencedDNA/lastSequencedDNA booleans
  _.forEach(d3ized_ged.nodes, function (n) {
    addTagToNode(n, "SEX");
    n.sequencedDNA=false
    n.lastSequencedDNA=false 
  });

  // add family links+sex to nodes
  d3ized_ged.nodes = addLinksToNodes(d3ized_ged.nodes, false);

  // transform into Dict as required by FTL constructor
  let nodesDict = {}
  d3ized_ged.nodes.forEach(n => nodesDict[n.id] = n )

  console.log("nodesDict: ", nodesDict)
  //ftree = new FamilyTreeLayout(d3ized_ged.nodes);
  return nodesDict
}

fetch("start_family.ged").then(
  resp => resp.text()
).then(gedData => {
  window.gedFtree = new FamilyTreeLayout(parseGed(gedData)/* TODO SPECIFIY CENTERNODIDE */)
  console.log("gedFtree: ",window.gedFtree)
})

// get current localstorage ftree
//JSON.parse(localStorage.getItem("kgp-familyTree"))