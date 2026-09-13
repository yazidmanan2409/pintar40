import { supabaseServer } from "@/lib/supabase/server";
import { t, type HleEvent } from "@/lib/hle";

/**
 * Studio shared helpers (FABLE-05).
 *
 * Every authority question here is asked of the database, never of a display
 * role: `can_in_institution` is the same primitive the RLS policies and the
 * SECURITY DEFINER RPCs consult, so a page can never show an action the server
 * would refuse, and hiding a control is never what makes something safe.
 */

export const s = (event: HleEvent) => t(event, "staff");

export const card = "rounded-[var(--radius-2)] border border-line-1 bg-surface-1 p-4";
export const field = "rounded-[var(--radius-1)] border border-line-1 bg-surface-0 px-2 py-1 text-sm";
export const button = "rounded-[var(--radius-1)] bg-surface-2 px-3 py-1 text-sm hover:bg-line-1";
export const label = "grid gap-1 text-sm text-ink-2";

export type StudioInstitution = { id: string; name: string; capabilities: string[] };

const STUDIO_CAPABILITIES = [
  "CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH",
  "CAN_ASSIGN_LEARNING", "CAN_REVIEW_QUESTION_HEALTH", "CAN_REVIEW_INTEGRITY",
] as const;

/**
 * The institutions this viewer may act in, with the capabilities they actually
 * hold in each — asked of the database one capability at a time rather than
 * inferred from a role name, because the role-to-capability map is the
 * database's and may change without this file.
 */
export async function studioInstitutions(): Promise<StudioInstitution[]> {
  const supabase = await supabaseServer();
  const { data: rows } = await supabase
    .from("role_assignments")
    .select("institution_id")
    .is("revoked_at", null)
    .gt("valid_until", new Date().toISOString());
  const ids = Array.from(new Set((rows ?? []).map((r) => r.institution_id).filter(Boolean))) as string[];

  const { data: isSys } = await supabase.rpc("is_system_admin");
  let all = ids;
  if (isSys === true) {
    const { data: every } = await supabase.from("institutions").select("id");
    all = Array.from(new Set([...ids, ...((every ?? []).map((r) => r.id as string))]));
  }

  const named = await supabase.from("institutions").select("id, name").in("id", all.length ? all : [
    "00000000-0000-0000-0000-000000000000",
  ]);
  const names = new Map((named.data ?? []).map((r) => [r.id as string, r.name as string]));

  const out: StudioInstitution[] = [];
  for (const id of all) {
    const held: string[] = [];
    for (const cap of STUDIO_CAPABILITIES) {
      const { data } = await supabase.rpc("can_in_institution", { p_capability: cap, p_institution: id });
      if (data === true) held.push(cap);
    }
    if (held.length > 0) out.push({ id, name: names.get(id) ?? id, capabilities: held });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function can(inst: StudioInstitution | undefined, capability: string): boolean {
  return inst?.capabilities.includes(capability) ?? false;
}

/** A result banner carried back from a server action, never an exception page. */
export function outcomeLine(hasil?: string, detail?: string): string | null {
  if (!hasil) return null;
  if (hasil === "ok") return detail ? detail : s("studio.hasil.ok");
  return detail ? `${s("studio.hasil.gagal")} ${detail}` : s("studio.hasil.gagal");
}

export const short = (id: string | null | undefined) => (id ? id.slice(0, 8) : "—");
export const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }) : "—";
