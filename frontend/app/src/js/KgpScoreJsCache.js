import {iframeLocalStorage} from "./lib/iframeCookiesLocalStorage.js"
import md5 from "md5"

export class KgpScoreJsCache{

  /** Constructor
   * 
   * uses scoresDictionnary if given, then localStorageKey if given, and finally url
   */
  constructor(scoresDictionnary=null, localStorageKey=null, url=null){
    const self = this
    this.scores = scoresDictionnary
    this.localStorageKey = localStorageKey
    this.loadedFrom = "scoresDictionnary"

    if(!this.scores){
      // waiting for LS/server: empty cache
      this.scores = {}

      if(localStorageKey){
        // ... try from localStorageKey
        iframeLocalStorage.getItem(localStorageKey).then(json =>{
          // ONLY TEMPORARY TO SAVE CACHES ON SERVER
          json=null
          // END: ONLY TEMPORARY TO SAVE CACHES ON SERVER
          if(json){
            self.scores = JSON.parse(json)
            self.loadedFrom = "localStorageKey"
          // ... try from url
          } else if( url){
            fetch(url)
              .then(resp => resp.json())
              .then(json =>{
                if(json){
                  self.scores = json
                  self.save()
                }
              }).catch(fail=>console.warn("KgpScoreJsCache: failed to load cache json file from: ",url))
              self.loadedFrom = "url"
          }
        }, console.warn)
      }
    }
  }

  /** Returns true if sequenced family tree in cache, false otherwise */
  has(target_id, familyTreeEdges, familyTreeSequencedRelatives){
    return !(this.get(target_id, familyTreeEdges, familyTreeSequencedRelatives)===undefined)
  }

  /** Returns the score for the given sequenced family tree or null if absent */
  get(target_id, familyTreeEdges, familyTreeSequencedRelatives){
    const signature = this.signature(
      target_id,
      familyTreeEdges,
      familyTreeSequencedRelatives
    )
    return this.scores[signature]
  }

  add(target_id, familyTreeEdges, familyTreeSequencedRelatives, score){
    this.scores[this.signature(
      target_id,
      familyTreeEdges,
      familyTreeSequencedRelatives
    )] = score
    this.save()
  }

  save(){
    if(this.localStorageKey){    
      // ONLY TEMPORARY TO SAVE CACHES ON SERVER iframeLocalStorage.setItem(this.localStorageKey, JSON.stringify(this.scores), 2*3600*1000)
    }
    /* ONLY TEMPORARY TO SAVE CACHES ON SERVER */
    fetch("../save-cache", {
      method: 'POST',
      body: JSON.stringify(this.scores)
    })
    /* END: ONLY TEMPORARY TO SAVE CACHES ON SERVER */
  }

  /** Returns the signature for the given sequenced family tree */
  signature(target_id, familyTreeEdges, familyTreeSequencedRelatives){
    if(!target_id){
      return md5("no target")
    }
    // factory to obtain predecessors/successors
    function predSucc(node, nodeIndex, relativeIndex){
      return familyTreeEdges
        .map(edge => edge[nodeIndex]==node? edge[relativeIndex] : null)
        .filter(pred=>pred!=null)
    }
    const predecessors = node => predSucc(node, 1, 0)
    const successors = node => predSucc(node, 0, 1)
    const visited = new Set()

    // returns signature for an array of nodes
    function nodesSignature(nodes){
      return nodes
        .filter(n => !visited.has(n))
        .map(signatureRecursive)
        .sort()
    }

    function signatureRecursive(node){
      visited.add(node)
      const predSignature = nodesSignature(predecessors(node))
      const succSignature = nodesSignature(successors(node))
      const isSeq = +familyTreeSequencedRelatives.includes(node)
      return "N("+(isSeq?"True":"False")+"|"+predSignature+"|"+succSignature+")"
    }
    return md5(signatureRecursive(target_id))
  }
}