"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KgpMeter = function KgpMeter(divId, apiUrl, lang) {
  _classCallCheck(this, KgpMeter);

  this.divId = divId;
  this.apiUrl = apiUrl;
  this.lang = lang;

  this.div = document.getElementById(divId);
  this.div.innerHTML = "<iframe src='{src}/app/'></iframe>".replace("{src}", this.apiUrl);
  this.iframe = this.div.getElementsByTagName("iframe")[0];
  this.iframe.setAttribute("style", 'border:none; width:100%; height:100%;');
};