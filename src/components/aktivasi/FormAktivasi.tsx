"use client";

import { useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { isianKurang, kunciGagal, type JawabanAktivasi, type ModeAktivasi } from "./hasil";
import HasilAktivasi from "./HasilAktivasi";
import BarisHasil from "@/components/BarisHasil";
import LembarKartu, { type KartuCetak } from "./LembarKartu";
import { bolehKartu, type KelasKartu } from "./kelas";

type Orang = { person_id: string; display_name: string; institutional_id: string; institution_id: string; boleh_kartu: boolean };

/** One press and what came of it: the route's answer, or the check that stopped it being sent. */
type Hasil = { mode: ModeAktivasi; jawaban: JawabanAktivasi | null; surel?: string; nama?: string };

/**
 * The activation controls. Each press is one POST to /api/akun/aktivasi; the
 * database decides and the route creates the identity. A classroom card's
 * number and PIN come back ONCE and are shown here only — they are not stored
 * anywhere PINTAR can show them again, so the screen says to write them down.
 *
 * DAISY-09 (D-019). PINTAR SENDS NOTHING, and every outcome says so. The answer
 * stays where it was asked, in place of that person's controls, until the page
 * is next opened: an email activation used to refresh the list at once, which
 * took the person -- and the only word of success -- off the screen. A refused
 * or failed press is one plain sentence (HasilAktivasi), and a missing name or
 * an incomplete address is told before anything is sent.
 *
 * D-077(2): A NEW PERSON'S NAME IS CONFIRMED BEFORE THE PERSON IS CREATED.
 * «Buat dan aktifkan» sends nothing: it shows the name as it will be recorded,
 * large, with the address, and only «Sudah benar, buat dan aktifkan» sends.
 * «Ubah» goes back to the fields with what was typed. What is sent is exactly
 * what was shown.
 */
export default function FormAktivasi({ locale, orang, adminSistem, kelas = [] }: {
  locale: Locale; orang: Orang[]; adminSistem: boolean;
  /** M7: the classes with people awaiting an account, and who they are. */
  kelas?: KelasKartu[];
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [surel, setSurel] = useState<Record<string, string>>({});
  const [hasil, setHasil] = useState<Record<string, Hasil>>({});
  const [kurang, setKurang] = useState<Record<string, HleEvent>>({});
  // DAISY-17: which button is working ("<key>:<mode>"), so it can say so,
  // and a guard that holds a second press before the page has redrawn.
  const [sibuk, setSibuk] = useState<string | null>(null);
  const berjalan = useRef(false);
  const [baru, setBaru] = useState({ nama: "", surel: "" });
  const [periksa, setPeriksa] = useState<{ nama: string; surel: string } | null>(null);
  const [fokus, setFokus] = useState<"periksa" | "nama" | null>(null);
  const periksaRef = useRef<HTMLHeadingElement>(null);
  const namaBaruRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fokus === "periksa") periksaRef.current?.focus();
    else if (fokus === "nama") namaBaruRef.current?.focus();
  }, [fokus]);

  function tandai(key: string, cegah: HleEvent | null) {
    setKurang((x) => {
      const y = { ...x };
      if (cegah) y[key] = cegah;
      else delete y[key];
      return y;
    });
  }

  /** «Buat dan aktifkan» for a new person: the check, and nothing sent (D-077(2)). */
  function periksaBaru() {
    const cegah = isianKurang("NEW_PERSON", baru);
    tandai("baru", cegah);
    if (cegah) return;
    setHasil((h) => {
      const y = { ...h };
      delete y.baru;
      return y;
    });
    setPeriksa({ nama: baru.nama.trim(), surel: baru.surel.trim() });
    setFokus("periksa");
  }

  function ubahBaru() {
    setPeriksa(null);
    setFokus("nama");
  }

  async function kirim(key: string, mode: ModeAktivasi, body: Record<string, string>, isian: { nama?: string; surel?: string }) {
    const cegah = isianKurang(mode, isian);
    tandai(key, cegah);
    if (cegah || berjalan.current) return;
    berjalan.current = true;
    setSibuk(`${key}:${mode}`);
    let jawaban: JawabanAktivasi | null = null;
    try {
      jawaban = await minta(mode, body);
    } finally {
      berjalan.current = false;
      setSibuk(null);
    }
    setHasil((h) => ({ ...h, [key]: { mode, jawaban, surel: isian.surel?.trim(), nama: isian.nama?.trim() } }));
    if (key === "baru") {
      if (jawaban?.ok) setBaru({ nama: "", surel: "" });
      setPeriksa(null);
      setFokus("nama");
    }
  }

  // ─────────────────────────────── M7: a whole class's cards, one press
  const [pilihKelas, setPilihKelas] = useState(kelas[0]?.id ?? "");
  const [kemajuan, setKemajuan] = useState<{ selesai: number; total: number } | null>(null);
  const [lembar, setLembar] = useState<{ kelas: string; kartu: KartuCetak[]; gagal: Array<{ nama: string; kunci: HleEvent }> } | null>(null);
  const siapa = new Map(orang.map((o) => [o.person_id, o]));

  /**
   * Each learner of the class who has no account yet, one request each, in
   * turn: the database decides and audits every card on its own. A session
   * that has ended or a network that has gone stops the run; whoever was not
   * reached is named, and keeps their own row below.
   */
  async function kartuSatuKelas() {
    const k = kelas.find((x) => x.id === pilihKelas);
    if (!k || berjalan.current) return;
    berjalan.current = true;
    setSibuk(`kelas:${k.id}`);
    setLembar(null);
    const giliran = k.orang.filter((p) => !hasil[p]?.jawaban?.ok);
    const kartu: KartuCetak[] = [];
    const gagal: Array<{ nama: string; kunci: HleEvent }> = [];
    setKemajuan({ selesai: 0, total: giliran.length });
    try {
      for (let i = 0; i < giliran.length; i++) {
        const p = giliran[i];
        const o = siapa.get(p);
        const jawaban = await minta("CLASSROOM_CARD", { person_id: p });
        setHasil((h) => ({ ...h, [p]: { mode: "CLASSROOM_CARD", jawaban } }));
        if (jawaban?.ok && jawaban.card && jawaban.pin) {
          kartu.push({ nama: o?.display_name ?? "", nomorInduk: o?.institutional_id ?? "", card: jawaban.card, pin: jawaban.pin });
        } else {
          const kunci = kunciGagal("CLASSROOM_CARD", jawaban);
          gagal.push({ nama: o?.display_name ?? "", kunci });
          if (!jawaban || jawaban.error === "unauthenticated") {
            for (const q of giliran.slice(i + 1)) gagal.push({ nama: siapa.get(q)?.display_name ?? "", kunci });
            break;
          }
        }
        setKemajuan({ selesai: i + 1, total: giliran.length });
      }
    } finally {
      berjalan.current = false;
      setSibuk(null);
      setKemajuan(null);
      setLembar({ kelas: k.label, kartu, gagal });
    }
  }

  const kelasDipilih = kelas.find((x) => x.id === pilihKelas);
  return (
    <>
      {kelas.length > 0 ? (
        <section className="pin-akt-orang pin-akt-kelas pin-noprint">
          <h2>{s("aktivasi.kelas.judul")}</h2>
          <p className="pin-meta">{s("aktivasi.kelas.arti")}</p>
          <div className="pin-actions">
            <label className="pin-akt-isian">
              <span className="pin-meta">{s("aktivasi.kelas.pilih")}</span>
              <select className="pin-input" value={pilihKelas} disabled={sibuk !== null}
                onChange={(e) => { setPilihKelas(e.target.value); setLembar(null); }}>
                {kelas.map((k) => (
                  <option key={k.id} value={k.id}>{k.label} ({k.orang.length} {s("aktivasi.kelas.murid")})</option>
                ))}
              </select>
            </label>
            <button type="button" className="pin-btn pin-primary" disabled={sibuk !== null || !kelasDipilih}
              aria-busy={sibuk?.startsWith("kelas:") ? "true" : undefined}
              onClick={() => void kartuSatuKelas()}>
              {kemajuan ? `${s("aktivasi.kelas.membuat")} ${kemajuan.selesai}/${kemajuan.total}` : s("aktivasi.kelas.tombol")}
            </button>
          </div>
        </section>
      ) : null}
      {lembar ? <LembarKartu locale={locale} kelas={lembar.kelas} kartu={lembar.kartu} gagal={lembar.gagal} /> : null}

      {orang.length === 0 ? (
        <p className="pin-meta">{s("aktivasi.kosong")}</p>
      ) : (
        <ul className="pin-akt-daftar pin-noprint">
          {orang.map((o) => {
            const h = hasil[o.person_id];
            const alamat = surel[o.person_id] ?? "";
            return (
              <li key={o.person_id} className="pin-akt-orang">
                <p><strong>{o.display_name}</strong> · <span className="pin-num">{o.institutional_id}</span></p>
                {h?.jawaban?.ok ? (
                  <HasilAktivasi locale={locale} mode={h.mode} jawaban={h.jawaban} surel={h.surel} />
                ) : (
                  <>
                    <div className="pin-actions">
                      <label className="pin-akt-isian">
                        <span className="pin-meta">{s("aktivasi.surel")}</span>
                        <input className="pin-input" type="email" value={alamat}
                          onChange={(e) => setSurel((x) => ({ ...x, [o.person_id]: e.target.value }))} />
                      </label>
                      <button type="button" className="pin-btn pin-primary" disabled={sibuk !== null}
                        aria-busy={sibuk === `${o.person_id}:EMAIL` ? "true" : undefined}
                        onClick={() => void kirim(o.person_id, "EMAIL", { person_id: o.person_id, email: alamat.trim() }, { surel: alamat })}>
                        {sibuk === `${o.person_id}:EMAIL` ? s("tombol.mengaktifkan") : s("aktivasi.dengan_surel")}
                      </button>
                      {/* CR-91 (D-145(a)): a class card only for a learner; staff activate with email */}
                      {bolehKartu(o) ? (
                        <button type="button" className="pin-btn" disabled={sibuk !== null}
                          aria-busy={sibuk === `${o.person_id}:CLASSROOM_CARD` ? "true" : undefined}
                          onClick={() => void kirim(o.person_id, "CLASSROOM_CARD", { person_id: o.person_id }, {})}>
                          {sibuk === `${o.person_id}:CLASSROOM_CARD` ? s("tombol.mengaktifkan") : s("aktivasi.dengan_kartu")}
                        </button>
                      ) : null}
                    </div>
                    {kurang[o.person_id] ? (
                      <BarisHasil nada="gagal">{s(kurang[o.person_id])}</BarisHasil>
                    ) : h ? (
                      <HasilAktivasi locale={locale} mode={h.mode} jawaban={h.jawaban} surel={h.surel} />
                    ) : null}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {adminSistem && (
        <section className="pin-akt-orang pin-akt-baru pin-noprint">
          <h2>{s("aktivasi.baru.judul")}</h2>
          <p className="pin-meta">{s("aktivasi.baru.arti")}</p>
          {periksa ? (
            <div className="pin-akt-periksa" role="group" aria-labelledby="pin-akt-periksa">
              <h3 id="pin-akt-periksa" ref={periksaRef} tabIndex={-1}>{s("aktivasi.baru.periksa_judul")}</h3>
              <p className="pin-akt-nama">{periksa.nama}</p>
              <p className="pin-meta">{s("aktivasi.surel")}: <strong>{periksa.surel}</strong></p>
              <p className="pin-meta">{s("aktivasi.baru.periksa_arti")}</p>
              <div className="pin-actions">
                <button type="button" className="pin-btn pin-primary" disabled={sibuk !== null}
                  aria-busy={sibuk === "baru:NEW_PERSON" ? "true" : undefined}
                  onClick={() => void kirim("baru", "NEW_PERSON", { display_name: periksa.nama, email: periksa.surel }, periksa)}>
                  {sibuk === "baru:NEW_PERSON" ? s("tombol.mengaktifkan") : s("aktivasi.baru.benar")}
                </button>
                <button type="button" className="pin-btn" disabled={sibuk !== null} onClick={ubahBaru}>
                  {s("aktivasi.baru.ubah")}
                </button>
              </div>
            </div>
          ) : (
            <div className="pin-actions">
              <label className="pin-akt-isian">
                <span className="pin-meta">{s("aktivasi.baru.nama")}</span>
                <input ref={namaBaruRef} className="pin-input" value={baru.nama} autoComplete="off"
                  onChange={(e) => setBaru((b) => ({ ...b, nama: e.target.value }))} />
              </label>
              <label className="pin-akt-isian">
                <span className="pin-meta">{s("aktivasi.surel")}</span>
                <input className="pin-input" type="email" value={baru.surel} autoComplete="off"
                  onChange={(e) => setBaru((b) => ({ ...b, surel: e.target.value }))} />
              </label>
              <button type="button" className="pin-btn pin-primary" disabled={sibuk !== null} onClick={periksaBaru}>
                {s("aktivasi.baru.tombol")}
              </button>
            </div>
          )}
          {kurang.baru ? (
            <BarisHasil nada="gagal">{s(kurang.baru)}</BarisHasil>
          ) : hasil.baru ? (
            <HasilAktivasi locale={locale} mode="NEW_PERSON" jawaban={hasil.baru.jawaban}
              surel={hasil.baru.surel} nama={hasil.baru.nama} />
          ) : null}
        </section>
      )}
    </>
  );
}

/**
 * One request to the activation route, and its answer (null: no answer came back).
 * M7: the single presses and the whole-class issue send exactly the same request.
 */
async function minta(mode: ModeAktivasi, body: Record<string, string>): Promise<JawabanAktivasi | null> {
  try {
    const res = await fetch("/api/akun/aktivasi", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, ...body }),
    });
    const r = (await res.json().catch(() => null)) as JawabanAktivasi | null;
    return r && typeof r.ok === "boolean" ? r : null;
  } catch {
    return null;
  }
}
