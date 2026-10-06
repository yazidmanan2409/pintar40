// PINTAR corporate website — the motion grammar, as code.
//
// ENTRANCE ONLY, ONCE. An element marked [data-reveal] fades and rises a short
// distance the first time it enters the viewport, and never moves again.
// Siblings inside [data-reveal-group] arrive in order, at most four steps
// apart. Nothing loops, blinks, bounces or follows the scroll.
//
// NOTHING IS HIDDEN UNLESS IT CAN BE SHOWN. The `motion` class that hides
// content before it enters is only added when IntersectionObserver exists and
// the visitor has not asked for reduced motion. Without JavaScript, with
// reduced motion, or in a browser without the observer, every element is
// simply there from the start.
//
// Zero-write: no storage, no network.

(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("motion");

  function start() {
    var groups = document.querySelectorAll("[data-reveal-group]");
    for (var g = 0; g < groups.length; g += 1) {
      var items = groups[g].querySelectorAll(":scope > [data-reveal]");
      for (var k = 0; k < items.length; k += 1) items[k].style.setProperty("--i", String(Math.min(k, 3)));
    }
    var seen = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e += 1) {
        if (!entries[e].isIntersecting) continue;
        entries[e].target.classList.add("is-in");
        seen.unobserve(entries[e].target);         // once: it never animates again
      }
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    var all = document.querySelectorAll("[data-reveal]");
    for (var n = 0; n < all.length; n += 1) seen.observe(all[n]);
    // Anything already on screen at load arrives with the page.
    requestAnimationFrame(function () {
      for (var m = 0; m < all.length; m += 1) {
        var r = all[m].getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) { all[m].classList.add("is-in"); seen.unobserve(all[m]); }
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
