

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