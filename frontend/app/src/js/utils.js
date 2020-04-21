
export function detectIE11() {
  if(navigator.userAgent.indexOf('MSIE')!==-1 || navigator.appVersion.indexOf('Trident/') > -1){
    return true
  }
  return false
}

export function detectMobile() {
  if( navigator.userAgent.match(/Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i)){
    return true
  }
  return false
}

/** adds a 100ms without resize to window.onresize() before executing func (to avoid redraws every msec) */
export function onWindowResize(func,timeout=100){
  let doit;
  window.addEventListener("resize", function(){
    clearTimeout(doit);
    doit = setTimeout(func, timeout);
  })
}

const maxLogs = 10
const logs = []
const logUl = document.getElementById("touchscreen-debug")
export function log(...strargs){
  const str = strargs.reduce((a,b)=>a+b, "")
  logs.push("<li><strong>"+(new Date())+": </strong>"+str+"</li>")
  if(logs.length>maxLogs){
    logs.splice(0,logs.length-maxLogs)
  }
  logUl.innerHTML= logs.reduce((a,c)=>c+a,"")
}