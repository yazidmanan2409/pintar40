import Link from "next/link";
import Ikon from "@/components/Ikon";
import { redirect } from "next/navigation";
import { t, type HleEvent } from "@/lib/hle";
import { appUrl } from "@/lib/env";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { peranSaya } from "@/lib/tur-negara";
import { personaPembelajaran } from "@/lib/pembelajaran";
import { BarisLingkup } from "@/components/bukti";
import KartuSertifikat from "@/components/sertifikat/KartuSertifikat";
import LembarA4 from "@/components/sertifikat/LembarA4";
import SalinTautan from "@/components/sertifikat/SalinTautan";
import AksiCetak from "@/components/sertifikat/AksiCetak";
import type { KonteksSertifikat } from "@/lib/sertifikat-lembar";
import {
  certificateForSession, myCertificates, institutionNames, replacementFor, issueIfEligible,
  rendersCredential, rendersVerification, layoutFor, tugasSertifikatSaya,
} from "@/lib/sertifikat";
import KakiPintar from "@/components/KakiPintar";
import { judulHalaman } from "@/lib/judul-halaman";
import { namaBerkas } from "@/lib/nama-berkas";

export const generateMetadata = judulHalaman("/belajar/[tugas]/sertifikat");

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
 * becomes the page: the shell, the on-screen card, the actions and the well
 * step aside under `@media print` and exactly one A4 leaves the printer with
 * the name from the snapshot (DAISY-36; Daisy's cetak-usulan.css).
 */
export const dynamic = "force-dynamic";

export default async function SertifikatTugas({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const viewer = await currentViewer();
  if (!viewer) redirect(`/masuk?lanjut=/belajar/${tugas}/sertifikat`);

  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  // my_cycle_state answers while the chapter is still assigned to the learner. Once it is not (a new school year
  // carried the class on, or a transfer), the learner's own certificate for this chapter is found through their own
  // sitting (tugasSertifikatSaya, cross-batch 6 Nov), never through today's assignment: it stays theirs to open, issued
  // or revoked. No certificate is issued on that path (it only opens one that exists).
  const state = await engine.cycleState(db, tugas).catch(() => null);
  let sessionId = state?.post_session ?? null;
  if (!sessionId) {
    const milik = await myCertificates();
    const tugasDari = await tugasSertifikatSaya(milik.map((c) => c.session_id));
    sessionId = milik.find((c) => tugasDari.get(c.session_id) === tugas)?.session_id ?? null;
  }

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
  if (row) await layoutFor(row.institution_id);

  // CR-02 (D-078(c), D-077(d)): the school and the course are the certificate's own, sealed when it was prepared, never
  // read from today's school or today's assignment. Before a certificate exists (the pending page) the course is the
  // assignment's, which is what the learner is waiting on.
  const assignments = await engine.myAssignments(db);
  const assignment = assignments.find((a) => a.learning_assignment_id === tugas);
  const sealedCourse = detail?.course_title_as_issued
    ? [detail.course_subject_as_issued, detail.course_title_as_issued].filter(Boolean).join(" · ")
    : null;
  const course = sealedCourse ?? (assignment ? `${assignment.subject} · ${assignment.title}` : s("sertifikat.judul"));
  const institution = detail?.institution_as_issued
    ?? (row ? (await institutionNames([row.institution_id])).get(row.institution_id) ?? null : null);
  // the certificate's language is fixed at issuance; the page around it stays in the reader's
  const bahasaSertifikat = detail?.language_as_issued === "en" ? "en" : "id";

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
        <main id="isi" tabIndex={-1} className="pin-col">
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
        </main>
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

  // The sheet's accent follows the kind of learning (Daisy §5: plum academic, sage professional learning). NO READ
  // THIS PAGE MAKES SAYS WHICH KIND IT WAS, and the Experience is held never to know it (UX1-AJAR-KONTEKS-01): the
  // certificate's own eleven fields do not carry it, the learner's assignments do not, and a learner reads no course
  // row. So every sheet takes the academic plum, the courses' own default, until the certificate's sealed record
  // carries its accent (registered in the B6C hand-off, not decided here).
  const konteks: KonteksSertifikat = "akademik";
  // DAISY-36(3): the saved PDF's name, in the certificate's language; the course, never the person
  // E-D2-1: the title the saved PDF is named by, made a name every system can hold (namaBerkas)
  const judulBerkas = namaBerkas(t("sertifikat.berkas", "learner", { locale: bahasaSertifikat }).replace("{kursus}", course));

  return (
    <>
      <CangkangPengalaman locale={locale} current="sertifikat" />
      <main id="isi" tabIndex={-1} className="pin-col">
        {back}

        {detail.status === "REVOKED" ? (
          <div className="pin-banner pin-neutral pin-noprint" role="status">
            <Ikon nama="info" />
            <h2>{s("sertifikat.dicabut.judul")}</h2>
            <p>{s("sertifikat.dicabut.arti")}</p>
            <p>{s("sertifikat.dicabut.bantuan")}</p>
          </div>
        ) : null}

        {detail.status === "SUPERSEDED" ? (
          <div className="pin-banner pin-info pin-noprint" role="status">
            <Ikon nama="info" />
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

        {/* the on-screen card steps aside in print wherever the sheet is printed (DAISY-36): one copy, the sheet */}
        <div className={issued ? "pin-noprint" : undefined}>
          <KartuSertifikat cred={cred} locale={bahasaSertifikat} />
        </div>

        {issued ? (
          <>
            <div className="pin-actions pin-noprint">
              <AksiCetak label={s("sertifikat.cetak")} judulBerkas={judulBerkas} />
              <SalinTautan url={verificationUrl!} locale={locale} />
            </div>

            <div className="pin-head pin-noprint" style={{ marginTop: "var(--space-9)" }}>
              <p className="pin-eyebrow pin-noprint">{s("sertifikat.cetak.eyebrow")}</p>
              <h2 className="pin-h1 pin-noprint">{s("sertifikat.cetak.judul")}</h2>
              <p className="pin-intro pin-noprint">{s("sertifikat.cetak.arti")}</p>
            </div>
            <LembarA4>
              <KartuSertifikat cred={cred} locale={bahasaSertifikat} variant="sheet" konteks={konteks} />
            </LembarA4>
          </>
        ) : null}

        <div className="pin-noprint">
          <BarisLingkup scope={{ institution }} locale={locale} />
        </div>

        {/* pin-noprint: the printed sheet is only the sheet. Its issuer is the school, named in «Diterbitkan oleh»;
            PINTAR appears on it once, as the wordmark in its frozen slot (D-120 Q16, D-160(a)), never as this
            corporate footer. */}
        <KakiPintar className="pin-noprint" />
      </main>
    </>
  );
}

async function Refusal({ locale }: { locale: Awaited<ReturnType<typeof currentLocale>> }) {
  // UX-46: the way back is to the certificates the learner came from, and it says so («Kembali ke Sertifikat»);
  // W2.16 (DAISY-35 item 2): and it speaks to the reader's own context
  const persona = personaPembelajaran(await peranSaya());
  return (
    <>
      <CangkangPengalaman locale={locale} current="sertifikat" />
      <HalamanPenolakan locale={locale} persona={persona} backHref="/belajar/sertifikat" backKey="tolak.kembali_sertifikat" />
    </>
  );
}
