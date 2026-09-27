import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { t, type HleEvent } from "@/lib/hle";
import { kalimatHasil, type QueryHasil } from "@/lib/galat-kontrak";

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
  // ADDED for ADR-0018: the Quick Assessment affordance asks the database
  // whether this viewer may launch one, the same way every other Studio
  // control does. The RPC re-asks it per class node, so this only decides
  // whether the page is worth showing.
  "CAN_QUICK_ASSESSMENT",
] as const;

/**
 * The institutions this viewer may act in, with the capabilities they actually
 * hold in each — asked of the database rather than inferred from a role name,
 * because the role-to-capability map is the database's and may change without
 * this file.
 *
 * ONE CALL, ONCE PER REQUEST (BOB-18, D-046). `studio_capabilities` asks
 * `can_in_institution` for every school and capability inside one statement,
 * under this viewer's own RLS -- the loop that used to make 8 round trips per
 * school, one after another. React's `cache` shares the answer between the
 * Studio layout and its page within one render. A failed call is no
 * capability anywhere, which the layout turns into the refusal, as before.
 */
export const studioInstitutions = cache(async (): Promise<StudioInstitution[]> =>
  studioInstitutionsDari(await supabaseServer()));

/** `studioInstitutions` over a given client (BOB-18: driven in selftest/bob18.test.ts). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function studioInstitutionsDari(c: any): Promise<StudioInstitution[]> {
  const { data, error } = await c.rpc("studio_capabilities", { p_capabilities: [...STUDIO_CAPABILITIES] });
  if (error || !Array.isArray(data)) return [];
  return (data as Array<{ institution_id: string; name: string | null; capabilities: string[] | null }>)
    .map((r) => ({
      id: String(r.institution_id),
      name: r.name ?? String(r.institution_id),
      capabilities: (r.capabilities ?? []).filter((x) => (STUDIO_CAPABILITIES as readonly string[]).includes(x)),
    }))
    .filter((r) => r.capabilities.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function can(inst: StudioInstitution | undefined, capability: string): boolean {
  return inst?.capabilities.includes(capability) ?? false;
}

/**
 * A result banner carried back from a server action, never an exception page.
 * BOB-07 (D-011): the action sends a code (and a reference for a failure
 * nobody named); the sentence is the copy table's. Nothing typed into the
 * address reaches the banner: an unknown code, reference or count is dropped.
 */
export function outcomeLine(q: QueryHasil): string | null {
  return kalimatHasil(q, s, { ok: "studio.hasil.ok", gagal: "studio.hasil.gagal" });
}

export const short = (id: string | null | undefined) => (id ? id.slice(0, 8) : "—");
export const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }) : "—";
