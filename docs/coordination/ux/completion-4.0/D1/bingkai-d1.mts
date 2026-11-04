/**
 * D1 STEP 2 (DAISY-37), DESIGN SPECIMEN — not application code. This is
 * src/components/email/bingkai.ts at engineering commit 0b19707, copied
 * unchanged except where a line is marked «D1:». Those marks are the only
 * additions step 2 makes: the reason line under the heading, the context line,
 * the wordmark slot (a placeholder until F-11), warm white and the gold line,
 * and the card block. Everything else is DAISY-19's frame as built.
 *
 * DAISY-19 (D-057(a)): THE PINTAR EMAIL FRAME, shared by every email PINTAR
 * sends: the activation code, the resend, password recovery, password changed,
 * the PINTAR Digital Card, security notices, and Gate 2E's delivery test.
 *
 * MOVED, NOT REDESIGNED. This is the accepted prototype
 * (docs/coordination/ux/email-frame/bingkai.mts, accepted 29 Sep), moved here on
 * BOB-25's template interface (src/lib/email/templat.ts). Its layout, blocks,
 * colours and plain-text rules are the prototype's. What changed is only what
 * the gate ruled and the wiring needs:
 *   - its words come from the copy table (`email.bingkai.*`, D-014), in Bahasa
 *     Indonesia, as every email is;
 *   - it takes BOB-25's `KonteksEmail`, and from it alone decides two things a
 *     template can therefore never get wrong: the logo is the environment's own
 *     small email logo, `${asal}/brand/pintar-email-logo.png` (ruling 2), and a
 *     staging email carries a slim test line in its body (ruling 3);
 *   - a code is shown grouped, «482 913» (ruling 1). Accepting it with or
 *     without the space is the code screen's job (DAISY-20, BOB-26);
 *   - it refuses what the sending module would refuse anyway: an empty subject
 *     or one with a line break.
 *
 * A template is its own blocks plus one call to this frame:
 *
 *     export const templatX: Templat<{ kode: string }> = (data, konteks) =>
 *       bingkaiEmail({ subjek, pratinjau, judul, isi: [{ jenis: "kode", label, kode: data.kode }] }, konteks);
 *
 * WHAT THE FRAME GUARANTEES, whatever an email puts inside it:
 * - Layout is tables with inline styles. There are no scripts, no external CSS
 *   and no web fonts. The one <style> block only enhances (a narrow screen, dark
 *   mode), so a client that strips it, as some Gmail apps do, still gets the
 *   whole email.
 * - One column, at most 600 px wide, fluid down to 320 px. Outlook for Windows
 *   ignores max-width, so it gets a fixed 600 px table through a conditional
 *   comment.
 * - Bahasa Indonesia: lang="id" on the document and on the article wrapper,
 *   which webmail keeps when it drops <html>. One <h1>; layout tables are
 *   role="presentation".
 * - The header is the PINTAR logo. Its alt text is styled as the wordmark, so
 *   with images blocked (Outlook's default) the reader still sees "PINTAR" in
 *   the brand colour.
 * - The footer says why the person received the email, that PINTAR never asks
 *   for a PIN or password by email, where to write, and who sends it.
 * - Every text an email supplies is escaped. Links must be https, except a
 *   local origin (the sink, BOB-25 §3), and a mailto: to PINTAR's own address.
 *
 * WHY THE COLOURS ARE WRITTEN OUT. An email client reads no stylesheet and no
 * custom property, so the frame carries the token values themselves. They are
 * the token set's own (src/app/globals.css) and DAISY-19-EMAIL-01 compares them
 * with it, so they cannot drift. This file is .ts, not a .tsx surface, which is
 * why the Experience token lint does not read it.
 *
 * WHAT THE FRAME NEVER DOES: choose FROM, Reply-To or the recipient, read
 * configuration, or send (BOB-25 §1).
 */
// D1: the specimen runs outside the app, so the copy table and the two types are injected.
export type HleEvent = string;
export type EmailJadi = { subjek: string; html: string; teks: string };
export type KonteksEmail = { asal: string; staging: boolean };
let t: (k: string, p: string, o: { locale: string }) => string = (k) => k;
export function pasangKata(f: typeof t) { t = f; }

export type Nada = "netral" | "perhatian";

export type Blok =
  /** a paragraph of body text */
  | { jenis: "paragraf"; teks: string }
  /** a code the reader types (activation, recovery), shown large and grouped */
  | { jenis: "kode"; label: string; kode: string }
  /** one primary action; `cadangan` adds the copy-the-address line below it */
  | { jenis: "tombol"; teks: string; href: string; cadangan?: boolean }
  /** label and value rows, e.g. when something happened */
  | { jenis: "rincian"; baris: Array<[string, string]> }
  /** a calm boxed note; "perhatian" for "if this was not you" */
  | { jenis: "catatan"; teks: string; nada?: Nada }
  /** D1: the PINTAR Card, drawn as live-text table HTML (never an image) */
  | { jenis: "kartu"; kartu: KartuEmail };

/**
 * D1: the card in the email. Roles arrive already in the Digital Card's order,
 * alphabetical by their Terminology v1 names (D-074(5)); the block draws them
 * as given. `warna` is the family colour of the FIRST role (D-074(4) addendum).
 */
export type KartuEmail = {
  nama: string;
  pintarId: string;
  /** each role and its school, one per line (D-074(6)) */
  baris: Array<{ peran: string; sekolah: string | null }>;
  warna: string;
};

export type Email = {
  /** the subject line, also the article's accessible name */
  subjek: string;
  /** the inbox preview line (hidden in the body) */
  pratinjau: string;
  /** the one heading */
  judul: string;
  isi: Blok[];
  /** why this person received this email; the frame has a general default.
   *  D1: shown directly under the heading (DAISY-37 (1)), no longer in the footer */
  alasan?: string;
  /** D1: the context line (DAISY-37 (2)), only where authoritative, permitted
   *  data is available. Absent: the line is omitted, and nothing stands in for it. */
  konteks?: string;
};

/** Emails are Bahasa Indonesia only. */
export const kata = (k: HleEvent) => t(k, "public", { locale: "id" });

/**
 * Fixed at Gate 0 (M4): who and where to write. Proper nouns, not words: the
 * same strings in every language, so they are constants and never copy-table
 * keys (UX1-S1-KAKI-01), exactly as the app footer (KakiPintar) holds them.
 */
export const BADAN_HUKUM = "PT ZAYD PINTAR SELALU";
export const KONTAK = "info@pintarselalu.com";
export const RANAH = "pintarselalu.com";
/** The small email logo in public/brand/ (ruling 2): 208 × 116, shown at 104 × 58. */
export const BERKAS_LOGO = "/brand/pintar-email-logo.png";

/** Colours: the token set's values (globals.css), plus a dark set used only where a client honours prefers-color-scheme. */
export const WARNA = {
  terang: {
    latar: "#F3F1EC", kartu: "#FBFAF7" /* D1: warm white, the artifacts' paper (--surface-0) */, garis: "#E2E4E5", tinta: "#1F2A33", tinta2: "#4E5A64", tinta3: "#5F6A73",
    utama: "#245F55", utamaTinta: "#FFFFFF", utamaLembut: "#E3EFEC", utamaGaris: "#C4DAD4",
    perhatian: "#8A5F00", perhatianLembut: "#F7EED8", netral: "#3D5A80", netralLembut: "#E7EDF5",
    /* D1: the artifacts' warm-gold line (D-074) and the wordmark colour (D-163(a)) */
    emas: "#C09C4F", merek: "#075056",
  },
  gelap: {
    latar: "#0F1417", kartu: "#182025", garis: "#2C363C", tinta: "#E6EBED", tinta2: "#BAC4C9", tinta3: "#A3AEB4",
    utama: "#86CFBF", tombol: "#2B7568", utamaTinta: "#FFFFFF", utamaLembut: "#1D3531", utamaGaris: "#2F5A51",
    perhatian: "#E9C46A", perhatianLembut: "#2B2513", netral: "#A9C4E8", netralLembut: "#1B2634",
  },
} as const;

const HURUF = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const HURUF_KODE = "Consolas, 'SF Mono', Menlo, 'Courier New', monospace";

/** HTML-escape everything an email supplies. */
export function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * A link the frame will draw: absolute https, or plain http only to a local
 * origin (127.0.0.1, localhost, ::1), which is where CI and local sends go
 * (BOB-25 §3, the sink). Anything else throws: a template bug, not a send.
 */
export function tautanAman(href: string): string {
  const https = /^https:\/\/[^\s"'<>]+$/.test(href);
  const lokal = /^http:\/\/(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?(?:\/[^\s"'<>]*)?$/.test(href);
  if (!https && !lokal) throw new Error("the email frame draws only absolute https links (or a local origin)");
  return href;
}

/**
 * Ruling 1: a code is shown grouped, «482 913». Six digits are 3 + 3 and eight
 * are 4 + 4; anything else is shown as given. The spaces are display only.
 */
export function tampilKode(kode: string): string {
  const k = kode.replace(/\s+/g, "");
  if (/^\d{6}$/.test(k)) return `${k.slice(0, 3)} ${k.slice(3)}`;
  if (/^\d{8}$/.test(k)) return `${k.slice(0, 4)} ${k.slice(4)}`;
  return kode;
}

const T = WARNA.terang;

function blokHtml(b: Blok): string {
  switch (b.jenis) {
    case "paragraf":
      return `<p class="pin-teks" style="margin:0 0 16px 0;font-family:${HURUF};font-size:16px;line-height:26px;color:${T.tinta};">${esc(b.teks)}</p>`;
    case "kode":
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:8px 0 20px 0;">
<tr><td class="pin-kotak-kode" align="center" bgcolor="${T.utamaLembut}" style="background-color:${T.utamaLembut};border:1px solid ${T.utamaGaris};border-radius:12px;padding:18px 12px 20px 12px;">
<p class="pin-label" style="margin:0 0 6px 0;font-family:${HURUF};font-size:13px;line-height:18px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${T.tinta2};">${esc(b.label)}</p>
<p class="pin-kode" style="margin:0;font-family:${HURUF_KODE};font-size:32px;line-height:40px;font-weight:700;letter-spacing:6px;color:${T.tinta};">${esc(tampilKode(b.kode))}</p>
</td></tr></table>`;
    case "tombol": {
      const href = esc(tautanAman(b.href));
      const tombol = `<table class="pin-tombol-tabel" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
<tr><td class="pin-tombol" align="center" bgcolor="${T.utama}" style="background-color:${T.utama};border-radius:8px;mso-padding-alt:14px 28px;">
<a class="pin-tombol-a" href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;mso-padding-alt:0;font-family:${HURUF};font-size:16px;line-height:20px;font-weight:600;color:${T.utamaTinta};text-decoration:none;border-radius:8px;">${esc(b.teks)}</a>
</td></tr></table>`;
      const cadangan = b.cadangan
        ? `<p class="pin-kecil" style="margin:-8px 0 20px 0;font-family:${HURUF};font-size:14px;line-height:22px;color:${T.tinta2};">${esc(kata("email.bingkai.cadangan"))}<br><a class="pin-tautan" href="${href}" target="_blank" style="color:${T.utama};text-decoration:underline;word-break:break-all;">${esc(b.href)}</a></p>`
        : "";
      return tombol + cadangan;
    }
    case "rincian":
      return `<table class="pin-rincian" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;border-top:1px solid ${T.garis};">
${b.baris.map(([k, v]) => `<tr><td class="pin-rincian-k" valign="top" style="padding:10px 12px 10px 0;border-bottom:1px solid ${T.garis};font-family:${HURUF};font-size:14px;line-height:20px;color:${T.tinta3};width:38%;">${esc(k)}</td><td class="pin-rincian-v" valign="top" style="padding:10px 0;border-bottom:1px solid ${T.garis};font-family:${HURUF};font-size:15px;line-height:22px;color:${T.tinta};">${esc(v)}</td></tr>`).join("\n")}
</table>`;
    case "kartu": return kartuHtml(b.kartu);
    case "catatan": {
      const perhatian = b.nada === "perhatian";
      const garis = perhatian ? T.perhatian : T.netral;
      const lembut = perhatian ? T.perhatianLembut : T.netralLembut;
      const kelas = perhatian ? "pin-catatan-perhatian" : "pin-catatan-netral";
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px 0;">
<tr><td class="${kelas}" bgcolor="${lembut}" style="background-color:${lembut};border-left:4px solid ${garis};border-radius:4px;padding:12px 16px;font-family:${HURUF};font-size:15px;line-height:23px;color:${T.tinta};">${esc(b.teks)}</td></tr></table>`;
    }
  }
}

/**
 * D1: the wordmark slot. A PLACEHOLDER: a box at the slot's size and position,
 * labelled, never the master (F-11). Live text, so it reads with images blocked.
 * Geometry (provisional until the master): 120 × 40 px in the header, left;
 * 96 × 32 px on the card.
 */
export const SLOT_MEREK = { kepala: { w: 120, h: 40 }, kartu: { w: 96, h: 32 } } as const;
export function slotMerek(w: number, h: number, ukuranHuruf: number, kelas: string): string {
  return `<table class="${kelas}" role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td width="${w}" height="${h}" align="center" valign="middle" style="width:${w}px;height:${h}px;border:1px dashed ${T.merek};border-radius:4px;font-family:${HURUF};font-size:${ukuranHuruf}px;line-height:${ukuranHuruf + 3}px;font-weight:700;color:${T.merek};">Pintar<br><span style="font-weight:400;">(master pending F-11)</span></td></tr></table>`;
}

/** D1: the card, as live-text table HTML: paper, the slot, the gold line, the person, the role band. */
function kartuHtml(k: KartuEmail): string {
  const baris = k.baris.map((r) => `<p style="margin:0;font-family:${HURUF};font-size:13px;line-height:19px;color:#FBFAF7;"><strong style="font-weight:600;">${esc(r.peran)}</strong>${r.sekolah ? ` · ${esc(r.sekolah)}` : ""}</p>`).join("");
  return `<table class="pin-kartu-pintar" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin:8px 0 20px 0;max-width:440px;">
<tr><td bgcolor="#FBFAF7" style="background-color:#FBFAF7;border:1px solid ${T.garis};border-radius:12px;padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:14px 16px 10px 16px;">${slotMerek(SLOT_MEREK.kartu.w, SLOT_MEREK.kartu.h, 9, "pin-slot-kartu")}</td></tr>
<tr><td height="2" bgcolor="${T.emas}" style="height:2px;line-height:2px;font-size:0;background-color:${T.emas};">&nbsp;</td></tr>
<tr><td style="padding:14px 16px 4px 16px;font-family:${HURUF};font-size:18px;line-height:24px;font-weight:600;color:#1F2A33;">${esc(k.nama)}</td></tr>
<tr><td style="padding:0 16px 14px 16px;font-family:${HURUF_KODE};font-size:14px;line-height:20px;letter-spacing:1px;color:#4E5A64;">${esc(k.pintarId)}</td></tr>
<tr><td bgcolor="${k.warna}" style="background-color:${k.warna};padding:10px 16px 12px 16px;border-radius:0 0 11px 11px;">${baris}</td></tr>
</table></td></tr></table>`;
}

/** Ruling 3: the slim line a staging email carries at the top of its body. */
function barisUji(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
<tr><td class="pin-uji" bgcolor="${T.perhatianLembut}" style="background-color:${T.perhatianLembut};border-left:4px solid ${T.perhatian};border-radius:4px;padding:6px 12px;font-family:${HURUF};font-size:13px;line-height:20px;font-weight:600;color:${T.tinta};">${esc(kata("email.bingkai.uji"))}</td></tr></table>`;
}

/** Enhancements only. Everything above renders without this block. */
function gaya(): string {
  const G = WARNA.gelap;
  return `<style>
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media screen and (max-width: 480px) {
  .pin-bungkus { padding: 16px 8px !important; }
  .pin-kartu { padding: 24px 18px !important; }
  .pin-judul { font-size: 22px !important; line-height: 30px !important; }
  .pin-kode { font-size: 28px !important; letter-spacing: 4px !important; }
  .pin-tombol-tabel { width: 100% !important; }
  .pin-tombol-a { display: block !important; text-align: center !important; }
}
@media (prefers-color-scheme: dark) {
  .pin-latar, .pin-bungkus { background-color: ${G.latar} !important; }
  .pin-kartu { background-color: ${G.kartu} !important; border-color: ${G.garis} !important; }
  .pin-judul, .pin-teks, .pin-kode, .pin-rincian-v { color: ${G.tinta} !important; }
  .pin-label, .pin-kecil, .pin-alasan, .pin-konteks { color: ${G.tinta2} !important; }
  .pin-kaki, .pin-kaki p, .pin-rincian-k { color: ${G.tinta3} !important; }
  .pin-rincian, .pin-rincian-k, .pin-rincian-v { border-color: ${G.garis} !important; }
  .pin-kotak-kode { background-color: ${G.utamaLembut} !important; border-color: ${G.utamaGaris} !important; }
  .pin-tombol, .pin-tombol-a { background-color: ${G.tombol} !important; color: ${G.utamaTinta} !important; }
  .pin-tautan, .pin-merek-teks { color: ${G.utama} !important; }
  /* D1: the gold line stays on dark; the placeholder stays legible (the master's own dark form is F-11's) */
  .pin-kartu { border-top-color: ${T.emas} !important; }
  .pin-slot td { color: ${G.utama} !important; border-color: ${G.utama} !important; }
  .pin-catatan-perhatian, .pin-uji { background-color: ${G.perhatianLembut} !important; border-left-color: ${G.perhatian} !important; color: ${G.tinta} !important; }
  .pin-catatan-netral { background-color: ${G.netralLembut} !important; border-left-color: ${G.netral} !important; color: ${G.tinta} !important; }
}
</style>`;
}

/** The environment's own email logo (ruling 2), from BOB-25's context alone. */
export function logoEmail(konteks: KonteksEmail): string {
  return tautanAman(`${konteks.asal.replace(/\/+$/, "")}${BERKAS_LOGO}`);
}

export function bingkaiEmail(e: Email, konteks: KonteksEmail): EmailJadi {
  // what the sending module refuses, refused here first: a template bug surfaces
  // when the template is written, not as a send that never happens
  if (!e.subjek.trim() || /[\r\n]/.test(e.subjek)) throw new Error("an email subject must be one non-empty line");
  const logo = logoEmail(konteks);
  const merek = kata("email.bingkai.merek");
  const alasan = e.alasan ?? kata("email.bingkai.alasan");
  // the alt text is styled as the wordmark: with images blocked, "PINTAR" still reads in the brand colour
  // D1: the header is the wordmark slot, live text (DAISY-37 (3)); the master replaces it after F-11
  void logo; void merek;
  const kepala = slotMerek(SLOT_MEREK.kepala.w, SLOT_MEREK.kepala.h, 11, "pin-slot");
  // the inbox preview, then filler so the client does not pull body text into it
  const isiPratinjau = `${esc(e.pratinjau)}${"&#847;&zwnj;&nbsp;".repeat(40)}`;

  const html = `<!DOCTYPE html>
<html lang="id" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(e.subjek)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<!--[if mso]><style>body, table, td, p, a, h1, span { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
${gaya()}
</head>
<body class="pin-latar" style="margin:0;padding:0;width:100%;background-color:${T.latar};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${isiPratinjau}</div>
<div role="article" aria-roledescription="email" aria-label="${esc(e.subjek)}" lang="id" dir="ltr" style="margin:0;padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${T.latar}" style="background-color:${T.latar};">
<tr><td class="pin-bungkus" align="center" style="padding:28px 12px;background-color:${T.latar};">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto;">
<tr><td style="padding:0 4px 18px 4px;" align="left">${kepala}</td></tr>
<tr><td class="pin-kartu" bgcolor="${T.kartu}" style="background-color:${T.kartu};border:1px solid ${T.garis};border-top:3px solid ${T.emas};border-radius:12px;padding:32px 32px 16px 32px;">
${konteks.staging ? barisUji() : ""}<h1 class="pin-judul" style="margin:0 0 8px 0;font-family:${HURUF};font-size:24px;line-height:32px;font-weight:600;color:${T.tinta};">${esc(e.judul)}</h1>
<p class="pin-alasan" style="margin:0 0 ${e.konteks ? 4 : 20}px 0;font-family:${HURUF};font-size:14px;line-height:21px;color:${T.tinta2};">${esc(alasan)}</p>
${e.konteks ? `<p class="pin-konteks" style="margin:0 0 20px 0;font-family:${HURUF};font-size:14px;line-height:21px;font-weight:600;color:${T.tinta2};">${esc(e.konteks)}</p>` : ""}
${e.isi.map(blokHtml).join("\n")}
</td></tr>
<tr><td class="pin-kaki" style="padding:20px 4px 8px 4px;font-family:${HURUF};font-size:13px;line-height:20px;color:${T.tinta3};">
<p style="margin:0 0 8px 0;font-family:${HURUF};font-size:13px;line-height:20px;font-weight:600;color:${T.tinta3};">${esc(kata("email.bingkai.tidak_pernah"))}</p>
<p style="margin:0 0 8px 0;font-family:${HURUF};font-size:13px;line-height:20px;color:${T.tinta3};">${esc(kata("email.bingkai.tanya"))} <a class="pin-tautan" href="mailto:${KONTAK}" style="color:${T.utama};text-decoration:underline;">${KONTAK}</a>.</p>
<p style="margin:0;font-family:${HURUF};font-size:13px;line-height:20px;color:${T.tinta3};">${esc(BADAN_HUKUM)} · <a class="pin-tautan" href="https://${RANAH}" target="_blank" style="color:${T.utama};text-decoration:underline;">${RANAH}</a></p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</div>
</body>
</html>
`;

  return { subjek: e.subjek, html, teks: teksBiasa(e, alasan, konteks) };
}

/** Wrap at 72 characters, never inside a word; a URL stays whole on its own line. */
export function bungkus(s: string, lebar = 72): string {
  const out: string[] = [];
  for (const para of s.split("\n")) {
    let baris = "";
    for (const w of para.split(/\s+/).filter(Boolean)) {
      if (baris && (baris + " " + w).length > lebar) { out.push(baris); baris = w; }
      else baris = baris ? `${baris} ${w}` : w;
    }
    out.push(baris);
  }
  return out.join("\n");
}

function teksBiasa(e: Email, alasan: string, konteks: KonteksEmail): string {
  const bagian: string[] = [kata("email.bingkai.merek"), ""];
  if (konteks.staging) bagian.push(`[${kata("email.bingkai.uji")}]`, "");
  bagian.push(bungkus(e.judul), bungkus(alasan));
  if (e.konteks) bagian.push(bungkus(e.konteks));
  bagian.push("");
  for (const b of e.isi) {
    switch (b.jenis) {
      case "paragraf": bagian.push(bungkus(b.teks), ""); break;
      case "kode": bagian.push(`${b.label}:`, `    ${tampilKode(b.kode)}`, ""); break;
      case "tombol": bagian.push(`${b.teks}:`, b.href, ""); break;
      case "rincian": for (const [k, v] of b.baris) bagian.push(bungkus(`${k}: ${v}`)); bagian.push(""); break;
      case "catatan": bagian.push(bungkus(b.teks), ""); break;
      case "kartu": bagian.push(`    ${b.kartu.nama}`, `    ${b.kartu.pintarId}`, ...b.kartu.baris.map((r) => `    ${r.peran}${r.sekolah ? ` · ${r.sekolah}` : ""}`), ""); break;
    }
  }
  bagian.push(
    "--", bungkus(kata("email.bingkai.tidak_pernah")),
    `${kata("email.bingkai.tanya")} ${KONTAK}.`, `${BADAN_HUKUM} · ${RANAH}`, "",
  );
  return bagian.join("\n");
}
