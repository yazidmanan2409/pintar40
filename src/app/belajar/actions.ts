"use server";
/**
 * Every learner action in the cycle. Each one opens the caller's own Supabase
 * server client and hands it to the engine — the engine holds no privilege and
 * no client of its own, so a route cannot accidentally act as someone else
 * (INV-08 is enforced inside the database, from the JWT).
 */
import { redirect } from "next/navigation";
import { tujuanInternal } from "@/lib/tujuan";
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import type { LearnerAnswer } from "@/lib/assessment-engine";

/**
 * BOB-30 (D-031): every learner action here is answered in place -- the player
 * takes its state from the action's own result and never from a re-render -- so
 * the session cookie is written back only if it changed. Writing it unchanged
 * made Next redraw the whole assessment page for every answer (the paper, the
 * answers so far and the session state read again), as the lesson save did
 * before BOB-23.
 */
async function db() {
  return (await supabaseServer({ tulisJikaBerubah: true })) as unknown as engine.EngineClient;
}

export async function startSession(assessmentAssignmentId: string) {
  return engine.startSession(await db(), assessmentAssignmentId);
}

export async function submitAnswer(
  presentedItemId: string, clientSeq: number, value: LearnerAnswer,
  receiptMode: "LIVE" | "REPLAYED" | "LATE_SYNC" = "LIVE", clientAssertedAt?: string,
) {
  try {
    const r = await engine.answer(await db(), presentedItemId, clientSeq, value, receiptMode, clientAssertedAt);
    return { ok: true as const, outcome: r.outcome };
  } catch (e) {
    return { ok: false as const, ...refusal(e) };
  }
}

/** The database's refusal, with its stable code (R1) so the client never parses prose. */
function refusal(e: unknown): { message: string; code: string | null; detail: string | null } {
  const err = e as Partial<engine.EngineError> & Error;
  return { message: err.message, code: err.code ?? null, detail: err.detail ?? null };
}

export async function noteView(presentedItemId: string) {
  try {
    return { ok: true as const, at: await engine.noteItemView(await db(), presentedItemId) };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

export async function assistance(presentedItemId: string) {
  try {
    return { ok: true as const, state: await engine.assistanceState(await db(), presentedItemId) };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

export async function openAssistance(presentedItemId: string, level: number) {
  try {
    return { ok: true as const, level: await engine.openAssistance(await db(), presentedItemId, level) };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

export async function dismissAssistance(presentedItemId: string) {
  try {
    await engine.dismissAssistance(await db(), presentedItemId);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

/**
 * A category-7 observation (doc 07, F-09): the fact that something happened,
 * never what was answered. It is evidence for a human reviewer and nothing
 * reads it for scoring (`assert_integrity_never_scores`). Failure is silent on
 * purpose: an observation that cannot be sent must never interrupt a learner.
 */
export async function noteIntegrity(
  sessionId: string,
  category: "VISIBILITY_CHANGE" | "RECONNECT" | "RAPID_OPTION_CHANGE",
  observation: Record<string, number | string>,
) {
  try {
    await engine.recordIntegritySignal(await db(), sessionId, category, observation);
    return { ok: true as const };
  } catch {
    return { ok: false as const };
  }
}

export async function pauseSession(sessionId: string) {
  try {
    return { ok: true as const, status: await engine.pause(await db(), sessionId) };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

export async function resumeSession(sessionId: string) {
  try {
    return { ok: true as const, status: await engine.resume(await db(), sessionId) };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

export async function finishSession(sessionId: string, manifest: Record<string, number>) {
  try {
    return { ok: true as const, resultId: await engine.finish(await db(), sessionId, manifest) };
  } catch (e) {
    return { ok: false as const, ...refusal(e) };
  }
}

export async function saveLessonProgress(
  learningAssignmentId: string, lessonId: string, position: number, total: number,
) {
  try {
    // BOB-23: a page turn saves and nothing else. The session is written back
    // only if it changed, so the save does not re-render the lesson page (nine
    // Supabase calls, and a new round of props for the player).
    const klien = (await supabaseServer({ tulisJikaBerubah: true })) as unknown as engine.EngineClient;
    return { ok: true as const, furthest: await engine.recordProgress(klien, learningAssignmentId, lessonId, position, total) };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

/**
 * START AN ASSESSMENT. A FORM POST, and that is the point.
 *
 * Screen D exists so a learner can look at an assessment before entering it,
 * and `assessment_orientation()` guarantees that looking creates no session and
 * spends no attempt. That guarantee is only worth something if the ACT of
 * starting needs a deliberate press: a link is prefetched by the router,
 * pre-rendered by the browser and brushed by a thumb on a scroll, and any of
 * those would silently spend the one attempt a PAPER assessment allows.
 *
 * So the commitment is a verb, sent by a form, and it is the only thing in the
 * learner surface that creates a session.
 */
export async function mulaiAsesmen(formData: FormData) {
  const penugasan = String(formData.get("penugasan") ?? "");
  // L-1. `kembali` is the same question as `lanjut` wearing another name, and
  // it was the weaker of the two: unvalidated entirely, while the educator side
  // had already stopped taking its destination from the form and said in its
  // own comment that "the learner side already carries that as an open
  // finding". A server action is callable without ever rendering the form, so
  // the value is untrusted however it was drawn. The legitimate destinations
  // -- /belajar and /belajar/<tugas> -- pass through unchanged.
  const kembali = tujuanInternal(formData.get("kembali"), "/belajar");
  if (!penugasan) redirect(kembali);
  // No eligibility check here: `start_learning_session()` asks
  // `may_start_assessment()` itself, inside the database, from the JWT. A check
  // in this process would be a second opinion that can drift from the first.
  await engine.startSession(await db(), penugasan);
  redirect(kembali);
}
