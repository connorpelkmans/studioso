/* The Google Drive folder picker, in its own small page. Google's Picker needs Google's script and a frame from
   docs.google.com, which Studyboard's main page doesn't allow. So the app opens this page in a popup (its own, wider
   policy is set in _headers) and talks to it with postMessage:
     app -> picker  {sbPicker: "go", token, key, appId}      (the short-lived Drive token, never put in the address)
     picker -> app  {sbPicker: "ready"} then {sbPicker: "done", id, name} or {sbPicker: "cancel"} or {sbPicker: "error", message}
   Only the page that opened this one, on the same site, is listened to or answered. */
(function(){
  "use strict";
  var opener = window.opener, msg = document.getElementById("msg"), started = false;
  function say(t){ msg.textContent = t; }
  function send(o){ try { opener.postMessage(o, location.origin); } catch (e) {} }
  function finish(o){ send(o); setTimeout(function(){ try { window.close(); } catch (e) {} }, 60); }
  if (!opener) { say("Open this from Studyboard: Files, Cloud, Choose Folder."); return; }
  function load(src){ return new Promise(function(ok, no){ var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function(){ no(new Error("Couldn't load Google's picker. Check your connection.")); }; document.head.appendChild(s); }); }
  function show(a){
    var g = window.google;
    var view = new g.picker.DocsView(g.picker.ViewId.FOLDERS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes("application/vnd.google-apps.folder");
    var b = new g.picker.PickerBuilder().setAppId(a.appId).setDeveloperKey(a.key).setOAuthToken(a.token).setOrigin(location.origin).setTitle("Choose a folder for Studyboard")
      .addView(view).setCallback(function(r){
        var A = g.picker.Action;
        if (r[g.picker.Response.ACTION] === A.PICKED) { var d = r[g.picker.Response.DOCUMENTS][0]; finish({sbPicker: "done", id: String(d[g.picker.Document.ID] || ""), name: String(d[g.picker.Document.NAME] || "Folder")}); }
        else if (r[g.picker.Response.ACTION] === A.CANCEL) finish({sbPicker: "cancel"});
      });
    b.build().setVisible(true); say("");
  }
  window.addEventListener("message", function(e){
    if (e.origin !== location.origin || e.source !== opener || started) return;
    var a = e.data; if (!a || a.sbPicker !== "go" || typeof a.token !== "string" || typeof a.key !== "string" || typeof a.appId !== "string") return;
    started = true;
    load("https://apis.google.com/js/api.js").then(function(){ return new Promise(function(ok){ window.gapi.load("picker", {callback: ok}); }); })
      .then(function(){ show(a); }).catch(function(err){ say(err.message); finish({sbPicker: "error", message: err.message}); });
  });
  send({sbPicker: "ready"});
})();
