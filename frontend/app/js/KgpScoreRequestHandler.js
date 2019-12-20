"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KgpScoreRequest = exports.KgpScoreRequestHandler = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _index = require("./KgpScoreResponse.js/index.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KgpScoreRequestHandler = exports.KgpScoreRequestHandler = function () {
  function KgpScoreRequestHandler(api_endpoint) {
    _classCallCheck(this, KgpScoreRequestHandler);

    this.api_endpoint = api_endpoint;
    this.lastRequest = {};
    // necessary dummy
    this.latestResponse = new _index.KgpScoreSuccess(-1, {}, "", 1.0001, 0, 0, 0);
    this.listeners = [];
    this.callbacks = {
      start: [],
      end: [],
      error: []
    };
    var self = this;
    this.addListener(function () {
      return self.callbacksAwait.apply(self, arguments);
    });
  }

  /** Adds a listener to requests, returns true if not already in array*/


  _createClass(KgpScoreRequestHandler, [{
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
      var currentRequest = new KgpScoreRequest(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng);
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
        return Promise.reject(new _index.KgpScoreError(currentRequest.timestamp_js, currentRequest, null, 5, { "message": 'Erreur de connexion au serveur.' }));
      })
      // parse response
      .then(function (json) {
        var kgpr = _index.KgpScoreResponse.parse(json, currentRequest);
        // check if it's stale or not
        if (kgpr.timestamp_js != self.lastRequest.timestamp_js) {
          return Promise.reject(new _index.KgpScoreStale(kgpr));
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

    /** callbacks */

  }, {
    key: "callbacksAwait",
    value: function callbacksAwait(kgpPromise, request, previousResponse) {
      var self = this;
      // for tutorial videos, comment this following line (glitches in video):
      self.callbacks.start.forEach(function (f) {
        return f(kgpPromise, request, previousResponse);
      });
      return kgpPromise.then(function (kgpSuccess) {
        // success
        self.callbacks.end.forEach(function (f) {
          return f(kgpPromise, request, previousResponse);
        });
        //console.log("kgp score success: ", kgpSuccess)
      }).catch(function (kgpError) {
        self.callbacks.error.forEach(function (f) {
          return f(kgpPromise, request, previousResponse);
        });
        //console.log("kgp score error: ", kgpError)
      });
    }
  }]);

  return KgpScoreRequestHandler;
}();

/** Creates the request that'll be sent to the Kgp server, with instant timestamp */


var KgpScoreRequest = exports.KgpScoreRequest = function KgpScoreRequest(target_id, familyTreeEdges, familyTreeSequencedRelatives, user_id, user_source, lng) {
  _classCallCheck(this, KgpScoreRequest);

  var timestamp_js = +new Date();
  this.timestamp_js = timestamp_js;
  this.family_tree = {
    "edges": familyTreeEdges,
    "sequenced_relatives": familyTreeSequencedRelatives,
    "target": target_id
  };
  this.user = {
    "id": user_id,
    "source": user_source,
    "lng": lng
  };
};