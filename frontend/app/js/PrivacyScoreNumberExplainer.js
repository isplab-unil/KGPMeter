"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PrivacyScoreNumberExplainer = function () {
  function PrivacyScoreNumberExplainer(parentId, i18n, i18nKey) {
    _classCallCheck(this, PrivacyScoreNumberExplainer);

    this.parentId = parentId;
    this.i18n = i18n;
    this.i18nKey = i18nKey;
    this.parent = $("#" + this.parentId);

    this.init();
  }

  _createClass(PrivacyScoreNumberExplainer, [{
    key: "init",
    value: function init() {
      this.parent.hide().html('<div class="alert alert-info text-justified"> \
      <i class="far fa-lightbulb"></i> \
      <span class="kgp-explainer-text"></span> \
    </div>');
      this.text = $("#" + this.parentId + " .kgp-explainer-text").attr(this.i18n.keyAttr, this.i18nKey);

      this.i18n.dynamic[this.i18nKey] = this.i18nFormat;
    }
  }, {
    key: "hide",
    value: function hide() {
      this.parent.stop(true).slideUp(500);
    }
  }, {
    key: "update",
    value: function update(privacyMeasure) {
      var transitionDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;

      if (this.parent.is(':hidden')) {
        this.parent.stop(true).slideDown(transitionDuration);
      }
      this.i18n.data(this.i18nKey, { privacy_metric: privacyMeasure });
      $("#" + this.parentId + " .alert").stop(true).slideDown(transitionDuration); //.fadeTo(5000, 500).slideUp(500)
    }

    /** await() puts the PrivacyWordedScore in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */

  }, {
    key: "await",
    value: function _await(kgpPromise, request, previousResponse) {
      var _this = this;

      kgpPromise.then(function (kgpSuccess) {
        _this.update(kgpSuccess.result.privacy_metric);
      }, function () {});
    }
  }, {
    key: "i18nFormat",
    value: function i18nFormat(text, data) {
      //"{#1}% de l’information génomique de la cible peut-être déduite. Son score de confidentialité est donc de {#2}%.",
      var score = Math.round(100 * data.privacy_metric);
      text = text.replace("{#1}", 100 - score);
      text = text.replace(/{#2(.+?)?}/, score);
      return text;
    }
  }]);

  return PrivacyScoreNumberExplainer;
}();