"use client";

import { useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { isianKurang, type JawabanAktivasi, type ModeAktivasi } from "./hasil";
import HasilAktivasi from "./HasilAktivasi";
import BarisHasil from "@/components/BarisHasil";

type Orang = { person_id: string; display_name: string; institutional_id: string; institution_id: string };

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
export default function FormAktivasi({ locale, orang, adminSistem }: {
  locale: Locale; orang: Orang[]; adminSistem: boolean;
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
      const res = await fetch("/api/akun/aktivasi", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, ...body }),
      });
      const r = (await res.json().catch(() => null)) as JawabanAktivasi | null;
      jawaban = r && typeof r.ok === "boolean" ? r : null;
    } catch {
      jawaban = null;
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

  return (
    <>
      {orang.length === 0 ? (
        <p className="pin-meta">{s("aktivasi.kosong")}</p>
      ) : (
        <ul className="pin-akt-daftar">
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
                      <button type="button" className="pin-btn" disabled={sibuk !== null}
                        aria-busy={sibuk === `${o.person_id}:CLASSROOM_CARD` ? "true" : undefined}
                        onClick={() => void kirim(o.person_id, "CLASSROOM_CARD", { person_id: o.person_id }, {})}>
                        {sibuk === `${o.person_id}:CLASSROOM_CARD` ? s("tombol.mengaktifkan") : s("aktivasi.dengan_kartu")}
                      </button>
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
        <section className="pin-akt-orang pin-akt-baru">
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
