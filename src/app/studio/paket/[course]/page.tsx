import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { button, can, card, field, label, outcomeLine, s, studioInstitutions, when } from "../../_lib";
import {
  acknowledgeFindingAction, advanceContentAction, createReleaseAction, createRevisionAction, freezeReleaseAction,
  moveReleaseAction, publishReleaseAction, runValidationAction, withdrawReleaseAction,
} from "../../actions";

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
 */

type Params = Promise<{ course: string }>;
type Search = Promise<{ hasil?: string; detail?: string; bagian?: string }>;

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
          <input className={field} name="catatan" placeholder="catatan" />
          <button className={button} type="submit">{s("studio.temuan.akui")}</button>
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
    .select("id, title, subject, stage, grade_label, institution_id, supersedes_course_id, status")
    .eq("id", courseId).maybeSingle();

  if (!course) {
    return <p className={card}>{s("studio.paket.kosong")}</p>;
  }

  const institutions = await studioInstitutions();
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
    | { surface_state: string; reasons: string[]; preview_lesson_id: string | null } | undefined;

  const banner = outcomeLine(sp.hasil, sp.detail);
  const published = (releases ?? []).filter((r) => r.status === "PUBLISHED");
  const findings = ((mcq ?? []) as Finding[]).filter((f) => f.acknowledged_at === null);
  const coaching = ((coach ?? []) as Finding[]).filter((f) => f.acknowledged_at === null);

  return (
    <div className="grid gap-6">
      {banner ? <p className={card}>{banner}</p> : null}

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
            <p className="mt-4 text-sm font-medium">{s("studio.paket.alasan")}</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-ink-2">
              {state.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {state?.preview_lesson_id ? (
            <Link className={button} href={`/studio/pratinjau/${state.preview_lesson_id}`}>
              {s("studio.paket.pratinjau")}
            </Link>
          ) : null}
          {can(inst, "CAN_DRAFT") ? (
            <form action={runValidationAction}>
              <input type="hidden" name="course" value={courseId} />
              <button className={button} type="submit">{s("studio.unggah.konfirmasi")}</button>
            </form>
          ) : null}
          {can(inst, "CAN_DRAFT") ? (
            <>
              {["STRUCTURED", "VALIDATED", "IN_REVIEW"].map((to) => (
                <form action={advanceContentAction} key={to}>
                  <input type="hidden" name="course" value={courseId} />
                  <input type="hidden" name="to" value={to} />
                  <button className={button} type="submit">
                    {to === "IN_REVIEW" ? s("studio.nav.tinjau") : s("studio.unggah.konfirmasi")}
                  </button>
                </form>
              ))}
            </>
          ) : null}
          {can(inst, "CAN_REVIEW") ? (
            <form action={advanceContentAction}>
              <input type="hidden" name="course" value={courseId} />
              <input type="hidden" name="to" value="APPROVED" />
              <button className={button} type="submit">{s("studio.paket.setujui")}</button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="grid gap-2" id="temuan">
        <h3 className="text-lg font-medium">{s("studio.temuan.masalah")}</h3>
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

      <section className="grid gap-2" id="terbitan">
        <h3 className="text-lg font-medium">{s("studio.paket.terbitkan")}</h3>
        <p className="text-sm text-ink-2">{s("studio.paket.terbit_bukan_tugas")}</p>
        {(releases ?? []).length === 0 ? (
          <div className={card}>
            <p>{s("studio.paket.kosong")}</p>
            {can(inst, "CAN_FREEZE_RELEASE") && course.status === "APPROVED" ? (
              <form action={createReleaseAction} className="mt-3">
                <input type="hidden" name="course" value={courseId} />
                <button className={button} type="submit">{s("studio.paket.buat_terbitan")}</button>
              </form>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-2">
            {(releases ?? []).map((r) => (
              <li key={r.id} className={card}>
                <p className="text-sm text-ink-3">
                  {r.frozen_at ? `dikunci ${when(r.frozen_at)}` : ""}
                  {r.published_at ? ` · terbit ${when(r.published_at)}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  {can(inst, "CAN_FREEZE_RELEASE") && !r.frozen_at ? (
                    <form action={freezeReleaseAction} className="grid gap-1">
                      <input type="hidden" name="course" value={courseId} />
                      <input type="hidden" name="release" value={r.id} />
                      <span className="text-xs text-ink-3">{s("studio.paket.kunci_peringatan")}</span>
                      <button className={button} type="submit">{s("studio.paket.kunci")}</button>
                    </form>
                  ) : null}
                  {can(inst, "CAN_PUBLISH") && r.frozen_at && !r.published_at ? (
                    <form action={publishReleaseAction}>
                      <input type="hidden" name="course" value={courseId} />
                      <input type="hidden" name="release" value={r.id} />
                      <button className={button} type="submit">{s("studio.paket.terbitkan")}</button>
                    </form>
                  ) : null}
                  {can(inst, "CAN_PUBLISH") && r.status === "PUBLISHED" ? (
                    <form action={withdrawReleaseAction} className="flex items-end gap-2">
                      <input type="hidden" name="course" value={courseId} />
                      <input type="hidden" name="release" value={r.id} />
                      <input className={field} name="alasan" placeholder="alasan" required />
                      <button className={button} type="submit">{s("studio.paket.tarik")}</button>
                    </form>
                  ) : null}
                </div>
              </li>
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
            <button className={button} type="submit">{s("studio.paket.revisi")}</button>
          </form>
        </section>
      ) : null}

      {can(inst, "CAN_ASSIGN_LEARNING") && (assignments ?? []).length > 0 && published.length > 1 ? (
        <section className={card} id="koreksi">
          <h3 className="text-lg font-medium">{s("studio.paket.tugaskan")}</h3>
          {(assignments ?? []).map((a) => (
            <form action={moveReleaseAction} key={a.id} className="mt-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="course" value={courseId} />
              <input type="hidden" name="assignment" value={a.id} />
              <label className={label}>
                <span>{s("studio.paket.terbitkan")}</span>
                <select className={field} name="release" defaultValue="">
                  <option value="" disabled>—</option>
                  {published.filter((r) => r.id !== a.plp_release_id).map((r) => (
                    <option key={r.id} value={r.id}>{when(r.published_at)}</option>
                  ))}
                </select>
              </label>
              <input className={field} name="alasan" placeholder="alasan" required />
              <button className={button} type="submit">{s("studio.paket.tugaskan")}</button>
            </form>
          ))}
        </section>
      ) : null}
    </div>
  );
}
