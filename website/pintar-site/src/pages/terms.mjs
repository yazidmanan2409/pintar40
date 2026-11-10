// Ketentuan Penggunaan / Terms of Use, for the public website only. Not a
// substitute for PINTAR's institutional service agreements.

import { legalPage, confirm, COMPANY } from "../core.mjs";

export default function terms(c) {
  const t = c.t;
  const mail = `<a href="mailto:${COMPANY.email}">${COMPANY.email}</a>`;
  const sections = [
    ["about", t("Tentang ketentuan ini", "About these terms"), t(`
      <p>Ketentuan ini mengatur penggunaan situs publik PINTAR yang dikelola oleh <b>${COMPANY.name} (${COMPANY.short})</b>. Dengan menggunakan situs ini, Anda menyetujui ketentuan ini.</p>
      <p>Ketentuan ini <b>bukan</b> perjanjian layanan PINTAR. Penggunaan aplikasi PINTAR oleh institusi diatur oleh perjanjian tersendiri antara institusi tersebut dan ${COMPANY.short}.</p>`, `
      <p>These terms govern the use of the public PINTAR website operated by <b>${COMPANY.name} (${COMPANY.short})</b>. By using this website you accept them.</p>
      <p>These terms are <b>not</b> the PINTAR service agreement. An institution’s use of the PINTAR application is governed by a separate agreement between that institution and ${COMPANY.short}.</p>`)],

    ["ip", t("Kekayaan intelektual", "Intellectual property"), t(`
      <p>Nama dan tanda kata PINTAR, teks, diagram, tata letak, dan materi lain di situs ini adalah milik ${COMPANY.short} atau digunakan dengan izin, dan dilindungi peraturan perundang-undangan. ${confirm(c, "status pendaftaran merek PINTAR")}</p>
      <p>Huruf yang dipakai situs ini (Inter dan Newsreader) dilisensikan di bawah SIL Open Font License.</p>`, `
      <p>The PINTAR name and wordmark, and the text, diagrams, layout and other material on this website, belong to ${COMPANY.short} or are used with permission, and are protected by law. ${confirm(c, "the registration status of the PINTAR trademark")}</p>
      <p>The typefaces used on this website (Inter and Newsreader) are licensed under the SIL Open Font License.</p>`)],

    ["use", t("Penggunaan yang diizinkan", "Permitted use"), t(`
      <p>Anda boleh membaca, membagikan tautan, dan mencetak halaman situs ini untuk keperluan pribadi atau keperluan institusi Anda dalam menilai PINTAR. Anda tidak boleh:</p>
      <ul><li>menyalin atau menerbitkan ulang isi situs untuk tujuan komersial tanpa izin tertulis;</li>
        <li>memakai nama atau tanda kata PINTAR dengan cara yang menyiratkan dukungan atau kerja sama yang tidak ada;</li>
        <li>mengganggu, membebani, atau mencoba mengakses bagian situs atau server yang tidak ditujukan untuk publik;</li>
        <li>mengirim pesan yang kasar, mengancam, menyesatkan, atau berisi spam melalui formulir kontak.</li></ul>`, `
      <p>You may read, link to and print pages of this website for your own purposes, or for your institution’s evaluation of PINTAR. You may not:</p>
      <ul><li>copy or republish the website’s content for commercial purposes without written permission;</li>
        <li>use the PINTAR name or wordmark in a way that suggests an endorsement or partnership that does not exist;</li>
        <li>disrupt or overload the website, or try to reach parts of it or its server that are not public;</li>
        <li>send abusive, threatening, misleading or spam messages through the contact form.</li></ul>`)],

    ["info", t("Informasi di situs ini", "Information on this website"), t(`
      <p>Situs ini menjelaskan PINTAR secara umum. Status setiap kemampuan ditandai dengan jelas: <b>4.0 · Fondasi</b> (dalam verifikasi rilis), <b>4.1 · Berikutnya</b> (direncanakan), dan <b>Arah</b> (bukan janji rilis). Rencana dapat berubah. Ilustrasi konsep di situs ini bukan tangkapan layar produk.</p>
      <p>Isi situs bukan penawaran yang mengikat. Kemampuan, ketersediaan, dan syarat layanan untuk institusi ditetapkan dalam perjanjian layanan.</p>`, `
      <p>This website describes PINTAR in general terms. Each capability’s status is marked clearly: <b>4.0 · Foundation</b> (in release verification), <b>4.1 · Next</b> (planned) and <b>Direction</b> (not a release promise). Plans can change. Concept illustrations on this website are not product screenshots.</p>
      <p>Nothing on this website is a binding offer. Capabilities, availability and terms of service for an institution are set out in the service agreement.</p>`)],

    ["links", t("Tautan ke situs lain", "Links to other websites"), t(`
      <p>Bila situs ini menautkan ke situs lain, tautan itu disediakan untuk kemudahan. Kami tidak mengendalikan dan tidak bertanggung jawab atas isi atau praktik privasi situs tersebut.</p>`, `
      <p>Where this website links to another, the link is provided for convenience. We do not control, and are not responsible for, the content or privacy practices of that website.</p>`)],

    ["liability", t("Batasan tanggung jawab", "Disclaimer and limitation of liability"), t(`
      <p>Kami berusaha menjaga situs ini akurat dan tersedia, tetapi situs disediakan «sebagaimana adanya» tanpa jaminan bahwa situs selalu bebas kesalahan atau tanpa gangguan. Sejauh diizinkan oleh hukum yang berlaku, ${COMPANY.short} tidak bertanggung jawab atas kerugian yang timbul dari penggunaan informasi di situs ini. Tidak ada bagian dari ketentuan ini yang membatasi tanggung jawab yang tidak dapat dibatasi menurut hukum.</p>`, `
      <p>We work to keep this website accurate and available, but it is provided “as is”, without any guarantee that it will always be free of errors or interruptions. To the extent permitted by applicable law, ${COMPANY.short} is not liable for loss arising from the use of information on this website. Nothing in these terms limits a liability that cannot be limited by law.</p>`)],

    ["law", t("Hukum yang berlaku", "Governing law"), t(`
      <p>Ketentuan ini diatur oleh hukum Republik Indonesia. Bila terdapat perbedaan antara versi Bahasa Indonesia dan versi bahasa Inggris, versi Bahasa Indonesia yang berlaku. ${confirm(c, "forum penyelesaian sengketa, bila perlu disebutkan")}</p>`, `
      <p>These terms are governed by the laws of the Republic of Indonesia. If the Indonesian and English versions differ, the Indonesian version prevails. ${confirm(c, "the forum for disputes, if one should be named")}</p>`)],

    ["changes", t("Perubahan dan kontak", "Changes and contact"), t(`
      <p>Kami dapat memperbarui ketentuan ini; tanggal «Berlaku sejak» menunjukkan versi terbaru. Pertanyaan tentang ketentuan ini dapat dikirim ke ${mail}.</p>`, `
      <p>We may update these terms; the “Effective” date shows the current version. Questions about them can be sent to ${mail}.</p>`)],
  ];
  return {
    title: t("Ketentuan Penggunaan — PINTAR", "Terms of Use — PINTAR"),
    description: t("Ketentuan penggunaan situs publik PINTAR.", "Terms of use for the public PINTAR website."),
    body: legalPage(c, {
      heading: t("Ketentuan Penggunaan", "Terms of Use"),
      intro: t("Ketentuan singkat untuk situs publik ini. Penggunaan aplikasi PINTAR oleh institusi diatur oleh perjanjian layanan tersendiri.", "Short terms for this public website. An institution’s use of the PINTAR application is governed by its own service agreement."),
      updated: confirm(c, t("tanggal berlaku", "effective date")),
      sections,
    }),
  };
}
