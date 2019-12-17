"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PrivacyBackendStatus = function () {
  function PrivacyBackendStatus(parentId, i18n) {
    _classCallCheck(this, PrivacyBackendStatus);

    this.parentId = parentId;
    this.i18n = i18n;

    this.init();
  }

  _createClass(PrivacyBackendStatus, [{
    key: "init",
    value: function init() {
      document.getElementById(this.parentId).innerHTML = ' \
    <div class="alert" style="display:none"><div class="kgp-alert-content"></div></div> ';
      /*
      <div class="alert alert-success" style="display:none" id="response-success"><div class="alert-content" data-i18n="response-success"></div></div>
      <div class="alert alert-info" style="display:none" id="response-info"><div class="alert-content"></div></div>
      <div class="alert alert-warning" style="display:none" id="response-warning"><div class="alert-content"></div></div>
      <div class="alert alert-danger" style="display:none" id="response-danger"><div class="alert-content"></div></div>
      '*/
      this.element = $("#" + this.parentId + " .alert");
      this.content = $("#" + this.parentId + " .kgp-alert-content");
      this.i18n.dynamic["response-success"] = this.i18nFormatSuccessMessage;
    }

    /** await() puts the PrivacyBackendStatus in a waiting state and updates it properly once the promise has fulfilled */

  }, {
    key: "await",
    value: function _await(kgpPromise, request, previousResponse) {
      var self = this;
      this.displayOngoing();
      return kgpPromise.then(function (kgpSuccess) {
        // success
        var same_signature = previousResponse.tree_signature == kgpSuccess.tree_signature;
        self.displaySuccess(kgpSuccess.result.privacy_metric, kgpSuccess.result.execution_time, kgpSuccess.result.cached, same_signature);
      }).catch(function (kgpError) {
        if (kgpError.status == "error") {
          // error code 2
          if (kgpError.code == 2) {
            self.displayDanger("response-error-" + kgpError.code);
            self.i18n.data("response-error-2", [kgpError.extras.error_identifier]);
          }
          // error code 4
          else if (kgpError.code == 4) {
              self.displayInfo("response-error-4", 100000);
            }
            // error code 5
            else if (kgpError.code == 5) {
                self.displayDanger("response-error-5");
              }
              // other error codes
              else {
                  self.displayWarning("response-error-" + kgpError.code);
                }
        }
      });
    }
  }, {
    key: "hide",
    value: function hide() {
      // Hide the previous alert + explainer
      this.content.attr(this.i18n.dataAttr, null);
      this.element.stop(true).hide().removeClass("alert-success alert-info alert-warning alert-danger");
    }

    /** Display the result message from the server */

  }, {
    key: "displayMessage",
    value: function displayMessage(type, messageKey, timeout) {
      this.hide();
      this.element.addClass("alert-" + type);
      this.content.attr(i18n.keyAttr, messageKey);
      this.element.stop(true).slideDown(500).fadeTo(timeout, 500).slideUp(500);
    }
  }, {
    key: "displayOngoing",
    value: function displayOngoing() {
      this.hide();
      this.element.addClass("alert-warning");
      this.content.attr(this.i18n.keyAttr, "response-ongoing");
      this.element.slideDown(500);
    }
  }, {
    key: "displayWarning",
    value: function displayWarning(messageKey) {
      var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;

      this.displayMessage("warning", messageKey, timeout);
    }
  }, {
    key: "displayInfo",
    value: function displayInfo(messageKey) {
      var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;

      this.displayMessage("info", messageKey, timeout);
    }
  }, {
    key: "displayDanger",
    value: function displayDanger(errorKey) {
      var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;

      this.displayMessage("danger", errorKey, timeout);
    }
  }, {
    key: "displaySuccess",
    value: function displaySuccess(score, time, cached, similar) {
      var timeout = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 5000;

      this.hide();
      this.element.addClass("alert-success");
      this.content.attr(i18n.keyAttr, "response-success");
      this.i18n.data("response-success", {
        time: time.toFixed(2),
        cached: cached,
        similar: similar
      });
      this.element.stop(true).slideDown(500).fadeTo(timeout, 500).slideUp(500);
    }

    /** success formatter function for i18n */

  }, {
    key: "i18nFormatSuccessMessage",
    value: function i18nFormatSuccessMessage(text, data) {
      //"Réponse calculée en {#1} secondes{#2 (en cache)}.{#3 Le score est inchangé, <a href='../faq#change' target='_blank'>en savoir plus</a>.}",
      text = text.replace("{#1}", data.time);
      text = text.replace(/{#2(.+?)}/, data.cached ? "$1" : "");
      text = text.replace(/{#3(.+?)}/, data.similar ? "$1" : "");
      return text;
    }
  }]);

  return PrivacyBackendStatus;
}();