import { t, type HleEvent, type Locale } from "@/lib/hle";
import { kunciGagal, type JawabanAktivasi, type ModeAktivasi } from "./hasil";
import { alamatAktifkan, alamatMasuk } from "./alamat";
import BarisHasil from "@/components/BarisHasil";

type KeAlamatProps = {
  s: (k: HleEvent) => string;
  sebelum: HleEvent;
  /** The rest of the sentence; without it the sentence ends at the address. */
  sesudah?: HleEvent;
};

/** Words up to the place, the address (or the page's name), then the rest. */
function KeAlamat({ s, sebelum, sesudah, alamat, nama }: KeAlamatProps & { alamat: string | null; nama: HleEvent }) {
  return (
    <>
      {s(sebelum)} {alamat ? <strong className="pin-num">{alamat}</strong> : s(nama)}
      {sesudah ? s(sesudah) : "."}
    </>
  );
}

/**
 * A sentence that sends the person to sign in (polish batch 2, UX-11): its
 * words up to the place, the environment's sign-in address, then the rest.
 * With no address it names «halaman Masuk PINTAR». Words from the copy table;
 * the address is the environment's, never typed here. A class card is used
 * there.
 */
export function KeMasuk(p: KeAlamatProps) {
  return <KeAlamat {...p} alamat={alamatMasuk()} nama="aktivasi.halaman_masuk" />;
}

/**
 * The same, to «Aktifkan akun PINTAR Anda» (D-019 amended by D-054): where an
 * email account starts, types its address and is sent its code. With no
 * address it names «halaman Aktifkan akun PINTAR».
 */
export function KeAktifkan(p: KeAlamatProps) {
  return <KeAlamat {...p} alamat={alamatAktifkan()} nama="aktivasi.halaman_aktifkan" />;
}

/**
 * WHAT THE ADMINISTRATOR READS AFTER EACH ACTIVATION (DAISY-09, D-019).
 *
 * Every success says what was made, that PINTAR sent nothing, and what the
 * person does next (D-019 amended by D-054): an email account opens «Aktifkan
 * akun PINTAR Anda» and types its address, and its code is sent then; a card
 * holder opens /masuk, chooses the class card and types the number and PIN. A failure is one
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
        <KeAktifkan s={s} sebelum={mode === "NEW_PERSON" ? "aktivasi.baru.ok" : "aktivasi.surel_arti"}
          sesudah={mode === "NEW_PERSON" ? "aktivasi.baru.ok.lalu" : "aktivasi.surel_arti.lalu"} />
      </p>
    </BarisHasil>
  );
}
