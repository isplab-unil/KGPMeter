


export class KgpScoreNumberExplainer{
  constructor(parentId, i18n, i18nKey, hideWhenNoTargetOrNoOneSequenced = true){
    this.parentId = parentId
    this.i18n = i18n
    this.i18nKey = i18nKey
    this.parent = $("#"+this.parentId)
    this.hideWhenNoTargetOrNoOneSequenced = hideWhenNoTargetOrNoOneSequenced

    this.init()
  }

  init(){
    this.parent.html(
    '<div class="alert alert-info text-justified"> \
      <i class="far fa-lightbulb"></i> \
      <span class="kgp-explainer-text"></span> \
    </div>')
    this.div = $("#"+this.parentId+" .alert").hide()
    this.text = $("#"+this.parentId+" .kgp-explainer-text").attr(this.i18n.keyAttr,this.i18nKey)

    this.i18n.dynamic[this.i18nKey] = this.i18nFormat
  }

  hide(){
    this.div.stop(true).slideUp(500)
  }

  update(privacyMeasure, transitionDuration=500){
    this.i18n.data(this.i18nKey,{privacy_metric:privacyMeasure})
    this.div.stop(true).slideDown(transitionDuration)//.fadeTo(5000, 500).slideUp(500)
  }

  /** awaitScore() puts the KgpWordedScore in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */
  awaitScore(kgpPromise, request, previousResponse){
    if( this.hideWhenNoTargetOrNoOneSequenced && ((!request.family_tree.target) || (request.family_tree.sequenced_relatives.length==0))){
      this.hide(500)
    }else{
      kgpPromise.then(kgpSuccess=>{
        this.update(kgpSuccess.result.privacy_metric)
      },()=>{})
    }
  }

  i18nFormat(text, data){
    //"{#1}% de l’information génomique de la cible peut-être déduite. Son score de confidentialité est donc de {#2}%.",
    let score = Math.round(100*data.privacy_metric)
    text = text.replace("{#1}",100-score)
    text = text.replace(/{#2(.+?)?}/,score)
    return text
  }
}


