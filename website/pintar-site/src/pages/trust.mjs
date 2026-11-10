// Keamanan / Trust & Security: calm on the surface, rigorous underneath.
// One layered cross-section carries the page; each layer is then explained
// in human language with an example of it at work. The page claims no
// certification and exposes no implementation detail.

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
      <p class="lead" data-reveal>${t("Yang dilihat pengguna sengaja dibuat sederhana. Di bawahnya, setiap permintaan diperiksa, setiap institusi dipisahkan, dan setiap perubahan penting tercatat.", "What people see is deliberately simple. Beneath it, every request is checked, every institution is kept apart, and every consequential change is recorded.")}</p>
    </div>
    <div style="--span:6;--start:7">${layers(c, { full: true }).replace('class="layers layers--full"', 'class="layers layers--full layers--paper"')}</div>
  </div>
</section>

<section class="section section--rule" aria-labelledby="practice-h">
  <div class="wrap">
    <div class="section-head section-head--split" data-reveal-group>
      <div>${label("", t("Dalam praktik", "In practice"))}
      <h2 class="h2" id="practice-h" data-reveal>${t("Seperti apa perlindungan itu dalam keseharian.", "What the protection looks like on an ordinary day.")}</h2></div>
      <p class="lead" data-reveal>${t("Ini adalah prinsip rancangan PINTAR. Pemenuhannya diverifikasi untuk setiap rilis, dan dicatat terpisah.", "These are PINTAR’s design principles. Each release is verified against them, and the evidence is recorded separately.")}</p>
    </div>
    <ol class="practice">${LAYERS.map((x, i) => `<li data-reveal><span class="practice__n">${String(i + 1).padStart(2, "0")}</span><h3 class="practice__h">${x[L]}</h3><p class="practice__d">${L === "id" ? x.d_id : x.d_en}<span class="practice__x">${L === "id" ? x.x_id : x.x_en}</span></p></li>`).join("")}</ol>
  </div>
</section>

<section class="section section--sunk" aria-labelledby="honest-h">
  <div class="wrap">
    <div class="honest" data-reveal>
      <h2 id="honest-h">${t("Yang tidak kami klaim.", "What we do not claim.")}</h2>
      <div>
        <p>${t("Kami tidak mencantumkan sertifikasi atau standar kepatuhan yang belum kami miliki. Bila suatu saat ada, kami menyebutkannya dengan nomor dan penerbitnya.", "We list no certification or compliance standard we do not hold. If that changes, we will name it, with its number and issuer.")}</p>
        <p>${t("Kami juga tidak membuka detail teknis keamanan di halaman publik. Pertanyaan keamanan dari institusi kami jawab langsung, dalam demo atau dalam percakapan teknis dengan tim Anda.", "Nor do we publish technical security detail on a public page. We answer an institution’s security questions directly, in a demonstration or a technical conversation with your team.")}</p>
        <p>${t("Data pendidikan di dalam aplikasi PINTAR diatur oleh perjanjian dengan institusi, terpisah dari situs ini.", "Educational data inside the PINTAR application is governed by the agreement with each institution, separately from this website.")} <a class="link" href="${c.href("privacy")}">${NAV_LABEL.privacy[c.lang]}</a></p>
      </div>
    </div>
  </div>
</section>

${demoBand(c, { heading: t("Bawa pertanyaan keamanan Anda.", "Bring your security questions."), body: t("Dalam demo, tim kami menunjukkan batas akses dan riwayat secara langsung, dan menjawab pertanyaan tim TI Anda.", "In a demonstration, our team shows access boundaries and the record at work, and answers your IT team’s questions.") })}
`;
  return {
    title: t("Keamanan — Tenang di permukaan, cermat di bawahnya", "Trust & Security — Calm on the surface, rigorous underneath"),
    description: t("Bagaimana PINTAR menjaga identitas dan akses, pemisahan institusi, integritas asesmen, bukti historis, kesinambungan, akuntabilitas, dan privasi.", "How PINTAR protects identity and access, institutional separation, assessment integrity, historical evidence, continuity, accountability and privacy."),
    body,
  };
}
