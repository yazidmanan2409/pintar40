import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import { kalimatHasil, type QueryHasil } from "@/lib/galat-kontrak";
import { peranSaya } from "@/lib/tur-negara";
import { KEMAMPUAN_STUDIO, tabStudio, type TabStudio } from "@/lib/studio-tab";
import { konteksHalaman } from "@/lib/konteks-server";

/**
 * Studio shared helpers (FABLE-05).
 *
 * Every authority question here is asked of the database, never of a display
 * role: `can_in_institution` is the same primitive the RLS policies and the
 * SECURITY DEFINER RPCs consult, so a page can never show an action the server
 * would refuse, and hiding a control is never what makes something safe.
 */

export const s = (event: HleEvent) => t(event, "staff");

/** Studio's words, in one reader's language. */
export type Kata = (event: HleEvent) => string;
/**
 * W1.9 (UX-25, Batch 3): STUDIO SPEAKS ITS READER'S LANGUAGE. `s` above is Indonesian whatever the reader chose; a page
 * reads its reader's language once (currentLocale) and draws every word through this.
 */
export const kataStudio = (locale: Locale): Kata => (event) => t(event, "staff", { locale });

// W1.14 / W3.18 (Batch 3; 08-migration «Containers» and «Fields»): the shared class strings name the v3 primitives in
// experience.css, never a Tailwind composition: Panel, Text field (its label above the control), Button.
export const card = "pin-panel";
export const field = "pin-input"; // D-138 step 4d/4f: the v3 Field (44 px, the 3:1 outline), not a Tailwind look-alike
export const button = "pin-btn pin-btn-awal"; // D-138 step 4d/4f: the v3 Button (44 px, its states), at its own width in a grid
export const label = "pin-bidang";

export type StudioInstitution = { id: string; name: string; capabilities: string[] };

// The capabilities Studio asks about: one list, which the shell's Studio tab also reads (src/lib/studio-tab.ts).
const STUDIO_CAPABILITIES = KEMAMPUAN_STUDIO;

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
export const studioInstitutions = cache(async (): Promise<StudioInstitution[]> => {
  const semua = await studioInstitutionsDari(await supabaseServer());
  // L3 (CR-83; D-132 C8): STUDIO FOLLOWS THE WORKING CONTEXT. One place, the context's, and of the capabilities the
  // database answers there only those the grants giving the active purpose carry (konteks_tempat_saya.kemampuan): in
  // Mengajar · SD B an Admin platform who teaches there sees Buat Paket and Pustaka for SD B, not review, publishing
  // or the JSON import, which she still holds. No context that serves Studio, nothing. An evaluation persona keeps
  // the pre-L3 reading (C10). Narrowing only: the database decides every act from all of the person's grants.
  const kh = await konteksHalaman();
  if (kh === "TANPA_KONTEKS") return semua;
  if (!kh || kh.tempat === null) return [];
  const di = semua.find((i) => i.id === kh.tempat);
  const kemampuan = di ? di.capabilities.filter((c) => kh.kemampuan.includes(c)) : [];
  return di && kemampuan.length > 0 ? [{ ...di, capabilities: kemampuan }] : [];
});

/**
 * L3: the roles Studio reads to decide its tabs and its operator parts: the grants that give the active purpose in the
 * active place (C8), never all of the person's roles. An evaluation persona keeps its own roles (C10).
 */
export const peranStudio = cache(async (): Promise<string[]> => {
  const kh = await konteksHalaman();
  if (kh === "TANPA_KONTEKS") return (await peranSaya()) ?? [];
  return kh ? kh.peran : [];
});

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

/**
 * CR-87: the Studio tabs this person sees (src/lib/studio-tab.ts), from the same once-per-request capability answer
 * and roles the layout reads. A page that is not this person's sends them to Studio's home; the database still
 * decides every action.
 */
export const tabSaya = cache(async (): Promise<TabStudio[]> => {
  const [institutions, peran] = await Promise.all([studioInstitutions(), peranStudio()]);
  return tabStudio(new Set(institutions.flatMap((i) => i.capabilities)), peran);
});

export function can(inst: StudioInstitution | undefined, capability: string): boolean {
  return inst?.capabilities.includes(capability) ?? false;
}

/**
 * A result banner carried back from a server action, never an exception page.
 * BOB-07 (D-011): the action sends a code (and a reference for a failure
 * nobody named); the sentence is the copy table's. Nothing typed into the
 * address reaches the banner: an unknown code, reference or count is dropped.
 */
export function outcomeLine(q: QueryHasil, locale: Locale = "id"): string | null {
  const s = kataStudio(locale);
  return kalimatHasil(q, s, { ok: "studio.hasil.ok", gagal: "studio.hasil.gagal" });
}

export const short = (id: string | null | undefined) => (id ? id.slice(0, 8) : "—");
/** When something was recorded: the timestamp, with its year and WIB («9 Okt 2026, 07.30 WIB»; W3.3, RV-16). */
export const when = (iso: string | null, locale: Locale = "id") => tanggal(iso, "cap", locale) || "—";
