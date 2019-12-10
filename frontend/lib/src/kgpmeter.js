"use strict";


class KgpMeter{
  constructor(divId, apiUrl, lang){
    this.divId = divId
    this.apiUrl = apiUrl
    this.lang = lang

    this.div = document.getElementById(divId)
    this.div.innerHTML = "<iframe src='{src}/app/'></iframe>".replace("{src}",this.apiUrl)
  }
}