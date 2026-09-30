import type { Templat, KonteksEmail } from "@/lib/email/templat";
import type { DataEmailKartu, DataEmailKode } from "@/lib/email/identitas";
import { bingkaiEmail } from "@/lib/email/bingkai";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";

/**
 * BOB-26: GATE 3'S TWO EMAILS, THROUGH DAISY-19'S FRAME. INTERIM.
 *
 * These templates are DAISY-20's (D-079(a)): the content of the code and card
 * emails is hers. Until her templates exist, BOB-26 renders through her
 * accepted frame (bingkaiEmail), as D-079 directs:
 *   - the code email uses the frame prototype's own sample wording for an
 *     activation code (docs/coordination/ux/email-frame/buat-prototipe.mts,
 *     "contoh-kode"), with the validity from the canonical setting;
 *   - the card email has the fewest words a card needs, and no design of its
 *     own (the card's block is DAISY-24's).
 * Every word here is a placeholder for Daisy to replace; the hand-off lists
 * them. DAISY-20 replaces this file whole; nothing else imports it.
 */

/** Each environment's own logo (DAISY-19 ruling 2); the frame accepts https only, so a local sink gets the wordmark. */
function logo(k: KonteksEmail): string | null {
  return k.asal.startsWith("https://") ? `${k.asal}/brand/pintar-selalu-logo.png` : null;
}

function spasiKode(kode: string): string {
  return kode.length === 6 ? `${kode.slice(0, 3)} ${kode.slice(3)}` : kode;
}

export const templatKode: Templat<DataEmailKode & { ulang: boolean }> = (d, k) =>
  bingkaiEmail({
    subjek: "Kode aktivasi akun PINTAR Anda",
    pratinjau: "Masukkan kode ini untuk melanjutkan aktivasi akun Anda.",
    judul: "Kode aktivasi akun PINTAR Anda",
    isi: [
      { jenis: "paragraf", teks: `Halo, ${d.nama}.` },
      { jenis: "paragraf", teks: "Masukkan kode berikut di halaman Aktifkan akun PINTAR untuk melanjutkan." },
      { jenis: "kode", label: "Kode aktivasi", kode: spasiKode(d.kode) },
      { jenis: "paragraf", teks: `Kode ini berlaku ${d.berlakuMenit} menit dan hanya bisa dipakai sekali.` },
      { jenis: "catatan", nada: "perhatian", teks: "Tidak merasa meminta kode ini? Abaikan email ini. Akun Anda tidak berubah." },
    ],
    alasan: "Anda menerima email ini karena ada permintaan aktivasi akun PINTAR untuk alamat ini.",
    logo: logo(k),
  });

export const templatKartu: Templat<DataEmailKartu> = (d, k) =>
  bingkaiEmail({
    subjek: "Kartu PINTAR Anda",
    pratinjau: `PINTAR ID Anda: ${tampilPintarId(d.pintarId)}`,
    judul: "Kartu PINTAR Anda",
    isi: [
      { jenis: "paragraf", teks: `Halo, ${d.nama}.` },
      { jenis: "rincian", baris: [["Nama", d.nama], ["PINTAR ID", tampilPintarId(d.pintarId)]] },
      ...(d.tautanAkun.startsWith("https://")
        ? [{ jenis: "tombol" as const, teks: "Buka Akun saya", href: d.tautanAkun, cadangan: true }]
        : [{ jenis: "paragraf" as const, teks: d.tautanAkun }]),
    ],
    alasan: "Anda menerima email ini karena akun PINTAR Anda baru saja diaktifkan.",
    logo: logo(k),
  });
