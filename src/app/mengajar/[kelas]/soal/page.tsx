import Link from "next/link";
import Kosong from "@/components/Kosong";
import { t, format, type HleEvent } from "@/lib/hle";
import { currentLocale } from "@/lib/locale";
import * as ajar from "@/lib/pengajar";
import { supabaseServer } from "@/lib/supabase/server";
import { buktiSoal, susunBuktiSoal } from "@/lib/soal-kelas";
import CangkangPengalaman from "@/components/CangkangPengalaman";
import KakiPintar from "@/components/KakiPintar";
import HalamanPenolakan from "@/components/HalamanPenolakan";
import { adaBuktiSoal } from "@/lib/mengajar";
import { BarisLingkup } from "@/components/bukti";
import { TeksBaris } from "@/components/teks/Teks";
import { judulHalaman } from "@/lib/judul-halaman";

export const generateMetadata = judulHalaman("/mengajar/[kelas]/soal");

export const dynamic = "force-dynamic";

/**
 * D-088(k), M5 — WHICH QUESTIONS THIS CLASS FOUND HARD, AND WHO MAY NEED HELP.
 *
 * Teaching evidence, not surveillance (Yazid's refinement). The page answers
 * one question a teacher asks after an assessment: which questions did my
 * class struggle with, and which learners may need help with that concept?
 * So the questions come hardest first, each with its key, how many answered it
 * rightly, how many chose each option, and the names of those who did not —
 * alphabetically, with the option they chose, and nothing else attached.
 *
 * Only what was handed in. `teacher_question_evidence` reads submitted
 * sittings of this class's assignment for the class's teacher, and refuses
 * anyone else; a learner still working is not here. No time, device, attempt,
 * integrity signal or Question Health is read, so none can be shown.
 *
 * C1w F-1 (O41-21): every mark and the «Kunci» are the key in force; a question
 * whose key a governed correction changed says so, with its original key.
 */
export default async function SoalKelas({
  params,
  searchParams,
}: {
  params: Promise<{ kelas: string }>;
  searchParams: Promise<{ penugasan?: string }>;
}) {
  const { kelas: id } = await params;
  const { penugasan: tugasId } = await searchParams;
  const locale = await currentLocale();
  const s = (k: HleEvent) => t(k, "educator", { locale });
  const n = (x: number) => format.number(x, locale);

  const ctx = await ajar.kelas(id);
  if (!ctx || !tugasId) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref="/mengajar" backKey="mengajar.kembali" />;
  }
  // E-C2-3: the same rule that decides whether «Lihat per soal» is offered (adaBuktiSoal; D-069(b))
  if (!adaBuktiSoal(ctx.ini.jenis)) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={`/mengajar/${id}/bukti`} backKey="mengajar.soal.kembali" />;
  }
  const semua = await ajar.berjalan([id], ["OPEN", "CLOSED"]);
  const ini = semua.find((b) => b.id === tugasId);
  const bukti = ini ? await buktiSoal(await supabaseServer(), tugasId, id) : null;
  if (!ini || !bukti) {
    return <HalamanPenolakan locale={locale} persona="educator" backHref={`/mengajar/${id}`} backLabel={ctx.ini.nama} />;
  }
  const soal = susunBuktiSoal(bukti);

  return (
    <>
      <CangkangPengalaman locale={locale} kind="pengajar" current="kelas" />
      <main id="isi" tabIndex={-1} className="pin-col">
        <Link className="pin-back" href={`/mengajar/${id}/bukti`}>← {s("mengajar.soal.kembali")}</Link>
        <BarisLingkup
          scope={{ institution: ctx.konteks.institusi?.nama ?? null, path: [ctx.ini.nama], period: ctx.konteks.periode }}
          locale={locale}
        />
        <div className="pin-head">
          <p className="pin-eyebrow">{ini.judul}</p>
          <h1 className="pin-h1">{s("mengajar.soal.judul")}</h1>
          <p className="pin-intro">{s("mengajar.soal.arti")}</p>
          <p className="pin-meta">{s("mengajar.soal.terkumpul")} · {n(bukti.sittings)}</p>
        </div>

        {soal.length === 0 ? (
          <Kosong jenis="belum" kalimat={s("mengajar.soal.kosong")} />
        ) : (
          <ol className="pin-soal-kelas">
            {soal.map(({ soal: q, pilihan, perluBantuan }) => (
              <li key={q.item_id} className="pin-sec pin-soal-baris">
                {q.stimulus ? <p className="pin-meta"><TeksBaris teks={q.stimulus} /></p> : null}
                <p className="pin-soal-tanya"><TeksBaris teks={q.stem} /></p>
                <p className="pin-soal-tepat">
                  {n(q.right)} {s("mengajar.soal.dari")} {n(q.presented)} {s("mengajar.soal.tepat")}
                </p>
                <ul className="pin-soal-opsi">
                  {q.options.map((o) => (
                    <li key={o.label} className={o.is_key ? "pin-opsi-kunci" : undefined}>
                      <span>{o.label}. <TeksBaris teks={o.body} /></span>
                      {o.is_key ? <strong> · {s("mengajar.soal.kunci")}</strong> : null}
                      <span className="pin-num"> · {n(pilihan[o.label] ?? 0)} {s("mengajar.bukti.murid")}</span>
                    </li>
                  ))}
                </ul>
                {q.key_corrected ? (
                  <p className="pin-meta" data-kunci-diperbaiki="">
                    {s("mengajar.soal.kunci_diperbaiki").replace("{asli}", q.options.filter((o) => o.was_key).map((o) => o.label).join(", "))}
                  </p>
                ) : null}
                {/* F1-R1b (Sharon §3a.1; Daisy §6a, refined §1c): an answer in this view landed on a wrong option not linked to a misunderstanding */}
                {q.ada_tak_terkait ? <p className="pin-meta" data-tak-terkait="">{s("soal.tak_terkait")}</p> : null}
                {perluBantuan.length === 0 ? (
                  <p className="pin-meta">{s("mengajar.soal.semua_tepat")}</p>
                ) : (
                  <div className="pin-soal-bantuan">
                    <p className="pin-ml">{s("mengajar.soal.bantuan")}</p>
                    <ul>
                      {perluBantuan.map((m) => (
                        <li key={m.nama}>{m.nama} · {m.pilihan ?? s("mengajar.soal.tidak_dijawab")}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}

        <KakiPintar />
      </main>
    </>
  );
}
