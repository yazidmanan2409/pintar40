// Report artefacts as visual material for the corporate site (proposal).
//
// THE ARTEFACT IS THE PRODUCT'S. Every title, label, meaning sentence, state
// name and action below is the PINTAR product's own copy (src/lib/hle.ts),
// every minimum is MC-1's, and every bar is the product's one neutral ink:
// a readiness tier is never painted as a verdict. Only the NUMBERS are
// simulated, and every artefact says so. What the site adds lives OUTSIDE the
// artefact: its frame, its caption, its annotation.
//
// Rendered from data so the same artefact can appear at any size in any
// direction. <div data-spec="kelas"></div> becomes the class report, and so
// on. Every chart carries its table twin (dataviz rule: a tooltip or a bar is
// never the only way to read a value). No storage, no network.

const SIM = "DATA SIMULASI";

const el = (tag, attrs = {}, kids = []) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k, String(v));
  }
  for (const c of [].concat(kids)) if (c != null && c !== false) n.append(typeof c === "string" ? document.createTextNode(c) : c);
  return n;
};
const pct = (v) => `${Math.round(v * 100)}%`;
const iconUse = (id) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("class", "icon"); s.setAttribute("aria-hidden", "true");
  const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
  u.setAttribute("href", `${ICONS}#${id}`); s.append(u); return s;
};
let ICONS = "assets/icons.svg";

function frame({ ctx, title, intro, who }, body, compact) {
  return el("div", { class: "rep", role: "group", "aria-label": `${title} — contoh dengan ${SIM.toLowerCase()}` }, [
    el("div", { class: "rep__top" }, [
      el("div", {}, [el("div", { class: "rep__ctx", text: ctx }), el("div", { class: "rep__title", text: title })]),
      el("span", { class: "rep__sim", text: SIM }),
    ]),
    intro && !compact ? el("p", { class: "rep__intro", text: intro }) : null,
    ...body,
    who ? el("div", { class: "rep__who" }, [iconUse("i-lihat"), who]) : null,
  ]);
}

/** Neutral rows with a table twin. rows: [label, value 0..1 or count, shown] */
function rowsWithTable(rows, caption, total) {
  const max = total ?? 1;
  const list = el("div", { class: "rows", "aria-hidden": "true" }, rows.map((r, i) =>
    el("div", { class: `row${r.key ? " row--key" : ""}`, style: `--i:${Math.min(i, 3)}` }, [
      el("span", { text: r.label }), el("span", { class: "num", text: r.shown }),
      el("div", { class: "bar" }, [el("i", { style: `width:${((r.value / max) * 100).toFixed(1)}%` })]),
    ])));
  // The table twin sits inside a visually hidden box: a table on its own
  // ignores a 1px width and would push the page wider on a phone.
  const table = el("div", { class: "sr" }, [el("table", {}, [
    el("caption", { text: caption }),
    el("tbody", {}, rows.map((r) => el("tr", {}, [el("th", { scope: "row", text: r.label }), el("td", { text: r.shown + (r.key ? " (kunci)" : "") })]))),
  ])]);
  return [list, table];
}

const SPECS = {
  // /mengajar/[kelas]/bukti — the educator's evidence screen.
  kelas: (compact) => frame({
    ctx: "Kelas 8B · Matematika", title: "Apa yang sudah bisa disimpulkan",
    intro: "PINTAR hanya menyimpulkan bila bukti resminya cukup. Belum cukup bukan berarti buruk — artinya belum.",
    who: "Dilihat oleh guru kelas ini",
  }, [
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Pemahaman" }),
      el("span", { class: "mtr__value", text: "72%" }),
      el("span", { class: "mtr__mean", text: "Rata-rata penguasaan kelas pada penilaian akhir." }),
      el("span", { class: "mtr__sample", text: "Dari 22 murid · minimum 5" }),
      compact ? null : el("span", { class: "mtr__action", text: "Tidak perlu diulang — lanjutkan ke materi berikutnya." }),
    ]),
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Kenaikan" }),
      el("span", { class: "mtr__value" }, ["+14", el("small", { text: "poin" })]),
      el("span", { class: "mtr__mean", text: "Selisih penguasaan sebelum dan sesudah pembelajaran, per murid." }),
    ]),
  ], compact),

  // The same screen's bands: PINTAR's fixed bands (D-095), neutral rows.
  kesiapan: (compact) => frame({
    ctx: "Kelas 8B · Matematika", title: "Sebaran hasil Uji Penguasaan",
    intro: "Banyaknya murid pada tiap pita hasil, menurut Uji Penguasaan terakhir mereka.", who: "Dilihat oleh guru, dan oleh pimpinan per kelas",
  }, rowsWithTable([
    { label: "Mantap", value: 9, shown: "9" },
    { label: "Berkembang", value: 6, shown: "6" },
    { label: "Perlu penguatan", value: 7, shown: "7" },
    { label: "Belum mengerjakan Uji Penguasaan", value: 2, shown: "2" },
  ], "Sebaran hasil Uji Penguasaan, kelas 8B (data simulasi)", 24).concat(compact ? [] : [
    el("p", { class: "mtr__mean", style: "margin-top: var(--s-3)", text: "Pita tetap PINTAR: 80% ke atas, 60–79%, dan di bawah 60% atau soal wajib belum tepat. Bukan batas ketuntasan sekolah dan tidak menentukan sertifikat." }),
  ]), compact),

  // Mastery by part: one row per learning objective, named by its statement.
  topik: (compact) => frame({
    ctx: "Kelas 8B · Matematika", title: "Penguasaan per bagian",
    intro: "Rata-rata penguasaan kelas pada tiap tujuan pembelajaran.", who: "Dilihat oleh guru kelas ini",
  }, rowsWithTable([
    { label: "Membandingkan dua pecahan", value: 0.48, shown: "48%" },
    { label: "Membagi bilangan bulat", value: 0.67, shown: "67%" },
    { label: "Mengalikan bilangan dua angka", value: 0.85, shown: "85%" },
  ], "Penguasaan per bagian, kelas 8B (data simulasi)"), compact),

  // /mengajar/[kelas]/soal — the educator's question-level evidence (D-085).
  soal: (compact) => frame({
    ctx: "Kelas 8B · Uji Penguasaan · Bab 3", title: "Soal mana yang sulit bagi kelas ini",
    intro: "Jawaban yang sudah dikumpulkan: 22 dari 24", who: "Dilihat oleh guru kelas ini",
  }, [
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Soal 7" }),
      el("span", { class: "mtr__value" }, ["9", el("small", { text: "dari 22 menjawab tepat" })]),
      ...rowsWithTable([
        { label: "A", value: 2, shown: "2" },
        { label: "B", value: 9, shown: "9", key: true },
        { label: "C", value: 8, shown: "8" },
        { label: "D", value: 3, shown: "3" },
      ], "Pilihan murid pada soal 7 (data simulasi)", 22),
    ]),
    compact ? null : el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Murid yang mungkin perlu bantuan pada soal ini" }),
      el("span", { class: "mtr__mean", text: "13 nama, urut abjad, masing-masing dengan pilihannya." }),
    ]),
  ], compact),

  // /pimpinan — management's "what the evidence supports", and readiness.
  sekolah: (compact) => frame({
    ctx: "Satu sekolah · semua kelas", title: "Yang didukung bukti",
    who: "Dilihat oleh kepala departemen dan dekan",
  }, [
    el("div", { class: "g g-2 mtr-pair", style: "gap: var(--s-4)" }, [
      el("div", { class: "mtr" }, [el("span", { class: "mtr__label", text: "Peserta" }), el("span", { class: "mtr__value", text: "186" }), el("span", { class: "mtr__sample", text: "dari 186" })]),
      el("div", { class: "mtr" }, [el("span", { class: "mtr__label", text: "Butir wajib" }), el("span", { class: "mtr__value", text: "91%" }), el("span", { class: "mtr__sample", text: "dari 180" })]),
    ]),
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Capaian kompetensi" }),
      el("span", { class: "mtr__absent", text: "Belum ada bukti yang memenuhi syarat untuk angka ini." }),
    ]),
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Kesiapan bukti" }),
      el("ul", { class: "counts" }, [
        el("li", {}, [el("b", { text: "3" }), "Cukup untuk ditafsirkan"]),
        el("li", {}, [el("b", { text: "1" }), "Belum ada yang memenuhi syarat"]),
      ]),
      compact ? null : el("span", { class: "mtr__mean", text: "Bukti yang belum cukup bukan hasil yang buruk. Artinya PINTAR belum boleh menyimpulkan apa pun, dan angkanya muncul sendiri ketika buktinya memenuhi syarat." }),
    ]),
  ], compact),

  // A figure below its minimum: the refusal is part of the message.
  belumcukup: (compact) => frame({
    ctx: "Kelas 9A · IPA", title: "Apa yang sudah bisa disimpulkan", who: "Dilihat oleh guru kelas ini",
  }, [
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Pemahaman" }),
      el("span", { class: "mtr__absent", text: "Belum cukup data untuk menampilkan angka ini. (4/5)" }),
    ]),
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Kenaikan" }),
      el("span", { class: "mtr__absent", text: "Belum cukup data untuk menampilkan angka ini. (3/5)" }),
    ]),
  ], compact),

  // /belajar/[tugas]/hasil — what a student sees about their own work.
  hasil: (compact) => frame({
    ctx: "Bab 3 · Pecahan", title: "Hasil", who: "Dilihat oleh murid itu sendiri",
  }, [
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Penguasaan" }),
      el("span", { class: "mtr__value", text: "78%" }),
      el("span", { class: "mtr__action", text: "Target tercapai. Penguasaan bab ini memenuhi targetnya." }),
    ]),
    el("div", { class: "mtr" }, [
      el("span", { class: "mtr__label", text: "Per tujuan pembelajaran" }),
      ...rowsWithTable([
        { label: "Membandingkan dua pecahan", value: 0.67, shown: "67%" },
        { label: "Menyederhanakan pecahan", value: 0.83, shown: "83%" },
        { label: "Menjumlahkan pecahan", value: 0.8, shown: "80%" },
      ], "Penguasaan per tujuan pembelajaran (data simulasi)"),
    ]),
    compact ? null : el("p", { class: "mtr__mean", style: "margin-top: var(--s-3)", text: "Semua soal penting sudah dijawab dengan tepat." }),
  ], compact),

  // /verifikasi/[token] — anyone holding the link can check a certificate.
  verifikasi: (compact) => frame({
    ctx: "Pemeriksaan", title: "Verifikasi Sertifikat", who: "Bisa dibuka siapa pun yang memegang tautannya",
  }, [
    el("div", { class: "cert" }, [
      el("span", { class: "cert__status" }, [iconUse("i-cek"), "Berlaku"]),
      el("dl", {}, [
        el("dt", { text: "Hasil" }), el("dd", { text: "Memenuhi capaian" }),
        el("dt", { text: "Diterbitkan oleh" }), el("dd", { text: "SMP Contoh" }),
        el("dt", { text: "Tanggal terbit" }), el("dd", { text: "12 Desember 2026" }),
      ]),
      compact ? null : el("p", { class: "mtr__mean", text: "Halaman ini memastikan sertifikat yang Anda pegang benar diterbitkan. Nama pemegang tertera pada sertifikatnya." }),
    ]),
  ], compact),
};

export function renderSpecimens(root = document, iconsPath) {
  if (iconsPath) ICONS = iconsPath;
  for (const host of root.querySelectorAll("[data-spec]")) {
    const make = SPECS[host.getAttribute("data-spec")];
    if (!make) continue;
    host.replaceChildren(make(host.hasAttribute("data-compact")));
  }
}

renderSpecimens(document, document.documentElement.getAttribute("data-icons") || undefined);
