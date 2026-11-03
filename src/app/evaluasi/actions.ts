"use server";
import { redirect } from "next/navigation";
import { exitPersona } from "@/lib/evaluation";

/**
 * Exiting is the caller's own act and needs no privilege, so it stays a server
 * action. ASSUMING is not: it mints a session with the service role, so it
 * lives in `src/app/api/evaluation/assume/route.ts`, which is where F01-S03
 * allows that client. The Hub posts to it directly.
 */
export async function exitPersonaAction() {
  // W3.13 (J6Peragaan): leaving says so in words («Anda sudah keluar dari peragaan.»). The persona's session is ended
  // server-side and the evaluator's own session, set aside when they assumed it, is put back: they return to the Hub
  // still signed in as themselves (ADR-0020; owner, Batch 5 promotion gate). Only when there is none to put back (it
  // aged out) does the sign-in screen carry the line and return them to the Hub.
  const kembali = await exitPersona();
  redirect(kembali ? "/evaluasi?keluar=1" : "/masuk?sesi=peragaan&lanjut=%2Fevaluasi");
}
