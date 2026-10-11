// Unit tests for Email to Studyboard's Cloudflare Worker (cloudflare/email-capture): the MIME reader and what the Worker does with each
// kind of answer. Run: node tests/email-capture.test.js
const path = require("path"), assert = require("assert"), {pathToFileURL} = require("url");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const crlf = s => s.replace(/\r?\n/g, "\r\n");
const b64 = s => Buffer.from(s, "utf8").toString("base64").replace(/(.{76})/g, "$1\r\n");
(async () => {
  const root = path.join(__dirname, "..", "cloudflare", "email-capture", "src");
  const M = await import(pathToFileURL(path.join(root, "mime.js")).href);
  const W = await import(pathToFileURL(path.join(root, "index.js")).href);
  const bytes = s => new Uint8Array(Buffer.from(s, "latin1"));
  const utf8 = s => new Uint8Array(Buffer.from(s, "utf8"));

  // 1. Plain text, an encoded subject in two words, UTF-8 body sent as 8bit
  let m = M.parseEmail(utf8(crlf(`From: "Dr. Müller" <Mueller@Uni.example>
To: k7m2p9x4qrst@in.studyboard.example
Subject: =?UTF-8?B?TGFiIDQg?= =?UTF-8?Q?verschoben_=E2=80=93_Freitag?=
Message-ID: <abc.123@mail.uni.example>
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: 8bit

Liebe Studierende,

Lab 4 ist jetzt am Freitag, 16. Oktober, um 17 Uhr fällig.
`)));
  ok(m.subject === "Lab 4 verschoben – Freitag", "encoded words are joined without the space between them: " + m.subject);
  ok(m.from === "mueller@uni.example" && m.messageId === "abc.123@mail.uni.example", "sender address and Message-ID");
  ok(/fällig/.test(m.text) && /^Liebe Studierende,\n\nLab 4/.test(m.text), "UTF-8 body, paragraphs kept");

  // 2. multipart/alternative: quoted-printable plain wins over HTML
  m = M.parseEmail(bytes(crlf(`From: Canvas <notifications@instructure.com>
Subject: Assignment Due Date Changed: Essay 2
Content-Type: multipart/alternative; boundary="b1"

--b1
Content-Type: text/plain; charset="iso-8859-1"
Content-Transfer-Encoding: quoted-printable

The due date for Essay 2 has changed to: Oct 20 at 11:59pm. Caf=E9 talk at=
 noon.
=3D=3D

--b1
Content-Type: text/html; charset="utf-8"

<p>HTML version</p>
--b1--
`)));
  ok(/changed to: Oct 20 at 11:59pm\. Café talk at noon\.\n==/.test(m.text) && !/HTML version/.test(m.text), "quoted-printable Latin-1 plain text, soft breaks joined, HTML ignored: " + JSON.stringify(m.text));

  // 3. HTML only, base64, Windows-1252, with a list, a table, entities and a script
  const html = `<html><head><style>p{color:red}</style><title>x</title></head><body><script>alert(1)</script><h1>Week 7</h1><p>Read \x93Chapter 5\x94 &amp; finish:</p><ul><li>Quiz 3 \x96 Tue&nbsp;Oct&nbsp;14</li><li>Lab report</li></ul><table><tr><td>Exam</td><td>Nov 3</td></tr></table><p>Link: <a href="https://canvas.example/courses/1/assignments/9?utm=xyz">Assignment 9</a></p></body></html>`;
  m = M.parseEmail(bytes(crlf(`From: prof@school.edu
Subject: Week 7
Content-Type: text/html; charset=windows-1252
Content-Transfer-Encoding: base64

${Buffer.from(html, "latin1").toString("base64").replace(/(.{76})/g, "$1\r\n")}
`)));
  ok(m.text === "Week 7\n\nRead “Chapter 5” & finish:\n\n• Quiz 3 – Tue Oct 14\n• Lab report\n\nExam Nov 3\n\nLink: Assignment 9", "HTML becomes readable text (Windows-1252 quotes, bullets, entities; no script or style): " + JSON.stringify(m.text));

  // 4. Forwarded as an attachment, next to a PDF that is skipped
  m = M.parseEmail(bytes(crlf(`From: Student <me@gmail.com>
Subject: Fwd: Midterm room
Content-Type: multipart/mixed; boundary="outer"

--outer
Content-Type: text/plain; charset=utf-8

see below!
--outer
Content-Type: message/rfc822

From: Registrar <reg@school.edu>
Subject: =?iso-8859-1?Q?Midterm_r=E9union?=
Content-Type: text/plain

The midterm is in Hall B on Nov 2 at 9:00.
--outer
Content-Type: application/pdf; name="syllabus.pdf"
Content-Disposition: attachment; filename="syllabus.pdf"
Content-Transfer-Encoding: base64

JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PC9MZW5ndGggNiAwIFI+Pgo=
--outer--
`)));
  ok(m.subject === "Fwd: Midterm room" && /^see below!/.test(m.text), "the student's own words first");
  ok(/---------- Forwarded message ----------\nFrom: reg@school\.edu\nSubject: Midterm réunion\n\nThe midterm is in Hall B on Nov 2 at 9:00\./.test(m.text), "the forwarded message follows with its sender and subject");
  ok(!/JVBER|syllabus/.test(m.text), "attachments are skipped");

  // 5. Inline forward with quoting marks, nested multipart/related > alternative
  m = M.parseEmail(bytes(crlf(`From: me@school.edu
Subject: FW: project
Content-Type: multipart/related; boundary=r

--r
Content-Type: multipart/alternative; boundary=a

--a
Content-Type: text/plain; charset=us-ascii

> Project proposal due Oct 30.
>> Groups of 3.
--a--
--r--
`)));
  ok(m.text === "Project proposal due Oct 30.\nGroups of 3.", "nested parts are found and quoting marks are removed: " + JSON.stringify(m.text));
  ok(M.decodeWords("=?utf-8?q?=F0=9F=93=9A_Reading?=") === "📚 Reading" && M.decodeWords("plain words") === "plain words", "header words");
  ok(M.parseType('multipart/mixed; boundary="a;b"; charset=UTF-8').params.boundary === "a;b", "a quoted boundary with a semicolon");

  // ---------- The Worker ----------
  const env = {SUPABASE_URL: "https://x.supabase.co", EMAIL_CAPTURE_SECRET: "s".repeat(40)};
  const msg = (raw, to) => ({to: to || "k7m2p9x4qrst@in.studyboard.example", from: "bounce@mailer.example", raw: new Response(raw).body, rejected: "", setReject(r){ this.rejected = r; }});
  const MAIL = crlf(`From: Prof <prof@school.edu>\nSubject: Quiz moved\nMessage-ID: <q1@school>\nContent-Type: text/plain\n\nQuiz 2 is now on Friday.\n`);
  let sent = null;
  const answer = (status) => async (url, init) => { sent = {url, init, body: JSON.parse(init.body)}; return new Response("{}", {status}); };
  let r = await W.deliver(msg(MAIL), env, answer(200));
  ok(r.action === "ok", "a good email is handed over");
  ok(sent.url === "https://x.supabase.co/functions/v1/capture-email" && sent.init.headers["X-Studyboard-Email-Secret"] === env.EMAIL_CAPTURE_SECRET, "to the capture-email function, with the shared secret");
  ok(sent.body.to === "k7m2p9x4qrst@in.studyboard.example" && sent.body.from === "prof@school.edu" && sent.body.subject === "Quiz moved" && sent.body.text === "Quiz 2 is now on Friday." && sent.body.id === "q1@school", "with the recipient, the real sender, the subject, the text and the Message-ID");
  r = await W.deliver(msg(MAIL), env, answer(404));
  ok(r.action === "reject" && /no Studyboard inbox/.test(r.reason), "an unknown address is bounced");
  r = await W.deliver(msg(MAIL), env, answer(402));
  ok(r.action === "reject" && /Pro/.test(r.reason), "an address whose Pro ended is bounced with the reason");
  r = await W.deliver(msg(MAIL), env, answer(429));
  ok(r.action === "retry", "a busy inbox asks the sender's server to try later");
  r = await W.deliver(msg(MAIL), env, answer(500));
  ok(r.action === "retry", "a server problem is temporary");
  r = await W.deliver(msg(MAIL), env, async () => { throw new Error("offline"); });
  ok(r.action === "retry", "no connection is temporary");
  r = await W.deliver(msg(MAIL), {SUPABASE_URL: "https://x.supabase.co", EMAIL_CAPTURE_SECRET: "short"}, answer(200));
  ok(r.action === "retry", "a Worker without its secret never sends anything");
  sent = null;
  r = await W.deliver(msg(crlf(`From: a@b.c\nAuto-Submitted: auto-replied\nSubject: Out of office\n\nAway until Monday.\n`)), env, answer(200));
  ok(r.action === "drop" && sent === null, "an out-of-office reply is dropped quietly");
  r = await W.deliver(msg(crlf(`From: a@b.c\nAuto-Submitted: auto-generated\nSubject: Canvas: Quiz 3 due\n\nDue Oct 9.\n`)), env, answer(200));
  ok(r.action === "ok", "an automatic notification (forwarded by a filter) still counts");
  r = await W.deliver(msg(crlf(`From: a@b.c\nSubject: \n\n\n`)), env, answer(200));
  ok(r.action === "reject", "an empty email is bounced");
  // A huge message: only the start is read, and its text is still found
  const big = crlf(`From: p@s.e\nSubject: Big one\nContent-Type: multipart/mixed; boundary=z\n\n--z\nContent-Type: text/plain\n\nRead chapter 9 by Monday.\n--z\nContent-Type: application/octet-stream\nContent-Transfer-Encoding: base64\n\n`) + "QUJD".repeat(1500000);
  r = await W.deliver(msg(big), env, answer(200));
  ok(r.action === "ok" && sent.body.text === "Read chapter 9 by Monday.", "a message bigger than 3 MB is read up to 3 MB, and the text still arrives");
  const rr = await W.readRaw(new Response("x".repeat(100)).body, 10);
  ok(rr.bytes.length === 10 && rr.cut, "readRaw stops at the limit");
  // The default export rejects or throws, as Email Routing expects
  const m1 = msg(MAIL); const realFetch = global.fetch; global.fetch = answer(404);
  try { await W.default.email(m1, env); ok(/no Studyboard inbox/.test(m1.rejected), "the Worker calls setReject for a bounce"); global.fetch = answer(503); await assert.rejects(W.default.email(msg(MAIL), env), /try again/); n++; }
  finally { global.fetch = realFetch; }
  void b64;
  console.log(`email-capture: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
