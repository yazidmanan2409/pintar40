"use client";

import { t, type Locale } from "@/lib/hle";
import { useCariDiAlamat } from "./cari-pemegang";

/**
 * W2.10 (Batch 5; D-153): the waiting list's search. The words go into the address (`?cari_tunggu=…`) and the page
 * asks the database for one page of the matches (persons_awaiting_account_page); new words start at page 1. With the
 * count beside it, said politely when it changes.
 */
export default function CariTunggu({ locale, total, dicari }: { locale: Locale; total: number; dicari: string }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "staff", { locale });
  const [cari, setCari] = useCariDiAlamat("cari_tunggu", ["hal_tunggu"]);
  return (
    <div className="pin-actions pin-noprint" data-cari-tunggu="">
      <label className="pin-akt-isian">
        <span className="pin-meta">{s("aktivasi.tunggu.cari")}</span>
        <input className="pin-input" type="search" value={cari} onChange={(e) => setCari(e.target.value)}
          autoComplete="off" spellCheck={false} aria-describedby="pin-cari-tunggu-arti" />
      </label>
      <p id="pin-cari-tunggu-arti" className="pin-meta">{s("aktivasi.tunggu.cari_arti")}</p>
      <p className="pin-meta" aria-live="polite" data-jumlah-tunggu={total}>
        {s(dicari ? "aktivasi.tunggu.cocok" : "aktivasi.tunggu.jumlah").replace("{n}", String(total))}
      </p>
    </div>
  );
}
