"use client";

import { useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import BidangTeks from "@/components/bentuk/BidangTeks";
import { bacaJawabanKartuJadiEmail, type JawabanKartuJadiEmail } from "@/lib/kartu-jadi-email-kontrak";
import type { PemegangKartu } from "./KartuUlang";
import { useCariDiAlamat } from "./cari-pemegang";
import { kataAman } from "@/lib/pemegang-kartu";

/**
 * «MURID YANG MENJADI STAF» (D-152(a), Batch 4; CR-91 unchanged).
 *
 * A class card is a learner's alone, so a learner who becomes staff needs an email account first. The school's
 * administrator finds the learner among the card holders (the database's own list, card_holders), gives the address
 * the person will use and why, and confirms that the card stops working; `/api/akun/kartu-ke-email` decides (the
 * database asks the reader's own authority) and converts the same account. The result says what happens next: the
 * person asks for their activation code at «Aktifkan akun» with that address, and the school then gives them their
 * role. The person, their PINTAR ID, classes and every result stay.
 *
 * No composition of Daisy's covers this action: it follows «Kartu hilang atau rusak» beside it (search, choose,
 * confirm, the result line) in the Batch 2 primitives (TextField, ActionFeedback).
 */
export default function KartuJadiEmail({ locale, pemegang, ada, dicari }: { locale: Locale; pemegang: PemegangKartu[]; ada: boolean; dicari: string }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [cari, setCari] = useCariDiAlamat("cari_staf");
  const [dikenal, setDikenal] = useState<Record<string, PemegangKartu>>({});
  const [pilih, setPilih] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [alasan, setAlasan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState<{ id: string; jawaban: JawabanKartuJadiEmail } | null>(null);
  const [selesai, setSelesai] = useState<Set<string>>(new Set());
  const berjalan = useRef(false);

  const kata = cari.trim().toLowerCase();
  // W2.10 (CAP-10): the server's matches for the words the page was asked with, at most twenty
  const cocok = kata ? pemegang.filter((p) => !selesai.has(p.person_id)) : [];
  const terjawab = kata !== "" && kataAman(cari).toLowerCase() === dicari.toLowerCase();

  async function ubah(p: PemegangKartu) {
    if (berjalan.current) return;
    berjalan.current = true;
    setSibuk(true);
    setHasil(null);
    let jawaban: JawabanKartuJadiEmail;
    try {
      const r = await fetch("/api/akun/kartu-ke-email", {
        method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ person_id: p.person_id, email, alasan }), cache: "no-store", credentials: "same-origin",
      });
      jawaban = bacaJawabanKartuJadiEmail(await r.json().catch(() => null));
    } catch {
      jawaban = { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
    } finally {
      berjalan.current = false;
      setSibuk(false);
    }
    setDikenal((x) => ({ ...x, [p.person_id]: p }));
    setHasil({ id: p.person_id, jawaban });
    if (jawaban.ok) {
      setSelesai((x) => new Set(x).add(p.person_id));
      setPilih(null);
      setEmail("");
      setAlasan("");
    }
  }

  const berhasil = hasil?.jawaban.ok ? { orang: dikenal[hasil.id], email: hasil.jawaban.email } : null;

  return (
    <section className="pin-sec" aria-labelledby="pin-akt-staf" id="jadi-staf">
      <h2 id="pin-akt-staf">{s("aktivasi.staf.judul")}</h2>
      <p className="pin-meta">{s("aktivasi.staf.arti")}</p>
      {berhasil ? (
        <BarisHasil nada="ok">
          {berhasil.orang?.display_name ?? ""} {s("aktivasi.staf.ok.1")} <span className="pin-num">{berhasil.email}</span>.{" "}
          {s("aktivasi.staf.ok.2")}
        </BarisHasil>
      ) : null}
      {!ada ? null : (
        <>
          <label className="pin-akt-isian">
            <span className="pin-meta">{s("aktivasi.ulang.cari")}</span>
            <input className="pin-input" type="search" value={cari} onChange={(e) => setCari(e.target.value)} autoComplete="off" spellCheck={false} />
          </label>
          {terjawab && cocok.length === 0 ? <p className="pin-meta">{s("aktivasi.ulang.tidak_ketemu")}</p> : null}
          <ul className="pin-lap-baris">
            {cocok.slice(0, 20).map((p) => {
              const dipilih = pilih === p.person_id;
              return (
                <li key={p.person_id} data-orang={p.person_id}>
                  <span>
                    <strong>{p.display_name}</strong> · <span className="pin-num">{p.institutional_id}</span>
                  </span>
                  {dipilih ? (
                    <form className="pin-akt-staf" onSubmit={(e) => { e.preventDefault(); void ubah(p); }}>
                      <BidangTeks id={`staf-email-${p.person_id}`} name="email" type="email" required autoComplete="off"
                        label={s("aktivasi.staf.email")} petunjuk={s("aktivasi.staf.email.arti")}
                        value={email} onChange={(e) => setEmail(e.target.value)} />
                      <BidangTeks id={`staf-alasan-${p.person_id}`} name="alasan" required minLength={10} maxLength={500}
                        label={s("aktivasi.staf.alasan")} petunjuk={s("aktivasi.staf.alasan.arti")}
                        value={alasan} onChange={(e) => setAlasan(e.target.value)} />
                      <p className="pin-meta">{s("aktivasi.staf.konfirmasi")}</p>
                      <span className="pin-actions">
                        <button type="submit" className="pin-btn pin-primary" disabled={sibuk} aria-busy={sibuk ? "true" : undefined}>
                          {sibuk ? s("aktivasi.staf.sibuk") : s("aktivasi.staf.ya")}
                        </button>
                        <button type="button" className="pin-btn" disabled={sibuk} onClick={() => setPilih(null)}>{s("aktivasi.ulang.batal")}</button>
                      </span>
                    </form>
                  ) : (
                    <button type="button" className="pin-btn" disabled={sibuk}
                      onClick={() => { setPilih(p.person_id); setHasil(null); setEmail(""); setAlasan(""); }}>
                      {s("aktivasi.staf.pilih")}
                    </button>
                  )}
                  {hasil && !hasil.jawaban.ok && hasil.id === p.person_id ? (
                    <BarisHasil nada="gagal">
                      {s(`aktivasi.staf.gagal.${hasil.jawaban.code}` as HleEvent)}
                      {hasil.jawaban.ref ? <> {s("aktivasi.ulang.rujukan")}: <span className="pin-num">{hasil.jawaban.ref}</span>.</> : null}
                    </BarisHasil>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
