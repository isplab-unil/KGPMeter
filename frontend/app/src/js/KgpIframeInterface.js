import {cookie} from "./lib/cookies.js"
let cl = console.log


/******** down events ********/


export function kgpSetLanguageEvent(lng){
  return new CustomEvent("KgpSetLanguageEvent", {detail: {lng:lng}})
}

/** Event from kgpmeter to kgp-iframe to signale iframe max dimensions */
export function kgpSetIframeMaxDimensionEvent(maxHeight){
  return new CustomEvent("KgpSetIframeMaxDimensionEvent", {detail: {maxHeight:maxHeight}})
}

export function kgpLaunchTutorialEvent(){
  return new CustomEvent("KgpLaunchTutorialEvent")
}

/******** up events ********/

/** Event from kgp-iframe to kgpmeter to change height */
export function kgpSetHeightEvent(height, transitionDuration){
  return new CustomEvent("KgpSetHeightEvent", {"detail": {"height":height, "transitionDuration": transitionDuration}})
}