"use client";

import { useEffect, useState } from "react";
import { gemaTanggal } from "@/lib/tanggal";
import type { Locale } from "@/lib/hle";

/**
 * A5 J5 (D-173(a); Daisy, J5Jendela): THE TEACHER SEES THE WINDOW THEY ARE CONFIRMING BEFORE THEY CONFIRM IT.
 *
 * Siapkan's review panel carries «Jendela: Mulai Selasa, 3 Nov 2026 · Sampai Kamis, 3 Des 2026» before «Sediakan»,
 * in the date helper's words (the fields' own echo, gemaTanggal). It follows the two fields as they change, so it says
 * what pressing will set, not what the page started with. Every word is the caller's (hle.ts). The server draws it
 * first from the fields' starting values, so it reads the same without a script.
 */
export default function JendelaTinjau({ idMulai, idSampai, mulai, sampai, kata, locale }: {
  idMulai: string;
  idSampai: string;
  mulai: string;
  sampai?: string;
  kata: { jendela: string; mulai: string; sampai: string; tanpaAkhir: string };
  locale: Locale;
}) {
  const [nilai, setNilai] = useState({ mulai, sampai: sampai ?? "" });
  useEffect(() => {
    const a = document.getElementById(idMulai) as HTMLInputElement | null;
    const b = document.getElementById(idSampai) as HTMLInputElement | null;
    const ikut = () => setNilai({ mulai: a?.value ?? "", sampai: b?.value ?? "" });
    for (const e of [a, b]) { e?.addEventListener("input", ikut); e?.addEventListener("change", ikut); }
    return () => { for (const e of [a, b]) { e?.removeEventListener("input", ikut); e?.removeEventListener("change", ikut); } };
  }, [idMulai, idSampai]);
  const awal = gemaTanggal(nilai.mulai, locale);
  const akhir = gemaTanggal(nilai.sampai, locale);
  return (
    <p className="pin-untuk" data-jendela-tinjau="">
      {kata.jendela}: {kata.mulai} {awal || "—"} · {akhir ? `${kata.sampai} ${akhir}` : kata.tanpaAkhir}
    </p>
  );
}
