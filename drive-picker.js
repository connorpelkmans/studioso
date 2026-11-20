/* The Google Drive folder picker, in its own small page. Google's Picker needs Google's script and a frame from
   docs.google.com, which Studyboard's main page doesn't allow. So the app opens this page in a popup (its own, wider
   policy is set in _headers) and talks to it with postMessage:
     app -> picker  {sbPicker: "go", token, key, appId}      (the short-lived Drive token, never put in the address)
     picker -> app  {sbPicker: "ready"} then {sbPicker: "done", id, name} or {sbPicker: "cancel"} or {sbPicker: "error", message}
   With mode "files" (a class's notes and slides) it picks up to 20 files instead: {sbPicker: "done", docs: [{id, name, mimeType, url, size}]}
   With mode "gdoc" (Writing Studio's linked document) it picks one Google Doc, answered the same way, and with mode "gslides"
   (presentation practice) one Google Slides presentation
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
    var slides = a.mode === "gslides", gdoc = a.mode === "gdoc" || slides, files = a.mode === "files" || gdoc;
    var view = files && !gdoc ? new g.picker.DocsView(g.picker.ViewId.DOCS).setIncludeFolders(true).setSelectFolderEnabled(false)
      : new g.picker.DocsView(g.picker.ViewId.FOLDERS).setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes("application/vnd.google-apps.folder");
    var b = new g.picker.PickerBuilder().setAppId(a.appId).setDeveloperKey(a.key).setOAuthToken(a.token).setOrigin(location.origin).setTitle(slides ? "Choose your Google Slides presentation" : gdoc ? "Choose your Google Doc" : files ? "Choose files for this class" : "Choose a folder for Studyboard");
    // a Google Doc: a list of every doc first (with their dates, and Google's search box), then the same by folder, shared, starred and on
    // shared drives; each tab is tried on its own, so an option an older Picker doesn't know just leaves that tab plain
    if (gdoc) {
      var DOC = slides ? "application/vnd.google-apps.presentation" : "application/vnd.google-apps.document";
      var docs = function(o){
        var v = new g.picker.DocsView(slides ? g.picker.ViewId.PRESENTATIONS : g.picker.ViewId.DOCUMENTS).setMimeTypes(DOC).setSelectFolderEnabled(false).setIncludeFolders(!!o.folders);
        try { v.setMode(g.picker.DocsViewMode.LIST); } catch (e) {}
        if (o.folders) try { v.setParent("root"); } catch (e) {}
        if (o.owned != null) try { v.setOwnedByMe(o.owned); } catch (e) {}
        if (o.starred) try { v.setStarred(true); } catch (e) {}
        if (o.drives) try { v.setEnableDrives(true); } catch (e) {}
        try { v.setLabel(o.label); } catch (e) {}
        return v;
      };
      b.addView(docs({label: slides ? "All My Presentations" : "All My Docs"})).addView(docs({label: "Folders", folders: true})).addView(docs({label: "Shared with Me", owned: false})).addView(docs({label: "Starred", starred: true}));
      try { b.enableFeature(g.picker.Feature.SUPPORT_DRIVES); b.addView(docs({label: "Shared Drives", drives: true})); } catch (e) {}
      try { b.addView(new g.picker.View(g.picker.ViewId.RECENTLY_PICKED).setMimeTypes(DOC)); } catch (e) {}
      try { b.setSize(Math.min(1051, window.innerWidth - 24), Math.min(650, window.innerHeight - 24)); } catch (e) {}
    } else b.addView(view);
    b.setCallback(function(r){
        var A = g.picker.Action;
        if (r[g.picker.Response.ACTION] === A.PICKED && files) { var D = g.picker.Document; finish({sbPicker: "done", docs: r[g.picker.Response.DOCUMENTS].slice(0, 20).map(function(x){ return {id: String(x[D.ID] || ""), name: String(x[D.NAME] || "File"), mimeType: String(x[D.MIME_TYPE] || ""), url: String(x[D.URL] || ""), size: Number(x.sizeBytes) || 0}; })}); }
        else if (r[g.picker.Response.ACTION] === A.PICKED) { var d = r[g.picker.Response.DOCUMENTS][0]; finish({sbPicker: "done", id: String(d[g.picker.Document.ID] || ""), name: String(d[g.picker.Document.NAME] || "Folder")}); }
        else if (r[g.picker.Response.ACTION] === A.CANCEL) finish({sbPicker: "cancel"});
      });
    if (files && !gdoc) b.enableFeature(g.picker.Feature.MULTISELECT_ENABLED);
    b.build().setVisible(true); say(""); document.body.classList.add("open");
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
