"use strict";


class KgpMeterScoreResponse{
  constructor(status, timestamp_js, request, tree_signature, extras=null){
    this.status = status
    this.timestamp_js = timestamp_js
    this.request = request
    this.tree_signature = tree_signature
    this.extras = extras
  }
  static parseJSON(json, request){
    return KgpMeterScoreResponse.parse(JSON.parse(json), request)
  }
  static parse(raw, request){
    if(raw.status=="OK"){
      return new KgpMeterScoreSuccess(
        raw.timestamp_js,
        request,
        raw.tree_signature,
        raw.result.privacy_metric,
        raw.result.cached,
        raw.result.execution_time,
        raw.extras,
      )
    }
    else if(raw.status=="error"){
      return new KgpMeterScoreError(
        raw.timestamp_js,
        request,
        raw.tree_signature,
        raw.code,
        raw.extras,
      )
    }
    else{
      throw new Error({"msg":"KgpMeterScoreResponse.parse(): argument raw is not a parsable KgpMeterScoreResponse.", "raw":raw})
    }
  }
}


class KgpMeterScoreSuccess extends KgpMeterScoreResponse{
  constructor(timestamp_js, request, tree_signature, privacy_metric, cached, execution_time, extras=null){
    super("OK", timestamp_js, request, tree_signature, extras)
    this.result = {
      "privacy_metric": privacy_metric,
      "cached": cached,
      "execution_time": execution_time
    }
    this.request = {} // empty on initialisation, must be set later on
  }
}


class KgpMeterScoreError extends KgpMeterScoreResponse{
  constructor(timestamp_js, request, tree_signature, code, extras=null){
    super("error", timestamp_js, request, tree_signature, extras)
    this.code = code
  }
}


class KgpMeterScoreStale extends KgpMeterScoreResponse{
  constructor(kgpResp){
    super("stale", kgpResp.timestamp_js, kgpResp.request, kgpResp.tree_signature, kgpResp.extras)
    this.staleResp = kgpResp
  }
}
