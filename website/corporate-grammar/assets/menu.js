// The phone menu: below 960 px the header's four links move behind one
// button. The button says whether the menu is open; Escape closes it and
// returns focus. Nothing is stored and nothing is sent.
for (const button of document.querySelectorAll(".hdr__menu")) {
  const header = button.closest(".hdr");
  const nav = header?.querySelector(".hdr__nav");
  if (!nav) continue;
  nav.id ||= "menu-utama";
  button.setAttribute("aria-controls", nav.id);
  button.setAttribute("aria-expanded", "false");
  const set = (open) => { button.setAttribute("aria-expanded", String(open)); header.classList.toggle("is-open", open); };
  button.addEventListener("click", () => set(button.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("is-open")) { set(false); button.focus(); }
  });
}
