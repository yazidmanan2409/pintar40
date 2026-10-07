/**
 * CR-84 (3) (D-127; DG-24): A REFUSED SUBMISSION REOPENS WITH EXACTLY WHAT THE PERSON SENT.
 *
 * Studio's forms post to server actions that answer by sending the page back with a code (D-011). The page then drew
 * each form afresh from its defaults, so a refusal threw away what the person had typed or chosen. What they sent is
 * kept, for one press, in this browser tab's own session storage: never in the address (which reaches logs and
 * history) and never on the server. It is written when the form is sent, read and deleted the next time the form is
 * drawn, and put back only when that page says this form's submission was refused, for the same person, into the same
 * form (its hidden identity fields unchanged). A file is never kept.
 *
 * Pure over a minimal form shape, so the tests drive it with no browser.
 */

export type Bidang = { name: string; type: string; value: string; checked?: boolean };
export type Isian = { pemilik: string; nilai: Record<string, string> };

export const KUNCI_ISIAN = "pintar:isian:";

const disimpan = (b: Bidang) => b.name !== "" && b.type !== "file" && b.type !== "submit" && b.type !== "button" && b.type !== "password";

/** What a form holds now: every named field but files and buttons; a checkbox as "on" or "". */
export function isianDari(bidang: Iterable<Bidang>, pemilik: string): Isian {
  const nilai: Record<string, string> = {};
  for (const b of bidang) {
    if (!disimpan(b)) continue;
    nilai[b.name] = b.type === "checkbox" || b.type === "radio" ? (b.checked ? (b.type === "radio" ? b.value : "on") : (nilai[b.name] ?? "")) : b.value;
  }
  return { pemilik, nilai };
}

/**
 * Puts what was sent back into the same form: only for the same person, only when every hidden field still holds what
 * it held (the same item, the same finding), and never into a hidden field. Returns how many fields it restored.
 */
export function pulihkanIsian(bidang: Bidang[], isian: Isian | null, pemilik: string): number {
  if (!isian || isian.pemilik !== pemilik) return 0;
  for (const b of bidang) {
    if (b.type === "hidden" && b.name in isian.nilai && isian.nilai[b.name] !== b.value) return 0;
  }
  let n = 0;
  for (const b of bidang) {
    if (!disimpan(b) || b.type === "hidden" || !(b.name in isian.nilai)) continue;
    const v = isian.nilai[b.name];
    if (b.type === "checkbox") b.checked = v === "on";
    else if (b.type === "radio") b.checked = b.value === v;
    else b.value = v;
    n++;
  }
  return n;
}

/** Reads a stored value back, trusting nothing: anything not of the shape is nothing. */
export function bacaIsian(teks: string | null): Isian | null {
  if (!teks) return null;
  try {
    const x = JSON.parse(teks) as unknown;
    if (!x || typeof x !== "object") return null;
    const { pemilik, nilai } = x as Record<string, unknown>;
    if (typeof pemilik !== "string" || !nilai || typeof nilai !== "object") return null;
    const bersih: Record<string, string> = {};
    for (const [k, v] of Object.entries(nilai as Record<string, unknown>)) if (typeof v === "string") bersih[k] = v;
    return { pemilik, nilai: bersih };
  } catch {
    return null;
  }
}
