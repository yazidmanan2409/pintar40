import Link from "next/link";
import { redirect } from "next/navigation";
import { t, type HleEvent } from "@/lib/hle";
import { appUrl } from "@/lib/env";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { BarisLingkup } from "@/components/bukti";
import KartuSertifikat from "@/components/sertifikat/KartuSertifikat";
import LembarA4 from "@/components/sertifikat/LembarA4";
import SalinTautan from "@/components/sertifikat/SalinTautan";
import AksiCetak from "@/components/sertifikat/AksiCetak";
import {
  certificateForSession, myCertificates, institutionNames, replacementFor, issueIfEligible,
  rendersCredential, rendersVerification, layoutFor,
} from "@/lib/sertifikat";
import KakiPintar from "@/components/KakiPintar";

/**
 * The learner's certificate for one learning assignment.
 *
 * FOUR STATES, AND THE DIFFERENCE BETWEEN THEM IS THE DESIGN.
 *
 *   ELIGIBLE     "Sertifikat sedang disiapkan". No QR, no verification link, no
 *                copy action, no print action, no certificate number and no
 *                name-as-issued. Shown while the system's issuance has not yet
 *                sealed the certificate; each load asks it again (V-6a closed,
 *                `issueIfEligible` in src/lib/sertifikat.ts).
 *   ISSUED       the credential, with the QR, the link, print and copy.
 *   REVOKED      the credential beneath a "dicabut oleh penerbit" banner, and
 *                no QR, link, copy or print: a revoked row is a retained
 *                record, not a credential to present. The reason is NOT shown
 *                to the learner beyond that sentence.
 *   SUPERSEDED   the same, beneath a "digantikan" banner whose one primary
 *                action opens the replacement — found by following the chain
 *                through the list read, because the schema has no forward
 *                pointer (see src/lib/sertifikat.ts, fact 2).
 *
 * `my_certificate` DOES NOT FILTER BY STATUS, so the ELIGIBLE binding is
 * applied to its result too, not only to the list's.
 *
 * The A4 sheet is rendered for ISSUED only, and print is where the sheet
 * becomes the page: the shell, the actions and the well step aside under
 * `@media print` and one A4 leaves the printer with the name from the snapshot.
 */
export const dynamic = "force-dynamic";

export default async function SertifikatTugas({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const viewer = await currentViewer();
  if (!viewer) redirect(`/masuk?lanjut=/belajar/${tugas}/sertifikat`);

  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const state = await engine.cycleState(db, tugas);
  const sessionId = state.post_session;

  // No session, no certificate, and no way to tell the two apart from here:
  // the same refusal as an assignment that is not this learner's (P7).
  if (!sessionId) return <Refusal locale={locale} />;

  // V-6a closed: a passed, certifying session that has no sealed certificate yet
  // asks the system to issue one on every load (doc 04 §7's retry clause).
  let detail = await certificateForSession(sessionId).catch(() => null);
  const passed = (await engine.outcome(db, sessionId).catch(() => null))?.lulus === true;
  if (passed && (!detail || !rendersCredential(detail.status))) {
    await issueIfEligible(sessionId);
    detail = await certificateForSession(sessionId).catch(() => null);
  }
  if (!detail && !passed) return <Refusal locale={locale} />;

  const all = await myCertificates();
  const row = detail ? all.find((c) => c.id === detail!.certificate_id) ?? null : null;
  const institutions = await institutionNames(row ? [row.institution_id] : []);
  const institution = row ? institutions.get(row.institution_id) ?? null : null;
  if (row) await layoutFor(row.institution_id);

  const assignments = await engine.myAssignments(db);
  const assignment = assignments.find((a) => a.learning_assignment_id === tugas);
  const course = assignment ? `${assignment.subject} · ${assignment.title}` : s("sertifikat.judul");

  const back = (
    <Link className="pin-back pin-noprint" href="/belajar/sertifikat">
      ← {s("sertifikat.kembali")}
    </Link>
  );

  // ---------------------------------------------------------------- ELIGIBLE
  if (!detail || !rendersCredential(detail.status)) {
    return (
      <>
        <CangkangPengalaman locale={locale} current="sertifikat" />
        <div className="pin-col">
          {back}
          <section className="pin-pending">
            <div className="pin-dots" aria-hidden="true"><i /><i /><i /></div>
            <p className="pin-eyebrow">{course}</p>
            <h2>{s("sertifikat.disiapkan.judul")}</h2>
            <p>{s("sertifikat.disiapkan.arti")}</p>
            <p>{s("sertifikat.disiapkan.tenang")}</p>
            <div className="pin-actions">
              <Link className="pin-btn" href={`/belajar/${tugas}/hasil`}>
                {s("sertifikat.disiapkan.hasil")}
              </Link>
            </div>
          </section>

          <KakiPintar className="pin-noprint" />
        </div>
      </>
    );
  }

  const issued = rendersVerification(detail.status);
  const verificationUrl = issued
    ? `${appUrl()}/verifikasi/${encodeURIComponent(detail.verification_token)}`
    : null;

  const cred = {
    institution,
    nameAsIssued: detail.name_as_issued,
    course,
    predikat: detail.predikat,
    issuedAtIso: detail.issued_at_iso,
    certificateNumber: detail.certificate_number,
    verificationUrl,
  };

  const replacement = row ? replacementFor(row, all) : null;

  return (
    <>
      <CangkangPengalaman locale={locale} current="sertifikat" />
      <div className="pin-col">
        {back}

        {detail.status === "REVOKED" ? (
          <div className="pin-banner pin-neutral pin-noprint" role="status">
            <h2>{s("sertifikat.dicabut.judul")}</h2>
            <p>{s("sertifikat.dicabut.arti")}</p>
            <p>{s("sertifikat.dicabut.bantuan")}</p>
          </div>
        ) : null}

        {detail.status === "SUPERSEDED" ? (
          <div className="pin-banner pin-info pin-noprint" role="status">
            <h2>{s("sertifikat.digantikan.judul")}</h2>
            <p>{s("sertifikat.digantikan.arti")}</p>
            {replacement?.verification_token ? (
              <div className="pin-cta">
                {/* THE REPLACEMENT HAS NO LEARNER-SIDE DETAIL READ, and that is a
                    fact about the contract rather than a choice here. A
                    replacement carries a non-null `supersedes_certificate_id`,
                    so by the definition in `certificates_one_root_per_session`
                    it is the root of no session at all — and `my_certificate`
                    is per-session and root-only. Its own verification page is
                    the surface the contract does reach, it is authoritative
                    about the newer certificate, and the ten-column list already
                    carries the token that addresses it. */}
                <Link
                  className="pin-btn pin-primary"
                  href={`/verifikasi/${encodeURIComponent(replacement.verification_token)}`}
                >
                  {s("sertifikat.digantikan.buka")}
                </Link>
                <span className="pin-mono">{replacement.certificate_number ?? ""}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <KartuSertifikat cred={cred} locale={locale} />

        {issued ? (
          <>
            <div className="pin-actions pin-noprint">
              <AksiCetak label={s("sertifikat.cetak")} />
              <SalinTautan url={verificationUrl!} locale={locale} />
            </div>

            <div className="pin-head" style={{ marginTop: "var(--space-9)" }}>
              <p className="pin-eyebrow pin-noprint">{s("sertifikat.cetak.eyebrow")}</p>
              <h2 className="pin-h1 pin-noprint">{s("sertifikat.cetak.judul")}</h2>
              <p className="pin-intro pin-noprint">{s("sertifikat.cetak.arti")}</p>
            </div>
            <LembarA4>
              <KartuSertifikat cred={cred} locale={locale} variant="sheet" />
            </LembarA4>
          </>
        ) : null}

        <BarisLingkup scope={{ institution }} locale={locale} />

        {/* pin-noprint: the printed sheet carries the issuing institution's
            identity, never the software vendor's. */}
        <KakiPintar className="pin-noprint" />
      </div>
    </>
  );
}

function Refusal({ locale }: { locale: Awaited<ReturnType<typeof currentLocale>> }) {
  return (
    <>
      <CangkangPengalaman locale={locale} current="sertifikat" />
      <HalamanPenolakan locale={locale} backHref="/belajar/sertifikat" />
    </>
  );
}
