import { appUrl } from "@/lib/env";
import { TAMPERED, type VerificationResponse } from "@/lib/certificates/verification";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import { judulHalaman } from "@/lib/judul-halaman";
import { tanggal } from "@/lib/tanggal";

export const generateMetadata = judulHalaman("/verifikasi/[token]");

/**
 * THE public certificate verification route (INV-38). Exactly one exists. A
 * QR-friendly short path may only ever be a permanent redirect to this one.
 *
 * THIS PAGE RENDERS; IT DOES NOT DECIDE. The verification itself — recomputing
 * the HMAC over the stored canonical payload with a timing-safe compare — runs
 * at `/api/verifikasi/[token]`, which is the one place that holds the signing
 * key and the one place F01-S03 permits the service-role client. This page
 * fetches that endpoint and displays what it returns. There is exactly one
 * implementation of "is this certificate valid", and the page is not it.
 *
 * `anon` executes no database function and holds SELECT on one view. Both the
 * route and its endpoint are declared in `public_surface_registry`, counted by
 * the lint and asserted by `assert_public_surface()` and F04-S01. Migration
 * 0051 and ADR-0013 record why this replaced the anon-executable projection.
 *
 * WHAT IT SHOWS, AND WHAT IT CANNOT. doc 02's Verification Record enumerates
 * the public-safe read and doc 05's matrix cell says "only": pass, predikat,
 * institution, date, validity. The learner's NAME IS NOT IN IT, and no
 * exception clause exists anywhere in the baseline. A verifier holds the
 * certificate, which carries the holder identity rendered from the immutable
 * snapshot; this route confirms that *this credential* is valid. The exclusion
 * is structural, not a template omission: `verify_certificate` does not read
 * the snapshot's name or photo columns at all, and `assert_public_surface()`
 * fails the build if it ever does.
 *
 * UX-1 SLICE 1. Re-set on the v2 foundations; the behaviour is unchanged and
 * the response is still exactly the five fields. Three things about the telling:
 *
 *  - THE STATUS IS THE HERO, as a word in the reader's own language. It used to
 *    render `row.validity` — the raw token BERLAKU, DICABUT, DIGANTIKAN — into a
 *    definition list, which is the enum-in-a-text-position that F06-S03 exists
 *    to refuse and which a stranger has no way to read. It is now an HLE key,
 *    with the sentence that says what the word means for them.
 *  - TIDAK SAH SHOWS THE STATUS ONLY. The five fields are still received
 *    unchanged — this page asks for nothing different — but a page that printed
 *    the issuer, the date and the predikat underneath a red "data tidak cocok"
 *    would be presenting a forged certificate's own claims as facts. So the
 *    facts render for BERLAKU, DICABUT and DIGANTIKAN, and not for TIDAK SAH.
 *  - THE LANGUAGE SWITCH IS ON THE PAGE, because the reader here has no
 *    account to hold a preference in. It changes only text and number
 *    formatting; the request to the endpoint is byte-identical (UX1-S0-LANG-01).
 *
 * NOT FOUND, NOT YET ISSUED AND MALFORMED ARE ONE STATE, as they are at the
 * endpoint: `verify_certificate` and `certificate_verification_material` apply
 * the same refusals in the same order, so there is no existence oracle to leak
 * and this page has no branch that could build one.
 */
export const dynamic = "force-dynamic";

/** The database says ISSUED / REVOKED / SUPERSEDED; the verifier may downgrade. */
const STATUS_KEY: Record<string, { word: HleEvent; meaning: HleEvent; tone: string }> = {
  BERLAKU: { word: "verifikasi.status.BERLAKU", meaning: "verifikasi.status.BERLAKU.arti", tone: "" },
  DICABUT: { word: "verifikasi.status.DICABUT", meaning: "verifikasi.status.DICABUT.arti", tone: "pin-neutral" },
  DIGANTIKAN: { word: "verifikasi.status.DIGANTIKAN", meaning: "verifikasi.status.DIGANTIKAN.arti", tone: "pin-info" },
  [TAMPERED]: { word: "verifikasi.status.TIDAK_SAH", meaning: "verifikasi.tidak_sah", tone: "pin-blocked" },
};

export default async function VerifikasiPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale: Locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "public", { locale });

  // Server-side fetch of this app's own verification endpoint. `no-store`
  // because a revocation must take effect on the next load, not on the next
  // cache expiry — a cached BERLAKU for a revoked certificate is the same
  // defect this route was repaired to remove.
  let row: VerificationResponse | null = null;
  try {
    const res = await fetch(`${appUrl()}/api/verifikasi/${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (res.ok) row = (await res.json()) as VerificationResponse;
  } catch {
    // an unreachable endpoint renders "not found" rather than a valid-looking
    // page: this surface never reports validity it did not obtain
    row = null;
  }

  const status = row?.validity ? STATUS_KEY[row.validity] : undefined;
  const showsFacts = row !== null && status !== undefined && row.validity !== TAMPERED;

  return (
    <>
      <CangkangPengalaman locale={locale} kind="public" />
      <main id="isi" tabIndex={-1} className="pin-col pin-narrow">
        <div className="pin-head">
          <p className="pin-eyebrow">{s("verifikasi.eyebrow")}</p>
          <h1 className="pin-h1">{s("verifikasi.judul")}</h1>
          <p className="pin-intro">{s("verifikasi.intro")}</p>
        </div>

        {status ? (
          <section className={`pin-status ${status.tone}`}>
            <p className="pin-eyebrow">{s("verifikasi.status")}</p>
            <p className="pin-big">{s(status.word)}</p>
            <p>{s(status.meaning)}</p>
          </section>
        ) : (
          <section className="pin-status pin-neutral">
            <p className="pin-eyebrow">{s("verifikasi.status")}</p>
            <p className="pin-big pin-quietbig">{s("verifikasi.tidak_ditemukan")}</p>
            <p>{s("verifikasi.tidak_ditemukan.arti")}</p>
          </section>
        )}

        {showsFacts ? (
          <dl className="pin-dl">
            <div>
              <dt>{s("verifikasi.hasil")}</dt>
              <dd>{row!.pass ? s("verifikasi.lulus") : s("verifikasi.belum_lulus")}</dd>
            </div>
            {/* D-121(a): no descriptor below 70%; a certificate without one shows no descriptor line */}
            {row!.predikat ? (
              <div>
                <dt>{s("verifikasi.predikat")}</dt>
                <dd>{row!.predikat}</dd>
              </div>
            ) : null}
            <div>
              <dt>{s("verifikasi.institusi")}</dt>
              <dd>{row!.institution ?? "—"}</dd>
            </div>
            <div>
              <dt>{s("verifikasi.tanggal")}</dt>
              <dd className="pin-num">{row!.date ? tanggal(row!.date, "baca", locale) : "—"}</dd>
            </div>
          </dl>
        ) : null}

        <p className="pin-foot">{s("verifikasi.catatan")}</p>

        {/* Provenance, not a field. The five-field response is untouched: this
            says who operates the service a stranger just used, and adds
            nothing to what was verified. */}
        <KakiPintar />
      </main>
    </>
  );
}
