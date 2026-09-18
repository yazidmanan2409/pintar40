"use client";

import { t, type Locale } from "@/lib/hle";
import type { MiniaturKind } from "@/lib/tur";

/**
 * A MINIATURE — a small, inert drawing of a surface the tour must not open.
 *
 * WHY A DRAWING AND NOT THE REAL THING. Four of the seven learner steps and
 * three of the seven educator steps describe surfaces that live INSIDE an
 * assignment or behind a commitment. Walking the person there would not be
 * looking: mounting a lesson records reading progress, opening an assessment
 * spends a commitment, and a class page is a teaching context the tour has no
 * business selecting. So the step stays on the landing and shows the shape.
 *
 * WHY IT HAS NO WORDS. Every miniature below is geometry — bars, rows, a
 * frame. It carries no product copy, no item text, no learner name, no number
 * and no status colour, because anything it said would be either a real
 * person's data or a sentence nobody approved. The step's MEANING is in its
 * body text; the drawing only says "a surface of about this shape". That is
 * also why the whole thing is `aria-hidden` (§K-4): a screen-reader user loses
 * nothing, because there is nothing here that the words do not already carry.
 *
 * WHY THE FRAME IS WHITE. Sauron's Guidance Mode ruling (§O-3): the frame
 * stands for the white product sheet, so what a miniature demonstrates is as
 * authentic as it can be at that size. It keeps the strong hairline, because a
 * white card on the guidance ground has almost no edge of its own.
 *
 * The one thing deliberately NOT drawn green: a chosen answer is shown with an
 * ink border, never the `primary-soft` fill the real option uses. Inside
 * instruction that tint would be one glance away from reading as "correct",
 * and §O-6 reserves it away from correctness.
 */
export default function Miniatur({ jenis, locale }: { jenis: MiniaturKind; locale: Locale }) {
  return (
    <div className="pin-mini" aria-hidden="true">
      <span className="pin-mini-label">{t("tur.contoh", "learner", { locale })}</span>
      <div className="pin-mini-bingkai">{gambar(jenis)}</div>
    </div>
  );
}

function bar(n: number, kelas = "pin-mini-bar") {
  return Array.from({ length: n }, (_, i) => <i key={i} className={kelas} />);
}

/**
 * A measure, drawn as eight equal segments with `terisi` of them inked.
 *
 * Segments rather than a percentage width on purpose: a bar drawn to 62 %
 * looks like a reading, and a reading is a number. Eight blocks with five
 * filled reads as "about this much" and cannot be mistaken for a figure the
 * product computed about anybody.
 */
function ukur(terisi: number) {
  return (
    <span className="pin-mini-ukur">
      {Array.from({ length: 8 }, (_, i) => (
        <i key={i} className={i < terisi ? "pin-mini-seg pin-mini-isi" : "pin-mini-seg"} />
      ))}
    </span>
  );
}

function gambar(jenis: MiniaturKind) {
  switch (jenis) {
    // The five steps of a cycle, one of them open. The spine is a row of
    // named stops in the product; here it is a row of stops.
    case "spine":
      return (
        <div className="pin-mini-spine">
          {Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={i === 1 ? "pin-mini-stop pin-mini-kini" : "pin-mini-stop"} />
          ))}
        </div>
      );
    // The reading map: ordered parts, the first one marked.
    case "peta":
      return (
        <div className="pin-mini-rows">
          {[0, 1, 2].map((i) => (
            <span key={i} className="pin-mini-row">
              <i className={i === 0 ? "pin-mini-tanda pin-mini-kini" : "pin-mini-tanda"} />
              <i className="pin-mini-bar" />
            </span>
          ))}
        </div>
      );
    // A question: a stem, three options, one chosen, and the button below.
    case "soal":
      return (
        <div className="pin-mini-soal">
          <i className="pin-mini-bar pin-mini-lebar" />
          {[0, 1, 2].map((i) => (
            <span key={i} className={i === 1 ? "pin-mini-opsi pin-mini-pilih" : "pin-mini-opsi"}>
              <i className="pin-mini-bar" />
            </span>
          ))}
          <i className="pin-mini-tombol" />
        </div>
      );
    // A lesson page: a heading and body lines, one of them short.
    case "pelajaran":
      return (
        <div className="pin-mini-rows">
          <i className="pin-mini-bar pin-mini-judul" />
          {bar(3)}
          <i className="pin-mini-bar pin-mini-pendek" />
        </div>
      );
    // Results: two measures side by side, drawn in ink, never in a status
    // colour — the product's own rule for these figures (§D-6, Slice 3).
    case "hasil":
      return (
        <div className="pin-mini-hasil">
          {ukur(5)}
          {ukur(3)}
          <i className="pin-mini-bar pin-mini-pendek" />
        </div>
      );
    // A Quick Assessment being configured: a neutral tag, two settings rows,
    // and the button that is the commitment.
    case "cepat":
      return (
        <div className="pin-mini-rows">
          <i className="pin-mini-tag" />
          {[0, 1].map((i) => (
            <span key={i} className="pin-mini-row">
              <i className="pin-mini-bar" />
              <i className="pin-mini-nilai" />
            </span>
          ))}
          <i className="pin-mini-tombol" />
        </div>
      );
    // Making material available: a chapter card, then the button.
    case "sedia":
      return (
        <div className="pin-mini-rows">
          <span className="pin-mini-kartu">
            <i className="pin-mini-bar pin-mini-judul" />
            <i className="pin-mini-bar pin-mini-pendek" />
          </span>
          <i className="pin-mini-tombol" />
        </div>
      );
    // Evidence: one measure that has enough behind it, and one that does not —
    // drawn as a dashed rule, because "not yet enough evidence" is a normal
    // state with no number, not a zero and not a warning.
    case "bukti":
      return (
        <div className="pin-mini-hasil">
          {ukur(4)}
          <span className="pin-mini-kosong" />
          <i className="pin-mini-bar pin-mini-pendek" />
        </div>
      );
  }
}
