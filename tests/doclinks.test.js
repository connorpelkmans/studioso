// Unit tests for document links on a task (the pure block between /*DOCLINKS-START*/ and /*DOCLINKS-END*/)
"use strict";
const assert = require("assert");
const s = require("../scripts/app-files").source();
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const D = new Function(between("/*DOCLINKS-START*/", "/*DOCLINKS-END*/") + ";return DOCLINK;")();
let n = 0; const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

const app = u => D.appOf(D.clean(u));
// Google
eq(app("https://docs.google.com/document/d/1AbC/edit?usp=sharing"), "gdoc", "Google Doc");
eq(app("https://docs.google.com/spreadsheets/d/1AbC/edit#gid=0"), "gsheet", "Google Sheet");
eq(app("https://docs.google.com/presentation/d/1AbC/edit"), "gslides", "Google Slides");
eq(app("https://docs.google.com/forms/d/e/1AbC/viewform"), "gform", "Google Form");
eq(app("https://forms.gle/abc123"), "gform", "short Google Form link");
eq(app("https://drive.google.com/file/d/1AbC/view"), "gdrive", "Drive file");
// Microsoft 365
eq(app("https://contoso-my.sharepoint.com/:w:/g/personal/ana/EAbc?e=x"), "word", "SharePoint share link for Word");
eq(app("https://contoso.sharepoint.com/:x:/s/team/EAbc"), "excel", "Excel share link");
eq(app("https://contoso.sharepoint.com/:p:/s/team/EAbc"), "ppt", "PowerPoint share link");
eq(app("https://contoso.sharepoint.com/:o:/s/team/EAbc"), "onenote", "OneNote share link");
eq(app("https://1drv.ms/w/s!AbcDef"), "word", "OneDrive short link");
eq(app("https://onedrive.live.com/edit.aspx?resid=ABC!123&app=Excel"), "excel", "OneDrive with app=Excel");
eq(app("https://contoso.sharepoint.com/sites/x/_layouts/15/Doc.aspx?sourcedoc={A}&file=Lab%20Report.docx&action=default"), "word", "Doc.aspx with file=");
eq(app("https://contoso.sharepoint.com/sites/x/Shared%20Documents/Essay%20Draft.docx"), "word", "a direct .docx path");
eq(app("https://www.onenote.com/notebooks?auth=1"), "onenote", "onenote.com");
eq(app("https://contoso.sharepoint.com/sites/x/SitePages/Home.aspx"), "m365", "another Microsoft 365 page");
eq(app("onenote:https://d.docs.live.net/abc/Documents/Bio/Notes.one#Cell%20division&section-id={A}"), "web", "OneNote desktop link, its web form kept");
eq(D.clean("onenote:https://contoso.sharepoint.com/sites/x/Bio.one#Mitosis"), "https://contoso.sharepoint.com/sites/x/Bio.one#Mitosis", "onenote: prefix dropped");
eq(app("https://contoso.sharepoint.com/sites/x/Bio.one#Mitosis"), "onenote", ".one notebook file");
// Canva
eq(app("https://www.canva.com/design/DAFabc123/xyz/edit"), "canva", "Canva design");
eq(app("https://canva.link/abc"), "canva", "Canva short link");
// anything else
eq(app("example.com/syllabus"), "web", "a bare address gets https");
eq(D.clean("example.com/syllabus"), "https://example.com/syllabus", "https added");
eq(D.clean("javascript:alert(1)"), "", "javascript: refused");
eq(D.clean("https://user:pw@example.com/"), "", "addresses with passwords refused");
eq(D.clean("not a link"), "", "plain words refused");
eq(D.clean("Here it is: https://docs.google.com/document/d/1/edit thanks"), "https://docs.google.com/document/d/1/edit", "the link out of a pasted sentence");
// names
eq(D.nameOf("https://contoso.sharepoint.com/sites/x/_layouts/15/Doc.aspx?file=Lab%20Report.docx"), "Lab Report", "file name from file=");
eq(D.nameOf("https://contoso.sharepoint.com/sites/x/Shared%20Documents/Essay_Draft.docx"), "Essay Draft", "file name from the path");
eq(D.nameOf("https://docs.google.com/document/d/1AbC/edit"), "", "Google links carry no name");
eq(D.shown({app: "canva", name: "", url: "https://www.canva.com/design/x"}), "Canva Design", "label for an unnamed link");
eq(D.shown({app: "web", name: "", url: "https://www.example.com/a"}), "example.com", "host for a web page");
// a saved list
const list = D.norm([{url: "https://docs.google.com/document/d/1/edit", name: "Essay <b>"}, {url: "https://docs.google.com/document/d/1/edit"}, {url: "javascript:x"}, null, "x", {url: "https://www.canva.com/design/D/e", id: "keep_me"}]);
eq(list.length, 2, "duplicates, bad links and junk dropped");
eq(list[0].name, "Essay b", "angle brackets out of names");
eq(list[1].id, "keep_me", "ids kept");
eq(D.norm(Array.from({length: 30}, (_, i) => ({url: "https://example.com/" + i}))).length, D.MAX, "at most " + D.MAX);
eq(D.norm("nope"), [], "not a list");

console.log(`doclinks.test: ${n} checks passed`);
