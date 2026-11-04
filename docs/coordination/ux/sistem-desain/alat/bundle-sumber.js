/* @ds-bundle: {"format":4,"namespace":"Pintar","components":[]} */
/*
  PINTAR Design System v3 (PROPOSAL): the shared behaviour behind every preview.

  ONE implementation per interaction, so the same act behaves the same way on
  every surface: the action grammar (Simpan → Menyimpan… → ✓ Tersimpan), tabs,
  menus, tooltips, dialogs and drawers, a table's sort, selection and pages,
  PIN and code inputs, and the shell. Plain DOM, no library and no network.
  Previews declare what they need with data attributes and call
  Pintar.siapkan() once.

  Icons: Lucide (lucide-static 0.468.0), ISC License, Copyright (c) Lucide
  Contributors 2022, portions Copyright (c) Cole Bemis 2013-2022 (Feather, MIT).
  The path data below is copied from those files unchanged.

  Generated from docs/coordination/ux/sistem-desain/alat/bundle-sumber.js by
  alat/buat-bundle.mjs. Edit the source, not this file.
*/
(function () {
  "use strict";
  var IKON = /*IKON*/{};

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function ikon(nama, kelas) {
    var isi = IKON[nama] || "";
    return '<svg class="pds-ikon' + (kelas ? " " + kelas : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + isi + "</svg>";
  }

  function isiIkon(akar) {
    (akar || document).querySelectorAll("i[data-ikon]").forEach(function (el) {
      var span = document.createElement("span");
      span.innerHTML = ikon(el.getAttribute("data-ikon"), el.className);
      el.replaceWith(span.firstChild);
    });
  }

  /* ───────────────────────────────────── the network, for review only */
  var JARINGAN = { mode: "normal" };
  var WAKTU = { normal: 900, lambat: 4600, gagal: 1600 };

  /* ───────────────────────────── THE ACTION GRAMMAR (D-047, one pattern)
     receive → acknowledge (at once) → explain status → give the next step.
     The button never claims success: only the simulated server's answer
     turns it to «✓ Tersimpan». Over 3 s the status line explains the wait. */
  function aksi(btn) {
    var asli = btn.innerHTML;
    var form = btn.closest("form");
    var status = btn.getAttribute("data-status") ? document.querySelector(btn.getAttribute("data-status")) : null;
    var hasil = btn.getAttribute("data-hasil") ? document.querySelector(btn.getAttribute("data-hasil")) : null;

    function tampil(el, kelas, html) {
      if (!el) return;
      // A failure interrupts (role=alert); everything else is said politely (D-047, §13).
      if (el !== status) el.setAttribute("role", kelas === "pds-result-blocked" ? "alert" : "status");
      el.className = "pds-result " + kelas;
      el.innerHTML = html;
      el.hidden = false;
    }

    function pulih() {
      btn.innerHTML = asli;
      btn.removeAttribute("aria-busy");
      btn.removeAttribute("aria-disabled");
      btn.removeAttribute("data-keadaan");
      btn.style.minWidth = "";
    }

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      if (btn.getAttribute("aria-busy") === "true" || btn.getAttribute("data-keadaan") === "selesai") return;
      if (form && form.hasAttribute("data-validasi")) { if (!validasi(form)) return; }
      else if (form && !form.reportValidity()) return;
      btn.style.minWidth = btn.offsetWidth + "px";
      btn.setAttribute("aria-busy", "true");
      btn.setAttribute("aria-disabled", "true");
      btn.innerHTML = '<span class="pds-dot" aria-hidden="true"></span>' + esc(btn.getAttribute("data-sibuk") || "Memproses…");
      if (hasil) hasil.hidden = true;
      tampil(status, "pds-result-working", '<span class="pds-dot" aria-hidden="true"></span><span>' + esc(btn.getAttribute("data-sibuk") || "Memproses…") + "</span>");
      var mode = JARINGAN.mode;
      var lama = setTimeout(function () {
        if (btn.getAttribute("aria-busy") === "true") {
          tampil(status, "pds-result-working", '<span class="pds-dot" aria-hidden="true"></span><span>' + esc(btn.getAttribute("data-sibuk") || "Memproses…") + " Jaringan sedang lambat. PINTAR masih bekerja; Anda tidak perlu menekan lagi.</span>");
        }
      }, 3000);
      setTimeout(function () {
        clearTimeout(lama);
        if (status) status.hidden = true;
        if (mode === "gagal") {
          pulih();
          tampil(hasil, "pds-result-blocked", ikon("circle-alert") + "<span><strong>" + esc(btn.getAttribute("data-gagal") || "Belum tersimpan.") + "</strong> Sambungan ke PINTAR terputus sebelum selesai. Periksa jaringan, lalu tekan «" + esc(btn.textContent.trim()) + "» lagi. Isian Anda masih ada.</span>");
          return;
        }
        var lanjut = btn.getAttribute("data-lanjut");
        // EMAIL (D-098(c), EMAILJUJUR-L01): PINTAR cannot confirm delivery. The
        // server accepted the request and nothing more, so the button returns to
        // its verb and the line says PINTAR is sending. Never ✓, never «Terkirim».
        if (btn.hasAttribute("data-email")) {
          pulih();
          tampil(hasil, "pds-result-info", ikon("info") + "<span>" + esc(btn.getAttribute("data-hasil-teks") || "PINTAR sedang mengirim.") + "</span>");
          return;
        }
        btn.removeAttribute("aria-busy");
        btn.setAttribute("data-keadaan", "selesai");
        btn.innerHTML = ikon("check") + esc(btn.getAttribute("data-selesai") || "Selesai");
        var lanjutKe = btn.getAttribute("data-lanjut-ke");
        tampil(hasil, "pds-result-ok", ikon("circle-check") + "<span>" + esc(btn.getAttribute("data-hasil-teks") || "Perubahan tersimpan.") + (lanjut ? ' <a class="pds-link" href="#"' + (lanjutKe ? ' data-ke="' + esc(lanjutKe) + '"' : "") + ">" + esc(lanjut) + "</a>" : "") + "</span>");
      }, WAKTU[mode] || WAKTU.normal);
    });

    if (form) {
      form.addEventListener("input", function () {
        if (btn.getAttribute("data-keadaan") === "selesai") {
          pulih();
          if (hasil) hasil.hidden = true;
        }
      });
    }
    var ulang = btn.getAttribute("data-ulang") ? document.querySelector(btn.getAttribute("data-ulang")) : null;
    if (ulang) ulang.addEventListener("click", function () { pulih(); if (hasil) hasil.hidden = true; if (status) status.hidden = true; });
  }

  /* ───────────────────────────── VALIDATION: on submit, never per keystroke
     Each invalid field says what is wrong under itself; a long form also gets
     a summary at the top that takes focus and links to each field. Nothing
     the person typed is cleared. A fixed field clears its own message. */
  function validasi(form) {
    var salah = [];
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.type === "radio" || el.type === "checkbox" || el.disabled) return;
      var f = el.closest(".pds-field");
      var g = f ? f.querySelector(".pds-error") : null;
      var ok = el.checkValidity();
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      if (g) g.hidden = ok;
      if (!ok) salah.push({ id: el.id, pesan: el.getAttribute("data-galat") || "Isi bagian ini." });
    });
    var r = form.querySelector("[data-ringkasan-galat]");
    if (r) {
      r.hidden = salah.length === 0;
      var ul = r.querySelector("ul");
      if (ul) ul.innerHTML = salah.map(function (x) { return '<li><a href="#' + x.id + '" data-ke-isian="' + x.id + '">' + esc(x.pesan) + "</a></li>"; }).join("");
      if (salah.length) r.focus();
    } else if (salah.length) {
      var pertama = document.getElementById(salah[0].id);
      if (pertama) pertama.focus();
    }
    return salah.length === 0;
  }
  function siapValidasi(form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("click", function (e) {
      var a = e.target.closest("[data-ke-isian]");
      if (!a) return;
      e.preventDefault();
      var el = document.getElementById(a.getAttribute("data-ke-isian"));
      if (el) el.focus();
    });
    form.addEventListener("input", function (e) {
      var el = e.target;
      if (el.getAttribute("aria-invalid") === "true" && el.checkValidity()) {
        el.setAttribute("aria-invalid", "false");
        var f = el.closest(".pds-field");
        var g = f ? f.querySelector(".pds-error") : null;
        if (g) g.hidden = true;
      }
    });
  }

  /* ───────────────────────────────────────────── tabs (role=tablist) */
  function tabs(daftar) {
    var tab = Array.prototype.slice.call(daftar.querySelectorAll('[role="tab"]'));
    function pilih(t, fokus) {
      tab.forEach(function (x) {
        var aktif = x === t;
        x.setAttribute("aria-selected", aktif ? "true" : "false");
        x.tabIndex = aktif ? 0 : -1;
        var p = document.getElementById(x.getAttribute("aria-controls"));
        if (p) p.hidden = !aktif;
      });
      if (fokus) t.focus();
    }
    tab.forEach(function (t, i) {
      t.addEventListener("click", function () { pilih(t, false); });
      t.addEventListener("keydown", function (e) {
        var j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tab.length;
        if (e.key === "ArrowLeft") j = (i - 1 + tab.length) % tab.length;
        if (e.key === "Home") j = 0;
        if (e.key === "End") j = tab.length - 1;
        if (j !== null) { e.preventDefault(); pilih(tab[j], true); }
      });
    });
    var awal = tab.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tab[0];
    if (awal) pilih(awal, false);
  }

  /* ──────────────────────────────────────────────────────────── menu */
  function menu(tombol) {
    var m = document.getElementById(tombol.getAttribute("aria-controls"));
    if (!m) return;
    function item() { return Array.prototype.slice.call(m.querySelectorAll('[role="menuitem"]')); }
    function tutup(kembali) {
      m.hidden = true;
      tombol.setAttribute("aria-expanded", "false");
      if (kembali) tombol.focus();
    }
    function buka() {
      document.querySelectorAll('[aria-haspopup="menu"][aria-expanded="true"]').forEach(function (b) { if (b !== tombol) b.click(); });
      m.hidden = false;
      tombol.setAttribute("aria-expanded", "true");
      var i = item();
      if (i[0]) i[0].focus();
    }
    tombol.addEventListener("click", function (e) {
      e.stopPropagation();
      if (m.hidden) buka(); else tutup(false);
    });
    tombol.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" && m.hidden) { e.preventDefault(); buka(); }
    });
    m.addEventListener("keydown", function (e) {
      var i = item(), k = i.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); tutup(true); }
      if (e.key === "ArrowDown") { e.preventDefault(); i[(k + 1) % i.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); i[(k - 1 + i.length) % i.length].focus(); }
      if (e.key === "Home") { e.preventDefault(); i[0].focus(); }
      if (e.key === "End") { e.preventDefault(); i[i.length - 1].focus(); }
      if (e.key === "Tab") tutup(false);
    });
    m.addEventListener("click", function (e) {
      var it = e.target.closest('[role="menuitem"]');
      if (it) { e.preventDefault(); tutup(true); var ke = it.getAttribute("data-dialog-buka"); if (ke) bukaDialog(ke, tombol); }
    });
    document.addEventListener("click", function (e) {
      if (!m.hidden && !m.contains(e.target) && e.target !== tombol) tutup(false);
    });
  }

  /* ───────────────────────────────────────────────────────── tooltip */
  function tooltip(el) {
    if (el.hasAttribute("data-tip-siap")) return;
    el.setAttribute("data-tip-siap", "");
    var teks = el.getAttribute("data-tip");
    var host = document.createElement("span");
    host.className = "pds-tip-host";
    el.parentNode.insertBefore(host, el);
    host.appendChild(el);
    var tip = document.createElement("span");
    tip.className = "pds-tooltip" + (el.getAttribute("data-tip-arah") === "kanan" ? " pds-tip-kanan" : "");
    tip.setAttribute("aria-hidden", "true");
    tip.textContent = teks;
    tip.hidden = true;
    host.appendChild(tip);
    var tunda;
    function perlu() {
      // A navigation item needs its tooltip only while its label is hidden (the rail).
      var lab = el.querySelector(".pds-nav-label");
      // 4.0: the rail's state (the navigation at its 72 px), never the label's CSS
      var nav = el.closest(".pds-nav");
      return !lab || (!!nav && nav.getBoundingClientRect().width <= 80);
    }
    function tampil(segera) { if (!perlu()) return; clearTimeout(tunda); if (segera) { tip.hidden = false; return; } tunda = setTimeout(function () { tip.hidden = false; }, 400); } // 4.0: keyboard focus shows it at once
    function sembunyi() { clearTimeout(tunda); tip.hidden = true; }
    el.addEventListener("mouseenter", function () { tampil(false); });
    el.addEventListener("mouseleave", sembunyi);
    el.addEventListener("focus", function () { if (el.matches(":focus-visible")) tampil(true); });
    el.addEventListener("blur", sembunyi);
    el.addEventListener("keydown", function (e) { if (e.key === "Escape") sembunyi(); });
  }

  /* ───────────────────────────────────────────── dialog and drawer */
  function bukaDialog(id) {
    var d = document.getElementById(id);
    if (d && !d.open) d.showModal();
  }
  function dialogs(akar) {
    akar.querySelectorAll("[data-dialog-buka]").forEach(function (b) {
      if (b.getAttribute("role") === "menuitem") return;
      b.addEventListener("click", function () { bukaDialog(b.getAttribute("data-dialog-buka")); });
    });
    akar.querySelectorAll("dialog").forEach(function (d) {
      d.addEventListener("click", function (e) { if (e.target === d && d.hasAttribute("data-tutup-luar")) d.close(); });
      d.querySelectorAll("[data-dialog-tutup]").forEach(function (b) {
        b.addEventListener("click", function () { d.close(b.getAttribute("data-dialog-tutup") || ""); });
      });
    });
  }

  /* ───────────────────────────────────────────────────────── switch */
  function sakelar(s) {
    var kata = s.closest(".pds-switch-row") ? s.closest(".pds-switch-row").querySelector("[data-switch-kata]") : null;
    function tulis() {
      if (kata) kata.textContent = s.getAttribute("aria-checked") === "true" ? (kata.getAttribute("data-aktif") || "Aktif") : (kata.getAttribute("data-nonaktif") || "Nonaktif");
    }
    s.addEventListener("click", function () {
      s.setAttribute("aria-checked", s.getAttribute("aria-checked") === "true" ? "false" : "true");
      tulis();
    });
    tulis();
  }

  /* ─────────────────────────────────────────────── PIN and code */
  function pin(wrap) {
    var input = wrap.querySelector("input");
    var lihat = wrap.querySelector("[data-pin-lihat]");
    input.addEventListener("input", function () { input.value = input.value.replace(/\D/g, "").slice(0, 4); });
    if (lihat) lihat.addEventListener("click", function () {
      var tampak = input.type === "text";
      input.type = tampak ? "password" : "text";
      lihat.setAttribute("aria-pressed", tampak ? "false" : "true");
      lihat.setAttribute("aria-label", tampak ? "Tampilkan PIN" : "Sembunyikan PIN");
      lihat.innerHTML = ikon(tampak ? "eye" : "eye-off");
    });
  }
  function kode(input) {
    input.addEventListener("input", function () {
      var d = input.value.replace(/\D/g, "").slice(0, 6);
      input.value = d.length > 3 ? d.slice(0, 3) + " " + d.slice(3) : d;
    });
  }

  /* ──────────────── password rules: each rule ticks as it is met, never red */
  function aturan(wrap) {
    var input = wrap.querySelector("input");
    var butir = wrap.querySelectorAll("[data-aturan]");
    var lihat = wrap.querySelector("[data-pw-lihat]");
    var UJI = {
      panjang: function (v) { return v.length >= 8; },
      kecil: function (v) { return /[a-z]/.test(v); },
      besar: function (v) { return /[A-Z]/.test(v); },
      angka: function (v) { return /[0-9]/.test(v); }
    };
    function tulis() {
      butir.forEach(function (b) {
        var ok = UJI[b.getAttribute("data-aturan")](input.value);
        b.setAttribute("data-keadaan", ok ? "selesai" : "");
        var sr = b.querySelector(".pds-sr"); if (sr) sr.textContent = ok ? " (terpenuhi)" : "";
      });
    }
    input.addEventListener("input", tulis);
    if (lihat) lihat.addEventListener("click", function () {
      var tampak = input.type === "text";
      input.type = tampak ? "password" : "text";
      lihat.setAttribute("aria-pressed", tampak ? "false" : "true");
      lihat.setAttribute("aria-label", tampak ? "Tampilkan password" : "Sembunyikan password");
      lihat.innerHTML = ikon(tampak ? "eye" : "eye-off");
    });
    tulis();
  }

  /* ──────────────────────────────────────────────────────── search */
  function cari(wrap) {
    var input = wrap.querySelector("input");
    var hapus = wrap.querySelector(".pds-search-hapus");
    if (!hapus) return;
    function sinkron() { hapus.hidden = !input.value; }
    input.addEventListener("input", sinkron);
    hapus.addEventListener("click", function () { input.value = ""; sinkron(); input.dispatchEvent(new Event("input", { bubbles: true })); input.focus(); });
    sinkron();
  }

  /* ──────────────────── TABLE: sort, filter, select and pages, together */
  function tabel(wrap) {
    var t = wrap.querySelector("table");
    var tbody = t.tBodies[0];
    var semua = Array.prototype.slice.call(tbody.querySelectorAll("tr[data-baris]"));
    var kosong = tbody.querySelector("tr.pds-table-empty");
    var ukuran = Number(wrap.getAttribute("data-per-halaman") || 5);
    var halaman = 1, urut = null, arah = 1;
    var cariIn = wrap.querySelector("[data-tabel-cari]");
    var saring = wrap.querySelectorAll("[data-tabel-saring]");
    var saringPilih = wrap.querySelector("[data-tabel-saring-pilih]");
    var pager = wrap.querySelector(".pds-pager");
    var bulk = wrap.querySelector(".pds-bulk");
    var kepalaCek = t.querySelector("thead .pds-check");

    function cocok(tr) {
      var q = cariIn ? cariIn.value.trim().toLowerCase() : "";
      if (q && tr.getAttribute("data-cari").toLowerCase().indexOf(q) === -1) return false;
      var lolos = true;
      saring.forEach(function (s) { if (s.checked && s.value !== "semua" && tr.getAttribute("data-status") !== s.value) lolos = false; });
      return lolos;
    }
    function nilai(tr, k) {
      var sel = tr.children[k];
      var v = sel.getAttribute("data-nilai");
      return v !== null ? Number(v) : sel.textContent.trim().toLowerCase();
    }
    function gambar() {
      var baris = semua.filter(cocok);
      if (urut !== null) baris.sort(function (a, b) { var x = nilai(a, urut), y = nilai(b, urut); return (x > y ? 1 : x < y ? -1 : 0) * arah; });
      var total = baris.length;
      var hal = Math.max(1, Math.ceil(total / ukuran));
      if (halaman > hal) halaman = hal;
      var awal = (halaman - 1) * ukuran;
      semua.forEach(function (tr) { tr.hidden = true; });
      baris.slice(awal, awal + ukuran).forEach(function (tr) { tr.hidden = false; tbody.appendChild(tr); });
      if (kosong) { tbody.appendChild(kosong); kosong.hidden = total !== 0; var q = kosong.querySelector("[data-tabel-kueri]"); if (q) q.textContent = cariIn ? cariIn.value.trim() : ""; }
      if (pager) {
        pager.hidden = total === 0;
        var r = pager.querySelector("[data-pager-ringkas]");
        if (r) r.textContent = total ? "Menampilkan " + (awal + 1) + "–" + Math.min(awal + ukuran, total) + " dari " + total + " " + (wrap.getAttribute("data-benda") || "baris") : "";
        var pos = pager.querySelector("[data-pager-posisi]");
        if (pos) pos.textContent = "Halaman " + halaman + " dari " + hal;
        var kecil = pager.querySelector("[data-pager-kecil]");
        if (kecil) kecil.textContent = halaman + " / " + hal;
        var sebelum = pager.querySelector("[data-pager-sebelum]"), sesudah = pager.querySelector("[data-pager-sesudah]");
        if (sebelum) { sebelum.disabled = halaman <= 1; }
        if (sesudah) { sesudah.disabled = halaman >= hal; }
        var nomor = pager.querySelector(".pds-pager-nomor");
        if (nomor) {
          var h = [];
          for (var i = 1; i <= hal; i++) {
            if (i === 1 || i === hal || Math.abs(i - halaman) <= 1) h.push(i);
            else if (h[h.length - 1] !== "…") h.push("…");
          }
          nomor.innerHTML = h.map(function (n) {
            return n === "…" ? '<span class="pds-pager-elipsis" aria-hidden="true">…</span>'
              : '<button type="button" class="pds-btn pds-btn-quiet" data-ke="' + n + '"' + (n === halaman ? ' aria-current="page"' : "") + ' aria-label="Halaman ' + n + '">' + n + "</button>";
          }).join("");
        }
      }
      sinkronPilih();
    }
    function sinkronPilih() {
      var cek = semua.map(function (tr) { return tr.querySelector(".pds-check"); }).filter(Boolean);
      var dipilih = cek.filter(function (c) { return c.checked; }).length;
      semua.forEach(function (tr) { var c = tr.querySelector(".pds-check"); if (c) tr.setAttribute("aria-selected", c.checked ? "true" : "false"); });
      if (kepalaCek) { kepalaCek.checked = dipilih > 0 && dipilih === cek.length; kepalaCek.indeterminate = dipilih > 0 && dipilih < cek.length; }
      if (bulk) { bulk.hidden = dipilih === 0; var n = bulk.querySelector("[data-bulk-jumlah]"); if (n) n.textContent = dipilih + " dipilih"; }
    }
    t.querySelectorAll("th .pds-sort").forEach(function (b) {
      b.addEventListener("click", function () {
        var th = b.closest("th");
        var k = Array.prototype.indexOf.call(th.parentNode.children, th);
        arah = urut === k ? -arah : 1;
        urut = k;
        t.querySelectorAll("thead th").forEach(function (x) { x.removeAttribute("aria-sort"); var ik = x.querySelector(".pds-sort .pds-ikon"); if (ik) ik.outerHTML = ikon("arrow-up-down"); });
        th.setAttribute("aria-sort", arah === 1 ? "ascending" : "descending");
        var ik = b.querySelector(".pds-ikon");
        if (ik) ik.outerHTML = ikon(arah === 1 ? "arrow-up" : "arrow-down");
        gambar();
      });
    });
    if (cariIn) cariIn.addEventListener("input", function () { halaman = 1; gambar(); });
    saring.forEach(function (s) { s.addEventListener("change", function () { if (saringPilih && s.checked) saringPilih.value = s.value; halaman = 1; gambar(); }); });
    if (saringPilih) saringPilih.addEventListener("change", function () {
      saring.forEach(function (s) { s.checked = s.value === saringPilih.value; });
      halaman = 1; gambar();
    });
    if (pager) pager.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b || b.disabled) return;
      if (b.hasAttribute("data-pager-sebelum")) halaman--;
      else if (b.hasAttribute("data-pager-sesudah")) halaman++;
      else if (b.getAttribute("data-ke")) halaman = Number(b.getAttribute("data-ke"));
      gambar();
      var akt = pager.querySelector('[aria-current="page"]');
      if (akt && b.getAttribute("data-ke")) akt.focus();
    });
    tbody.addEventListener("change", function (e) { if (e.target.matches(".pds-check")) sinkronPilih(); });
    if (kepalaCek) kepalaCek.addEventListener("change", function () {
      semua.forEach(function (tr) { var c = tr.querySelector(".pds-check"); if (c) c.checked = kepalaCek.checked; });
      sinkronPilih();
    });
    var batal = wrap.querySelector("[data-bulk-batal]");
    if (batal) batal.addEventListener("click", function () { semua.forEach(function (tr) { var c = tr.querySelector(".pds-check"); if (c) c.checked = false; }); sinkronPilih(); if (kepalaCek) kepalaCek.focus(); });
    wrap.querySelectorAll("[data-tabel-reset]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (cariIn) cariIn.value = "";
        saring.forEach(function (s) { s.checked = s.value === "semua"; });
        if (saringPilih) saringPilih.value = "semua";
        halaman = 1; gambar();
        if (cariIn) { cariIn.dispatchEvent(new Event("input", { bubbles: true })); cariIn.focus(); }
      });
    });
    gambar();
  }

  /* ─────────────────── THE SHELL: who sees which places (today's rules)
     The places come from D-010 (each role's home), DAISY-11 (Studio for the
     roles that may draft), WP6B (an educator also sees Pembelajaran Saya) and
     Konfigurasi's own links (Pendataan, Aktivasi akun, Keamanan, Email uji).
     This proposal does not decide the menu; it draws today's. */
  var TEMPAT = {
    kelas: { label: "Kelas", ikon: "users" },
    pembelajaran: { label: "Pembelajaran Saya", ikon: "book-open" },
    pimpinan: { label: "Pimpinan", ikon: "chart-no-axes-column" },
    konfigurasi: { label: "Konfigurasi", ikon: "settings" },
    pendataan: { label: "Pendataan", ikon: "file-spreadsheet" },
    aktivasi: { label: "Aktivasi akun", ikon: "user-check" },
    studio: { label: "Studio", ikon: "square-pen" },
    keamanan: { label: "Keamanan", ikon: "shield" },
    emailuji: { label: "Email uji", ikon: "mail" }
  };
  var PERSONA = {
    guru: { nama: "Rina Kartika", inisial: "RK", konteks: "Guru · SDN Kaliandra 1", grup: [{ judul: "Mengajar", isi: ["kelas", "studio"] }, { judul: "Belajar", isi: ["pembelajaran"] }], kini: "kelas", bantuan: true },
    kadep: { nama: "Agus Setiawan", inisial: "AS", konteks: "Guru · Kepala departemen", grup: [{ judul: "Mengajar", isi: ["kelas", "pimpinan", "studio"] }, { judul: "Belajar", isi: ["pembelajaran"] }], kini: "pimpinan", bantuan: true },
    dekan: { nama: "Siti Rahayu", inisial: "SR", konteks: "Dekan · Universitas Kaliandra", grup: [{ isi: ["pimpinan"] }], kini: "pimpinan", bantuan: false },
    adminsekolah: { nama: "Maya Kusuma", inisial: "MK", konteks: "Admin sekolah · SDN Kaliandra 1", grup: [{ isi: ["konfigurasi", "pendataan", "aktivasi", "studio"] }], kini: "konfigurasi", bantuan: false },
    adminplatform: { nama: "Dimas Anggara", inisial: "DA", konteks: "Admin platform", grup: [{ isi: ["konfigurasi", "pendataan", "aktivasi", "studio", "keamanan", "emailuji"] }], kini: "konfigurasi", bantuan: false }
  };

  function shell(host) {
    var s = host.querySelector(".pds-shell");
    var statis = host.hasAttribute("data-shell-statis");
    var navDaftar = host.querySelectorAll("[data-shell-nav]");
    var identitas = host.querySelectorAll("[data-shell-identitas]");
    var tempatBar = host.querySelector(".pds-bar-tempat");
    var judul = host.querySelector("[data-shell-judul]");
    var cakupan = host.querySelector("[data-shell-cakupan]");

    function navHtml(p) {
      var urut = 0;
      function item(k) {
        var t = TEMPAT[k];
        return '<li><a href="#" class="pds-nav-item" data-tempat="' + k + '"' + (k === p.kini ? ' aria-current="page"' : "") + ' aria-label="' + esc(t.label) + '">' + ikon(t.ikon) + '<span class="pds-nav-label">' + esc(t.label) + "</span></a></li>";
      }
      // Group labels only where the person has two contexts (WP6B: teaching and
      // their own learning). One context: one plain list, no label.
      if (p.grup.length < 2) return p.grup[0].isi.map(item).join("");
      return p.grup.map(function (g) {
        var id = "pds-grup-" + (++urut) + "-" + Math.random().toString(36).slice(2, 7);
        return '<li class="pds-nav-grup-isi"><span class="pds-nav-grup pds-eyebrow" id="' + id + '">' + esc(g.judul) + '</span><ul class="pds-nav-daftar" aria-labelledby="' + id + '">' + g.isi.map(item).join("") + "</ul></li>";
      }).join("");
    }
    function pasang(kunci) {
      var p = PERSONA[kunci];
      navDaftar.forEach(function (ul) { ul.innerHTML = navHtml(p); });
      identitas.forEach(function (el) {
        el.querySelector("[data-id-inisial]").textContent = p.inisial;
        el.querySelector("[data-id-nama]").textContent = p.nama;
        el.querySelector("[data-id-konteks]").textContent = p.konteks;
        // 4.0: the identity button is named by its own text (WCAG 2.5.3), never an aria-label
      });
      host.querySelectorAll("[data-shell-bantuan]").forEach(function (b) { b.hidden = !p.bantuan; });
      var kini = TEMPAT[p.kini].label;
      if (tempatBar) tempatBar.textContent = kini;
      if (judul) judul.textContent = { kelas: "Kelas 5A · Matematika", pimpinan: "Sekolah Anda, sekilas", konfigurasi: "Konfigurasi sekolah" }[p.kini] || kini;
      if (cakupan) cakupan.textContent = p.kini === "kelas" ? "Kelas" : kini;
      host.querySelectorAll("[data-shell-isi]").forEach(function (el) { el.hidden = el.getAttribute("data-shell-isi") !== p.kini; });
      tipRail();
    }
    function tipRail() {
      host.querySelectorAll(".pds-nav .pds-nav-item").forEach(function (a) {
        if (!a.hasAttribute("data-tip")) {
          a.setAttribute("data-tip", a.textContent.trim());
          a.setAttribute("data-tip-arah", "kanan");
          tooltip(a);
        }
      });
    }
    host.querySelectorAll("[data-shell-persona]").forEach(function (r) {
      r.addEventListener("change", function () { if (r.checked) pasang(r.value); });
    });
    host.querySelectorAll("[data-shell-lebar]").forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        var w = r.value === "penuh" ? "" : r.value + "px";
        host.querySelector(".pds-shell-host").style.maxWidth = w;
      });
    });
    var ciut = host.querySelector("[data-shell-ciut]");
    if (ciut) ciut.addEventListener("click", function () {
      var lab = host.querySelector(".pds-nav .pds-nav-label");
      var navNow = host.querySelector(".pds-shell .pds-nav");
      var ya = !(navNow && navNow.getBoundingClientRect().width <= 80); // 4.0: the rail's state
      s.setAttribute("data-ciut", ya ? "ya" : "tidak");
      ciut.setAttribute("aria-label", ya ? "Lebarkan navigasi" : "Ciutkan navigasi");
      ciut.setAttribute("aria-expanded", ya ? "false" : "true");
      ciut.innerHTML = ikon(ya ? "panel-left-open" : "panel-left-close");
    });
    if (!statis) host.addEventListener("click", function (e) {
      var a = e.target.closest(".pds-nav-item[data-tempat]");
      if (!a) return;
      e.preventDefault();
      if (a.getAttribute("aria-current") === "page") return;
      // A place clicked: heard at once (the working dot), then the page.
      a.insertAdjacentHTML("beforeend", '<span class="pds-dot" aria-hidden="true"></span>');
      setTimeout(function () {
        host.querySelectorAll(".pds-nav-item").forEach(function (x) { x.removeAttribute("aria-current"); var d = x.querySelector(".pds-dot"); if (d) d.remove(); });
        host.querySelectorAll('.pds-nav-item[data-tempat="' + a.getAttribute("data-tempat") + '"]').forEach(function (x) { x.setAttribute("aria-current", "page"); });
        var lab = TEMPAT[a.getAttribute("data-tempat")].label;
        if (tempatBar) tempatBar.textContent = lab;
        if (judul) judul.textContent = lab;
        if (cakupan) cakupan.textContent = lab;
        host.querySelectorAll("[data-shell-isi]").forEach(function (el) { el.hidden = true; });
        var d = host.querySelector("dialog[open]");
        if (d) d.close();
      }, 700);
    });
    if (statis) { tipRail(); return; }
    var awal = host.querySelector("[data-shell-persona]:checked");
    pasang(awal ? awal.value : "guru");
  }

  /* ──────────────────────── A COMPOSED JOURNEY (specimen only, 11-validation.md §1)
     Not product behaviour: in PINTAR each screen is its own page. Here the screens
     of one journey sit in one card, [data-layar="id"], and anything carrying
     data-ke="id" moves to that screen the way a page change would: heard at once
     (the working dot), then the new screen, its title, and focus on its heading.
     The review bar above the screens ([data-lompat]) jumps straight to a step, and
     «Mark new words» outlines every word that is not in the copy table yet. */
  function perjalanan(host) {
    var layar = host.querySelectorAll("[data-layar]");
    var lompat = host.querySelectorAll("[data-lompat]");
    var catatan = host.querySelector("[data-jalan-catatan]");
    var pertama = layar.length ? layar[0].getAttribute("data-layar") : "";
    function pergi(id, fokus) {
      var tujuan = host.querySelector('[data-layar="' + id + '"]');
      if (!tujuan) return;
      host.querySelectorAll("dialog[open]").forEach(function (d) { d.close(); });
      host.querySelectorAll(".pds-menu:not([hidden])").forEach(function (m) { m.hidden = true; });
      layar.forEach(function (l) { l.hidden = l !== tujuan; });
      lompat.forEach(function (b) {
        if (b.getAttribute("data-lompat") === id) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
      if (catatan) catatan.hidden = true;
      if (tujuan.getAttribute("data-judul-hal")) document.title = tujuan.getAttribute("data-judul-hal");
      window.scrollTo(0, 0);
      var h = tujuan.querySelector("h1");
      if (fokus && h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    }
    host.addEventListener("click", function (e) {
      var a = e.target.closest("[data-ke]");
      if (a && host.contains(a)) {
        e.preventDefault();
        if (a.getAttribute("aria-busy") === "true") return;
        var ke = a.getAttribute("data-ke");
        if (a.hasAttribute("data-segera")) { pergi(ke, true); return; }
        // Heard at once: the working dot on what was clicked, until the next screen is there.
        a.setAttribute("aria-busy", "true");
        a.insertAdjacentHTML("beforeend", '<span class="pds-dot" aria-hidden="true"></span>');
        setTimeout(function () {
          a.removeAttribute("aria-busy");
          var d = a.querySelector(".pds-dot"); if (d) d.remove();
          pergi(ke, true);
        }, 450);
        return;
      }
      var b = e.target.closest("[data-lompat]");
      if (b && host.contains(b)) { pergi(b.getAttribute("data-lompat"), true); return; }
      // A real place or link that this journey does not walk: say so in the review bar, change nothing.
      var luar = e.target.closest("[data-layar] a[href='#']:not([data-ke]):not([data-dialog-buka]), [data-layar] .pds-nav-item:not([data-ke]):not([data-shell-ciut])");
      if (luar && catatan) {
        e.preventDefault();
        catatan.hidden = false;
        catatan.textContent = "«" + (luar.getAttribute("aria-label") || luar.textContent).trim() + "» is outside this journey; nothing changes.";
      }
    });
    var tandai = host.querySelector("[data-tandai-baru]");
    if (tandai) tandai.addEventListener("change", function () { host.classList.toggle("pds-tandai-baru", tandai.checked); });
    var ulang = host.querySelector("[data-jalan-ulang]");
    if (ulang) ulang.addEventListener("click", function () { location.reload(); });
    pergi(pertama, false);
  }

  /* ──────────────────────────────────────────────── the file field */
  function berkas(host) {
    var input = host.querySelector('input[type="file"]'), nama = host.querySelector("[data-berkas-nama] span");
    if (!input || !nama) return;
    input.addEventListener("change", function () {
      var f = Array.prototype.map.call(input.files || [], function (x) { return x.name; });
      nama.textContent = f.length ? f.join(", ") : (nama.parentNode.getAttribute("data-kosong") || "");
    });
  }

  /* ──────────────────────────────────────────── tabs past the edge (F10) */
  // A row of tabs wider than its space scrolls; while more follow, its edge fades, and the
  // current tab is kept in view.
  function tabTepi(baris) {
    function atur() {
      var lebih = baris.scrollWidth > baris.clientWidth + 1 && baris.scrollLeft + baris.clientWidth < baris.scrollWidth - 1;
      baris.classList.toggle("pds-tabs-lebih", lebih);
    }
    var kini = baris.querySelector('[aria-current="page"], [aria-selected="true"]');
    if (kini && baris.scrollWidth > baris.clientWidth) baris.scrollLeft = Math.max(0, kini.offsetLeft - baris.offsetLeft - 16);
    baris.addEventListener("scroll", atur, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(atur).observe(baris);
    atur();
  }

  /* ─────────────────────────────────────────────────────── siapkan */
  // ── dates (Dr Gladys, 5 Oct): one grammar, built from the value, never from the browser's locale ──
  var BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  // hari: "yyyy-mm-dd" (a date field's value, a calendar day in WIB); jam: "HH:MM" (a time field's value).
  // bentuk: "ringkas" 09/10/2026 · "biasa" 9 Okt 2026 · "hari" Jumat, 9 Okt 2026 · "resmi" 9 Oktober 2026
  //         · "waktu" Jumat, 9 Okt 2026, 07.30 WIB · "catatan" 9 Okt 2026, 07.30 WIB
  function tanggal(hari, bentuk, jam) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hari || "");
    if (!m) return "";
    var t = +m[1], b = +m[2], h = +m[3];
    var d = new Date(Date.UTC(t, b - 1, h));
    if (d.getUTCMonth() !== b - 1) return "";
    var j = /^(\d{2}):(\d{2})/.exec(jam || "");
    var pukul = j ? j[1] + "." + j[2] + " WIB" : "";
    var biasa = h + " " + BULAN[b - 1] + " " + t;
    var denganHari = HARI[d.getUTCDay()] + ", " + biasa;
    switch (bentuk) {
      case "ringkas": return m[3] + "/" + m[2] + "/" + m[1];
      case "resmi": return h + " " + BULAN_PANJANG[b - 1] + " " + t;
      case "hari": return denganHari;
      case "waktu": return pukul ? denganHari + ", " + pukul : denganHari;
      case "catatan": return pukul ? biasa + ", " + pukul : biasa;
      default: return biasa;
    }
  }
  // A native date or time field followed by its echo: [data-gema-tanggal="#field"] (and data-gema-jam="#field").
  function gemaTanggal(akar) {
    (akar || document).querySelectorAll("[data-gema-tanggal]").forEach(function (gema) {
      var ft = document.querySelector(gema.getAttribute("data-gema-tanggal"));
      var fj = gema.getAttribute("data-gema-jam") ? document.querySelector(gema.getAttribute("data-gema-jam")) : null;
      var awal = gema.getAttribute("data-awal") || "", kosong = gema.getAttribute("data-kosong") || "Belum ada tanggal.";
      function tulis() {
        var teks = tanggal(ft.value, fj ? "waktu" : "hari", fj ? fj.value : "");
        gema.textContent = teks ? awal + teks : kosong;
        gema.classList.toggle("is-kosong", !teks);
      }
      ft.addEventListener("input", tulis); ft.addEventListener("change", tulis);
      if (fj) { fj.addEventListener("input", tulis); fj.addEventListener("change", tulis); }
      tulis();
    });
  }

  function siapkan(akar) {
    akar = akar || document;
    isiIkon(akar);
    akar.querySelectorAll("[data-shell]").forEach(shell);
    akar.querySelectorAll("[data-perjalanan]").forEach(perjalanan);
    akar.querySelectorAll("form[data-validasi]").forEach(siapValidasi);
    akar.querySelectorAll("[data-aksi]").forEach(aksi);
    akar.querySelectorAll('[role="tablist"]').forEach(tabs);
    akar.querySelectorAll(".pds-tabs").forEach(tabTepi);
    akar.querySelectorAll("[data-berkas]").forEach(berkas);
    akar.querySelectorAll('[aria-haspopup="menu"]').forEach(menu);
    akar.querySelectorAll(".pds-switch").forEach(sakelar);
    akar.querySelectorAll("[data-pin]").forEach(pin);
    akar.querySelectorAll("[data-kode]").forEach(kode);
    akar.querySelectorAll("[data-aturan-pw]").forEach(aturan);
    akar.querySelectorAll(".pds-search").forEach(cari);
    akar.querySelectorAll("[data-tabel]").forEach(tabel);
    gemaTanggal(akar);
    dialogs(akar);
    akar.querySelectorAll("[data-tip]").forEach(tooltip);
    akar.querySelectorAll("[data-jaringan]").forEach(function (r) {
      if (r.checked) JARINGAN.mode = r.value;
      r.addEventListener("change", function () { if (r.checked) JARINGAN.mode = r.value; });
    });
    akar.querySelectorAll("[data-kurangi-gerak]").forEach(function (c) {
      var sasaran = document.querySelector(c.getAttribute("data-kurangi-gerak"));
      c.addEventListener("change", function () { if (sasaran) sasaran.classList.toggle("pds-reduce", c.checked); });
    });
  }

  window.Pintar = { ikon: ikon, siapkan: siapkan, tanggal: tanggal, jaringan: JARINGAN, persona: PERSONA, tempat: TEMPAT };
})();
