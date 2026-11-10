import Link from "next/link";
import Kosong from "@/components/Kosong";
import { redirect } from "next/navigation";
import { t, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import { currentViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import { BarisLingkup } from "@/components/bukti";
import { myCertificates, institutionNames, tugasSertifikatSaya, type CertificateRow } from "@/lib/sertifikat";
import KakiPintar from "@/components/KakiPintar";
import { petaSesi } from "@/components/sertifikat/asalSertifikat";
import { judulHalaman } from "@/lib/judul-halaman";
import { tanggal } from "@/lib/tanggal";
import { zonaSekolahBanyak } from "@/lib/zona-sekolah";

export const generateMetadata = judulHalaman("/belajar/sertifikat");

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
  const db = (await supabaseServer()) as unknown as engine.EngineClient;

  // DAISY-40: a row is titled and linked through ITS SESSION, by the read the
  // certificate page itself uses: each of the learner's assignments' Uji
  // Penguasaan session (my_cycle_state), mapped back to that assignment. A row
  // whose assignment this learner can no longer read, or whose session is no
  // assignment's current one, keeps its date and its status and loses only its
  // title. Cross-batch (6 Nov): it is still a link, to the chapter its own
  // sitting belongs to (tugasSertifikatSaya), because the certificate page now
  // opens the learner's own certificate after the chapter stops being assigned
  // (a new school year, a transfer). Only a row with no sitting of theirs is not
  // a link.
  // the owner's ruling (10 Nov): each certificate's day on its issuing school's clock
  const [institutions, bySession, tugasDari, zonaDari] = await Promise.all([
    institutionNames(rows.map((r) => r.institution_id)),
    rows.length === 0
      ? Promise.resolve(petaSesi([]))
      : engine.myAssignments(db).then(async (assignments) =>
          petaSesi(await Promise.all(assignments.filter((a) => a.post_test_assignment).map(async (assignment) => ({
            assignment,
            postSession: (await engine.cycleState(db, assignment.learning_assignment_id).catch(() => null))?.post_session ?? null,
          }))))),
    tugasSertifikatSaya(rows.map((r) => r.session_id)),
    zonaSekolahBanyak(db, rows.map((r) => r.institution_id)),
  ]);

  const institution = rows.length > 0 ? institutions.get(rows[0].institution_id) ?? null : null;

  return (
    <>
      <CangkangPengalaman locale={locale} current="sertifikat" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <BarisLingkup scope={{ institution }} locale={locale} />

        <div className="pin-head">
          <p className="pin-eyebrow">{s("sertifikat.daftar.eyebrow")}</p>
          <h1 className="pin-h1">{s("sertifikat.daftar.judul")}</h1>
          <p className="pin-intro">{s("sertifikat.daftar.pengantar")}</p>
        </div>

        {rows.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("sertifikat.daftar.kosong")} />
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
                  ? `${s("sertifikat.daftar.selesai")} · ${tanggal(row.issued_at_iso, "baca", locale, zonaDari(row.institution_id))}`
                  : `${s("sertifikat.daftar.terbit")} ${tanggal(row.issued_at_iso, "baca", locale, zonaDari(row.institution_id))}`;
              const isi = (
                <>
                  <span className="pin-eyebrow">
                    {meta ? `${meta.subject} · ${meta.grade}` : s("sertifikat.judul")}
                  </span>
                  <span className="pin-title">{meta?.title ?? s("sertifikat.judul")}</span>
                  <span className="pin-rowmeta">
                    <span className="pin-num">{when}</span>
                    {pill}
                  </span>
                  {pill}
                </>
              );
              const ke = meta?.tugas ?? tugasDari.get(row.session_id);
              return ke ? (
                <Link key={row.id} className="pin-row" href={`/belajar/${ke}/sertifikat`}>{isi}</Link>
              ) : (
                <div key={row.id} className="pin-row pin-row-diam">{isi}</div>
              );
            })}
          </div>
        )}

        <KakiPintar className="pin-noprint" />
      </main>
    </>
  );
}
