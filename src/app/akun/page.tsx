import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { peranSaya } from "@/lib/tur-negara";
import { PERAN_STAF } from "@/components/sesi";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import KakiPintar from "@/components/KakiPintar";
import AkunSaya from "@/components/aktifkan/AkunSaya";

export const dynamic = "force-dynamic";

/**
 * AKUN SAYA (DAISY-20, BOB-26 §4): the staff member's PINTAR ID, QR and card.
 *
 * STAFF ONLY, DECIDED BEFORE ANYTHING IS ASKED (C17). Students keep the class
 * card and see no PINTAR-ID screen in 4.0, so a reader without a staff role —
 * or whose roles could not be read — gets the one refusal page, and the card's
 * data is never requested for them. The route refuses them too
 * (`403 TIDAK_BERLAKU`); this is the page not asking.
 *
 * The shell is the reader's own: a teacher's, Management's, or the
 * administrators'.
 */
export default async function Akun() {
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const peran = await peranSaya();
  const staf = Boolean(peran?.some((p) => PERAN_STAF.includes(p)));
  if (!staf) {
    return <HalamanPenolakan messageKey="auth.not_yet" persona="public" locale={locale} backHref="/" backKey="entry.title" />;
  }
  const kind = peran!.includes("EDUCATOR") ? "pengajar"
    : peran!.some((p) => p === "HEAD_OF_DEPARTMENT" || p === "DEAN") ? "pimpinan"
      : "pendataan";

  return (
    <>
      <CangkangPengalaman locale={locale} kind={kind} />
      <main className="pin-col">
        <div className="pin-head">
          <h1 className="pin-h1">{s("akun.judul")}</h1>
          <p className="pin-intro">{s("akun.intro")}</p>
        </div>
        <AkunSaya locale={locale} />
        <KakiPintar />
      </main>
    </>
  );
}
