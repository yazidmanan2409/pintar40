/**
 * D-132(m): THE SIX EXPRESSIONS AWAITING DR GLADYS'S TERMINOLOGY REVIEW. SEMANTIC KEYS, NEVER INVENTED COPY.
 *
 * The Working Context (L3) needs six human-facing expressions the copy table does not have yet. Engineering does not
 * write them (D-128(g)): «temporary semantic keys/placeholders, not temporary invented product copy that could become
 * permanent by inertia». Each is declared here and placed where it belongs. Until its words exist it answers null and
 * the caller draws nothing: never the key, never a stand-in sentence. The behaviour does not depend on any of them
 * (design §7): the chooser's doors, the existing «Mau ke mana hari ini?» and the surface's own «not saved» carry it.
 *
 *   context.manage_label   the shell's name for Mengelola («Mengajar» and «Belajar» exist; «Mengelola» does not)
 *   context.not_held       on `/`: this account does not hold the purpose chosen (§2.3)
 *   context.other_context  on `/`: the page asked for belongs to another context (§2.6)
 *   context.invalid        on `/`: the context is no longer held (§2.7)
 *   context.other_school   an action refused because its target is outside the active context (§2.11)
 *   context.choose_place   the place step's question when a purpose has several places
 *
 * When Dr Gladys supplies the words, they go into the copy table under these keys and `istilah` returns them.
 */
export const ISTILAH_MENUNGGU = [
  "context.manage_label",
  "context.not_held",
  "context.other_context",
  "context.invalid",
  "context.other_school",
  "context.choose_place",
] as const;

export type IstilahMenunggu = (typeof ISTILAH_MENUNGGU)[number];

/** The words each expression has: none yet. Dr Gladys's words, once given, are what this answers (D-132(m)). */
const KATA: Partial<Record<IstilahMenunggu, string>> = {};

/** The expression's words, once they exist; null until then, and the caller draws nothing. */
export function istilah(kunci: IstilahMenunggu): string | null {
  return KATA[kunci] ?? null;
}
