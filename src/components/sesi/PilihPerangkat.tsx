"use client";

import { useCallback, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";

/**
 * «KOMPUTER SIAPA INI?» (BOB-29; C11): two choices, the shared computer first and chosen until the person picks the
 * other, each saying what it means in plain words. Saved for this browser (/api/sesi/perangkat), then back to the
 * page the person was going to.
 */
type Mode = "SHARED" | "PERSONAL";

export default function PilihPerangkat({ locale, awal, tujuan }: { locale: Locale; awal: Mode; tujuan: string }) {
  const s = useCallback((k: HleEvent) => t(k, "staff", { locale }), [locale]);
  const [mode, setMode] = useState<Mode>(awal);
  const [sibuk, setSibuk] = useState(false);
  const [gagal, setGagal] = useState(false);

  async function simpan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sibuk) return;
    setSibuk(true);
    setGagal(false);
    const fd = new FormData();
    fd.set("mode", mode);
    let ok = false;
    try {
      const r = await fetch("/api/sesi/perangkat", { method: "POST", body: fd, cache: "no-store" });
      const isi = (await r.json().catch(() => null)) as { ok?: unknown; mode?: unknown } | null;
      ok = r.ok && isi?.ok === true && isi.mode === mode;
    } catch {
      ok = false;
    }
    if (ok) { window.location.replace(tujuan); return; }
    setSibuk(false);
    setGagal(true);
  }

  const pilihan = (m: Mode, judul: HleEvent, arti: HleEvent) => (
    <label className={mode === m ? "pin-perangkat-pilihan pin-perangkat-dipilih" : "pin-perangkat-pilihan"}>
      <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} disabled={sibuk} />
      <span>
        <strong>{s(judul)}</strong>
        <span className="pin-meta">{s(arti)}</span>
      </span>
    </label>
  );

  return (
    <form className="pin-form" onSubmit={simpan} noValidate>
      <h1 className="pin-mh1">{s("perangkat.judul")}</h1>
      <p className="pin-lede-m">{s("perangkat.lede")}</p>
      <fieldset className="pin-perangkat">
        <legend className="pin-sr">{s("perangkat.judul")}</legend>
        {pilihan("SHARED", "perangkat.bersama", "perangkat.bersama.arti")}
        {pilihan("PERSONAL", "perangkat.pribadi", "perangkat.pribadi.arti")}
      </fieldset>
      <p className="pin-msg pin-msg-note">{s("perangkat.catatan")}</p>
      {gagal ? <BarisHasil nada="gagal">{s("perangkat.gagal")}</BarisHasil> : null}
      <button type="submit" className="pin-mbtn pin-mbtn-1" disabled={sibuk} aria-busy={sibuk ? "true" : undefined}>
        {sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("perangkat.menyimpan")}</> : s("perangkat.simpan")}
      </button>
    </form>
  );
}
