"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KgpScoreResponse = exports.KgpScoreResponse = function () {
  function KgpScoreResponse(status, timestamp_js, request, tree_signature) {
    var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

    _classCallCheck(this, KgpScoreResponse);

    this.status = status;
    this.timestamp_js = timestamp_js;
    this.request = request;
    this.tree_signature = tree_signature;
    this.extras = extras;
  }

  _createClass(KgpScoreResponse, null, [{
    key: "parseJSON",
    value: function parseJSON(json, request) {
      return KgpScoreResponse.parse(JSON.parse(json), request);
    }
  }, {
    key: "parse",
    value: function parse(raw, request) {
      if (raw.status == "OK") {
        return new KgpScoreSuccess(raw.timestamp_js, request, raw.tree_signature, raw.result.privacy_metric, raw.result.cached, raw.result.execution_time, raw.extras);
      } else if (raw.status == "error") {
        return new KgpScoreError(raw.timestamp_js, request, raw.tree_signature, raw.code, raw.extras);
      } else {
        throw new Error({ "msg": "KgpScoreResponse.parse(): argument raw is not a parsable KgpScoreResponse.", "raw": raw });
      }
    }
  }]);

  return KgpScoreResponse;
}();

var KgpScoreSuccess = exports.KgpScoreSuccess = function (_KgpScoreResponse) {
  _inherits(KgpScoreSuccess, _KgpScoreResponse);

  function KgpScoreSuccess(timestamp_js, request, tree_signature, privacy_metric, cached, execution_time) {
    var extras = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;

    _classCallCheck(this, KgpScoreSuccess);

    var _this = _possibleConstructorReturn(this, (KgpScoreSuccess.__proto__ || Object.getPrototypeOf(KgpScoreSuccess)).call(this, "OK", timestamp_js, request, tree_signature, extras));

    _this.result = {
      "privacy_metric": privacy_metric,
      "cached": cached,
      "execution_time": execution_time
    };
    _this.request = {}; // empty on initialisation, must be set later on
    return _this;
  }

  return KgpScoreSuccess;
}(KgpScoreResponse);

var KgpScoreError = exports.KgpScoreError = function (_KgpScoreResponse2) {
  _inherits(KgpScoreError, _KgpScoreResponse2);

  function KgpScoreError(timestamp_js, request, tree_signature, code) {
    var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

    _classCallCheck(this, KgpScoreError);

    var _this2 = _possibleConstructorReturn(this, (KgpScoreError.__proto__ || Object.getPrototypeOf(KgpScoreError)).call(this, "error", timestamp_js, request, tree_signature, extras));

    _this2.code = code;
    return _this2;
  }

  return KgpScoreError;
}(KgpScoreResponse);

var KgpScoreStale = exports.KgpScoreStale = function (_KgpScoreResponse3) {
  _inherits(KgpScoreStale, _KgpScoreResponse3);

  function KgpScoreStale(kgpResp) {
    _classCallCheck(this, KgpScoreStale);

    var _this3 = _possibleConstructorReturn(this, (KgpScoreStale.__proto__ || Object.getPrototypeOf(KgpScoreStale)).call(this, "stale", kgpResp.timestamp_js, kgpResp.request, kgpResp.tree_signature, kgpResp.extras));

    _this3.staleResp = kgpResp;
    return _this3;
  }

  return KgpScoreStale;
}(KgpScoreResponse);