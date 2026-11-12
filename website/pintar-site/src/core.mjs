// The public website's frame: routes, the bilingual helper, the page shell,
// the header and the footer. Pages call these; nothing here knows any page's copy.
//
// Every page exists twice, in Bahasa Indonesia (the default, at the root) and
// in English (under en/). Each language has its own natural slugs, and the
// language switch always lands on the same page in the other language.

import { existsSync, readdirSync } from "node:fs";

export const ROUTES = {
  home:      { id: "",                  en: "en/" },
  why:       { id: "mengapa-pintar/",   en: "en/why-pintar/" },
  features:  { id: "fitur/",            en: "en/features/" },
  audiences: { id: "untuk-siapa/",      en: "en/who-its-for/" },
  trust:     { id: "keamanan/",         en: "en/trust-and-security/" },
  contact:   { id: "kontak/",           en: "en/contact/" },
  privacy:   { id: "privasi/",          en: "en/privacy/" },
  terms:     { id: "ketentuan/",        en: "en/terms/" },
};

/** The legal entity, as the owner gave it (9 Nov 2026). The product brand stays PINTAR. */
export const COMPANY = { name: "PT ZAYD PINTAR SELALU", short: "ZPS", email: "info@pintarselalu.com" };

/** The navigation, in order. The demo request is the call to action, and it is the contact form with
 * «Minta Demo» chosen: one form, one handler, one thing to maintain. */
export const NAV = ["why", "features", "audiences", "trust"];

export const NAV_LABEL = {
  home:      { id: "Beranda", en: "Home" },
  why:       { id: "Mengapa PINTAR", en: "Why PINTAR" },
  features:  { id: "Fitur", en: "Features" },
  audiences: { id: "Untuk Siapa", en: "Who It’s For" },
  trust:     { id: "Keamanan", en: "Trust & Security" },
  demo:      { id: "Minta Demo", en: "Request a Demo" },
  contact:   { id: "Kontak", en: "Contact" },
  privacy:   { id: "Kebijakan Privasi", en: "Privacy Policy" },
  terms:     { id: "Ketentuan Penggunaan", en: "Terms of Use" },
};

/** Relative path from one route to another (or to an asset), so the site works from any folder. */
export function rel(fromPath, toPath) {
  const depth = fromPath.split("/").filter(Boolean).length;
  const up = depth ? "../".repeat(depth) : "";
  return (up + toPath) || "./";
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A page renders with a context: its language, its own path, a `t(id, en)`
 * that picks the copy, and `href(key)` / `asset(path)` that resolve relatively.
 */
export function context(lang, key) {
  const path = ROUTES[key][lang];
  return {
    lang, key, path,
    t: (id, en) => (lang === "id" ? id : en),
    href: (k, hash = "") => rel(path, ROUTES[k][lang]) + hash,
    /** The contact form with «Minta Demo» chosen. */
    demo: () => rel(path, ROUTES.contact[lang]) + "?subjek=demo#formulir",
    other: () => rel(path, ROUTES[key][lang === "id" ? "en" : "id"]),
    asset: (p) => rel(path, "assets/" + p),
  };
}

// ------------------------------------------------------------------ images
// Five images, defined once: the pages place them, and the review page's asset
// plan reads the same list. Each has a source kind, said plainly wherever it
// appears: «generated» (an AI-generated illustrative scene, never presented as
// real PINTAR users or partner institutions), «photo» (licensed or
// commissioned photography, with consent), or «screenshot» (the accepted
// product, with sample data). When a processed file exists in
// site/assets/img/ (made by `node images.mjs` from images/), the page shows
// it; until then the slot is a labelled, correctly proportioned placeholder.

const IMG_DIR = new URL("../site/assets/img/", import.meta.url);
export const IMG_WIDTHS = [640, 1024, 1600, 2400];

export const PHOTOS = {
  P1: { r: "2/1", rm: "4/3", kind: "generated", pos: "50% 42%", posm: "45% 50%",
    name_id: "Di kelas", name_en: "In class",
    id: "Ruang kelas SMP pada pagi hari. Seorang guru duduk di samping meja dua peserta didik dan membaca lembar kerja pecahan mereka.",
    en: "A junior secondary classroom in the morning. A teacher sits beside two learners’ desk and reads their fractions worksheet.",
    alt_id: "Guru berjilbab biru duduk di samping meja dua peserta didik berseragam putih biru dan menunjuk satu jawaban di lembar kerja dengan pena; keduanya memperhatikan sambil berpikir.",
    alt_en: "A teacher in a blue hijab sits beside two learners in white-and-navy uniforms and points with a pen to one answer on their worksheet; both watch, thinking." },
  P2: { r: "4/5", rm: "4/5", kind: "generated", pos: "50% 40%", posm: "50% 40%",
    name_id: "Menyiapkan pelajaran besok", name_en: "Preparing tomorrow’s lesson",
    id: "Ruang guru setelah jam pelajaran. Seorang guru menulis rencana pelajaran besok di samping laptop dan tumpukan buku latihan.",
    en: "The staff room after lessons. A teacher writes tomorrow’s lesson plan beside a laptop and a stack of exercise books.",
    alt_id: "Guru di ruang guru menulis di buku catatan pada sore hari, dengan laptop terbuka, tumpukan buku latihan, dan segelas teh di meja.",
    alt_en: "A teacher in the staff room writes in a notebook in the late afternoon, beside an open laptop, a stack of exercise books and a glass of tea." },
  P3: { r: "4/5", rm: "4/5", kind: "generated", pos: "50% 55%", posm: "50% 55%",
    name_id: "Belajar di rumah", name_en: "Studying at home",
    id: "Peserta didik SMA belajar di teras rumah pada sore hari, buku catatan terbuka di samping ponsel.",
    en: "A senior secondary learner studies on a home veranda in the late afternoon, a notebook open beside a phone.",
    alt_id: "Peserta didik SMA berjilbab abu-abu duduk di lantai teras rumah, menulis di buku catatan di meja kayu rendah, dengan ponsel di sampingnya.",
    alt_en: "A senior secondary learner in a grey hijab sits on a tiled veranda, writing in a notebook at a low wooden table, her phone beside it." },
  P4: { r: "3/2", rm: "4/3", kind: "generated", pos: "50% 50%", posm: "55% 50%",
    name_id: "Rapat pimpinan", name_en: "A leadership meeting",
    id: "Kepala sekolah dan wakilnya di ruang rapat, membahas ringkasan kelas yang tercetak di atas meja.",
    en: "A principal and deputy in a meeting room, discussing a printed class summary on the table.",
    alt_id: "Kepala sekolah menunjuk bagian laporan tercetak dengan pena, sementara wakilnya mendengarkan sambil berpikir, di meja rapat dengan dua gelas teh.",
    alt_en: "A principal points with a pen to part of a printed report while her deputy listens, thinking, at a meeting table with two glasses of tea." },
  P5: { r: "2/1", rm: "4/3", kind: "generated", pos: "50% 50%", posm: "55% 50%",
    name_id: "Pagi di sekolah", name_en: "Morning at school",
    id: "Halaman sekolah pada pagi hari, sebelum pelajaran dimulai, dilihat dari lantai atas. Tanpa wajah yang dapat dikenali.",
    en: "A school courtyard in the morning before lessons, seen from an upper floor. No recognisable faces.",
    alt_id: "Halaman sekolah dua lantai di Indonesia pada pagi hari, dilihat dari selasar atas: bendera merah putih, pohon peneduh, dan peserta didik berjalan menuju kelas.",
    alt_en: "A two-storey Indonesian school courtyard in the morning, seen from the upper corridor: the red-and-white flag, a shade tree, and learners walking to class." },
  P6: { r: "4/5", rm: "4/5", kind: "generated", pos: "50% 45%", posm: "50% 45%",
    name_id: "Ruang tata usaha", name_en: "The administration office",
    id: "Ruang tata usaha di awal tahun ajaran. Seorang operator sekolah memasukkan kartu kelas ke dalam amplop, satu kelas demi satu kelas.",
    en: "The administration office at the start of the school year. A school operator puts class cards into envelopes, one class at a time.",
    alt_id: "Operator sekolah berjilbab hijau tua memasukkan kartu kelas ke amplop cokelat di mejanya, dengan daftar kelas tercetak, stempel, dan lemari arsip di belakangnya.",
    alt_en: "A school operator in a dark green hijab puts class cards into brown envelopes at her desk, with a printed class list, a rubber stamp and filing cabinets behind her." },
  P7: { r: "2/1", rm: "4/3", kind: "generated", pos: "50% 50%", posm: "55% 50%",
    name_id: "Tempat bukti bermula", name_en: "Where evidence begins",
    id: "Tangan peserta didik mengerjakan lembar kerja pecahan dengan pensil; di tepinya ada coretan pita pecahan dan percobaan yang dicoret.",
    en: "A learner’s hands work through a fractions worksheet in pencil; in the margin, drawn fraction bars and crossed-out attempts.",
    alt_id: "Tangan peserta didik menggambar pita pecahan dengan pensil di tepi lembar kerja, beberapa percobaan dicoret, di meja kayu dekat jendela.",
    alt_en: "A learner’s hand draws fraction bars in pencil in the margin of a worksheet, some attempts crossed out, on a wooden desk by a window." },
  P8: { r: "3/2", rm: "2/1", kind: "generated", pos: "50% 60%", posm: "50% 60%",
    name_id: "Sebelum percakapan", name_en: "Before the conversation",
    id: "Meja rapat sekolah sesaat sebelum percakapan dimulai: laptop, laporan tercetak, buku catatan, dan dua gelas teh. Belum ada orang.",
    en: "A school meeting table moments before a conversation: a laptop, a printed report, a notebook and two glasses of tea. No one has arrived yet.",
    alt_id: "Meja kayu di ruang rapat sekolah dengan laptop, laporan tercetak berisi grafik batang, buku catatan, tanaman kecil, dan dua gelas teh; dua kursi kosong.",
    alt_en: "A wooden table in a school meeting room with a laptop, a printed report of bar charts, a notebook, a small plant and two glasses of tea; two empty chairs." },
  P9: { r: "2/1", rm: "4/3", kind: "generated", pos: "50% 45%", posm: "40% 50%",
    name_id: "Catatan yang bertahan", name_en: "Records that last",
    id: "Ruang arsip sekolah. Seorang guru senior mengembalikan satu map ke raknya, di antara deretan map dan buku catatan dari tahun ke tahun.",
    en: "A school records room. A senior teacher returns one binder to its shelf, among rows of binders and record books kept year after year.",
    alt_id: "Guru senior berkemeja batik mengembalikan map biru ke rak kayu di ruang arsip sekolah, di antara deretan map dan buku catatan.",
    alt_en: "A senior teacher in a batik shirt returns a blue binder to a wooden shelf in a school records room, among rows of binders and record books." },
};

/** What each source kind is called, wherever an image is shown or listed. */
export const IMAGE_KIND = {
  generated:  { id: "Ilustrasi, dibuat dengan AI", en: "Illustration, AI-generated" },
  photo:      { id: "Foto", en: "Photograph" },
  screenshot: { id: "Tangkapan layar PINTAR, data contoh", en: "PINTAR screenshot, sample data" },
};

export const imageReady = (id) => existsSync(new URL(`${id}-640.webp`, IMG_DIR));

/** An image: the real file when it exists, otherwise a labelled placeholder with the brief. */
export function photo(c, id, { caption = true, cls = "", sizes = "(max-width: 760px) 100vw, 50vw", r, rm } = {}) {
  const p = PHOTOS[id];
  const alt = c.lang === "id" ? p.alt_id : p.alt_en;
  const brief = c.lang === "id" ? p.id : p.en;
  const kind = IMAGE_KIND[p.kind][c.lang];
  const style = `--r:${r ?? p.r};--rm:${rm ?? p.rm};--pos:${p.pos};--posm:${p.posm}`;
  if (imageReady(id)) {
    const have = readdirSync(IMG_DIR).map((f) => new RegExp(`^${id}-(\\d+)\\.webp$`).exec(f)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
    const set = have.map((w) => `${c.asset(`img/${id}-${w}.webp`)} ${w}w`).join(", ");
    return `<figure class="ph ph--img ${cls}" style="${style}" data-photo="${id}" data-kind="${p.kind}">
  <div class="ph__frame"><img src="${c.asset(`img/${id}-${have.at(-1)}.webp`)}" srcset="${set}" sizes="${sizes}" alt="${esc(alt)}" loading="lazy" decoding="async"></div>
  <figcaption class="caption ph__credit">${kind}</figcaption>
</figure>`;
  }
  return `<figure class="ph ${cls}" style="${style}" data-photo="${id}" data-kind="${p.kind}">
  <div class="ph__frame" role="img" aria-label="${esc(c.t("Gambar menyusul: ", "Image to come: ") + alt)}"><span class="ph__marks" aria-hidden="true"></span><span class="ph__tag" aria-hidden="true"><b>${c.t("Gambar", "Image")} ${id.slice(1)}</b>${c.lang === "id" ? p.name_id : p.name_en}</span></div>
  ${caption ? `<figcaption class="caption"><span class="caption__k">${c.t("Gambar menyusul", "Image to come")}</span> ${esc(brief)}</figcaption>` : ""}
</figure>`;
}

// ------------------------------------------------------------------ status
// The three states a capability can be in on this site. A state is always a
// word and a shape, never colour alone. The words are deliberately modest:
// the site states what is available, and marks what is only a direction.
// This is LAUNCH wording: the site launches only once PINTAR 4.1 has been
// accepted (owner, 10 Nov 2026). Every capability it presents as available is
// on the confirmation checklist in review/ until that acceptance.
export const STATUS = {
  available:  { id: "Tersedia", en: "Available", note_id: "", note_en: "", shape: "dot" },
  direction:  { id: "Arah ke depan", en: "Future direction", note_id: "", note_en: "", shape: "dash" },
};
export function status(c, kind, { note = true, label } = {}) {
  const s = STATUS[kind];
  return `<span class="status status--${s.shape}"><span class="status__mark" aria-hidden="true"></span><span class="status__label">${label ?? c.t(s.id, s.en)}</span>${note && s.note_id ? `<span class="status__note">${c.t(s.note_id, s.note_en)}</span>` : ""}</span>`;
}

// ------------------------------------------------------------------ shell
export function wordmark(c, { link = true } = {}) {
  return link
    ? `<a class="wordmark" href="${c.href("home")}" aria-label="PINTAR — ${c.t("Beranda", "Home")}">PINTAR</a>`
    : `<span class="wordmark">PINTAR</span>`;
}

function header(c) {
  const items = NAV.map((k) => `<li><a href="${c.href(k)}"${k === c.key ? ' aria-current="page"' : ""}>${NAV_LABEL[k][c.lang]}</a></li>`).join("");
  const lang = `<div class="lang" role="group" aria-label="${c.t("Bahasa", "Language")}">
      <a ${c.lang === "id" ? 'aria-current="true"' : `href="${c.other()}"`} lang="id" hreflang="id">ID</a><span aria-hidden="true">/</span><a ${c.lang === "en" ? 'aria-current="true"' : `href="${c.other()}"`} lang="en" hreflang="en">EN</a>
    </div>`;
  return `<a class="skip" href="#isi">${c.t("Langsung ke isi", "Skip to content")}</a>
<header class="site-header">
  <div class="wrap site-header__in">
    ${wordmark(c)}
    <nav class="site-nav" id="menu" aria-label="${c.t("Navigasi utama", "Main navigation")}">
      <ul>${items}</ul>
      <a class="site-nav__demo" href="${c.demo()}">${NAV_LABEL.demo[c.lang]}</a>
    </nav>
    <div class="site-header__end">
      ${lang}
      <a class="btn btn--sm" href="${c.demo()}">${NAV_LABEL.demo[c.lang]}</a>
      <button class="menu-btn" type="button" aria-controls="menu" aria-expanded="false">${c.t("Menu", "Menu")}</button>
    </div>
  </div>
</header>`;
}

function footer(c) {
  const explore = ["home", ...NAV].map((k) => `<li><a href="${c.href(k)}">${NAV_LABEL[k][c.lang]}</a></li>`).join("");
  const cur = (k) => (c.key === k ? ' aria-current="page"' : "");
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__top">
      <div class="site-footer__brand">
        ${wordmark(c, { link: false })}
        <p class="site-footer__line">${c.t("Tenang di permukaan. <em>Cermat di bawahnya.</em>", "Calm on the surface. <em>Rigorous underneath.</em>")}</p>
      </div>
      <nav aria-label="${c.t("Jelajahi", "Explore")}"><ul class="site-footer__nav">${explore}</ul></nav>
    </div>
    <div class="site-footer__base">
      <span>© ${COMPANY.name} (${COMPANY.short})</span>
      <a class="site-footer__mail" href="mailto:${COMPANY.email}">${COMPANY.email}</a>
      <nav class="site-footer__legal" aria-label="${c.t("Informasi hukum", "Legal")}"><a href="${c.href("contact")}"${cur("contact")}>${NAV_LABEL.contact[c.lang]}</a><a href="${c.href("privacy")}"${cur("privacy")}>${c.t("Privasi", "Privacy")}</a><a href="${c.href("terms")}"${cur("terms")}>${c.t("Ketentuan", "Terms")}</a></nav>
      <div class="lang lang--footer" role="group" aria-label="${c.t("Bahasa", "Language")}"><a ${c.lang === "id" ? 'aria-current="true"' : `href="${c.other()}"`} lang="id" hreflang="id">ID</a><span aria-hidden="true">|</span><a ${c.lang === "en" ? 'aria-current="true"' : `href="${c.other()}"`} lang="en" hreflang="en">EN</a></div>
    </div>
  </div>
</footer>`;
}

/**
 * The whole document. `review` adds noindex: until the owner approves the
 * site for publication, every page asks search engines to stay away.
 */
export function page(c, { title, description, body, review = true, origin = "" }) {
  const other = c.lang === "id" ? "en" : "id";
  return `<!doctype html>
<html lang="${c.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${review ? '<meta name="robots" content="noindex, nofollow">\n' : ""}<meta name="theme-color" content="#F6F4EF">
<link rel="alternate" hreflang="${c.lang}" href="${rel(c.path, ROUTES[c.key][c.lang])}">
<link rel="alternate" hreflang="${other}" href="${c.other()}">
<link rel="icon" href="${c.asset("favicon.svg")}" type="image/svg+xml">
<link rel="preload" href="${c.asset("fonts/inter-latin-opsz-normal.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${c.asset("fonts/ibm-plex-mono-500-latin.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${c.asset("css/site.css")}">
<script src="${c.asset("js/site.js")}" defer></script>
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:locale" content="${c.lang === "id" ? "id_ID" : "en_GB"}">
${origin ? `<meta property="og:url" content="${origin}/${c.path}">
<meta property="og:image" content="${origin}/assets/img/share.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
` : ""}
</head>
<body data-page="${c.key}">
${review ? `<p class="review-strip" role="note">${c.t("Pratinjau untuk ditinjau · Teks peluncuran ini disiapkan untuk saat PINTAR 4.1 telah diterima. Belum diterbitkan.", "Review build · This launch wording is prepared for when PINTAR 4.1 has been accepted. Not published.")}</p>
` : ""}${header(c)}
<main id="isi">
${body}
</main>
${footer(c)}
</body>
</html>
`;
}

/** A section label: a number, a rule and a name, set small and precise. */
export const label = (num, text, cls = "") => `<p class="label ${cls}">${num ? `<span class="label__n">${num}</span>` : ""}${text}</p>`;

/** The demo invitation that closes most pages: typographic, one action. */
export function demoBand(c, { heading, body, next } = {}) {
  // `next` is the page a reader would naturally go to after this one: a quiet
  // onward link, so no page ends with the demo request as the only way forward.
  const onward = next ? `<nav class="onward" aria-label="${c.t("Halaman berikutnya", "Next page")}"><div class="wrap"><a href="${c.href(next)}"><span class="onward__k">${c.t("Selanjutnya", "Next")}</span><span class="onward__t">${NAV_LABEL[next][c.lang]}</span></a></div></nav>
` : "";
  return `${onward}<section class="section demo-band" aria-labelledby="demo-band-h">
  <div class="wrap cols cols--end">
    <div style="--span:7" data-reveal-group>
      ${label("", c.t("Minta demo", "Request a demo"))}
      <h2 class="h2" id="demo-band-h" data-reveal>${heading ?? c.t("Lihat PINTAR <em>bekerja.</em>", "See PINTAR <em>at work.</em>")}</h2>
    </div>
    <div style="--span:4;--start:9" data-reveal>
      <p class="lead">${body ?? c.t("Demo terpandu yang disesuaikan dengan peran Anda, dengan data contoh.", "A guided demonstration tailored to your role, using sample data.")}</p>
      <p class="actions"><a class="btn" href="${c.demo()}">${NAV_LABEL.demo[c.lang]}</a><a class="link" href="mailto:${COMPANY.email}">${COMPANY.email}</a></p>
    </div>
  </div>
</section>`;
}

// ------------------------------------------------------------------ legal pages
/** Until the owner and a qualified reviewer approve the legal text, it says it is a draft. */
export const LEGAL_DRAFT = true;

/** A fact that must be confirmed before publication: visible, never invented. */
export const confirm = (c, what) => `<span class="confirm">[${c.t("konfirmasi", "to confirm")}: ${what}]</span>`;

/** A legal page: title, dates, a contents list and numbered sections. */
export function legalPage(c, { heading, intro, updated, sections }) {
  return `<section class="page-hero" style="padding-bottom: var(--s-8)" aria-labelledby="legal-h">
  <div class="wrap">
    ${label("", c.t("Informasi hukum", "Legal"))}
    <h1 class="h1" id="legal-h">${heading}</h1>
    <p class="lead" style="margin-top: var(--s-5)">${intro}</p>
    <p class="legal__meta"><span>${c.t("Berlaku sejak", "Effective")}: ${updated}</span><span>${COMPANY.name} (${COMPANY.short})</span></p>
    ${LEGAL_DRAFT ? `<p class="draft-note">${c.t("Draf untuk ditinjau. Teks ini belum disetujui secara hukum, dan bagian bertanda «konfirmasi» memerlukan data perusahaan sebelum diterbitkan.", "Draft for review. This text has not been legally approved, and the parts marked «to confirm» need company information before publication.")}</p>` : ""}
  </div>
</section>
<div class="wrap legal">
  <nav class="legal__toc" aria-label="${c.t("Isi halaman", "On this page")}"><p>${c.t("Isi", "Contents")}</p>${sections.map(([id, h], i) => `<a href="#${id}">${i + 1}. ${h}</a>`).join("")}</nav>
  <div class="legal__body">${sections.map(([id, h, html], i) => `<section id="${id}" aria-labelledby="${id}-h"><h2 id="${id}-h">${i + 1}. ${h}</h2>${html}</section>`).join("")}</div>
</div>`;
}
