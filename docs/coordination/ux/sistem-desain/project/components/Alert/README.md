A state that concerns a whole section, said at the top of that section, with what to do about it.

**Status: CHANGED.** `.pin-banner`, `.pin-msg` and `.pin-perhatian` become this. Status discipline (spec §6) holds: no blocked ground on Management pages, readiness always on the quiet ground.

**Kinds.** Attention (needs a look, nothing broken), blocked (something failed or cannot go on), success (something became available), information (news), neutral (an honest "not yet").

**Anatomy.** An icon, a title that says the state («Kelas 5C belum punya guru»), one or two sentences on why and what it means, and at most one action.

**Rules**
- No toasts: a result is said at its action (Action feedback); a section's state is said at the section.
- No left-edge stripes: the ground and the icon carry the kind.
- Dismissible only when nothing is lost by dismissing it; an attention or blocked alert stays until it is resolved.
- `role="alert"` for a failure, `role="status"` for the rest.

**In PINTAR today.** `.pin-banner`, `.pin-msg`, `.pin-perhatian`, `.pin-refusal`.
