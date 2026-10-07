"use client";

import { useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { useSiap } from "./siap";
import { sendMagicLink, type HasilKirim } from "@/app/masuk/actions";
import { kirimKartu, kalimatKartu, menunggu, type GagalKartu } from "./kartu";
import { kirim as kirimRute, kalimat, menunggu as menungguRute, tujuanAman, type Gagal } from "@/components/aktifkan/jawaban";
import { HALAMAN_PEMULIHAN, TAUTAN_MASUK_CADANGAN } from "@/components/aktifkan/kontrak";
import KolomRahasia from "@/components/KolomRahasia";

/**
 * THE SIGN-IN SCREEN'S TWELVE INTERACTIVE STATES (S1–S12 of the handoff).
 *
 * S13 and S14 live on the callback route and S15 is decided on the server,
 * because both are answers to a question this component cannot ask.
 *
 * THE SHAPE OF THE SCREEN FOLLOWS THE SHAPE OF THE CONTRACT. Since Gate 3
 * (D-054, BOB-26 §2.3) the main road is the email or username and password;
 * the doors off it are named and one tap away: «Aktifkan akun» for somebody
 * who has never signed in (it has its own page, /aktifkan), the class card for
 * a child, and — while the fallback switch is on (TAUTAN_MASUK_CADANGAN, until
 * C14) — the email link, behind «Lupa password?». Nobody is asked to classify
 * themselves before they can act.
 *
 * THE PASSWORD DOOR ANSWERS WITH ONE NON-MATCH (MASUK_TIDAK_COCOK) for a wrong
 * password, an unknown name, an account with no password yet, a card's address
 * and a persona alike, so the screen marks BOTH fields against ONE message and
 * accuses neither. Its wait is counted under the typed name whether or not an
 * account has it (§2.3), so showing the route's wait separates nothing.
 *
 * ENTERING THE CARD PATH REPLACES THE SURFACE — it does not open a dialogue
 * over it. A modal would have been cheaper and would have left a child looking
 * at a form they cannot dismiss, on a school device, with no obvious way back.
 * There is exactly one route control on screen at a time and it always points
 * the way the person is not currently going.
 *
 * FOCUS IS THE PART MOST LIKELY TO BE GOT WRONG, so every destination is
 * declared in `pindahFokus` and moved through one effect rather than scattered
 * through handlers. Getting these wrong is how a correct-looking build becomes
 * unusable by keyboard and screen reader.
 *
 * NOTHING VALIDATES WHILE A PERSON IS TYPING. A message that appears and
 * vanishes under a moving cursor teaches nothing and interrupts everything,
 * and it is worst in a language where a valid address runs longer.
 */

/** Which surface is on screen, and what it is carrying. */
type Layar =
  | { k: "password"; gagal?: Gagal<"masukPassword">; kosong?: boolean; sibuk?: boolean }
  | { k: "email"; salah?: "bentuk" | "kirim"; sibuk?: boolean }
  | { k: "terkirim"; sibuk?: boolean }
  | { k: "kartu"; gagal?: GagalKartu; sibuk?: boolean };

/** Where focus goes next. Named rather than implied; see the note above. */
type Fokus = "judul" | "identitas" | "email" | "kirim" | "kartu" | null;

/**
 * A PERMISSIVE SHAPE CHECK, and permissive is the requirement rather than a
 * shortcut. It exists to catch a missing `@` or a truncated domain before a
 * request goes out. It is not a grammar, and it must reject nothing a real
 * school address could be — Indonesian school domains are long, hyphenated and
 * multi-level, and a clever pattern would refuse them.
 */
function bentukEmailMasukAkal(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export default function LayarMasuk({
  locale,
  lanjut,
}: {
  locale: Locale;
  /** Carried to the authentication boundary and no further. */
  lanjut: string;
}) {
  const s = (k: HleEvent) => t(k, "public", { locale });

  const siap = useSiap();
  // Drawn once, used on all three surfaces: a control held unavailable without
  // a reason is its own small cruelty.
  const catatan = siap ? null : (
    <p className="pin-msg pin-msg-note" role="status">{s("auth.belum_siap")}</p>
  );

  const [layar, setLayar] = useState<Layar>({ k: "password" });
  // A token rather than a derived value: two different transitions can land on
  // the same surface and want focus in different places.
  const [fokus, setFokus] = useState<{ ke: Fokus; n: number }>({ ke: null, n: 0 });

  const judulRef = useRef<HTMLHeadingElement>(null);
  const identitasRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const kirimRef = useRef<HTMLButtonElement>(null);
  const kartuRef = useRef<HTMLInputElement>(null);
  const formEmailRef = useRef<HTMLFormElement>(null);
  const formKartuRef = useRef<HTMLFormElement>(null);
  /** The address the link was sent to, held so a resend uses the same one. */
  const alamat = useRef("");

  function pindahFokus(ke: Fokus) {
    setFokus((f) => ({ ke, n: f.n + 1 }));
  }

  useEffect(() => {
    if (!fokus.ke) return;
    const el =
      fokus.ke === "judul" ? judulRef.current
        : fokus.ke === "identitas" ? identitasRef.current
          : fokus.ke === "email" ? emailRef.current
            : fokus.ke === "kirim" ? kirimRef.current
              : kartuRef.current;
    el?.focus();
  }, [fokus]);

  // ────────────────────────────────────────────── the password path (Gate 3)
  // BOB-26 §2.3: POST /masuk/password answers a code, never a message; the
  // screen says what it means (@/components/aktifkan/jawaban).
  async function masuk(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!String(fd.get("identitas") ?? "").trim() || !String(fd.get("password") ?? "")) {
      setLayar({ k: "password", kosong: true });
      pindahFokus("identitas");
      return;
    }
    setLayar({ k: "password", sibuk: true });
    const jawaban = await kirimRute<"masukPassword", { tujuan: string }>("masukPassword", fd);
    if (jawaban.ok) {
      // a whole-page load, so every server part reads the new session
      window.location.assign(tujuanAman(jawaban.tujuan));
      return;
    }
    setLayar({ k: "password", gagal: jawaban });
    // the first field, because the answer does not say which one was wrong
    pindahFokus("identitas");
  }

  function kePassword() {
    // Anything typed on the other surfaces is left behind, the PIN included.
    formKartuRef.current?.reset();
    // the PIN's field leaves with its surface, so it comes back masked (CR-86)
    setLayar({ k: "password" });
    pindahFokus("identitas");
  }

  function keTautan() {
    setLayar({ k: "email" });
    pindahFokus("email");
  }

  // ───────────────────────────────────────────────────────── the email path
  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nilai = String(new FormData(form).get("email") ?? "");
    // S3. On submit, never on keystroke.
    if (!bentukEmailMasukAkal(nilai)) {
      setLayar({ k: "email", salah: "bentuk" });
      pindahFokus("email");
      return;
    }
    alamat.current = nilai;
    setLayar({ k: "email", sibuk: true });
    terapkanKirim(await sendMagicLink(new FormData(form)));
  }

  /**
   * S6 — SUPPRESSED BY SECURITY RULING (D2, Sauron, 2026-09-18).
   *
   * The handoff specified a held-resend surface, conditional on the
   * authentication layer exposing a distinguishable rate-limit condition. It
   * does expose one. Implementation verification then established what the
   * handoff could not know, because §7.4 records that L-2's direction was
   * unknown when it was written: with `shouldCreateUser: false`, an UNKNOWN
   * address never reaches the provider's throttle, so a held resend could only
   * ever mean "this address is real". Two presses would have separated a
   * provisioned address from an unknown one — the enumeration boundary the
   * conditional confirmation exists to close.
   *
   * So the rate-limit outcome is folded into the ordinary one in the action,
   * and this function has two branches instead of three. There is no held
   * state, no countdown, no cooldown message, no retry-after and no throttling
   * explanation. Repeated presses of `Kirim ulang` simply re-enter S4 → S5,
   * which is the same thing they do for an address nobody has.
   */
  function terapkanKirim(hasil: HasilKirim) {
    if (hasil === "terkirim") {
      setLayar({ k: "terkirim" });
      pindahFokus("judul");
      return;
    }
    setLayar({ k: "email", salah: "kirim" });
    pindahFokus("kirim");
  }

  async function kirimUlang() {
    setLayar({ k: "terkirim", sibuk: true });
    const fd = new FormData();
    fd.set("email", alamat.current);
    fd.set("lanjut", lanjut);
    terapkanKirim(await sendMagicLink(fd));
  }

  function emailLain() {
    setLayar({ k: "email" });
    pindahFokus("email");
  }

  // ────────────────────────────────────────────────────────── the card path
  function keKartu() {
    setLayar({ k: "kartu" });
    // Unlike first arrival, this surface was reached by a deliberate choice:
    // the person has read where they are and the next act is transcription.
    pindahFokus("kartu");
  }

  // DAISY-13: BOB-12's route answers with a code (./kartu.ts); the screen says
  // what it means, and a wait is never told it does not match (M13).
  async function masukKartu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLayar({ k: "kartu", sibuk: true });
    const jawaban = await kirimKartu(fd);
    if (jawaban.k === "masuk") {
      // A whole-page load, so every server part reads the new session. The
      // surface stays busy until it leaves.
      window.location.assign(jawaban.tujuan);
      return;
    }
    setLayar({ k: "kartu", gagal: jawaban });
    // The first of the two fields, because the design does not know which one
    // was wrong and must not imply that it does.
    pindahFokus("kartu");
  }

  // ─────────────────────────────────────────────────────────────── rendering
  if (layar.k === "terkirim") {
    return (
      <div className="pin-form">
        <span className="pin-disc pin-disc-primary" aria-hidden="true">✉</span>
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("auth.sent_h")}</h1>
        <p className="pin-lede-m">{s("auth.link_sent")}</p>
        {/* Said BEFORE the link is opened, because it is the most common reason
            a sign-in fails: the link only works in the browser that asked for
            it (audit M1). A note rather than a lede, so it is not read past. */}
        <p className="pin-msg pin-msg-note">{s("auth.sent_same")}</p>
        {catatan}
        <div className="pin-stack">
          {/* Never held. A resend the provider refuses returns the same answer
              as one it accepts, so this control has one behaviour for
              everybody (D2). */}
          <button
            type="button"
            className="pin-mbtn pin-mbtn-2"
            onClick={kirimUlang}
            disabled={!siap || Boolean(layar.sibuk)}
            aria-busy={layar.sibuk ? "true" : undefined}
          >
            {layar.sibuk ? s("auth.sending") : s("auth.sent_resend")}
          </button>
          <button type="button" className="pin-mbtn pin-mbtn-2" onClick={emailLain} disabled={!siap}>
            {s("auth.sent_other")}
          </button>
        </div>
      </div>
    );
  }

  if (layar.k === "kartu") {
    // Only a non-match marks the fields: a wait or an outage judged nothing typed.
    const tidakCocok = layar.gagal?.kode === "CARD_NOT_MATCHED";
    return (
      <form className="pin-form" onSubmit={masukKartu} ref={formKartuRef} noValidate>
        <input type="hidden" name="lanjut" value={lanjut} />
        {/* First element, first tab stop, present in every card state. */}
        <button type="button" className="pin-kembali" onClick={kePassword} disabled={!siap}>
          <span aria-hidden="true">←</span> {s("auth.card_back")}
        </button>
        <h1 className="pin-mh1">{s("auth.card_h1")}</h1>
        <p className="pin-lede-m">{s("auth.card_lede")}</p>

        <label className="pin-lbl" htmlFor="kartu">{s("auth.card_number")}</label>
        <span className={tidakCocok ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"}>
          <input
            id="kartu" name="kartu" ref={kartuRef}
            inputMode="numeric"
            /* Shared classroom devices. A browser that offers the last child's
               card number to the next child has turned a convenience into a
               credential leak. */
            autoComplete="off"
            placeholder="10 0000 0000"
            readOnly={layar.sibuk}
            aria-invalid={tidakCocok ? "true" : undefined}
            aria-describedby={layar.gagal ? "kartu-err" : undefined}
            required
          />
        </span>

        <label className="pin-lbl" htmlFor="pin">{s("auth.card_pin")}</label>
        {/* CR-86 (D-127 Q6): the one secret field. Controlled by the person and by nothing else: no timer re-masks
            it (a PIN that re-hides itself while a child is comparing it against a printed card is a small cruelty);
            the person's own submit does. BOTH fields carry aria-invalid, pointing at ONE message: marking only the
            PIN invalid tells a screen-reader user that the card number was accepted, precisely the fact the visible
            copy withholds. */}
        <KolomRahasia
          bungkus={tidakCocok ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"}
          tampilkan={s("auth.card_show")} sembunyikan={s("auth.card_hide")}
          id="pin" name="pin"
          inputMode="numeric" autoComplete="off"
          readOnly={layar.sibuk}
          aria-invalid={tidakCocok ? "true" : undefined}
          aria-describedby={layar.gagal ? "kartu-err" : undefined}
          required
        />

        {layar.gagal ? (
          <p className={menunggu(layar.gagal) ? "pin-msg pin-msg-note" : "pin-msg pin-msg-err"} role="alert" id="kartu-err">
            {kalimatKartu(layar.gagal, s, locale)}
          </p>
        ) : null}

        {catatan}
        <button
          type="submit" className="pin-mbtn pin-mbtn-1 pin-mbtn-big"
          disabled={!siap || layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}
        >
          {layar.sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("auth.card_checking")}</> : s("auth.card_enter")}
        </button>
      </form>
    );
  }

  if (layar.k === "email") {
    return (
      <form className="pin-form" onSubmit={kirim} ref={formEmailRef} noValidate>
        <input type="hidden" name="lanjut" value={lanjut} />
        {/* First element, first tab stop: the main road is one press away. */}
        <button type="button" className="pin-kembali" onClick={kePassword} disabled={!siap}>
          <span aria-hidden="true">←</span> {s("auth.ke_password")}
        </button>
        <h1 className="pin-mh1">{s("auth.link_h1")}</h1>
        <p className="pin-lede-m">{s("auth.link_lede")}</p>

        <label className="pin-lbl" htmlFor="email">{s("auth.email_label")}</label>
        <span className={layar.salah === "bentuk" ? "pin-inp pin-inp-salah" : "pin-inp"}>
          <input
            id="email" name="email" ref={emailRef}
            type="email" inputMode="email" autoComplete="email"
            placeholder={s("auth.email_ph")}
            /* Readonly, never disabled: a disabled field drops out of the
               accessibility tree and out of tab order mid-flight, and the
               address on screen must still be the address the link went to. */
            readOnly={layar.sibuk}
            aria-invalid={layar.salah === "bentuk" ? "true" : undefined}
            aria-describedby={layar.salah === "bentuk" ? "email-err" : undefined}
            required
          />
        </span>
        {layar.salah === "bentuk" ? (
          <p className="pin-msg pin-msg-err" role="alert" id="email-err">{s("auth.err_email")}</p>
        ) : null}
        {layar.salah === "kirim" ? (
          <p className="pin-msg pin-msg-err" role="alert">{s("auth.err_send")}</p>
        ) : null}

        {catatan}
        <button
          type="submit" className="pin-mbtn pin-mbtn-1" ref={kirimRef}
          disabled={!siap || layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}
        >
          {layar.sibuk
            ? <><span className="pin-putar" aria-hidden="true" />{s("auth.sending")}</>
            : s(layar.salah === "kirim" ? "auth.retry" : "auth.send_link")}
        </button>
      </form>
    );
  }

  // THE MAIN ROAD: email or username, and password (Gate 3).
  // Only a non-match marks the fields, and it marks both against one message:
  // a wait or an outage judged nothing typed, and the route does not say which
  // of the two was wrong.
  const pwSalah = layar.gagal?.kode === "MASUK_TIDAK_COCOK" || Boolean(layar.kosong);
  return (
    <form className="pin-form" onSubmit={masuk} noValidate>
      <input type="hidden" name="lanjut" value={lanjut} />
      <h1 className="pin-mh1">{s("auth.title")}</h1>
      <p className="pin-lede-m">{s("auth.lede")}</p>

      <label className="pin-lbl" htmlFor="identitas">{s("auth.pw_identitas")}</label>
      <span className={pwSalah ? "pin-inp pin-inp-salah" : "pin-inp"}>
        <input
          id="identitas" name="identitas" ref={identitasRef}
          type="text" inputMode="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          readOnly={layar.sibuk}
          aria-invalid={pwSalah ? "true" : undefined}
          aria-describedby={layar.gagal || layar.kosong ? "pw-err" : undefined}
          required
        />
      </span>

      <label className="pin-lbl" htmlFor="password">{s("auth.pw_password")}</label>
      {/* CR-86: the one secret field; its reveal is the person's own, re-masked by their submit. */}
      <KolomRahasia
        bungkus={pwSalah ? "pin-inp pin-inp-salah" : "pin-inp"}
        tampilkan={s("auth.pw_show")} sembunyikan={s("auth.pw_hide")}
        id="password" name="password" autoComplete="current-password"
        readOnly={layar.sibuk}
        aria-invalid={pwSalah ? "true" : undefined}
        aria-describedby={layar.gagal || layar.kosong ? "pw-err" : undefined}
        required
      />

      {/* One line for both refusals, tied to both fields: nothing typed, or the route's sentence. */}
      {layar.kosong || layar.gagal ? (
        <p className={layar.gagal && menungguRute(layar.gagal) ? "pin-msg pin-msg-note" : "pin-msg pin-msg-err"} role="alert" id="pw-err">
          {layar.gagal ? kalimat(layar.gagal, s, locale) : s("auth.pw_kosong")}
        </p>
      ) : null}

      {catatan}
      <button
        type="submit" className="pin-mbtn pin-mbtn-1"
        disabled={!siap || layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}
      >
        {layar.sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("auth.card_checking")}</> : s("auth.pw_masuk")}
      </button>

      {/* BOB-27 (Gate 4, C14): «Lupa password?» is the email recovery; the
          email link stays only behind the switch, which is now off. */}
      <p className="pin-rute">
        {TAUTAN_MASUK_CADANGAN ? (
          <button type="button" className="pin-tautan" onClick={keTautan} disabled={!siap}>{s("auth.pw_lupa")}</button>
        ) : (
          <a className="pin-tautan" href={HALAMAN_PEMULIHAN}>{s("auth.pw_lupa")}</a>
        )}
      </p>
      <p className="pin-rute">
        {s("auth.aktifkan_tanya")}{" "}
        <a className="pin-tautan" href="/aktifkan">{s("auth.aktifkan_go")}</a>
      </p>
      <p className="pin-rute">
        {s("auth.card_title")}{" "}
        <button type="button" className="pin-tautan" onClick={keKartu} disabled={!siap}>{s("auth.card_go")}</button>
      </p>
    </form>
  );
}
