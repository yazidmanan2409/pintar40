import { t, format, type Locale } from "@/lib/hle";
import { ukuranNomor, tautanCetak, type KonteksSertifikat } from "@/lib/sertifikat-lembar";
import KodeVerifikasi from "./KodeVerifikasi";
import MerekSertifikat from "./MerekSertifikat";

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
 *
 * TWO DRAWINGS OF THE SAME CREDENTIAL, from the same `cred`: the on-screen card
 * (`screen`), and the A4 sheet (`sheet`), which is Daisy's frozen composition
 * (sertifikat/ronde-2; D-076, D-120 Q16, D-160) — see `LembarSertifikat` below.
 */
export default function KartuSertifikat({
  cred,
  locale,
  variant = "screen",
  konteks = "akademik",
}: {
  cred: Kredensial;
  locale: Locale;
  variant?: "screen" | "sheet";
  /** The accent's learning context (Daisy §5); only the sheet draws it. */
  konteks?: KonteksSertifikat;
}) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "learner", { locale });
  if (variant === "sheet") return <LembarSertifikat cred={cred} locale={locale} konteks={konteks} />;
  return (
    <article className="pin-cert">
      <div>
        {cred.institution ? <p className="pin-inst">{cred.institution}</p> : null}
        <div className="pin-rule" aria-hidden="true" />
      </div>

      <div>
        <p className="pin-eyebrow">{s("sertifikat.jenis")}</p>
        <h1 className="pin-name">{cred.nameAsIssued}</h1>
        <p className="pin-done">{s("sertifikat.diberikan")}</p>
        <p className="pin-course">{cred.course}</p>
      </div>

      <hr />

      <div>
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
            <hr />
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
    </article>
  );
}

/**
 * THE A4 SHEET, AS DESIGNED (Daisy, sertifikat/ronde-2; the grid in src/lib/sertifikat-lembar.ts, the millimetres
 * in `.pin-sheet`). Achievement → Issuer → Verification, on one A4 portrait page:
 *
 *   header        «SERTIFIKAT PENGUASAAN» in the accent, upper left; the wordmark slot upper right (MerekSertifikat,
 *                 D-160(a): today's approved logo, artwork and never live text)
 *   achievement   the name as issued, «telah menuntaskan», the course; centred
 *   record        Predikat (only when there is one, D-121(a)), Tanggal terbit, Nomor sertifikat, labels meeting the
 *                 values at the page's axis; the number one unbroken value, stepping down the ladder only when long
 *   the line      gold, at 176 mm, 0.75 mm, on the band's top edge
 *   issuer        the band in the accent: «Diterbitkan oleh» over the school's name as recorded — text, no school
 *                 logo (D-160(c))
 *   verification  «Periksa keaslian», its sentence, the printed link; the QR (level Q, D-160(b)) beside them
 *
 * NOTHING ELSE IS DRAWN (Daisy §1, D-076, D-085 T4, D-086(e)): no picture of the holder, no school logo, no
 * signature, seal, border, watermark or flourish. The only images on the sheet are the wordmark slot and the QR.
 * The verification group exists only for an ISSUED certificate, as on screen (`verificationUrl` is null otherwise).
 */
function LembarSertifikat({ cred, locale, konteks }: { cred: Kredensial; locale: Locale; konteks: KonteksSertifikat }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "learner", { locale });
  const pt = ukuranNomor(cred.certificateNumber);
  const nomorKelas = pt === 12 ? "pin-s-nomor" : `pin-s-nomor pin-s-nomor-${String(pt).replace(".", "")}`;
  // the course's middle dot stays with the subject: a line never starts «· Bab 5» (Daisy §1)
  const kursus = cred.course.replace(/ · /g, " · ");
  return (
    <div className={`pin-sheet ${konteks === "profesi" ? "pin-s-profesi" : "pin-s-akademik"}`}>
      <div className="pin-s-kepala">
        <p className="pin-s-jenis">{s("sertifikat.jenis")}</p>
        <MerekSertifikat />
      </div>

      <div className="pin-s-capaian">
        <h1 className="pin-name">{cred.nameAsIssued}</h1>
        <p className="pin-done">{s("sertifikat.diberikan")}</p>
        <p className="pin-course">{kursus}</p>
      </div>

      <dl className="pin-s-rekam">
        {/* D-121(a): no descriptor, no line — never a dash */}
        {cred.predikat ? (
          <div>
            <dt>{s("sertifikat.predikat")}</dt>
            <dd>{cred.predikat}</dd>
          </div>
        ) : null}
        <div>
          <dt>{s("sertifikat.tanggal")}</dt>
          <dd>{format.date(cred.issuedAtIso, locale)}</dd>
        </div>
        <div>
          <dt>{s("sertifikat.nomor")}</dt>
          <dd className={nomorKelas}>{cred.certificateNumber}</dd>
        </div>
      </dl>

      <div className="pin-s-garis" aria-hidden="true" />
      <div className="pin-s-pita">
        <p className="pin-s-label">{s("sertifikat.penerbit")}</p>
        {cred.institution ? <p className="pin-inst">{cred.institution}</p> : null}
      </div>

      {cred.verificationUrl ? (
        <div className="pin-s-periksa">
          <div className="pin-s-teks">
            <h3>{s("sertifikat.periksa.judul")}</h3>
            <p>{s("sertifikat.periksa.arti")}</p>
            <p className="pin-s-tautan">{tautanCetak(cred.verificationUrl)}</p>
          </div>
          <KodeVerifikasi url={cred.verificationUrl} label={s("sertifikat.periksa.judul")} cetak />
        </div>
      ) : null}
    </div>
  );
}
