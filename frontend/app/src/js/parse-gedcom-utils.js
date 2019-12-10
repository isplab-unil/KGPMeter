"use strict";


function parseGed(){
  let d3ized_ged = parseGedcom.d3ize(parseGedcom.parse(gedData))
  // add family links+sex to nodes
  d3ized_ged.nodes = addLinksToNodes(d3ized_ged.nodes)
  _.forEach(d3ized_ged.nodes, n => {addTagToNode(n,"SEX")})
  // transform d3izedgedcom.nodes array into dictionnary
  d3ized_ged.nodes = d3ized_ged.nodes.reduce((dic,node) => {dic[node.id] = node; return dic},{})
  ftree =  new FamilyTreeLayout(d3ized_ged.nodes)
}

/*
  takes care of adding to individuals nodes:
  - famc:famc_id the id of the parents' family node
  - fams:[fams_ids] array of ids of families this individual is a parent in
  ...and adding to family nodes:
  - husb
  - wife
  - chil:[] 
*/
function addLinksToNodes(nodes, onlyId = false){

  function addLinksToNode(node){
    let famc = getTagsData(node,"FAMC")[0]
    if(famc){
      node.famc = onlyId? famc : getNodeFromId(nodes, famc)
    }
    let husb = getTagsData(node,"HUSB")[0]
    if(husb){
      node.husb = onlyId? husb : getNodeFromId(nodes, husb)
    }
    let wife = getTagsData(node,"WIFE")[0]
    if(wife){
      node.wife = onlyId? wife : getNodeFromId(nodes, wife)
    }

    let fams = getTagsData(node,"FAMS")
    node.fams = onlyId? fams : fams.map(nid => getNodeFromId(nodes, nid))
    
    let chil = getTagsData(node,"CHIL")
    node.chil = onlyId? chil : chil.map(nid => getNodeFromId(nodes, nid))
    
    return node;
  }
  
  return nodes.map(addLinksToNode);
}

/*
adds the chosen tag as an object property
note: Gedcom tags are uppercase, the object property key is the lowercased tag
*/
function addTagToNode(node,tag,defaultValue){
  let tagsData = getTagsData(node,tag)
  if(tagsData.length>1){
    node[tag.toLowerCase()] = tagsData
  } else if(tagsData.length>0){
    node[tag.toLowerCase()] = tagsData[0]
  }else{ 
    node[tag.toLowerCase()] = defaultValue
  }
}

// gets an array of the data of all tags corresponding to the given tag
function getTagsData(node,tag) {
  var tags = (node.tree.filter(e => e.tag ===tag) || []);
  return tags.map(t=>t.data);
}

function getNodeFromId(nodes,id) {
  return nodes.filter(n=>n.id===id)[0];
}

function toGedcomId(idnb,type="I"){
  return "@"+type+idnb+"@"
}


function addSpouseMethod(n){
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


// Utility function
function sleep(milliseconds) {
  let start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break
    }
  }
}

function detectMobile() {
  if( navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i)){
    return true
  }
  return false
}

function detectIE11() {
  if(navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf('Trident/') > -1){
    return true
  }
  return false
}

