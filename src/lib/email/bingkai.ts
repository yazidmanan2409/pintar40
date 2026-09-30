// BOB-26: DAISY-19's accepted frame, copied UNCHANGED from
// docs/coordination/ux/email-frame/bingkai.mts so the server can send Gate 3's
// emails before DAISY-19's wiring lands (D-079: Bob supplies data and the send,
// never markup or copy). It is Daisy's: her wiring replaces or moves this file.
// BOB26-E01 holds it byte-identical to the prototype until then.
/**
 * DAISY-19 (D-057(a)): the base PINTAR email frame, shared by all six identity
 * emails: activation code, resend, password recovery, password changed, the
 * PINTAR Digital Card, and security notices.
 *
 * STATIC PROTOTYPE. This file lives with the prototype until BOB-25 publishes
 * its template-rendering interface. It then moves to src/components/email/, its
 * frame wording moves into src/lib/hle.ts (D-014) and a selftest pins the static
 * scan. Until then nothing in the app imports it.
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
 * - Every text an email supplies is escaped. Links must be https.
 */

export type Nada = "netral" | "perhatian";

export type Blok =
  /** a paragraph of body text */
  | { jenis: "paragraf"; teks: string }
  /** a code the reader types (activation, recovery), shown large and spaced */
  | { jenis: "kode"; label: string; kode: string }
  /** one primary action; `cadangan` adds the copy-the-address line below it */
  | { jenis: "tombol"; teks: string; href: string; cadangan?: boolean }
  /** label and value rows, e.g. when something happened */
  | { jenis: "rincian"; baris: Array<[string, string]> }
  /** a calm boxed note; "perhatian" for "if this was not you" */
  | { jenis: "catatan"; teks: string; nada?: Nada };

export type Email = {
  /** the subject line, also the article's accessible name */
  subjek: string;
  /** the inbox preview line (hidden in the body) */
  pratinjau: string;
  /** the one heading */
  judul: string;
  isi: Blok[];
  /** why this person received this email; the frame has a general default */
  alasan?: string;
  /** absolute https URL of the logo; null gives the text wordmark only */
  logo?: string | null;
};

/** The frame's own words (later: `email.bingkai.*` in hle.ts). Bahasa Indonesia only, as the emails are. */
export const KATA = {
  merek: "PINTAR",
  alasanUmum: "Anda menerima email ini karena alamat ini terhubung dengan akun PINTAR.",
  tidakPernah: "PINTAR tidak pernah meminta PIN atau password lewat email.",
  tanya: "Ada pertanyaan? Tulis ke",
  badan: "PT ZAYD PINTAR SELALU",
  cadangan: "Jika tombol tidak bisa dibuka, salin alamat ini ke peramban Anda:",
} as const;

export const KONTAK = "info@pintarselalu.com";
export const RANAH = "pintarselalu.com";
export const LOGO_BAKU = "https://app.pintarselalu.com/brand/pintar-selalu-logo.png";
/** FROM and Reply-To as fixed at Gate 0 (M3, M4). The sending module sets them; the frame only records them. */
export const PENGIRIM = { dari: "Tim PINTAR <noreply@pintarselalu.com>", dariStaging: "Tim PINTAR (Staging) <noreply@pintarselalu.com>", balasKe: KONTAK } as const;

/** Colours: the app's tokens (src/app/globals.css), plus a dark set used only where a client honours prefers-color-scheme. */
export const WARNA = {
  terang: {
    latar: "#F3F1EC", kartu: "#FFFFFF", garis: "#E2E4E5", tinta: "#1F2A33", tinta2: "#4E5A64", tinta3: "#5F6A73",
    utama: "#245F55", utamaTinta: "#FFFFFF", utamaLembut: "#E3EFEC", utamaGaris: "#C4DAD4",
    perhatian: "#8A5F00", perhatianLembut: "#F7EED8", netral: "#3D5A80", netralLembut: "#E7EDF5",
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

function hanyaHttps(href: string): string {
  if (!/^https:\/\/[^\s"'<>]+$/.test(href)) throw new Error("the frame accepts only absolute https links");
  return href;
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
<p class="pin-kode" style="margin:0;font-family:${HURUF_KODE};font-size:32px;line-height:40px;font-weight:700;letter-spacing:6px;color:${T.tinta};">${esc(b.kode)}</p>
</td></tr></table>`;
    case "tombol": {
      const href = esc(hanyaHttps(b.href));
      const tombol = `<table class="pin-tombol-tabel" role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
<tr><td class="pin-tombol" align="center" bgcolor="${T.utama}" style="background-color:${T.utama};border-radius:8px;mso-padding-alt:14px 28px;">
<a class="pin-tombol-a" href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;mso-padding-alt:0;font-family:${HURUF};font-size:16px;line-height:20px;font-weight:600;color:${T.utamaTinta};text-decoration:none;border-radius:8px;">${esc(b.teks)}</a>
</td></tr></table>`;
      const cadangan = b.cadangan
        ? `<p class="pin-kecil" style="margin:-8px 0 20px 0;font-family:${HURUF};font-size:14px;line-height:22px;color:${T.tinta2};">${esc(KATA.cadangan)}<br><a class="pin-tautan" href="${href}" target="_blank" style="color:${T.utama};text-decoration:underline;word-break:break-all;">${esc(b.href)}</a></p>`
        : "";
      return tombol + cadangan;
    }
    case "rincian":
      return `<table class="pin-rincian" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;border-top:1px solid ${T.garis};">
${b.baris.map(([k, v]) => `<tr><td class="pin-rincian-k" valign="top" style="padding:10px 12px 10px 0;border-bottom:1px solid ${T.garis};font-family:${HURUF};font-size:14px;line-height:20px;color:${T.tinta3};width:38%;">${esc(k)}</td><td class="pin-rincian-v" valign="top" style="padding:10px 0;border-bottom:1px solid ${T.garis};font-family:${HURUF};font-size:15px;line-height:22px;color:${T.tinta};">${esc(v)}</td></tr>`).join("\n")}
</table>`;
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
  .pin-label, .pin-kecil { color: ${G.tinta2} !important; }
  .pin-kaki, .pin-kaki p, .pin-rincian-k { color: ${G.tinta3} !important; }
  .pin-rincian, .pin-rincian-k, .pin-rincian-v { border-color: ${G.garis} !important; }
  .pin-kotak-kode { background-color: ${G.utamaLembut} !important; border-color: ${G.utamaGaris} !important; }
  .pin-tombol, .pin-tombol-a { background-color: ${G.tombol} !important; color: ${G.utamaTinta} !important; }
  .pin-tautan, .pin-merek-teks { color: ${G.utama} !important; }
  .pin-catatan-perhatian { background-color: ${G.perhatianLembut} !important; border-left-color: ${G.perhatian} !important; color: ${G.tinta} !important; }
  .pin-catatan-netral { background-color: ${G.netralLembut} !important; border-left-color: ${G.netral} !important; color: ${G.tinta} !important; }
}
</style>`;
}

export function bingkaiEmail(e: Email): { subjek: string; html: string; teks: string } {
  const logo = e.logo === undefined ? LOGO_BAKU : e.logo;
  if (logo !== null) hanyaHttps(logo);
  const alasan = e.alasan ?? KATA.alasanUmum;
  const merek = logo === null
    ? `<span class="pin-merek-teks" style="font-family:${HURUF};font-size:22px;line-height:28px;font-weight:700;letter-spacing:3px;color:${T.utama};">${KATA.merek}</span>`
    // the alt text is styled as the wordmark: with images blocked, "PINTAR" still reads in the brand colour
    : `<img src="${esc(logo)}" width="104" height="58" alt="${KATA.merek}" style="display:block;border:0;outline:none;text-decoration:none;width:104px;height:58px;font-family:${HURUF};font-size:22px;line-height:28px;font-weight:700;letter-spacing:3px;color:${T.utama};">`;
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
<tr><td style="padding:0 4px 18px 4px;" align="left">${merek}</td></tr>
<tr><td class="pin-kartu" bgcolor="${T.kartu}" style="background-color:${T.kartu};border:1px solid ${T.garis};border-radius:12px;padding:32px 32px 16px 32px;">
<h1 class="pin-judul" style="margin:0 0 16px 0;font-family:${HURUF};font-size:24px;line-height:32px;font-weight:600;color:${T.tinta};">${esc(e.judul)}</h1>
${e.isi.map(blokHtml).join("\n")}
</td></tr>
<tr><td class="pin-kaki" style="padding:20px 4px 8px 4px;font-family:${HURUF};font-size:13px;line-height:20px;color:${T.tinta3};">
<p style="margin:0 0 8px 0;font-family:${HURUF};font-size:13px;line-height:20px;color:${T.tinta3};">${esc(alasan)}</p>
<p style="margin:0 0 8px 0;font-family:${HURUF};font-size:13px;line-height:20px;font-weight:600;color:${T.tinta3};">${esc(KATA.tidakPernah)}</p>
<p style="margin:0 0 8px 0;font-family:${HURUF};font-size:13px;line-height:20px;color:${T.tinta3};">${esc(KATA.tanya)} <a class="pin-tautan" href="mailto:${KONTAK}" style="color:${T.utama};text-decoration:underline;">${KONTAK}</a>.</p>
<p style="margin:0;font-family:${HURUF};font-size:13px;line-height:20px;color:${T.tinta3};">${esc(KATA.badan)} · <a class="pin-tautan" href="https://${RANAH}" target="_blank" style="color:${T.utama};text-decoration:underline;">${RANAH}</a></p>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</div>
</body>
</html>
`;

  return { subjek: e.subjek, html, teks: teksBiasa(e, alasan) };
}

/** Wrap at 72 characters, never inside a word; a URL stays whole on its own line. */
export function bungkus(s: string, lebar = 72): string {
  const out: string[] = [];
  for (const para of s.split("\n")) {
    let baris = "";
    for (const kata of para.split(/\s+/).filter(Boolean)) {
      if (baris && (baris + " " + kata).length > lebar) { out.push(baris); baris = kata; }
      else baris = baris ? `${baris} ${kata}` : kata;
    }
    out.push(baris);
  }
  return out.join("\n");
}

function teksBiasa(e: Email, alasan: string): string {
  const bagian: string[] = [KATA.merek, "", bungkus(e.judul), ""];
  for (const b of e.isi) {
    switch (b.jenis) {
      case "paragraf": bagian.push(bungkus(b.teks), ""); break;
      case "kode": bagian.push(`${b.label}:`, `    ${b.kode}`, ""); break;
      case "tombol": bagian.push(`${b.teks}:`, b.href, ""); break;
      case "rincian": for (const [k, v] of b.baris) bagian.push(bungkus(`${k}: ${v}`)); bagian.push(""); break;
      case "catatan": bagian.push(bungkus(b.teks), ""); break;
    }
  }
  bagian.push("--", bungkus(alasan), bungkus(KATA.tidakPernah), `${KATA.tanya} ${KONTAK}.`, `${KATA.badan} · ${RANAH}`, "");
  return bagian.join("\n");
}
