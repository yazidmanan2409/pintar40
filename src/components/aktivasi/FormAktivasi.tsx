"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { isianKurang, kunciGagal, type JawabanAktivasi, type ModeAktivasi } from "./hasil";
import HasilAktivasi from "./HasilAktivasi";
import BarisHasil from "@/components/BarisHasil";
import LembarKartu, { type KartuCetak } from "./LembarKartu";
import { bolehKartu, jumlahDikecualikan, type KelasKartu } from "./kelas";
import { daftarKata } from "@/components/laporan/tata";
import { anggotaKelasMenungguAksi } from "@/app/aktivasi/actions";

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
export default function FormAktivasi({ locale, orang, adminSistem, kelas = [], pencarian = null, penomoran = null, dicari = "" }: {
  locale: Locale; orang: Orang[]; adminSistem: boolean;
  /** M7: the classes with people awaiting an account, and how many in each (W2.10: their learners are read at the run). */
  kelas?: KelasKartu[];
  /** W2.10 (D-153): the search (CariTunggu, with the count), the pager, and the words the page was asked with. */
  pencarian?: ReactNode;
  penomoran?: ReactNode;
  dicari?: string;
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
  // H30 (Daisy, owner's report review R7-02): several classes in one run, the same run as one class, class after class
  const [banyak, setBanyak] = useState<Set<string>>(() => new Set());

  /**
   * Each learner of each chosen class who has no account yet, one request each,
   * in turn: the database decides and audits every card on its own (H30 adds
   * nothing to that: the classes are only taken one after another). A session
   * that has ended or a network that has gone stops the run; whoever was not
   * reached is named, and keeps their own row below.
   */
  async function kartuKelas(daftar: KelasKartu[], kunciSibuk: string) {
    if (daftar.length === 0 || berjalan.current) return;
    berjalan.current = true;
    setSibuk(kunciSibuk);
    setLembar(null);
    const kartu: KartuCetak[] = [];
    const gagal: Array<{ nama: string; kunci: HleEvent }> = [];
    const total = daftar.reduce((n, k) => n + k.jumlah, 0);
    let selesai = 0;
    try {
      setKemajuan({ selesai: 0, total });
      for (const k of daftar) {
        // W2.10 (D-153): the class's own learners, read now, for this class alone (never every waiting person)
        const anggota = await anggotaKelasMenungguAksi(k.id);
        if (!anggota) {
          gagal.push({ nama: k.label, kunci: kunciGagal("CLASSROOM_CARD", null) });
          continue;
        }
        const siapa = new Map(anggota.map((o) => [o.person_id, o]));
        const giliran = anggota.map((o) => o.person_id).filter((p) => !hasil[p]?.jawaban?.ok);
        let berhenti = false;
        for (let i = 0; i < giliran.length; i++) {
          const p = giliran[i];
          const o = siapa.get(p);
          const jawaban = await minta("CLASSROOM_CARD", { person_id: p });
          setHasil((h) => ({ ...h, [p]: { mode: "CLASSROOM_CARD", jawaban } }));
          if (jawaban?.ok && jawaban.card && jawaban.pin) {
            kartu.push({ nama: o?.display_name ?? "", nomorInduk: o?.institutional_id ?? "", card: jawaban.card, pin: jawaban.pin,
              kelas: daftar.length > 1 ? k.label : undefined });
          } else {
            const kunci = kunciGagal("CLASSROOM_CARD", jawaban);
            gagal.push({ nama: o?.display_name ?? "", kunci });
            if (!jawaban || jawaban.error === "unauthenticated") {
              for (const q of giliran.slice(i + 1)) gagal.push({ nama: siapa.get(q)?.display_name ?? "", kunci });
              berhenti = true;
              break;
            }
          }
          selesai++;
          setKemajuan({ selesai, total });
        }
        if (berhenti) break;
      }
    } finally {
      berjalan.current = false;
      setSibuk(null);
      setKemajuan(null);
      setLembar({ kelas: daftar.map((k) => k.label).join(", "), kartu, gagal });
    }
  }
  const kartuSatuKelas = () => {
    const k = kelas.find((x) => x.id === pilihKelas);
    return kartuKelas(k ? [k] : [], `kelas:${k?.id}`);
  };
  const kelasBanyak = kelas.filter((k) => banyak.has(k.id));
  const muridBanyak = kelasBanyak.reduce((n, k) => n + k.jumlah, 0);
  // KESETIAAN #21 (H30): how many of the chosen classes are not included, and why; no count when the database did not answer
  const terbaca = kelasBanyak.length > 0 && kelasBanyak.every((k) => k.dikecualikan !== undefined);
  const kecuali = jumlahDikecualikan(kelasBanyak);
  const bagianKecuali = ([["AKUN", "aktivasi.kelas.banyak.akun"], ["STAF", "aktivasi.kelas.banyak.staf"], ["PENDATAAN", "aktivasi.kelas.banyak.pendataan"]] as const)
    .filter(([a]) => kecuali[a] > 0).map(([a, k]) => s(k).replace("{n}", String(kecuali[a])));
  const isi = (k: HleEvent, n: Record<string, number>) =>
    Object.entries(n).reduce((t0, [a, v]) => t0.replaceAll(`{${a}}`, String(v)), s(k));

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
                  <option key={k.id} value={k.id}>{k.label} ({k.jumlah} {s("aktivasi.kelas.murid")})</option>
                ))}
              </select>
            </label>
            <button type="button" className="pin-btn pin-primary" disabled={sibuk !== null || !kelasDipilih}
              aria-busy={sibuk?.startsWith("kelas:") ? "true" : undefined}
              onClick={() => void kartuSatuKelas()}>
              {kemajuan && sibuk?.startsWith("kelas:") ? `${s("aktivasi.kelas.membuat")} ${kemajuan.selesai}/${kemajuan.total}` : s("aktivasi.kelas.tombol")}
            </button>
          </div>
          {kelas.length > 1 ? (
            /* H30: several classes at once. Only what the database counted is offered: learners of these classes who wait
               for an account and may hold a card; the run below is the same per-learner run as one class's */
            <fieldset className="pin-akt-banyak" disabled={sibuk !== null}>
              <legend>{s("aktivasi.kelas.banyak.judul")}</legend>
              <label className="pin-akt-pilih-semua">
                <input type="checkbox" checked={banyak.size === kelas.length}
                  onChange={(e) => { setBanyak(e.target.checked ? new Set(kelas.map((k) => k.id)) : new Set()); setLembar(null); }} />
                {s("aktivasi.kelas.banyak.semua")}
              </label>
              <ul className="pin-akt-banyak-daftar">
                {kelas.map((k) => (
                  <li key={k.id}>
                    <label>
                      <input type="checkbox" name="kelas_banyak" value={k.id} checked={banyak.has(k.id)}
                        onChange={(e) => {
                          const n = new Set(banyak);
                          if (e.target.checked) n.add(k.id); else n.delete(k.id);
                          setBanyak(n); setLembar(null);
                        }} />
                      {k.label} <span className="pin-meta">({k.jumlah} {s("aktivasi.kelas.murid")})</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="pin-meta" aria-live="polite" data-akt-banyak-jumlah="">
                {isi("aktivasi.kelas.banyak.terpilih", { murid: muridBanyak, kelas: kelasBanyak.length })}
              </p>
              {terbaca && bagianKecuali.length > 0 ? (
                <p className="pin-meta" aria-live="polite" data-akt-banyak-kecuali="">
                  {s("aktivasi.kelas.banyak.tidak_termasuk").replace("{daftar}", daftarKata(bagianKecuali, locale))}
                </p>
              ) : null}
              <p className="pin-meta">{s("aktivasi.kelas.banyak.dikecualikan")}</p>
              <div className="pin-actions">
                <button type="button" className="pin-btn pin-primary" disabled={sibuk !== null || muridBanyak === 0}
                  aria-busy={sibuk?.startsWith("banyak") ? "true" : undefined}
                  onClick={() => void kartuKelas(kelasBanyak, "banyak")}>
                  {kemajuan && sibuk === "banyak"
                    ? `${s("aktivasi.kelas.membuat")} ${kemajuan.selesai}/${kemajuan.total}`
                    : isi("aktivasi.kelas.banyak.tombol", { murid: muridBanyak })}
                </button>
              </div>
            </fieldset>
          ) : null}
        </section>
      ) : null}
      {lembar ? <LembarKartu locale={locale} kelas={lembar.kelas} kartu={lembar.kartu} gagal={lembar.gagal} /> : null}

      {/* W2.10 (D-153): the people waiting for an account, searched and paged by the database (20 a page) */}
      {pencarian}
      {orang.length === 0 ? (
        <p className="pin-meta">{s(dicari ? "aktivasi.tunggu.tidak_cocok" : "aktivasi.kosong")}</p>
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
      {penomoran}

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
