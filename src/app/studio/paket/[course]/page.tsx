import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { currentViewer } from "@/lib/auth";
import { currentLocale } from "@/lib/locale";
import LangkahTerbit from "@/components/studio/LangkahTerbit";
import { enumLabel, format, t, type HleEvent } from "@/lib/hle";
import { KODE_HAMBATAN, kalimatHambatan, type Hambatan } from "@/lib/terbitan-kontrak";
import { rujukan } from "@/lib/galat-kontrak";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions, when } from "../../_lib";
import {
  acknowledgeFindingAction, moveReleaseAction, runValidationAction,
} from "../../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";
import SimpanIsian from "@/components/SimpanIsian";
import { TeksBaris } from "@/components/teks/Teks";
import { soalPaket } from "@/lib/soal-tinjauan";
import { akarGaris } from "@/lib/pengajar";
import { jalurIni, konteksHalaman, tempatSaya } from "@/lib/konteks-server";
import { alamatPilih, melayani } from "@/lib/konteks";

/**
 * Package detail — Publish Readiness (§5), freeze & publish (§6), release
 * correction (§7), revision (this phase's §6).
 *
 * The state and its reasons come from `studio_package_state`, which composes
 * the findings gate with the lifecycle facts server-side. The page renders
 * what it is told: it does not compute readiness, and it does not translate a
 * lifecycle enum, because none reaches it.
 *
 * Controls are shown by capability, but that is courtesy rather than security:
 * every one of them calls a database path that re-decides the same question.
 *
 * DAISY-06, THE TERBIT STEP (audit M11). The lifecycle used to be six buttons
 * side by side -- "Konfirmasi" three times among them -- with nothing to say
 * which came first or whose turn it was. It is now one ordered list of seven
 * named steps (LangkahTerbit, from components/studio/langkah.ts): the current
 * one marked, the roles that take each beside it, a button only on the
 * current step and only for a reader who may take it, and the author told
 * that approving and locking are a second person's. The content check is
 * "Periksa isi sekarang" beside the findings it writes.
 *
 * D-085 M10, A CORRECTION. «Perbaiki kursus ini» used to make a copy "to edit
 * freely", which no screen can edit, and a copy left the line's newest course a
 * draft no workbook could correct. A locked course that is the newest of its
 * line now links to the upload, which brings the corrected workbook in as its
 * next version with what changed and why; «Riwayat perbaikan» lists the line,
 * each version with its release, its summary, who wrote it and when.
 */

type Params = Promise<{ course: string }>;
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

type Finding = {
  id: string; severity: string; lokasi: string; masalah: string;
  mengapa_penting: string; cara_memperbaiki: string; acknowledged_at: string | null;
};

function FindingCard({ f, courseId, kind, showAck, pemilik, ditolak }: {
  f: Finding; courseId: string; kind: "MCQ_QUALITY" | "COACHING"; showAck: boolean; pemilik: string; ditolak: boolean;
}) {
  return (
    <li className={card}>
      <p className="text-sm text-ink-3">{s("studio.temuan.lokasi")}: {f.lokasi}</p>
      <p className="mt-1 font-medium">{f.masalah}</p>
      <p className="mt-2 text-sm text-ink-2">{s("studio.temuan.mengapa")}: {f.mengapa_penting}</p>
      <p className="mt-1 text-sm text-ink-2">{s("studio.temuan.cara")}: {f.cara_memperbaiki}</p>
      {showAck && f.severity === "WARNING" && f.acknowledged_at === null ? (
        <form action={acknowledgeFindingAction} id={`temuan-${f.id}`} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="course" value={courseId} />
          <input type="hidden" name="finding" value={f.id} />
          <input type="hidden" name="kind" value={kind} />
          <label className={label}>
            <span>{s("studio.paket.catatan")}</span>
            <input className={field} name="catatan" />
          </label>
          <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.temuan.akui")}</TombolKirim>
        </form>
      ) : null}
      {showAck && f.severity === "WARNING" && f.acknowledged_at === null
        ? <SimpanIsian form={`temuan-${f.id}`} ditolak={ditolak} pemilik={pemilik} /> : null}
    </li>
  );
}

export default async function Paket({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { course: courseId } = await params;
  const sp = await searchParams;
  const supabase = await supabaseServer();
  // CR-84 (3): what a refused form sent comes back to it, for the same person only (src/lib/isian.ts)
  const pemilik = (await currentViewer())?.personId ?? "";
  const ditolak = (bagian: string) => sp.hasil === "gagal" && sp.bagian === bagian;

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, subject, stage, grade_label, institution_id, supersedes_course_id, status, author_person_id")
    .eq("id", courseId).maybeSingle();

  if (!course) {
    return <p className={card}>{s("studio.paket.kosong")}</p>;
  }

  const [institutions, locale, { data: saya }] = await Promise.all([
    studioInstitutions(), currentLocale(), supabase.rpc("current_person_id"),
  ]);
  const inst = institutions.find((i) => i.id === course.institution_id);
  // L3 (§2.6): a package of another school is never worked on in this context, and the context never switches
  // silently: the chooser offers that school's Studio when the reader holds it there, and continues here
  if (!inst && (await konteksHalaman()) !== "TANPA_KONTEKS") {
    const jalur = await jalurIni();
    const di = (await tempatSaya()).find((p) => p.tempat === course.institution_id && melayani(p, jalur));
    if (di) redirect(alamatPilih({ untuk: di.tujuan, tempat: di.tempat, alasan: "lain", lanjut: jalur }));
  }

  const [{ data: stateRows }, { data: releases }, { data: mcq }, { data: coach }, { data: garisRows }] =
    await Promise.all([
      supabase.rpc("studio_package_state", { p_course: courseId }),
      supabase.from("plp_releases").select("id, version_label, status, published_at, frozen_at, supersedes_release_id")
        .eq("course_id", courseId).order("created_at", { ascending: true }),
      supabase.from("mcq_quality_findings")
        .select("id, severity, lokasi, masalah, mengapa_penting, cara_memperbaiki, acknowledged_at")
        .eq("course_id", courseId).order("created_at", { ascending: true }),
      supabase.from("coaching_findings")
        .select("id, severity, lokasi, masalah, mengapa_penting, cara_memperbaiki, acknowledged_at")
        .eq("course_id", courseId).order("created_at", { ascending: true }),
      supabase.from("courses").select("id, supersedes_course_id").eq("institution_id", course.institution_id),
    ]);

  // D-085 M10: a correction is a new course superseding the one it corrects, so «Koreksi» reads the whole line --
  // every published release of it, and every class given one -- not this course alone (one course has one release,
  // so read alone it never had two to choose between)
  const akar = akarGaris((garisRows ?? []) as Array<{ id: string; supersedes_course_id: string | null }>);
  const garis = [...akar.entries()].filter(([, r]) => r === (akar.get(courseId) ?? courseId)).map(([id]) => id);
  const [{ data: rilisGaris }, { data: assignments }] = await Promise.all([
    supabase.from("plp_releases").select("id, course_id, version_label, status, published_at")
      .in("course_id", garis.length > 0 ? garis : [courseId]).order("published_at", { ascending: true }),
    supabase.from("learning_assignments").select("id, plp_release_id, status, node_id")
      .in("course_id", garis.length > 0 ? garis : [courseId]).eq("status", "ACTIVE"),
  ]);
  // a course this one has been corrected by: the newest of the line after it, when there is one
  const sesudah = ((garisRows ?? []) as Array<{ id: string; supersedes_course_id: string | null }>);
  const penerus = (() => {
    let kini = courseId;
    for (let n = 0; n < 64; n++) {
      const anak = sesudah.find((k) => k.supersedes_course_id === kini);
      if (!anak) break;
      kini = anak.id;
    }
    return kini === courseId ? null : kini;
  })();

  // D-085 M10: the line in order, first version first, each with its release and the note its correction carried
  const urutGaris: string[] = [];
  for (let kini: string | undefined = akar.get(courseId) ?? courseId, n = 0; kini && n < 64; n++) {
    urutGaris.push(kini);
    const k: string = kini;
    kini = sesudah.find((x) => x.supersedes_course_id === k)?.id;
  }
  const { data: catatanRows } = urutGaris.length > 1
    ? await supabase.from("course_revision_notes").select("course_id, summary, written_by_person_id, written_at").in("course_id", urutGaris)
    : { data: [] as Array<{ course_id: string; summary: string; written_by_person_id: string | null; written_at: string }> };
  const catatan = new Map(((catatanRows ?? []) as Array<{ course_id: string; summary: string; written_by_person_id: string | null; written_at: string }>)
    .map((r) => [r.course_id, r]));
  const penulisIds = [...new Set([...catatan.values()].map((r) => r.written_by_person_id).filter((x): x is string => !!x))];
  const { data: penulisRows } = penulisIds.length > 0
    ? await supabase.from("persons").select("id, display_name").in("id", penulisIds)
    : { data: [] as Array<{ id: string; display_name: string }> };
  const penulis = new Map(((penulisRows ?? []) as Array<{ id: string; display_name: string }>).map((p) => [p.id, p.display_name]));
  const TERSEGEL = ["FROZEN", "PUBLISHED", "SUPERSEDED"];
  const terkunci = TERSEGEL.includes(course.status as string) || (releases ?? []).some((r) => TERSEGEL.includes(r.status as string));

  // D-088(h): the package's questions with their key and rationale, read under the reader's own row security
  // (CAN_DRAFT in the school, which every reviewer holds), so the person who approves sees what they approve
  const soal = can(inst, "CAN_DRAFT") ? await soalPaket(supabase, courseId) : [];

  const state = (Array.isArray(stateRows) ? stateRows[0] : stateRows) as
    | { surface_state: string; reasons: Hambatan[]; preview_lesson_id: string | null } | undefined;

  const banner = outcomeLine(sp);
  // DAISY-16: a reason whose code the catalogue does not know shows the general
  // line and a reference; the code goes to the server log under it, never to the page
  const dikenal = (r: Hambatan) => (KODE_HAMBATAN as readonly string[]).includes(r?.code);
  const asing = (state?.reasons ?? []).filter((r) => !dikenal(r));
  const refAlasan = asing.length > 0 ? rujukan() : null;
  // the reasons speak the reader's language, as the Terbit step below them does
  const sl = (k: HleEvent) => t(k, "staff", { locale });
  if (refAlasan) console.error(`[studio ${refAlasan}] studio_package_state returned blocker code(s) the catalogue does not know`, asing.map((r) => r?.code));
  const published = (rilisGaris ?? []).filter((r) => r.status === "PUBLISHED");
  const terakhir = (releases ?? []).at(-1) ?? null;
  const terbitSiap = state?.surface_state === "READY" && terakhir?.status === "PUBLISHED";
  const tersegel = terakhir !== null && !["INGESTED", "STRUCTURED", "VALIDATED", "IN_REVIEW", "APPROVED"].includes(terakhir.status);
  const findings = ((mcq ?? []) as Finding[]).filter((f) => f.acknowledged_at === null);
  const coaching = ((coach ?? []) as Finding[]).filter((f) => f.acknowledged_at === null);

  // Polish batch 2 (UX-16): each move form names the class it moves, and where
  // it is now. The names are read only when the move section is on the page.
  const bolehPindah = can(inst, "CAN_ASSIGN_LEARNING") && (assignments ?? []).length > 0 && published.length > 1;
  const kelasIds = bolehPindah ? [...new Set((assignments ?? []).map((a) => a.node_id as string))] : [];
  const { data: kelasRows } = kelasIds.length > 0
    ? await supabase.from("org_nodes").select("id, name").in("id", kelasIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const namaKelas = new Map(((kelasRows ?? []) as Array<{ id: string; name: string }>).map((k) => [k.id, k.name]));
  const sekarangDi = (rilis: string) => (rilisGaris ?? []).find((r) => r.id === rilis)?.published_at as string | null | undefined;

  return (
    <div className="grid gap-6">
      <section className={card} id="paket">
        <h2 className="text-lg font-medium">{course.title}</h2>
        <p className="mt-1 text-sm text-ink-3">{course.subject} · {course.stage} · {course.grade_label}</p>
        {course.supersedes_course_id ? (
          <p className="mt-2 text-sm text-ink-2">
            <Link href={`/studio/paket/${course.supersedes_course_id}`} className="underline underline-offset-4">
              ← {s("studio.paket.revisi_sebelum")}
            </Link>
          </p>
        ) : null}
        {/* D-085 M10: forward too -- this course has been corrected; new learning uses the correction */}
        {penerus ? (
          <p className="mt-2 text-sm text-ink-2" data-penerus={penerus}>
            <Link href={`/studio/paket/${penerus}`} className="underline underline-offset-4">
              {s("studio.paket.revisi_terbaru")} →
            </Link>
          </p>
        ) : null}

        <p className="mt-4 text-xl font-semibold">
          {/* RV-10 (D-140): a published package with nothing to fix reads as published, not «siap diterbitkan» */}
          {state ? (terbitSiap ? s("studio.langkah.terbit.judul") : s(`studio.state.${state.surface_state}` as never)) : "—"}
        </p>
        <p className="mt-1 text-sm text-ink-2">
          {state ? (terbitSiap ? s("studio.state.explain.TERBIT") : s(`studio.state.explain.${state.surface_state}` as never)) : ""}
        </p>

        {state && state.reasons.length > 0 ? (
          <>
            <p className="mt-4 text-sm font-medium">{sl("studio.paket.alasan")}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">
              {/* BOB-17 (D-011): each reason is a blocker code; its line comes from the copy table */}
              {state.reasons.map((r, i) => (
                <li key={`${r?.code}-${r?.lesson_id ?? ""}-${r?.pattern ?? ""}-${i}`}>{kalimatHambatan(r, sl, (n) => format.number(n, locale))}{refAlasan && !dikenal(r) ? ` (${sl("galat.rujukan")}: ${refAlasan})` : null}</li>
              ))}
            </ul>
          </>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {state?.preview_lesson_id ? (
            <Link className={button} href={`/studio/pratinjau/${state.preview_lesson_id}`}>
              {s("studio.paket.pratinjau")}
            </Link>
          ) : null}
        </div>
      </section>

      {/* D-088(h): before the steps, so «Setujui» comes after the questions were in front of the reviewer. The
          learner preview above stays the sanitised learner view (§5); this is the Studio staff's own view. */}
      {can(inst, "CAN_DRAFT") ? (
        <section className={card} id="soal">
          <h3 className="text-lg font-medium">{sl("studio.soal.judul")}</h3>
          <p className="mt-1 text-sm text-ink-2">{sl("studio.soal.arti")}</p>
          {soal.length === 0 ? (
            <p className="mt-2 text-sm text-ink-2">{sl("studio.soal.kosong")}</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {soal.map((l, li) => (
                <details key={l.id} className="pin-soal-pelajaran" open={li === 0}>
                  <summary className="cursor-pointer font-medium">{l.judul} · {format.number(l.soal.length, locale)} {sl("studio.soal.jumlah")}</summary>
                  <ol className="mt-2 grid list-decimal gap-3 pl-5">
                    {l.soal.map((q) => (
                      <li key={q.id} className="pin-soal">
                        <p className="text-xs text-ink-3">{q.peran ? enumLabel("mode", q.peran, locale) : enumLabel("bank", q.bank, locale)}</p>
                        {q.stimulus ? <p className="mt-1 text-sm text-ink-2"><TeksBaris teks={q.stimulus} /></p> : null}
                        <p className="mt-1"><TeksBaris teks={q.pertanyaan} /></p>
                        <ul className="mt-2 grid gap-1">
                          {q.opsi.map((o) => (
                            <li key={o.label} className={o.kunci ? "pin-opsi pin-opsi-kunci" : "pin-opsi"}>
                              <span className={o.kunci ? "font-semibold" : undefined}>{o.label}. <TeksBaris teks={o.isi} /></span>
                              {o.kunci ? <span className="ml-2 text-xs font-semibold">· {sl("studio.soal.kunci")}</span> : null}
                              <p className="text-sm text-ink-2">{sl("studio.soal.alasan")}: <TeksBaris teks={o.alasan} /></p>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <HasilDi q={sp} bagian={["paket", "terbitan"]} kalimat={banner} />

      <LangkahTerbit
        locale={locale}
        course={courseId}
        fakta={{ statusKursus: course.status as string, terbitan: terakhir ? { status: terakhir.status as string } : null }}
        terbitan={terakhir ? { id: terakhir.id as string, status: terakhir.status as string, terbitPada: (terakhir.published_at as string | null) ?? null } : null}
        kemampuan={inst?.capabilities ?? []}
        saya={typeof saya === "string" ? saya : null}
        penyusun={(course.author_person_id as string | null) ?? null}
      />

      <section className="grid gap-2" id="temuan">
        {/* Polish batch 2 (UX-14): named «Temuan», as both steps above call it */}
        <h3 className="text-lg font-medium">{s("studio.temuan.judul")}</h3>
        {can(inst, "CAN_DRAFT") && !tersegel ? (
          <form action={runValidationAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="course" value={courseId} />
            <TombolKirim className={button} sibuk={s("tombol.memeriksa")}>{s("studio.paket.periksa_isi")}</TombolKirim>
            <span className="text-sm text-ink-2">{s("studio.paket.periksa_isi_arti")}</span>
          </form>
        ) : null}
        <HasilDi q={sp} bagian="temuan" kalimat={banner} />
        {findings.length + coaching.length === 0 ? (
          <p className={card}>{s("studio.temuan.kosong")}</p>
        ) : (
          <ul className="grid gap-2">
            {findings.map((f) => (
              <FindingCard key={f.id} f={f} courseId={courseId} kind="MCQ_QUALITY" showAck={can(inst, "CAN_REVIEW")} pemilik={pemilik} ditolak={ditolak("temuan")} />
            ))}
            {coaching.map((f) => (
              <FindingCard key={f.id} f={f} courseId={courseId} kind="COACHING" showAck={can(inst, "CAN_REVIEW")} pemilik={pemilik} ditolak={ditolak("temuan")} />
            ))}
          </ul>
        )}
      </section>

      {urutGaris.length > 1 ? (
        <section className={card} id="riwayat">
          <h3 className="text-lg font-medium">{sl("studio.paket.riwayat.judul")}</h3>
          <ol className="mt-2 grid gap-3">
            {urutGaris.map((id, i) => {
              const r = (rilisGaris ?? []).filter((x) => x.course_id === id).at(-1);
              const n = catatan.get(id);
              return (
                <li key={id} className="pin-riwayat" data-versi={id}>
                  <p className="font-medium">
                    {r?.version_label ?? "—"}
                    {" · "}
                    {r?.published_at ? when(r.published_at as string) : sl("studio.paket.riwayat.belum_terbit")}
                    {" · "}
                    {id === courseId
                      ? <span className="text-ink-3">{sl("studio.paket.riwayat.ini")}</span>
                      : <Link href={`/studio/paket/${id}`} className="underline underline-offset-4">{sl("studio.paket.riwayat.buka")}</Link>}
                  </p>
                  {i === 0 ? (
                    <p className="text-sm text-ink-2">{sl("studio.paket.riwayat.asli")}</p>
                  ) : n ? (
                    <>
                      <p className="text-sm"><TeksBaris teks={n.summary} /></p>
                      <p className="text-xs text-ink-3">
                        {when(n.written_at)}
                        {n.written_by_person_id && penulis.get(n.written_by_person_id)
                          ? ` · ${sl("studio.paket.riwayat.oleh")} ${penulis.get(n.written_by_person_id)}` : ""}
                      </p>
                    </>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {can(inst, "CAN_DRAFT") && terkunci && !penerus ? (
        <section className={card} id="revisi">
          <h3 className="text-lg font-medium">{s("studio.paket.revisi")}</h3>
          <p className="mt-1 text-sm text-ink-2">{s("studio.paket.revisi_penjelasan")}</p>
          <p className="mt-3">
            <Link className={button} href={`/studio/unggah?revisi=${courseId}#buku-kerja`}>{sl("studio.paket.revisi_unggah")}</Link>
          </p>
          <HasilDi q={sp} bagian="revisi" kalimat={banner} />
        </section>
      ) : null}

      {bolehPindah ? (
        <section className={card} id="koreksi">
          {/* Polish batch 2 (UX-16): this moves an assignment that exists, and
              each form says which class it moves and where that class is now. */}
          <h3 className="text-lg font-medium">{s("studio.paket.pindah.judul")}</h3>
          <HasilDi q={sp} bagian="koreksi" kalimat={banner} />
          {(assignments ?? []).map((a) => (
            <div key={a.id}>
            <form action={moveReleaseAction} id={`koreksi-${a.id}`} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="course" value={courseId} />
              <input type="hidden" name="assignment" value={a.id} />
              <p className="w-full text-sm text-ink-2">
                {namaKelas.get(a.node_id as string) ?? "—"}
                {sekarangDi(a.plp_release_id as string)
                  ? ` · ${s("studio.paket.pindah.sekarang")} ${when(sekarangDi(a.plp_release_id as string) ?? null)}`
                  : ""}
              </p>
              <label className={label}>
                <span>{s("studio.paket.pindah.tujuan")}</span>
                <select className={field} name="release" defaultValue="">
                  <option value="" disabled>—</option>
                  {published.filter((r) => r.id !== a.plp_release_id).map((r) => (
                    <option key={r.id} value={r.id}>{when(r.published_at)}</option>
                  ))}
                </select>
              </label>
              <label className={label}>
                <span>{s("studio.paket.koreksi_alasan")}</span>
                <input className={field} name="alasan" required />
              </label>
              <TombolKirim className={button} sibuk={s("tombol.menyimpan")}>{s("studio.paket.pindah.tombol")}</TombolKirim>
            </form>
            <SimpanIsian form={`koreksi-${a.id}`} ditolak={ditolak("koreksi")} pemilik={pemilik} />
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
