"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TrashButton = function () {
  function TrashButton(domId, kgp) {
    var listeners = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, TrashButton);

    this.domId = domId;
    this.kgp = kgp;
    this.listeners = listeners;
    this.init();
  }

  _createClass(TrashButton, [{
    key: "init",
    value: function init() {
      d3.select("#" + this.domId).remove();
      // trash button
      this.trashButton = this.kgp.addSvgButton("\uF2ED", this.domId, "hint-trash", 0);
      var self = this;
      Object.keys(this.listeners).forEach(function (k) {
        return self.trashButton.on(k, self.listeners[k]);
      });
    }
  }, {
    key: "on",
    value: function on(event, listener) {
      this.listeners[event] = listener;
      this.trashButton.on(event, listener);
    }
  }]);

  return TrashButton;
}();

// 9.12.2019: untested and unused


var TrashButtonWithConfirmation = function () {
  /**
   * Creates the trash button
   */
  function TrashButtonWithConfirmation(domId, kgp) {
    var _this = this;

    var confirmListeners = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

    _classCallCheck(this, TrashButtonWithConfirmation);

    this.domId = domId;
    this.kgp = kgp;
    this.listeners = confirmListeners;
    d3.select("#" + domId).remove();
    // trash button
    var self = this;
    var trashButton = this.kgp.addSvgButton("\uF2ED", domId, "hint-trash", 0);
    trashButton.on("click.confirm", function (d) {
      trashButton.select(".tooltip").remove();
      var confirmDiv = trashButton.append("foreignObject").attr("x", 0).attr("y", 25).attr("width", 250).attr("height", 80).classed("tooltip", true).append("xhtml:div").classed("tooltip-text", true).html("<span style='display:block;' " + self.kgp.i18n.keyAttr + "='trash-sure'></span>");
      // cancel button
      confirmDiv.append("button").classed("btn btn-large btn-primary", true).attr("style", "float:center;margin:2px;").html('<span ' + self.kgp.i18n.keyAttr + '="trash-cancel"></span> <i class="fas fa-times"></i>').on("click.cancel", function (d) {
        new TrashButtonWithConfirmation(self.domId, self.kgp, self.listeners);
      });
      // confirm button
      _this.trashButton = confirmDiv.append("button").classed("btn btn-large btn-danger", true).attr("style", "float:center;margin:2px;").html('<span ' + self.kgp.i18n.keyAttr + '="trash-confirm"></span> <i class="far fa-trash-alt"></i>').on("click.listeners", function (d) {
        self.listeners.forEach(function (f) {
          return f(d);
        });
        new TrashButtonWithConfirmation(self.domId, self.kgp, self.listeners);
      });
      // weird: manual rfresh needed...
      self.i18n.refresh();
    });
  }

  _createClass(TrashButtonWithConfirmation, [{
    key: "on",
    value: function on(event, listener) {
      this.trashButton.on(event, listener);
    }
  }]);

  return TrashButtonWithConfirmation;
}();