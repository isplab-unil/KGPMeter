import {FamilyTreeLayout} from "./FamilyTreeLayout.js"


export class GedcomImportButton{
  constructor(buttonDomId, inputId, kgp, maxNbGenerations=5, maxIndiNodesInGedcom=30, maxGedcomFileSize=1024**2){
    this.kgp=kgp
    this.domId=buttonDomId
    this.inputId=inputId
    this.maxNbGenerations=maxNbGenerations
    this.maxIndiNodesInGedcom=maxIndiNodesInGedcom
    this.maxGedcomFileSize=maxGedcomFileSize
    const self=this
    
    // listen to file import event (=input change)
    const inputElement = document.getElementById(this.inputId);
    inputElement.addEventListener("change", function(){self.importFile(this.files)}, false);

    this.init()
  }
  init(){
    d3.select("#"+this.domId).remove()

    // adding button
    this.button = this.kgp.addSvgButton("\uf0e8",this.domId,"gedcom-upload-hint",0,57, 28, 0, 160)
    this.button.on("click", function(e){
      const fileInput = document.getElementById("load-gedcom");
      if (fileInput) {
        fileInput.click();
      }
    })
  }

  importFile(files){
    if(files[0].size>this.maxGedcomFileSize){
      self.kgp.backendStatus.displayWarning("gedcom-info-1")
    }else{
      const self=this
      const reader = new FileReader();
      reader.onload = function (e) {
        const gedFtree = FamilyTreeLayout.unserializeGedcom(e.target.result)
        let minIndiNodeId = gedFtree.nodesArray().filter(n=>n.tag=="INDI").map(n=>n.id).sort()[0]
        const truncatedUnconnectedNodes = gedFtree.removeNodesNotConnectedTo(minIndiNodeId)
        const truncatedNbGen = gedFtree.truncateToNgenerations(minIndiNodeId, self.maxNbGenerations)
        const truncatedNbNodes = gedFtree.truncateToMaxNbNodes(minIndiNodeId, self.maxIndiNodesInGedcom)
        gedFtree.removeNodesNotConnectedTo(minIndiNodeId)
        const removedNodes = truncatedUnconnectedNodes.length>0 || truncatedNbGen.length>0 || truncatedNbNodes.length>0
        console.log("GIB.importFile() truncatedUnconnectedNodes:", truncatedUnconnectedNodes, ", truncatedNbGen:", truncatedNbGen, ", truncatedNbNodes:",truncatedNbNodes)
        kgp.reset(800, gedFtree,800, minIndiNodeId)
        if(removedNodes){
          self.kgp.backendStatus.displayInfo("gedcom-info-2")
          setTimeout(function(){
            self.kgp.backendStatus.displayWarning("response-error-9",30000)
          },5002)
        }else{
          self.kgp.backendStatus.displayWarning("response-error-9",30000)
        }
      };


      reader.readAsText(files[0]);
    }
  }
}