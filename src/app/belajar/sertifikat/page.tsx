import Link from "next/link";
import { redirect } from "next/navigation";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import { BarisLingkup } from "@/components/bukti";
import { myCertificates, institutionNames, type CertificateRow } from "@/lib/sertifikat";
import KakiPintar from "@/components/KakiPintar";

/**
 * Sertifikat Anda — the learner's certificate list.
 *
 * THE READ IS THE TEN COLUMNS AND NOTHING ELSE (Q-11); the list lives once, in
 * `LIST_COLUMNS`, and UX1-S1-CERT-COLS-01 greps for it.
 *
 * A row is a link, not a credential: the subject and grade are the eyebrow, the
 * chapter is the title, and the date and status share one meta line — which on
 * a phone is where the status pill joins them. Nothing on this page renders a
 * certificate number, a verification link or a QR code, because a list is a way
 * to choose one, not a way to present one.
 *
 * `status` never reaches the screen as a word: every pill is an HLE key.
 */
export const dynamic = "force-dynamic";

const PILL: Record<CertificateRow["status"], string> = {
  ISSUED: "pin-ok",
  ELIGIBLE: "pin-info",
  REVOKED: "pin-neutral",
  SUPERSEDED: "pin-neutral",
};

export default async function DaftarSertifikat() {
  const viewer = await currentViewer();
  if (!viewer) redirect("/masuk?lanjut=/belajar/sertifikat");

  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const rows = await myCertificates();
  const [institutions, assignments] = await Promise.all([
    institutionNames(rows.map((r) => r.institution_id)),
    engine.myAssignments((await supabaseServer()) as unknown as engine.EngineClient),
  ]);

  // The list page titles a row from the learner's own assignments. A row whose
  // assignment this learner can no longer read keeps its date and its status
  // and loses only its title — it is still their certificate.
  const bySession = new Map<string, { subject: string; grade: string; title: string; tugas: string }>();
  for (const a of assignments) {
    bySession.set(a.learning_assignment_id, {
      subject: a.subject,
      grade: a.grade_label,
      title: a.title,
      tugas: a.learning_assignment_id,
    });
  }

  const institution = rows.length > 0 ? institutions.get(rows[0].institution_id) ?? null : null;

  return (
    <>
      <CangkangPengalaman locale={locale} current="sertifikat" />
      <div className="pin-col">
        <BarisLingkup scope={{ institution }} locale={locale} />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("sertifikat.daftar.eyebrow")}</p>
          <h1 className="pin-h1">{s("sertifikat.daftar.judul")}</h1>
          <p className="pin-intro">{s("sertifikat.daftar.pengantar")}</p>
        </div>

        {rows.length === 0 ? (
          <p className="pin-metric">{s("sertifikat.daftar.kosong")}</p>
        ) : (
          <div className="pin-list">
            {rows.map((row) => {
              const meta = bySession.get(row.session_id);
              const pill = (
                <span className={`pin-pill ${PILL[row.status]}`}>
                  {s(`sertifikat.status.${row.status}` as HleEvent)}
                </span>
              );
              const when =
                row.status === "ELIGIBLE"
                  ? `${s("sertifikat.daftar.selesai")} · ${format.date(row.issued_at_iso, locale)}`
                  : `${s("sertifikat.daftar.terbit")} ${format.date(row.issued_at_iso, locale)}`;
              return (
                <Link
                  key={row.id}
                  className="pin-row"
                  href={`/belajar/${meta?.tugas ?? row.session_id}/sertifikat`}
                >
                  <span className="pin-eyebrow">
                    {meta ? `${meta.subject} · ${meta.grade}` : s("sertifikat.judul")}
                  </span>
                  <span className="pin-title">{meta?.title ?? s("sertifikat.judul")}</span>
                  <span className="pin-rowmeta">
                    <span className="pin-num">{when}</span>
                    {pill}
                  </span>
                  {pill}
                </Link>
              );
            })}
          </div>
        )}

        <KakiPintar className="pin-noprint" />
      </div>
    </>
  );
}
