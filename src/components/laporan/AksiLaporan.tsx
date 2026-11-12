"use client";

import { useEffect, useRef, useState } from "react";
import TautanKembali from "@/components/TautanKembali";
import BarisHasil from "@/components/BarisHasil";
import { waktuPerangkat } from "@/lib/tanggal";
import type { HasilCetak, PermintaanCetak } from "@/lib/akuntabilitas-kontrak";

/**
 * HOD-J09: A REPORT HAS A WAY BACK AND CAN BE PRINTED. «Kembali» returns to the page the reader came from, with its place
 * kept; opened with nothing behind it, it goes to the reader's doors (/).
 *
 * B2 (THE PLAN §5.2; B2-COMPLETION.md §3): «CETAK LAPORAN» IS AN OFFICIAL PRINT.
 * - The action records the request (B1's fail-closed writer) and returns its reference, the printer's name and the
 *   instant, all the server's. Only then does the footer take the official line, and the print dialog opens. A refused
 *   or failed request opens no dialog, swaps nothing, and the result line says so.
 * - The default footer (any other print, Ctrl+P included) names no person (Sharon's change 5; Daisy's wording): the
 *   stylesheet's default is the short line with no time; `beforeprint` adds the device's time.
 * - Both are restored as soon as window.print() returns AND on `afterprint` (Sharon's change 2), so a stale reference or
 *   time is never printed on a second paper.
 */
export type KataKaki = {
  /** «Dicetak oleh {nama} · {waktu} · Ref. {ref}» */
  resmi: string;
  /** «Dicetak dari browser · {waktu} (jam perangkat) · tanpa nomor referensi» */
  peramban: string;
  /** «Dicetak dari browser · tanpa nomor referensi» */
  pendek: string;
  gagal: string;
  ditolak: string;
  locale: "id" | "en";
};

/** The footer's line as a CSS string in both report pages' margin box (KepalaCetak's escaping). */
function css(teks: string): string {
  const kotak = `@bottom-left { content: ${JSON.stringify(teks).replace(/</g, "\\3C ")}; }`;
  return `@page laporan { ${kotak} } @page laporan-lebar { ${kotak} }`;
}

export default function AksiLaporan({ kembali, cetak, ke = "/", cetakSebagai, aksi, kaki }: {
  kembali: string; cetak: string;
  /** H9: the place the report was opened from (asalLaporan), whose name `kembali` is; "/" when it is not known. */
  ke?: string;
  /** B2: what this report is, for the record; absent, the button is not offered (an empty report: §5.2 F) */
  cetakSebagai?: PermintaanCetak | null;
  /** B2: the print action (cetakLaporan, src/app/laporan/cetak/actions.ts), passed by the server page */
  aksi?: (p: PermintaanCetak) => Promise<HasilCetak>;
  kaki: KataKaki;
}) {
  const gaya = useRef<HTMLStyleElement | null>(null);
  const resmi = useRef(false);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const pulihkan = () => {
    resmi.current = false;
    if (gaya.current) gaya.current.textContent = css(kaki.pendek);
  };

  useEffect(() => {
    // any print that is not «Cetak laporan»: the browser line, with the device's time, for that print only
    const sebelum = () => {
      if (!resmi.current && gaya.current) gaya.current.textContent = css(kaki.peramban.replace("{waktu}", waktuPerangkat(new Date(), kaki.locale)));
    };
    window.addEventListener("beforeprint", sebelum);
    window.addEventListener("afterprint", pulihkan);
    return () => {
      window.removeEventListener("beforeprint", sebelum);
      window.removeEventListener("afterprint", pulihkan);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the words are the page's, fixed for its life
  }, []);

  const tekan = async () => {
    if (!cetakSebagai || !aksi || sibuk) return;
    setSibuk(true);
    setPesan(null);
    const h: HasilCetak = await aksi(cetakSebagai).catch(() => ({ ok: false as const, kode: "CETAK_GAGAL" as const }));
    setSibuk(false);
    if (!h.ok) {
      setPesan(h.kode === "CETAK_TIDAK_BOLEH" ? kaki.ditolak : kaki.gagal);
      return;
    }
    resmi.current = true;
    if (gaya.current) gaya.current.textContent = css(kaki.resmi.replace("{nama}", h.nama).replace("{waktu}", h.waktu).replace("{ref}", h.ref));
    try {
      window.print();
    } finally {
      // the dialog has returned (or the browser never blocks on it): the default again, whether or not afterprint fires
      pulihkan();
    }
  };

  return (
    <>
      <style ref={gaya} data-kaki-cetak="">{css(kaki.pendek)}</style>
      <div className="pin-actions pin-noprint">
        <TautanKembali href={ke} className="pin-btn pin-quiet" jenis={ke === "/" ? "riwayat" : "tempat"}>
          ← {kembali}
        </TautanKembali>
        {cetakSebagai && aksi ? (
          <button type="button" className="pin-btn pin-primary" onClick={() => void tekan()} disabled={sibuk} aria-busy={sibuk ? "true" : undefined}>
            {cetak}
          </button>
        ) : null}
      </div>
      {pesan ? <div className="pin-noprint" data-cetak-gagal=""><BarisHasil nada="gagal">{pesan}</BarisHasil></div> : null}
    </>
  );
}
