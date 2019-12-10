"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var privacyBar = void 0;
var privacyWordedScore = void 0;
var privacyBackendStatus = void 0;
var privacyScoreNumberExplainer = void 0;
var kgpMeterScoreRequestHandler = void 0;

var PrivacyBar = function () {
  function PrivacyBar(parentId, id, x, y, width, height, r, colorScale, i18n) {
    var nbBoxes = arguments.length > 9 && arguments[9] !== undefined ? arguments[9] : 5;
    var strokeWidth = arguments.length > 10 && arguments[10] !== undefined ? arguments[10] : 4;
    var elementClass = arguments.length > 11 && arguments[11] !== undefined ? arguments[11] : "privacy-bar-element";
    var backgroundColor = arguments.length > 12 && arguments[12] !== undefined ? arguments[12] : "rgb(230,230,230)";

    _classCallCheck(this, PrivacyBar);

    this.parentId = parentId;
    this.id = id;
    this.width = width;
    this.height = height;
    this.r = r;
    this.nbBoxes = nbBoxes;
    this.strokeWidth = strokeWidth;
    this.colorScale = colorScale;
    this.elementClass = elementClass;
    this.backgroundColor = backgroundColor;
    this.privacyStatus = 1;
    this.i18n = i18n;

    this.init(x, y, 0);
  }

  _createClass(PrivacyBar, [{
    key: "init",
    value: function init(x, y) {
      var transitionDuration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;

      if (x || x === 0) {
        this.x = x;
      }
      if (y || y === 0) {
        this.y = y;
      }

      var self = this;
      this.g = d3.select("#" + this.parentId).append("g").attr("transform", "translate(" + self.x + "," + self.y + ")").attr("id", this.id);

      var startColor = this.colorScale(1);
      var barBasis = '<rect x="0" y="0" rx="' + this.r + '" ry="' + this.r + '" height="' + this.height + '" width="' + this.width + '"';
      this.g.html(barBasis + ' fill="' + this.backgroundColor + '" class="privacy-bar-background ' + this.elementClass + '"/>' + barBasis + ' fill="' + startColor + '" class="privacy-bar ' + this.elementClass + '" />');
      this.bar = this.g.select(".privacy-bar");

      var boxSize = this.height / this.nbBoxes;
      var yboxes = d3.range(0, this.height, boxSize);
      this.boxesG = this.g.append("g").attr("id", "privacy-bar-contour-group");
      this.boxesG.selectAll("rect").data(yboxes).enter().append("rect").attr("class", "privacy-bar-contour").attr("x", "0").attr("y", function (d) {
        return d;
      }).attr("rx", 5).attr("ry", 5).attr("width", this.width).attr("height", boxSize).attr("fill", "none").attr("stroke", "white").attr("stroke-width", this.strokeWidth + 'px');

      this.g.append("text").attr("x", +this.width).attr("y", -16).attr("height", 20).attr("text-anchor", "end").attr("fill", "darkgrey").attr("id", "privacy-bar-title").attr("class", this.elementClass).attr(this.i18n.keyAttr, "privacy-bar-title");
      this.scale = d3.scaleLinear().range([this.height, 0]).domain([0, 1]);

      if (this.showScoreValue) {
        this.scoreG = this.g.append("g").attr("transform", "translate(0,3)").attr("id", "privacy-score");
        this.scoreG.html('<polygon points="-10,-6 -4,0 -10,6" fill="' + startColor + '"/>' + '<text x="-14" y="5" fill="black" text-anchor="end">100%</text> <!--uncomment to see privacy-score value-->');
        this.scorePolygon = d3.select("#privacy-score polygon");
        this.text = d3.select("#privacy-score text");
      }

      this.elements = d3.selectAll("." + this.elementClass);
      this.update(1, transitionDuration);
    }

    /** update() updates the PrivacyBar with a new score */

  }, {
    key: "update",
    value: function update(privacyMeasure) {
      var transitionDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;

      this.privacyStatus = privacyMeasure;
      var transition = d3.transition().duration(transitionDuration).ease(function (t) {
        return d3.easeBackOut(t, 0.8);
      });
      this.bar.transition(transition).attr("fill", this.colorScale(privacyMeasure)).attr("y", this.scale(privacyMeasure)).attr("height", this.height - this.scale(this.privacyStatus));

      this.elements.transition(200).attr("opacity", 1);
      // show score value
      if (this.showScoreValue) {
        this.scoreG.transition(transition) //d3.easeBackOut)//d3.easeExpInOut)//d3.easeCubicIn)
        .attr("transform", "translate(0," + Math.max(this.scale(privacyMeasure), 4) + ")");
        this.scorePolygon.transition(transition).attr("fill", this.colorScale(privacyMeasure));
        this.text.html((100 * privacyMeasure).toFixed(0) + "%");
      }
    }

    /** await() puts the PrivacyBar in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */

  }, {
    key: "await",
    value: function _await(kgpPromise, request, previousResponse) {
      var _this = this;

      this.elements.transition(200).attr("opacity", 0.5);
      kgpPromise.then(function (kgpSuccess) {
        _this.update(kgpSuccess.result.privacy_metric);
      }).catch(function (kgpr) {
        if (kgpr.status == "error") {
          if (kgpr.code == 4) {
            _this.elements.transition(200).attr("opacity", 1);
          }
        }
      });
    }
  }]);

  return PrivacyBar;
}();

var PrivacyWordedScore = function () {
  function PrivacyWordedScore(parentId, id, elementClass, x, y, height, colorScale, i18n, i18nKey) {
    _classCallCheck(this, PrivacyWordedScore);

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

  _createClass(PrivacyWordedScore, [{
    key: "init",
    value: function init() {
      var self = this;

      d3.select("#" + this.id).remove();

      this.text = d3.select("#" + this.parentId).append("text").attr("x", this.x).attr("y", this.y).attr("height", this.height).attr("text-anchor", "end").attr("fill", "darkgrey").attr("id", this.id).attr("class", this.elementClass)
      //TODO: fix i18n.keyAttr reference
      .attr(this.i18n.keyAttr, self.i18nKey);
      this.scale = d3.scaleLinear().range([self.height, 0]).domain([0, 1]);

      this.i18n.dynamic[self.i18nKey] = this.i18nFormat;
      this.hide(0);
    }
  }, {
    key: "hide",
    value: function hide() {
      var transitionDuration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3000;

      this.text.transition(transitionDuration).attr("opacity", 0);
    }

    /** update() updates the PrivacyWordedScore with a new score */

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

    /** await() puts the PrivacyWordedScore in a waiting state (opacity=0.5) and updates it properly once the promise has fulfilled */

  }, {
    key: "await",
    value: function _await(kgpPromise, request, previousResponse) {
      var _this2 = this;

      if (this.text.attr("opacity") == 1) {
        this.text.transition(200).attr("opacity", 0.5);
      }

      kgpPromise.then(function (kgpSuccess) {
        _this2.update(kgpSuccess.result.privacy_metric);
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
                return i18n.t("privacy-bar-score-" + data);

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

      function i18nFormat(_x9, _x10) {
        return _ref.apply(this, arguments);
      }

      return i18nFormat;
    }()
  }]);

  return PrivacyWordedScore;
}();

var KgpMeterScoreRequestHandler = function () {
  function KgpMeterScoreRequestHandler(api_endpoint) {
    _classCallCheck(this, KgpMeterScoreRequestHandler);

    this.api_endpoint = api_endpoint;
    this.lastRequest = {};
    // necessary dummy
    this.latestResponse = new KgpMeterScoreSuccess(-1, {}, "", 1.0001, 0, 0, 0);
    this.listeners = [];
  }

  /** Adds a listener to requests, returns true if not already in array*/


  _createClass(KgpMeterScoreRequestHandler, [{
    key: "addListener",
    value: function addListener(listener) {
      if (!this.listeners.includes(listener)) {
        this.listeners.push(listener);
        return true;
      }
      return false;
    }
    /** remove a listener to requests, returns removed listener */

  }, {
    key: "removeListener",
    value: function removeListener(listener) {
      var index = this.listeners.indexOf(listener);
      if (index != -1) {
        return this.listeners.splice(index, 1);
      }
      return [];
    }
  }, {
    key: "requestScore",
    value: function requestScore(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng) {
      var silent = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;

      var self = this;
      var currentRequest = new KgpMeterScoreRequest(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng);
      var previousResponse = this.latestResponse;
      this.lastRequest = currentRequest;

      var kgpPromise = fetch(self.api_endpoint, {
        method: 'POST',
        body: JSON.stringify(currentRequest)
      }).then(function (resp) {
        return resp.json();
      })
      // handle connexion error
      .catch(function () {
        return Promise.reject(new KgpMeterScoreError(currentRequest.timestamp_js, currentRequest, null, 5, { "message": 'Erreur de connexion au serveur.' }));
      })
      // parse response
      .then(function (json) {
        var kgpr = KgpMeterScoreResponse.parse(json, currentRequest);
        // check if it's stale or not
        if (kgpr.timestamp_js != self.lastRequest.timestamp_js) {
          return Promise.reject(new KgpMeterScoreStale(kgpr));
        }
        // if it's an error -> reject
        if (kgpr.status == "error") {
          return Promise.reject(kgpr);
        }
        // success!
        self.latestResponse = kgpr;
        return kgpr;
      });

      if (!silent) {
        this.listeners.forEach(function (l) {
          return l(kgpPromise, currentRequest, previousResponse);
        });
      }

      return kgpPromise;
    }
  }]);

  return KgpMeterScoreRequestHandler;
}();

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

    var _this3 = _possibleConstructorReturn(this, (KgpMeterScoreSuccess.__proto__ || Object.getPrototypeOf(KgpMeterScoreSuccess)).call(this, "OK", timestamp_js, request, tree_signature, extras));

    _this3.result = {
      "privacy_metric": privacy_metric,
      "cached": cached,
      "execution_time": execution_time
    };
    _this3.request = {}; // empty on initialisation, must be set later on
    return _this3;
  }

  return KgpMeterScoreSuccess;
}(KgpMeterScoreResponse);

var KgpMeterScoreError = function (_KgpMeterScoreRespons2) {
  _inherits(KgpMeterScoreError, _KgpMeterScoreRespons2);

  function KgpMeterScoreError(timestamp_js, request, tree_signature, code) {
    var extras = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

    _classCallCheck(this, KgpMeterScoreError);

    var _this4 = _possibleConstructorReturn(this, (KgpMeterScoreError.__proto__ || Object.getPrototypeOf(KgpMeterScoreError)).call(this, "error", timestamp_js, request, tree_signature, extras));

    _this4.code = code;
    return _this4;
  }

  return KgpMeterScoreError;
}(KgpMeterScoreResponse);

var KgpMeterScoreStale = function (_KgpMeterScoreRespons3) {
  _inherits(KgpMeterScoreStale, _KgpMeterScoreRespons3);

  function KgpMeterScoreStale(kgpResp) {
    _classCallCheck(this, KgpMeterScoreStale);

    var _this5 = _possibleConstructorReturn(this, (KgpMeterScoreStale.__proto__ || Object.getPrototypeOf(KgpMeterScoreStale)).call(this, "stale", kgpResp.timestamp_js, kgpResp.request, kgpResp.tree_signature, kgpResp.extras));

    _this5.resp = kgpResp;
    return _this5;
  }

  return KgpMeterScoreStale;
}(KgpMeterScoreResponse);

/** temporary solution for small things to do on KGP score request() */


var kgpMeterScoreUpdateCallbacks = {
  start: [],
  end: [],
  error: []
};
function otherThingsToDoOnKgpMeterScoreResponse(kgpPromise, request, previousResponse) {
  // for tutorial videos, comment this following line (glitches in video):
  kgpMeterScoreUpdateCallbacks.start.forEach(function (f) {
    return f(kgpPromise, request, previousResponse);
  });
  $("body").css({ 'cursor': 'progress' });
  return kgpPromise.then(function (kgpSuccess) {
    // success
    $("body").css({ 'cursor': 'auto' });
    kgp.privacyMetric = kgpSuccess.result.privacy_metric;
    kgpMeterScoreUpdateCallbacks.end.forEach(function (f) {
      return f(kgpPromise, request, previousResponse);
    });
    //console.log("kgp score success: ", kgpSuccess)
  }).catch(function (kgpError) {
    $("body").css({ 'cursor': 'auto' });
    kgpMeterScoreUpdateCallbacks.error.forEach(function (f) {
      return f(kgpPromise, request, previousResponse);
    });
    //console.log("kgp score error: ", kgpError)
  });
}

/** Creates the request that'll be sent to the KgpMeter server, with instant timestamp */

var KgpMeterScoreRequest = function KgpMeterScoreRequest(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng) {
  _classCallCheck(this, KgpMeterScoreRequest);

  var timestamp_js = +new Date();
  //let family_tree_edges = ftree.getLinksAsIds()
  // building list of sequenced relatives
  //let sequenced_relatives_ids = ftree.nodesArray().filter(n=>n.sequencedDNA).map(n=>n.id)
  this.timestamp_js = timestamp_js;
  this.family_tree = {
    "edges": familyTreeEdges,
    "sequenced_relatives": familyTreeSequencedRelatives,
    "target": target_id //kgp.target?kgp.target.id:"",
  };
  this.user = {
    "id": user_id,
    "source": user_source,
    "lng": lng
  };
};

// -------------------- Messages display --------------------

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
              if (!kgp.target) {
                self.displayInfo("response-error-4", 100000);
              } else {
                self.displaySuccess(1, 0, 0, 0);
                console.error("kgpResponse error code 4 with kgp target??");
                throw new Error("kgpResponse error code 4 with kgp target??");
              }
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

// -------------------- Explainer --------------------

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
      var _this6 = this;

      kgpPromise.then(function (kgpSuccess) {
        _this6.update(kgpSuccess.result.privacy_metric);
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