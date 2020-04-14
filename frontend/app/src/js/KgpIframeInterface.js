
/******** down events ********/

export function kgpSetSourceEvent(source){
  return {"type": "KgpSetSourceEvent", "source":source}
}


export function kgpSetLanguageEvent(lng){
  return {"type": "KgpSetLanguageEvent", "lng":lng}
}

/** Event from kgpmeter to kgp-iframe to signale iframe max dimensions */
export function kgpSetIframeMaxDimensionEvent(maxHeight){
  return {"type": "KgpSetIframeMaxDimensionEvent", "maxHeight":maxHeight}
}

export function kgpLaunchTutorialEvent(){
  return {"type": "KgpLaunchTutorialEvent"}
}

export function kgpToggleTutorialButtonEvent(showTutorialButton){
  return {"type": "KgpToggleTutorialButtonEvent", "showTutorialButton":showTutorialButton}
}

export function kgpRemoveSurveyEvent(){
  return {"type": "KgpRemoveSurveyEvent"}
}

/******** up events ********/

/** Event from kgp-iframe to kgpmeter to change height */
export function kgpSetHeightEvent(height, transitionDuration){
  return {"type": "KgpSetHeightEvent", "height":height, "transitionDuration": transitionDuration}
}