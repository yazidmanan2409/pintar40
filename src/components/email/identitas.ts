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
import { format, t, type HleEvent } from "@/lib/hle";
import type { Templat } from "@/lib/email/templat";
import type { DataEmailKartu, DataEmailKode } from "@/lib/email/identitas";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";
import { bingkaiEmail, kata, type Blok } from "./bingkai";

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

/** KARTU_DIGITAL: the PINTAR Card's facts, and the way to Akun saya. */
export const templatKartu: Templat<DataEmailKartu> = (data, konteks) => {
  const nama = data.nama.trim();
  const peran = data.konteks.map((k): [string, string] => [
    kata("email.kartu.peran"),
    `${t(`role.${k.peran}` as HleEvent, "public", { locale: "id" })}${k.institusi ? ` · ${k.institusi}` : ""}`,
  ]);
  return bingkaiEmail(
    {
      subjek: kata("email.kartu.subjek"),
      pratinjau: `${kata("email.kartu.pratinjau")} ${tampilPintarId(data.pintarId)}.`,
      judul: kata("email.kartu.judul"),
      isi: [
        ...(nama ? [{ jenis: "paragraf" as const, teks: `${kata("email.kode.halo")} ${nama}.` }] : []),
        { jenis: "paragraf", teks: kata("email.kartu.isi") },
        { jenis: "rincian", baris: [[kata("email.kartu.nama"), nama], [kata("email.kartu.id"), tampilPintarId(data.pintarId)], ...peran] },
        { jenis: "paragraf", teks: kata("email.kartu.bukan_rahasia") },
        { jenis: "tombol", teks: kata("email.kartu.tombol"), href: data.tautanAkun, cadangan: true },
      ],
      alasan: kata("email.kartu.alasan"),
    },
    konteks,
  );
};
