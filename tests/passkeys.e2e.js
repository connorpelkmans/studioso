// Passkeys on studyboardapp.com: the email field offers one, the link signs in with one, the offer after a password
// sign-in saves one, and Settings lists and removes them. A Chromium virtual authenticator stands in for Face ID
const fs=require("fs"),path=require("path"),assert=require("assert");const {chromium,executablePath}=require("./pw");
const ROOT=path.join(__dirname,"..");
const SB="https://pivcmrqcjseycjkbocmc.supabase.co",b64=o=>Buffer.from(JSON.stringify(o)).toString("base64url"),rnd=()=>require("crypto").randomBytes(32).toString("base64url");
const USER={id:"11111111-1111-1111-1111-111111111111",aud:"authenticated",role:"authenticated",email:"me@example.com",app_metadata:{provider:"email"},user_metadata:{},created_at:new Date(Date.now()-30*864e5).toISOString()};
const mint=()=>{const iat=Math.floor(Date.now()/1000),exp=iat+3600;return {access_token:b64({alg:"HS256"})+"."+b64({sub:USER.id,exp,iat,role:"authenticated",aud:"authenticated"})+".sig",token_type:"bearer",expires_in:3600,expires_at:exp,refresh_token:"rt"+iat,user:USER};};
const keys=[],log=[];let n=0;const ok=(c,m)=>{n++;assert(c,m);console.log("  ok "+m);};
(async()=>{
const b=await chromium.launch({executablePath});const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:"block"});
await ctx.route("https://studyboardapp.com/**",r=>{let p=new URL(r.request().url()).pathname;if(p==="/")p="/index.html";const f=path.join(ROOT,p);if(!fs.existsSync(f))return r.fulfill({status:404,body:""});r.fulfill({status:200,body:fs.readFileSync(f),contentType:/\.html$/.test(p)?"text/html":/\.m?js$/.test(p)?"text/javascript":/\.css$/.test(p)?"text/css":/\.svg$/.test(p)?"image/svg+xml":/\.json$/.test(p)?"application/json":"application/octet-stream"});});
await ctx.route(SB+"/**",r=>{const q=r.request(),u=new URL(q.url()),m=q.method();const send=(st,bd)=>r.fulfill({status:st,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*","access-control-allow-methods":"*","access-control-expose-headers":"*"},body:bd===undefined?"":JSON.stringify(bd)});
 if(m==="OPTIONS")return send(200);const P=u.pathname;if(/passkey|token|verify/.test(P))log.push(m+" "+P);
 if(P==="/auth/v1/token")return send(200,mint());if(P==="/auth/v1/user")return send(200,USER);if(P==="/auth/v1/logout")return send(204);
 if(P==="/auth/v1/passkeys/registration/options")return send(200,{challenge_id:"reg1",options:{challenge:rnd(),rp:{id:"studyboardapp.com",name:"Studyboard"},user:{id:Buffer.from(USER.id).toString("base64url"),name:USER.email,displayName:USER.email},pubKeyCredParams:[{type:"public-key",alg:-7}],authenticatorSelection:{residentKey:"required",userVerification:"preferred"},excludeCredentials:keys.map(k=>({type:"public-key",id:k.cred})),timeout:60000}});
 if(P==="/auth/v1/passkeys/registration/verify"){const bd=JSON.parse(q.postData());const k={id:"pk"+(keys.length+1),cred:bd.credential.id,friendly_name:"iPhone",created_at:new Date(Date.now()-30*864e5).toISOString()};keys.push(k);return send(200,k);}
 if(P==="/auth/v1/passkeys/authentication/options")return send(200,{challenge_id:"auth1",options:{challenge:rnd(),rpId:"studyboardapp.com",allowCredentials:[],userVerification:"preferred",timeout:60000}});
 if(P==="/auth/v1/passkeys/authentication/verify"){const bd=JSON.parse(q.postData());return keys.some(k=>k.cred===bd.credential.id)?send(200,mint()):send(400,{code:"passkey_not_found",msg:"credential not found"});}
 if(P==="/auth/v1/passkeys"&&m==="GET")return send(200,keys.map(({cred,...k})=>k));
 if(P.startsWith("/auth/v1/passkeys/")&&m==="DELETE"){const id=P.split("/").pop();const i=keys.findIndex(k=>k.id===id);if(i>=0)keys.splice(i,1);return send(204);}
 if(P.startsWith("/rest/v1/rpc/"))return send(404,{code:"PGRST202",message:"x"});
 if(P.startsWith("/rest/v1/")){if(m==="GET")return /object/.test(q.headers()["accept"]||"")?send(406,{code:"PGRST116",message:"0 rows"}):send(200,[]);return send(201,[{updated_at:new Date().toISOString()}]);}
 return send(404,{});});
await ctx.addInitScript(()=>{if(sessionStorage.getItem("s"))return;sessionStorage.setItem("s","1");localStorage.setItem("studioso:welcomed","1");localStorage.setItem("sb:onboarded","1");localStorage.setItem("studyboard:tour","done");});
const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));
const cdp=await ctx.newCDPSession(p);await cdp.send("WebAuthn.enable");
const {authenticatorId}=await cdp.send("WebAuthn.addVirtualAuthenticator",{options:{protocol:"ctap2",transport:"internal",hasResidentKey:true,hasUserVerification:true,isUserVerified:true,automaticPresenceSimulation:true}});
const dtext=()=>p.evaluate(()=>{const d=document.querySelector("dialog[open]");return d?d.innerText:"";});
await p.goto("https://studyboardapp.com/");await p.waitForTimeout(3500);
console.log("1. sign-in sheet");
ok(/Sign In to Studyboard/.test(await dtext()),"sign-in sheet opens for a returning visitor");
ok(await p.getAttribute("dialog[open] input[name=email]","autocomplete")==="username webauthn","email field offers passkeys (username webauthn)");
ok(await p.locator("#sbPasskey").count()===1,"Sign In With a Passkey link is there");
await p.waitForTimeout(500);ok(log.includes("POST /auth/v1/passkeys/authentication/options"),"the field's passkey offer started when the sheet opened");

console.log("2. password sign-in, then the offer");
await p.fill("dialog[open] input[name=email]","me@example.com");await p.fill("dialog[open] input[name=password]","Correct-Horse-9");
await p.click("dialog[open] [data-submit]");
await p.waitForSelector("#pkSave",{timeout:15000});
ok(/Sign In Faster Next Time/.test(await dtext()),"after a password sign-in, the save-a-passkey offer appears");
await p.click("#pkSave");await p.waitForTimeout(2000);
const creds=(await cdp.send("WebAuthn.getCredentials",{authenticatorId})).credentials;
ok(creds.length===1&&keys.length===1,"Save a Passkey made one passkey on the device and the server");
ok(!(await p.locator("dialog[open]").count()),"the offer closed after saving");
console.log("3. Settings");
await p.evaluate(()=>{const b=document.querySelector('[data-act="menu"]');b&&b.click();});await p.waitForTimeout(1200);
const row=p.locator('dialog[open] [data-act="pk-manage"]');ok(await row.count()>0,"Settings has a Passkeys row");
await p.click('dialog[open] .us-cat[data-us="account"]');await p.waitForTimeout(800);await row.first().click();await p.waitForTimeout(1500);
ok(/iPhone/.test(await dtext()),"the Passkeys sheet lists the saved passkey");
await p.evaluate(()=>{document.querySelector("dialog[open]").close();});
const vcount=()=>log.filter(x=>x==="POST /auth/v1/passkeys/authentication/verify").length;
console.log("5a. the email field's passkey suggestion (picked at once by the stand-in authenticator)");
await p.evaluate(()=>{localStorage.removeItem("studioso-auth");});await p.reload();await p.waitForTimeout(4000);
ok(vcount()===1,"the field's passkey offer signed in");
ok(!(await p.locator("dialog[open] form.sb-acct").count()),"sheet closed, signed in");
console.log("5b. the link");
await cdp.send("WebAuthn.setAutomaticPresenceSimulation",{authenticatorId,enabled:false});
await p.evaluate(()=>{localStorage.removeItem("studioso-auth");});await p.reload();await p.waitForTimeout(3500);
ok(/Sign In to Studyboard/.test(await dtext()),"signed out: sign-in sheet again, field offer waiting");

await cdp.send("WebAuthn.setAutomaticPresenceSimulation",{authenticatorId,enabled:true});
await p.click("#sbPasskey");await p.waitForTimeout(2500);
ok(vcount()===2,"Sign In With a Passkey answered the server's challenge");
ok(!(await p.locator("dialog[open] form.sb-acct").count()),"signed in with the passkey, sheet closed");

await p.waitForTimeout(4000);ok(!(await p.locator("#pkSave").count()),"no second save-a-passkey offer");
console.log("6. remove");
await p.evaluate(()=>{const b=document.querySelector('[data-act="menu"]');b&&b.click();});await p.waitForTimeout(1000);
await p.click('dialog[open] .us-cat[data-us="account"]');await p.waitForTimeout(800);await p.locator('dialog[open] [data-act="pk-manage"]').first().click();await p.waitForTimeout(1200);
await p.click("dialog[open] [data-pk-del]");await p.click("dialog[open] [data-pk-del]");await p.waitForTimeout(1200);
ok(keys.length===0&&/You haven't saved a passkey yet/.test(await dtext()),"Remove (asked twice) deletes it");
ok(!errs.length,"no page errors "+errs.join(" | "));
console.log(n+" checks passed");await b.close();})().catch(e=>{console.error("FAIL",e.message);console.error(log.join("\n"));process.exit(1);});
