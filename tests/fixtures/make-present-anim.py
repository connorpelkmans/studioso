# Makes tests/fixtures/present-anim.pptx from present-deck.pptx: slide 2's bullets appear one click at a time, and slide 3
# has an embedded video (a 3-second clip, played on a click) plus a picture that appears on the click after.
# Run: python3 tests/fixtures/make-present-anim.py   (needs ffmpeg)
import os, re, subprocess, tempfile, zipfile
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, "present-deck.pptx"), os.path.join(HERE, "present-anim.pptx")
tmp = tempfile.mkdtemp()
vid, poster = os.path.join(tmp, "v.webm"), os.path.join(tmp, "p.png")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=320x180:rate=15:duration=3", "-c:v", "libvpx", "-b:v", "200k", vid], check=True)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=320x180:duration=1", "-frames:v", "1", poster], check=True)

def par(n, spid, cls, node, rng=None, cmd=False):
    tgt = f'<p:spTgt spid="{spid}">' + (f'<p:txEl><p:pRg st="{rng}" end="{rng}"/></p:txEl>' if rng is not None else "") + '</p:spTgt>'
    if cmd:
        beh = f'<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="{n+3}" dur="3000" fill="hold"/><p:tgtEl>{tgt}</p:tgtEl></p:cBhvr></p:cmd>'
    else:
        beh = f'<p:set><p:cBhvr><p:cTn id="{n+3}" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl>{tgt}</p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>'
    return (f'<p:par><p:cTn id="{n}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>'
            f'<p:par><p:cTn id="{n+1}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
            f'<p:par><p:cTn id="{n+2}" presetID="{1 if not cmd else 1}" presetClass="{cls}" presetSubtype="0" fill="hold" nodeType="{node}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{beh}</p:childTnLst></p:cTn></p:par>'
            '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>')
def timing(pars, bld=""):
    return ('<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
            '<p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>' + "".join(pars) +
            '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
            '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
            '</p:childTnLst></p:cTn></p:par></p:tnLst>' + (f'<p:bldLst>{bld}</p:bldLst>' if bld else "") + '</p:timing>')

zin = zipfile.ZipFile(SRC)
files = {n: zin.read(n) for n in zin.namelist()}
s2 = files["ppt/slides/slide2.xml"].decode()
s2 = s2.replace("</p:clrMapOvr></p:sld>", "</p:clrMapOvr>" + timing([par(3, 3, "entr", "clickEffect", 0), par(10, 3, "entr", "clickEffect", 1)], '<p:bldP spid="3" grpId="0" build="p"/>') + "</p:sld>")
files["ppt/slides/slide2.xml"] = s2.encode()
s3 = files["ppt/slides/slide3.xml"].decode()
pic = ('<p:pic><p:nvPicPr><p:cNvPr id="40" name="Sleep clip"><a:hlinkClick r:id="" action="ppaction://media"/></p:cNvPr><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>'
       '<p:nvPr><a:videoFile r:link="rId10"/><p:extLst><p:ext uri="{DAA4B4D4-6D71-4841-9C94-3DE7FCFB9230}"><p14:media xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" r:embed="rId11"/></p:ext></p:extLst></p:nvPr></p:nvPicPr>'
       '<p:blipFill><a:blip r:embed="rId12"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
       '<p:spPr><a:xfrm><a:off x="5486400" y="2286000"/><a:ext cx="3048000" cy="1714500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>')
star = ('<p:sp><p:nvSpPr><p:cNvPr id="41" name="Callout"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="5486400" y="4200000"/><a:ext cx="3048000" cy="600000"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FFC000"/></a:solidFill></p:spPr>'
        '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="1800"/><a:t>Screens push bedtime back</a:t></a:r></a:p></p:txBody></p:sp>')
s3 = s3.replace("</p:spTree>", pic + star + "</p:spTree>", 1)
s3 = s3.replace("</p:clrMapOvr></p:sld>", "</p:clrMapOvr>" + timing([par(3, 40, "mediacall", "clickEffect", None, True), par(10, 41, "entr", "clickEffect")]) + "</p:sld>")
files["ppt/slides/slide3.xml"] = s3.encode()
r3 = files["ppt/slides/_rels/slide3.xml.rels"].decode()
r3 = r3.replace("</Relationships>", '<Relationship Id="rId10" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/video" Target="../media/media1.webm"/>'
                '<Relationship Id="rId11" Type="http://schemas.microsoft.com/office/2007/relationships/media" Target="../media/media1.webm"/>'
                '<Relationship Id="rId12" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image90.png"/></Relationships>')
files["ppt/slides/_rels/slide3.xml.rels"] = r3.encode()
files["ppt/media/media1.webm"] = open(vid, "rb").read()
files["ppt/media/image90.png"] = open(poster, "rb").read()
ct = files["[Content_Types].xml"].decode()
for ext, mime in (("webm", "video/webm"), ("png", "image/png")):
    if f'Extension="{ext}"' not in ct: ct = ct.replace("<Default ", f'<Default Extension="{ext}" ContentType="{mime}"/><Default ', 1)
files["[Content_Types].xml"] = ct.encode()
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for n in zin.namelist() + [n for n in files if n not in zin.namelist()]:
        z.writestr(n, files[n], zipfile.ZIP_STORED if n.endswith((".webm", ".png", ".jpeg")) else zipfile.ZIP_DEFLATED)
print("wrote", OUT, os.path.getsize(OUT), "bytes")
