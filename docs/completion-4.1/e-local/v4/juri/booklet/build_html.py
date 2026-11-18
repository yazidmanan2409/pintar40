# Build the judges' question booklet HTML from untuk-juri/items.json (+ the objective statements in
# untuk-juri/lembar-penilaian.md). Text is taken verbatim from items.json; only HTML-escaped.
import json, sys, html, re
items_path, lembar_path, out_html = sys.argv[1:4]
raw = open(items_path, 'rb').read()
items = json.loads(raw.decode('utf-8'))
assert isinstance(items, list)
# objectives: "Tujuan: B1-T1 text · B1-T2 text ..." lines in lembar-penilaian.md
obj = {}
for line in open(lembar_path, encoding='utf-8'):
    if line.startswith('Tujuan: '):
        for part in line[len('Tujuan: '):].rstrip('\n').split(' · '):
            m = re.match(r'(B\d-T\d+) (.*)$', part)
            if m: obj[m.group(1)] = m.group(2)
chapters = {1: 'Bab 1 · Pola Bilangan', 2: 'Bab 2 · Data Sederhana'}
e = lambda s: html.escape(s, quote=False)
cards = []
cur = None
for n, it in enumerate(items, 1):
    ch = it.get('chapter')
    if ch != cur:
        cur = ch
        cards.append(f'<h2 class="bab">{e(chapters.get(ch, "Bab " + str(ch)))}</h2>')
    oc = it.get('objective_code') or '—'
    ot = obj.get(oc, '')
    opts = ''.join(f'<li><span class="lbl">{e(o["label"])}.</span><span class="txt">{e(o["body"])}</span></li>' for o in it['options'])
    dis = ''.join(f'<li><span class="lbl">{e(d["label"])}</span><span class="txt">{e(d["misconception"])} <span class="code">({e(d["misconception_code"])})</span></span></li>' for d in it['distractors'])
    cards.append(f'''<section class="soal" data-item="{e(it["item_id"])}">
  <div class="head"><span class="id">Soal {n}</span><span class="no">kode {e(it["item_id"])}</span></div>
  <div class="tujuan"><b>Tujuan {e(oc)}</b>{(" · " + e(ot)) if ot else ""}</div>
  <div class="stem">{e(it["stem"])}</div>
  <ol class="opsi">{opts}</ol>
  <div class="kunci"><div><b>Usulan kunci jawaban: {e(it["key"])}</b><br><span class="txt">{e(it["key_rationale"])}</span></div>
    <div class="peng"><b>Pemahaman keliru di balik setiap pengecoh</b><ul>{dis}</ul></div></div>
</section>''')
doc = f'''<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Buku Soal Penilaian · Evaluasi soal PINTAR</title>
<style>
@page {{ size: A4; margin: 18mm 17mm 18mm 17mm; }}
:root {{ --teal:#0b4f52; --soft:#e6f0f0; --ink:#1d2525; --mut:#5b6666; --line:#c9d6d6; }}
* {{ box-sizing:border-box; }}
html {{ font-family: Inter, "DejaVu Sans", sans-serif; font-size: 10.5pt; color: var(--ink);
  font-variant-ligatures: none; font-feature-settings: "liga" 0, "calt" 0; hyphens: none; }}
body {{ margin:0; }}
h1 {{ color:var(--teal); font-size:22pt; margin:0 0 4mm; letter-spacing:-0.01em; }}
.over {{ color:var(--teal); font-weight:600; font-size:9pt; margin-bottom:6mm; }}
.lead {{ font-size:11pt; color:var(--ink); margin:0 0 5mm; line-height:1.5; }}
.box {{ border:1px solid var(--teal); border-radius:3mm; padding:4mm 5mm; margin:0 0 5mm; line-height:1.5; }}
.box ul {{ margin:1.5mm 0 0; padding-left:5mm; }}
h2.bab {{ color:var(--teal); font-size:13pt; border-bottom:1.5pt solid var(--teal); padding-bottom:1.5mm; margin:7mm 0 4mm; break-after:avoid; }}
.cover {{ break-after: page; }}
.soal {{ break-inside: avoid; border:1px solid var(--line); border-radius:2.5mm; padding:3.5mm 4.5mm; margin:0 0 4mm; }}
.head {{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:1.5mm; }}
.id {{ font-weight:700; color:var(--teal); font-size:13pt; }}
.no {{ color:#8a9494; font-size:7.5pt; }}
.tujuan {{ font-size:8.8pt; color:var(--mut); margin-bottom:2.5mm; line-height:1.4; }}
.tujuan b {{ color:var(--ink); font-weight:600; }}
.stem, .txt {{ white-space: pre-wrap; }}
.stem {{ font-size:11pt; line-height:1.5; margin-bottom:2.5mm; }}
ol.opsi {{ list-style:none; margin:0 0 3mm; padding:0; }}
ol.opsi li {{ display:flex; gap:2.5mm; margin:0 0 1.2mm; line-height:1.45; }}
.lbl {{ font-weight:600; min-width:5mm; }}
.kunci {{ background:var(--soft); border-radius:2mm; padding:2.5mm 3.5mm; font-size:9.3pt; line-height:1.45; }}
.peng {{ margin-top:1.5mm; }}
.peng ul {{ list-style:none; margin:1mm 0 0; padding:0; }}
.peng li {{ display:flex; gap:2mm; margin-bottom:0.8mm; }}
.code {{ color:var(--mut); }}
</style></head><body>
<div class="cover">
<div class="over">PINTAR · Evaluasi soal</div>
<h1>Buku Soal Penilaian</h1>
<p class="lead">Buku ini berisi <b>{len(items)} soal</b> pilihan ganda Matematika SD Kelas 5 yang Anda nilai, dalam urutan yang sama dengan lembar nilai Anda. Isinya sama persis dengan berkas soal yang sudah Anda terima; hanya tampilannya yang dibuat lebih mudah dibaca.</p>
<div class="box"><b>Cara memakai buku ini</b><ul>
<li>Soal bernomor 1 sampai {len(items)}. <b>Nomor soal sama dengan nomor baris di Lembar Penilaian (Excel).</b></li>
<li>Baca soal, lalu isi nilainya di baris dengan nomor yang sama di Lembar Penilaian. Buku ini tidak perlu diisi atau dikirim kembali.</li>
<li>Untuk setiap soal tercantum tujuan pembelajarannya, pokok soal, empat pilihan jawaban, usulan kunci jawaban dengan alasannya, dan pemahaman keliru yang diwakili setiap pengecoh. Usulan kunci bisa saja salah: itulah yang Anda periksa.</li>
<li>Kode kecil di samping nomor (misalnya B1-001) hanya untuk pencatatan; Anda tidak perlu memakainya.</li>
<li>Nilailah setiap soal secara mandiri. Jangan berdiskusi dengan juri lain sampai lembar Anda diserahkan.</li>
</ul></div>
</div>
{"".join(cards)}
</body></html>'''
open(out_html, 'w', encoding='utf-8').write(doc)
print(len(items), 'items;', len(obj), 'objectives')
