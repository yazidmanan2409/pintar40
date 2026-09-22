// Tiny DOM builder shared by every page. No framework, no build step.
//
// LESSON CARRIED FROM Mini-PINTAR: only genuine HTML boolean attributes
// (disabled, checked, required, selected, hidden) may be set as bare
// presence/absence. Everything else — especially aria-* — MUST be written
// with setAttribute(k, String(v)), or "aria-pressed": true silently
// becomes aria-pressed="" and no assistive tech or CSS selector ever
// matches it again.

const BOOL_PROPS = new Set(["disabled", "checked", "required", "selected", "hidden"]);

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) {
      if (BOOL_PROPS.has(k)) continue;
    }
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (BOOL_PROPS.has(k)) { if (v) node.setAttribute(k, ""); }
    else node.setAttribute(k, String(v));
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

/** A bilingual pair, matched to the role-view content convention. */
export const L = (id, en) => ({ id, en });

/** A labelled placeholder box that previews the real image's proportions. */
export function ph({ type, size, ratio, note = "" }, extraClass = "") {
  const [w, h] = ratio.split(":").map(Number);
  return el("div", { class: `ph ${extraClass}`.trim(), style: `aspect-ratio:${w}/${h}`,
    role: "img", "aria-label": `Placeholder: ${type}` }, [
    el("div", { class: "ph__tag" }, [
      el("b", { text: "IMAGE PLACEHOLDER" }),
      el("br"),
      `Type: ${type}`, el("br"),
      `Size: ${size} px`, el("br"),
      `Aspect ratio: ${ratio}`,
      note ? el("span", {}, [el("br"), note]) : null,
    ]),
  ]);
}
