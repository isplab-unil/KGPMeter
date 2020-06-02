
import {KinGenomicPrivacyMeter} from "./KinGenomicPrivacyMeter.js"
import {Internationalisation} from "./lib/i18n.js"
import {iframeLocalStorage} from "./lib/iframeCookiesLocalStorage.js"


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


function getNodeFromId(nodes, id) {
  return nodes.filter(function (n) {
    return n.id === id;
  })[0];
}

/*
  takes care of adding to individuals nodes:
  - famc:famc_id the id of the parents' family node
  - fams:[fams_ids] array of ids of families this individual is a parent in
  ...and adding to family nodes:
  - husb
  - wife
  - chil:[] 
*/
function addLinksToNodes(nodes, onlyId=true) {


  function addLinksToNode(node) {
    var famc = getTagsData(node, "FAMC")[0];
    if (famc) {
      node.famc = onlyId ? famc : getNodeFromId(nodes, famc);
    }
    var husb = getTagsData(node, "HUSB")[0];
    if (husb) {
      node.husb = onlyId ? husb : getNodeFromId(nodes, husb);
    }
    var wife = getTagsData(node, "WIFE")[0];
    if (wife) {
      node.wife = onlyId ? wife : getNodeFromId(nodes, wife);
    }

    var fams = getTagsData(node, "FAMS");
    node.fams = onlyId ? fams : fams.map(function (nid) {
      return getNodeFromId(nodes, nid);
    });

    var chil = getTagsData(node, "CHIL");
    node.chil = onlyId ? chil : chil.map(function (nid) {
      return getNodeFromId(nodes, nid);
    });

    return node;
  }

  return nodes.map(addLinksToNode);
}



// gets an array of the data of all tags corresponding to the given tag
function getTagsData(node, tag) {
  var tags = node.tree.filter(function (e) {
    return e.tag === tag;
  }) || [];
  return tags.map(function (t) {
    return t.data;
  });
}

/*
adds the chosen tag as an object property
note: Gedcom tags are uppercase, the object property key is the lowercased tag
*/
function addTagToNode(node, tag, defaultValue) {
  var tagsData = getTagsData(node, tag);
  if (tagsData.length > 1) {
    node[tag.toLowerCase()] = tagsData;
  } else if (tagsData.length > 0) {
    node[tag.toLowerCase()] = tagsData[0];
  } else {
    node[tag.toLowerCase()] = defaultValue;
  }
}


function parseGed(gedData) {
  console.log("gedData: ", gedData)
  gedData = parseGedcom.parse(gedData)
  console.log("parseGedcom.parse(gedData), gedData: ", gedData)

  let d3ized_ged = parseGedcom.d3ize(gedData);
  console.log("parseGedcom.d3ize(gedData), d3ized_ged: ", JSON.parse(JSON.stringify(d3ized_ged)))
  // add family links+sex to nodes

  d3ized_ged.nodes = addLinksToNodes(d3ized_ged.nodes);
  console.log("addLinksToNodes(d3ized_ged.nodes), d3ized_ged: ", JSON.parse(JSON.stringify(d3ized_ged)))
  _.forEach(d3ized_ged.nodes, function (n) {
    addTagToNode(n, "SEX");
    n.sequencedDNA=false
    n.lastSequencedDNA=false 
  });
  console.log(" addTagToNode(n, SEX), d3ized_ged: ", JSON.parse(JSON.stringify(d3ized_ged)))
  //ftree = new FamilyTreeLayout(d3ized_ged.nodes);
  return d3ized_ged
}

fetch("start_family.ged").then(
  resp => resp.text()
).then(gedData => {
  parseGed(gedData)
})


// jquery gedcom loading
/*$.get("start_family2.ged", function (data) {
  console.log("$.get data:", data)
})*/


// get current localstorage ftree
//JSON.parse(localStorage.getItem("kgp-familyTree"))