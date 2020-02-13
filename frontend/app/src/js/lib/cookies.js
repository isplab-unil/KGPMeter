function createCookie(name, value, days) {
  var expires;

  if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toGMTString();
  } else {
      expires = "";
  }
  document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

function readCookie(name) {
  var nameEQ = encodeURIComponent(name) + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ')
          c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0)
          return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function eraseCookie(name) {
  document.cookie = encodeURIComponent(name) + "=;expires=" + (new Date()).toGMTString() + "; path=/";
}

function tryOrNull(func, defaultVal=null){
  return function(a,b,c){
    console.log("cookie tryOrNull() with func: ", func)
    try{
      return func(a,b,c)
    }catch(e){
      console.error("Unable to access cookies with function ", func)
      return defaultVal
    }
  }
}

export let cookie = {
  create: createCookie,
  read: readCookie,
  erase: eraseCookie,
  // versions that try to create/read/erase and return null upon failur
  tryCreate: tryOrNull(createCookie),
  tryRead: tryOrNull(readCookie),
  tryErase: tryOrNull(eraseCookie),
}