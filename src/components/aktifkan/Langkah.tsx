"use client";

import type { FormEvent, ReactNode, RefObject } from "react";
import { useState } from "react";
import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import { LANGKAH, type AturanPassword, type DataKartu, type Langkah, type StatusKartu } from "./kontrak";
import IdentitasSaya from "./IdentitasSaya";

/**
 * THE ACTIVATION WIZARD'S STEPS, AS THEY ARE DRAWN (DAISY-20, D-054(b), D-077).
 *
 * Presentational only: each step takes what it shows and the one thing it
 * does when submitted, so the guard can render every state in both languages
 * and the wizard (./WizardAktivasi.tsx) can keep the order and the requests.
 * The order is the journey's: username → password → PIN → name → the PINTAR
 * ID and card. The server says which step is next; nothing here decides it.
 *
 * ONE MESSAGE PER STEP. A refusal is one sentence from the route's code
 * (./jawaban.ts). It marks the fields invalid only when it judged what was
 * typed: a wait or an outage judged nothing.
 *
 * NOTHING VALIDATES WHILE A PERSON IS TYPING, as on the sign-in screen. The
 * rules are shown before, and checked on submit.
 */

/** The step's one message: its sentence, whether it judged the fields, and whether it is a wait. */
export type Pesan = { teks: string; salah: boolean; tunggu: boolean } | null;

type Umum = {
  locale: Locale;
  /** False until the client has started (masuk/siap.ts): a form that cannot submit says so. */
  siap: boolean;
  sibuk: boolean;
  pesan: Pesan;
  judulRef?: RefObject<HTMLHeadingElement | null>;
};

const kata = (locale: Locale) => (k: HleEvent) => t(k, "public", { locale });

function KepalaLangkah({ locale, langkah, judul, lede, judulRef }: {
  locale: Locale; langkah: Langkah; judul: HleEvent; lede: HleEvent; judulRef?: RefObject<HTMLHeadingElement | null>;
}) {
  const s = kata(locale);
  return (
    <>
      <p className="pin-akt-langkah">
        {s("aktifkan.langkah")} {format.number(LANGKAH.indexOf(langkah) + 1, locale)} {s("aktifkan.dari")}{" "}
        {format.number(LANGKAH.length, locale)}
      </p>
      <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s(judul)}</h1>
      <p className="pin-lede-m">{s(lede)}</p>
    </>
  );
}

function PesanLangkah({ pesan, id }: { pesan: Pesan; id: string }) {
  if (!pesan) return null;
  return <p className={pesan.tunggu ? "pin-msg pin-msg-note" : "pin-msg pin-msg-err"} role="alert" id={id}>{pesan.teks}</p>;
}

function Kirim({ locale, siap, sibuk, label }: { locale: Locale; siap: boolean; sibuk: boolean; label: HleEvent }) {
  const s = kata(locale);
  return (
    <>
      {siap ? null : <p className="pin-msg pin-msg-note" role="status">{s("auth.belum_siap")}</p>}
      <button type="submit" className="pin-mbtn pin-mbtn-1" disabled={!siap || sibuk} aria-busy={sibuk ? "true" : undefined}>
        {sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("aktifkan.menyimpan")}</> : s(label)}
      </button>
    </>
  );
}

const ambil = (e: FormEvent<HTMLFormElement>, nama: string) => String(new FormData(e.currentTarget).get(nama) ?? "");

// ───────────────────────────────────────────────────────────── 1 · username
export function LangkahUsername({ locale, siap, sibuk, pesan, judulRef, onKirim }: Umum & { onKirim: (username: string) => void }) {
  const s = kata(locale);
  const salah = Boolean(pesan?.salah);
  return (
    <form className="pin-form" noValidate onSubmit={(e) => { e.preventDefault(); onKirim(ambil(e, "username")); }}>
      <KepalaLangkah locale={locale} langkah="USERNAME" judul="aktifkan.u_judul" lede="aktifkan.u_lede" judulRef={judulRef} />
      <label className="pin-lbl" htmlFor="username">{s("aktifkan.u_label")}</label>
      <span className={salah ? "pin-inp pin-inp-salah" : "pin-inp"}>
        <input
          id="username" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          readOnly={sibuk} aria-invalid={salah ? "true" : undefined}
          aria-describedby={pesan ? "username-aturan username-err" : "username-aturan"} required
        />
      </span>
      <p className="pin-msg pin-msg-note" id="username-aturan">{s("aktifkan.u_aturan")}</p>
      <PesanLangkah pesan={pesan} id="username-err" />
      <Kirim locale={locale} siap={siap} sibuk={sibuk} label="aktifkan.u_simpan" />
    </form>
  );
}

// ───────────────────────────────────────────────────────────── 2 · password
/** The rules, from the one canonical setting (BOB-26 §5): never a number typed here. */
export function aturanPassword(aturan: AturanPassword, s: (k: HleEvent) => string, locale: Locale): string[] {
  const baris = [`${s("aktifkan.p_min")} ${format.number(aturan.panjangMin, locale)} ${s("aktifkan.p_min_lalu")}`];
  if (aturan.karakterWajib.length) {
    baris.push(`${s("aktifkan.p_wajib")} ${aturan.karakterWajib.map((k) => s(`aktifkan.p_k.${k}` as HleEvent)).join(", ")}.`);
  }
  if (aturan.cekBocor) baris.push(s("aktifkan.p_bocor"));
  return baris;
}

export function LangkahPassword({ locale, siap, sibuk, pesan, judulRef, aturan, onKirim, kepala }: Umum & {
  aturan: AturanPassword;
  /** BOB-27: the recovery's own heading, outside the wizard's numbered steps */
  kepala?: { judul: HleEvent; lede: HleEvent };
  /** Both fields as typed; the wizard compares them before anything is sent. */
  onKirim: (password: string, ulang: string) => void;
}) {
  const s = kata(locale);
  const [tampil, setTampil] = useState(false);
  const salah = Boolean(pesan?.salah);
  return (
    <form className="pin-form" noValidate onSubmit={(e) => { e.preventDefault(); onKirim(ambil(e, "password"), ambil(e, "ulang")); }}>
      {kepala ? (
        <>
          <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s(kepala.judul)}</h1>
          <p className="pin-lede-m">{s(kepala.lede)}</p>
        </>
      ) : (
        <KepalaLangkah locale={locale} langkah="PASSWORD" judul="aktifkan.p_judul" lede="aktifkan.p_lede" judulRef={judulRef} />
      )}
      <ul className="pin-akt-aturan" id="password-aturan">
        {aturanPassword(aturan, s, locale).map((b) => <li key={b}>{b}</li>)}
      </ul>
      <label className="pin-lbl" htmlFor="password">{s("aktifkan.p_label")}</label>
      <span className={salah ? "pin-inp pin-inp-salah" : "pin-inp"}>
        <input
          id="password" name="password" type={tampil ? "text" : "password"} autoComplete="new-password"
          readOnly={sibuk} aria-invalid={salah ? "true" : undefined}
          aria-describedby={pesan ? "password-aturan password-err" : "password-aturan"} required
        />
        {/* One control for both fields, in the person's hands only: nothing re-masks it. */}
        <button type="button" className="pin-lihat" aria-pressed={tampil}
          aria-label={s(tampil ? "auth.pw_hide" : "auth.pw_show")} onClick={() => setTampil((v) => !v)}>
          <span aria-hidden="true">{tampil ? "🚫" : "👁"}</span>
        </button>
      </span>
      <label className="pin-lbl" htmlFor="ulang">{s("aktifkan.p_ulang")}</label>
      <span className={salah ? "pin-inp pin-inp-salah" : "pin-inp"}>
        <input
          id="ulang" name="ulang" type={tampil ? "text" : "password"} autoComplete="new-password"
          readOnly={sibuk} aria-invalid={salah ? "true" : undefined}
          aria-describedby={pesan ? "password-err" : undefined} required
        />
      </span>
      <PesanLangkah pesan={pesan} id="password-err" />
      <Kirim locale={locale} siap={siap} sibuk={sibuk} label="aktifkan.p_simpan" />
    </form>
  );
}

// ────────────────────────────────────────────────────────────────── 3 · PIN
export function LangkahPin({ locale, siap, sibuk, pesan, judulRef, onKirim }: Umum & {
  onKirim: (pin: string, ulang: string) => void;
}) {
  const s = kata(locale);
  const [tampil, setTampil] = useState(false);
  const salah = Boolean(pesan?.salah);
  return (
    <form className="pin-form" noValidate onSubmit={(e) => { e.preventDefault(); onKirim(ambil(e, "pin"), ambil(e, "ulang")); }}>
      <KepalaLangkah locale={locale} langkah="PIN" judul="aktifkan.n_judul" lede="aktifkan.n_lede" judulRef={judulRef} />
      <label className="pin-lbl" htmlFor="pin">{s("aktifkan.n_label")}</label>
      <span className={salah ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"}>
        <input
          id="pin" name="pin" type={tampil ? "text" : "password"} inputMode="numeric" autoComplete="off" maxLength={4}
          readOnly={sibuk} aria-invalid={salah ? "true" : undefined}
          aria-describedby={pesan ? "pin-aturan pin-err" : "pin-aturan"} required
        />
        <button type="button" className="pin-lihat" aria-pressed={tampil}
          aria-label={s(tampil ? "auth.card_hide" : "auth.card_show")} onClick={() => setTampil((v) => !v)}>
          <span aria-hidden="true">{tampil ? "🚫" : "👁"}</span>
        </button>
      </span>
      <p className="pin-msg pin-msg-note" id="pin-aturan">{s("aktifkan.n_aturan")}</p>
      <label className="pin-lbl" htmlFor="pin-ulang">{s("aktifkan.n_ulang")}</label>
      <span className={salah ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"}>
        <input
          id="pin-ulang" name="ulang" type={tampil ? "text" : "password"} inputMode="numeric" autoComplete="off" maxLength={4}
          readOnly={sibuk} aria-invalid={salah ? "true" : undefined} aria-describedby={pesan ? "pin-err" : undefined} required
        />
      </span>
      <PesanLangkah pesan={pesan} id="pin-err" />
      <Kirim locale={locale} siap={siap} sibuk={sibuk} label="aktifkan.n_simpan" />
    </form>
  );
}

// ───────────────────────────────────────────────────── 4 · the name (D-077)
/**
 * THE NAME, CONFIRMED ONCE (D-077(1)). Shown large, as it will appear, with
 * «Sudah benar» first; «Ubah nama» opens the one field, and «Sudah benar»
 * then sends the corrected name. Both are one confirmation, audited on the
 * server, and after it the person cannot edit their name again (BOB-26 §3.5),
 * which the step says before they press.
 */
export function LangkahNama({ locale, siap, sibuk, pesan, judulRef, nama, ubah, onBenar, onUbah, onBatal, onKirimUbah }: Umum & {
  nama: string;
  /** The field is open. */
  ubah: boolean;
  onBenar: () => void;
  onUbah: () => void;
  onBatal: () => void;
  onKirimUbah: (nama: string) => void;
}) {
  const s = kata(locale);
  const salah = Boolean(pesan?.salah);
  if (!ubah) {
    return (
      <form className="pin-form" noValidate onSubmit={(e) => { e.preventDefault(); onBenar(); }}>
        <KepalaLangkah locale={locale} langkah="NAMA" judul="aktifkan.m_judul" lede="aktifkan.m_lede" judulRef={judulRef} />
        <p className="pin-akt-nama" id="nama-kini">{nama}</p>
        <p className="pin-msg pin-msg-note">{s("aktifkan.m_sekali")}</p>
        <PesanLangkah pesan={pesan} id="nama-err" />
        <Kirim locale={locale} siap={siap} sibuk={sibuk} label="aktifkan.m_benar" />
        <button type="button" className="pin-mbtn pin-mbtn-2" onClick={onUbah} disabled={!siap || sibuk}>{s("aktifkan.m_ubah")}</button>
      </form>
    );
  }
  return (
    <form className="pin-form" noValidate onSubmit={(e) => { e.preventDefault(); onKirimUbah(ambil(e, "nama")); }}>
      <KepalaLangkah locale={locale} langkah="NAMA" judul="aktifkan.m_judul" lede="aktifkan.m_lede" judulRef={judulRef} />
      <label className="pin-lbl" htmlFor="nama">{s("aktifkan.m_label")}</label>
      <span className={salah ? "pin-inp pin-inp-salah" : "pin-inp"}>
        <input
          id="nama" name="nama" defaultValue={nama} autoComplete="name" readOnly={sibuk}
          aria-invalid={salah ? "true" : undefined} aria-describedby={pesan ? "nama-err" : undefined} required
        />
      </span>
      <p className="pin-msg pin-msg-note">{s("aktifkan.m_sekali")}</p>
      <PesanLangkah pesan={pesan} id="nama-err" />
      <Kirim locale={locale} siap={siap} sibuk={sibuk} label="aktifkan.m_benar" />
      <button type="button" className="pin-mbtn pin-mbtn-2" onClick={onBatal} disabled={!siap || sibuk}>{s("aktifkan.m_batal")}</button>
    </form>
  );
}

// ───────────────────────────────────────────────────────────── the welcome
/**
 * «SELAMAT DATANG DI PINTAR». For staff: the PINTAR ID, the QR and where the
 * card email went. For a learner-only account (C17): the account is ready,
 * and nothing about an ID or a card. «Masuk ke PINTAR» goes to the home the
 * route named (D-010), as a whole-page load so every part reads the session.
 */
export function Selamat({ locale, judulRef, kartu, status, tujuan }: {
  locale: Locale;
  judulRef?: RefObject<HTMLHeadingElement | null>;
  /** Staff only; null for a learner-only account, or when the card could not be read. */
  kartu: DataKartu | null;
  status: StatusKartu;
  tujuan: string;
}) {
  const s = kata(locale);
  return (
    <div className="pin-form pin-akt-selamat">
      <span className="pin-disc pin-disc-primary" aria-hidden="true">✓</span>
      <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("auth.title")}</h1>
      <p className="pin-lede-m">{s("aktifkan.w_siap")}</p>
      {kartu ? <IdentitasSaya locale={locale} kartu={kartu} /> : null}
      {status === "TERKIRIM" ? <p className="pin-msg pin-msg-note" role="status">{s("aktifkan.w_kartu_terkirim")}</p> : null}
      {status === "BELUM_TERKIRIM" ? <p className="pin-msg pin-msg-note" role="status">{s("aktifkan.w_kartu_belum")}</p> : null}
      <a className="pin-mbtn pin-mbtn-1" href={tujuan}>{s("aktifkan.w_masuk")}</a>
    </div>
  );
}

// ──────────────────────────────────────────── where the wizard cannot go on
/** One sentence and the one way on: signed out, finished, not for this account, or unreachable. */
export function Berhenti({ locale, judulRef, teks, tindakan }: {
  locale: Locale;
  judulRef?: RefObject<HTMLHeadingElement | null>;
  teks: string;
  tindakan: { href: string; label: HleEvent } | { onClick: () => void; label: HleEvent };
}) {
  const s = kata(locale);
  let tombol: ReactNode;
  if ("href" in tindakan) tombol = <a className="pin-mbtn pin-mbtn-1" href={tindakan.href}>{s(tindakan.label)}</a>;
  else tombol = <button type="button" className="pin-mbtn pin-mbtn-1" onClick={tindakan.onClick}>{s(tindakan.label)}</button>;
  return (
    <div className="pin-form">
      <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("aktifkan.judul")}</h1>
      <p className="pin-lede-m" role="status">{teks}</p>
      {tombol}
    </div>
  );
}
