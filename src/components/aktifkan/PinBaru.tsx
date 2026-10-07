"use client";

import { useCallback, useEffect, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import { hanyaAngka, kalimat, kirim, type Gagal } from "./jawaban";
import type { KeadaanAktivasi } from "./kontrak";
import KolomRahasia from "@/components/KolomRahasia";

/**
 * A NEW PIN, ON AKUN SAYA (BOB-28 with DAISY-22; C5).
 *
 * Shown only when one is awaited: after a suspension was restored, by an email
 * recovery or by the platform admin's reset, the old PIN matches nothing until
 * the person sets a new one. Whether one is awaited is the set-up state's own
 * answer (a finished account whose PIN step is not done); nothing else asks.
 * The PIN is typed twice, never shown back, and the blocklist's refusals are
 * the wizard's own sentences.
 */
type Layar = { k: "tidak" } | { k: "isi"; sibuk: boolean; pesan: { teks: string; nada: "gagal" | "netral" } | null } | { k: "selesai" };

export default function PinBaru({ locale }: { locale: Locale }) {
  const s = useCallback((k: HleEvent) => t(k, "staff", { locale }), [locale]);
  const [layar, setLayar] = useState<Layar>({ k: "tidak" });

  useEffect(() => {
    let batal = false;
    void kirim<"keadaan", KeadaanAktivasi>("keadaan").then((r) => {
      if (!batal && r.ok && r.keadaan === "COMPLETE" && r.langkah && !r.langkah.pin) setLayar({ k: "isi", sibuk: false, pesan: null });
    });
    return () => { batal = true; };
  }, []);

  async function simpan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (layar.k !== "isi" || layar.sibuk) return;
    const isi = new FormData(e.currentTarget);
    const pin = hanyaAngka(String(isi.get("pin") ?? ""));
    if (pin !== hanyaAngka(String(isi.get("ulang") ?? ""))) {
      setLayar({ k: "isi", sibuk: false, pesan: { teks: s("akun.pin.beda"), nada: "gagal" } });
      return;
    }
    setLayar({ k: "isi", sibuk: true, pesan: null });
    const fd = new FormData();
    fd.set("pin", pin);
    const r = await kirim<"pinBaru", object>("pinBaru", fd);
    if (r.ok) { setLayar({ k: "selesai" }); return; }
    setLayar({ k: "isi", sibuk: false, pesan: { teks: kalimat(r as Gagal<"pinBaru">, s, locale), nada: "gagal" } });
  }

  if (layar.k === "tidak") return null;
  return (
    <section className="pin-sec" aria-labelledby="pin-akun-pin">
      <h2 id="pin-akun-pin">{s("akun.pin.judul")}</h2>
      {layar.k === "selesai" ? (
        <BarisHasil nada="ok">{s("akun.pin.tersimpan")}</BarisHasil>
      ) : (
        <>
          <p className="pin-meta">{s("akun.pin.arti")}</p>
          <form className="pin-actions" onSubmit={simpan} noValidate>
            {/* CR-86 (D-127 Q6): each PIN its own secret field with its own reveal; a label names each by id, since a
                reveal control cannot sit inside a <label> beside the field it labels */}
            <div className="pin-akt-isian">
              <label className="pin-meta" htmlFor="pin-baru">{s("akun.pin.label")}</label>
              <KolomRahasia bungkus="pin-inp" tampilkan={s("auth.card_show")} sembunyikan={s("auth.card_hide")}
                id="pin-baru" name="pin" inputMode="numeric" autoComplete="new-password" maxLength={4} required readOnly={layar.sibuk} />
            </div>
            <div className="pin-akt-isian">
              <label className="pin-meta" htmlFor="pin-baru-ulang">{s("akun.pin.ulang")}</label>
              <KolomRahasia bungkus="pin-inp" tampilkan={s("auth.card_show")} sembunyikan={s("auth.card_hide")}
                id="pin-baru-ulang" name="ulang" inputMode="numeric" autoComplete="new-password" maxLength={4} required readOnly={layar.sibuk} />
            </div>
            <button type="submit" className="pin-btn pin-primary" disabled={layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}>
              {layar.sibuk ? s("akun.pin.menyimpan") : s("akun.pin.simpan")}
            </button>
          </form>
          {layar.pesan ? <BarisHasil nada={layar.pesan.nada}>{layar.pesan.teks}</BarisHasil> : null}
        </>
      )}
    </section>
  );
}
