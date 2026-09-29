import { t, type HleEvent, type Locale } from "@/lib/hle";
import { kunciGagal, type JawabanAktivasi, type ModeAktivasi } from "./hasil";
import { alamatMasuk } from "./alamat";
import BarisHasil from "@/components/BarisHasil";

/**
 * A sentence that sends the person to sign in (polish batch 2, UX-11): its
 * words up to the place, the environment's sign-in address, then the rest.
 * With no address it names «halaman Masuk PINTAR». Words from the copy table;
 * the address is the environment's, never typed here.
 */
export function KeMasuk({ s, sebelum, sesudah }: {
  s: (k: HleEvent) => string;
  sebelum: HleEvent;
  /** The rest of the sentence; without it the sentence ends at the address. */
  sesudah?: HleEvent;
}) {
  const alamat = alamatMasuk();
  return (
    <>
      {s(sebelum)} {alamat ? <strong className="pin-num">{alamat}</strong> : s("aktivasi.halaman_masuk")}
      {sesudah ? s(sesudah) : "."}
    </>
  );
}

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
    return <BarisHasil nada="gagal">{s(kunciGagal(mode, jawaban))}</BarisHasil>;
  }

  if (mode === "CLASSROOM_CARD") {
    return (
      <BarisHasil nada="ok" kelas="pin-akt-hasil">
        <p>
          {s("aktivasi.kartu_dibuat")} <strong className="pin-num">{jawaban.card}</strong> · PIN{" "}
          <strong className="pin-num">{jawaban.pin}</strong>
        </p>
        <p className="pin-meta"><KeMasuk s={s} sebelum="aktivasi.kartu_arti" sesudah="aktivasi.kartu_arti.lalu" /></p>
      </BarisHasil>
    );
  }

  return (
    <BarisHasil nada="ok" kelas="pin-akt-hasil">
      <p>
        {mode === "NEW_PERSON" && nama ? <><strong>{nama}</strong> · </> : null}
        {s("aktivasi.surel_dibuat")} <strong>{surel}</strong>
      </p>
      <p className="pin-meta">
        <KeMasuk s={s} sebelum={mode === "NEW_PERSON" ? "aktivasi.baru.ok" : "aktivasi.surel_arti"}
          sesudah={mode === "NEW_PERSON" ? "aktivasi.baru.ok.lalu" : "aktivasi.surel_arti.lalu"} />
      </p>
    </BarisHasil>
  );
}
