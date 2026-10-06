/**
 * Other certificates, for the recognition test only (README §I). Six plain,
 * competent A4 certificates from invented organisations in the invented town of
 * Kaliandra: no real brand, school, agency or emblem. They use ordinary system
 * typefaces and the conventions other issuers really use (a border, a seal
 * ring, signature lines, a header band, a QR), because the test is only fair if
 * the others are credible. None is made worse to help PINTAR win.
 *
 * One (Klub Catur) deliberately shares the Modern direction's structure, a dark
 * band two-thirds down carrying the issuer, without the gold line or PINTAR's
 * type, so the test shows what carries the recognition. Every brand name has
 * the class `merek`, so the test covers it exactly as it covers «PINTAR SELALU».
 */
const abs = (s: string) => `position:absolute;${s}`;
const lembar = (lebar: number, tinggi: number, latar: string, isi: string) =>
  `<div class="sl" style="position:relative;width:${lebar}mm;height:${tinggi}mm;overflow:hidden;background:${latar};-webkit-print-color-adjust:exact;print-color-adjust:exact">${isi}</div>`;

/** A drawn signature: an invented squiggle, as other issuers print one. */
function tandaTangan(x: number, y: number, warna: string, benih: number): string {
  let d = "M2 18";
  let s = benih;
  for (let i = 0; i < 7; i++) {
    s = (s * 9301 + 49297) % 233280;
    const a = 6 + i * 6, b = 4 + (s % 16), c = a + 3, e = 26 - (s % 14);
    d += ` Q${a} ${b} ${c} ${e}`;
  }
  return `<svg style="${abs(`left:${x}mm;top:${y}mm;width:44mm;height:12mm`)}" viewBox="0 0 50 28"><path d="${d}" fill="none" stroke="${warna}" stroke-width="1.1" stroke-linecap="round"/></svg>`;
}
function garisTtd(x: number, y: number, nama: string, jabatan: string, huruf: string, warna: string): string {
  return `<div style="${abs(`left:${x}mm;top:${y}mm;width:56mm;border-top:0.25mm solid ${warna};padding-top:1.5mm;text-align:center`)}"><p style="margin:0;font:700 9pt '${huruf}';color:${warna}">${nama}</p><p style="margin:0.6mm 0 0;font:400 8pt '${huruf}';color:${warna}">${jabatan}</p></div>`;
}
function qrHitam(m: number[][], x: number, y: number, sisi: number, warna = "#111"): string {
  const n = m.length;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) d += `M${c} ${r}h1v1h-1z`;
  return `<svg style="${abs(`left:${x}mm;top:${y}mm;width:${sisi}mm;height:${sisi}mm`)}" viewBox="-4 -4 ${n + 8} ${n + 8}" shape-rendering="crispEdges"><rect x="-4" y="-4" width="${n + 8}" height="${n + 8}" fill="#fff"/><path d="${d}" fill="${warna}"/></svg>`;
}

export function sertifikatLain(qr: number[][]): Array<{ nama: string; html: string; mendatar: boolean }> {
  return [
    {
      nama: "Lembaga Kursus Lingua Kaliandra (course certificate, landscape, bordered)",
      mendatar: true,
      html: lembar(297, 210, "#FFFDF8", `
<div style="${abs("left:10mm;top:10mm;right:10mm;bottom:10mm;border:0.7mm solid #1D3557")}"></div>
<div style="${abs("left:12mm;top:12mm;right:12mm;bottom:12mm;border:0.25mm solid #1D3557")}"></div>
<p class="merek" style="${abs("left:0;right:0;top:24mm;margin:0;text-align:center;font:700 12pt 'Liberation Serif';letter-spacing:.12em;color:#1D3557")}">LEMBAGA KURSUS LINGUA KALIANDRA</p>
<p style="${abs("left:0;right:0;top:40mm;margin:0;text-align:center;font:400 38pt 'Liberation Serif';letter-spacing:.18em;color:#1D3557")}">SERTIFIKAT</p>
<p style="${abs("left:0;right:0;top:64mm;margin:0;text-align:center;font:italic 400 12pt 'Liberation Serif';color:#333")}">diberikan kepada</p>
<p style="${abs("left:0;right:0;top:74mm;margin:0;text-align:center;font:700 28pt 'Liberation Serif';color:#111")}">Wulan Sari Pratiwi</p>
<div style="${abs("left:98mm;right:98mm;top:92mm;border-top:0.3mm solid #1D3557")}"></div>
<p style="${abs("left:40mm;right:40mm;top:97mm;margin:0;text-align:center;font:400 12pt/1.5 'Liberation Serif';color:#333")}">atas keberhasilannya menyelesaikan Program Bahasa Inggris Tingkat Menengah (60 jam pelajaran)</p>
<p style="${abs("left:0;right:0;top:118mm;margin:0;text-align:center;font:400 11pt 'Liberation Serif';color:#333")}">Kaliandra, 20 Juni 2026</p>
${tandaTangan(52, 140, "#1D3557", 3)}${garisTtd(46, 154, "Drs. Hari Wibowo", "Direktur", "Liberation Serif", "#1D3557")}
${tandaTangan(203, 140, "#1D3557", 11)}${garisTtd(195, 154, "Maya Anggraini, S.Pd.", "Pengajar", "Liberation Serif", "#1D3557")}
<div style="${abs("left:133mm;top:138mm;width:31mm;height:31mm;border-radius:50%;border:0.6mm solid #1D3557")}"><div style="${abs("inset:1.6mm;border-radius:50%;border:0.25mm solid #1D3557")}"></div><p style="${abs("left:0;right:0;top:11.5mm;margin:0;text-align:center;font:700 13pt 'Liberation Serif';color:#1D3557")}">LK</p></div>`),
    },
    {
      nama: "Pusat Pelatihan Guru Kaliandra (training certificate, side band and QR)",
      mendatar: false,
      html: lembar(210, 297, "#FFFFFF", `
<div style="${abs("left:0;top:0;bottom:0;width:16mm;background:#1F7A7A")}"></div>
<p class="merek" style="${abs("left:30mm;top:24mm;margin:0;font:700 11pt 'Liberation Sans';color:#1F7A7A")}">Pusat Pelatihan Guru Kaliandra</p>
<p style="${abs("left:30mm;top:58mm;margin:0;font:700 26pt 'Liberation Sans';color:#1F7A7A")}">Sertifikat Pelatihan</p>
<p style="${abs("left:30mm;top:78mm;margin:0;font:400 11pt 'Liberation Sans';color:#444")}">Dengan ini menyatakan bahwa</p>
<p style="${abs("left:30mm;top:88mm;right:20mm;margin:0;font:700 24pt 'Liberation Sans';color:#111")}">Agus Setiawan</p>
<p style="${abs("left:30mm;top:104mm;right:20mm;margin:0;font:400 11pt/1.5 'Liberation Sans';color:#444")}">telah mengikuti pelatihan <b>Pembelajaran Berdiferensiasi untuk Kelas Campuran</b> pada 4–6 Agustus 2026, dengan total 32 jam pelajaran.</p>
${tandaTangan(34, 218, "#222", 7)}${garisTtd(30, 232, "Dr. Sri Mulyani, M.Pd.", "Kepala Pusat Pelatihan", "Liberation Sans", "#222")}
${qrHitam(qr, 160, 222, 28)}
<p style="${abs("left:30mm;bottom:18mm;margin:0;font:400 8pt 'Liberation Mono';color:#666")}">No. PPGK/2026/08/0417</p>`),
    },
    {
      nama: "Olimpiade Sains Kaliandra 2026 (award, header band, centred)",
      mendatar: false,
      html: lembar(210, 297, "#FFFFFF", `
<div style="${abs("left:0;right:0;top:0;height:46mm;background:#2451A6")}"></div>
<p class="merek" style="${abs("left:0;right:0;top:14mm;margin:0;text-align:center;font:700 12pt 'DejaVu Sans';letter-spacing:.06em;color:#fff")}">OLIMPIADE SAINS KALIANDRA 2026</p>
<p style="${abs("left:0;right:0;top:26mm;margin:0;text-align:center;font:400 9.5pt 'DejaVu Sans';color:#D6E2F7")}">Tingkat SMP se-Kota Kaliandra</p>
<p style="${abs("left:0;right:0;top:70mm;margin:0;text-align:center;font:700 28pt 'DejaVu Sans';letter-spacing:.04em;color:#2451A6")}">PIAGAM PENGHARGAAN</p>
<p style="${abs("left:0;right:0;top:92mm;margin:0;text-align:center;font:400 11pt 'DejaVu Sans';color:#444")}">diberikan kepada</p>
<p style="${abs("left:0;right:0;top:102mm;margin:0;text-align:center;font:700 24pt 'DejaVu Sans';color:#111")}">Dimas Anggara</p>
<p style="${abs("left:0;right:0;top:120mm;margin:0;text-align:center;font:400 11pt/1.5 'DejaVu Sans';color:#444")}">sebagai</p>
<p style="${abs("left:0;right:0;top:128mm;margin:0;text-align:center;font:700 18pt 'DejaVu Sans';color:#B8860B")}">Juara II Bidang Fisika</p>
<div style="${abs("left:91mm;top:150mm;width:28mm;height:28mm;border-radius:50%;background:#2451A6")}"><p style="${abs("left:0;right:0;top:9mm;margin:0;text-align:center;font:700 11pt 'DejaVu Sans';color:#fff")}">OSK</p></div>
<p style="${abs("left:0;right:0;top:192mm;margin:0;text-align:center;font:400 10pt 'DejaVu Sans';color:#444")}">Kaliandra, 3 Mei 2026</p>
${tandaTangan(83, 214, "#222", 5)}${garisTtd(77, 228, "Hana Oktaviani, M.Si.", "Ketua Panitia", "DejaVu Sans", "#222")}`),
    },
    {
      nama: "Museum Kota Kaliandra (volunteer certificate, landscape, serif, rule)",
      mendatar: true,
      html: lembar(297, 210, "#F6F1E7", `
<p class="merek" style="${abs("left:24mm;top:22mm;margin:0;font:400 14pt 'DejaVu Serif';color:#2A2118")}">Museum Kota Kaliandra</p>
<div style="${abs("left:24mm;right:24mm;top:34mm;border-top:0.35mm solid #2A2118")}"></div>
<p style="${abs("left:24mm;top:50mm;margin:0;font:italic 400 13pt 'DejaVu Serif';color:#5A4B3A")}">Sertifikat Relawan</p>
<p style="${abs("left:24mm;top:66mm;margin:0;font:400 30pt 'DejaVu Serif';color:#2A2118")}">Siti Rahayu Lestari</p>
<p style="${abs("left:24mm;top:88mm;width:170mm;margin:0;font:400 11.5pt/1.6 'DejaVu Serif';color:#3D3226")}">atas pengabdiannya sebagai pemandu relawan pada pameran «Jejak Rempah Kaliandra», Januari hingga Juni 2026.</p>
<p style="${abs("left:24mm;bottom:30mm;margin:0;font:400 10pt 'DejaVu Serif';color:#5A4B3A")}">Kaliandra, 30 Juni 2026</p>
${tandaTangan(205, 146, "#2A2118", 9)}${garisTtd(200, 160, "Rudi Hartono", "Kepala Museum", "DejaVu Serif", "#2A2118")}`),
    },
    {
      nama: "Klub Catur Kaliandra (the control: Modern's band, no gold line, not PINTAR's type)",
      mendatar: false,
      html: lembar(210, 297, "#FFFFFF", `
<p style="${abs("left:24mm;top:26mm;margin:0;font:700 10pt 'Liberation Sans';letter-spacing:.14em;color:#2F5D50")}">SERTIFIKAT</p>
<p style="${abs("left:24mm;bottom:147mm;right:24mm;margin:0;font:700 30pt 'Liberation Sans';color:#1B1B1B")}">Rizky Aditya Pratama</p>
<p style="${abs("left:24mm;top:156mm;margin:0;font:400 11pt 'Liberation Sans';color:#444")}">telah menyelesaikan Kelas Catur Dasar (12 pertemuan)</p>
<div style="${abs("left:12mm;right:12mm;top:176mm;height:18mm;background:#2F5D50")}"></div>
<p class="merek" style="${abs("left:24mm;top:182mm;margin:0;font:700 12pt 'Liberation Sans';color:#fff")}">Klub Catur Kaliandra</p>
<p style="${abs("left:24mm;top:236mm;margin:0;font:400 10pt 'Liberation Sans';color:#333")}">12 Juli 2026</p>
<p style="${abs("left:24mm;top:244mm;margin:0;font:400 9pt 'Liberation Mono';color:#555")}">KCK-2026-0088</p>
${qrHitam(qr, 158, 232, 30)}`),
    },
    {
      nama: "Yayasan Cahaya Kaliandra (appreciation, minimal, centred, logo ring)",
      mendatar: false,
      html: lembar(210, 297, "#FFFFFF", `
<div style="${abs("left:94mm;top:24mm;width:22mm;height:22mm;border-radius:50%;border:0.6mm solid #C0572B")}"><div style="${abs("left:6mm;top:6mm;width:9mm;height:9mm;border-radius:50%;background:#C0572B")}"></div></div>
<p class="merek" style="${abs("left:0;right:0;top:52mm;margin:0;text-align:center;font:700 11pt 'DejaVu Sans';color:#C0572B")}">Yayasan Cahaya Kaliandra</p>
<p style="${abs("left:0;right:0;top:92mm;margin:0;text-align:center;font:400 13pt 'DejaVu Sans';letter-spacing:.2em;color:#555")}">SERTIFIKAT APRESIASI</p>
<p style="${abs("left:0;right:0;top:112mm;margin:0;text-align:center;font:700 26pt 'DejaVu Sans';color:#222")}">Laras Pramesti</p>
<p style="${abs("left:36mm;right:36mm;top:132mm;margin:0;text-align:center;font:400 11pt/1.6 'DejaVu Sans';color:#555")}">atas kontribusinya dalam Program Baca Bersama bagi anak-anak Kaliandra sepanjang tahun 2026.</p>
<div style="${abs("left:80mm;right:80mm;top:160mm;border-top:0.3mm solid #BBB")}"></div>
${tandaTangan(35, 212, "#333", 13)}${garisTtd(30, 226, "Nur'aini Rahmawati", "Ketua Yayasan", "DejaVu Sans", "#333")}
${tandaTangan(128, 212, "#333", 17)}${garisTtd(124, 226, "Bambang Sutrisno", "Sekretaris", "DejaVu Sans", "#333")}`),
    },
  ];
}
