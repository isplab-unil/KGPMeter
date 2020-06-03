import {FamilyTreeLayout} from "./FamilyTreeLayout.js"


export class GedcomImportButton{
  constructor(buttonDomId, inputId, kgp, maxIndiNodesInGedcom=30){
    this.kgp=kgp
    this.domId=buttonDomId
    this.inputId=inputId
    this.maxIndiNodesInGedcom=maxIndiNodesInGedcom
    const self=this
    console.log("GedcomImportButton. constructor()")
    
    // listen to file import event (=input change)
    const inputElement = document.getElementById(this.inputId);
    inputElement.addEventListener("change", function(){self.importFile(this.files)}, false);

    this.init()
  }
  init(){
    console.log("GedcomImportButton.init()")
    d3.select("#"+this.domId).remove()

    // adding button
    this.button = this.kgp.addSvgButton("\uf0e8",this.domId,"gedcom-upload-hint",0,57, 28, 0, 120)
    this.button.on("click", function(e){
      const fileInput = document.getElementById("load-gedcom");
      if (fileInput) {
        fileInput.click();
      }
    })
  }

  importFile(files){
    const self=this
    const reader = new FileReader();
    reader.onload = function (e) {
      console.log("GEDCOM LOADED");
      console.log("content:\n" + e.target.result);
      const gedFtree = FamilyTreeLayout.unserializeGedcom(e.target.result)
      let minIndiNodeId = gedFtree.nodesArray().filter(n=>n.tag=="INDI").map(n=>n.id).sort()[0]
      gedFtree.truncateToMaxNbNodes(minIndiNodeId, self.maxIndiNodesInGedcom)
      kgp.reset(800, gedFtree,800, minIndiNodeId)
    };


    reader.readAsText(files[0]);
  }
}
