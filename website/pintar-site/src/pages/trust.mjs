// Keamanan / Trust & Security. The diagram names the safeguards; the list
// explains each one once, with one everyday example. Nothing here is offered
// as an audit result: these are 4.0's designed safeguards, in release
// verification, and the page claims no certification.

import { label, demoBand, NAV_LABEL } from "../core.mjs";
import { layers, LAYERS } from "../diagrams.mjs";

export default function trust(c) {
  const t = c.t;
  const L = c.lang;
  const body = `
<section class="page-hero" aria-labelledby="trust-hero-h">
  <div class="wrap cols">
    <div style="--span:6" data-reveal-group>
      ${label("", NAV_LABEL.trust[c.lang])}
      <h1 class="h1" id="trust-hero-h" data-reveal>${t("Tenang di permukaan. <em>Cermat di bawahnya.</em>", "Calm on the surface. <em>Rigorous underneath.</em>")}</h1>
      <p class="lead" data-reveal>${t("Yang dilihat pengguna sengaja dibuat sederhana. Di bawahnya ada tujuh perlindungan.", "What people see is deliberately simple. Beneath it are seven safeguards.")}</p>
      <p class="caption" data-reveal>${t("Halaman ini menjelaskan cara PINTAR melindungi data dan pekerjaan Anda. Ini bukan laporan audit.", "This page explains how PINTAR protects your data and work. It is not an audit report.")}</p>
    </div>
    <div style="--span:6;--start:7">${layers(c).replace('class="layers"', 'class="layers layers--paper"')}</div>
  </div>
</section>

<section class="section section--rule" aria-labelledby="practice-h">
  <div class="wrap">
    <div class="section-head" data-reveal-group>
      ${label("", t("Dalam praktik", "In practice"))}
      <h2 class="h2" id="practice-h" data-reveal>${t("Setiap perlindungan, <em>dengan satu contoh.</em>", "Each safeguard, <em>with one example.</em>")}</h2>
    </div>
    <ol class="practice">${LAYERS.map((x, i) => `<li data-reveal><span class="practice__n">${String(i + 1).padStart(2, "0")}</span><h3 class="practice__h">${x[L]}</h3><p class="practice__d">${L === "id" ? x.d_id : x.d_en}<span class="practice__x">${t("Contoh: ", "For example: ")}${L === "id" ? x.x_id : x.x_en}</span></p></li>`).join("")}</ol>
  </div>
</section>

<section class="section section--sunk" aria-labelledby="honest-h">
  <div class="wrap">
    <div class="honest" data-reveal>
      <h2 id="honest-h">${t("Yang tidak kami klaim.", "What we do not claim.")}</h2>
      <div>
        <p>${t("Kami tidak mencantumkan sertifikasi atau standar kepatuhan yang belum kami miliki. Bila nanti ada, kami akan menyebutkannya beserta nomor dan penerbitnya.", "We list no certification or compliance standard we do not hold. If that changes, we will name it, with its number and issuer.")}</p>
        <p>${t("Kami tidak membuka detail teknis keamanan di halaman publik. Pertanyaan keamanan dari institusi kami jawab langsung, dalam demo atau percakapan teknis dengan tim Anda.", "We do not publish technical security detail on a public page. We answer an institution’s security questions directly, in a demonstration or a technical conversation with your team.")}</p>
        <p>${t("Data pendidikan di dalam aplikasi PINTAR diatur oleh perjanjian dengan setiap institusi, terpisah dari situs ini.", "Educational data inside the PINTAR application is governed by the agreement with each institution, separately from this website.")} <a href="${c.href("privacy")}">${NAV_LABEL.privacy[c.lang]}</a></p>
      </div>
    </div>
  </div>
</section>

${demoBand(c, { heading: t("Bawa pertanyaan <em>keamanan Anda.</em>", "Bring your <em>security questions.</em>"), body: t("Dalam demo, kami menunjukkan batas akses dan catatan tindakan dengan data contoh, dan menjawab pertanyaan tim TI Anda.", "In a demonstration, we show access boundaries and recorded actions with sample data, and answer your IT team’s questions.") })}
`;
  return {
    title: t("Keamanan — Tenang di permukaan, cermat di bawahnya", "Trust & Security — Calm on the surface, rigorous underneath"),
    description: t("Tujuh perlindungan di PINTAR, masing-masing dengan contoh sehari-hari. Bukan klaim sertifikasi.", "Seven safeguards in PINTAR, each with an everyday example. Not a certification claim."),
    body,
  };
}
