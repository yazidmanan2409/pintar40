"use server";
/**
 * Every learner action in the cycle. Each one opens the caller's own Supabase
 * server client and hands it to the engine — the engine holds no privilege and
 * no client of its own, so a route cannot accidentally act as someone else
 * (INV-08 is enforced inside the database, from the JWT).
 */
import { supabaseServer } from "@/lib/supabase/server";
import * as engine from "@/lib/assessment-engine";
import type { LearnerAnswer } from "@/lib/assessment-engine";

async function db() {
  return (await supabaseServer()) as unknown as engine.EngineClient;
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
    return { ok: false as const, message: (e as Error).message };
  }
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

export async function finishSession(sessionId: string) {
  try {
    return { ok: true as const, resultId: await engine.finish(await db(), sessionId) };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}

export async function saveLessonProgress(
  learningAssignmentId: string, lessonId: string, position: number, total: number,
) {
  try {
    return { ok: true as const, furthest: await engine.recordProgress(await db(), learningAssignmentId, lessonId, position, total) };
  } catch (e) {
    return { ok: false as const, message: (e as Error).message };
  }
}
