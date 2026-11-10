"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";

/**
 * «KELUAR DARI SEMUA PERANGKAT» on Akun saya (BOB-29): asked once more before it is done, because it signs this
 * computer out too. Every session of the person ends (/api/sesi/keluar-semua); then the sign-in.
 * Focus as KonfirmasiBahaya: opening the question puts focus on «Batal», the safe choice, and «Batal» returns it to
 * the first button, so a keyboard reader is never dropped to the top of the page (readiness walk R4, 8 Nov).
 */
export default function KeluarSemua({ locale }: { locale: Locale }) {
  const s = useCallback((k: HleEvent) => t(k, "staff", { locale }), [locale]);
  const [langkah, setLangkah] = useState<"diam" | "yakin" | "sibuk" | "gagal">("diam");
  const buka = useRef<HTMLButtonElement>(null);
  const tidak = useRef<HTMLButtonElement>(null);
  const kembali = useRef(false);
  useEffect(() => {
    if (langkah === "yakin") tidak.current?.focus();
    else if (langkah === "diam" && kembali.current) { kembali.current = false; buka.current?.focus(); }
  }, [langkah]);

  async function keluar() {
    setLangkah("sibuk");
    let ok = false;
    try {
      const r = await fetch("/api/sesi/keluar-semua", { method: "POST", cache: "no-store" });
      ok = r.ok && ((await r.json().catch(() => null)) as { ok?: unknown } | null)?.ok === true;
    } catch {
      ok = false;
    }
    if (ok) { window.location.replace("/masuk"); return; }
    setLangkah("gagal");
  }

  return (
    <section className="pin-sec" aria-labelledby="pin-akun-semua">
      <h2 id="pin-akun-semua">{s("akun.semua.judul")}</h2>
      <p className="pin-meta">{s("akun.semua.arti")}</p>
      {langkah === "yakin" || langkah === "sibuk" ? (
        <div className="pin-actions" role="group" aria-label={s("akun.semua.yakin")}>
          <p className="pin-meta"><strong>{s("akun.semua.yakin")}</strong></p>
          <button type="button" className="pin-btn pin-bahaya-pasti" onClick={() => void keluar()} disabled={langkah === "sibuk"}
            aria-busy={langkah === "sibuk" ? "true" : undefined}>{s("akun.semua.ya")}</button>
          <button ref={tidak} type="button" className="pin-btn pin-quiet" onClick={() => { kembali.current = true; setLangkah("diam"); }} disabled={langkah === "sibuk"}>{s("akun.semua.batal")}</button>
        </div>
      ) : (
        <div className="pin-actions">
          <button ref={buka} type="button" className="pin-btn pin-bahaya" onClick={() => setLangkah("yakin")}>{s("akun.semua.tombol")}</button>
        </div>
      )}
      {langkah === "gagal" ? <BarisHasil nada="gagal">{s("akun.semua.gagal")}</BarisHasil> : null}
    </section>
  );
}
