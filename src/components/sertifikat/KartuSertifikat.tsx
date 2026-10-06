import { t, format, type Locale } from "@/lib/hle";
import KodeVerifikasi from "./KodeVerifikasi";

export type Kredensial = {
  institution: string | null;
  /** Q-7: no column carries an institution mark yet, so nothing is drawn. */
  markUrl?: string | null;
  nameAsIssued: string;
  course: string;
  predikat: string | null;
  issuedAtIso: string;
  certificateNumber: string;
  verificationUrl: string | null;
};

/**
 * The credential block: who issued it, to whom, for what, and how to check it.
 *
 * WHAT IT NEVER RENDERS. No signature, no key version, no canonical payload, no
 * snapshot id, no score and no engine or scoring-policy version — none of which
 * is fetched by the reads behind this (see src/lib/sertifikat.ts). No photo
 * either: OD-10 is open and `certificate_templates_identity_is_name_only`
 * constrains the presentation to NAME_ONLY, so the photo slot renders nothing.
 *
 * NO PLACEHOLDER INSTITUTION MARK (Q-7). A grey square or a PINTAR logo where a
 * school's mark belongs is a claim the school did not make. When the column
 * arrives, `markUrl` arrives with it.
 *
 * THE NAME IS THE ONE FROM THE SNAPSHOT (INV-30), passed in from
 * `my_certificate`'s `name_as_issued`. A later profile change does not alter an
 * issued certificate, and this component has no access to a current profile to
 * accidentally prefer.
 *
 * `verificationUrl` is null for every state except ISSUED, and the whole verify
 * block disappears with it — see `rendersVerification` and the note on ELIGIBLE
 * in src/lib/sertifikat.ts.
 */
export default function KartuSertifikat({
  cred,
  locale,
  variant = "screen",
}: {
  cred: Kredensial;
  locale: Locale;
  variant?: "screen" | "sheet";
}) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "learner", { locale });
  const body = (
    <>
      <div className={variant === "sheet" ? "pin-s-top" : undefined}>
        {cred.institution ? <p className="pin-inst">{cred.institution}</p> : null}
        <div className="pin-rule" aria-hidden="true" />
      </div>

      <div className={variant === "sheet" ? "pin-s-mid" : undefined}>
        <p className="pin-eyebrow">{s("sertifikat.jenis")}</p>
        <h1 className="pin-name">{cred.nameAsIssued}</h1>
        <p className="pin-done">{s("sertifikat.diberikan")}</p>
        <p className="pin-course">{cred.course}</p>
      </div>

      {variant === "screen" ? <hr /> : null}

      <div className={variant === "sheet" ? "pin-s-low" : undefined}>
        <dl className="pin-facts">
          {/* D-121(a): PINTAR's descriptor has no band below 70%, so a learner who passed a lower school mark holds a
              certificate with no descriptor, and the line is absent rather than a dash */}
          {cred.predikat ? (
            <div>
              <dt>{s("sertifikat.predikat")}</dt>
              <dd>{cred.predikat}</dd>
            </div>
          ) : null}
          <div>
            <dt>{s("sertifikat.tanggal")}</dt>
            <dd className="pin-num">{format.date(cred.issuedAtIso, locale)}</dd>
          </div>
          <div>
            <dt>{s("sertifikat.nomor")}</dt>
            <dd className="pin-mono">{cred.certificateNumber}</dd>
          </div>
        </dl>

        {cred.verificationUrl ? (
          <>
            {variant === "screen" ? <hr /> : null}
            <div className="pin-verify">
              <KodeVerifikasi url={cred.verificationUrl} label={s("sertifikat.periksa.judul")} />
              <div>
                <h3>{s("sertifikat.periksa.judul")}</h3>
                <p>{s("sertifikat.periksa.arti")}</p>
                <code className="pin-chip">{cred.verificationUrl}</code>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );

  if (variant === "sheet") return <div className="pin-sheet">{body}</div>;
  return <article className="pin-cert">{body}</article>;
}
