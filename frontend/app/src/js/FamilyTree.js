import {addLinksToNodes, addTagToNode } from "./utils.js"

export class FamilyTree{
  constructor(nodes){
    this.nodes= nodes
    
    this.maxDepth = 0
    this.minFreeIndivId = _.max(_.map(_.filter(this.nodes,n=>n.tag=="INDI"), nd=> parseInt(nd.id.replace(/@|F|I/g,""))))+1
    this.minFreeFamId = _.max(_.map(_.filter(this.nodes,n=>n.tag=="FAM"), nd=> parseInt(nd.id.replace(/@|F|I/g,""))))+1
    if(isNaN(this.minFreeIndivId)){ this.minFreeIndivId=1 }
    if(isNaN(this.minFreeFamId)){ this.minFreeFamId=1 }

    // add names to family nodes, and spouse() method
    this.nodes = _.forEach(this.nodes,n=>{
      if(n.tag==="FAM"){
        n.name+= " "+(n.husb? n.husb.name:"")+","+(n.wife?n.wife.name:"")
      }
      FamilyTree.addSpouseMethod(n)
    })

    //compute nodes positions
    //this.computeLayout()
  }

  /**
   * Serialize the family tree in a JSON ready JS object
   * 
   * By default this only serializes the basic properties of nodes according to family-tree:
   * - id, name, sex, tag, fams, famc, chil, wife, husb
   * 
   * Moreover, FamilyTree nodes are linked (with properties fams, famc, chil, wife, husb) together
   * by references, this creates cycles.
   * Hence, this method also replace inter-nodes references by node ids.
   * 
   * @param {Array[string]} properties (optional) additional properties to be saved
   * @returns {Object} a JSON ready JS object with structure
   * {
   *   class : "FamilyTree", // Class of the object
   *   nodes : nodes, // nodes in an array with ids as links
   *   properties : properties // the list of properties the nodes have
   * }
   */
  serialize(properties=[]){
    properties = ["id", "name", "sex", "tag", "fams", "famc","chil", "wife", "husb"]
      .concat(properties)
      .filter((v,i,s) => s.indexOf(v)===i)
    let nodes = this.nodesArray()
    nodes = nodes.map(n=>{
      let tr = {}
      properties.forEach(p => tr[p] = n[p])
      return tr
    })
    for(let n of nodes){
      n.fams = n.fams? n.fams.map(f => f.id) : null
      n.chil = n.chil? n.chil.map(c => c.id) : null
      n.famc = n.famc? n.famc.id : null
      n.wife = n.wife? n.wife.id : null
      n.husb = n.husb? n.husb.id : null
    }
    return {
      class : "FamilyTree",
      nodes : nodes,
      properties : properties
    }
  }
  /** Takes care of re-establishing the object references in nodes links, the inverse of serialize()
   * 
   * @param {Array[nodes]} nodesArray an array of nodes, where the fams, famc, chil, wife, husb properties are node ids
   * @returns A dictionary with node ids as keys and nodes as values and fams, famc, chil, wife properties are direct references
   */
  static unserializeParseNodes(serializedFtree){
    let nodesDict = {}
    serializedFtree.nodes.forEach(n => nodesDict[n.id] = n )
    for(let n of serializedFtree.nodes){
      n.fams = n.fams? n.fams.map(f => nodesDict[f]) : []
      n.chil = n.chil? n.chil.map(c => nodesDict[c]) : []
      n.famc = n.famc? nodesDict[n.famc] : null
      n.wife = n.wife? nodesDict[n.wife] : null
      n.husb = n.husb? nodesDict[n.husb] : null
    }
    return nodesDict
  }
  /** Unserializes a FamilyTree serialized with JSON.stringify(FamilyTree.serialize())
   * 
   * @param {string} serializedFtree
   * @returns {FamilyTree}
   */
  static unserialize(serializedFtree){
    serializedFtree = JSON.parse(serializedFtree)
    return new FamilyTree(FamilyTree.unserializeParseNodes(serializedFtree))
  }

  /** Transforms a gedcom string into a proper node representations
   * 
   * @param {*} gedData a gedcom string
   * @returns nodesDict a dict of nodes, with nodes' links as references to each other
   */
  static parseGedcomNodes(gedData) {
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
    return nodesDict
  }
  /** Unserializes a FamilyTree serialized in a GEDCOM file
   * 
   * @param {string} serializedFtree
   * @returns {FamilyTree}
   */
  static unserializeGedcom(gedcomData){
    return new FamilyTree(FamilyTree.parseGedcomNodes(gedcomData))
  }


  nodesArray(){
    return _.map(this.nodes, n=>n)
  }

  /**
   * Checks whether the Family Tree contains the given node (a node with id property or directly a str id)
   * @param {node or str} node 
   */
  contains(node){
    if(node){
      return Boolean( node.id? this.nodes[node.id] : this.nodes[node])
    }
    return false
  }

  /**
   * Get links between all nodes: parents, children and family nodes
   */
  getLinks(){
    let links = [];
    _.forEach(this.nodes, node=>{
      if(node.famc){ links.push([node.famc,node])}
      if(node.wife){ links.push([node.wife,node])}
      if(node.husb){ links.push([node.husb,node])}
    })
    return links
  }
  getLinksAsIds(){
    return this.getLinks().map(l=>l.map(n=>n.id))
  }

  /**
   * Get links between parents and children, removing family nodes
   */
  getParentChildLinks(){
    let links = []
    let addEdge = (a,b) =>{ links.push([a,b]) }
    this.nodesArray().filter(n=>n.tag=="FAM").forEach(function(familyNode){
      if(familyNode.chil){
        familyNode.chil.forEach(child =>{
          if(familyNode.wife) addEdge(familyNode.wife,child);
          if(familyNode.husb) addEdge(familyNode.husb,child);
        })
      }
    })
    return links
  }
  getParentChildLinksAsIds(){
    return this.getParentChildLinks().map(link => [link[0].id, link[1].id])
  }

  /*
  Computes depth of all the nodes in the family tree
  Also computes max- and min-deph reachable from node relative to centerNode
  adds following properties to each node:
  - depth
  - minDepth
  - maxDepth
  */
  _computeDepths(startNode){

    _.forEach(this.nodes, n=> delete n.depth)
    this._computeDepthsRecursive(startNode,0)

    //ensure non-negative depths & compute family tree global maximum depth
    let depthExtent = d3.extent(_.map(this.nodes,n => n.depth))
    let minDepth = depthExtent[0]
    this.maxDepth = depthExtent[1]-minDepth
    //this.nodes = _.mapValues(this.nodes, n=> {n.depth-=minDepth;return n})
    _.forEach(this.nodes,function(n){
      n.depth-=minDepth;
      n.minDepth-=minDepth;
      n.maxDepth-=minDepth;
    })
  }

  _computeDepthsRecursive(node,depth){
    if(!node){return;}
    //console.log("_computeDepthsRecursive! "+node.id+" at depth "+depth)
    if(node.depth!=undefined){
      if(node.depth!=depth){
        throw "DepthError: "+node.id+" resolves to 2 different depths: "+node.depth+" and "+depth;
      }
      return;
    }
    let maxmindepths = [[depth,depth]]

    node.depth=depth
    maxmindepths.push(this._computeDepthsRecursive(node.husb,depth))
    maxmindepths.push(this._computeDepthsRecursive(node.wife,depth))
    maxmindepths.push(this._computeDepthsRecursive(node.famc,depth-1))
    if(node.fams){
      node.fams.forEach(fam => maxmindepths.push(this._computeDepthsRecursive(fam,depth)))
    }
    if(node.chil){
      node.chil.map(chil => maxmindepths.push(this._computeDepthsRecursive(chil,depth+1)))
    }
    maxmindepths = maxmindepths.filter(mmd => mmd!=undefined)
    node.minDepth = d3.min(maxmindepths,d=>d[0]) 
    node.maxDepth = d3.max(maxmindepths,d=>d[1]) 
    return [node.minDepth,node.maxDepth];
  }

  getNode(nodeOrNodeId){
    return _.isString(nodeOrNodeId)? this.nodes[nodeOrNodeId]:nodeOrNodeId
  }

  /* add a family to tree, wife, husb chil must be nodes or node ids*/
  addFamily(wife, husb, child){
    //console.log("addFamily")
    let node = {
      id: FamilyTree.gedcomId(this.minFreeFamId++,"F"),
      tag:"FAM",
      wife: this.getNode(wife),
      husb: this.getNode(husb),
      chil:[child].map(this.getNode).filter(x=>x!=undefined),
      spouse:function(){return undefined}
    }
    this.nodes[node.id]=node
    return node;
  }

  /* add an individual to tree, famcId,famsId must be nodes or node ids*/
  addIndividual(name,famc,fams,sex){
    //console.log("addIndividual")
    let node = {
      id:FamilyTree.gedcomId(this.minFreeIndivId++),
      tag:"INDI",
      name:name,
      famc:this.getNode(famc),
      fams:[fams].map(this.getNode).filter(x=>x!=undefined),
      sex:sex
    }
    FamilyTree.addSpouseMethod(node)
    this.nodes[node.id]=node

    return node;
  }

  /* add child to given parent in tree
  Also adds spouse if needed
  */
  addChild(name,sex,parent,addSpouseToo=true,spouseDefaultName="spouse"){
    //console.log("addChild")
    parent = this.getNode(parent)
    let famc = parent.fams[0];
    if(!famc){
      famc = parent.sex=="F"? this.addFamily(parent) : this.addFamily(undefined,parent)
      parent.fams.push(famc)
    }
    if(addSpouseToo && !parent.spouse()){this.addSpouse(spouseDefaultName,parent)}
    let child = this.addIndividual(name,famc,undefined,sex)
    famc.chil.push(child)
    return child
  }

  /* add a parent to given child in tree, childId must be a node id or undefined*/
  addParent(name,sex,child){
    child = this.getNode(child)
    //console.log("addParent")
    let fams = child.famc;
    if(!fams){
      fams = this.addFamily(undefined,undefined,child)
      child.famc= fams
    }
    let parent = sex==="F"? fams.wife:fams.husb;
    if(parent){return parent}
    parent = this.addIndividual(name,undefined,fams,sex)
    sex=="F"? fams.wife=parent : fams.husb=parent;
    return parent
  }

  /* add a spouse to given spouse in tree, spouseId must be a node id or undefined*/
  addSpouse(name,spouse){
    let spouse1 = this.getNode(spouse)
    //console.log("addParent")
    let fams = spouse1.fams[0];
    if(!fams){
      fams = spouse1.sex=="F"? this.addFamily(spouse1) : this.addFamily(undefined,spouse1)
      spouse1.fams.push(fams)
    }
    let spouse2 = spouse1.sex==="F"? fams.husb:fams.wife;
    if(spouse2){return spouse2}
    spouse2 = this.addIndividual(name,undefined,fams,spouse1.sex==="F"?"M":"F")
    spouse2.sex=="F"? fams.wife=spouse2 : fams.husb=spouse2;
    return spouse2
  }

  /*
  properly removes a given node from the family tree, including links and references to it.
  Also automatically deletes family nodes that are no longer needed.
  Can also delete all the nodes that are no longer connected to the main tree.

  arguments:
  - node: node or node id to be deleted
  - deleteNodesNotConnectedTo: node or node id, the function deletes all the nodes that are no longer connected to it once the first node has been removed.

  returns a set of the deleted node ids
  */
  deleteNode(node,deleteNodesNotConnectedTo=false){
    node = this.getNode(node)
    //console.log("deleteNode, node.id="+node.id+", ")
    if(!node){return new Set();}

    // remove references to this node in other connected nodes
    if(node.famc){
      node.famc.chil = node.famc.chil.filter(c=>c.id!=node.id)
    }
    if(node.husb){ node.husb.fams = node.husb.fams.filter(c=>c.id!=node.id)}
    if(node.wife){ node.wife.fams = node.wife.fams.filter(c=>c.id!=node.id)}
    if(node.chil){ node.chil.forEach(c => delete c.famc)}
    if(node.fams){ node.fams.forEach(c => {
        if(c.wife && c.wife.id==node.id){ delete c.wife}
        if(c.husb && c.husb.id==node.id){ delete c.husb}
      }
    )}
    let deletedNodeId = node.id
    delete this.nodes[node.id]

    // remove family nodes that are no longer needed
    let needlessFamilies = _.filter(this.nodes,function(n){
      return (n.tag==="FAM" &&
        (
          //( (!n.wife) && (!n.husb)  && (n.chil?n.chil.length<=1:true)) || // no wife, no husb and 1 child -> family no longer needed
          ( (!n.wife) && (!n.husb)) || // no wife, no husb -> family no longer needed
          (((!n.wife) || (!n.husb)) && (n.chil?n.chil.length==0:true))    // only 1 spouse and no child -> family no longer needed
        ))
    })
    for(let fam of needlessFamilies){this.deleteNode(fam)}

    // also eliminate elements that are no longer connected to the deleteNodesNotConnectedTo node and families without spouses
    //console.log("deleteNode, nodes pre-_computeDepths():")
    //console.log(this.nodes)
    let noLongerConnectedNodesIds = []
    if(deleteNodesNotConnectedTo){
      let startNode = this.getNode(deleteNodesNotConnectedTo)
      this._computeDepths(startNode)
      noLongerConnectedNodesIds = _.filter(this.nodes,n => n.depth==undefined || isNaN(n.depth)).map(n=>n.id)
    }
    let deletedNodeIds = new Set([...noLongerConnectedNodesIds, ...needlessFamilies.map(n=>n.id)]).add(deletedNodeId)
    for(let nid of deletedNodeIds){delete this.nodes[nid]}

    // ensure clean chil and fams arrays
    this.cleanChilArrays()
    this.cleanFamsArrays()

    return deletedNodeIds

  }

  /** ensures that the tree doesn't have more than nbGenerations by removing nodes*/
  truncateToNgenerations(centerNodeId, nbGenerations){
    this._computeDepths(this.getNode(centerNodeId))
    if((this.maxDepth+1)>nbGenerations){
      const centerNodeDepth = this.nodes[centerNodeId].depth
      const minKeepDepth = Math.max(0, centerNodeDepth)
      const maxKeepDepth = Math.max(nbGenerations-1, centerNodeDepth+nbGenerations-1)
      this.nodesArray().filter(n => n.depth<minKeepDepth || n.depth>maxKeepDepth).forEach(n=>this.deleteNode(n))
    }
  }

  // ensure there aren't any "undefined" element in nodes' chil or fams arrays
  cleanChilArrays(){
    _.forEach(this.nodes, node => node.chil?node.chil = node.chil.filter(Boolean):node.chil)
  }
  cleanFamsArrays(){
    _.forEach(this.nodes, node => node.fams?node.fams = node.fams.filter(Boolean):node.fams)
  }

  static gedcomId(idnb,type="I"){
    return "@"+type+idnb+"@"
  }

  static addSpouseMethod(n){
    n.spouse = function(famsIndex=0){
      // only if desired fams exists...
      if( this.fams && this.fams.length>famsIndex){
        let fams = this.fams[famsIndex]
        // only if both spouses... present
        if(fams.wife&&fams.husb){
          // ...can we find the spouse
          return this.id==fams.wife.id? fams.husb : fams.wife
        }
      }
      return undefined;
    }
  }
}


