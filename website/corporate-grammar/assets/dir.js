// The grammar page's direction switch. The direction travels in ?dir= only
// (a, b or c): nothing is stored on the device. Loaded in <head>, before
// paint, so a page never flashes in the wrong direction.
(function () {
  var q = new URLSearchParams(location.search).get("dir");
  var dir = q === "b" || q === "c" ? q : "a";
  document.documentElement.setAttribute("data-dir", dir);
  document.addEventListener("DOMContentLoaded", function () {
    var links = document.querySelectorAll("[data-dir-link]");
    for (var i = 0; i < links.length; i += 1) {
      var d = links[i].getAttribute("data-dir-link");
      if (d === dir) links[i].setAttribute("aria-current", "true");
    }
    var labels = document.querySelectorAll("[data-dir-name]");
    var names = { a: "A · Editorial", b: "B · Instrument", c: "C · Human" };
    for (var j = 0; j < labels.length; j += 1) labels[j].textContent = names[dir];
  });
})();
