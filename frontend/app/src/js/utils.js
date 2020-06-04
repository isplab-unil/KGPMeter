
export function detectIE11() {
  if(navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf('Trident/') > -1){
    return true
  }
  return false
}

export function detectMobile() {
  if( navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i)){
    return true
  }
  return false
}

/** adds a 100ms without resize to window.onresize() before executing func (to avoid redraws every msec) */
export function onWindowResize(func,timeout=100){
  let doit;
  window.addEventListener("resize", function(){
    clearTimeout(doit);
    doit = setTimeout(func, timeout);
  })
}

const maxLogs = 10
const logs = []
const logUl = document.getElementById("touchscreen-debug")
export function log(...strargs){
  if(logUl){
    const str = strargs.reduce((a,b)=>a+b, "")
    logs.push("<li><strong>"+(new Date())+": </strong>"+str+"</li>")
    if(logs.length>maxLogs){
      logs.splice(0,logs.length-maxLogs)
    }
    logUl.innerHTML= logs.reduce((a,c)=>c+a,"")
  }else{
    console.log("utils.log() no logUl, log: ", ...strargs)
  }
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
export function addLinksToNodes(nodes, onlyId=true) {

  function getNodeFromId(nodes2, id) {
    return nodes2.filter(function (n) {
      return n.id === id;
    })[0];
  }

  function addLinksToNode(node) {
    var famc = getTagsData(node, "FAMC")[0];
    if (famc) {
      node.famc = onlyId ? famc : getNodeFromId(nodes, famc);
    }
    var husb = getTagsData(node, "HUSB")[0];
    if (husb) {
      node.husb = onlyId ? husb : getNodeFromId(nodes, husb);
    }
    var wife = getTagsData(node, "WIFE")[0];
    if (wife) {
      node.wife = onlyId ? wife : getNodeFromId(nodes, wife);
    }

    var fams = getTagsData(node, "FAMS");
    node.fams = onlyId ? fams : fams.map(function (nid) {
      return getNodeFromId(nodes, nid);
    });

    var chil = getTagsData(node, "CHIL");
    node.chil = onlyId ? chil : chil.map(function (nid) {
      return getNodeFromId(nodes, nid);
    });

    return node;
  }

  return nodes.map(addLinksToNode);
}



// gets an array of the data of all tags corresponding to the given tag
export function getTagsData(node, tag) {
  var tags = node.tree.filter(function (e) {
    return e.tag === tag;
  }) || [];
  return tags.map(function (t) {
    return t.data;
  });
}

/*
adds the chosen tag as an object property
note: Gedcom tags are uppercase, the object property key is the lowercased tag
*/
export function addTagToNode(node, tag, defaultValue) {
  var tagsData = getTagsData(node, tag);
  if (tagsData.length > 1) {
    node[tag.toLowerCase()] = tagsData;
  } else if (tagsData.length > 0) {
    node[tag.toLowerCase()] = tagsData[0];
  } else {
    node[tag.toLowerCase()] = defaultValue;
  }
}