"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import {
  KUNCI_KIRIM, lengkap, sudahTercatat,
  type Jawaban, type Kuesioner, type SebabKirim,
} from "@/lib/umpanbalik-kontrak";

/**
 * THE GOVERNED SHEET, AND THE ONE PRESS THAT SENDS IT.
 *
 * ═══ FIVE QUESTIONS, FOUR CLOSED OPTIONS, AND NOWHERE TO TYPE ═══
 *
 * There is no textarea in this component, no `<input type="text">`, no
 * "anything else?" and no other field of any kind. That is not an omission to
 * be filled in v2 by whoever gets round to it: free text is the single largest
 * re-identification channel a feedback form can have — a turn of phrase, an
 * incident only one person witnessed, a name — and none of the architecture
 * behind this page would survive one sentence of it. FQ-1 has five questions
 * and four options each, and the sheet is exactly that.
 *
 * ═══ WHY A CLIENT ISLAND AT ALL ═══
 *
 * Because the outcome of sending is not a redirect. §7 asks for five distinct
 * situations to be handled and §8 for a calm completion, and a learner whose
 * connection dropped needs to be told what is actually true rather than sent
 * back to a page with a query string on it. So the sheet is held here, one
 * server action carries it, and what comes back is a REASON — the words live in
 * the copy table like every other sentence in PINTAR.
 *
 * The whole sheet is required before the button does anything, which AGREES
 * with `submit_feedback` rather than replacing it: the endpoint refuses a
 * partial sheet by name. Saying so before the press is a kindness; the refusal
 * is still the database's.
 *
 * ═══ AND IT NEVER SENDS TWICE ON ITS OWN ═══
 *
 * No effect, no timer, no retry loop, no request token. A second press while
 * one is in flight is refused by the disabled control; a second press that
 * somehow lands is refused by the row lock in WP7B and comes back as "already
 * recorded", which this renders as the calm completion it is.
 */
export default function LembarUmpanBalik({
  kuesioner,
  kirim,
  locale = "id",
}: {
  kuesioner: Kuesioner;
  kirim: (siklus: string, jawaban: Jawaban) => Promise<SebabKirim>;
  locale?: Locale;
}) {
  const s = (k: string) => t(k as HleEvent, "learner", { locale });
  const router = useRouter();
  const [jawaban, setJawaban] = useState<Jawaban>({});
  const [sibuk, setSibuk] = useState(false);
  const [sebab, setSebab] = useState<SebabKirim | null>(null);
  // Shown only after a press, so a learner reading the sheet for the first
  // time is not greeted by a complaint about not having answered it yet.
  const [ditegur, setDitegur] = useState(false);

  const siap = lengkap(kuesioner, jawaban);
  const selesai = sebab !== null && sudahTercatat(sebab);
  // A round that closed, or a sheet that is no longer theirs, leaves nothing to
  // send — the form goes away rather than standing there inviting a press that
  // cannot succeed.
  const berakhir = sebab === "tutup" || sebab === "bukan_milik";

  async function kirimkan() {
    if (sibuk) return;
    if (!siap) { setDitegur(true); return; }
    setSibuk(true);
    setSebab(null);
    try {
      const hasil = await kirim(kuesioner.cycle_id, jawaban);
      setSebab(hasil);
      // The learner's home carries this cycle in its own list, and that list is
      // now out of date whichever way this went.
      if (sudahTercatat(hasil) || hasil === "tutup") router.refresh();
    } finally {
      setSibuk(false);
    }
  }

  // ── DONE. §8: a calm completion, and not one number on it.
  if (selesai) {
    return (
      <section className="pin-sec" aria-labelledby="pin-ub-usai">
        <h2 id="pin-ub-usai">{s("umpanbalik.selesai.judul")}</h2>
        <p className="pin-msg pin-msg-note" role="status">{s(KUNCI_KIRIM[sebab])}</p>
        <p className="pin-lede">{s("umpanbalik.selesai.arti")}</p>
      </section>
    );
  }

  if (berakhir) {
    return (
      <section className="pin-sec" aria-labelledby="pin-ub-usai">
        <h2 id="pin-ub-usai">{s("umpanbalik.form.judul")}</h2>
        <p className="pin-msg pin-msg-note" role="status">{s(KUNCI_KIRIM[sebab])}</p>
      </section>
    );
  }

  return (
    <section className="pin-sec pin-ub-lembar" aria-labelledby="pin-ub-judul">
      <h2 id="pin-ub-judul">{s("umpanbalik.form.judul")}</h2>
      <p className="pin-lede">{s("umpanbalik.form.intro")}</p>
      {/* Said before the first answer, which is the only time saying it helps. */}
      <p className="pin-mm">{s("umpanbalik.form.privasi")}</p>
      <p className="pin-mm">{s("umpanbalik.form.guna")}</p>

      {/* ONE FIELDSET PER QUESTION. The question is the legend, so a screen
          reader announces it with every option rather than leaving four bare
          words to be guessed at. */}
      {kuesioner.questions.map((q) => {
        const belum = ditegur && !jawaban[q.question_key];
        return (
          <fieldset key={q.question_key} className="pin-ub-soal" aria-invalid={belum || undefined}>
            <legend>{s(q.label_key)}</legend>
            <div className="pin-ub-pilihan">
              {q.options.map((o) => {
                const id = `pin-ub-${q.question_key}-${o.option_key}`;
                return (
                  <label key={o.option_key} htmlFor={id} className="pin-ub-opsi">
                    <input
                      id={id}
                      type="radio"
                      name={q.question_key}
                      value={o.option_key}
                      checked={jawaban[q.question_key] === o.option_key}
                      onChange={() =>
                        setJawaban((lama) => ({ ...lama, [q.question_key]: o.option_key }))
                      }
                    />
                    <span>{s(o.label_key)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {/* The one complaint this form can make, and it is about completeness
          rather than about correctness: there is no wrong answer here. */}
      {ditegur && !siap ? (
        <p className="pin-msg pin-msg-err" role="alert">{s("umpanbalik.form.belum_semua")}</p>
      ) : null}

      {/* An outcome that is neither done nor final: it did not send, or nothing
          is known. Either way the sheet is still below, still filled in. */}
      {sebab && !sudahTercatat(sebab) && !berakhir ? (
        <p className="pin-msg pin-msg-note" role="status">{s(KUNCI_KIRIM[sebab])}</p>
      ) : null}

      <div className="pin-actions">
        {/* NOT DISABLED WHEN INCOMPLETE. A control that goes dead without
            saying why leaves a learner pressing a button that does nothing;
            this one always responds, and when the sheet is short it says so. */}
        <button type="button" className="pin-btn pin-primary pin-ub-btn" onClick={kirimkan} disabled={sibuk}>
          {sibuk ? s("umpanbalik.form.mengirim") : s("umpanbalik.form.kirim")}
        </button>
      </div>
    </section>
  );
}
