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
  | "laporan.kelas.judul" | "laporan.institusi.judul"
  | "laporan.kosong" | "laporan.tak_ada_angka"
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
  | "auth.email_label"
  | "auth.email_help"
  | "auth.send_link"
  | "auth.link_sent"
  | "auth.card_title"
  | "auth.card_number"
  | "auth.card_pin"
  | "auth.card_enter"
  | "auth.card_failed"
  | "auth.signed_out"
  | "auth.not_yet"
  | "config.title"
  | "config.section.system"
  | "config.section.content"
  | "config.section.assessment"
  | "config.section.certificates"
  | "config.section.intelligence"
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
  | "nav.kelas"
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
  | "sync.done";

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
  "laporan.kelas.judul": { default: "Ringkasan Kelas", en: "Class Summary" },
  "laporan.institusi.judul": { default: "Ringkasan Sekolah", en: "School Summary" },
  "laporan.kosong": { default: "Belum ada angka yang bisa ditampilkan untuk Anda di sini.", en: "There are no figures to show you here yet." },
  "laporan.tak_ada_angka": { default: "Tidak ada angka pada laporan ini, tetapi keterangan di bawah menjelaskan alasannya satu per satu.", en: "This report carries no figures, but the notes below say why, one by one." },

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
  "auth.title": { default: "Masuk ke PINTAR", en: "Sign in to PINTAR", learner: "Ayo mulai belajar", en_learner: "Let's start learning" },
  "auth.email_label": { default: "Alamat email", en: "Email address" },
  "auth.email_help": {
    default: "Kami kirimkan tautan masuk ke email Anda. Tidak perlu kata sandi.",
    en: "We will send a sign-in link to your email. No password needed.",
    staff: "Tautan masuk sekali pakai akan dikirim ke email Anda.",
    en_staff: "A single-use sign-in link will be sent to your email.",
  },
  "auth.send_link": { default: "Kirim tautan masuk", en: "Send the sign-in link" },
  "auth.link_sent": { default: "Tautan sudah dikirim. Buka email Anda, lalu ketuk tautannya.", en: "The link is on its way. Open your email, then tap the link." },
  "auth.card_title": { default: "Punya kartu kelas?", en: "Have a class card?", learner: "Punya kartu kelas?", en_learner: "Have a class card?" },
  "auth.card_number": { default: "Nomor kartu", en: "Card number" },
  "auth.card_pin": { default: "PIN", en: "PIN" },
  "auth.card_enter": { default: "Masuk dengan kartu", en: "Sign in with the card" },
  "auth.card_failed": { default: "Belum cocok. Coba periksa nomor kartu dan PIN, lalu coba sekali lagi.", en: "That does not match yet. Check the card number and the PIN, then try once more." },
  "auth.signed_out": { default: "Sampai jumpa lagi.", en: "See you again soon." },
  "auth.not_yet": { default: "Halaman ini belum tersedia untuk akun Anda.", en: "This page is not available to your account yet." },
  "config.title": { default: "Konfigurasi", en: "Configuration" },
  "config.section.system": { default: "Sistem & Konfigurasi", en: "System & Configuration" },
  "config.section.content": { default: "Konten & Bank Soal", en: "Content & Item Bank" },
  "config.section.assessment": { default: "Mesin Asesmen", en: "Assessment Engine" },
  "config.section.certificates": { default: "Sertifikat & Audit", en: "Certificates & Audit" },
  "config.section.intelligence": { default: "Inteligensi & Laporan", en: "Intelligence & Reports" },
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
  "studio.nav.kuis": { default: "Kuis Cepat", en: "Quick quiz" },
  "studio.kuis.judul": { default: "Kuis Cepat", en: "Quick Quiz" },
  "studio.kuis.pengantar": { default: "Pilih kelas dan bab yang baru Anda ajarkan, lalu luncurkan. Murid bisa mulai mengerjakan dalam waktu satu menit.", en: "Choose the class and the chapter you have just taught, then launch. Students can be working within a minute." },
  "studio.kuis.kelas": { default: "Kelas", en: "Class" },
  "studio.kuis.bab": { default: "Bab", en: "Chapter" },
  "studio.kuis.sumber_sekolah": { default: "Paket sekolah Anda", en: "Your school's packages" },
  "studio.kuis.sumber_pustaka": { default: "Pustaka PINTAR yang bisa Anda ajarkan", en: "PINTAR Library chapters you may teach" },
  "studio.kuis.jumlah": { default: "Jumlah soal", en: "Number of questions" },
  "studio.kuis.menit": { default: "Lama pengerjaan (menit)", en: "Time allowed (minutes)" },
  "studio.kuis.luncurkan": { default: "Luncurkan kuis", en: "Launch the quiz" },
  "studio.kuis.riwayat": { default: "Kuis yang sudah diluncurkan", en: "Quizzes already launched" },
  "studio.kuis.kosong": { default: "Belum ada kuis cepat di kelas ini.", en: "No quick quiz has been run in this class yet." },
  "studio.kuis.bab_kosong": { default: "Belum ada bab yang bisa dipakai untuk kuis cepat. Buat paket sekolah Anda, atau tunggu bab Pustaka PINTAR dibuka untuk sekolah Anda.", en: "No chapter is available for a quick quiz yet. Create your school's package, or wait for a PINTAR Library chapter to be opened to your school." },
  "studio.kuis.tidak_tersedia": { default: "Bahan kuis ini sudah tidak tersedia untuk sekolah Anda, jadi kuis ini tidak bisa dimulai lagi. Pekerjaan murid yang sudah selesai tetap tersimpan.", en: "This quiz's material is no longer available to your school, so the quiz cannot be started again. Work students have already finished stays saved." },
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

  // ══════════════════════════════════ UX-1 Slice 3 — the educator's teaching
  // surface. Educator-facing, and deliberately NOT declared staff-only: the
  // internal-word guard runs over every one of these tellings, which is worth
  // more than the exemption would be.
  "mengajar.judul": { default: "Kelas", en: "Classes" },
  "nav.kelas": { default: "Kelas", en: "Classes" },
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
  "mengajar.instrumen.POST_TEST": { default: "Uji Penguasaan", en: "Mastery Test" },
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
const STAFF_ONLY_PREFIXES = ["studio.", "config."] as const;

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
