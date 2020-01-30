/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./lib/src/js/kgpmeter.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./app/src/js/KgpIframeInterface.js":
/*!******************************************!*\
  !*** ./app/src/js/KgpIframeInterface.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.KgpOuterClient = exports.KgpInnerClient = undefined;\nexports.kgpSetSourceEvent = kgpSetSourceEvent;\nexports.kgpSetLanguageEvent = kgpSetLanguageEvent;\nexports.kgpSetIframeMaxDimensionEvent = kgpSetIframeMaxDimensionEvent;\nexports.kgpSetHeightEvent = kgpSetHeightEvent;\n\nvar _cookies = __webpack_require__(/*! ./lib/cookies.js */ \"./app/src/js/lib/cookies.js\");\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar cl = console.log;\n\nvar KgpInnerClient = exports.KgpInnerClient = function KgpInnerClient(i18n, sourceCookieName, kgp) {\n  _classCallCheck(this, KgpInnerClient);\n\n  // set language event\n  function setLanguage(e) {\n    cl(\"-- KgpInnerClient setLanguage()!\");\n    i18n.changeLanguage(e.lng);\n  }\n  window.document.addEventListener('KgpSetLanguageEvent', setLanguage, false);\n\n  // set source event\n  function setSource(e) {\n    cl(\"-- KgpInnerClient setsource()!\");\n    var userSource = _cookies.cookie.read(sourceCookieName);\n    if (!userSource) {\n      _cookies.cookie.create(sourceCookieName, e.source, 1);\n    }\n  }\n  window.document.addEventListener('KgpSetSourceEvent', setSource, false);\n\n  // set max dimensions event\n  function setIframeMaxDimensionEvent(e) {\n    cl(\"-- KgpInnerClient setIframeMaxDimensionEvent()!\");\n  }\n  window.document.addEventListener('KgpSetIframeMaxDimensionEvent', setIframeMaxDimensionEvent, false);\n};\n\nvar KgpOuterClient = exports.KgpOuterClient = function KgpOuterClient(iframeElementid, language, max_height) {\n  _classCallCheck(this, KgpOuterClient);\n\n  this.iframe = document.getElementById(iframeElementid);\n  this.userSource = document.URL;\n\n  var self = this;\n  self.iframe.contentDocument.onload = function () {\n    console.log(\"self.iframe.contentDocument LOADED!!\");\n    // set language\n    var setLanguageEvent = kgpSetLanguageEvent(language);\n    self.iframe.contentDocument.dispatchEvent(setLanguageEvent);\n    // set source\n    var setSourceEvent = kgpSetSourceEvent(document.URL);\n    self.iframe.contentDocument.dispatchEvent(setSourceEvent);\n    // set max height\n    var setIframeMaxDimensionEvent = kgpSetIframeMaxDimensionEvent(max_height);\n    self.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent);\n  };\n};\n\n/******** down events ********/\n\nfunction kgpSetSourceEvent(source) {\n  return new CustomEvent(\"KgpSetSourceEvent\", { detail: { source: source } });\n}\n\nfunction kgpSetLanguageEvent(source) {\n  return new CustomEvent(\"KgpSetLanguageEvent\", { detail: { lng: lng } });\n}\n\n/** Event from kgpmeter to kgp-iframe to signale iframe max dimensions */\nfunction kgpSetIframeMaxDimensionEvent(maxHeight) {\n  return new CustomEvent(\"KgpSetIframeMaxDimensionEvent\", { detail: { maxHeight: maxHeight } });\n}\n\n/******** up events ********/\n\n/** Event from kgp-iframe to kgpmeter to change height */\nfunction kgpSetHeightEvent(height) {\n  return new CustomEvent(\"KgpSetHeightEvent\", { detail: { height: height } });\n}\n\n//# sourceURL=webpack:///./app/src/js/KgpIframeInterface.js?");

/***/ }),

/***/ "./app/src/js/lib/cookies.js":
/*!***********************************!*\
  !*** ./app/src/js/lib/cookies.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nvar cookie = exports.cookie = {\n  create: function createCookie(name, value, days) {\n    var expires;\n\n    if (days) {\n      var date = new Date();\n      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);\n      expires = \"; expires=\" + date.toGMTString();\n    } else {\n      expires = \"\";\n    }\n    document.cookie = encodeURIComponent(name) + \"=\" + encodeURIComponent(value) + expires + \"; path=/\";\n  },\n\n  read: function readCookie(name) {\n    var nameEQ = encodeURIComponent(name) + \"=\";\n    var ca = document.cookie.split(';');\n    for (var i = 0; i < ca.length; i++) {\n      var c = ca[i];\n      while (c.charAt(0) === ' ') {\n        c = c.substring(1, c.length);\n      }if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));\n    }\n    return null;\n  },\n\n  erase: function eraseCookie(name) {\n    document.cookie = encodeURIComponent(name) + \"=;expires=\" + new Date().toGMTString() + \"; path=/\";\n  }\n};\n\n//# sourceURL=webpack:///./app/src/js/lib/cookies.js?");

/***/ }),

/***/ "./lib/src/js/kgpmeter.js":
/*!********************************!*\
  !*** ./lib/src/js/kgpmeter.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar _KgpIframeInterface = __webpack_require__(/*! ../../../app/src/js/KgpIframeInterface.js */ \"./app/src/js/KgpIframeInterface.js\");\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar KgpMeter = function KgpMeter(divId, apiUrl, lang, maxHeight) {\n  _classCallCheck(this, KgpMeter);\n\n  this.divId = divId;\n  this.apiUrl = apiUrl;\n  this.lang = lang;\n  var self = this;\n\n  this.div = document.getElementById(divId);\n  this.div.innerHTML = \"<iframe src='{src}/app/'></iframe>\".replace(\"{src}\", this.apiUrl);\n  this.iframe = this.div.getElementsByTagName(\"iframe\")[0];\n  this.iframe.setAttribute(\"style\", 'border:none; width:100%; height:100%;');\n\n  console.log(\"this.lang\", self.lang);\n\n  // ======== send data to iframe ========\n  this.iframe.contentWindow.addEventListener(\"load\", function () {\n    setTimeout(function () {\n      console.log(\"self.iframe.contentWindow LOADED!!\");\n      // set language\n      var setLanguageEvent = (0, _KgpIframeInterface.kgpSetLanguageEvent)(self.lang);\n      self.iframe.contentDocument.dispatchEvent(setLanguageEvent);\n      // set source\n      var setSourceEvent = (0, _KgpIframeInterface.kgpSetSourceEvent)(document.URL);\n      self.iframe.contentDocument.dispatchEvent(setSourceEvent);\n      // set max height\n      var setIframeMaxDimensionEvent = (0, _KgpIframeInterface.kgpSetIframeMaxDimensionEvent)(maxHeight);\n      self.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent);\n      console.log(\"KgpMeter: downwards events sent\");\n    }, 500);\n  });\n  // =================================== TEST iframe to parent communication and vice-versa ===================================\n  console.log(\"huhuhaha\");\n  // parent to iframe:\n  setTimeout(function () {\n    var data = { orientation: 'down' };\n    var event = new CustomEvent('myCustomEvent', { detail: data });\n    self.iframe.contentDocument.dispatchEvent(event);\n  }, 500);\n\n  // iframe to parent\n  function handleEvent(e) {\n    console.log(\"Communication kgp-iframe to kgpmeter success! detail:\", e.detail); // outputs: {foo: 'bar'}\n  }\n  window.document.addEventListener('myCustomEvent', handleEvent, false);\n};\n// export KgpMeter to glboal namespace\n\n\nwindow.KgpMeter = KgpMeter;\n\n//# sourceURL=webpack:///./lib/src/js/kgpmeter.js?");

/***/ })

/******/ });