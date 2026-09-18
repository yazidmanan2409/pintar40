"use client";

import { useEffect, useRef, useState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { sendMagicLink, signInWithCard, type HasilKirim } from "@/app/masuk/actions";

/**
 * THE SIGN-IN SCREEN'S TWELVE INTERACTIVE STATES (S1–S12 of the handoff).
 *
 * S13 and S14 live on the callback route and S15 is decided on the server,
 * because both are answers to a question this component cannot ask.
 *
 * THE SHAPE OF THE SCREEN FOLLOWS THE SHAPE OF THE CONTRACT. There are exactly
 * two ways into PINTAR, and they are not equal: nearly everyone uses the
 * email link, and the class card serves a specific circumstance. So the screen
 * does not offer two doors and does not ask anybody to classify themselves
 * before they can act. Email is the main road; the card is a named, visible,
 * one-tap turning off it.
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
  | { k: "email"; salah?: "bentuk" | "kirim"; sibuk?: boolean }
  | { k: "terkirim"; ditahan?: boolean; sibuk?: boolean }
  | { k: "kartu"; salah?: boolean; sibuk?: boolean };

/** Where focus goes next. Named rather than implied; see the note above. */
type Fokus = "judul" | "email" | "kirim" | "kartu" | null;

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

  const [layar, setLayar] = useState<Layar>({ k: "email" });
  const [pinTampil, setPinTampil] = useState(false);
  // A token rather than a derived value: two different transitions can land on
  // the same surface and want focus in different places.
  const [fokus, setFokus] = useState<{ ke: Fokus; n: number }>({ ke: null, n: 0 });

  const judulRef = useRef<HTMLHeadingElement>(null);
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
        : fokus.ke === "email" ? emailRef.current
          : fokus.ke === "kirim" ? kirimRef.current
            : kartuRef.current;
    el?.focus();
  }, [fokus]);

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
    const hasil = await sendMagicLink(new FormData(form));
    terapkanKirim(hasil, false);
  }

  /**
   * S6 IS REACHABLE ONLY FROM A RESEND, exactly as the handoff scopes it. A
   * first send that the layer refuses as too soon has still failed to send, so
   * it lands in S7 and says so; it does not borrow the wording of a state
   * about asking again.
   */
  function terapkanKirim(hasil: HasilKirim, ulang: boolean) {
    if (hasil === "terkirim") {
      setLayar({ k: "terkirim" });
      pindahFokus("judul");
      return;
    }
    if (hasil === "ditahan" && ulang) {
      setLayar({ k: "terkirim", ditahan: true });
      // Focus does not move. A change the person did not ask for, announced
      // to nobody, is how a screen-reader user loses their place.
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
    terapkanKirim(await sendMagicLink(fd), true);
  }

  function emailLain() {
    setLayar({ k: "email" });
    pindahFokus("email");
  }

  // ────────────────────────────────────────────────────────── the card path
  function keKartu() {
    setPinTampil(false);
    setLayar({ k: "kartu" });
    // Unlike first arrival, this surface was reached by a deliberate choice:
    // the person has read where they are and the next act is transcription.
    pindahFokus("kartu");
  }

  function keEmail() {
    // Anything typed into the card fields is discarded, the PIN included.
    formKartuRef.current?.reset();
    setPinTampil(false);
    setLayar({ k: "email" });
    pindahFokus("email");
  }

  async function masukKartu(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLayar({ k: "kartu", sibuk: true });
    await signInWithCard(fd);
    // Reached only when the action returned instead of redirecting, which it
    // does for every refusal and for nothing else.
    setLayar({ k: "kartu", salah: true });
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
        {layar.ditahan ? (
          <p className="pin-msg pin-msg-note" role="status">{s("auth.cool")}</p>
        ) : null}
        <div className="pin-stack">
          <button
            type="button"
            className="pin-mbtn pin-mbtn-2"
            onClick={kirimUlang}
            disabled={Boolean(layar.ditahan) || Boolean(layar.sibuk)}
            aria-busy={layar.sibuk ? "true" : undefined}
          >
            {layar.sibuk ? s("auth.sending") : s("auth.sent_resend")}
          </button>
          {/* Never blocked by a limit on the previous address. */}
          <button type="button" className="pin-mbtn pin-mbtn-2" onClick={emailLain}>
            {s("auth.sent_other")}
          </button>
        </div>
      </div>
    );
  }

  if (layar.k === "kartu") {
    return (
      <form className="pin-form" onSubmit={masukKartu} ref={formKartuRef} noValidate>
        <input type="hidden" name="lanjut" value={lanjut} />
        {/* First element, first tab stop, present in every card state. */}
        <button type="button" className="pin-kembali" onClick={keEmail}>
          <span aria-hidden="true">←</span> {s("auth.card_back")}
        </button>
        <h1 className="pin-mh1">{s("auth.card_h1")}</h1>
        <p className="pin-lede-m">{s("auth.card_lede")}</p>

        <label className="pin-lbl" htmlFor="kartu">{s("auth.card_number")}</label>
        <span className={layar.salah ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"}>
          <input
            id="kartu" name="kartu" ref={kartuRef}
            inputMode="numeric"
            /* Shared classroom devices. A browser that offers the last child's
               card number to the next child has turned a convenience into a
               credential leak. */
            autoComplete="off"
            placeholder="10 0000 0000"
            readOnly={layar.sibuk}
            aria-invalid={layar.salah ? "true" : undefined}
            aria-describedby={layar.salah ? "kartu-err" : undefined}
            required
          />
        </span>

        <label className="pin-lbl" htmlFor="pin">{s("auth.card_pin")}</label>
        <span className={layar.salah ? "pin-inp pin-inp-big pin-inp-salah" : "pin-inp pin-inp-big"}>
          <input
            id="pin" name="pin"
            type={pinTampil ? "text" : "password"}
            inputMode="numeric" autoComplete="off"
            readOnly={layar.sibuk}
            /* BOTH fields carry it, pointing at ONE message. Marking only the
               PIN invalid tells a screen-reader user that the card number was
               accepted — precisely the fact the visible copy withholds. */
            aria-invalid={layar.salah ? "true" : undefined}
            aria-describedby={layar.salah ? "kartu-err" : undefined}
            required
          />
          {/* Controlled by the person and by nothing else: no timer re-masks
              it. A PIN that re-hides itself while a child is comparing it
              against a printed card is a small cruelty. */}
          <button
            type="button" className="pin-lihat"
            aria-pressed={pinTampil}
            aria-label={s(pinTampil ? "auth.card_hide" : "auth.card_show")}
            onClick={() => setPinTampil((v) => !v)}
          >
            <span aria-hidden="true">{pinTampil ? "🚫" : "👁"}</span>
          </button>
        </span>

        {layar.salah ? (
          <p className="pin-msg pin-msg-err" role="alert" id="kartu-err">{s("auth.card_failed")}</p>
        ) : null}

        <button
          type="submit" className="pin-mbtn pin-mbtn-1 pin-mbtn-big"
          disabled={layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}
        >
          {layar.sibuk ? <><span className="pin-putar" aria-hidden="true" />{s("auth.card_checking")}</> : s("auth.card_enter")}
        </button>
      </form>
    );
  }

  return (
    <form className="pin-form" onSubmit={kirim} ref={formEmailRef} noValidate>
      <input type="hidden" name="lanjut" value={lanjut} />
      <h1 className="pin-mh1">{s("auth.title")}</h1>
      <p className="pin-lede-m">{s("auth.lede")}</p>

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

      <button
        type="submit" className="pin-mbtn pin-mbtn-1" ref={kirimRef}
        disabled={layar.sibuk} aria-busy={layar.sibuk ? "true" : undefined}
      >
        {layar.sibuk
          ? <><span className="pin-putar" aria-hidden="true" />{s("auth.sending")}</>
          : s(layar.salah === "kirim" ? "auth.retry" : "auth.send_link")}
      </button>

      <p className="pin-rute">
        {s("auth.card_title")}{" "}
        <button type="button" className="pin-tautan" onClick={keKartu}>{s("auth.card_go")}</button>
      </p>
    </form>
  );
}
