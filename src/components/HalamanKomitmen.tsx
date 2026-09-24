import { t, type Locale, type Persona, type Stage } from "@/lib/hle";

export type Fakta = { label: string; value: string };

/**
 * HalamanKomitmen — the commitment shell.
 *
 * P7, and the three rules that make it one component rather than a convention:
 *
 *   1. THE CONSEQUENCE SENTENCE SITS ABOVE THE ACTION, always, and it is
 *      required by the props. A consequence a reader meets after committing is
 *      not a consequence, it is a surprise.
 *   2. THE PRIMARY ACTION'S LABEL REPEATS THE VERB of the consequence. "OK" is
 *      not a commitment; "Kumpulkan Uji Penguasaan" is.
 *   3. NO MODAL. Looking and committing are different gestures, and a dialogue
 *      that traps a reader on a decision is the opposite of calm. There is
 *      always a way back, and it is a real link to a real page.
 *
 * The facts above the sentence are what the reader is committing ABOUT — how
 * many answered, how many not, how many flagged. They are read from the server;
 * this component counts nothing.
 */
export default function HalamanKomitmen({
  eyebrow,
  heading,
  consequence,
  facts = [],
  action,
  back,
  locale = "id",
  persona = "learner",
  stage,
}: {
  eyebrow?: string;
  heading: string;
  consequence: string;
  facts?: Fakta[];
  /** The primary action. Its label must repeat the verb in `heading`. */
  action: React.ReactNode;
  /** The way back. A link, never a dismissal. */
  back: React.ReactNode;
  locale?: Locale;
  persona?: Persona;
  stage?: Stage;
}) {
  void t; void persona; void stage; void locale;
  return (
    <section className="pin-commit">
      {eyebrow ? <p className="pin-eyebrow">{eyebrow}</p> : null}
      <h2>{heading}</h2>
      {facts.length > 0 ? (
        <dl className="pin-facts">
          {facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd className="pin-num">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {/* the consequence, above the action, always */}
      <p className="pin-intro">{consequence}</p>
      <div className="pin-actions">
        {action}
        {back}
      </div>
    </section>
  );
}
