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

  var self = this;

  // =================================== TEST iframe to parent communication and vice-versa ===================================

  // parent to iframe:
  setTimeout(function () {
    var data = { orientation: 'down' };
    var event = new CustomEvent('myCustomEvent', { detail: data });
    self.iframe.contentDocument.dispatchEvent(event);
  }, 500);

  // iframe to parent
  function handleEvent(e) {
    console.log("Communication kgp-iframe to kgpmeter success! detail:", e.detail); // outputs: {foo: 'bar'}
  }
  window.document.addEventListener('myCustomEvent', handleEvent, false);
};