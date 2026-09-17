import Link from "next/link";
import { notFound } from "next/navigation";
import { t, format, type HleEvent } from "@/lib/hle";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import * as engine from "@/lib/assessment-engine";
import { posisi, peringkat, statusKey, type Kandidat } from "@/lib/siklus";
import { rendersCredential, type CertificateStatus } from "@/lib/sertifikat-kontrak";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";

export const dynamic = "force-dynamic";

/**
 * SCREEN G — WHAT NEXT. The journey does not end at "Selesai."
 *
 * EVERY ROW HERE IS A REAL, ALREADY-AUTHORIZED NEXT ACTION: a certificate that
 * EXISTS, another assignment genuinely mid-cycle, an assessment
 * `my_open_assessments()` says the learner may start right now. Nothing is
 * offered that PINTAR would then refuse.
 *
 * THE CERTIFICATE ROW IS SLICE 1's EXPERIENCE, REUSED. It appears only when
 * `my_certificate()` already returns a credential for this session — visiting
 * it never issues one (V-6a), and this page does not call issuance either.
 *
 * AND THE HONEST END. When there genuinely is nothing, PINTAR says so and
 * stops. No invented work to keep a learner engaged, no streak to protect, no
 * "explore more" that leads somewhere nobody assigned.
 */
export default async function Lanjut({ params }: { params: Promise<{ tugas: string }> }) {
  const { tugas } = await params;
  const locale = await currentLocale();
  const db = (await supabaseServer()) as unknown as engine.EngineClient;
  const s = (k: HleEvent) => t(k, "learner", { locale });

  const semua = await engine.myAssignments(db);
  const mine = semua.find((a) => a.learning_assignment_id === tugas);
  if (!mine) notFound();

  const state = await engine.cycleState(db, tugas);
  if (!state.post_session || state.post_status !== "FINALIZED") notFound();

  // The certificate for the session just finished, if one exists yet.
  const sertifikat = await engine.myCertificate(db, state.post_session);

  // What else is genuinely mid-cycle, ranked the same way the home ranks it.
  const lain = await Promise.all(
    semua
      .filter((a) => a.learning_assignment_id !== tugas)
      .map(async (a): Promise<Kandidat> => {
        const [st, ls] = await Promise.all([
          engine.cycleState(db, a.learning_assignment_id),
          engine.lessons(db, a.learning_assignment_id),
        ]);
        return {
          tugas: a,
          posisi: posisi(st, ls),
          berjalan: Boolean(
            (st.post_session && st.post_status !== "FINALIZED") ||
              (st.pre_session && st.pre_status !== "FINALIZED"),
          ),
        };
      }),
  );
  const { utama, sisa } = peringkat(lain);
  const berjalan = [...(utama ? [utama] : []), ...sisa].filter((k) => !k.posisi.selesai);

  const terbuka = await engine.openAssessments(db);

  const adaSesuatu =
    (sertifikat && rendersCredential(sertifikat.status as CertificateStatus)) || berjalan.length > 0 || terbuka.length > 0;

  return (
    <>
      <CangkangPengalaman locale={locale} current="belajar" />
      <main className="pin-col">
        <Link className="pin-back" href={`/belajar/${tugas}/hasil`}>
          ← {s("hasil.title")}
        </Link>
        <div className="pin-head">
          <p className="pin-eyebrow">{s("siklus.setelah")}</p>
          <h1 className="pin-h1">{s("siklus.berikutnya")}</h1>
          {adaSesuatu ? <p className="pin-intro">{s("siklus.terbuka_kini")}</p> : null}
        </div>

        {adaSesuatu ? (
          <div className="pin-next">
            {sertifikat && rendersCredential(sertifikat.status as CertificateStatus) ? (
              <div className="pin-nrow">
                <span>
                  <span className="pin-nt">{s("siklus.lihat_sertifikat")}</span>
                  <br />
                  <span className="pin-nw">{mine.title}</span>
                </span>
                <Link className="pin-btn" href={`/belajar/${tugas}/sertifikat`}>
                  {s("siklus.buka")}
                </Link>
              </div>
            ) : null}

            {berjalan.map((k) => (
              <div className="pin-nrow" key={k.tugas.learning_assignment_id}>
                <span>
                  <span className="pin-nt">
                    {k.tugas.subject} · {k.tugas.title}
                  </span>
                  <br />
                  <span className="pin-nw">{s(statusKey(k.posisi) as HleEvent)}</span>
                </span>
                <Link className="pin-btn" href={`/belajar/${k.tugas.learning_assignment_id}`}>
                  {s("siklus.buka")}
                </Link>
              </div>
            ))}

            {terbuka.map((a) => (
              <div className="pin-nrow" key={a.assessment_assignment_id}>
                <span>
                  <span className="pin-nt">{a.title}</span>
                  <br />
                  <span className="pin-nw">
                    {format.number(a.item_count, locale)} {s("siklus.soal")} · {a.node_name}
                  </span>
                </span>
                <Link className="pin-btn" href={`/belajar/asesmen/${a.assessment_assignment_id}`}>
                  {s("siklus.buka")}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          /* THE HONEST END. This state is designed, not an empty page. */
          <section className="pin-sec">
            <h2>{s("siklus.habis.judul")}</h2>
            <div className="pin-tugas">
              <span className="pin-tstatus">{s("siklus.habis.isi")}</span>
            </div>
          </section>
        )}

        <KakiPintar />
      </main>
    </>
  );
}
