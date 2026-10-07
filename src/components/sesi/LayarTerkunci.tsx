"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { bacaJawabanBuka, pinSahUntuk } from "@/lib/penjaga-sesi-kontrak";
import KolomRahasia from "@/components/KolomRahasia";

/**
 * THE PIN ON «PINTAR TERKUNCI» (BOB-29; IDENTITY-4.0 §3, C4; T1). The same person's PIN opens this computer's
 * locked session and returns to the page; the server counts the tries (sesi_buka) and the third wrong PIN ends the
 * session, so this screen only says what it was told. «Bukan akun Anda?» is a real form to /keluar: it works before
 * JavaScript, and it hands the computer over.
 */
type Pesan = { teks: string; salah: boolean };

export default function LayarTerkunci(p: {
  locale: Locale;
  persona: "learner" | "staff";
  kartu: boolean;
  nama: string | null;
  berakhir: boolean;
  bisaPin: boolean;
  percobaanSisa: number | null;
  tujuan: string;
}) {
  const s = useCallback((k: HleEvent) => t(k, p.persona, { locale: p.locale }), [p.persona, p.locale]);
  // a class card's own words: its PIN, and help from the teacher rather than a password
  const k = (x: "kunci.lede" | "kunci.pin_label" | "kunci.kosong" | "kunci.lupa"): HleEvent => (p.kartu ? `${x}.kartu` : x);
  const [berakhir, setBerakhir] = useState(p.berakhir);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState<Pesan | null>(
    p.percobaanSisa === 1 || p.percobaanSisa === 2 ? { teks: s(`kunci.tidak_cocok.${p.percobaanSisa}` as HleEvent), salah: true } : null);
  const pinRef = useRef<HTMLInputElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { (p.bisaPin && !berakhir ? pinRef.current : judulRef.current)?.focus(); }, [p.bisaPin, berakhir]);

  async function buka(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sibuk) return;
    const pin = String(new FormData(e.currentTarget).get("pin") ?? "").replace(/\D/g, "");
    if (!pinSahUntuk(p.kartu ? "CARD" : "SHARED", pin)) {
      setPesan({ teks: s(k("kunci.kosong")), salah: true });
      pinRef.current?.focus();
      return;
    }
    setSibuk(true);
    setPesan(null);
    const fd = new FormData();
    fd.set("pin", pin);
    let isi: unknown = null;
    try {
      const r = await fetch("/api/sesi/buka", { method: "POST", body: fd, cache: "no-store" });
      isi = await r.json().catch(() => null);
    } catch {
      isi = null;
    }
    const j = bacaJawabanBuka(isi);
    if (j.ok) {
      // a full load, so every page and tab shows the person's information again from the server
      window.location.replace(p.tujuan);
      return;
    }
    setSibuk(false);
    if (pinRef.current) pinRef.current.value = "";
    if (j.code === "BERAKHIR") { setBerakhir(true); return; }
    if (j.code === "PIN_SALAH") setPesan({ teks: s(`kunci.tidak_cocok.${j.percobaanSisa}` as HleEvent), salah: true });
    else if (j.code === "PIN_TIDAK_SAH") setPesan({ teks: s(k("kunci.kosong")), salah: true });
    else if (j.code === "TANPA_PIN") setPesan({ teks: s("kunci.tanpa_pin"), salah: false });
    else setPesan({ teks: s("kunci.gagal"), salah: false });
    pinRef.current?.focus();
  }

  if (berakhir) {
    return (
      <div className="pin-form">
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("kunci.judul")}</h1>
        <p className="pin-lede-m" role="status">{s("kunci.berakhir")}</p>
        <a className="pin-mbtn pin-mbtn-1" href="/masuk">{s("kunci.masuk")}</a>
      </div>
    );
  }

  const keluar = (
    <form action="/keluar" method="post" className="pin-stack">
      <p className="pin-msg pin-msg-note" id="kunci-bukan">
        <strong>{t("sesi.bukan_anda", p.persona, { locale: p.locale })}</strong> {s("kunci.bukan_anda.arti")}
      </p>
      <button type="submit" className="pin-mbtn pin-mbtn-2" aria-describedby="kunci-bukan">{t("sesi.keluar", p.persona, { locale: p.locale })}</button>
    </form>
  );

  if (!p.bisaPin) {
    return (
      <div className="pin-form">
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("kunci.judul")}</h1>
        <p className="pin-lede-m">{s("kunci.tanpa_pin")}</p>
        {keluar}
      </div>
    );
  }

  const salah = Boolean(pesan?.salah);
  return (
    <div className="pin-form">
      <form onSubmit={buka} noValidate>
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("kunci.judul")}</h1>
        {p.nama ? <p className="pin-meta">{s("kunci.untuk")} <strong>{p.nama}</strong></p> : null}
        <p className="pin-lede-m">{s(k("kunci.lede"))}</p>
        <label className="pin-lbl" htmlFor="pin">{s(k("kunci.pin_label"))}</label>
        {/* CR-86 (D-127 Q6): the one secret field, with its own reveal */}
        <KolomRahasia
          bungkus={salah ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"} tampilkan={s("auth.card_show")} sembunyikan={s("auth.card_hide")}
          id="pin" name="pin" ref={pinRef} inputMode="numeric" autoComplete="off" maxLength={p.kartu ? 32 : 4}
          readOnly={sibuk} aria-invalid={salah ? "true" : undefined} aria-describedby={pesan ? "kunci-err" : undefined} required
        />
        {pesan ? <p className={salah ? "pin-msg pin-msg-err" : "pin-msg pin-msg-note"} role="alert" id="kunci-err">{pesan.teks}</p> : null}
        <button type="submit" className="pin-mbtn pin-mbtn-1" disabled={sibuk} aria-busy={sibuk ? "true" : undefined}>
          {sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("kunci.memeriksa")}</> : s("kunci.lanjut")}
        </button>
        <p className="pin-msg pin-msg-note">{s(k("kunci.lupa"))}</p>
      </form>
      {keluar}
    </div>
  );
}
