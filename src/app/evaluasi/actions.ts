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
  await exitPersona();
  // W3.13 (J6Peragaan): leaving says so in words («Anda sudah keluar dari peragaan.»). The persona's session WAS the
  // browser's session, so leaving ends it and the evaluator signs in again; the sign-in screen carries the line, as
  // it carries «sesi berakhir», and sends them back to the room.
  redirect("/masuk?sesi=peragaan&lanjut=%2Fevaluasi");
}
