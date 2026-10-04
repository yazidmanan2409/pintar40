"use client";

import { useState } from "react";
import { t, TIMEZONE, type HleEvent, type Locale } from "@/lib/hle";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";
import { bacaJawabanPemulihanAdmin, type JawabanStatusPemulihan, type StatusPemulihan } from "@/lib/keamanan-kontrak";
import BarisHasil from "@/components/BarisHasil";

/**
 * THE PLATFORM ADMIN'S PIN-RECOVERY RESET (BOB-28 with DAISY-22; C5 path (2)).
 *
 * Look one PINTAR ID up, see its state (available, locked until, stopped; a
 * new PIN awaited), then reset it with a stated reason. The reason is required
 * and recorded; the reset always forces a new PIN, so the old one never works
 * again. `/api/keamanan/pemulihan` asks the database with this reader's own
 * authority, which refuses anyone but the platform admin.
 */
type Gagal = Extract<JawabanStatusPemulihan, { ok: false }>;

export default function PemulihanPin({ locale }: { locale: Locale }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [status, setStatus] = useState<StatusPemulihan | null>(null);
  const [sibuk, setSibuk] = useState<"lihat" | "atur" | null>(null);
  const [gagal, setGagal] = useState<Gagal | null>(null);
  const [selesai, setSelesai] = useState(false);

  async function minta(input: string, init?: RequestInit): Promise<JawabanStatusPemulihan> {
    try {
      const r = await fetch(input, { ...init, headers: { accept: "application/json", ...(init?.body ? { "content-type": "application/json" } : {}) }, cache: "no-store", credentials: "same-origin" });
      return bacaJawabanPemulihanAdmin(await r.json().catch(() => null));
    } catch {
      return { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
    }
  }

  async function lihat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sibuk) return;
    const id = String(new FormData(e.currentTarget).get("id") ?? "");
    setSibuk("lihat"); setGagal(null); setSelesai(false); setStatus(null);
    const j = await minta(`/api/keamanan/pemulihan?id=${encodeURIComponent(id)}`);
    setSibuk(null);
    if (j.ok) setStatus(j.status); else setGagal(j);
  }

  async function aturUlang(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sibuk || !status) return;
    const alasan = String(new FormData(e.currentTarget).get("alasan") ?? "");
    setSibuk("atur"); setGagal(null); setSelesai(false);
    const j = await minta("/api/keamanan/pemulihan", { method: "POST", body: JSON.stringify({ id: status.pintarId, alasan }) });
    setSibuk(null);
    if (j.ok) { setStatus(j.status); setSelesai(true); } else setGagal(j);
  }

  const sampai = (iso: string | null) => {
    const d = iso ? new Date(iso) : null;
    return d && !Number.isNaN(d.getTime())
      ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE }).format(d)
      : "";
  };

  return (
    <section className="pin-sec" aria-labelledby="pin-keamanan-pin">
      <h2 id="pin-keamanan-pin">{s("keamanan.cari_judul")}</h2>
      <form className="pin-actions" onSubmit={lihat} noValidate>
        <label className="pin-akt-isian">
          <span className="pin-meta">{s("keamanan.id_label")}</span>
          <input className="pin-input" type="text" name="id" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12} required />
        </label>
        <button type="submit" className="pin-btn" disabled={sibuk !== null} aria-busy={sibuk === "lihat" ? "true" : undefined}>
          {sibuk === "lihat" ? s("keamanan.memuat") : s("keamanan.lihat")}
        </button>
      </form>
      {status ? (
        <div>
          <p>
            <strong>{status.nama}</strong> · <span className="pin-num">{tampilPintarId(status.pintarId)}</span>
            {" · "}{s(`keamanan.k.${status.keadaan}` as HleEvent)}{status.keadaan === "LOCKED" ? ` ${sampai(status.terkunciSampai)}` : ""}
          </p>
          {status.pinBaruDitunggu ? <p className="pin-meta">{s("keamanan.pin_baru")}</p> : null}
          {!status.akunEmail ? (
            <p className="pin-meta">{s("keamanan.tanpa_email")}</p>
          ) : (
            <form className="pin-actions" onSubmit={aturUlang} noValidate>
              <label className="pin-akt-isian">
                <span className="pin-meta">{s("keamanan.alasan_label")}</span>
                <input className="pin-input" type="text" name="alasan" autoComplete="off" maxLength={500} required />
              </label>
              <button type="submit" className="pin-btn pin-primary" disabled={sibuk !== null} aria-busy={sibuk === "atur" ? "true" : undefined}>
                {sibuk === "atur" ? s("keamanan.mengatur") : s("keamanan.atur_ulang")}
              </button>
            </form>
          )}
        </div>
      ) : null}
      {selesai ? <BarisHasil nada="ok">{s("keamanan.selesai")}</BarisHasil> : null}
      {gagal ? <BarisHasil nada="gagal">{s(`keamanan.gagal.${gagal.code}` as HleEvent)}{gagal.ref ? ` (${gagal.ref})` : ""}</BarisHasil> : null}
    </section>
  );
}
