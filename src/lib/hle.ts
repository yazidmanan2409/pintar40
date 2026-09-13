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
  | "sync.done";

type Table = Record<HleEvent, Partial<Record<Persona, string>> & { default: string }>;

const table: Table = {
  "verifikasi.judul": { default: "Verifikasi Sertifikat" },
  "verifikasi.status": { default: "Status" },
  "verifikasi.hasil": { default: "Hasil" },
  "verifikasi.lulus": { default: "Memenuhi capaian" },
  "verifikasi.belum_lulus": { default: "Belum memenuhi capaian" },
  "verifikasi.predikat": { default: "Predikat" },
  "verifikasi.institusi": { default: "Diterbitkan oleh" },
  "verifikasi.tanggal": { default: "Tanggal terbit" },
  "verifikasi.catatan": { default: "Halaman ini memastikan sertifikat yang Anda pegang benar diterbitkan. Nama pemegang tertera pada sertifikatnya." },
  "verifikasi.tidak_ditemukan": { default: "Sertifikat dengan tautan ini tidak ditemukan." },
  "verifikasi.tidak_sah": { default: "Data sertifikat ini tidak cocok dengan catatan penerbitnya." },
  "sertifikat.judul": { default: "Sertifikat" },
  "sertifikat.nomor": { default: "Nomor sertifikat" },
  "sertifikat.unduh": { default: "Tautan verifikasi" },
  "sertifikat.belum_ada": { default: "Belum ada sertifikat untuk pengerjaan ini." },
  "sertifikat.sedang_disiapkan": { default: "Sertifikat sedang disiapkan. Muat ulang halaman ini sebentar lagi." },

  "app.name": { default: "PINTAR" },
  "auth.title": { default: "Masuk ke PINTAR", learner: "Ayo mulai belajar" },
  "auth.email_label": { default: "Alamat email" },
  "auth.email_help": {
    default: "Kami kirimkan tautan masuk ke email kamu. Tidak perlu kata sandi.",
    staff: "Tautan masuk sekali pakai akan dikirim ke email Anda.",
  },
  "auth.send_link": { default: "Kirim tautan masuk" },
  "auth.link_sent": { default: "Tautan sudah dikirim. Buka email kamu, lalu ketuk tautannya." },
  "auth.card_title": { default: "Punya kartu kelas?", learner: "Punya kartu kelas?" },
  "auth.card_number": { default: "Nomor kartu" },
  "auth.card_pin": { default: "PIN" },
  "auth.card_enter": { default: "Masuk dengan kartu" },
  "auth.card_failed": { default: "Belum cocok. Coba periksa nomor kartu dan PIN, lalu coba sekali lagi." },
  "auth.signed_out": { default: "Sampai jumpa lagi." },
  "auth.not_yet": { default: "Halaman ini belum tersedia untuk akun kamu." },
  "config.title": { default: "Konfigurasi" },
  "config.section.system": { default: "Sistem & Konfigurasi" },
  "config.section.content": { default: "Konten & Bank Soal" },
  "config.section.assessment": { default: "Mesin Asesmen" },
  "config.section.certificates": { default: "Sertifikat & Audit" },
  "config.section.intelligence": { default: "Inteligensi & Laporan" },
  "config.card.health": { default: "Kesehatan sistem" },
  "config.card.cohorts": { default: "Kelas aktif" },
  "config.placeholder": { default: "Bagian ini akan terisi pada tahap berikutnya." },
  "config.environment": { default: "Lingkungan" },
  "config.refused": { default: "Halaman ini hanya untuk pengelola sistem." },
  "config.section.rollover": { default: "Pergantian tahun ajaran" },
  "config.section.transfers": { default: "Perpindahan peserta didik" },
  "config.section.roles": { default: "Peran & akses" },
  "config.section.audit": { default: "Jejak audit" },
  "config.section.flags": { default: "Fitur & saklar" },
  "config.action.rollover": { default: "Jalankan pergantian" },
  "config.action.request_transfer": { default: "Ajukan perpindahan" },
  "config.action.authorize": { default: "Setujui" },
  "config.action.execute": { default: "Laksanakan" },
  "config.action.reject": { default: "Tolak" },
  "config.action.grant": { default: "Berikan peran" },
  "config.action.revoke": { default: "Cabut" },
  "config.action.save": { default: "Simpan" },
  "config.result.ok": { default: "Selesai." },
  "config.result.failed": { default: "Belum berhasil." },
  "config.empty": { default: "Belum ada." },
  "config.label.period_from": { default: "Dari tahun ajaran" },
  "config.label.period_to": { default: "Ke tahun ajaran" },
  "config.label.mapping_help": { default: "Pilih kelas tujuan untuk setiap kelas asal. Keanggotaan lama ditutup, yang baru dibuat; riwayat tetap utuh." },
  "config.label.enrollment": { default: "Peserta didik (pendaftaran aktif)" },
  "config.label.destination_institution": { default: "Kode sekolah tujuan" },
  "config.label.destination_period": { default: "Kode tahun ajaran tujuan" },
  "config.label.destination_programme": { default: "Kode program tujuan (opsional)" },
  "config.label.destination_help": { default: "Kode tujuan diberikan oleh sekolah penerima. Persetujuan datang dari pihak lawan." },
  "config.label.reason": { default: "Alasan" },
  "config.label.person": { default: "Orang" },
  "config.label.role": { default: "Peran" },
  "config.label.scope": { default: "Lingkup" },
  "config.label.valid_until": { default: "Berlaku sampai" },
  "config.label.flag_key": { default: "Kunci fitur" },
  "config.label.enabled": { default: "Aktif" },
  "config.label.maintenance": { default: "Mode pemeliharaan" },
  "config.label.registration_lock": { default: "Kunci pendaftaran" },
  "config.label.when": { default: "Waktu" },
  "config.label.action": { default: "Tindakan" },
  "config.label.target": { default: "Sasaran" },
  "config.label.build": { default: "Versi" },
  "config.label.status": { default: "Status" },
  "config.label.not_rolled": { default: "— tidak dipindahkan —" },
  "role.EDUCATOR": { default: "Guru" },
  "role.HEAD_OF_DEPARTMENT": { default: "Kepala departemen" },
  "role.DEAN": { default: "Dekan" },
  "role.INSTITUTION_ADMIN": { default: "Admin sekolah" },
  "role.SYSTEM_ADMIN": { default: "Admin platform" },
  "transfer.REQUESTED": { default: "Diajukan" },
  "transfer.AUTHORIZED": { default: "Disetujui" },
  "transfer.EXECUTED": { default: "Selesai" },
  "transfer.REJECTED": { default: "Ditolak" },
  "transfer.CANCELLED": { default: "Dibatalkan" },
  "entry.title": { default: "Mau ke mana hari ini?" },
  "entry.learner": { default: "Saya mau belajar" },
  "entry.educator": { default: "Saya mengajar" },
  "entry.staff": { default: "Saya mengelola sekolah" },

  // ---------------------------------------------------------------- FABLE-03
  "cycle.title": { default: "Perjalanan belajarmu" },
  "cycle.none": { default: "Belum ada materi yang ditugaskan untukmu." },
  "cycle.step.pretest": { default: "Pemetaan Awal" },
  "cycle.step.map": { default: "Peta Bacaan Personal" },
  "cycle.step.lesson": { default: "Pelajaran" },
  "cycle.step.posttest": { default: "Uji Penguasaan" },
  "cycle.step.result": { default: "Hasil" },
  "cycle.open": { default: "Mulai" },
  "cycle.continue": { default: "Lanjutkan" },
  "cycle.locked_until_pretest": { default: "Terbuka setelah Pemetaan Awal selesai." },

  "pretest.title": { default: "Pemetaan Awal" },
  "pretest.intro": {
    default: "Ini bukan ujian. Jawabanmu dipakai untuk menyusun peta bacaan yang pas untukmu.",
  },
  "pretest.progress": { default: "Pertanyaan" },
  "pretest.next": { default: "Berikutnya" },
  "pretest.back": { default: "Kembali" },
  "pretest.finish": { default: "Selesaikan pemetaan" },
  "pretest.done": { default: "Pemetaan selesai. Peta bacaanmu sudah siap." },

  "map.title": { default: "Peta Bacaan Personal" },
  "map.intro": { default: "Mulailah dari kartu paling atas. Urutannya sudah disusun untukmu." },
  "map.tier.PERLU_SEGERA": { default: "Baca ini lebih dulu" },
  "map.tier.WAJIB": { default: "Perlu dibaca" },
  "map.tier.DISARANKAN": { default: "Sebaiknya dibaca" },
  "map.tier.KUAT": { default: "Sudah kamu kuasai" },
  "map.page": { default: "Bagian bacaan" },
  "map.to_lesson": { default: "Buka pelajarannya" },

  "lesson.title": { default: "Pelajaran" },
  "lesson.page_of": { default: "Halaman" },
  "lesson.prev": { default: "Halaman sebelumnya" },
  "lesson.next": { default: "Halaman berikutnya" },
  "lesson.transcript": { default: "Teks lengkap" },
  "lesson.speed": { default: "Kecepatan" },
  "lesson.example.reveal": { default: "Tampilkan langkah berikutnya" },
  "lesson.example.done": { default: "Semua langkah sudah tampil." },
  "lesson.pdf": { default: "Buka ringkasan" },
  "lesson.saved": { default: "Posisi bacaanmu tersimpan." },

  "posttest.title": { default: "Uji Penguasaan" },
  "posttest.intro": { default: "Kerjakan dengan tenang. Kamu bisa menandai soal dan kembali lagi." },
  "posttest.elapsed": { default: "Waktu berjalan" },
  "posttest.pause": { default: "Simpan & Jeda" },
  "posttest.resume": { default: "Lanjutkan mengerjakan" },
  "posttest.flag": { default: "Tandai" },
  "posttest.flagged": { default: "Ditandai" },
  "posttest.navigator": { default: "Daftar soal" },
  "posttest.answered": { default: "Sudah dijawab" },
  "posttest.unanswered": { default: "Belum dijawab" },
  "posttest.confirm": { default: "Kunci jawaban ini" },
  "posttest.confirmed": { default: "Tersimpan" },
  "posttest.submit": { default: "Kumpulkan" },
  "posttest.submit_confirm": { default: "Kumpulkan sekarang? Setelah dikumpulkan, jawaban tidak bisa diubah." },

  "assist.SD": { default: "🤔 Perlu contoh?" },
  "assist.SMP": { default: "💡 Perlu petunjuk?" },
  "assist.SMA": { default: "🧭 Perlu arah?" },
  "assist.UNIVERSITAS": { default: "🧭 Perlu arah berpikir?" },
  "assist.more": { default: "Masih perlu bantuan lagi?" },
  "assist.close": { default: "Sudah cukup, terima kasih" },
  "assist.level.ARAH": { default: "Arah berpikir" },
  "assist.level.PETUNJUK": { default: "Langkah pertama" },
  "assist.level.CONTOH": { default: "Contoh yang mirip" },
  "assist.none": { default: "Untuk soal ini belum ada bantuan tambahan." },

  "hasil.title": { default: "Hasil" },
  "hasil.mastery": { default: "Penguasaan" },
  "hasil.safety.ok": { default: "Semua butir penting sudah kamu jawab dengan tepat." },
  "hasil.safety.missed": { default: "Ada butir penting yang belum tepat. Mari kita lihat bersama." },
  "hasil.domain": { default: "Per bagian" },
  "hasil.review": { default: "Tinjau kembali" },
  "hasil.review.open": { default: "Buka pembahasan" },
  "hasil.answer_yours": { default: "Jawabanmu" },
  "hasil.answer_right": { default: "Sudah tepat" },
  "hasil.answer_notyet": { default: "Belum tepat" },
  "hasil.delta.LENGKAP": { default: "Perubahan dari Pemetaan Awal" },
  "hasil.delta.BARU_PEMETAAN": { default: "Uji Penguasaan belum dikerjakan, jadi belum ada perbandingan." },
  "hasil.delta.BARU_PENGUASAAN": { default: "Pemetaan Awal belum dikerjakan, jadi belum ada perbandingan." },
  "hasil.delta.BELUM_ADA": { default: "Belum ada yang bisa dibandingkan." },
  "hasil.certificate": { default: "Ambil sertifikatmu" },
  "hasil.certificate_soon": { default: "Sertifikat akan tersedia di tahap berikutnya." },

  "sync.offline": { default: "Sedang luring. Jawabanmu disimpan dan dikirim saat tersambung lagi." },
  "sync.pending": { default: "Mengirim jawaban yang tertunda…" },
  "studio.title": { default: "Studio" },
  "evaluasi.judul": { default: "Ruang Peragaan" },
  "evaluasi.intro": { default: "Lihat PINTAR dari sudut pandang orang yang berbeda di satu sekolah peragaan. Pilih satu sudut pandang untuk mulai." },
  "evaluasi.pilih": { default: "Pilih sudut pandang" },
  "evaluasi.mulai": { default: "Lihat sebagai" },
  "evaluasi.refused": { default: "Ruang peragaan tidak tersedia untuk akun ini." },
  "evaluasi.mode": { default: "MODE PERAGAAN" },
  "evaluasi.sebagai": { default: "Sedang melihat sebagai" },
  "evaluasi.ganti": { default: "Ganti sudut pandang" },
  "evaluasi.keluar": { default: "Keluar dari peragaan" },
  "evaluasi.berakhir": { default: "Sesi peragaan berakhir" },
  "evaluasi.sesi_habis": { default: "Waktu peragaan sudah habis. Kembali ke ruang peragaan untuk mulai lagi." },
  "evaluasi.gagal": { default: "Sudut pandang itu tidak bisa dibuka sekarang." },
  "evaluasi.kembali": { default: "Kembali ke ruang peragaan" },
  "studio.refused": { default: "Halaman ini untuk staf pengelola isi. Akun Anda belum memiliki akses ke Studio." },
  "studio.nav.beranda": { default: "Beranda" },
  "studio.nav.unggah": { default: "Buat Paket" },
  "studio.nav.tinjau": { default: "Antrean Tinjauan" },
  "studio.nav.kanonik": { default: "Pustaka PINTAR" },
  "studio.nav.definisi": { default: "Aturan Penilaian" },
  "studio.nav.integritas": { default: "Tinjauan Integritas" },
  "studio.nav.sertifikat": { default: "Sertifikat" },
  "studio.nav.bank": { default: "Bank Soal" },
  "studio.nav.kuis": { default: "Kuis Cepat" },
  "studio.kuis.judul": { default: "Kuis Cepat" },
  "studio.kuis.pengantar": { default: "Pilih kelas dan bab yang baru Anda ajarkan, lalu luncurkan. Murid bisa mulai mengerjakan dalam waktu satu menit." },
  "studio.kuis.kelas": { default: "Kelas" },
  "studio.kuis.bab": { default: "Bab" },
  "studio.kuis.sumber_sekolah": { default: "Paket sekolah Anda" },
  "studio.kuis.sumber_pustaka": { default: "Pustaka PINTAR yang bisa Anda ajarkan" },
  "studio.kuis.jumlah": { default: "Jumlah soal" },
  "studio.kuis.menit": { default: "Lama pengerjaan (menit)" },
  "studio.kuis.luncurkan": { default: "Luncurkan kuis" },
  "studio.kuis.riwayat": { default: "Kuis yang sudah diluncurkan" },
  "studio.kuis.kosong": { default: "Belum ada kuis cepat di kelas ini." },
  "studio.kuis.bab_kosong": { default: "Belum ada bab yang bisa dipakai untuk kuis cepat. Buat paket sekolah Anda, atau tunggu bab Pustaka PINTAR dibuka untuk sekolah Anda." },
  "studio.kuis.tidak_tersedia": { default: "Bahan kuis ini sudah tidak tersedia untuk sekolah Anda, jadi kuis ini tidak bisa dimulai lagi. Pekerjaan murid yang sudah selesai tetap tersimpan." },
  "studio.kuis.tanpa_kelas": { default: "Akun Anda belum dipasangkan dengan kelas mana pun." },
  "studio.bucket.ACTION_REQUIRED": { default: "Menunggu tindakan Anda" },
  "studio.bucket.AWAITING_MY_REVIEW": { default: "Menunggu tinjauan Anda" },
  "studio.bucket.BLOCKED": { default: "Tertahan" },
  "studio.bucket.QUESTION_HEALTH": { default: "Sinyal mutu soal" },
  "studio.bucket.DISTRIBUTED_CANONICAL": { default: "Pustaka PINTAR untuk sekolah Anda" },
  "studio.state.READY": { default: "Siap" },
  "studio.state.ACTION_REQUIRED": { default: "Perlu tindakan" },
  "studio.state.BLOCKED": { default: "Tertahan" },
  "studio.state.explain.READY": { default: "Paket ini siap diterbitkan." },
  "studio.state.explain.ACTION_REQUIRED": { default: "Ada yang bisa Anda selesaikan sekarang di Studio." },
  "studio.state.explain.BLOCKED": { default: "Ada yang harus diperbaiki pada isinya sebelum paket ini bisa lanjut." },
  "studio.paket.judul": { default: "Paket Pembelajaran" },
  "studio.paket.alasan": { default: "Yang perlu diselesaikan" },
  "studio.paket.pratinjau": { default: "Lihat seperti siswa" },
  "studio.paket.setujui": { default: "Setujui" },
  "studio.paket.kunci": { default: "Setujui & Kunci" },
  "studio.paket.kunci_peringatan": { default: "Setelah dikunci, isi paket ini tidak dapat diubah lagi. Perbaikan berikutnya dibuat sebagai salinan baru." },
  "studio.paket.terbitkan": { default: "Terbitkan" },
  "studio.paket.tarik": { default: "Tarik dari peredaran" },
  "studio.paket.tugaskan": { default: "Tugaskan ke kelas" },
  "studio.paket.terbit_bukan_tugas": { default: "Menerbitkan belum menugaskan. Siswa baru melihatnya setelah Anda menugaskannya ke kelas." },
  "studio.paket.revisi": { default: "Buat salinan untuk diperbaiki" },
  "studio.paket.revisi_penjelasan": { default: "Paket asli tetap utuh beserta seluruh catatan pengerjaan siswa. Salinan baru bisa Anda sunting bebas." },
  "studio.paket.kosong": { default: "Belum ada paket di sini." },
  "studio.temuan.lokasi": { default: "Lokasi" },
  "studio.temuan.masalah": { default: "Masalah" },
  "studio.temuan.mengapa": { default: "Mengapa penting" },
  "studio.temuan.cara": { default: "Cara memperbaiki" },
  "studio.temuan.akui": { default: "Sudah saya tinjau" },
  "studio.temuan.kosong": { default: "Tidak ada catatan mutu yang menunggu." },
  "studio.unggah.judul": { default: "Buat Paket Pembelajaran" },
  "studio.unggah.mudah": { default: "Unggah Mudah" },
  "studio.unggah.mudah_penjelasan": { default: "Unggah folder, ZIP, atau berkas lepas. PINTAR mengenali peran tiap berkas dan menanyakan yang belum pasti." },
  "studio.unggah.terstruktur": { default: "Paket Terstruktur" },
  "studio.unggah.terstruktur_penjelasan": { default: "Untuk paket yang sudah dibuat mesin dalam format baku." },
  "studio.unggah.buat_paket": { default: "Buat Paket Pembelajaran" },
  "studio.unggah.buat_penilaian": { default: "Buat Penilaian" },
  "studio.unggah.buat_video": { default: "Buat Video" },
  "studio.unggah.pertanyaan": { default: "Yang perlu Anda pastikan" },
  "studio.unggah.konfirmasi": { default: "Konfirmasi" },
  "studio.unggah.media_catatan": { default: "Berkas media diunggah melalui server PINTAR, bukan langsung dari peramban." },
  "studio.tinjau.judul": { default: "Antrean Tinjauan" },
  "studio.tinjau.kosong": { default: "Tidak ada yang menunggu tinjauan Anda." },
  "studio.tinjau.penulis": { default: "Penyusun" },
  "studio.tinjau.bukan_penulis": { default: "Anda menyusun bagian ini, jadi orang lain yang meninjaunya." },
  "studio.kanonik.judul": { default: "Pustaka PINTAR" },
  "studio.kanonik.penjelasan": { default: "Paket yang disusun PINTAR dan diizinkan untuk sekolah Anda. Bisa ditugaskan, tidak bisa disunting." },
  "studio.kanonik.kosong": { default: "Belum ada paket PINTAR yang diizinkan untuk sekolah Anda." },
  "studio.kanonik.ditarik": { default: "Izin untuk paket ini sudah berakhir. Siswa yang sedang mengerjakan tetap bisa menyelesaikannya; pengerjaan baru tidak dibuka lagi." },
  "studio.kanonik.hanya_baca": { default: "Hanya dapat dibaca dan ditugaskan." },
  "studio.definisi.judul": { default: "Aturan Penilaian" },
  "studio.definisi.batas": { default: "Batas yang berlaku" },
  "studio.definisi.simpan": { default: "Simpan" },
  "studio.definisi.versi_baru": { default: "Perubahan ini mengubah cara hasil dibaca, jadi tersimpan sebagai aturan baru. Hasil lama tetap dibaca dengan aturan lamanya." },
  "studio.definisi.tetap": { default: "Nama diperbarui. Cara hasil dibaca tidak berubah." },
  "studio.integritas.judul": { default: "Tinjauan Integritas" },
  "studio.integritas.penjelasan": { default: "Catatan ini bahan pertimbangan manusia, bukan kesimpulan tentang siswa." },
  "studio.integritas.kosong": { default: "Tidak ada catatan yang menunggu tinjauan." },
  "studio.integritas.NO_CONCERN": { default: "Tidak ada yang perlu ditindaklanjuti" },
  "studio.integritas.DISCUSSED_WITH_LEARNER": { default: "Sudah dibicarakan dengan siswa" },
  "studio.integritas.REFERRED_TO_INSTITUTION": { default: "Diteruskan ke pihak sekolah" },
  "studio.integritas.catat": { default: "Catat tinjauan" },
  "studio.sertifikat.judul": { default: "Tata Letak Sertifikat" },
  "studio.sertifikat.tata_letak": { default: "Tata letak" },
  "studio.sertifikat.awalan": { default: "Awalan nomor" },
  "studio.sertifikat.identitas": { default: "Sertifikat menampilkan nama pemegang saja." },
  "studio.sertifikat.simpan": { default: "Simpan" },
  "studio.bank.judul": { default: "Bank Soal" },
  "studio.bank.kesehatan": { default: "Kesehatan soal" },
  "studio.bank.belum_cukup": { default: "Belum cukup bukti untuk menilai soal ini." },
  "studio.bank.prediksi": { default: "Perkiraan penyusun" },
  "studio.bank.empiris": { default: "Dari pengerjaan siswa" },
  "studio.bank.akui_ok": { default: "Sudah ditinjau, soal ini wajar" },
  "studio.bank.tindakan": { default: "Sudah ditinjau, soal ini diperbaiki" },
  "studio.hasil.ok": { default: "Tersimpan." },
  "studio.hasil.gagal": { default: "Belum tersimpan." },
  "sync.done": { default: "Semua jawaban sudah tersimpan di server." },
};

/** Words that must never appear on a learner-facing surface (doc 12 "complexity leaking"). */
export const INTERNAL_WORDS = [
  "PINTAR 4.0", "FROZEN", "SUPERSEDED", "VALIDATION_FAILED", "IN_REVIEW", "INGESTED", "STRUCTURED",
  "SYNTHETIC", "PUBLIC_DEMO", "PREVIEW", "OFFICIAL", "evidence_class", "Menunggu", "Wrong", "Failed",
  "Salah", "Incorrect", "Penalty",
];

export function t(event: HleEvent, persona: Persona = "learner"): string {
  const row = table[event];
  const value = row[persona] ?? row.default;
  if (persona === "learner" || persona === "public") {
    for (const w of INTERNAL_WORDS) {
      if (value.includes(w)) throw new Error(`HLE: internal word "${w}" would reach a ${persona} surface via ${event}`);
    }
  }
  return value;
}

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

export function renderAll(): Array<{ event: HleEvent; persona: Persona; text: string }> {
  const out: Array<{ event: HleEvent; persona: Persona; text: string }> = [];
  for (const event of Object.keys(table) as HleEvent[]) {
    const personas: Persona[] = isStaffOnly(event)
      ? ["educator", "staff"]
      : ["learner", "educator", "staff", "public"];
    for (const persona of personas) {
      out.push({ event, persona, text: t(event, persona) });
    }
  }
  return out;
}
