import { appUrl } from "@/lib/env";
import { TAMPERED, type VerificationResponse } from "@/lib/certificates/verification";
import { t } from "@/lib/hle";

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
 */
export const dynamic = "force-dynamic";

export default async function VerifikasiPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
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

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold">{t("verifikasi.judul")}</h1>

      {row === null ? (
        <p className="mt-6 rounded-lg bg-[--pintar-surface-muted] p-4">
          {t("verifikasi.tidak_ditemukan")}
        </p>
      ) : (
        <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
          <dt className="font-medium">{t("verifikasi.status")}</dt>
          <dd>{row.validity}</dd>
          <dt className="font-medium">{t("verifikasi.hasil")}</dt>
          <dd>{row.pass ? t("verifikasi.lulus") : t("verifikasi.belum_lulus")}</dd>
          <dt className="font-medium">{t("verifikasi.predikat")}</dt>
          <dd>{row.predikat}</dd>
          <dt className="font-medium">{t("verifikasi.institusi")}</dt>
          <dd>{row.institution}</dd>
          <dt className="font-medium">{t("verifikasi.tanggal")}</dt>
          <dd>{row.date}</dd>
        </dl>
      )}

      {row !== null && row.validity === TAMPERED ? (
        <p className="mt-6 rounded-lg bg-[--pintar-surface-muted] p-4">
          {t("verifikasi.tidak_sah")}
        </p>
      ) : null}

      <p className="mt-10 text-sm opacity-70">{t("verifikasi.catatan")}</p>
    </main>
  );
}
