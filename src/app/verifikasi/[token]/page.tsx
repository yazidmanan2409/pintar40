import { supabaseAnon } from "@/lib/supabase/anon";
import { t } from "@/lib/hle";

/**
 * THE public certificate verification route (INV-38). Exactly one exists. A
 * QR-friendly short path may only ever be a permanent redirect to this one.
 *
 * WHO READS. The anonymous principal, fixed: the anon key with no session
 * cookie, so a signed-in visitor and a stranger get the identical answer and
 * neither this page nor the service role is involved in producing it. `anon`
 * holds no table grant and can execute exactly one function — this projection
 * — declared in `public_surface_registry` and asserted both ways by
 * `assert_public_surface()`. Migration 0048 records why that grant exists and
 * what it cost.
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

type Verification = {
  pass: boolean | null;
  predikat: string | null;
  institution: string | null;
  date: string | null;
  validity: string | null;
};

export default async function VerifikasiPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = supabaseAnon();
  const { data, error } = await supabase.rpc("verify_certificate", { p_token: token });
  const row: Verification | null =
    !error && Array.isArray(data) && data.length > 0 ? (data[0] as Verification) : null;

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

      <p className="mt-10 text-sm opacity-70">{t("verifikasi.catatan")}</p>
    </main>
  );
}
