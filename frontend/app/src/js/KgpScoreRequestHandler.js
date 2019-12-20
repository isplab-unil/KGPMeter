import {KgpScoreResponse, KgpScoreSuccess, KgpScoreError, KgpScoreStale} from "./KgpScoreResponse.js"

export class KgpScoreRequestHandler{
  constructor(api_endpoint){
    this.api_endpoint = api_endpoint
    this.lastRequest = {}
    // necessary dummy
    this.latestResponse = new KgpScoreSuccess(-1, {}, "", 1.0001, 0, 0, 0)
    this.listeners = []
    this.callbacks = {
      start:[],
      end:[],
      error:[]
    }
    let self = this
    this.addListener((...args)=>self.callbacksAwait(...args))
  }

  /** Adds a listener to requests, returns true if not already in array*/
  addListener(listener){
    if(!this.listeners.includes(listener)){
      this.listeners.push(listener)
      return true;
    }
    return false;
  }
  /** remove a listener to requests, returns removed listener */
  removeListener(listener){
    let index = this.listeners.indexOf(listener)
    if(index!=-1){
      return this.listeners.splice(index,1)
    }
    return [];
  }

  requestScore(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng, silent=false){
    let self = this
    let currentRequest = new KgpScoreRequest(
      target_id,
      familyTreeEdges, familyTreeSequencedRelatives,
      user_id, user_source, lng
    )
    let previousResponse = this.latestResponse
    this.lastRequest = currentRequest

    let kgpPromise = fetch(self.api_endpoint, {
      method: 'POST',
      body: JSON.stringify(currentRequest)
    })
    .then(resp=>resp.json())
    // handle connexion error
    .catch( () => Promise.reject(new KgpScoreError(currentRequest.timestamp_js, currentRequest, null, 5, {"message":'Erreur de connexion au serveur.'})))
    // parse response
    .then(json=>{
      let kgpr = KgpScoreResponse.parse(json, currentRequest)
      // check if it's stale or not
      if(kgpr.timestamp_js!=self.lastRequest.timestamp_js){
        return Promise.reject(new KgpScoreStale(kgpr))
      }
      // if it's an error -> reject
      if(kgpr.status=="error"){
        return Promise.reject(kgpr)
      }
      // success!
      self.latestResponse = kgpr
      return kgpr
    })

    if(!silent){
      this.listeners.forEach(l => l(kgpPromise, currentRequest, previousResponse))
    }

    return kgpPromise
  }


/** callbacks */
callbacksAwait(kgpPromise, request, previousResponse){
  let self = this
  // for tutorial videos, comment this following line (glitches in video):
  self.callbacks.start.forEach(f => f(kgpPromise, request, previousResponse))
  return kgpPromise.then(kgpSuccess=>{
    // success
    self.callbacks.end.forEach(f => f(kgpPromise, request, previousResponse))
    //console.log("kgp score success: ", kgpSuccess)
  }).catch(kgpError=>{
    self.callbacks.error.forEach(f => f(kgpPromise, request, previousResponse))
    //console.log("kgp score error: ", kgpError)
  })
}
}


/** Creates the request that'll be sent to the Kgp server, with instant timestamp */
export class KgpScoreRequest{
  constructor(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng){
    let timestamp_js = +new Date()
    this.timestamp_js = timestamp_js
    this.family_tree = {
      "edges":familyTreeEdges,
      "sequenced_relatives":familyTreeSequencedRelatives,
      "target":target_id
    }
    this.user = {
      "id": user_id,
      "source": user_source,
      "lng":lng
    }
  }
}