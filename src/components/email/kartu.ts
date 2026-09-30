/**
 * DAISY-20 × BOB-26: THE PINTAR CARD EMAIL (KARTU_DIGITAL), in the PINTAR frame.
 *
 * Sent to STAFF only (C17), at the end of activation and again from Akun saya.
 * Its data is BOB-26's `DataEmailKartu` (§5): the current name, the PINTAR ID,
 * the context lines read at render time from current role assignments (D-059:
 * a statement, never an authority), and the address of Akun saya.
 *
 * The ID is shown 4 + 4 and is not a secret (IDENTITY-4.0 §4). The card as a
 * designed object — the PINTAR Digital Card of the card family, with its QR —
 * is DAISY-24's; this email carries its facts and the way to Akun saya, where
 * the QR is.
 */
import { t, type HleEvent } from "@/lib/hle";
import type { Templat } from "@/lib/email/templat";
import type { DataEmailKartu } from "@/components/aktifkan/kontrak";
import { id44 } from "@/components/aktifkan/jawaban";
import { bingkaiEmail, kata } from "./bingkai";

export const templatKartuDigital: Templat<DataEmailKartu> = (data, konteks) => {
  const nama = data.nama.trim();
  const peran = data.konteks.map((k): [string, string] => [
    kata("email.kartu.peran"),
    `${t(`role.${k.peran}` as HleEvent, "public", { locale: "id" })}${k.institusi ? ` · ${k.institusi}` : ""}`,
  ]);
  return bingkaiEmail(
    {
      subjek: kata("email.kartu.subjek"),
      pratinjau: `${kata("email.kartu.pratinjau")} ${id44(data.pintarId)}.`,
      judul: kata("email.kartu.judul"),
      isi: [
        ...(nama ? [{ jenis: "paragraf" as const, teks: `${kata("email.kode.halo")} ${nama}.` }] : []),
        { jenis: "paragraf", teks: kata("email.kartu.isi") },
        { jenis: "rincian", baris: [[kata("email.kartu.nama"), nama], [kata("email.kartu.id"), id44(data.pintarId)], ...peran] },
        { jenis: "paragraf", teks: kata("email.kartu.bukan_rahasia") },
        { jenis: "tombol", teks: kata("email.kartu.tombol"), href: data.tautanAkun, cadangan: true },
      ],
      alasan: kata("email.kartu.alasan"),
    },
    konteks,
  );
};
