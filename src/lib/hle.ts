/**
 * Human Language Engine (skeleton) — FABLE-01 §9.
 *
 * Every user-facing string passes through `t(event, persona, context)`. Staff
 * and learner surfaces never share internal words: lifecycle enums, evidence
 * classes, version strings and system-status words never reach a learner
 * screen. Keys are stable identifiers; the *telling* is what varies by
 * persona ("the evidence stays the same; only the telling changes").
 *
 * Only what Phase 1 renders is wired here; later phases extend the table.
 */

export type Persona = "learner" | "educator" | "staff" | "public";
export type HleEvent =
  | "jenis.bank.PRACTICE" | "jenis.bank.TEST" | "jenis.bank.EXAM"
  | "jenis.mode.PRE_TEST" | "jenis.mode.POST_TEST" | "jenis.mode.QUICK"
  | "jenis.mode.STANDALONE" | "jenis.mode.PRACTICE" | "jenis.mode.TEST"
  | "jenis.mode.EXAM" | "jenis.mode.PUBLIC_DEMO" | "jenis.mode.PAPER"
  | "jenis.integritas.VISIBILITY_CHANGE" | "jenis.integritas.NAVIGATION"
  | "jenis.integritas.RECONNECT" | "jenis.integritas.RAPID_OPTION_CHANGE"
  | "jenis.integritas.SUBMISSION_ANOMALY"
  | "metrik.peserta.label" | "metrik.peserta.arti"
  | "metrik.pemahaman.label" | "metrik.pemahaman.arti"
  | "metrik.kenaikan.label" | "metrik.kenaikan.arti"
  | "metrik.kesiapan.label" | "metrik.kesiapan.arti"
  | "metrik.topik.label" | "metrik.topik.arti"
  | "metrik.miskonsepsi.label" | "metrik.miskonsepsi.arti"
  | "metrik.peserta_institusi.label" | "metrik.peserta_institusi.arti"
  | "metrik.kenaikan_institusi.label" | "metrik.kenaikan_institusi.arti"
  | "metrik.gerbang_keselamatan.label" | "metrik.gerbang_keselamatan.arti"
  | "metrik.perbandingan_kohort.label" | "metrik.perbandingan_kohort.arti"
  | "metrik.kompetensi.label" | "metrik.kompetensi.arti"
  | "metrik.kredensial.label" | "metrik.kredensial.arti"
  | "metrik.item_benar.label" | "metrik.item_benar.arti"
  | "metrik.pengecoh.label" | "metrik.pengecoh.arti"
  | "metrik.posisi.label" | "metrik.posisi.arti"
  | "metrik.hasil_murid.label" | "metrik.hasil_murid.arti"
  | "kesiapan.belum_post_test" | "kesiapan.butuh_pendampingan"
  | "kesiapan.perlu_review" | "kesiapan.siap_sertifikasi"
  | "kesehatan.judul" | "kesehatan.diamati" | "kesehatan.ditandai"
  | "kesehatan.belum_cukup" | "kesehatan.belum_diperiksa"
  | "kesehatan.catatan_paparan" | "kesehatan.belum_dikalibrasi"
  | "laporan.metrik.tidak_dikenal" | "laporan.metrik.bukan_untuk_anda"
  | "laporan.metrik.diganti" | "laporan.metrik.belum_cukup_data"
  | "laporan.metrik.belum_ada_bukti"
  | "laporan.kelas.judul" | "laporan.institusi.judul"
  | "laporan.kosong" | "laporan.tak_ada_angka"
  // ── WP4. The Management surface. `pimpinan` is Indonesian for the people who
  // lead a part of a school — the word the approved Management design uses for
  // the role, and the one this surface is named after. Every key below is
  // declared staff-only (STAFF_ONLY_PREFIXES), because Management Indonesian
  // legitimately says "Menunggu tinjauan" about a queue where the same word on a
  // learner's screen would be the system telling a child to wait.
  | "pimpinan.eyebrow" | "pimpinan.judul" | "pimpinan.batas" | "pimpinan.urutan"
  | "pimpinan.memutuskan" | "pimpinan.ditolak" | "pimpinan.kembali"
  | "pimpinan.menunggu.nihil" | "pimpinan.menunggu.satu" | "pimpinan.menunggu.banyak"
  | "pimpinan.menunggu.judul" | "pimpinan.perlu_diketahui" | "pimpinan.perlu_diketahui.sub"
  | "pimpinan.lingkup.judul" | "pimpinan.lingkup.pilih" | "pimpinan.lingkup.kosong"
  | "pimpinan.lingkup.semua" | "pimpinan.buka.simpul"
  | "pimpinan.rantai.didukung" | "pimpinan.rantai.belum" | "pimpinan.rantai.langkah"
  | "pimpinan.rantai.keputusan"
  | "pimpinan.keluarga.integritas" | "pimpinan.keluarga.pembelajaran" | "pimpinan.keluarga.program"
  | "pimpinan.keadaan.menunggu" | "pimpinan.keadaan.ditangani" | "pimpinan.keadaan.selesai"
  | "pimpinan.hasil.tidak_ada" | "pimpinan.hasil.pendampingan" | "pimpinan.hasil.diteruskan"
  | "pimpinan.rantai.integritas.didukung" | "pimpinan.rantai.integritas.belum"
  | "pimpinan.rantai.integritas.langkah"
  | "pimpinan.rantai.pembelajaran.didukung" | "pimpinan.rantai.pembelajaran.belum"
  | "pimpinan.rantai.pembelajaran.langkah"
  | "pimpinan.rantai.program.didukung" | "pimpinan.rantai.program.belum"
  | "pimpinan.rantai.program.langkah"
  | "pimpinan.sumber.integrity_signals"
  | "pimpinan.tentang" | "pimpinan.sejak" | "pimpinan.diputuskan"
  | "pimpinan.aksi.ambil" | "pimpinan.aksi.putuskan" | "pimpinan.aksi.pilih"
  | "pimpinan.aksi.catatan" | "pimpinan.aksi.gagal"
  | "pimpinan.kesiapan.judul" | "pimpinan.kesiapan.catatan"
  | "pimpinan.kesiapan.cukup" | "pimpinan.kesiapan.belum_cukup" | "pimpinan.kesiapan.belum_ada"
  | "pimpinan.bukti.judul" | "pimpinan.bukti.kosong" | "pimpinan.bukti.dari"
  | "pimpinan.murid.judul" | "pimpinan.murid.sub" | "pimpinan.murid.kosong" | "pimpinan.murid.buka"
  | "pimpinan.rincian.judul" | "pimpinan.rincian.tercatat" | "pimpinan.rincian.status"
  | "pimpinan.rincian.periode" | "pimpinan.rincian.program" | "pimpinan.rincian.penempatan"
  | "pimpinan.rincian.catatan" | "pimpinan.rincian.belum" | "pimpinan.rincian.penguasaan"
  | "tindakan.ulangi" | "tindakan.fokus" | "tindakan.lanjut" | "tindakan.tunggu"
  | "verifikasi.judul"
  | "verifikasi.status"
  | "verifikasi.hasil"
  | "verifikasi.lulus"
  | "verifikasi.belum_lulus"
  | "verifikasi.predikat"
  | "verifikasi.institusi"
  | "verifikasi.tanggal"
  | "verifikasi.catatan"
  | "verifikasi.tidak_ditemukan"
  | "verifikasi.tidak_sah"
  | "sertifikat.judul"
  | "sertifikat.nomor"
  | "sertifikat.unduh"
  | "sertifikat.belum_ada"
  | "sertifikat.sedang_disiapkan"
  | "verifikasi.situs"
  | "verifikasi.eyebrow"
  | "verifikasi.intro"
  | "verifikasi.status.BERLAKU"
  | "verifikasi.status.BERLAKU.arti"
  | "verifikasi.status.DICABUT"
  | "verifikasi.status.DICABUT.arti"
  | "verifikasi.status.DIGANTIKAN"
  | "verifikasi.status.DIGANTIKAN.arti"
  | "verifikasi.status.TIDAK_SAH"
  | "verifikasi.tidak_ditemukan.arti"
  | "sertifikat.daftar.eyebrow"
  | "sertifikat.daftar.judul"
  | "sertifikat.daftar.pengantar"
  | "sertifikat.daftar.kosong"
  | "sertifikat.daftar.terbit"
  | "sertifikat.daftar.selesai"
  | "sertifikat.kembali"
  | "sertifikat.status.ELIGIBLE"
  | "sertifikat.status.ISSUED"
  | "sertifikat.status.REVOKED"
  | "sertifikat.status.SUPERSEDED"
  | "sertifikat.jenis"
  | "sertifikat.diberikan"
  | "sertifikat.predikat"
  | "sertifikat.tanggal"
  | "sertifikat.periksa.judul"
  | "sertifikat.periksa.arti"
  | "sertifikat.cetak"
  | "sertifikat.salin"
  | "sertifikat.tersalin"
  | "sertifikat.disiapkan.judul"
  | "sertifikat.disiapkan.arti"
  | "sertifikat.disiapkan.tenang"
  | "sertifikat.disiapkan.hasil"
  | "sertifikat.dicabut.judul"
  | "sertifikat.dicabut.arti"
  | "sertifikat.dicabut.bantuan"
  | "sertifikat.digantikan.judul"
  | "sertifikat.digantikan.arti"
  | "sertifikat.digantikan.buka"
  | "sertifikat.cetak.eyebrow"
  | "sertifikat.cetak.judul"
  | "sertifikat.cetak.arti"
  | "nav.belajar"
  | "nav.sertifikat"
  | "nav.akun"
  | "bahasa.label"
  | "bahasa.id"
  | "bahasa.en"
  | "lingkup.pilih"
  | "lingkup.semua"
  | "lingkup.kosong"
  | "tolak.arti"
  | "tolak.kembali"
  | "komitmen.kembali"
  | "bukti.dari"
  | "bukti.murid"
  | "bukti.minimum"

  | "app.name"
  | "auth.title"
  | "auth.lede"
  | "auth.email_label"
  | "auth.email_ph"
  | "auth.send_link"
  | "auth.sending"
  | "auth.err_email"
  | "auth.err_send"
  | "auth.retry"
  | "auth.sent_h"
  | "auth.link_sent"
  | "auth.sent_resend"
  | "auth.sent_other"
  | "auth.sent_same"
  | "auth.belum_siap"
  | "auth.card_title"
  | "auth.card_go"
  | "auth.card_h1"
  | "auth.card_lede"
  | "auth.card_number"
  | "auth.card_pin"
  | "auth.card_show"
  | "auth.card_hide"
  | "auth.card_enter"
  | "auth.card_checking"
  | "auth.card_failed"
  | "auth.card_back"
  | "auth.foot"
  | "auth.say_h"
  | "auth.say_p"
  | "auth.placeholder"
  | "auth.link_h_exch"
  | "auth.link_p_exch"
  | "auth.link_h_exp"
  | "auth.link_p_exp"
  | "auth.link_again"
  | "auth.link_same"
  | "auth.in_h"
  | "auth.in_p"
  | "auth.in_go"
  | "auth.in_out"
  | "auth.signed_out"
  | "auth.not_yet"
  | "config.title"
  | "config.section.system"
  | "config.section.content"
  | "config.section.assessment"
  | "config.section.certificates"
  | "config.section.intelligence"
  | "laporan.templat.judul"
  | "laporan.templat.institusi"
  | "config.label.person_new"
  | "config.label.person_known"
  | "laporan.templat.penjelasan"
  | "laporan.templat.kosong"
  | "laporan.templat.judul_kunci"
  | "laporan.templat.jenis"
  | "laporan.templat.metrik"
  | "laporan.templat.tampilan"
  | "laporan.templat.versi"
  | "laporan.templat.simpan"
  | "laporan.templat.pilih"
  | "laporan.templat.tak_berwenang"
  | "laporan.templat.batas"
  | "config.card.health"
  | "config.card.cohorts"
  | "config.placeholder"
  | "config.environment"
  | "config.refused"
  | "config.section.rollover"
  | "config.section.transfers"
  | "config.section.roles"
  | "config.section.audit"
  | "config.section.flags"
  | "config.action.rollover"
  | "config.action.request_transfer"
  | "config.action.authorize"
  | "config.action.execute"
  | "config.action.reject"
  | "config.action.grant"
  | "config.action.revoke"
  | "config.action.save"
  | "config.result.ok"
  | "config.result.failed"
  | "config.empty"
  | "config.label.period_from"
  | "config.label.period_to"
  | "config.label.mapping_help"
  | "config.label.enrollment"
  | "config.label.destination_institution"
  | "config.label.destination_period"
  | "config.label.destination_programme"
  | "config.label.destination_help"
  | "config.label.reason"
  | "config.label.person"
  | "config.label.role"
  | "config.label.scope"
  | "config.label.valid_until"
  | "config.label.flag_key"
  | "config.label.enabled"
  | "config.label.maintenance"
  | "config.label.registration_lock"
  | "config.label.when"
  | "config.label.action"
  | "config.label.target"
  | "config.label.build"
  | "config.label.status"
  | "config.label.not_rolled"
  | "config.struktur.galat.tidak_berwenang"
  | "config.struktur.galat.nama_tidak_sah"
  | "config.struktur.galat.nama_dipakai"
  | "config.struktur.galat.tahun_tidak_sah"
  | "config.struktur.galat.tahun_tidak_cocok"
  | "config.struktur.galat.induk_tidak_sah"
  | "config.struktur.galat.induk_nonaktif"
  | "config.struktur.galat.simpul_tidak_sah"
  | "config.struktur.galat.masih_ada_anak"
  | "config.struktur.galat.masih_ada_murid"
  | "config.struktur.galat.masih_ada_staf"
  | "config.struktur.galat.isian_kurang"
  | "config.struktur.galat.gagal"
  | "role.STUDENT"
  | "role.EDUCATOR"
  | "role.HEAD_OF_DEPARTMENT"
  | "role.DEAN"
  | "role.INSTITUTION_ADMIN"
  | "role.SYSTEM_ADMIN"
  | "transfer.REQUESTED"
  | "transfer.AUTHORIZED"
  | "transfer.EXECUTED"
  | "transfer.REJECTED"
  | "transfer.CANCELLED"
  | "entry.title"
  | "entry.learner"
  | "entry.educator"
  | "entry.staff"
  // FABLE-03 — the Dr. Gladys learning cycle. Learner-facing copy only; no
  // lifecycle enum, evidence class, engine version or release hash appears in
  // any of it (§9), and the guard below refuses one if it ever does.
  | "cycle.title"
  | "cycle.none"
  | "cycle.step.pretest"
  | "cycle.step.map"
  | "cycle.step.lesson"
  | "cycle.step.posttest"
  | "cycle.step.result"
  | "cycle.open"
  | "cycle.continue"
  | "cycle.locked_until_pretest"
  | "pretest.title"
  | "pretest.intro"
  | "pretest.progress"
  | "pretest.next"
  | "pretest.back"
  | "pretest.finish"
  | "pretest.done"
  | "map.title"
  | "map.intro"
  | "map.tier.PERLU_SEGERA"
  | "map.tier.WAJIB"
  | "map.tier.DISARANKAN"
  | "map.tier.KUAT"
  | "map.page"
  | "map.to_lesson"
  | "lesson.title"
  | "lesson.page_of"
  | "lesson.prev"
  | "lesson.next"
  | "lesson.transcript"
  | "lesson.speed"
  | "lesson.example.reveal"
  | "lesson.example.done"
  | "lesson.pdf"
  | "lesson.saved"
  | "posttest.title"
  | "posttest.intro"
  | "posttest.elapsed"
  | "posttest.pause"
  | "posttest.resume"
  | "posttest.flag"
  | "posttest.flagged"
  | "posttest.navigator"
  | "posttest.answered"
  | "posttest.unanswered"
  | "posttest.confirm"
  | "posttest.confirmed"
  | "posttest.submit"
  | "posttest.submit_confirm"
  | "assist.SD"
  | "assist.SMP"
  | "assist.SMA"
  | "assist.UNIVERSITAS"
  | "assist.more"
  | "assist.close"
  | "assist.level.ARAH"
  | "assist.level.PETUNJUK"
  | "assist.level.CONTOH"
  | "assist.none"
  | "hasil.title"
  | "hasil.mastery"
  | "hasil.safety.ok"
  | "hasil.safety.missed"
  | "hasil.domain"
  | "hasil.review"
  | "hasil.review.open"
  | "hasil.answer_yours"
  | "hasil.answer_right"
  | "hasil.answer_notyet"
  | "hasil.delta.LENGKAP"
  | "hasil.delta.BARU_PEMETAAN"
  | "hasil.delta.BARU_PENGUASAAN"
  | "hasil.delta.BELUM_ADA"
  | "hasil.certificate"
  | "hasil.certificate_soon"
  | "siklus.halo"
  | "siklus.beranda"
  | "siklus.hari_ini"
  | "siklus.lanjutkan"
  | "siklus.perhatian"
  | "siklus.milik_anda"
  | "siklus.terbuka"
  | "siklus.buka"
  | "siklus.mulai"
  | "siklus.di.pemetaan"
  | "siklus.di.peta"
  | "siklus.di.pelajaran"
  | "siklus.di.penguasaan"
  | "siklus.di.hasil"
  | "siklus.dari"
  | "siklus.selesai_n"
  | "siklus.sekarang"
  | "siklus.peta_anda"
  | "siklus.langkah_dari"
  | "siklus.jumlah_soal"
  | "siklus.ditutup"
  | "siklus.soal"
  | "siklus.lihat_peta"
  | "siklus.pelajaran_next"
  | "siklus.pelajaran_prev"
  | "siklus.delta_arti"
  | "siklus.bisa_lakukan"
  | "siklus.bisa.tandai"
  | "siklus.bisa.jeda"
  | "siklus.bisa.arah"
  | "siklus.catatan.judul"
  | "siklus.catatan.isi"
  | "siklus.nanti"
  | "siklus.ambang"
  | "siklus.tepat_dari"
  | "siklus.setelah"
  | "siklus.berikutnya"
  | "siklus.terbuka_kini"
  | "siklus.habis.judul"
  | "siklus.habis.isi"
  | "siklus.lihat_sertifikat"
  | "sync.offline"
  | "sync.pending"
  | "studio.title"
  | "evaluasi.judul"
  | "evaluasi.intro"
  | "evaluasi.pilih"
  | "evaluasi.mulai"
  | "evaluasi.refused"
  | "evaluasi.mode"
  | "evaluasi.sebagai"
  | "evaluasi.ganti"
  | "evaluasi.keluar"
  | "evaluasi.berakhir"
  | "evaluasi.sesi_habis"
  | "evaluasi.gagal"
  | "evaluasi.kembali"
  | "studio.refused"
  | "studio.nav.beranda"
  | "studio.nav.unggah"
  | "studio.nav.tinjau"
  | "studio.nav.kanonik"
  | "studio.nav.definisi"
  | "studio.nav.integritas"
  | "studio.nav.sertifikat"
  | "studio.nav.bank"
  | "studio.nav.kuis"
  | "studio.kuis.judul"
  | "studio.kuis.pengantar"
  | "studio.kuis.kelas"
  | "studio.kuis.bab"
  | "studio.kuis.sumber_sekolah"
  | "studio.kuis.sumber_pustaka"
  | "studio.kuis.jumlah"
  | "studio.kuis.menit"
  | "studio.kuis.luncurkan"
  | "studio.kuis.riwayat"
  | "studio.kuis.kosong"
  | "studio.kuis.bab_kosong"
  | "studio.kuis.tidak_tersedia"
  | "studio.kuis.tanpa_kelas"
  | "studio.bucket.ACTION_REQUIRED"
  | "studio.bucket.AWAITING_MY_REVIEW"
  | "studio.bucket.BLOCKED"
  | "studio.bucket.QUESTION_HEALTH"
  | "studio.bucket.DISTRIBUTED_CANONICAL"
  | "studio.state.READY"
  | "studio.state.ACTION_REQUIRED"
  | "studio.state.BLOCKED"
  | "studio.state.explain.READY"
  | "studio.state.explain.ACTION_REQUIRED"
  | "studio.state.explain.BLOCKED"
  | "studio.paket.judul"
  | "studio.paket.alasan"
  | "studio.paket.pratinjau"
  | "studio.paket.setujui"
  | "studio.paket.kunci"
  | "studio.paket.kunci_peringatan"
  | "studio.paket.terbitkan"
  | "studio.paket.tarik"
  | "studio.paket.tugaskan"
  | "studio.paket.terbit_bukan_tugas"
  | "studio.paket.revisi"
  | "studio.paket.revisi_penjelasan"
  | "studio.paket.kosong"
  | "studio.temuan.lokasi"
  | "studio.temuan.masalah"
  | "studio.temuan.mengapa"
  | "studio.temuan.cara"
  | "studio.temuan.akui"
  | "studio.temuan.kosong"
  | "studio.unggah.judul"
  | "studio.unggah.mudah"
  | "studio.unggah.mudah_penjelasan"
  | "studio.unggah.terstruktur"
  | "studio.unggah.terstruktur_penjelasan"
  | "studio.unggah.buat_paket"
  | "studio.unggah.buat_penilaian"
  | "studio.unggah.buat_video"
  | "studio.unggah.pertanyaan"
  | "studio.unggah.konfirmasi"
  | "studio.unggah.media_catatan"
  | "studio.tinjau.judul"
  | "studio.tinjau.kosong"
  | "studio.tinjau.penulis"
  | "studio.tinjau.bukan_penulis"
  | "studio.kanonik.judul"
  | "studio.kanonik.penjelasan"
  | "studio.kanonik.kosong"
  | "studio.kanonik.ditarik"
  | "studio.kanonik.hanya_baca"
  | "studio.definisi.judul"
  | "studio.definisi.batas"
  | "studio.definisi.simpan"
  | "studio.definisi.versi_baru"
  | "studio.definisi.tetap"
  | "studio.integritas.judul"
  | "studio.integritas.penjelasan"
  | "studio.integritas.kosong"
  | "studio.integritas.NO_CONCERN"
  | "studio.integritas.DISCUSSED_WITH_LEARNER"
  | "studio.integritas.REFERRED_TO_INSTITUTION"
  | "studio.integritas.catat"
  | "studio.sertifikat.judul"
  | "studio.sertifikat.tata_letak"
  | "studio.sertifikat.awalan"
  | "studio.sertifikat.identitas"
  | "studio.sertifikat.simpan"
  | "studio.bank.judul"
  | "studio.bank.kesehatan"
  | "studio.bank.belum_cukup"
  | "studio.bank.prediksi"
  | "studio.bank.empiris"
  | "studio.bank.akui_ok"
  | "studio.bank.tindakan"
  | "studio.hasil.ok"
  | "studio.hasil.gagal"
  | "mengajar.judul"
  | "nav.kelas" | "nav.pimpinan" | "nav.pendataan"
  // ── WP6B. The educator's own learning. These are NOT staff-only: they are
  // read by a person in their learner context, so the internal-word sweep
  // applies to them exactly as it does to the learner's own home — which is
  // the point, because this surface must never sound like machinery.
  | "nav.pembelajaran"
  | "pembelajaran.eyebrow" | "pembelajaran.milik" | "pembelajaran.kosong"
  | "pembelajaran.kosong_arti" | "pembelajaran.sertifikat_arti"
  // ── WP7C. Anonymous student → educator feedback. DELIBERATELY NOT declared
  // staff-only: a learner reads the questions, the options, the form and every
  // sentence about what happens to their answers, so the whole prefix stays
  // inside the internal-word sweep. The educator and Management tellings sit
  // under the same prefix and are held to the same register, which is the
  // right way round — this surface is about a named person, and the calmest
  // available words are the correct ones for every reader of it.
  | "umpanbalik.pertanyaan.penjelasan_jelas" | "umpanbalik.pertanyaan.kesempatan_bertanya"
  | "umpanbalik.pertanyaan.umpan_balik_tugas" | "umpanbalik.pertanyaan.aman_mengaku_belum_paham"
  | "umpanbalik.pertanyaan.kecepatan_pas"
  | "umpanbalik.pilihan.jarang" | "umpanbalik.pilihan.kadang"
  | "umpanbalik.pilihan.sering" | "umpanbalik.pilihan.selalu"
  | "umpanbalik.hasil.belum_cukup_tanggapan" | "umpanbalik.hasil.belum_ditutup"
  | "umpanbalik.hasil.judul" | "umpanbalik.hasil.total" | "umpanbalik.hasil.arti"
  | "umpanbalik.keadaan.terbuka" | "umpanbalik.keadaan.terbit" | "umpanbalik.keadaan.ditahan"
  | "umpanbalik.murid.judul" | "umpanbalik.murid.ajakan" | "umpanbalik.murid.beri"
  | "umpanbalik.murid.sudah"
  | "umpanbalik.tentang.kelas" | "umpanbalik.tentang.guru"
  | "umpanbalik.form.judul" | "umpanbalik.form.intro" | "umpanbalik.form.privasi"
  | "umpanbalik.form.guna" | "umpanbalik.form.belum_semua" | "umpanbalik.form.kirim"
  | "umpanbalik.form.mengirim"
  | "umpanbalik.kirim.tercatat" | "umpanbalik.kirim.sudah" | "umpanbalik.kirim.tutup"
  | "umpanbalik.kirim.bukan_milik" | "umpanbalik.kirim.belum_lengkap"
  | "umpanbalik.kirim.belum_terkirim" | "umpanbalik.kirim.tak_pasti"
  | "umpanbalik.selesai.judul" | "umpanbalik.selesai.arti"
  | "umpanbalik.guru.judul" | "umpanbalik.guru.intro" | "umpanbalik.guru.kosong"
  | "umpanbalik.guru.buka" | "umpanbalik.guru.guna"
  | "umpanbalik.pimpinan.judul" | "umpanbalik.pimpinan.sub" | "umpanbalik.pimpinan.kosong"
  | "umpanbalik.pimpinan.buka"
  | "umpanbalik.kembali" | "umpanbalik.ditolak"
  // ── WP7D. Management operating a round. Staff-read, but under the same
  // prefix and the same register as everything else here: this surface is
  // about a named person, so the calmest available words are correct for it.
  | "umpanbalik.tutup.aksi" | "umpanbalik.tutup.judul" | "umpanbalik.tutup.arti"
  | "umpanbalik.tutup.akhir" | "umpanbalik.tutup.ya" | "umpanbalik.tutup.batal"
  | "umpanbalik.tutup.menutup" | "umpanbalik.tutup.tertutup" | "umpanbalik.tutup.sudah"
  | "umpanbalik.tutup.bukan_wewenang" | "umpanbalik.tutup.subjek"
  | "umpanbalik.tutup.belum" | "umpanbalik.tutup.tak_pasti"
  | "umpanbalik.tutup.selesai"
  // ── WP7D resume. Management starting a round: the class list, the governed
  // subjects, and one outcome for every way the backend can refuse between
  // naming an educator and asking the class about them.
  | "umpanbalik.kelas.judul" | "umpanbalik.kelas.sub" | "umpanbalik.kelas.kosong"
  | "umpanbalik.kelas.buka" | "umpanbalik.kelas.putaran"
  | "umpanbalik.buka.judul" | "umpanbalik.buka.sub" | "umpanbalik.buka.kosong"
  | "umpanbalik.buka.tanpa_wewenang" | "umpanbalik.buka.aksi" | "umpanbalik.buka.memulai"
  | "umpanbalik.buka.dibuka" | "umpanbalik.buka.sudah_ada" | "umpanbalik.buka.bukan_pengajar"
  | "umpanbalik.buka.bukan_wewenang" | "umpanbalik.buka.bukan_akademik"
  | "umpanbalik.buka.kelas_belum_siap" | "umpanbalik.buka.belum_siap"
  | "umpanbalik.buka.subjek_sendiri" | "umpanbalik.buka.tak_pasti"
  // ── WP5B. Institutional intake. Staff-only by declaration
  // (STAFF_ONLY_PREFIXES), because an administrator's screen legitimately says
  // a job is "Menunggu" where the same word on a learner's screen would be the
  // system telling a child to wait.
  | "pendataan.eyebrow" | "pendataan.judul" | "pendataan.intro" | "pendataan.ditolak"
  | "pendataan.kembali" | "pendataan.sekolah" | "pendataan.nomor.arti"
  | "pendataan.kode.judul" | "pendataan.kode.belum" | "pendataan.kode.arti"
  | "pendataan.kode.bentuk" | "pendataan.kode.contoh" | "pendataan.kode.peringatan"
  | "pendataan.kode.simpan" | "pendataan.kode.beku" | "pendataan.kode.gagal" | "pendataan.kode.label"
  | "pendataan.unggah.judul" | "pendataan.unggah.berkas" | "pendataan.unggah.tempel"
  | "pendataan.unggah.bentuk" | "pendataan.unggah.kosong" | "pendataan.unggah.terbaca"
  | "pendataan.peta.judul" | "pendataan.peta.sub" | "pendataan.peta.tidak" | "pendataan.peta.kolom"
  | "pendataan.peta.sama" | "pendataan.peta.wajib" | "pendataan.peta.lanjut" | "pendataan.peta.pratayang"
  | "pendataan.medan.display_name" | "pendataan.medan.person_id" | "pendataan.medan.node_id"
  | "pendataan.medan.role" | "pendataan.medan.programme_id"
  | "pendataan.periksa.judul" | "pendataan.periksa.mulai" | "pendataan.periksa.jalan"
  | "pendataan.periksa.bersih" | "pendataan.periksa.ada" | "pendataan.periksa.baris"
  | "pendataan.periksa.perbaiki" | "pendataan.periksa.gagal"
  | "pendataan.masalah.nama" | "pendataan.masalah.orang_bentuk" | "pendataan.masalah.orang_asing"
  | "pendataan.masalah.orang_sudah" | "pendataan.masalah.tempat_bentuk"
  | "pendataan.masalah.tempat_asing" | "pendataan.masalah.tempat_luar"
  | "pendataan.masalah.peran_asing" | "pendataan.masalah.peran_dilarang"
  | "pendataan.masalah.peran_tanpa_tempat" | "pendataan.masalah.ganda" | "pendataan.masalah.lain"
  | "pendataan.masalah.tempat_murid"
  | "pendataan.pratinjau.judul" | "pendataan.pratinjau.total" | "pendataan.pratinjau.baru"
  | "pendataan.pratinjau.tertaut" | "pendataan.pratinjau.nomor" | "pendataan.pratinjau.peran"
  | "pendataan.pratinjau.akun" | "pendataan.pratinjau.akun_arti" | "pendataan.pratinjau.setuju"
  | "pendataan.pratinjau.tanya" | "pendataan.konfirmasi.gagal"
  | "pendataan.percontohan.judul" | "pendataan.percontohan.arti" | "pendataan.percontohan.nyata"
  | "pendataan.percontohan.tanya" | "pendataan.percontohan.sisa" | "pendataan.percontohan.sudah"
  | "pendataan.percontohan.gagal"
  | "pendataan.maju.judul" | "pendataan.maju.selesai" | "pendataan.maju.sisa"
  | "pendataan.maju.gagal_baris" | "pendataan.maju.mulai" | "pendataan.maju.lanjut"
  | "pendataan.maju.jeda" | "pendataan.maju.terputus" | "pendataan.maju.aman"
  | "pendataan.selesai.judul" | "pendataan.selesai.arti"
  | "pendataan.gagal.judul" | "pendataan.gagal.baris"
  | "pendataan.daftar.judul" | "pendataan.daftar.kosong" | "pendataan.daftar.buka"
  | "pendataan.keadaan.menyusun" | "pendataan.keadaan.menunggu_konfirmasi"
  | "pendataan.keadaan.percontohan" | "pendataan.keadaan.periksa_percontohan"
  | "pendataan.keadaan.sisa" | "pendataan.keadaan.berjalan"
  | "pendataan.keadaan.selesai" | "pendataan.keadaan.gagal"
  | "mengajar.kembali"
  | "mengajar.sapa.pagi"
  | "mengajar.sapa.siang"
  | "mengajar.sapa.sore"
  | "mengajar.sapa.malam"
  | "mengajar.beranda.intro"
  | "mengajar.layak.eyebrow"
  | "mengajar.layak.kosong"
  | "mengajar.layak.sebab"
  | "mengajar.layak.terbit"
  | "mengajar.aksi.siapkan"
  | "mengajar.aksi.lihat"
  | "mengajar.untuk"
  | "mengajar.kelas.judul"
  | "mengajar.kelas.sub"
  | "mengajar.kelas.kosong"
  | "mengajar.berjalan.judul"
  | "mengajar.berjalan.kelas"
  | "mengajar.berjalan.kosong"
  | "mengajar.melihat"
  | "mengajar.kelas.intro"
  | "mengajar.pindah"
  | "mengajar.fakta.mapel"
  | "mengajar.fakta.murid"
  | "mengajar.fakta.materi"
  | "mengajar.fakta.materi.kosong"
  | "mengajar.fakta.berubah"
  | "mengajar.aksi.uji_cepat"
  | "mengajar.aksi.bukti"
  | "mengajar.aksi.langkah"
  | "mengajar.materi.judul"
  | "mengajar.materi.sub"
  | "mengajar.materi.kosong"
  | "mengajar.murid.judul"
  | "mengajar.murid.sub"
  | "mengajar.murid.kosong"
  | "mengajar.status.tersedia"
  | "mengajar.status.selesai"
  | "mengajar.status.belum"
  | "mengajar.status.siap"
  | "mengajar.status.berjalan"
  | "mengajar.siap.langkah1"
  | "mengajar.siap.langkah2"
  | "mengajar.siap.langkah3"
  | "mengajar.siap.eyebrow"
  | "mengajar.siap.judul"
  | "mengajar.siap.intro"
  | "mengajar.siap.pilih"
  | "mengajar.siap.pilih.kosong"
  | "mengajar.siap.terbitan"
  | "mengajar.siap.diterbitkan"
  | "mengajar.siap.pelajaran"
  | "mengajar.siap.soal"
  | "mengajar.siap.terima"
  | "mengajar.siap.jendela"
  | "mengajar.siap.jendela.arti"
  | "mengajar.siap.mulai"
  | "mengajar.siap.sampai"
  | "mengajar.siap.sampai.kosong"
  | "mengajar.siap.disediakan"
  | "mengajar.siap.dipilih"
  | "mengajar.siap.terdaftar"
  | "mengajar.siap.tinjau"
  | "mengajar.siap.akibat.1"
  | "mengajar.siap.akibat.2"
  | "mengajar.siap.akibat.3"
  | "mengajar.siap.komit"
  | "mengajar.siap.kembali"
  | "mengajar.instrumen.PRE_TEST"
  | "mengajar.instrumen.POST_TEST"
  | "mengajar.instrumen.STANDALONE"
  | "mengajar.instrumen.sertifikat"
  | "mengajar.instrumen.sertifikat.arti"
  | "mengajar.percobaan"
  | "mengajar.cepat.eyebrow"
  | "mengajar.cepat.judul"
  | "mengajar.cepat.intro"
  | "mengajar.cepat.langkah1"
  | "mengajar.cepat.langkah2"
  | "mengajar.cepat.langkah3"
  | "mengajar.cepat.bab"
  | "mengajar.cepat.bab.arti"
  | "mengajar.cepat.bab.kosong"
  | "mengajar.cepat.jumlah"
  | "mengajar.cepat.jumlah.arti"
  | "mengajar.cepat.jendela"
  | "mengajar.cepat.jendela.arti"
  | "mengajar.cepat.menit"
  | "mengajar.cepat.untuk"
  | "mengajar.cepat.lanjut"
  | "mengajar.cepat.tinjau"
  | "mengajar.cepat.rv1"
  | "mengajar.cepat.rv2"
  | "mengajar.cepat.rv3"
  | "mengajar.cepat.rv4"
  | "mengajar.cepat.akibat"
  | "mengajar.cepat.komit"
  | "mengajar.cepat.ubah"
  | "mengajar.cepat.hidup.eyebrow"
  | "mengajar.cepat.hidup.judul"
  | "mengajar.cepat.hidup.kumpul"
  | "mengajar.cepat.hidup.sisa"
  | "mengajar.cepat.hidup.menit"
  | "mengajar.cepat.hidup.catatan"
  | "mengajar.cepat.hidup.siapa"
  | "mengajar.cepat.sudah_ada"
  | "mengajar.bukti.eyebrow"
  | "mengajar.bukti.judul"
  | "mengajar.bukti.intro"
  | "mengajar.bukti.keadaan"
  | "mengajar.bukti.kumpul"
  | "mengajar.bukti.jendela"
  | "mengajar.bukti.belum"
  | "mengajar.bukti.murid"
  | "mengajar.bukti.poin"
  | "mengajar.bukti.bagian"
  | "mengajar.bukti.keliru"
  | "mengajar.bukti.kali"
  | "mengajar.bukti.kosong"
  | "mengajar.bukti.simpulan"
  | "mengajar.bukti.kaki"
  | "mengajar.langkah.eyebrow"
  | "mengajar.langkah.judul"
  | "mengajar.langkah.intro"
  | "mengajar.langkah.buka"
  | "mengajar.langkah.f1"
  | "mengajar.langkah.f1w"
  | "mengajar.langkah.f2"
  | "mengajar.langkah.f2w"
  | "mengajar.langkah.f3"
  | "mengajar.langkah.f3w"
  | "mengajar.langkah.f4"
  | "mengajar.langkah.f4w"
  | "mengajar.langkah.f5"
  | "mengajar.langkah.f5w"
  | "mengajar.langkah.f6"
  | "mengajar.langkah.f6w"
  | "mengajar.langkah.quiet"
  | "mengajar.siapa.judul"
  | "mengajar.siapa.sudah"
  | "mengajar.siapa.belum"
  | "mengajar.siapa.catatan"
  | "tur.tur"
  | "tur.nama.belajar"
  | "tur.nama.pengajar"
  | "tur.berikutnya"
  | "tur.kembali"
  | "tur.lewati"
  | "tur.selesai"
  | "tur.jangan"
  | "tur.langkah"
  | "tur.dari"
  | "tur.contoh"
  | "tur.tutup"
  | "tur.catatan"
  | "tur.catatan.sd"
  | "nav.bantuan"
  | "tur.bantuan.judul"
  | "tur.bantuan.langkah7"
  | "tur.bantuan.mulai_lagi"
  | "tur.bantuan.mulai"
  | "tur.bantuan.atau"
  | "tur.bantuan.lain"
  | "tur.bantuan.guru"
  | "tur.bantuan.sekolah"
  | "tur.tip.lagi"
  | "tur.tip.lagi.sd"
  | "tur.tip.berhenti"
  | "tur.tip.mengerti"
  | "tur.nt.1.judul"
  | "tur.nt.1.isi"
  | "tur.nt.1.kosong"
  | "tur.nt.2.judul"
  | "tur.nt.2.isi"
  | "tur.nt.3.judul"
  | "tur.nt.3.isi"
  | "tur.nt.4.judul"
  | "tur.nt.4.isi"
  | "tur.nt.5.judul"
  | "tur.nt.5.isi"
  | "tur.nt.6.judul"
  | "tur.nt.6.isi"
  | "tur.nt.7.judul"
  | "tur.nt.7.isi"
  | "tur.sd.1.judul"
  | "tur.sd.1.isi"
  | "tur.sd.1.kosong"
  | "tur.sd.2.judul"
  | "tur.sd.2.isi"
  | "tur.sd.3.judul"
  | "tur.sd.3.isi"
  | "tur.sd.4.judul"
  | "tur.sd.4.isi"
  | "tur.sd.5.judul"
  | "tur.sd.5.isi"
  | "tur.sd.6.judul"
  | "tur.sd.6.isi"
  | "tur.sd.7.judul"
  | "tur.sd.7.isi"
  | "tur.sm.1.judul"
  | "tur.sm.1.isi"
  | "tur.sm.1.kosong"
  | "tur.sm.2.judul"
  | "tur.sm.2.isi"
  | "tur.sm.3.judul"
  | "tur.sm.3.isi"
  | "tur.sm.4.judul"
  | "tur.sm.4.isi"
  | "tur.sm.5.judul"
  | "tur.sm.5.isi"
  | "tur.sm.6.judul"
  | "tur.sm.6.isi"
  | "tur.sm.7.judul"
  | "tur.sm.7.isi"
  | "tur.pg.1.judul"
  | "tur.pg.1.isi"
  | "tur.pg.1.kosong"
  | "tur.pg.2.judul"
  | "tur.pg.2.isi"
  | "tur.pg.2.kosong"
  | "tur.pg.3.judul"
  | "tur.pg.3.isi"
  | "tur.pg.3.kosong"
  | "tur.pg.4.judul"
  | "tur.pg.4.isi"
  | "tur.pg.5.judul"
  | "tur.pg.5.isi"
  | "tur.pg.6.judul"
  | "tur.pg.6.isi"
  | "tur.pg.7.judul"
  | "tur.pg.7.isi"
  | "sync.done"
  | "sync.belum_tersimpan"
  | "sync.belum_terkirim"
  | "sync.sesi_ditutup"
  | "aktivasi.ditolak"
  | "aktivasi.eyebrow"
  | "aktivasi.judul"
  | "aktivasi.intro"
  | "aktivasi.kosong"
  | "aktivasi.surel"
  | "aktivasi.dengan_surel"
  | "aktivasi.dengan_kartu"
  | "aktivasi.kartu_dibuat"
  | "aktivasi.gagal"
  | "aktivasi.baru.judul"
  | "aktivasi.baru.arti"
  | "aktivasi.baru.nama"
  | "aktivasi.baru.tombol"
  | "aktivasi.baru.ok";

/**
 * One key's telling, in both languages.
 *
 * `default` and `en` are REQUIRED by the type, which is the mechanism behind
 * "a key with one language fails" (UX-1 Slice 0, S0.2): a key added without an
 * English telling does not compile, so the static test UX1-S0-HLE-01 is the
 * second wall rather than the first.
 *
 * Persona overrides stay flat — `learner:` and `en_learner:` rather than a
 * nested object — for one reason worth writing down: F05-S03 and QAC-S01 read
 * this table with a regular expression that cannot cross a closing brace. A
 * nested shape would silently empty their scan, and a copy rule that scans
 * nothing reads green while enforcing nothing.
 */
type Telling = { default: string; en: string }
  & Partial<Record<Persona, string>>
  & Partial<Record<"en_learner" | "en_educator" | "en_staff" | "en_public", string>>;

type Table = Record<HleEvent, Telling>;

/** The interface language. Presentation only: it changes no request (S0.3). */
export type Locale = "id" | "en";

/**
 * The school stage a learner is at. Used to soften a learner sentence for a
 * younger reader; never to decide what they may see, which is the database's
 * business and no screen's.
 */
export type Stage = "SD" | "SMP" | "SMA" | "UNIVERSITAS";

export type TellingContext = { locale?: Locale; stage?: Stage };

/**
 * Stage overrides, LEARNER KEYS ONLY.
 *
 * A separate table rather than more fields on the row, because a stage is a
 * property of the reader and not of the key — and because keeping it out of
 * `table` leaves the copy-scanning regular expressions above intact.
 *
 * `t()` refuses to consult this for any persona other than `learner`: a
 * teacher reading about a Year 4 class is not a Year 4 child, and softening a
 * staff sentence by the stage of the children in it would be the surface
 * guessing at its reader.
 */
const stageTable: Partial<Record<HleEvent, Partial<Record<Stage, { id: string; en: string }>>>> = {
  "cycle.title": {
    SD: { id: "Perjalanan belajar Anda", en: "Your learning journey" },
    UNIVERSITAS: { id: "Perjalanan belajar Anda", en: "Your learning journey" },
  },
  "cycle.none": {
    SD: { id: "Belum ada yang perlu dikerjakan hari ini.", en: "There is nothing to do today yet." },
    UNIVERSITAS: { id: "Belum ada materi yang ditugaskan untuk Anda.", en: "Nothing has been assigned to you yet." },
  },
  "pretest.intro": {
    SD: {
      id: "Ini bukan ulangan. Jawaban Anda dipakai untuk memilih bacaan yang pas.",
      en: "This is not a test. Your answers are used to choose reading that fits you.",
    },
    UNIVERSITAS: {
      id: "Ini bukan ujian. Jawaban Anda dipakai untuk menyusun peta bacaan yang sesuai dengan Anda.",
      en: "This is not an exam. Your answers are used to build a reading map that fits you.",
    },
  },
  "posttest.intro": {
    SD: {
      id: "Kerjakan pelan-pelan. Soal boleh ditandai dan dikerjakan lagi nanti.",
      en: "Take your time. You can flag a question and come back to it later.",
    },
    UNIVERSITAS: {
      id: "Kerjakan dengan tenang. Anda dapat menandai soal dan kembali lagi.",
      en: "Work through it calmly. You can flag a question and return to it.",
    },
  },
  "sertifikat.sedang_disiapkan": {
    SD: {
      id: "Sertifikat Anda sedang disiapkan. Tidak ada yang perlu dilakukan.",
      en: "Your certificate is being prepared. There is nothing you need to do.",
    },
  },
};

const table: Table = {
  // ENUM LABELS. Found by F06-S03: five surfaces rendered a raw enum into a
  // text position -- PRACTICE, PRE_TEST, VISIBILITY_CHANGE and friends -- none
  // of which is in INTERNAL_WORDS, so no word list would ever have caught them.
  // A staff reader is still a human and §7 admits no exception for them.
  "jenis.bank.PRACTICE": { default: "Latihan", en: "Practice" },
  "jenis.bank.TEST": { default: "Penilaian", en: "Assessment" },
  "jenis.bank.EXAM": { default: "Ujian", en: "Exam" },
  "jenis.mode.PRE_TEST": { default: "Penilaian awal", en: "Initial mapping" },
  "jenis.mode.POST_TEST": { default: "Penilaian akhir", en: "Mastery check" },
  "jenis.mode.QUICK": { default: "Penilaian cepat", en: "Quick assessment" },
  "jenis.mode.STANDALONE": { default: "Penilaian mandiri", en: "Standalone assessment" },
  "jenis.mode.PRACTICE": { default: "Latihan", en: "Practice" },
  "jenis.mode.TEST": { default: "Penilaian", en: "Assessment" },
  "jenis.mode.EXAM": { default: "Ujian", en: "Exam" },
  "jenis.mode.PUBLIC_DEMO": { default: "Peragaan publik", en: "Public demonstration" },
  "jenis.mode.PAPER": { default: "Lembar kertas", en: "Paper sheet" },
  "jenis.integritas.VISIBILITY_CHANGE": { default: "Berpindah dari layar penilaian", en: "Moved away from the assessment screen" },
  "jenis.integritas.NAVIGATION": { default: "Berpindah halaman", en: "Moved to another page" },
  "jenis.integritas.RECONNECT": { default: "Terputus lalu tersambung lagi", en: "Disconnected, then reconnected" },
  "jenis.integritas.RAPID_OPTION_CHANGE": { default: "Mengubah pilihan sangat cepat", en: "Changed answer very quickly" },
  "jenis.integritas.SUBMISSION_ANOMALY": { default: "Pengiriman jawaban tidak lazim", en: "Unusual answer submission" },

  // FABLE-06 -- the intelligence surfaces. Every label and every STATEMENT a
  // reader sees passes through here, including the sentences that explain an
  // omission: a status like `not_permitted` or `below_minimum` is an internal
  // word and never reaches a screen.
  "metrik.peserta.label": { default: "Peserta", en: "Students" },
  "metrik.peserta.arti": { default: "Banyaknya murid yang mengerjakan penilaian di kelas ini.", en: "How many students took the assessment in this class." },
  "metrik.pemahaman.label": { default: "Pemahaman", en: "Comprehension" },
  "metrik.pemahaman.arti": { default: "Rata-rata penguasaan kelas pada penilaian akhir.", en: "The class's average mastery on the Mastery Check." },
  "metrik.kenaikan.label": { default: "Kenaikan", en: "Gain" },
  "metrik.kenaikan.arti": { default: "Selisih penguasaan sebelum dan sesudah pembelajaran, per murid.", en: "The difference in mastery before and after the lessons, per student." },
  "metrik.kesiapan.label": { default: "Sebaran kesiapan", en: "Readiness distribution" },
  "metrik.kesiapan.arti": { default: "Banyaknya murid pada tiap tingkat kesiapan.", en: "How many students sit at each readiness tier." },
  "metrik.topik.label": { default: "Penguasaan per topik", en: "Mastery by topic" },
  "metrik.topik.arti": { default: "Rata-rata penguasaan kelas pada tiap topik.", en: "The class's average mastery on each topic." },
  // "Salah" is an INTERNAL_WORD -- the HLE refused this label's first
  // draft, which is the guard working on the person who wrote the guard's
  // newest entries. "Pemahaman keliru" says the same thing without the
  // verdict-shaped word a learner must never be shown.
  "metrik.miskonsepsi.label": { default: "Pemahaman keliru yang berulang", en: "Recurring misunderstandings" },
  "metrik.miskonsepsi.arti": { default: "Pola jawaban keliru yang muncul pada banyak murid, dengan saran penanganannya.", en: "Patterns of mistaken answers shared by many students, with what to do about them." },
  "metrik.peserta_institusi.label": { default: "Peserta", en: "Students" },
  "metrik.peserta_institusi.arti": { default: "Banyaknya murid yang mengerjakan penilaian di sekolah ini.", en: "How many students took the assessment in this school." },
  "metrik.kenaikan_institusi.label": { default: "Kenaikan", en: "Gain" },
  "metrik.kenaikan_institusi.arti": { default: "Rata-rata kenaikan penguasaan murid di sekolah ini.", en: "The average gain in mastery across this school's students." },
  "metrik.gerbang_keselamatan.label": { default: "Butir wajib", en: "Required items" },
  "metrik.gerbang_keselamatan.arti": { default: "Bagian murid yang menjawab benar seluruh butir wajib.", en: "The share of students who answered every required item correctly." },
  "metrik.perbandingan_kohort.label": { default: "Perbandingan angkatan", en: "Cohort comparison" },
  "metrik.perbandingan_kohort.arti": { default: "Penguasaan rata-rata tiap angkatan di sekolah ini.", en: "The average mastery of each cohort in this school." },
  "metrik.kompetensi.label": { default: "Capaian kompetensi", en: "Competency attainment" },
  "metrik.kompetensi.arti": { default: "Rata-rata penguasaan pada tiap ranah yang diukur.", en: "The average mastery in each domain that was measured." },
  "metrik.kredensial.label": { default: "Sertifikat terbit", en: "Certificates issued" },
  "metrik.kredensial.arti": { default: "Banyaknya sertifikat yang berlaku dan dapat diperiksa publik.", en: "How many certificates are valid and publicly checkable." },
  "metrik.item_benar.label": { default: "Tingkat jawaban benar", en: "Correct-answer rate" },
  "metrik.item_benar.arti": { default: "Bagian murid yang menjawab butir ini dengan benar.", en: "The share of students who answered this item correctly." },
  "metrik.pengecoh.label": { default: "Pilihan yang dipilih", en: "Options chosen" },
  "metrik.pengecoh.arti": { default: "Sebaran pilihan yang diambil murid pada butir ini.", en: "How students' choices were distributed across this item's options." },
  "metrik.posisi.label": { default: "Letak dan waktu", en: "Position and timing" },
  "metrik.posisi.arti": { default: "Posisi butir ini dalam lembar soal dan rata-rata waktu pengerjaannya.", en: "Where this item sits in the paper and how long it takes on average." },
  "metrik.hasil_murid.label": { default: "Hasil murid", en: "Student results" },
  "metrik.hasil_murid.arti": { default: "Penguasaan murid ini pada tiap penilaian.", en: "This student's mastery on each assessment." },

  "kesiapan.belum_post_test": { default: "Belum mengerjakan penilaian akhir", en: "Mastery Check not yet taken" },
  "kesiapan.butuh_pendampingan": { default: "Butuh pendampingan ekstra", en: "Needs extra support" },
  "kesiapan.perlu_review": { default: "Perlu review", en: "Needs review" },
  "kesiapan.siap_sertifikasi": { default: "Siap sertifikasi", en: "Ready for certification" },

  "kesehatan.judul": { default: "Butir yang perlu dilihat", en: "Items worth a look" },
  "kesehatan.diamati": { default: "Sedang diamati", en: "Being watched" },
  "kesehatan.ditandai": { default: "Perlu ditinjau guru", en: "For a teacher to review" },
  "kesehatan.belum_cukup": { default: "Belum cukup jawaban untuk dinilai", en: "Not enough answers to judge this yet" },
  "kesehatan.belum_diperiksa": { default: "Belum pernah diperiksa", en: "Never reviewed" },
  "kesehatan.belum_dikalibrasi": { default: "Belum ada ambang yang teruji untuk sinyal ini, jadi PINTAR tidak menandainya sendiri.", en: "There is no tested threshold for this signal yet, so PINTAR does not flag it on its own." },
  // The exposure caveat, on the surface rather than only in the capstone. A
  // teacher who sees safety-critical items flagged first must not read that as
  // "these are my worst questions": they are simply the ones PINTAR guarantees
  // to present, so they gather evidence fastest.
  "kesehatan.catatan_paparan": {
    default: "Butir wajib selalu disertakan dalam setiap penilaian, jadi jawabannya terkumpul lebih cepat dan butir itu lebih dulu muncul di daftar ini. Urutan ini soal seberapa sering butir ditampilkan, bukan soal mutunya.",
    en: "Required items appear in every assessment, so their answers accumulate faster and they surface here sooner. This ordering is about how often an item is shown, not about its quality.",
  },

  "laporan.metrik.tidak_dikenal": { default: "Angka ini tidak lagi tersedia.", en: "This figure is no longer available." },
  "laporan.metrik.bukan_untuk_anda": { default: "Angka ini tidak ditampilkan untuk peran Anda.", en: "This figure is not shown for your role." },
  "laporan.metrik.diganti": { default: "Angka ini sudah diganti dengan ukuran yang lebih baru.", en: "This figure has been replaced by a newer measure." },
  "laporan.metrik.belum_cukup_data": { default: "Belum cukup data untuk menampilkan angka ini.", en: "Not enough data to show this figure yet." },
  // R5. DIFFERENT FROM THE LINE ABOVE, AND THE DIFFERENCE IS THE POINT: that
  // one means some qualifying evidence exists and is short, this one means
  // none has arrived yet. Neither says anything about how a learner or a class
  // is doing, and both deliberately avoid a word that could be read as one.
  "laporan.metrik.belum_ada_bukti": { default: "Belum ada bukti yang memenuhi syarat untuk angka ini.", en: "No qualifying evidence for this figure yet." },
  "laporan.kelas.judul": { default: "Ringkasan Kelas", en: "Class Summary" },
  "laporan.institusi.judul": { default: "Ringkasan Sekolah", en: "School Summary" },
  "laporan.kosong": { default: "Belum ada angka yang bisa ditampilkan untuk Anda di sini.", en: "There are no figures to show you here yet." },
  "laporan.tak_ada_angka": { default: "Tidak ada angka pada laporan ini, tetapi keterangan di bawah menjelaskan alasannya satu per satu.", en: "This report carries no figures, but the notes below say why, one by one." },

  // ═══════════════════════════════════════════════════ WP4 — the Management surface
  //
  // REGISTER: adult, institutional, `Anda`. Management vocabulary is allowed
  // here in a way it is not on a learner's page. PINTAR's own internal words
  // still are not: no state, family or outcome enum appears in any telling
  // below, and neither does a table name.
  //
  // THE GOVERNING SENTENCE, carried from the approved design and not softened:
  // PINTAR mengusulkan, manusia memutuskan.
  "pimpinan.eyebrow": { default: "Pimpinan", en: "Management" },
  "pimpinan.judul": { default: "Apa yang menunggu Anda", en: "What is waiting for you" },
  // The suppression line. It says why the page is short, so a reader does not
  // go looking for the rest of the school somewhere else on it.
  "pimpinan.batas": { default: "Yang muncul di sini memerlukan wewenang, koordinasi, atau penafsiran tingkat institusi. Selebihnya tidak muncul.", en: "What appears here needs authority, coordination, or an institution-level reading. Nothing else appears." },
  "pimpinan.urutan": { default: "Urutannya: yang paling lama menunggu lebih dulu. Ini urutan, bukan peringkat.", en: "Ordered by what has waited longest. It is an order, not a ranking." },
  "pimpinan.memutuskan": { default: "PINTAR mengusulkan, manusia memutuskan.", en: "PINTAR proposes, a human decides." },
  "pimpinan.ditolak": { default: "Halaman ini untuk kepala program dan dekan, pada bagian sekolah yang mereka pimpin.", en: "This page is for heads of department and deans, over the part of the school they lead." },
  "pimpinan.kembali": { default: "Kembali", en: "Back" },

  // A TRUTHFUL NOTHING. An empty queue is a real and good answer, not a failure
  // and not an empty container explaining that it is empty.
  "pimpinan.menunggu.nihil": { default: "Tidak ada keputusan yang menunggu Anda.", en: "No decisions are waiting for you." },
  "pimpinan.menunggu.satu": { default: "Satu keputusan menunggu Anda.", en: "One decision is waiting for you." },
  "pimpinan.menunggu.banyak": { default: "keputusan menunggu Anda.", en: "decisions are waiting for you." },
  "pimpinan.menunggu.judul": { default: "Keputusan", en: "Decisions" },
  "pimpinan.perlu_diketahui": { default: "Perlu diketahui", en: "Worth knowing" },
  // R10 from the approved design, said on the page: an item here has no buttons,
  // and the reader is told that rather than left to notice it.
  "pimpinan.perlu_diketahui.sub": { default: "Hal berikut tidak menunggu keputusan siapa pun.", en: "The following waits on no one\u2019s decision." },

  "pimpinan.lingkup.judul": { default: "Bagian sekolah yang Anda pimpin", en: "The part of the school you lead" },
  "pimpinan.lingkup.pilih": { default: "Bagian sekolah", en: "Part of the school" },
  "pimpinan.lingkup.kosong": { default: "Belum ada bagian sekolah yang tercatat untuk Anda.", en: "No part of the school is recorded for you yet." },
  "pimpinan.lingkup.semua": { default: "Seluruh lingkup Anda", en: "All of your scope" },
  "pimpinan.buka.simpul": { default: "Lihat lebih rinci", en: "Look in more detail" },

  // THE CHAIN, in the fixed order and the fixed words the approved design set,
  // and the same four the educator view uses. One product, one grammar.
  "pimpinan.rantai.didukung": { default: "Yang didukung bukti", en: "What the evidence supports" },
  "pimpinan.rantai.belum": { default: "Yang belum diketahui", en: "What is not yet known" },
  "pimpinan.rantai.langkah": { default: "Langkah yang mungkin", en: "A possible next step" },
  "pimpinan.rantai.keputusan": { default: "Keputusan Anda", en: "Your decision" },

  "pimpinan.keluarga.integritas": { default: "Tinjauan integritas", en: "Integrity review" },
  "pimpinan.keluarga.pembelajaran": { default: "Pendampingan belajar", en: "Learning support" },
  "pimpinan.keluarga.program": { default: "Tindak lanjut program", en: "Programme follow-up" },

  "pimpinan.keadaan.menunggu": { default: "Menunggu tinjauan", en: "Awaiting review" },
  "pimpinan.keadaan.ditangani": { default: "Sedang ditangani", en: "Being handled" },
  "pimpinan.keadaan.selesai": { default: "Sudah diputuskan", en: "Decided" },

  // THE OUTCOMES NAME WHAT MANAGEMENT DID, exactly as the enum's own comment
  // says. None of them is a finding about a learner, and none of them is a
  // sanction, because deciding that is not something this product represents.
  "pimpinan.hasil.tidak_ada": { default: "Tidak ada tindakan lanjutan", en: "No further action" },
  "pimpinan.hasil.pendampingan": { default: "Pendampingan disiapkan", en: "Learner support arranged" },
  "pimpinan.hasil.diteruskan": { default: "Diteruskan ke pihak sekolah", en: "Escalated to the institution" },

  "pimpinan.rantai.integritas.didukung": { default: "Seorang peninjau sudah melihat catatan itu dan memilih meneruskannya. Catatannya menyebut satu hal yang teramati, dan tidak lebih.", en: "A reviewer looked at the note and chose to refer it. The note records one observed thing, and nothing more." },
  "pimpinan.rantai.integritas.belum": { default: "Apa yang sebenarnya terjadi. Catatan ini bahan pertimbangan manusia, bukan kesimpulan tentang seorang murid.", en: "What actually happened. This note is material for a human to weigh, not a conclusion about a learner." },
  "pimpinan.rantai.integritas.langkah": { default: "Menentukan siapa yang menanganinya, atau menutupnya dengan catatan.", en: "Deciding who handles it, or closing it with a note." },
  "pimpinan.rantai.pembelajaran.didukung": { default: "Bukti belajar yang sudah memenuhi syarat pada bagian sekolah ini.", en: "The learning evidence that already qualifies in this part of the school." },
  "pimpinan.rantai.pembelajaran.belum": { default: "Apa yang menjelaskannya. Angka menunjukkan keadaan, bukan sebabnya.", en: "What accounts for it. A figure shows a state, not its cause." },
  "pimpinan.rantai.pembelajaran.langkah": { default: "Membicarakannya dengan pendidik di bagian ini, atau mengamati satu siklus lagi sebelum menyimpulkan apa pun.", en: "Discussing it with the educators here, or observing another cycle before concluding anything." },
  "pimpinan.rantai.program.didukung": { default: "Apa yang sudah tercatat tentang jalannya program pada bagian sekolah ini.", en: "What is already recorded about how the programme is running in this part of the school." },
  "pimpinan.rantai.program.belum": { default: "Apa yang ada di luar catatan itu. PINTAR hanya melihat apa yang melewati PINTAR.", en: "What lies outside that record. PINTAR sees only what passes through PINTAR." },
  "pimpinan.rantai.program.langkah": { default: "Mengoordinasikannya dengan pihak yang menjalankan program.", en: "Coordinating it with the people running the programme." },

  // THE ORIGIN, AS A TELLING. The decision row carries the name of the table the
  // evidence lives in; that name never renders. A source with no telling here
  // renders no line at all, which is why this map is a declaration rather than a
  // fallback with a plausible sentence in it.
  "pimpinan.sumber.integrity_signals": { default: "Berasal dari satu catatan integritas.", en: "Came from one integrity note." },

  "pimpinan.tentang": { default: "Tentang", en: "About" },
  "pimpinan.sejak": { default: "Sejak", en: "Since" },
  "pimpinan.diputuskan": { default: "Diputuskan", en: "Decided on" },

  "pimpinan.aksi.ambil": { default: "Saya yang menangani", en: "I am handling this" },
  "pimpinan.aksi.putuskan": { default: "Catat keputusan", en: "Record the decision" },
  "pimpinan.aksi.pilih": { default: "Hasil", en: "Outcome" },
  "pimpinan.aksi.catatan": { default: "Catatan (boleh dikosongkan)", en: "Note (may be left empty)" },
  "pimpinan.aksi.gagal": { default: "Keputusan belum tercatat. Coba sekali lagi.", en: "The decision has not been recorded. Try once more." },

  // R5 ON THE PAGE. The three states are named as three different facts, and the
  // note says out loud that two of them are not results — because a reader who
  // sees "not enough" beside a figure will otherwise supply the missing
  // interpretation themselves, and it will be the wrong one.
  "pimpinan.kesiapan.judul": { default: "Kesiapan bukti", en: "Evidence readiness" },
  "pimpinan.kesiapan.catatan": { default: "Bukti yang belum cukup bukan hasil yang buruk. Artinya PINTAR belum boleh menyimpulkan apa pun, dan angkanya muncul sendiri ketika buktinya memenuhi syarat.", en: "Evidence that is not yet enough is not a poor result. It means PINTAR may not conclude anything yet, and the figure appears on its own once the evidence qualifies." },
  "pimpinan.kesiapan.cukup": { default: "Cukup untuk ditafsirkan", en: "Enough to interpret" },
  "pimpinan.kesiapan.belum_cukup": { default: "Sudah ada, belum cukup", en: "Some, not enough yet" },
  "pimpinan.kesiapan.belum_ada": { default: "Belum ada yang memenuhi syarat", en: "Nothing qualifying yet" },

  "pimpinan.bukti.judul": { default: "Yang didukung bukti", en: "What the evidence supports" },
  "pimpinan.bukti.kosong": { default: "Belum ada angka yang bisa ditampilkan untuk bagian sekolah ini.", en: "There are no figures to show for this part of the school yet." },
  // The evidence count travels with the figure rather than under it: a number
  // a reader can weigh is a number whose evidence they can see.
  "pimpinan.bukti.dari": { default: "dari", en: "from" },

  "pimpinan.murid.judul": { default: "Murid pada bagian ini", en: "Learners here" },
  // The deliberateness, said plainly. No dialog, no purpose code, no
  // justification field: the ruling says the opening needs none of those, and it
  // says the opening is recorded, so the page says that instead.
  "pimpinan.murid.sub": { default: "Daftar nama menurut abjad. Membuka catatan satu murid adalah tindakan tersendiri, dan tercatat.", en: "Names in alphabetical order. Opening one learner\u2019s record is a separate act, and it is recorded." },
  "pimpinan.murid.kosong": { default: "Belum ada murid terdaftar pada bagian ini.", en: "No learners are enrolled here yet." },
  "pimpinan.murid.buka": { default: "Buka catatan", en: "Open the record" },

  "pimpinan.rincian.judul": { default: "Catatan murid", en: "Learner record" },
  "pimpinan.rincian.tercatat": { default: "Pembukaan catatan ini sudah tercatat.", en: "The opening of this record has been recorded." },
  "pimpinan.rincian.status": { default: "Status pendaftaran", en: "Enrolment status" },
  "pimpinan.rincian.periode": { default: "Periode akademik", en: "Academic period" },
  "pimpinan.rincian.program": { default: "Program", en: "Programme" },
  "pimpinan.rincian.penempatan": { default: "Penempatan", en: "Placement" },
  "pimpinan.rincian.catatan": { default: "Catatan belajar", en: "Learning record" },
  "pimpinan.rincian.belum": { default: "Belum ada catatan belajar yang memenuhi syarat untuk murid ini.", en: "No qualifying learning record for this learner yet." },
  "pimpinan.rincian.penguasaan": { default: "Penguasaan", en: "Mastery" },

  // ═══════════════════════════════════════════════ WP5B — institutional intake
  //
  // REGISTER: an administrator doing administration. Institutional Indonesian,
  // `Anda`, no PINTAR machinery: no table, no column, no enum, no capability,
  // no index, no lock, no sequence and no trigger appears in any sentence
  // below. An administrator provisioning six hundred people should not have to
  // learn what a transaction boundary is.
  "pendataan.eyebrow": { default: "Administrasi sekolah", en: "School administration" },
  "pendataan.judul": { default: "Menambahkan orang", en: "Adding people" },
  "pendataan.intro": { default: "Unggah daftar dari spreadsheet. PINTAR memeriksanya, menunjukkan apa yang akan terjadi, lalu meminta persetujuan Anda sebelum mencatat siapa pun.", en: "Upload a list from a spreadsheet. PINTAR checks it, shows you what will happen, then asks for your approval before it records anybody." },
  "pendataan.ditolak": { default: "Halaman ini untuk administrator sekolah.", en: "This page is for school administrators." },
  "pendataan.kembali": { default: "Kembali", en: "Back" },
  "pendataan.sekolah": { default: "Sekolah", en: "School" },
  // §3. THE NUMBER IDENTIFIES A PERSON AT A SCHOOL AND NOTHING ELSE. Said on
  // the page, because a six-digit sequence invites a reader to believe ranges
  // mean something -- that 000001-000999 are staff, say -- and they do not.
  "pendataan.nomor.arti": { default: "Nomor induk menandai seseorang di sekolah ini. Nomor itu tidak menyatakan apakah orangnya murid, guru, atau pimpinan.", en: "An identity number marks a person at this school. It does not say whether that person is a student, a teacher or management." },

  "pendataan.kode.judul": { default: "Kode institusi", en: "Institution code" },
  "pendataan.kode.belum": { default: "Sekolah ini belum punya kode institusi.", en: "This school does not have an institution code yet." },
  "pendataan.kode.arti": { default: "Kode ini menjadi bagian dari nomor induk yang dibuat PINTAR untuk setiap orang di sekolah ini.", en: "This code becomes part of the identity number PINTAR creates for each person at this school." },
  "pendataan.kode.bentuk": { default: "Tiga huruf atau angka.", en: "Three letters or digits." },
  "pendataan.kode.contoh": { default: "Contoh nomor induk", en: "Example identity number" },
  // SAID BEFORE THE FIRST ISSUANCE, not discovered after it. The database makes
  // the code immutable the moment one number exists under it, and an
  // administrator who learns that afterwards has learned it too late.
  "pendataan.kode.peringatan": { default: "Setelah nomor induk pertama diterbitkan, kode ini tidak bisa diubah lagi.", en: "Once the first identity number has been issued, this code can no longer be changed." },
  "pendataan.kode.simpan": { default: "Simpan kode", en: "Save the code" },
  "pendataan.kode.beku": { default: "Kode ini sudah dipakai pada nomor induk yang diterbitkan, jadi tidak bisa diubah lagi.", en: "This code is already part of issued identity numbers, so it can no longer be changed." },
  "pendataan.kode.gagal": { default: "Kode itu tidak bisa dipakai. Mungkin sudah dipakai sekolah lain, atau bentuknya tidak sesuai.", en: "That code cannot be used. It may already belong to another school, or its shape is wrong." },
  "pendataan.kode.label": { default: "Kode", en: "Code" },

  "pendataan.unggah.judul": { default: "Daftar orang", en: "The list of people" },
  "pendataan.unggah.berkas": { default: "Pilih berkas", en: "Choose a file" },
  "pendataan.unggah.tempel": { default: "Atau tempelkan dari spreadsheet", en: "Or paste from a spreadsheet" },
  "pendataan.unggah.bentuk": { default: "Baris pertama berisi nama kolom. Koma, titik koma, atau tab sama-sama terbaca.", en: "The first row holds the column names. Commas, semicolons and tabs are all readable." },
  "pendataan.unggah.kosong": { default: "Belum ada baris yang terbaca.", en: "No rows have been read yet." },
  "pendataan.unggah.terbaca": { default: "baris terbaca", en: "rows read" },

  "pendataan.peta.judul": { default: "Kolom mana untuk apa", en: "Which column is which" },
  "pendataan.peta.sub": { default: "PINTAR menebak dari nama kolom. Ubah bila tebakannya keliru.", en: "PINTAR guesses from the column names. Change it where the guess is wrong." },
  "pendataan.peta.tidak": { default: "Tidak dipakai", en: "Not used" },
  "pendataan.peta.kolom": { default: "Kolom", en: "Column" },
  "pendataan.peta.sama": { default: "Satu pilihan untuk semua", en: "One choice for everyone" },
  "pendataan.peta.wajib": { default: "Kolom nama harus dipilih.", en: "A name column must be chosen." },
  "pendataan.peta.lanjut": { default: "Lanjut ke pemeriksaan", en: "Continue to the check" },
  "pendataan.peta.pratayang": { default: "Beberapa baris pertama", en: "The first few rows" },
  "pendataan.medan.display_name": { default: "Nama", en: "Name" },
  "pendataan.medan.person_id": { default: "Orang yang sudah terdaftar", en: "Someone already registered" },
  "pendataan.medan.node_id": { default: "Tempat", en: "Place" },
  "pendataan.medan.role": { default: "Peran", en: "Role" },
  "pendataan.medan.programme_id": { default: "Program", en: "Programme" },

  "pendataan.periksa.judul": { default: "Pemeriksaan", en: "The check" },
  "pendataan.periksa.mulai": { default: "Periksa daftar ini", en: "Check this list" },
  "pendataan.periksa.jalan": { default: "Sedang memeriksa\u2026", en: "Checking\u2026" },
  "pendataan.periksa.bersih": { default: "Semua baris bisa dicatat.", en: "Every row can be recorded." },
  "pendataan.periksa.ada": { default: "baris perlu diperbaiki.", en: "rows need correcting." },
  "pendataan.periksa.baris": { default: "Baris", en: "Row" },
  // §6. NO ROW IS QUIETLY DISCARDED, and the sentence says so: an
  // administrator whose file had three bad rows out of a thousand must not
  // discover later that PINTAR recorded nine hundred and ninety-seven people.
  "pendataan.periksa.perbaiki": { default: "Perbaiki berkas Anda, lalu mulai pendataan baru. Tidak ada yang dicatat sampai seluruh baris bisa dibaca.", en: "Correct your file, then start a new intake. Nothing is recorded until every row can be read." },
  "pendataan.periksa.gagal": { default: "Pemeriksaan tidak bisa dijalankan sekarang. Coba sekali lagi.", en: "The check could not run just now. Try once more." },

  // EACH PROBLEM AS A SENTENCE AN ADMINISTRATOR CAN ACT ON. The database
  // returns them as field-name phrases; none of those reaches a screen.
  "pendataan.masalah.nama": { default: "Nama kosong atau terlalu panjang.", en: "The name is empty or too long." },
  "pendataan.masalah.orang_bentuk": { default: "Kolom orang yang sudah terdaftar tidak berisi penanda yang sah.", en: "The already-registered column does not hold a valid marker." },
  "pendataan.masalah.orang_asing": { default: "Orang itu tidak bisa Anda tunjuk dari sini.", en: "That person is not one you can name from here." },
  "pendataan.masalah.orang_sudah": { default: "Orang itu sudah punya nomor induk di sekolah ini.", en: "That person already has an identity number at this school." },
  "pendataan.masalah.tempat_bentuk": { default: "Kolom tempat tidak berisi penanda yang sah.", en: "The place column does not hold a valid marker." },
  "pendataan.masalah.tempat_asing": { default: "Tempat itu bukan bagian dari sekolah ini.", en: "That place is not part of this school." },
  "pendataan.masalah.tempat_luar": { default: "Tempat itu di luar wewenang Anda.", en: "That place is outside your authority." },
  "pendataan.masalah.peran_asing": { default: "Peran itu tidak dikenal.", en: "That role is not one PINTAR has." },
  "pendataan.masalah.peran_dilarang": { default: "Peran itu tidak diberikan lewat pendataan massal.", en: "That role is not granted through a bulk intake." },
  "pendataan.masalah.peran_tanpa_tempat": { default: "Peran perlu tempat: isi tempat untuk baris ini.", en: "A role needs a place: give this row one." },
  "pendataan.masalah.ganda": { default: "Baris ini kembar dengan baris lain di berkas yang sama.", en: "This row is a twin of another row in the same file." },
  "pendataan.masalah.lain": { default: "Baris ini belum bisa dicatat.", en: "This row cannot be recorded yet." },
  "pendataan.masalah.tempat_murid": { default: "Murid hanya bisa ditempatkan di Kelas atau Tingkat yang aktif.", en: "A student can only be placed in an active Kelas or Tingkat." },

  "pendataan.pratinjau.judul": { default: "Yang akan terjadi", en: "What will happen" },
  "pendataan.pratinjau.total": { default: "Baris", en: "Rows" },
  "pendataan.pratinjau.baru": { default: "Orang baru", en: "New people" },
  "pendataan.pratinjau.tertaut": { default: "Orang yang sudah terdaftar", en: "People already registered" },
  "pendataan.pratinjau.nomor": { default: "Nomor induk yang akan dibuat", en: "Identity numbers to be created" },
  "pendataan.pratinjau.peran": { default: "Peran", en: "Roles" },
  "pendataan.pratinjau.akun": { default: "Akun yang bisa masuk", en: "Accounts that can sign in" },
  // §16. PROVISIONED IS NOT ACTIVE, and this is the sentence that says so on
  // the one screen where an administrator is most likely to assume otherwise.
  "pendataan.pratinjau.akun_arti": { default: "Pendataan membuat catatan orang di sekolah ini. Pendataan tidak membuat akun, dan tidak ada orang yang bisa masuk ke PINTAR karenanya.", en: "An intake creates a record of a person at this school. It does not create an account, and nobody can sign in to PINTAR as a result of it." },
  "pendataan.pratinjau.setuju": { default: "Ya, catat orang-orang ini", en: "Yes, record these people" },
  "pendataan.pratinjau.tanya": { default: "PINTAR mencatat orang-orang ini hanya setelah Anda menyetujuinya.", en: "PINTAR records these people only after you approve." },
  "pendataan.konfirmasi.gagal": { default: "Ada yang berubah sejak pemeriksaan, jadi belum ada yang dicatat. Periksa daftarnya sekali lagi.", en: "Something changed since the check, so nothing has been recorded. Check the list once more." },

  "pendataan.percontohan.judul": { default: "Lima puluh orang pertama", en: "The first fifty people" },
  // §11. HUMAN ERROR CONTAINMENT, said as what it is. Not a speed measure and
  // not a technical safeguard: a person looks at fifty real results before a
  // thousand are committed.
  "pendataan.percontohan.arti": { default: "Karena daftar ini panjang, PINTAR mencatat lima puluh orang dulu lalu berhenti. Silakan periksa lima puluh ini sebelum sisanya dicatat.", en: "Because this list is long, PINTAR records fifty people first and then stops. Please check these fifty before the rest are recorded." },
  "pendataan.percontohan.nyata": { default: "Lima puluh orang ini sudah benar-benar tercatat, lengkap dengan nomor induknya. Ini bukan contoh.", en: "These fifty people are genuinely recorded, each with their identity number. This is not a sample." },
  "pendataan.percontohan.tanya": { default: "Sudah saya periksa, lanjutkan sisanya", en: "I have checked them, continue with the rest" },
  "pendataan.percontohan.sisa": { default: "orang lagi menunggu", en: "more people are waiting" },
  "pendataan.percontohan.sudah": { default: "Lima puluh pertama sudah Anda periksa.", en: "You have already checked the first fifty." },
  "pendataan.percontohan.gagal": { default: "Belum bisa dilanjutkan sekarang. Coba sekali lagi.", en: "It cannot continue just now. Try once more." },

  "pendataan.maju.judul": { default: "Sedang mencatat", en: "Recording" },
  "pendataan.maju.selesai": { default: "sudah tercatat", en: "recorded" },
  "pendataan.maju.sisa": { default: "belum", en: "still to go" },
  "pendataan.maju.gagal_baris": { default: "tidak bisa dicatat", en: "could not be recorded" },
  "pendataan.maju.mulai": { default: "Mulai mencatat", en: "Start recording" },
  "pendataan.maju.lanjut": { default: "Lanjutkan", en: "Continue" },
  "pendataan.maju.jeda": { default: "Berhenti sejenak", en: "Pause" },
  // §13. THE BROWSER IS NOT THE JOB OWNER, told as reassurance rather than as
  // architecture.
  "pendataan.maju.terputus": { default: "Pencatatan berhenti di tengah jalan. Yang sudah tercatat tetap tercatat, dan Anda bisa melanjutkan kapan saja.", en: "Recording stopped part-way. What was recorded stays recorded, and you can continue whenever you like." },
  "pendataan.maju.aman": { default: "Anda boleh menutup halaman ini. Yang sudah tercatat tidak hilang.", en: "You may close this page. What has been recorded is not lost." },

  "pendataan.selesai.judul": { default: "Selesai", en: "Done" },
  "pendataan.selesai.arti": { default: "orang tercatat di sekolah ini.", en: "people are recorded at this school." },
  "pendataan.gagal.judul": { default: "Ada yang tidak bisa dicatat", en: "Something could not be recorded" },
  "pendataan.gagal.baris": { default: "Baris berikut tidak bisa dicatat.", en: "These rows could not be recorded." },

  "pendataan.daftar.judul": { default: "Pendataan sebelumnya", en: "Earlier intakes" },
  "pendataan.daftar.kosong": { default: "Belum ada pendataan.", en: "No intakes yet." },
  "pendataan.daftar.buka": { default: "Buka", en: "Open" },

  "pendataan.keadaan.menyusun": { default: "Baru disusun", en: "Just assembled" },
  "pendataan.keadaan.menunggu_konfirmasi": { default: "Menunggu persetujuan Anda", en: "Waiting for your approval" },
  "pendataan.keadaan.percontohan": { default: "Mencatat lima puluh pertama", en: "Recording the first fifty" },
  "pendataan.keadaan.periksa_percontohan": { default: "Menunggu Anda memeriksa lima puluh pertama", en: "Waiting for you to check the first fifty" },
  "pendataan.keadaan.sisa": { default: "Mencatat sisanya", en: "Recording the rest" },
  "pendataan.keadaan.berjalan": { default: "Sedang mencatat", en: "Recording" },
  "pendataan.keadaan.selesai": { default: "Selesai", en: "Done" },
  "pendataan.keadaan.gagal": { default: "Terhenti", en: "Stopped" },

  "tindakan.ulangi": { default: "Ulangi topik ini bersama-sama sebelum lanjut.", en: "Go over this topic together before moving on." },
  "tindakan.fokus": { default: "Fokuskan waktu tambahan pada murid di dua tingkat kesiapan terbawah.", en: "Focus extra time on students in the two lowest readiness tiers." },
  "tindakan.lanjut": { default: "Tidak perlu diulang — lanjutkan ke materi berikutnya.", en: "No need to reteach — move on to the next topic." },
  "tindakan.tunggu": { default: "Tunggu sampai lebih banyak murid mengerjakan sebelum menyimpulkan.", en: "Wait until more students have taken it before drawing conclusions." },

  "verifikasi.judul": { default: "Verifikasi Sertifikat", en: "Certificate Verification" },
  "verifikasi.status": { default: "Status", en: "Status" },
  "verifikasi.hasil": { default: "Hasil", en: "Result" },
  "verifikasi.lulus": { default: "Memenuhi capaian", en: "Achieved" },
  "verifikasi.belum_lulus": { default: "Belum memenuhi capaian", en: "Not yet achieved" },
  "verifikasi.predikat": { default: "Predikat", en: "Grade" },
  "verifikasi.institusi": { default: "Diterbitkan oleh", en: "Issued by" },
  "verifikasi.tanggal": { default: "Tanggal terbit", en: "Issue date" },
  "verifikasi.catatan": { default: "Halaman ini memastikan sertifikat yang Anda pegang benar diterbitkan. Nama pemegang tertera pada sertifikatnya.", en: "This page confirms the certificate you hold was genuinely issued. The holder's name is on the certificate itself, not on this page." },
  "verifikasi.tidak_ditemukan": { default: "Sertifikat dengan tautan ini tidak ditemukan.", en: "No certificate was found for this link." },
  "verifikasi.tidak_sah": { default: "Data sertifikat ini tidak cocok dengan catatan penerbitnya.", en: "This certificate's data does not match the issuer's record." },
  "sertifikat.judul": { default: "Sertifikat", en: "Certificate" },
  "sertifikat.nomor": { default: "Nomor sertifikat", en: "Certificate number" },
  "sertifikat.unduh": { default: "Tautan verifikasi", en: "Verification link" },
  "sertifikat.belum_ada": { default: "Belum ada sertifikat untuk pengerjaan ini.", en: "There is no certificate for this attempt yet." },
  "sertifikat.sedang_disiapkan": { default: "Sertifikat sedang disiapkan. Muat ulang halaman ini sebentar lagi.", en: "The certificate is being prepared. Reload this page in a moment." },

  // UX-1 Slice 1 — the certificate, its four states, and the public check.
  "verifikasi.situs": { default: "Pemeriksaan sertifikat", en: "Certificate check" },
  "verifikasi.eyebrow": { default: "Pemeriksaan", en: "Check" },
  "verifikasi.intro": { default: "Hasil pemeriksaan untuk tautan yang Anda buka.", en: "The result for the link you opened." },
  "verifikasi.status.BERLAKU": { default: "Berlaku", en: "Valid" },
  "verifikasi.status.BERLAKU.arti": { default: "Sertifikat ini benar diterbitkan dan masih berlaku.", en: "This certificate was genuinely issued and is still valid." },
  "verifikasi.status.DICABUT": { default: "Dicabut oleh penerbit", en: "Revoked by the issuer" },
  "verifikasi.status.DICABUT.arti": { default: "Sertifikat ini pernah diterbitkan, lalu dicabut. Sertifikat ini tidak lagi berlaku.", en: "This certificate was issued and later revoked. It is no longer valid." },
  "verifikasi.status.DIGANTIKAN": { default: "Digantikan sertifikat yang lebih baru", en: "Replaced by a newer certificate" },
  "verifikasi.status.DIGANTIKAN.arti": { default: "Penerbit telah menerbitkan sertifikat pengganti. Mintalah sertifikat yang baru kepada pemegangnya.", en: "The issuer has issued a replacement. Ask the holder for the new certificate." },
  "verifikasi.status.TIDAK_SAH": { default: "Tidak sah", en: "Not valid" },
  "verifikasi.tidak_ditemukan.arti": { default: "Periksa kembali tautan atau kode yang Anda terima.", en: "Check the link or code you were given." },
  "sertifikat.daftar.eyebrow": { default: "Sertifikat", en: "Certificates" },
  "sertifikat.daftar.judul": { default: "Sertifikat Anda", en: "Your certificates" },
  "sertifikat.daftar.pengantar": { default: "Setiap sertifikat di sini bisa diperiksa keasliannya oleh siapa pun, lewat tautannya sendiri.", en: "Anyone can check that each certificate here is genuine, through its own link." },
  "sertifikat.daftar.kosong": { default: "Belum ada sertifikat untuk Anda di sini.", en: "There are no certificates for you here yet." },
  "sertifikat.daftar.terbit": { default: "Terbit", en: "Issued" },
  "sertifikat.daftar.selesai": { default: "Uji Penguasaan selesai", en: "Mastery Check completed" },
  "sertifikat.kembali": { default: "Semua sertifikat", en: "All certificates" },
  "sertifikat.status.ELIGIBLE": { default: "Sedang disiapkan", en: "Being prepared" },
  "sertifikat.status.ISSUED": { default: "Berlaku", en: "Valid" },
  "sertifikat.status.REVOKED": { default: "Dicabut", en: "Revoked" },
  "sertifikat.status.SUPERSEDED": { default: "Digantikan", en: "Replaced" },
  "sertifikat.jenis": { default: "Sertifikat Penguasaan", en: "Certificate of Mastery" },
  "sertifikat.diberikan": { default: "telah menuntaskan", en: "has completed" },
  "sertifikat.predikat": { default: "Predikat", en: "Grade" },
  "sertifikat.tanggal": { default: "Tanggal terbit", en: "Issue date" },
  "sertifikat.periksa.judul": { default: "Periksa keaslian", en: "Check it is genuine" },
  "sertifikat.periksa.arti": { default: "Pindai kode ini atau buka tautannya. Halaman itu memastikan sertifikat ini benar diterbitkan dan masih berlaku.", en: "Scan this code or open the link. That page confirms this certificate was genuinely issued and is still valid." },
  "sertifikat.cetak": { default: "Cetak atau simpan PDF", en: "Print or save as PDF" },
  "sertifikat.salin": { default: "Salin tautan verifikasi", en: "Copy verification link" },
  "sertifikat.tersalin": { default: "Tautan tersalin", en: "Link copied" },
  "sertifikat.disiapkan.judul": { default: "Sertifikat Anda sedang disiapkan", en: "Your certificate is being prepared" },
  "sertifikat.disiapkan.arti": { default: "Hasil Uji Penguasaan Anda sudah memenuhi syarat. Sertifikat akan muncul di sini, lengkap dengan nomor dan tautan pemeriksaannya, setelah diterbitkan.", en: "Your Mastery Check result meets the requirement. The certificate will appear here, with its number and verification link, once it has been issued." },
  "sertifikat.disiapkan.tenang": { default: "Tidak ada yang perlu dilakukan. Halaman ini memeriksa lagi setiap kali dibuka.", en: "There is nothing you need to do. This page checks again each time it opens." },
  "sertifikat.disiapkan.hasil": { default: "Lihat hasil Uji Penguasaan", en: "See your Mastery Check result" },
  "sertifikat.dicabut.judul": { default: "Sertifikat ini sudah dicabut oleh penerbitnya", en: "This certificate has been revoked by its issuer" },
  "sertifikat.dicabut.arti": { default: "Sertifikat yang dicabut tidak bisa dipakai lagi sebagai bukti. Riwayatnya tetap tersimpan, dan halaman pemeriksaan akan menyatakan bahwa sertifikat ini dicabut.", en: "A revoked certificate can no longer be used as evidence. Its record is kept, and the verification page will say it has been revoked." },
  "sertifikat.dicabut.bantuan": { default: "Ada pertanyaan? Hubungi bagian layanan sekolah Anda.", en: "Questions? Contact your school's help desk." },
  "sertifikat.digantikan.judul": { default: "Sertifikat ini sudah digantikan dengan yang lebih baru", en: "This certificate has been replaced by a newer one" },
  "sertifikat.digantikan.arti": { default: "Penerbit membuat sertifikat pengganti. Gunakan yang baru; yang ini tetap tercatat.", en: "The issuer made a replacement certificate. Use the new one; this one stays on record." },
  "sertifikat.digantikan.buka": { default: "Buka sertifikat yang baru", en: "Open the new certificate" },
  "sertifikat.cetak.eyebrow": { default: "Pratinjau cetak", en: "Print preview" },
  "sertifikat.cetak.judul": { default: "Sertifikat · A4", en: "Certificate · A4" },
  "sertifikat.cetak.arti": { default: "Satu lembar A4 tegak. Komposisinya tetap pada setiap lebar layar; yang berubah hanya skalanya.", en: "One portrait A4 sheet. The composition is fixed at every screen width; only the scale changes." },
  "nav.belajar": { default: "Belajar", en: "Learning" },
  "nav.sertifikat": { default: "Sertifikat", en: "Certificates" },
  "nav.akun": { default: "Akun", en: "Account" },
  "bahasa.label": { default: "Bahasa antarmuka", en: "Interface language" },
  "bahasa.id": { default: "ID", en: "ID" },
  "bahasa.en": { default: "EN", en: "EN" },
  "lingkup.pilih": { default: "Pilih lingkup", en: "Choose a scope" },
  "lingkup.semua": { default: "Semua yang bisa Anda lihat", en: "Everything you can see" },
  "lingkup.kosong": { default: "Belum ada lingkup yang bisa dipilih.", en: "There is no scope to choose from yet." },
  "tolak.arti": { default: "Jika ini keliru, tanyakan kepada guru Anda.", en: "If you think this is a mistake, ask your teacher." },
  "tolak.kembali": { default: "Kembali ke Belajar", en: "Back to Learning" },
  "komitmen.kembali": { default: "Periksa lagi", en: "Check again" },
  "bukti.dari": { default: "Dari", en: "From" },
  "bukti.murid": { default: "murid", en: "students" },
  "bukti.minimum": { default: "minimum", en: "minimum" },

  "app.name": { default: "PINTAR", en: "PINTAR" },
  // ══════════════════════════════ UX-1 · the sign-in screen (login handoff)
  // Daisy's canonical copy table, verbatim: 38 strings measured against their
  // controls at every width in both languages. Three of them are load-bearing
  // and carry a note where they sit.
  //
  // `?peran=` CHANGES NOTHING HERE, so none of these carries a persona
  // override. The sign-in screen has not met anyone yet and must not pretend
  // it has: a child with a card and a head teacher with an email see the same
  // welcome, the same lede and the same standing line.
  "auth.title": { default: "Selamat datang di PINTAR", en: "Welcome to PINTAR" },
  "auth.lede": { default: "Masukkan email Anda. Kami kirimkan tautan untuk masuk — tanpa kata sandi.", en: "Enter your email. We'll send you a link to sign in — no password needed." },
  "auth.email_label": { default: "Alamat email", en: "Email address" },
  "auth.email_ph": { default: "nama@sekolah.sch.id", en: "name@school.sch.id" },
  "auth.send_link": { default: "Kirim tautan masuk", en: "Send the sign-in link" },
  "auth.sending": { default: "Mengirim tautan…", en: "Sending the link…" },
  "auth.err_email": { default: "Alamat email ini belum lengkap. Contoh: nama@sekolah.sch.id", en: "This email address isn't complete. Example: name@school.sch.id" },
  "auth.err_send": { default: "Tautan belum bisa dikirim sekarang. Coba lagi sebentar lagi.", en: "The link couldn't be sent just now. Please try again in a moment." },
  "auth.retry": { default: "Coba lagi", en: "Try again" },
  "auth.sent_h": { default: "Periksa email Anda", en: "Check your email" },
  // LOAD-BEARING. The conditional "Jika / If" is the account-enumeration
  // protection: a screen that says "we sent a link to nadia@…" has told
  // whoever is holding that phone whether Nadia has an account here. It costs
  // one word. It is not to be edited without an Experience ruling.
  "auth.link_sent": { default: "Jika alamat itu terhubung dengan akun PINTAR, tautan masuk sudah dikirim ke sana. Buka email, lalu ketuk tautannya.", en: "If that address is linked to a PINTAR account, a sign-in link has been sent there. Open your email and tap the link." },
  "auth.sent_resend": { default: "Kirim ulang", en: "Send it again" },
  "auth.sent_other": { default: "Gunakan email lain", en: "Use a different email" },
  "auth.sent_same": { default: "Buka tautan di perangkat dan browser yang sama dengan halaman ini. Tautan yang dibuka di tempat lain tidak akan berfungsi.", en: "Open the link on this same device and in this same browser. A link opened anywhere else will not work." },
  // NOT FROM THE CANONICAL COPY TABLE, and flagged as such for Experience. The
  // D2 ruling requires a bounded behaviour when the client fails to start, and
  // a control drawn unavailable without a reason is its own small cruelty. It
  // says nothing about any address and appears for everybody or nobody.
  "auth.belum_siap": { default: "Halaman ini belum siap. Jika tombol tetap tidak aktif, muat ulang halaman.", en: "This page isn't ready yet. If the buttons stay unavailable, reload the page." },
  "auth.card_title": { default: "Punya kartu kelas?", en: "Have a class card?" },
  "auth.card_go": { default: "Gunakan kartu kelas", en: "Use a class card" },
  "auth.card_h1": { default: "Masuk dengan kartu kelas", en: "Sign in with a class card" },
  "auth.card_lede": { default: "Masukkan nomor kartu dan PIN yang tertera pada kartu.", en: "Enter the card number and the PIN shown on the card." },
  "auth.card_number": { default: "Nomor kartu", en: "Card number" },
  "auth.card_pin": { default: "PIN", en: "PIN" },
  "auth.card_show": { default: "Tampilkan PIN", en: "Show PIN" },
  "auth.card_hide": { default: "Sembunyikan PIN", en: "Hide PIN" },
  "auth.card_enter": { default: "Masuk dengan kartu", en: "Sign in with the card" },
  "auth.card_checking": { default: "Memeriksa…", en: "Checking…" },
  // LOAD-BEARING. "belum" means NOT YET, not wrong. The card may be fine and
  // the PIN mistyped; the screen does not know which and does not accuse.
  "auth.card_failed": { default: "Belum cocok. Coba periksa nomor kartu dan PIN, lalu coba sekali lagi.", en: "Not a match yet. Check the card number and the PIN, then try once more." },
  "auth.card_back": { default: "Masuk lewat email", en: "Sign in with email" },
  "auth.foot": { default: "Pendidikan yang lebih adil, untuk lebih banyak kesempatan.", en: "Fairer education, for more opportunity." },
  // The newline is the designer's line break; the heading renders pre-line.
  "auth.say_h": { default: "Belajar dengan bukti.\nMemahami sebelum memutuskan.", en: "Learning with evidence.\nUnderstand before deciding." },
  // LOAD-BEARING. The only sentence on the screen about what the system does,
  // and what it says is that the system does not decide. Not a tagline to cut.
  "auth.say_p": { default: "PINTAR membantu melihat apa yang sedang terjadi dalam proses belajar. Keputusannya tetap pada manusia.", en: "PINTAR helps make sense of what is happening in the learning process. The decision stays with people." },
  "auth.placeholder": { default: "FOTO CONTOH", en: "PLACEHOLDER PHOTO" },
  "auth.link_h_exch": { default: "Sedang memeriksa tautan…", en: "Checking the link…" },
  "auth.link_p_exch": { default: "Mohon tunggu sebentar. Jangan tutup halaman ini.", en: "Please wait a moment. Don't close this page." },
  "auth.link_h_exp": { default: "Tautan ini sudah tidak berlaku", en: "This link is no longer valid" },
  "auth.link_p_exp": { default: "Tautan masuk berlaku sekali dan untuk waktu yang terbatas. Minta tautan baru untuk melanjutkan.", en: "A sign-in link works once, and only for a limited time. Ask for a new link to continue." },
  "auth.link_again": { default: "Minta tautan baru", en: "Ask for a new link" },
  "auth.link_same": { default: "Tautan masuk juga hanya berfungsi di perangkat dan browser tempat Anda memintanya, jadi buka tautan di perangkat dan browser yang sama.", en: "A sign-in link also only works on the device and in the browser where you asked for it, so open it on the same device and in the same browser." },
  "auth.in_h": { default: "Anda sudah masuk", en: "You're already signed in" },
  "auth.in_p": { default: "Sesi Anda di perangkat ini masih aktif.", en: "Your session on this device is still active." },
  "auth.in_go": { default: "Lanjutkan", en: "Continue" },
  "auth.in_out": { default: "Keluar dari sesi ini", en: "Sign out of this session" },
  "auth.signed_out": { default: "Sampai jumpa lagi.", en: "See you again soon." },
  "auth.not_yet": { default: "Halaman ini belum tersedia untuk akun Anda.", en: "This page is not available to your account yet." },
  "config.title": { default: "Konfigurasi", en: "Configuration" },
  "config.section.system": { default: "Sistem & Konfigurasi", en: "System & Configuration" },
  "config.section.content": { default: "Konten & Bank Soal", en: "Content & Item Bank" },
  "config.section.assessment": { default: "Mesin Asesmen", en: "Assessment Engine" },
  "config.section.certificates": { default: "Sertifikat & Audit", en: "Certificates & Audit" },
  "config.section.intelligence": { default: "Inteligensi & Laporan", en: "Intelligence & Reports" },
  "laporan.templat.judul": { default: "Templat laporan", en: "Report templates" },
  "laporan.templat.institusi": { default: "Institusi", en: "Institution" },
  "config.label.person_new": { default: "Belum memiliki peran", en: "Holds nothing yet" },
  "config.label.person_known": { default: "Sudah dikenal sistem", en: "Already known to the system" },
  "laporan.templat.penjelasan": { default: "PINTAR memiliki katalog metrik beserta rumus, makna, ambang sampel minimum dan siapa yang boleh membacanya. Sekolah memilih metrik mana yang muncul dan bagaimana digambarkan — bukan apa artinya.", en: "PINTAR owns the metric catalogue: the formulas, the meanings, the minimum samples and who may read each one. A school chooses which metrics appear and how they are drawn — never what they mean." },
  "laporan.templat.kosong": { default: "Sekolah ini belum menyusun templat laporan.", en: "This school has not assembled a report template yet." },
  "laporan.templat.judul_kunci": { default: "Kunci judul", en: "Title key" },
  "laporan.templat.jenis": { default: "Laporan standar", en: "Standard report" },
  "laporan.templat.metrik": { default: "Metrik yang ditampilkan", en: "Metrics shown" },
  "laporan.templat.tampilan": { default: "Tampilan", en: "Visualization" },
  "laporan.templat.versi": { default: "Versi", en: "Version" },
  "laporan.templat.simpan": { default: "Simpan templat", en: "Save template" },
  "laporan.templat.pilih": { default: "Pilih metrik dari katalog PINTAR", en: "Choose metrics from the PINTAR catalogue" },
  "laporan.templat.tak_berwenang": { default: "Menyusun templat laporan memerlukan wewenang pengelola institusi.", en: "Assembling a report template requires institution administrator authority." },
  "laporan.templat.batas": { default: "Satu templat menampilkan paling banyak 12 metrik.", en: "One template shows at most 12 metrics." },
  "config.card.health": { default: "Kesehatan sistem", en: "System health" },
  "config.card.cohorts": { default: "Kelas aktif", en: "Active classes" },
  "config.placeholder": { default: "Bagian ini akan terisi pada tahap berikutnya.", en: "This section is filled in at a later phase." },
  "config.environment": { default: "Lingkungan", en: "Environment" },
  "config.refused": { default: "Halaman ini hanya untuk pengelola sistem.", en: "This page is for system administrators only." },
  "config.section.rollover": { default: "Pergantian tahun ajaran", en: "Academic-year rollover" },
  "config.section.transfers": { default: "Perpindahan peserta didik", en: "Student transfers" },
  "config.section.roles": { default: "Peran & akses", en: "Roles & access" },
  "config.section.audit": { default: "Jejak audit", en: "Audit trail" },
  "config.section.flags": { default: "Fitur & saklar", en: "Features & switches" },
  "config.action.rollover": { default: "Jalankan pergantian", en: "Run the rollover" },
  "config.action.request_transfer": { default: "Ajukan perpindahan", en: "Request a transfer" },
  "config.action.authorize": { default: "Setujui", en: "Authorize" },
  "config.action.execute": { default: "Laksanakan", en: "Execute" },
  "config.action.reject": { default: "Tolak", en: "Decline" },
  "config.action.grant": { default: "Berikan peran", en: "Grant the role" },
  "config.action.revoke": { default: "Cabut", en: "Revoke" },
  "config.action.save": { default: "Simpan", en: "Save" },
  "config.result.ok": { default: "Selesai.", en: "Done." },
  "config.result.failed": { default: "Belum berhasil.", en: "Not saved." },
  "config.empty": { default: "Belum ada.", en: "None yet." },
  "config.label.period_from": { default: "Dari tahun ajaran", en: "From academic year" },
  "config.label.period_to": { default: "Ke tahun ajaran", en: "To academic year" },
  "config.label.mapping_help": { default: "Pilih kelas tujuan untuk setiap kelas asal. Keanggotaan lama ditutup, yang baru dibuat; riwayat tetap utuh.", en: "Choose a destination class for each source class. Old memberships are closed and new ones created; the history stays whole." },
  "config.label.enrollment": { default: "Peserta didik (pendaftaran aktif)", en: "Students (active enrolments)" },
  "config.label.destination_institution": { default: "Kode sekolah tujuan", en: "Destination school code" },
  "config.label.destination_period": { default: "Kode tahun ajaran tujuan", en: "Destination academic-year code" },
  "config.label.destination_programme": { default: "Kode program tujuan (opsional)", en: "Destination programme code (optional)" },
  "config.label.destination_help": { default: "Kode tujuan diberikan oleh sekolah penerima. Persetujuan datang dari pihak lawan.", en: "The destination codes come from the receiving school. Authorization comes from the other side." },
  "config.label.reason": { default: "Alasan", en: "Reason" },
  "config.label.person": { default: "Orang", en: "Person" },
  "config.label.role": { default: "Peran", en: "Role" },
  "config.label.scope": { default: "Lingkup", en: "Scope" },
  "config.label.valid_until": { default: "Berlaku sampai", en: "Valid until" },
  "config.label.flag_key": { default: "Kunci fitur", en: "Feature key" },
  "config.label.enabled": { default: "Aktif", en: "Enabled" },
  "config.label.maintenance": { default: "Mode pemeliharaan", en: "Maintenance mode" },
  "config.label.registration_lock": { default: "Kunci pendaftaran", en: "Registration lock" },
  "config.label.when": { default: "Waktu", en: "When" },
  "config.label.action": { default: "Tindakan", en: "Action" },
  "config.label.target": { default: "Sasaran", en: "Target" },
  "config.label.build": { default: "Versi", en: "Build" },
  "config.label.status": { default: "Status", en: "Status" },
  "config.label.not_rolled": { default: "— tidak dipindahkan —", en: "— not carried over —" },
  // BOB-01. What the "Struktur sekolah" screen says for each refusal code
  // (src/lib/struktur-kontrak.ts, KUNCI_GALAT_STRUKTUR). Daisy owns the wording.
  "config.struktur.galat.tidak_berwenang": { default: "Anda tidak berwenang mengubah struktur sekolah ini.", en: "You are not allowed to change this school's structure." },
  "config.struktur.galat.nama_tidak_sah": { default: "Isi nama, paling banyak 80 karakter.", en: "Enter a name of at most 80 characters." },
  "config.struktur.galat.nama_dipakai": { default: "Nama itu sudah dipakai. Pilih nama lain.", en: "That name is already in use. Choose another." },
  "config.struktur.galat.tahun_tidak_sah": { default: "Tulis tahun ajaran seperti 2026/2027.", en: "Write the school year like 2026/2027." },
  "config.struktur.galat.tahun_tidak_cocok": { default: "Kelas harus memakai tahun ajaran Tingkat-nya.", en: "A Kelas must use its Tingkat's school year." },
  "config.struktur.galat.induk_tidak_sah": { default: "Letaknya tidak sesuai: Tingkat berada di bawah Bagian, dan Kelas di bawah Tingkat.", en: "It does not fit there: a Tingkat sits under a Bagian, and a Kelas under a Tingkat." },
  "config.struktur.galat.induk_nonaktif": { default: "Tempat di atasnya sudah dinonaktifkan.", en: "The place above it has been deactivated." },
  "config.struktur.galat.simpul_tidak_sah": { default: "Hanya Bagian, Tingkat, dan Kelas yang bisa diubah di sini.", en: "Only a Bagian, Tingkat or Kelas can be changed here." },
  "config.struktur.galat.masih_ada_anak": { default: "Nonaktifkan dulu Tingkat atau Kelas di bawahnya.", en: "Deactivate the Tingkat or Kelas under it first." },
  "config.struktur.galat.masih_ada_murid": { default: "Masih ada murid di sini. Pindahkan mereka dulu.", en: "Students are still placed here. Move them first." },
  "config.struktur.galat.masih_ada_staf": { default: "Masih ada guru atau staf yang ditugaskan di sini.", en: "A teacher or staff member is still assigned here." },
  "config.struktur.galat.isian_kurang": { default: "Lengkapi pilihan yang diminta.", en: "Complete the choices asked for." },
  "config.struktur.galat.gagal": { default: "Perubahan belum tersimpan. Coba lagi sebentar lagi.", en: "The change was not saved. Try again in a moment." },
  // WP5B. Bulk intake offers four roles and needs a telling for each; this is
  // the one the configuration surface never had to name, because a learner is
  // not somebody an administrator grants a role to one at a time.
  "role.STUDENT": { default: "Murid", en: "Student" },
  "role.EDUCATOR": { default: "Guru", en: "Teacher" },
  "role.HEAD_OF_DEPARTMENT": { default: "Kepala departemen", en: "Head of department" },
  "role.DEAN": { default: "Dekan", en: "Dean" },
  "role.INSTITUTION_ADMIN": { default: "Admin sekolah", en: "School administrator" },
  "role.SYSTEM_ADMIN": { default: "Admin platform", en: "Platform administrator" },
  "transfer.REQUESTED": { default: "Diajukan", en: "Requested" },
  "transfer.AUTHORIZED": { default: "Disetujui", en: "Authorized" },
  "transfer.EXECUTED": { default: "Selesai", en: "Completed" },
  "transfer.REJECTED": { default: "Ditolak", en: "Declined" },
  "transfer.CANCELLED": { default: "Dibatalkan", en: "Cancelled" },
  "entry.title": { default: "Mau ke mana hari ini?", en: "Where would you like to go today?" },
  "entry.learner": { default: "Saya mau belajar", en: "I want to learn" },
  "entry.educator": { default: "Saya mengajar", en: "I teach" },
  "entry.staff": { default: "Saya mengelola sekolah", en: "I run the school" },

  // ---------------------------------------------------------------- FABLE-03
  "cycle.title": { default: "Perjalanan belajar Anda", en: "Your learning journey" },
  "cycle.none": { default: "Belum ada materi yang ditugaskan untuk Anda.", en: "Nothing has been assigned to you yet." },
  "cycle.step.pretest": { default: "Pemetaan Awal", en: "Initial Mapping" },
  "cycle.step.map": { default: "Peta Bacaan Personal", en: "Personal Reading Map" },
  "cycle.step.lesson": { default: "Pelajaran", en: "Lesson" },
  "cycle.step.posttest": { default: "Uji Penguasaan", en: "Mastery Check" },
  "cycle.step.result": { default: "Hasil", en: "Result" },
  "cycle.open": { default: "Mulai", en: "Start" },
  "cycle.continue": { default: "Lanjutkan", en: "Continue" },
  "cycle.locked_until_pretest": { default: "Terbuka setelah Pemetaan Awal selesai.", en: "Opens once the Initial Mapping is finished." },

  "pretest.title": { default: "Pemetaan Awal", en: "Initial Mapping" },
  "pretest.intro": {
    default: "Ini bukan ujian. Jawaban Anda dipakai untuk menyusun peta bacaan yang pas.",
    en: "This is not an exam. Your answers are used to build a reading map that fits you.",
  },
  "pretest.progress": { default: "Pertanyaan", en: "Question" },
  "pretest.next": { default: "Berikutnya", en: "Next" },
  "pretest.back": { default: "Kembali", en: "Back" },
  "pretest.finish": { default: "Selesaikan pemetaan", en: "Finish the mapping" },
  "pretest.done": { default: "Pemetaan selesai. Peta bacaan Anda sudah siap.", en: "Mapping finished. Your reading map is ready." },

  "map.title": { default: "Peta Bacaan Personal", en: "Personal Reading Map" },
  "map.intro": { default: "Mulailah dari kartu paling atas. Urutannya sudah disusun untuk Anda.", en: "Start from the card at the top. The order has already been arranged for you." },
  "map.tier.PERLU_SEGERA": { default: "Baca ini lebih dulu", en: "Read this first" },
  "map.tier.WAJIB": { default: "Perlu dibaca", en: "Needs reading" },
  "map.tier.DISARANKAN": { default: "Sebaiknya dibaca", en: "Worth reading" },
  "map.tier.KUAT": { default: "Sudah dikuasai", en: "You already have this" },
  "map.page": { default: "Bagian bacaan", en: "Reading section" },
  "map.to_lesson": { default: "Buka pelajarannya", en: "Open the lesson" },

  "lesson.title": { default: "Pelajaran", en: "Lesson" },
  "lesson.page_of": { default: "Halaman", en: "Page" },
  "lesson.prev": { default: "Halaman sebelumnya", en: "Previous page" },
  "lesson.next": { default: "Halaman berikutnya", en: "Next page" },
  "lesson.transcript": { default: "Teks lengkap", en: "Full text" },
  "lesson.speed": { default: "Kecepatan", en: "Speed" },
  "lesson.example.reveal": { default: "Tampilkan langkah berikutnya", en: "Show the next step" },
  "lesson.example.done": { default: "Semua langkah sudah tampil.", en: "Every step is showing." },
  "lesson.pdf": { default: "Buka ringkasan", en: "Open the summary" },
  "lesson.saved": { default: "Posisi bacaan tersimpan.", en: "Your place is saved." },

  "posttest.title": { default: "Uji Penguasaan", en: "Mastery Check" },
  "posttest.intro": { default: "Kerjakan dengan tenang. Anda bisa menandai soal dan kembali lagi.", en: "Work through it calmly. You can flag a question and come back to it." },
  "posttest.elapsed": { default: "Waktu berjalan", en: "Time elapsed" },
  "posttest.pause": { default: "Simpan & Jeda", en: "Save & pause" },
  "posttest.resume": { default: "Lanjutkan mengerjakan", en: "Carry on" },
  "posttest.flag": { default: "Tandai", en: "Flag" },
  "posttest.flagged": { default: "Ditandai", en: "Flagged" },
  "posttest.navigator": { default: "Daftar soal", en: "Question list" },
  "posttest.answered": { default: "Sudah dijawab", en: "Answered" },
  "posttest.unanswered": { default: "Belum dijawab", en: "Not answered" },
  "posttest.confirm": { default: "Kunci jawaban ini", en: "Confirm this answer" },
  "posttest.confirmed": { default: "Tersimpan", en: "Saved" },
  "posttest.submit": { default: "Kumpulkan", en: "Submit" },
  "posttest.submit_confirm": { default: "Kumpulkan sekarang? Setelah dikumpulkan, jawaban tidak bisa diubah.", en: "Submit now? Once submitted, answers cannot be changed." },

  "assist.SD": { default: "🤔 Perlu contoh?", en: "🤔 Want an example?" },
  "assist.SMP": { default: "💡 Perlu petunjuk?", en: "💡 Want a hint?" },
  "assist.SMA": { default: "🧭 Perlu arah?", en: "🧭 Need a direction?" },
  "assist.UNIVERSITAS": { default: "🧭 Perlu arah berpikir?", en: "🧭 Need a direction to think in?" },
  "assist.more": { default: "Masih perlu bantuan lagi?", en: "Still need more help?" },
  "assist.close": { default: "Sudah cukup, terima kasih", en: "That is enough, thank you" },
  "assist.level.ARAH": { default: "Arah berpikir", en: "A direction to think in" },
  "assist.level.PETUNJUK": { default: "Langkah pertama", en: "The first step" },
  "assist.level.CONTOH": { default: "Contoh yang mirip", en: "A similar example" },
  "assist.none": { default: "Untuk soal ini belum ada bantuan tambahan.", en: "There is no further help for this question." },

  "hasil.title": { default: "Hasil", en: "Result" },
  "hasil.mastery": { default: "Penguasaan", en: "Mastery" },
  "hasil.safety.ok": { default: "Semua butir penting sudah dijawab dengan tepat.", en: "You answered every important item correctly." },
  "hasil.safety.missed": { default: "Ada butir penting yang belum tepat. Mari kita lihat bersama.", en: "An important item is not right yet. Let us look at it together." },
  "hasil.domain": { default: "Per bagian", en: "By section" },
  "hasil.review": { default: "Tinjau kembali", en: "Look back over it" },
  "hasil.review.open": { default: "Buka pembahasan", en: "Open the explanation" },
  "hasil.answer_yours": { default: "Jawaban Anda", en: "Your answer" },
  "hasil.answer_right": { default: "Sudah tepat", en: "That is right" },
  "hasil.answer_notyet": { default: "Belum tepat", en: "Not right yet" },
  "hasil.delta.LENGKAP": { default: "Perubahan dari Pemetaan Awal", en: "Change since the Initial Mapping" },
  "hasil.delta.BARU_PEMETAAN": { default: "Uji Penguasaan belum dikerjakan, jadi belum ada perbandingan.", en: "The Mastery Check has not been taken, so there is nothing to compare yet." },
  "hasil.delta.BARU_PENGUASAAN": { default: "Pemetaan Awal belum dikerjakan, jadi belum ada perbandingan.", en: "The Initial Mapping has not been taken, so there is nothing to compare yet." },
  "hasil.delta.BELUM_ADA": { default: "Belum ada yang bisa dibandingkan.", en: "There is nothing to compare yet." },
  "hasil.certificate": { default: "Ambil sertifikat", en: "Collect your certificate" },
  "hasil.certificate_soon": { default: "Sertifikat akan tersedia di tahap berikutnya.", en: "Certificates arrive at a later phase." },

  // ----------------------------------------- UX-1 Slice 2: the learner cycle
  "siklus.halo": { default: "Halo", en: "Hello" },
  "siklus.beranda": { default: "Beranda", en: "Home" },
  "siklus.hari_ini": { default: "Ini yang sedang berjalan hari ini.", en: "Here is what is under way for you today." },
  "siklus.lanjutkan": { default: "Lanjutkan", en: "Continue" },
  "siklus.perhatian": { default: "Perlu perhatian", en: "Needs attention" },
  "siklus.milik_anda": { default: "Pembelajaran Anda", en: "Your learning" },
  "siklus.terbuka": { default: "Bisa dikerjakan sekarang", en: "You can do these now" },
  "siklus.buka": { default: "Buka", en: "Open" },
  "siklus.mulai": { default: "Mulai", en: "Start" },
  "siklus.di.pemetaan": { default: "Mulai dari Pemetaan Awal", en: "Begin with the Initial Mapping" },
  "siklus.di.peta": { default: "Peta bacaan sudah siap", en: "The reading map is ready" },
  "siklus.di.pelajaran": { default: "Sedang di Pelajaran", en: "You are at Lessons" },
  "siklus.di.penguasaan": { default: "Siap untuk Uji Penguasaan", en: "Ready for the Mastery Check" },
  "siklus.di.hasil": { default: "Selesai", en: "Finished" },
  "siklus.dari": { default: "dari", en: "of" },
  "siklus.selesai_n": { default: "selesai", en: "finished" },
  "siklus.sekarang": { default: "Langkah Anda sekarang", en: "Where you are now" },
  "siklus.peta_anda": { default: "Peta bacaan Anda", en: "Your reading map" },
  "siklus.langkah_dari": { default: "Lima langkah.", en: "Five steps." },
  "siklus.jumlah_soal": { default: "Jumlah soal", en: "Questions" },
  "siklus.ditutup": { default: "Ditutup", en: "Closes" },
  "siklus.soal": { default: "soal", en: "questions" },
  "siklus.lihat_peta": { default: "Lihat peta bacaan", en: "See the reading map" },
  // A LESSON, not a page. lesson.next / lesson.prev turn the pages INSIDE a
  // lesson and the player owns them; these two move between lessons.
  "siklus.pelajaran_next": { default: "Pelajaran berikutnya", en: "Next lesson" },
  "siklus.pelajaran_prev": { default: "Pelajaran sebelumnya", en: "Previous lesson" },
  // The caption says what the two numbers ARE, not what they mean: reading a
  // judgment into a learner's own change is the engine's job, and it does not
  // make one here.
  "siklus.delta_arti": { default: "Penguasaan Anda pada Pemetaan Awal dibandingkan dengan Uji Penguasaan. Perbandingan ini muncul hanya ketika keduanya sudah selesai.", en: "Your mastery on the Initial Mapping compared with the Mastery Check. This comparison appears only once both are finished." },
  "siklus.bisa_lakukan": { default: "Yang bisa dilakukan", en: "What you can do" },
  "siklus.bisa.tandai": { default: "Menandai soal dan kembali lagi", en: "Flag a question and come back to it" },
  "siklus.bisa.jeda": { default: "Menyimpan dan menjeda, lalu melanjutkan nanti", en: "Save and pause, then carry on later" },
  "siklus.bisa.arah": { default: "Meminta arah berpikir bila sebuah soal terasa buntu", en: "Ask for a direction to think in when a question feels stuck" },
  "siklus.catatan.judul": { default: "Tentang catatan sesi", en: "About session records" },
  "siklus.catatan.isi": { default: "Selama asesmen, aktivitas sesi tertentu dapat dicatat untuk menjaga integritas proses. Catatan ini merupakan observasi dan tidak menentukan hasil Anda secara otomatis.", en: "During the assessment, certain session activity may be recorded to support process integrity. These records are observations and do not automatically determine your result." },
  "siklus.nanti": { default: "Nanti saja", en: "Not now" },
  "siklus.ambang": { default: "Ambang untuk bab ini", en: "The threshold for this chapter is" },
  "siklus.tepat_dari": { default: "Terjawab tepat", en: "You answered" },
  "siklus.setelah": { default: "Setelah bab ini", en: "After this chapter" },
  "siklus.berikutnya": { default: "Apa berikutnya", en: "What next" },
  "siklus.terbuka_kini": { default: "Yang terbuka untuk Anda sekarang.", en: "What is open to you now." },
  "siklus.habis.judul": { default: "Tidak ada lagi yang menunggu", en: "Nothing else is waiting" },
  "siklus.habis.isi": { default: "Semua yang ditugaskan sudah selesai. Kami akan memberi tahu ketika ada yang baru.", en: "Everything assigned to you is finished. We will let you know when something new arrives." },
  "siklus.lihat_sertifikat": { default: "Lihat sertifikat", en: "See the certificate" },

  "sync.offline": { default: "Sedang luring. Jawaban Anda disimpan dan dikirim saat tersambung lagi.", en: "You are offline. Your answers are saved and sent once you are back on." },
  "sync.pending": { default: "Mengirim jawaban yang tertunda…", en: "Sending the answers that are waiting…" },
  "studio.title": { default: "Studio", en: "Studio" },
  "evaluasi.judul": { default: "Ruang Peragaan", en: "Demonstration Room" },
  "evaluasi.intro": { default: "Lihat PINTAR dari sudut pandang orang yang berbeda di satu sekolah peragaan. Pilih satu sudut pandang untuk mulai.", en: "See PINTAR from the point of view of different people in one demonstration school. Choose a point of view to begin." },
  "evaluasi.pilih": { default: "Pilih sudut pandang", en: "Choose a point of view" },
  "evaluasi.mulai": { default: "Lihat sebagai", en: "View as" },
  "evaluasi.refused": { default: "Ruang peragaan tidak tersedia untuk akun ini.", en: "The demonstration room is not available to this account." },
  "evaluasi.mode": { default: "MODE PERAGAAN", en: "DEMONSTRATION MODE" },
  "evaluasi.sebagai": { default: "Sedang melihat sebagai", en: "Currently viewing as" },
  "evaluasi.ganti": { default: "Ganti sudut pandang", en: "Change the point of view" },
  "evaluasi.keluar": { default: "Keluar dari peragaan", en: "Leave the demonstration" },
  "evaluasi.berakhir": { default: "Sesi peragaan berakhir", en: "The demonstration session has ended" },
  "evaluasi.sesi_habis": { default: "Waktu peragaan sudah habis. Kembali ke ruang peragaan untuk mulai lagi.", en: "The demonstration time is up. Go back to the demonstration room to start again." },
  "evaluasi.gagal": { default: "Sudut pandang itu tidak bisa dibuka sekarang.", en: "That point of view cannot be opened right now." },
  "evaluasi.kembali": { default: "Kembali ke ruang peragaan", en: "Back to the demonstration room" },
  "studio.refused": { default: "Halaman ini untuk staf pengelola isi. Akun Anda belum memiliki akses ke Studio.", en: "This page is for content staff. Your account does not have access to the Studio yet." },
  "studio.nav.beranda": { default: "Beranda", en: "Home" },
  "studio.nav.unggah": { default: "Buat Paket", en: "Create a package" },
  "studio.nav.tinjau": { default: "Antrean Tinjauan", en: "Review queue" },
  "studio.nav.kanonik": { default: "Pustaka PINTAR", en: "PINTAR Library" },
  "studio.nav.definisi": { default: "Aturan Penilaian", en: "Assessment rules" },
  "studio.nav.integritas": { default: "Tinjauan Integritas", en: "Integrity review" },
  "studio.nav.sertifikat": { default: "Sertifikat", en: "Certificates" },
  "studio.nav.bank": { default: "Bank Soal", en: "Item bank" },
  "studio.nav.kuis": { default: "Uji Cepat", en: "Quick Assessment" },
  "studio.kuis.judul": { default: "Uji Cepat", en: "Quick Assessment" },
  "studio.kuis.pengantar": { default: "Pilih kelas dan bab yang baru Anda ajarkan, lalu luncurkan. Murid bisa mulai mengerjakan dalam waktu satu menit.", en: "Choose the class and the chapter you have just taught, then launch. Students can be working within a minute." },
  "studio.kuis.kelas": { default: "Kelas", en: "Class" },
  "studio.kuis.bab": { default: "Bab", en: "Chapter" },
  "studio.kuis.sumber_sekolah": { default: "Paket sekolah Anda", en: "Your school's packages" },
  "studio.kuis.sumber_pustaka": { default: "Pustaka PINTAR yang bisa Anda ajarkan", en: "PINTAR Library chapters you may teach" },
  "studio.kuis.jumlah": { default: "Jumlah soal", en: "Number of questions" },
  "studio.kuis.menit": { default: "Lama pengerjaan (menit)", en: "Time allowed (minutes)" },
  "studio.kuis.luncurkan": { default: "Luncurkan Uji Cepat", en: "Launch the Quick Assessment" },
  "studio.kuis.riwayat": { default: "Uji Cepat yang sudah diluncurkan", en: "Quick Assessments already launched" },
  "studio.kuis.kosong": { default: "Belum ada Uji Cepat di kelas ini.", en: "No Quick Assessment has been run in this class yet." },
  "studio.kuis.bab_kosong": { default: "Belum ada bab yang bisa dipakai untuk Uji Cepat. Buat paket sekolah Anda, atau tunggu bab Pustaka PINTAR dibuka untuk sekolah Anda.", en: "No chapter is available for a Quick Assessment yet. Create your school's package, or wait for a PINTAR Library chapter to be opened to your school." },
  "studio.kuis.tidak_tersedia": { default: "Bahan Uji Cepat ini sudah tidak tersedia untuk sekolah Anda, jadi Uji Cepat ini tidak bisa dimulai lagi. Pekerjaan murid yang sudah selesai tetap tersimpan.", en: "This Quick Assessment's material is no longer available to your school, so it cannot be started again. Work students have already finished stays saved." },
  "studio.kuis.tanpa_kelas": { default: "Akun Anda belum dipasangkan dengan kelas mana pun.", en: "Your account is not paired with any class yet." },
  "studio.bucket.ACTION_REQUIRED": { default: "Menunggu tindakan Anda", en: "Waiting on you" },
  "studio.bucket.AWAITING_MY_REVIEW": { default: "Menunggu tinjauan Anda", en: "Waiting on your review" },
  "studio.bucket.BLOCKED": { default: "Tertahan", en: "Held" },
  "studio.bucket.QUESTION_HEALTH": { default: "Sinyal mutu soal", en: "Item quality signals" },
  "studio.bucket.DISTRIBUTED_CANONICAL": { default: "Pustaka PINTAR untuk sekolah Anda", en: "PINTAR Library for your school" },
  "studio.state.READY": { default: "Siap", en: "Ready" },
  "studio.state.ACTION_REQUIRED": { default: "Perlu tindakan", en: "Needs action" },
  "studio.state.BLOCKED": { default: "Tertahan", en: "Held" },
  "studio.state.explain.READY": { default: "Paket ini siap diterbitkan.", en: "This package is ready to publish." },
  "studio.state.explain.ACTION_REQUIRED": { default: "Ada yang bisa Anda selesaikan sekarang di Studio.", en: "There is something you can finish now in the Studio." },
  "studio.state.explain.BLOCKED": { default: "Ada yang harus diperbaiki pada isinya sebelum paket ini bisa lanjut.", en: "Something in the content must be fixed before this package can go further." },
  "studio.paket.judul": { default: "Paket Pembelajaran", en: "Learning Package" },
  "studio.paket.alasan": { default: "Yang perlu diselesaikan", en: "What needs finishing" },
  "studio.paket.pratinjau": { default: "Lihat seperti siswa", en: "See it as a student" },
  "studio.paket.setujui": { default: "Setujui", en: "Approve" },
  "studio.paket.kunci": { default: "Setujui & Kunci", en: "Approve & lock" },
  "studio.paket.kunci_peringatan": { default: "Setelah dikunci, isi paket ini tidak dapat diubah lagi. Perbaikan berikutnya dibuat sebagai salinan baru.", en: "Once locked, this package's content cannot be changed again. A later correction is made as a new copy." },
  "studio.paket.terbitkan": { default: "Terbitkan", en: "Publish" },
  "studio.paket.tarik": { default: "Tarik dari peredaran", en: "Withdraw from circulation" },
  "studio.paket.tugaskan": { default: "Tugaskan ke kelas", en: "Assign to a class" },
  "studio.paket.terbit_bukan_tugas": { default: "Menerbitkan belum menugaskan. Siswa baru melihatnya setelah Anda menugaskannya ke kelas.", en: "Publishing is not assigning. Students see it only once you have assigned it to a class." },
  "studio.paket.revisi": { default: "Buat salinan untuk diperbaiki", en: "Make a copy to correct" },
  "studio.paket.revisi_penjelasan": { default: "Paket asli tetap utuh beserta seluruh catatan pengerjaan siswa. Salinan baru bisa Anda sunting bebas.", en: "The original package stays whole, with every record of student work. The new copy is yours to edit freely." },
  "studio.paket.kosong": { default: "Belum ada paket di sini.", en: "There is nothing here yet." },
  "studio.temuan.lokasi": { default: "Lokasi", en: "Where" },
  "studio.temuan.masalah": { default: "Masalah", en: "The problem" },
  "studio.temuan.mengapa": { default: "Mengapa penting", en: "Why it matters" },
  "studio.temuan.cara": { default: "Cara memperbaiki", en: "How to fix it" },
  "studio.temuan.akui": { default: "Sudah saya tinjau", en: "I have reviewed this" },
  "studio.temuan.kosong": { default: "Tidak ada catatan mutu yang menunggu.", en: "No quality notes are waiting." },
  "studio.unggah.judul": { default: "Buat Paket Pembelajaran", en: "Create a Learning Package" },
  "studio.unggah.mudah": { default: "Unggah Mudah", en: "Easy upload" },
  "studio.unggah.mudah_penjelasan": { default: "Unggah folder, ZIP, atau berkas lepas. PINTAR mengenali peran tiap berkas dan menanyakan yang belum pasti.", en: "Upload a folder, a ZIP, or loose files. PINTAR works out what each file is for and asks about anything it is unsure of." },
  "studio.unggah.terstruktur": { default: "Paket Terstruktur", en: "Structured package" },
  "studio.unggah.terstruktur_penjelasan": { default: "Untuk paket yang sudah dibuat mesin dalam format baku.", en: "For packages a machine has already produced in a standard format." },
  "studio.unggah.buat_paket": { default: "Buat Paket Pembelajaran", en: "Create a Learning Package" },
  "studio.unggah.buat_penilaian": { default: "Buat Penilaian", en: "Create an Assessment" },
  "studio.unggah.buat_video": { default: "Buat Video", en: "Create a Video" },
  "studio.unggah.pertanyaan": { default: "Yang perlu Anda pastikan", en: "What we need you to confirm" },
  "studio.unggah.konfirmasi": { default: "Konfirmasi", en: "Confirm" },
  "studio.unggah.media_catatan": { default: "Berkas media diunggah melalui server PINTAR, bukan langsung dari peramban.", en: "Media files are uploaded through the PINTAR server, not straight from the browser." },
  "studio.tinjau.judul": { default: "Antrean Tinjauan", en: "Review Queue" },
  "studio.tinjau.kosong": { default: "Tidak ada yang menunggu tinjauan Anda.", en: "Nothing is waiting on your review." },
  "studio.tinjau.penulis": { default: "Penyusun", en: "Author" },
  "studio.tinjau.bukan_penulis": { default: "Anda menyusun bagian ini, jadi orang lain yang meninjaunya.", en: "You wrote this part, so somebody else reviews it." },
  "studio.kanonik.judul": { default: "Pustaka PINTAR", en: "PINTAR Library" },
  "studio.kanonik.penjelasan": { default: "Paket yang disusun PINTAR dan diizinkan untuk sekolah Anda. Bisa ditugaskan, tidak bisa disunting.", en: "Packages PINTAR wrote and opened to your school. They can be assigned; they cannot be edited." },
  "studio.kanonik.kosong": { default: "Belum ada paket PINTAR yang diizinkan untuk sekolah Anda.", en: "No PINTAR package has been opened to your school yet." },
  "studio.kanonik.ditarik": { default: "Izin untuk paket ini sudah berakhir. Siswa yang sedang mengerjakan tetap bisa menyelesaikannya; pengerjaan baru tidak dibuka lagi.", en: "The permission for this package has ended. Students already working on it can finish; no new attempt opens." },
  "studio.kanonik.hanya_baca": { default: "Hanya dapat dibaca dan ditugaskan.", en: "Readable and assignable only." },
  "studio.definisi.judul": { default: "Aturan Penilaian", en: "Assessment Rules" },
  "studio.definisi.batas": { default: "Batas yang berlaku", en: "The thresholds in force" },
  "studio.definisi.simpan": { default: "Simpan", en: "Save" },
  "studio.definisi.versi_baru": { default: "Perubahan ini mengubah cara hasil dibaca, jadi tersimpan sebagai aturan baru. Hasil lama tetap dibaca dengan aturan lamanya.", en: "This change alters how results are read, so it is saved as a new rule. Older results keep being read under their own rule." },
  "studio.definisi.tetap": { default: "Nama diperbarui. Cara hasil dibaca tidak berubah.", en: "The name is updated. How results are read has not changed." },
  "studio.integritas.judul": { default: "Tinjauan Integritas", en: "Integrity Review" },
  "studio.integritas.penjelasan": { default: "Catatan ini bahan pertimbangan manusia, bukan kesimpulan tentang siswa.", en: "These notes are material for a human to weigh, not a conclusion about a student." },
  "studio.integritas.kosong": { default: "Tidak ada catatan yang menunggu tinjauan.", en: "No note is waiting for review." },
  "studio.integritas.NO_CONCERN": { default: "Tidak ada yang perlu ditindaklanjuti", en: "Nothing to follow up" },
  "studio.integritas.DISCUSSED_WITH_LEARNER": { default: "Sudah dibicarakan dengan siswa", en: "Discussed with the student" },
  "studio.integritas.REFERRED_TO_INSTITUTION": { default: "Diteruskan ke pihak sekolah", en: "Passed to the school" },
  "studio.integritas.catat": { default: "Catat tinjauan", en: "Record the review" },
  "studio.sertifikat.judul": { default: "Tata Letak Sertifikat", en: "Certificate Layout" },
  "studio.sertifikat.tata_letak": { default: "Tata letak", en: "Layout" },
  "studio.sertifikat.awalan": { default: "Awalan nomor", en: "Number prefix" },
  "studio.sertifikat.identitas": { default: "Sertifikat menampilkan nama pemegang saja.", en: "The certificate shows the holder's name only." },
  "studio.sertifikat.simpan": { default: "Simpan", en: "Save" },
  "studio.bank.judul": { default: "Bank Soal", en: "Item Bank" },
  "studio.bank.kesehatan": { default: "Kesehatan soal", en: "Item health" },
  "studio.bank.belum_cukup": { default: "Belum cukup bukti untuk menilai soal ini.", en: "Not enough evidence to judge this item yet." },
  "studio.bank.prediksi": { default: "Perkiraan penyusun", en: "The author's estimate" },
  "studio.bank.empiris": { default: "Dari pengerjaan siswa", en: "From student work" },
  "studio.bank.akui_ok": { default: "Sudah ditinjau, soal ini wajar", en: "Reviewed — this item is sound" },
  "studio.bank.tindakan": { default: "Sudah ditinjau, soal ini diperbaiki", en: "Reviewed — this item was corrected" },
  "studio.hasil.ok": { default: "Tersimpan.", en: "Saved." },
  "studio.hasil.gagal": { default: "Belum tersimpan.", en: "Not saved." },
  "sync.done": { default: "Semua jawaban sudah tersimpan di server.", en: "Every answer is saved on the server." },
  // R1 (F-07/F-08). Said when Finish is held back because an answer the
  // learner gave is not yet on the server, and when an answer arrived after
  // the assessment had already closed. Neither blames the learner.
  "sync.belum_tersimpan": { default: "Ada jawaban yang belum tersimpan di server. Pastikan tersambung, lalu tekan sekali lagi.", en: "Some answers are not saved on the server yet. Make sure you are connected, then press again." },
  "sync.belum_terkirim": { default: "Belum tersambung. Jawaban Anda tetap tersimpan di perangkat ini; coba lagi saat tersambung.", en: "Not connected yet. Your answers stay saved on this device; try again once you are connected." },
  // F-01. The step after the intake: a provisioned person becomes someone
  // who can sign in. Plain words; the card PIN is shown once and said so.
  "aktivasi.ditolak": { default: "Halaman ini untuk pengelola data sekolah.", en: "This page is for the people who manage a school's records." },
  "aktivasi.eyebrow": { default: "Akun", en: "Accounts" },
  "aktivasi.judul": { default: "Aktifkan akun", en: "Activate accounts" },
  "aktivasi.intro": { default: "Orang yang sudah didata sekolah Anda tetapi belum bisa masuk. Pilih cara masuk untuk masing-masing: tautan lewat surel, atau kartu kelas dengan PIN.", en: "People your school has recorded who cannot sign in yet. Choose how each one signs in: a link by email, or a classroom card with a PIN." },
  "aktivasi.kosong": { default: "Semua orang yang sudah didata sudah bisa masuk.", en: "Everyone who has been recorded can already sign in." },
  "aktivasi.surel": { default: "Alamat surel", en: "Email address" },
  "aktivasi.dengan_surel": { default: "Aktifkan dengan surel", en: "Activate by email" },
  "aktivasi.dengan_kartu": { default: "Buat kartu kelas", en: "Make a classroom card" },
  "aktivasi.kartu_dibuat": { default: "Kartu dibuat. Catat sekarang — PIN hanya ditampilkan sekali:", en: "Card made. Write it down now — the PIN is shown only once:" },
  "aktivasi.gagal": { default: "Belum berhasil. Periksa alamat surel, atau apakah orang ini sudah punya akun.", en: "That did not work. Check the email address, or whether this person already has an account." },
  "aktivasi.baru.judul": { default: "Orang baru di luar pendataan", en: "A new person outside the intake" },
  "aktivasi.baru.arti": { default: "Untuk pengelola pertama sebuah sekolah. Setelah dibuat, beri peran di Konfigurasi.", en: "For a school's first administrator. Once created, give them a role in Configuration." },
  "aktivasi.baru.nama": { default: "Nama", en: "Name" },
  "aktivasi.baru.tombol": { default: "Buat dan aktifkan", en: "Create and activate" },
  "aktivasi.baru.ok": { default: "Dibuat. PINTAR tidak mengirim surel ke orang ini. Minta orang ini membuka halaman /masuk di PINTAR, lalu mengetik alamat surel ini. Tautan masuk dikirim saat itu.", en: "Created. PINTAR has not emailed this person. Ask them to open the /masuk page in PINTAR and type this email address. The sign-in link is sent then." },
  "sync.sesi_ditutup": { default: "Asesmen ini sudah ditutup, jadi jawaban terakhir tidak lagi dapat dikirim.", en: "This assessment is already closed, so the last answer could not be sent." },

  // ═══════════════════════════ UX-1 · the role-based first-login tour (r2.1).
  // Daisy's approved copy, verbatim. Two corrections carried in from the later
  // Sauron rulings, which take precedence over the superseded r2 text they
  // replace: the educator's teaching-context wording (§D-1, §D-2 — visibility
  // is not the teaching context and not authority) and the canonical EN
  // "Mastery Check". Nothing else was reworded.
  "tur.tur": { default: "Tur PINTAR", en: "PINTAR tour" },
  "tur.nama.belajar": { default: "Tur halaman Belajar", en: "Tour of the Learning page" },
  "tur.nama.pengajar": { default: "Tur untuk pengajar", en: "Tour for educators" },
  "tur.berikutnya": { default: "Berikutnya", en: "Next" },
  "tur.kembali": { default: "Kembali", en: "Back" },
  "tur.lewati": { default: "Lewati tur", en: "Skip tour" },
  "tur.selesai": { default: "Selesai", en: "Finish" },
  "tur.jangan": { default: "Jangan tampilkan tur ini lagi", en: "Don't show this tour again" },
  "tur.langkah": { default: "Langkah", en: "Step" },
  "tur.dari": { default: "dari", en: "of" },
  "tur.contoh": { default: "Contoh", en: "Example" },
  "tur.tutup": { default: "Tutup", en: "Close" },
  "tur.catatan": { default: "Tur ini tidak akan muncul otomatis lagi. Buka kapan saja dari Bantuan.", en: "This tour won't open automatically again. Open it any time from Help." },
  "tur.catatan.sd": { default: "Tur ini tidak akan muncul sendiri lagi.", en: "This tour won't appear by itself again." },

  // Help / replay (§F)
  "nav.bantuan": { default: "Bantuan", en: "Help" },
  "tur.bantuan.judul": { default: "Bantuan", en: "Help" },
  "tur.bantuan.langkah7": { default: "7 langkah", en: "7 steps" },
  "tur.bantuan.mulai_lagi": { default: "Mulai tur lagi", en: "Start the tour again" },
  "tur.bantuan.mulai": { default: "Mulai tur", en: "Start the tour" },
  "tur.bantuan.atau": { default: "Atau buka satu langkah:", en: "Or open one step:" },
  "tur.bantuan.lain": { default: "Butuh bantuan lain?", en: "Need other help?" },
  "tur.bantuan.guru": { default: "Tanyakan kepada guru.", en: "Ask your teacher." },
  "tur.bantuan.sekolah": { default: "Hubungi bagian layanan sekolah.", en: "Contact your school's support." },

  // The three tips the first release owns (§G-6)
  "tur.tip.lagi": { default: "Tur akan muncul lagi saat Anda masuk berikutnya. Bisa juga dibuka dari Bantuan kapan saja.", en: "The tour will appear again next time you sign in. You can also open it from Help any time." },
  "tur.tip.lagi.sd": { default: "Tur bisa dibuka lagi dari sini.", en: "You can open the tour again from here." },
  "tur.tip.berhenti": { default: "Tur tidak akan muncul otomatis lagi. Bisa dibuka dari Bantuan kapan saja.", en: "The tour won't open automatically again. You can open it from Help any time." },
  "tur.tip.mengerti": { default: "Mengerti", en: "Got it" },

  // ── Belajar · Netral (§C2) — the executable learner variant
  "tur.nt.1.judul": { default: "Mulai dari daftar ini", en: "Start from this list" },
  "tur.nt.1.isi": { default: "Semua yang ditugaskan ada di sini, sudah diurutkan. Yang paling atas dikerjakan lebih dulu; tombolnya membuka langkah berikutnya.", en: "Everything assigned is here, already in order. Begin with the one at the top — its button opens the next step." },
  "tur.nt.1.kosong": { default: "Saat ada materi yang ditugaskan, kartunya muncul di sini, lengkap dengan tombol untuk memulai.", en: "When something is assigned, its card appears here, with a button to begin." },
  "tur.nt.2.judul": { default: "Setiap materi punya lima langkah", en: "Every assignment has five steps" },
  "tur.nt.2.isi": { default: "Pemetaan Awal, Peta Bacaan, Pelajaran, Uji Penguasaan, lalu Hasil. Satu langkah terbuka pada satu waktu; Pemetaan Awal bukan ujian. Uji Cepat dari guru berada di luar lima langkah ini dan muncul di daftar Belajar.", en: "Initial Mapping, Reading Map, Lessons, Mastery Check, then Results. One step is open at a time; the Initial Mapping is not a test. A Quick Assessment from a teacher sits outside these five steps and appears in the Learning list." },
  "tur.nt.3.judul": { default: "Tempat membaca dan menonton", en: "Where you read and watch" },
  "tur.nt.3.isi": { default: "Peta Bacaan menunjukkan bagian yang perlu dibaca lebih dulu, beserta alasannya. Pelajaran dibuka dari sana, dan posisi baca tersimpan.", en: "The Reading Map shows which part to read first, and why. Lessons open from there, and your place is saved." },
  "tur.nt.4.judul": { default: "Saat mengerjakan soal", en: "While you answer" },
  "tur.nt.4.isi": { default: "Pilih satu jawaban, lalu kunci. Jawaban yang sudah dikunci tersimpan. Bila perlu, tombol bantuan kecil bisa muncul — memakainya tidak mengurangi apa pun.", en: "Choose one answer, then lock it in. Locked answers are saved. If it is needed, a small help button may appear — using it never takes anything away." },
  "tur.nt.5.judul": { default: "Hasil setiap materi", en: "Results for each assignment" },
  "tur.nt.5.isi": { default: "Hasil adalah langkah terakhir: penguasaan, bagian yang perlu diulang, dan perubahan sejak Pemetaan Awal. Perbandingannya selalu dengan diri sendiri.", en: "Results are the last step: mastery, what to revisit, and what has changed since the Initial Mapping. The comparison is always with yourself." },
  "tur.nt.6.judul": { default: "Sertifikat", en: "Certificates" },
  "tur.nt.6.isi": { default: "Sertifikat yang diterbitkan sekolah ada di sini. Masing-masing bisa diperiksa keasliannya lewat tautannya.", en: "Certificates the school issues are here. Each one can be checked through its own link." },
  "tur.nt.7.judul": { default: "Bantuan", en: "Help" },
  "tur.nt.7.isi": { default: "Tur ini bisa dibuka lagi dari sini, termasuk langsung ke satu langkah. Bila masih ada pertanyaan, tanyakan kepada guru.", en: "You can open this tour again from here, or go straight to one step. If anything is still unclear, ask your teacher." },

  // ── Belajar · SD (§B) — dormant until a legitimate stage signal exists
  "tur.sd.1.judul": { default: "Mulai dari sini", en: "Start here" },
  "tur.sd.1.isi": { default: "Kartu ini menunjukkan yang perlu dikerjakan sekarang. Tekan tombolnya untuk mulai.", en: "This card shows what to do now. Press its button to begin." },
  "tur.sd.1.kosong": { default: "Kartu materi akan muncul di sini, lengkap dengan tombol untuk mulai.", en: "A card will appear here when there is something to do, with a button to begin." },
  "tur.sd.2.judul": { default: "Pilih, lalu tekan", en: "Choose, then press" },
  "tur.sd.2.isi": { default: "Pilih satu jawaban. Lalu tekan tombol di bawahnya.", en: "Choose one answer. Then press the button below it." },
  "tur.sd.3.judul": { default: "Kalau bingung", en: "If you get stuck" },
  "tur.sd.3.isi": { default: "Kadang muncul tombol bantuan kecil. Boleh dipakai. Tidak mengurangi apa pun.", en: "Sometimes a small help button appears. It's fine to use. It never takes anything away." },
  "tur.sd.4.judul": { default: "Baca yang ini dulu", en: "Read this one first" },
  "tur.sd.4.isi": { default: "Setelah Pemetaan Awal, muncul peta bacaan. Mulai dari yang paling atas.", en: "After the Initial Mapping, a reading map appears. Start at the top." },
  "tur.sd.5.judul": { default: "Pelajaran", en: "Lessons" },
  "tur.sd.5.isi": { default: "Baca atau tonton halaman demi halaman. Kalau berhenti, PINTAR ingat tempatnya.", en: "Read or watch one page at a time. If you stop, PINTAR remembers the place." },
  "tur.sd.6.judul": { default: "Lihat hasilnya", en: "See how it went" },
  "tur.sd.6.isi": { default: "Setelah Uji Penguasaan, ada hasilnya. Isinya: yang sudah dikuasai dan yang masih perlu dilatih.", en: "After the Mastery Check, there are results. They show what you know and what to practise more." },
  "tur.sd.7.judul": { default: "Bantuan selalu di sini", en: "Help is always here" },
  "tur.sd.7.isi": { default: "Tur ini bisa dibuka lagi dari sini. Kalau masih bingung, tanyakan kepada guru.", en: "You can open this tour again from here. If you're still unsure, ask your teacher." },

  // ── Belajar · Menengah (§C) — dormant until a legitimate stage signal exists
  "tur.sm.1.judul": { default: "Yang perlu dikerjakan", en: "What to do" },
  "tur.sm.1.isi": { default: "Materi yang ditugaskan ada di sini, sudah diurutkan. Mulai dari yang paling atas; tombolnya membawa ke langkah berikutnya.", en: "Everything assigned is here, already in order. Start at the top — its button takes you to the next step." },
  "tur.sm.1.kosong": { default: "Materi yang ditugaskan akan muncul di sini, sudah diurutkan. Yang paling atas dikerjakan lebih dulu.", en: "Assigned work will appear here, already in order. The one at the top comes first." },
  "tur.sm.2.judul": { default: "Lima langkah di setiap materi", en: "Five steps in every assignment" },
  "tur.sm.2.isi": { default: "Pemetaan Awal, Peta Bacaan, Pelajaran, Uji Penguasaan, lalu Hasil. Hanya satu langkah yang terbuka pada satu waktu. Pemetaan Awal bukan ujian.", en: "Initial Mapping, Reading Map, Lessons, Mastery Check, then Results. Only one step is open at a time. The Initial Mapping is not a test." },
  "tur.sm.3.judul": { default: "Tempat belajar", en: "Where you learn" },
  "tur.sm.3.isi": { default: "Peta Bacaan menunjukkan bagian yang perlu dibaca lebih dulu, beserta alasannya. Pelajaran dibuka dari sana, dan posisi baca tersimpan.", en: "The Reading Map shows which part to read first, and why. Lessons open from there, and your place is saved." },
  "tur.sm.4.judul": { default: "Mengerjakan penilaian", en: "Taking an assessment" },
  "tur.sm.4.isi": { default: "Pilih jawaban, lalu kunci. Jawaban yang sudah dikunci tersimpan. Uji Cepat yang dibuka guru juga muncul di halaman Belajar.", en: "Choose an answer, then lock it in. Locked answers are saved. Quick Assessments your teacher opens also appear on the Learning page." },
  "tur.sm.5.judul": { default: "Melihat hasil", en: "Seeing results" },
  "tur.sm.5.isi": { default: "Hasil ada di langkah terakhir setiap materi: penguasaan, bagian yang perlu diulang, dan perubahan sejak Pemetaan Awal. Dibandingkan dengan diri sendiri, bukan dengan orang lain.", en: "Results are the last step of every assignment: mastery, what to revisit, and how you've changed since the Initial Mapping. Compared with yourself, never with others." },
  "tur.sm.6.judul": { default: "Sertifikat", en: "Certificates" },
  "tur.sm.6.isi": { default: "Sertifikat yang diterbitkan sekolah ada di sini, dan masing-masing bisa diperiksa keasliannya lewat tautannya.", en: "Certificates the school issues are here, and each can be checked through its own link." },
  "tur.sm.7.judul": { default: "Kalau perlu bantuan", en: "When you need help" },
  "tur.sm.7.isi": { default: "Tur ini bisa dibuka lagi dari Bantuan. Saat mengerjakan soal, tombol bantuan kecil bisa muncul — memakainya tidak mengurangi apa pun.", en: "You can reopen this tour from Help. While answering, a small help button may appear — using it never takes anything away." },

  // ── Kelas · Pengajar (§D)
  "tur.pg.1.judul": { default: "Satu hal yang layak dikerjakan dulu", en: "One thing worth doing first" },
  "tur.pg.1.isi": { default: "Setiap kali masuk, kartu ini menunjukkan satu hal yang paling layak dikerjakan, disusun dari keadaan kelas dalam lingkup mengajar Anda.", en: "Each time you sign in, this card shows the one thing most worth doing, based on the state of the classes in your teaching context." },
  "tur.pg.1.kosong": { default: "Bila ada yang layak dikerjakan lebih dulu, kartunya muncul di atas daftar ini.", en: "When something is worth doing first, its card appears above this list." },
  "tur.pg.2.judul": { default: "Kelas dalam lingkup mengajar Anda", en: "Classes in your teaching context" },
  "tur.pg.2.isi": { default: "Daftar ini mengikuti penugasan dari sekolah. Pilih satu kelas; yang Anda siapkan dan lihat sesudahnya berlaku untuk kelas yang dipilih.", en: "This list follows the school's assignments. Choose a class — what you prepare and view next applies to the class you selected." },
  "tur.pg.2.kosong": { default: "Belum ada kelas di sini. Kelas muncul setelah sekolah menugaskan Anda.", en: "No classes here yet. Classes appear once the school assigns you." },
  "tur.pg.3.judul": { default: "Yang sedang berjalan", en: "What's open now" },
  "tur.pg.3.isi": { default: "Penilaian yang jendelanya masih terbuka, dengan jumlah murid yang sudah mengumpulkan. Angka ini hitungan, bukan penilaian.", en: "Assessments whose window is still open, with how many learners have submitted. These numbers are counts, not judgments." },
  "tur.pg.3.kosong": { default: "Saat ada penilaian yang jendelanya terbuka, daftarnya muncul di halaman ini.", en: "When an assessment window is open, it appears on this page." },
  "tur.pg.4.judul": { default: "Uji Cepat", en: "Quick Assessment" },
  "tur.pg.4.isi": { default: "Dari halaman kelas: atur, tinjau, lalu sediakan. Murid baru menerimanya setelah Anda menekan Sediakan. Hasilnya ikut menjadi bukti belajar; satu Uji Cepat saja tidak menerbitkan sertifikat.", en: "From a class page: configure, review, then make it available. Learners receive it only after you press Make available. Results become learning evidence; a single Quick Assessment does not issue a certificate." },
  "tur.pg.5.judul": { default: "Menyediakan materi", en: "Making material available" },
  "tur.pg.5.isi": { default: "Bab yang sudah diterbitkan sekolah tidak otomatis sampai ke murid. Tinjau yang akan diterima murid, lalu sediakan untuk kelas yang dipilih.", en: "A chapter the school has published does not reach learners by itself. Review what learners will receive, then make it available to the selected class." },
  "tur.pg.6.judul": { default: "Apa yang sudah bisa disimpulkan", en: "What can be concluded" },
  "tur.pg.6.isi": { default: "PINTAR baru menyimpulkan bila buktinya cukup. «Belum cukup bukti» adalah keadaan biasa — artinya belum, bukan buruk.", en: "PINTAR only draws a conclusion when there is enough evidence. «Not yet enough evidence» is a normal state — it means not yet, not bad." },
  "tur.pg.7.judul": { default: "Bantuan", en: "Help" },
  "tur.pg.7.isi": { default: "Tur ini bisa dibuka lagi dari sini, termasuk langsung ke satu langkah. Untuk pertanyaan lain, hubungi bagian layanan sekolah.", en: "You can reopen this tour from here, or go straight to one step. For anything else, contact your school's support." },

  // ══════════════════════════════════ UX-1 Slice 3 — the educator's teaching
  // surface. Educator-facing, and deliberately NOT declared staff-only: the
  // internal-word guard runs over every one of these tellings, which is worth
  // more than the exemption would be.
  "mengajar.judul": { default: "Kelas", en: "Classes" },
  "nav.kelas": { default: "Kelas", en: "Classes" },
  "nav.pimpinan": { default: "Beranda", en: "Home" },
  "nav.pendataan": { default: "Pendataan", en: "Intake" },

  // ── WP6B. PEMBELAJARAN SAYA — the educator reading their own learning.
  //
  // THE WORDS ARE ABOUT THE PERSON'S LEARNING, NEVER ABOUT THEIR TEACHING.
  // Nothing here evaluates anybody: there is no effectiveness, no score about
  // the educator, no comparison and no employment consequence, because the same
  // 92% that means "this person learned something" would be a lie if it were
  // told as "this person teaches well". The sentences say whose learning it is
  // and that it stands apart from the classes they teach, and stop there.
  //
  // AND THE EMPTY SENTENCE IS THE MOST CAREFULLY CHOSEN ONE. "Belum ada" —
  // there is not yet — is the same construction the learner's own empty home
  // uses. It names no refusal, no missing account, no setup step and no
  // permission, because none of those is what happened: nobody has enrolled
  // this person in anything, which is an ordinary state of affairs and reads
  // like one.
  "nav.pembelajaran": { default: "Pembelajaran Saya", en: "My Learning" },
  "pembelajaran.eyebrow": { default: "Pembelajaran Saya", en: "My Learning" },
  "pembelajaran.milik": { default: "Ini pembelajaran Anda sendiri, terpisah dari kelas yang Anda ajar.", en: "This is your own learning, separate from the classes you teach." },
  "pembelajaran.kosong": { default: "Belum ada pembelajaran untuk Anda saat ini.", en: "You have no learning at the moment." },
  "pembelajaran.kosong_arti": { default: "Bila sekolah mendaftarkan Anda pada sebuah pembelajaran, ia akan muncul di sini.", en: "If your school enrols you in something, it will appear here." },
  "pembelajaran.sertifikat_arti": { default: "Sertifikat dari pembelajaran Anda sendiri.", en: "Certificates from your own learning." },

  // ── WP7C. ANONYMOUS STUDENT → EDUCATOR FEEDBACK.
  //
  // THE FIVE QUESTIONS ARE ABOUT WHAT HAPPENS IN THE ROOM, not about a person's
  // worth. Each one is a sentence a learner can answer from their own week —
  // whether explanations land, whether there is room to ask, whether work comes
  // back with something useful on it, whether it is safe to admit you are lost,
  // whether the pace fits. None of them asks for a verdict, a score or a
  // preference, and none of them can be answered with praise or blame: the
  // scale is how OFTEN, which is a description rather than a judgement.
  //
  // WP7B stores these as keys and nothing else, so the wording can be corrected
  // without a migration and means the same thing in both languages.
  "umpanbalik.pertanyaan.penjelasan_jelas": { default: "Penjelasan di kelas ini mudah saya pahami.", en: "The explanations in this class are easy for me to follow." },
  "umpanbalik.pertanyaan.kesempatan_bertanya": { default: "Saya punya kesempatan untuk bertanya.", en: "I get the chance to ask questions." },
  "umpanbalik.pertanyaan.umpan_balik_tugas": { default: "Tugas saya kembali dengan catatan yang membantu.", en: "My work comes back with comments that help me." },
  "umpanbalik.pertanyaan.aman_mengaku_belum_paham": { default: "Saya merasa aman mengatakan bahwa saya belum paham.", en: "I feel safe saying when I have not understood something." },
  "umpanbalik.pertanyaan.kecepatan_pas": { default: "Kecepatan pelajaran terasa pas untuk saya.", en: "The pace of the lessons feels right for me." },

  // A FOUR-POINT FREQUENCY SCALE, and deliberately not a rating. There is no
  // best end and no worst end declared anywhere, no star, no number behind the
  // word and no midpoint to be "average": four words about how often something
  // happens, which is what a class can actually report.
  "umpanbalik.pilihan.jarang": { default: "Jarang", en: "Rarely" },
  "umpanbalik.pilihan.kadang": { default: "Kadang", en: "Sometimes" },
  "umpanbalik.pilihan.sering": { default: "Sering", en: "Often" },
  "umpanbalik.pilihan.selalu": { default: "Selalu", en: "Always" },

  // THE CANONICAL SUPPRESSION STATEMENT. WP7B binds this key per cycle through
  // the threshold version and returns it INSTEAD of every figure when a round
  // closed below the anonymity threshold. The sentence says the results are not
  // being shown and why in the broadest possible terms; it names no count, no
  // requirement and nothing from which either could be worked out, because the
  // missing number is precisely what must stay missing.
  "umpanbalik.hasil.belum_cukup_tanggapan": { default: "Belum cukup tanggapan untuk menampilkan hasil dengan aman.", en: "There are not enough responses to display the results safely." },
  "umpanbalik.hasil.belum_ditutup": { default: "Umpan balik masih dikumpulkan.", en: "Feedback is still being collected." },
  "umpanbalik.hasil.judul": { default: "Yang dipilih kelas ini", en: "What this class chose" },
  "umpanbalik.hasil.total": { default: "Tanggapan yang masuk", en: "Responses received" },
  "umpanbalik.hasil.arti": { default: "Angka pada tiap pilihan adalah banyaknya tanggapan yang memilihnya.", en: "The figure on each option is how many responses chose it." },

  // The three states, as sentences. The enum values themselves never render.
  "umpanbalik.keadaan.terbuka": { default: "Masih dikumpulkan", en: "Still being collected" },
  "umpanbalik.keadaan.terbit": { default: "Hasil tersedia", en: "Results available" },
  "umpanbalik.keadaan.ditahan": { default: "Hasil tidak ditampilkan", en: "Results not shown" },

  "umpanbalik.murid.judul": { default: "Umpan balik", en: "Feedback" },
  "umpanbalik.murid.ajakan": { default: "Kelas Anda sedang dimintai pendapat tentang pengajarannya.", en: "Your class is being asked about its teaching." },
  "umpanbalik.murid.beri": { default: "Beri umpan balik", en: "Give feedback" },
  "umpanbalik.murid.sudah": { default: "Sudah Anda kirim.", en: "You have sent yours." },
  "umpanbalik.tentang.kelas": { default: "Kelas", en: "Class" },
  "umpanbalik.tentang.guru": { default: "Guru", en: "Teacher" },

  "umpanbalik.form.judul": { default: "Umpan balik untuk kelas ini", en: "Feedback for this class" },
  "umpanbalik.form.intro": { default: "Lima pertanyaan, masing-masing dengan pilihan yang sudah ditentukan.", en: "Five questions, each with a fixed set of answers." },
  // WHAT IS TRUE, SAID PLAINLY, AND NOTHING BEYOND IT. ADR-0022 records two
  // residuals — a unanimous result can imply what everyone chose, and
  // privileged infrastructure could reconstruct linkage — so PINTAR does not
  // tell a child that nobody can ever know what they answered. What it can say
  // without qualification is what the product does: the answers are not shown
  // next to a name, and what the teacher receives is the class, not a sheet.
  "umpanbalik.form.privasi": { default: "Jawaban Anda tidak ditampilkan bersama nama Anda. Yang dilihat guru adalah ringkasan satu kelas, bukan lembar jawaban satu per satu.", en: "Your answers are not shown with your name. What the teacher sees is a summary for the class, not individual answer sheets." },
  "umpanbalik.form.guna": { default: "Guru memakai umpan balik ini untuk memperbaiki cara mengajar.", en: "Teachers use this feedback to improve how they teach." },
  "umpanbalik.form.belum_semua": { default: "Masih ada pertanyaan yang belum dijawab.", en: "Some questions are still unanswered." },
  "umpanbalik.form.kirim": { default: "Kirim", en: "Send" },
  "umpanbalik.form.mengirim": { default: "Mengirim…", en: "Sending…" },

  // THE OUTCOMES. "Already answered" is a CONFIRMATION rather than a refusal:
  // WP7B refuses the second write by row lock, so a learner meeting this
  // sentence has answers safely recorded from an earlier press whose
  // acknowledgement was lost. And an unrecognised outcome says that nothing is
  // known and offers a way to find out, never "send it again".
  "umpanbalik.kirim.tercatat": { default: "Terima kasih. Jawaban Anda sudah tercatat.", en: "Thank you. Your answers have been recorded." },
  "umpanbalik.kirim.sudah": { default: "Jawaban Anda untuk kelas ini sudah tercatat sebelumnya.", en: "Your answers for this class were already recorded." },
  "umpanbalik.kirim.tutup": { default: "Putaran umpan balik ini sudah ditutup.", en: "This round of feedback has closed." },
  "umpanbalik.kirim.bukan_milik": { default: "Tidak ada umpan balik yang bisa Anda isi di sini.", en: "There is no feedback here for you to give." },
  "umpanbalik.kirim.belum_lengkap": { default: "Semua pertanyaan perlu dijawab.", en: "Every question needs an answer." },
  "umpanbalik.kirim.belum_terkirim": { default: "Jawaban Anda belum terkirim. Anda bisa mengirimnya lagi sekarang.", en: "Your answers were not sent. You can send them again now." },
  "umpanbalik.kirim.tak_pasti": { default: "Sambungan terputus sebelum ada jawaban pasti. Buka kembali halaman ini untuk melihat keadaannya.", en: "The connection dropped before there was a definite answer. Open this page again to see where things stand." },

  "umpanbalik.selesai.judul": { default: "Sudah terkirim", en: "Sent" },
  "umpanbalik.selesai.arti": { default: "Jawaban Anda bergabung dengan jawaban teman sekelas Anda menjadi satu ringkasan.", en: "Your answers join your classmates' into a single summary." },

  "umpanbalik.guru.judul": { default: "Umpan balik kelas", en: "Class feedback" },
  "umpanbalik.guru.intro": { default: "Apa yang dipilih kelas ini pada lima pertanyaan yang sama untuk semua.", en: "What this class chose on the same five questions everyone is asked." },
  "umpanbalik.guru.kosong": { default: "Belum ada putaran umpan balik untuk kelas ini.", en: "No round of feedback has been held for this class yet." },
  "umpanbalik.guru.buka": { default: "Lihat", en: "Open" },
  // ONE INPUT, AND WHAT IT IS AN INPUT OF. Said positively rather than as a
  // list of things it is not: a sentence that has to deny being an appraisal
  // has already put the idea on the screen.
  "umpanbalik.guru.guna": { default: "Ini bahan refleksi: yang tercatat adalah pilihan yang dibuat satu kelas.", en: "This is material for reflection: what is recorded is the choices one class made." },

  "umpanbalik.pimpinan.judul": { default: "Umpan balik kelas", en: "Class feedback" },
  "umpanbalik.pimpinan.sub": { default: "Satu kelas dan guru yang mengajarnya.", en: "One class and the educator who taught it." },
  "umpanbalik.pimpinan.kosong": { default: "Belum ada putaran umpan balik di bagian ini.", en: "No round of feedback has been held in this part of the school yet." },
  "umpanbalik.pimpinan.buka": { default: "Buka umpan balik kelas", en: "Open class feedback" },

  "umpanbalik.kembali": { default: "Kembali", en: "Back" },
  "umpanbalik.ditolak": { default: "Umpan balik ini bukan milik Anda untuk dibaca.", en: "This feedback is not yours to read." },

  // ── WP7D. CLOSING A ROUND, AND SAYING WHAT THAT MEANS WITHOUT SAYING WHAT
  // IS IN IT. The confirmation has to be honest about consequence — collection
  // ends and the round does not come back — while naming no count, no
  // threshold and nothing from which either could be worked out. That is the
  // whole difficulty of this copy: "are you sure" is easy, and "are you sure,
  // and no I will not tell you how many have answered" is the sentence that
  // actually has to be written.
  //
  // IT ALSO DOES NOT PROMISE AN OUTCOME. Whether the round publishes is
  // decided inside the endpoint against the threshold the cycle bound, so the
  // copy says PINTAR decides and stops there. A sentence hinting which way it
  // will go would be this surface doing the arithmetic it must not do.
  "umpanbalik.tutup.aksi": { default: "Tutup putaran ini", en: "Close this round" },
  "umpanbalik.tutup.judul": { default: "Menutup putaran", en: "Closing the round" },
  "umpanbalik.tutup.arti": { default: "Menutup akan mengakhiri pengumpulan tanggapan untuk kelas ini. Setelah itu PINTAR sendiri yang menentukan apakah hasilnya dapat ditampilkan.", en: "Closing ends the collection of responses for this class. After that PINTAR itself decides whether the results can be shown." },
  "umpanbalik.tutup.akhir": { default: "Putaran yang sudah ditutup tidak dibuka lagi.", en: "A round that has been closed is not opened again." },
  "umpanbalik.tutup.ya": { default: "Ya, tutup putaran", en: "Yes, close the round" },
  "umpanbalik.tutup.batal": { default: "Batal", en: "Cancel" },
  "umpanbalik.tutup.menutup": { default: "Menutup…", en: "Closing…" },
  "umpanbalik.tutup.tertutup": { default: "Putaran ini sudah ditutup.", en: "This round is now closed." },
  "umpanbalik.tutup.sudah": { default: "Putaran ini sudah ditutup sebelumnya.", en: "This round had already been closed." },
  "umpanbalik.tutup.bukan_wewenang": { default: "Putaran ini bukan wewenang Anda untuk ditutup.", en: "This round is not yours to close." },
  "umpanbalik.tutup.subjek": { default: "Putaran tentang pengajaran Anda sendiri ditutup oleh orang lain.", en: "A round about your own teaching is closed by somebody else." },
  "umpanbalik.tutup.belum": { default: "Putaran ini belum ditutup.", en: "This round has not been closed." },
  "umpanbalik.tutup.tak_pasti": { default: "Sambungan terputus sebelum ada jawaban pasti. Buka kembali halaman ini untuk melihat keadaannya.", en: "The connection dropped before there was a definite answer. Open this page again to see where things stand." },
  "umpanbalik.tutup.selesai": { default: "Pengumpulan tanggapan untuk putaran ini sudah berakhir.", en: "Collection of responses for this round has ended." },

  // ── WP7D resume. STARTING A ROUND.
  //
  // THE HARD SENTENCES HERE ARE THE REFUSALS, and each one is a real thing
  // that can happen between naming an educator and pressing the button: an
  // assignment ended, authority withdrawn, a colleague opened the round first.
  // Discovery describes the world a moment ago and opening re-decides, so each
  // refusal says what changed in plain words rather than collapsing into "that
  // did not work".
  //
  // AND THE ACADEMIC REFUSAL SAYS WHAT IT IS AND STOPS. PINTAR does not offer
  // to find another class, does not suggest a way round it, and does not hint
  // that the answer might differ if asked again. WP7B decided that boundary
  // conservatively on purpose; this reports it.
  "umpanbalik.kelas.judul": { default: "Kelas di bagian ini", en: "Classes in this part of the school" },
  "umpanbalik.kelas.sub": { default: "Putaran umpan balik dimulai untuk satu kelas dan satu pengajarnya.", en: "A feedback round is started for one class and one of its educators." },
  "umpanbalik.kelas.kosong": { default: "Belum ada kelas di bagian ini.", en: "There are no classes in this part of the school yet." },
  "umpanbalik.kelas.buka": { default: "Buka kelas", en: "Open class" },
  "umpanbalik.kelas.putaran": { default: "Putaran untuk kelas ini", en: "Rounds for this class" },

  "umpanbalik.buka.judul": { default: "Mulai putaran umpan balik", en: "Start a feedback round" },
  "umpanbalik.buka.sub": { default: "Pilih pengajar yang akan ditanyakan kepada kelas ini.", en: "Choose the educator this class will be asked about." },
  "umpanbalik.buka.kosong": { default: "Tidak ada pengajar yang bisa ditanyakan untuk kelas ini.", en: "There is no educator this class can be asked about." },
  "umpanbalik.buka.tanpa_wewenang": { default: "Kelas ini bukan wewenang Anda.", en: "This class is not yours." },
  "umpanbalik.buka.aksi": { default: "Mulai putaran", en: "Start a round" },
  "umpanbalik.buka.memulai": { default: "Memulai…", en: "Starting…" },
  "umpanbalik.buka.dibuka": { default: "Putaran umpan balik untuk kelas ini sudah dimulai.", en: "The feedback round for this class has started." },
  "umpanbalik.buka.sudah_ada": { default: "Kelas ini sudah punya putaran tentang pengajar itu pada periode ini.", en: "This class already has a round about that educator in this period." },
  "umpanbalik.buka.bukan_pengajar": { default: "Pengajar itu tidak lagi tercatat mengajar kelas ini.", en: "That educator is no longer recorded as teaching this class." },
  "umpanbalik.buka.bukan_wewenang": { default: "Kelas ini bukan wewenang Anda untuk memulai putaran.", en: "This class is not yours to start a round for." },
  "umpanbalik.buka.bukan_akademik": { default: "Kelas ini terhubung dengan materi di luar kurikulum akademik, sehingga putaran umpan balik tidak dibuka untuknya.", en: "This class is connected to material outside the academic curriculum, so a feedback round is not opened for it." },
  "umpanbalik.buka.kelas_belum_siap": { default: "Kelas ini belum siap untuk putaran umpan balik.", en: "This class is not ready for a feedback round." },
  "umpanbalik.buka.belum_siap": { default: "PINTAR belum siap memulai putaran umpan balik.", en: "PINTAR is not ready to start a feedback round." },
  "umpanbalik.buka.subjek_sendiri": { default: "Putaran tentang pengajaran Anda sendiri dimulai oleh orang lain.", en: "A round about your own teaching is started by somebody else." },
  "umpanbalik.buka.tak_pasti": { default: "Sambungan terputus sebelum ada jawaban pasti. Buka kembali halaman ini untuk melihat keadaannya.", en: "The connection dropped before there was a definite answer. Open this page again to see where things stand." },
  "mengajar.kembali": { default: "Kelas", en: "Classes" },
  "mengajar.sapa.pagi": { default: "Selamat pagi", en: "Good morning" },
  "mengajar.sapa.siang": { default: "Selamat siang", en: "Good afternoon" },
  "mengajar.sapa.sore": { default: "Selamat sore", en: "Good evening" },
  "mengajar.sapa.malam": { default: "Selamat malam", en: "Good evening" },
  "mengajar.beranda.intro": { default: "Satu hal yang paling layak dikerjakan lebih dulu, lalu kelas dalam lingkup mengajar Anda.", en: "The one thing most worth doing first, then the classes in your teaching scope." },
  "mengajar.layak.eyebrow": { default: "Layak dikerjakan lebih dulu", en: "Worth doing first" },
  "mengajar.layak.kosong": { default: "Tidak ada yang menunggu keputusan Anda hari ini.", en: "Nothing is waiting on your decision today." },
  "mengajar.layak.sebab": { default: "Sudah diterbitkan sekolah dan bisa disediakan kapan pun Anda siap.", en: "Published by the school and can be made available whenever you are ready." },
  "mengajar.layak.terbit": { default: "sudah diterbitkan sekolah, tetapi belum disediakan untuk", en: "is published by the school, but is not yet available to" },
  "mengajar.aksi.siapkan": { default: "Siapkan", en: "Prepare" },
  "mengajar.aksi.lihat": { default: "Lihat", en: "Look at" },
  "mengajar.untuk": { default: "untuk", en: "for" },
  "mengajar.kelas.judul": { default: "Kelas dalam lingkup mengajar Anda", en: "Classes in your teaching scope" },
  "mengajar.kelas.sub": { default: "Berdasarkan penugasan dari sekolah. PINTAR tidak menandai kelas sebagai milik seseorang; yang tampil adalah kelas yang tercakup dalam penugasan Anda.", en: "Based on the school's assignments. PINTAR does not mark a class as anyone's; what appears is the classes covered by your assignment." },
  "mengajar.kelas.kosong": { default: "Belum ada kelas dalam lingkup mengajar Anda. Sekolah yang menetapkannya.", en: "There is no class in your teaching scope yet. The school sets that." },
  "mengajar.berjalan.judul": { default: "Sedang berjalan", en: "Currently open" },
  "mengajar.berjalan.kelas": { default: "Yang sedang berjalan di kelas ini", en: "Open in this class right now" },
  "mengajar.berjalan.kosong": { default: "Tidak ada yang sedang berjalan.", en: "Nothing is open right now." },
  "mengajar.melihat": { default: "Anda sedang melihat", en: "You are viewing" },
  "mengajar.kelas.intro": { default: "Kelas ini tampil karena sekolah menugaskan Anda ke lingkup yang mencakupnya. Daftar murid berasal dari pendaftaran sekolah, bukan dari PINTAR.", en: "This class appears because the school assigned you to a scope that contains it. The learner list comes from the school's enrolment, not from PINTAR." },
  "mengajar.pindah": { default: "Pindah kelas", en: "Switch class" },
  "mengajar.fakta.mapel": { default: "Mata pelajaran", en: "Subject" },
  "mengajar.fakta.murid": { default: "Murid terdaftar", en: "Enrolled learners" },
  "mengajar.fakta.materi": { default: "Materi tersedia", en: "Material available" },
  "mengajar.fakta.materi.kosong": { default: "Belum ada", en: "None yet" },
  "mengajar.fakta.berubah": { default: "Perubahan terakhir", en: "Last changed" },
  "mengajar.aksi.uji_cepat": { default: "Uji Cepat", en: "Quick Assessment" },
  "mengajar.aksi.bukti": { default: "Lihat bukti", en: "See evidence" },
  "mengajar.aksi.langkah": { default: "Langkah berikutnya", en: "What next" },
  "mengajar.materi.judul": { default: "Materi untuk kelas ini", en: "Material for this class" },
  "mengajar.materi.sub": { default: "Urutan mengikuti kurikulum sekolah. Menyediakan materi tidak sama dengan menerbitkannya; penerbitan dilakukan sekolah.", en: "Order follows the school's curriculum. Making material available is not the same as publishing it; the school publishes." },
  "mengajar.materi.kosong": { default: "Belum ada materi yang disediakan untuk kelas ini.", en: "No material has been made available to this class yet." },
  "mengajar.murid.judul": { default: "Murid", en: "Learners" },
  "mengajar.murid.sub": { default: "Nama diurutkan abjad; tidak ada peringkat.", en: "Names in alphabetical order; there is no ranking." },
  "mengajar.murid.kosong": { default: "Belum ada murid terdaftar di kelas ini.", en: "No learner is enrolled in this class yet." },
  "mengajar.status.tersedia": { default: "Tersedia", en: "Available" },
  "mengajar.status.selesai": { default: "Selesai", en: "Finished" },
  "mengajar.status.belum": { default: "Belum disediakan", en: "Not yet available" },
  "mengajar.status.siap": { default: "Siap disediakan", en: "Ready to make available" },
  "mengajar.status.berjalan": { default: "Berjalan", en: "Open" },
  "mengajar.siap.langkah1": { default: "Pilih materi", en: "Choose material" },
  "mengajar.siap.langkah2": { default: "Tinjau yang akan diterima murid", en: "Review what learners receive" },
  "mengajar.siap.langkah3": { default: "Sediakan", en: "Make available" },
  "mengajar.siap.eyebrow": { default: "Siapkan materi", en: "Prepare learning" },
  "mengajar.siap.judul": { default: "Yang akan diterima murid", en: "What learners will receive" },
  "mengajar.siap.intro": { default: "Belum ada yang berubah untuk murid. Semua di bawah ini baru berlaku setelah Anda menekan tombol sediakan di bagian akhir.", en: "Nothing has changed for learners yet. Everything below only takes effect after you press the make-available button at the end." },
  "mengajar.siap.pilih": { default: "Pilih materi yang akan disediakan", en: "Choose the material to make available" },
  "mengajar.siap.pilih.kosong": { default: "Belum ada materi terbitan sekolah yang bisa disediakan untuk kelas ini.", en: "The school has published no material that can be made available to this class yet." },
  "mengajar.siap.terbitan": { default: "Terbitan", en: "Release" },
  "mengajar.siap.diterbitkan": { default: "diterbitkan sekolah", en: "published by the school" },
  "mengajar.siap.pelajaran": { default: "pelajaran", en: "lessons" },
  "mengajar.siap.soal": { default: "soal", en: "items" },
  "mengajar.siap.terima": { default: "Yang akan diterima murid", en: "What learners receive" },
  "mengajar.siap.jendela": { default: "Jendela", en: "Window" },
  "mengajar.siap.jendela.arti": { default: "Murid melihat materi ini di halaman Belajar selama jendela terbuka.", en: "Learners see this material on their Learning page while the window is open." },
  "mengajar.siap.mulai": { default: "Mulai", en: "From" },
  "mengajar.siap.sampai": { default: "Sampai", en: "Until" },
  "mengajar.siap.sampai.kosong": { default: "Tanpa batas akhir", en: "No end date" },
  "mengajar.siap.disediakan": { default: "Disediakan untuk", en: "Made available to" },
  "mengajar.siap.dipilih": { default: "dipilih", en: "selected" },
  "mengajar.siap.terdaftar": { default: "murid terdaftar hari ini", en: "learners enrolled today" },
  "mengajar.siap.tinjau": { default: "Tinjauan sebelum disediakan", en: "Review before making available" },
  "mengajar.siap.akibat.1": { default: "Setelah disediakan,", en: "Once made available," },
  "mengajar.siap.akibat.2": { default: "akan melihat materi ini di halaman Belajar mereka.", en: "will see this material on their Learning page." },
  "mengajar.siap.akibat.3": { default: "Anda bisa mengubah jendelanya nanti, tetapi tidak bisa menarik kembali pekerjaan yang sudah dimulai murid.", en: "You can change the window later, but you cannot take back work a learner has already started." },
  "mengajar.siap.komit": { default: "Sediakan", en: "Make available" },
  "mengajar.siap.kembali": { default: "Kembali ke pilihan materi", en: "Back to material choice" },
  "mengajar.instrumen.PRE_TEST": { default: "Pemetaan Awal", en: "Initial Mapping" },
  "mengajar.instrumen.POST_TEST": { default: "Uji Penguasaan", en: "Mastery Check" },
  "mengajar.instrumen.STANDALONE": { default: "Asesmen mandiri", en: "Standalone assessment" },
  "mengajar.instrumen.sertifikat": { default: "Sertifikat", en: "Certificate" },
  "mengajar.instrumen.sertifikat.arti": { default: "Diterbitkan sekolah bila murid memenuhi capaian; bisa diperiksa siapa pun lewat tautan.", en: "Issued by the school when a learner meets the standard; anyone can check it through its link." },
  "mengajar.percobaan": { default: "kesempatan", en: "attempt" },
  "mengajar.cepat.eyebrow": { default: "Uji Cepat", en: "Quick Assessment" },
  "mengajar.cepat.judul": { default: "Uji Cepat", en: "Quick Assessment" },
  "mengajar.cepat.intro": { default: "Beberapa soal untuk mengecek pemahaman hari ini. Hasilnya dinilai seperti asesmen lain dan dapat menjadi bagian dari bukti pembelajaran yang dipakai saat menentukan kelayakan sertifikat.", en: "A few items to check today's understanding. The result is scored like any other assessment and may contribute to the learning evidence used when certificate eligibility is determined." },
  "mengajar.cepat.langkah1": { default: "Atur", en: "Configure" },
  "mengajar.cepat.langkah2": { default: "Tinjau", en: "Review" },
  "mengajar.cepat.langkah3": { default: "Sediakan", en: "Make available" },
  "mengajar.cepat.bab": { default: "Bab", en: "Chapter" },
  "mengajar.cepat.bab.arti": { default: "Soal diambil dari terbitan yang sudah diterbitkan sekolah untuk bab ini.", en: "Items come from the release the school has published for this chapter." },
  "mengajar.cepat.bab.kosong": { default: "Belum ada bab yang disediakan untuk kelas ini, jadi belum ada soal yang bisa diambil.", en: "No chapter has been made available to this class yet, so there are no items to draw from." },
  "mengajar.cepat.jumlah": { default: "Jumlah soal", en: "Number of items" },
  "mengajar.cepat.jumlah.arti": { default: "Batas ini ditetapkan platform, bukan oleh halaman ini.", en: "This bound is set by the platform, not by this page." },
  "mengajar.cepat.jendela": { default: "Jendela", en: "Window" },
  "mengajar.cepat.jendela.arti": { default: "Berhitung sejak disediakan. Tiap murid mendapat satu kesempatan.", en: "Counted from the moment it is made available. Each learner gets one attempt." },
  "mengajar.cepat.menit": { default: "menit", en: "min" },
  "mengajar.cepat.untuk": { default: "Untuk", en: "For" },
  "mengajar.cepat.lanjut": { default: "Lanjut ke tinjauan", en: "Continue to review" },
  "mengajar.cepat.tinjau": { default: "Yang akan terjadi", en: "What will happen" },
  "mengajar.cepat.rv1": { default: "Murid kelas ini yang masuk PINTAR melihat Uji Cepat itu di halaman Belajar mereka.", en: "Learners in this class who are signed in see that Quick Assessment on their Learning page." },
  "mengajar.cepat.rv2": { default: "Satu kesempatan untuk tiap murid, dan jendelanya mulai berjalan begitu disediakan.", en: "One attempt for each learner, and the window starts the moment it is made available." },
  "mengajar.cepat.rv3": { default: "Hasilnya tercatat sebagai bukti pembelajaran dan dapat dipakai saat menentukan kelayakan sertifikat. Satu Uji Cepat tidak menerbitkan sertifikat; penerbitan dilakukan sekolah.", en: "The result is recorded as learning evidence and may be used when certificate eligibility is determined. One Quick Assessment does not issue a certificate; the school issues." },
  "mengajar.cepat.rv4": { default: "Murid yang tidak sempat mengerjakan tidak dicatat sebagai tidak mampu — tercatat belum mengumpulkan.", en: "A learner who does not get to it is not recorded as unable — only as not yet submitted." },
  "mengajar.cepat.akibat": { default: "Begitu disediakan, jendela mulai berjalan untuk semua murid dan murid bisa langsung mulai mengerjakan.", en: "The moment it is made available, the window starts for every learner and they can begin straight away." },
  "mengajar.cepat.komit": { default: "Sediakan Uji Cepat sekarang", en: "Make the Quick Assessment available now" },
  "mengajar.cepat.ubah": { default: "Ubah pengaturan", en: "Change settings" },
  "mengajar.cepat.hidup.eyebrow": { default: "Tersedia untuk kelas ini", en: "Available to this class" },
  "mengajar.cepat.hidup.judul": { default: "Uji Cepat sedang berjalan", en: "The Quick Assessment is open" },
  "mengajar.cepat.hidup.kumpul": { default: "Sudah mengumpulkan", en: "Submitted" },
  "mengajar.cepat.hidup.sisa": { default: "Sisa waktu", en: "Time left" },
  "mengajar.cepat.hidup.menit": { default: "menit lagi", en: "min left" },
  "mengajar.cepat.hidup.catatan": { default: "Angka di atas adalah hitungan, bukan penilaian. Yang belum mengumpulkan mungkin belum membuka PINTAR.", en: "The numbers above are counts, not judgments. Those who have not submitted may simply not have opened PINTAR." },
  "mengajar.cepat.hidup.siapa": { default: "Lihat siapa yang sudah mengumpulkan", en: "See who has submitted" },
  "mengajar.cepat.sudah_ada": { default: "Sudah ada Uji Cepat yang berjalan di kelas ini. Tunggu jendelanya berakhir sebelum menyediakan yang berikutnya.", en: "A Quick Assessment is already open in this class. Wait for its window to end before making another available." },
  "mengajar.bukti.eyebrow": { default: "Bukti", en: "Evidence" },
  "mengajar.bukti.judul": { default: "Apa yang sudah bisa disimpulkan", en: "What can be concluded so far" },
  "mengajar.bukti.intro": { default: "PINTAR hanya menyimpulkan bila bukti resminya cukup. Belum cukup bukan berarti buruk — artinya belum.", en: "PINTAR only concludes when the official evidence is enough. Not yet enough does not mean bad — it means not yet." },
  "mengajar.bukti.keadaan": { default: "Keadaan hari ini", en: "Where things stand today" },
  "mengajar.bukti.kumpul": { default: "Mengumpulkan", en: "Submitted" },
  "mengajar.bukti.jendela": { default: "Jendela", en: "Window" },
  "mengajar.bukti.belum": { default: "Belum mengerjakan", en: "Not yet attempted" },
  "mengajar.bukti.murid": { default: "murid", en: "learners" },
  "mengajar.bukti.poin": { default: "poin", en: "points" },
  "mengajar.bukti.bagian": { default: "Penguasaan per bagian", en: "Mastery by part" },
  "mengajar.bukti.keliru": { default: "Pemahaman keliru yang berulang di kelas ini", en: "Recurring misunderstandings in this class" },
  "mengajar.bukti.kali": { default: "kali", en: "times" },
  "mengajar.bukti.kosong": { default: "Belum ada asesmen yang berjalan atau selesai di kelas ini, jadi belum ada keadaan untuk dilaporkan.", en: "No assessment is open or finished in this class yet, so there is nothing to report on." },
  "mengajar.bukti.simpulan": { default: "Kesimpulan", en: "Conclusions" },
  "mengajar.bukti.kaki": { default: "Yang tidak tampil di sini: penilaian per soal dan sinyal integritas. Keduanya ditinjau Kepala Departemen, bukan pengajar.", en: "Not shown here: item-level review and integrity signals. Both are reviewed by the Head of Department, not the educator." },
  "mengajar.langkah.eyebrow": { default: "Langkah berikutnya", en: "What next" },
  "mengajar.langkah.judul": { default: "Yang bisa Anda lakukan sekarang", en: "What you can do now" },
  "mengajar.langkah.intro": { default: "Diurutkan dari yang paling masuk akal hari ini, berdasarkan apa yang PINTAR tahu tentang kelas ini.", en: "Ordered by what makes most sense today, from what PINTAR knows about this class." },
  "mengajar.langkah.buka": { default: "Buka", en: "Open" },
  "mengajar.langkah.f1": { default: "Lihat murid yang belum mengumpulkan", en: "See the learners who have not submitted" },
  "mengajar.langkah.f1w": { default: "Selama jendela masih terbuka. Ini daftar, bukan peringkat.", en: "While the window is still open. This is a list, not a ranking." },
  "mengajar.langkah.f2": { default: "Ubah jendela asesmen yang berjalan", en: "Change the window of an open assessment" },
  "mengajar.langkah.f2w": { default: "Bila kelas butuh waktu lebih. Murid melihat jendela yang baru di halaman Belajar mereka.", en: "If the class needs more time. Learners see the new window on their Learning page." },
  "mengajar.langkah.f3": { default: "Beri waktu tambahan untuk satu murid", en: "Give one learner extra time" },
  "mengajar.langkah.f3w": { default: "Untuk sesi yang terputus atau alasan lain yang sah. Dicatat dengan alasan; tidak mengubah sesi murid lain.", en: "For an interrupted session or another legitimate reason. Recorded with a reason; other learners' sessions are unchanged." },
  "mengajar.langkah.f4": { default: "Siapkan materi berikutnya untuk kelas ini", en: "Prepare the next material for this class" },
  "mengajar.langkah.f4w": { default: "Sudah diterbitkan sekolah. Bisa disediakan sekarang; murid mulai sesuai jendela yang Anda pilih.", en: "Published by the school. Can be made available now; learners start according to the window you choose." },
  "mengajar.langkah.f5": { default: "Uji Cepat untuk mengecek pemahaman hari ini", en: "Quick Assessment to check today's understanding" },
  "mengajar.langkah.f5w": { default: "Beberapa soal, satu jendela pendek. Hasilnya menjadi bukti pembelajaran seperti asesmen lain.", en: "A few items, one short window. The result becomes learning evidence like any other assessment." },
  "mengajar.langkah.f6": { default: "Susun materi sendiri", en: "Draft your own material" },
  "mengajar.langkah.f6w": { default: "Anda bisa menyusun dan mengunggah. Persetujuan dan penerbitan dilakukan Kepala Departemen dan sekolah.", en: "You can draft and upload. Approval and publishing are done by the Head of Department and the school." },
  "mengajar.langkah.quiet": { default: "Ringkasan berkala untuk kelas ini belum ada; akan muncul di sini bila sudah tersedia. Yang tidak ada di daftar ini — penilaian per soal dan sinyal integritas — bukan bagian dari peran pengajar.", en: "There is no periodic briefing for this class yet; it will appear here when there is. What is not on this list — item review and integrity signals — is not part of the educator role." },
  "mengajar.siapa.judul": { default: "Siapa yang sudah mengumpulkan", en: "Who has submitted" },
  "mengajar.siapa.sudah": { default: "Sudah mengumpulkan", en: "Have submitted" },
  "mengajar.siapa.belum": { default: "Belum mengumpulkan", en: "Have not submitted yet" },
  "mengajar.siapa.catatan": { default: "Dua daftar nama, diurutkan abjad. Bukan peringkat, bukan penilaian, dan tidak menyebut sebabnya — PINTAR tidak tahu sebabnya.", en: "Two lists of names in alphabetical order. Not a ranking, not a judgment, and it names no reason — PINTAR does not know the reason." },
};

/** Words that must never appear on a learner-facing surface (doc 12 "complexity leaking"). */
export const INTERNAL_WORDS = [
  "PINTAR 4.0", "FROZEN", "SUPERSEDED", "VALIDATION_FAILED", "IN_REVIEW", "INGESTED", "STRUCTURED",
  "SYNTHETIC", "PUBLIC_DEMO", "PREVIEW", "OFFICIAL", "evidence_class", "Menunggu", "Wrong", "Failed",
  "Salah", "Incorrect", "Penalty",
];

export function t(
  event: HleEvent,
  persona: Persona = "learner",
  ctx: TellingContext = {},
): string {
  const row = table[event];
  const locale: Locale = ctx.locale ?? "id";

  // Stage first, because a stage override is a whole sentence written for this
  // reader rather than a variation on the persona one. Learner keys only, and
  // only for a learner: see the note on `stageTable`.
  let value: string | undefined;
  if (persona === "learner" && ctx.stage) {
    const staged = stageTable[event]?.[ctx.stage];
    if (staged) value = locale === "en" ? staged.en : staged.id;
  }
  if (value === undefined) {
    value = locale === "en"
      ? (row[`en_${persona}` as keyof Telling] as string | undefined) ?? row.en
      : (row[persona] as string | undefined) ?? row.default;
  }

  // THE GUARD NOW COVERS EVERY PERSONA (UX-1 Slice 0, S0.2). It used to run for
  // a learner and the public only, which left the widest half of the copy table
  // — everything a teacher or an administrator reads — unchecked against the
  // same word list. A staff reader is still a human, and doc 12's "complexity
  // leaking" says nothing about audience.
  //
  // The exemption is not "staff", it is STAFF_ONLY_PREFIXES: the keys that are
  // declared to belong to a staff-only surface and are never addressed to a
  // learner or to the public. That declaration is already asserted from the
  // other side by F05-S03, which fails if a learner surface renders one. So the
  // allow-list is a scoped statement about audience, not a hole.
  if (!isStaffOnly(event)) {
    for (const w of INTERNAL_WORDS) {
      if (value.includes(w)) {
        throw new Error(
          `HLE: internal word "${w}" would reach a ${persona} surface in ${locale} via ${event}`,
        );
      }
    }
  }
  return value;
}

/**
 * Numbers and dates in the reader's language, on Jakarta time.
 *
 * ONE helper, not a formatting call per surface: `id-ID` writes a decimal comma
 * and `en-ID` an English decimal point over the same Indonesian context, and a
 * surface that reached for `toLocaleString()` on its own would quietly pick the
 * server's locale instead. The timezone is fixed at Asia/Jakarta and does not
 * follow the interface language — changing what language a page is written in
 * must never change what day a certificate was issued.
 */
const LOCALE_TAG: Record<Locale, string> = { id: "id-ID", en: "en-ID" };
export const TIMEZONE = "Asia/Jakarta";

export const format = {
  number(value: number, locale: Locale = "id", options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(LOCALE_TAG[locale], options).format(value);
  },
  percent(value: number, locale: Locale = "id"): string {
    return new Intl.NumberFormat(LOCALE_TAG[locale], {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(value);
  },
  /** A day a human reads. `iso` is the stored issue instant; never re-derived. */
  date(iso: string, locale: Locale = "id"): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIMEZONE,
    }).format(d);
  },
};

/** For tests: every key, every persona, rendered. */
/**
 * Keys that belong to a staff-only surface and are never addressed to a
 * learner or to the public.
 *
 * ADDED IN FABLE-05. Studio is staff-only, and staff Indonesian legitimately
 * uses words that are forbidden on a learner screen -- "Menunggu tindakan
 * Anda" is the ordinary way to say a queue is waiting for you, while the same
 * word on a learner's screen is the system telling a child to wait, which is
 * what doc 12 calls complexity leaking.
 *
 * This is a declaration about AUDIENCE, not an exemption from the rule. `t()`
 * still throws if one of these keys is ever rendered for a learner or the
 * public -- which is exactly the protection wanted -- and `renderAll()` simply
 * does not ask for a rendering that would be a bug to perform. A key not
 * listed here is still rendered for every persona and still audited.
 */
const STAFF_ONLY_PREFIXES = ["studio.", "config.", "pimpinan.", "pendataan."] as const;

export function isStaffOnly(event: HleEvent): boolean {
  return STAFF_ONLY_PREFIXES.some((p) => event.startsWith(p));
}

export const LOCALES: readonly Locale[] = ["id", "en"] as const;
export const STAGES: readonly Stage[] = ["SD", "SMP", "SMA", "UNIVERSITAS"] as const;

export function renderAll(): Array<{ event: HleEvent; persona: Persona; locale: Locale; text: string }> {
  const out: Array<{ event: HleEvent; persona: Persona; locale: Locale; text: string }> = [];
  for (const event of Object.keys(table) as HleEvent[]) {
    const personas: Persona[] = isStaffOnly(event)
      ? ["educator", "staff"]
      : ["learner", "educator", "staff", "public"];
    for (const persona of personas) {
      for (const locale of LOCALES) {
        out.push({ event, persona, locale, text: t(event, persona, { locale }) });
        // and every stage telling a learner can receive, so an override that
        // smuggles in an internal word is caught by the same sweep
        if (persona === "learner" && stageTable[event]) {
          for (const stage of STAGES) {
            if (stageTable[event]?.[stage]) {
              out.push({ event, persona, locale, text: t(event, persona, { locale, stage }) });
            }
          }
        }
      }
    }
  }
  return out;
}

/** For tests: every key, so a language sweep can assert both tellings exist. */
export function allKeys(): HleEvent[] {
  return Object.keys(table) as HleEvent[];
}

/** For tests: the raw row, so a language sweep reads the table, not a render. */
export function telling(event: HleEvent): Telling {
  return table[event];
}

/**
 * An enum value rendered for a human. Never the identifier itself.
 *
 * F06-S03 refuses `{x.mode}` in a text position; this is what goes there
 * instead. An unmapped value falls back to an em dash rather than to the raw
 * identifier, because a missing translation must not silently become the leak
 * the rule exists to prevent.
 */
export function enumLabel(
  kind: "bank" | "mode" | "integritas",
  value: string | null | undefined,
  locale: Locale = "id",
): string {
  if (!value) return "—";
  const key = `jenis.${kind}.${value}` as HleEvent;
  try {
    return t(key, "staff", { locale });
  } catch {
    return "—";
  }
}
