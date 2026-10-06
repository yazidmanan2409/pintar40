"use client";

import { useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import { bacaJawabanKartuUlang, type AlasanKartuUlang, type JawabanKartuUlang } from "@/lib/kartu-ulang-kontrak";
import LembarKartu, { type KartuCetak } from "./LembarKartu";

export type PemegangKartu = { person_id: string; display_name: string; institutional_id: string; card_last4: string };

/**
 * «KARTU HILANG ATAU RUSAK» (BOB-28 with DAISY-22; D-088(e), J2.21).
 *
 * The school's administrator finds the learner, says why (hilang or rusak) and
 * confirms that the old card stops working; `/api/akun/kartu-kelas` decides
 * (the database asks the reader's own authority) and answers the new card
 * number and PIN once, shown as one printable card. The learner keeps their
 * account, class and every result. The list is the database's own
 * (card_holders): the schools the reader provisions people in, and only the
 * card number's last four digits.
 */
export default function KartuUlang({ locale, pemegang }: { locale: Locale; pemegang: PemegangKartu[] }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [cari, setCari] = useState("");
  const [akhiran, setAkhiran] = useState<Record<string, string>>({});
  const [pilih, setPilih] = useState<{ id: string; alasan: AlasanKartuUlang | null } | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [gagal, setGagal] = useState<{ id: string; jawaban: Extract<JawabanKartuUlang, { ok: false }> } | null>(null);
  const [lembar, setLembar] = useState<KartuCetak | null>(null);
  const berjalan = useRef(false);
  const lembarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lembar) lembarRef.current?.focus();
  }, [lembar]);

  const kata = cari.trim().toLowerCase();
  const cocok = kata ? pemegang.filter((p) => p.display_name.toLowerCase().includes(kata) || p.institutional_id.toLowerCase().includes(kata)) : [];

  async function terbitkan(p: PemegangKartu, alasan: AlasanKartuUlang) {
    if (berjalan.current) return;
    berjalan.current = true;
    setSibuk(true);
    setGagal(null);
    let jawaban: JawabanKartuUlang;
    try {
      const r = await fetch("/api/akun/kartu-kelas", {
        method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ person_id: p.person_id, alasan }), cache: "no-store", credentials: "same-origin",
      });
      jawaban = bacaJawabanKartuUlang(await r.json().catch(() => null));
    } catch {
      jawaban = { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
    } finally {
      berjalan.current = false;
      setSibuk(false);
    }
    if (jawaban.ok) {
      setLembar({ nama: jawaban.kartu.nama || p.display_name, nomorInduk: p.institutional_id, card: jawaban.kartu.card, pin: jawaban.kartu.pin });
      setAkhiran((a) => ({ ...a, [p.person_id]: jawaban.kartu.card.slice(-4) }));
      setPilih(null);
    } else {
      setGagal({ id: p.person_id, jawaban });
    }
  }

  return (
    <section className="pin-sec" aria-labelledby="pin-akt-ulang">
      <h2 id="pin-akt-ulang">{s("aktivasi.ulang.judul")}</h2>
      <p className="pin-meta">{s("aktivasi.ulang.arti")}</p>
      {pemegang.length === 0 ? (
        <BarisHasil nada="netral">{s("aktivasi.ulang.kosong")}</BarisHasil>
      ) : (
        <>
          <label className="pin-akt-isian">
            <span className="pin-meta">{s("aktivasi.ulang.cari")}</span>
            <input className="pin-input" type="search" value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" spellCheck={false} />
          </label>
          {kata && cocok.length === 0 ? <p className="pin-meta">{s("aktivasi.ulang.tidak_ketemu")}</p> : null}
          <ul className="pin-lap-baris">
            {cocok.slice(0, 20).map((p) => {
              const dipilih = pilih?.id === p.person_id;
              return (
                <li key={p.person_id}>
                  <span>
                    <strong>{p.display_name}</strong> · <span className="pin-num">{p.institutional_id}</span>
                    {" · "}{s("aktivasi.ulang.akhiran")} <span className="pin-num">{akhiran[p.person_id] ?? p.card_last4}</span>
                  </span>
                  {dipilih ? (
                    <span>
                      <fieldset className="pin-akt-alasan">
                        <legend className="pin-meta">{s("aktivasi.ulang.alasan")}</legend>
                        {(["HILANG", "RUSAK"] as const).map((a) => (
                          <label key={a}>
                            <input type="radio" name={`alasan-${p.person_id}`} checked={pilih.alasan === a} onChange={() => setPilih({ id: p.person_id, alasan: a })} />
                            {" "}{s(a === "HILANG" ? "aktivasi.ulang.hilang" : "aktivasi.ulang.rusak")}
                          </label>
                        ))}
                      </fieldset>
                      <span className="pin-meta">{s("aktivasi.ulang.konfirmasi")}</span>
                      <span className="pin-actions">
                        <button type="button" className="pin-btn pin-primary" disabled={!pilih.alasan || sibuk} aria-busy={sibuk ? "true" : undefined}
                          onClick={() => pilih.alasan && void terbitkan(p, pilih.alasan)}>
                          {sibuk ? s("aktivasi.ulang.sibuk") : s("aktivasi.ulang.ya")}
                        </button>
                        <button type="button" className="pin-btn" disabled={sibuk} onClick={() => setPilih(null)}>{s("aktivasi.ulang.batal")}</button>
                      </span>
                    </span>
                  ) : (
                    <button type="button" className="pin-btn" disabled={sibuk} onClick={() => { setPilih({ id: p.person_id, alasan: null }); setGagal(null); }}>
                      {s("aktivasi.ulang.pilih")}
                    </button>
                  )}
                  {gagal?.id === p.person_id ? (
                    <BarisHasil nada="gagal">
                      {s(`aktivasi.ulang.gagal.${gagal.jawaban.code}` as HleEvent)}
                      {gagal.jawaban.ref ? <> {s("aktivasi.ulang.rujukan")}: <span className="pin-num">{gagal.jawaban.ref}</span>.</> : null}
                    </BarisHasil>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {lembar ? (
        <div tabIndex={-1} ref={lembarRef}>
          <LembarKartu locale={locale} kelas={s("aktivasi.ulang.lembar")} kartu={[lembar]} gagal={[]} />
        </div>
      ) : null}
    </section>
  );
}
