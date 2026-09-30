"use client";

import { useEffect, useRef, useState } from "react";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { useSiap } from "@/components/masuk/siap";
import { bentukEmail, hanyaAngka, kalimat, kirim, menunggu, tujuanAman } from "./jawaban";
import type { Pesan } from "./Langkah";

/**
 * «AKTIFKAN AKUN PINTAR ANDA», SIGNED OUT (DAISY-20, BOB-26 §2.1–2.2, C1, C3).
 *
 * Email → code. A code goes only to an existing email account whose set-up is
 * unfinished; every other well-formed address gets exactly the same answer
 * and nothing is sent. So the screen after «Kirim kode» is the same for
 * everybody, and it says so conditionally (D2): «Jika alamat itu terdaftar…».
 *
 * THE COUNTDOWN IS THE SERVER'S, AND IT IS THE SAME FOR EVERY ADDRESS. The
 * route answers `kirimUlangDalam` (read from BOB-25's send limits, never typed
 * here) for a real address and an unknown one alike, so a held «Kirim kode
 * baru» separates nothing — which is what makes a countdown safe here when it
 * was not on the old magic-link screen (D2). How long the code lasts is the
 * route's `berlakuMenit`, read from the one canonical setting (D-079
 * addendum); the screen never types a number of minutes.
 *
 * THE CODE FIELD ACCEPTS WHAT PEOPLE TYPE AND PASTE: «482 913», «482913» and
 * «482-913» are the same code; the digits are what is sent.
 *
 * A MATCH SIGNS IN, and the page is loaded again whole, so the wizard reads the
 * new session (§2.2 `tujuan`).
 */
type Layar =
  | { k: "email"; pesan: Pesan; sibuk: boolean }
  | { k: "kode"; berlakuMenit: number; bolehUlangPada: number; pesan: Pesan; sibuk: boolean; ulang: "tidak" | "sibuk" | "ok" };

type Fokus = "judul" | "email" | "kode" | null;

export default function MintaKode({ locale }: { locale: Locale }) {
  const s = (k: HleEvent) => t(k, "public", { locale });
  const siap = useSiap();
  const [layar, setLayar] = useState<Layar>({ k: "email", pesan: null, sibuk: false });
  const [sekarang, setSekarang] = useState(0);
  const [fokus, setFokus] = useState<{ ke: Fokus; n: number }>({ ke: null, n: 0 });
  const alamat = useRef("");
  const judulRef = useRef<HTMLHeadingElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const kodeRef = useRef<HTMLInputElement>(null);

  const pindahFokus = (ke: Fokus) => setFokus((f) => ({ ke, n: f.n + 1 }));
  useEffect(() => {
    const el = fokus.ke === "judul" ? judulRef.current : fokus.ke === "email" ? emailRef.current : fokus.ke === "kode" ? kodeRef.current : null;
    el?.focus();
  }, [fokus]);

  // The countdown's clock: one tick a second while a new code is not yet allowed.
  const menungguUlang = layar.k === "kode" && layar.bolehUlangPada > sekarang;
  useEffect(() => {
    if (!menungguUlang) return;
    const id = setInterval(() => setSekarang(Date.now()), 1000);
    return () => clearInterval(id);
  }, [menungguUlang]);

  const sisa = layar.k === "kode" ? Math.max(0, Math.ceil((layar.bolehUlangPada - sekarang) / 1000)) : 0;

  async function mintaKode(ulang: boolean) {
    const fd = new FormData();
    fd.set("email", alamat.current);
    if (ulang) fd.set("ulang", "1");
    return kirim<"kode", { kirimUlangDalam: number; berlakuMenit: number }>("kode", fd);
  }

  async function kirimEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nilai = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!bentukEmail(nilai)) {
      setLayar({ k: "email", pesan: { teks: s("auth.err_email"), salah: true, tunggu: false }, sibuk: false });
      pindahFokus("email");
      return;
    }
    alamat.current = nilai;
    setLayar({ k: "email", pesan: null, sibuk: true });
    const r = await mintaKode(false);
    if (!r.ok) {
      setLayar({ k: "email", pesan: { teks: kalimat(r, s, locale), salah: r.kode === "EMAIL_TIDAK_SAH", tunggu: menunggu(r) }, sibuk: false });
      pindahFokus("email");
      return;
    }
    const kini = Date.now();
    setSekarang(kini);
    setLayar({ k: "kode", berlakuMenit: r.berlakuMenit, bolehUlangPada: kini + r.kirimUlangDalam * 1000, pesan: null, sibuk: false, ulang: "tidak" });
    pindahFokus("judul");
  }

  async function kirimUlang() {
    if (layar.k !== "kode" || sisa > 0) return;
    setLayar({ ...layar, ulang: "sibuk", pesan: null });
    const r = await mintaKode(true);
    if (!r.ok) {
      setLayar({ ...layar, ulang: "tidak", pesan: { teks: kalimat(r, s, locale), salah: false, tunggu: menunggu(r) } });
      return;
    }
    const kini = Date.now();
    setSekarang(kini);
    setLayar({ ...layar, berlakuMenit: r.berlakuMenit, bolehUlangPada: kini + r.kirimUlangDalam * 1000, ulang: "ok", pesan: null });
    pindahFokus("kode");
  }

  async function verifikasi(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (layar.k !== "kode") return;
    const kode = hanyaAngka(String(new FormData(e.currentTarget).get("kode") ?? ""));
    if (!kode) {
      setLayar({ ...layar, pesan: { teks: s("aktifkan.kode_kosong"), salah: true, tunggu: false } });
      pindahFokus("kode");
      return;
    }
    setLayar({ ...layar, sibuk: true, pesan: null });
    const fd = new FormData();
    fd.set("email", alamat.current);
    fd.set("kode", kode);
    const r = await kirim<"verifikasi", { tujuan: string }>("verifikasi", fd);
    if (r.ok) {
      // a whole-page load, so every part reads the new session; busy until it leaves
      window.location.assign(tujuanAman(r.tujuan));
      return;
    }
    setLayar({ ...layar, sibuk: false, pesan: { teks: kalimat(r, s, locale), salah: r.kode === "KODE_TIDAK_COCOK", tunggu: menunggu(r) } });
    pindahFokus("kode");
  }

  function emailLain() {
    setLayar({ k: "email", pesan: null, sibuk: false });
    pindahFokus("email");
  }

  const catatan = siap ? null : <p className="pin-msg pin-msg-note" role="status">{s("auth.belum_siap")}</p>;

  if (layar.k === "kode") {
    const salah = Boolean(layar.pesan?.salah);
    return (
      <form className="pin-form" onSubmit={verifikasi} noValidate>
        <span className="pin-disc pin-disc-primary" aria-hidden="true">✉</span>
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("aktifkan.kode_judul")}</h1>
        <p className="pin-lede-m">{s("aktifkan.kode_terkirim")}</p>
        <p className="pin-msg pin-msg-note">
          {s("aktifkan.berlaku")} {format.durasi(layar.berlakuMenit * 60, locale)}{s("aktifkan.berlaku_lalu")}
        </p>

        <label className="pin-lbl" htmlFor="kode">{s("aktifkan.kode_label")}</label>
        <span className={salah ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"}>
          <input
            id="kode" name="kode" ref={kodeRef} inputMode="numeric" autoComplete="one-time-code"
            readOnly={layar.sibuk} aria-invalid={salah ? "true" : undefined}
            aria-describedby={layar.pesan ? "kode-err" : undefined} required
          />
        </span>
        {layar.pesan ? (
          <p className={layar.pesan.tunggu ? "pin-msg pin-msg-note" : "pin-msg pin-msg-err"} role="alert" id="kode-err">{layar.pesan.teks}</p>
        ) : null}
        {layar.ulang === "ok" ? <p className="pin-msg pin-msg-note" role="status">{s("aktifkan.kode_ulang_ok")}</p> : null}

        {catatan}
        <button type="submit" className="pin-mbtn pin-mbtn-1 pin-mbtn-big" disabled={!siap || layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}>
          {layar.sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("aktifkan.memeriksa")}</> : s("aktifkan.lanjut")}
        </button>

        <p className="pin-msg pin-msg-note">{s("aktifkan.kode_bantu")}</p>
        <div className="pin-stack">
          <button
            type="button" className="pin-mbtn pin-mbtn-2" onClick={kirimUlang}
            disabled={!siap || sisa > 0 || layar.ulang === "sibuk"} aria-busy={layar.ulang === "sibuk" ? "true" : undefined}
          >
            {layar.ulang === "sibuk" ? s("aktifkan.mengirim") : s("aktifkan.kirim_ulang")}
          </button>
          {sisa > 0 ? <p className="pin-meta pin-akt-hitung">{s("aktifkan.kirim_ulang_dalam")} {format.durasi(sisa, locale)}.</p> : null}
          <button type="button" className="pin-mbtn pin-mbtn-2" onClick={emailLain} disabled={!siap}>{s("aktifkan.email_lain")}</button>
        </div>
      </form>
    );
  }

  const salah = Boolean(layar.pesan?.salah);
  return (
    <form className="pin-form" onSubmit={kirimEmail} noValidate>
      <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("aktifkan.judul")}</h1>
      <p className="pin-lede-m">{s("aktifkan.lede")}</p>

      <label className="pin-lbl" htmlFor="email">{s("auth.email_label")}</label>
      <span className={salah ? "pin-inp pin-inp-salah" : "pin-inp"}>
        <input
          id="email" name="email" ref={emailRef} type="email" inputMode="email" autoComplete="email"
          placeholder={s("auth.email_ph")} readOnly={layar.sibuk}
          aria-invalid={salah ? "true" : undefined} aria-describedby={layar.pesan ? "email-err" : undefined} required
        />
      </span>
      {layar.pesan ? (
        <p className={layar.pesan.tunggu ? "pin-msg pin-msg-note" : "pin-msg pin-msg-err"} role="alert" id="email-err">{layar.pesan.teks}</p>
      ) : null}

      {catatan}
      <button type="submit" className="pin-mbtn pin-mbtn-1" disabled={!siap || layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}>
        {layar.sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("aktifkan.mengirim")}</> : s("aktifkan.kirim")}
      </button>

      <p className="pin-rute">
        {s("aktifkan.sudah_aktif")}{" "}
        <a className="pin-tautan" href="/masuk">{s("aktifkan.ke_masuk")}</a>
      </p>
    </form>
  );
}
