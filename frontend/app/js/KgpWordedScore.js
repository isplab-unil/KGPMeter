"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KgpWordedScore = exports.KgpWordedScore = function () {
  function KgpWordedScore(parentId, id, elementClass, x, y, height, colorScale, i18n, i18nKey) {
    _classCallCheck(this, KgpWordedScore);

    this.parentId = parentId;
    this.id = id;
    this.elementClass = elementClass;
    this.x = x;
    this.y = y;
    this.height = height;
    this.colorScale = colorScale;
    this.i18n = i18n;
    this.i18nKey = i18nKey;
    this.privacyStatus = 1;

    this.init();
  }

  _createClass(KgpWordedScore, [{
    key: "init",
    value: function init() {
      var self = this;

      d3.select("#" + this.id).remove();

      this.text = d3.select("#" + this.parentId).append("text").attr("x", this.x).attr("y", this.y).attr("height", this.height).attr("text-anchor", "end").attr("fill", "darkgrey").attr("id", this.id).attr("class", this.elementClass)
      //TODO: fix i18n.keyAttr reference
      .attr(this.i18n.keyAttr, self.i18nKey);
      this.scale = d3.scaleLinear().range([self.height, 0]).domain([0, 1]);

      this.i18n.dynamic[self.i18nKey] = function (t, d) {
        return self.i18nFormat(t, d);
      };
      this.hide(0);
    }
  }, {
    key: "hide",
    value: function hide() {
      var transitionDuration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3000;

      this.text.transition(transitionDuration).attr("opacity", 0);
    }

    /** update() updates the KgpWordedScore with a new score */

  }, {
    key: "update",
    value: function update(privacyMeasure) {
      var transitionDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3000;

      var self = this;
      //TODO: use a proper instance nbBoxes...
      if (privacyMeasure > 0.99) {
        this.privacyStatus = 100;
      } else if (privacyMeasure >= 0.8) {
        this.privacyStatus = 5;
      } else if (privacyMeasure >= 0.6) {
        this.privacyStatus = 4;
      } else if (privacyMeasure >= 0.4) {
        this.privacyStatus = 3;
      } else if (privacyMeasure >= 0.2) {
        this.privacyStatus = 2;
      } else {
        this.privacyStatus = 1;
      }
      //if(kgp.target){
      this.text.attr("opacity", 0.2).transition(transitionDuration).attr("opacity", 1);
      this.i18n.data(this.i18nKey, this.privacyStatus);
      setTimeout(function () {
        return d3.select("#" + self.id + " tspan").attr("fill", self.colorScale(privacyMeasure));
      }, 50);
      /*} else{
        this.hide()
      }*/
    }

    /** await() puts the KgpWordedScore in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */

  }, {
    key: "await",
    value: function _await(kgpPromise, request, previousResponse) {
      var _this = this;

      if (this.text.attr("opacity") == 1) {
        this.text.transition(200).attr("opacity", 0.5);
      }

      kgpPromise.then(function (kgpSuccess) {
        _this.update(kgpSuccess.result.privacy_metric);
      }, function () {});
    }
  }, {
    key: "i18nFormat",
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(text, data) {
        var qualifier;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.i18n.t("privacy-bar-score-" + data);

              case 2:
                qualifier = _context.sent;
                return _context.abrupt("return", text.replace("{}", qualifier ? qualifier : "..."));

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function i18nFormat(_x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return i18nFormat;
    }()
  }]);

  return KgpWordedScore;
}();