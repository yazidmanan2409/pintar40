/**
 * Other cards, for the recognition test only (README §G). Seven plain, competent
 * CR80 designs for invented organisations in the invented town of Kaliandra: no
 * real brand, bank or institution. They use ordinary system typefaces, as other
 * organisations would, and none is made worse to help PINTAR win. One of them
 * (Yayasan) deliberately shares PINTAR's two-band structure, without the line, so
 * the test shows what carries the recognition. Each brand name has the class
 * `merek`, so the test can cover it exactly as it covers «PINTAR SELALU».
 */
const kartu = (latar: string, isi: string, garis = false) =>
  `<div class="kl" style="position:relative;width:85.6mm;height:53.98mm;border-radius:3.18mm;overflow:hidden;background:${latar};${garis ? "box-shadow:inset 0 0 0 0.2mm rgba(0,0,0,.12);" : ""}">${isi}</div>`;
const abs = (s: string) => `position:absolute;${s}`;
function kode(n: number, lebar: number): string {
  // a plain bar pattern, deterministic, for the library card (not a real barcode)
  let x = 0, s = "", seed = 7;
  for (let i = 0; i < n; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const w = 0.25 + (seed % 3) * 0.25;
    if (i % 2 === 0) s += `<div style="${abs(`left:${x.toFixed(2)}mm;top:0;width:${w}mm;height:100%;background:#1B1B1B`)}"></div>`;
    x += w + 0.2;
    if (x > lebar) break;
  }
  return s;
}

export const KARTU_LAIN: Array<{ nama: string; html: string }> = [
  {
    nama: "Perpustakaan Kaliandra (library card)",
    html: kartu("#FFFFFF", `
<div style="${abs("left:0;right:0;top:0;height:11mm;background:#2B4A7A")}"></div>
<p class="merek" style="${abs("left:5mm;top:3.6mm;margin:0;font:700 8pt 'Liberation Sans';color:#fff;letter-spacing:.04em")}">PERPUSTAKAAN KALIANDRA</p>
<p style="${abs("left:5mm;top:16mm;margin:0;font:400 6pt 'Liberation Sans';color:#555")}">Kartu Anggota</p>
<p style="${abs("left:5mm;top:19.5mm;margin:0;font:700 11pt 'Liberation Sans';color:#1B1B1B")}">Dimas Anggara</p>
<p style="${abs("left:5mm;top:26mm;margin:0;font:400 7.5pt 'Liberation Mono';color:#333")}">No. 0412 8830 5521</p>
<div style="${abs("left:5mm;bottom:5mm;width:48mm;height:9mm")}">${kode(90, 48)}</div>`, true),
  },
  {
    nama: "Koperasi Guru Kaliandra (member card)",
    html: kartu("#7E3A2F", `
<div style="${abs("left:5mm;top:5mm;width:9mm;height:9mm;border-radius:50%;border:0.5mm solid #F2D9C7")}"></div>
<p style="${abs("left:5mm;top:7.6mm;width:9mm;margin:0;text-align:center;font:700 6.5pt 'DejaVu Sans';color:#F2D9C7")}">KG</p>
<p class="merek" style="${abs("left:17mm;top:6.2mm;margin:0;font:700 8pt 'DejaVu Sans';color:#F2D9C7")}">Koperasi Guru Kaliandra</p>
<p style="${abs("left:5mm;bottom:12mm;margin:0;font:400 11pt 'DejaVu Sans';color:#fff")}">Wulan Sari Pratiwi</p>
<p style="${abs("left:5mm;bottom:6.5mm;margin:0;font:400 6.5pt 'DejaVu Sans';color:#F2D9C7")}">Anggota · 2019</p>`),
  },
  {
    nama: "Temu Pendidik Kaliandra 2026 (event badge)",
    html: kartu("#FFFFFF", `
<div style="${abs("left:0;top:0;bottom:0;width:7mm;background:#1F8A8A")}"></div>
<p class="merek" style="${abs("left:12mm;top:5mm;margin:0;font:700 7pt 'Liberation Sans';color:#1F8A8A;text-transform:uppercase;letter-spacing:.08em")}">Temu Pendidik Kaliandra 2026</p>
<p style="${abs("left:12mm;top:18mm;margin:0;font:700 14pt 'Liberation Sans';color:#111")}">Hana Oktaviani</p>
<p style="${abs("left:12mm;top:27mm;margin:0;font:400 8pt 'Liberation Sans';color:#444")}">Pembicara</p>
<p style="${abs("left:12mm;bottom:5mm;margin:0;font:400 6.5pt 'Liberation Sans';color:#777")}">12–13 Oktober · Aula Kaliandra</p>`, true),
  },
  {
    nama: "Klub Renang Kaliandra (club card)",
    html: kartu("#16324F", `
<svg style="${abs("left:0;bottom:0;width:85.6mm;height:18mm")}" viewBox="0 0 856 180" preserveAspectRatio="none"><path d="M0 90 C 140 40, 280 140, 428 90 S 716 40, 856 90 L856 180 L0 180 Z" fill="#1E4668"/></svg>
<p class="merek" style="${abs("left:6mm;top:6mm;margin:0;font:700 9pt 'DejaVu Sans';color:#9FD3F0")}">Klub Renang Kaliandra</p>
<p style="${abs("left:6mm;top:22mm;margin:0;font:400 10.5pt 'DejaVu Sans';color:#fff")}">Rudi Hartono Saputra</p>
<p style="${abs("left:6mm;top:28.5mm;margin:0;font:400 6.5pt 'DejaVu Sans';color:#BFD8E8")}">Anggota sejak 2022</p>`),
  },
  {
    nama: "Yayasan Cahaya Kaliandra (volunteer card: the same two bands, no line)",
    html: kartu("#FFFFFF", `
<div style="${abs("left:0;right:0;top:31mm;bottom:0;background:#2F5D50")}"></div>
<p class="merek" style="${abs("left:6mm;top:5.5mm;margin:0;font:700 8pt 'DejaVu Serif';color:#2F5D50")}">Yayasan Cahaya Kaliandra</p>
<p style="${abs("left:6mm;top:17mm;margin:0;font:400 11pt 'DejaVu Serif';color:#1B1B1B")}">Agus Setiawan</p>
<p style="${abs("left:6mm;top:35mm;margin:0;font:700 7.5pt 'DejaVu Sans';color:#fff")}">Relawan</p>
<p style="${abs("left:6mm;top:39mm;margin:0;font:400 7.5pt 'DejaVu Sans';color:#DDE9E4")}">Program Baca Bersama</p>`, true),
  },
  {
    nama: "Museum Kota Kaliandra (friends card)",
    html: kartu("#EFE6D4", `
<p class="merek" style="${abs("left:6mm;top:6mm;margin:0;font:400 10pt 'Liberation Serif';color:#2A2118;letter-spacing:.02em")}">Museum Kota Kaliandra</p>
<div style="${abs("left:6mm;right:6mm;top:14mm;height:0.3mm;background:#2A2118")}"></div>
<p style="${abs("left:6mm;top:17mm;margin:0;font:italic 400 7.5pt 'Liberation Serif';color:#5A4B3A")}">Sahabat Museum</p>
<p style="${abs("left:6mm;bottom:10mm;margin:0;font:400 11pt 'Liberation Serif';color:#2A2118")}">Siti Rahayu Lestari</p>
<p style="${abs("left:6mm;bottom:5.5mm;margin:0;font:400 6.5pt 'Liberation Serif';color:#5A4B3A")}">No. 2026-0147</p>`),
  },
  {
    nama: "Klinik Sehat Kaliandra (staff card)",
    html: kartu("#FFFFFF", `
<p class="merek" style="${abs("right:6mm;top:5.5mm;margin:0;font:700 7.5pt 'Liberation Sans';color:#2E6FB5")}">Klinik Sehat Kaliandra</p>
<p style="${abs("left:6mm;top:20mm;margin:0;font:700 12pt 'Liberation Sans';color:#1E2A38")}">dr. Maya Kusuma</p>
<div style="${abs("left:6mm;top:27.5mm;width:30mm;height:0.5mm;background:#2E6FB5")}"></div>
<p style="${abs("left:6mm;top:30mm;margin:0;font:400 7.5pt 'Liberation Sans';color:#445")}">Staf Pelayanan</p>
<p style="${abs("left:6mm;bottom:5mm;margin:0;font:400 6.5pt 'Liberation Mono';color:#667")}">KS-20931</p>`, true),
  },
];

/** A neutral back, for the back's recognition test. */
export const BELAKANG_LAIN: Array<{ nama: string; html: string }> = [
  {
    nama: "a library card back",
    html: kartu("#FFFFFF", `
<div style="${abs("left:0;right:0;top:6mm;height:8mm;background:#1B1B1B")}"></div>
<p style="${abs("left:6mm;top:19mm;right:6mm;margin:0;font:400 6.5pt/1.5 'Liberation Sans';color:#444")}">Kartu ini milik perpustakaan. Jika menemukan kartu ini, mohon kembalikan ke meja layanan.</p>
<div style="${abs("left:6mm;bottom:6mm;width:40mm;height:0.2mm;background:#999")}"></div>
<p style="${abs("left:6mm;bottom:3.6mm;margin:0;font:400 5.5pt 'Liberation Sans';color:#777")}">Tanda tangan</p>`, true),
  },
  {
    nama: "a club card back with a QR",
    html: kartu("#16324F", `
<div style="${abs("left:6mm;top:9mm;width:24mm;height:24mm;background:#fff;border-radius:1mm")}">
<svg viewBox="0 0 10 10" style="width:100%;height:100%" shape-rendering="crispEdges">${[...Array(100)].map((_, i) => ((i * 37) % 7 < 3 ? `<rect x="${i % 10}" y="${Math.floor(i / 10)}" width="1" height="1" fill="#16324F"/>` : "")).join("")}</svg></div>
<p style="${abs("left:36mm;top:12mm;right:6mm;margin:0;font:400 7.5pt/1.5 'DejaVu Sans';color:#DCE9F2")}">Tunjukkan kartu ini di pintu masuk kolam.</p>`),
  },
];
