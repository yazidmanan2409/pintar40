import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { currentLocale } from "@/lib/locale";
import LangkahTerbit from "@/components/studio/LangkahTerbit";
import { format, t, type HleEvent } from "@/lib/hle";
import { KODE_HAMBATAN, kalimatHambatan, type Hambatan } from "@/lib/terbitan-kontrak";
import { rujukan } from "@/lib/galat-kontrak";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions, when } from "../../_lib";
import {
  acknowledgeFindingAction, createRevisionAction, moveReleaseAction, runValidationAction,
} from "../../actions";
import TombolKirim from "@/components/TombolKirim";
import HasilDi from "@/components/HasilDi";

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
 */

type Params = Promise<{ course: string }>;
type Search = Promise<{ hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string; bagian?: string }>;

type Finding = {
  id: string; severity: string; lokasi: string; masalah: string;
  mengapa_penting: string; cara_memperbaiki: string; acknowledged_at: string | null;
};

function FindingCard({ f, courseId, kind, showAck }: {
  f: Finding; courseId: string; kind: "MCQ_QUALITY" | "COACHING"; showAck: boolean;
}) {
  return (
    <li className={card}>
      <p className="text-sm text-ink-3">{s("studio.temuan.lokasi")}: {f.lokasi}</p>
      <p className="mt-1 font-medium">{f.masalah}</p>
      <p className="mt-2 text-sm text-ink-2">{s("studio.temuan.mengapa")}: {f.mengapa_penting}</p>
      <p className="mt-1 text-sm text-ink-2">{s("studio.temuan.cara")}: {f.cara_memperbaiki}</p>
      {showAck && f.severity === "WARNING" && f.acknowledged_at === null ? (
        <form action={acknowledgeFindingAction} className="mt-3 flex flex-wrap items-end gap-2">
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
    </li>
  );
}

export default async function Paket({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { course: courseId } = await params;
  const sp = await searchParams;
  const supabase = await supabaseServer();

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

  const [{ data: stateRows }, { data: releases }, { data: mcq }, { data: coach }, { data: assignments }] =
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
      supabase.from("learning_assignments").select("id, plp_release_id, status, node_id")
        .eq("course_id", courseId).eq("status", "ACTIVE"),
    ]);

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
  const published = (releases ?? []).filter((r) => r.status === "PUBLISHED");
  const terakhir = (releases ?? []).at(-1) ?? null;
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
  const sekarangDi = (rilis: string) => (releases ?? []).find((r) => r.id === rilis)?.published_at as string | null | undefined;

  return (
    <div className="grid gap-6">
      <section className={card} id="paket">
        <h2 className="text-lg font-medium">{course.title}</h2>
        <p className="mt-1 text-sm text-ink-3">{course.subject} · {course.stage} · {course.grade_label}</p>
        {course.supersedes_course_id ? (
          <p className="mt-2 text-sm text-ink-2">
            <Link href={`/studio/paket/${course.supersedes_course_id}`} className="underline underline-offset-4">
              ← {s("studio.paket.revisi_penjelasan")}
            </Link>
          </p>
        ) : null}

        <p className="mt-4 text-xl font-semibold">
          {state ? s(`studio.state.${state.surface_state}` as never) : "—"}
        </p>
        <p className="mt-1 text-sm text-ink-2">
          {state ? s(`studio.state.explain.${state.surface_state}` as never) : ""}
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
              <FindingCard key={f.id} f={f} courseId={courseId} kind="MCQ_QUALITY" showAck={can(inst, "CAN_REVIEW")} />
            ))}
            {coaching.map((f) => (
              <FindingCard key={f.id} f={f} courseId={courseId} kind="COACHING" showAck={can(inst, "CAN_REVIEW")} />
            ))}
          </ul>
        )}
      </section>

      {can(inst, "CAN_DRAFT") ? (
        <section className={card} id="revisi">
          <h3 className="text-lg font-medium">{s("studio.paket.revisi")}</h3>
          <p className="mt-1 text-sm text-ink-2">{s("studio.paket.revisi_penjelasan")}</p>
          <form action={createRevisionAction} className="mt-3">
            <input type="hidden" name="course" value={courseId} />
            <TombolKirim className={button} sibuk={s("tombol.memproses")}>{s("studio.paket.revisi")}</TombolKirim>
          </form>
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
            <form action={moveReleaseAction} key={a.id} className="mt-3 flex flex-wrap items-end gap-2">
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
          ))}
        </section>
      ) : null}
    </div>
  );
}
