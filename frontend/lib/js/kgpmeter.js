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
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.KgpSetHeightEvent = exports.KgpSetIframeMaxDimensionEvent = exports.KgpSetLanguageEvent = exports.KgpSetSourceEvent = exports.KgpIframeEvent = exports.KgpOuterClient = exports.KgpInnerClient = undefined;\n\nvar _cookies = __webpack_require__(/*! ./lib/cookies.js */ \"./app/src/js/lib/cookies.js\");\n\nfunction _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return call && (typeof call === \"object\" || typeof call === \"function\") ? call : self; }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function, not \" + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar cl = console.log;\n\nvar KgpInnerClient = exports.KgpInnerClient = function KgpInnerClient(i18n, sourceCookieName, kgp) {\n  _classCallCheck(this, KgpInnerClient);\n\n  // set language event\n  function setLanguage(e) {\n    cl(\"-- KgpInnerClient setLanguage()!\");\n    i18n.changeLanguage(e.lng);\n  }\n  window.document.addEventListener('KgpSetLanguageEvent', setLanguage, false);\n\n  // set source event\n  function setSource(e) {\n    cl(\"-- KgpInnerClient setsource()!\");\n    var userSource = _cookies.cookie.read(sourceCookieName);\n    if (!userSource) {\n      _cookies.cookie.create(sourceCookieName, e.source, 1);\n    }\n  }\n  window.document.addEventListener('KgpSetSourceEvent', setSource, false);\n\n  // set max dimensions event\n  function setIframeMaxDimensionEvent(e) {\n    cl(\"-- KgpInnerClient setIframeMaxDimensionEvent()!\");\n  }\n  window.document.addEventListener('KgpSetIframeMaxDimensionEvent', setIframeMaxDimensionEvent, false);\n};\n\nvar KgpOuterClient = exports.KgpOuterClient = function KgpOuterClient(iframeElementid, language, max_height) {\n  _classCallCheck(this, KgpOuterClient);\n\n  this.iframe = document.getElementById(iframeElementid);\n  this.userSource = document.URL;\n\n  var self = this;\n  self.iframe.contentDocument.onload = function () {\n    console.log(\"self.iframe.contentDocument LOADED!!\");\n    // set language\n    var setLanguageEvent = new KgpSetLanguageEvent(language);\n    self.iframe.contentDocument.dispatchEvent(setLanguageEvent);\n    // set source\n    var setSourceEvent = new KgpSetSourceEvent(document.URL);\n    self.iframe.contentDocument.dispatchEvent(setSourceEvent);\n    // set max height\n    var setIframeMaxDimensionEvent = new KgpSetIframeMaxDimensionEvent(max_height);\n    self.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent);\n  };\n};\n\n/** abstract mother class for all other Kgp iframe events */\n\n\nvar KgpIframeEvent = exports.KgpIframeEvent = function (_Event) {\n  _inherits(KgpIframeEvent, _Event);\n\n  function KgpIframeEvent() {\n    var _ref;\n\n    _classCallCheck(this, KgpIframeEvent);\n\n    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {\n      args[_key] = arguments[_key];\n    }\n\n    return _possibleConstructorReturn(this, (_ref = KgpIframeEvent.__proto__ || Object.getPrototypeOf(KgpIframeEvent)).call.apply(_ref, [this].concat(args)));\n  }\n\n  return KgpIframeEvent;\n}(Event);\n\n/******** down events ********/\n\nvar KgpSetSourceEvent = exports.KgpSetSourceEvent = function (_KgpIframeEvent) {\n  _inherits(KgpSetSourceEvent, _KgpIframeEvent);\n\n  function KgpSetSourceEvent(source) {\n    _classCallCheck(this, KgpSetSourceEvent);\n\n    var _this2 = _possibleConstructorReturn(this, (KgpSetSourceEvent.__proto__ || Object.getPrototypeOf(KgpSetSourceEvent)).call(this, \"KgpSetSourceEvent\"));\n\n    _this2.source = source;\n    return _this2;\n  }\n\n  return KgpSetSourceEvent;\n}(KgpIframeEvent);\n\nvar KgpSetLanguageEvent = exports.KgpSetLanguageEvent = function (_KgpIframeEvent2) {\n  _inherits(KgpSetLanguageEvent, _KgpIframeEvent2);\n\n  function KgpSetLanguageEvent(lng) {\n    _classCallCheck(this, KgpSetLanguageEvent);\n\n    var _this3 = _possibleConstructorReturn(this, (KgpSetLanguageEvent.__proto__ || Object.getPrototypeOf(KgpSetLanguageEvent)).call(this, \"KgpSetLanguageEvent\"));\n\n    _this3.lng = lng;\n    return _this3;\n  }\n\n  return KgpSetLanguageEvent;\n}(KgpIframeEvent);\n\n/** Event from kgpmeter to kgp-iframe to signale iframe max dimensions */\n\n\nvar KgpSetIframeMaxDimensionEvent = exports.KgpSetIframeMaxDimensionEvent = function (_KgpIframeEvent3) {\n  _inherits(KgpSetIframeMaxDimensionEvent, _KgpIframeEvent3);\n\n  function KgpSetIframeMaxDimensionEvent(maxHeight) {\n    _classCallCheck(this, KgpSetIframeMaxDimensionEvent);\n\n    var _this4 = _possibleConstructorReturn(this, (KgpSetIframeMaxDimensionEvent.__proto__ || Object.getPrototypeOf(KgpSetIframeMaxDimensionEvent)).call(this, \"KgpSetIframeMaxDimensionEvent\"));\n\n    console.log(\"maxHeight\", maxHeight, \"maxWidth\", maxWidth);\n    _this4.maxHeight = maxHeight;\n    return _this4;\n  }\n\n  return KgpSetIframeMaxDimensionEvent;\n}(KgpIframeEvent);\n\n/******** up events ********/\n\n/** Event from kgp-iframe to kgpmeter to change height */\n\n\nvar KgpSetHeightEvent = exports.KgpSetHeightEvent = function (_KgpIframeEvent4) {\n  _inherits(KgpSetHeightEvent, _KgpIframeEvent4);\n\n  function KgpSetHeightEvent(height) {\n    _classCallCheck(this, KgpSetHeightEvent);\n\n    var _this5 = _possibleConstructorReturn(this, (KgpSetHeightEvent.__proto__ || Object.getPrototypeOf(KgpSetHeightEvent)).call(this, \"KgpSetHeightEvent\"));\n\n    _this5.height = height;\n    return _this5;\n  }\n\n  return KgpSetHeightEvent;\n}(KgpIframeEvent);\n\n//# sourceURL=webpack:///./app/src/js/KgpIframeInterface.js?");

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
eval("\n\nvar _KgpIframeInterface = __webpack_require__(/*! ../../../app/src/js/KgpIframeInterface.js */ \"./app/src/js/KgpIframeInterface.js\");\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nvar KgpMeter = function KgpMeter(divId, apiUrl, lang, maxHeight) {\n  _classCallCheck(this, KgpMeter);\n\n  this.divId = divId;\n  this.apiUrl = apiUrl;\n  this.lang = lang;\n  var self = this;\n\n  this.div = document.getElementById(divId);\n  this.div.innerHTML = \"<iframe src='{src}/app/'></iframe>\".replace(\"{src}\", this.apiUrl);\n  this.iframe = this.div.getElementsByTagName(\"iframe\")[0];\n  this.iframe.setAttribute(\"style\", 'border:none; width:100%; height:100%;');\n\n  // ======== send data to iframe ========\n  this.iframe.contentWindow.addEventListener(\"load\", function () {\n    console.log(\"self.iframe.contentWindow LOADED!!\");\n    // set language\n    var setLanguageEvent = new _KgpIframeInterface.KgpSetLanguageEvent(self.lang);\n    console.log(\"self.iframe language set\");\n    self.iframe.contentDocument.dispatchEvent(setLanguageEvent);\n    console.log(\"self.iframe language set 1\");\n    // set source\n    var setSourceEvent = new _KgpIframeInterface.KgpSetSourceEvent(document.URL);\n    console.log(\"self.iframe source set\");\n    self.iframe.contentDocument.dispatchEvent(setSourceEvent);\n    console.log(\"self.iframe source set 1\");\n    // set max height\n    var setIframeMaxDimensionEvent = new _KgpIframeInterface.KgpSetIframeMaxDimensionEvent(maxHeight);\n    console.log(\"self.iframe max dim set\");\n    self.iframe.contentDocument.dispatchEvent(setIframeMaxDimensionEvent);\n    console.log(\"self.iframe max dim set 1\");\n  });\n  // =================================== TEST iframe to parent communication and vice-versa ===================================\n  console.log(\"huhuhaha\");\n  // parent to iframe:\n  setTimeout(function () {\n    var data = { orientation: 'down' };\n    var event = new CustomEvent('myCustomEvent', { detail: data });\n    self.iframe.contentDocument.dispatchEvent(event);\n  }, 500);\n\n  // iframe to parent\n  function handleEvent(e) {\n    console.log(\"Communication kgp-iframe to kgpmeter success! detail:\", e.detail); // outputs: {foo: 'bar'}\n  }\n  window.document.addEventListener('myCustomEvent', handleEvent, false);\n};\n// export KgpMeter to glboal namespace\n\n\nwindow.KgpMeter = KgpMeter;\n\n//# sourceURL=webpack:///./lib/src/js/kgpmeter.js?");

/***/ })

/******/ });