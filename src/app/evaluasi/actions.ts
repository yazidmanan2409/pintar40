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
  redirect("/evaluasi");
}
