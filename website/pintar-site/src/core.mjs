// The public website's frame: routes, the bilingual helper, the page shell,
// the header and the footer. Pages call these; nothing here knows any page's copy.
//
// Every page exists twice, in Bahasa Indonesia (the default, at the root) and
// in English (under en/). Each language has its own natural slugs, and the
// language switch always lands on the same page in the other language.

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

// ------------------------------------------------------------------ photographs
// Every photograph on the site, defined once: the pages place them, and the
// review page's asset plan reads the same list. None exists yet: each renders
// as a labelled, correctly proportioned placeholder until the shoot delivers.

export const PHOTOS = {
  P1: { r: "21/9", rm: "4/5",
    id: "Ruang kelas SMP negeri, pagi hari. Seorang guru berlutut di samping meja dua peserta didik dan membaca lembar kerja mereka.",
    en: "A state junior secondary classroom in the morning. A teacher kneels beside two learners’ desk, reading their worksheet.",
    alt_id: "Guru berlutut di samping meja dua peserta didik berseragam putih biru, membaca lembar kerja bersama mereka di ruang kelas yang terang.",
    alt_en: "A teacher kneels beside two learners in white-and-navy uniforms, reading a worksheet with them in a bright classroom." },
  P2: { r: "4/5", rm: "4/5",
    id: "Peserta didik SMA belajar di beranda rumah pada sore hari, buku catatan terbuka di samping ponsel.",
    en: "A senior secondary learner studies on a home veranda in the afternoon, a notebook open beside a phone.",
    alt_id: "Peserta didik SMA duduk di beranda rumah, menulis di buku catatan di samping ponsel.",
    alt_en: "A senior secondary learner sits on a veranda, writing in a notebook beside a phone." },
  P3: { r: "4/5", rm: "4/5",
    id: "Ruang guru setelah jam pelajaran. Seorang guru meninjau hasil kelas di laptop, tumpukan buku latihan di sampingnya.",
    en: "The staff room after lessons. A teacher reviews a class’s results on a laptop beside a stack of exercise books.",
    alt_id: "Guru di ruang guru meninjau hasil kelas di laptop, dengan tumpukan buku latihan di meja.",
    alt_en: "A teacher in the staff room reviews class results on a laptop next to a stack of exercise books." },
  P4: { r: "3/2", rm: "4/5",
    id: "Kepala sekolah dan wakilnya di ruang rapat, membahas ringkasan sekolah yang tercetak di atas meja.",
    en: "A principal and deputy in a meeting room, discussing a printed school summary on the table.",
    alt_id: "Kepala sekolah dan wakil kepala sekolah membahas laporan tercetak di meja rapat.",
    alt_en: "A principal and a deputy principal discuss a printed report at a meeting table." },
  P5: { r: "4/5", rm: "4/5",
    id: "Operator sekolah di ruang tata usaha, menyiapkan kartu kelas untuk awal tahun ajaran.",
    en: "A school operator in the administration office, preparing class cards for the start of the school year.",
    alt_id: "Operator sekolah di ruang tata usaha menata kartu kelas di meja.",
    alt_en: "A school operator in the administration office arranges class cards on a desk." },
  P6: { r: "21/9", rm: "4/3",
    id: "Halaman sekolah pada pagi hari, sebelum pelajaran dimulai. Diambil dari jauh, tanpa wajah yang dapat dikenali.",
    en: "A school courtyard in the morning, before lessons begin. Shot from a distance, with no recognisable faces.",
    alt_id: "Halaman sekolah di Indonesia pada pagi hari, dengan peserta didik berjalan menuju kelas.",
    alt_en: "An Indonesian school courtyard in the morning, with learners walking to class." },
  P7: { r: "21/9", rm: "4/5",
    id: "Detail: tangan peserta didik menulis jawaban di lembar Pemetaan Awal yang tercetak.",
    en: "Detail: a learner’s hand writing an answer on a printed initial-mapping sheet.",
    alt_id: "Tangan peserta didik menulis jawaban dengan pensil di lembar kerja.",
    alt_en: "A learner’s hand writes an answer in pencil on a worksheet." },
  P8: { r: "3/2", rm: "4/5",
    id: "Dua orang di meja sekolah: anggota tim PINTAR memandu seorang wakil kepala sekolah melalui laptop.",
    en: "Two people at a school table: a PINTAR team member guides a deputy principal through a laptop.",
    alt_id: "Anggota tim PINTAR memandu seorang wakil kepala sekolah melalui laptop di meja sekolah.",
    alt_en: "A PINTAR team member guides a deputy principal through a laptop at a school table." },
};

/** A photograph's placeholder: the right proportion, viewfinder marks, and the brief as its caption. */
export function photo(c, id, { caption = true, cls = "" } = {}) {
  const p = PHOTOS[id];
  const alt = c.lang === "id" ? p.alt_id : p.alt_en;
  const brief = c.lang === "id" ? p.id : p.en;
  return `<figure class="ph ${cls}" style="--r:${p.r};--rm:${p.rm}" data-photo="${id}">
  <div class="ph__frame" role="img" aria-label="${esc(c.t("Foto direncanakan: ", "Planned photograph: ") + alt)}"><span class="ph__marks" aria-hidden="true"></span><span class="ph__tag" aria-hidden="true">${c.t("Foto", "Photo")} ${id.slice(1)}</span></div>
  ${caption ? `<figcaption class="caption"><span class="caption__k">${c.t("Foto direncanakan", "Planned photograph")}</span> ${esc(brief)}</figcaption>` : ""}
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
  direction:  { id: "Arah ke depan", en: "Future direction", note_id: "Tanpa tanggal atau janji rilis", note_en: "No dates or release promises", shape: "dash" },
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
export function page(c, { title, description, body, review = true }) {
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

/** The demo invitation that closes most pages. */
export function demoBand(c, { heading, body } = {}) {
  return `<section class="section demo-band" aria-labelledby="demo-band-h">
  <div class="wrap cols">
    <div class="demo-band__text" style="--span:6" data-reveal>
      ${label("", c.t("Minta demo", "Request a demo"))}
      <h2 class="h2" id="demo-band-h">${heading ?? c.t("Lihat PINTAR <em>bekerja.</em>", "See PINTAR <em>at work.</em>")}</h2>
      <p class="lead">${body ?? c.t("Demo terpandu dengan data contoh. Kami menunjukkan bagian PINTAR yang sesuai dengan peran Anda dan yang sudah siap ditunjukkan saat itu.", "A guided demonstration with sample data, showing the parts of PINTAR that matter to your role and are ready to show at the time.")}</p>
      <p class="actions"><a class="btn" href="${c.demo()}">${NAV_LABEL.demo[c.lang]}</a><a class="link" href="mailto:${COMPANY.email}">${COMPANY.email}</a></p>
    </div>
    <div style="--span:6" data-reveal>${photo(c, "P8")}</div>
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
