/**
 * DAISY-20 × BOB-26: THE ACTIVATION CODE EMAIL (KODE_AKTIVASI, and KODE_ULANG
 * when the person asked again), in the PINTAR frame.
 *
 * Its data is BOB-26's `DataEmailKode` (§5): the code as issued, the person's
 * name, and `berlakuMenit` — read by the server from the one canonical setting
 * that also sets Auth's code lifetime. THE EMAIL SAYS THE REAL DURATION FROM
 * ITS DATA and never types a number of minutes (D-079 addendum): change the
 * canonical value and «berlaku selama 10 menit» changes with it.
 *
 * The code is shown grouped for reading («482 913»), as the frame's code block
 * does; the activation page accepts it typed either way.
 */
import { format } from "@/lib/hle";
import type { Templat } from "@/lib/email/templat";
import type { DataEmailKode } from "@/components/aktifkan/kontrak";
import { bingkaiEmail, kata, type Blok } from "./bingkai";

function emailKode(ulang: boolean): Templat<DataEmailKode> {
  return (data, konteks) => {
    const nama = data.nama.trim();
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
}

/** KODE_AKTIVASI: the first code. */
export const templatKodeAktivasi: Templat<DataEmailKode> = emailKode(false);
/** KODE_ULANG: a code the person asked for again. */
export const templatKodeUlang: Templat<DataEmailKode> = emailKode(true);
