import { t, type HleEvent, type Locale } from "@/lib/hle";
import { kunciGagal, type JawabanAktivasi, type ModeAktivasi } from "./hasil";

/**
 * WHAT THE ADMINISTRATOR READS AFTER EACH ACTIVATION (DAISY-09, D-019).
 *
 * Every success says what was made, that PINTAR sent nothing, and what the
 * person does next at /masuk: type the address for an email account, or choose
 * the class card and type the number and PIN for a card. A failure is one
 * plain sentence for the path that was taken (./hasil.ts), never the server's
 * own text.
 *
 * Presentational only, so the guard can render each outcome as it is drawn.
 */
export default function HasilAktivasi({ locale, mode, jawaban, surel, nama }: {
  locale: Locale;
  mode: ModeAktivasi;
  /** The route's answer; null when none came back. */
  jawaban: JawabanAktivasi | null;
  /** The address sent, for an email account and a new person. */
  surel?: string;
  /** The name sent, for a new person. */
  nama?: string;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });

  if (!jawaban?.ok) {
    return <p className="pin-msg pin-msg-err" role="alert">{s(kunciGagal(mode, jawaban))}</p>;
  }

  if (mode === "CLASSROOM_CARD") {
    return (
      <div className="pin-akt-hasil" role="status">
        <p>
          {s("aktivasi.kartu_dibuat")} <strong className="pin-num">{jawaban.card}</strong> · PIN{" "}
          <strong className="pin-num">{jawaban.pin}</strong>
        </p>
        <p className="pin-meta">{s("aktivasi.kartu_arti")}</p>
      </div>
    );
  }

  return (
    <div className="pin-akt-hasil" role="status">
      <p>
        {mode === "NEW_PERSON" && nama ? <><strong>{nama}</strong> · </> : null}
        {s("aktivasi.surel_dibuat")} <strong>{surel}</strong>
      </p>
      <p className="pin-meta">{s(mode === "NEW_PERSON" ? "aktivasi.baru.ok" : "aktivasi.surel_arti")}</p>
    </div>
  );
}
