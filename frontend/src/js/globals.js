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

// global variables
let DEV_SUFFIX = Boolean(document.URL.match(/\/privacy-dev\//))? "-dev" : ""
let BASEURL = "/privacy" + DEV_SUFFIX
let LANGUAGE_FILES_URL = BASEURL+"/assets/translations/"

// ensure we travel properly to url's id if there is one:
function scrollToUrlElementId(){
  let urlId = document.URL.match("#(.+?)($|\\?|/)")
  if(urlId){
    document.getElementById(urlId[1]).scrollIntoView(true);
    window.scrollBy(0, -80)
  }
}
// detects url changes
window.onhashchange = function() {scrollToUrlElementId()}


// languageLoader and i18n object: Internationalisation
async function languageLoader(lng){
  let translation = await fetch(LANGUAGE_FILES_URL+lng+".json")
  //console.log( "translation.status: ", translation.status, ", translation: ", translation)
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
  $("#lang-dropdown .lang-current").text(" "+newLng.toUpperCase()+" ")
  // ensure external links target is blank to open them in a new page. Timeout, otherwise doesn't work
  setTimeout(()=>{ d3.selectAll(".ext-link").attr("target","blank") },1)
  scrollToUrlElementId()
}

let i18n = new Internationalisation(["en","fr","de","it","es"], languageLoader, cookie.read("lng"), true)
i18n.languageChangeCallbacks.push(onChangeLanguage)
i18n.observe(document)
//onChangeLanguage(i18n.lng,i18n.lng)
i18n.dynamic["cookie-text"] = (t,d) => t.replace("{#1}",Boolean(document.URL.match(/\/privacy-dev\//))? "/privacy-dev" : "/privacy")

// add language choice buttons:
for(let lng of i18n.supportedLanguages){
  let langMenu = d3.select("#lang-menu")
  langMenu.append("a")
      .attr("class","dropdown-item")
      .attr("href",'javascript:void(0);')
      .html(lng.toUpperCase())
      .on("click.change-language", ()=>i18n.changeLanguage(lng))
  langMenu.append("br")
}


//Accept Privacy policy and cookie
function cookieAccept(){
  $("#cookie_banner").hide(200);
  cookie.create("banner", 1, 1)
}
if (cookie.read("banner")){
    $("#cookie_banner").hide();
}
