import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import {
  HASIL_KUNCI, HASIL_SEMUA, KEADAAN_KUNCI, KELUARGA_KUNCI, RANTAI,
  langkahBerikut, nada, type Keputusan,
} from "@/lib/pimpinan-kontrak";

/**
 * ONE MANAGEMENT DECISION, AS SOMETHING A HUMAN CAN ACT ON.
 *
 * THE CHAIN IS THE CARD. The approved Management design fixes four parts in one
 * order — what the evidence supports, what is not yet known, a possible next
 * step, your decision — and the order is not a layout preference. "What is not
 * yet known" sits between the evidence and the decision because that is where a
 * reader would otherwise fill the gap themselves: an integrity referral records
 * one observed thing and nothing more, and a card that showed only what was
 * referred would be inviting the reader to treat a referral as a finding.
 *
 * NO ENUM REACHES THIS FILE'S OUTPUT. The family, the state and the outcome all
 * arrive as database enums and all three are mapped to tellings before they
 * render; the `source_table` is mapped through a declared map and renders
 * nothing at all when it has no entry, so a table name cannot leak through a
 * fallback.
 *
 * COLOUR IS NEVER THE ONLY CARRIER (§13). The ground comes from the state, and
 * the state is also printed in words in the same header — so the card reads the
 * same to somebody who cannot see the tint.
 *
 * THE CONTROLS ARE WHAT THE DATABASE WILL ACCEPT, taken from `langkahBerikut`,
 * which mirrors `advance_management_decision`'s own state machine. A decided
 * card carries no controls at all: the endpoint refuses every move out of
 * DECIDED, because a recorded human decision is not edited later and new
 * information becomes a new referral rather than a rewritten one.
 */
export default function KartuKeputusan({
  keputusan: k,
  aksi,
  locale = "id",
  galat = false,
}: {
  keputusan: Keputusan;
  /** The server action that records a move. Absent on a read-only rendering. */
  aksi?: (formData: FormData) => void | Promise<void>;
  locale?: Locale;
  galat?: boolean;
}) {
  const s = (key: string) => t(key as HleEvent, "staff", { locale });
  const rantai = RANTAI[k.keluarga];
  const berikut = langkahBerikut(k.keadaan);
  const sumberKunci = SUMBER[k.sumberTabel];

  return (
    <article className={`pin-kp pin-${nada(k.keadaan)}`}>
      <header className="pin-kp-head">
        <p className="pin-eyebrow">
          <span className="pin-kp-tanda">{s(KEADAAN_KUNCI[k.keadaan])}</span>
          {k.simpulNama ? <span className="pin-kp-simpul">{k.simpulNama}</span> : null}
        </p>
        <h3 className="pin-kp-judul">{s(KELUARGA_KUNCI[k.keluarga])}</h3>
        {/* A name appears only when the database returned one. `persons_select`
            runs through `person_visible_to_me`, so a subject this reader may not
            see never arrives and no placeholder stands in for them. */}
        {k.subjek ? (
          <p className="pin-kp-tentang">
            {s("pimpinan.tentang")} {k.subjek}
          </p>
        ) : null}
        <p className="pin-meta">
          {s("pimpinan.sejak")} {format.date(k.diangkatPada, locale)}
          {sumberKunci ? <> · {s(sumberKunci)}</> : null}
        </p>
      </header>

      <dl className="pin-rantai">
        <dt>{s("pimpinan.rantai.didukung")}</dt>
        <dd>{s(rantai.didukung)}</dd>
        <dt>{s("pimpinan.rantai.belum")}</dt>
        <dd>{s(rantai.belum)}</dd>
        <dt>{s("pimpinan.rantai.langkah")}</dt>
        <dd>{s(rantai.langkah)}</dd>
      </dl>

      {/* The educator's own words, when they left any. Rendered as what it is —
          somebody's note — and never as a finding the page endorses. */}
      {k.catatan ? <blockquote className="pin-kp-catatan">{k.catatan}</blockquote> : null}

      <section className="pin-kp-putus">
        <h4 className="pin-ml">{s("pimpinan.rantai.keputusan")}</h4>

        {k.keadaan === "DECIDED" ? (
          <p className="pin-kp-hasil">
            {k.hasil ? s(HASIL_KUNCI[k.hasil]) : null}
            {k.diputuskanPada ? (
              <span className="pin-meta">
                {" "}
                · {s("pimpinan.diputuskan")} {format.date(k.diputuskanPada, locale)}
              </span>
            ) : null}
          </p>
        ) : null}

        {galat ? (
          <p className="pin-msg pin-msg-err" role="alert">
            {s("pimpinan.aksi.gagal")}
          </p>
        ) : null}

        {aksi && berikut.includes("UNDER_REVIEW") ? (
          <form action={aksi} className="pin-kp-ambil">
            <input type="hidden" name="keputusan" value={k.id} />
            <input type="hidden" name="ke" value="UNDER_REVIEW" />
            <button type="submit" className="pin-btn">
              {s("pimpinan.aksi.ambil")}
            </button>
          </form>
        ) : null}

        {aksi && berikut.includes("DECIDED") ? (
          <form action={aksi} className="pin-kp-form">
            <input type="hidden" name="keputusan" value={k.id} />
            <input type="hidden" name="ke" value="DECIDED" />
            <div className="pin-isian">
              <label htmlFor={`hasil-${k.id}`}>{s("pimpinan.aksi.pilih")}</label>
              {/* Exactly the three the enum declares, in one order. There is no
                  fourth, no "other", and no free-text outcome: an outcome the
                  database does not name is not an outcome. */}
              <select id={`hasil-${k.id}`} name="hasil" defaultValue={HASIL_SEMUA[0]}>
                {HASIL_SEMUA.map((h) => (
                  <option key={h} value={h}>
                    {s(HASIL_KUNCI[h])}
                  </option>
                ))}
              </select>
            </div>
            <div className="pin-isian">
              <label htmlFor={`catatan-${k.id}`}>{s("pimpinan.aksi.catatan")}</label>
              <textarea id={`catatan-${k.id}`} name="catatan" rows={2} />
            </div>
            <button type="submit" className="pin-btn pin-go">
              {s("pimpinan.aksi.putuskan")}
            </button>
          </form>
        ) : null}
      </section>
    </article>
  );
}

/**
 * WHERE THE EVIDENCE LIVES, AS A TELLING, THROUGH A DECLARED MAP.
 *
 * `source_table` is a table name and must never render. It is looked up rather
 * than interpolated into a key, and the difference is not stylistic: composing
 * `pimpinan.sumber.${table}` would build a key that does not exist the first
 * time WP2 declares a second decision family, and `t()` would be handed an
 * undefined row at render time. A source with no entry here draws no line at
 * all — the honest answer, and one that cannot leak the name through a
 * plausible fallback.
 */
const SUMBER: Record<string, string> = {
  integrity_signals: "pimpinan.sumber.integrity_signals",
};
