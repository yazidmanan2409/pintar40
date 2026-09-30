import type { Templat } from "@/lib/email/templat";
import type { DataEmailKartu, DataEmailKode } from "@/lib/email/identitas";
import { bingkaiEmail } from "@/components/email/bingkai";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";

/**
 * BOB-26: GATE 3'S TWO EMAILS, IN DAISY-19'S FRAME. INTERIM.
 *
 * These templates are DAISY-20's (D-079(a)): the content of the code and card
 * emails is hers. Until her templates exist, BOB-26 sends through her wired
 * frame (src/components/email/bingkai.ts), as D-079 directs. The frame decides
 * the logo, the staging line and the code's grouping from `konteks` alone.
 *   - The code email uses the frame prototype's own sample wording for an
 *     activation code (docs/coordination/ux/email-frame/buat-prototipe.mts,
 *     "contoh-kode"), with the validity from the canonical setting.
 *   - The card email has the fewest words a card needs, and no design of its
 *     own (the card's block is DAISY-24's).
 * Every word here is a placeholder for Daisy to replace, and the hand-off lists
 * them. DAISY-20 replaces this file whole; only src/app/api/_email/identitas.ts
 * imports it.
 */

export const templatKode: Templat<DataEmailKode & { ulang: boolean }> = (d, k) =>
  bingkaiEmail(
    {
      subjek: "Kode aktivasi akun PINTAR Anda",
      pratinjau: "Masukkan kode ini untuk melanjutkan aktivasi akun Anda.",
      judul: "Kode aktivasi akun PINTAR Anda",
      isi: [
        { jenis: "paragraf", teks: `Halo, ${d.nama}.` },
        { jenis: "paragraf", teks: "Masukkan kode berikut di halaman Aktifkan akun PINTAR untuk melanjutkan." },
        { jenis: "kode", label: "Kode aktivasi", kode: d.kode },
        { jenis: "paragraf", teks: `Kode ini berlaku ${d.berlakuMenit} menit dan hanya bisa dipakai sekali.` },
        { jenis: "catatan", nada: "perhatian", teks: "Tidak merasa meminta kode ini? Abaikan email ini. Akun Anda tidak berubah." },
      ],
      alasan: "Anda menerima email ini karena ada permintaan aktivasi akun PINTAR untuk alamat ini.",
    },
    k,
  );

export const templatKartu: Templat<DataEmailKartu> = (d, k) =>
  bingkaiEmail(
    {
      subjek: "Kartu PINTAR Anda",
      pratinjau: `PINTAR ID Anda: ${tampilPintarId(d.pintarId)}`,
      judul: "Kartu PINTAR Anda",
      isi: [
        { jenis: "paragraf", teks: `Halo, ${d.nama}.` },
        { jenis: "rincian", baris: [["Nama", d.nama], ["PINTAR ID", tampilPintarId(d.pintarId)]] },
        { jenis: "tombol", teks: "Buka Akun saya", href: d.tautanAkun, cadangan: true },
      ],
      alasan: "Anda menerima email ini karena akun PINTAR Anda baru saja diaktifkan.",
    },
    k,
  );
