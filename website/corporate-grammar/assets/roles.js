// Role pills: progressive disclosure for the reports section (direction C,
// usable by any). Without JavaScript every panel is visible, one under the
// other; with it, one panel shows at a time and the pill says which.
// State lives in the page only: nothing is stored, nothing is sent.
const pills = [...document.querySelectorAll("[data-role]")];
const panels = [...document.querySelectorAll("[data-role-panel]")];
function show(role) {
  for (const p of pills) p.setAttribute("aria-pressed", String(p.dataset.role === role));
  for (const panel of panels) panel.hidden = panel.dataset.rolePanel !== role;
}
if (pills.length && panels.length) {
  for (const p of pills) p.addEventListener("click", () => show(p.dataset.role));
  show(pills.find((p) => p.getAttribute("aria-pressed") === "true")?.dataset.role ?? pills[0].dataset.role);
}
