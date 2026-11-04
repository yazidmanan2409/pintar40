/**
 * DAISY-20 × BOB-26: GATE 3'S TWO EMAILS, in the PINTAR frame (D-079(a): the
 * content is Daisy's, the data and the send are Bob's). Only
 * src/app/api/_email/identitas.ts imports this file; the data shapes are
 * src/lib/email/identitas.ts.
 *
 * THE CODE EMAIL (KODE_AKTIVASI, and KODE_ULANG when the person asked again).
 * Its data is `DataEmailKode`: the code as issued, the person's name, and
 * `berlakuMenit`, read by the server from the one canonical setting that also
 * sets Auth's code lifetime. THE EMAIL SAYS THE REAL DURATION FROM ITS DATA
 * and never types a number of minutes (D-079 addendum): change the canonical
 * value and «berlaku selama 10 menit» changes with it. The code is shown
 * grouped for reading («482 913»), as the frame's code block does; the
 * activation page accepts it typed either way.
 *
 * THE CARD EMAIL (KARTU_DIGITAL). Sent to STAFF only (C17), at the end of
 * activation and again from Akun saya. Its data is `DataEmailKartu`: the
 * current name, the PINTAR ID, the context lines read at send time from
 * current role assignments (D-059: a statement, never an authority), and the
 * address of Akun saya. The ID is shown 4 + 4 and is not a secret
 * (IDENTITY-4.0 §4). The card as a designed object is DAISY-24's; this email
 * carries its facts and the way to Akun saya, where the QR is.
 */
import { format } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import type { Templat } from "@/lib/email/templat";
import type { DataEmailKartu, DataEmailKode, DataEmailPasswordDiubah } from "@/lib/email/identitas";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";
import { susunKartu } from "@/lib/kartu-pintar";
import { barisKonteks } from "@/lib/email/konteks";
import { bingkaiEmail, kata, WARNA, WARNA_KELUARGA, type Blok } from "./bingkai";

/** KODE_AKTIVASI, or KODE_ULANG when `ulang`: a code the person asked for again. */
export const templatKode: Templat<DataEmailKode & { ulang: boolean }> = (data, konteks) => {
  const nama = data.nama.trim();
  const ulang = data.ulang;
  const isi: Blok[] = [
    ...(nama ? [{ jenis: "paragraf" as const, teks: `${kata("email.kode.halo")} ${nama}.` }] : []),
    { jenis: "paragraf", teks: kata(ulang ? "email.kode.ulang.isi" : "email.kode.isi") },
    { jenis: "kode", label: kata("email.kode.label"), kode: data.kode },
    { jenis: "paragraf", teks: `${kata("email.kode.berlaku")} ${format.durasi(data.berlakuMenit * 60, "id")}${kata("email.kode.berlaku_lalu")}` },
    { jenis: "catatan", nada: "perhatian", teks: kata("email.kode.bukan_anda") },
  ];
  return bingkaiEmail(
    {
      subjek: kata(ulang ? "email.kode.ulang.subjek" : "email.kode.subjek"),
      pratinjau: kata(ulang ? "email.kode.ulang.pratinjau" : "email.kode.pratinjau"),
      judul: kata(ulang ? "email.kode.ulang.judul" : "email.kode.judul"),
      isi,
      alasan: kata("email.kode.alasan"),
    },
    konteks,
  );
};

/** KARTU_DIGITAL: the PINTAR Card as live text, and the way to Akun saya. */
export const templatKartu: Templat<DataEmailKartu> = (data, konteks) => {
  const nama = data.nama.trim();
  // D-074(5), D-164, P1: the Digital Card's own lines and order (susunKartu), never a second layout of the roles
  const susunan = susunKartu(data.konteks);
  const warna = (susunan.keluarga && WARNA_KELUARGA[susunan.keluarga]) || WARNA.terang.tinta2;
  return bingkaiEmail(
    {
      subjek: kata("email.kartu.subjek"),
      pratinjau: `${kata("email.kartu.pratinjau")} ${tampilPintarId(data.pintarId)}.`,
      judul: kata("email.kartu.judul"),
      isi: [
        ...(nama ? [{ jenis: "paragraf" as const, teks: `${kata("email.kode.halo")} ${nama}.` }] : []),
        { jenis: "paragraf", teks: kata("email.kartu.isi") },
        { jenis: "kartu", kartu: { nama, pintarId: tampilPintarId(data.pintarId), baris: susunan.baris, warna } },
        { jenis: "paragraf", teks: kata("email.kartu.bukan_rahasia") },
        { jenis: "tombol", teks: kata("email.kartu.tombol"), href: data.tautanAkun, cadangan: true },
      ],
      alasan: kata("email.kartu.alasan"),
      konteks: barisKonteks(susunan.urut.map((k) => k.institusi), { awal: kata("email.bingkai.konteks"), dan: kata("email.bingkai.konteks.dan") }),
    },
    konteks,
  );
};

/**
 * PEMULIHAN_PASSWORD (BOB-27): the recovery code. The same frame and the same
 * code block as activation's; it says the real duration from its data.
 */
export const templatPemulihan: Templat<DataEmailKode> = (data, konteks) => {
  const nama = data.nama.trim();
  return bingkaiEmail(
    {
      subjek: kata("email.pulih.subjek"),
      pratinjau: kata("email.pulih.pratinjau"),
      judul: kata("email.pulih.judul"),
      isi: [
        ...(nama ? [{ jenis: "paragraf" as const, teks: `${kata("email.kode.halo")} ${nama}.` }] : []),
        { jenis: "paragraf", teks: kata("email.pulih.isi") },
        { jenis: "kode", label: kata("email.pulih.label"), kode: data.kode },
        { jenis: "paragraf", teks: `${kata("email.kode.berlaku")} ${format.durasi(data.berlakuMenit * 60, "id")}${kata("email.kode.berlaku_lalu")}` },
        { jenis: "catatan", nada: "perhatian", teks: kata("email.pulih.bukan_anda") },
      ],
      alasan: kata("email.pulih.alasan"),
    },
    konteks,
  );
};

/** PASSWORD_DIUBAH (BOB-27, D-055(f)): the password changed, when, and every session ended. */
export const templatPasswordDiubah: Templat<DataEmailPasswordDiubah> = (data, konteks) => {
  const nama = data.nama.trim();
  // the formal form with its time, «4 Oktober 2026 pukul 15.00 WIB», from the one date helper (W3.3, RV-16)
  const kapan = tanggal(data.waktu, "resmiJam") || data.waktu;
  return bingkaiEmail(
    {
      subjek: kata("email.diubah.subjek"),
      pratinjau: kata("email.diubah.pratinjau"),
      judul: kata("email.diubah.judul"),
      isi: [
        ...(nama ? [{ jenis: "paragraf" as const, teks: `${kata("email.kode.halo")} ${nama}.` }] : []),
        { jenis: "paragraf", teks: `${kata("email.diubah.isi")} ${kapan}.` },
        { jenis: "paragraf", teks: kata("email.diubah.sesi") },
        { jenis: "catatan", nada: "perhatian", teks: kata("email.diubah.bukan_anda") },
        { jenis: "tombol", teks: kata("email.diubah.tombol"), href: data.tautanLupa, cadangan: true },
      ],
      alasan: kata("email.diubah.alasan"),
    },
    konteks,
  );
};
