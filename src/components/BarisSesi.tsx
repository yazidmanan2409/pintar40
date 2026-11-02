import { t, type Locale, type Persona } from "@/lib/hle";
import Ikon from "@/components/Ikon";

/**
 * WHO IS SIGNED IN, AND THE WAY OUT (DAISY-02, D-009).
 *
 * Until now only Konfigurasi had a "Keluar", so on a shared classroom tablet
 * the next child simply carried on as the previous one (audit B5). This strip
 * goes on every signed-in screen, in the header row where it is on screen
 * before anything else is.
 *
 * ═══ IT NAMES STAFF AND NEVER A LEARNER ═══
 *
 * A staff member is shown their own name, because "am I signed in as me?" is
 * the question the strip exists to answer. A learner's screen never names
 * anybody (S15): a shared device shows this to whoever picks it up, and
 * "Masuk sebagai Nadia" tells the next child in the queue who used it last.
 * The learner is asked the question that matters on a shared device instead,
 * "Bukan akun Anda?", without any name in it.
 *
 * That choice is made by the CALLER, which passes `nama` or passes null. This
 * component is pure on purpose: it draws exactly what it is handed, so a
 * learner's screen cannot show a name that was never passed to it, and the
 * guard can render it without a database.
 *
 * ═══ AND IT IS A REAL FORM ═══
 *
 * A POST to /keluar, the route that ends the session, with a real submit
 * button: it works before JavaScript loads, on a slow tablet, and a screen
 * reader announces it as a button called "Keluar", described by the line
 * beside it.
 */
export default function BarisSesi({
  locale,
  persona,
  nama,
  varian = "kepala",
}: {
  locale: Locale;
  persona: Persona;
  /** The staff member's display name, or null. Never a learner's. */
  nama: string | null;
  /** In a header row, or on the refusal page. */
  varian?: "kepala" | "penolakan";
}) {
  const s = (k: "sesi.label" | "sesi.sebagai" | "sesi.bukan_anda" | "sesi.keluar" | "sesi.akun") => t(k, persona, { locale });
  // One strip per page, but the two variants never share an id either way.
  const idKet = `pin-sesi-ket-${varian}`;
  return (
    <div className={`pin-sesi pin-sesi-${varian}`} role="group" aria-label={s("sesi.label")}>
      <span id={idKet} className="pin-sesi-ket" title={nama ?? undefined}>
        {nama ? (
          <>
            {s("sesi.sebagai")} <strong>{nama}</strong>
          </>
        ) : (
          s("sesi.bukan_anda")
        )}
      </span>
      {/* DAISY-20: Akun saya — the PINTAR ID and card — for the reader the strip
          names, which is a staff reader and never a learner (C17). */}
      {nama ? <a className="pin-sesi-akun" href="/akun">{s("sesi.akun")}</a> : null}
      <form action="/keluar" method="post">
        <button type="submit" className="pin-sesi-keluar" aria-describedby={idKet}>
          {/* W3.3: Daisy's 08 row — «Keluar» is the quiet button with the log-out icon (one meaning per icon) */}
          <Ikon nama="log-out" />
          {s("sesi.keluar")}
        </button>
      </form>
    </div>
  );
}
