"use strict";

class FamilyTreeLayout extends FamilyTree{
  constructor(nodes, centerNodeId){
    super(nodes)
    // if no centerNodeId, set it as the first family with 2 spouses
    if(!centerNodeId){
      for(let n of Object.keys(nodes)){
        if(nodes[n].tag==="FAM" & (nodes[n].husb!=undefined | nodes[n].wife!=undefined)) // only 1 spouse
          centerNodeId=nodes[n].id;
        if(nodes[n].tag==="FAM" & nodes[n].husb!=undefined & nodes[n].wife!=undefined){
          centerNodeId=nodes[n].id;
          break;
        }
      }
    }
    this.centerNode = this.nodes[centerNodeId]

    //compute nodes positions
    //this.computeLayout()
  }

  static parentClass(){
    return FamilyTree.prototype
  }

  /** Serializes FamilyTree layout to a JSON ready JS Object
   * Only need to call JSON.stringify() to transform it to string.
   * @returns {Object} {
   *   class : "FamilyTreeLayout", // Class of the object
   *   nodes : nodes, // nodes in an array with ids as links
   *   properties : properties // the list of properties the nodes have
   *   centerNodeId : centerNodeId // the id of the node around which the layout is organized
   * }
   */
  serialize(properties = []){
    let serialization = FamilyTreeLayout.parentClass().serialize.call(this,properties)
    serialization.class = "FamilyTreeLayout"
    serialization.centerNodeId = this.centerNode? this.centerNode.id : 0
    return serialization
  }
  /** Inverse of JSON.stringify(FamilyTreeLayout.serialize())
   * @param {string} serializedFtreeLayout
   * @returns {FamilyTreeLayout}
   */
  static unserialize(serializedFtreeLayout){
    serializedFtreeLayout = JSON.parse(serializedFtreeLayout)
    return new FamilyTreeLayout(FamilyTree.unserializeParseNodes(serializedFtreeLayout),serializedFtreeLayout.centerNodeId)
  }

  /**
  Function computing x&y positions for each node

  the idea is:
  a) massage the family tree in a good input format for d3-pedigree-tree to do the layout
  b) then massage the output back in a proper layout for the family tree.

  step a):
  1) wives and husbands are filtered out
  2) their fams node takes their parents families (both famc) as their parents
  3) individual node take as parent their famc
  4) nodes without parents and at depth>0 are given dummy-parents so that d3-pedigree layouts them at the right depth
  5) we give those nodes to d3-pedigree-tree

  step b):
  1) invert x&y values (d3-pedigree-tree makes an horizontal layout)
  */
  computeLayout(){

    let nodes = this.nodesArray()
    this._computeDepths(nodes[0])
        
    let indiNodes = nodes.filter(n=>n.tag=="INDI")
    let dummyNodeId = 0
    let dummyNodes = []
    indiNodes.forEach((n) =>{delete n.parents})
    indiNodes.forEach((n) =>{
      let spouse = n.spouse() || {}
      if(spouse.parents){
        // parents are the same for both spouses
        n.parents = spouse.parents
      }else{
        if((!n.famc) && !spouse.famc){
          // if no ancestors for both parents: give them a virtual ancestor
          for(let i=-1;i<n.depth;i++){
            let dummyParents = i!=-1? [dummyNodes[dummyNodeId-1]]:[]
            dummyNodes.push({id:"@D"+dummyNodeId+"@",depth:i,parents:dummyParents})
            dummyNodeId++
          }
          n.parents = [dummyNodes[dummyNodeId-1]]
        }else{
          // otherwise, the ancestors are both spouses' parents
          n.parents = n.famc? [n.famc.wife,n.famc.husb] : []
          if(spouse && spouse.famc){
            n.parents.push(spouse.famc.wife)
            n.parents.push(spouse.famc.husb)
          }
          n.parents = n.parents.filter(Boolean)
        }
      }
      // couples without children must have a virtual kid to get them together
      if(n.spouse() && ((!n.fams[0].chil) || n.fams[0].chil.length==0) ){
        dummyNodes.push({id:"@D"+dummyNodeId+"@",depth:n.depth+1,parents:[n,spouse]})
        dummyNodeId++
      }
    })
    indiNodes= indiNodes.concat(dummyNodes)
    // ========= sort nodes by x factor
    indiNodes.sort((a,b)=> {
      let ax = a.x? a.x:0;
      let bx = b.x? b.x:0;
      return ax-bx;
    })

    let tree = d3.pedigreeTree()
      .levelWidth(150)
      .nodePadding(120)
      .linkPadding(25)
      .parents(function(d){
        return d.parents;
      })
      .groupChildless(false)
      .iterations(300)
      .data(indiNodes);
      
    let treepp = tree()
    treepp.nodes.forEach(node=>{
      if(this.nodes[node.id]){
        this.nodes[node.id].x = node.y
        this.nodes[node.id].y = node.x
      }
    })
    /*console.log("treepp.nodes")
    console.log(treepp.nodes)
    console.log("nodes")
    console.log(nodes)*/

    // position marriages
    let famNodes = nodes.filter(d => d.tag==="FAM")
    for(let fam of famNodes){
      if(fam.wife&&fam.husb){
        fam.x = (fam.wife.x+fam.husb.x)/2
        fam.y = fam.wife.y
      }else{
        let spouse = [fam.wife,fam.husb].filter(Boolean)[0]
        if(spouse){
          fam.x = spouse.x
          fam.y = spouse.y
        }
      }
    }

    // spouses can be reverted -> sort them according to famc.x
    for(let indi of nodes.filter(d => d.tag==="INDI")){
      let spouse = indi.spouse()
      if(indi.famc && spouse && spouse.famc){
        if(indi.x>spouse.x && indi.famc.x<spouse.famc.x){
          let tempx = indi.x
          indi.x=spouse.x
          spouse.x = tempx
        }
      }
    }
  }

  /*
  Re-centers the graph. position 0,0 is in the middle of all nodes position
  */
  center(horizontal = true, vertical = true){
    let xoffset = -(this.minX()+this.maxX()) / 2
    let yoffset = -(this.minY()+this.maxY()) / 2
    _.forEach(this.nodes, n=>{
      n.x += horizontal? xoffset : 0
      n.y +=   vertical? yoffset : 0
    })
    return this;
  }

  width(){
    let extent = d3.extent(_.map(this.nodes,n=>n.x))
    return extent[1]-extent[0];
  }
  height(){
    let extent = d3.extent(_.map(this.nodes,n=>n.y))
    return extent[1]-extent[0];
  }

  minX(){
    return d3.min(_.map(this.nodes,n=>n.x));
  }
  minY(){
    return d3.min(_.map(this.nodes,n=>n.y));
  }
  maxX(){
    return d3.max(_.map(this.nodes,n=>n.x));
  }
  maxY(){
    return d3.max(_.map(this.nodes,n=>n.y));
  }

}


