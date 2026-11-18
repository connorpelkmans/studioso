/* A YouTube video for Studyboard's iPhone and desktop apps. Their pages come from an app address (capacitor://localhost, app://studioso),
   which YouTube doesn't accept as the page a player is on ("Error 153: Video player configuration error"), and an app can't change what
   its frames send. So the apps show this page, on the Studyboard website, and it holds the player: YouTube sees studyboardapp.com.
   ?v= the video's id (11 characters), &t= where to start (seconds), &ap=1 to start playing. Only YouTube's privacy-enhanced player is shown,
   and only Studyboard's own apps and site may frame this page (its headers). */
(function(){
  "use strict";
  var q = new URLSearchParams(location.search), id = q.get("v") || "", t = parseInt(q.get("t") || "0", 10) || 0;
  if (!/^[\w-]{11}$/.test(id)) { var p = document.createElement("p"); p.textContent = "That video couldn't be found."; document.body.appendChild(p); return; }
  var f = document.createElement("iframe");
  f.src = "https://www.youtube-nocookie.com/embed/" + id + "?rel=0&playsinline=1" + (t > 0 ? "&start=" + t : "") + (q.get("ap") === "1" ? "&autoplay=1" : "");
  f.title = "YouTube video"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true;
  f.referrerPolicy = "strict-origin-when-cross-origin";
  document.body.appendChild(f);
})();
