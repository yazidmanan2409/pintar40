"use client";

import { useCallback, useEffect, useState } from "react";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import { kalimat, kirim, type Gagal } from "./jawaban";
import type { DataKartu } from "./kontrak";
import IdentitasSaya from "./IdentitasSaya";
import PinBaru from "./PinBaru";

/**
 * AKUN SAYA (DAISY-20, BOB-26 §4): a staff member's PINTAR ID, QR and card.
 *
 * The data is read at render time (`GET /api/akun/kartu`): the current name
 * and the current role assignments, never a stored label (D-059). The page
 * that mounts this has already refused anyone without a staff role (C17), so
 * a learner never reaches the request.
 *
 * THE CARD, SENT AGAIN (D-079). A card the send limits refused at activation
 * waits here; «Kirim kartu ke email saya» asks BOB-25's send once more, under
 * the same limits. When the limit says how long, the page says it; it never
 * invents a wait.
 */
type Muat = { k: "memuat" } | { k: "ada"; kartu: DataKartu } | { k: "gagal"; teks: string };
type Kirim = { k: "diam" } | { k: "sibuk" } | { k: "terkirim" } | { k: "belum"; tunggu: number | null } | { k: "gagal"; teks: string };

export default function AkunSaya({ locale }: { locale: Locale }) {
  const s = useCallback((k: HleEvent) => t(k, "staff", { locale }), [locale]);
  const [muat, setMuat] = useState<Muat>({ k: "memuat" });
  const [kirimKartu, setKirimKartu] = useState<Kirim>({ k: "diam" });

  useEffect(() => {
    let batal = false;
    void kirim<"kartu", { kartu: DataKartu }>("kartu").then((r) => {
      if (batal) return;
      if (r.ok) setMuat({ k: "ada", kartu: { ...r.kartu, konteks: r.kartu.konteks ?? [] } });
      else setMuat({ k: "gagal", teks: `${s("akun.gagal_muat")} ${r.ref ? `${s("auth.card_rujukan")}: ${r.ref}.` : ""}`.trim() });
    });
    return () => { batal = true; };
  }, [s]);

  async function kirimLagi() {
    if (kirimKartu.k === "sibuk") return;
    setKirimKartu({ k: "sibuk" });
    const r = await kirim<"kirimKartu", { kartu: "TERKIRIM" | "BELUM_TERKIRIM"; tunggu?: number }>("kirimKartu", new FormData());
    if (!r.ok) { setKirimKartu({ k: "gagal", teks: kalimat(r as Gagal<"kirimKartu">, s, locale) }); return; }
    if (r.kartu === "TERKIRIM") setKirimKartu({ k: "terkirim" });
    else setKirimKartu({ k: "belum", tunggu: typeof r.tunggu === "number" && r.tunggu > 0 ? Math.ceil(r.tunggu) : null });
  }

  if (muat.k === "memuat") return <p className="pin-meta" role="status">{s("aktifkan.memuat")}</p>;
  if (muat.k === "gagal") return <BarisHasil nada="gagal">{muat.teks}</BarisHasil>;

  return (
    <>
      <IdentitasSaya locale={locale} kartu={muat.kartu} />
      <PinBaru locale={locale} />
      <section className="pin-sec" aria-labelledby="pin-akun-kartu">
        <h2 id="pin-akun-kartu">{s("akun.kartu_judul")}</h2>
        <p className="pin-meta">{s("akun.kartu_arti")}</p>
        <div className="pin-actions">
          <button type="button" className="pin-btn" onClick={() => void kirimLagi()} disabled={kirimKartu.k === "sibuk"}
            aria-busy={kirimKartu.k === "sibuk" ? "true" : undefined}>
            {kirimKartu.k === "sibuk" ? s("akun.mengirim") : s("akun.kirim")}
          </button>
        </div>
        {kirimKartu.k === "terkirim" ? <BarisHasil nada="ok">{s("akun.terkirim")}</BarisHasil> : null}
        {kirimKartu.k === "belum" ? (
          <BarisHasil nada="gagal">
            {s("akun.belum")}{" "}
            {kirimKartu.tunggu !== null ? `${s("akun.coba_dalam")} ${format.durasi(kirimKartu.tunggu, locale)}.` : s("akun.coba_nanti")}
          </BarisHasil>
        ) : null}
        {kirimKartu.k === "gagal" ? <BarisHasil nada="gagal">{kirimKartu.teks}</BarisHasil> : null}
      </section>
    </>
  );
}
