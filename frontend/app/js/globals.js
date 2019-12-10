"use strict";

/* NodeList polyfill for IE11: not included in Babel (->?!?) */

// languageLoader and i18n object: Internationalisation
var languageLoader = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(lng) {
    var translation;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return fetch(LANGUAGE_FILES_URL + lng + ".json");

          case 2:
            translation = _context.sent;

            if (!(translation.status == 200)) {
              _context.next = 10;
              break;
            }

            _context.next = 6;
            return translation.json();

          case 6:
            translation = _context.sent;
            return _context.abrupt('return', translation);

          case 10:
            throw {
              message: 'loading of translation "' + lng + '" failed',
              lng: lng,
              response: translation
            };

          case 11:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function languageLoader(_x) {
    return _ref.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

if ('NodeList' in window && !NodeList.prototype.forEach) {
  console.info('polyfill for IE11');
  NodeList.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

var kgp = void 0;

// global variables
var DEV_SUFFIX = Boolean(document.URL.match(/\/privacy-dev\//)) ? "-dev" : "";
var BASEURL = "/privacy" + DEV_SUFFIX;
var LANGUAGE_FILES_URL = BASEURL + "/assets/translations/";

// ensure we travel properly to url's id if there is one:
function scrollToUrlElementId() {
  var urlId = document.URL.match("#(.+?)($|\\?|/)");
  if (urlId) {
    document.getElementById(urlId[1]).scrollIntoView(true);
    window.scrollBy(0, -80);
  }
}
// detects url changes
window.onhashchange = function () {
  scrollToUrlElementId();
};

function onChangeLanguage(oldLng, newLng) {
  cookie.create("lng", newLng, 30);
  $("#lang-dropdown .lang-current").text(" " + newLng.toUpperCase() + " ");
  // ensure external links target is blank to open them in a new page. Timeout, otherwise doesn't work
  setTimeout(function () {
    d3.selectAll(".ext-link").attr("target", "blank");
  }, 1);
  scrollToUrlElementId();
}

var i18n = new Internationalisation(["en", "fr", "de", "it", "es"], languageLoader, cookie.read("lng"), true);
i18n.languageChangeCallbacks.push(onChangeLanguage);
i18n.observe(document);
//onChangeLanguage(i18n.lng,i18n.lng)
i18n.dynamic["cookie-text"] = function (t, d) {
  return t.replace("{#1}", Boolean(document.URL.match(/\/privacy-dev\//)) ? "/privacy-dev" : "/privacy");
};

// add language choice buttons:

var _loop = function _loop(lng) {
  var langMenu = d3.select("#lang-menu");
  langMenu.append("a").attr("class", "dropdown-item").attr("href", 'javascript:void(0);').html(lng.toUpperCase()).on("click.change-language", function () {
    return i18n.changeLanguage(lng);
  });
  langMenu.append("br");
};

var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  for (var _iterator = i18n.supportedLanguages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    var lng = _step.value;

    _loop(lng);
  }

  //Accept Privacy policy and cookie
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator.return) {
      _iterator.return();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}

function cookieAccept() {
  $("#cookie_banner").hide(200);
  cookie.create("banner", 1, 1);
}
if (cookie.read("banner")) {
  $("#cookie_banner").hide();
}