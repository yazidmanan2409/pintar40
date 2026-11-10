// Kebijakan Privasi / Privacy Policy, for the public website only.
//
// Written against Indonesia's Personal Data Protection Law (UU No. 27 Tahun
// 2022, «UU PDP»). Every practice described is what this website's code
// actually does; every fact the code cannot know (address, providers, how long
// the mailbox keeps email) is marked «konfirmasi» rather than invented.

import { legalPage, confirm, COMPANY, NAV_LABEL } from "../core.mjs";

export default function privacy(c) {
  const t = c.t;
  const k = (id, en) => confirm(c, t(id, en));
  const mail = `<a href="mailto:${COMPANY.email}">${COMPANY.email}</a>`;
  const sections = [
    ["operator", t("Siapa yang mengelola situs ini", "Who operates this website"), t(`
      <p>Situs ini dikelola oleh <b>${COMPANY.name} (${COMPANY.short})</b>, pengembang PINTAR, sebagai pengendali data pribadi atas data yang dikumpulkan melalui situs ini.</p>
      <ul><li>Alamat terdaftar: ${k("alamat terdaftar perusahaan", "")}</li><li>Nomor Induk Berusaha (NIB): ${k("NIB", "")}</li><li>Email: ${mail}</li></ul>`, `
      <p>This website is operated by <b>${COMPANY.name} (${COMPANY.short})</b>, the developer of PINTAR, as the controller of the personal data collected through it.</p>
      <ul><li>Registered address: ${k("", "the company’s registered address")}</li><li>Business identification number (NIB): ${k("", "NIB")}</li><li>Email: ${mail}</li></ul>`)],

    ["scope", t("Situs ini, dan bukan aplikasi PINTAR", "This website, not the PINTAR application"), t(`
      <p>Kebijakan ini hanya berlaku untuk situs publik ini. Data pendidikan yang diproses di dalam <b>aplikasi PINTAR</b> (akun, kelas, jawaban, hasil, laporan, sertifikat) diatur terpisah melalui perjanjian layanan antara ${COMPANY.short} dan setiap institusi, serta kebijakan yang berlaku di dalam aplikasi. Di aplikasi, hasil asesmen tetap terhubung ke materi dan aturan yang dipakai saat itu; itu berbeda dari lama penyimpanan data pribadi, yang ditetapkan dalam perjanjian dan kebijakan retensi bersama institusi. ${k("peran para pihak dalam aplikasi dan dokumen yang mengaturnya", "")}</p>`, `
      <p>This policy covers this public website only. Educational data processed inside the <b>PINTAR application</b> (accounts, classes, answers, results, reports, certificates) is governed separately, by the service agreement between ${COMPANY.short} and each institution and by the policies that apply within the application. In the application, assessment results stay linked to the material and rules used at the time; that is separate from how long personal data is kept, which is set in the agreement and retention policy with each institution. ${k("", "each party’s role in the application and the documents that govern it")}</p>`)],

    ["collect", t("Data yang kami kumpulkan", "Information we collect"), t(`
      <h3>Melalui formulir kontak</h3>
      <p>Nama, alamat email, institusi atau organisasi (opsional), subjek, isi pesan, dan persetujuan Anda. Kami juga mencatat bahasa halaman dan waktu pengiriman.</p>
      <h3>Oleh formulir, untuk keamanan</h3>
      <p>Formulir tidak menyimpan alamat IP Anda dalam bentuk aslinya. Untuk membatasi jumlah kiriman dan mengenali kiriman ganda, formulir menyimpan <b>hash berkunci</b> dari alamat IP, dan untuk pesan yang dikirim, sidik jari tak terbaca dari isinya. Hash ini adalah nama samaran (pseudonim), bukan anonimisasi: dengan kunci yang sama di server, alamat yang sama selalu menghasilkan hash yang sama. Karena itu kami tetap memperlakukannya sebagai data pribadi.</p>
      <p>Untuk kiriman yang ditolak, dibuang sebagai spam, atau ditandai untuk ditinjau, formulir menyimpan catatan keamanan berisi waktu, keputusan, kategori, dan hash alamat IP, tanpa nama, email, atau isi pesan.</p>
      <h3>Oleh penyedia hosting</h3>
      <p>Terpisah dari formulir, server hosting dapat mencatat log akses teknis untuk setiap kunjungan, termasuk alamat IP dalam bentuk aslinya, waktu, halaman yang diminta, dan jenis peramban. Log ini dikelola oleh penyedia hosting. ${k("penyedia hosting, isi log, dan lama penyimpanannya", "")}</p>
      <h3>Yang tidak kami kumpulkan</h3>
      <p>Situs ini tidak memakai cookie, analitik, piksel pelacak, atau iklan, dan tidak memuat apa pun dari layanan pihak ketiga. Huruf (font) disimpan di server kami sendiri.</p>`, `
      <h3>Through the contact form</h3>
      <p>Your name, email address, institution or organisation (optional), subject, message and your consent. We also record the page language and the time of sending.</p>
      <h3>By the form, for security</h3>
      <p>The form does not store your IP address as it is. To limit how often messages can be sent and to recognise duplicates, it keeps a <b>keyed hash</b> of the address and, for messages that are sent, an unreadable fingerprint of their content. The hash is a pseudonym, not anonymisation: with the same key on the server, the same address always produces the same hash. We therefore still treat it as personal data.</p>
      <p>For submissions that are refused, discarded as spam or flagged for review, the form keeps a security record of the time, decision, category and hashed IP address, with no name, email or message.</p>
      <h3>By the hosting provider</h3>
      <p>Separately from the form, the hosting server may keep technical access logs for every visit, including your IP address as it is, the time, the page requested and the browser type. These logs are managed by the hosting provider. ${k("", "the hosting provider, what its logs contain and how long they are kept")}</p>
      <h3>What we do not collect</h3>
      <p>This website uses no cookies, analytics, tracking pixels or advertising, and loads nothing from third-party services. Fonts are served from our own server.</p>`)],

    ["purpose", t("Tujuan dan dasar pemrosesan", "Purposes and legal basis"), t(`
      <p>Kami memproses data dari formulir hanya untuk membaca dan menjawab pesan Anda, menjadwalkan demo bila Anda memintanya, dan menindaklanjuti pertanyaan kemitraan atau dukungan. Dasar pemrosesannya adalah <b>persetujuan eksplisit</b> yang Anda berikan dengan mencentang kotak persetujuan (Pasal 20 UU PDP).</p>
      <p>Hash alamat IP dan catatan keamanan diproses untuk melindungi formulir dari penyalahgunaan, spam, dan konten yang kasar.</p>
      <p>Kami tidak menggunakan data Anda untuk pemasaran tanpa persetujuan terpisah, tidak menjualnya, dan tidak membuat keputusan otomatis yang berdampak hukum terhadap Anda.</p>`, `
      <p>We process form data only to read and answer your message, to arrange a demonstration if you ask for one, and to follow up partnership or support enquiries. The legal basis is the <b>explicit consent</b> you give by ticking the consent box (Article 20 of the UU PDP).</p>
      <p>The hashed IP address and security records are processed to protect the form from abuse, spam and abusive content.</p>
      <p>We do not use your data for marketing without separate consent, we do not sell it, and we make no automated decision with legal effect on you.</p>`)],

    ["moderation", t("Penyaringan pesan", "Message screening"), t(`
      <p>Untuk menjaga saluran ini tetap profesional dan aman, setiap pesan diperiksa otomatis di server terhadap aturan tentang bahasa kasar, ujaran kebencian, ancaman, spam, dan tautan berbahaya. Pesan yang jelas melanggar tidak dikirim, dan <b>isinya tidak disimpan</b>; yang tersisa hanya catatan keamanan yang dijelaskan di atas. Pesan yang meragukan tetap dikirim kepada kami dengan tanda «perlu ditinjau», agar seseorang membacanya sebelum menindaklanjuti. Kritik dan keluhan tetap kami terima.</p>`, `
      <p>To keep this channel professional and safe, every message is checked automatically on the server against rules on abusive language, hate speech, threats, spam and harmful links. A message that clearly breaks them is not sent, and <b>its content is not kept</b>; only the security record described above remains. A doubtful message is still delivered to us, marked «needs review», so that a person reads it before acting. Criticism and complaints are welcome.</p>`)],

    ["providers", t("Penyedia layanan dan pengungkapan", "Service providers and disclosure"), t(`
      <p>Pesan Anda dikirim sebagai email ke ${mail} dan disimpan di kotak surat tersebut. Penyedia yang terlibat: penyedia hosting situs ${k("nama penyedia", "")} dan penyedia layanan email untuk domain pintarselalu.com ${k("nama penyedia", "")}. ${k("apakah data disimpan atau diproses di luar Indonesia; bila ya, dasar transfernya sesuai Pasal 56 UU PDP", "")}</p>
      <p>Kami tidak mengungkapkan data Anda kepada pihak lain, kecuali bila diwajibkan oleh peraturan perundang-undangan atau atas permintaan resmi otoritas yang berwenang.</p>`, `
      <p>Your message is sent as an email to ${mail} and kept in that mailbox. The providers involved are the website’s hosting provider ${k("", "provider name")} and the email provider for the pintarselalu.com domain ${k("", "provider name")}. ${k("", "whether any data is stored or processed outside Indonesia, and if so the basis for that transfer under Article 56 of the UU PDP")}</p>
      <p>We disclose your data to no one else, except where required by law or by a lawful request from a competent authority.</p>`)],

    ["retention", t("Penyimpanan dan perlindungan", "Storage, retention and protection"), t(`
      <ul>
        <li><b>Pesan yang terkirim</b> disimpan di kotak surat ${COMPANY.email} selama diperlukan untuk menindaklanjuti pertanyaan Anda. Formulir di situs ini tidak menyimpan salinannya. ${k("jangka waktu penyimpanan email dan kebijakan penghapusannya", "")}</li>
        <li><b>Hash untuk batas kiriman dan sidik jari pesan</b> tidak dipakai lagi setelah satu jam, dan dihapus pada pembersihan berikutnya.</li>
        <li><b>Catatan keamanan</b> tidak dipakai lagi setelah 30 hari, dan dihapus pada pembersihan berikutnya.</li>
      </ul>
      <p>Pembersihan berjalan setiap kali formulir dipakai, dan oleh pembersihan terjadwal harian di server. Karena itu sebuah catatan dapat tersimpan sedikit lebih lama dari batas di atas, paling lama sampai pembersihan berikutnya. ${k("pembersihan terjadwal harian telah diaktifkan di server produksi", "")}</p>
      <p>Data keamanan disimpan di luar folder publik situs dan hanya dapat diakses oleh pengelola server. Koneksi ke situs ${k("dilindungi HTTPS pada domain produksi", "")}.</p>`, `
      <ul>
        <li><b>Messages that are sent</b> are kept in the ${COMPANY.email} mailbox for as long as needed to follow up your enquiry. The form on this website keeps no copy. ${k("", "how long email is kept, and the deletion policy")}</li>
        <li><b>Rate-limit hashes and message fingerprints</b> stop being used after one hour, and are deleted at the next cleanup.</li>
        <li><b>Security records</b> stop being used after 30 days, and are deleted at the next cleanup.</li>
      </ul>
      <p>Cleanup runs whenever the form is used, and in a daily scheduled cleanup on the server. A record may therefore be kept a little longer than the periods above, at most until the next cleanup. ${k("", "the daily scheduled cleanup is enabled on the production server")}</p>
      <p>Security data is kept outside the website’s public folder and is accessible only to those who administer the server. Connections to the site ${k("", "are protected by HTTPS on the production domain")}.</p>`)],

    ["cookies", t("Cookie dan pelacakan", "Cookies and tracking"), t(`
      <p>Situs ini <b>tidak memakai cookie</b> dan tidak menyimpan apa pun di perangkat Anda (termasuk <i>local storage</i>). Karena itu tidak ada spanduk persetujuan cookie. Bila suatu saat kami menambahkan analitik atau teknologi pelacakan yang tidak esensial, kami akan memperbarui kebijakan ini dan meminta persetujuan Anda lebih dahulu bila diwajibkan.</p>`, `
      <p>This website <b>uses no cookies</b> and stores nothing on your device (including local storage). That is why there is no cookie banner. If we ever add analytics or other non-essential tracking, we will update this policy and ask for your consent first where required.</p>`)],

    ["rights", t("Hak Anda", "Your rights"), t(`
      <p>Sesuai UU PDP, Anda berhak antara lain untuk:</p>
      <ul>
        <li>mendapatkan informasi tentang pemrosesan data Anda;</li>
        <li>melengkapi, memperbarui, atau memperbaiki data yang tidak akurat;</li>
        <li>mengakses dan memperoleh salinan data Anda;</li>
        <li>meminta pemrosesan diakhiri, serta data dihapus atau dimusnahkan;</li>
        <li>menarik kembali persetujuan Anda kapan saja;</li>
        <li>meminta pemrosesan ditunda atau dibatasi;</li>
        <li>mengajukan keberatan atas keputusan yang semata-mata didasarkan pada pemrosesan otomatis; dan</li>
        <li>mengajukan gugatan dan menerima ganti rugi atas pelanggaran pemrosesan data pribadi.</li>
      </ul>
      <p>Untuk menggunakan hak tersebut, kirim email ke ${mail} dengan subjek «Permintaan data pribadi». Kami dapat meminta informasi untuk memastikan identitas Anda, dan akan menanggapi dalam jangka waktu yang ditentukan peraturan perundang-undangan. Menarik persetujuan tidak memengaruhi pemrosesan yang telah dilakukan sebelumnya.</p>`, `
      <p>Under the UU PDP you have the right, among others, to:</p>
      <ul>
        <li>be informed about how your data is processed;</li>
        <li>complete, update or correct inaccurate data;</li>
        <li>access your data and obtain a copy;</li>
        <li>have processing ended, and your data deleted or destroyed;</li>
        <li>withdraw your consent at any time;</li>
        <li>have processing suspended or restricted;</li>
        <li>object to decisions based solely on automated processing; and</li>
        <li>bring a claim and receive compensation for a breach in the processing of your personal data.</li>
      </ul>
      <p>To exercise these rights, email ${mail} with the subject “Personal data request”. We may ask for information to confirm your identity, and will respond within the time set by law. Withdrawing consent does not affect processing carried out before.</p>`)],

    ["children", t("Anak", "Children"), t(`
      <p>Situs dan formulir ini ditujukan bagi institusi pendidikan dan orang dewasa. Bila Anda berusia di bawah 18 tahun, mintalah orang tua atau wali Anda untuk menghubungi kami.</p>`, `
      <p>This website and its form are intended for educational institutions and adults. If you are under 18, please ask a parent or guardian to contact us.</p>`)],

    ["contact", t("Kontak privasi", "Privacy contact"), t(`
      <p>Pertanyaan tentang privasi dapat dikirim ke ${mail}. ${k("apakah perusahaan menunjuk pejabat atau petugas pelindungan data pribadi (Pasal 53 UU PDP) dan kontaknya", "")}</p>`, `
      <p>Privacy questions can be sent to ${mail}. ${k("", "whether the company appoints a data protection officer (Article 53 of the UU PDP), and their contact details")}</p>`)],

    ["changes", t("Perubahan kebijakan", "Changes to this policy"), t(`
      <p>Kami dapat memperbarui kebijakan ini bila situs atau kewajiban hukum kami berubah. Tanggal «Berlaku sejak» di atas menunjukkan versi terbaru. Perubahan penting akan kami tandai dengan jelas di halaman ini. Bila terdapat perbedaan antara versi Bahasa Indonesia dan versi bahasa Inggris, versi Bahasa Indonesia yang berlaku.</p>`, `
      <p>We may update this policy when the website or our legal obligations change. The “Effective” date above shows the current version, and important changes will be marked clearly on this page. If the Indonesian and English versions differ, the Indonesian version prevails.</p>`)],
  ];
  // The `k(id, en)` helper takes both languages; drop the empty half.
  const body = legalPage(c, {
    heading: t("Kebijakan Privasi", "Privacy Policy"),
    intro: t("Singkatnya: situs ini tidak memakai cookie atau pelacakan. Apa yang Anda kirim melalui formulir kontak kami pakai untuk menjawab Anda. Formulir juga menyimpan catatan keamanan singkat tanpa isi pesan, dan penyedia hosting mencatat log akses teknis.", "In short: this website uses no cookies or tracking. What you send through the contact form is used to answer you. The form also keeps brief security records without message content, and the hosting provider keeps technical access logs."),
    updated: confirm(c, t("tanggal berlaku", "effective date")),
    sections,
  });
  return {
    title: t("Kebijakan Privasi — PINTAR", "Privacy Policy — PINTAR"),
    description: t("Bagaimana situs PINTAR memproses data dari formulir kontak, tanpa cookie dan tanpa pelacakan.", "How the PINTAR website processes contact-form data, with no cookies and no tracking."),
    body: body.replace(/<span class="confirm">\[(konfirmasi|to confirm): \]<\/span>/g, ""),
  };
}
