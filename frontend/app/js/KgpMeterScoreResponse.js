"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KgpMeterScoreResponse = function () {
  function KgpMeterScoreResponse(status, timestamp_js, request, tree_signature) {
    var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

    _classCallCheck(this, KgpMeterScoreResponse);

    this.status = status;
    this.timestamp_js = timestamp_js;
    this.request = request;
    this.tree_signature = tree_signature;
    this.extras = extras;
  }

  _createClass(KgpMeterScoreResponse, null, [{
    key: "parseJSON",
    value: function parseJSON(json, request) {
      return KgpMeterScoreResponse.parse(JSON.parse(json), request);
    }
  }, {
    key: "parse",
    value: function parse(raw, request) {
      if (raw.status == "OK") {
        return new KgpMeterScoreSuccess(raw.timestamp_js, request, raw.tree_signature, raw.result.privacy_metric, raw.result.cached, raw.result.execution_time, raw.extras);
      } else if (raw.status == "error") {
        return new KgpMeterScoreError(raw.timestamp_js, request, raw.tree_signature, raw.code, raw.extras);
      } else {
        throw new Error({ "msg": "KgpMeterScoreResponse.parse(): argument raw is not a parsable KgpMeterScoreResponse.", "raw": raw });
      }
    }
  }]);

  return KgpMeterScoreResponse;
}();

var KgpMeterScoreSuccess = function (_KgpMeterScoreRespons) {
  _inherits(KgpMeterScoreSuccess, _KgpMeterScoreRespons);

  function KgpMeterScoreSuccess(timestamp_js, request, tree_signature, privacy_metric, cached, execution_time) {
    var extras = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : null;

    _classCallCheck(this, KgpMeterScoreSuccess);

    var _this = _possibleConstructorReturn(this, (KgpMeterScoreSuccess.__proto__ || Object.getPrototypeOf(KgpMeterScoreSuccess)).call(this, "OK", timestamp_js, request, tree_signature, extras));

    _this.result = {
      "privacy_metric": privacy_metric,
      "cached": cached,
      "execution_time": execution_time
    };
    _this.request = {}; // empty on initialisation, must be set later on
    return _this;
  }

  return KgpMeterScoreSuccess;
}(KgpMeterScoreResponse);

var KgpMeterScoreError = function (_KgpMeterScoreRespons2) {
  _inherits(KgpMeterScoreError, _KgpMeterScoreRespons2);

  function KgpMeterScoreError(timestamp_js, request, tree_signature, code) {
    var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

    _classCallCheck(this, KgpMeterScoreError);

    var _this2 = _possibleConstructorReturn(this, (KgpMeterScoreError.__proto__ || Object.getPrototypeOf(KgpMeterScoreError)).call(this, "error", timestamp_js, request, tree_signature, extras));

    _this2.code = code;
    return _this2;
  }

  return KgpMeterScoreError;
}(KgpMeterScoreResponse);

var KgpMeterScoreStale = function (_KgpMeterScoreRespons3) {
  _inherits(KgpMeterScoreStale, _KgpMeterScoreRespons3);

  function KgpMeterScoreStale(kgpResp) {
    _classCallCheck(this, KgpMeterScoreStale);

    var _this3 = _possibleConstructorReturn(this, (KgpMeterScoreStale.__proto__ || Object.getPrototypeOf(KgpMeterScoreStale)).call(this, "stale", kgpResp.timestamp_js, kgpResp.request, kgpResp.tree_signature, kgpResp.extras));

    _this3.staleResp = kgpResp;
    return _this3;
  }

  return KgpMeterScoreStale;
}(KgpMeterScoreResponse);