import {KgpScoreResponse, KgpScoreSuccess, KgpScoreError, KgpScoreStale} from "./KgpScoreResponse.js"
import {KgpScoreRequest} from "./KgpScoreRequest.js"
import {KgpScoreJsCache} from "./KgpScoreJsCache.js"

export class KgpScoreRequestHandler{
  constructor(api_endpoint, cache = null){
    this.api_endpoint = api_endpoint
    this.cache = cache? cache : new KgpScoreJsCache({})
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

  /** Requests a score from the backend
   * 
   * Returns the backend response as a promise, also calls the listeners with the promise, request and previous response
   * 
   * @param {String} target_id the target id as a string
   * @param {Array[Array[String]]} familyTreeEdges an array of edges, each edge is an array of length 2 of the form
   *        [predecessorId, successorId], family nodes must still be included.
   * @param {Array[String]} familyTreeSequencedRelatives an array of id of sequenced relatives
   * @param {String} user_id the webapp id of the user
   * @param {String} user_source the webapp's user source
   * @param {String} lng the current webapp language
   * @param {Boolean} silent [optional] if true, listeners aren't called. false by default
   */
  requestScore(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng, silent=false){
    let self = this
    let currentRequest = new KgpScoreRequest(
      target_id,
      familyTreeEdges, familyTreeSequencedRelatives,
      user_id, user_source, lng
    )
    let previousResponse = this.latestResponse
    this.lastRequest = currentRequest

    let kgpPromise;
    
    if(target_id){
      // get from cache
      const jsTreeSignature = this.cache.signature(target_id, familyTreeEdges, familyTreeSequencedRelatives)
      const scoreFromCache = this.cache.get(target_id, familyTreeEdges, familyTreeSequencedRelatives)
      console.log("Family tree, target:", target_id,", familyTreeEdges:", familyTreeEdges, ", familyTreeSequencedRelatives:", familyTreeSequencedRelatives)

      if(scoreFromCache==null){
        console.log("JS cache miss, jsTreeSignature: ", jsTreeSignature)
        // if cache miss fetch from serer
        kgpPromise = fetch(self.api_endpoint, {
            method: 'POST',
            body: JSON.stringify(currentRequest)
          })
          .then(resp=>resp.json())
          // handle connexion error
          .catch( () => Promise.reject(new KgpScoreError(currentRequest.timestamp_js, currentRequest, null, 5, {"message":'Erreur de connexion au serveur.'})))
          // parse response
          .then(obj => KgpScoreResponse.parse(obj, currentRequest))
      }else{
        console.log("JS cache hit, jsTreeSignature: ", jsTreeSignature, ", score: ", scoreFromCache)
        // if cache hit, build porper kgpPromise with KgpScoreSuccess
        kgpPromise = Promise.resolve(new KgpScoreSuccess(
          currentRequest.timestamp_js,
          currentRequest,
          null,
          scoreFromCache,
          true/*TO ADAPT: FROM JS CACHE*/ ,
          Date.now()-currentRequest.timestamp_js)
        )
      }
    } else {
      // if no target: error code 4!
      kgpPromise = Promise.resolve(new KgpScoreError(
        currentRequest.timestamp_js,
        currentRequest,
        null,
        4)
      )
    }

    kgpPromise = kgpPromise.then(kgpr=>{
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
      //save result in cache
      self.cache.add(
        currentRequest.family_tree.target,
        currentRequest.family_tree.edges,
        currentRequest.family_tree.sequenced_relatives,
        kgpr.result.privacy_metric
      )
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
