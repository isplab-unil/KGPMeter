"use strict";


class KgpMeter{
  constructor(divId, apiUrl, lang){
    this.divId = divId
    this.apiUrl = apiUrl
    this.lang = lang

    this.div = document.getElementById(this.divId)
    this.div.innerHTML = "<iframe src='{src}'></iframe>".replace("{src}",this.apiUrl)
  }
}