


export class KgpBackendStatus{
  constructor(parentId, i18n){
    this.parentId = parentId
    this.i18n = i18n

    this.init()
  }

  init(){
    document.getElementById(this.parentId).innerHTML = ' \
    <div class="alert" style="display:none"><div class="kgp-alert-content"></div></div> '
    /*
    <div class="alert alert-success" style="display:none" id="response-success"><div class="alert-content" data-i18n="response-success"></div></div>
    <div class="alert alert-info" style="display:none" id="response-info"><div class="alert-content"></div></div>
    <div class="alert alert-warning" style="display:none" id="response-warning"><div class="alert-content"></div></div>
    <div class="alert alert-danger" style="display:none" id="response-danger"><div class="alert-content"></div></div>
    '*/
    this.element = $("#"+this.parentId+" .alert")
    this.content = $("#"+this.parentId+" .kgp-alert-content")
    this.i18n.dynamic["response-success"] = this.i18nFormatSuccessMessage
  }

  /** awaitScore() puts the KgpBackendStatus in a waiting state and updates it properly once the promise has fulfilled */
  awaitScore(kgpPromise, request, previousResponse){
    let self = this
    this.displayOngoing()
    return kgpPromise.then(kgpSuccess=>{
      // success
      let same_signature = previousResponse.tree_signature == kgpSuccess.tree_signature
      if((!previousResponse.tree_signature) || (!kgpSuccess.tree_signature)){
        same_signature = Math.abs(previousResponse.result.privacy_metric - kgpSuccess.result.privacy_metric) <= 10**(-6)
      }
      self.displaySuccess(
        kgpSuccess.result.privacy_metric,
        kgpSuccess.result.execution_time,
        kgpSuccess.result.cached,
        same_signature
      )  
    }).catch(kgpError=>{
      if(kgpError.status=="error"){
        // error code 2
        if(kgpError.code==2){
          self.displayDanger("response-error-"+kgpError.code)
          self.i18n.data("response-error-2",[kgpError.extras.error_identifier])
        }
        // error code 4
        else if(kgpError.code==4){
          self.displayInfo("response-error-4",100000)
        }
        // error code 5
        else if(kgpError.code==5){
          self.displayDanger("response-error-5")
        }
        // other error codes
        else{
          self.displayWarning("response-error-"+kgpError.code)
        }
      }
    })
  }


  hide(){
    // Hide the previous alert + explainer
    this.content.attr(this.i18n.dataAttr,null)
    this.element.stop(true).hide().removeClass("alert-success alert-info alert-warning alert-danger")
  }

  /** Display the result message from the server */
  displayMessage(type, messageKey, timeout){
    this.hide()
    this.element.addClass("alert-"+type)
    this.content.attr(this.i18n.keyAttr,messageKey)
    this.element.stop(true).slideDown(500).fadeTo(timeout, 500).slideUp(500)
  }

  displayOngoing(){
    this.hide()
    this.element.addClass("alert-warning")
    this.content.attr(this.i18n.keyAttr,"response-ongoing")
    this.element.slideDown(500);
  }

  displayWarning(messageKey, timeout=5000){
    this.displayMessage("warning", messageKey, timeout);
  }
  
  displayInfo(messageKey, timeout=5000){
    this.displayMessage("info", messageKey, timeout);
  }

  displayDanger(errorKey, timeout=5000){
    this.displayMessage("danger", errorKey, timeout)
  }


  displaySuccess(score, time, cached, similar, timeout=5000){
    this.hide()
    this.element.addClass("alert-success")
    this.content.attr(this.i18n.keyAttr,"response-success")
    this.i18n.data("response-success",{
      time:time.toFixed(2),
      cached:cached,
      similar:similar
    })
    this.element.stop(true).slideDown(500).fadeTo(timeout, 500).slideUp(500)
  }

  /** success formatter function for i18n */
  i18nFormatSuccessMessage(text, data){
    //"Réponse calculée en {#1} secondes{#2 (en cache)}.{#3 Le score est inchangé, <a href='../faq#change' target='_blank'>en savoir plus</a>.}",
    text = text.replace("{#1}",data.time)
    text = text.replace(/({#2(.+?);(.*?)})/,data.cached==1? "$2":"$1")
    text = text.replace(/({#2(.+?);(.*?)})/,data.cached==2? "$3":"$2")
    text = text.replace(/{#3(.+?)}/,data.similar? "$1":"")
    return text
  }
}