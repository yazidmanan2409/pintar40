"use client";

import { useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import BidangTeks from "@/components/bentuk/BidangTeks";
import { bacaJawabanKoreksiEmail, type JawabanKoreksiEmail } from "@/lib/koreksi-email-kontrak";

/**
 * W2.1 (CR-13, D-120 QN1; J2.21): «Koreksi email», the people list's own form. It posts to /api/akun/email, where the
 * database decides (before activation the school admin or the platform admin, after it the platform admin only) and
 * Auth moves the address; the answer is said here, in its own words: before activation the person activates at the new
 * address; after it, the old and the new address are told.
 */
export default function FormKoreksiEmail({ locale, orang, sekarang }: { locale: Locale; orang: string; sekarang: string }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [email, setEmail] = useState("");
  const [alasan, setAlasan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [jawaban, setJawaban] = useState<JawabanKoreksiEmail | null>(null);
  const berjalan = useRef(false);

  async function kirim() {
    if (berjalan.current) return;
    berjalan.current = true;
    setSibuk(true);
    let j: JawabanKoreksiEmail;
    try {
      const r = await fetch("/api/akun/email", {
        method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ person_id: orang, email, alasan }), cache: "no-store", credentials: "same-origin",
      });
      j = bacaJawabanKoreksiEmail(await r.json().catch(() => null));
    } catch {
      j = { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
    } finally {
      berjalan.current = false;
      setSibuk(false);
    }
    setJawaban(j);
  }

  return (
    <form className="pin-koreksi" data-koreksi="email" onSubmit={(e) => { e.preventDefault(); void kirim(); }}>
      <h3 className="pin-koreksi-judul">{s("orang.email.judul")}</h3>
      <p className="pin-meta">{s("orang.email.sekarang")} <span className="pin-num">{sekarang}</span></p>
      <BidangTeks id="koreksi-email" name="email" type="email" required autoComplete="off" label={s("orang.email.baru")}
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <BidangTeks id="koreksi-email-alasan" name="alasan" required maxLength={500} label={s("orang.alasan")}
        petunjuk={s("orang.alasan.arti")} value={alasan} onChange={(e) => setAlasan(e.target.value)} />
      <span className="pin-actions">
        <button type="submit" className="pin-btn pin-primary" disabled={sibuk} aria-busy={sibuk ? "true" : undefined}>
          {sibuk ? s("orang.menyimpan") : s("orang.email.tombol")}
        </button>
      </span>
      {jawaban ? (
        <BarisHasil nada={jawaban.ok ? "ok" : "gagal"}>
          {jawaban.ok
            ? s(jawaban.sudahAktif ? "orang.email.ok.aktif" : "orang.email.ok.belum")
            : s(`orang.email.gagal.${jawaban.code}` as HleEvent)}
          {!jawaban.ok && jawaban.ref ? <> {s("aktivasi.ulang.rujukan")}: <span className="pin-num">{jawaban.ref}</span>.</> : null}
        </BarisHasil>
      ) : null}
    </form>
  );
}
