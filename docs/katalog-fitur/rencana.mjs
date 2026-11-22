// Planning state, open choices and dependencies for 4.5 and 5.0 entries, in reader terms. Owner ruling 72 (23 Nov) folds
// the former 4.2 entries (ids 42-*, audit rows 4.2-xx) into 4.5; their rows keep their identifiers.
// Source: Bob's planning-completeness audit for 4.2/4.5/5.0 (revision 6, 71a6f87e, 18 Nov 2026, with Sharon's,
// Daisy's and Second Eye's reviews), docs/roadmap/PLANNING-AUDIT-4.2-4.5-5.0.md on the 4.1 master-plan branch. Internal
// decision codes are kept here for checking only; they are never printed.
export const RENCANA = {
  // ── 4.5, former 4.2 scope (ruling 72)
  "42-mode-ujian": { keadaan: "UNRESOLVED", kode: "4.2-01 / D-01", terbuka: "Apa yang dimaksud Mode Ujian: aturan mulai, perangkat, dan apa yang boleh diubah guru; serta akomodasi bagi murid yang memerlukan waktu atau bantuan tambahan." },
  "42-jabatan": { keadaan: "UNRESOLVED", kode: "4.2-02 / D-02", terbuka: "Apakah jabatan memberi kewenangan atau hanya menggambarkan tanggung jawab, dan apakah pelaksana tugas mendapat kewenangan penuh." },
  "42-dua-sekolah": { keadaan: "UNRESOLVED", kode: "4.2-03 / D-03", terbuka: "Apakah penangguhan oleh Admin PINTAR, karena alasan yang muncul di satu sekolah, mengakhiri pekerjaan orang itu di semua sekolah." },
  "42-satu-orang": { keadaan: "UNRESOLVED", kode: "4.2-06a PARTIAL / 4.2-06b UNRESOLVED (D-06)", terbuka: "Menambah satu orang dapat direncanakan sekarang, dan pembetulan nama itu sendiri dapat dirancang. Yang masih menunggu keputusan hanya satu: bagaimana sertifikat yang sudah terbit diperlakukan setelah nama dibetulkan." },
  "42-koreksi-struktur": { keadaan: "UNRESOLVED", kode: "4.2-11 / D-11a, D-11b", terbuka: "Nama mana yang tampil di cetakan, sertifikat, dan pemeriksaan keaslian lama setelah sekolah berganti nama; dan sampai kapan satu putaran kenaikan kelas masih dapat dibatalkan." },
  "42-tanpa-guru": { keadaan: "COMPLETE", kode: "4.2-09" },
  "42-serah-terima": { keadaan: "PARTIAL", kode: "4.2-13", terbuka: "Batasnya sedang ditegaskan: hanya pekerjaan kelas, bukan draf, catatan peninjau, atau permintaan AI milik guru yang pergi." },
  "42-koreksi-pengembangan": { keadaan: "UNRESOLVED", kode: "4.2-10 / D-10", terbuka: "Apakah mengeluarkan peserta setelah sertifikat pengembangan profesinya terbit membuat sertifikat itu ditinjau." },
  "42-tolak-permintaan": { keadaan: "PARTIAL", kode: "4.2-07", terbuka: "Kalimat penolakan yang netral, yang tidak mengungkap apakah sebuah akun ada." },
  "42-ganti-password": { keadaan: "PARTIAL", kode: "4.2-08", terbuka: "Siapa penggunanya: staf, dan apakah juga murid yang memakai password." },
  "42-ekspor": { keadaan: "UNRESOLVED", kode: "4.2-04 / D-04a, D-04b", terbuka: "Data mana yang termasuk, termasuk data pribadi murid dan bukti yang berkaitan dengan guru; dan kaitannya dengan kebijakan masa simpan data." },
  "42-periode-lalu": { keadaan: "UNRESOLVED", kode: "4.2-05 / D-05", terbuka: "Apakah laporan periode lalu ditampilkan seperti saat itu, atau seperti setelah dikoreksi." },
  "42-kesehatan-terjadwal": { keadaan: "UNRESOLVED", kode: "4.2-12 / D-12", terbuka: "Apakah penyegaran terjadwal menunggu perbaikan perhitungannya, yang juga direncanakan di 4.5. Keputusan ini menunggu pembuktian perhitungan saat sistem berjalan." },
  // ── 4.5 (approved direction; design and policy work ahead)
  "45-kecerdasan-soal": { keadaan: "PARTIAL", kode: "4.5-01", terbuka: "Rancangan dan pengujian terkendali dapat dimulai; kesimpulan nyata memerlukan bukti dari kelas." },
  "45-perbaikan-statistik": { keadaan: "PARTIAL", kode: "4.5-01 / RD-4", terbuka: "Dugaan keterbatasan perhitungan harus dibuktikan dulu saat sistem berjalan." },
  "45-pemahaman-keliru": { keadaan: "UNRESOLVED", kode: "4.5-09 / R-3, D-45-09", terbuka: "Apakah memakai kode pemahaman keliru yang terstruktur, dan apakah catatan bebas peninjau boleh menjadi sumbernya. Saat ini catatan itu tidak boleh dipakai." },
  "45-kompetensi": { keadaan: "UNRESOLVED", kode: "4.5-02, 4.5-03 / R-5", terbuka: "Jangkar identitas kompetensi, dan siapa yang boleh memetakan materi sekolah ke sebuah kompetensi." },
  "45-empat-pernyataan": { keadaan: "PARTIAL", kode: "4.5-04" },
  "45-sebaran": { keadaan: "PARTIAL", kode: "4.5-05", bergantung: "Kecerdasan Soal, kesebandingan asesmen, dan identitas kompetensi." },
  "45-quiet": { keadaan: "PARTIAL", kode: "4.5-05 / M-03", terbuka: "Cara menilai apakah penjelasannya berguna bagi guru.", bergantung: "Kecerdasan Soal, kesebandingan asesmen, dan identitas kompetensi." },
  "45-sejarah": { keadaan: "UNRESOLVED", kode: "4.5-08 / R-2, D-05", terbuka: "Berapa lama rekaman lama disimpan (kebijakan masa simpan), dan batasnya dengan laporan periode lalu." },
  "45-evaluasi": { keadaan: "UNRESOLVED", kode: "4.5-06 / R-1", terbuka: "Kebijakan evaluasi resmi: penilai, periode, rubrik, batas waktu tanggapan guru, siapa yang membaca, dan masa simpannya." },
  "45-perlindungan": { keadaan: "UNRESOLVED", kode: "4.5-07 / R-1", terbuka: "Mengikuti kebijakan evaluasi resmi." },
  "45-whatsapp": { keadaan: "UNRESOLVED", kode: "4.5-11 / D-45-11", terbuka: "Untuk siapa (staf saja atau murid juga), penyedia, biaya, dan cara pemulihannya." },
  "45-akses-tidak-biasa": { keadaan: "UNRESOLVED", kode: "4.5-12 / D-45-12", terbuka: "Tanda apa yang boleh dipakai, tanpa melacak perilaku pengguna." },
  // ── 5.0 (approved direction; depends on 4.5)
  "50-pertumbuhan": { keadaan: "BLOCKED", kode: "5.0-01 / D-50-01", terbuka: "Syarat Kesepakatan Pertumbuhan Bersama.", bergantung: "Perlindungan guru, empat jenis pernyataan, dan pemisahan dari evaluasi resmi di 4.5." },
  "50-kesepakatan": { keadaan: "BLOCKED", kode: "5.0-01 / D-50-01", terbuka: "Siapa yang melihat bukti pertumbuhan, kapan boleh dipakai, dan bagaimana persetujuan ditarik.", bergantung: "Perlindungan guru di 4.5." },
  "50-intervensi": { keadaan: "BLOCKED", kode: "5.0-02 / R-4", terbuka: "Siapa yang menyetujui, cara memberi tahu keluarga, dan arti «bantuan yang dibutuhkan»; kemungkinan perlu kajian etika.", bergantung: "Kecerdasan Soal, kesebandingan asesmen, dan identitas kompetensi di 4.5." },
  "50-tiga-klaim": { keadaan: "BLOCKED", kode: "5.0-03", bergantung: "Empat jenis pernyataan dan kesebandingan asesmen di 4.5." },
  "50-jalur": { keadaan: "PARTIAL", kode: "5.0-04 / G-8", terbuka: "Bentuk jalur yang disetujui, dan apakah penegakan urutan perlu dimajukan." },
  "50-institusi": { keadaan: "UNRESOLVED", kode: "5.0-05 / D-50-05", terbuka: "Ukuran minimum data gabungan dan cakupan bagian.", bergantung: "Data gabungan dan perlindungan catatan perorangan dari 4.5." },
};
