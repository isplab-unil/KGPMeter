"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KgpMeter = function KgpMeter(divId, apiUrl, lang) {
  _classCallCheck(this, KgpMeter);

  this.divId = divId;
  this.apiUrl = apiUrl;
  this.lang = lang;

  this.div = document.getElementById(this.divId);
  this.div.innerHTML = "<iframe src='{src}'></iframe>".replace("{src}", this.apiUrl);
};