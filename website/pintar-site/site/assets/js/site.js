// PINTAR public website: four small behaviours, nothing more.
//
//   1. Entrance: elements fade and rise once as they arrive, then stay still.
//   2. Diagram progression: a diagram's stages light up once, in order.
//   3. The phone menu.
//   4. The contact form: preselects «Minta Demo», checks fields, sends to the
//      server, and shows the server's answer. Without this script the form
//      still posts to the same handler and works.
//
// No storage, no cookies, no third-party requests. Under reduced motion,
// nothing moves and everything is present from the start.

(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------------------------------------------------------------- 1 and 2
  if (!reduce && "IntersectionObserver" in window) {
    doc.classList.add("motion");
    var groups = document.querySelectorAll("[data-reveal-group]");
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].querySelectorAll("[data-reveal]");
      for (var k = 0; k < kids.length; k++) kids[k].style.setProperty("--i", String(Math.min(k, 3)));
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);
        if (el.hasAttribute("data-sequence")) {
          var steps = el.querySelectorAll("[data-step]");
          for (var i = 0; i < steps.length; i++) (function (s, d) { setTimeout(function () { s.classList.add("is-on"); }, d); })(steps[i], 160 * i);
        } else {
          el.classList.add("is-in");
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    var watched = document.querySelectorAll("[data-reveal], [data-sequence]");
    for (var w = 0; w < watched.length; w++) io.observe(watched[w]);
  }

  // ---------------------------------------------------------------- 3 menu
  var header = document.querySelector(".site-header");
  var menuBtn = document.querySelector(".menu-btn");
  if (header && menuBtn) {
    var setOpen = function (open) {
      menuBtn.setAttribute("aria-expanded", String(open));
      header.classList.toggle("is-open", open);
    };
    menuBtn.addEventListener("click", function () { setOpen(menuBtn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) { setOpen(false); menuBtn.focus(); }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) setOpen(false); });
  }

  // ---------------------------------------------------------------- 4 contact form
  var form = document.querySelector("form[data-contact]");
  if (!form) return;
  var lang = doc.lang === "en" ? "en" : "id";
  var MSG = {
    id: { name: "Tuliskan nama Anda.", email: "Tuliskan alamat email yang valid, misalnya nama@sekolah.sch.id.", subject: "Pilih subjek pesan.",
      message: "Tuliskan pesan Anda, setidaknya 10 karakter.", consent: "Centang persetujuan agar kami dapat memproses pesan Anda.",
      summary: "Ada yang perlu diperbaiki:", sending: "Mengirim…", failed: "Pesan belum terkirim. Coba lagi, atau kirim email langsung ke info@pintarselalu.com.",
      limited: "Terlalu banyak pesan dari jaringan ini dalam waktu singkat. Coba lagi nanti, atau kirim email langsung ke info@pintarselalu.com.",
      rejected: "Pesan Anda tidak dapat dikirim. Mohon periksa kembali isi pesan dan gunakan bahasa yang sesuai." },
    en: { name: "Please enter your name.", email: "Please enter a valid email address, for example name@school.sch.id.", subject: "Please choose a subject.",
      message: "Please write your message, at least 10 characters.", consent: "Please tick the consent box so that we can process your message.",
      summary: "Please correct the following:", sending: "Sending…", failed: "Your message was not sent. Please try again, or email info@pintarselalu.com directly.",
      limited: "Too many messages from this network in a short time. Please try again later, or email info@pintarselalu.com directly.",
      rejected: "Your message could not be sent. Please review its content and use appropriate language." }
  }[lang];

  // «Minta Demo» anywhere on the site arrives here with ?subjek=demo.
  var params = new URLSearchParams(location.search);
  var wanted = params.get("subjek") || params.get("subject");
  var subject = form.querySelector("[name=subject]");
  if (wanted && subject && subject.querySelector('option[value="' + wanted.replace(/[^a-z]/g, "") + '"]')) subject.value = wanted.replace(/[^a-z]/g, "");

  var started = form.querySelector("[name=started]");
  if (started) started.value = String(Date.now());

  var summary = form.querySelector(".form__summary");
  var status = form.querySelector("[data-status]");
  var button = form.querySelector("button[type=submit]");

  function fieldError(name, text) {
    var input = form.querySelector("[name=" + name + "]");
    var err = form.querySelector("#err-" + name);
    if (!input || !err) return;
    if (text) { input.setAttribute("aria-invalid", "true"); err.textContent = text; err.hidden = false; }
    else { input.removeAttribute("aria-invalid"); err.textContent = ""; err.hidden = true; }
  }
  function showErrors(errors) {
    var names = ["name", "email", "subject", "message", "consent"];
    var list = [];
    names.forEach(function (n) { fieldError(n, errors[n] ? MSG[n] : ""); if (errors[n]) list.push(n); });
    if (!list.length) { summary.hidden = true; return; }
    var ul = summary.querySelector("ul");
    ul.innerHTML = "";
    list.forEach(function (n) {
      var li = document.createElement("li"); var a = document.createElement("a");
      a.href = "#f-" + n; a.textContent = MSG[n];
      a.addEventListener("click", function (e) { e.preventDefault(); var t = form.querySelector("[name=" + n + "]"); if (t) t.focus(); });
      li.appendChild(a); ul.appendChild(li);
    });
    summary.querySelector("h2").textContent = MSG.summary;
    summary.hidden = false;
    summary.focus();
  }
  function check() {
    var e = {};
    var v = function (n) { var x = form.querySelector("[name=" + n + "]"); return x ? String(x.value || "").trim() : ""; };
    if (!v("name")) e.name = 1;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) e.email = 1;
    if (!v("subject")) e.subject = 1;
    if (v("message").length < 10) e.message = 1;
    if (!form.querySelector("[name=consent]").checked) e.consent = 1;
    return e;
  }

  form.setAttribute("novalidate", "");
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var errors = check();
    if (Object.keys(errors).length) { showErrors(errors); return; }
    showErrors({});
    button.setAttribute("aria-busy", "true"); button.disabled = true;
    status.textContent = MSG.sending;
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" }, credentials: "omit" })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }).then(function (j) { j.status = r.status; return j; }); })
      .then(function (j) {
        if (j.ok) {
          var done = document.getElementById("form-done");
          form.hidden = true; done.hidden = false; done.focus();
          return;
        }
        // A refusal by moderation: the owner's neutral wording, nothing repeated, no rule named.
        if (j.rejected) { status.textContent = MSG.rejected; return; }
        if (j.errors) { showErrors(j.errors); status.textContent = ""; }
        else status.textContent = j.status === 429 ? MSG.limited : MSG.failed;
      })
      .catch(function () { status.textContent = MSG.failed; })
      .then(function () { button.removeAttribute("aria-busy"); button.disabled = false; });
  });
})();
