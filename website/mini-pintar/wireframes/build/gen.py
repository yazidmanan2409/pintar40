# -*- coding: utf-8 -*-
"""Mini-PINTAR structural wireframes. Greyscale, annotated, no visual design."""
import html, pathlib

D, M = 560, 390          # desktop frame width, mobile frame width
DH, MH = 408, 648        # frame heights

def frame(w, h, cap, sub, inner):
    return (f'<div class="frame" style="width:{w}px;height:{h}px">'
            f'<div class="cap">{cap} <span>{sub}</span></div>'
            f'<div class="vp">{inner}</div></div>')

def notes(title, items, a11y):
    li = "".join(f"<li>{i}</li>" for i in items)
    return (f'<div class="notes"><h4>{title}</h4><ol>{li}</ol>'
            f'<div class="a11y"><p>{a11y}</p></div></div>')

def chrome(step, n=None, of=None, exit_="Keluar"):
    dots = ""
    if n:
        dots = '<div class="stepdot">' + "".join(
            f'<i class="{"on" if i < n else ""}"></i>' for i in range(of)) + '</div>'
    return (f'<div class="chrome"><span>{step}</span>{dots}'
            f'<span>ID | EN &nbsp; {exit_}</span></div>')

# ---------------------------------------------------------------- the steps
S0 = (chrome("mini-pintar", exit_="Keluar") +
      '<div style="flex:1;display:flex;flex-direction:column;justify-content:center">'
      '<h2 class="t">Dua menit.</h2>'
      '<p class="l">Tidak ada akun, tidak ada data yang disimpan.</p>'
      '<div class="btn" style="margin-top:14px;margin-bottom:auto">Mulai</div></div>'
      '<p class="meta">honesty statement 1 of 2</p>')

S1 = (chrome("Pemetaan Awal", 2, 3) +
      '<p class="meta" style="margin-bottom:8px">Ini bukan ujian. Jawaban '
      'Anda dipakai untuk menyusun urutan bacaan yang sesuai.</p>'
      '<h2 class="t">Sebuah laporan sekolah menulis: &ldquo;85% siswa lulus '
      'ujian akhir.&rdquo;</h2>'
      '<p class="l">Apa yang paling perlu Anda ketahui berikutnya?</p>'
      '<div class="box">A &nbsp; Berapa siswa yang mengikuti ujian itu.</div>'
      '<div class="box sel">B &nbsp; Berapa persentasenya tahun lalu.</div>'
      '<div class="box">C &nbsp; Siapa yang mengajar kelas itu.</div>'
      '<div class="box">D &nbsp; Berapa nilai rata-ratanya.</div>'
      '<div class="btn">Berikutnya</div>'
      '<p class="meta" style="text-align:center;margin-top:7px">Lewati</p>')

S2 = (chrome("Peta Bacaan") +
      '<h2 class="t">Peta Bacaan</h2>'
      '<p class="l">Mulailah dari kartu paling atas. Urutannya disusun dari '
      'jawaban Anda.</p>'
      '<div class="box tier"><div class="lbl">Baca ini lebih dulu</div>'
      'Cukup atau belum<div class="m">Jawaban Anda mengambil kesimpulan dari '
      'bukti yang masih sedikit.</div></div>'
      '<div class="box tier w"><div class="lbl">Perlu dibaca</div>'
      'Angka dan dasarnya<div class="m">Jawaban Anda menuju perbandingan lebih '
      'dulu.</div></div>'
      '<div class="box tier k"><div class="lbl">Sudah Anda kuasai</div>'
      'Berhubungan atau menyebabkan<div class="m">Jawaban Anda sudah tepat di '
      'bagian ini.</div></div>'
      '<div class="btn">Buka pelajarannya</div>')

S3 = (chrome("Pelajaran") +
      '<h2 class="t">Kapan sebuah kesimpulan boleh diambil</h2>'
      '<p class="l">Setiap kesimpulan berdiri di atas dua hal: berapa banyak '
      'yang diamati, dan berapa lama. Tiga siswa selama satu minggu memberi '
      'kita sesuatu, tetapi belum cukup untuk memisahkan&hellip;</p>'
      '<div class="hr"></div>'
      '<div class="box"><div class="lbl">Contoh bertahap</div>'
      'Berapa yang cukup?<div class="m">1 &nbsp; Berapa banyak yang diamati? '
      'Tiga.</div></div>'
      '<div class="box g" style="border-style:dashed">Tampilkan langkah '
      'berikutnya</div>'
      '<div class="btn">Lanjut ke Uji Penguasaan</div>')

S4 = (chrome("Uji Penguasaan", 1, 2) +
      '<div class="meta" style="display:flex;justify-content:space-between;'
      'margin-bottom:9px">Waktu berjalan 00:42<span>Tandai</span></div>'
      '<h2 class="t">Sebuah program baru dicoba di dua kelas selama satu '
      'semester, dan hasilnya membaik.</h2>'
      '<p class="l">Mana yang paling menambah kekuatan buktinya?</p>'
      '<div class="box">A &nbsp; Membandingkan dengan kelas serupa yang tidak '
      'mengikuti program.</div>'
      '<div class="box">B &nbsp; Menambah jumlah kelas yang mengikuti.</div>'
      '<div class="pill">&#129517; Perlu arah? &nbsp;<span style="color:#777">'
      '&mdash; tersedia sejak awal, dan muncul sendiri setelah jeda</span></div>'
      '<div class="btn">Berikutnya</div>')

S5 = (chrome("Hasil") +
      '<h2 class="t">Belum cukup bukti.</h2>'
      '<p class="l">Dua pertanyaan belum cukup untuk menyimpulkan penguasaan. '
      'Itu bukan kekurangan Anda &mdash; itu batas buktinya.</p>'
      '<div class="box"><div class="lbl">Batas bukti</div>Ini cukup untuk satu '
      'bacaan kecil. Belum cukup untuk menilai penguasaan seseorang.</div>'
      '<div class="box" style="border-style:dashed"><div class="m">Pemetaan '
      'Awal dan Uji Penguasaan menanyakan hal yang berbeda, jadi keduanya '
      'tidak dibandingkan.</div></div>'
      '<div class="btn">Lihat apa yang barusan terjadi</div>')

S6 = (chrome("Itu tadi PINTAR") +
      '<h2 class="t">Itu tadi PINTAR.</h2>'
      '<div class="box tier"><div class="lbl">Pemetaan Awal</div>Jawaban Anda '
      'bukan nilai. Jawaban Anda adalah bukti.</div>'
      '<div class="box tier"><div class="lbl">Peta Bacaan</div>Urutannya '
      'berubah karena jawaban Anda.</div>'
      '<div class="box tier"><div class="lbl">Pelajaran</div>Satu langkah '
      'berikutnya, bukan seluruh buku.</div>'
      '<div class="box tier"><div class="lbl">Uji Penguasaan</div>Bantuan '
      'tersedia, dan tidak pernah menyebut jawabannya.</div>'
      '<div class="box tier"><div class="lbl">Hasil</div>Menyebut apa yang '
      'didukung bukti, dan menyebut batasnya.</div>')

S7 = ('<div class="chrome"><span>kembali ke pintarselalu.com</span>'
      '<span>ID | EN</span></div>'
      '<p class="l" style="font-size:12px;color:#111">PINTAR tidak sekadar '
      'memberi soal dan nilai. PINTAR menunjukkan apa yang didukung bukti saat '
      'ini, dan membantu Anda memilih langkah berikutnya.</p>'
      '<div class="hr"></div>'
      '<div class="box">Apa artinya bagi pendidik &rarr;</div>'
      '<div class="box">Bagaimana PINTAR menjaga bukti &rarr;</div>'
      '<div class="box">Bicara dengan kami &rarr;</div>'
      '<p class="meta" style="margin-top:10px">Yang barusan adalah miniatur '
      'publik: bukan asesmen resmi, tidak menghasilkan sertifikat, dan tidak '
      'meninggalkan catatan tentang Anda.</p>'
      '<p class="meta" style="margin-top:6px;color:#999">honesty statement 2 of 2</p>')

STEPS = [
 ("0 &middot; Threshold", "corporate &rarr; product, ~400ms", S0,
  ["<b>The crossing.</b> Header collapses to one <i>Keluar</i>; marketing type "
   "scale steps down to product scale; ground shifts to #FBFAF7; footer gone.",
   "<b>Nothing else on screen.</b> No nav, no CTA, no cookie banner, no chat "
   "widget, no newsletter.",
   "<b>First of two honesty statements.</b> Eight words, before anything is "
   "asked of the visitor.",
   "<b>Reload consequence disclosed here</b>, because §6.3 keeps no storage."],
  "<b>A11y:</b> transition removed under <code>prefers-reduced-motion</code>, "
  "end state identical. Focus lands on the <code>h1</code>."),

 ("1 &middot; Pemetaan Awal", "3 questions, no score, skippable", S1,
  ["<b>Real radio group</b> &mdash; arrow keys move within it. Choosing does "
   "<i>not</i> auto-advance; the visitor confirms.",
   "<b>Dot progress, never a percentage.</b> Text equivalent present for AT.",
   "<b>No right/wrong feedback at any point</b> in this stage. The absence is "
   "itself part of the demonstration.",
   "<b>Lewati is a first-class action.</b> Skipping is evidence &mdash; an "
   "honest &ldquo;I don't know&rdquo; &mdash; and §4.1 treats it as such.",
   "<b>Back is permitted</b> and the previous answer is shown and changeable. "
   "Nothing is submitted, so nothing is being gamed."],
  "<b>A11y:</b> step announced by <code>aria-live=\"polite\"</code> "
  "(&ldquo;Pemetaan Awal, pertanyaan 2 dari 3&rdquo;). 56px targets."),

 ("2 &middot; Peta Bacaan", "the adaptation becomes visible", S2,
  ["<b>The payoff moment.</b> First place the visitor sees their own answers "
   "change something.",
   "<b>Each card names their thinking, not their score</b> &mdash; one of nine "
   "misconception-specific reasons (&sect;3.3).",
   "<b>Order is derived, deterministic, and severity-ranked</b> D2 &gt; D3 &gt; "
   "D1. No randomness anywhere in the journey.",
   "<b>Strength is named too.</b> A correct domain gets a KUAT card rather than "
   "disappearing.",
   "<b>All-correct path is designed:</b> no weakness is manufactured; the "
   "reading offered deepens rather than repairs."],
  "<b>A11y:</b> vertical order <i>is</i> the meaning, so it survives narrowing "
  "untouched. Reorder animation removed under reduced motion."),

 ("3 &middot; Pelajaran", "one of three, chosen by the map", S3,
  ["<b>Three lessons exist; the visitor reads one.</b> That is what makes the "
   "reordering meaningful rather than decorative.",
   "<b>Reading, not video.</b> ~120 words, one worked example.",
   "<b>Staged reveal</b> &mdash; the product's own interaction, one step at a "
   "time.",
   "<b>The button stays above the fold</b> after each reveal on mobile."],
  "<b>A11y:</b> revealed steps appended to a <code>aria-live=\"polite\"</code> "
  "list; static full reveal under reduced motion."),
]

STEPS2 = [
 ("4 &middot; Uji Penguasaan", "2 questions, disjoint from stage 1", S4,
  ["<b>Time counts up, never down</b>, and is decorative: "
   "<code>aria-hidden</code>, no limit imposed.",
   "<b>Help is not gated behind a timer.</b> The pill appears after ~20s of "
   "inactivity <i>and</i> a persistent <i>Perlu arah?</i> button is there from "
   "the start &mdash; so an AT user never races a clock.",
   "<b>Two staged levels</b>: ARAH, then PETUNJUK. Neither names nor narrows to "
   "the correct option.",
   "<b>Zero item overlap with Pemetaan Awal</b>, so no &ldquo;improvement&rdquo; "
   "can be an artefact of having seen the question.",
   "<b>Inline pill, never a modal.</b>"],
  "<b>A11y:</b> pill announced politely and <b>does not take focus</b>. "
  "Removing the timing dependency also removes WCAG 2.2.1 entirely."),

 ("5 &middot; Hasil", "the BELUM_CUKUP outcome shown", S5,
  ["<b>Reachable by the commonest route.</b> One of two &rarr; "
   "<code>BELUM_CUKUP</code>. The honest refusal is the ordinary result, not an "
   "edge case kept for the brochure.",
   "<b>The evidence limit appears in all three outcomes</b>, including the best "
   "one &mdash; especially the best one.",
   "<b>No score, no percentage, no pass/fail.</b> <i>Belum</i>, never "
   "<i>tidak</i>.",
   "<b>No delta, and it says why.</b> Refusing to compute a flattering number "
   "is a stronger demonstration than the number would have been."],
  "<b>A11y:</b> outcome is an <code>h1</code>; the limit statement is ordinary "
  "prose, not a visually-hidden footnote."),

 ("6 &middot; The reveal", "what actually happened", S6,
  ["<b>The path they walked</b>, annotated with the mechanism rather than the "
   "feature name.",
   "<b>Vertical on both desktop and mobile.</b> A horizontal diagram that "
   "becomes vertical is two diagrams; the vertical one is better on both.",
   "<b>R9 held in the grammar:</b> PINTAR <i>menunjukkan</i> and "
   "<i>membantu</i>; the human <i>memilih</i>. The system never holds the "
   "deciding verb."],
  "<b>A11y:</b> an ordered list, not a decorative graphic. Readable in full "
  "without CSS."),

 ("7 &middot; Return", "three doors, not one CTA", S7,
  ["<b>Three doors</b>, because a single CTA wastes the one moment the visitor "
   "is most willing to go further by guessing which way they want to go.",
   "<b>Second honesty statement</b>, where it reads as integrity rather than as "
   "a disclaimer wall.",
   "<b>Keluar mid-journey returns to the homepage at the invitation section</b>, "
   "not the top &mdash; the visitor resumes where they left the argument."],
  "<b>A11y:</b> doors are links, not buttons, and are reachable in reading "
  "order before the honesty note."),
]

def sheet(title, sub, tag, steps, w, h, path):
    rows = "".join(
        f'<div class="row">{frame(w, h, c, s, body)}{notes("Interaction &amp; behaviour", ns, a)}</div>'
        for c, s, body, ns, a in steps)
    doc = f"""<!doctype html><html lang="id"><head><meta charset="utf-8">
<link rel="stylesheet" href="base.css"></head><body>
<div class="sheet-h"><div class="tag">{tag}</div>
<h1>{title}</h1><p>{sub}</p></div>{rows}
<div class="foot">Mini-PINTAR M1 &middot; structural wireframe &mdash; layout and
behaviour only. Visual direction (colour, typography, photography) is stage H and
is deliberately not applied. Copy shown is the approved ID content of
M1-CONTENT-AND-INTERACTION.md &sect;3, abbreviated to fit the frame.</div>
</body></html>"""
    pathlib.Path(path).write_text(doc, encoding="utf-8")

sheet("Mini-PINTAR &mdash; desktop, steps 0&ndash;3",
      "Threshold &rarr; Pemetaan Awal &rarr; Peta Bacaan &rarr; Pelajaran &nbsp;&middot;&nbsp; content column 34rem, centred",
      "Wireframe &mdash; not an implementation", STEPS, D, DH, "d1.html")
sheet("Mini-PINTAR &mdash; desktop, steps 4&ndash;7",
      "Uji Penguasaan &rarr; Hasil &rarr; the reveal &rarr; return",
      "Wireframe &mdash; not an implementation", STEPS2, D, DH, "d2.html")
sheet("Mini-PINTAR &mdash; mobile 390px, steps 0&ndash;3",
      "16px gutters, single column, 56px targets, primary action sticky once chosen",
      "Wireframe &mdash; not an implementation", STEPS, M, MH, "m1.html")
sheet("Mini-PINTAR &mdash; mobile 390px, steps 4&ndash;7",
      "Nothing depends on hover; no horizontal overflow at 320px",
      "Wireframe &mdash; not an implementation", STEPS2, M, MH, "m2.html")
# the detail sheet is bespoke: the same outcome at both widths, side by side
c, sub, body, ns, a = STEPS2[1]
det_row = ('<div class="row">'
           f'{frame(D, 470, "Desktop", "content column 34rem", body)}'
           f'{frame(M, 470, "Mobile 390px", "16px gutters", body)}'
           '</div>'
           f'<div class="row">{notes("Why this is the outcome that matters", ns, a)}</div>')
doc = f"""<!doctype html><html lang="id"><head><meta charset="utf-8">
<link rel="stylesheet" href="base.css"></head><body>
<div class="sheet-h"><div class="tag">Wireframe &mdash; detail</div>
<h1>Mini-PINTAR &mdash; the outcome that matters</h1>
<p>BELUM CUKUP BUKTI at both widths. Reachable by the commonest route &mdash;
one correct answer out of two &mdash; so the honest refusal is the ordinary
result rather than an edge case kept alive for the brochure.</p></div>{det_row}
<div class="foot">Mini-PINTAR M1 &middot; structural wireframe &mdash; layout and
behaviour only. The evidence-limit statement appears in all three outcomes,
including the best one.</div>
</body></html>"""
pathlib.Path("detail.html").write_text(doc, encoding="utf-8")
print("sheets written")
