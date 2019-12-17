'use strict';

function detectIE11() {
  if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > -1) {
    return true;
  }
  return false;
}

function detectMobile() {
  if (navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i)) {
    return true;
  }
  return false;
}

/** adds a 100ms without resize to window.onresize() before executing func (to avoid redraws every msec) */
function onWindowResize(func) {
  var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;

  var doit = void 0;
  window.onresize = function () {
    clearTimeout(doit);
    doit = setTimeout(func, timeout);
  };
}