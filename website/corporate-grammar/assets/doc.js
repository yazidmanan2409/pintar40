// The grammar document's two small helpers. No storage, no network.

// 1 · Swatch values are read from the live tokens, so the document cannot
//     show one colour and the stylesheet use another.
const root = getComputedStyle(document.documentElement);
for (const code of document.querySelectorAll("[data-hex]")) {
  const probe = document.createElement("span");
  probe.style.color = `var(${code.dataset.hex})`;
  document.body.append(probe);
  const rgb = getComputedStyle(probe).color.match(/\d+/g)?.slice(0, 3).map(Number);
  probe.remove();
  code.textContent = rgb ? "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()
    : root.getPropertyValue(code.dataset.hex).trim();
}

// 2 · Replay the entrance in the motion section. Under reduced motion there
//     is nothing to replay, and the page says so.
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const replay = document.querySelector("[data-replay]");
const demo = document.querySelector("[data-motion-demo]");
if (reduce) {
  document.querySelector("[data-reduced-note]")?.removeAttribute("hidden");
  replay?.setAttribute("disabled", "");
} else if (replay && demo) {
  replay.addEventListener("click", () => {
    const items = demo.querySelectorAll("[data-reveal]");
    for (const i of items) i.classList.remove("is-in");
    void demo.offsetHeight;                      // let the hidden state paint
    requestAnimationFrame(() => { for (const i of items) i.classList.add("is-in"); });
  });
}
