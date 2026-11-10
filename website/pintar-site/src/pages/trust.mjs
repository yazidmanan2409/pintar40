// Keamanan / Trust & Security. The diagram names the safeguards; the list
// explains each one once, with one everyday example. The page claims no
// certification; every safeguard is on the launch-claims checklist.

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
      <h2 id="honest-h">${t("Pertanyaan keamanan dari institusi.", "Security questions from institutions.")}</h2>
      <div>
        <p>${t("Kami menjawabnya langsung, dalam demo atau percakapan teknis dengan tim TI Anda, termasuk detail teknis yang tidak kami muat di halaman publik.", "We answer them directly, in a demonstration or a technical conversation with your IT team, including technical detail we do not put on a public page.")}</p>
        <p>${t("Sertifikasi dan standar kepatuhan hanya kami sebutkan bila kami memilikinya, beserta nomor dan penerbitnya.", "We name a certification or compliance standard only when we hold it, with its number and issuer.")}</p>
        <p>${t("Data pendidikan di dalam aplikasi PINTAR diatur oleh perjanjian dengan setiap institusi, terpisah dari situs ini.", "Educational data inside the PINTAR application is governed by the agreement with each institution, separately from this website.")} <a href="${c.href("privacy")}">${NAV_LABEL.privacy[c.lang]}</a></p>
      </div>
    </div>
  </div>
</section>

${demoBand(c, { heading: t("Bawa pertanyaan <em>keamanan Anda.</em>", "Bring your <em>security questions.</em>"), body: t("Demo terpandu dengan data contoh: batas akses dan catatan tindakan, ditunjukkan langsung, dan jawaban untuk pertanyaan tim TI Anda.", "A guided demonstration with sample data: access boundaries and recorded actions, shown directly, and answers to your IT team’s questions.") })}
`;
  return {
    title: t("Keamanan — Tenang di permukaan, cermat di bawahnya", "Trust & Security — Calm on the surface, rigorous underneath"),
    description: t("Tujuh perlindungan di PINTAR, masing-masing dengan contoh sehari-hari. Bukan klaim sertifikasi.", "Seven safeguards in PINTAR, each with an everyday example. Not a certification claim."),
    body,
  };
}
