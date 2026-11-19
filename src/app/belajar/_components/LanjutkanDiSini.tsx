"use client";
/**
 * A3 · THE LEARNER CONTINUES HERE (THE PLAN §5.5 D7, D11; Daisy's A3-KODE-PEMULIHAN.md §1, §2, §6, §7; O-4).
 *
 * Shown in place of the player when the learner opens an open sitting that another session controls (the database's
 * pengerjaan_saya: di_sesi_ini false). The app cannot tell whether the device differs, so every sentence is O-4's
 * neutral form («di sesi baru», «masuk lagi»), never «di perangkat lain».
 *
 * - Low-stakes (D7, D11): ONE confirmation, «Lanjutkan di sini?». «Batal» goes back to Belajar and changes nothing.
 * - An Uji Penguasaan: one attempt on opening; without a valid permission the request reaches the teacher's list and
 *   the screen waits with «Coba lagi», which re-checks once and says when it checked (§2.2). Nothing retries or
 *   redirects by itself (§2.1).
 * Every refusal is said in BarisHasil as a failure (role="alert", DAISY-18); the confirmation is a question, not an error.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { jam, kataZona } from "@/lib/tanggal";
import { kunciKodePengerjaan, type HasilPulih, type KodePengerjaan } from "@/lib/pengerjaan-kontrak";
import BarisHasil from "@/components/BarisHasil";

/** Read once by the player's quiet line after a recovery the learner made themselves (Daisy §1, «Anda melanjutkan di sini»). */
export const TANDA_LANJUT = (sesi: string) => `pintar.lanjut.${sesi}`;

/** The codes that keep the learner on the waiting screen with «Coba lagi» (§1); anything else ends with the way back. */
const MENUNGGU: readonly (KodePengerjaan | "OFFLINE")[] = [
  "RECOVERY_NOT_AUTHORISED", "RECOVERY_AUTHORISATION_EXPIRED", "RECOVERY_AUTHORISATION_USED", "OFFLINE",
];

export default function LanjutkanDiSini(props: {
  sesi: string;
  perluIzin: boolean;
  judul: string;
  zona: string | null;
  locale: Locale;
  lanjutkan: (sessionId: string) => Promise<HasilPulih>;
}) {
  const { sesi, perluIzin, judul, zona, locale, lanjutkan } = props;
  const router = useRouter();
  const kata = (k: HleEvent) => t(k, "learner", { locale });
  const [kode, setKode] = useState<KodePengerjaan | "OFFLINE" | null>(null);
  const [diperiksa, setDiperiksa] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const judulRef = useRef<HTMLElement>(null);

  const coba = useCallback(async (dariTombol: boolean) => {
    setSibuk(true);
    let r: HasilPulih;
    try { r = await lanjutkan(sesi); } catch { r = { ok: false, kode: "OFFLINE" }; }
    setSibuk(false);
    if (r.ok) {
      // the player's quiet line: by the learner themselves (low-stakes); a teacher-allowed one is read from the database
      if (!perluIzin) { try { window.sessionStorage.setItem(TANDA_LANJUT(sesi), "1"); } catch { /* the line is a courtesy */ } }
      router.refresh();
      return;
    }
    setKode(r.kode);
    if (dariTombol) setDiperiksa(`${jam(new Date(), zona)} ${kataZona(zona)}`);
  }, [lanjutkan, perluIzin, router, sesi, zona]);

  // An Uji Penguasaan is tried once on opening (the learner opened it: that is the choice); never again by itself
  const sekali = useRef(false);
  useEffect(() => {
    if (!perluIzin || sekali.current) return;
    sekali.current = true;
    const id = window.setTimeout(() => { void coba(false); }, 0);
    return () => window.clearTimeout(id);
  }, [coba, perluIzin]);
  useEffect(() => { if (kode) judulRef.current?.focus(); }, [kode, diperiksa]);

  const kembali = <Link className="pin-btn" href="/belajar" data-pulih-kembali="">{kata("tolak.kembali")}</Link>;

  // ---------------------------------------------------------------- low-stakes: the one confirmation
  if (!perluIzin && !kode) {
    return (
      <section className="pin-pending" aria-labelledby="pulih-tanya" data-pulih="tanya">
        <h2 id="pulih-tanya">{kata("pengerjaan.pulih.tanya_judul")}</h2>
        <p>{kata("pengerjaan.pulih.tanya_isi")}</p>
        <div className="pin-actions">
          <button type="button" className="pin-btn pin-primary" disabled={sibuk} onClick={() => void coba(false)} data-pulih-ya="">
            {kata("pengerjaan.pulih.tanya_ya")}
          </button>
          <Link className="pin-btn" href="/belajar" data-pulih-batal="">{kata("pengerjaan.pulih.batal")}</Link>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------- the first attempt is still on its way
  if (!kode) return <p className="pin-meta" role="status" data-pulih="memeriksa" aria-busy="true">{judul}</p>;

  // ---------------------------------------------------------------- the refusals (§1), each its own sentence
  const menunggu = MENUNGGU.includes(kode);
  return (
    <section className="pin-pending" data-pulih={kode} ref={judulRef} tabIndex={-1}>
      {kode === "RECOVERY_NOT_AUTHORISED" ? (
        <>
          <h2>{kata("pengerjaan.galat.recovery_not_authorised")}</h2>
          <BarisHasil nada="gagal">{kata("pengerjaan.pulih.perlu_izin_isi").replace("{judul}", judul)}</BarisHasil>
        </>
      ) : (
        <BarisHasil nada="gagal">{kata(kode === "OFFLINE" ? "auth.card_putus" : kunciKodePengerjaan(kode))}</BarisHasil>
      )}
      {diperiksa ? <p className="pin-meta" data-pulih-diperiksa="">{kata("pengerjaan.pulih.diperiksa").replace("{jam}", diperiksa)}</p> : null}
      <div className="pin-actions">
        {menunggu ? (
          <button type="button" className="pin-btn pin-primary" disabled={sibuk} onClick={() => void coba(true)} data-pulih-coba="">
            {kata("pengerjaan.pulih.coba_lagi")}
          </button>
        ) : null}
        {kembali}
      </div>
    </section>
  );
}
