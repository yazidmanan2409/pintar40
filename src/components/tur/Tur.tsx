"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import { simpanBahasa } from "@/lib/locale-klien";
import {
  akanMunculLagi, tipSetelahTutup, tur as turUntuk,
  type Keadaan, type Langkah, type TurKey, type Varian,
} from "@/lib/tur";
import { catatTampilTur, selesaikanTurAksi, bungkamTurAksi } from "@/app/tur/actions";
import Miniatur from "./Miniatur";
import PanelBantuan from "./PanelBantuan";
import TipSetelahTutup from "./TipSetelahTutup";
import { BUKA_BANTUAN } from "./TombolBantuan";

/**
 * THE TOUR, AS IT IS PRESENTED. Seven steps, a spotlight, a card, and the one
 * thing the whole design is built around: it only ever LOOKS.
 *
 * NOTHING HERE NAVIGATES AND NOTHING HERE COMMITS. There is no `Link`, no
 * `router.push` to a product page, no form and no write except the three
 * presentation verbs. A step whose subject lives inside an assignment draws a
 * miniature instead of going there, because going there would record reading
 * progress or spend an attempt, and a tour that changes the thing it is
 * describing is not a map.
 *
 * WHERE THE STATE LIVES, AND WHY THE SPLIT IS EXACTLY HERE. Which step is on
 * screen, whether the card is open, whether the box is ticked right now — that
 * is view state, and it belongs in this component because it dies with the
 * page. Whether this person has finished the tour, asked not to be interrupted
 * again, or used up their three automatic presentations is durable state about
 * a PERSON, and it lives in the database behind `my_tour_state`. Putting any of
 * the second kind in `localStorage` would answer "has this person seen the
 * tour" with a fact about a device, which is wrong on precisely the shared
 * classroom tablet PINTAR is most used on.
 *
 * AUTOMATIC PRESENTATION IS SPENT ONCE, AND ONLY WHEN IT HAPPENS. The write
 * goes out at the moment the card actually opens by itself, guarded by a ref so
 * that a language switch, a re-render or a refresh cannot spend a second one.
 * An arrival held back by a deep link or a running Quick Assessment writes
 * nothing at all, because nothing was presented. Replay from Help writes
 * nothing either: being helped on purpose must not push somebody toward a cap.
 */

type Kotak = { top: number; left: number; width: number; height: number };

/**
 * Measuring must happen before the browser paints, or the card is seen in the
 * wrong place for a frame. On the server there is nothing to measure and React
 * would warn, so the effect degrades to the passive one there.
 */
const useUkurEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Below this, the card is a bottom sheet rather than a card beside a target. */
const TELEPON = "(max-width: 560px)";
/** The gutter the card and the scrolled-to target keep from the viewport edge. */
const TEPI = 16;
/** The gap between a target and the card describing it. */
const JARAK = 16;

export default function Tur({
  kunci,
  varian,
  locale,
  persona,
  keadaan,
  otomatis,
  tersedia = true,
  bantuanAwal,
  kosong,
}: {
  kunci: TurKey;
  varian: Varian;
  locale: Locale;
  persona: Persona;
  /** The person's durable state, or null when it could not be read. */
  keadaan: Keadaan | null;
  /** Whether this arrival may open the tour by itself. Decided on the server. */
  otomatis: boolean;
  /**
   * Whether this tour is this person's tour at all (§H-3). False for somebody
   * senior to the experience: they are not presented it AND Help does not offer
   * it, because a map of somebody else's page is not help.
   */
  tersedia?: boolean;
  /** The person came back here from another page asking for Help. */
  bantuanAwal: boolean;
  /** Anchor names that are legitimately empty on this page right now (§J-1). */
  kosong: string[];
}) {
  const router = useRouter();
  const daftar = turUntuk(varian);
  const total = daftar.langkah.length;
  const sd = varian === "sd";
  const s = (k: HleEvent) => t(k, persona, { locale });

  // WHETHER THE TOUR IS OPEN IS KNOWN BEFORE THE FIRST PAINT. The server has
  // already asked the database and applied the two Experience exclusions, so
  // this is initial state rather than something an effect discovers — which is
  // also why the card is never seen arriving a frame late.
  const otomatisSekarang = tersedia && otomatis && !bantuanAwal;
  const [aktif, setAktif] = useState(otomatisSekarang);
  const [replay, setReplay] = useState(false);
  const [indeks, setIndeks] = useState(0);
  const [dicentang, setDicentang] = useState(false);
  const [bantuan, setBantuan] = useState(bantuanAwal);
  const [tip, setTip] = useState<HleEvent | null>(null);

  const [kotak, setKotak] = useState<Kotak | null>(null);
  const [taruh, setTaruh] = useState<{ top: number; left: number } | null>(null);
  const akarRef = useRef<HTMLDivElement>(null);
  const kartuRef = useRef<HTMLDivElement>(null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const sebelumnya = useRef<Element | null>(null);
  const sudahDicatat = useRef(false);
  /** How many automatic presentations THIS arrival has spent. Never more than 1. */
  const terpakai = useRef(otomatisSekarang ? 1 : 0);

  const langkah: Langkah = daftar.langkah[Math.min(indeks, total - 1)];
  const akhir = indeks === total - 1;
  const sasaran = langkah.sasaran;
  const anchorKosong = sasaran.jenis === "anchor" && kosong.includes(sasaran.nama);

  // ──────────────────────────────────────── one automatic presentation, spent
  // The only write this component makes on its own, and it is made once. A
  // language switch, a refresh or any later re-render cannot reach it: the ref
  // is set before the call and never cleared for the life of the page.
  //
  // An arrival that was HELD BACK spends nothing, because nothing was
  // presented — `otomatis` is already false for a deep link and for a running
  // Quick Assessment, and somebody who came here asking for Help gets Help
  // rather than a tour over it (§G-1).
  useEffect(() => {
    if (!otomatisSekarang || sudahDicatat.current) return;
    sudahDicatat.current = true;
    void catatTampilTur(kunci);
  }, [otomatisSekarang, kunci]);

  // ───────────────────────────────────────────────────────── Help, on request
  useEffect(() => {
    function buka() {
      if (aktif) return; // a tour is running; one overlay at a time
      setTip(null);
      setBantuan(true);
    }
    window.addEventListener(BUKA_BANTUAN, buka);
    return () => window.removeEventListener(BUKA_BANTUAN, buka);
  }, [aktif]);

  // ───────────────────────────────────────── Guidance Mode, and only for these
  // Exactly two states repaint the environment: a tour is running, and Help is
  // open (§O-1). The tip below does not, and neither does anything else.
  useEffect(() => {
    if (!aktif && !bantuan) return;
    const akar = document.documentElement;
    akar.classList.add("pin-tuntun");
    return () => akar.classList.remove("pin-tuntun");
  }, [aktif, bantuan]);

  // ──────────────────────────────────────────────── the page behind is inert
  // Only for the tour. Help is not modal (§O-2), so the page stays live under
  // it and the reader can still see what they came to ask about.
  //
  // EVERYTHING EXCEPT THE TOUR, found by walking up from the tour's own root
  // and marking every sibling at every level. That is the whole page and only
  // the page: the tour's own ancestors carry nothing interactive of their own,
  // and nothing here depends on where the caller chose to mount it.
  useEffect(() => {
    if (!aktif) return;
    const ubah: Element[] = [];
    let simpul: Element | null = akarRef.current;
    while (simpul && simpul !== document.body && simpul.parentElement) {
      for (const saudara of Array.from(simpul.parentElement.children)) {
        if (saudara === simpul || saudara.hasAttribute("inert")) continue;
        saudara.setAttribute("inert", "");
        saudara.setAttribute("aria-hidden", "true");
        ubah.push(saudara);
      }
      simpul = simpul.parentElement;
    }
    return () => {
      for (const el of ubah) {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
    };
  }, [aktif]);

  // ───────────────────────────────────────── measuring, scrolling and placing
  //
  // ONE EFFECT, because measuring and staying measured are the same job. It
  // re-runs on every step, on every language change (labels change length, so
  // the target moves) and never between those, and its cleanup gives back the
  // room it borrowed.
  useUkurEffect(() => {
    if (!aktif) return;

    function ukur(bolehGeser: boolean) {
      const hp = window.matchMedia(TELEPON).matches;
      const kartu = kartuRef.current;
      const tinggiKartu = kartu?.offsetHeight ?? 0;

      // THE PHONE SHEET'S ROOM (§J-14). Without it a target at the very bottom
      // of the page can never scroll above the sheet, and the card would end up
      // docked over the thing it is describing.
      document.body.style.paddingBottom = hp && tinggiKartu > 0 ? `${tinggiKartu}px` : "";

      /** No target: the veil alone, and the card in the middle of it. */
      function ditengah() {
        setKotak(null);
        setTaruh(
          hp || !kartu
            ? null
            : {
                top: Math.max(TEPI, (window.innerHeight - tinggiKartu) / 2),
                left: Math.max(TEPI, (window.innerWidth - kartu.offsetWidth) / 2),
              },
        );
      }

      if (sasaran.jenis !== "anchor") {
        ditengah();
        return;
      }
      const el = document.querySelector(`[data-tur="${CSS.escape(sasaran.nama)}"]`);
      if (!el) {
        // §J-1: the step still appears and the count stays seven. The card is
        // centred with the scrim and there is no spotlight — nothing fake is
        // ever put on the page to give the tour something to point at.
        ditengah();
        return;
      }

      const bawah = hp ? window.innerHeight - tinggiKartu - TEPI : window.innerHeight - TEPI;
      if (bolehGeser) {
        const r = el.getBoundingClientRect();
        let geser = 0;
        if (r.top < TEPI) geser = r.top - TEPI;
        else if (r.bottom > bawah) geser = Math.min(r.top - TEPI, r.bottom - bawah);
        if (geser !== 0) {
          window.scrollBy({
            top: geser,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          });
        }
      }

      // §J-13: a target taller than the room above the sheet is highlighted by
      // its first meaningful part. The step's words still describe the whole,
      // which is why narrowing the ring costs the reader nothing.
      let diukur: Element = el;
      const ruang = bawah - TEPI;
      if (el.getBoundingClientRect().height > ruang && el.firstElementChild) {
        diukur = el.firstElementChild;
      }
      const r = diukur.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        ditengah();
        return;
      }
      const k: Kotak = { top: r.top, left: r.left, width: r.width, height: r.height };
      setKotak(k);

      if (hp || !kartu) {
        setTaruh(null); // the sheet is placed by the stylesheet
        return;
      }
      // DESKTOP: BESIDE OR BELOW, NEVER OVER (§M). Below the target when it
      // fits, above it when that does not, and beside it when neither does —
      // which is the case a tall target makes, and the case where centring
      // would put the card on top of the thing it is describing.
      const lebar = kartu.offsetWidth;
      const bawahnya = k.top + k.height + JARAK;
      const atasnya = k.top - JARAK - tinggiKartu;
      const muatBawah = bawahnya + tinggiKartu <= window.innerHeight - TEPI;
      const muatAtas = atasnya >= TEPI;
      if (muatBawah || muatAtas) {
        const top = muatBawah ? bawahnya : atasnya;
        const left = Math.min(Math.max(TEPI, k.left), Math.max(TEPI, window.innerWidth - lebar - TEPI));
        setTaruh({ top, left });
        return;
      }
      const kanan = k.left + k.width + JARAK;
      const kiri = k.left - JARAK - lebar;
      const disamping = kanan + lebar <= window.innerWidth - TEPI ? kanan : kiri >= TEPI ? kiri : null;
      setTaruh({
        top: Math.max(TEPI, Math.min(k.top, window.innerHeight - tinggiKartu - TEPI)),
        left: disamping ?? Math.max(TEPI, (window.innerWidth - lebar) / 2),
      });
    }

    ukur(true);
    // A smooth scroll is still moving after `ukur` returns, and a phone rotates
    // under the reader's hands: the ring follows rather than being placed once.
    const lagi = () => ukur(false);
    window.addEventListener("resize", lagi);
    window.addEventListener("orientationchange", lagi);
    window.addEventListener("scroll", lagi, true);
    return () => {
      window.removeEventListener("resize", lagi);
      window.removeEventListener("orientationchange", lagi);
      window.removeEventListener("scroll", lagi, true);
      document.body.style.paddingBottom = "";
    };
  }, [aktif, indeks, locale, sasaran]);

  // ────────────────────────────────────────────────────────────────── focus
  // On open and on every step change, focus lands on the headline, so the step
  // is read in the order it is written: headline, then body (§K-2).
  useEffect(() => {
    if (!aktif) return;
    judulRef.current?.focus();
  }, [aktif, indeks]);

  // ───────────────────────────────────────────────────────────────── closing
  function tutup(cara: "lewati" | "selesai") {
      // §E and §J-5: finishing, or closing while on the last step, is finishing.
      // Skip and Esc are the same act, and so is leaving the page.
      const selesai = cara === "selesai" || indeks === total - 1;
      const centang = dicentang;
      if (selesai) void selesaikanTurAksi(kunci);
      if (centang) void bungkamTurAksi(kunci);

      setAktif(false);
      setDicentang(false);
      setTip(
        tipSetelahTutup({
          akanMunculLagi: akanMunculLagi(keadaan, {
            tampilOtomatis: terpakai.current,
            dicentang: centang,
            selesai,
          }),
          sd,
        }),
      );

      // §K-2: back where they were, or to the page's own first heading when
      // the tour arrived uninvited and there is nowhere to go back to.
      const balik = sebelumnya.current as HTMLElement | null;
      if (balik && document.contains(balik) && typeof balik.focus === "function") balik.focus();
      else (document.querySelector("main h1") as HTMLElement | null)?.focus?.();
      sebelumnya.current = null;
  }

  // Esc closes, and closes as a skip. Nothing else is bound: arrow keys belong
  // to the screen reader's own browse mode (§K-3). It sits on the card rather
  // than on the window because focus never leaves the card while it is open —
  // and if `inert` is not honoured, the trap below is what keeps that true.
  function tekan(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      tutup("lewati");
      return;
    }
    if (e.key !== "Tab") return;
    const kartu = kartuRef.current;
    if (!kartu) return;
    const bisa = Array.from(
      kartu.querySelectorAll<HTMLElement>("button, input, [href], select, textarea"),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (bisa.length === 0) return;
    const pertama = bisa[0];
    const terakhir = bisa[bisa.length - 1];
    const fokus = document.activeElement;
    if (e.shiftKey && (fokus === pertama || fokus === judulRef.current)) {
      e.preventDefault();
      terakhir.focus();
    } else if (!e.shiftKey && fokus === terakhir) {
      e.preventDefault();
      pertama.focus();
    }
  }

  // ─────────────────────────────────────────────────────── replay, from Help
  // It calls NONE of the three verbs. Not the presentation counter — being
  // helped on purpose must not push somebody toward the cap; not completion —
  // opening is not finishing; and not suppression, which has no opposite.
  function mulaiLagi(dari: number) {
    setBantuan(false);
    setTip(null);
    sebelumnya.current = document.activeElement;
    setReplay(true);
    setIndeks(dari);
    setDicentang(false);
    setAktif(true);
  }

  function gantiBahasa() {
    const lain: Locale = locale === "id" ? "en" : "id";
    simpanBahasa(lain);
    // The same step, the same state, re-rendered in the other language: a
    // refresh re-runs the server component while this one stays mounted, so
    // nothing restarts and nothing is presented again (§J-6).
    router.refresh();
  }

  const pernah = Boolean(
    keadaan && (keadaan.auto_shown_count > 0 || keadaan.completed || keadaan.suppressed),
  );

  const isi: HleEvent = anchorKosong && langkah.kosong ? langkah.kosong : langkah.isi;
  const nomor = indeks + 1;

  return (
    <div className="pin-tur-akar" ref={akarRef}>
      {aktif ? (
        <>
          {kotak ? (
            <div
              className="pin-tur-sorot"
              style={{ top: kotak.top, left: kotak.left, width: kotak.width, height: kotak.height }}
            />
          ) : (
            <div className="pin-tur-tirai" />
          )}

          <div
            ref={kartuRef}
            className={sd ? "pin-tur-kartu pin-tur-sd" : "pin-tur-kartu"}
            // `translate: none` cancels the stylesheet's centring default, which
            // exists for the first server-rendered paint and for nothing else.
            style={taruh ? { ...taruh, translate: "none" } : undefined}
            onKeyDown={tekan}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pin-tur-judul"
            aria-describedby="pin-tur-isi"
          >
            <div className="pin-tur-atas">
              <span className="pin-eyebrow pin-tur-nama">{s("tur.tur")}</span>
              <span className="pin-tur-maju">
                <span className="pin-sr">
                  {s("tur.langkah")} {nomor} {s("tur.dari")} {total}
                </span>
                <span className="pin-num pin-tur-hitung" aria-hidden="true">
                  {nomor} / {total}
                </span>
                <span className="pin-tur-titik" aria-hidden="true">
                  {daftar.langkah.map((l, i) => (
                    <i
                      key={l.posisi}
                      className={i === indeks ? "pin-kini" : i < indeks ? "pin-lalu" : undefined}
                    />
                  ))}
                </span>
              </span>
              {/* The header switch is unreachable while the page is inert, so
                  the dialog carries the same preference itself. */}
              <button type="button" className="pin-tur-x" onClick={gantiBahasa}>
                {locale === "id" ? t("bahasa.en", persona, { locale }) : t("bahasa.id", persona, { locale })}
              </button>
              <button type="button" className="pin-tur-x" onClick={() => tutup("lewati")}>
                {s("tur.lewati")}
              </button>
            </div>

            {sasaran.jenis === "miniatur" ? <Miniatur jenis={sasaran.nama} locale={locale} /> : null}

            <h2 id="pin-tur-judul" className="pin-tur-judul" tabIndex={-1} ref={judulRef}>
              {s(langkah.judul)}
            </h2>
            <p id="pin-tur-isi" className="pin-tur-isi">
              {s(isi)}
            </p>

            <div className="pin-tur-kaki">
              {akhir || replay ? (
                // On the last step the box is replaced by the footnote, because
                // finishing already stops automatic presentation and offering
                // the choice again would imply it had not. A replay has no box
                // at all (§F): it is not the moment to decide about being
                // interrupted.
                akhir ? (
                  <p className="pin-tur-catatan">{s(sd ? "tur.catatan.sd" : "tur.catatan")}</p>
                ) : (
                  <span className="pin-tur-catatan" />
                )
              ) : (
                <label className="pin-tur-centang">
                  <input
                    type="checkbox"
                    checked={dicentang}
                    onChange={(e) => setDicentang(e.target.checked)}
                  />
                  {s("tur.jangan")}
                </label>
              )}
              <span className="pin-tur-tombol">
                {indeks > 0 ? (
                  <button type="button" className="pin-btn" onClick={() => setIndeks(indeks - 1)}>
                    {s("tur.kembali")}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="pin-btn pin-primary"
                  onClick={() => (akhir ? tutup("selesai") : setIndeks(indeks + 1))}
                >
                  {akhir ? s("tur.selesai") : s("tur.berikutnya")}
                </button>
              </span>
            </div>
          </div>
        </>
      ) : null}

      {bantuan ? (
        <PanelBantuan
          tur={tersedia ? daftar : null}
          locale={locale}
          persona={persona}
          pernah={pernah}
          onMulai={mulaiLagi}
          onTutup={() => setBantuan(false)}
        />
      ) : null}

      {tip && !aktif && !bantuan ? (
        <TipSetelahTutup pesan={tip} locale={locale} persona={persona} onTutup={() => setTip(null)} />
      ) : null}
    </div>
  );
}
