"use client";

import { useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import { alamatLengkap, bacaHasilUji, type HasilUji } from "./hasil";

/**
 * «Kirim email uji» (BOB-51): one inbox field and one button. The press is
 * one POST to /api/email/uji, the same route and the same sending path as
 * every PINTAR email, limits and send log included; this form sends nothing
 * else. The answer is one plain sentence (hasil.ts), with the reference when
 * there is one and a setting's name when a setting is wrong.
 */
export default function FormEmailUji({ locale, namaPengaturan }: {
  locale: Locale;
  /** the names a setting error may show, from the sending module (never values) */
  namaPengaturan: readonly string[];
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [ke, setKe] = useState("");
  const [hasil, setHasil] = useState<(HasilUji & { ke: string }) | null>(null);
  const [kurang, setKurang] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const berjalan = useRef(false);

  async function kirim() {
    const alamat = ke.trim();
    setKurang(!alamatLengkap(alamat));
    if (!alamatLengkap(alamat) || berjalan.current) return;
    berjalan.current = true;
    setSibuk(true);
    setHasil(null);
    let status: number | null = null;
    let jawaban: unknown = null;
    try {
      const res = await fetch("/api/email/uji", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ke: alamat }),
      });
      status = res.status;
      jawaban = await res.json().catch(() => null);
    } catch {
      status = null;
    } finally {
      berjalan.current = false;
      setSibuk(false);
    }
    setHasil({ ...bacaHasilUji(status, jawaban, namaPengaturan), ke: alamat });
  }

  return (
    <section className="pin-akt-orang">
      <form className="pin-actions" onSubmit={(e) => { e.preventDefault(); void kirim(); }}>
        <label className="pin-akt-isian">
          <span className="pin-meta">{s("emailuji.ke")}</span>
          <input className="pin-input" type="email" name="ke" autoComplete="email" value={ke}
            onChange={(e) => setKe(e.target.value)} />
        </label>
        <button type="submit" className="pin-btn pin-primary" disabled={sibuk} aria-busy={sibuk ? "true" : undefined}>
          {sibuk ? s("emailuji.mengirim") : s("emailuji.tombol")}
        </button>
      </form>
      {kurang ? (
        <BarisHasil nada="gagal">{s("emailuji.galat.alamat")}</BarisHasil>
      ) : hasil ? (
        <BarisHasil nada={hasil.nada}>
          <span>{s(hasil.kunci)}</span>
          {hasil.nada === "ok" ? <> <strong>{hasil.ke}</strong>. {s("emailuji.periksa")}</> : null}
          {hasil.variabel ? <> {s("emailuji.pengaturan.nama")} <code className="pin-num">{hasil.variabel}</code>.</> : null}
          {hasil.rujukan ? <> {s("emailuji.rujukan")} <span className="pin-num">{hasil.rujukan}</span></> : null}
        </BarisHasil>
      ) : null}
    </section>
  );
}
