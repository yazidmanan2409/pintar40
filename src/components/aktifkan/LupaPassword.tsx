"use client";

import { useEffect, useRef, useState } from "react";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { useSiap } from "@/components/masuk/siap";
import { hanyaAngka, kalimat, kirim, menunggu, tujuanAman } from "./jawaban";
import { LangkahPassword, type Pesan } from "./Langkah";
import type { AturanPassword } from "./kontrak";
import KolomRahasia from "@/components/KolomRahasia";

/**
 * «LUPA PASSWORD?» (BOB-27 with DAISY-21's place in the sign-in screen's grammar; Gate 4).
 *
 * Email or username → code → a new password → done. Signed out throughout:
 * the code proves the inbox and gives this browser a single-use grant (an
 * httpOnly cookie the screen never sees); only the new password signs in.
 *
 * THE SAME FOR EVERY NAME (C1, C3, D2): «Jika nama ini milik akun yang sudah
 * aktif…», one countdown from the route for everybody, and D-098(c)'s waits,
 * which say no code was sent. The code field takes «482 913» as typed or pasted.
 *
 * BOB-28 (Gate 5): THE OTHER WAY IN, a PINTAR ID and the personal PIN. The
 * same answers for every well-formed ID (the ladder is the typed ID's); a
 * lock or a suspension says so and points to email recovery, which always
 * works. A match gives the same grant, so the new-password step is the same.
 * Opened from a card's public page, the ID is already filled in (`idAwal`).
 */
type Layar =
  | { k: "nama"; pesan: Pesan; sibuk: boolean }
  | { k: "pin"; pesan: Pesan; sibuk: boolean; keEmail: boolean }
  | { k: "kode"; berlakuMenit: number; bolehUlangPada: number; pesan: Pesan; sibuk: boolean; ulang: "tidak" | "sibuk" | "ok" }
  | { k: "password"; pesan: Pesan; sibuk: boolean }
  | { k: "selesai"; tujuan: string };

type Fokus = "judul" | "nama" | "kode" | "id" | "pin" | null;

export default function LupaPassword({ locale, aturan, idAwal = null }: { locale: Locale; aturan: AturanPassword; idAwal?: string | null }) {
  const s = (k: HleEvent) => t(k, "public", { locale });
  const siap = useSiap();
  const [layar, setLayar] = useState<Layar>(idAwal ? { k: "pin", pesan: null, sibuk: false, keEmail: false } : { k: "nama", pesan: null, sibuk: false });
  const [sekarang, setSekarang] = useState(0);
  const [fokus, setFokus] = useState<{ ke: Fokus; n: number }>({ ke: null, n: 0 });
  const nama = useRef("");
  // which way in gave the grant: a grant that ran out goes back to that way
  const jalan = useRef<"email" | "pin">(idAwal ? "pin" : "email");
  const judulRef = useRef<HTMLHeadingElement>(null);
  const namaRef = useRef<HTMLInputElement>(null);
  const kodeRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  const pindahFokus = (ke: Fokus) => setFokus((f) => ({ ke, n: f.n + 1 }));
  useEffect(() => {
    if (!fokus.ke) return;
    ({ judul: judulRef, nama: namaRef, kode: kodeRef, id: idRef, pin: pinRef })[fokus.ke].current?.focus();
  }, [fokus]);

  const menungguUlang = layar.k === "kode" && layar.bolehUlangPada > sekarang;
  useEffect(() => {
    if (!menungguUlang) return;
    const id = setInterval(() => setSekarang(Date.now()), 1000);
    return () => clearInterval(id);
  }, [menungguUlang]);
  const sisa = layar.k === "kode" ? Math.max(0, Math.ceil((layar.bolehUlangPada - sekarang) / 1000)) : 0;

  async function mintaKode() {
    const fd = new FormData();
    fd.set("nama", nama.current);
    return kirim<"lupaKode", { kirimUlangDalam: number; berlakuMenit: number }>("lupaKode", fd);
  }

  async function kirimNama(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nilai = String(new FormData(e.currentTarget).get("nama") ?? "").trim();
    if (!nilai) {
      setLayar({ k: "nama", pesan: { teks: s("lupa.nama_kosong"), salah: true, tunggu: false }, sibuk: false });
      pindahFokus("nama");
      return;
    }
    nama.current = nilai;
    setLayar({ k: "nama", pesan: null, sibuk: true });
    const r = await mintaKode();
    if (!r.ok) {
      setLayar({ k: "nama", pesan: { teks: kalimat(r, s, locale), salah: r.kode === "IDENTITAS_KOSONG", tunggu: menunggu(r) }, sibuk: false });
      pindahFokus("nama");
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
    const r = await mintaKode();
    if (!r.ok) {
      setLayar({ ...layar, ulang: "tidak", pesan: { teks: kalimat(r, s, locale), salah: false, tunggu: menunggu(r) } });
      return;
    }
    const kini = Date.now();
    setSekarang(kini);
    setLayar({ ...layar, berlakuMenit: r.berlakuMenit, bolehUlangPada: kini + r.kirimUlangDalam * 1000, ulang: "ok", pesan: null });
    pindahFokus("kode");
  }

  async function periksaKode(e: React.FormEvent<HTMLFormElement>) {
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
    fd.set("nama", nama.current);
    fd.set("kode", kode);
    const r = await kirim<"lupaPeriksa", object>("lupaPeriksa", fd);
    if (r.ok) {
      setLayar({ k: "password", pesan: null, sibuk: false });
      pindahFokus("judul");
      return;
    }
    setLayar({ ...layar, sibuk: false, pesan: { teks: kalimat(r, s, locale), salah: r.kode === "KODE_TIDAK_COCOK", tunggu: menunggu(r) } });
    pindahFokus("kode");
  }

  async function simpanPassword(password: string, ulang: string) {
    if (layar.k !== "password") return;
    if (password !== ulang) {
      setLayar({ k: "password", sibuk: false, pesan: { teks: s("aktifkan.p_beda"), salah: true, tunggu: false } });
      return;
    }
    setLayar({ k: "password", sibuk: true, pesan: null });
    const fd = new FormData();
    fd.set("password", password);
    const r = await kirim<"lupaPassword", { tujuan: string }>("lupaPassword", fd);
    if (r.ok) {
      setLayar({ k: "selesai", tujuan: tujuanAman(r.tujuan) });
      pindahFokus("judul");
      return;
    }
    if (r.kode === "PEMULIHAN_BERAKHIR") {
      const pesan = { teks: kalimat(r, s, locale), salah: false, tunggu: false };
      setLayar(jalan.current === "pin" ? { k: "pin", sibuk: false, pesan, keEmail: false } : { k: "nama", sibuk: false, pesan });
      pindahFokus(jalan.current === "pin" ? "id" : "nama");
      return;
    }
    setLayar({ k: "password", sibuk: false, pesan: { teks: kalimat(r, s, locale), salah: r.kode === "PASSWORD_LEMAH" || r.kode === "PASSWORD_TERLALU_PANJANG", tunggu: false } });
  }

  function namaLain() {
    jalan.current = "email";
    setLayar({ k: "nama", pesan: null, sibuk: false });
    pindahFokus("nama");
  }

  function kePin() {
    jalan.current = "pin";
    setLayar({ k: "pin", pesan: null, sibuk: false, keEmail: false });
    pindahFokus("id");
  }

  async function periksaPin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (layar.k !== "pin") return;
    const isi = new FormData(e.currentTarget);
    const id = String(isi.get("id") ?? "").trim();
    const pin = hanyaAngka(String(isi.get("pin") ?? ""));
    setLayar({ ...layar, sibuk: true, pesan: null });
    const fd = new FormData();
    fd.set("id", id);
    fd.set("pin", pin);
    const r = await kirim<"lupaPin", object>("lupaPin", fd);
    if (r.ok) {
      setLayar({ k: "password", pesan: null, sibuk: false });
      pindahFokus("judul");
      return;
    }
    // a lock or a suspension points to email recovery, which always works (C5)
    const keEmail = r.kode === "PIN_TERKUNCI" || r.kode === "PIN_DITANGGUHKAN";
    setLayar({ k: "pin", sibuk: false, keEmail, pesan: { teks: kalimat(r, s, locale), salah: !menunggu(r) && r.kode !== "PIN_DITANGGUHKAN", tunggu: menunggu(r) } });
    pindahFokus(r.kode === "ID_TIDAK_SAH" ? "id" : "pin");
  }

  const catatan = siap ? null : <p className="pin-msg pin-msg-note" role="status">{s("auth.belum_siap")}</p>;

  if (layar.k === "selesai") {
    return (
      <div className="pin-form">
        <span className="pin-disc pin-disc-primary" aria-hidden="true">✓</span>
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("lupa.selesai_judul")}</h1>
        <p className="pin-lede-m">{s("lupa.selesai_isi")}</p>
        <a className="pin-mbtn pin-mbtn-1" href={layar.tujuan}>{s("lupa.lanjut")}</a>
      </div>
    );
  }

  if (layar.k === "password") {
    return (
      <LangkahPassword
        locale={locale} siap={siap} sibuk={layar.sibuk} pesan={layar.pesan} judulRef={judulRef} aturan={aturan}
        kepala={{ judul: "lupa.p_judul", lede: "lupa.p_lede" }} onKirim={(p, u) => void simpanPassword(p, u)}
      />
    );
  }

  if (layar.k === "kode") {
    const salah = Boolean(layar.pesan?.salah);
    return (
      <form className="pin-form" onSubmit={periksaKode} noValidate>
        <span className="pin-disc pin-disc-primary" aria-hidden="true">✉</span>
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("lupa.kode_judul")}</h1>
        <p className="pin-lede-m">{s("lupa.kode_terkirim")}</p>
        <p className="pin-msg pin-msg-note">
          {s("aktifkan.berlaku")} {format.durasi(layar.berlakuMenit * 60, locale)}{s("aktifkan.berlaku_lalu")}
        </p>

        <label className="pin-lbl" htmlFor="kode">{s("lupa.kode_label")}</label>
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
        {layar.ulang === "ok" ? <p className="pin-msg pin-msg-note" role="status">{s("lupa.kode_ulang_ok")}</p> : null}

        {catatan}
        <button type="submit" className="pin-mbtn pin-mbtn-1 pin-mbtn-big" disabled={!siap || layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}>
          {layar.sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("aktifkan.memeriksa")}</> : s("aktifkan.lanjut")}
        </button>

        <p className="pin-msg pin-msg-note">{s("lupa.kode_bantu")}</p>
        <div className="pin-stack">
          <button
            type="button" className="pin-mbtn pin-mbtn-2" onClick={kirimUlang}
            disabled={!siap || sisa > 0 || layar.ulang === "sibuk"} aria-busy={layar.ulang === "sibuk" ? "true" : undefined}
          >
            {layar.ulang === "sibuk" ? s("aktifkan.mengirim") : s("aktifkan.kirim_ulang")}
          </button>
          {sisa > 0 ? <p className="pin-meta pin-akt-hitung">{s("aktifkan.kirim_ulang_dalam")} {format.durasi(sisa, locale)}.</p> : null}
          <button type="button" className="pin-mbtn pin-mbtn-2" onClick={namaLain} disabled={!siap}>{s("lupa.nama_lain")}</button>
        </div>
      </form>
    );
  }

  if (layar.k === "pin") {
    const salah = Boolean(layar.pesan?.salah);
    return (
      <form className="pin-form" onSubmit={periksaPin} noValidate>
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("lupa.pin.judul")}</h1>
        <p className="pin-lede-m">{s("lupa.pin.lede")}</p>

        <label className="pin-lbl" htmlFor="id">{s("lupa.pin.id_label")}</label>
        <span className={salah ? "pin-inp pin-inp-salah" : "pin-inp"}>
          <input
            id="id" name="id" ref={idRef} type="text" autoComplete="off" autoCapitalize="characters" spellCheck={false}
            defaultValue={idAwal ? `${idAwal.slice(0, 4)} ${idAwal.slice(4)}` : undefined} maxLength={12}
            readOnly={layar.sibuk} aria-invalid={salah ? "true" : undefined} aria-describedby={layar.pesan ? "pin-err" : undefined} required
          />
        </span>
        <label className="pin-lbl" htmlFor="pin">{s("lupa.pin.pin_label")}</label>
        {/* CR-86 (D-127 Q6): the one secret field, with its own reveal */}
        <KolomRahasia
          bungkus={salah ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"} tampilkan={s("auth.card_show")} sembunyikan={s("auth.card_hide")}
          id="pin" name="pin" ref={pinRef} inputMode="numeric" autoComplete="off" maxLength={4}
          readOnly={layar.sibuk} aria-invalid={salah ? "true" : undefined} aria-describedby={layar.pesan ? "pin-err" : undefined} required
        />
        {layar.pesan ? (
          <p className={layar.pesan.tunggu ? "pin-msg pin-msg-note" : "pin-msg pin-msg-err"} role="alert" id="pin-err">{layar.pesan.teks}</p>
        ) : null}

        {catatan}
        <button type="submit" className="pin-mbtn pin-mbtn-1" disabled={!siap || layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}>
          {layar.sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("aktifkan.memeriksa")}</> : s("lupa.pin.periksa")}
        </button>
        <div className="pin-stack">
          <button type="button" className={layar.keEmail ? "pin-mbtn pin-mbtn-1" : "pin-mbtn pin-mbtn-2"} onClick={namaLain} disabled={!siap}>
            {s("lupa.pin.ke_email")}
          </button>
        </div>
        <p className="pin-rute">
          <a className="pin-tautan" href="/masuk">{s("lupa.ke_masuk")}</a>
        </p>
      </form>
    );
  }

  const salah = Boolean(layar.pesan?.salah);
  return (
    <form className="pin-form" onSubmit={kirimNama} noValidate>
      <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("lupa.judul")}</h1>
      <p className="pin-lede-m">{s("lupa.lede")}</p>

      <label className="pin-lbl" htmlFor="nama">{s("lupa.nama_label")}</label>
      <span className={salah ? "pin-inp pin-inp-salah" : "pin-inp"}>
        <input
          id="nama" name="nama" ref={namaRef} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
          readOnly={layar.sibuk} aria-invalid={salah ? "true" : undefined} aria-describedby={layar.pesan ? "nama-err" : undefined} required
        />
      </span>
      {layar.pesan ? (
        <p className={layar.pesan.tunggu ? "pin-msg pin-msg-note" : "pin-msg pin-msg-err"} role="alert" id="nama-err">{layar.pesan.teks}</p>
      ) : null}

      {catatan}
      <button type="submit" className="pin-mbtn pin-mbtn-1" disabled={!siap || layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}>
        {layar.sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("aktifkan.mengirim")}</> : s("aktifkan.kirim")}
      </button>

      <div className="pin-stack">
        <button type="button" className="pin-mbtn pin-mbtn-2" onClick={kePin} disabled={!siap}>{s("lupa.ke_pin")}</button>
      </div>
      <p className="pin-rute">
        {s("lupa.belum_aktif")}{" "}
        <a className="pin-tautan" href="/aktifkan">{s("lupa.ke_aktifkan")}</a>
      </p>
      <p className="pin-rute">
        <a className="pin-tautan" href="/masuk">{s("lupa.ke_masuk")}</a>
      </p>
    </form>
  );
}
