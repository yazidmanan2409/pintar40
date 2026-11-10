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

import { tanggal } from "./tanggal";

export type Persona = "learner" | "educator" | "staff" | "public";
export type HleEvent =
  | "jenis.bank.PRACTICE" | "jenis.bank.TEST" | "jenis.bank.EXAM"
  | "studio.soal.judul" | "studio.soal.arti" | "studio.soal.jumlah" | "studio.soal.kunci" | "studio.soal.alasan" | "studio.soal.kosong"
  | "studio.soal.ringkas" | "studio.soal.pelajaran_label" | "studio.soal.pelajaran_dari" | "studio.soal.posisi" | "studio.soal.buka" | "studio.soal.bacaan" | "studio.soal.gagal" | "studio.soal.pager_label"
  | "mengajar.bukti.per_soal" | "pelajaran.visual.pecahan" | "mengajar.soal.judul" | "mengajar.soal.arti" | "mengajar.soal.terkumpul" | "mengajar.soal.dari" | "mengajar.soal.tepat"
  | "mengajar.soal.kunci" | "mengajar.soal.bantuan" | "mengajar.soal.semua_tepat" | "mengajar.soal.kosong" | "mengajar.soal.tidak_dijawab" | "mengajar.soal.kembali"
  | "mengajar.ulang.judul"
  | "mengajar.ulang.arti"
  | "mengajar.ulang.murid"
  | "mengajar.ulang.murid_kosong"
  | "mengajar.ulang.belum_uji"
  | "mengajar.ulang.pelajaran"
  | "mengajar.ulang.tidak_berubah"
  | "mengajar.ulang.kirim"
  | "mengajar.ulang.terkirim"
  | "mengajar.ulang.riwayat"
  | "mengajar.ulang.riwayat_kosong"
  | "mengajar.ulang.dibaca"
  | "mengajar.ulang.tolak.review_no_learner"
  | "mengajar.ulang.tolak.review_no_lesson"
  | "mengajar.ulang.tolak.review_too_many"
  | "mengajar.ulang.tolak.review_not_in_class"
  | "mengajar.ulang.tolak.review_lesson_not_in_chapter"
  | "mengajar.ulang.tolak.review_assignment_closed"
  | "mengajar.ulang.tolak.review_not_allowed"
  | "mengajar.ulang.tolak.review_failed"
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
  | "kesiapan.perlu_review" | "kesiapan.siap_sertifikasi" | "kesiapan.catatan"
  | "kesiapan.populasi.murid" | "kesiapan.populasi.sudah" | "kesiapan.populasi.belum"
  | "kesehatan.judul" | "kesehatan.diamati" | "kesehatan.ditandai"
  | "kesehatan.belum_cukup" | "kesehatan.belum_diperiksa"
  | "kesehatan.catatan_paparan" | "kesehatan.belum_dikalibrasi"
  | "laporan.metrik.tidak_dikenal" | "laporan.metrik.bukan_untuk_anda"
  | "laporan.metrik.diganti" | "laporan.metrik.belum_cukup_data"
  | "laporan.metrik.belum_ada_bukti"
  | "laporan.metrik.dilindungi" | "ketiadaan.dilindungi.bab.murid" | "ketiadaan.dilindungi.bab.peserta"
  | "ketiadaan.dilindungi.kelas.murid" | "ketiadaan.dilindungi.kelas.peserta"
  | "laporan.metrik.tidak_berlaku" | "laporan.sekolah.dasar_gerbang_tidak_berlaku" | "laporan.sekolah.dasar_gerbang_murid" | "ketiadaan.dilindungi.bab_pasangan.murid" | "ketiadaan.dilindungi.bab_pasangan.peserta" | "laporan.komposisi.awal_akhir_dilindungi" | "laporan.komposisi.keliru_tertahan" | "laporan.komposisi.keliru_belum" | "mengajar.bukti.bagian_tertahan" | "hasil.safety.tidak_ada" | "pimpinan.kelas.bukti_saja" | "laporan.sekolah.ranah_tertahan_semua" | "laporan.komposisi.kenaikan_dari_pasangan" | "mengajar.murid1.dihitung_ulang" | "mengajar.murid1.dihitung_ulang_alasan" | "hasil.dihitung_ulang" | "hasil.review.kunci_terkini" | "map.kunci_terkini" | "laporan.kisi.arti_tanpa_target" | "laporan.kisi.arti_sebagian" | "laporan.kisi.kunci_sebagian"
  | "laporan.komposisi.topik_di_bawah_sebagian" | "laporan.komposisi.topik_di_bawah_banyak_sebagian" | "laporan.komposisi.topik_semua_sebagian" | "laporan.komposisi.topik_tertahan.satu" | "laporan.komposisi.topik_tertahan.banyak" | "laporan.komposisi.topik_tertahan_semua"
  | "laporan.kelas.judul" | "laporan.institusi.judul"
  | "laporan.kosong" | "laporan.tak_ada_angka" | "laporan.cetak" | "laporan.metrik.tanpa_nama" | "laporan.kelas.pd_arti"
  | "laporan.cakupan.kelas" | "laporan.cakupan.sekolah"
  // CONTOH LAPORAN (Daisy, approved 7 Nov): the report compositions' own sentences, composed from the figures below
  // them with no cause or advice; every figure keeps its existing label and meaning
  | "laporan.komposisi.topik_di_bawah" | "laporan.komposisi.topik_semua" | "laporan.komposisi.topik_terendah" | "laporan.komposisi.topik_di_bawah_banyak" | "laporan.komposisi.keliru_lainnya"
  | "laporan.komposisi.pita_ringkas" | "laporan.komposisi.rata_rata" | "laporan.komposisi.target"
  | "laporan.komposisi.target_arti" | "laporan.komposisi.kenaikan_dari" | "laporan.komposisi.berikutnya"
  | "laporan.komposisi.berikutnya_bukti" | "laporan.komposisi.berikutnya_keliru" | "laporan.komposisi.teks_grafik"
  | "laporan.komposisi.kolom_topik" | "laporan.komposisi.kolom_nilai" | "laporan.komposisi.kolom_pita"
  | "laporan.komposisi.lainnya"
  | "pengembangan.tentang" | "pengembangan.siapa_melihat"
  | "laporan.bagian"
  | "laporan.komposisi.titik_arti" | "laporan.komposisi.awal_akhir_label" | "laporan.komposisi.awal_akhir_arti" | "laporan.komposisi.awal_akhir_tidak"
  | "laporan.sekolah.mapel_cukup" | "laporan.sekolah.mapel_belum_ada" | "laporan.sekolah.mapel_belum_cukup"
  | "aktivasi.kelas.banyak.tidak_termasuk" | "aktivasi.kelas.banyak.akun" | "aktivasi.kelas.banyak.staf" | "aktivasi.kelas.banyak.pendataan"
  | "laporan.sekolah.naik" | "laporan.sekolah.ranah_baik"
  | "laporan.kisi.dasar" | "laporan.kisi.kunci" | "laporan.komposisi.bawah_ket" | "laporan.sekolah.bawah_ket"
  | "laporan.komposisi.tertahan_judul" | "laporan.komposisi.tertahan" | "laporan.komposisi.tertahan_sub" | "laporan.komposisi.berikutnya_tertahan"
  | "laporan.komposisi.pita_ket" | "laporan.komposisi.saran" | "laporan.komposisi.penguatan_soal" | "laporan.komposisi.soal_wajib_belum"
  | "config.menunggu.alasan.kartu" | "config.menunggu.alasan.email" | "config.menunggu.alasan.pendataan"
  | "hasilbelajar.judul" | "hasilbelajar.cakupan" | "hasilbelajar.a" | "hasilbelajar.b" | "hasilbelajar.b_arti"
  | "hasilbelajar.belum_ada" | "hasilbelajar.semua_capai" | "hasilbelajar.capai" | "hasilbelajar.selesai" | "hasilbelajar.ulang" | "hasilbelajar.ulang_banyak"
  | "hasilbelajar.awal" | "hasilbelajar.akhir" | "hasilbelajar.target" | "hasilbelajar.berjalan"
  | "hasilbelajar.nilai" | "hasilbelajar.tercapai" | "hasilbelajar.belum_capai" | "hasilbelajar.pelajari_lagi"
  | "hasilbelajar.lanjutkan" | "hasilbelajar.berikutnya_ulang" | "hasilbelajar.buka_bab" | "hasilbelajar.sertifikat"
  | "hasilbelajar.buka" | "hasilbelajar.buka_arti" | "hasilbelajar.kosong"
  | "pengembangan.langkah" | "pengembangan.belum_mulai" | "pengembangan.urutan" | "pengembangan.urutan_hasil"
  | "pengembangan.kolom.peserta" | "pengembangan.pelajaran_dari" | "pengembangan.tanpa_paket" | "pengembangan.tanda"
  | "pengembangan.tentang_catatan" | "pengembangan.tanpa_jawaban"
  | "laporan.komposisi.penguatan_judul" | "laporan.komposisi.penguatan_arti" | "laporan.komposisi.penguatan_nihil"
  | "laporan.komposisi.penguatan_ulang" | "laporan.komposisi.berikutnya_penguatan"
  | "laporan.kisi.pola" | "laporan.kisi.pola_banyak" | "laporan.kisi.tanpa_target" | "laporan.kisi.tanpa_pola" | "laporan.kisi.arti" | "laporan.kisi.belum"
  | "laporan.sekolah.zona" | "laporan.sekolah.perhatian" | "laporan.sekolah.semua_cukup" | "laporan.sekolah.angka"
  | "laporan.sekolah.dasar_gerbang" | "laporan.sekolah.dasar_sertifikat" | "laporan.sekolah.kohort_arti" | "laporan.sekolah.berikutnya_kesiapan"
  // ── WP4. The Management surface. `pimpinan` is Indonesian for the people who
  // lead a part of a school — the word the approved Management design uses for
  // the role, and the one this surface is named after. Every key below is
  // declared staff-only (STAFF_ONLY_PREFIXES), because Management Indonesian
  // legitimately says "Menunggu tinjauan" about a queue where the same word on a
  // learner's screen would be the system telling a child to wait.
  | "pimpinan.eyebrow" | "pimpinan.judul" | "pimpinan.batas" | "pimpinan.urutan"
  | "pimpinan.memutuskan" | "pimpinan.ditolak" | "laporan.ditolak" | "config.persiapan.murid.tanpa_kelas" | "laporan.sekolah.perhatian_banyak" | "laporan.sekolah.ranah_tertahan_semua.murid.satu" | "laporan.sekolah.ranah_tertahan_semua.murid.banyak" | "laporan.sekolah.ranah_tertahan_semua.kelas.satu" | "laporan.sekolah.ranah_tertahan_semua.kelas.banyak" | "laporan.sekolah.ranah_tertahan.murid.satu" | "laporan.sekolah.ranah_tertahan.murid.banyak" | "laporan.sekolah.ranah_tertahan.kelas.satu" | "laporan.sekolah.ranah_tertahan.kelas.banyak" | "laporan.sekolah.angkatan_belum.pindah" | "laporan.sekolah.ranah_tertahan.pindah.satu" | "laporan.sekolah.ranah_tertahan.pindah.banyak" | "laporan.sekolah.ranah_tertahan_semua.pindah.satu" | "laporan.sekolah.ranah_tertahan_semua.pindah.banyak" | "laporan.sekolah.angkatan_belum.murid" | "laporan.sekolah.angkatan_belum.kelas" | "laporan.sekolah.angkatan_tak_tercatat" | "laporan.bab.dasar" | "laporan.bab.belum" | "laporan.bab.murid" | "metrik.bab.label" | "metrik.bab.arti"
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
  | "pimpinan.aksi.catatan" | "pimpinan.aksi.gagal" | "pimpinan.aksi.tercatat"
  | "pimpinan.menunggu_pemutus_lain" | "pimpinan.belum_ada_pemutus_lain"
  | "pimpinan.kesiapan.judul" | "pimpinan.kesiapan.catatan"
  | "pimpinan.kesiapan.cukup" | "pimpinan.kesiapan.belum_cukup" | "pimpinan.kesiapan.belum_ada"
  | "pimpinan.bukti.judul" | "pimpinan.bukti.kosong" | "pimpinan.bukti.di_kelas" | "pimpinan.bukti.dari"
  | "pimpinan.murid.judul" | "pimpinan.murid.sub" | "pimpinan.murid.kosong" | "pimpinan.murid.buka"
  | "pimpinan.rincian.judul" | "pimpinan.rincian.tercatat" | "pimpinan.rincian.status"
  | "pimpinan.rincian.periode" | "pimpinan.rincian.program" | "pimpinan.rincian.penempatan"
  | "pimpinan.rincian.riwayat" | "pimpinan.rincian.sampai"
  | "pimpinan.rincian.alasan.MOVED" | "pimpinan.rincian.alasan.PERIOD_ROLLOVER" | "pimpinan.rincian.alasan.ENROLLMENT_ENDED"
  | "pimpinan.rincian.catatan" | "pimpinan.rincian.belum" | "pimpinan.rincian.penguasaan"
  | "tindakan.ulangi" | "tindakan.fokus" | "tindakan.fokus_pita" | "tindakan.lanjut" | "tindakan.tunggu"
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
  | "sertifikat.kelola.judul"
  | "sertifikat.kelola.intro"
  | "sertifikat.kelola.intro.platform"
  | "sertifikat.kelola.benda"
  | "sertifikat.kelola.cari"
  | "sertifikat.kelola.kolom.pemegang"
  | "sertifikat.kelola.kolom.nomor"
  | "sertifikat.kelola.kolom.sekolah"
  | "sertifikat.kelola.kolom.kursus"
  | "sertifikat.kelola.kolom.terbit"
  | "sertifikat.kelola.kolom.keadaan"
  | "sertifikat.kelola.kolom.tindakan"
  | "sertifikat.kelola.keadaan.ISSUED"
  | "sertifikat.kelola.keadaan.REVOKED"
  | "sertifikat.kelola.keadaan.SUPERSEDED"
  | "sertifikat.kelola.kosong"
  | "sertifikat.kelola.tidak_cocok"
  | "sertifikat.kelola.cabut"
  | "sertifikat.kelola.ditolak"
  | "sertifikat.cabut.judul"
  | "akun.tinggal.judul"
  | "akun.tinggal.arti"
  | "akun.tinggal.intro_murid"
  | "akun.tinggal.fakta.akses"
  | "akun.tinggal.fakta.data"
  | "akun.tinggal.fakta.akademik"
  | "akun.tinggal.fakta.sertifikat"
  | "akun.tinggal.fakta.audit"
  | "akun.tinggal.fakta.cadangan"
  | "akun.tinggal.jenis.close"
  | "akun.tinggal.jenis.delete_personal_data"
  | "akun.tinggal.akibat.close"
  | "akun.tinggal.akibat.delete_personal_data"
  | "akun.tinggal.konfirmasi.close"
  | "akun.tinggal.konfirmasi.delete_personal_data"
  | "akun.tinggal.tombol.close"
  | "akun.tinggal.tombol.delete_personal_data"
  | "akun.tinggal.lewat_sekolah"
  | "akun.tinggal.ok"
  | "akun.tinggal.status.received"
  | "akun.tinggal.status.in_progress"
  | "akun.tinggal.status.done"
  | "akun.tinggal.status.declined"
  | "akun.tinggal.galat.account_not_allowed"
  | "akun.tinggal.galat.account_self"
  | "akun.tinggal.galat.account_unknown"
  | "akun.tinggal.galat.account_category_invalid"
  | "akun.tinggal.galat.account_note_required"
  | "akun.tinggal.galat.account_already_suspended"
  | "akun.tinggal.galat.account_already_closed"
  | "akun.tinggal.galat.account_not_suspended"
  | "akun.tinggal.galat.account_confirm_required"
  | "akun.tinggal.galat.account_learner_via_school"
  | "akun.tinggal.galat.account_request_open"
  | "akun.tinggal.galat.account_request_invalid"
  | "akun.tinggal.galat.account_not_closed"
  | "akun.tinggal.galat.account_platform_role"
  | "akun.tinggal.galat.account_photo_pending"
  | "akun.tinggal.galat.account_failed"
  | "keamanan.akun.judul"
  | "keamanan.akun.arti"
  | "keamanan.akun.cari"
  | "keamanan.akun.cari_tombol"
  | "keamanan.akun.tidak_ada"
  | "keamanan.akun.ditangguhkan"
  | "keamanan.akun.ditutup"
  | "keamanan.akun.akibat"
  | "keamanan.akun.kategori"
  | "keamanan.akun.kategori.security"
  | "keamanan.akun.kategori.administrative"
  | "keamanan.akun.kategori.other"
  | "keamanan.akun.catatan"
  | "keamanan.akun.alasan"
  | "keamanan.akun.tangguhkan"
  | "keamanan.akun.aktifkan"
  | "keamanan.akun.ok.tangguh"
  | "keamanan.akun.ok.aktif"
  | "keamanan.akun.ok.hapus"
  | "keamanan.permintaan.judul"
  | "keamanan.permintaan.kosong"
  | "keamanan.permintaan.hapus"
  | "keamanan.permintaan.hapus_foto_ulang"
  | "keamanan.permintaan.belum_ditutup"
  | "audit.aksi.account.suspended"
  | "audit.aksi.account.reactivated"
  | "audit.aksi.account.reopened"
  | "audit.aksi.account.closed_at_request"
  | "audit.aksi.account.deletion_requested"
  | "audit.aksi.account.personal_data_deleted"
  | "audit.alasan.security"
  | "audit.alasan.administrative"
  | "audit.alasan.closed_at_request"
  | "staf.judul"
  | "staf.intro"
  | "staf.kosong"
  | "staf.tidak_ada_sekolah"
  | "staf.buka"
  | "staf.peran_kini"
  | "staf.tempat"
  | "staf.sampai"
  | "staf.tj"
  | "staf.ubah.judul"
  | "staf.ubah.arti"
  | "staf.ubah.lepas"
  | "staf.ubah.tambah"
  | "staf.ubah.tambah_tidak"
  | "staf.ubah.alasan"
  | "staf.ubah.alasan_arti"
  | "staf.ubah.tinjau"
  | "staf.ubah.tinjau_judul"
  | "staf.ubah.dapat"
  | "staf.ubah.tetap"
  | "staf.ubah.hilang"
  | "staf.ubah.tidak_ada"
  | "staf.ubah.tidak_diberikan"
  | "staf.ubah.antrean"
  | "staf.ubah.antrean_arti"
  | "staf.ubah.menunggu"
  | "staf.ubah.konfirmasi_admin"
  | "staf.ubah.konfirmasi_admin_lepas"
  | "staf.ubah.terapkan"
  | "staf.ubah.batal"
  | "staf.ubah.ok"
  | "staf.akhiri.judul"
  | "staf.akhiri.arti"
  | "staf.akhiri.kategori"
  | "staf.akhiri.tanggal"
  | "staf.akhiri.tanggal_arti"
  | "staf.akhiri.tanya"
  | "staf.akhiri.peran_berakhir"
  | "staf.kategori.koreksi_grup"
  | "staf.akhiri.alasan"
  | "staf.akhiri.tombol"
  | "staf.akhiri.ok"
  | "staf.kategori.retirement"
  | "staf.kategori.resignation"
  | "staf.kategori.dismissal"
  | "staf.kategori.transfer"
  | "staf.kategori.contract_end"
  | "staf.kategori.correction"
  | "staf.kategori.other"
  | "staf.tj.can_draft"
  | "staf.tj.can_review"
  | "staf.tj.can_freeze_release"
  | "staf.tj.can_publish"
  | "staf.tj.can_assign_learning"
  | "staf.tj.can_quick_assessment"
  | "staf.tj.can_authorize_transfer"
  | "staf.tj.can_review_question_health"
  | "staf.tj.can_manage_report_templates"
  | "staf.tj.can_review_integrity"
  | "staf.tj.can_view_learner_roster"
  | "staf.tj.can_view_learner_result"
  | "staf.tj.can_provision_people"
  | "staf.tj.can_manage_sittings"
  | "staf.tj.management_decision"
  | "staf.galat.staff_not_allowed"
  | "staf.galat.staff_self"
  | "staf.galat.staff_not_active"
  | "staf.galat.staff_unknown"
  | "staf.galat.staff_category_invalid"
  | "staf.galat.staff_reason_required"
  | "staf.galat.staff_date_invalid"
  | "staf.galat.role_stale"
  | "staf.galat.role_nothing"
  | "staf.galat.role_not_allowed"
  | "staf.galat.role_scope_invalid"
  | "staf.galat.role_until_invalid"
  | "staf.galat.role_admin_unconfirmed"
  | "staf.galat.role_remove_invalid"
  | "staf.galat.staff_failed"
  | "peran.galat.role_last_platform_admin"
  | "peran.galat.role_last_school_admin"
  | "peran.galat.role_renew_not_allowed"
  | "peran.galat.role_renew_not_live"
  | "peran.galat.role_renew_self"
  | "peran.galat.role_renew_until_invalid"
  | "peran.galat.role_renew_reason_required"
  | "peran.galat.role_read_not_allowed"
  | "peran.galat.role_expiry_days_invalid"
  | "peran.galat.role_busy"
  | "peran.galat.role_failed"
  | "pengerjaan.galat.sitting_not_allowed"
  | "pengerjaan.galat.sitting_professional"
  | "pengerjaan.galat.sitting_reason_required"
  | "pengerjaan.galat.sitting_note_too_long"
  | "pengerjaan.galat.sitting_already_ended"
  | "pengerjaan.galat.sitting_frozen"
  | "pengerjaan.galat.sitting_not_frozen"
  | "pengerjaan.galat.sitting_learner_suspended"
  | "pengerjaan.galat.sitting_end_kind_invalid"
  | "pengerjaan.galat.sitting_minutes_invalid"
  | "pengerjaan.galat.sitting_extend_limit"
  | "pengerjaan.galat.sitting_no_deadline"
  | "pengerjaan.galat.attempt_not_limited"
  | "pengerjaan.galat.attempt_sitting_open"
  | "pengerjaan.galat.attempt_not_needed"
  | "pengerjaan.galat.attempt_request_open"
  | "pengerjaan.galat.attempt_decision_not_allowed"
  | "pengerjaan.galat.attempt_own_request"
  | "pengerjaan.galat.attempt_already_decided"
  | "pengerjaan.galat.attempt_reason_required"
  | "pengerjaan.galat.window_not_allowed"
  | "pengerjaan.galat.window_assignment_ended"
  | "pengerjaan.galat.window_invalid"
  | "pengerjaan.galat.window_unchanged"
  | "pengerjaan.galat.window_not_changeable"
  | "pengerjaan.galat.sitting_failed"
  | "galat.role_renewed"
  | "peran.berakhir.judul"
  | "peran.berakhir.jumlah"
  | "peran.berakhir.terakhir"
  | "peran.perpanjang.aksi"
  | "peran.perpanjang.judul"
  | "peran.perpanjang.arti"
  | "peran.perpanjang.sampai_baru"
  | "peran.perpanjang.sampai_arti"
  | "peran.perpanjang.alasan_arti"
  | "peran.perpanjang.sendiri"
  | "peran.perpanjang.simpan"
  | "peran.cabut.tanpa_admin"
  | "peran.saya.judul"
  | "peran.saya.berakhir"
  | "peran.saya.berakhir_platform"
  | "peran.saya.berakhir_sendiri"
  | "peran.saya.buka"
  | "audit.alasan.retirement"
  | "audit.alasan.resignation"
  | "audit.alasan.dismissal"
  | "audit.alasan.contract_end"
  | "audit.aksi.staff.ended_at_school"
  | "audit.aksi.role.changed"
  | "audit.aksi.learning_assignment.ended"
  | "audit.aksi.learning_assignment.withdrawn"
  | "audit.aksi.certificate.superseded"
  | "audit.aksi.certificate.correction_prepared"
  | "sertifikat.ganti.judul"
  | "sertifikat.ganti.arti"
  | "sertifikat.ganti.bagian"
  | "sertifikat.ganti.tercetak"
  | "sertifikat.ganti.kini"
  | "sertifikat.ganti.paket"
  | "sertifikat.ganti.berubah"
  | "sertifikat.ganti.berbeda"
  | "sertifikat.ganti.hasil"
  | "sertifikat.ganti.hasil_arti"
  | "sertifikat.ganti.sama_kata"
  | "sertifikat.ganti.alasan"
  | "sertifikat.ganti.alasan.arti"
  | "sertifikat.ganti.tombol"
  | "sertifikat.ganti.sama"
  | "sertifikat.ganti.ok"
  | "sertifikat.ganti.digantikan_oleh"
  | "sertifikat.ganti.gagal.cert_not_allowed"
  | "sertifikat.ganti.gagal.cert_not_issued"
  | "sertifikat.ganti.gagal.cert_reason_required"
  | "sertifikat.ganti.gagal.cert_nothing_changed"
  | "sertifikat.ganti.gagal.cert_key_invalid"
  | "sertifikat.ganti.gagal.cert_replacement_invalid"
  | "sertifikat.ganti.gagal.tidak_ditemukan"
  | "sertifikat.ganti.gagal.layanan_tidak_tersedia"
  | "sertifikat.cabut.alasan"
  | "sertifikat.cabut.alasan.arti"
  | "sertifikat.cabut.lanjut"
  | "sertifikat.cabut.tanya"
  | "sertifikat.cabut.akibat"
  | "sertifikat.cabut.aman"
  | "sertifikat.cabut.tombol"
  | "sertifikat.cabut.batal"
  | "sertifikat.cabut.ok"
  | "sertifikat.cabut.dicabut_pada"
  | "sertifikat.cabut.alasan_tercatat"
  | "sertifikat.cabut.digantikan"
  | "sertifikat.cabut.gagal.ALASAN_WAJIB"
  | "sertifikat.cabut.gagal.SUDAH_DICABUT"
  | "sertifikat.cabut.gagal.DITOLAK"
  | "sertifikat.cabut.gagal.TIDAK_DITEMUKAN"
  | "sertifikat.cabut.gagal.LAYANAN_TIDAK_TERSEDIA"
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
  | "sertifikat.penerbit"
  | "sertifikat.berkas"
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
  // DAISY-18: the shared loading shell
  | "memuat.halaman"
  // DAISY-17: a submit button's words while its form is being saved
  | "tombol.menyimpan"
  | "tombol.lambat"
  | "tombol.memproses"
  | "tombol.memeriksa"
  | "tombol.mengirim"
  | "tombol.menyediakan"
  | "tombol.memulai"
  | "tombol.mengaktifkan"
  | "tolak.kembali"
  | "tolak.kembali_sertifikat"
  | "komitmen.kembali"
  | "bukti.dari"
  | "bukti.murid"
  | "tindakan.lihat_topik" | "tindakan.baca_kenaikan" | "tindakan.lihat_nama" | "tindakan.lihat_soal" | "laporan.anda_memutuskan"
  | "bukti.minimum"

  | "app.name"
  | "aksesibilitas.lewati"
  | "berkas.pilih" | "berkas.belum" | "berkas.banyak"
  | "ketiadaan.jumlah.murid"
  | "ketiadaan.jumlah.peserta" | "ketiadaan.jumlah.gerbang"
  | "sesi.menu.semua"
  | "jaga.judul"
  | "tanggal.belum"
  | "koleksi.cari.label" | "koleksi.cari.placeholder" | "koleksi.cari.hapus" | "koleksi.cari.cocok"
  | "koleksi.saring.label" | "koleksi.saring.semua"
  | "koleksi.kosong.judul" | "koleksi.kosong.kueri" | "koleksi.kosong.reset"
  | "koleksi.halaman.label" | "koleksi.sebelumnya" | "koleksi.menampilkan" | "koleksi.posisi" | "koleksi.posisi.ringkas"
  | "koleksi.menampilkan_tanpa_total" | "koleksi.posisi.terbuka"
  | "koleksi.benda.laporan" | "koleksi.benda.jendela" | "koleksi.benda.pengumuman" | "koleksi.benda.sekolah"
  | "koleksi.benda.pindah" | "koleksi.benda.peran" | "koleksi.benda.jejak" | "koleksi.benda.tinjauan" | "koleksi.benda.definisi"
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
  // DAISY-13 (BOB-12 (c), M13): what the card route answers, in words
  | "auth.card_sering"
  | "auth.card_tanya_guru"
  | "auth.card_ramai"
  | "auth.card_tunggu"
  | "auth.card_lalu_coba"
  | "auth.card_tunggu_sebentar"
  | "auth.card_muat_ulang"
  | "auth.card_tidak_tersedia"
  | "auth.card_tidak_tersedia_singkat"
  | "auth.card_rujukan"
  | "auth.card_putus"
  | "auth.foot"
  | "auth.say_h"
  | "auth.say_p"
  | "auth.link_h_exch"
  | "auth.link_p_exch"
  | "auth.link_h_exp"
  | "auth.link_p_exp"
  | "auth.link_again"
  | "auth.link_same"
  | "sesi.label"
  | "sesi.sebagai"
  | "sesi.bukan_anda"
  | "sesi.keluar"
  | "auth.in_h"
  | "auth.in_p"
  | "auth.in_go"
  | "auth.in_out"
  | "auth.signed_out"
  | "auth.not_yet"
  | "config.title"
  | "config.menunggu.judul"
  | "config.menunggu.pendataan"
  | "config.menunggu.aktivasi"
  | "config.menunggu.tanpa_kelas"
  | "belajar.tanpa_kelas"
  | "config.menunggu.studio"
  | "config.section.system"
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
  | "laporan.templat.tidak_dipakai" | "laporan.templat.lingkup.kelas" | "laporan.templat.lingkup.sekolah" | "laporan.templat.pilih"
  | "laporan.templat.tak_berwenang"
  | "laporan.templat.batas"
  | "config.card.health"
  | "config.card.health.periksa"
  | "config.kesehatan.bukan_admin"
  | "config.kesehatan.sehat"
  | "config.kesehatan.jumlah"
  | "config.kesehatan.perhatian"
  | "config.kesehatan.menyimpang"
  | "config.kesehatan.gagal"
  | "config.kesehatan.ulang"
  | "config.kesehatan.cek.tables_without_rls"
  | "config.kesehatan.cek.policies_using_true"
  | "config.kesehatan.cek.secdef_without_search_path"
  | "config.kesehatan.cek.functions_without_search_path"
  | "config.kesehatan.cek.unclassified_client_rpcs"
  | "config.kesehatan.cek.evidence_consumer_boundary_ok"
  | "config.kesehatan.cek.learner_rpcs_guarded_ok"
  | "config.kesehatan.cek.overloaded_client_rpcs"
  | "config.kesehatan.cek.functions_executable_by_anon"
  | "config.kesehatan.cek.undeclared_anon_functions"
  | "config.kesehatan.cek.anon_public_surface"
  | "config.kesehatan.cek.client_readable_definer_views"
  | "config.kesehatan.cek.anon_reachable_http_paths"
  | "config.kesehatan.cek.public_surface_ok"
  | "config.kesehatan.cek.anon_table_grants"
  | "config.kesehatan.cek.public_buckets"
  | "config.kesehatan.cek.client_storage_policies"
  | "config.kesehatan.cek.persons_institution_columns"
  | "config.kesehatan.cek.audit_log_client_write_grants"
  | "config.kesehatan.cek.malformed_jalur"
  | "config.card.cohorts"
  | "config.environment"
  | "config.refused"
  | "config.section.rollover"
  | "config.section.transfers"
  | "config.section.pindah"
  | "config.section.ketuntasan" | "config.ketuntasan.arti" | "config.ketuntasan.belum" | "config.ketuntasan.sekarang"
  | "config.ketuntasan.nilai" | "config.ketuntasan.alasan" | "config.ketuntasan.alasan_contoh" | "config.ketuntasan.tombol"
  | "config.ketuntasan.riwayat" | "config.ketuntasan.oleh" | "config.ketuntasan.kosong" | "config.ketuntasan.materi_pintar"
  | "config.persiapan.judul"
  | "config.persiapan.arti"
  | "config.persiapan.sudah"
  | "config.persiapan.belum"
  | "config.persiapan.kelas"
  | "config.persiapan.kelas.cara"
  | "config.persiapan.murid"
  | "config.persiapan.murid.cara"
  | "config.persiapan.guru"
  | "config.persiapan.guru.kurang"
  | "config.persiapan.guru.cara"
  | "config.persiapan.admin_kedua"
  | "config.angkat.judul"
  | "config.pertama.judul"
  | "config.pertama.arti"
  | "config.pertama.yakin"
  | "config.angkat.arti"
  | "config.angkat.ya"
  | "config.angkat.batal"
  | "config.pindah.arti"
  | "config.pindah.dari"
  | "config.pindah.lihat"
  | "config.pindah.ke"
  | "config.pindah.tombol"
  | "config.pindah.kosong"
  | "config.pindah.tanpa_kelas"
  | "config.pindah.tanpa_tujuan"
  | "config.pindah.grup_kelas"
  | "config.pindah.grup_tingkat"
  | "config.section.roles"
  | "config.section.audit"
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
  | "config.roles.arti" | "config.roles.lingkup_arti" | "config.roles.sampai_arti"
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
  | "config.struktur.galat.bukan_sekolah"
  | "config.struktur.galat.tahun_di_luar"
  | "config.struktur.galat.tempat_nonaktif"
  | "galat.action_place_inactive"
  | "config.struktur.galat.simpul_tidak_sah"
  | "config.struktur.galat.masih_ada_anak"
  | "config.struktur.galat.masih_ada_murid"
  | "config.struktur.galat.masih_ada_staf"
  | "config.struktur.galat.isian_kurang"
  | "config.struktur.galat.alasan_kosong"
  | "config.struktur.galat.gagal"
  | "config.section.struktur"
  | "config.struktur.intro"
  | "config.struktur.langkah.bagian"
  | "config.struktur.langkah.tingkat"
  | "config.struktur.langkah.kelas"
  | "config.struktur.sekolah"
  | "config.struktur.tanpa_sekolah"
  | "config.struktur.kosong"
  | "config.struktur.tingkat_kosong"
  | "config.struktur.kelas_kosong"
  | "config.struktur.jenis.BAGIAN"
  | "config.struktur.jenis.TINGKAT"
  | "config.struktur.jenis.KELAS"
  | "config.struktur.tambah.BAGIAN"
  | "config.struktur.tambah.TINGKAT"
  | "config.struktur.tambah.KELAS"
  | "config.struktur.nama"
  | "config.struktur.contoh.BAGIAN"
  | "config.struktur.contoh.TINGKAT"
  | "config.struktur.contoh.KELAS"
  | "config.struktur.tahun"
  | "config.struktur.tahun_ikut"
  | "config.struktur.untuk" | "config.struktur.untuk.murid" | "config.struktur.untuk.guru" | "config.struktur.untuk.arti" | "config.struktur.untuk_guru" | "config.struktur.peserta.satu" | "config.struktur.peserta.banyak" | "config.section.peserta" | "config.peserta.arti" | "config.peserta.orang" | "config.peserta.tempat" | "config.peserta.daftarkan" | "config.peserta.tanpa_tempat" | "config.peserta.tanpa_calon" | "config.peserta.catatan" | "galat.pd_not_allowed" | "galat.pd_place_invalid" | "galat.pd_place_not_for_educators" | "galat.pd_person_not_staff" | "galat.pd_already_enrolled" | "galat.pd_other_purpose" | "galat.pd_input_incomplete" | "galat.pd_enrolled" | "mengajar.sedia.kode.assign_context_mismatch" | "mengajar.cepat.tolak.konteks" | "mengajar.fakta.peserta" | "mengajar.peserta.judul" | "mengajar.peserta.kosong" | "mengajar.bukti.peserta" | "mengajar.siap.terdaftar_peserta" | "mengajar.siapa.kosong_peserta" | "mengajar.kelas.catatan_pengembangan" | "pengembangan.eyebrow" | "pengembangan.judul" | "pengembangan.arti" | "pengembangan.arti_terbatas" | "pengembangan.kosong" | "pengembangan.paket_kosong" | "pengembangan.kolom.paket" | "pengembangan.kolom.mulai" | "pengembangan.kolom.pelajaran" | "pengembangan.kolom.pemetaan" | "pengembangan.kolom.penguasaan" | "pengembangan.kolom.selesai" | "pengembangan.kolom.hasil" | "pengembangan.status.BELUM" | "pengembangan.status.SEDANG" | "pengembangan.status.SELESAI" | "pengembangan.ya" | "pengembangan.belum" | "pengembangan.tercapai" | "pengembangan.belum_tercapai" | "pengembangan.daftar.ACTIVE" | "pengembangan.daftar.PENDING" | "pengembangan.buka" | "pengembangan.ditolak"
  | "nav.lapor" | "lapor.eyebrow" | "lapor.judul" | "lapor.arti" | "lapor.murid" | "lapor.halaman" | "lapor.halaman.awal" | "lapor.halaman.lain" | "lapor.rujukan" | "lapor.lakukan" | "lapor.harapan" | "lapor.terjadi" | "lapor.hentikan" | "lapor.hentikan.singkat" | "lapor.tangkapan" | "lapor.tangkapan.arti" | "lapor.tangkapan.naik" | "lapor.tangkapan.siap" | "lapor.tangkapan.gagal" | "lapor.tangkapan.besar" | "lapor.kirim" | "lapor.privasi" | "lapor.diterima" | "lapor.saya.judul" | "lapor.saya.arti" | "lapor.saya.kosong" | "lapor.saya.buka" | "lapor.langkah" | "lapor.langkah.awal" | "lapor.langkah.awal_kelas" | "lapor.status.DITERIMA" | "lapor.status.DITANGANI" | "lapor.status.SELESAI" | "lapor.kode.report_not_staff" | "lapor.kode.report_input_invalid" | "lapor.kode.report_not_allowed" | "lapor.kode.report_status_invalid" | "lapor.kode.report_next_step_required" | "lapor.kode.report_failed" | "config.section.laporan_masalah" | "lapor.triase.arti" | "lapor.triase.arti_platform" | "lapor.triase.kosong" | "lapor.triase.ubah" | "lapor.triase.langkah" | "lapor.triase.simpan" | "lapor.triase.tangkapan" | "lapor.triase.ok"
  // #148 (D-094, D-100): maintenance and notices
  | "pemeliharaan.zona" | "pemeliharaan.pita.dalam" | "pemeliharaan.pita.menit" | "pemeliharaan.pita.pukul" | "pemeliharaan.pita.selesai_kira" | "pemeliharaan.pita.asesmen" | "pemeliharaan.pita.biasa" | "pemeliharaan.pita.asesmen_baru" | "pemeliharaan.pita.berlangsung" | "pemeliharaan.pita.berjalan" | "pemeliharaan.pita.menguasai" | "pemeliharaan.pita.pengumuman" | "pemeliharaan.judul" | "pemeliharaan.sejak" | "pemeliharaan.kira" | "pemeliharaan.kira_belum" | "pemeliharaan.pesan" | "pemeliharaan.terkumpul" | "pemeliharaan.aman" | "pemeliharaan.langkah" | "pemeliharaan.menjelang.judul" | "pemeliharaan.menjelang.arti" | "pemeliharaan.darurat.judul" | "pemeliharaan.darurat.arti" | "pemeliharaan.darurat.aman" | "pemeliharaan.darurat.asesmen" | "pemeliharaan.darurat.langkah" | "pemeliharaan.kembali.judul" | "pemeliharaan.kembali.arti" | "pemeliharaan.kembali.tautan" | "config.section.pemeliharaan" | "config.pemeliharaan.arti" | "config.pemeliharaan.cakupan" | "config.pemeliharaan.platform" | "config.pemeliharaan.mulai" | "config.pemeliharaan.selesai" | "config.pemeliharaan.periksa" | "config.pemeliharaan.tabrakan.perhatian" | "config.pemeliharaan.tabrakan.jumlah" | "config.pemeliharaan.tabrakan.terakhir" | "config.pemeliharaan.tabrakan.saran" | "config.pemeliharaan.tabrakan.nihil" | "config.pemeliharaan.pesan" | "config.pemeliharaan.alasan" | "config.pemeliharaan.umumkan" | "config.pemeliharaan.jadwalkan" | "config.pemeliharaan.daftar" | "config.pemeliharaan.kosong" | "config.pemeliharaan.keadaan.TERJADWAL" | "config.pemeliharaan.keadaan.MENJELANG" | "config.pemeliharaan.keadaan.AKTIF" | "config.pemeliharaan.keadaan.BERAKHIR" | "config.pemeliharaan.jenis.PLANNED" | "config.pemeliharaan.jenis.EMERGENCY" | "config.pemeliharaan.hingga" | "config.pemeliharaan.tanpa_akhir" | "config.pemeliharaan.mulai_sekarang" | "config.pemeliharaan.akhiri" | "config.pemeliharaan.batalkan" | "config.pemeliharaan.pengumuman" | "config.pemeliharaan.pengumuman.arti" | "config.pemeliharaan.pengumuman.pesan" | "config.pemeliharaan.pengumuman.terbit" | "config.pemeliharaan.pengumuman.sampai" | "config.pemeliharaan.pengumuman.terbitkan" | "config.pemeliharaan.pengumuman.tarik" | "config.pemeliharaan.pengumuman.ditarik" | "config.pemeliharaan.pengumuman.kosong" | "config.pemeliharaan.darurat.judul" | "config.pemeliharaan.darurat.arti" | "config.pemeliharaan.darurat.ketik" | "config.pemeliharaan.darurat.tombol" | "galat.maintenance_not_allowed" | "galat.maintenance_input_invalid" | "galat.maintenance_not_open" | "galat.maintenance_confirmation" | "galat.maintenance_no_new_start" | "galat.notice_input_invalid" | "galat.notice_not_open" | "galat.maintenance_active" | "galat.maintenance_scheduled" | "galat.maintenance_started" | "galat.maintenance_ended" | "galat.maintenance_stopped" | "galat.notice_published" | "galat.notice_withdrawn"
  | "config.struktur.murid.satu"
  | "config.struktur.murid.banyak"
  | "config.struktur.nonaktif"
  | "config.struktur.ubah_nama"
  | "config.struktur.nama_baru"
  | "config.struktur.simpan"
  | "config.struktur.batal"
  | "config.struktur.sibuk"
  | "config.struktur.nonaktifkan"
  | "config.struktur.konfirmasi.tanya"
  | "config.struktur.konfirmasi.arti"
  | "config.struktur.konfirmasi.ya"
  | "config.struktur.ok.dibuat"
  | "config.struktur.ok.diubah"
  | "config.struktur.ok.dinonaktifkan"
  | "config.struktur.rujukan"
  | "config.struktur.gagal_baca"
  | "studio.paket.masalah.workbook_unreadable"
  | "studio.paket.masalah.workbook_too_large"
  | "studio.paket.masalah.workbook_sheet_missing"
  | "studio.paket.masalah.workbook_column_missing"
  | "studio.paket.masalah.workbook_course_row_missing"
  | "studio.paket.masalah.workbook_course_rows_many"
  | "studio.paket.masalah.workbook_value_required"
  | "studio.paket.masalah.workbook_value_unknown"
  | "studio.paket.masalah.workbook_chapter_unknown"
  | "studio.paket.masalah.workbook_lesson_unknown"
  | "studio.paket.masalah.workbook_question_unknown"
  | "studio.paket.masalah.workbook_question_without_options"
  | "studio.paket.masalah.package_json_unreadable"
  | "studio.paket.masalah.package_empty"
  | "studio.paket.masalah.package_too_large"
  | "studio.paket.masalah.package_shape_invalid"
  | "studio.paket.masalah.course_title_missing"
  | "studio.paket.masalah.course_subject_missing"
  | "studio.paket.masalah.course_stage_missing"
  | "studio.paket.masalah.course_grade_missing"
  | "studio.paket.masalah.course_context_unknown"
  | "studio.paket.masalah.module_number_invalid"
  | "studio.paket.masalah.module_number_repeated"
  | "studio.paket.masalah.module_title_missing"
  | "studio.paket.masalah.lesson_number_invalid"
  | "studio.paket.masalah.lesson_number_repeated"
  | "studio.paket.masalah.lesson_title_missing"
  | "studio.paket.masalah.lesson_text_missing"
  | "studio.paket.masalah.objective_statement_missing"
  | "studio.paket.masalah.objective_thinking_unknown"
  | "studio.paket.masalah.media_name_invalid"
  | "studio.paket.masalah.media_kind_unknown"
  | "studio.paket.masalah.media_name_clash"
  | "studio.paket.masalah.media_transcript_missing"
  | "studio.paket.masalah.media_not_uploaded"
  | "studio.paket.masalah.item_ref_repeated"
  | "studio.paket.masalah.item_type_unknown"
  | "studio.paket.masalah.item_question_missing"
  | "studio.paket.masalah.item_hint_reveals_answer"
  | "studio.paket.masalah.item_use_unknown"
  | "studio.paket.masalah.item_difficulty_invalid"
  | "studio.paket.masalah.item_parallel_tier_mixed"
  | "studio.paket.masalah.item_parallel_cycle_mixed"
  | "studio.paket.masalah.item_options_too_few"
  | "studio.paket.masalah.item_options_too_many"
  | "studio.paket.masalah.item_correct_missing"
  | "studio.paket.masalah.item_correct_too_many"
  | "studio.paket.masalah.option_label_invalid"
  | "studio.paket.masalah.option_label_repeated"
  | "studio.paket.masalah.option_text_missing"
  | "studio.paket.masalah.option_reason_missing"
  | "studio.paket.masalah.option_correct_invalid"
  | "studio.paket.masalah.option_misconception_unknown"
  | "studio.paket.masalah.misconception_code_invalid"
  | "studio.paket.masalah.misconception_text_missing"
  | "studio.paket.masalah.misconception_repeated"
  | "studio.paket.masalah.misconception_definition_differs"
  | "studio.paket.masalah.text_too_long"
  | "studio.paket.masalah.package_could_not_be_saved"
  | "studio.paket.masalah.revision_course_unknown"
  | "studio.paket.masalah.revision_not_released"
  | "studio.paket.masalah.revision_not_latest"
  | "studio.paket.masalah.revision_one_course"
  | "studio.paket.masalah.revision_summary_missing"
  | "studio.paket.masalah.lain"
  | "studio.paket.kode.package_not_allowed"
  | "studio.paket.kode.package_state_invalid"
  | "studio.paket.kode.package_school_not_allowed"
  | "studio.paket.kode.package_has_problems"
  | "studio.paket.kode.package_input_invalid"
  | "studio.paket.kode.package_failed"
  | "studio.terbitan.kode.release_not_allowed"
  | "studio.terbitan.kode.release_move_started"
  | "studio.terbitan.kode.release_move_no_cycle_definition"
  | "studio.terbitan.kode.release_publish_not_allowed"
  | "studio.terbitan.kode.release_school_not_allowed"
  | "studio.terbitan.kode.release_course_not_approved"
  | "studio.terbitan.kode.release_exists"
  | "studio.terbitan.kode.release_state_invalid"
  | "studio.terbitan.kode.release_same_person"
  | "studio.terbitan.kode.release_not_ready"
  | "studio.terbitan.kode.release_reason_required"
  | "studio.terbitan.kode.release_input_invalid"
  | "studio.terbitan.kode.release_failed"
  | "studio.paket.buat_terbitan"
  // DAISY-07: what makes an absent figure appear; class by class; the admin's reports
  | "laporan.muncul.penilaian"
  | "laporan.muncul.akhir" | "laporan.muncul.gerbang"
  | "laporan.muncul.awal_akhir"
  | "laporan.muncul.miskonsepsi"
  | "laporan.muncul.sertifikat"
  | "pimpinan.kelas.murid"
  | "pimpinan.kelas.judul"
  | "pimpinan.kelas.arti"
  | "pimpinan.kelas.ada"
  | "pimpinan.kelas.belum"
  | "pimpinan.kelas.kosong"
  | "pimpinan.laporan.sekolah"
  | "pimpinan.laporan.kelas"
  | "config.laporan.judul"
  | "config.laporan.arti"
  | "config.laporan.sekolah"
  | "config.laporan.kelas"
  | "config.laporan.tanpa_kelas"
  // DAISY-06, the Terbit step: the seven steps to publication, named
  | "studio.langkah.judul"
  | "studio.langkah.arti"
  | "studio.langkah.oleh"
  | "studio.langkah.atau"
  | "studio.langkah.bukan_penyusun"
  | "studio.langkah.keadaan.selesai"
  | "studio.langkah.keadaan.kini"
  | "studio.langkah.keadaan.nanti"
  | "studio.langkah.tunggu.penyusun"
  | "studio.langkah.tunggu.wewenang"
  | "studio.state.MENUNGGU" | "studio.state.explain.MENUNGGU"
  | "studio.langkah.dikembalikan"
  | "studio.langkah.sibuk"
  | "studio.langkah.hambatan"
  | "studio.hambatan.readiness_text_error"
  | "studio.hambatan.readiness_text_warning"
  | "studio.hambatan.readiness_item_error"
  | "studio.hambatan.readiness_item_warning"
  | "studio.hambatan.readiness_not_validated"
  | "studio.hambatan.readiness_returned"
  | "studio.hambatan.readiness_awaiting_review"
  | "studio.hambatan.readiness_no_release"
  | "studio.hambatan.readiness_not_sealed"
  | "studio.hambatan.lain"
  | "studio.hambatan.pelajaran"
  | "studio.hambatan.pola.answer_position_skew"
  | "studio.hambatan.pola.correct_option_length_imbalance"
  | "studio.hambatan.pola.implausible_distractor"
  | "studio.hambatan.pola.stem_reveals_answer"
  | "studio.hambatan.pola.lain"
  | "studio.langkah.susun.judul"
  | "studio.langkah.susun.arti"
  | "studio.langkah.susun.tombol"
  | "studio.langkah.periksa.judul"
  | "studio.langkah.periksa.arti"
  | "studio.langkah.periksa.tombol"
  | "studio.langkah.ajukan.judul"
  | "studio.langkah.ajukan.arti"
  | "studio.langkah.ajukan.tombol"
  | "studio.langkah.setujui.judul"
  | "studio.langkah.setujui.arti"
  | "studio.langkah.setujui.tombol"
  | "studio.langkah.buat.judul"
  | "studio.langkah.buat.arti"
  | "studio.langkah.buat.tombol"
  | "studio.langkah.kunci.judul"
  | "studio.langkah.kunci.arti"
  | "studio.langkah.kunci.tombol"
  | "studio.langkah.terbitkan.judul"
  | "studio.langkah.terbitkan.arti"
  | "studio.langkah.terbitkan.tombol"
  | "studio.langkah.terbit.judul"
  | "studio.langkah.terbit.sejak"
  | "studio.langkah.terbit.nanti"
  | "studio.langkah.ditarik.judul"
  | "studio.langkah.ditarik.arti"
  | "studio.langkah.tarik.alasan"
  | "studio.paket.tarik.tanya" | "studio.kanonik.tarik.tanya" | "config.pemeliharaan.akhiri.tanya" | "config.pemeliharaan.pengumuman.tarik.tanya" | "bahaya.batal"
  | "studio.paket.periksa_isi"
  | "studio.paket.periksa_isi_arti"
  | "studio.paket.catatan"
  | "studio.paket.koreksi_alasan"
  | "studio.paket.pindah.judul"
  | "studio.paket.pindah.tujuan"
  | "studio.paket.pindah.sekarang"
  | "studio.paket.pindah.tombol"
  | "studio.sekolah"
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
  | "kembali.riwayat"
  | "entry.learner"
  | "entry.educator"
  | "entry.staff"
  | "entry.halo"
  | "entry.pimpinan"
  | "entry.kosong"
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
  | "koleksi.berikutnya" | "koleksi.ubah"
  | "lesson.prev"
  | "lesson.next"
  | "lesson.transcript"
  | "lesson.speed"
  | "lesson.example.reveal"
  | "lesson.example.done"
  | "lesson.pdf"
  | "lesson.media.tidak_ada"
  | "lesson.media.tidak_ada_teks"
  | "lesson.saved"
  | "posttest.title"
  | "posttest.intro"
  | "ujicepat.title"
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
  | "siklus.panel.eyebrow"
  | "siklus.lihat_langkah"
  | "siklus.aksi.pemetaan"
  | "siklus.aksi.pemetaan_lanjut"
  | "siklus.aksi.pelajaran_mulai"
  | "siklus.aksi.pelajaran"
  | "siklus.aksi.penguasaan"
  | "siklus.aksi.penguasaan_lanjut"
  | "siklus.aksi.hasil"
  | "siklus.siap.judul"
  | "siklus.siap.arti"
  | "siklus.diminta.judul"
  | "siklus.diminta.meminta"
  | "siklus.diminta.arti"
  | "siklus.diminta.sudah"
  | "siklus.milik_anda"
  | "siklus.terbuka"
  | "siklus.buka"
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
  | "siklus.ambang_belum"
  | "mengajar.murid1.target" | "mengajar.murid1.di_bawah_target"
  | "hasil.target.tercapai" | "hasil.target.tercapai_arti" | "hasil.target.belum" | "hasil.target.belum_arti" | "hasil.target.ulang"
  | "siklus.target.tercapai" | "siklus.target.belum" | "siklus.target.lanjut_belum" | "siklus.target.lihat_ulang"
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
  | "evaluasi.keluar_selesai"
  | "evaluasi.berakhir"
  | "evaluasi.sesi_habis"
  | "evaluasi.gagal"
  | "evaluasi.akun_tidak_ada" | "evaluasi.kembali"
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
  | "galat.place_not_a_kelas"
  | "galat.place_not_this_school"
  | "galat.place_staff"
  | "galat.place_already_placed"
  | "galat.place_no_year"
  | "galat.place_departed"
  | "galat.place_elsewhere"
  | "audit.kolom.oleh"
  | "audit.kolom.alasan"
  | "audit.oleh.sistem"
  | "audit.oleh.tidak_terlihat"
  | "audit.oleh.sekolah_lain"
  | "audit.berlaku"
  | "audit.kenaikan.bagian"
  | "audit.kenaikan.ringkas"
  | "audit.kenaikan.n.pindah"
  | "audit.kenaikan.n.keluar"
  | "audit.kenaikan.n.lulus"
  | "audit.kenaikan.n.tinggal"
  | "audit.kenaikan.n.naik"
  | "audit.kenaikan.terkait"
  | "audit.kenaikan.terkait_buka"
  | "audit.kenaikan.tutup"
  | "audit.kenaikan.tinggal"
  | "audit.kenaikan.naik"
  | "audit.kenaikan.judul"
  | "audit.kenaikan.bagian_umum"
  | "kenaikan.keputusan.naik"
  | "kenaikan.keputusan.tinggal"
  | "kenaikan.keputusan.lulus"
  | "kenaikan.keputusan.keluar"
  | "kenaikan.keputusan.pindah"
  | "audit.aksi.enrollment.ended_with_reason"
  | "audit.aksi.enrollment.reopened"
  | "audit.aksi.promotion.applied"
  | "audit.alasan.graduated"
  | "audit.alasan.withdrawn"
  | "audit.alasan.transfer_external"
  | "audit.alasan.moved_abroad"
  | "audit.alasan.deceased"
  | "audit.alasan.other"
  | "config.akhiri.buka"
  | "config.akhiri.judul"
  | "config.akhiri.arti"
  | "config.akhiri.alasan"
  | "config.akhiri.alasan.graduated"
  | "config.akhiri.alasan.withdrawn"
  | "config.akhiri.alasan.transfer_external"
  | "config.akhiri.alasan.moved_abroad"
  | "config.akhiri.alasan.deceased"
  | "config.akhiri.alasan.other"
  | "config.akhiri.tanggal"
  | "config.akhiri.keterangan"
  | "config.akhiri.tombol"
  | "config.kembali.judul"
  | "config.kembali.arti"
  | "config.kembali.di_sekolah_lain"
  | "config.kembali.jenis"
  | "config.kembali.jenis.koreksi"
  | "config.kembali.jenis.kembali"
  | "config.kembali.kelas"
  | "config.kembali.kelas_semula"
  | "config.kembali.alasan"
  | "config.kembali.tombol"
  | "config.kembali.kosong"
  | "config.kembali.akhir.completed"
  | "config.kembali.akhir.withdrawn"
  | "config.kembali.akhir.transferred_out"
  | "config.kembali.akhir.expired"
  | "galat.enrolment_ended"
  | "galat.learner_reenrolled"
  | "kenaikan.langkah"
  | "kenaikan.langkah.kelas"
  | "kenaikan.langkah.keputusan"
  | "kenaikan.langkah.tinjau"
  | "kenaikan.kelas.sudah"
  | "kenaikan.selesai.berikut"
  | "kenaikan.selesai.sesuai"
  | "kenaikan.selesai.tidak_sesuai"
  | "kenaikan.selesai.keputusan"
  | "kenaikan.selesai.tercatat"
  | "kenaikan.selesai.periksa"
  | "kenaikan.selesai.guru_kosong"
  | "kenaikan.tinjau.pengecualian"
  | "kenaikan.tinjau.dari_tingkat"
  | "kenaikan.tinjau.kalimat"
  | "kenaikan.guru.ke_peran_tab"
  | "kenaikan.guru.tahu_tanpa"
  | "kenaikan.guru.semua_ada"
  | "kenaikan.guru.tanpa_tujuan"
  | "kenaikan.opsi.lulus_grup"
  | "kenaikan.opsi.pindah_grup"
  | "kenaikan.hitung.naik"
  | "kenaikan.hitung.tinggal"
  | "kenaikan.hitung.tinggal_di"
  | "kenaikan.hitung.lulus"
  | "kenaikan.hitung.keluar"
  | "kenaikan.hitung.pindah"
  | "kenaikan.hitung.belum"
  | "kenaikan.hitung.belum_nama"
  | "kenaikan.murid.pengecualian"
  | "kenaikan.semua.diterapkan"
  | "kenaikan.semua.diterapkan_semua"
  | "kenaikan.berakhir"
  | "kenaikan.berakhir.graduated"
  | "kenaikan.berakhir.withdrawn"
  | "kenaikan.berakhir.transfer_external"
  | "kenaikan.berakhir.moved_abroad"
  | "kenaikan.berakhir.deceased"
  | "kenaikan.berakhir.other"
  | "kenaikan.intro"
  | "kenaikan.kelas.kosong"
  | "kenaikan.kelas.pilih"
  | "kenaikan.pilih"
  | "kenaikan.kelas.lanjut"
  | "kenaikan.tahun.belum_ada"
  | "kenaikan.tahun.ke_struktur"
  | "kenaikan.tahun.label"
  | "kenaikan.semua.label"
  | "kenaikan.semua.tidak"
  | "kenaikan.semua.terapkan"
  | "kenaikan.murid.kosong"
  | "kenaikan.murid.intro"
  | "kenaikan.murid.tingkat_saja"
  | "kenaikan.murid.sedang_pindah"
  | "kenaikan.murid.asesmen_terbuka"
  | "kenaikan.murid.keputusan_untuk"
  | "kenaikan.murid.tinjau"
  | "kenaikan.opsi.naik_grup"
  | "kenaikan.opsi.naik"
  | "kenaikan.opsi.tinggal_grup"
  | "kenaikan.opsi.tinggal"
  | "kenaikan.opsi.lulus"
  | "kenaikan.opsi.keluar_grup"
  | "kenaikan.opsi.pindah"
  | "kenaikan.alasan.withdrawn"
  | "kenaikan.alasan.transfer_external"
  | "kenaikan.alasan.moved_abroad"
  | "kenaikan.alasan.deceased"
  | "kenaikan.tinjau.judul"
  | "kenaikan.tinjau.intro"
  | "kenaikan.tinjau.konfirmasi"
  | "kenaikan.tinjau.ubah"
  | "kenaikan.guru.judul"
  | "kenaikan.guru.intro"
  | "kenaikan.guru.tidak_ada"
  | "kenaikan.guru.ke_peran"
  | "kenaikan.hasil.naik"
  | "kenaikan.hasil.tinggal"
  | "kenaikan.hasil.lulus"
  | "kenaikan.hasil.keluar"
  | "kenaikan.hasil.pindah"
  | "kenaikan.hasil.asesmen"
  | "kenaikan.selesai.ok"
  | "kenaikan.selesai.judul"
  | "kenaikan.selesai.tidak_terbaca"
  | "kenaikan.selesai.lagi"
  | "kenaikan.akhir.completed"
  | "kenaikan.akhir.withdrawn"
  | "kenaikan.akhir.transferred_out"
  | "kenaikan.akhir.expired"
  | "galat.promo_changed"
  | "galat.promo_undecided"
  | "galat.promo_teachers_unreviewed"
  | "galat.promo_year_invalid"
  | "galat.promo_decision_invalid"
  | "galat.promo_target_invalid"
  | "galat.promo_no_transfer"
  | "galat.promo_already_in_year"
  | "galat.promo_run_incomplete"
  | "galat.enrol_not_live"
  | "galat.enrol_reason_invalid"
  | "galat.enrol_explanation_required"
  | "galat.enrol_date_invalid"
  | "galat.enrol_sitting_open"
  | "galat.enrol_kind_invalid"
  | "galat.enrol_reason_required"
  | "galat.enrol_not_correctable"
  | "galat.enrol_not_ended"
  | "galat.enrol_already_live"
  | "galat.enrol_not_departed"
  | "galat.enrol_year_closed"
  | "galat.learner_placed"
  | "config.tempatkan.judul"
  | "config.tempatkan.arti"
  | "config.tempatkan.kosong"
  | "config.tempatkan.tombol"
  | "config.tempatkan.ke"
  | "studio.bucket.RELEASE_STEP"
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
  | "studio.paket.terbit_bukan_tugas"
  | "studio.paket.revisi"
  | "studio.paket.revisi_terbaru"
  | "studio.paket.revisi_penjelasan"
  | "studio.paket.revisi_sebelum"
  | "studio.paket.revisi_unggah"
  | "studio.paket.riwayat.judul"
  | "studio.paket.riwayat.asli"
  | "studio.paket.riwayat.belum_terbit"
  | "studio.paket.riwayat.versi_pertama"
  | "studio.paket.riwayat.oleh"
  | "studio.paket.riwayat.ini"
  | "studio.paket.riwayat.buka"
  | "studio.paket.kosong"
  | "studio.beranda.tak_ada_tugas"
  | "studio.state.explain.TERBIT"
  | "studio.temuan.judul"
  | "studio.temuan.orang_kedua"
  | "studio.temuan.lokasi"
  | "studio.temuan.mengapa"
  | "studio.temuan.cara"
  | "studio.temuan.akui"
  | "studio.temuan.kosong"
  | "studio.unggah.judul"
  | "studio.unggah.mudah"
  | "studio.unggah.mudah_penjelasan"
  | "studio.unggah.terstruktur"
  | "studio.unggah.terstruktur_penjelasan"
  | "studio.unggah.buat_video"
  | "studio.unggah.pertanyaan"
  | "studio.unggah.konfirmasi"
  | "studio.templat.judul"
  | "studio.templat.cara.1"
  | "studio.templat.cara.2"
  | "studio.templat.cara.3"
  | "studio.templat.cara.4"
  | "studio.templat.cara.5"
  | "studio.templat.cara.6"
  | "studio.templat.kolom.lembar"
  | "studio.templat.kolom.kolom"
  | "studio.templat.kolom.wajib"
  | "studio.templat.kolom.pilihan"
  | "studio.templat.kolom.batas"
  | "studio.templat.kolom.arti"
  | "studio.templat.ya"
  | "studio.templat.tidak"
  | "studio.templat.batas.judul"
  | "studio.templat.batas.berkas"
  | "studio.templat.batas.kursus"
  | "studio.templat.batas.baris"
  | "studio.templat.batas.pelajaran"
  | "studio.templat.batas.soal"
  | "studio.templat.batas.pilihan"
  | "studio.templat.batas.media"
  | "studio.templat.batas.transkrip"
  | "studio.templat.paling_besar"
  | "studio.templat.paling_banyak"
  | "studio.templat.satu_kursus"
  | "studio.templat.baris_termasuk_judul"
  | "studio.templat.berlabel"
  | "studio.templat.media.gambar"
  | "studio.templat.media.audio"
  | "studio.templat.media.video"
  | "studio.templat.nama_media"
  | "studio.templat.karakter"
  | "studio.templat.transkrip_wajib"
  | "studio.unggah.buku.judul"
  | "studio.unggah.buku.arti"
  | "studio.unggah.templat"
  | "studio.unggah.templat_arti"
  | "studio.unggah.sekolah"
  | "studio.unggah.tanpa_sekolah"
  | "studio.unggah.berkas"
  | "studio.unggah.berkas_batas"
  | "studio.unggah.revisi"
  | "studio.unggah.revisi_bukan"
  | "studio.unggah.revisi_arti"
  | "studio.unggah.ringkasan"
  | "studio.unggah.ringkasan_arti"
  | "studio.unggah.langkah.periksa"
  | "studio.unggah.langkah.media"
  | "studio.unggah.langkah.simpan"
  | "studio.unggah.sibuk.periksa"
  | "studio.unggah.sibuk.media"
  | "studio.unggah.sibuk.simpan"
  | "studio.unggah.lolos"
  | "studio.unggah.hitung.courses"
  | "studio.unggah.hitung.modules"
  | "studio.unggah.hitung.lessons"
  | "studio.unggah.hitung.items"
  | "studio.unggah.hitung.options"
  | "studio.unggah.hitung.media"
  | "studio.unggah.masalah_judul"
  | "studio.unggah.lokasi.lembar"
  | "studio.unggah.lokasi.baris"
  | "studio.unggah.lokasi.kolom"
  | "studio.unggah.lokasi.berkas"
  | "studio.unggah.masalah_lain"
  | "studio.unggah.media_arti"
  | "studio.unggah.media_pilih"
  | "studio.unggah.media.belum"
  | "studio.unggah.media.siap"
  | "studio.unggah.media.naik"
  | "studio.unggah.media.selesai"
  | "studio.unggah.media.gagal"
  | "studio.unggah.media_progres"
  | "studio.unggah.simpan_arti"
  | "studio.unggah.tersimpan"
  | "studio.unggah.buka_kursus"
  | "studio.unggah.ulang"
  | "studio.unggah.rujukan"
  | "studio.unggah.json_judul"
  | "studio.unggah.json_arti"
  | "studio.unggah.isi_json"
  | "studio.unggah.periksa_mudah"
  | "studio.unggah.periksa_terstruktur"
  | "studio.unggah.produsen"
  | "studio.unggah.kontrak"
  | "studio.unggah.permintaan"
  | "studio.tinjau.judul"
  | "studio.tinjau.kosong"
  | "studio.tinjau.penulis"
  | "studio.tinjau.bukan_penulis"
  | "studio.kanonik.judul"
  | "studio.kanonik.penjelasan"
  | "studio.kanonik.kosong"
  | "studio.kanonik.ditarik"
  | "studio.kanonik.hanya_baca"
  | "studio.kanonik.unit.tujuan"
  | "studio.definisi.judul"
  | "studio.definisi.batas"
  | "studio.definisi.simpan"
  | "studio.definisi.versi_baru"
  | "studio.definisi.tetap"
  | "studio.integritas.judul"
  | "studio.integritas.penjelasan"
  | "studio.integritas.kosong"
  | "studio.integritas.menunggu_lain"
  | "studio.integritas.menunggu_lain_satu"
  | "studio.integritas.NO_CONCERN"
  | "studio.integritas.DISCUSSED_WITH_LEARNER"
  | "studio.integritas.REFERRED_TO_INSTITUTION"
  | "studio.integritas.catat"
  | "studio.integritas.menunggu.judul"
  | "studio.integritas.ditinjau.judul"
  | "studio.integritas.ditinjau.kosong"
  | "studio.integritas.keadaan.menunggu"
  | "studio.integritas.keadaan.ditinjau"
  | "studio.integritas.catatan.arti"
  | "studio.integritas.oleh"
  | "studio.integritas.catatan_tercatat"
  | "studio.integritas.rujukan.judul"
  | "studio.integritas.rujukan.langkah.diteruskan"
  | "studio.integritas.rujukan.langkah.ditinjau"
  | "studio.integritas.rujukan.langkah.diputuskan"
  | "studio.integritas.rujukan.hasil"
  | "studio.integritas.rujukan.hasil.NO_FURTHER_ACTION"
  | "studio.integritas.rujukan.hasil.LEARNER_SUPPORT_ARRANGED"
  | "studio.integritas.rujukan.hasil.ESCALATED_TO_INSTITUTION"
  | "studio.integritas.rujukan.catatan"
  | "studio.integritas.rujukan.sedang"
  | "studio.integritas.rujukan.di_pimpinan"
  | "studio.integritas.rujukan.tak_terlihat"
  | "studio.integritas.rujukan.lanjut.NO_FURTHER_ACTION"
  | "studio.integritas.rujukan.lanjut.LEARNER_SUPPORT_ARRANGED"
  | "studio.integritas.rujukan.lanjut.ESCALATED_TO_INSTITUTION"
  | "studio.sertifikat.judul"
  | "studio.sertifikat.tata_letak"
  | "studio.sertifikat.identitas"
  | "studio.sertifikat.simpan"
  | "studio.bank.judul"
  | "studio.bank.intro"
  | "studio.bank.kesehatan"
  | "studio.bank.prediksi" | "studio.soal.miskonsepsi" | "alasan.nonaktif.jawab" | "alasan.nonaktif.periksa"
  | "studio.bank.empiris"
  | "studio.bank.akui_ok"
  | "studio.bank.tindakan"
  | "studio.bank.saring.untuk"
  | "studio.bank.saring.semua"
  | "studio.bank.saring.tombol"
  | "studio.bank.kunci_alasan"
  | "studio.hasil.ok"
  | "studio.hasil.gagal"
  // BOB-07 (D-011): the stable codes' sentences (src/lib/galat-kontrak.ts)
  | "galat.action_not_allowed"
  | "galat.action_not_found"
  | "galat.action_input_invalid"
  | "galat.action_already_exists"
  | "galat.action_unchanged"
  | "galat.action_failed"
  | "galat.rollover_input_incomplete"
  | "galat.transfer_input_incomplete"
  | "galat.role_input_incomplete"
  | "galat.role_reason_required"
  | "galat.role_scope_required"
  | "galat.template_input_incomplete"
  | "galat.school_required"
  | "galat.move_input_incomplete"
  | "galat.move_not_current"
  | "galat.move_not_a_kelas"
  | "galat.move_same_kelas"
  | "galat.move_other_year"
  | "galat.move_already_in_kelas"
  | "galat.learner_moved"
  | "galat.pass_mark_set" | "galat.pass_mark_unchanged" | "galat.pass_mark_input_incomplete" | "galat.pass_mark_missing"
  | "galat.rollover_done"
  | "galat.template_saved"
  | "galat.role_granted"
  | "galat.role_revoked"
  | "pindah.menunggu_tujuan"
  | "pindah.masuk.judul"
  | "pindah.masuk.dari"
  | "pindah.masuk.tahun"
  | "pindah.masuk.program"
  | "pindah.masuk.kelas"
  | "pindah.masuk.terima"
  | "pindah.keluar.judul"
  | "pindah.keluar.arti"
  | "pindah.cari.label"
  | "config.cari_orang.label"
  | "config.cari_orang.tombol"
  | "config.cari_orang.arti"
  | "pindah.cari.tombol"
  | "pindah.cari.kosong"
  | "pindah.tujuan"
  | "galat.transfer_destination_invalid"
  | "galat.transfer_reason_required"
  | "galat.transfer_open"
  | "galat.transfer_enrollment_not_active"
  | "galat.transfer_period_invalid"
  | "galat.transfer_programme_invalid"
  | "galat.transfer_not_open"
  | "galat.transfer_search_short"
  | "galat.transfer_period_missing"
  | "galat.transfer_already_enrolled"
  | "galat.transfer_place_invalid"
  | "galat.transfer_accepted"
  | "galat.transfer_requested"
  | "galat.transfer_authorized"
  | "galat.transfer_executed"
  | "galat.transfer_rejected"
  | "galat.step_taken"
  | "galat.check_run"
  | "galat.finding_acknowledged"
  | "galat.revision_created"
  | "galat.assignment_moved"
  | "galat.distribution_granted"
  | "galat.distribution_withdrawn"
  | "galat.review_recorded"
  | "galat.certificate_saved"
  | "galat.quick_check_launched"
  | "galat.draft_created"
  | "studio.konten.kode.content_transition_invalid"
  | "studio.konten.kode.content_review_not_allowed"
  | "studio.konten.kode.content_reviewer_required"
  | "studio.konten.kode.content_author_unknown"
  | "studio.konten.kode.content_reviewer_is_author"
  | "studio.konten.kode.content_check_errors"
  | "studio.konten.kode.content_reviewer_not_caller"
  | "studio.konten.kode.content_seal_not_allowed"
  | "studio.konten.kode.content_publish_not_allowed"
  | "studio.konten.kode.content_withdraw_not_allowed"
  | "studio.konten.kode.content_author_immutable"
  | "studio.konten.kode.content_created_not_ingested"
  | "mengajar.judul"
  | "nav.kelas" | "nav.pimpinan" | "nav.pendataan"
  | "nav.aktivasi" | "nav.konfigurasi" | "nav.studio" | "nav.tempat" | "nav.menu" | "config.kelompok.sekolah" | "config.kelompok.murid" | "config.kelompok.staf" | "config.kelompok.laporan" | "config.kelompok.dukungan" | "nav.ciutkan" | "nav.lebarkan" | "nav.buka_menu" | "nav.tutup_menu"
  | "tombol.menerbitkan"
  | "studio.langkah.selesai.terbitkan"
  // W1.6 / W1.8 (Batch 3): the reviewer's send-back, its record, and the author's way on
  | "studio.kembali.tombol" | "studio.kembali.judul" | "studio.kembali.arti" | "studio.kembali.alasan"
  | "studio.kembali.alasan_arti" | "studio.kembali.batal" | "studio.kembali.alasan_dari" | "studio.kembali.jalan_unggah"
  | "tombol.mengembalikan"
  | "galat.sent_back" | "galat.sendback_not_reviewer" | "galat.sendback_not_in_review" | "galat.sendback_reviewer_is_author"
  | "galat.sendback_reason_missing"
  | "studio.paket.riwayat.disetujui" | "studio.paket.riwayat.dikembalikan"
  | "studio.integritas.tindak"
  | "pimpinan.keadaan.menunggu_keputusan"
  | "kesiapan.pita.judul"
  | "laporan.standar.class_learning_intelligence"
  | "laporan.standar.institution_learning_intelligence"
  | "laporan.standar.learner_result"
  | "laporan.tampilan.bar"
  | "laporan.tampilan.list"
  | "laporan.tampilan.table"
  | "laporan.tampilan.card_list"
  | "laporan.tampilan.distribution"
  | "laporan.tampilan.hero_stat"
  | "laporan.tampilan.summary"
  | "studio.definisi.unit.soal"
  | "studio.definisi.unit.tenggang"
  | "studio.definisi.unit.detik"
  | "studio.definisi.unit.percobaan"
  | "studio.definisi.f.judul"
  | "studio.definisi.f.mode"
  | "studio.definisi.f.jumlah"
  | "studio.definisi.f.keselamatan"
  | "studio.definisi.f.ragu"
  | "studio.definisi.f.tenggang"
  | "studio.definisi.f.percobaan"
  | "studio.definisi.f.acak"
  | "studio.definisi.f.jeda"
  | "studio.definisi.f.luring"
  | "studio.definisi.acak.NONE"
  | "studio.definisi.acak.ITEMS"
  | "studio.definisi.acak.ITEMS_AND_OPTIONS"
  // W1.3 (Batch 3; RV-14, DG-28/29): Aturan Asesmen's hints, its limits in minutes and words, its choices as rows
  | "studio.definisi.wajib" | "studio.definisi.unit.menit"
  | "studio.definisi.kata.antara" | "studio.definisi.kata.dan"
  | "studio.definisi.f.tenggang_menit" | "studio.definisi.f.komposisi" | "studio.definisi.f.selama"
  | "studio.definisi.petunjuk.jumlah" | "studio.definisi.petunjuk.keselamatan" | "studio.definisi.petunjuk.ragu"
  | "studio.definisi.petunjuk.tenggang" | "studio.definisi.petunjuk.percobaan" | "studio.definisi.petunjuk.komposisi"
  | "studio.definisi.petunjuk.jeda" | "studio.definisi.petunjuk.luring"
  // W1.5 (Batch 3; UX-01): the question check's findings, one group per kind, acknowledged together
  | "studio.temuan.kelompok.jumlah" | "studio.temuan.kelompok.lokasi" | "studio.temuan.akui_semua"
  | "studio.temuan.perbaiki_dulu" | "galat.findings_acknowledged"
  // W1.10 (Batch 3; DG-36): the example-only workbook beside the blank template
  | "studio.unggah.contoh" | "studio.unggah.contoh_arti"
  | "config.sekolah.sintetis" | "config.sekolah.aktif" | "config.sekolah.nonaktif"
  // Sharon F1: a school's own clock
  | "config.sekolah.zona.Asia/Jakarta" | "config.sekolah.zona.Asia/Makassar" | "config.sekolah.zona.Asia/Jayapura"
  | "config.sekolah.zona.label" | "config.sekolah.zona.simpan" | "config.sekolah.zona.sekolah"
  | "audit.aksi.institution.time_zone_changed"
  // D-138/D-140: the audit trail in words
  | "audit.aksi.ASSESSMENT_DEFINITION_CREATED"
  | "audit.aksi.ASSESSMENT_DEFINITION_RELABELLED"
  | "audit.aksi.ASSESSMENT_DEFINITION_VERSIONED"
  | "audit.aksi.CERTIFICATE_TEMPLATE_SAVED"
  | "audit.aksi.COURSE_CORRECTION_UPLOADED"
  | "audit.aksi.COURSE_REVISION_CREATED"
  | "audit.aksi.EVIDENCE_RECLASSIFIED"
  | "audit.aksi.FINDING_ACKNOWLEDGED"
  | "audit.aksi.INTEGRITY_SIGNAL_REVIEWED"
  | "audit.aksi.LEARNING_ASSIGNED"
  | "audit.aksi.LEARNING_RELEASE_MOVED"
  | "audit.aksi.QUESTION_HEALTH_REVIEWED"
  | "audit.aksi.RELEASE_CREATED"
  | "audit.aksi.RELEASE_DISTRIBUTION_GRANTED"
  | "audit.aksi.RELEASE_DISTRIBUTION_WITHDRAWN"
  | "audit.aksi.RELEASE_FROZEN"
  | "audit.aksi.RELEASE_PUBLISHED"
  | "audit.aksi.RELEASE_WITHDRAWN"
  | "audit.aksi.account.activated"
  | "audit.aksi.account.activation_authorized"
  | "audit.aksi.account.card_reissued"
  | "audit.aksi.account.new_person_authorized"
  | "audit.aksi.assessment_result.recomputed"
  | "audit.aksi.assessment_session.deadline_extended"
  | "audit.aksi.assessment_session.terminated"
  | "audit.aksi.briefing.holding"
  | "audit.aksi.briefing.opened"
  | "audit.aksi.briefing.transition"
  | "audit.aksi.certificate.issued"
  | "audit.aksi.certificate.prepared"
  | "audit.aksi.certificate.revoked"
  | "audit.aksi.class.status_changed"
  | "audit.aksi.content.status_changed"
  | "audit.aksi.enrollment.created"
  | "audit.aksi.evaluation.assume"
  | "audit.aksi.evaluation.exit"
  | "audit.aksi.evaluator.grant"
  | "audit.aksi.evaluator.revoke"
  | "audit.aksi.feedback_cycle.closed"
  | "audit.aksi.feedback_cycle.opened"
  | "audit.aksi.feedback_question_set.published"
  | "audit.aksi.feedback_threshold.published"
  | "audit.aksi.identity.device_declared"
  | "audit.aksi.identity.email_corrected"
  | "audit.aksi.identity.name_confirmed"
  | "audit.aksi.identity.name_corrected"
  | "audit.aksi.identity.name_corrected_at_activation"
  | "audit.aksi.identity.password_set"
  | "audit.aksi.identity.pin_set"
  | "audit.aksi.identity.recovery_locked"
  | "audit.aksi.identity.recovery_pin_ok"
  | "audit.aksi.identity.recovery_pin_wrong"
  | "audit.aksi.identity.recovery_restored"
  | "audit.aksi.identity.recovery_suspended"
  | "audit.aksi.identity.recovery_verified"
  | "audit.aksi.identity.session_ended"
  | "audit.aksi.identity.session_pin_wrong"
  | "audit.aksi.identity.session_resumed"
  | "audit.aksi.identity.setup_completed"
  | "audit.aksi.identity.username_claimed"
  | "audit.aksi.identity.username_corrected"
  | "audit.aksi.import.completed"
  | "audit.aksi.import.confirmed"
  | "audit.aksi.import.pilot_completed"
  | "audit.aksi.import.pilot_verified"
  | "audit.aksi.ingest.materialised"
  | "audit.aksi.ingest.prepared"
  | "audit.aksi.institution.created"
  | "audit.aksi.institution.state_changed"
  | "audit.aksi.institution_namespace.reserved"
  | "audit.aksi.learner_detail.opened"
  | "audit.aksi.lesson_review.requested"
  | "audit.aksi.maintenance.activated"
  | "audit.aksi.maintenance.cancelled"
  | "audit.aksi.maintenance.deactivated"
  | "audit.aksi.maintenance.emergency_stop"
  | "audit.aksi.maintenance.ended_now"
  | "audit.aksi.maintenance.scheduled"
  | "audit.aksi.maintenance.started_now"
  | "audit.aksi.management_decision.advanced"
  | "audit.aksi.management_decision.raised"
  | "audit.aksi.membership.closed"
  | "audit.aksi.membership.created"
  | "audit.aksi.metric_catalogue.published"
  | "audit.aksi.mode_policy.changed"
  | "audit.aksi.notice.published"
  | "audit.aksi.notice.withdrawn"
  | "audit.aksi.period.rollover"
  | "audit.aksi.platform_config.updated"
  | "audit.aksi.platform_environment.changed"
  | "audit.aksi.professional_learning.enrolled"
  | "audit.aksi.question_health.recomputed"
  | "audit.aksi.question_health.transition"
  | "audit.aksi.quick_assessment.launched"
  | "audit.aksi.quick_assessment.selected"
  | "audit.aksi.report_template.provisioned"
  | "audit.aksi.report_template.saved"
  | "audit.aksi.role.first_system_admin_bootstrapped"
  | "audit.aksi.role.granted"
  | "audit.aksi.role.revoked"
  | "audit.aksi.school.founded"
  | "audit.aksi.school_pass_mark.set"
  | "audit.aksi.scoring_policy.published"
  | "audit.aksi.structure.academic_year_created"
  | "audit.aksi.structure.bagian_created"
  | "audit.aksi.structure.deactivated"
  | "audit.aksi.structure.jenjang_created"
  | "audit.aksi.structure.kelas_created"
  | "audit.aksi.structure.reguler_created"
  | "audit.aksi.structure.renamed"
  | "audit.aksi.structure.tingkat_created"
  | "audit.aksi.support_report.moved"
  | "audit.aksi.support_report.received"
  | "audit.ranah.account"
  | "audit.ranah.assessment_result"
  | "audit.ranah.assessment_session"
  | "audit.ranah.briefing"
  | "audit.ranah.certificate"
  | "audit.ranah.class"
  | "audit.ranah.content"
  | "audit.ranah.enrollment"
  | "audit.ranah.evaluation"
  | "audit.ranah.evaluator"
  | "audit.ranah.feature_flag"
  | "audit.ranah.feedback_cycle"
  | "audit.ranah.feedback_question_set"
  | "audit.ranah.feedback_threshold"
  | "audit.ranah.identity"
  | "audit.ranah.import"
  | "audit.ranah.ingest"
  | "audit.ranah.institution"
  | "audit.ranah.institution_namespace"
  | "audit.ranah.learner_detail"
  | "audit.ranah.lesson_review"
  | "audit.ranah.maintenance"
  | "audit.ranah.management_decision"
  | "audit.ranah.membership"
  | "audit.ranah.metric_catalogue"
  | "audit.ranah.mode_policy"
  | "audit.ranah.notice"
  | "audit.ranah.period"
  | "audit.ranah.platform_config"
  | "audit.ranah.platform_environment"
  | "audit.ranah.probe"
  | "audit.ranah.professional_learning"
  | "audit.ranah.question_health"
  | "audit.ranah.quick_assessment"
  | "audit.ranah.report_template"
  | "audit.ranah.role"
  | "audit.ranah.school"
  | "audit.ranah.school_pass_mark"
  | "audit.ranah.scoring_policy"
  | "audit.ranah.selfcheck"
  | "audit.ranah.structure"
  | "audit.ranah.support_report"
  | "audit.ranah.transfer"
  | "audit.ranah.ASSESSMENT"
  | "audit.ranah.CERTIFICATE"
  | "audit.ranah.COURSE"
  | "audit.ranah.EVIDENCE"
  | "audit.ranah.FINDING"
  | "audit.ranah.INTEGRITY"
  | "audit.ranah.LEARNING"
  | "audit.ranah.QUESTION"
  | "audit.ranah.RELEASE"
  | "audit.tabel.academic_periods"
  | "audit.tabel.assessment_assignments"
  | "audit.tabel.assessment_definitions"
  | "audit.tabel.assessment_results"
  | "audit.tabel.assessment_sessions"
  | "audit.tabel.audit_log"
  | "audit.tabel.briefings"
  | "audit.tabel.broadcast_notices"
  | "audit.tabel.certificate_templates"
  | "audit.tabel.certificates"
  | "audit.tabel.classes"
  | "audit.tabel.courses"
  | "audit.tabel.enrollments"
  | "audit.tabel.evaluation_evaluators"
  | "audit.tabel.evaluation_sessions"
  | "audit.tabel.feature_flags"
  | "audit.tabel.feedback_cycles"
  | "audit.tabel.feedback_question_sets"
  | "audit.tabel.feedback_thresholds"
  | "audit.tabel.import_jobs"
  | "audit.tabel.ingest_batches"
  | "audit.tabel.institutions"
  | "audit.tabel.integrity_signals"
  | "audit.tabel.learning_assignments"
  | "audit.tabel.maintenance_windows"
  | "audit.tabel.management_decisions"
  | "audit.tabel.memberships"
  | "audit.tabel.metric_catalogue"
  | "audit.tabel.mode_policy"
  | "audit.tabel.org_nodes"
  | "audit.tabel.persons"
  | "audit.tabel.platform_config"
  | "audit.tabel.platform_environment"
  | "audit.tabel.probe"
  | "audit.tabel.plp_releases"
  | "audit.tabel.question_health"
  | "audit.tabel.recovery_ladder"
  | "audit.tabel.release_distributions"
  | "audit.tabel.report_templates"
  | "audit.tabel.role_assignments"
  | "audit.tabel.school_pass_marks"
  | "audit.tabel.scoring_policy"
  | "audit.tabel.support_reports"
  | "audit.tabel.transfers"
  | "audit.aksi.lain"
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
  | "umpanbalik.pimpinan.buka" | "umpanbalik.ditolak"
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
  | "pendataan.eyebrow" | "pendataan.judul" | "pendataan.intro" | "pendataan.ditolak" | "pendataan.sekolah" | "pendataan.nomor.arti"
  | "pendataan.kode.judul" | "pendataan.kode.belum" | "pendataan.kode.arti"
  | "pendataan.kode.bentuk" | "pendataan.kode.contoh" | "pendataan.kode.peringatan"
  | "pendataan.kode.simpan" | "pendataan.kode.tersimpan" | "pendataan.kode.beku" | "pendataan.kode.gagal" | "pendataan.kode.label"
  | "pendataan.unggah.judul" | "pendataan.unggah.berkas" | "pendataan.unggah.tempel"
  | "pendataan.unggah.bentuk" | "pendataan.unggah.kosong" | "pendataan.unggah.terbaca" | "pendataan.unggah.contoh_arti" | "pendataan.unggah.contoh_label" | "pendataan.unggah.contoh"
  | "pendataan.peta.judul" | "pendataan.peta.sub" | "pendataan.peta.tidak" | "pendataan.peta.kolom"
  | "pendataan.peta.sama" | "pendataan.peta.wajib" | "pendataan.peta.tanpa_kelas" | "pendataan.peta.tanpa_kelas_ya" | "pendataan.peta.lanjut" | "pendataan.peta.pratayang"
  | "pendataan.medan.display_name" | "pendataan.medan.person_id" | "pendataan.medan.node_id"
  | "pendataan.medan.role" | "pendataan.medan.programme_id"
  | "pendataan.periksa.judul" | "pendataan.periksa.mulai" | "pendataan.periksa.jalan"
  | "pendataan.periksa.bersih" | "pendataan.periksa.ada" | "pendataan.periksa.baris"
  | "pendataan.periksa.perbaiki" | "pendataan.periksa.gagal" | "pendataan.buka.gagal"
  | "pendataan.masalah.nama" | "pendataan.masalah.orang_bentuk" | "pendataan.masalah.orang_asing"
  | "pendataan.masalah.orang_sudah" | "pendataan.masalah.tempat_bentuk"
  | "pendataan.masalah.tempat_asing" | "pendataan.masalah.tempat_luar"
  | "pendataan.masalah.peran_asing" | "pendataan.masalah.peran_dilarang"
  | "pendataan.masalah.peran_tanpa_tempat" | "pendataan.masalah.ganda" | "pendataan.masalah.lain"
  | "pendataan.masalah.tempat_murid" | "pendataan.masalah.staf"
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
  | "pendataan.selesai.judul" | "pendataan.selesai.arti" | "pendataan.unggah.perlu_kode" | "pendataan.lanjut.judul" | "pendataan.lanjut.staf" | "pendataan.lanjut.aktif"
  | "pendataan.gagal.judul" | "pendataan.gagal.baris"
  | "pendataan.daftar.judul" | "pendataan.daftar.kosong" | "pendataan.daftar.buka"
  | "pendataan.keadaan.menyusun" | "pendataan.keadaan.menunggu_konfirmasi"
  | "pendataan.keadaan.percontohan" | "pendataan.keadaan.periksa_percontohan"
  | "pendataan.keadaan.sisa" | "pendataan.keadaan.berjalan"
  | "pendataan.keadaan.selesai" | "pendataan.keadaan.gagal"
  | "mengajar.kembali"
  | "mengajar.sedia.kode.assign_not_allowed"
  | "mengajar.sedia.kode.assign_class_invalid"
  | "mengajar.sedia.kode.assign_release_not_published"
  | "mengajar.sedia.kode.assign_window_invalid"
  | "mengajar.sedia.kode.assign_exists"
  | "mengajar.sedia.kode.assign_pre_test_missing"
  | "mengajar.sedia.kode.assign_post_test_missing"
  | "mengajar.sedia.kode.assign_pre_test_too_short"
  | "mengajar.sedia.kode.assign_post_test_too_short"
  | "mengajar.sedia.kode.assign_cycle_overlap"
  | "mengajar.siap.asal.pintar" | "mengajar.siap.asal.sekolah"
  | "mengajar.sedia.kode.assign_pass_mark_missing" | "mengajar.sedia.kode.assign_exposed_content" | "mengajar.sedia.batas" | "mengajar.sedia.batas_belum"
  | "mengajar.sedia.kode.assign_input_invalid"
  | "mengajar.sedia.kode.assign_failed"
  | "cycle.pemetaan.belum_ada"
  | "cycle.penguasaan.belum_ada"
  | "mengajar.sapa.pagi"
  | "mengajar.sapa.siang"
  | "mengajar.sapa.sore"
  | "mengajar.sapa.malam"
  | "mengajar.beranda.intro"
  | "mengajar.layak.eyebrow"
  | "mengajar.layak.kosong"
  | "mengajar.layak.kelas_baru"
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
  | "mengajar.materi.berakhir"
  | "mengajar.materi.diakhiri_pada"
  | "mengajar.materi.ditarik_pada"
  | "mengajar.materi.alasan"
  | "mengajar.materi.hasil_murid"
  | "mengajar.materi.tanpa_judul"
  | "mengajar.murid1.eyebrow"
  | "mengajar.murid1.catatan"
  | "mengajar.murid1.tugas"
  | "mengajar.murid1.tugas_kosong"
  | "mengajar.murid1.hasil"
  | "mengajar.murid1.hasil_arti"
  | "mengajar.murid1.hasil_kosong"
  | "mengajar.murid1.tujuan"
  | "mengajar.murid1.tujuan_arti"
  | "mengajar.murid1.tujuan_kosong"
  | "mengajar.murid.judul"
  | "mengajar.murid.sub"
  | "mengajar.murid.kosong"
  | "mengajar.status.tersedia"
  | "mengajar.status.selesai"
  | "mengajar.status.belum"
  | "mengajar.status.siap"
  | "mengajar.status.berjalan"
  | "mengajar.status.dijadwalkan"
  | "mengajar.status.diakhiri"
  | "mengajar.status.ditarik"
  | "mengajar.akhiri.buka"
  | "mengajar.akhiri.judul"
  | "mengajar.akhiri.arti"
  | "mengajar.akhiri.selesai_n"
  | "mengajar.akhiri.belum_n"
  | "mengajar.akhiri.berjalan"
  | "mengajar.akhiri.berjalan_kosong"
  | "mengajar.akhiri.jenis"
  | "mengajar.akhiri.jenis.ended"
  | "mengajar.akhiri.jenis.withdrawn"
  | "mengajar.akhiri.alasan"
  | "mengajar.akhiri.alasan.arti"
  | "mengajar.akhiri.konfirmasi"
  | "mengajar.akhiri.tombol"
  | "mengajar.akhiri.tanpa_judul"
  | "hasilbelajar.ditarik"
  | "hasilbelajar.ditutup_awal"
  | "mengajar.murid1.ditarik"
  | "sync.diakhiri_sekolah"
  | "mengajar.akhiri.tombol_tarik"
  | "mengajar.akhiri.tanya"
  | "mengajar.akhiri.tanya_tarik"
  | "mengajar.akhiri.akibat"
  | "mengajar.akhiri.akibat_tarik"
  | "mengajar.akhiri.ok_tarik"
  | "mengajar.akhiri.tutup"
  | "mengajar.akhiri.batal"
  | "mengajar.akhiri.ok"
  | "mengajar.sedia.kode.assign_not_live"
  | "mengajar.sedia.kode.assign_kind_invalid"
  | "mengajar.sedia.kode.assign_reason_required"
  | "mengajar.sedia.kode.assign_in_progress"
  | "mengajar.siap.langkah1"
  | "mengajar.siap.langkah2"
  | "mengajar.siap.langkah3"
  | "mengajar.siap.eyebrow"
  | "mengajar.siap.judul"
  | "mengajar.siap.intro"
  | "mengajar.siap.pilih"
  | "mengajar.siap.pilih.kosong"
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
  | "mengajar.instrumen.QUICK"
  | "mengajar.instrumen.PRACTICE" | "mengajar.instrumen.TEST" | "mengajar.instrumen.EXAM"
  | "mengajar.instrumen.PUBLIC_DEMO" | "mengajar.instrumen.PAPER"
  | "galat.judul" | "galat.arti" | "galat.rujukan" | "galat.ulang" | "galat.beranda"
  | "tidak_ada.judul" | "tidak_ada.arti"
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
  | "mengajar.cepat.jumlah.antara"
  | "mengajar.cepat.jumlah.dan"
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
  | "mengajar.cepat.ok"
  | "mengajar.sedia.ok"
  | "mengajar.cepat.ubah"
  | "mengajar.cepat.hidup.eyebrow"
  | "mengajar.cepat.hidup.judul"
  | "mengajar.cepat.hidup.kumpul"
  | "mengajar.cepat.hidup.sisa"
  | "mengajar.cepat.hidup.menit"
  | "mengajar.cepat.hidup.catatan"
  | "mengajar.cepat.hidup.siapa"
  | "mengajar.cepat.tolak.awal"
  | "mengajar.cepat.tolak.bank"
  | "mengajar.cepat.tolak.jumlah"
  | "mengajar.cepat.tolak.menit"
  | "mengajar.cepat.tolak.izin"
  | "mengajar.cepat.tolak.tidak_ada"
  | "mengajar.cepat.tolak.umum"
  | "mengajar.cepat.tolak.ketuntasan"
  | "mengajar.cepat.tolak.pilih_jumlah" | "mengajar.cepat.tolak.pilih_jumlah2" | "mengajar.cepat.tolak.pilih_bukan"
  | "mengajar.cepat.tolak.pilih_versi" | "mengajar.cepat.pilih" | "mengajar.cepat.pilih.arti" | "mengajar.cepat.pilih.tampilkan"
  | "mengajar.cepat.pilih.kosong" | "mengajar.cepat.dipilih" | "mengajar.cepat.peran.PRE_TEST" | "mengajar.cepat.peran.POST_TEST"
  | "mengajar.cepat.tingkat.MUDAH" | "mengajar.cepat.tingkat.SEDANG" | "mengajar.cepat.tingkat.SULIT"
  | "mengajar.cepat.tinjau.soal" | "mengajar.cepat.tinjau.ubah" | "mengajar.cepat.terakhir" | "mengajar.cepat.pelajaran"
  | "mengajar.cepat.atau"
  | "mengajar.bukti.eyebrow"
  | "mengajar.bukti.judul"
  | "mengajar.bukti.intro"
  | "mengajar.bukti.keadaan"
  | "mengajar.bukti.kumpul"
  | "mengajar.bukti.jendela"
  | "mengajar.bukti.belum"
  | "mengajar.bukti.mulai"
  | "mengajar.bukti.siapa"
  | "mengajar.bukti.siapa_peserta"
  | "mengajar.bukti.pd.arti"
  | "mengajar.bukti.pd.buka"
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
  | "mengajar.siapa.judul"
  | "mengajar.siapa.sudah"
  | "mengajar.siapa.belum"
  | "mengajar.siapa.sedang"
  | "mengajar.siapa.catatan"
  | "mengajar.siapa.kosong"
  // Batch 3 · W2.4, W3.11, W3.17 (Mengajar)
  | "bentuk.opsional"
  | "mengajar.sedia.selesai"
  | "mengajar.ulang.selesai"
  | "mengajar.cepat.hasil.judul"
  | "mengajar.cepat.hasil.lihat"
  | "mengajar.cepat.hasil.kelas"
  | "mengajar.cepat.hasil.belum_cukup"
  | "mengajar.cepat.hasil.muncul"
  | "mengajar.cepat.hasil.dasar"
  | "mengajar.cepat.hasil.arti"
  | "mengajar.cepat.hasil.belum"
  | "mengajar.cepat.hasil.rincian"
  | "mengajar.cepat.hasil.rincian.arti"
  | "mengajar.cepat.hasil.kolom.nama"
  | "mengajar.cepat.hasil.kolom.keadaan"
  | "mengajar.cepat.hasil.kolom.nilai"
  | "mengajar.cepat.hasil.nilai_belum"
  | "mengajar.cepat.hasil.kembali"
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
  | "emailuji.ditolak"
  | "emailuji.r.judul"
  | "emailuji.r.intro"
  | "emailuji.r.arti"
  | "emailuji.r.label"
  | "emailuji.r.tombol"
  | "emailuji.r.kode"
  | "emailuji.r.isian"
  | "emailuji.r.ditolak"
  | "emailuji.r.gagal"
  | "emailuji.r.kosong"
  | "emailuji.r.jenis.KODE_AKTIVASI"
  | "emailuji.r.jenis.KODE_ULANG"
  | "emailuji.r.jenis.PEMULIHAN_PASSWORD"
  | "emailuji.r.jenis.PASSWORD_DIUBAH"
  | "emailuji.r.jenis.KARTU_DIGITAL"
  | "emailuji.r.jenis.PEMBERITAHUAN_KEAMANAN"
  | "emailuji.r.jenis.UJI_PENGIRIMAN"
  | "emailuji.r.jenis.lain"
  | "emailuji.r.hasil.PENDING"
  | "emailuji.r.hasil.PENDING_LAMA"
  | "emailuji.t.judul"
  | "emailuji.t.intro"
  | "emailuji.t.kosong"
  | "emailuji.t.galat"
  | "emailuji.t.menunggu"
  | "emailuji.t.menit"
  | "emailuji.r.hasil.SENT"
  | "emailuji.r.hasil.BATAS_ALAMAT"
  | "emailuji.r.hasil.BATAS_UMUM"
  | "emailuji.r.hasil.REFUSED_BY_HOST"
  | "emailuji.r.hasil.FAILED"
  | "emailuji.eyebrow"
  | "emailuji.judul"
  | "emailuji.intro"
  | "emailuji.ke"
  | "emailuji.tombol"
  | "emailuji.mengirim"
  | "emailuji.terkirim"
  | "emailuji.periksa"
  | "emailuji.rujukan"
  | "emailuji.alasan.batas_alamat"
  | "emailuji.alasan.batas_umum"
  | "emailuji.alasan.ditolak_server"
  | "emailuji.alasan.gagal_kirim"
  | "emailuji.alasan.ditahan_uji"
  | "emailuji.pengaturan.hilang"
  | "emailuji.pengaturan.tidak_sah"
  | "emailuji.pengaturan.tidak_aman"
  | "emailuji.pengaturan.umum"
  | "emailuji.pengaturan.nama"
  | "emailuji.galat.alamat"
  | "emailuji.galat.sesi"
  | "emailuji.galat.ditolak"
  | "emailuji.galat.asal"
  | "emailuji.galat.umum"
  | "emailuji.galat.jaringan"
  | "aktivasi.ditolak"
  | "aktivasi.eyebrow"
  | "aktivasi.judul"
  | "aktivasi.intro"
  | "aktivasi.intro.buka"
  | "aktivasi.halaman_masuk"
  | "aktivasi.kosong"
  | "aktivasi.tunggu.cari"
  | "aktivasi.tunggu.cari_arti"
  | "aktivasi.tunggu.jumlah"
  | "aktivasi.tunggu.cocok"
  | "aktivasi.tunggu.tidak_cocok"
  | "aktivasi.surel"
  | "aktivasi.dengan_surel"
  | "aktivasi.dengan_kartu"
  | "aktivasi.kelas.judul" | "aktivasi.kelas.arti" | "aktivasi.kelas.pilih" | "aktivasi.kelas.murid" | "aktivasi.kelas.tombol"
  | "aktivasi.kelas.banyak.judul" | "aktivasi.kelas.banyak.semua" | "aktivasi.kelas.banyak.terpilih" | "aktivasi.kelas.banyak.dikecualikan" | "aktivasi.kelas.banyak.tombol"
  | "aktivasi.kelas.membuat" | "aktivasi.kelas.lembar" | "aktivasi.kelas.sekali" | "aktivasi.kelas.cetak" | "aktivasi.kelas.nomor" | "aktivasi.kelas.belum"
  | "aktivasi.kartu_dibuat"
  | "aktivasi.gagal"
  | "aktivasi.baru.judul"
  | "aktivasi.baru.arti"
  | "aktivasi.baru.nama"
  | "aktivasi.baru.tombol"
  | "aktivasi.baru.ok"
  | "aktivasi.baru.ok.lalu"
  // DAISY-09 (D-019): what each activation made, that PINTAR sent nothing, and
  // each failure as its own sentence
  | "aktivasi.surel_dibuat"
  | "aktivasi.surel_arti"
  | "aktivasi.surel_arti.lalu"
  | "aktivasi.kartu_arti"
  | "aktivasi.kartu_arti.lalu"
  | "aktivasi.galat.nama"
  | "aktivasi.galat.surel"
  | "aktivasi.galat.ditolak"
  | "aktivasi.galat.baru_ditolak"
  | "aktivasi.galat.dipakai"
  | "aktivasi.galat.kartu"
  | "aktivasi.galat.sesi"
  | "aktivasi.galat.jaringan"
  // DAISY-19 (D-057(a)): the email frame's own words, and Gate 2E's delivery
  // test. Emails render Bahasa Indonesia only; the English half keeps the table
  // whole (UX1-S0-HLE-01) and says the same thing.
  | "email.bingkai.merek"
  | "email.bingkai.alasan"
  | "email.bingkai.tidak_pernah"
  | "email.bingkai.tanya"
  | "email.bingkai.cadangan"
  | "email.bingkai.uji"
  | "email.bingkai.konteks"
  | "email.bingkai.konteks.dan"
  | "email.uji.subjek"
  | "email.uji.pratinjau"
  | "email.uji.judul"
  | "email.uji.isi"
  | "email.uji.dikirim"
  | "email.uji.tenang"
  | "email.uji.alasan"
  | "aktifkan.judul"
  | "aktifkan.lede"
  | "aktifkan.kirim"
  | "aktifkan.mengirim"
  | "aktifkan.sudah_aktif"
  | "aktifkan.ke_masuk"
  | "aktifkan.kode_judul"
  | "aktifkan.kode_terkirim"
  | "aktifkan.berlaku"
  | "aktifkan.berlaku_lalu"
  | "aktifkan.kode_label"
  | "aktifkan.lanjut"
  | "aktifkan.memeriksa"
  | "aktifkan.kode_bantu"
  | "aktifkan.kirim_ulang"
  | "aktifkan.kirim_ulang_dalam"
  | "aktifkan.kode_ulang_ok"
  | "aktifkan.email_lain"
  | "aktifkan.kode_kosong"
  | "aktifkan.kode_salah"
  | "aktifkan.kode_sering"
  | "aktifkan.ramai"
  | "aktifkan.minta_sering"
  | "lupa.judul"
  | "lupa.lede"
  | "lupa.nama_label"
  | "lupa.nama_kosong"
  | "lupa.belum_aktif"
  | "lupa.ke_aktifkan"
  | "lupa.ke_masuk"
  | "lupa.kode_judul"
  | "lupa.kode_terkirim"
  | "lupa.kode_label"
  | "lupa.kode_ulang_ok"
  | "lupa.kode_bantu"
  | "lupa.nama_lain"
  | "lupa.p_judul"
  | "lupa.p_lede"
  | "lupa.berakhir"
  | "lupa.selesai_judul"
  | "lupa.selesai_isi"
  | "lupa.lanjut"
  | "email.pulih.subjek"
  | "email.pulih.pratinjau"
  | "email.pulih.judul"
  | "email.pulih.isi"
  | "email.pulih.label"
  | "email.pulih.bukan_anda"
  | "email.pulih.alasan"
  | "email.diubah.subjek"
  | "email.diubah.pratinjau"
  | "email.diubah.judul"
  | "email.diubah.isi"
  | "email.diubah.sesi"
  | "email.diubah.bukan_anda"
  | "email.diubah.tombol"
  | "email.diubah.alasan"
  | "lupa.ke_pin"
  | "lupa.pin.judul"
  | "lupa.pin.lede"
  | "lupa.pin.id_label"
  | "lupa.pin.pin_label"
  | "lupa.pin.id_salah"
  | "lupa.pin.kosong"
  | "lupa.pin.salah"
  | "lupa.pin.terkunci"
  | "lupa.pin.sering"
  | "lupa.pin.ditangguhkan"
  | "lupa.pin.belum_aktif"
  | "lupa.pin.ke_email"
  | "lupa.pin.periksa"
  | "idpage.judul"
  | "idpage.lede"
  | "idpage.id_label"
  | "idpage.masuk"
  | "idpage.pulih"
  | "akun.pin.judul"
  | "akun.pin.arti"
  | "akun.pin.label"
  | "akun.pin.ulang"
  | "akun.pin.beda"
  | "akun.pin.simpan"
  | "akun.pin.menyimpan"
  | "akun.pin.tersimpan"
  | "aktivasi.staf.judul"
  | "aktivasi.staf.arti"
  | "aktivasi.staf.pilih"
  | "aktivasi.staf.email"
  | "aktivasi.staf.email.arti"
  | "aktivasi.staf.alasan"
  | "aktivasi.staf.alasan.arti"
  | "aktivasi.staf.konfirmasi"
  | "aktivasi.staf.ya"
  | "aktivasi.staf.sibuk"
  | "aktivasi.staf.ok.1"
  | "aktivasi.staf.ok.2"
  | "aktivasi.staf.gagal.DITOLAK"
  | "aktivasi.staf.gagal.ALASAN_WAJIB"
  | "aktivasi.staf.gagal.EMAIL_TIDAK_SAH"
  | "aktivasi.staf.gagal.EMAIL_TERPAKAI"
  | "aktivasi.staf.gagal.KARTU_TIDAK_ADA"
  | "aktivasi.staf.gagal.BELUM_MASUK"
  | "aktivasi.staf.gagal.PERMINTAAN_DITOLAK"
  | "aktivasi.staf.gagal.PERMINTAAN_TIDAK_SAH"
  | "aktivasi.staf.gagal.LAYANAN_TIDAK_TERSEDIA"
  | "orang.judul"
  | "orang.benda"
  | "orang.intro.sekolah"
  | "orang.intro.platform"
  | "orang.cari"
  | "orang.kosong"
  | "orang.kolom.nama"
  | "orang.kolom.id"
  | "orang.kolom.email"
  | "orang.kolom.username"
  | "orang.kolom.keadaan"
  | "orang.kolom.tindakan"
  | "orang.aktif"
  | "orang.belum_aktif"
  | "orang.koreksi"
  | "orang.panel"
  | "orang.alasan"
  | "orang.alasan.arti"
  | "orang.menyimpan"
  | "orang.email.judul"
  | "orang.email.sekarang"
  | "orang.email.baru"
  | "orang.email.tombol"
  | "orang.email.ok.belum"
  | "orang.email.ok.aktif"
  | "orang.email.hanya_platform"
  | "orang.nama.judul"
  | "orang.nama.arti"
  | "orang.nama.baru"
  | "orang.nama.tombol"
  | "orang.nama.ok"
  | "orang.username.judul"
  | "orang.username.arti"
  | "orang.username.baru"
  | "orang.username.aturan"
  | "orang.username.tombol"
  | "orang.username.ok"
  | "orang.identitas.hanya_platform"
  | "orang.gagal.DITOLAK"
  | "orang.gagal.REASON_REQUIRED"
  | "orang.gagal.IDENTITY_NOT_FOUND"
  | "orang.gagal.NAME_INVALID"
  | "orang.gagal.NAME_UNCHANGED"
  | "orang.gagal.PERMINTAAN_TIDAK_SAH"
  | "orang.gagal.LAYANAN_TIDAK_TERSEDIA"
  | "aktivasi.orang.tautan"
  | "aktivasi.orang.arti"
  | "orang.email.gagal.PERMINTAAN_DITOLAK"
  | "orang.email.gagal.LAYANAN_TIDAK_TERSEDIA"
  | "orang.email.gagal.BELUM_MASUK"
  | "orang.email.gagal.DITOLAK"
  | "orang.email.gagal.PERMINTAAN_TIDAK_SAH"
  | "orang.email.gagal.ALASAN_WAJIB"
  | "orang.email.gagal.EMAIL_TIDAK_SAH"
  | "orang.email.gagal.EMAIL_SAMA"
  | "orang.email.gagal.EMAIL_TERPAKAI"
  | "orang.email.gagal.AKUN_EMAIL_TIDAK_ADA"
  | "akun.foto.judul"
  | "akun.foto.arti"
  | "akun.foto.alt"
  | "akun.foto.pilih"
  | "akun.foto.ganti"
  | "akun.foto.batas"
  | "akun.foto.besar"
  | "akun.foto.jenis"
  | "akun.foto.hapus"
  | "akun.foto.naik"
  | "akun.foto.ok"
  | "akun.foto.dihapus"
  | "akun.foto.gagal"
  | "aktivasi.ulang.judul"
  | "aktivasi.ulang.arti"
  | "aktivasi.ulang.cari"
  | "aktivasi.ulang.kosong"
  | "aktivasi.ulang.tidak_ketemu"
  | "aktivasi.ulang.akhiran"
  | "aktivasi.ulang.pilih"
  | "aktivasi.ulang.alasan"
  | "aktivasi.ulang.hilang"
  | "aktivasi.ulang.rusak"
  | "aktivasi.ulang.konfirmasi"
  | "aktivasi.ulang.ya"
  | "aktivasi.ulang.batal"
  | "aktivasi.ulang.sibuk"
  | "aktivasi.ulang.lembar"
  | "aktivasi.ulang.gagal.DITOLAK"
  | "aktivasi.ulang.gagal.KARTU_TIDAK_ADA"
  | "aktivasi.ulang.gagal.ALASAN_TIDAK_SAH"
  | "aktivasi.ulang.gagal.BELUM_MASUK"
  | "aktivasi.ulang.gagal.PERMINTAAN_DITOLAK"
  | "aktivasi.ulang.gagal.LAYANAN_TIDAK_TERSEDIA"
  | "aktivasi.ulang.rujukan"
  | "keamanan.eyebrow"
  | "keamanan.judul"
  | "keamanan.intro"
  | "keamanan.ditolak"
  | "keamanan.cari_judul"
  | "keamanan.id_label"
  | "keamanan.lihat"
  | "keamanan.memuat"
  | "keamanan.k.NORMAL"
  | "keamanan.k.LOCKED"
  | "keamanan.k.SUSPENDED"
  | "keamanan.pin_baru"
  | "keamanan.tanpa_email"
  | "keamanan.alasan_label"
  | "keamanan.atur_ulang"
  | "keamanan.mengatur"
  | "keamanan.selesai"
  | "keamanan.gagal.ID_TIDAK_SAH"
  | "keamanan.gagal.TIDAK_ADA"
  | "keamanan.gagal.ALASAN_KOSONG"
  | "keamanan.gagal.DITOLAK"
  | "keamanan.gagal.BELUM_MASUK"
  | "keamanan.gagal.SENDIRI"
  // BOB-29 (Gate 6): the shared-computer lock, «Komputer siapa ini?», «Keluar dari semua perangkat»
  | "kunci.judul"
  | "kunci.untuk"
  | "kunci.lede"
  | "kunci.lede.kartu"
  | "kunci.pin_label"
  | "kunci.pin_label.kartu"
  | "kunci.kosong"
  | "kunci.kosong.kartu"
  | "kunci.lanjut"
  | "kunci.memeriksa"
  | "kunci.tidak_cocok.2"
  | "kunci.tidak_cocok.1"
  | "kunci.berakhir"
  | "kunci.masuk"
  | "kunci.tanpa_pin"
  | "kunci.lupa"
  | "kunci.lupa.kartu"
  | "kunci.bukan_anda.arti"
  | "kunci.gagal"
  | "jaga.peringatan"
  | "jaga.masih"
  | "perangkat.judul"
  | "perangkat.lede"
  | "perangkat.bersama"
  | "perangkat.bersama.arti"
  | "perangkat.pribadi"
  | "perangkat.pribadi.arti"
  | "perangkat.catatan"
  | "perangkat.simpan"
  | "perangkat.menyimpan"
  | "perangkat.gagal"
  | "akun.perangkat.judul"
  | "akun.perangkat.SHARED"
  | "akun.perangkat.PERSONAL"
  | "akun.perangkat.ubah"
  | "akun.semua.judul"
  | "akun.semua.arti"
  | "akun.semua.tombol"
  | "akun.semua.yakin"
  | "akun.semua.ya"
  | "akun.semua.batal"
  | "akun.semua.gagal"
  | "masuk.sesi_berakhir"
  | "keamanan.gagal.PERMINTAAN_DITOLAK"
  | "keamanan.gagal.LAYANAN_TIDAK_TERSEDIA"
  | "keamanan.catatan_judul"
  | "keamanan.catatan_kosong"
  | "keamanan.kolom.waktu"
  | "keamanan.kolom.peristiwa"
  | "keamanan.kolom.id"
  | "keamanan.a.identity.recovery_pin_ok"
  | "keamanan.a.identity.recovery_pin_wrong"
  | "keamanan.a.identity.recovery_locked"
  | "keamanan.a.identity.recovery_suspended"
  | "keamanan.a.identity.recovery_restored"
  | "keamanan.a.identity.recovery_verified"
  | "keamanan.a.identity.password_set"
  | "keamanan.a.identity.pin_set"
  | "keamanan.a.account.card_reissued"
  | "email.aman.id"
  | "email.aman.waktu"
  | "email.aman.tombol"
  | "email.aman.admin_catatan"
  | "email.aman.alasan"
  | "email.aman.alasan_admin"
  | "email.aman.terkunci.subjek"
  | "email.aman.terkunci.judul"
  | "email.aman.terkunci.isi"
  | "email.aman.terkunci.bukan_anda"
  | "email.aman.terkunci.subjek_admin"
  | "email.aman.terkunci.isi_admin"
  | "email.aman.ditangguhkan.subjek"
  | "email.aman.ditangguhkan.judul"
  | "email.aman.ditangguhkan.isi"
  | "email.aman.ditangguhkan.bukan_anda"
  | "email.aman.ditangguhkan.subjek_admin"
  | "email.aman.ditangguhkan.isi_admin"
  | "email.aman.pulih_pin.subjek"
  | "email.aman.pulih_pin.judul"
  | "email.aman.pulih_pin.isi"
  | "email.aman.pulih_pin.bukan_anda"
  | "email.aman.pulih_pin.subjek_admin"
  | "email.aman.pulih_pin.isi_admin"
  | "email.aman.diatur_ulang.subjek"
  | "email.aman.diatur_ulang.judul"
  | "email.aman.diatur_ulang.isi"
  | "email.aman.diatur_ulang.bukan_anda"
  | "email.aman.diatur_ulang.subjek_admin"
  | "email.aman.diatur_ulang.isi_admin"
  | "email.aman.email_dikoreksi.subjek"
  | "email.aman.email_dikoreksi.judul"
  | "email.aman.email_dikoreksi.isi"
  | "email.aman.email_dikoreksi.bukan_anda"
  | "email.aman.email_dikoreksi.subjek_admin"
  | "email.aman.email_dikoreksi.isi_admin"
  | "aktifkan.email_tertahan"
  | "aktifkan.tidak_tersedia"
  | "aktifkan.rujukan_arti"
  | "aktifkan.langkah"
  | "aktifkan.dari"
  | "aktifkan.memuat"
  | "aktifkan.menyimpan"
  | "aktifkan.menyelesaikan"
  | "aktifkan.keluar"
  | "aktifkan.mulai_lagi"
  | "aktifkan.belum_masuk"
  | "aktifkan.tidak_berlaku"
  | "aktifkan.sudah_selesai"
  | "aktifkan.belum_lengkap"
  | "aktifkan.u_judul"
  | "aktifkan.u_lede"
  | "aktifkan.u_label"
  | "aktifkan.u_aturan"
  | "aktifkan.u_simpan"
  | "aktifkan.p_judul"
  | "aktifkan.p_lede"
  | "aktifkan.p_min"
  | "aktifkan.p_min_lalu"
  | "aktifkan.p_wajib"
  | "aktifkan.p_k.HURUF_KECIL"
  | "aktifkan.p_k.HURUF_BESAR"
  | "aktifkan.p_k.ANGKA"
  | "aktifkan.p_k.SIMBOL"
  | "aktifkan.p_bocor"
  | "aktifkan.p_label"
  | "aktifkan.p_ulang"
  | "aktifkan.p_simpan"
  | "aktifkan.p_kosong"
  | "aktifkan.p_beda"
  | "aktifkan.n_judul"
  | "aktifkan.n_lede"
  | "aktifkan.n_label"
  | "aktifkan.n_aturan"
  | "aktifkan.n_ulang"
  | "aktifkan.n_simpan"
  | "aktifkan.n_beda"
  | "aktifkan.m_judul"
  | "aktifkan.m_lede"
  | "aktifkan.m_sekali"
  | "aktifkan.m_benar"
  | "aktifkan.m_ubah"
  | "aktifkan.m_label"
  | "aktifkan.m_batal"
  | "aktifkan.w_siap"
  | "aktifkan.w_kartu_terkirim"
  | "aktifkan.w_kartu_belum"
  | "aktifkan.w_masuk"
  | "aktifkan.kode.USERNAME_LENGTH"
  | "aktifkan.kode.USERNAME_CHARACTERS"
  | "aktifkan.kode.USERNAME_START"
  | "aktifkan.kode.USERNAME_EMAIL_SHAPE"
  | "aktifkan.kode.USERNAME_ID_SHAPE"
  | "aktifkan.kode.USERNAME_NUMBER"
  | "aktifkan.kode.USERNAME_RESERVED"
  | "aktifkan.kode.USERNAME_TAKEN"
  | "aktifkan.kode.USERNAME_ALREADY_SET"
  | "aktifkan.kode.PASSWORD_LEMAH.PANJANG"
  | "aktifkan.kode.PASSWORD_LEMAH.BOCOR"
  | "aktifkan.kode.PASSWORD_LEMAH.KARAKTER"
  | "aktifkan.kode.PASSWORD_TERLALU_PANJANG"
  | "aktifkan.kode.PIN_FORMAT"
  | "aktifkan.kode.PIN_REPEATED"
  | "aktifkan.kode.PIN_SEQUENCE"
  | "aktifkan.kode.PIN_PATTERN"
  | "aktifkan.kode.PIN_KEYPAD"
  | "aktifkan.kode.PIN_YEAR"
  | "aktifkan.kode.PIN_COMMON"
  | "aktifkan.kode.PIN_ALREADY_SET"
  | "aktifkan.kode.PIN_REUSED"
  | "aktifkan.kode.NAMA_TIDAK_SAH"
  | "aktifkan.kode.NAMA_SUDAH_DIKONFIRMASI"
  | "auth.pw_identitas"
  | "auth.pw_password"
  | "auth.pw_show"
  | "auth.pw_hide"
  | "auth.pw_masuk"
  | "auth.pw_kosong"
  | "auth.pw_gagal"
  | "auth.pw_sering"
  | "auth.pw_lupa"
  | "auth.link_h1"
  | "auth.link_lede"
  | "auth.ke_password"
  | "auth.tutup_tanya"
  | "auth.tutup_go"
  | "buka_kembali.judul"
  | "buka_kembali.arti"
  | "buka_kembali.identitas"
  | "buka_kembali.pesan"
  | "buka_kembali.pesan_arti"
  | "buka_kembali.kirim"
  | "buka_kembali.terkirim"
  | "buka_kembali.galat.isian"
  | "buka_kembali.galat.umum"
  | "buka_kembali.galat.tunggu"
  | "buka_kembali.ke_masuk"
  | "keamanan.permintaan.buka_kembali"
  | "keamanan.permintaan.pesan"
  | "keamanan.permintaan.cara_verifikasi"
  | "keamanan.permintaan.cara_verifikasi_arti"
  | "keamanan.permintaan.verifikasi_centang"
  | "keamanan.akun.tutup_lewat_permintaan"
  | "keamanan.akun.ok.buka"
  | "akun.tinggal.jenis.reopen"
  | "akun.tinggal.galat.account_reopen_via_request"
  | "audit.aksi.account.reopen_requested"
  | "auth.aktifkan_tanya"
  | "auth.aktifkan_go"
  | "sesi.akun"
  | "akun.judul"
  | "akun.intro"
  | "akun.id"
  | "akun.id_arti"
  | "akun.qr"
  | "akun.kartu_judul"
  | "akun.kartu_arti"
  | "akun.kartu.depan"
  | "akun.kartu.belakang"
  | "akun.kartu.petunjuk"
  | "akun.kirim"
  | "akun.mengirim"
  | "akun.terkirim"
  | "akun.belum"
  | "akun.coba_dalam"
  | "akun.coba_nanti"
  | "akun.gagal_muat"
  | "aktivasi.halaman_aktifkan"
  | "aktivasi.baru.periksa_judul"
  | "aktivasi.baru.periksa_arti"
  | "aktivasi.baru.benar"
  | "aktivasi.baru.ubah"
  | "pendataan.nama.judul"
  | "pendataan.nama.arti"
  | "pendataan.nama.sudah"
  | "pendataan.nama.gagal"
  | "email.kode.subjek"
  | "email.kode.pratinjau"
  | "email.kode.judul"
  | "email.kode.halo"
  | "email.kode.isi"
  | "email.kode.ulang.subjek"
  | "email.kode.ulang.pratinjau"
  | "email.kode.ulang.judul"
  | "email.kode.ulang.isi"
  | "email.kode.label"
  | "email.kode.berlaku"
  | "email.kode.berlaku_lalu"
  | "email.kode.bukan_anda"
  | "email.kode.alasan"
  | "email.kartu.subjek"
  | "email.kartu.pratinjau"
  | "email.kartu.judul"
  | "email.kartu.isi"
  | "email.kartu.bukan_rahasia"
  | "email.kartu.tombol"
  | "email.kartu.alasan";

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
    UNIVERSITAS: { id: "Belum ada materi yang disediakan untuk Anda.", en: "Nothing has been made available to you yet." },
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
  "studio.soal.judul": { default: "Soal dalam paket ini", en: "The questions in this package" },
  "studio.soal.arti": { default: "Periksa setiap soal, kunci jawabannya, dan alasan setiap pilihan sebelum menyetujui. Hanya staf Studio sekolah ini yang melihat bagian ini; murid tidak pernah melihat kunci atau alasannya di sini.", en: "Check every question, its key and the reason for each option before approving. Only this school's Studio staff see this part; students never see the key or the reasons here." },
  "studio.soal.jumlah": { default: "soal", en: "questions" },
  "studio.soal.kunci": { default: "Kunci", en: "Key" },
  "studio.soal.alasan": { default: "Alasan", en: "Why" },
  "studio.soal.kosong": { default: "Paket ini belum berisi soal.", en: "This package has no questions yet." },
  // A1 (D-166(b)): the question review, one lesson at a time (Daisy's T table; presentation, pending copy approval)
  "studio.soal.ringkas": { default: "{soal} soal dalam {pelajaran} pelajaran", en: "{soal} questions in {pelajaran} lessons" },
  "studio.soal.pelajaran_label": { default: "Pelajaran", en: "Lesson" },
  "studio.soal.pelajaran_dari": { default: "Pelajaran {i} dari {n}", en: "Lesson {i} of {n}" },
  "studio.soal.posisi": { default: "Soal {i} dari {n}", en: "Question {i} of {n}" },
  "studio.soal.buka": { default: "Buka", en: "Open" },
  "studio.soal.bacaan": { default: "Bacaan", en: "Reading passage" },
  "studio.soal.gagal": { default: "PINTAR belum bisa membuka soal paket ini. Muat ulang halaman ini; jika tetap gagal, hubungi admin sekolah Anda.", en: "PINTAR couldn't open this package's questions. Reload this page; if it still fails, contact your school's administrator." },
  "studio.soal.pager_label": { default: "Pelajaran dalam paket ini", en: "Lessons in this package" },
  // E3 #4 (Daisy): a disabled button says why, beside it (AlasanNonaktif); pending Dr Gladys (question pack B7, B8)
  "alasan.nonaktif.jawab": { default: "Pilih satu jawaban dulu.", en: "Choose one answer first." },
  "alasan.nonaktif.periksa": { default: "Pilih buku kerja dulu.", en: "Choose a workbook first." },
  // E-A1-1: an option's misconception in the reviewer's question list (the metric's own word; pending Dr Gladys)
  "studio.soal.miskonsepsi": { default: "Pemahaman keliru", en: "Misunderstanding" },
  "pelajaran.visual.pecahan": { default: "{n} dari {m} bagian", en: "{n} of {m} parts" },
  "mengajar.bukti.per_soal": { default: "Lihat per soal", en: "See question by question" },
  "mengajar.soal.judul": { default: "Soal mana yang sulit bagi kelas ini", en: "Which questions this class found hard" },
  "mengajar.soal.arti": { default: "Dari jawaban yang sudah dikumpulkan murid kelas ini. Soal yang paling sedikit dijawab tepat ada di atas, dengan nama murid yang mungkin perlu bantuan pada konsep itu. Jawaban yang masih dikerjakan tidak terlihat di sini.", en: "From the answers this class has handed in. The questions answered rightly by the fewest come first, with the names of students who may need help with that concept. Answers still being worked on are not shown here." },
  "mengajar.soal.terkumpul": { default: "Jawaban yang sudah dikumpulkan", en: "Answer sheets handed in" },
  "mengajar.soal.dari": { default: "dari", en: "of" },
  "mengajar.soal.tepat": { default: "menjawab tepat", en: "answered rightly" },
  "mengajar.soal.kunci": { default: "Kunci", en: "Key" },
  "mengajar.soal.bantuan": { default: "Murid yang mungkin perlu bantuan pada soal ini", en: "Students who may need help with this question" },
  "mengajar.soal.semua_tepat": { default: "Semua yang mengumpulkan menjawab soal ini dengan tepat.", en: "Everyone who handed in answered this question rightly." },
  "mengajar.soal.kosong": { default: "Belum ada jawaban yang dikumpulkan untuk asesmen ini.", en: "No answers have been handed in for this assessment yet." },
  "mengajar.ulang.judul": { default: "Minta membaca lagi", en: "Ask to read again" },
  "mengajar.ulang.arti": { default: "Pilih murid yang perlu bantuan dan pelajaran yang perlu mereka baca lagi. Mereka akan menemukan permintaan ini di beranda mereka.", en: "Choose the students who need support and the lessons they should read again. They will find the request on their home page." },
  "mengajar.ulang.murid": { default: "Murid", en: "Students" },
  "mengajar.ulang.murid_kosong": { default: "Belum ada murid di kelas ini.", en: "There are no students in this class yet." },
  "mengajar.ulang.belum_uji": { default: "belum menyelesaikan Uji Penguasaan", en: "has not finished the Uji Penguasaan" },
  "mengajar.ulang.pelajaran": { default: "Pelajaran untuk dibaca lagi", en: "Lessons to read again" },
  "mengajar.ulang.tidak_berubah": { default: "Hasil murid tidak berubah, dan tidak ada tes baru.", en: "The students' results do not change, and there is no new test." },
  "mengajar.ulang.kirim": { default: "Minta membaca lagi", en: "Ask to read again" },
  "mengajar.ulang.terkirim": { default: "Permintaan dikirim kepada", en: "Request sent to" },
  "mengajar.ulang.riwayat": { default: "Permintaan yang sudah dikirim", en: "Requests already sent" },
  "mengajar.ulang.riwayat_kosong": { default: "Belum ada permintaan untuk bab ini.", en: "No requests for this chapter yet." },
  "mengajar.ulang.dibaca": { default: "pelajaran sudah dibaca lagi", en: "lessons read again" },
  "mengajar.ulang.tolak.review_no_learner": { default: "Pilih sedikitnya satu murid.", en: "Choose at least one student." },
  "mengajar.ulang.tolak.review_no_lesson": { default: "Pilih sedikitnya satu pelajaran.", en: "Choose at least one lesson." },
  "mengajar.ulang.tolak.review_too_many": { default: "Terlalu banyak sekaligus: paling banyak 60 murid dan 30 pelajaran.", en: "Too many at once: at most 60 students and 30 lessons." },
  "mengajar.ulang.tolak.review_not_in_class": { default: "Ada murid yang tidak lagi berada di kelas ini. Muat ulang halaman, lalu pilih lagi.", en: "A student is no longer in this class. Reload the page and choose again." },
  "mengajar.ulang.tolak.review_lesson_not_in_chapter": { default: "Ada pelajaran yang bukan bagian dari bab ini.", en: "A lesson is not part of this chapter." },
  "mengajar.ulang.tolak.review_assignment_closed": { default: "Bab ini tidak lagi diberikan kepada kelas ini.", en: "This chapter is no longer given to this class." },
  "mengajar.ulang.tolak.review_not_allowed": { default: "Hanya guru kelas ini yang dapat meminta muridnya membaca lagi.", en: "Only this class's teacher can ask its students to read again." },
  "mengajar.ulang.tolak.review_failed": { default: "Permintaan belum terkirim. Coba lagi.", en: "The request was not sent. Try again." },
  "mengajar.soal.tidak_dijawab": { default: "tidak dijawab", en: "not answered" },
  "mengajar.soal.kembali": { default: "Lihat bukti", en: "Evidence" },
  // Terminology v1 (D-068), applied to L4's remaining words on the owner's direction of 8 Oct («use the previously approved
  // terminology» while Dr Gladys's review continues): A1–A5 (the modes), N1 (TEST mode «Tes»), N2 (bank TEST «Asesmen»), N9 below
  "jenis.bank.TEST": { default: "Asesmen", en: "Assessment" },
  "jenis.bank.EXAM": { default: "Ujian", en: "Exam" },
  "jenis.mode.PRE_TEST": { default: "Pemetaan Awal", en: "Initial Mapping" },
  "jenis.mode.POST_TEST": { default: "Uji Penguasaan", en: "Mastery Check" },
  "jenis.mode.QUICK": { default: "Uji Cepat", en: "Quick Assessment" },
  "jenis.mode.STANDALONE": { default: "Asesmen Mandiri", en: "Standalone Assessment" },
  "jenis.mode.PRACTICE": { default: "Latihan", en: "Practice" },
  "jenis.mode.TEST": { default: "Tes", en: "Assessment" },
  "jenis.mode.EXAM": { default: "Ujian", en: "Exam" },
  "jenis.mode.PUBLIC_DEMO": { default: "Peragaan publik", en: "Public demonstration" },
  "jenis.mode.PAPER": { default: "Tes di Kertas", en: "Paper Test" },
  "jenis.integritas.VISIBILITY_CHANGE": { default: "Berpindah dari layar asesmen", en: "Moved away from the assessment screen" },
  "jenis.integritas.NAVIGATION": { default: "Berpindah halaman", en: "Moved to another page" },
  "jenis.integritas.RECONNECT": { default: "Terputus lalu tersambung lagi", en: "Disconnected, then reconnected" },
  "jenis.integritas.RAPID_OPTION_CHANGE": { default: "Mengubah pilihan sangat cepat", en: "Changed answer very quickly" },
  "jenis.integritas.SUBMISSION_ANOMALY": { default: "Pengiriman jawaban tidak lazim", en: "Unusual answer submission" },

  // FABLE-06 -- the intelligence surfaces. Every label and every STATEMENT a
  // reader sees passes through here, including the sentences that explain an
  // omission: a status like `not_permitted` or `below_minimum` is an internal
  // word and never reaches a screen.
  "metrik.peserta.label": { default: "Peserta", en: "Students" },
  "metrik.peserta.arti": { default: "Banyaknya murid yang mengerjakan asesmen di kelas ini.", en: "How many students took the assessment in this class." },
  "metrik.pemahaman.label": { default: "Pemahaman", en: "Comprehension" },
  "metrik.pemahaman.arti": { default: "Rata-rata penguasaan kelas pada Uji Penguasaan.", en: "The class's average mastery on the Mastery Check." },
  "metrik.kenaikan.label": { default: "Kenaikan", en: "Gain" },
  // owner (9 Nov): the figure is a mean over (learner, chapter) PAIRS (H31's governed contract), never «per murid»
  "metrik.kenaikan.arti": { default: "Rata-rata selisih penguasaan sebelum dan sesudah pembelajaran, dihitung per pasangan murid dan bab: murid yang mengerjakan dua bab memberi dua pasangan.", en: "The average difference in mastery before and after the lessons, counted per pair of a student and a chapter: a student who took two chapters gives two pairs." },
  // D-095: PINTAR's fixed performance bands, an independent distribution, not the school's mastery threshold
  "metrik.kesiapan.label": { default: "Sebaran hasil Uji Penguasaan", en: "Spread of Mastery Check results" },
  "metrik.kesiapan.arti": { default: "Banyaknya murid pada tiap pita hasil, menurut Uji Penguasaan terakhir mereka.", en: "How many students sit in each result band, by their latest Mastery Check." },
  "metrik.topik.label": { default: "Penguasaan per topik", en: "Mastery by topic" },
  "metrik.topik.arti": { default: "Rata-rata penguasaan kelas pada tiap topik.", en: "The class's average mastery on each topic." },
  // "Salah" is an INTERNAL_WORD -- the HLE refused this label's first
  // draft, which is the guard working on the person who wrote the guard's
  // newest entries. "Pemahaman keliru" says the same thing without the
  // verdict-shaped word a learner must never be shown.
  "metrik.miskonsepsi.label": { default: "Pemahaman keliru yang berulang", en: "Recurring misunderstandings" },
  "metrik.miskonsepsi.arti": { default: "Pola jawaban keliru yang muncul pada banyak murid, dengan saran penanganannya.", en: "Patterns of mistaken answers shared by many students, with what to do about them." },
  "metrik.peserta_institusi.label": { default: "Peserta", en: "Students" },
  "metrik.peserta_institusi.arti": { default: "Banyaknya murid yang mengerjakan asesmen di sekolah ini.", en: "How many students took the assessment in this school." },
  "metrik.kenaikan_institusi.label": { default: "Kenaikan", en: "Gain" },
  "metrik.kenaikan_institusi.arti": { default: "Rata-rata kenaikan penguasaan di sekolah ini, dihitung per pasangan murid dan bab: murid yang mengerjakan dua bab memberi dua pasangan.", en: "The average gain in mastery in this school, counted per pair of a student and a chapter: a student who took two chapters gives two pairs." },
  "metrik.gerbang_keselamatan.label": { default: "Soal wajib", en: "Required items" },
  "metrik.gerbang_keselamatan.arti": { default: "Bagian hasil Uji Penguasaan yang menjawab benar seluruh soal wajib, di antara Uji Penguasaan yang memuat soal wajib.", en: "The share of Mastery Check results with every required item answered correctly, among the Mastery Checks that hold required items." },
  "metrik.perbandingan_kohort.label": { default: "Perbandingan angkatan", en: "Cohort comparison" },
  "metrik.perbandingan_kohort.arti": { default: "Penguasaan rata-rata tiap angkatan di sekolah ini.", en: "The average mastery of each cohort in this school." },
  "metrik.kompetensi.label": { default: "Capaian kompetensi", en: "Competency attainment" },
  "metrik.kompetensi.arti": { default: "Rata-rata penguasaan pada tiap ranah yang diukur.", en: "The average mastery in each domain that was measured." },
  "metrik.kredensial.label": { default: "Sertifikat terbit", en: "Certificates issued" },
  "metrik.kredensial.arti": { default: "Banyaknya sertifikat yang berlaku dan dapat diperiksa publik.", en: "How many certificates are valid and publicly checkable." },
  "metrik.item_benar.label": { default: "Tingkat jawaban benar", en: "Correct-answer rate" },
  "metrik.item_benar.arti": { default: "Bagian murid yang menjawab soal ini dengan benar.", en: "The share of students who answered this item correctly." },
  "metrik.pengecoh.label": { default: "Pilihan yang dipilih", en: "Options chosen" },
  "metrik.pengecoh.arti": { default: "Sebaran pilihan yang diambil murid pada soal ini.", en: "How students' choices were distributed across this item's options." },
  "metrik.posisi.label": { default: "Letak dan waktu", en: "Position and timing" },
  "metrik.posisi.arti": { default: "Posisi soal ini dalam lembar soal dan rata-rata waktu pengerjaannya.", en: "Where this item sits in the paper and how long it takes on average." },
  "metrik.hasil_murid.label": { default: "Hasil murid", en: "Student results" },
  "metrik.hasil_murid.arti": { default: "Penguasaan murid ini pada tiap asesmen.", en: "This student's mastery on each assessment." },

  // D-095: the band words describe a level and claim no pass, target or certificate (the keys are unchanged;
  // «Siap sertifikasi» is retired). Daisy may finalise the words in context.
  "kesiapan.belum_post_test": { default: "Belum mengerjakan Uji Penguasaan", en: "Mastery Check not yet taken" },
  "kesiapan.butuh_pendampingan": { default: "Perlu penguatan", en: "Needs strengthening" },
  "kesiapan.perlu_review": { default: "Berkembang", en: "Developing" },
  "kesiapan.siap_sertifikasi": { default: "Mantap", en: "Strong" },
  // CR-81 (D-123(3)): the class's population, said apart from the bands
  "kesiapan.populasi.murid": { default: "murid di kelas ini", en: "students in this class" },
  "kesiapan.populasi.sudah": { default: "sudah mengerjakan Uji Penguasaan", en: "have taken the Mastery Check" },
  "kesiapan.populasi.belum": { default: "belum mengerjakan", en: "have not taken it yet" },
  "kesiapan.catatan": { default: "Pita tetap PINTAR: 80% ke atas, 60–79%, dan di bawah 60% atau soal wajib belum tepat. Bukan batas ketuntasan sekolah dan tidak menentukan sertifikat.", en: "PINTAR's fixed bands: 80% and above, 60–79%, and below 60% or a required item not yet right. Not the school's mastery threshold, and they do not decide certificates." },

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
    default: "Soal wajib selalu disertakan dalam setiap asesmen, jadi jawabannya terkumpul lebih cepat dan soal itu lebih dulu muncul di daftar ini. Urutan ini menunjukkan seberapa sering soal ditampilkan, bukan mutunya.",
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
  // owner decision 7: evidence exists and is counted, but a combined figure is WITHHELD so a smaller part cannot be worked out
  "laporan.metrik.dilindungi": { default: "Angka gabungan ini tidak ditampilkan agar hasil bagian yang dikerjakan sedikit murid tidak dapat dihitung darinya.", en: "This combined figure is not shown, so that the result of a part taken by few students cannot be worked out from it." },
  "laporan.metrik.tidak_berlaku": { default: "Tidak berlaku: Uji Penguasaan yang sudah dikerjakan di sini tidak memuat soal wajib, jadi tidak ada soal wajib yang perlu dijawab benar.", en: "Not applicable: the Mastery Checks taken here hold no required item, so there is no required item to answer correctly." },
  "ketiadaan.dilindungi.bab.murid": { default: "Sudah {have} murid mengerjakan Uji Penguasaan; ada bab yang baru dikerjakan kurang dari {needed} murid.", en: "{have} students have taken the Mastery Check; at least one chapter has been taken by fewer than {needed}." },
  "ketiadaan.dilindungi.bab.peserta": { default: "Sudah {have} peserta mengerjakan Uji Penguasaan; ada bab yang baru dikerjakan kurang dari {needed} peserta.", en: "{have} participants have taken the Mastery Check; at least one chapter has been taken by fewer than {needed}." },
  "ketiadaan.dilindungi.bab_pasangan.murid": { default: "Sudah {have} murid punya Pemetaan Awal dan Uji Penguasaan bab yang sama; ada bab yang baru punya kurang dari {needed} murid seperti itu.", en: "{have} students have both an Initial Mapping and a Mastery Check of the same chapter; at least one chapter has fewer than {needed} such students." },
  "ketiadaan.dilindungi.bab_pasangan.peserta": { default: "Sudah {have} peserta punya Pemetaan Awal dan Uji Penguasaan bab yang sama; ada bab yang baru punya kurang dari {needed} peserta seperti itu.", en: "{have} participants have both an Initial Mapping and a Mastery Check of the same chapter; at least one chapter has fewer than {needed} such participants." },
  "ketiadaan.dilindungi.kelas.murid": { default: "Sudah {have} murid punya Pemetaan Awal dan Uji Penguasaan; ada kelas yang baru punya kurang dari {needed} murid seperti itu.", en: "{have} students have both an Initial Mapping and a Mastery Check; at least one class has fewer than {needed} such students." },
  "ketiadaan.dilindungi.kelas.peserta": { default: "Sudah {have} peserta punya Pemetaan Awal dan Uji Penguasaan; ada kelas yang baru punya kurang dari {needed} peserta seperti itu.", en: "{have} participants have both an Initial Mapping and a Mastery Check; at least one class has fewer than {needed} such participants." },
  "laporan.kelas.judul": { default: "Ringkasan Kelas", en: "Class Summary" },
  "laporan.institusi.judul": { default: "Ringkasan Sekolah", en: "School Summary" },
  "laporan.cetak": { default: "Cetak laporan", en: "Print report" },
  // E-C1-1/3: a measure whose name the copy table does not have yet (pending Dr Gladys)
  "laporan.metrik.tanpa_nama": { default: "Ukuran ini belum punya nama", en: "This measure has no name yet" },
  // W3.8 (RV-11): what a report's figures cover and when they were calculated, under its heading and on the paper
  "laporan.cakupan.kelas": { default: "Angka dihitung {waktu} dari semua bukti kelas ini sampai saat itu.", en: "Figures calculated {waktu} from all of this class's evidence up to then." },
  "laporan.cakupan.sekolah": { default: "Angka dihitung {waktu} dari semua bukti sekolah ini, di setiap tahun ajaran, sampai saat itu.", en: "Figures calculated {waktu} from all of this school's evidence, in every school year, up to then." },
  "laporan.komposisi.topik_di_bawah": { default: "{n} dari {m} topik masih di bawah target: {daftar}.", en: "{n} of {m} topics are still below target: {daftar}." },
  "laporan.komposisi.topik_semua": { default: "Semua topik sudah mencapai target {target}.", en: "Every topic has reached the {target} target." },
  "laporan.komposisi.topik_di_bawah_banyak": { default: "{n} dari {m} topik masih di bawah target. Yang paling rendah: {nama} ({p}). Semua topik ada di daftar di bawah.", en: "{n} of {m} topics are still below target. The lowest: {nama} ({p}). Every topic is in the list below." },
  "laporan.komposisi.keliru_lainnya": { default: "{n} pola lain ada di «Lihat bukti».", en: "{n} more patterns are in «See the evidence»." },
  "laporan.komposisi.keliru_tertahan": { default: "{n} pola lain baru dialami kurang dari {m} murid, jadi belum ditampilkan sebagai pola kelas.", en: "{n} more patterns have been seen in fewer than {m} students, so they are not shown as class patterns yet." },
  "laporan.komposisi.keliru_belum": { default: "Belum ada pola jawaban keliru yang dialami cukup banyak murid untuk disebut pola kelas.", en: "No mistaken-answer pattern has yet been seen in enough students to call it a class pattern." },
  "laporan.komposisi.topik_di_bawah_sebagian": { default: "{n} dari {m} topik yang punya angka masih di bawah target: {daftar}.", en: "{n} of the {m} topics with a figure are still below target: {daftar}." },
  "laporan.komposisi.topik_di_bawah_banyak_sebagian": { default: "{n} dari {m} topik yang punya angka masih di bawah target. Yang paling rendah: {nama} ({p}). Semua topik ada di daftar di bawah.", en: "{n} of the {m} topics with a figure are still below target. The lowest: {nama} ({p}). Every topic is in the list below." },
  "laporan.komposisi.topik_semua_sebagian": { default: "Ke-{m} topik yang punya angka sudah mencapai target {target}.", en: "All {m} topics with a figure have reached the {target} target." },
  "laporan.komposisi.topik_tertahan.satu": { default: "1 topik lainnya belum dapat ditampilkan, jadi belum diketahui apakah sudah mencapai target.", en: "1 more topic cannot be shown yet, so whether it has reached the target is not known." },
  "laporan.komposisi.topik_tertahan.banyak": { default: "{k} topik lainnya belum dapat ditampilkan, jadi belum diketahui apakah sudah mencapai target.", en: "{k} more topics cannot be shown yet, so whether they have reached the target is not known." },
  "laporan.komposisi.topik_tertahan_semua": { default: "Sudah ada hasil untuk {k} topik, tetapi belum ada yang dapat ditampilkan.", en: "There are results for {k} topics, but none can be shown yet." },
  "laporan.komposisi.topik_terendah": { default: "Penguasaan terendah ada pada {nama}.", en: "Mastery is lowest in {nama}." },
  "laporan.komposisi.pita_ringkas": { default: "{baik} dari {n} murid sudah berada di pita «{mantap}» atau «{berkembang}»; {kurang} murid perlu penguatan.", en: "{baik} of {n} students are in the «{mantap}» or «{berkembang}» band; {kurang} need strengthening." },
  "laporan.komposisi.rata_rata": { default: "{label} kelas: {nilai}.", en: "Class {label}: {nilai}." },
  "laporan.komposisi.target": { default: "Target {p}", en: "Target {p}" },
  "laporan.komposisi.target_arti": { default: "Garis tegak: target kelas, {p}, yang ditetapkan sekolah pada Uji Penguasaan kelas ini.", en: "Vertical line: the class target, {p}, set by the school on this class's Mastery Check." },
  "laporan.komposisi.kenaikan_dari": { default: "Dihitung dari {n} murid yang mengerjakan Pemetaan Awal dan Uji Penguasaan bab yang sama.", en: "Calculated from {n} students who took the Initial Mapping and the Mastery Check of the same chapter." },
  "laporan.komposisi.kenaikan_dari_pasangan": { default: "Dihitung dari {p} pasangan Pemetaan Awal dan Uji Penguasaan bab yang sama, milik {n} murid.", en: "Calculated from {p} pairs of an Initial Mapping and a Mastery Check of the same chapter, from {n} students." },
  "laporan.komposisi.berikutnya": { default: "Apa berikutnya", en: "What next" },
  "laporan.komposisi.berikutnya_bukti": { default: "Di PINTAR: {kelas} › «Lihat bukti» memuat jawaban setiap murid per soal.", en: "In PINTAR: {kelas} › «See evidence» holds each student's answer to each question." },
  "laporan.komposisi.berikutnya_keliru": { default: "Saran penanganan untuk pemahaman keliru ada di bagian {huruf}.", en: "The suggested remedy for each misunderstanding is in section {huruf}." },
  "laporan.komposisi.teks_grafik": { default: "Angka yang sama dalam tabel", en: "The same figures as a table" },
  "laporan.komposisi.kolom_topik": { default: "Topik", en: "Topic" },
  "laporan.komposisi.kolom_nilai": { default: "Penguasaan rata-rata", en: "Average mastery" },
  "laporan.komposisi.kolom_pita": { default: "Pita", en: "Band" },
  "laporan.komposisi.tertahan_judul": { default: "Peserta", en: "Participants" },
  "laporan.komposisi.tertahan": { default: "Belum cukup bukti untuk menyimpulkan apa pun tentang {kelas}.", en: "There is not yet enough evidence to conclude anything about {kelas}." },
  "laporan.komposisi.tertahan_sub": { default: "Baru {n} dari {m} murid mengerjakan Uji Penguasaan. Angka kelas muncul setelah paling sedikit {perlu} murid mengerjakannya.", en: "Only {n} of {m} students have sat the Mastery Check. The class figures appear once at least {perlu} have." },
  "laporan.komposisi.berikutnya_tertahan": { default: "Di PINTAR, angka kelas muncul sendiri setelah paling sedikit {perlu} murid mengerjakan Uji Penguasaan. Tidak ada yang perlu dilakukan sekarang.", en: "In PINTAR, the class figures appear by themselves once at least {perlu} students have sat the Mastery Check. Nothing needs doing now." },
  "laporan.komposisi.pita_ket": { default: "{n} murid ({p})", en: "{n} students ({p})" },
  "laporan.komposisi.saran": { default: "Saran penanganan: {saran}", en: "Suggested remedy: {saran}" },
  "laporan.komposisi.penguatan_soal": { default: "{b} dari {t} soal tepat", en: "{b} of {t} questions right" },
  "laporan.komposisi.soal_wajib_belum": { default: "soal wajib belum tepat", en: "a required question not right yet" },
  "laporan.kisi.dasar": { default: "{n} dari {m} murid", en: "{n} of {m} students" },
  "laporan.kisi.kunci": { default: "Garis tegak di setiap sel: target kelas itu. Angka berwarna jingga menunjukkan penguasaan di bawah target. Tanda — berarti data belum cukup.", en: "The upright line in each cell: that class's target. An amber figure shows mastery below target. A dash means there is not enough data yet." },
  "laporan.komposisi.bawah_ket": { default: "Angka berwarna jingga menunjukkan penguasaan di bawah target.", en: "An amber figure shows mastery below target." },
  "laporan.sekolah.bawah_ket": { default: "Titik berwarna jingga menunjukkan penguasaan pada pita {pita}.", en: "An amber dot shows mastery in the {pita} band." },
  "laporan.sekolah.naik": { default: "Kenaikan penguasaan rata-rata sejak Pemetaan Awal: {nilai}.", en: "The average gain in mastery since the Initial Mapping: {nilai}." },
  // owner directive (9 Nov, Daisy's N3): each row of «Capaian kompetensi» is a LEARNING OBJECTIVE, so it is counted as one
  "laporan.sekolah.ranah_baik": { default: "{n} dari {m} tujuan pembelajaran berada di pita «{berkembang}» atau «{mantap}».", en: "{n} of {m} learning objectives are in the «{berkembang}» or «{mantap}» band." },
  "laporan.komposisi.titik_arti": { default: "Setiap titik satu murid ({n} murid), diwarnai menurut pitanya, menurut Uji Penguasaan terakhirnya di kelas ini. Garis tegak: batas pita 60% dan 80%, dan target kelas.", en: "Each dot is one student ({n} students), coloured by their band, from their latest Mastery Check in this class. Upright lines: the band boundaries at 60% and 80%, and the class's target." },
  "laporan.komposisi.awal_akhir_label": { default: "Rata-rata kelas", en: "Class average" },
  "laporan.komposisi.awal_akhir_arti": { default: "Rata-rata Pemetaan Awal → rata-rata Uji Penguasaan, dari murid dan bab yang sama dengan Kenaikan.", en: "The average Initial Mapping → the average Mastery Check, over the same students and chapters as the Gain." },
  "laporan.komposisi.awal_akhir_tidak": { default: "Rata-rata sebelum dan sesudah belum dapat dibandingkan.", en: "The averages before and after cannot be compared yet." },
  "laporan.komposisi.awal_akhir_dilindungi": { default: "Rata-rata sebelum dan sesudah tidak ditampilkan: bersama angka per bab, keduanya dapat membuka hasil sekelompok kecil murid. Kenaikan di atas tetap dihitung dari semua pasangan.", en: "The before and after averages are not shown: together with the per-chapter figures they could reveal the results of a small group of students. The gain above is still over every pair." },
  "laporan.sekolah.mapel_cukup": { default: "{mapel}: {n} dari {m} kelas cukup untuk ditafsirkan.", en: "{mapel}: {n} of {m} classes are enough to interpret." },
  "laporan.sekolah.mapel_belum_ada": { default: "{kelas}: belum ada", en: "{kelas}: none yet" },
  "laporan.sekolah.mapel_belum_cukup": { default: "{kelas}: sudah ada, belum cukup ({ada} dari {perlu} murid)", en: "{kelas}: some, not enough yet ({ada} of {perlu} students)" },
  "aktivasi.kelas.banyak.tidak_termasuk": { default: "Tidak termasuk: {daftar}.", en: "Not included: {daftar}." },
  "aktivasi.kelas.banyak.akun": { default: "{n} yang sudah punya akun", en: "{n} who already have an account" },
  "aktivasi.kelas.banyak.staf": { default: "{n} yang memegang peran staf", en: "{n} who hold a staff role" },
  "aktivasi.kelas.banyak.pendataan": { default: "{n} murid yang datanya masih menunggu di Pendataan", en: "{n} students whose data still waits in Pendataan" },
  "laporan.bagian": { default: "Bagian", en: "Section" },
  "laporan.komposisi.lainnya": { default: "Angka lain", en: "Other figures" },
  "laporan.komposisi.penguatan_judul": { default: "Murid yang perlu penguatan", en: "Students who need strengthening" },
  "laporan.komposisi.penguatan_arti": { default: "Murid kelas ini di pita «{pita}», menurut abjad. Ini daftar bagian yang perlu dipelajari lagi, bukan penilaian atas muridnya.", en: "This class's students in the «{pita}» band, in alphabetical order. It lists what to study again; it is not a judgement of the student." },
  "laporan.komposisi.penguatan_nihil": { default: "Saat ini tidak ada murid kelas ini di pita «{pita}».", en: "No student of this class is in the «{pita}» band now." },
  "laporan.komposisi.penguatan_ulang": { default: "Pelajari lagi: {daftar}", en: "Study again: {daftar}" },
  "laporan.komposisi.berikutnya_penguatan": { default: "Mulai dari murid di bagian {huruf}: buka namanya untuk melihat hasil dan bagian yang perlu dipelajari lagi.", en: "Start with the students in section {huruf}: open a name to see their results and what to study again." },
  "laporan.kisi.pola": { default: "{daftar} di bawah target di lebih dari separuh kelas yang punya angka dan target.", en: "{daftar}: below target in more than half the classes with a figure and a target." },
  "laporan.kisi.pola_banyak": { default: "{n} topik di bawah target di lebih dari separuh kelas yang punya angka dan target. Semua topik ada di tabel di bawah.", en: "{n} topics are below target in more than half the classes with a figure and a target. Every topic is in the table below." },
  "laporan.kisi.tanpa_target": { default: "Belum ada target kelas yang dapat dibaca di sini, jadi tabel ini tidak menandai angka di bawah target. Tanda — berarti data belum cukup.", en: "No class target can be read here, so this table marks no figure as below target. A — means not enough data yet." },
  "laporan.kisi.tanpa_pola": { default: "Tidak ada topik yang di bawah target di lebih dari separuh kelas yang punya angka dan target.", en: "No topic is below target in more than half the classes with a figure and a target." },
  "laporan.kisi.arti": { default: "Setiap sel adalah angka «Penguasaan per topik» kelas itu sendiri, terhadap target kelas itu. Baca mendatar untuk melihat pola; baca menurun untuk melihat satu kelas.", en: "Each cell is that class's own «Mastery by topic» figure, against that class's target. Read across for a pattern; read down for one class." },
  "laporan.kisi.arti_tanpa_target": { default: "Setiap sel adalah angka «Penguasaan per topik» kelas itu sendiri. Baca mendatar untuk melihat pola; baca menurun untuk melihat satu kelas.", en: "Each cell is that class's own «Mastery by topic» figure. Read across for a pattern; read down for one class." },
  "laporan.kisi.arti_sebagian": { default: "Setiap sel adalah angka «Penguasaan per topik» kelas itu sendiri, terhadap target kelas itu di kelas yang targetnya dapat dibaca. Baca mendatar untuk melihat pola; baca menurun untuk melihat satu kelas.", en: "Each cell is that class's own «Mastery by topic» figure, against that class's target where its target can be read. Read across for a pattern; read down for one class." },
  "laporan.kisi.kunci_sebagian": { default: "Garis tegak di sel: target kelas itu, hanya di kelas yang targetnya dapat dibaca; di kelas lain tidak ada angka yang ditandai di bawah target. Angka berwarna jingga menunjukkan penguasaan di bawah target. Tanda — berarti data belum cukup.", en: "The upright line in a cell: that class's target, only in classes whose target can be read; elsewhere no figure is marked as below target. An amber figure shows mastery below target. A dash means there is not enough data yet." },
  "laporan.kisi.belum": { default: "Belum cukup bukti", en: "Not enough evidence yet" },
  "laporan.sekolah.zona": { default: "Batas pita: di bawah 60% «{penguatan}» · 60–79% «{berkembang}» · 80% ke atas «{mantap}».", en: "Band limits: below 60% «{penguatan}» · 60–79% «{berkembang}» · 80% and above «{mantap}»." },
  "laporan.sekolah.perhatian": { default: "{daftar} masih di pita «{pita}».", en: "{daftar}: still in the «{pita}» band." },
  "laporan.sekolah.semua_cukup": { default: "Semua bidang kompetensi berada di 60% ke atas.", en: "Every competency domain is at 60% or above." },
  "laporan.sekolah.angka": { default: "Angka utama", en: "Headline figures" },
  "laporan.sekolah.dasar_gerbang": { default: "Dari {s} hasil Uji Penguasaan yang memuat soal wajib, milik {n} murid.", en: "From {s} Mastery Check results that hold required items, from {n} students." },
  "laporan.sekolah.dasar_gerbang_murid": { default: "Dari {n} murid yang mengerjakan Uji Penguasaan.", en: "From {n} students who sat a Mastery Check." },
  "laporan.sekolah.dasar_gerbang_tidak_berlaku": { default: "{k} hasil Uji Penguasaan lain berasal dari uji tanpa soal wajib, jadi tidak dihitung, baik sebagai lulus maupun tidak.", en: "{k} other Mastery Check results come from checks with no required item, so they are not counted, as a pass or otherwise." },
  "laporan.sekolah.perhatian_banyak": { default: "{n} tujuan pembelajaran masih di pita «{pita}»; yang paling rendah: {nama} ({p}). Semua tujuan pembelajaran ada di daftar di bawah.", en: "{n} learning objectives are still in the «{pita}» band; the lowest: {nama} ({p}). Every learning objective is in the list below." },
  "laporan.sekolah.ranah_tertahan.murid.satu": { default: "1 tujuan pembelajaran lain belum ditampilkan karena dikerjakan kurang dari {m} murid.", en: "1 more learning objective is not shown because fewer than {m} students took it." },
  "laporan.sekolah.ranah_tertahan.murid.banyak": { default: "{n} tujuan pembelajaran lain belum ditampilkan karena masing-masing dikerjakan kurang dari {m} murid.", en: "{n} more learning objectives are not shown because each was taken by fewer than {m} students." },
  "laporan.sekolah.ranah_tertahan.kelas.satu": { default: "1 tujuan pembelajaran lain belum ditampilkan karena di salah satu kelas dikerjakan terlalu sedikit murid, sehingga hasil kelas itu dapat terbaca dari angka sekolah.", en: "1 more learning objective is not shown because so few students took it in one class that the class's result could be read from the school figure." },
  "laporan.sekolah.ranah_tertahan.kelas.banyak": { default: "{n} tujuan pembelajaran lain belum ditampilkan karena di salah satu kelas dikerjakan terlalu sedikit murid, sehingga hasil kelas itu dapat terbaca dari angka sekolah.", en: "{n} more learning objectives are not shown because so few students took each in one class that the class's result could be read from the school figure." },
  "laporan.sekolah.ranah_tertahan_semua.murid.satu": { default: "1 di antaranya dikerjakan kurang dari {m} murid.", en: "1 of them was taken by fewer than {m} students." },
  "laporan.sekolah.ranah_tertahan_semua.murid.banyak": { default: "{n} di antaranya masing-masing dikerjakan kurang dari {m} murid.", en: "{n} of them were each taken by fewer than {m} students." },
  "laporan.sekolah.ranah_tertahan_semua.kelas.satu": { default: "1 di antaranya di salah satu kelas dikerjakan terlalu sedikit murid, sehingga hasil kelas itu dapat terbaca dari angka sekolah.", en: "In 1 of them, so few students took it in one class that the class's result could be read from the school figure." },
  "laporan.sekolah.ranah_tertahan_semua.kelas.banyak": { default: "{n} di antaranya di salah satu kelas dikerjakan terlalu sedikit murid, sehingga hasil kelas itu dapat terbaca dari angka sekolah.", en: "In {n} of them, so few students took each in one class that the class's result could be read from the school figure." },
  "laporan.sekolah.ranah_tertahan.pindah.satu": { default: "1 tujuan pembelajaran lain belum ditampilkan karena ada murid yang pindah kelas lalu mengerjakannya lagi, sehingga hasil murid itu dapat terbaca dari angka sekolah.", en: "1 more learning objective is not shown because a student moved class and took it again, so that student's result could be read from the school figure." },
  "laporan.sekolah.ranah_tertahan.pindah.banyak": { default: "{n} tujuan pembelajaran lain belum ditampilkan karena ada murid yang pindah kelas lalu mengerjakannya lagi, sehingga hasil murid itu dapat terbaca dari angka sekolah.", en: "{n} more learning objectives are not shown because students moved class and took them again, so their results could be read from the school figure." },
  "laporan.sekolah.ranah_tertahan_semua.pindah.satu": { default: "1 di antaranya dikerjakan lagi oleh murid yang pindah kelas, sehingga hasil murid itu dapat terbaca dari angka sekolah.", en: "1 of them was taken again by a student who moved class, so that student's result could be read from the school figure." },
  "laporan.sekolah.ranah_tertahan_semua.pindah.banyak": { default: "{n} di antaranya dikerjakan lagi oleh murid yang pindah kelas, sehingga hasil murid itu dapat terbaca dari angka sekolah.", en: "{n} of them were taken again by students who moved class, so their results could be read from the school figure." },
  "laporan.sekolah.ranah_tertahan_semua": { default: "Sudah ada hasil untuk {n} tujuan pembelajaran, tetapi belum ada yang dapat ditampilkan.", en: "There are results for {n} learning objectives, but none can be shown yet." },
  "mengajar.bukti.bagian_tertahan": { default: "{n} tujuan pembelajaran lain baru dikerjakan kurang dari {m} murid, jadi angkanya tidak ditampilkan.", en: "{n} more learning objectives have been taken by fewer than {m} students, so their figures are not shown." },
  "laporan.sekolah.angkatan_belum.murid": { default: "{nama}: belum ditampilkan — kurang dari {m} murid.", en: "{nama}: not shown — fewer than {m} students." },
  "laporan.sekolah.angkatan_belum.pindah": { default: "{nama}: belum ditampilkan — ada murid yang pindah kelas lalu mengerjakan suatu bab lagi, sehingga hasil murid itu dapat terbaca dari angka ini.", en: "{nama}: not shown — a student moved class and took a chapter again, so that student's result could be read from this figure." },
  "laporan.sekolah.angkatan_belum.kelas": { default: "{nama}: belum ditampilkan — ada kelas di dalamnya yang mengerjakan suatu bab dengan terlalu sedikit murid, sehingga hasil kelas itu dapat terbaca dari angka ini.", en: "{nama}: not shown — a class in it took a chapter with so few students that the class's result could be read from this figure." },
  "laporan.sekolah.angkatan_tak_tercatat": { default: "Angkatan tidak tercatat saat Uji Penguasaan", en: "Year group not recorded at the Mastery Check" },
  "laporan.sekolah.dasar_sertifikat": { default: "{v} dari {n} yang pernah terbit; {d} dicabut.", en: "{v} of {n} ever issued; {d} revoked." },
  "laporan.sekolah.kohort_arti": { default: "Penguasaan rata-rata tiap angkatan pada skala yang sama. Ini perbandingan keadaan, bukan peringkat.", en: "Each cohort's average mastery on the same scale. A comparison of states, not a ranking." },
  "laporan.sekolah.berikutnya_kesiapan": { default: "Bagian {huruf} di atas, «Kesiapan bukti», menyebut kelas yang buktinya belum cukup.", en: "Section {huruf} above, «Evidence readiness», names the classes whose evidence is not yet enough." },
  "laporan.kosong": { default: "Belum ada angka yang bisa ditampilkan untuk Anda di sini.", en: "There are no figures to show you here yet." },
  // X5 (owner, 7 Nov): the owner's words, verbatim
  "laporan.kelas.pd_arti": { default: "Kelas pengembangan profesional tidak menggunakan ringkasan penguasaan akademik murid.", en: "A professional-development class does not use the academic mastery summary for students." },
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
  "pimpinan.batas": { default: "Yang muncul di sini memerlukan wewenang, koordinasi, atau penafsiran untuk sekolah secara keseluruhan. Selebihnya tidak muncul.", en: "What appears here needs authority, coordination, or an institution-level reading. Nothing else appears." },
  "pimpinan.urutan": { default: "Urutannya: yang paling lama menunggu lebih dulu. Ini urutan, bukan peringkat.", en: "Ordered by what has waited longest. It is an order, not a ranking." },
  "pimpinan.memutuskan": { default: "PINTAR mengusulkan, manusia memutuskan.", en: "PINTAR proposes, a human decides." },
  "laporan.bab.dasar": { default: "Pita di atas memakai Uji Penguasaan terakhir setiap murid, dari bab mana pun. Setiap bab, terpisah:", en: "The bands above use each student's latest Mastery Check, from any chapter. Each chapter, separately:" },
  "laporan.bab.belum": { default: "Belum cukup data: {n} murid; perlu {m}.", en: "Not enough data yet: {n} students; {m} needed." },
  "laporan.bab.murid": { default: "{n} murid", en: "{n} students" },
  "metrik.bab.label": { default: "Penguasaan per bab", en: "Mastery by chapter" },
  "metrik.bab.arti": { default: "Rata-rata penguasaan pada Uji Penguasaan tiap bab, terpisah per bab; setiap murid dihitung sekali per bab.", en: "Mean mastery on each chapter's Mastery Check, chapter by chapter; each student counted once per chapter." },
  "laporan.ditolak": { default: "Laporan ini tidak ditampilkan untuk peran Anda di tempat ini.", en: "This report is not shown for your role in this place." },
  "pimpinan.ditolak": { default: "Halaman ini untuk Kepala departemen dan Dekan, dalam lingkup yang mereka pimpin.", en: "This page is for heads of department and deans, over the part of the school they lead." },

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

  "pimpinan.lingkup.judul": { default: "Lingkup yang Anda pimpin", en: "The part of the school you lead" },
  "pimpinan.lingkup.pilih": { default: "Lingkup", en: "Part of the school" },
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
  "pimpinan.hasil.pendampingan": { default: "Pendampingan disiapkan", en: "Student support arranged" },
  "pimpinan.hasil.diteruskan": { default: "Diteruskan ke pihak sekolah", en: "Escalated to the institution" },

  "pimpinan.rantai.integritas.didukung": { default: "Seorang peninjau sudah melihat catatan itu dan memilih meneruskannya. Catatannya menyebut satu hal yang teramati, dan tidak lebih.", en: "A reviewer looked at the note and chose to refer it. The note records one observed thing, and nothing more." },
  "pimpinan.rantai.integritas.belum": { default: "Apa yang sebenarnya terjadi. Catatan ini bahan pertimbangan manusia, bukan kesimpulan tentang seorang murid.", en: "What actually happened. This note is material for a human to weigh, not a conclusion about a student." },
  "pimpinan.rantai.integritas.langkah": { default: "Menentukan siapa yang menanganinya, atau menutupnya dengan catatan.", en: "Deciding who handles it, or closing it with a note." },
  "pimpinan.rantai.pembelajaran.didukung": { default: "Bukti belajar yang sudah memenuhi syarat dalam lingkup ini.", en: "The learning evidence that already qualifies in this part of the school." },
  "pimpinan.rantai.pembelajaran.belum": { default: "Apa yang menjelaskannya. Angka menunjukkan keadaan, bukan sebabnya.", en: "What accounts for it. A figure shows a state, not its cause." },
  "pimpinan.rantai.pembelajaran.langkah": { default: "Membicarakannya dengan guru dalam lingkup ini, atau mengamati satu siklus lagi sebelum menyimpulkan apa pun.", en: "Discussing it with the educators here, or observing another cycle before concluding anything." },
  "pimpinan.rantai.program.didukung": { default: "Apa yang sudah tercatat tentang jalannya program dalam lingkup ini.", en: "What is already recorded about how the programme is running in this part of the school." },
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
  // CR-76 (D-123(4)): whoever referred an integrity case does not decide it
  "pimpinan.menunggu_pemutus_lain": { default: "Anda yang meneruskan kasus ini, jadi pimpinan lain yang memutuskannya. Kasus ini menunggu keputusan mereka.", en: "You referred this case, so another leader decides it. It is waiting for their decision." },
  "pimpinan.belum_ada_pemutus_lain": { default: "Belum ada pimpinan lain yang boleh memutuskan kasus dalam lingkup ini, jadi kasus ini belum bisa diputuskan. Minta Admin sekolah menunjuk Kepala departemen atau Dekan untuk lingkup ini.", en: "No other leader may decide cases in this scope yet, so this case can't be decided. Ask the school admin to appoint a head of department or a dean for this scope." },
  "pimpinan.aksi.gagal": { default: "Keputusan belum tercatat. Coba sekali lagi.", en: "The decision has not been recorded. Try once more." },
  "pimpinan.aksi.tercatat": { default: "Tercatat. Keadaan keputusan ini sudah diperbarui.", en: "Recorded. This decision’s state has been updated." },

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
  "pimpinan.bukti.kosong": { default: "Belum ada angka yang bisa ditampilkan untuk lingkup ini.", en: "There are no figures to show for this part of the school yet." },
  // W10: no school-wide figure is this reader's, but classes below have theirs
  "pimpinan.bukti.di_kelas": { default: "Angka bagian ini dihitung per kelas. Bukalah kelasnya di bagian Per kelas di bawah.", en: "This part's figures are counted class by class. Open the class under Class by class below." },
  // The evidence count travels with the figure rather than under it: a number
  // a reader can weigh is a number whose evidence they can see.
  "pimpinan.bukti.dari": { default: "dari", en: "from" },

  "pimpinan.murid.judul": { default: "Murid dalam lingkup ini", en: "Students here" },
  // The deliberateness, said plainly. No dialog, no purpose code, no
  // justification field: the ruling says the opening needs none of those, and it
  // says the opening is recorded, so the page says that instead.
  "pimpinan.murid.sub": { default: "Daftar nama menurut abjad. Membuka catatan satu murid adalah tindakan tersendiri, dan tercatat.", en: "Names in alphabetical order. Opening one student\u2019s record is a separate act, and it is recorded." },
  "pimpinan.murid.kosong": { default: "Belum ada murid terdaftar dalam lingkup ini.", en: "No students are enrolled here yet." },
  "pimpinan.murid.buka": { default: "Buka catatan", en: "Open the record" },

  "pimpinan.rincian.judul": { default: "Catatan murid", en: "Student record" },
  "pimpinan.rincian.tercatat": { default: "Pembukaan catatan ini sudah tercatat.", en: "The opening of this record has been recorded." },
  "pimpinan.rincian.status": { default: "Status pendaftaran", en: "Enrolment status" },
  "pimpinan.rincian.periode": { default: "Periode akademik", en: "Academic period" },
  "pimpinan.rincian.program": { default: "Program", en: "Programme" },
  "pimpinan.rincian.penempatan": { default: "Penempatan sekarang", en: "Placement now" },
  "pimpinan.rincian.riwayat": { default: "Penempatan sebelumnya", en: "Earlier placements" },
  "pimpinan.rincian.sampai": { default: "sampai", en: "until" },
  "pimpinan.rincian.alasan.MOVED": { default: "pindah kelas", en: "moved class" },
  "pimpinan.rincian.alasan.PERIOD_ROLLOVER": { default: "tahun ajaran berganti", en: "new school year" },
  "pimpinan.rincian.alasan.ENROLLMENT_ENDED": { default: "tidak lagi bersekolah di sini", en: "no longer at this school" },
  "pimpinan.rincian.catatan": { default: "Catatan belajar", en: "Learning record" },
  "pimpinan.rincian.belum": { default: "Belum ada catatan belajar yang memenuhi syarat untuk murid ini.", en: "No qualifying learning record for this student yet." },
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
  "pendataan.ditolak": { default: "Halaman ini untuk Admin sekolah.", en: "This page is for school administrators." },
  "pendataan.sekolah": { default: "Sekolah", en: "School" },
  // §3. THE NUMBER IDENTIFIES A PERSON AT A SCHOOL AND NOTHING ELSE. Said on
  // the page, because a six-digit sequence invites a reader to believe ranges
  // mean something -- that 000001-000999 are staff, say -- and they do not.
  "pendataan.nomor.arti": { default: "Nomor registrasi orang ini di sekolah tersebut. Berbeda dari PINTAR ID dan NIS/NISN. Nomor ini tidak menyatakan apakah orangnya murid, guru, atau pimpinan.", en: "This person's registration number at that school. Different from the PINTAR ID and the NIS/NISN. It does not say whether that person is a student, a teacher or management." },

  // polish batch 2 (UX-07): the page speaks of a school, so its code is the school's
  "pendataan.kode.judul": { default: "Kode sekolah", en: "School code" },
  "pendataan.kode.belum": { default: "Sekolah ini belum punya kode.", en: "This school does not have a code yet." },
  "pendataan.kode.arti": { default: "Kode ini menjadi bagian dari nomor registrasi sekolah yang dibuat PINTAR untuk setiap orang di sekolah ini.", en: "This code becomes part of the school registration number PINTAR creates for each person at this school." },
  "pendataan.kode.bentuk": { default: "Tiga huruf atau angka.", en: "Three letters or digits." },
  "pendataan.kode.contoh": { default: "Contoh No. Registrasi Sekolah", en: "Example School Registration Number" },
  // SAID BEFORE THE FIRST ISSUANCE, not discovered after it. The database makes
  // the code immutable the moment one number exists under it, and an
  // administrator who learns that afterwards has learned it too late.
  "pendataan.kode.peringatan": { default: "Setelah nomor registrasi sekolah pertama diterbitkan, kode ini tidak bisa diubah lagi.", en: "Once the first school registration number has been issued, this code can no longer be changed." },
  "pendataan.kode.simpan": { default: "Simpan kode", en: "Save the code" },
  "pendataan.kode.tersimpan": { default: "Kode sekolah tersimpan. Daftar orang sekarang bisa diunggah di bawah.", en: "The school code is saved. The list of people can now be uploaded below." },
  "pendataan.kode.beku": { default: "Kode ini sudah dipakai pada nomor registrasi sekolah yang diterbitkan, jadi tidak bisa diubah lagi.", en: "This code is already part of issued school registration numbers, so it can no longer be changed." },
  "pendataan.kode.gagal": { default: "Kode itu tidak bisa dipakai. Mungkin sudah dipakai sekolah lain, atau bentuknya tidak sesuai.", en: "That code cannot be used. It may already belong to another school, or its shape is wrong." },
  "pendataan.kode.label": { default: "Kode", en: "Code" },

  "pendataan.unggah.judul": { default: "Daftar orang", en: "The list of people" },
  "pendataan.unggah.berkas": { default: "Pilih berkas", en: "Choose a file" },
  "pendataan.unggah.tempel": { default: "Atau tempelkan dari spreadsheet", en: "Or paste from a spreadsheet" },
  "pendataan.unggah.bentuk": { default: "Baris pertama berisi nama kolom. Koma, titik koma, atau tab sama-sama terbaca.", en: "The first row holds the column names. Commas, semicolons and tabs are all readable." },
  "pendataan.unggah.contoh_arti": { default: "Satu daftar untuk satu kelas. Cukup satu kolom «nama». Setelah daftar terbaca, pilih kelasnya sekali untuk semua baris: pada Tempat, pilih «Satu pilihan untuk semua» lalu kelasnya. Dari spreadsheet, simpan sebagai CSV atau salin barisnya ke kotak di bawah.", en: "One list per class. A single «nama» column is enough. Once the list is read, choose its class once for every row: under Place, choose «One choice for everyone» and then the class. From a spreadsheet, save it as CSV or copy its rows into the box below." },
  "pendataan.unggah.contoh_label": { default: "Contoh daftar untuk satu kelas", en: "An example list for one class" },
  "pendataan.unggah.contoh": { default: "nama\nAni Lestari\nBudi Santoso\nCitra Dewi", en: "nama\nAni Lestari\nBudi Santoso\nCitra Dewi" },
  "pendataan.unggah.kosong": { default: "Belum ada baris yang terbaca.", en: "No rows have been read yet." },
  "pendataan.unggah.terbaca": { default: "baris terbaca", en: "rows read" },

  "pendataan.peta.judul": { default: "Kolom mana untuk apa", en: "Which column is which" },
  "pendataan.peta.sub": { default: "PINTAR menebak dari nama kolom. Ubah bila tebakannya keliru. Kelas dipilih pada Tempat dengan «Satu pilihan untuk semua»: satu daftar untuk setiap kelas.", en: "PINTAR guesses from the column names. Change it where the guess is wrong. The class is chosen under Place with «One choice for everyone»: one list per class." },
  "pendataan.peta.tidak": { default: "Tidak dipakai", en: "Not used" },
  "pendataan.peta.kolom": { default: "Kolom", en: "Column" },
  "pendataan.peta.sama": { default: "Satu pilihan untuk semua", en: "One choice for everyone" },
  "pendataan.peta.wajib": { default: "Kolom nama harus dipilih.", en: "A name column must be chosen." },
  "pendataan.peta.tanpa_kelas": { default: "{n} baris belum punya kelas. Murid tanpa kelas bisa masuk, tetapi tidak menerima materi apa pun. Untuk daftar murid, pilih kelasnya pada Tempat («Satu pilihan untuk semua»).", en: "{n} rows have no class yet. A student without a class can sign in but receives no material. For a list of students, choose their class under Place («One choice for everyone»)." },
  "pendataan.peta.tanpa_kelas_ya": { default: "Ini daftar guru atau staf: catat tanpa kelas. Perannya diberikan sesudahnya di Peran & akses.", en: "This is a list of teachers or staff: record them without a class. Their role is given afterwards on Peran & akses." },
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
  "pendataan.periksa.perbaiki": { default: "Perbaiki berkas atau pilihan kolomnya, lalu mulai pendataan baru. Tidak ada yang dicatat sampai seluruh baris bisa dibaca.", en: "Correct the file or its column choices, then start a new intake. Nothing is recorded until every row can be read." },
  "pendataan.periksa.gagal": { default: "Pemeriksaan tidak bisa dijalankan sekarang. Coba sekali lagi.", en: "The check could not run just now. Try once more." },
  // E-K4: the intake file could not be opened (pending Dr Gladys)
  "pendataan.buka.gagal": { default: "Berkas itu belum bisa dibuka sebagai pendataan. Periksa isinya, lalu coba lagi.", en: "That file could not be opened as an intake. Check its contents, then try again." },

  // EACH PROBLEM AS A SENTENCE AN ADMINISTRATOR CAN ACT ON. The database
  // returns them as field-name phrases; none of those reaches a screen.
  "pendataan.masalah.nama": { default: "Nama kosong atau terlalu panjang.", en: "The name is empty or too long." },
  "pendataan.masalah.orang_bentuk": { default: "Kolom orang yang sudah terdaftar tidak berisi penanda yang sah.", en: "The already-registered column does not hold a valid marker." },
  "pendataan.masalah.orang_asing": { default: "Orang itu tidak bisa Anda tunjuk dari sini.", en: "That person is not one you can name from here." },
  "pendataan.masalah.orang_sudah": { default: "Orang itu sudah punya nomor registrasi sekolah di sekolah ini.", en: "That person already has a school registration number at this school." },
  "pendataan.masalah.tempat_bentuk": { default: "Kolom Tempat berisi nama kelas, bukan penanda PINTAR. Pada Tempat, pilih «Satu pilihan untuk semua» lalu kelasnya, dan unggah satu daftar untuk setiap kelas.", en: "The Place column holds class names, not PINTAR's marker. Under Place, choose «One choice for everyone» and then the class, and upload one list per class." },
  "pendataan.masalah.tempat_asing": { default: "Tempat itu bukan bagian dari sekolah ini.", en: "That place is not part of this school." },
  "pendataan.masalah.tempat_luar": { default: "Tempat itu di luar wewenang Anda.", en: "That place is outside your authority." },
  "pendataan.masalah.peran_asing": { default: "Peran itu tidak dikenal.", en: "That role is not one PINTAR has." },
  "pendataan.masalah.peran_dilarang": { default: "Peran itu tidak diberikan lewat pendataan massal.", en: "That role is not granted through a bulk intake." },
  "pendataan.masalah.peran_tanpa_tempat": { default: "Peran perlu tempat: isi tempat untuk baris ini.", en: "A role needs a place: give this row one." },
  "pendataan.masalah.ganda": { default: "Baris ini kembar dengan baris lain di berkas yang sama.", en: "This row is a twin of another row in the same file." },
  "pendataan.masalah.lain": { default: "Baris ini belum bisa dicatat.", en: "This row cannot be recorded yet." },
  "pendataan.masalah.tempat_murid": { default: "Murid hanya bisa ditempatkan di Kelas atau Tingkat yang aktif.", en: "A student can only be placed in an active Kelas or Tingkat." },
  "pendataan.masalah.staf": { default: "Peran guru dan staf tidak diberikan lewat pendataan massal. Kosongkan kolom Peran dan Tempat pada baris ini: orangnya tetap tercatat dengan nomor registrasi sekolah, dan perannya Anda berikan di Konfigurasi → Peran & akses.", en: "Teacher and staff roles are not given through a bulk intake. Leave this row's Role and Place empty: the person is still recorded with the school registration number, and you give the role in Konfigurasi → Roles & access." },

  "pendataan.pratinjau.judul": { default: "Yang akan terjadi", en: "What will happen" },
  "pendataan.pratinjau.total": { default: "Baris", en: "Rows" },
  "pendataan.pratinjau.baru": { default: "Orang baru", en: "New people" },
  "pendataan.pratinjau.tertaut": { default: "Orang yang sudah terdaftar", en: "People already registered" },
  "pendataan.pratinjau.nomor": { default: "No. Registrasi Sekolah yang akan dibuat", en: "School Registration Numbers to be created" },
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
  "pendataan.percontohan.nyata": { default: "Lima puluh orang ini sudah benar-benar tercatat, lengkap dengan nomor registrasi sekolahnya. Ini bukan contoh.", en: "These fifty people are genuinely recorded, each with their school registration number. This is not a sample." },
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
  "pendataan.unggah.perlu_kode": { default: "Simpan kode sekolah di atas lebih dulu. Setelah kode tersimpan, daftar bisa diunggah di sini.", en: "Save the school code above first. Once it is saved, a list can be uploaded here." },
  "pendataan.lanjut.judul": { default: "Langkah berikutnya", en: "What comes next" },
  "pendataan.lanjut.staf": { default: "Untuk guru dan staf: berikan perannya lebih dulu, di", en: "For teachers and staff: give their role first, on" },
  "pendataan.lanjut.aktif": { default: "Lalu buka akunnya: guru dan staf dengan email, murid dengan kartu kelas, di", en: "Then open their account: teachers and staff by email, students by class card, on" },
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

  "tindakan.lihat_topik": { default: "Topik mana yang paling menurunkan angka ini: lihat Penguasaan per bagian di bawah.", en: "To see which topics pull this figure down, see mastery by part below." },
  "tindakan.baca_kenaikan": { default: "Kenaikan menunjukkan seberapa jauh kelas bergerak, bukan apakah target tercapai. Baca bersama Pemahaman dan Sebaran hasil.", en: "Gain shows how far the class moved, not whether the target is met. Read it with comprehension and the spread of results." },
  "tindakan.lihat_nama": { default: "Siapa saja yang ada di pita «Perlu penguatan»: lihat nama murid (Ringkasan Kelas, bagian E).", en: "Who is in the Needs strengthening band: see the students' names (class summary, section E)." },
  "tindakan.lihat_soal": { default: "Soal wajib mana yang belum dijawab tepat: lihat bukti per soal.", en: "Which required questions were not answered correctly: see the evidence per question." },
  "laporan.anda_memutuskan": { default: "PINTAR menunjukkan; langkah berikutnya Anda yang memutuskan.", en: "PINTAR shows; you decide the next step." },
  "tindakan.ulangi": { default: "Ulangi topik ini bersama-sama sebelum lanjut.", en: "Go over this topic together before moving on." },
  "tindakan.fokus": { default: "Fokuskan waktu tambahan pada murid di dua tingkat kesiapan terbawah.", en: "Focus extra time on students in the two lowest readiness tiers." },
  "tindakan.fokus_pita": { default: "Fokuskan waktu tambahan pada murid di pita Berkembang dan Perlu penguatan.", en: "Focus extra time on students in the Developing and Needs strengthening bands." },
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
  "sertifikat.kelola.judul": { default: "Sertifikat sekolah", en: "School certificates" },
  "sertifikat.kelola.intro": { default: "Sertifikat yang sudah diterbitkan sekolah Anda. Sertifikat yang keliru diterbitkan dapat dicabut di sini; pemeriksaan keasliannya lalu menyatakannya dicabut.", en: "The certificates your school has issued. A certificate issued in error can be revoked here; its authenticity check then says it was revoked." },
  "sertifikat.kelola.intro.platform": { default: "Sertifikat yang sudah diterbitkan semua sekolah. Sertifikat yang keliru diterbitkan dapat dicabut di sini; pemeriksaan keasliannya lalu menyatakannya dicabut.", en: "The certificates every school has issued. A certificate issued in error can be revoked here; its authenticity check then says it was revoked." },
  "sertifikat.kelola.benda": { default: "sertifikat", en: "certificates" },
  "sertifikat.kelola.cari": { default: "Cari nomor sertifikat atau nama pemegang", en: "Search by certificate number or holder's name" },
  "sertifikat.kelola.kolom.pemegang": { default: "Pemegang", en: "Holder" },
  "sertifikat.kelola.kolom.nomor": { default: "Nomor sertifikat", en: "Certificate number" },
  "sertifikat.kelola.kolom.sekolah": { default: "Sekolah", en: "School" },
  "sertifikat.kelola.kolom.kursus": { default: "Kursus", en: "Course" },
  "sertifikat.kelola.kolom.terbit": { default: "Diterbitkan", en: "Issued" },
  "sertifikat.kelola.kolom.keadaan": { default: "Keadaan", en: "State" },
  "sertifikat.kelola.kolom.tindakan": { default: "Tindakan", en: "Action" },
  "sertifikat.kelola.keadaan.ISSUED": { default: "Berlaku", en: "Valid" },
  "sertifikat.kelola.keadaan.REVOKED": { default: "Dicabut", en: "Revoked" },
  "sertifikat.kelola.keadaan.SUPERSEDED": { default: "Digantikan", en: "Replaced" },
  "sertifikat.kelola.kosong": { default: "Belum ada sertifikat yang diterbitkan.", en: "No certificate has been issued yet." },
  "sertifikat.kelola.tidak_cocok": { default: "Tidak ada sertifikat yang cocok dengan pencarian ini.", en: "No certificate matches this search." },
  "sertifikat.kelola.cabut": { default: "Cabut", en: "Revoke" },
  "sertifikat.kelola.ditolak": { default: "Sertifikat sekolah hanya dapat dibuka oleh Admin sekolah.", en: "Only a school admin can open the school's certificates." },
  "sertifikat.cabut.judul": { default: "Cabut sertifikat", en: "Revoke a certificate" },
  // §5b and L1–L4 (owner, 9 Nov): suspension, closure and deletion, never confused
  "akun.tinggal.judul": { default: "Meninggalkan PINTAR", en: "Leaving PINTAR" },
  "akun.tinggal.arti": { default: "Anda boleh pergi kapan saja. Inilah yang terjadi bila akun ditutup atau data pribadi dihapus, sebagaimana PINTAR bekerja saat ini.", en: "You may leave at any time. This is what happens when an account is closed or personal data is deleted, as PINTAR works today." },
  "akun.tinggal.intro_murid": { default: "Akun PINTAR Anda, dan cara meninggalkannya.", en: "Your PINTAR account, and how to leave it." },
  "akun.tinggal.fakta.akses": { default: "Akses: saat akun ditutup, semua perangkat keluar dan masuk tidak lagi bisa, di semua sekolah.", en: "Access: when the account is closed, every device is signed out and signing in no longer works, at every school." },
  // Sharon §16 finding 4 (6faef690), Daisy (TINJAUAN-6faef690): true of the code
  "akun.tinggal.fakta.data": { default: "Data pribadi: yang dihapus adalah foto profil beserta berkasnya, nama tampilan (diganti PINTAR ID), email untuk masuk, nama pengguna, alamat IP dan peramban yang tercatat saat masuk, dan salinan nama dan email di catatan pendaftaran PINTAR. Yang lain disimpan karena aturan, seperti di bawah.", en: "Personal data: what is deleted is the profile photo and its file, the display name (replaced by the PINTAR ID), the sign-in email, the username, the IP addresses and browsers recorded at sign-in, and the copies of the name and email in PINTAR's enrolment records. The rest is kept by rule, as below." },
  // Sharon §16 finding 4 (6faef690), Daisy (TINJAUAN-6faef690): true of the code
  "akun.tinggal.fakta.akademik": { default: "Catatan akademik: hasil dan pengerjaan tetap tersimpan di sekolahnya. Setelah penghapusan, catatan itu tanpa nama Anda.", en: "Academic records: results and sittings stay with their school. After deletion they no longer carry your name." },
  "akun.tinggal.fakta.sertifikat": { default: "Sertifikat: tetap dapat diperiksa. Nama yang tertulis di sertifikat adalah catatan sertifikat itu sendiri dan tidak diubah.", en: "Certificates: they can still be verified. The name written on a certificate is the certificate's own record and is not changed." },
  // Sharon §16 finding 4 (6faef690), Daisy (TINJAUAN-6faef690): true of the code
  "akun.tinggal.fakta.audit": { default: "Jejak audit: tidak pernah ditulis ulang. Bila nama atau email Anda pernah dikoreksi, baris koreksi itu tetap menyimpan nama atau email yang lama.", en: "Audit trail: never rewritten. If your name or email was ever corrected, that correction's row still holds the earlier name or email." },
  "akun.tinggal.fakta.cadangan": { default: "Cadangan dan log layanan: data yang dihapus dari PINTAR masih ada di cadangan sampai cadangan itu berakhir, saat ini 7 hari. Log penyedia layanan yang menjalankan PINTAR juga mencatat email dan alamat IP saat masuk; log itu terhapus menurut masa simpan penyedia tersebut, dan PINTAR tidak dapat menghapusnya lebih awal.", en: "Backups and service logs: data removed from PINTAR stays in backups until they expire, today 7 days. The logs of the provider that runs PINTAR also record the email and IP address at sign-in; they are removed on that provider's own retention schedule, and PINTAR cannot remove them sooner." },
  "akun.tinggal.jenis.close": { default: "Tutup akun saya", en: "Close my account" },
  "akun.tinggal.jenis.delete_personal_data": { default: "Hapus data pribadi saya", en: "Delete my personal data" },
  // Sharon §16 finding 4 (6faef690), Daisy (TINJAUAN-6faef690): true of the code
  "akun.tinggal.akibat.close": { default: "Akun ditutup saat itu juga: semua perangkat keluar dan Anda tidak dapat masuk lagi, juga untuk melihat permintaan Anda. Catatan tetap tersimpan. Untuk kembali, buka «Minta dibuka kembali» di halaman masuk; Admin PINTAR membuka akun hanya setelah memastikan identitas Anda.", en: "The account closes at once: every device is signed out and you cannot sign in again, including to see your requests. Records are kept. To come back, open \u00abAsk for it to be reopened\u00bb on the sign-in page; an Admin PINTAR reopens the account only after confirming who you are." },
  // Sharon §16 finding 4 (6faef690), Daisy (TINJAUAN-6faef690): true of the code
  "akun.tinggal.akibat.delete_personal_data": { default: "Data pribadi dihapus hanya setelah akun ditutup. Permintaan ini dicatat sekarang, dan Admin PINTAR mengerjakannya setelah Anda menutup akun. Keadaannya terlihat di sini selama akun belum ditutup; setelah ditutup, Anda tidak dapat masuk untuk melihatnya.", en: "Personal data is deleted only after the account is closed. This request is recorded now, and an Admin PINTAR carries it out once you close the account. You can see where it stands here until the account is closed; after that you cannot sign in to see it." },
  "akun.tinggal.konfirmasi.close": { default: "Saya memahami bahwa akun saya ditutup sekarang.", en: "I understand my account closes now." },
  "akun.tinggal.konfirmasi.delete_personal_data": { default: "Saya meminta data pribadi saya dihapus.", en: "I ask for my personal data to be deleted." },
  "akun.tinggal.tombol.close": { default: "Tutup akun saya", en: "Close my account" },
  "akun.tinggal.tombol.delete_personal_data": { default: "Kirim permintaan", en: "Send the request" },
  // Sharon §16 finding 4 (6faef690), Daisy (TINJAUAN-6faef690): true of the code
  "akun.tinggal.lewat_sekolah": { default: "Karena Anda murid, permintaan menutup akun atau menghapus data pribadi diajukan oleh sekolah bersama keluarga Anda. Sampaikan kepada wali kelas atau guru Anda.", en: "Because you are a student, a request to close the account or delete personal data is made by the school together with your family. Tell your homeroom teacher or another teacher." },
  "akun.tinggal.ok": { default: "Permintaan Anda tercatat.", en: "Your request is recorded." },
  "akun.tinggal.status.received": { default: "Diterima", en: "Received" },
  "akun.tinggal.status.in_progress": { default: "Sedang dikerjakan", en: "In progress" },
  "akun.tinggal.status.done": { default: "Selesai", en: "Done" },
  "akun.tinggal.status.declined": { default: "Tidak dapat dilakukan", en: "Could not be done" },
  "akun.tinggal.galat.account_not_allowed": { default: "Tindakan ini milik Admin PINTAR.", en: "This act belongs to an Admin PINTAR." },
  "akun.tinggal.galat.account_self": { default: "Akun Anda sendiri ditangguhkan atau dipulihkan oleh admin lain.", en: "Your own account is suspended or restored by another administrator." },
  "akun.tinggal.galat.account_unknown": { default: "Orang itu tidak ditemukan.", en: "That person was not found." },
  "akun.tinggal.galat.account_category_invalid": { default: "Pilih salah satu kategori.", en: "Choose one of the categories." },
  "akun.tinggal.galat.account_note_required": { default: "Tuliskan catatan atau alasannya, 10 sampai 300 karakter.", en: "Write the note or reason, 10 to 300 characters." },
  "akun.tinggal.galat.account_already_suspended": { default: "Akun ini sudah ditangguhkan sejak {tanggal}.", en: "This account has been suspended since {tanggal}." },
  "akun.tinggal.galat.account_already_closed": { default: "Akun ini sudah ditutup atas permintaan pemiliknya sejak {tanggal}. Akun itu dibuka kembali hanya dari permintaannya.", en: "This account has been closed at its owner's request since {tanggal}. It is reopened only from that person's request." },
  "akun.tinggal.galat.account_not_suspended": { default: "Akun ini aktif: tidak ditangguhkan dan tidak ditutup.", en: "This account is active: neither suspended nor closed." },
  "akun.tinggal.galat.account_confirm_required": { default: "Centang konfirmasinya lebih dahulu.", en: "Tick the confirmation first." },
  "akun.tinggal.galat.account_learner_via_school": { default: "Karena Anda murid, permintaan ini diajukan oleh sekolah bersama keluarga Anda. Sampaikan kepada wali kelas atau guru Anda.", en: "As a student, this request is made by your school with your family. Tell your class teacher." },
  "akun.tinggal.galat.account_request_open": { default: "Permintaan ini sudah diajukan dan sedang dikerjakan.", en: "This request has already been made and is in hand." },
  "akun.tinggal.galat.account_request_invalid": { default: "Permintaan itu tidak ditemukan atau sudah selesai.", en: "That request was not found or is already done." },
  "akun.tinggal.galat.account_not_closed": { default: "Data pribadi dihapus hanya dari akun yang sudah ditutup.", en: "Personal data is deleted only from a closed account." },
  // Sharon §16 (6faef690): the last PINTAR Administrator cannot lock the platform out; a photo file not yet removed
  "akun.tinggal.galat.account_platform_role": { default: "Akun yang memegang peran Admin PINTAR tidak dapat ditutup sendiri. Minta Admin PINTAR lain melepaskan peran itu lebih dulu.", en: "An account holding the Admin PINTAR role cannot be closed by its owner. Ask another Admin PINTAR to remove that role first." },
  "akun.tinggal.galat.account_photo_pending": { default: "Data pribadi sudah dihapus, tetapi foto profil belum terhapus dari penyimpanan. Tekan sekali lagi untuk menyelesaikannya.", en: "The personal data has been deleted, but the profile photo has not yet been removed from storage. Press once more to finish." },
  "akun.tinggal.galat.account_failed": { default: "Belum tersimpan. Coba lagi.", en: "Not saved. Try again." },
  "keamanan.akun.judul": { default: "Penangguhan dan penutupan akun", en: "Account suspension and closure" },
  "keamanan.akun.arti": { default: "Hanya untuk Admin PINTAR. Penangguhan berlaku saat itu juga di semua sesi dan tidak pernah mengubah catatan pendidikan. Pensiun, kelulusan dan pindah sekolah memakai pengakhiran di sekolah, bukan penangguhan.", en: "For an Admin PINTAR only. A suspension takes effect at once in every session and never alters educational records. Retirement, graduation and transfer use ending at the school, never suspension." },
  "keamanan.akun.cari": { default: "PINTAR ID", en: "PINTAR ID" },
  "keamanan.akun.cari_tombol": { default: "Cari", en: "Find" },
  "keamanan.akun.tidak_ada": { default: "Tidak ada orang dengan PINTAR ID itu.", en: "No person holds that PINTAR ID." },
  "keamanan.akun.ditangguhkan": { default: "Ditangguhkan sejak", en: "Suspended since" },
  "keamanan.akun.ditutup": { default: "Ditutup atas permintaan sendiri sejak", en: "Closed at the person's own request since" },
  "keamanan.akun.akibat": { default: "Menangguhkan: semua perangkat keluar, masuk ditolak, dan setiap tindakan di PINTAR ditolak. Catatan pendidikan tidak berubah.", en: "Suspending: every device is signed out, sign-in is refused, and every action in PINTAR is refused. Educational records do not change." },
  "keamanan.akun.kategori": { default: "Kategori", en: "Category" },
  "keamanan.akun.kategori.security": { default: "Keamanan akun", en: "Account security" },
  "keamanan.akun.kategori.administrative": { default: "Administrasi", en: "Administrative" },
  "keamanan.akun.kategori.other": { default: "Lainnya", en: "Other" },
  "keamanan.akun.catatan": { default: "Catatan (wajib untuk Lainnya)", en: "Note (required for Other)" },
  "keamanan.akun.alasan": { default: "Alasan", en: "Reason" },
  "keamanan.akun.tangguhkan": { default: "Tangguhkan akun", en: "Suspend the account" },
  "keamanan.akun.aktifkan": { default: "Pulihkan akun", en: "Restore the account" },
  "keamanan.akun.ok.tangguh": { default: "Akun ditangguhkan. Semua sesinya berakhir.", en: "Account suspended. All its sessions ended." },
  "keamanan.akun.ok.aktif": { default: "Akun dipulihkan. Orang ini dapat masuk lagi.", en: "Account restored. This person can sign in again." },
  "keamanan.akun.ok.hapus": { default: "Data pribadi dihapus. Catatan yang wajib disimpan tetap ada.", en: "Personal data deleted. Records that must be kept remain." },
  "keamanan.permintaan.judul": { default: "Permintaan dari pemilik akun", en: "Requests from account holders" },
  "keamanan.permintaan.kosong": { default: "Tidak ada permintaan yang terbuka.", en: "No request is open." },
  "keamanan.permintaan.hapus": { default: "Hapus data pribadi", en: "Delete personal data" },
  "keamanan.permintaan.hapus_foto_ulang": { default: "Hapus foto profil sekarang", en: "Remove the profile photo now" },
  "keamanan.permintaan.belum_ditutup": { default: "Akun belum ditutup; data pribadi dihapus setelah akun ditutup.", en: "The account is not closed yet; personal data is deleted once it is." },
  "audit.aksi.account.suspended": { default: "Akun ditangguhkan", en: "Account suspended" },
  "audit.aksi.account.reactivated": { default: "Akun dipulihkan", en: "Account restored" },
  "audit.aksi.account.reopened": { default: "Akun dibuka kembali", en: "Account reopened" },
  "audit.aksi.account.closed_at_request": { default: "Akun ditutup atas permintaan sendiri", en: "Account closed at its holder's request" },
  "audit.aksi.account.deletion_requested": { default: "Penghapusan data pribadi diminta", en: "Personal data deletion requested" },
  "audit.aksi.account.personal_data_deleted": { default: "Data pribadi dihapus", en: "Personal data deleted" },
  "audit.alasan.security": { default: "Keamanan akun", en: "Account security" },
  "audit.alasan.administrative": { default: "Administrasi", en: "Administrative" },
  "audit.alasan.closed_at_request": { default: "Atas permintaan sendiri", en: "At the holder's request" },
  // E5 «Akhiri tugas di sekolah ini» and §11 «Ubah peran & tanggung jawab» (owner, 9 Nov); words of the responsibilities are
  // plain names pending Daisy's matrix and Dr Gladys's copy pass
  "staf.judul": { default: "Peran dan tanggung jawab", en: "Roles and responsibilities" },
  "staf.intro": { default: "Peran yang dipegang orang ini di sekolah ini, dan tanggung jawab yang dibawa tiap peran. Di PINTAR, wewenang datang dari peran yang diberikan di sini, bukan dari jabatan di sekolah.", en: "The roles this person holds at this school, and the responsibilities each carries. In PINTAR, authority comes from the roles given here, not from a job title at the school." },
  "staf.kosong": { default: "Orang ini tidak memegang peran apa pun di sekolah ini sekarang.", en: "This person holds no role at this school now." },
  "staf.tidak_ada_sekolah": { default: "Pilih sekolah sebagai konteks kerja lebih dahulu.", en: "Choose a school as your working context first." },
  "staf.buka": { default: "Kelola peran orang ini", en: "Manage this person's roles" },
  "staf.peran_kini": { default: "Peran sekarang", en: "Roles now" },
  "staf.tempat": { default: "Tempat", en: "Place" },
  "staf.sampai": { default: "Berlaku sampai", en: "Valid until" },
  "staf.tj": { default: "Tanggung jawab", en: "Responsibilities" },
  "staf.ubah.judul": { default: "Ubah peran & tanggung jawab", en: "Change roles & responsibilities" },
  "staf.ubah.arti": { default: "Tambah satu peran, lepaskan peran yang tidak lagi dipegang, atau keduanya sekaligus. Tidak ada yang berubah sebelum Anda meninjau dan mengonfirmasi.", en: "Add one role, release roles no longer held, or both at once. Nothing changes until you review and confirm." },
  "staf.ubah.lepas": { default: "Lepaskan", en: "Release" },
  "staf.ubah.tambah": { default: "Tambah peran", en: "Add a role" },
  "staf.ubah.tambah_tidak": { default: "Tidak menambah peran", en: "Add no role" },
  "staf.ubah.alasan": { default: "Alasan", en: "Reason" },
  "staf.ubah.alasan_arti": { default: "10 sampai 300 karakter. Tercatat di jejak audit sekolah.", en: "10 to 300 characters. Recorded in the school's audit trail." },
  "staf.ubah.tinjau": { default: "Tinjau perubahan", en: "Review the change" },
  "staf.ubah.tinjau_judul": { default: "Tinjau sebelum mengonfirmasi", en: "Review before confirming" },
  "staf.ubah.dapat": { default: "Tanggung jawab yang ditambahkan", en: "Responsibilities added" },
  "staf.ubah.tetap": { default: "Tanggung jawab yang tetap", en: "Responsibilities kept" },
  "staf.ubah.hilang": { default: "Tanggung jawab yang dilepas", en: "Responsibilities released" },
  "staf.ubah.tidak_ada": { default: "Tidak ada.", en: "None." },
  "staf.ubah.tidak_diberikan": { default: "Dari halaman ini tidak dapat diberikan: peran Admin PINTAR, dan peran di sekolah lain.", en: "This page cannot give: the Admin PINTAR role, or roles at another school." },
  "staf.ubah.antrean": { default: "Keputusan yang akan menunggu tanpa ada yang memutuskan", en: "Decisions that will wait with no one to decide them" },
  "staf.ubah.antrean_arti": { default: "Di {tempat} tidak akan ada lagi yang memutuskan. {n} keputusan yang menunggu tetap menunggu dan tidak dialihkan; tetapkan pemegang baru agar ada yang memutuskannya.", en: "At {tempat} no one will be left to decide. {n} waiting decision(s) keep waiting and are not passed on; name a new holder so someone decides them." },
  "staf.ubah.menunggu": { default: "menunggu", en: "waiting" },
  "staf.ubah.konfirmasi_admin_lepas": { default: "Saya memahami bahwa orang ini tidak lagi menjadi Admin sekolah dan kehilangan semua wewenangnya.", en: "I understand this person will no longer be a school administrator and loses all its authority." },
  "staf.ubah.konfirmasi_admin": { default: "Saya memahami bahwa orang ini akan menjadi Admin sekolah dengan semua wewenangnya.", en: "I understand this person will become a school administrator with all its authority." },
  "staf.ubah.terapkan": { default: "Konfirmasi perubahan", en: "Confirm the change" },
  "staf.ubah.batal": { default: "Batal", en: "Cancel" },
  "staf.ubah.ok": { default: "Peran diubah. Wewenang yang dilepas berakhir saat itu juga.", en: "Roles changed. Released authority ends at once." },
  "staf.akhiri.judul": { default: "Akhiri tugas di sekolah ini", en: "End duties at this school" },
  "staf.akhiri.arti": { default: "Semua peran orang ini di sekolah ini berakhir saat dicatat. Akunnya, peran di sekolah lain, dan semua karya serta catatannya tetap ada.", en: "All of this person's roles at this school end when this is recorded. Their account, roles at other schools, and all their work and records stay." },
  "staf.akhiri.kategori": { default: "Kategori", en: "Category" },
  "staf.akhiri.tanggal": { default: "Tanggal kejadian", en: "Date it happened" },
  "staf.akhiri.tanggal_arti": { default: "Hari ini atau sebelumnya. Wewenangnya berakhir saat Anda menyimpan, apa pun tanggalnya.", en: "Today or earlier. Their authority ends when you save, whatever the date." },
  "staf.akhiri.tanya": { default: "Akhiri tugas {nama} di {sekolah}?", en: "End {nama}'s duties at {sekolah}?" },
  "staf.akhiri.peran_berakhir": { default: "Semua perannya di sekolah ini berakhir: {daftar}.", en: "All their roles at this school end: {daftar}." },
  "staf.kategori.koreksi_grup": { default: "Bukan kepergian", en: "Not a departure" },
  "staf.akhiri.alasan": { default: "Alasan", en: "Reason" },
  "staf.akhiri.tombol": { default: "Akhiri tugas di sekolah ini", en: "End duties at this school" },
  "staf.akhiri.ok": { default: "Tugas di sekolah ini diakhiri. Wewenangnya berakhir saat itu juga.", en: "Duties at this school ended. Their authority ended at once." },
  "staf.kategori.retirement": { default: "Pensiun", en: "Retirement" },
  "staf.kategori.resignation": { default: "Mengundurkan diri", en: "Resignation" },
  "staf.kategori.dismissal": { default: "Diberhentikan", en: "Dismissal" },
  "staf.kategori.transfer": { default: "Pindah tugas ke sekolah lain", en: "Moved to another school" },
  "staf.kategori.contract_end": { default: "Masa tugas selesai", en: "End of contract" },
  "staf.kategori.correction": { default: "Dicatat keliru", en: "Recorded in error" },
  "staf.kategori.other": { default: "Lainnya", en: "Other" },
  "staf.tj.can_draft": { default: "Menyusun paket di Studio", en: "Writing packages in Studio" },
  "staf.tj.can_review": { default: "Menyetujui isi paket", en: "Approving package content" },
  "staf.tj.can_freeze_release": { default: "Membuat dan mengunci terbitan", en: "Making and locking releases" },
  "staf.tj.can_publish": { default: "Menerbitkan paket dan mengelola sertifikat", en: "Publishing packages and managing certificates" },
  "staf.tj.can_assign_learning": { default: "Menyediakan materi untuk kelas", en: "Giving material to classes" },
  "staf.tj.can_quick_assessment": { default: "Membuat Uji Cepat", en: "Creating quick checks (Uji Cepat)" },
  "staf.tj.can_authorize_transfer": { default: "Menyetujui perpindahan murid", en: "Approving student transfers" },
  "staf.tj.can_review_question_health": { default: "Meninjau sinyal mutu soal", en: "Reviewing item quality signals" },
  "staf.tj.can_manage_report_templates": { default: "Mengelola templat laporan", en: "Managing report templates" },
  "staf.tj.can_review_integrity": { default: "Meninjau catatan integritas", en: "Reviewing integrity notes" },
  "staf.tj.can_view_learner_roster": { default: "Melihat daftar murid", en: "Seeing the student list" },
  "staf.tj.can_view_learner_result": { default: "Melihat hasil murid", en: "Seeing students' results" },
  "staf.tj.can_provision_people": { default: "Mendata orang dan mengaktifkan akun", en: "Recording people and activating accounts" },
  "staf.tj.can_manage_sittings": { default: "Mengatur pengerjaan asesmen murid", en: "Managing students' assessment sittings" },
  "staf.tj.management_decision": { default: "Memutuskan hal yang menunggu di Pimpinan", en: "Deciding what waits under Management" },
  "staf.galat.staff_not_allowed": { default: "Anda tidak dapat mengubah peran di sekolah ini.", en: "You cannot change roles at this school." },
  "staf.galat.staff_self": { default: "Peran Anda sendiri diubah atau diakhiri oleh admin lain.", en: "Your own roles are changed or ended by another administrator." },
  "staf.galat.staff_unknown": { default: "Orang ini tidak tercatat di sekolah ini.", en: "This person is not recorded at this school." },
  "staf.galat.staff_not_active": { default: "Orang ini tidak memegang peran di sekolah ini sekarang.", en: "This person holds no role at this school now." },
  "staf.galat.staff_category_invalid": { default: "Pilih salah satu kategori.", en: "Choose one of the categories." },
  "staf.galat.staff_reason_required": { default: "Tuliskan alasannya, 10 sampai 300 karakter.", en: "Write the reason, 10 to 300 characters." },
  "staf.galat.staff_date_invalid": { default: "Tanggal kejadian adalah hari ini atau sebelumnya, dan tidak sebelum orang ini mulai bertugas di sini.", en: "The date it happened is today or earlier, and not before this person began here." },
  "staf.galat.role_stale": { default: "Peran orang ini berubah sejak Anda meninjau. Tinjau lagi.", en: "This person's roles changed since you reviewed them. Review again." },
  "staf.galat.role_nothing": { default: "Pilih peran untuk dilepaskan atau ditambahkan.", en: "Choose a role to release or to add." },
  "staf.galat.role_not_allowed": { default: "Peran itu tidak dapat diberikan untuk tempat itu.", en: "That role cannot be given for that place." },
  "staf.galat.role_scope_invalid": { default: "Tempat itu tidak aktif atau bukan milik sekolah ini.", en: "That place is not active or does not belong to this school." },
  "staf.galat.role_until_invalid": { default: "Tanggal berlaku sampai harus setelah hari ini.", en: "The valid-until date must be after today." },
  "staf.galat.role_admin_unconfirmed": { default: "Centang konfirmasi untuk menjadikan orang ini Admin sekolah.", en: "Tick the confirmation to make this person a school administrator." },
  "staf.galat.role_remove_invalid": { default: "Peran yang dilepas bukan peran orang ini di sekolah ini.", en: "A role to release is not this person's role at this school." },
  "staf.galat.staff_failed": { default: "Perubahan belum tersimpan. Coba lagi.", en: "The change was not saved. Try again." },
  // B0 (administrator lock-out protection): the last-holder refusals, the renewal and the expiry read (peran_tolak, PR160)
  "peran.galat.role_last_platform_admin": { default: "Ini satu-satunya Admin PINTAR yang masih aktif, jadi perannya tidak dapat dicabut. Tunjuk Admin PINTAR kedua lebih dulu.", en: "This is the only active Admin PINTAR, so the role cannot be revoked. Appoint a second Admin PINTAR first." },
  "peran.galat.role_last_school_admin": { default: "Ini satu-satunya Admin sekolah yang masih aktif di sekolah ini, jadi perannya tidak dapat dicabut. Tunjuk Admin sekolah lain lebih dulu, atau hubungi Admin PINTAR.", en: "This is the only active school administrator at this school, so the role cannot be revoked. Appoint another school administrator first, or contact an Admin PINTAR." },
  "peran.galat.role_renew_not_allowed": { default: "Anda tidak dapat memperpanjang peran ini.", en: "You cannot renew this role." },
  "peran.galat.role_renew_not_live": { default: "Peran ini sudah berakhir atau dicabut. Berikan peran itu lagi.", en: "This role has ended or been revoked. Grant it again." },
  "peran.galat.role_renew_self": { default: "Peran Anda sendiri diperpanjang oleh admin lain.", en: "Your own role is renewed by another administrator." },
  "peran.galat.role_renew_until_invalid": { default: "Tanggal berlaku sampai yang baru harus setelah hari ini dan setelah tanggal yang sekarang.", en: "The new valid-until date must be after today and after the current one." },
  "peran.galat.role_renew_reason_required": { default: "Tuliskan alasannya, 10 sampai 300 karakter.", en: "Write the reason, 10 to 300 characters." },
  "peran.galat.role_read_not_allowed": { default: "Anda tidak dapat melihat peran ini.", en: "You cannot see these roles." },
  "peran.galat.role_expiry_days_invalid": { default: "Jumlah hari harus 1 sampai 366.", en: "The number of days must be 1 to 366." },
  "peran.galat.role_busy": { default: "Admin lain sedang mengubah peran di sini pada saat yang sama, jadi perubahan Anda belum tersimpan. Coba lagi.", en: "Another administrator was changing roles here at the same moment, so your change was not saved. Try again." },
  "peran.galat.role_failed": { default: "Perubahan belum tersimpan. Coba lagi.", en: "The change was not saved. Try again." },
  // A1 · sitting control: the refusals of the sitting, attempt and window acts (PR170, src/lib/pengerjaan-kontrak.ts)
  "pengerjaan.galat.sitting_not_allowed": { default: "Anda tidak dapat mengatur pengerjaan murid di kelas ini.", en: "You cannot manage learners' sittings in this class." },
  "pengerjaan.galat.sitting_professional": { default: "Tindakan ini tidak tersedia untuk asesmen Pengembangan Profesional.", en: "This action is not available for Professional Development assessments." },
  "pengerjaan.galat.sitting_reason_required": { default: "Tuliskan alasannya, 10 sampai 300 karakter.", en: "Write the reason, 10 to 300 characters." },
  "pengerjaan.galat.sitting_note_too_long": { default: "Catatan paling banyak 300 karakter.", en: "The note is at most 300 characters." },
  "pengerjaan.galat.sitting_already_ended": { default: "Pengerjaan ini sudah berakhir sebelum perubahan Anda tersimpan. Tidak ada yang diubah.", en: "This sitting ended before your change was saved. Nothing was changed." },
  "pengerjaan.galat.sitting_frozen": { default: "Pengerjaan ini sedang ditahan. Lanjutkan atau akhiri lebih dulu.", en: "This sitting is on hold. Resume it or end it first." },
  "pengerjaan.galat.sitting_not_frozen": { default: "Pengerjaan ini tidak sedang ditahan.", en: "This sitting is not on hold." },
  "pengerjaan.galat.sitting_learner_suspended": { default: "Pengerjaan ini baru dapat dilanjutkan atau diakhiri setelah akun murid aktif kembali.", en: "This sitting can be resumed or ended only after the learner's account is active again." },
  "pengerjaan.galat.sitting_end_kind_invalid": { default: "Pilih salah satu: dinilai atau tidak dihitung.", en: "Choose one: scored or not counted." },
  "pengerjaan.galat.sitting_minutes_invalid": { default: "Tambahan waktu harus 1 sampai 120 menit.", en: "Extra time must be 1 to 120 minutes." },
  "pengerjaan.galat.sitting_extend_limit": { default: "Pengerjaan ini sudah tiga kali diberi tambahan waktu.", en: "This sitting has already been given extra time three times." },
  "pengerjaan.galat.sitting_no_deadline": { default: "Pengerjaan ini tidak memiliki batas waktu, jadi tidak ada waktu yang ditambah.", en: "This sitting has no time limit, so there is no time to add." },
  "pengerjaan.galat.attempt_not_limited": { default: "Asesmen ini tidak membatasi jumlah percobaan, jadi tidak ada yang perlu diminta.", en: "This assessment does not limit attempts, so there is nothing to request." },
  "pengerjaan.galat.attempt_sitting_open": { default: "Murid ini masih memiliki pengerjaan yang terbuka. Akhiri atau lanjutkan dulu sebelum meminta percobaan lagi.", en: "This learner still has an open sitting. End or resume it before requesting another attempt." },
  "pengerjaan.galat.attempt_not_needed": { default: "Murid ini masih dapat memulai asesmen ini.", en: "This learner can still start this assessment." },
  "pengerjaan.galat.attempt_request_open": { default: "Permintaan untuk murid dan asesmen ini sudah menunggu keputusan.", en: "A request for this learner and assessment is already waiting for a decision." },
  "pengerjaan.galat.attempt_decision_not_allowed": { default: "Anda tidak dapat memutuskan permintaan ini.", en: "You cannot decide this request." },
  "pengerjaan.galat.attempt_own_request": { default: "Permintaan Anda sendiri diputuskan oleh orang lain.", en: "Your own request is decided by someone else." },
  "pengerjaan.galat.attempt_already_decided": { default: "Permintaan ini sudah diputuskan.", en: "This request has already been decided." },
  "pengerjaan.galat.attempt_reason_required": { default: "Tuliskan alasan tidak menyetujui, 10 sampai 300 karakter.", en: "Write why you are declining, 10 to 300 characters." },
  "pengerjaan.galat.window_not_allowed": { default: "Anda tidak dapat mengubah jadwal materi di kelas ini.", en: "You cannot change the schedule of material in this class." },
  "pengerjaan.galat.window_assignment_ended": { default: "Materi ini sudah diakhiri atau ditarik, jadi jadwalnya tidak dapat diubah.", en: "This material has been ended or withdrawn, so its schedule cannot be changed." },
  "pengerjaan.galat.window_invalid": { default: "Waktu tutup harus setelah waktu buka dan setelah saat ini.", en: "The closing time must be after the opening time and after now." },
  "pengerjaan.galat.window_unchanged": { default: "Jadwalnya sudah seperti itu.", en: "The schedule is already set that way." },
  "pengerjaan.galat.window_not_changeable": { default: "Jadwal materi ini tidak dapat diubah saat ini.", en: "This material's schedule cannot be changed right now." },
  "pengerjaan.galat.sitting_failed": { default: "Perubahan belum tersimpan. Coba lagi.", en: "The change was not saved. Try again." },
  // B0 on the screens: the expiry notice, the renewal, the platform admin's warning and the holder's own notice
  "galat.role_renewed": { default: "Peran diperpanjang.", en: "Role renewed." },
  "peran.berakhir.judul": { default: "Peran yang segera berakhir", en: "Roles ending soon" },
  "peran.berakhir.jumlah": { default: "Peran yang berakhir dalam 30 hari ke depan: {n}. Perpanjang sebelum tanggalnya agar orangnya tetap dapat bekerja.", en: "Roles ending within the next 30 days: {n}. Renew each before its date so the person can keep working." },
  "peran.berakhir.terakhir": { default: "satu-satunya admin yang aktif", en: "the only active administrator" },
  "peran.perpanjang.aksi": { default: "Perpanjang", en: "Renew" },
  "peran.perpanjang.judul": { default: "Perpanjang peran", en: "Renew a role" },
  "peran.perpanjang.arti": { default: "Peran ini mendapat tanggal akhir yang baru. Yang lain tidak berubah.", en: "This role gets a new end date. Nothing else changes." },
  "peran.perpanjang.sampai_baru": { default: "Berlaku sampai yang baru", en: "New valid-until date" },
  "peran.perpanjang.sampai_arti": { default: "Setelah {tanggal}, tanggal akhir yang sekarang.", en: "After {tanggal}, the current end date." },
  "peran.perpanjang.alasan_arti": { default: "10 sampai 300 karakter. Alasan ini dicatat.", en: "10 to 300 characters. This reason is recorded." },
  "peran.perpanjang.sendiri": { default: "Anda satu-satunya Admin platform yang aktif, jadi Anda memperpanjang peran Anda sendiri. Alasannya dicatat.", en: "You are the only active platform administrator, so you renew your own role. The reason is recorded." },
  "peran.perpanjang.simpan": { default: "Perpanjang peran", en: "Renew role" },
  "peran.cabut.tanpa_admin": { default: "Setelah peran ini dilepaskan, sekolah ini tidak memiliki Admin sekolah. Tunjuk yang berikutnya sesudahnya.", en: "Once this role is released, this school has no school administrator. Appoint the next one afterwards." },
  "peran.saya.judul": { default: "Peran Anda segera berakhir", en: "Your role ends soon" },
  "peran.saya.berakhir": { default: "Peran Anda sebagai {peran} di {tempat} berakhir pada {tanggal}. Minta admin Anda memperpanjangnya sebelum tanggal itu.", en: "Your role as {peran} at {tempat} ends on {tanggal}. Ask your administrator to renew it before then." },
  "peran.saya.berakhir_platform": { default: "Peran Anda sebagai {peran} berakhir pada {tanggal}. Minta Admin platform lain memperpanjangnya sebelum tanggal itu.", en: "Your role as {peran} ends on {tanggal}. Ask another platform administrator to renew it before then." },
  "peran.saya.berakhir_sendiri": { default: "Peran Anda sebagai {peran} berakhir pada {tanggal}, dan Anda satu-satunya Admin platform yang aktif. Perpanjang sendiri di Peran & akses.", en: "Your role as {peran} ends on {tanggal}, and you are the only active platform administrator. Renew it yourself in Roles & access." },
  "peran.saya.buka": { default: "Buka Peran & akses", en: "Open Roles & access" },
  "audit.alasan.retirement": { default: "Pensiun", en: "Retirement" },
  "audit.alasan.resignation": { default: "Mengundurkan diri", en: "Resignation" },
  "audit.alasan.dismissal": { default: "Diberhentikan", en: "Dismissal" },
  "audit.alasan.contract_end": { default: "Masa tugas selesai", en: "End of contract" },
  "audit.aksi.staff.ended_at_school": { default: "Tugas di sekolah diakhiri", en: "Duties at the school ended" },
  "audit.aksi.role.changed": { default: "Peran diubah", en: "Roles changed" },
  "audit.aksi.learning_assignment.ended": { default: "Penugasan materi diakhiri", en: "Assignment ended" },
  "audit.aksi.learning_assignment.withdrawn": { default: "Penugasan materi ditarik", en: "Assignment withdrawn" },
  "audit.aksi.certificate.superseded": { default: "Sertifikat digantikan", en: "Certificate replaced" },
  "audit.aksi.certificate.correction_prepared": { default: "Sertifikat pengganti disiapkan", en: "Replacement certificate prepared" },
  // W2.22 (owner, 9 Nov): «Terbitkan ulang», the replacement of an erroneous issued certificate
  "sertifikat.ganti.judul": { default: "Terbitkan ulang", en: "Reissue" },
  "sertifikat.ganti.arti": { default: "Sertifikat pengganti diterbitkan dengan nama, sekolah dan paket yang tercatat sekarang, dengan hasil yang sama dan nomor baru. Sertifikat ini tetap tersimpan, dan pemeriksaannya akan menyebut bahwa ia sudah digantikan.", en: "A replacement certificate is issued with the name, school and package recorded now, the same result and a new number. This certificate is kept, and its check will say it has been replaced." },
  "sertifikat.ganti.bagian": { default: "Data", en: "Field" },
  "sertifikat.ganti.tercetak": { default: "Tertulis di sertifikat", en: "On the certificate" },
  "sertifikat.ganti.kini": { default: "Tercatat sekarang", en: "Recorded now" },
  "sertifikat.ganti.paket": { default: "Paket", en: "Package" },
  "sertifikat.ganti.berubah": { default: "Perbandingan", en: "Comparison" },
  "sertifikat.ganti.berbeda": { default: "berbeda", en: "different" },
  "sertifikat.ganti.hasil": { default: "Hasil", en: "Result" },
  "sertifikat.ganti.hasil_arti": { default: "Tetap seperti di sertifikat ini; tidak pernah dihitung ulang.", en: "As on this certificate; never recalculated." },
  "sertifikat.ganti.sama_kata": { default: "sama", en: "same" },
  "sertifikat.ganti.alasan": { default: "Alasan penerbitan ulang", en: "Reason for reissuing" },
  "sertifikat.ganti.alasan.arti": { default: "10 sampai 300 karakter. Tercatat bersama sertifikat pengganti dan di jejak audit sekolah. Alasan ini tidak ditampilkan di halaman pemeriksaan.", en: "10 to 300 characters. Recorded with the replacement and in the school's audit trail. The reason is not shown on the check page." },
  "sertifikat.ganti.tombol": { default: "Terbitkan sertifikat pengganti", en: "Issue the replacement" },
  "sertifikat.ganti.sama": { default: "Nama, sekolah dan paket di sertifikat ini sama dengan yang tercatat sekarang. Bila ada yang keliru, perbaiki datanya lebih dahulu (nama orang dikoreksi oleh Admin PINTAR), lalu terbitkan ulang di sini.", en: "The name, school and package on this certificate match what is recorded now. If something is wrong, correct the record first (a person's name is corrected by an Admin PINTAR), then reissue here." },
  "sertifikat.ganti.ok": { default: "Sertifikat pengganti {nomor} diterbitkan. Sertifikat sebelumnya tetap tersimpan sebagai digantikan.", en: "Replacement certificate {nomor} issued. The earlier certificate is kept as replaced." },
  "sertifikat.ganti.digantikan_oleh": { default: "Digantikan oleh sertifikat {nomor}.", en: "Replaced by certificate {nomor}." },
  "sertifikat.ganti.gagal.cert_not_allowed": { default: "Anda tidak dapat menerbitkan ulang sertifikat sekolah ini.", en: "You cannot reissue this school's certificates." },
  "sertifikat.ganti.gagal.cert_not_issued": { default: "Hanya sertifikat yang masih berlaku yang dapat diterbitkan ulang. Sertifikat yang dicabut atau sudah digantikan tetap seperti adanya.", en: "Only a certificate still in force can be reissued. A revoked or replaced certificate stays as it is." },
  "sertifikat.ganti.gagal.cert_reason_required": { default: "Tuliskan alasannya, 10 sampai 300 karakter.", en: "Write the reason, 10 to 300 characters." },
  "sertifikat.ganti.gagal.cert_nothing_changed": { default: "Tidak ada yang berbeda dari yang tercatat sekarang. Perbaiki datanya lebih dahulu.", en: "Nothing differs from what is recorded now. Correct the record first." },
  "sertifikat.ganti.gagal.cert_key_invalid": { default: "Sertifikat pengganti belum dapat dibuat sekarang. Sertifikat ini tetap berlaku; coba lagi nanti.", en: "The replacement cannot be made right now. This certificate stays in force; try again later." },
  "sertifikat.ganti.gagal.cert_replacement_invalid": { default: "Sertifikat pengganti belum dapat diterbitkan. Coba lagi; sertifikat ini tetap berlaku.", en: "The replacement could not be issued. Try again; this certificate stays in force." },
  "sertifikat.ganti.gagal.tidak_ditemukan": { default: "Sertifikat itu tidak ditemukan.", en: "That certificate was not found." },
  "sertifikat.ganti.gagal.layanan_tidak_tersedia": { default: "Penerbitan ulang sedang tidak dapat dilakukan. Sertifikat ini tetap berlaku; coba lagi nanti.", en: "Reissuing is not available right now. This certificate stays in force; try again later." },
  "sertifikat.cabut.alasan": { default: "Alasan pencabutan", en: "Reason for revoking" },
  "sertifikat.cabut.alasan.arti": { default: "Mengapa sertifikat ini dicabut. Dicatat bersama pencabutannya dan tidak dapat diubah.", en: "Why this certificate is revoked. Recorded with the revocation and cannot be changed." },
  "sertifikat.cabut.lanjut": { default: "Lanjutkan", en: "Continue" },
  "sertifikat.cabut.tanya": { default: "Cabut sertifikat ini?", en: "Revoke this certificate?" },
  "sertifikat.cabut.akibat": { default: "Pemeriksaan keaslian akan menyatakan sertifikat ini dicabut oleh penerbit. Pencabutan tidak dapat dibatalkan; bila perlu, sekolah menerbitkan sertifikat baru.", en: "The authenticity check will say the issuer revoked this certificate. A revocation cannot be undone; if needed, the school issues a new certificate." },
  "sertifikat.cabut.aman": { default: "Hasil dan nilai murid tetap tersimpan.", en: "The student's results and scores stay as they are." },
  "sertifikat.cabut.tombol": { default: "Cabut sertifikat {nomor}", en: "Revoke certificate {nomor}" },
  "sertifikat.cabut.batal": { default: "Batal", en: "Cancel" },
  "sertifikat.cabut.ok": { default: "✓ Sertifikat {nomor} sudah dicabut. Pemeriksaan keasliannya kini menyatakannya dicabut.", en: "✓ Certificate {nomor} is revoked. Its authenticity check now says so." },
  "sertifikat.cabut.dicabut_pada": { default: "Dicabut {tanggal}.", en: "Revoked {tanggal}." },
  "sertifikat.cabut.alasan_tercatat": { default: "Alasan:", en: "Reason:" },
  "sertifikat.cabut.digantikan": { default: "Sertifikat ini sudah digantikan sertifikat yang lebih baru, jadi tidak dicabut di sini.", en: "This certificate has been replaced by a newer one, so it is not revoked here." },
  "sertifikat.cabut.gagal.ALASAN_WAJIB": { default: "Tulis alasan pencabutannya.", en: "Write the reason for revoking it." },
  "sertifikat.cabut.gagal.SUDAH_DICABUT": { default: "Sertifikat ini sudah dicabut sebelumnya. Pencabutan yang pertama tetap berlaku.", en: "This certificate was already revoked. The first revocation stands." },
  "sertifikat.cabut.gagal.DITOLAK": { default: "Anda tidak berwenang mencabut sertifikat sekolah ini.", en: "You are not allowed to revoke this school's certificates." },
  "sertifikat.cabut.gagal.TIDAK_DITEMUKAN": { default: "Sertifikat ini tidak ditemukan.", en: "This certificate was not found." },
  "sertifikat.cabut.gagal.LAYANAN_TIDAK_TERSEDIA": { default: "Pencabutan belum dapat dilakukan sekarang. Coba lagi sebentar lagi.", en: "The revocation cannot be done right now. Try again shortly." },
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
  "sertifikat.diberikan": { default: "telah menuntaskan", en: "has met the mastery standard in" },
  "sertifikat.penerbit": { default: "Diterbitkan oleh", en: "Issued by" },
  "sertifikat.berkas": { default: "Sertifikat Penguasaan · {kursus}", en: "Certificate of Mastery · {kursus}" },
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
  // DAISY-17: a staff reader has no teacher to ask; they ask whoever looks after PINTAR at the school (as galat.action_failed does)
  // UX-45: nor has a Guru; every refusal a teacher meets ends with this line (HalamanPenolakan, the Uji Cepat refusal)
  "tolak.arti": { default: "Jika ini keliru, tanyakan kepada guru Anda.", en: "If you think this is a mistake, ask your teacher.",
    staff: "Jika ini keliru, tanyakan kepada yang mengurus PINTAR di sekolah Anda.", en_staff: "If you think this is a mistake, ask whoever looks after PINTAR at your school.",
    educator: "Jika ini keliru, tanyakan kepada yang mengurus PINTAR di sekolah Anda.", en_educator: "If you think this is a mistake, ask whoever looks after PINTAR at your school." },
  // DAISY-18 (D-047): what the screen says the moment a section is asked for
  "memuat.halaman": { default: "Memuat halaman…", en: "Loading the page…" },
  // DAISY-17 (D-046(e)): what a submit button says from the click until the answer comes back
  "tombol.menyimpan": { default: "Menyimpan…", en: "Saving…" },
  "tombol.lambat": { default: "Jaringan sedang lambat. PINTAR masih bekerja; Anda tidak perlu menekan lagi.", en: "The network is slow. PINTAR is still working; you do not need to press again." },
  "tombol.memproses": { default: "Memproses…", en: "Working…" },
  "tombol.memeriksa": { default: "Memeriksa…", en: "Checking…" },
  "tombol.mengirim": { default: "Mengirim…", en: "Sending…" },
  "tombol.menyediakan": { default: "Menyediakan…", en: "Making available…" },
  "tombol.memulai": { default: "Memulai…", en: "Starting…" },
  "tombol.mengaktifkan": { default: "Mengaktifkan…", en: "Activating…" },
  "tolak.kembali": { default: "Kembali ke Belajar", en: "Back to Learning" },
  // UX-46: a certificate that cannot be shown sends the reader back to the certificates list they came from
  "tolak.kembali_sertifikat": { default: "Kembali ke Sertifikat", en: "Back to Certificates" },
  "komitmen.kembali": { default: "Periksa lagi", en: "Check again" },
  "bukti.dari": { default: "Dari", en: "From" },
  "bukti.murid": { default: "murid", en: "students" },
  "bukti.minimum": { default: "minimum", en: "minimum" },

  "app.name": { default: "PINTAR", en: "PINTAR" },
  // W3.1 (Batch 2): the skip link, the first focusable thing on every page (Daisy, 06-accessibility; spec §13)
  "aksesibilitas.lewati": { default: "Langsung ke isi", en: "Skip to content" },
  // W3.3 (Batch 2): FileField (Daisy, components/FileField; closes RV-5)
  "berkas.pilih": { default: "Pilih berkas", en: "Choose a file" },
  "berkas.belum": { default: "Belum dipilih", en: "Nothing chosen yet" },
  "berkas.banyak": { default: "{n} berkas: {nama}", en: "{n} files: {nama}" },
  // W3.14 (Daisy, J7Kunci new words): the idle warning's heading; the sentence and the button are jaga.peringatan, jaga.masih
  "jaga.judul": { default: "PINTAR akan terkunci dalam 1 menit", en: "PINTAR will lock in 1 minute" },
  // W3.5 (JQ2(a); Daisy, components/Identity): the account menu's destructive item, which asks in the Dialog
  "sesi.menu.semua": { default: "Keluar dari semua perangkat…", en: "Sign out of every device…" },
  // W3.2 / CR-46 (Daisy, components/EmptyState «not enough yet»): how much there is and how much is needed, in words
  "ketiadaan.jumlah.murid": { default: "Sekarang {have} murid; perlu {needed}.", en: "{have} students so far; {needed} needed." },
  // E-A3-1 (D-176(d)): the participant form; pending copy approval (DR-GLADYS-QUESTION-PACK B5)
  "ketiadaan.jumlah.gerbang": { default: "Dari hasil Uji Penguasaan yang memuat soal wajib, baru {have} murid; perlu {needed}.", en: "From Mastery Check results that hold required items, {have} students so far; {needed} needed." },
  "ketiadaan.jumlah.peserta": { default: "Sekarang {have} peserta; perlu {needed}.", en: "{have} participants so far; {needed} needed." },
  // W3.3 · the echo under an empty date field (Daisy, components/DateTime)
  "tanggal.belum": { default: "Belum ada tanggal.", en: "No date yet." },
  // W3.4 (Batch 2; CR-88): the Collection (Daisy, components/Table, Search, Pagination; the words J2Kelas lists as new).
  // {benda} is the caller's noun, already in the reader's language; {q} is what was searched. «Berikutnya» and the
  // pager's hidden names «Halaman sebelumnya» / «Halaman berikutnya» are already here (koleksi.berikutnya, lesson.prev/next).
  "koleksi.cari.label": { default: "Cari {benda}", en: "Search {benda}" },
  "koleksi.cari.placeholder": { default: "Cari nama", en: "Search names" },
  "koleksi.cari.hapus": { default: "Hapus pencarian", en: "Clear search" },
  "koleksi.cari.cocok": { default: "{n} {benda} cocok dengan «{q}»", en: "{n} {benda} match «{q}»" },
  "koleksi.saring.label": { default: "Tampilkan", en: "Show" },
  "koleksi.saring.semua": { default: "Semua", en: "All" },
  "koleksi.kosong.judul": { default: "Tidak ada {benda} yang cocok", en: "No {benda} match" },
  "koleksi.kosong.kueri": { default: "Tidak ada nama dengan «{q}» di tampilan ini.", en: "No name with «{q}» in this view." },
  "koleksi.kosong.reset": { default: "Hapus pencarian dan saringan", en: "Clear search and filter" },
  "koleksi.halaman.label": { default: "Halaman daftar {benda}", en: "Pages of the {benda} list" },
  "koleksi.sebelumnya": { default: "Sebelumnya", en: "Previous" },
  "koleksi.menampilkan": { default: "Menampilkan {dari}–{sampai} dari {total} {benda}", en: "Showing {dari}–{sampai} of {total} {benda}" },
  "koleksi.posisi": { default: "Halaman {n} dari {total}", en: "Page {n} of {total}" },
  "koleksi.posisi.ringkas": { default: "{n} / {total}", en: "{n} / {total}" },
  // E-K2 (D-173(d)): the pager where the total is not known (FD-4); Daisy's words, pending Dr Gladys (question pack B6)
  "koleksi.menampilkan_tanpa_total": { default: "Menampilkan {dari}–{sampai} {benda}", en: "Showing {dari}–{sampai} {benda}" },
  "koleksi.posisi.terbuka": { default: "Halaman {n}", en: "Page {n}" },
  // what each paged staff list holds, for its pager's count line (pending Dr Gladys with B6)
  "koleksi.benda.laporan": { default: "laporan", en: "reports" },
  "koleksi.benda.jendela": { default: "jadwal pemeliharaan", en: "maintenance windows" },
  "koleksi.benda.pengumuman": { default: "pengumuman", en: "notices" },
  "koleksi.benda.sekolah": { default: "sekolah", en: "schools" },
  "koleksi.benda.pindah": { default: "perpindahan", en: "transfers" },
  "koleksi.benda.peran": { default: "peran", en: "roles" },
  "koleksi.benda.jejak": { default: "catatan", en: "entries" },
  "koleksi.benda.tinjauan": { default: "pengerjaan ditinjau", en: "reviewed sittings" },
  "koleksi.benda.definisi": { default: "definisi asesmen", en: "assessment definitions" },
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
  "auth.lede": { default: "Masuk dengan email atau username, dan password Anda.", en: "Sign in with your email or username, and your password." },
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
  "auth.card_back": { default: "Masuk dengan password", en: "Sign in with a password" },
  // DAISY-13: a non-match stays auth.card_failed; a wait is never a non-match (M13)
  "auth.card_sering": { default: "Nomor kartu ini sudah terlalu sering dicoba.", en: "This card number has been tried too many times." },
  "auth.card_tanya_guru": { default: "Lupa PIN? Tanyakan kepada guru.", en: "Forgot the PIN? Ask the teacher." },
  "auth.card_ramai": { default: "Sedang banyak yang masuk bersamaan.", en: "Many people are signing in at once." },
  "auth.card_tunggu": { default: "Tunggu", en: "Wait" },
  "auth.card_lalu_coba": { default: ", lalu coba lagi.", en: ", then try again." },
  "auth.card_tunggu_sebentar": { default: "Tunggu sebentar, lalu coba lagi.", en: "Wait a moment, then try again." },
  "auth.card_muat_ulang": { default: "Halaman ini perlu dimuat ulang. Muat ulang, lalu coba lagi.", en: "This page needs reloading. Reload it, then try again." },
  "auth.card_tidak_tersedia": { default: "PINTAR sedang tidak dapat memeriksa kartu. Coba lagi sebentar lagi. Bila masih terjadi, sampaikan kode rujukan berikut kepada guru.", en: "PINTAR cannot check cards right now. Try again in a little while. If it keeps happening, give the teacher the reference that follows." },
  "auth.card_tidak_tersedia_singkat": { default: "PINTAR sedang tidak dapat memeriksa kartu. Coba lagi sebentar lagi.", en: "PINTAR cannot check cards right now. Try again in a little while." },
  "auth.card_rujukan": { default: "Kode rujukan", en: "Reference" },
  "auth.card_putus": { default: "Belum tersambung ke PINTAR. Periksa sambungan internet, lalu coba lagi.", en: "Could not reach PINTAR. Check the internet connection, then try again." },
  "auth.foot": { default: "Pendidikan yang lebih adil, untuk lebih banyak kesempatan.", en: "Fairer education, for more opportunity." },
  // The newline is the designer's line break; the heading renders pre-line.
  "auth.say_h": { default: "Belajar dengan bukti.\nMemahami sebelum memutuskan.", en: "Learning with evidence.\nUnderstand before deciding." },
  // LOAD-BEARING. The only sentence on the screen about what the system does,
  // and what it says is that the system does not decide. Not a tagline to cut.
  "auth.say_p": { default: "PINTAR membantu melihat apa yang sedang terjadi dalam proses belajar. Keputusannya tetap pada manusia.", en: "PINTAR helps make sense of what is happening in the learning process. The decision stays with people." },
  "auth.link_h_exch": { default: "Sedang memeriksa tautan…", en: "Checking the link…" },
  "auth.link_p_exch": { default: "Mohon tunggu sebentar. Jangan tutup halaman ini.", en: "Please wait a moment. Don't close this page." },
  "auth.link_h_exp": { default: "Tautan ini sudah tidak berlaku", en: "This link is no longer valid" },
  "auth.link_p_exp": { default: "Tautan masuk berlaku sekali dan untuk waktu yang terbatas. Minta tautan baru untuk melanjutkan.", en: "A sign-in link works once, and only for a limited time. Ask for a new link to continue." },
  "auth.link_again": { default: "Minta tautan baru", en: "Ask for a new link" },
  // DAISY-02 (D-009): who is signed in, and the way out, on every signed-in
  // screen. "sesi.sebagai" is followed by the name on staff screens only; a
  // learner's screen never names anybody (S15), and says "sesi.bukan_anda".
  "sesi.label": { default: "Akun yang sedang masuk", en: "The account signed in" },
  "sesi.sebagai": { default: "Masuk sebagai", en: "Signed in as" },
  "sesi.bukan_anda": { default: "Bukan akun Anda?", en: "Not your account?" },
  "sesi.keluar": { default: "Keluar", en: "Sign out" },
  "auth.link_same": { default: "Tautan masuk juga hanya berfungsi di perangkat dan browser tempat Anda memintanya, jadi buka tautan di perangkat dan browser yang sama.", en: "A sign-in link also only works on the device and in the browser where you asked for it, so open it on the same device and in the same browser." },
  "auth.in_h": { default: "Anda sudah masuk", en: "You're already signed in" },
  "auth.in_p": { default: "Sesi Anda di perangkat ini masih aktif.", en: "Your session on this device is still active." },
  "auth.in_go": { default: "Lanjutkan", en: "Continue" },
  "auth.in_out": { default: "Keluar dari sesi ini", en: "Sign out of this session" },
  "auth.signed_out": { default: "Sampai jumpa lagi.", en: "See you again soon." },
  "auth.not_yet": { default: "Halaman ini belum tersedia untuk akun Anda.", en: "This page is not available to your account yet." },
  "config.title": { default: "Konfigurasi", en: "Configuration" },
  // B1 (D-166(a)): the index's five groups, Daisy's words (B1 §1, presentation, B1 §5); pending copy approval
  "config.kelompok.sekolah": { default: "Sekolah dan tahun ajaran", en: "School and school year" },
  "config.kelompok.murid": { default: "Murid", en: "Students" },
  "config.kelompok.staf": { default: "Staf dan akses", en: "Staff and access" },
  "config.kelompok.laporan": { default: "Laporan dan templat", en: "Reports and templates" },
  "config.kelompok.dukungan": { default: "Dukungan", en: "Support" },
  "config.menunggu.judul": { default: "Yang menunggu", en: "Waiting" },
  "config.menunggu.pendataan": { default: "pendataan menunggu persetujuan Anda di Pendataan", en: "imports waiting for your go-ahead in Pendataan" },
  "config.menunggu.aktivasi": { default: "orang menunggu akun di Aktivasi", en: "people waiting for an account in Aktivasi" },
  "config.menunggu.tanpa_kelas": { default: "murid belum punya kelas: masukkan ke kelas di Pindah kelas", en: "students without a class: place them in a class under Pindah kelas" },
  "belajar.tanpa_kelas": { default: "Anda belum masuk kelas mana pun, jadi belum ada materi untuk Anda. Admin sekolah Anda dapat memasukkan Anda ke kelas.", en: "You are not in any class yet, so there is no material for you. Your school administrator can place you in a class." },
  "config.menunggu.alasan.kartu": { default: "orang tanpa peran staf: buat kartu kelas di Aktivasi, untuk satu kelas atau beberapa kelas sekaligus. Bila ada guru atau staf di antaranya, berikan perannya di Peran & akses lebih dulu; kartu kelas hanya untuk murid.", en: "people with no staff role: make class cards in Aktivasi, for one class or several at once. If a teacher or staff member is among them, give their role on Peran & akses first; class cards are for students only." },
  "config.menunggu.alasan.email": { default: "orang yang memegang peran staf: aktifkan dengan email di Aktivasi; kartu kelas hanya untuk murid. Orangnya lalu meminta sendiri kode aktivasinya.", en: "people who hold a staff role: activate them with email in Aktivasi; class cards are for students only. The person then asks for their own activation code." },
  "config.menunggu.alasan.pendataan": { default: "Orang di dalamnya belum bisa dibuatkan akun sampai pendataannya disetujui.", en: "No account can be made for the people in it until the import is approved." },
  "config.menunggu.studio": { default: "paket menunggu tindakan atau tinjauan Anda di Studio", en: "packages waiting for your action or review in Studio" },
  "config.section.system": { default: "Sistem & Konfigurasi", en: "System & Configuration" },
  "config.section.intelligence": { default: "Inteligensi & Laporan", en: "Intelligence & Reports" },
  "laporan.templat.judul": { default: "Templat laporan", en: "Report templates" },
  "laporan.templat.institusi": { default: "Sekolah", en: "Institution" },
  "config.label.person_new": { default: "Belum memiliki peran", en: "Holds nothing yet" },
  "config.label.person_known": { default: "Sudah dikenal sistem", en: "Already known to the system" },
  "laporan.templat.penjelasan": { default: "PINTAR memiliki katalog metrik beserta rumus, makna, ambang sampel minimum dan siapa yang boleh membacanya. Sekolah memilih metrik mana yang muncul dan bagaimana digambarkan — bukan apa artinya.", en: "PINTAR owns the metric catalogue: the formulas, the meanings, the minimum samples and who may read each one. A school chooses which metrics appear and how they are drawn — never what they mean." },
  "laporan.templat.kosong": { default: "Sekolah ini belum menyusun templat laporan.", en: "This school has not assembled a report template yet." },
  "laporan.templat.judul_kunci": { default: "Judul laporan", en: "Report title" },
  "laporan.templat.jenis": { default: "Laporan standar", en: "Standard report" },
  "laporan.templat.metrik": { default: "Metrik yang ditampilkan", en: "Metrics shown" },
  "laporan.templat.tampilan": { default: "Tampilan", en: "Visualization" },
  "laporan.templat.versi": { default: "Versi", en: "Version" },
  "laporan.templat.simpan": { default: "Simpan templat", en: "Save template" },
  "laporan.templat.tidak_dipakai": { default: "Tidak dipakai", en: "Not used" },
  "laporan.templat.lingkup.kelas": { default: "kelas", en: "class" },
  "laporan.templat.lingkup.sekolah": { default: "sekolah", en: "school" },
  "laporan.templat.pilih": { default: "Pilih metrik dari katalog PINTAR", en: "Choose metrics from the PINTAR catalogue" },
  "laporan.templat.tak_berwenang": { default: "Menyusun templat laporan memerlukan wewenang Admin sekolah atau Admin platform.", en: "Assembling a report template requires institution administrator authority." },
  "laporan.templat.batas": { default: "Satu templat menampilkan paling banyak 12 metrik.", en: "One template shows at most 12 metrics." },
  "config.card.health": { default: "Kesehatan sistem", en: "System health" },
  "config.card.health.periksa": { default: "Jalankan pemeriksaan", en: "Run the checks" },
  // BOB-19: the health card's states, and each check by its plain name
  "config.kesehatan.bukan_admin": { default: "Pemeriksaan ini dijalankan oleh Admin platform.", en: "A Platform administrator runs these checks." },
  "config.kesehatan.sehat": { default: "Semua pemeriksaan lolos", en: "All checks pass" },
  "config.kesehatan.jumlah": { default: "pemeriksaan skema, semuanya sesuai nilai yang diharapkan.", en: "schema checks, each reading its expected value." },
  "config.kesehatan.perhatian": { default: "Perlu perhatian", en: "Needs attention" },
  "config.kesehatan.menyimpang": { default: "Tidak sesuai harapan:", en: "Not as expected:" },
  "config.kesehatan.gagal": { default: "Pemeriksaan belum dapat dijalankan. Coba sekali lagi; bila masih terjadi, sampaikan kode rujukan berikut.", en: "The checks could not run. Try once more; if it happens again, pass on the reference that follows." },
  "config.kesehatan.ulang": { default: "Periksa lagi", en: "Check again" },
  "config.kesehatan.cek.tables_without_rls": { default: "Setiap tabel dilindungi aturan per baris", en: "Every table is guarded row by row" },
  "config.kesehatan.cek.policies_using_true": { default: "Tidak ada aturan akses yang membuka semua baris", en: "No access rule opens every row" },
  "config.kesehatan.cek.secdef_without_search_path": { default: "Setiap fungsi berhak pemilik menetapkan jalur pencariannya", en: "Every owner-rights function pins its search path" },
  "config.kesehatan.cek.functions_without_search_path": { default: "Setiap fungsi menetapkan jalur pencariannya", en: "Every function pins its search path" },
  "config.kesehatan.cek.unclassified_client_rpcs": { default: "Setiap fungsi yang dapat dipanggil aplikasi sudah digolongkan", en: "Every app-callable function is classified" },
  "config.kesehatan.cek.evidence_consumer_boundary_ok": { default: "Bukti mentah hanya dibaca oleh pembaca yang diizinkan", en: "Raw evidence is read only by its permitted readers" },
  "config.kesehatan.cek.learner_rpcs_guarded_ok": { default: "Setiap fungsi peserta didik memeriksa kepemilikan", en: "Every learner function checks ownership" },
  "config.kesehatan.cek.overloaded_client_rpcs": { default: "Setiap fungsi aplikasi hanya punya satu bentuk panggilan", en: "Every app-callable function has one signature" },
  "config.kesehatan.cek.functions_executable_by_anon": { default: "Tidak ada fungsi yang dapat dijalankan tanpa masuk", en: "No function runs without signing in" },
  "config.kesehatan.cek.undeclared_anon_functions": { default: "Tidak ada fungsi terbuka tanpa masuk yang tidak dinyatakan", en: "No undeclared function is open without signing in" },
  // BOB-12: the class card's sign-in is the second declared public surface. DAISY-13 confirms this sentence and
  // replaces the paths one: each surface is two declared addresses, a page and the endpoint behind it
  "config.kesehatan.cek.anon_public_surface": { default: "Tepat sebelas permukaan publik: pemeriksaan sertifikat, masuk dengan kartu kelas, masuk dengan password, permintaan kode aktivasi, pemeriksaan kode aktivasi, permintaan kode pemulihan, pemeriksaan kode pemulihan, password baru dari pemulihan, pemulihan dengan PIN, halaman PINTAR ID, dan permintaan membuka kembali akun", en: "Exactly eleven public surfaces: certificate verification, class-card sign-in, password sign-in, the activation code request, the activation code check, the recovery code request, the recovery code check, the new password from recovery, recovery with a PIN, the PINTAR ID page, and the request to reopen an account" },
  "config.kesehatan.cek.client_readable_definer_views": { default: "Tidak ada tampilan berhak pemilik yang terbaca aplikasi", en: "No owner-rights view is readable by the app" },
  "config.kesehatan.cek.anon_reachable_http_paths": { default: "Tepat dua puluh satu alamat publik yang dinyatakan: dua untuk pemeriksaan sertifikat, dua untuk masuk dengan kartu kelas, dua untuk masuk dengan password, dua untuk permintaan kode aktivasi, dua untuk pemeriksaan kode aktivasi, dua untuk permintaan kode pemulihan, dua untuk pemeriksaan kode pemulihan, dua untuk password baru dari pemulihan, dua untuk pemulihan dengan PIN, satu untuk halaman PINTAR ID, dua untuk permintaan membuka kembali akun", en: "Exactly twenty-one declared public addresses: two for certificate verification, two for class-card sign-in, two for password sign-in, two for the activation code request, two for the activation code check, two for the recovery code request, two for the recovery code check, two for the new password from recovery, two for recovery with a PIN, one for the PINTAR ID page, two for the request to reopen an account" },
  "config.kesehatan.cek.public_surface_ok": { default: "Permukaan publik sesuai yang dinyatakan", en: "The public surface matches its declaration" },
  "config.kesehatan.cek.anon_table_grants": { default: "Tidak ada hak tabel bagi pengguna yang belum masuk", en: "No table grant to signed-out users" },
  "config.kesehatan.cek.public_buckets": { default: "Tidak ada penyimpanan berkas yang publik", en: "No public storage bucket" },
  "config.kesehatan.cek.client_storage_policies": { default: "Aplikasi tidak punya jalan langsung ke berkas tersimpan", en: "The app has no direct path to stored files" },
  "config.kesehatan.cek.persons_institution_columns": { default: "Data orang tidak menyimpan sekolah di kolomnya sendiri", en: "Person records hold no school column of their own" },
  "config.kesehatan.cek.audit_log_client_write_grants": { default: "Aplikasi tidak dapat menulis ke jejak audit", en: "The app cannot write to the audit trail" },
  "config.kesehatan.cek.malformed_jalur": { default: "Setiap jalur kurikulum berbentuk benar", en: "Every curriculum path is well formed" },
  "config.card.cohorts": { default: "Kelas aktif", en: "Active classes" },
  "config.environment": { default: "Lingkungan", en: "Environment" },
  "config.refused": { default: "Halaman ini hanya untuk Admin sekolah atau Admin platform.", en: "This page is for school administrators and platform administrators only." },
  "config.section.rollover": { default: "Kenaikan kelas dan kelulusan", en: "Promotion and graduation" },
  "config.section.transfers": { default: "Perpindahan murid", en: "Student transfers" },
  "config.section.pindah": { default: "Pindah kelas", en: "Move a student to another class" },
  "config.section.ketuntasan": { default: "Batas ketuntasan", en: "Pass marks" },
  "config.ketuntasan.arti": { default: "Nilai minimum kelulusan setiap pelajaran di sekolah ini, dalam persen bulat dari 0 sampai 100. Guru baru bisa menyediakan sebuah pelajaran untuk kelas setelah batasnya ditetapkan. Perubahan berlaku untuk pelajaran yang disediakan sesudahnya; hasil dan sertifikat yang sudah ada tidak berubah.", en: "The minimum passing mark for each lesson at this school, as a whole percentage from 0 to 100. A teacher can give a lesson to a class only once its mark is set. A change applies to what is given afterwards; results and certificates that already exist do not change." },
  "config.ketuntasan.belum": { default: "Batas ketuntasan belum ditetapkan", en: "No pass mark set yet" },
  "config.ketuntasan.sekarang": { default: "Batas ketuntasan:", en: "Pass mark:" },
  "config.ketuntasan.nilai": { default: "Nilai minimum (%)", en: "Minimum mark (%)" },
  "config.ketuntasan.alasan": { default: "Alasan", en: "Reason" },
  "config.ketuntasan.alasan_contoh": { default: "Misalnya: keputusan rapat guru", en: "For example: decided at the staff meeting" },
  "config.ketuntasan.tombol": { default: "Tetapkan", en: "Set" },
  "config.ketuntasan.riwayat": { default: "Riwayat", en: "History" },
  "config.ketuntasan.oleh": { default: "oleh", en: "by" },
  "config.ketuntasan.kosong": { default: "Sekolah ini belum punya pelajaran.", en: "This school has no lessons yet." },
  "config.ketuntasan.materi_pintar": { default: "Materi PINTAR", en: "PINTAR material" },
  "config.persiapan.judul": { default: "Persiapan sekolah", en: "School setup" },
  "config.persiapan.arti": { default: "Apa yang sudah siap di sekolah ini, dan apa yang masih perlu dikerjakan sebelum guru dan murid mulai.", en: "What is ready at this school, and what still needs doing before teachers and students begin." },
  "config.persiapan.sudah": { default: "Sudah", en: "Done" },
  "config.persiapan.belum": { default: "Belum", en: "Not yet" },
  "config.persiapan.kelas": { default: "Kelas aktif", en: "Active classes" },
  "config.persiapan.kelas.cara": { default: "Buat Bagian, Tingkat, lalu Kelas di Struktur sekolah.", en: "Create a Bagian, a Tingkat, then a Kelas under School structure." },
  "config.persiapan.murid": { default: "Murid yang sudah ditempatkan di Kelas", en: "Students placed in a class" },
  "config.persiapan.murid.tanpa_kelas": { default: "{n} murid belum punya kelas: tempatkan di Pindah", en: "{n} students have no class yet: place them in Move" },
  "config.persiapan.murid.cara": { default: "Catat murid lewat Pendataan: satu daftar untuk satu kelas, kelasnya dipilih sekali dengan «Satu pilihan untuk semua».", en: "Record students through Pendataan: one list per class, its class chosen once with «One choice for everyone»." },
  "config.persiapan.guru": { default: "Setiap Kelas punya guru", en: "Every class has a teacher" },
  "config.persiapan.guru.kurang": { default: "Kelas yang belum punya guru:", en: "Classes without a teacher yet:" },
  "config.persiapan.guru.cara": { default: "Beri peran Guru untuk Kelas itu di Peran & akses.", en: "Give the Guru role for that class under Roles & access." },
  // D-101(e): a quiet recommendation, never an error
  "config.persiapan.admin_kedua": { default: "Sekolah ini punya satu admin sekolah. Admin sekolah kedua dapat membantu memulihkan akun bila yang satu berhalangan; tambahkan di Peran & akses.", en: "This school has one school administrator. A second can help recover accounts when the first is away; add one in Roles & access." },
  // D-101 (2): appointing another school administrator is confirmed by a second press
  "config.angkat.judul": { default: "Jadikan admin sekolah?", en: "Make a school administrator?" },
  // BOB19-K01 (the owner's ruling of 8 Oct, Option B): the approved Indonesian, word for word; the English as approved
  // in the Second Eye's final review of 8 Oct, word for word
  "config.pertama.judul": { default: "Menunjuk admin sekolah pertama", en: "Appoint the school's first administrator" },
  "config.pertama.arti": { default: "Sekolah ini belum memiliki admin sekolah. Pilih orang yang belum tercatat di sekolah mana pun untuk menjadi admin sekolah pertama di sekolah ini.", en: "This school does not yet have a school administrator. Choose someone who is not registered with any school to become this school's first administrator." },
  "config.pertama.yakin": { default: "Jadikan orang ini admin sekolah pertama di sekolah ini?", en: "Appoint this person as the school's first administrator?" },
  "config.angkat.arti": { default: "Admin sekolah mengatur seluruh sekolah ini: struktur, data, peran, dan pemulihan akun. Penunjukan ini tercatat.", en: "A school administrator manages this whole school: its structure, data, roles and account recovery. The appointment is recorded." },
  "config.angkat.ya": { default: "Ya, jadikan admin sekolah", en: "Yes, make them a school administrator" },
  "config.angkat.batal": { default: "Batal", en: "Cancel" },
  "config.pindah.arti": { default: "Pindahkan seorang murid ke Kelas lain di sekolah ini, pada tahun ajaran yang sama, atau tempatkan murid yang dicatat di sebuah Tingkat ke salah satu Kelasnya. Ia tetap murid yang sama. Apa yang sudah ia kerjakan tetap tercatat di kelas tempat ia mengerjakannya, dan kelas lamanya tidak lagi menghitungnya sebagai muridnya sekarang.", en: "Move a student to another Kelas in this school, in the same academic year, or place a student recorded in a Tingkat into one of its classes. They stay the same student. What they have already done stays recorded with the class where they did it, and their old class no longer counts them as a current student." },
  "config.pindah.dari": { default: "Kelas murid sekarang", en: "The student's class now" },
  "config.pindah.lihat": { default: "Tampilkan murid", en: "Show students" },
  "config.pindah.ke": { default: "Pindahkan ke kelas", en: "Move to class" },
  "config.pindah.tombol": { default: "Pindahkan", en: "Move" },
  "config.pindah.kosong": { default: "Belum ada murid di kelas ini.", en: "There are no students in this class yet." },
  "config.pindah.tanpa_kelas": { default: "Sekolah ini belum punya Kelas aktif. Buat Kelasnya di Struktur sekolah.", en: "This school has no active Kelas yet. Create one under School structure." },
  "config.pindah.grup_kelas": { default: "Kelas", en: "Classes" },
  "config.pindah.grup_tingkat": { default: "Masih di Tingkat, belum di Kelas", en: "Still in a Tingkat, not yet in a class" },
  "config.pindah.tanpa_tujuan": { default: "Tidak ada Kelas lain pada tahun ajaran ini. Buat Kelas tujuannya dulu di Struktur sekolah.", en: "There is no other Kelas in this academic year. Create the destination Kelas under School structure first." },
  "config.section.roles": { default: "Peran & akses", en: "Roles & access" },
  "config.section.audit": { default: "Jejak audit", en: "Audit trail" },
  "config.action.rollover": { default: "Jalankan pergantian", en: "Run the rollover" },
  "config.action.request_transfer": { default: "Ajukan perpindahan", en: "Request a transfer" },
  "config.action.authorize": { default: "Setujui", en: "Authorize" },
  "config.action.execute": { default: "Laksanakan", en: "Execute" },
  "config.action.reject": { default: "Tolak", en: "Decline" },
  "config.action.grant": { default: "Berikan peran", en: "Grant the role" },
  // Daisy (TINJAUAN-6faef690 §3): one verb per act; a role is released («Lepaskan»), «Cabut» stays for certificates
  "config.action.revoke": { default: "Lepaskan", en: "Release" },
  "config.action.save": { default: "Simpan", en: "Save" },
  "config.result.ok": { default: "Selesai.", en: "Done." },
  "config.result.failed": { default: "Belum berhasil.", en: "Not saved." },
  "config.empty": { default: "Belum ada.", en: "None yet." },
  "config.label.period_from": { default: "Dari tahun ajaran", en: "From academic year" },
  "config.label.period_to": { default: "Ke tahun ajaran", en: "To academic year" },
  "config.label.mapping_help": { default: "Pilih kelas tujuan untuk setiap kelas asal. Keanggotaan lama ditutup, yang baru dibuat; riwayat tetap utuh.", en: "Choose a destination class for each source class. Old memberships are closed and new ones created; the history stays whole." },
  "config.label.enrollment": { default: "Murid (pendaftaran aktif)", en: "Students (active enrolments)" },
  "config.label.destination_institution": { default: "Kode sekolah tujuan", en: "Destination school code" },
  "config.label.destination_period": { default: "Kode tahun ajaran tujuan", en: "Destination academic-year code" },
  "config.label.destination_programme": { default: "Kode program tujuan", en: "Destination programme code" },
  "config.label.destination_help": { default: "Kode tujuan diberikan oleh sekolah penerima. Persetujuan datang dari pihak lawan.", en: "The destination codes come from the receiving school. Authorization comes from the other side." },
  "config.label.reason": { default: "Alasan", en: "Reason" },
  "config.label.person": { default: "Orang", en: "Person" },
  "config.label.role": { default: "Peran", en: "Role" },
  "config.label.scope": { default: "Lingkup", en: "Scope" },
  "config.roles.arti": { default: "Siapa memegang peran apa, dan di mana. Untuk guru atau staf baru: berikan perannya di sini lebih dulu, lalu aktifkan akunnya dengan email di Aktivasi.", en: "Who holds which role, and where. For a new teacher or staff member: give their role here first, then activate their account by email on Aktivasi." },
  "config.roles.lingkup_arti": { default: "Tempat peran ini berlaku: kelas untuk Guru, bagian untuk Kepala departemen, sekolah untuk Dekan dan Admin sekolah.", en: "Where the role applies: a class for a Teacher, a department for a Head of department, the school for a Dean or a School administrator." },
  "config.roles.sampai_arti": { default: "Biasanya akhir tahun ajaran. Setelah tanggal ini peran berhenti dengan sendirinya.", en: "Usually the end of the school year. After this date the role ends by itself." },
  "config.label.valid_until": { default: "Berlaku sampai", en: "Valid until" },
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
  // BOB-08 (D-014), worded by Daisy: the library by its on-screen name, and each refusal says what to do next
  "config.struktur.galat.bukan_sekolah": { default: "Pustaka PINTAR bukan sekolah, jadi tidak memiliki Bagian, Tingkat, atau Kelas. Pilih sebuah sekolah.", en: "PINTAR Library is not a school, so it has no Bagian, Tingkat or Kelas. Choose a school." },
  "config.struktur.galat.tahun_di_luar": { default: "Gunakan tahun ajaran yang sedang berjalan, yang sebelumnya, atau yang berikutnya.", en: "Use the current academic year, the one before or the one after." },
  "config.struktur.galat.tempat_nonaktif": { default: "Tempat ini sudah dinonaktifkan, jadi tidak ada yang dapat ditempatkan atau diberi peran di sini. Pilih tempat yang masih aktif.", en: "This place has been deactivated, so nobody can be placed or given a role here. Choose a place that is still active." },
  "galat.action_place_inactive": { default: "Tempat yang dipilih sudah dinonaktifkan. Muat ulang halaman, lalu pilih tempat yang masih aktif.", en: "The place you chose has been deactivated. Reload the page, then choose one that is still active." },
  "config.struktur.galat.simpul_tidak_sah": { default: "Hanya Bagian, Tingkat, dan Kelas yang bisa diubah di sini.", en: "Only a Bagian, Tingkat or Kelas can be changed here." },
  "config.struktur.galat.masih_ada_anak": { default: "Nonaktifkan dulu Tingkat atau Kelas di bawahnya.", en: "Deactivate the Tingkat or Kelas under it first." },
  "config.struktur.galat.masih_ada_murid": { default: "Masih ada murid di sini. Pindahkan mereka dulu.", en: "Students are still placed here. Move them first." },
  "config.struktur.galat.masih_ada_staf": { default: "Masih ada guru atau staf yang ditugaskan di sini.", en: "A teacher or staff member is still assigned here." },
  "config.struktur.galat.isian_kurang": { default: "Lengkapi pilihan yang diminta.", en: "Complete the choices asked for." },
  "config.struktur.galat.alasan_kosong": { default: "Tuliskan alasan tempat ini dinonaktifkan.", en: "Write why this place is being deactivated." },
  "config.struktur.galat.gagal": { default: "Perubahan belum tersimpan. Coba lagi sebentar lagi.", en: "The change was not saved. Try again in a moment." },
  // DAISY-05: the Struktur sekolah screen (D-006, D-022). The names Bagian,
  // Tingkat and Kelas are the school's own words and stay Indonesian in English.
  "config.section.struktur": { default: "Struktur sekolah", en: "School structure" },
  "config.struktur.intro": { default: "Susun sekolah dari atas ke bawah: Bagian, lalu Tingkat, lalu Kelas. Murid ditempatkan di Kelas, dan guru ditugaskan ke Kelas.", en: "Build the school from the top down: Bagian, then Tingkat, then Kelas. Students are placed in a Kelas, and teachers are assigned to one." },
  "config.struktur.langkah.bagian": { default: "Tambah Bagian, misalnya Kelas Rendah.", en: "Add a Bagian, for example Kelas Rendah." },
  "config.struktur.langkah.tingkat": { default: "Di dalam Bagian, tambah Tingkat dengan tahun ajarannya, misalnya Kelas 1 untuk 2026/2027.", en: "Inside the Bagian, add a Tingkat with its school year, for example Kelas 1 for 2026/2027." },
  "config.struktur.langkah.kelas": { default: "Di dalam Tingkat, tambah Kelas satu per satu, misalnya 1A lalu 1B.", en: "Inside the Tingkat, add each Kelas in turn, for example 1A, then 1B." },
  "config.struktur.sekolah": { default: "Sekolah", en: "School" },
  "config.struktur.tanpa_sekolah": { default: "Belum ada sekolah yang Anda kelola.", en: "There is no school you administer yet." },
  "config.struktur.kosong": { default: "Sekolah ini belum punya Bagian.", en: "This school has no Bagian yet." },
  "config.struktur.tingkat_kosong": { default: "Belum ada Tingkat di Bagian ini.", en: "There is no Tingkat in this Bagian yet." },
  "config.struktur.kelas_kosong": { default: "Belum ada Kelas di Tingkat ini.", en: "There is no Kelas in this Tingkat yet." },
  "config.struktur.jenis.BAGIAN": { default: "Bagian", en: "Bagian" },
  "config.struktur.jenis.TINGKAT": { default: "Tingkat", en: "Tingkat" },
  "config.struktur.jenis.KELAS": { default: "Kelas", en: "Kelas" },
  "config.struktur.tambah.BAGIAN": { default: "Tambah Bagian", en: "Add Bagian" },
  "config.struktur.tambah.TINGKAT": { default: "Tambah Tingkat", en: "Add Tingkat" },
  "config.struktur.tambah.KELAS": { default: "Tambah Kelas", en: "Add Kelas" },
  "config.struktur.nama": { default: "Nama", en: "Name" },
  "config.struktur.contoh.BAGIAN": { default: "Misalnya Kelas Rendah", en: "For example Kelas Rendah" },
  "config.struktur.contoh.TINGKAT": { default: "Misalnya Kelas 1", en: "For example Kelas 1" },
  "config.struktur.contoh.KELAS": { default: "Misalnya 1A", en: "For example 1A" },
  "config.struktur.tahun": { default: "Tahun ajaran", en: "School year" },
  "config.struktur.tahun_ikut": { default: "Tahun ajaran mengikuti Tingkat:", en: "School year, from the Tingkat:" },
  "config.struktur.untuk": { default: "Untuk", en: "For" },
  "config.struktur.untuk.murid": { default: "Murid (pembelajaran sekolah)", en: "Students (the school's teaching)" },
  "config.struktur.untuk.guru": { default: "Guru dan staf (pengembangan profesi)", en: "Teachers and staff (professional learning)" },
  "config.struktur.untuk.arti": { default: "Pilihan ini berlaku untuk Bagian ini dan semua Tingkat serta Kelas di bawahnya, dan tidak dapat diubah kemudian.", en: "This choice applies to this Bagian and every Tingkat and Kelas under it, and cannot be changed later." },
  "config.struktur.untuk_guru": { default: "Pengembangan profesi guru", en: "Educators' professional learning" },
  "config.struktur.peserta.satu": { default: "peserta", en: "participant" },
  "config.struktur.peserta.banyak": { default: "peserta", en: "participants" },
  "config.section.peserta": { default: "Peserta pengembangan profesi", en: "Professional-learning participants" },
  "config.peserta.arti": { default: "Daftarkan guru atau staf sekolah ini sebagai peserta di Kelas pengembangan profesi. Tidak ada orang, akun atau nomor baru yang dibuat.", en: "Enrol a teacher or staff member of this school as a participant in a professional-learning Kelas. No new person, account or number is created." },
  "config.peserta.orang": { default: "Guru atau staf", en: "Teacher or staff member" },
  "config.peserta.tempat": { default: "Kelas pengembangan profesi", en: "Professional-learning Kelas" },
  "config.peserta.daftarkan": { default: "Daftarkan sebagai peserta", en: "Enrol as participant" },
  "config.peserta.tanpa_calon": { default: "Belum ada guru atau staf yang bisa didaftarkan. Peserta adalah guru atau staf sekolah ini: catat dulu di Pendataan dan berikan perannya di Peran & akses.", en: "There is no teacher or staff member to enrol yet. A participant is a teacher or staff member of this school: record them on Pendataan and give their role on Peran & akses first." },
  "config.peserta.tanpa_tempat": { default: "Belum ada Kelas pengembangan profesi. Buat Bagian untuk guru dan staf di Struktur sekolah, lalu Tingkat dan Kelasnya.", en: "There is no professional-learning Kelas yet. Create a Bagian for teachers and staff under School structure, then its Tingkat and Kelas." },
  "config.peserta.catatan": { default: "Catatan pengembangan profesi", en: "Professional-learning records" },
  "galat.pd_not_allowed": { default: "Anda tidak berwenang mendaftarkan peserta di sekolah ini.", en: "You are not authorised to enrol participants at this school." },
  "galat.pd_place_invalid": { default: "Pilih Kelas atau Tingkat pengembangan profesi yang masih aktif.", en: "Choose a professional-learning Kelas or Tingkat that is still active." },
  "galat.pd_place_not_for_educators": { default: "Tempat itu bukan untuk pengembangan profesi guru. Murid ditempatkan melalui Pendataan.", en: "That place is not for educators' professional learning. Students are placed through Data intake." },
  "galat.pd_person_not_staff": { default: "Hanya orang yang saat ini memegang peran staf di sekolah ini yang dapat menjadi peserta.", en: "Only a person who currently holds a staff role at this school can be a participant." },
  "galat.pd_already_enrolled": { default: "Orang itu sudah menjadi peserta di sana.", en: "That person is already a participant there." },
  "galat.pd_other_purpose": { default: "Pendaftaran orang itu untuk tahun ini adalah pendaftaran murid, jadi tidak dapat dipakai untuk pengembangan profesi.", en: "That person's enrolment for this year is a student enrolment, so it cannot be used for professional learning." },
  "galat.pd_input_incomplete": { default: "Pilih orangnya dan Kelasnya terlebih dahulu.", en: "Choose the person and the Kelas first." },
  "galat.pd_enrolled": { default: "Terdaftar sebagai peserta.", en: "Enrolled as a participant." },
  "mengajar.sedia.kode.assign_context_mismatch": { default: "Materi ini bukan untuk kelas ini: materi pengembangan profesi hanya untuk Kelas pengembangan profesi, dan materi murid hanya untuk kelas murid.", en: "This material is not for this class: professional-learning material is only for a professional-learning Kelas, and students' material only for a students' class." },
  "mengajar.cepat.tolak.konteks": { default: "Bab itu bukan untuk kelas ini: materi pengembangan profesi hanya untuk Kelas pengembangan profesi, dan materi murid hanya untuk kelas murid.", en: "That chapter is not for this class: professional-learning material is only for a professional-learning Kelas, and students' material only for a students' class." },
  "mengajar.fakta.peserta": { default: "Peserta terdaftar", en: "Enrolled participants" },
  "mengajar.peserta.judul": { default: "Peserta", en: "Participants" },
  "mengajar.peserta.kosong": { default: "Belum ada peserta terdaftar di kelas ini.", en: "No participant is enrolled in this class yet." },
  "mengajar.bukti.peserta": { default: "peserta", en: "participants" },
  "mengajar.siap.terdaftar_peserta": { default: "peserta terdaftar hari ini", en: "participants enrolled today" },
  "mengajar.siapa.kosong_peserta": { default: "Tidak ada peserta dalam daftar ini.", en: "No participant in this list." },
  // Batch 3 · W3.11 (J5, J1 part two), W3.17 (result words), W2.4 (the Uji Cepat score; D-120 Q8)
  "bentuk.opsional": { default: "(opsional)", en: "(optional)" },
  "mengajar.sedia.selesai": { default: "Disediakan", en: "Made available" },
  "mengajar.ulang.selesai": { default: "Terkirim", en: "Sent" },
  "mengajar.cepat.hasil.judul": { default: "Hasil Uji Cepat", en: "Quick Assessment result" },
  "mengajar.cepat.hasil.lihat": { default: "Lihat hasil", en: "See the result" },
  "mengajar.cepat.hasil.kelas": { default: "Rata-rata nilai kelas", en: "Class average score" },
  // A3 (D-176): the class figure below its threshold; pending copy approval
  "mengajar.cepat.hasil.belum_cukup": { default: "Belum cukup nilai untuk menampilkan rata-rata kelas.", en: "Not enough scores yet to show the class average." },
  "mengajar.cepat.hasil.muncul": { default: "Rata-rata nilai kelas muncul setelah cukup {benda} dinilai.", en: "The class average appears once enough {benda} have been scored." },
  "mengajar.cepat.hasil.dasar": { default: "{n} dari {total} {benda} sudah dinilai", en: "{n} of {total} {benda} scored" },
  "mengajar.cepat.hasil.arti": { default: "Rata-rata nilai yang sudah ada. Yang belum mengumpulkan, atau belum dinilai, tidak dihitung.", en: "The average of the scores there are. Anyone who has not handed in, or has no score yet, is not counted." },
  "mengajar.cepat.hasil.belum": { default: "Belum ada nilai. Rata-rata nilai kelas muncul di sini setelah ada yang mengumpulkan.", en: "No scores yet. The class average appears here once someone has handed in." },
  "mengajar.cepat.hasil.rincian": { default: "Rincian nilai", en: "Score by person" },
  "mengajar.cepat.hasil.rincian.arti": { default: "Diurutkan abjad. Bukan peringkat.", en: "In alphabetical order. Not a ranking." },
  "mengajar.cepat.hasil.kolom.nama": { default: "Nama", en: "Name" },
  "mengajar.cepat.hasil.kolom.keadaan": { default: "Keadaan", en: "Status" },
  "mengajar.cepat.hasil.kolom.nilai": { default: "Nilai", en: "Score" },
  "mengajar.cepat.hasil.nilai_belum": { default: "Belum ada nilai", en: "No score yet" },
  "mengajar.cepat.hasil.kembali": { default: "Kembali ke Uji Cepat", en: "Back to the Quick Assessment" },
  "mengajar.kelas.catatan_pengembangan": { default: "Catatan pengembangan profesi kelas ini", en: "This class's professional-learning record" },
  "pengembangan.eyebrow": { default: "Pengembangan profesi guru", en: "Educators' professional learning" },
  "pengembangan.judul": { default: "Catatan pengembangan profesi", en: "Professional-learning record" },
  "pengembangan.arti": { default: "Catatan baca-saja per peserta dan paket. Bukan penilaian kinerja dan bukan peringkat.", en: "A read-only record per participant and package. It is not a performance appraisal and not a ranking." },
  "pengembangan.tentang": { default: "Tentang hasil ini", en: "About this result" },
  "pengembangan.siapa_melihat": { default: "Hasil ini terlihat oleh Anda, fasilitator paket ini, Kepala departemen yang membawahi pengembangan profesi, dan Dekan. Admin sekolah hanya melihat pendaftaran, keikutsertaan, dan penyelesaian; guru lain tidak melihatnya. Jawaban Anda per soal tidak ditampilkan kepada mereka.", en: "This result is seen by you, the facilitator of this package, the Head of department over professional learning, and the Dean. The school administrator sees only enrolment, participation and completion; other teachers do not see it. Your answers to each question are not shown to them." },
  "hasilbelajar.judul": { default: "Hasil belajar", en: "Learning results" },
  "hasilbelajar.cakupan": { default: "Semua bab yang sudah Anda kerjakan, sampai {waktu}. Hanya hasil Anda sendiri.", en: "Every chapter you have worked on, up to {waktu}. Your own results only." },
  "hasilbelajar.a": { default: "Hasil per bab", en: "Results by chapter" },
  "hasilbelajar.b": { default: "Bagian per bab", en: "Parts of each chapter" },
  "hasilbelajar.b_arti": { default: "Setiap kotak satu soal yang dijawab tepat pada Uji Penguasaan.", en: "Each square is one question answered right in the Mastery Check." },
  "hasilbelajar.belum_ada": { default: "Belum ada bab yang selesai. Bab yang sedang dikerjakan ada di bawah.", en: "No chapter is finished yet. The chapters under way are below." },
  "hasilbelajar.semua_capai": { default: "Semua bab yang selesai sudah mencapai target.", en: "Every finished chapter has reached its target." },
  "hasilbelajar.capai": { default: "{n} dari {m} bab yang selesai sudah mencapai target.", en: "{n} of {m} finished chapters have reached their target." },
  "hasilbelajar.selesai": { default: "{n} bab sudah selesai.", en: "{n} chapters are finished." },
  "hasilbelajar.ulang": { default: "Pelajari lagi: {daftar}.", en: "Study again: {daftar}." },
  "hasilbelajar.ulang_banyak": { default: "Ada {n} bagian untuk dipelajari lagi; semuanya ditandai «pelajari lagi» di bagian B.", en: "There are {n} parts to study again; each is marked «study again» in section B." },
  "hasilbelajar.awal": { default: "Pemetaan Awal", en: "Initial Mapping" },
  "hasilbelajar.akhir": { default: "Uji Penguasaan", en: "Mastery Check" },
  "hasilbelajar.target": { default: "Target bab ini", en: "This chapter's target" },
  "hasilbelajar.berjalan": { default: "Sedang dikerjakan", en: "Under way" },
  "hasilbelajar.nilai": { default: "{b} dari {t} soal", en: "{b} of {t} questions" },
  "hasilbelajar.tercapai": { default: "target tercapai", en: "target reached" },
  "hasilbelajar.belum_capai": { default: "belum mencapai target", en: "target not reached yet" },
  "hasilbelajar.pelajari_lagi": { default: "pelajari lagi", en: "study again" },
  "hasilbelajar.lanjutkan": { default: "Lanjutkan {judul}", en: "Continue {judul}" },
  "hasilbelajar.berikutnya_ulang": { default: "Pelajari lagi bagian yang ditandai «pelajari lagi» ({daftar}), lalu tanyakan kepada guru langkah berikutnya.", en: "Study again the parts marked «study again» ({daftar}), then ask your teacher for the next step." },
  "hasilbelajar.buka_bab": { default: "Hasil lengkap {judul}", en: "Full result of {judul}" },
  "hasilbelajar.sertifikat": { default: "Sertifikat bab yang targetnya tercapai ada di Sertifikat.", en: "The certificates of chapters whose target you reached are in Certificates." },
  "hasilbelajar.kosong": { default: "Belum ada bab yang Anda kerjakan. Mulai dari Belajar.", en: "You have not worked on a chapter yet. Start from Learning." },
  "hasilbelajar.buka": { default: "Lihat hasil belajar", en: "See your learning results" },
  "hasilbelajar.buka_arti": { default: "Semua bab yang sudah Anda kerjakan dalam satu halaman, dengan bagian yang perlu dipelajari lagi.", en: "Every chapter you have worked on, on one page, with the parts to study again." },
  "pengembangan.langkah": { default: "Langkah setiap peserta", en: "Each participant's steps" },
  // X5-2 (Daisy, c4011570): the people first, joined as a sentence («A dan B belum mulai.»)
  "pengembangan.belum_mulai": { default: "{daftar} belum mulai.", en: "Not started yet: {daftar}." },
  "pengembangan.urutan": { default: "Peserta menurut abjad.", en: "Participants in alphabetical order." },
  "pengembangan.urutan_hasil": { default: "Peserta menurut abjad. Hasil terlihat per orang, tidak dijumlahkan dan tidak diurutkan.", en: "Participants in alphabetical order. Each result is that person's own, never added up or ranked." },
  "pengembangan.kolom.peserta": { default: "Peserta", en: "Participant" },
  "pengembangan.pelajaran_dari": { default: "{n} dari {m}", en: "{n} of {m}" },
  "pengembangan.tanpa_paket": { default: "Belum diberi paket: {daftar}.", en: "No package given yet: {daftar}." },
  "pengembangan.tanda": { default: "Tanda terisi: sudah. Tanda —: belum ada.", en: "A filled mark: done. A dash: none yet." },
  "pengembangan.tentang_catatan": { default: "Tentang catatan ini", en: "About this record" },
  "pengembangan.tanpa_jawaban": { default: "Jawaban peserta dan catatan integritas tidak ditampilkan di sini.", en: "Participants' answers and integrity observations are not shown here." },
  "pengembangan.arti_terbatas": { default: "Anda melihat pendaftaran, keikutsertaan dan penyelesaian. Kemajuan dan hasil hanya untuk fasilitator, Kepala departemen dan Dekan.", en: "You see enrolment, participation and completion. Progress and results are for the facilitator, the head of department and the dean only." },
  "pengembangan.kosong": { default: "Belum ada peserta di tempat ini.", en: "There is no participant here yet." },
  "pengembangan.paket_kosong": { default: "Belum ada paket yang diberikan.", en: "No package has been given yet." },
  "pengembangan.kolom.paket": { default: "Paket", en: "Package" },
  "pengembangan.kolom.mulai": { default: "Sudah mulai", en: "Started" },
  "pengembangan.kolom.pelajaran": { default: "Pelajaran selesai", en: "Lessons finished" },
  "pengembangan.kolom.pemetaan": { default: "Pemetaan Awal", en: "Initial Mapping" },
  "pengembangan.kolom.penguasaan": { default: "Uji Penguasaan", en: "Mastery Check" },
  "pengembangan.kolom.selesai": { default: "Selesai", en: "Completed" },
  "pengembangan.kolom.hasil": { default: "Hasil", en: "Result" },
  "pengembangan.status.BELUM": { default: "Belum dikerjakan", en: "Not started" },
  "pengembangan.status.SEDANG": { default: "Sedang dikerjakan", en: "In progress" },
  "pengembangan.status.SELESAI": { default: "Sudah dikumpulkan", en: "Handed in" },
  "pengembangan.ya": { default: "Ya", en: "Yes" },
  "pengembangan.belum": { default: "Belum", en: "Not yet" },
  "pengembangan.tercapai": { default: "Tercapai", en: "Reached" },
  "pengembangan.belum_tercapai": { default: "Belum tercapai", en: "Not reached yet" },
  "pengembangan.daftar.ACTIVE": { default: "Terdaftar", en: "Enrolled" },
  "pengembangan.daftar.PENDING": { default: "Terdaftar, akun belum diaktifkan", en: "Enrolled, account not activated yet" },
  "pengembangan.buka": { default: "Buka catatan", en: "Open the record" },
  // E-C1-4 (D-069(b)): who the record is for, in place of the generic refusal (Daisy's words, pending Dr Gladys: B10)
  "pengembangan.ditolak": { default: "Catatan ini untuk fasilitator, Kepala departemen, Dekan, dan Admin sekolah tempat ini.", en: "This record is for the facilitator, the Head of department, the Dean and the school administrator of this place." },
  "nav.lapor": { default: "Laporkan masalah", en: "Report a problem" },
  "lapor.eyebrow": { default: "Bantuan", en: "Help" },
  "lapor.judul": { default: "Laporkan masalah", en: "Report a problem" },
  "lapor.arti": { default: "Ceritakan apa yang terjadi. PINTAR menyertakan halaman ini, peran dan sekolah Anda, versi aplikasi, waktu dan perangkat Anda secara otomatis.", en: "Tell us what happened. PINTAR attaches this page, your role and school, the app version, the time and your device automatically." },
  "lapor.murid": { default: "Murid menceritakan masalah kepada gurunya, dan guru dapat melaporkannya di sini.", en: "Students tell their teacher about a problem, and the teacher can report it here." },
  "lapor.halaman": { default: "Halaman:", en: "Page:" },
  "lapor.halaman.awal": { default: "Halaman awal", en: "Start page" },
  "lapor.halaman.lain": { default: "Halaman lain di PINTAR", en: "Another PINTAR page" },
  "lapor.rujukan": { default: "Kode rujukan:", en: "Reference:" },
  "lapor.lakukan": { default: "Apa yang Anda lakukan?", en: "What did you do?" },
  "lapor.harapan": { default: "Apa yang Anda harapkan terjadi?", en: "What did you expect to happen?" },
  "lapor.terjadi": { default: "Apa yang terjadi?", en: "What happened?" },
  "lapor.hentikan": { default: "Masalah ini menghentikan kelas saya sekarang", en: "This problem is stopping my class now" },
  "lapor.hentikan.singkat": { default: "Menghentikan kelas", en: "Stopping a class" },
  "lapor.tangkapan": { default: "Tangkapan layar", en: "Screenshot" },
  "lapor.tangkapan.arti": { default: "PNG, JPG atau WebP, paling besar 5 MB. Sertakan hanya yang perlu dilihat.", en: "PNG, JPG or WebP, at most 5 MB. Include only what needs to be seen." },
  "lapor.tangkapan.naik": { default: "Mengunggah tangkapan layar…", en: "Uploading the screenshot…" },
  "lapor.tangkapan.siap": { default: "Tangkapan layar terlampir.", en: "Screenshot attached." },
  "lapor.tangkapan.gagal": { default: "Tangkapan layar tidak dapat diunggah. Laporan tetap dapat dikirim tanpanya.", en: "The screenshot could not be uploaded. The report can still be sent without it." },
  "lapor.tangkapan.besar": { default: "Tangkapan layar lebih dari 5 MB. Pilih yang lebih kecil, atau kirim tanpanya.", en: "The screenshot is over 5 MB. Choose a smaller one, or send without it." },
  "lapor.kirim": { default: "Kirim laporan", en: "Send report" },
  "lapor.privasi": { default: "Laporan disimpan di dalam PINTAR dan hanya dibaca oleh Anda, Admin sekolah Anda dan tim PINTAR.", en: "Reports stay inside PINTAR and are read only by you, your school admin and the PINTAR team." },
  "lapor.diterima": { default: "Laporan Anda diterima. Statusnya dapat diikuti di sini.", en: "Your report has been received. You can follow its status here." },
  "lapor.saya.judul": { default: "Laporan saya", en: "My reports" },
  "lapor.saya.arti": { default: "Setiap laporan Anda, dengan statusnya dan langkah berikutnya.", en: "Each of your reports, with its status and the next step." },
  "lapor.saya.kosong": { default: "Anda belum pernah mengirim laporan.", en: "You have not sent a report yet." },
  "lapor.saya.buka": { default: "Laporan saya", en: "My reports" },
  "lapor.langkah": { default: "Langkah berikutnya:", en: "Next step:" },
  "lapor.langkah.awal": { default: "Admin sekolah atau tim PINTAR akan melihatnya dalam satu hari sekolah.", en: "Your school admin or the PINTAR team will look at it within one school day." },
  "lapor.langkah.awal_kelas": { default: "Karena menghentikan kelas, laporan ini dijawab pada hari sekolah yang sama.", en: "Because it is stopping a class, this report is answered the same school day." },
  "lapor.status.DITERIMA": { default: "Diterima", en: "Received" },
  "lapor.status.DITANGANI": { default: "Ditangani", en: "Being handled" },
  "lapor.status.SELESAI": { default: "Selesai", en: "Resolved" },
  "lapor.kode.report_not_staff": { default: "Laporan dikirim oleh staf sekolah. Murid menceritakan masalah kepada gurunya.", en: "Reports are sent by school staff. Students tell their teacher about a problem." },
  "lapor.kode.report_input_invalid": { default: "Isi ketiga pertanyaan, masing-masing paling banyak 2000 karakter.", en: "Answer all three questions, each in at most 2000 characters." },
  "lapor.kode.report_not_allowed": { default: "Laporan ini ditangani oleh Admin sekolahnya atau oleh tim PINTAR.", en: "This report is handled by its school admin or by the PINTAR team." },
  "lapor.kode.report_status_invalid": { default: "Status laporan hanya maju: Diterima, Ditangani, lalu Selesai.", en: "A report's status only moves forward: Received, Being handled, then Resolved." },
  "lapor.kode.report_next_step_required": { default: "Tuliskan langkah berikutnya untuk pelapor, paling banyak 500 karakter.", en: "Write the next step for the reporter, in at most 500 characters." },
  "lapor.kode.report_failed": { default: "Laporan belum dapat disimpan. Coba kirim lagi.", en: "The report could not be saved yet. Try sending it again." },
  "config.section.laporan_masalah": { default: "Laporan masalah", en: "Problem reports" },
  "lapor.triase.arti": { default: "Laporan dari staf sekolah Anda, yang menghentikan kelas lebih dahulu. Selesaikan yang dapat diselesaikan sekolah; tim PINTAR juga membacanya.", en: "Reports from your school's staff, those stopping a class first. Resolve what the school can; the PINTAR team reads them too." },
  // H17 (Daisy B1; question pack B14): «Seluruh platform» has no «your school» (pending Dr Gladys)
  "lapor.triase.arti_platform": { default: "Laporan dari staf semua sekolah, yang menghentikan kelas lebih dahulu. Sekolah menyelesaikan yang dapat diselesaikannya; tim PINTAR menindaklanjuti sisanya.", en: "Reports from the staff of every school, those stopping a class first. Each school resolves what it can; the PINTAR team follows up the rest." },
  "lapor.triase.kosong": { default: "Belum ada laporan.", en: "No reports yet." },
  "lapor.triase.ubah": { default: "Ubah status", en: "Change status" },
  "lapor.triase.langkah": { default: "Langkah berikutnya untuk pelapor", en: "Next step for the reporter" },
  "lapor.triase.simpan": { default: "Simpan", en: "Save" },
  "lapor.triase.tangkapan": { default: "Lihat tangkapan layar", en: "View the screenshot" },
  "lapor.triase.ok": { default: "Status laporan diperbarui.", en: "The report's status has been updated." },
  // #148 (D-094, D-100): maintenance and notices; WIB is the zone the copy speaks (D-094(e))
  "pemeliharaan.zona": { default: "WIB", en: "WIB" },
  "pemeliharaan.pita.dalam": { default: "Pemeliharaan dalam", en: "Maintenance in" },
  "pemeliharaan.pita.menit": { default: "menit", en: "minutes" },
  "pemeliharaan.pita.pukul": { default: "PINTAR akan menjalani pemeliharaan pukul", en: "PINTAR goes into maintenance at" },
  "pemeliharaan.pita.selesai_kira": { default: "Perkiraan selesai pukul", en: "Expected to end at" },
  "pemeliharaan.pita.asesmen": { default: "Asesmen yang sedang Anda kerjakan tetap dapat diselesaikan dan dikumpulkan. Pastikan jawaban terakhir sudah «Tersimpan» sebelum mengumpulkan asesmen.", en: "An assessment you are working on can still be finished and submitted. Make sure your last answer shows «Saved» before you submit it." },
  "pemeliharaan.pita.biasa": { default: "Selesaikan aktivitas Anda dan keluar sebelum pemeliharaan dimulai.", en: "Finish what you are doing and sign out before maintenance begins." },
  "pemeliharaan.pita.asesmen_baru": { default: "Asesmen baru tidak dapat dimulai sampai pemeliharaan selesai.", en: "No new assessment can be started until maintenance ends." },
  "pemeliharaan.pita.berlangsung": { default: "Pemeliharaan sedang berlangsung.", en: "Maintenance is under way." },
  "pemeliharaan.pita.berjalan": { default: "Asesmen yang sedang Anda kerjakan tetap dapat diselesaikan dan dikumpulkan. Setelah itu PINTAR tidak dapat dipakai sampai pemeliharaan selesai.", en: "The assessment you are working on can still be finished and submitted. After that, PINTAR cannot be used until maintenance ends." },
  "pemeliharaan.pita.menguasai": { default: "Anda tetap dapat memakai PINTAR untuk mengakhiri pemeliharaan ini di Konfigurasi.", en: "You can still use PINTAR to end this maintenance in Configuration." },
  "pemeliharaan.pita.pengumuman": { default: "Pengumuman", en: "Notice" },
  "pemeliharaan.judul": { default: "PINTAR sedang dalam pemeliharaan", en: "PINTAR is under maintenance" },
  "pemeliharaan.sejak": { default: "Pemeliharaan dimulai pukul", en: "Maintenance began at" },
  "pemeliharaan.kira": { default: "Perkiraan selesai pukul", en: "It is expected to end at" },
  "pemeliharaan.kira_belum": { default: "Perkiraan waktu selesai belum ditentukan.", en: "No end time has been estimated yet." },
  "pemeliharaan.pesan": { default: "Pesan dari pengelola PINTAR:", en: "Message from PINTAR's administrators:" },
  "pemeliharaan.terkumpul": { default: "Asesmen Anda sudah terkumpul pukul", en: "Your assessment was submitted at" },
  "pemeliharaan.aman": { default: "Apa pun yang sudah tersimpan di PINTAR tetap aman.", en: "Everything already saved in PINTAR is safe." },
  "pemeliharaan.langkah": { default: "Silakan kembali setelah pemeliharaan selesai, lalu buka PINTAR lagi.", en: "Please come back after maintenance ends, then open PINTAR again." },
  "pemeliharaan.menjelang.judul": { default: "Asesmen baru belum dapat dimulai", en: "A new assessment cannot be started now" },
  "pemeliharaan.menjelang.arti": { default: "Mulai 15 menit sebelum pemeliharaan, asesmen baru tidak dapat dimulai, supaya tidak ada yang terputus di tengah jalan. Mulailah asesmen ini setelah pemeliharaan selesai.", en: "From 15 minutes before maintenance, no new assessment can be started, so that nobody is cut off halfway. Start this assessment after maintenance ends." },
  "pemeliharaan.darurat.judul": { default: "PINTAR dihentikan sementara", en: "PINTAR has been stopped for now" },
  "pemeliharaan.darurat.arti": { default: "Admin platform menghentikan PINTAR karena ada masalah yang harus ditangani lebih dulu agar data tetap aman.", en: "The platform administrator stopped PINTAR because a problem has to be dealt with first to keep data safe." },
  "pemeliharaan.darurat.aman": { default: "Apa pun yang sudah tersimpan tetap aman dan tidak dihapus. Jawaban yang belum tampil «Tersimpan» belum diterima PINTAR.", en: "Everything already saved is safe and has not been deleted. An answer that did not show «Saved» has not reached PINTAR." },
  "pemeliharaan.darurat.asesmen": { default: "Penghentian ini tidak mengumpulkan asesmen yang sedang dikerjakan. Setelah PINTAR kembali, buka lagi asesmen tersebut. Bila waktunya habis selama penghentian, beri tahu guru Anda.", en: "This stop does not submit an assessment that was in progress. When PINTAR is back, open that assessment again. If its time ran out during the stop, tell your teacher." },
  "pemeliharaan.darurat.langkah": { default: "Buka lagi halaman ini nanti untuk melihat apakah PINTAR sudah kembali.", en: "Open this page again later to see whether PINTAR is back." },
  "pemeliharaan.kembali.judul": { default: "PINTAR dapat digunakan", en: "PINTAR is available" },
  "pemeliharaan.kembali.arti": { default: "Tidak ada pemeliharaan yang menghentikan Anda saat ini.", en: "No maintenance is stopping you right now." },
  "pemeliharaan.kembali.tautan": { default: "Kembali ke PINTAR", en: "Back to PINTAR" },
  "config.section.pemeliharaan": { default: "Pemeliharaan dan pengumuman", en: "Maintenance and notices" },
  "config.pemeliharaan.arti": { default: "Jadwalkan pemeliharaan supaya orang di sekolah tahu lebih dulu. Mulai 60 menit sebelumnya mereka diberi tahu; mulai 15 menit sebelumnya asesmen baru tidak dapat dimulai; saat pemeliharaan dimulai PINTAR tidak dapat mereka pakai, kecuali murid yang sedang mengerjakan asesmen: mereka tetap dapat menyelesaikan dan mengumpulkannya.", en: "Schedule maintenance so that people at the school know in advance. From 60 minutes before, they are told; from 15 minutes before, no new assessment can be started; once it begins they cannot use PINTAR, except students already working on an assessment, who can still finish and submit it." },
  "config.pemeliharaan.cakupan": { default: "Untuk", en: "For" },
  "config.pemeliharaan.platform": { default: "Seluruh platform", en: "The whole platform" },
  "config.pemeliharaan.mulai": { default: "Mulai ({zona}; kosongkan untuk sekarang)", en: "Start ({zona}; leave empty for now)" },
  "config.pemeliharaan.selesai": { default: "Perkiraan selesai ({zona})", en: "Expected end ({zona})" },
  "config.pemeliharaan.periksa": { default: "Periksa waktu ini", en: "Check this time" },
  "config.pemeliharaan.tabrakan.perhatian": { default: "Perhatian.", en: "Please note." },
  "config.pemeliharaan.tabrakan.jumlah": { default: "asesmen dijadwalkan berlangsung selama periode ini.", en: "assessments are scheduled to run during this period." },
  // H19 (Daisy B1 / E3 #8): the moment that follows is a day and a time, so no «pukul» before it (pending Dr Gladys)
  "config.pemeliharaan.tabrakan.terakhir": { default: "Asesmen terakhir diperkirakan selesai", en: "The last assessment is expected to finish on" },
  "config.pemeliharaan.tabrakan.saran": { default: "Pertimbangkan memulai pemeliharaan setelah", en: "Consider starting maintenance after" },
  "config.pemeliharaan.tabrakan.nihil": { default: "Tidak ada asesmen yang dijadwalkan selama periode ini.", en: "No assessment is scheduled during this period." },
  "config.pemeliharaan.pesan": { default: "Pesan untuk pengguna", en: "Message for users" },
  "config.pemeliharaan.alasan": { default: "Alasan (dicatat)", en: "Reason (recorded)" },
  "config.pemeliharaan.umumkan": { default: "Terbitkan juga sebagai pengumuman", en: "Also publish it as a notice" },
  "config.pemeliharaan.jadwalkan": { default: "Jadwalkan pemeliharaan", en: "Schedule maintenance" },
  "config.pemeliharaan.daftar": { default: "Pemeliharaan", en: "Maintenance" },
  "config.pemeliharaan.kosong": { default: "Belum ada pemeliharaan.", en: "No maintenance yet." },
  "config.pemeliharaan.keadaan.TERJADWAL": { default: "Terjadwal", en: "Scheduled" },
  "config.pemeliharaan.keadaan.MENJELANG": { default: "Segera dimulai", en: "Starting soon" },
  "config.pemeliharaan.keadaan.AKTIF": { default: "Berlangsung", en: "Under way" },
  "config.pemeliharaan.keadaan.BERAKHIR": { default: "Berakhir", en: "Ended" },
  "config.pemeliharaan.jenis.PLANNED": { default: "Terencana", en: "Planned" },
  "config.pemeliharaan.jenis.EMERGENCY": { default: "Penghentian darurat", en: "Emergency stop" },
  "config.pemeliharaan.hingga": { default: "sampai", en: "until" },
  "config.pemeliharaan.tanpa_akhir": { default: "waktu selesai belum ditentukan", en: "no end time set" },
  "config.pemeliharaan.mulai_sekarang": { default: "Mulai sekarang", en: "Start now" },
  "config.pemeliharaan.akhiri": { default: "Akhiri sekarang", en: "End now" },
  "config.pemeliharaan.batalkan": { default: "Batalkan", en: "Cancel it" },
  "config.pemeliharaan.pengumuman": { default: "Pengumuman", en: "Notices" },
  "config.pemeliharaan.pengumuman.arti": { default: "Satu baris untuk orang di sekolah yang dipilih, dari waktu terbit sampai kedaluwarsa. Bukan sistem pesan.", en: "One line for the people of the chosen schools, from its publication to its expiry. Not a messaging system." },
  "config.pemeliharaan.pengumuman.pesan": { default: "Isi pengumuman", en: "The notice" },
  "config.pemeliharaan.pengumuman.terbit": { default: "Terbit ({zona}; kosongkan untuk sekarang)", en: "Publish ({zona}; leave empty for now)" },
  "config.pemeliharaan.pengumuman.sampai": { default: "Sampai ({zona})", en: "Until ({zona})" },
  "config.pemeliharaan.pengumuman.terbitkan": { default: "Terbitkan pengumuman", en: "Publish the notice" },
  "config.pemeliharaan.pengumuman.tarik": { default: "Tarik", en: "Withdraw" },
  "config.pemeliharaan.pengumuman.ditarik": { default: "Ditarik", en: "Withdrawn" },
  "config.pemeliharaan.pengumuman.kosong": { default: "Belum ada pengumuman.", en: "No notices yet." },
  "config.pemeliharaan.darurat.judul": { default: "Hentikan sekarang", en: "Stop now" },
  "config.pemeliharaan.darurat.arti": { default: "Hanya untuk masalah keamanan, integritas atau infrastruktur yang membuat PINTAR tidak aman dilanjutkan. Semua kegiatan yang terdampak berhenti seketika, termasuk asesmen yang sedang dikerjakan. Tidak ada yang dikumpulkan, dinilai atau dihapus: yang sudah tersimpan tetap seperti adanya. Akhiri dari daftar pemeliharaan bila sudah aman.", en: "Only for a security, integrity or infrastructure problem that makes continuing unsafe. All affected activity stops at once, assessments in progress included. Nothing is submitted, scored or deleted: what was saved stays as it is. End it from the maintenance list once it is safe." },
  "config.pemeliharaan.darurat.ketik": { default: "Ketik HENTIKAN SEKARANG untuk mengonfirmasi", en: "Type HENTIKAN SEKARANG to confirm" },
  "config.pemeliharaan.darurat.tombol": { default: "Hentikan PINTAR sekarang", en: "Stop PINTAR now" },
  "galat.maintenance_not_allowed": { default: "Anda tidak berwenang mengatur pemeliharaan atau pengumuman untuk cakupan itu. Admin sekolah mengatur sekolahnya sendiri; Admin platform mengatur sekolah mana pun dan seluruh platform.", en: "You are not authorised to set maintenance or notices for that scope. A school admin sets their own school's; the platform admin sets any school's and the whole platform's." },
  "galat.maintenance_input_invalid": { default: "Lengkapi cakupan, waktu mulai yang belum lewat, waktu selesai setelah waktu mulai, dan alasannya.", en: "Fill in the scope, a start that has not passed, an end after the start, and the reason." },
  "galat.maintenance_not_open": { default: "Pemeliharaan ini sudah berakhir.", en: "This maintenance has already ended." },
  "galat.maintenance_confirmation": { default: "Untuk menghentikan PINTAR seketika, pilih cakupan, tulis alasannya dan ketik HENTIKAN SEKARANG persis seperti itu.", en: "To stop PINTAR at once, choose the scope, write the reason and type HENTIKAN SEKARANG exactly." },
  "galat.maintenance_no_new_start": { default: "Pemeliharaan segera dimulai, jadi asesmen baru tidak dapat dimulai sekarang. Mulailah setelah pemeliharaan selesai.", en: "Maintenance is about to begin, so no new assessment can be started now. Start it after maintenance ends." },
  "galat.notice_input_invalid": { default: "Lengkapi cakupan, isi pengumuman, dan waktu kedaluwarsa setelah waktu terbit.", en: "Fill in the scope, the notice, and an expiry after its publication." },
  "galat.notice_not_open": { default: "Pengumuman ini sudah ditarik.", en: "This notice has already been withdrawn." },
  "galat.maintenance_active": { default: "PINTAR sedang dalam pemeliharaan, jadi ini belum dapat disimpan. Coba lagi setelah pemeliharaan selesai.", en: "PINTAR is under maintenance, so this cannot be saved yet. Try again after maintenance ends." },
  "galat.maintenance_scheduled": { default: "Pemeliharaan dijadwalkan.", en: "Maintenance scheduled." },
  "galat.maintenance_started": { default: "Pemeliharaan dimulai.", en: "Maintenance started." },
  "galat.maintenance_ended": { default: "Pemeliharaan diakhiri.", en: "Maintenance ended." },
  "galat.maintenance_stopped": { default: "PINTAR dihentikan untuk cakupan itu. Akhiri dari daftar pemeliharaan bila sudah aman.", en: "PINTAR is stopped for that scope. End it from the maintenance list once it is safe." },
  "galat.notice_published": { default: "Pengumuman diterbitkan.", en: "Notice published." },
  "galat.notice_withdrawn": { default: "Pengumuman ditarik.", en: "Notice withdrawn." },
  "config.struktur.murid.satu": { default: "murid", en: "student" },
  "config.struktur.murid.banyak": { default: "murid", en: "students" },
  "config.struktur.nonaktif": { default: "Nonaktif", en: "Inactive" },
  "config.struktur.ubah_nama": { default: "Ubah nama", en: "Rename" },
  "config.struktur.nama_baru": { default: "Nama baru", en: "New name" },
  "config.struktur.simpan": { default: "Simpan", en: "Save" },
  "config.struktur.batal": { default: "Batal", en: "Cancel" },
  "config.struktur.sibuk": { default: "Menyimpan…", en: "Saving…" },
  "config.struktur.nonaktifkan": { default: "Nonaktifkan", en: "Deactivate" },
  "config.struktur.konfirmasi.tanya": { default: "Nonaktifkan", en: "Deactivate" },
  "config.struktur.konfirmasi.arti": { default: "Setelah dinonaktifkan, tempat ini tidak bisa diaktifkan lagi dari layar ini. Namanya boleh dipakai lagi untuk yang baru.", en: "Once deactivated, it cannot be turned back on from this screen. Its name can be used again for a new one." },
  "config.struktur.konfirmasi.ya": { default: "Ya, nonaktifkan", en: "Yes, deactivate" },
  "config.struktur.ok.dibuat": { default: "ditambahkan.", en: "added." },
  "config.struktur.ok.diubah": { default: "Nama sekarang:", en: "The name is now" },
  "config.struktur.ok.dinonaktifkan": { default: "dinonaktifkan.", en: "deactivated." },
  "config.struktur.rujukan": { default: "Rujukan:", en: "Reference:" },
  "config.struktur.gagal_baca": { default: "Struktur sekolah belum bisa ditampilkan. Muat ulang halaman ini sebentar lagi.", en: "The school structure cannot be shown right now. Reload this page in a moment." },
  // BOB-02. What the upload screen says for each lesson-package problem and refusal
  // (src/lib/unggah-kontrak.ts: kunciMasalahPaket, kunciKodePaket). Daisy owns the wording.
  "studio.paket.masalah.workbook_unreadable": { default: "Berkas ini tidak terbaca sebagai buku kerja Excel (.xlsx).", en: "This file cannot be read as an Excel workbook (.xlsx)." },
  "studio.paket.masalah.workbook_too_large": { default: "Berkas terlalu besar. Batasnya 5 MB; unggah media secara terpisah.", en: "The file is too large. The limit is 5 MB; upload media separately." },
  "studio.paket.masalah.workbook_sheet_missing": { default: "Lembar ini tidak ada di buku kerja.", en: "This sheet is missing from the workbook." },
  "studio.paket.masalah.workbook_column_missing": { default: "Kolom wajib ini tidak ada di baris judul lembar.", en: "This required column is missing from the sheet's header row." },
  "studio.paket.masalah.workbook_course_row_missing": { default: "Lembar Kursus belum berisi baris data.", en: "The Kursus sheet has no data row." },
  "studio.paket.masalah.workbook_course_rows_many": { default: "Satu buku kerja untuk satu kursus: lembar Kursus hanya boleh satu baris.", en: "One workbook is one course: the Kursus sheet may have only one row." },
  "studio.paket.masalah.workbook_value_required": { default: "Kolom ini wajib diisi.", en: "This column must be filled in." },
  "studio.paket.masalah.workbook_value_unknown": { default: "Isi kolom ini tidak ada dalam daftar pilihannya.", en: "This value is not one of the column's choices." },
  "studio.paket.masalah.workbook_chapter_unknown": { default: "Nomor bab ini tidak ada di lembar Bab.", en: "This chapter number is not on the Bab sheet." },
  "studio.paket.masalah.workbook_lesson_unknown": { default: "Nomor pelajaran ini tidak ada di bab itu pada lembar Pelajaran.", en: "This lesson number is not in that chapter on the Pelajaran sheet." },
  "studio.paket.masalah.workbook_question_unknown": { default: "Kode soal ini tidak ada di lembar Soal.", en: "This question code is not on the Soal sheet." },
  "studio.paket.masalah.workbook_question_without_options": { default: "Soal ini belum punya pilihan di lembar Pilihan.", en: "This question has no options on the Pilihan sheet." },
  "studio.paket.masalah.package_json_unreadable": { default: "Isi paket tidak terbaca sebagai JSON.", en: "The package cannot be read as JSON." },
  "studio.paket.masalah.package_empty": { default: "Paket ini tidak berisi kursus.", en: "This package contains no course." },
  "studio.paket.masalah.package_too_large": { default: "Paket ini terlalu besar untuk sekali unggah.", en: "This package is too large for one upload." },
  "studio.paket.masalah.package_shape_invalid": { default: "Bagian paket ini tidak berbentuk yang diharapkan.", en: "This part of the package is not in the expected shape." },
  "studio.paket.masalah.course_title_missing": { default: "Judul kursus belum diisi.", en: "The course title is empty." },
  "studio.paket.masalah.course_subject_missing": { default: "Mata pelajaran belum diisi.", en: "The subject is empty." },
  "studio.paket.masalah.course_stage_missing": { default: "Jenjang belum diisi.", en: "The school level is empty." },
  "studio.paket.masalah.course_grade_missing": { default: "Kelas belum diisi.", en: "The grade is empty." },
  "studio.paket.masalah.course_context_unknown": { default: "Konteks kursus tidak dikenal.", en: "The course context is not recognised." },
  "studio.paket.masalah.module_number_invalid": { default: "Nomor bab harus bilangan bulat mulai dari 1.", en: "A chapter number must be a whole number from 1." },
  "studio.paket.masalah.module_number_repeated": { default: "Nomor bab ini dipakai dua kali.", en: "This chapter number is used twice." },
  "studio.paket.masalah.module_title_missing": { default: "Judul bab belum diisi.", en: "The chapter title is empty." },
  "studio.paket.masalah.lesson_number_invalid": { default: "Nomor pelajaran harus bilangan bulat mulai dari 1.", en: "A lesson number must be a whole number from 1." },
  "studio.paket.masalah.lesson_number_repeated": { default: "Nomor pelajaran ini dipakai dua kali di bab yang sama.", en: "This lesson number is used twice in the same chapter." },
  "studio.paket.masalah.lesson_title_missing": { default: "Judul pelajaran belum diisi.", en: "The lesson title is empty." },
  "studio.paket.masalah.lesson_text_missing": { default: "Isi pelajaran belum diisi.", en: "The lesson text is empty." },
  "studio.paket.masalah.objective_statement_missing": { default: "Tujuan pembelajaran belum diisi.", en: "The learning objective is empty." },
  "studio.paket.masalah.objective_thinking_unknown": { default: "Tingkat berpikir tidak dikenal.", en: "The thinking level is not recognised." },
  "studio.paket.masalah.media_name_invalid": { default: "Nama berkas media tidak dapat dipakai.", en: "This media file name cannot be used." },
  "studio.paket.masalah.media_kind_unknown": { default: "Jenis berkas ini tidak didukung. Pakai gambar, audio (mp3, m4a, wav, ogg), video (mp4, webm) atau PDF.", en: "This file type is not supported. Use an image, audio (mp3, m4a, wav, ogg), video (mp4, webm) or PDF." },
  "studio.paket.masalah.media_name_clash": { default: "Dua berkas berbeda menjadi nama yang sama. Ganti salah satu namanya.", en: "Two different files end up with the same name. Rename one of them." },
  "studio.paket.masalah.media_transcript_missing": { default: "Audio dan video wajib punya transkrip.", en: "Audio and video need a transcript." },
  "studio.paket.masalah.media_not_uploaded": { default: "Berkas media ini belum diunggah.", en: "This media file has not been uploaded yet." },
  "studio.paket.masalah.item_ref_repeated": { default: "Kode soal ini dipakai dua kali.", en: "This question code is used twice." },
  "studio.paket.masalah.item_type_unknown": { default: "Jenis soal tidak dikenal.", en: "The question type is not recognised." },
  "studio.paket.masalah.item_question_missing": { default: "Pertanyaan belum diisi.", en: "The question is empty." },
  "studio.paket.masalah.item_hint_reveals_answer": { default: "Petunjuk ini menyebut jawabannya. Tulis petunjuk yang mengarahkan cara berpikir.", en: "This hint gives the answer away. Write a hint that guides the thinking." },
  "studio.paket.masalah.item_use_unknown": { default: "Kegunaan soal tidak dikenal.", en: "The question's use is not recognised." },
  "studio.paket.masalah.item_difficulty_invalid": { default: "Tingkat kesulitan tidak dikenal.", en: "The difficulty is not recognised." },
  "studio.paket.masalah.item_parallel_tier_mixed": { default: "Satu kelompok paralel mencampur soal latihan dan soal asesmen.", en: "One parallel group mixes practice and assessment questions." },
  "studio.paket.masalah.item_parallel_cycle_mixed": { default: "Satu kelompok paralel berisi soal Pemetaan awal sekaligus soal Cek penguasaan. Soal dalam satu kelompok dianggap setara, jadi pisahkan kelompoknya.", en: "One parallel group holds both an Initial Mapping and a Mastery Check question. Questions in one group count as equivalent, so separate the groups." },
  "studio.paket.masalah.item_options_too_few": { default: "Soal ini perlu paling sedikit dua pilihan.", en: "This question needs at least two options." },
  "studio.paket.masalah.item_options_too_many": { default: "Soal ini paling banyak lima pilihan (A sampai E).", en: "This question may have at most five options (A to E)." },
  "studio.paket.masalah.item_correct_missing": { default: "Belum ada pilihan yang ditandai benar.", en: "No option is marked correct." },
  "studio.paket.masalah.item_correct_too_many": { default: "Pilihan ganda hanya boleh satu jawaban benar. Pakai jenis “banyak jawaban” bila lebih.", en: "A single-answer question may have only one correct option. Use the multiple-answer type for more." },
  "studio.paket.masalah.option_label_invalid": { default: "Label pilihan harus A, B, C, D atau E.", en: "An option label must be A, B, C, D or E." },
  "studio.paket.masalah.option_label_repeated": { default: "Label pilihan ini dipakai dua kali dalam soal yang sama.", en: "This option label is used twice in the same question." },
  "studio.paket.masalah.option_text_missing": { default: "Teks pilihan belum diisi.", en: "The option text is empty." },
  "studio.paket.masalah.option_reason_missing": { default: "Alasan pilihan belum diisi. Setiap pilihan perlu alasannya.", en: "The option's reason is empty. Every option needs its reason." },
  "studio.paket.masalah.option_correct_invalid": { default: "Kolom Benar harus Ya atau Tidak.", en: "The Benar column must be Ya or Tidak." },
  "studio.paket.masalah.option_misconception_unknown": { default: "Kode ini belum ada di lembar Miskonsepsi. Tambahkan kodenya di lembar itu, atau kosongkan kolom Kode miskonsepsi.", en: "This code is not on the Miskonsepsi sheet yet. Add the code to that sheet, or leave the Kode miskonsepsi column empty." },
  "studio.paket.masalah.misconception_code_invalid": { default: "Kode ini tidak bisa dipakai. Pakai huruf besar, angka dan tanda hubung saja, 3 sampai 40 karakter, misalnya SD5-M-B1-01.", en: "This code can't be used. Use only capital letters, digits and hyphens, 3 to 40 characters, for example SD5-M-B1-01." },
  "studio.paket.masalah.misconception_text_missing": { default: "Baris ini belum lengkap. Isi Nama, Penjelasan dan Cara membantu.", en: "This row is incomplete. Fill in Nama, Penjelasan and Cara membantu." },
  "studio.paket.masalah.misconception_repeated": { default: "Kode ini tertulis lebih dari sekali di lembar Miskonsepsi. Satu kode cukup satu baris; hapus baris yang kembar.", en: "This code is written more than once on the Miskonsepsi sheet. One code needs only one row; delete the duplicate row." },
  "studio.paket.masalah.misconception_definition_differs": { default: "Sekolah Anda sudah memakai kode ini dengan Nama, Penjelasan atau Cara membantu yang lain. Samakan teksnya, atau beri kode baru.", en: "Your school already uses this code with a different Nama, Penjelasan or Cara membantu. Make the texts the same, or give it a new code." },
  "studio.paket.masalah.text_too_long": { default: "Teks di kolom ini terlalu panjang.", en: "The text in this column is too long." },
  "studio.paket.masalah.package_could_not_be_saved": { default: "Paket ini belum bisa disimpan. Coba lagi, atau hubungi Admin platform.", en: "This package could not be saved. Try again, or contact the platform administrator." },
  "studio.paket.masalah.revision_course_unknown": { default: "Paket yang mau diperbaiki tidak ada di sekolah ini.", en: "The package being corrected is not in this school." },
  "studio.paket.masalah.revision_not_released": { default: "Paket yang mau diperbaiki belum dikunci. Hanya paket yang sudah dikunci yang diperbaiki dengan cara ini.", en: "The package being corrected has not been locked. Only a locked package is corrected this way." },
  "studio.paket.masalah.revision_not_latest": { default: "Paket ini sudah pernah diperbaiki. Pilih versi terbarunya.", en: "This package has already been corrected. Choose its newest version." },
  "studio.paket.masalah.revision_one_course": { default: "Buku kerja perbaikan berisi tepat satu kursus.", en: "A corrected workbook holds exactly one course." },
  "studio.paket.masalah.revision_summary_missing": { default: "Tulis apa yang diperbaiki dan mengapa, 10 sampai 1.000 huruf.", en: "Say what was corrected and why, in 10 to 1,000 characters." },
  "studio.paket.masalah.lain": { default: "Ada bagian paket yang belum bisa diterima.", en: "Part of the package cannot be accepted yet." },
  "studio.paket.kode.package_not_allowed": { default: "Anda tidak berwenang menyusun paket di sekolah ini.", en: "You are not allowed to author packages in this school." },
  "studio.paket.kode.package_state_invalid": { default: "Unggahan ini sudah dikonfirmasi atau ditolak.", en: "This upload has already been confirmed or rejected." },
  "studio.paket.kode.package_school_not_allowed": { default: "Pilih sekolah. Unggahan menjadi Paket Pembelajaran sekolah, bukan pustaka platform.", en: "Choose a school. An upload becomes a school's package, not the platform library." },
  "studio.paket.kode.package_has_problems": { default: "Paket ini belum bisa diterima. Perbaiki baris yang disebut lalu unggah lagi.", en: "This package cannot be accepted yet. Fix the rows listed and upload again." },
  "studio.paket.kode.package_input_invalid": { default: "Pilih sekolah dan berkasnya dulu.", en: "Choose the school and the file first." },
  "studio.paket.kode.package_failed": { default: "Unggahan belum berhasil. Coba lagi sebentar lagi.", en: "The upload did not go through. Try again in a moment." },
  // DAISY-31 (BOB-35): Studio's «Koreksi» refused, by its two causes; the second names the tests by the titles learners see
  "studio.terbitan.kode.release_move_started": { default: "Penugasan ini tidak bisa dipindahkan: sudah ada murid yang mulai mengerjakannya. Untuk memakai terbitan lain, buat penugasan baru.", en: "This assignment cannot be moved: a student has already started it. To use another release, make a new assignment." },
  "studio.terbitan.kode.release_move_no_cycle_definition": { default: "Terbitan tujuan belum punya Pemetaan Awal dan Uji Penguasaan, jadi penugasan tidak bisa dipindahkan ke sana. Pilih terbitan lain.", en: "The target release has no Initial Mapping and Mastery Check yet, so the assignment cannot be moved there. Choose another release." },
  "studio.terbitan.kode.release_not_allowed": { default: "Anda tidak berwenang membuat atau mengunci terbitan di sekolah ini.", en: "You are not allowed to create or lock releases in this school." },
  "studio.terbitan.kode.release_publish_not_allowed": { default: "Anda tidak berwenang menerbitkan atau menarik terbitan di sekolah ini.", en: "You are not allowed to publish or withdraw releases in this school." },
  "studio.terbitan.kode.release_school_not_allowed": { default: "Terbitan dibuat dari Paket Pembelajaran sekolah, bukan dari pustaka nasional.", en: "A release is made from a school's package, not from the national library." },
  "studio.terbitan.kode.release_course_not_approved": { default: "Paket ini belum disetujui. Terbitan dibuat dari paket yang sudah disetujui.", en: "This package has not been approved yet. A release is made from an approved package." },
  "studio.terbitan.kode.release_exists": { default: "Paket ini sudah punya terbitan. Untuk koreksi, buat revisi paket.", en: "This package already has a release. To correct it, create a revision of the package." },
  "studio.terbitan.kode.release_state_invalid": { default: "Terbitan ini sudah melewati langkah tersebut.", en: "This release is already past that step." },
  "studio.terbitan.kode.release_same_person": { default: "Penyusun paket tidak bisa mengunci terbitannya sendiri. Minta rekan yang lain.", en: "The author of a package cannot lock its own release. Ask a colleague." },
  "studio.terbitan.kode.release_not_ready": { default: "Paket ini belum siap terbit. Selesaikan temuan yang tercantum di halaman ini.", en: "This package is not ready to publish. Resolve the findings listed on this page." },
  "studio.terbitan.kode.release_reason_required": { default: "Tuliskan alasan penarikan.", en: "Write the reason for the withdrawal." },
  "studio.terbitan.kode.release_input_invalid": { default: "Terbitan atau paket tidak dikenali.", en: "The release or package was not recognised." },
  "studio.terbitan.kode.release_failed": { default: "Langkah ini belum berhasil. Coba lagi sebentar lagi.", en: "This step did not go through. Try again in a moment." },
  "studio.paket.buat_terbitan": { default: "Buat terbitan", en: "Create release" },
  "laporan.muncul.penilaian": { default: "Angka ini muncul setelah murid menyelesaikan asesmen pertamanya.", en: "This figure appears once a student has finished their first assessment." },
  "laporan.muncul.gerbang": { default: "Angka ini muncul setelah cukup murid mengerjakan Uji Penguasaan yang memuat soal wajib.", en: "This figure appears once enough students have taken a Mastery Check that holds required items." },
  "laporan.muncul.akhir": { default: "Angka ini muncul setelah cukup murid menyelesaikan Uji Penguasaan.", en: "This figure appears once enough students have finished the Mastery Check." },
  "laporan.muncul.awal_akhir": { default: "Angka ini muncul setelah cukup murid menyelesaikan Pemetaan Awal dan Uji Penguasaan. Hanya murid yang menyelesaikan keduanya yang dihitung.", en: "This figure appears once enough students have finished both the Initial Mapping and the Mastery Check. Only students who finished both are counted." },
  "laporan.muncul.miskonsepsi": { default: "Angka ini muncul setelah beberapa murid memilih jawaban keliru yang sama pada pilihan yang diberi kode miskonsepsi.", en: "This figure appears once several students choose the same wrong answer on an option that carries a misconception code." },
  "laporan.muncul.sertifikat": { default: "Angka ini muncul setelah sertifikat pertama sekolah ini terbit.", en: "This figure appears once this school's first certificate is issued." },
  "pimpinan.kelas.murid": { default: "Murid di kelas ini sekarang", en: "Students in this class now" },
  "pimpinan.kelas.judul": { default: "Per kelas", en: "Class by class" },
  "pimpinan.kelas.arti": { default: "Angka kelas dihitung untuk tiap kelas sendiri dan tidak dijumlahkan antarkelas. Buka satu kelas untuk melihat angkanya, atau apa yang membuatnya muncul.", en: "Class figures are counted for each class on its own and never added across classes. Open a class to see its figures, or what will make them appear." },
  "pimpinan.kelas.ada": { default: "Ada angka", en: "Has figures" },
  "pimpinan.kelas.bukti_saja": { default: "Sudah ada yang mengerjakan; angkanya belum dapat ditampilkan", en: "Students have sat; no figure can be shown yet" },
  "pimpinan.kelas.belum": { default: "Belum ada angka", en: "No figures yet" },
  "pimpinan.kelas.kosong": { default: "Belum ada kelas dalam lingkup ini.", en: "There are no classes in this part yet." },
  "pimpinan.laporan.sekolah": { default: "Buka ringkasan sekolah", en: "Open the school summary" },
  "pimpinan.laporan.kelas": { default: "Buka ringkasan kelas ini", en: "Open this class\u2019s summary" },
  "config.laporan.judul": { default: "Laporan", en: "Reports" },
  "config.laporan.arti": { default: "Ringkasan dibaca dari asesmen resmi murid. Sebelum ada cukup hasil, setiap angka menjelaskan apa yang membuatnya muncul.", en: "Summaries are read from students' official assessments. Until there are enough results, each figure explains what will make it appear." },
  "config.laporan.sekolah": { default: "Ringkasan sekolah", en: "School summary" },
  "config.laporan.kelas": { default: "Ringkasan per kelas", en: "Summary by class" },
  "config.laporan.tanpa_kelas": { default: "Belum ada Kelas aktif. Buat Kelas di Struktur sekolah di atas; ringkasannya lalu muncul di sini.", en: "There is no active class yet. Create one in the school structure above; its summary then appears here." },
  "studio.langkah.judul": { default: "Langkah menuju terbit", en: "Steps to publication" },
  "studio.langkah.arti": { default: "Tujuh langkah dari unggahan sampai terbit, dalam urutan yang dijalankan PINTAR. Tombol hanya muncul untuk orang yang boleh mengambil langkah itu.", en: "Seven steps from upload to publication, in the order PINTAR takes them. A button appears only for someone who may take that step." },
  "studio.langkah.oleh": { default: "Oleh:", en: "By:" },
  "studio.langkah.atau": { default: "atau", en: "or" },
  "studio.langkah.bukan_penyusun": { default: "bukan penyusun paket ini", en: "not this package's author" },
  "studio.langkah.keadaan.selesai": { default: "Selesai", en: "Done" },
  "studio.langkah.keadaan.kini": { default: "Sekarang", en: "Now" },
  "studio.langkah.keadaan.nanti": { default: "Belum", en: "Not yet" },
  "studio.langkah.tunggu.penyusun": { default: "Anda menyusun paket ini, jadi langkah ini diambil orang kedua. Minta rekan yang disebut di atas; PINTAR tidak mengirim pemberitahuan.", en: "You wrote this package, so a second person takes this step. Ask a colleague named above; PINTAR sends no notification." },
  "studio.langkah.tunggu.wewenang": { default: "Langkah ini bukan wewenang Anda di sekolah ini. Minta orang yang disebut di atas; PINTAR tidak mengirim pemberitahuan.", en: "This step is not yours to take in this school. Ask someone named above; PINTAR sends no notification." },
  "studio.langkah.dikembalikan": { default: "Isi ini dikembalikan untuk diperbaiki. Perbaiki, lalu tandai sudah tersusun lagi.", en: "This content was returned for correction. Fix it, then mark it as put together again." },
  "studio.langkah.sibuk": { default: "Memproses…", en: "Working…" },
  "studio.langkah.hambatan": { default: "Yang menahan:", en: "What is holding it:" },
  // BOB-17 (D-011): what holds a release, one line per blocker code (terbitan-kontrak.ts KODE_HAMBATAN).
  // DAISY-16: worded as the steps are -- the course, never the package; each step by its exact title
  "studio.hambatan.readiness_text_error": { default: "kesalahan pada teks pelajaran yang harus diperbaiki", en: "error(s) in the lesson text that must be fixed" },
  "studio.hambatan.readiness_text_warning": { default: "catatan mutu pada teks pelajaran yang belum ditinjau", en: "quality note(s) on the lesson text not yet reviewed" },
  "studio.hambatan.readiness_item_error": { default: "soal dengan kesalahan yang harus diperbaiki", en: "question(s) with an error that must be fixed" },
  "studio.hambatan.readiness_item_warning": { default: "soal dengan catatan mutu yang belum ditinjau", en: "question(s) with a quality note not yet reviewed" },
  "studio.hambatan.readiness_not_validated": { default: "bagian isi belum lolos langkah Periksa isi", en: "part(s) of the content not yet through Check the content" },
  "studio.hambatan.readiness_returned": { default: "bagian isi dikembalikan dan harus diperbaiki", en: "part(s) of the content returned and to be fixed" },
  "studio.hambatan.readiness_awaiting_review": { default: "bagian isi masih menunggu langkah Setujui isi", en: "part(s) of the content still waiting at Approve the content" },
  "studio.hambatan.readiness_no_release": { default: "Paket ini belum memiliki terbitan: mulai dari langkah Buat terbitan.", en: "This package has no release yet: start at Create the release." },
  "studio.hambatan.readiness_not_sealed": { default: "Isi paket belum dikunci pada langkah Kunci terbitan. Setelah dikunci, isinya tidak dapat diubah lagi.", en: "The package content is not locked yet at Lock the release. Once locked, it cannot be changed." },
  "studio.hambatan.lain": { default: "Ada hal lain yang menahan terbitan ini.", en: "Something else is holding this release." },
  "studio.hambatan.pelajaran": { default: "Pelajaran", en: "Lesson" },
  "studio.hambatan.pola.answer_position_skew": { default: "jawaban benar menumpuk di posisi yang sama", en: "the correct answers bunch in one position" },
  "studio.hambatan.pola.correct_option_length_imbalance": { default: "jawaban benar jauh lebih panjang daripada pilihan lain", en: "the correct answer is much longer than the other options" },
  "studio.hambatan.pola.implausible_distractor": { default: "ada pengecoh yang tidak mungkin dipilih", en: "a wrong option no one would choose" },
  "studio.hambatan.pola.stem_reveals_answer": { default: "pertanyaannya membocorkan jawaban", en: "the question gives its answer away" },
  "studio.hambatan.pola.lain": { default: "catatan mutu soal lainnya", en: "another question-quality note" },
  "studio.langkah.susun.judul": { default: "Susun isi", en: "Put the content together" },
  "studio.langkah.susun.arti": { default: "Buku kerja sudah menjadi paket: bab, pelajaran, dan soal. Lihat seperti murid untuk memeriksa tampilannya, lalu tandai sudah tersusun.", en: "The workbook has become a package with chapters, lessons and questions. See it as a student to check how it looks, then mark it as put together." },
  "studio.langkah.susun.tombol": { default: "Tandai sudah tersusun", en: "Mark as put together" },
  "studio.langkah.periksa.judul": { default: "Periksa isi", en: "Check the content" },
  "studio.langkah.periksa.arti": { default: "Jalankan pemeriksaan isi di bagian Temuan di bawah. Perbaiki yang wajib diperbaiki, lalu tandai lolos pemeriksaan.", en: "Run the content check in the Findings section below. Fix what must be fixed, then mark the check as passed." },
  "studio.langkah.periksa.tombol": { default: "Tandai lolos pemeriksaan", en: "Mark the check as passed" },
  "studio.langkah.ajukan.judul": { default: "Ajukan untuk ditinjau", en: "Send for review" },
  "studio.langkah.ajukan.arti": { default: "Kirim paket ini kepada rekan yang boleh menyetujuinya. Persetujuannya harus dari orang lain, bukan dari penyusun.", en: "Send this package to a colleague who may approve it. The approval must come from someone other than its author." },
  "studio.langkah.ajukan.tombol": { default: "Ajukan untuk ditinjau", en: "Send for review" },
  "studio.langkah.setujui.judul": { default: "Setujui isi", en: "Approve the content" },
  "studio.langkah.setujui.arti": { default: "Orang kedua membaca isinya lalu menyetujuinya. Peringatan di bagian Temuan juga diakui di langkah ini.", en: "A second person reads the content and approves it. Warnings in the Findings section are acknowledged at this step too." },
  "studio.langkah.setujui.tombol": { default: "Setujui isi", en: "Approve the content" },
  "studio.langkah.buat.judul": { default: "Buat terbitan", en: "Create the release" },
  "studio.langkah.buat.arti": { default: "Terbitan adalah versi Paket Pembelajaran yang nanti dipakai murid. Terbitan dibuat dari paket yang sudah disetujui.", en: "A release is the version of the package that students will use. It is made from an approved package." },
  "studio.langkah.buat.tombol": { default: "Buat terbitan", en: "Create the release" },
  "studio.langkah.kunci.judul": { default: "Kunci terbitan", en: "Lock the release" },
  "studio.langkah.kunci.arti": { default: "Orang kedua mengunci terbitan. PINTAR memeriksa isinya sekali lagi. Setelah dikunci, isinya tidak dapat diubah; perbaikan dibuat sebagai salinan baru.", en: "A second person locks the release. PINTAR checks the content once more. Once locked it cannot be changed; a correction is made as a new copy." },
  "studio.langkah.kunci.tombol": { default: "Kunci terbitan", en: "Lock the release" },
  "studio.langkah.terbitkan.judul": { default: "Terbitkan", en: "Publish" },
  "studio.langkah.terbitkan.arti": { default: "Setelah terbit, guru dapat menyediakannya untuk kelas mereka.", en: "Once published, teachers can make it available to their classes." },
  "studio.langkah.terbitkan.tombol": { default: "Terbitkan", en: "Publish" },
  "studio.langkah.terbit.judul": { default: "Terbit", en: "Published" },
  "studio.langkah.terbit.sejak": { default: "Terbit sejak", en: "Published since" },
  "studio.langkah.terbit.nanti": { default: "Paket ini terbit setelah langkah Terbitkan.", en: "This package is published after the Publish step." },
  "studio.langkah.ditarik.judul": { default: "Ditarik", en: "Withdrawn" },
  "studio.langkah.ditarik.arti": { default: "Terbitan ini sudah ditarik dari peredaran. Untuk memperbaikinya, buat salinan paket di bawah.", en: "This release has been withdrawn from circulation. To correct it, make a copy of the package below." },
  "studio.paket.tarik.tanya": { default: "Tarik terbitan ini dari peredaran sekarang?", en: "Withdraw this release from circulation now?" },
  "studio.kanonik.tarik.tanya": { default: "Akhiri izin paket ini untuk sekolah tersebut sekarang?", en: "End this package's permission for that school now?" },
  "config.pemeliharaan.akhiri.tanya": { default: "Akhiri jendela pemeliharaan ini sekarang?", en: "End this maintenance window now?" },
  "config.pemeliharaan.pengumuman.tarik.tanya": { default: "Tarik pengumuman ini sekarang? Pengumuman tidak lagi ditampilkan.", en: "Withdraw this announcement now? It will no longer be shown." },
  "bahaya.batal": { default: "Batal", en: "Cancel" },
  "studio.langkah.tarik.alasan": { default: "Alasan penarikan", en: "Reason for withdrawal" },
  "studio.paket.periksa_isi": { default: "Periksa isi sekarang", en: "Check the content now" },
  "studio.paket.periksa_isi_arti": { default: "PINTAR memeriksa pelajaran dan soalnya. Temuannya muncul di sini; langkah Kunci terbitan memeriksa sekali lagi.", en: "PINTAR checks the lessons and questions. Its findings appear here; the Lock the release step checks once more." },
  "studio.paket.catatan": { default: "Catatan", en: "Note" },
  "studio.paket.koreksi_alasan": { default: "Alasan pemindahan", en: "Reason for the move" },
  // polish batch 2 (UX-16): the form moves an assignment that exists; it says so, and which class it moves
  "studio.paket.pindah.judul": { default: "Pindahkan penugasan ke terbitan lain", en: "Move an assignment to another release" },
  "studio.paket.pindah.tujuan": { default: "Terbitan tujuan", en: "Release to move to" },
  "studio.paket.pindah.sekarang": { default: "sekarang di terbitan", en: "now on the release of" },
  "studio.paket.pindah.tombol": { default: "Pindahkan", en: "Move" },
  // polish batch 2 (UX-04): a school picker is labelled as one
  "studio.sekolah": { default: "Sekolah", en: "School" },
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
  // E-K1 (D-173(d)): the history-back, named as one (pending Dr Gladys)
  "kembali.riwayat": { default: "Kembali ke halaman sebelumnya", en: "Back to the previous page" },
  "entry.learner": { default: "Saya mau belajar", en: "I want to learn" },
  "entry.educator": { default: "Saya mengajar", en: "I teach" },
  "entry.staff": { default: "Saya mengelola sekolah", en: "I run the school" },
  "entry.halo": { default: "Halo", en: "Hello" },
  // DAISY-03: a signed-in reader's doors are only the places they hold. A head
  // of department or a dean leads part of the school; the plain door for them.
  "entry.pimpinan": { default: "Saya memimpin bagian sekolah", en: "I lead part of the school" },
  // Signed in, but holding no place yet: said plainly, with the one next step.
  "entry.kosong": {
    default: "Anda belum terhubung dengan kelas atau tugas apa pun. Hubungi yang mengurus PINTAR di sekolah Anda.",
    en: "Your account is not linked to any class or role yet. Please ask your school administrator.",
  },

  // ---------------------------------------------------------------- FABLE-03
  "cycle.title": { default: "Perjalanan belajar Anda", en: "Your learning journey" },
  "cycle.none": { default: "Belum ada materi yang disediakan untuk Anda.", en: "Nothing has been made available to you yet." },
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
  "pretest.progress": { default: "Soal", en: "Question" },
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
  // L4 (CR-88): a staff list's pages, in words the copy table already has (pretest.back, pretest.next)
  "koleksi.berikutnya": { default: "Berikutnya", en: "Next" },
  // L4 (CR-88): the explicit edit of a row, as Akun saya says it (akun.perangkat.ubah)
  "koleksi.ubah": { default: "Ubah", en: "Change" },
  "lesson.prev": { default: "Halaman sebelumnya", en: "Previous page" },
  "lesson.next": { default: "Halaman berikutnya", en: "Next page" },
  "lesson.transcript": { default: "Teks lengkap", en: "Full text" },
  "lesson.speed": { default: "Kecepatan", en: "Speed" },
  "lesson.example.reveal": { default: "Tampilkan langkah berikutnya", en: "Show the next step" },
  "lesson.example.done": { default: "Semua langkah sudah tampil.", en: "Every step is showing." },
  "lesson.pdf": { default: "Buka ringkasan", en: "Open the summary" },
  // W2.12 (RV-8): a recording whose file cannot be played says so, rather than a player stuck at «0:00 / 0:00»
  "lesson.media.tidak_ada": { default: "Rekaman ini tidak tersedia. Isinya ada di teks lengkap di bawah.", en: "This recording is not available. Its content is in the full text below." },
  "lesson.media.tidak_ada_teks": { default: "Rekaman ini tidak tersedia.", en: "This recording is not available." },
  "lesson.saved": { default: "Posisi bacaan tersimpan.", en: "Your place is saved." },

  "posttest.title": { default: "Uji Penguasaan", en: "Mastery Check" },
  // DAISY-26 (UX-05): a teacher's Quick Assessment is called what the product calls it (0090), never the Uji Penguasaan whose player it borrows
  "ujicepat.title": { default: "Uji Cepat", en: "Quick Assessment" },
  "posttest.intro": { default: "Kerjakan dengan tenang. Anda bisa menandai soal dan kembali lagi.", en: "Work through it calmly. You can flag a question and come back to it." },
  "posttest.elapsed": { default: "Waktu berjalan", en: "Time elapsed" },
  "posttest.pause": { default: "Simpan & Jeda", en: "Save & pause" },
  "posttest.resume": { default: "Lanjutkan mengerjakan", en: "Carry on" },
  "posttest.flag": { default: "Tandai soal ini", en: "Flag this question" },
  "posttest.flagged": { default: "Ditandai", en: "Flagged" },
  "posttest.navigator": { default: "Daftar soal", en: "Question list" },
  "posttest.answered": { default: "Sudah dijawab", en: "Answered" },
  "posttest.unanswered": { default: "Belum dijawab", en: "Not answered" },
  // DAISY-26 (UX-24): «kunci jawaban» is also "the answer key"; the button saves the answer, and then reads «Tersimpan»
  "posttest.confirm": { default: "Simpan jawaban ini", en: "Save this answer" },
  "posttest.confirmed": { default: "Tersimpan", en: "Saved" },
  "posttest.submit": { default: "Kumpulkan", en: "Submit" },
  "posttest.submit_confirm": { default: "Kumpulkan sekarang? Setelah dikumpulkan, jawaban tidak bisa diubah.", en: "Submit now? Once submitted, answers cannot be changed." },

  // W2.16 (DAISY-35 item 4): judged under the design spec, «No emoji in the interface chrome» (README, Iconography;
  // Icons: «no emoji»). The hint button is a control, so its label is its words alone.
  "assist.SD": { default: "Perlu contoh?", en: "Want an example?" },
  "assist.SMP": { default: "Perlu petunjuk?", en: "Want a hint?" },
  "assist.SMA": { default: "Perlu arah?", en: "Need a direction?" },
  "assist.UNIVERSITAS": { default: "Perlu arah berpikir?", en: "Need a direction to think in?" },
  "assist.more": { default: "Masih perlu bantuan lagi?", en: "Still need more help?" },
  "assist.close": { default: "Sudah cukup, terima kasih", en: "That is enough, thank you" },
  "assist.level.ARAH": { default: "Arah berpikir", en: "A direction to think in" },
  "assist.level.PETUNJUK": { default: "Langkah pertama", en: "The first step" },
  "assist.level.CONTOH": { default: "Contoh yang mirip", en: "A similar example" },
  "assist.none": { default: "Untuk soal ini belum ada bantuan tambahan.", en: "There is no further help for this question." },

  "hasil.title": { default: "Hasil", en: "Result" },
  "hasil.mastery": { default: "Penguasaan", en: "Mastery" },
  // DAISY-26 (UX-27): the page counts «soal», so these do too
  "hasil.safety.ok": { default: "Semua soal penting sudah dijawab dengan tepat.", en: "You answered every important question correctly." },
  "hasil.safety.missed": { default: "Ada soal penting yang belum tepat. Mari kita lihat bersama.", en: "An important question is not right yet. Let us look at it together." },
  "hasil.safety.tidak_ada": { default: "Uji ini tidak berisi soal penting yang wajib dijawab tepat.", en: "This check has no questions that must be answered correctly." },
  // POLISH3 (UX-26): each row is now a learning objective, named by its statement; «bagian» is also the school's structure unit (D-006)
  "hasil.domain": { default: "Per tujuan pembelajaran", en: "By learning objective" },
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
  "siklus.beranda": { default: "Belajar", en: "Home" },
  "siklus.hari_ini": { default: "Ini yang sedang berjalan hari ini.", en: "Here is what is under way for you today." },
  // DAISY-26 (UX-21): the panel is named for what it holds; its buttons are named for where they go (src/components/siklus/aksi.ts)
  "siklus.panel.eyebrow": { default: "Langkah berikutnya", en: "Your next step" },
  "siklus.lihat_langkah": { default: "Lihat semua langkah", en: "See all the steps" },
  "siklus.aksi.pemetaan": { default: "Mulai Pemetaan Awal", en: "Start the Initial Mapping" },
  "siklus.aksi.pemetaan_lanjut": { default: "Lanjutkan Pemetaan Awal", en: "Continue the Initial Mapping" },
  "siklus.aksi.pelajaran_mulai": { default: "Mulai pelajaran", en: "Start the lessons" },
  "siklus.aksi.pelajaran": { default: "Lanjutkan pelajaran", en: "Continue the lessons" },
  "siklus.aksi.penguasaan": { default: "Mulai Uji Penguasaan", en: "Start the Mastery Check" },
  "siklus.aksi.penguasaan_lanjut": { default: "Lanjutkan Uji Penguasaan", en: "Continue the Mastery Check" },
  "siklus.aksi.hasil": { default: "Lihat hasil", en: "See the result" },
  // DAISY-26 (UX-22): what the section holds, not «Perlu perhatian», which read as a problem; each row says why it is ready
  "siklus.siap.judul": { default: "Siap untuk Uji Penguasaan", en: "Ready for the Mastery Check" },
  "siklus.siap.arti": { default: "Semua pelajaran sudah dibaca.", en: "Every lesson has been read." },
  "siklus.diminta.judul": { default: "Diminta guru Anda", en: "Your teacher's request" },
  "siklus.diminta.meminta": { default: "meminta Anda membaca lagi:", en: "asked you to read these again:" },
  "siklus.diminta.arti": { default: "Guru Anda meminta Anda membaca lagi:", en: "Your teacher asked you to read these again:" },
  "siklus.diminta.sudah": { default: "sudah dibaca lagi", en: "read again" },
  "siklus.milik_anda": { default: "Pembelajaran Anda", en: "Your learning" },
  "siklus.terbuka": { default: "Bisa dikerjakan sekarang", en: "You can do these now" },
  "siklus.buka": { default: "Buka", en: "Open" },
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
  // DAISY-26 (UX-27): «Ambang» is hard for a primary-school reader; the mastery bar is the chapter's target, not a pass mark
  "siklus.ambang": { default: "Target untuk bab ini:", en: "The target for this chapter:" },
  "siklus.ambang_belum": { default: "Batas ketuntasan belum ditetapkan.", en: "No pass mark has been set." },
  "mengajar.murid1.target": { default: "target", en: "target" },
  "mengajar.murid1.dihitung_ulang_alasan": { default: "Alasan yang dicatat: {alasan}", en: "Reason recorded: {alasan}" },
  // D14 (owner, 9 Nov): the learner is told, neutrally, that reports may read a recalculated figure; their own result and certificate do not change
  // O-B3 (owner, 9 Nov): the feedback uses the corrected key and says so; the sealed result and certificate do not change.
  // Owner (9 Nov): to a learner it is said in ordinary words («tetap seperti semula»), never «disegel»; the concept stays in
  // the data, the audit and the technical documents
  "hasil.review.kunci_terkini": { default: "Tanda «Sudah tepat» dan «Belum tepat» pada soal-soal di bawah mengikuti jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil di atas ({benar} dari {total} soal tepat). Hasil di atas dan sertifikat Anda tetap seperti semula.", en: "The «That is right» and «Not right yet» marks on the questions below follow the corrected answers, so they can differ from the result above ({benar} of {total} questions right). The result above and your certificate stay as they were." },
  "map.kunci_terkini": { default: "Peta ini mengikuti jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil Pemetaan Awal Anda. Hasil Pemetaan Awal Anda tetap seperti semula.", en: "This map follows the corrected answers, so it can differ from your Initial Mapping result. Your Initial Mapping result stays as it was." },
  "hasil.dihitung_ulang": { default: "Hasil ini kemudian dihitung ulang. Penguasaan dan jumlah jawaban tepat di atas, serta sertifikat Anda, tetap seperti semula; laporan guru dapat menampilkan hasil yang dihitung ulang.", en: "This result was later recalculated. The mastery and the count of right answers above, and your certificate, stay as they were; your teacher's reports may show the recalculated result." },
  "mengajar.murid1.dihitung_ulang": { default: "Hasil sesi ini dihitung ulang setelah disegel. Laporan memakai hasil terbaru ({baru}); sertifikat dan halaman hasil murid tetap memakai hasil asli yang disegel ({asli}).", en: "This sitting's result was recalculated after it was sealed. Reports use the latest result ({baru}); the certificate and the student's own result page keep the original sealed result ({asli})." },
  "mengajar.murid1.di_bawah_target": { default: "di bawah target", en: "below target" },
  "hasil.target.tercapai": { default: "Target tercapai.", en: "Target reached." },
  "hasil.target.tercapai_arti": { default: "Penguasaan bab ini memenuhi targetnya.", en: "Mastery of this chapter meets its target." },
  "hasil.target.belum": { default: "Belum mencapai target.", en: "Target not reached yet." },
  "hasil.target.belum_arti": { default: "Bab ini sudah selesai dikerjakan, tetapi penguasaannya masih di bawah target. Pelajari lagi bagian di bawah ini, lalu tanyakan kepada guru langkah berikutnya.", en: "This chapter is finished, but its mastery is still below the target. Review the parts below, then ask the teacher what comes next." },
  "hasil.target.ulang": { default: "Pelajari lagi:", en: "Review:" },
  "siklus.target.tercapai": { default: "target tercapai", en: "target reached" },
  "siklus.target.belum": { default: "belum mencapai target", en: "target not reached yet" },
  "siklus.target.lanjut_belum": { default: "Bab ini selesai dikerjakan, tetapi targetnya belum tercapai.", en: "This chapter is finished, but its target has not been reached." },
  "siklus.target.lihat_ulang": { default: "Lihat bagian yang perlu dipelajari lagi", en: "See the parts to review" },
  "siklus.tepat_dari": { default: "Terjawab tepat", en: "Answered correctly:" },
  "siklus.setelah": { default: "Setelah bab ini", en: "After this chapter" },
  "siklus.berikutnya": { default: "Apa berikutnya", en: "What next" },
  "siklus.terbuka_kini": { default: "Yang terbuka untuk Anda sekarang.", en: "What is open to you now." },
  "siklus.habis.judul": { default: "Tidak ada lagi yang menunggu", en: "Nothing else is waiting" },
  // DAISY-25 (D-019): PINTAR sends a learner no notification and cannot know whether more is coming, so the line says where new work would appear, and nothing more
  "siklus.habis.isi": { default: "Semua yang disediakan untuk Anda sudah selesai. Materi baru, jika ada, akan muncul di halaman Belajar.", en: "Everything assigned to you is finished. Anything new will appear on your Learning page." },
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
  // W3.13 (Daisy, J6Peragaan: new words for the result line after «Keluar dari peragaan»)
  "evaluasi.keluar_selesai": { default: "Anda sudah keluar dari peragaan.", en: "You have left the demonstration." },
  "evaluasi.berakhir": { default: "Sesi peragaan berakhir", en: "The demonstration session has ended" },
  "evaluasi.sesi_habis": { default: "Waktu peragaan sudah habis. Kembali ke ruang peragaan untuk mulai lagi.", en: "The demonstration time is up. Go back to the demonstration room to start again." },
  "evaluasi.gagal": { default: "Sudut pandang itu tidak bisa dibuka sekarang.", en: "That point of view cannot be opened right now." },
  // J1.8 (W6.10): proposed words, awaiting Dr Gladys (K1 B36)
  "evaluasi.akun_tidak_ada": { default: "Halaman akun tidak tersedia dalam MODE PERAGAAN. Sudut pandang peragaan tidak punya akun, PIN, atau PINTAR ID sendiri.", en: "The account page is not available in DEMONSTRATION MODE. A demonstration point of view has no account, PIN or PINTAR ID of its own." },
  "evaluasi.kembali": { default: "Kembali ke ruang peragaan", en: "Back to the demonstration room" },
  "studio.refused": { default: "Anda tidak memiliki akses ke Studio.", en: "This page is for content staff. Your account does not have access to the Studio yet." },
  "studio.nav.beranda": { default: "Studio", en: "Home" },
  "studio.nav.unggah": { default: "Buat Paket", en: "Create a package" },
  "studio.nav.tinjau": { default: "Antrean Tinjauan", en: "Review queue" },
  "studio.nav.kanonik": { default: "Pustaka PINTAR", en: "PINTAR Library" },
  "studio.nav.definisi": { default: "Aturan Asesmen", en: "Assessment rules" },
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
  "studio.kuis.tidak_tersedia": { default: "Materi Uji Cepat ini sudah tidak tersedia untuk sekolah Anda, jadi Uji Cepat ini tidak bisa dimulai lagi. Pekerjaan murid yang sudah selesai tetap tersimpan.", en: "This Quick Assessment's material is no longer available to your school, so it cannot be started again. Work students have already finished stays saved." },
  "studio.kuis.tanpa_kelas": { default: "Anda belum dipasangkan dengan kelas mana pun.", en: "Your account is not paired with any class yet." },
  "studio.bucket.ACTION_REQUIRED": { default: "Draf yang belum diajukan", en: "Drafts not yet submitted" },
  "studio.bucket.AWAITING_MY_REVIEW": { default: "Menunggu tinjauan Anda", en: "Waiting on your review" },
  "studio.bucket.BLOCKED": { default: "Tertahan", en: "Held" },
  "galat.place_not_a_kelas": { default: "Murid ditempatkan di sebuah Kelas yang aktif.", en: "A student is placed in an active Kelas." },
  "galat.place_not_this_school": { default: "Orang ini tidak tercatat di sekolah ini.", en: "This person is not recorded at this school." },
  "galat.place_staff": { default: "Orang ini memegang peran staf, jadi tidak ditempatkan sebagai murid. Kelas dan kartu kelas hanya untuk murid.", en: "This person holds a staff role, so they are not placed as a student. Classes and class cards are for students only." },
  "galat.place_already_placed": { default: "Murid ini sudah punya kelas. Pindahkan dari kelasnya di bagian atas halaman ini.", en: "This student already has a class. Move them from their class at the top of this page." },
  "galat.place_no_year": { default: "Sekolah ini belum punya tahun ajaran untuk Kelas itu. Buat tahun ajarannya dulu di Struktur sekolah.", en: "This school has no school year for that Kelas yet. Create the year first under School structure." },
  "galat.place_departed": { default: "Murid ini sudah tidak terdaftar di sekolah ini, jadi tidak ditempatkan dari sini. Riwayatnya tetap tersimpan.", en: "This student is no longer enrolled at this school, so they are not placed from here. Their history is kept." },
  "galat.place_elsewhere": { default: "Murid ini sekarang terdaftar di sekolah lain. Ia hanya masuk ke sekolah ini melalui Perpindahan murid.", en: "This student is now enrolled at another school. They join this school only through a student transfer." },
  "audit.kolom.oleh": { default: "Oleh", en: "By" },
  "audit.kolom.alasan": { default: "Alasan", en: "Reason" },
  "audit.oleh.sistem": { default: "Sistem", en: "System" },
  "audit.oleh.tidak_terlihat": { default: "Petugas lain", en: "Another staff member" },
  "audit.oleh.sekolah_lain": { default: "Petugas sekolah lain", en: "Staff member at another school" },
  "audit.berlaku": { default: "berlaku {tanggal}", en: "effective {tanggal}" },
  // K1 (Daisy, TINJAUAN-KENAIKAN-KELAS-DIBANGUN; Sharon «fold, don't hide»): one kenaikan run, one entry
  "audit.kenaikan.bagian": { default: "Termasuk kenaikan kelas {kelas} · {tanggal}; baris utamanya ada di halaman lain.", en: "Part of the year-end promotion of {kelas} · {tanggal}; its main row is on another page." },
  "audit.kenaikan.ringkas": { default: "{n} murid: {rincian}", en: "{n} students: {rincian}" },
  "audit.kenaikan.n.pindah": { default: "{n} mengikuti perpindahan", en: "{n} follow their transfer" },
  "audit.kenaikan.n.keluar": { default: "{n} keluar", en: "{n} left" },
  "audit.kenaikan.n.lulus": { default: "{n} lulus", en: "{n} graduated" },
  "audit.kenaikan.n.tinggal": { default: "{n} tinggal kelas", en: "{n} repeat the year" },
  "audit.kenaikan.n.naik": { default: "{n} naik", en: "{n} up" },
  "audit.kenaikan.terkait": { default: "Catatan terkait ({n})", en: "Related entries ({n})" },
  "audit.kenaikan.terkait_buka": { default: "Buka catatan terkait", en: "Open related entries" },
  "audit.kenaikan.tutup": { default: "Tutup catatan terkait", en: "Close related entries" },
  "audit.kenaikan.tinggal": { default: "tinggal kelas di {kelas}", en: "repeats in {kelas}" },
  "audit.kenaikan.naik": { default: "naik ke {kelas}", en: "up to {kelas}" },
  "audit.kenaikan.judul": { default: "Kenaikan kelas · {kelas} · {dari} → {ke}", en: "Year-end promotion · {kelas} · {dari} → {ke}" },
  "audit.kenaikan.bagian_umum": { default: "Termasuk satu kenaikan kelas; baris utamanya ada di halaman lain.", en: "Part of a year-end promotion; its main row is on another page." },
  "kenaikan.keputusan.naik": { default: "naik kelas", en: "moved up" },
  "kenaikan.keputusan.tinggal": { default: "tinggal kelas", en: "repeats the year" },
  "kenaikan.keputusan.lulus": { default: "lulus", en: "graduated" },
  "kenaikan.keputusan.keluar": { default: "keluar dari sekolah", en: "left the school" },
  "kenaikan.keputusan.pindah": { default: "tetap sampai perpindahan selesai", en: "stays until the transfer is done" },
  "audit.aksi.enrollment.ended_with_reason": { default: "Pendaftaran murid diakhiri", en: "Student enrolment ended" },
  "audit.aksi.enrollment.reopened": { default: "Murid didaftarkan kembali", en: "Student enrolled again" },
  "audit.aksi.promotion.applied": { default: "Kenaikan kelas diterapkan", en: "Promotion applied" },
  "audit.alasan.graduated": { default: "Lulus", en: "Graduated" },
  "audit.alasan.withdrawn": { default: "Mengundurkan diri", en: "Withdrew" },
  "audit.alasan.transfer_external": { default: "Pindah ke sekolah di luar PINTAR", en: "Moved to a school outside PINTAR" },
  "audit.alasan.moved_abroad": { default: "Pindah ke luar negeri", en: "Moved abroad" },
  "audit.alasan.deceased": { default: "Meninggal dunia", en: "Passed away" },
  "audit.alasan.other": { default: "Lainnya", en: "Other" },
  "config.akhiri.buka": { default: "Akhiri pendaftaran", en: "End enrolment" },
  "config.akhiri.judul": { default: "Akhiri pendaftaran", en: "End the enrolment" },
  "config.akhiri.arti": { default: "Murid ini keluar dari kelas dan dari sekolah ini. Asesmen yang masih terbuka diakhiri. Hasil belajar, asesmen dan sertifikatnya tetap tersimpan, dan pencatatan yang keliru dapat dibatalkan dari «Murid yang sudah keluar».", en: "The student leaves the class and this school. Any assessment still open is ended. Their learning results, assessments and certificates stay recorded, and a mistaken record can be undone from «Students who have left»." },
  "config.akhiri.alasan": { default: "Alasan", en: "Reason" },
  "config.akhiri.alasan.graduated": { default: "Lulus", en: "Graduated" },
  "config.akhiri.alasan.withdrawn": { default: "Mengundurkan diri", en: "Withdrew" },
  "config.akhiri.alasan.transfer_external": { default: "Pindah ke sekolah di luar PINTAR", en: "Moved to a school outside PINTAR" },
  "config.akhiri.alasan.moved_abroad": { default: "Pindah ke luar negeri", en: "Moved abroad" },
  "config.akhiri.alasan.deceased": { default: "Meninggal dunia", en: "Passed away" },
  "config.akhiri.alasan.other": { default: "Lainnya (tuliskan penjelasannya)", en: "Other (write the explanation)" },
  "config.akhiri.tanggal": { default: "Berlaku sejak", en: "Effective from" },
  "config.akhiri.keterangan": { default: "Penjelasan (wajib untuk «Lainnya», 10 sampai 300 karakter)", en: "Explanation (required for «Other», 10 to 300 characters)" },
  "config.akhiri.tombol": { default: "Akhiri pendaftaran", en: "End the enrolment" },
  "config.kembali.judul": { default: "Murid yang sudah keluar", en: "Students who have left" },
  "config.kembali.arti": { default: "Membatalkan pencatatan yang keliru mengembalikan murid ke tahun ajaran dan kelasnya semula. Kembali bersekolah mendaftarkannya lagi di kelas yang Anda pilih. Riwayat lamanya tidak diubah.", en: "Undoing a mistaken record returns the student to their school year and class as before. Returning to school enrols them again in the class you choose. Their earlier history is not changed." },
  "config.kembali.di_sekolah_lain": { default: "Murid ini sekarang terdaftar di sekolah lain. Ia kembali ke sekolah ini hanya melalui Perpindahan murid.", en: "This student is now enrolled at another school. They come back to this school only through a student transfer." },
  "config.kembali.jenis": { default: "Jenis", en: "Kind" },
  "config.kembali.jenis.koreksi": { default: "Membatalkan pencatatan yang keliru", en: "Undo a mistaken record" },
  "config.kembali.jenis.kembali": { default: "Kembali bersekolah", en: "Returns to school" },
  "config.kembali.kelas": { default: "Kelas", en: "Class" },
  "config.kembali.kelas_semula": { default: "— Kelas semula (untuk pembatalan) —", en: "— The former class (for undoing) —" },
  "config.kembali.alasan": { default: "Alasan", en: "Reason" },
  "config.kembali.tombol": { default: "Daftarkan kembali", en: "Enrol again" },
  "config.kembali.kosong": { default: "Belum ada murid yang keluar dari sekolah ini.", en: "No student has left this school yet." },
  "config.kembali.akhir.completed": { default: "Lulus", en: "Graduated" },
  "config.kembali.akhir.withdrawn": { default: "Keluar", en: "Left" },
  "config.kembali.akhir.transferred_out": { default: "Pindah sekolah", en: "Transferred" },
  "config.kembali.akhir.expired": { default: "Tahun ajaran selesai", en: "School year ended" },
  "galat.enrolment_ended": { default: "Pendaftaran murid sudah diakhiri. Riwayatnya tetap tersimpan.", en: "The student's enrolment has been ended. Their history stays recorded." },
  "galat.learner_reenrolled": { default: "Murid sudah didaftarkan kembali.", en: "The student has been enrolled again." },
  // Daisy's reconciliation of the build (TINJAUAN-KENAIKAN-KELAS-DIBANGUN, 9 Nov)
  "kenaikan.langkah": { default: "Langkah {n} dari 3", en: "Step {n} of 3" },
  "kenaikan.langkah.kelas": { default: "Pilih kelas", en: "Choose the class" },
  "kenaikan.langkah.keputusan": { default: "Keputusan untuk setiap murid", en: "A decision for each student" },
  "kenaikan.langkah.tinjau": { default: "Tinjau lalu konfirmasi", en: "Review, then confirm" },
  "kenaikan.kelas.sudah": { default: "sudah dinaikkan {tanggal}", en: "already moved up {tanggal}" },
  "kenaikan.selesai.berikut": { default: "Lanjut ke {kelas} (belum diproses)", en: "Continue to {kelas} (not yet processed)" },
  "kenaikan.selesai.sesuai": { default: "Diperiksa dari data PINTAR: semua sesuai.", en: "Checked against PINTAR's data: everything matches." },
  "kenaikan.selesai.tidak_sesuai": { default: "{n} murid tidak sesuai:", en: "{n} student(s) do not match:" },
  "kenaikan.selesai.keputusan": { default: "keputusan", en: "decision" },
  "kenaikan.selesai.tercatat": { default: "tercatat", en: "recorded" },
  "kenaikan.selesai.periksa": { default: "Periksa di Murid di kelas.", en: "Check it in Students in a class." },
  "kenaikan.selesai.guru_kosong": { default: "{n} Kelas tahun {tahun} belum punya guru: {daftar}. Beri perannya di Peran & akses.", en: "{n} class(es) of {tahun} have no teacher yet: {daftar}. Give the role in Roles & access." },
  "kenaikan.tinjau.pengecualian": { default: "Pengecualian", en: "Exceptions" },
  "kenaikan.tinjau.dari_tingkat": { default: "dari Tingkat (belum di kelas)", en: "from the Tingkat (not yet in a class)" },
  "kenaikan.tinjau.kalimat": { default: "{n} murid akan diproses: {ringkas}. Semuanya diterapkan bersama atau tidak sama sekali.", en: "{n} students will be processed: {ringkas}. Everything is applied together or not at all." },
  "kenaikan.guru.ke_peran_tab": { default: "Buka Peran & akses di tab baru", en: "Open Roles & access in a new tab" },
  "kenaikan.guru.tahu_tanpa": { default: "Saya tahu {daftar} belum punya guru, dan akan memberikan perannya di Peran & akses.", en: "I know {daftar} have no teacher yet, and will give the role in Roles & access." },
  "kenaikan.guru.semua_ada": { default: "Semua kelas tujuan sudah punya guru. Saya sudah memeriksanya.", en: "Every destination class has a teacher. I have checked them." },
  "kenaikan.guru.tanpa_tujuan": { default: "Tidak ada kelas tujuan: setiap murid kelas ini lulus atau keluar.", en: "There is no destination class: every student of this class graduates or leaves." },
  "kenaikan.opsi.lulus_grup": { default: "Lulus", en: "Graduates" },
  "kenaikan.opsi.pindah_grup": { default: "Pindah ke sekolah lain di PINTAR", en: "Moves to another school on PINTAR" },
  "kenaikan.hitung.naik": { default: "naik ke {kelas}", en: "up to {kelas}" },
  "kenaikan.hitung.tinggal": { default: "tinggal kelas", en: "repeat the year" },
  "kenaikan.hitung.tinggal_di": { default: "tinggal kelas di {kelas}", en: "repeat the year in {kelas}" },
  "kenaikan.hitung.lulus": { default: "lulus", en: "graduate" },
  "kenaikan.hitung.keluar": { default: "keluar", en: "leave" },
  "kenaikan.hitung.pindah": { default: "mengikuti perpindahan", en: "follow their transfer" },
  "kenaikan.hitung.belum": { default: "belum dipilih", en: "not yet chosen" },
  "kenaikan.hitung.belum_nama": { default: "Belum dipilih:", en: "Not yet chosen:" },
  "kenaikan.murid.pengecualian": { default: "Pengecualian", en: "Exception" },
  "kenaikan.semua.diterapkan": { default: "Diterapkan ke {n} murid; {sisa} tidak diubah karena sudah dipilih, ada di Tingkat, atau sedang pindah.", en: "Applied to {n} students; {sisa} left as they were because already chosen, in the Tingkat, or transferring." },
  "kenaikan.semua.diterapkan_semua": { default: "Diterapkan ke {n} murid.", en: "Applied to {n} students." },
  "kenaikan.berakhir": { default: "Pendaftaran berakhir", en: "Enrolment ended" },
  "kenaikan.berakhir.graduated": { default: "lulus", en: "graduated" },
  "kenaikan.berakhir.withdrawn": { default: "mengundurkan diri", en: "withdrew" },
  "kenaikan.berakhir.transfer_external": { default: "pindah ke sekolah di luar PINTAR", en: "moved to a school outside PINTAR" },
  "kenaikan.berakhir.moved_abroad": { default: "pindah ke luar negeri", en: "moved abroad" },
  "kenaikan.berakhir.deceased": { default: "meninggal dunia", en: "passed away" },
  "kenaikan.berakhir.other": { default: "alasan lain", en: "another reason" },
  "kenaikan.intro": { default: "Pilih satu kelas. Setiap muridnya, juga murid di Tingkat yang sama yang belum punya kelas, mendapat satu keputusan. Anda meninjau hasilnya lalu mengonfirmasi sekali; semuanya diterapkan bersama atau tidak sama sekali.", en: "Choose one class. Each of its students, and any student of the same Tingkat who has no class yet, gets one decision. You review the outcome, then confirm once; everything is applied together or not at all." },
  "kenaikan.kelas.kosong": { default: "Sekolah ini belum punya kelas aktif dengan tahun ajaran. Buat kelasnya di Struktur sekolah.", en: "This school has no active class with a school year yet. Create it in School structure." },
  "kenaikan.kelas.pilih": { default: "Kelas", en: "Class" },
  "kenaikan.pilih": { default: "— Pilih —", en: "— Choose —" },
  "kenaikan.kelas.lanjut": { default: "Lanjut", en: "Continue" },
  "kenaikan.tahun.belum_ada": { default: "Belum ada tahun ajaran berikutnya untuk sekolah ini. Buat Tingkat dan kelasnya untuk tahun depan lebih dulu.", en: "There is no next school year for this school yet. Create next year's Tingkat and classes first." },
  "kenaikan.tahun.ke_struktur": { default: "Buka Struktur sekolah", en: "Open School structure" },
  "kenaikan.tahun.label": { default: "Tahun ajaran baru", en: "New school year" },
  "kenaikan.semua.label": { default: "Naikkan semua ke", en: "Move everyone up to" },
  "kenaikan.semua.tidak": { default: "— Pilih satu per satu —", en: "— Choose one by one —" },
  "kenaikan.semua.terapkan": { default: "Terapkan", en: "Apply" },
  "kenaikan.murid.kosong": { default: "Kelas ini tidak punya murid yang terdaftar, dan Tingkatnya tidak punya murid tanpa kelas.", en: "This class has no enrolled student, and its Tingkat has no student without a class." },
  "kenaikan.murid.intro": { default: "{n} murid. Setiap murid perlu satu keputusan sebelum hasilnya dapat ditinjau.", en: "{n} students. Each student needs one decision before the outcome can be reviewed." },
  "kenaikan.murid.tingkat_saja": { default: "Di Tingkat, belum di kelas", en: "In the Tingkat, not yet in a class" },
  "kenaikan.murid.sedang_pindah": { default: "Perpindahan sedang berjalan", en: "Transfer under way" },
  "kenaikan.murid.asesmen_terbuka": { default: "Asesmen masih terbuka", en: "Assessment still open" },
  "kenaikan.murid.keputusan_untuk": { default: "Keputusan untuk", en: "Decision for" },
  "kenaikan.murid.tinjau": { default: "Tinjau hasil", en: "Review the outcome" },
  "kenaikan.opsi.naik_grup": { default: "Naik kelas", en: "Moves up" },
  "kenaikan.opsi.naik": { default: "Naik ke {kelas}", en: "Up to {kelas}" },
  "kenaikan.opsi.tinggal_grup": { default: "Tinggal kelas", en: "Repeats the year" },
  "kenaikan.opsi.tinggal": { default: "Tinggal kelas di {kelas}", en: "Repeats in {kelas}" },
  "kenaikan.opsi.lulus": { default: "Lulus", en: "Graduates" },
  "kenaikan.opsi.keluar_grup": { default: "Keluar dari sekolah", en: "Leaves the school" },
  "kenaikan.opsi.pindah": { default: "Ikut perpindahan yang sedang berjalan", en: "Follows the transfer under way" },
  "kenaikan.alasan.withdrawn": { default: "Keluar: mengundurkan diri", en: "Leaves: withdrew" },
  "kenaikan.alasan.transfer_external": { default: "Keluar: pindah ke sekolah di luar PINTAR", en: "Leaves: moved to a school outside PINTAR" },
  "kenaikan.alasan.moved_abroad": { default: "Keluar: pindah ke luar negeri", en: "Leaves: moved abroad" },
  "kenaikan.alasan.deceased": { default: "Keluar: meninggal dunia", en: "Leaves: passed away" },
  "kenaikan.tinjau.judul": { default: "Hasil yang akan diterapkan", en: "The outcome to be applied" },
  "kenaikan.tinjau.intro": { default: "Belum ada yang berubah. Inilah hasil untuk setiap murid ke tahun ajaran {tahun}.", en: "Nothing has changed yet. This is the outcome for each student into school year {tahun}." },
  "kenaikan.tinjau.konfirmasi": { default: "Konfirmasi kenaikan kelas", en: "Confirm the promotion" },
  "kenaikan.tinjau.ubah": { default: "Ubah keputusan", en: "Change the decisions" },
  "kenaikan.guru.judul": { default: "Penugasan guru", en: "Teacher assignments" },
  "kenaikan.guru.intro": { default: "Penugasan guru tidak ikut pindah ke tahun ajaran baru. Tinjau siapa yang akan mengajar kelas tujuan, lalu ubah di Peran & akses bila perlu.", en: "Teacher assignments do not move to the new school year. Review who will teach the destination classes, and change them in Roles & access if needed." },
  "kenaikan.guru.tidak_ada": { default: "belum ada guru", en: "no teacher yet" },
  "kenaikan.guru.ke_peran": { default: "Buka Peran & akses", en: "Open Roles & access" },
  "kenaikan.hasil.naik": { default: "Naik ke {kelas}", en: "Up to {kelas}" },
  "kenaikan.hasil.tinggal": { default: "Tinggal kelas di {kelas}", en: "Repeats in {kelas}" },
  "kenaikan.hasil.lulus": { default: "Lulus", en: "Graduates" },
  "kenaikan.hasil.keluar": { default: "Keluar dari sekolah", en: "Leaves the school" },
  "kenaikan.hasil.pindah": { default: "Tetap di kelasnya sampai perpindahan selesai", en: "Stays in the class until the transfer is done" },
  "kenaikan.hasil.asesmen": { default: "{n} asesmen yang masih terbuka diakhiri; jawabannya tetap tersimpan", en: "{n} open assessment(s) ended; the answers are kept" },
  "kenaikan.selesai.ok": { default: "Selesai. {n} murid diproses pada {waktu}. Inilah hasil untuk setiap murid.", en: "Done. {n} students processed at {waktu}. This is the outcome for each student." },
  "kenaikan.selesai.judul": { default: "Hasil kenaikan kelas", en: "Promotion outcome" },
  "kenaikan.selesai.tidak_terbaca": { default: "Hasilnya belum dapat dibaca. Buka Jejak audit untuk melihat apa yang tercatat.", en: "The outcome cannot be read yet. Open the audit trail to see what was recorded." },
  "kenaikan.selesai.lagi": { default: "Pilih kelas lain", en: "Choose another class" },
  "kenaikan.akhir.completed": { default: "Lulus", en: "Graduated" },
  "kenaikan.akhir.withdrawn": { default: "Keluar", en: "Left" },
  "kenaikan.akhir.transferred_out": { default: "Pendaftaran berakhir", en: "Enrolment ended" },
  "kenaikan.akhir.expired": { default: "Tahun ajaran selesai", en: "School year ended" },
  "galat.promo_changed": { default: "Kelas ini sudah berubah sejak ditinjau. Buka lagi daftar muridnya dan tinjau ulang.", en: "This class has changed since it was reviewed. Open its list of students again and review it." },
  "galat.promo_undecided": { default: "Masih ada murid yang belum mendapat keputusan.", en: "Some students do not have a decision yet." },
  "galat.promo_teachers_unreviewed": { default: "Tandai bahwa penugasan guru sudah ditinjau sebelum mengonfirmasi.", en: "Mark that the teacher assignments were reviewed before confirming." },
  "galat.promo_year_invalid": { default: "Tahun ajaran baru harus tahun ajaran berikutnya di sekolah ini.", en: "The new school year must be a later school year of this school." },
  "galat.promo_decision_invalid": { default: "Ada keputusan yang tidak dikenal. Pilih lagi untuk murid itu.", en: "A decision is not recognised. Choose again for that student." },
  "galat.promo_target_invalid": { default: "Kelas tujuan harus kelas aktif tahun ajaran baru di sekolah ini.", en: "The destination must be an active class of the new school year at this school." },
  "galat.promo_no_transfer": { default: "«Ikut perpindahan yang sedang berjalan» hanya untuk murid yang perpindahannya sedang berjalan.", en: "«Follows the transfer under way» is only for a student whose transfer is under way." },
  "galat.promo_already_in_year": { default: "Ada murid yang sudah terdaftar di tahun ajaran baru.", en: "A student is already enrolled in the new school year." },
  "galat.promo_run_incomplete": { default: "Kenaikan kelas ini tidak diterapkan: catatannya tidak lengkap. Tidak ada yang berubah. Coba lagi; bila terulang, laporkan masalah ini.", en: "This year-end promotion was not applied: its record was incomplete. Nothing has changed. Try again; if it happens again, report the problem." },
  "galat.enrol_not_live": { default: "Pendaftaran ini sudah berakhir.", en: "This enrolment has already ended." },
  "galat.enrol_reason_invalid": { default: "Pilih salah satu alasan yang tersedia.", en: "Choose one of the listed reasons." },
  "galat.enrol_explanation_required": { default: "Alasan «Lainnya» perlu penjelasan 10 sampai 300 karakter. Penjelasan apa pun paling banyak 300 karakter.", en: "«Other» needs an explanation of 10 to 300 characters. Any explanation is at most 300 characters." },
  "galat.enrol_date_invalid": { default: "Tanggal berlaku paling lambat hari ini, dan tidak sebelum pendaftaran dimulai.", en: "The effective date is today or earlier, and not before the enrolment began." },
  "galat.enrol_sitting_open": { default: "Murid ini masih punya asesmen yang sedang berjalan. Asesmen itu perlu dikumpulkan atau diakhiri dulu.", en: "This student still has an assessment in progress. It must be submitted or ended first." },
  "galat.enrol_kind_invalid": { default: "Pilih jenisnya: membatalkan pencatatan yang keliru, atau kembali bersekolah.", en: "Choose the kind: undo a mistaken record, or a return to school." },
  "galat.enrol_reason_required": { default: "Tuliskan alasannya, paling banyak 300 karakter.", en: "Write the reason, at most 300 characters." },
  "galat.enrol_not_correctable": { default: "Hanya pencatatan keluar terakhir di sekolah ini, yang belum dibatalkan, yang dapat dibatalkan.", en: "Only the latest departure recorded at this school, not yet undone, can be undone." },
  "galat.enrol_not_ended": { default: "Pendaftaran ini belum berakhir, jadi tidak ada yang perlu dibatalkan.", en: "This enrolment has not ended, so there is nothing to undo." },
  "galat.enrol_already_live": { default: "Murid ini sudah terdaftar di sekolah ini.", en: "This student is already enrolled at this school." },
  // Sharon F5: the correction is offered only while the ending's school year runs
  "galat.enrol_year_closed": { default: "Tahun ajaran pendaftaran ini sudah berakhir, jadi pencatatannya tidak dibatalkan. Daftarkan murid ini kembali melalui «Kembali bersekolah».", en: "The school year of this enrolment has ended, so its record is not undone. Re-enrol this student through «Returns to school»." },
  "galat.enrol_not_departed": { default: "Murid ini belum pernah terdaftar di sekolah ini. Tempatkan ia ke kelas, bukan didaftarkan kembali.", en: "This student has never been enrolled at this school. Place them in a class instead of re-enrolling them." },
  "galat.learner_placed": { default: "Murid sudah ditempatkan di kelas.", en: "The student has been placed in the class." },
  "config.tempatkan.judul": { default: "Murid yang belum punya kelas", en: "Students without a class" },
  "config.tempatkan.arti": { default: "Murid ini dicatat tanpa kelas, jadi belum bisa menerima materi. Pilih kelasnya. Orangnya, nomor registrasi sekolah, dan akunnya tetap sama.", en: "These students were recorded without a class, so no material can reach them yet. Choose their class. The person, their school registration number and their account stay the same." },
  "config.tempatkan.kosong": { default: "Semua murid sudah punya kelas.", en: "Every student has a class." },
  "config.tempatkan.tombol": { default: "Masukkan ke kelas", en: "Place in class" },
  "config.tempatkan.ke": { default: "Kelas", en: "Class" },
  "studio.bucket.RELEASE_STEP": { default: "Menunggu langkah terbitan dari Anda", en: "Waiting for your release step" },
  "studio.bucket.QUESTION_HEALTH": { default: "Sinyal mutu soal", en: "Item quality signals" },
  "studio.bucket.DISTRIBUTED_CANONICAL": { default: "Pustaka PINTAR untuk sekolah Anda", en: "PINTAR Library for your school" },
  "studio.state.READY": { default: "Siap", en: "Ready" },
  "studio.state.ACTION_REQUIRED": { default: "Perlu tindakan", en: "Needs action" },
  "studio.state.BLOCKED": { default: "Tertahan", en: "Held" },
  "studio.state.explain.READY": { default: "Paket ini siap diterbitkan.", en: "This package is ready to publish." },
  "studio.state.explain.ACTION_REQUIRED": { default: "Ada yang bisa Anda selesaikan sekarang di Studio.", en: "There is something you can finish now in the Studio." },
  "studio.state.MENUNGGU": { default: "Menunggu orang lain", en: "Waiting on someone else" },
  "studio.state.explain.MENUNGGU": { default: "Langkah berikutnya, «{langkah}», diambil oleh {siapa}. PINTAR tidak mengirim pemberitahuan: beri tahu mereka bahwa paket ini menunggu.", en: "The next step, «{langkah}», is taken by {siapa}. PINTAR sends no notification: let them know this package is waiting." },
  "studio.state.explain.BLOCKED": { default: "Ada yang harus diperbaiki pada isinya sebelum paket ini bisa lanjut.", en: "Something in the content must be fixed before this package can go further." },
  "studio.paket.judul": { default: "Paket Pembelajaran", en: "Learning Package" },
  "studio.paket.alasan": { default: "Yang perlu diselesaikan", en: "What needs finishing" },
  "studio.paket.pratinjau": { default: "Lihat seperti murid", en: "See it as a student" },
  "studio.paket.setujui": { default: "Setujui", en: "Approve" },
  "studio.paket.kunci": { default: "Setujui & Kunci", en: "Approve & lock" },
  "studio.paket.kunci_peringatan": { default: "Setelah dikunci, isi paket ini tidak dapat diubah lagi. Perbaikan berikutnya dibuat sebagai salinan baru.", en: "Once locked, this package's content cannot be changed again. A later correction is made as a new copy." },
  "studio.paket.terbitkan": { default: "Terbitkan", en: "Publish" },
  "studio.paket.tarik": { default: "Tarik dari peredaran", en: "Withdraw from circulation" },
  "studio.paket.terbit_bukan_tugas": { default: "Menerbitkan belum menyediakan. Murid baru melihatnya setelah guru menyediakannya untuk kelas.", en: "Publishing is not making available. Students see it only once a teacher makes it available to a class." },
  "studio.paket.revisi": { default: "Perbaiki paket ini", en: "Correct this package" },
  "studio.paket.revisi_terbaru": { default: "Paket ini sudah diperbaiki. Buka perbaikannya; materi baru untuk kelas memakai perbaikan itu", en: "This package has been corrected. Open the correction; new learning for classes uses it" },
  "studio.paket.revisi_penjelasan": { default: "Perbaiki buku kerjanya, lalu unggah sebagai perbaikan paket ini. Paket asli tetap utuh beserta seluruh catatan pengerjaan murid; perbaikan menjadi versi berikutnya, ditinjau dan diterbitkan seperti biasa.", en: "Correct the workbook, then upload it as a correction of this package. The original stays whole, with every record of student work; the correction becomes the next version, reviewed and published as usual." },
  "studio.paket.revisi_sebelum": { default: "Perbaikan dari versi sebelumnya", en: "A correction of the previous version" },
  "studio.paket.revisi_unggah": { default: "Unggah buku kerja perbaikan", en: "Upload the corrected workbook" },
  "studio.paket.riwayat.judul": { default: "Riwayat perbaikan", en: "Correction history" },
  "studio.paket.riwayat.asli": { default: "Versi pertama", en: "First version" },
  "studio.paket.riwayat.belum_terbit": { default: "belum terbit", en: "not yet published" },
  // A5 B9 (D-173): the never-released first version has a name; pending copy approval
  "studio.paket.riwayat.versi_pertama": { default: "Versi pertama", en: "First version" },
  "studio.paket.riwayat.oleh": { default: "oleh", en: "by" },
  "studio.paket.riwayat.ini": { default: "halaman ini", en: "this page" },
  "studio.paket.riwayat.buka": { default: "Buka", en: "Open" },
  "studio.paket.kosong": { default: "Belum ada paket di sini.", en: "There is nothing here yet." },
  "studio.beranda.tak_ada_tugas": { default: "Tidak ada yang menunggu tindakan Anda di Studio.", en: "Nothing in the Studio is waiting for you." },
  "studio.state.explain.TERBIT": { default: "Paket ini sudah terbit. Guru dapat menyediakannya untuk kelas mereka.", en: "This package is published. Teachers can make it available to their classes." },
  // polish batch 2 (UX-14): the section is named what both steps call it
  "studio.temuan.judul": { default: "Temuan", en: "Findings" },
  // A5 B11 (D-173): said to the author only; pending copy approval
  "studio.temuan.orang_kedua": { default: "Temuan ditinjau oleh orang kedua, bukan oleh penyusun paket.", en: "Findings are reviewed by a second person, not by the package's author." },
  "studio.temuan.lokasi": { default: "Lokasi", en: "Where" },
  "studio.temuan.mengapa": { default: "Mengapa penting", en: "Why it matters" },
  "studio.temuan.cara": { default: "Cara memperbaiki", en: "How to fix it" },
  "studio.temuan.akui": { default: "Sudah saya tinjau", en: "I have reviewed this" },
  "studio.temuan.kelompok.jumlah": { default: "temuan", en: "findings" },
  "studio.temuan.kelompok.lokasi": { default: "Lihat lokasinya", en: "See where" },
  "studio.temuan.akui_semua": { default: "Sudah saya tinjau semuanya", en: "I have reviewed all of these" },
  "studio.temuan.perbaiki_dulu": { default: "Temuan ini diperbaiki di isinya, lalu pemeriksaan dijalankan lagi; tidak bisa sekadar diakui.", en: "These are fixed in the content and the check run again; they cannot just be acknowledged." },
  "studio.temuan.kosong": { default: "Tidak ada catatan mutu yang menunggu.", en: "No quality notes are waiting." },
  "studio.unggah.judul": { default: "Buat Paket Pembelajaran", en: "Create a Learning Package" },
  "studio.unggah.mudah": { default: "Unggah Mudah", en: "Easy upload" },
  "studio.unggah.mudah_penjelasan": { default: "Tempel paket JSON dari sistem lain. PINTAR memeriksanya dan menanyakan yang belum pasti sebelum menyimpan apa pun.", en: "Paste a JSON package from another system. PINTAR checks it and asks about anything unclear before it saves anything." },
  "studio.unggah.terstruktur": { default: "Paket Terstruktur", en: "Structured package" },
  "studio.unggah.terstruktur_penjelasan": { default: "Untuk paket yang sudah dibuat mesin dalam format baku.", en: "For packages a machine has already produced in a standard format." },
  "studio.unggah.buat_video": { default: "Buat Video", en: "Create a Video" },
  "studio.unggah.pertanyaan": { default: "Yang perlu Anda pastikan", en: "What we need you to confirm" },
  "studio.unggah.konfirmasi": { default: "Konfirmasi", en: "Confirm" },
  // DAISY-06: the workbook template's guidance sheet and the upload panel.
  "studio.templat.judul": { default: "Templat pelajaran PINTAR: cara mengisi", en: "PINTAR lesson template: how to fill it in" },
  "studio.templat.cara.1": { default: "Satu buku kerja berisi satu kursus. Isi lima lembar berikutnya: Kursus, Bab, Pelajaran, Soal, dan Pilihan.", en: "One workbook holds one course. Fill in the next five sheets: Kursus, Bab, Pelajaran, Soal and Pilihan." },
  "studio.templat.cara.2": { default: "Baris 1 di setiap lembar adalah judul kolom. Jangan mengubah, menghapus, atau memindahkannya. Isi data mulai baris 2.", en: "Row 1 of every sheet holds the column headers. Do not change, delete or move them. Enter data from row 2." },
  "studio.templat.cara.3": { default: "Kolom bertanda Wajib harus diisi di setiap baris. Kolom yang punya daftar pilihan hanya menerima nilai dari daftar itu.", en: "Columns marked Wajib must be filled in on every row. A column with a list of choices accepts only a value from that list." },
  "studio.templat.cara.4": { default: "Setiap soal perlu pilihan jawaban di lembar Pilihan, dengan kode soal yang sama. Setiap pilihan perlu alasannya.", en: "Every question needs its answer choices on the Pilihan sheet, under the same question code. Every choice needs its reason." },
  "studio.templat.cara.5": { default: "Berkas media (gambar, audio, video, PDF) tidak dimasukkan ke buku kerja. Tulis nama berkasnya di kolom Media, lalu unggah berkasnya di Studio setelah buku kerja diperiksa.", en: "Media files (images, audio, video, PDF) are not put in the workbook. Write each file's name in the Media column, then upload the files in Studio after the workbook is checked." },
  // DAISY-15 follow-up (coordinator, 27 Sep): Excel draws a long Text cell as ####; say so where the teacher reads first.
  "studio.templat.cara.6": { default: "Kolom teks menyimpan isian persis seperti diketik. Di Excel, sel teks yang berisi lebih dari 255 karakter (misalnya Isi pelajaran) tampil sebagai ####. Isinya tetap utuh dan tetap terbaca oleh PINTAR; klik selnya untuk melihat isinya di bilah rumus.", en: "Text columns keep what is typed exactly as typed. In Excel, a text cell holding more than 255 characters (Isi pelajaran, for example) shows as ####. Its content is kept whole and PINTAR still reads it; click the cell to see it in the formula bar." },
  "studio.templat.kolom.lembar": { default: "Lembar", en: "Sheet" },
  "studio.templat.kolom.kolom": { default: "Kolom", en: "Column" },
  "studio.templat.kolom.wajib": { default: "Wajib", en: "Required" },
  "studio.templat.kolom.pilihan": { default: "Pilihan yang diterima", en: "Accepted choices" },
  "studio.templat.kolom.batas": { default: "Batas", en: "Limit" },
  "studio.templat.kolom.arti": { default: "Keterangan", en: "Notes" },
  "studio.templat.ya": { default: "Ya", en: "Yes" },
  "studio.templat.tidak": { default: "Tidak", en: "No" },
  "studio.templat.batas.judul": { default: "Batas lain", en: "Other limits" },
  "studio.templat.batas.berkas": { default: "Ukuran buku kerja", en: "Workbook size" },
  "studio.templat.batas.kursus": { default: "Kursus", en: "Courses" },
  "studio.templat.batas.baris": { default: "Baris per lembar", en: "Rows per sheet" },
  "studio.templat.batas.pelajaran": { default: "Pelajaran", en: "Lessons" },
  "studio.templat.batas.soal": { default: "Soal", en: "Questions" },
  "studio.templat.batas.pilihan": { default: "Pilihan per soal", en: "Choices per question" },
  "studio.templat.batas.media": { default: "Media", en: "Media" },
  "studio.templat.batas.transkrip": { default: "Transkrip", en: "Transcripts" },
  "studio.templat.paling_besar": { default: "Paling besar", en: "At most" },
  "studio.templat.paling_banyak": { default: "Paling banyak", en: "At most" },
  "studio.templat.satu_kursus": { default: "Satu kursus per buku kerja: satu baris data di lembar Kursus.", en: "One course per workbook: one data row on the Kursus sheet." },
  "studio.templat.baris_termasuk_judul": { default: "baris, termasuk baris judul", en: "rows, the header row included" },
  "studio.templat.berlabel": { default: "berlabel", en: "labelled" },
  "studio.templat.media.gambar": { default: "Gambar", en: "Images" },
  "studio.templat.media.audio": { default: "audio", en: "audio" },
  "studio.templat.media.video": { default: "video", en: "video" },
  "studio.templat.nama_media": { default: "Nama berkas paling panjang", en: "File names at most" },
  "studio.templat.karakter": { default: "karakter", en: "characters" },
  "studio.templat.transkrip_wajib": { default: "Audio dan video wajib punya transkrip, di kolom Transkrip lembar Pelajaran.", en: "Audio and video must have a transcript, in the Transkrip column of the Pelajaran sheet." },
  "studio.unggah.buku.judul": { default: "Unggah buku kerja pelajaran", en: "Upload a lesson workbook" },
  "studio.unggah.buku.arti": { default: "Isi templat Excel, lalu unggah di sini. PINTAR memeriksa setiap baris lebih dulu dan tidak menyimpan apa pun sebelum semuanya benar.", en: "Fill in the Excel template, then upload it here. PINTAR checks every row first and saves nothing until everything is right." },
  "studio.unggah.templat": { default: "Unduh templat Excel", en: "Download the Excel template" },
  "studio.unggah.templat_arti": { default: "Lembar Cara mengisi di dalamnya menjelaskan setiap kolom dan batasnya.", en: "Its Cara mengisi sheet explains every column and its limits." },
  "studio.unggah.contoh": { default: "Unduh contoh isian", en: "Download a filled-in example" },
  "studio.unggah.contoh_arti": { default: "Templat yang sama, sudah terisi satu bab contoh agar terlihat cara mengisi setiap lembar. Isinya karangan untuk contoh ini saja: bukan materi sekolah dan bukan soal yang dikerjakan murid.", en: "The same template, filled with one example chapter so you can see how each sheet is filled in. Its content is made up for this example alone: it is not school material and not questions students take." },
  "studio.unggah.sekolah": { default: "Sekolah", en: "School" },
  "studio.unggah.tanpa_sekolah": { default: "Anda belum dapat menyusun materi di sekolah mana pun.", en: "You cannot prepare material for any school yet." },
  "studio.unggah.berkas": { default: "Buku kerja (.xlsx)", en: "Workbook (.xlsx)" },
  "studio.unggah.berkas_batas": { default: "Paling besar", en: "At most" },
  "studio.unggah.revisi": { default: "Perbaikan dari paket yang sudah ada?", en: "A correction of an existing package?" },
  "studio.unggah.revisi_bukan": { default: "Bukan, ini paket baru", en: "No, this is a new package" },
  "studio.unggah.revisi_arti": { default: "Paket asli dan semua catatan murid tetap utuh. Perbaikan menjadi versi berikutnya, ditinjau dan diterbitkan seperti biasa; setelah terbit, materi baru untuk kelas memakai versi itu.", en: "The original package and every student record stay whole. The correction becomes the next version, reviewed and published as usual; once published, new learning for classes uses it." },
  "studio.unggah.ringkasan": { default: "Apa yang diperbaiki, dan mengapa", en: "What was corrected, and why" },
  "studio.unggah.ringkasan_arti": { default: "Dicatat di riwayat perbaikan paket, dengan nama Anda dan tanggalnya.", en: "Kept in the package's correction history, with your name and the date." },
  "studio.unggah.langkah.periksa": { default: "Periksa buku kerja", en: "Check the workbook" },
  "studio.unggah.langkah.media": { default: "Unggah media", en: "Upload the media" },
  "studio.unggah.langkah.simpan": { default: "Simpan ke Studio", en: "Save to Studio" },
  "studio.unggah.sibuk.periksa": { default: "Memeriksa…", en: "Checking…" },
  "studio.unggah.sibuk.media": { default: "Mengunggah…", en: "Uploading…" },
  "studio.unggah.sibuk.simpan": { default: "Menyimpan…", en: "Saving…" },
  "studio.unggah.lolos": { default: "Buku kerja lolos pemeriksaan.", en: "The workbook passed the check." },
  "studio.unggah.hitung.courses": { default: "Paket", en: "Packages" },
  "studio.unggah.hitung.modules": { default: "Bab", en: "Chapters" },
  "studio.unggah.hitung.lessons": { default: "Pelajaran", en: "Lessons" },
  "studio.unggah.hitung.items": { default: "Soal", en: "Questions" },
  "studio.unggah.hitung.options": { default: "Pilihan", en: "Choices" },
  "studio.unggah.hitung.media": { default: "Media", en: "Media files" },
  "studio.unggah.masalah_judul": { default: "Belum ada yang disimpan. Perbaiki baris berikut di buku kerja, lalu periksa lagi.", en: "Nothing has been saved. Fix these rows in the workbook, then check it again." },
  "studio.unggah.lokasi.lembar": { default: "Lembar", en: "Sheet" },
  "studio.unggah.lokasi.baris": { default: "baris", en: "row" },
  "studio.unggah.lokasi.kolom": { default: "kolom", en: "column" },
  "studio.unggah.lokasi.berkas": { default: "berkas", en: "file" },
  "studio.unggah.masalah_lain": { default: "masalah lain; perbaiki yang di atas dulu, lalu periksa lagi.", en: "more problems; fix the ones above first, then check again." },
  "studio.unggah.media_arti": { default: "Buku kerja ini menyebut berkas media berikut. Pilih semuanya sekaligus; PINTAR mencocokkannya menurut nama berkas.", en: "This workbook names the media files below. Choose them all at once; PINTAR matches them by file name." },
  "studio.unggah.media_pilih": { default: "Pilih berkas media", en: "Choose the media files" },
  "studio.unggah.media.belum": { default: "Belum dipilih", en: "Not chosen yet" },
  "studio.unggah.media.siap": { default: "Siap diunggah", en: "Ready to upload" },
  "studio.unggah.media.naik": { default: "Mengunggah…", en: "Uploading…" },
  "studio.unggah.media.selesai": { default: "Terunggah", en: "Uploaded" },
  "studio.unggah.media.gagal": { default: "Gagal diunggah. Coba lagi.", en: "The upload failed. Try again." },
  "studio.unggah.media_progres": { default: "berkas terunggah", en: "files uploaded" },
  "studio.unggah.simpan_arti": { default: "Semuanya siap. Simpan sebagai draf di Studio; murid belum melihatnya sebelum diterbitkan.", en: "Everything is ready. Save it as a draft in Studio; students do not see it until it is published." },
  "studio.unggah.tersimpan": { default: "Tersimpan di Studio sebagai draf.", en: "Saved to Studio as a draft." },
  "studio.unggah.buka_kursus": { default: "Buka paket", en: "Open the package" },
  "studio.unggah.ulang": { default: "Unggah buku kerja lain", en: "Upload another workbook" },
  "studio.unggah.rujukan": { default: "Rujukan:", en: "Reference:" },
  // polish batch 2 (UX-12): the two JSON forms sit in one closed disclosure below the workbook, each with its own button
  "studio.unggah.json_judul": { default: "Untuk sistem lain: paket JSON", en: "For other systems: JSON packages" },
  "studio.unggah.json_arti": { default: "Untuk paket yang dibuat sistem lain. Guru dan sekolah memakai buku kerja di atas.", en: "For packages another system produces. Teachers and schools use the workbook above." },
  "studio.unggah.isi_json": { default: "Isi paket (JSON)", en: "Package content (JSON)" },
  "studio.unggah.periksa_mudah": { default: "Periksa paket JSON", en: "Check the JSON package" },
  "studio.unggah.periksa_terstruktur": { default: "Periksa paket terstruktur", en: "Check the structured package" },
  "studio.unggah.produsen": { default: "Sistem pengirim", en: "Sending system" },
  "studio.unggah.kontrak": { default: "Kontrak kemampuan", en: "Capability contract" },
  "studio.unggah.permintaan": { default: "Nomor permintaan", en: "Request ID" },
  "studio.tinjau.judul": { default: "Antrean Tinjauan", en: "Review Queue" },
  "studio.tinjau.kosong": { default: "Tidak ada yang menunggu tinjauan Anda.", en: "Nothing is waiting on your review." },
  "studio.tinjau.penulis": { default: "Penyusun", en: "Author" },
  "studio.tinjau.bukan_penulis": { default: "Anda menyusun bagian ini, jadi orang lain yang meninjaunya.", en: "You wrote this part, so somebody else reviews it." },
  "studio.kanonik.judul": { default: "Pustaka PINTAR", en: "PINTAR Library" },
  // W2.14 (UX-19): giving a package to a class has one verb, «menyediakan untuk kelas», as Siapkan → Sediakan and studio.langkah.terbitkan.arti say it
  "studio.kanonik.penjelasan": { default: "Paket yang disusun PINTAR dan diizinkan untuk sekolah Anda. Bisa disediakan untuk kelas, tidak bisa disunting.", en: "Packages PINTAR wrote and opened to your school. They can be made available to classes; they cannot be edited." },
  "studio.kanonik.kosong": { default: "Belum ada paket PINTAR yang diizinkan untuk sekolah Anda.", en: "No PINTAR package has been opened to your school yet." },
  "studio.kanonik.ditarik": { default: "Izin untuk paket ini sudah berakhir. Murid yang sedang mengerjakan tetap bisa menyelesaikannya; pengerjaan baru tidak dibuka lagi.", en: "The permission for this package has ended. Students already working on it can finish; no new attempt opens." },
  "studio.kanonik.hanya_baca": { default: "Hanya dapat dibaca dan disediakan untuk kelas.", en: "Readable, and can be made available to classes only." },
  // W1.14 (Batch 3): a lesson's two counts each say what they count, never «3 · 8»
  "studio.kanonik.unit.tujuan": { default: "tujuan pembelajaran", en: "learning objectives" },
  "studio.definisi.judul": { default: "Aturan Asesmen", en: "Assessment Rules" },
  "studio.definisi.batas": { default: "Batas yang berlaku", en: "The thresholds in force" },
  "studio.definisi.simpan": { default: "Simpan", en: "Save" },
  "studio.definisi.versi_baru": { default: "Perubahan ini mengubah cara hasil dibaca, jadi tersimpan sebagai aturan baru. Hasil lama tetap dibaca dengan aturan lamanya.", en: "This change alters how results are read, so it is saved as a new rule. Older results keep being read under their own rule." },
  "studio.definisi.tetap": { default: "Nama diperbarui. Cara hasil dibaca tidak berubah.", en: "The name is updated. How results are read has not changed." },
  "studio.integritas.judul": { default: "Tinjauan Integritas", en: "Integrity Review" },
  "studio.integritas.penjelasan": { default: "Catatan ini bahan pertimbangan manusia, bukan kesimpulan tentang murid.", en: "These notes are material for a human to weigh, not a conclusion about a student." },
  "studio.integritas.menunggu_lain": { default: "Di departemen lain, {n} catatan menunggu tinjauan Kepala departemennya.", en: "In other departments, {n} notes are waiting for their head of department's review." },
  "studio.integritas.menunggu_lain_satu": { default: "Di departemen lain, 1 catatan menunggu tinjauan Kepala departemennya.", en: "In another department, 1 note is waiting for its head of department's review." },
  "studio.integritas.kosong": { default: "Tidak ada catatan yang menunggu tinjauan Anda.", en: "No note is waiting for your review." },
  "studio.integritas.NO_CONCERN": { default: "Tidak ada yang perlu ditindaklanjuti", en: "Nothing to follow up" },
  "studio.integritas.DISCUSSED_WITH_LEARNER": { default: "Sudah dibicarakan dengan murid", en: "Discussed with the student" },
  "studio.integritas.REFERRED_TO_INSTITUTION": { default: "Diteruskan ke pihak sekolah", en: "Passed to the school" },
  "studio.integritas.catat": { default: "Catat tinjauan", en: "Record the review" },
  "studio.integritas.menunggu.judul": { default: "Menunggu tinjauan", en: "Waiting for review" },
  "studio.integritas.ditinjau.judul": { default: "Sudah ditinjau", en: "Reviewed" },
  "studio.integritas.ditinjau.kosong": { default: "Belum ada catatan yang sudah ditinjau.", en: "No note has been reviewed yet." },
  "studio.integritas.keadaan.menunggu": { default: "Menunggu tinjauan", en: "Waiting for review" },
  "studio.integritas.keadaan.ditinjau": { default: "Sudah ditinjau", en: "Reviewed" },
  "studio.integritas.catatan.arti": { default: "Apa yang Anda lihat atau lakukan. Dicatat bersama tinjauannya.", en: "What you saw or did. Recorded with the review." },
  "studio.integritas.oleh": { default: "Ditinjau oleh {nama}, {waktu}", en: "Reviewed by {nama}, {waktu}" },
  "studio.integritas.catatan_tercatat": { default: "Catatan:", en: "Note:" },
  "studio.integritas.rujukan.judul": { default: "Langkah kasus yang diteruskan", en: "Steps of the referred case" },
  "studio.integritas.rujukan.langkah.diteruskan": { default: "Diteruskan", en: "Referred" },
  "studio.integritas.rujukan.langkah.ditinjau": { default: "Ditinjau pimpinan", en: "Taken up by a leader" },
  "studio.integritas.rujukan.langkah.diputuskan": { default: "Diputuskan", en: "Decided" },
  "studio.integritas.rujukan.hasil": { default: "Keputusan: {hasil}", en: "Decision: {hasil}" },
  "studio.integritas.rujukan.hasil.NO_FURTHER_ACTION": { default: "Tidak ada tindakan lanjutan", en: "No further action" },
  "studio.integritas.rujukan.hasil.LEARNER_SUPPORT_ARRANGED": { default: "Pendampingan disiapkan", en: "Student support arranged" },
  "studio.integritas.rujukan.hasil.ESCALATED_TO_INSTITUTION": { default: "Diteruskan ke pihak sekolah", en: "Escalated to the school" },
  "studio.integritas.rujukan.catatan": { default: "Catatan keputusan:", en: "Decision note:" },
  "studio.integritas.rujukan.sedang": { default: "Seorang pimpinan sedang menangani kasus ini.", en: "A leader is handling this case." },
  "studio.integritas.rujukan.di_pimpinan": { default: "Kasus ini menunggu keputusan di Pimpinan.", en: "This case is waiting for a decision in Pimpinan." },
  "studio.integritas.rujukan.tak_terlihat": { default: "Diteruskan ke pimpinan. Keadaan kasusnya dapat dilihat oleh yang meneruskannya dan pimpinan yang berwenang memutuskan.", en: "Referred to a leader. The case's state can be seen by whoever referred it and the leaders who may decide it." },
  "studio.integritas.rujukan.lanjut.NO_FURTHER_ACTION": { default: "Kasus ini selesai; tidak ada langkah lanjutan.", en: "This case is closed; nothing further is needed." },
  "studio.integritas.rujukan.lanjut.LEARNER_SUPPORT_ARRANGED": { default: "Pendampingan untuk murid disiapkan. Ikuti arahan pimpinan untuk pendampingannya.", en: "Support for the student is arranged. Follow the leader's direction for it." },
  "studio.integritas.rujukan.lanjut.ESCALATED_TO_INSTITUTION": { default: "Kasus ini diteruskan ke pihak sekolah, yang menanganinya dari sini.", en: "This case went to the school, which handles it from here." },
  "studio.sertifikat.judul": { default: "Tata Letak Sertifikat", en: "Certificate Layout" },
  "studio.sertifikat.tata_letak": { default: "Tata letak", en: "Layout" },
  "studio.sertifikat.identitas": { default: "Sertifikat menampilkan nama pemegang saja.", en: "The certificate shows the holder's name only." },
  "studio.sertifikat.simpan": { default: "Simpan", en: "Save" },
  "studio.bank.judul": { default: "Bank Soal", en: "Item Bank" },
  // polish batch 2 (UX-02): what the page is for in this phase, said once, instead of a line under every question
  "studio.bank.intro": { default: "Soal-soal di bank sekolah Anda. Angka dari pengerjaan murid baru muncul setelah cukup murid menjawab sebuah soal; bila angka itu menandai soal, peninjau mencatat keputusannya di sini. Untuk mengubah soal, unggah buku kerja yang sudah diperbaiki di Buat Paket.", en: "The questions in your school's bank. Figures from student work appear only once enough students have answered a question; when they flag one, a reviewer records the decision here. To change a question, upload a corrected workbook in Create a package." },
  "studio.bank.kesehatan": { default: "Kesehatan soal", en: "Item health" },
  "studio.bank.prediksi": { default: "Perkiraan penyusun", en: "The author's estimate" },
  "studio.bank.empiris": { default: "Dari pengerjaan murid", en: "From student work" },
  "studio.bank.akui_ok": { default: "Sudah ditinjau, soal ini wajar", en: "Reviewed — this item is sound" },
  "studio.bank.tindakan": { default: "Sudah ditinjau, soal ini diperbaiki", en: "Reviewed — this item was corrected" },
  // CR-52 (QN5, D-123): Bank Soal is browsed, narrowed and reviewed with each question's key and reasons
  "studio.bank.saring.untuk": { default: "Dipakai untuk", en: "Used for" },
  "studio.bank.saring.semua": { default: "Semua", en: "All" },
  "studio.bank.saring.tombol": { default: "Tampilkan", en: "Show" },
  "studio.bank.kunci_alasan": { default: "Kunci dan alasan", en: "Key and reasons" },
  "studio.hasil.ok": { default: "Tersimpan.", en: "Saved." },
  "studio.hasil.gagal": { default: "Belum tersimpan.", en: "Not saved." },
  // BOB-07 (D-011): each code's sentence. Worded by Daisy (D-014) in the Studio's and Konfigurasi's own terms: a course,
  // its content and its release; the step and the form field by their on-screen names; what to do next.
  "galat.action_not_allowed": { default: "Langkah ini bukan wewenang Anda.", en: "This step is not yours to take." },
  "galat.action_not_found": { default: "Pilihan Anda tidak ditemukan atau sudah tidak tersedia. Muat ulang halaman, lalu pilih lagi.", en: "What you chose was not found or is no longer available. Reload the page and choose again." },
  "galat.action_input_invalid": { default: "Ada isian yang kosong atau belum sesuai. Periksa, lalu coba lagi.", en: "A field is empty or not in the right form. Check the form and try again." },
  "galat.action_already_exists": { default: "Yang Anda buat sudah ada, jadi tidak dibuat dua kali.", en: "This already exists, so it was not created twice." },
  "galat.action_unchanged": { default: "Tidak ada yang berubah. Perubahan ini di luar wewenang Anda, atau sudah tidak berlaku lagi.", en: "Nothing changed. This change is outside your permissions, or no longer applies." },
  "galat.action_failed": { default: "Ada kendala di PINTAR. Coba sekali lagi. Bila masih terjadi, sampaikan kode rujukan berikut kepada yang mengurus PINTAR di sekolah Anda.", en: "PINTAR ran into a problem. Try once more. If it happens again, give whoever looks after PINTAR at your school the reference that follows." },
  "galat.rollover_input_incomplete": { default: "Pilih tahun ajaran asal dan tujuan, lalu kelas tujuan untuk sedikitnya satu kelas.", en: "Choose the academic years to move from and to, then a destination class for at least one class." },
  "galat.transfer_input_incomplete": { default: "Pilih murid, lalu isi kode sekolah tujuan dan kode tahun ajaran tujuan.", en: "Choose the student, then fill in the destination school code and the destination academic-year code." },
  "galat.role_input_incomplete": { default: "Pilih orang dan peran, lalu isi Berlaku sampai.", en: "Choose the person and the role, then fill in Valid until." },
  "galat.role_reason_required": { default: "Tuliskan alasan peran ini dicabut.", en: "Write why this role is being revoked." },
  "galat.role_scope_required": { default: "Pilih Lingkup, yaitu bagian sekolah tempat peran ini berlaku. Hanya Admin platform yang tidak memerlukannya.", en: "Choose the Scope, the part of the school where this role applies. Only a Platform administrator needs none." },
  "galat.template_input_incomplete": { default: "Pilih sekolah, isi kunci judul, lalu pilih sedikitnya satu metrik.", en: "Choose the institution, fill in the title key, then choose at least one metric." },
  "galat.school_required": { default: "Pilih sekolah terlebih dahulu.", en: "Choose a school first." },
  "galat.move_input_incomplete": { default: "Pilih kelas tujuan untuk murid itu.", en: "Choose the class to move that student to." },
  "galat.move_not_current": { default: "Murid itu sudah tidak di kelas tersebut, mungkin baru saja dipindahkan. Lihat daftarnya lagi.", en: "That student is no longer in that class; they may have just been moved. Look at the list again." },
  "galat.move_not_a_kelas": { default: "Murid dipindahkan ke sebuah Kelas: dari Kelasnya, atau dari Tingkatnya ke salah satu Kelas di Tingkat itu.", en: "A student is moved to a Kelas: from their class, or from their Tingkat into one of that Tingkat's classes." },
  "galat.move_same_kelas": { default: "Murid itu sudah di kelas tersebut.", en: "That student is already in that class." },
  "galat.move_already_in_kelas": { default: "Murid itu sudah punya Kelas di Tingkat ini. Pindahkan ia dari Kelasnya.", en: "That student already has a class in this Tingkat. Move them from that class." },
  "galat.move_other_year": { default: "Kelas tujuan ada di tahun ajaran lain. Murid pindah ke tahun ajaran berikutnya lewat Pergantian tahun ajaran.", en: "The destination class is in another academic year. Students move into the next academic year through the academic-year rollover." },
  "galat.learner_moved": { default: "Murid sudah dipindahkan. Apa yang sudah ia kerjakan tetap tercatat di kelas lamanya.", en: "The student has been moved. What they have already done stays recorded with their old class." },
  "galat.pass_mark_set": { default: "Batas ketuntasan ditetapkan. Berlaku untuk pelajaran yang disediakan mulai sekarang.", en: "The pass mark is set. It applies to what is given from now on." },
  "galat.pass_mark_unchanged": { default: "Batas ketuntasan sudah bernilai itu; tidak ada yang berubah.", en: "The pass mark already has that value; nothing changed." },
  "galat.pass_mark_input_incomplete": { default: "Isi nilai bulat dari 0 sampai 100 dan alasannya.", en: "Enter a whole number from 0 to 100 and a reason." },
  "galat.pass_mark_missing": { default: "Batas ketuntasan pelajaran ini belum ditetapkan, jadi pelajaran ini belum bisa disediakan untuk kelas. Admin sekolah menetapkannya di Konfigurasi → Batas ketuntasan.", en: "This lesson has no pass mark yet, so it cannot be given to a class. The school admin sets it in Configuration → Pass mark." },
  "galat.rollover_done": { default: "Keanggotaan kelas yang dipindahkan ke tahun ajaran baru:", en: "Class memberships moved to the new academic year:" },
  "galat.template_saved": { default: "Metrik dalam templat laporan ini:", en: "Metrics in this report template:" },
  // DAISY-18 (D-047): the key actions say what was done
  "galat.role_granted": { default: "Peran diberikan.", en: "Role granted." },
  "galat.role_revoked": { default: "Peran dicabut.", en: "Role revoked." },
  "pindah.menunggu_tujuan": { default: "Belum diterima sekolah tujuan. Sekolah itu yang memilih tahun ajarannya.", en: "Not yet accepted by the receiving school, which chooses its school year." },
  "pindah.masuk.judul": { default: "Permintaan pindah masuk", en: "Incoming transfer requests" },
  "pindah.masuk.dari": { default: "dari", en: "from" },
  "pindah.masuk.tahun": { default: "Tahun ajaran di sekolah ini", en: "School year at this school" },
  "pindah.masuk.program": { default: "Program", en: "Programme" },
  "pindah.masuk.kelas": { default: "Kelas di sekolah ini", en: "Class at this school" },
  "pindah.masuk.terima": { default: "Terima perpindahan", en: "Accept the transfer" },
  "pindah.keluar.judul": { default: "Ajukan perpindahan ke sekolah lain", en: "Request a transfer to another school" },
  "pindah.keluar.arti": { default: "Cari sekolah tujuan dengan nama lengkapnya atau kodenya. Sekolah tujuan yang menerima perpindahan dan memilih tahun ajarannya.", en: "Find the receiving school by its full name or its code. The receiving school accepts the transfer and chooses the school year." },
  "pindah.cari.label": { default: "Nama lengkap atau kode sekolah tujuan", en: "The receiving school's full name or code" },
  "config.cari_orang.label": { default: "Cari orang menurut nama", en: "Find a person by name" },
  "config.cari_orang.tombol": { default: "Cari orang", en: "Find the person" },
  "config.cari_orang.arti": { default: "Daftar di bawah memuat paling banyak 50 orang: yang terbaru terdaftar, atau yang namanya cocok dengan pencarian.", en: "The list below holds at most 50 people: the most recently enrolled, or those whose name matches the search." },
  "pindah.cari.tombol": { default: "Cari sekolah", en: "Find the school" },
  "pindah.cari.kosong": { default: "Tidak ada sekolah aktif dengan nama atau kode itu. Periksa ejaannya: nama harus lengkap dan sama persis.", en: "No active school has that name or code. Check the spelling: the name must be complete and exact." },
  "pindah.tujuan": { default: "Sekolah tujuan", en: "Receiving school" },
  "galat.transfer_destination_invalid": { default: "Pilih sekolah tujuan lain yang aktif.", en: "Choose another, active school." },
  "galat.transfer_reason_required": { default: "Tuliskan alasan perpindahannya.", en: "Write the reason for the transfer." },
  "galat.transfer_open": { default: "Murid ini sudah punya permintaan pindah yang belum selesai.", en: "This student already has a transfer request in progress." },
  "galat.transfer_enrollment_not_active": { default: "Murid ini tidak lagi terdaftar di sekolah ini.", en: "This student is no longer enrolled at this school." },
  "galat.transfer_period_invalid": { default: "Pilih salah satu tahun ajaran sekolah ini.", en: "Choose one of this school's school years." },
  "galat.transfer_programme_invalid": { default: "Pilih salah satu program sekolah ini.", en: "Choose one of this school's programmes." },
  "galat.transfer_not_open": { default: "Permintaan ini tidak lagi menunggu sekolah ini.", en: "This request is no longer waiting for this school." },
  "galat.transfer_search_short": { default: "Ketik nama lengkap atau kode sekolah, paling sedikit 3 karakter.", en: "Type the school's full name or code, at least 3 characters." },
  "galat.transfer_period_missing": { default: "Sekolah tujuan belum memilih tahun ajarannya.", en: "The receiving school has not chosen the school year yet." },
  "galat.transfer_already_enrolled": { default: "Murid ini sudah terdaftar di sekolah tujuan untuk tahun ajaran itu. Perpindahan tidak dijalankan, dan tidak ada yang berubah.", en: "This student is already enrolled at the receiving school for that school year. The transfer was not carried out, and nothing changed." },
  "galat.transfer_place_invalid": { default: "Pilih salah satu kelas sekolah ini pada tahun ajaran itu.", en: "Choose one of this school's classes in that school year." },
  "galat.transfer_accepted": { default: "Perpindahan diterima ke tahun ajaran yang dipilih. Sekarang bisa dijalankan.", en: "The transfer is accepted into the chosen school year. It can now be carried out." },
  "galat.transfer_requested": { default: "Perpindahan diajukan dan kini menunggu persetujuan dari pihak lain.", en: "Transfer requested; it now awaits authorization from the other side." },
  "galat.transfer_authorized": { default: "Perpindahan disetujui dan tinggal dijalankan.", en: "Transfer authorized; it only remains to be executed." },
  "galat.transfer_executed": { default: "Perpindahan dijalankan.", en: "Transfer executed." },
  "galat.transfer_rejected": { default: "Perpindahan ditolak.", en: "Transfer rejected." },
  "galat.step_taken": { default: "Paket ini maju ke langkah berikutnya.", en: "This package has moved on to its next step." },
  "galat.check_run": { default: "Pemeriksaan isi selesai. Temuannya ada di bawah.", en: "The content check is done. Its findings are below." },
  "galat.findings_acknowledged": { default: "Temuan sejenis sudah ditinjau sekaligus. Jumlahnya:", en: "Findings of this kind are marked reviewed together. Count:" },
  "galat.finding_acknowledged": { default: "Temuan itu sudah diakui.", en: "That finding has been acknowledged." },
  "galat.revision_created": { default: "Salinan baru paket ini dibuat, dan Anda sekarang melihatnya.", en: "A new copy of this package was made, and you are now looking at it." },
  "galat.assignment_moved": { default: "Penugasan itu sekarang memakai terbitan ini.", en: "That assignment now uses this release." },
  "galat.distribution_granted": { default: "Sekolah itu sekarang dapat memakai terbitan ini.", en: "That school may now use this release." },
  "galat.distribution_withdrawn": { default: "Izin sekolah itu ditarik.", en: "That school’s permission was withdrawn." },
  "galat.review_recorded": { default: "Tinjauan Anda dicatat.", en: "Your review was recorded." },
  "galat.certificate_saved": { default: "Tata letak ini dipakai untuk sertifikat berikutnya.", en: "This layout will be used for the next certificates." },
  "galat.quick_check_launched": { default: "Uji Cepat diluncurkan untuk kelas itu.", en: "The Quick Assessment was launched for that class." },
  "galat.draft_created": { default: "Paket dibuat.", en: "Package created." },
  "studio.konten.kode.content_transition_invalid": { default: "Paket ini sudah tidak berada di langkah itu, mungkin karena rekan baru saja mengambilnya. Muat ulang halaman untuk melihat langkah yang berlaku sekarang.", en: "This package is no longer at that step, perhaps because a colleague has just taken it. Reload the page to see the current step." },
  "studio.konten.kode.content_review_not_allowed": { default: "Menyetujui isi bukan wewenang Anda di sekolah ini. Minta orang yang disebut di langkah Setujui isi.", en: "Approving the content is not yours to do in this school. Ask someone named at the Approve the content step." },
  "studio.konten.kode.content_reviewer_required": { default: "Persetujuan belum tercatat atas nama Anda. Muat ulang halaman, lalu setujui sekali lagi.", en: "The approval was not recorded under your name. Reload the page and approve once more." },
  "studio.konten.kode.content_author_unknown": { default: "PINTAR tidak tahu siapa penyusun paket ini, jadi tidak dapat memastikan bahwa persetujuannya dari orang lain. Sampaikan kepada yang mengurus PINTAR di sekolah Anda.", en: "PINTAR does not know who wrote this package, so it cannot confirm that the approval comes from someone else. Tell whoever looks after PINTAR at your school." },
  "studio.konten.kode.content_reviewer_is_author": { default: "Anda menyusun paket ini, jadi persetujuannya harus dari orang lain. Minta rekan yang disebut di langkah Setujui isi.", en: "You wrote this package, so the approval must come from someone else. Ask a colleague named at the Approve the content step." },
  "studio.konten.kode.content_check_errors": { default: "Pemeriksaan isi sudah dijalankan dan menemukan hal yang wajib diperbaiki, jadi paket belum ditandai lolos. Lihat Temuan di bawah: perbaiki yang wajib diperbaiki, lalu tandai lolos pemeriksaan lagi.", en: "The content check has run and found things that must be fixed, so the package is not marked as passed yet. See Findings below: fix what must be fixed, then mark the check as passed again." },
  "studio.konten.kode.content_reviewer_not_caller": { default: "Persetujuan hanya dapat dicatat atas nama Anda sendiri, bukan atas nama orang lain.", en: "An approval can only be recorded in your own name, not in someone else\u2019s." },
  "studio.konten.kode.content_seal_not_allowed": { default: "Mengunci terbitan bukan wewenang Anda di sekolah ini. Minta orang yang disebut di langkah Kunci terbitan.", en: "Locking the release is not yours to do in this school. Ask someone named at the Lock the release step." },
  "studio.konten.kode.content_publish_not_allowed": { default: "Menerbitkan bukan wewenang Anda di sekolah ini. Minta orang yang disebut di langkah Terbitkan.", en: "Publishing is not yours to do in this school. Ask someone named at the Publish step." },
  "studio.konten.kode.content_withdraw_not_allowed": { default: "Menarik isi yang sudah terbit bukan wewenang Anda di sekolah ini. Minta orang yang disebut di langkah Terbitkan.", en: "Withdrawing published content is not yours to do in this school. Ask someone named at the Publish step." },
  "studio.konten.kode.content_author_immutable": { default: "Penyusun paket tidak dapat diganti.", en: "A package\u2019s author cannot be changed." },
  "studio.konten.kode.content_created_not_ingested": { default: "Isi baru selalu dimulai dari unggahan. Unggah buku kerjanya, lalu ikuti Langkah menuju terbit.", en: "New content always starts from an upload. Upload its workbook, then follow Steps to publication." },
  "sync.done": { default: "Semua jawaban sudah tersimpan di server.", en: "Every answer is saved on the server." },
  // R1 (F-07/F-08). Said when Finish is held back because an answer the
  // learner gave is not yet on the server, and when an answer arrived after
  // the assessment had already closed. Neither blames the learner.
  "sync.belum_tersimpan": { default: "Ada jawaban yang belum tersimpan di server. Pastikan tersambung, lalu tekan sekali lagi.", en: "Some answers are not saved on the server yet. Make sure you are connected, then press again." },
  "sync.belum_terkirim": { default: "Belum tersambung. Jawaban Anda tetap tersimpan di perangkat ini; coba lagi saat tersambung.", en: "Not connected yet. Your answers stay saved on this device; try again once you are connected." },
  // F-01. The step after the intake: a provisioned person becomes someone
  // who can sign in. Plain words; the card PIN is shown once and said so.
  // BOB-51: «Kirim email uji», the platform admin's delivery proof (Daisy's words at the polish pass)
  "emailuji.r.judul": { default: "Apa yang terjadi pada sebuah email?", en: "What happened to an email?" },
  "emailuji.r.intro": { default: "Ketik alamat email atau rujukan sebuah pengiriman. PINTAR tidak menyimpan alamat email; ia mencocokkan sidik alamat yang Anda ketik dengan catatan pengirimannya.", en: "Type an email address or a send's reference. PINTAR does not keep email addresses; it matches a fingerprint of the address you type against its send log." },
  "emailuji.r.arti": { default: "Setiap pengiriman berada di salah satu dari empat keadaan: «Dalam antrean» (belum ada jawaban dari server email), «Diserahkan» (server email sudah menerimanya), «Gagal» (ditolak atau server tidak terjangkau), atau «Tidak dikirim» (batas pengiriman). PINTAR tidak menerima kabar dari kotak masuk penerima, jadi tidak pernah tahu apakah sebuah email sudah sampai.", en: "Every send is in one of four states: «Queued» (no answer from the email server yet), «Handed off» (the email server accepted it), «Unsuccessful» (refused, or the server could not be reached), or «Not sent» (a sending limit). PINTAR hears nothing back from the recipient's inbox, so it never knows whether an email arrived." },
  "emailuji.r.label": { default: "Alamat email atau rujukan", en: "Email address or reference" },
  "emailuji.r.tombol": { default: "Lihat riwayat", en: "Show the history" },
  "emailuji.r.kode": { default: "kode", en: "code" },
  "emailuji.r.isian": { default: "Tulis alamat email yang lengkap atau rujukan pengiriman yang lengkap.", en: "Enter a complete email address or a complete send reference." },
  "emailuji.r.ditolak": { default: "Hanya admin platform yang dapat melihat riwayat email.", en: "Only the platform administrator can see the email history." },
  "emailuji.r.gagal": { default: "Riwayat email tidak bisa dibaca sekarang. Coba lagi sebentar lagi.", en: "The email history can't be read right now. Try again in a moment." },
  "emailuji.r.kosong": { default: "PINTAR belum pernah mencoba mengirim email ke alamat atau rujukan ini.", en: "PINTAR has never tried to send an email to this address or reference." },
  "emailuji.r.jenis.KODE_AKTIVASI": { default: "Kode aktivasi", en: "Activation code" },
  "emailuji.r.jenis.KODE_ULANG": { default: "Kode aktivasi, dikirim ulang", en: "Activation code, sent again" },
  "emailuji.r.jenis.PEMULIHAN_PASSWORD": { default: "Kode pemulihan password", en: "Password recovery code" },
  "emailuji.r.jenis.PASSWORD_DIUBAH": { default: "Email password diubah", en: "Password changed email" },
  "emailuji.r.jenis.KARTU_DIGITAL": { default: "Kartu PINTAR", en: "PINTAR Card" },
  "emailuji.r.jenis.PEMBERITAHUAN_KEAMANAN": { default: "Email keamanan akun", en: "Account security email" },
  "emailuji.r.jenis.UJI_PENGIRIMAN": { default: "Email uji", en: "Test email" },
  "emailuji.r.jenis.lain": { default: "Email", en: "Email" },
  "emailuji.r.hasil.PENDING_LAMA": { default: "Tertahan dalam antrean: belum ada jawaban dari server email lebih dari 10 menit", en: "Stuck in the queue: no answer from the email server for more than 10 minutes" },
  "emailuji.t.judul": { default: "Pengiriman tertahan", en: "Stuck sends" },
  "emailuji.t.intro": { default: "Email dalam antrean yang belum dijawab server email lebih dari 10 menit. «Diserahkan» berarti server email sudah menerimanya; itu belum berarti sampai di kotak masuk.", en: "Queued emails the email server has not answered for more than 10 minutes. «Handed off» means the email server accepted it; that does not mean it reached the inbox." },
  "emailuji.t.kosong": { default: "Tidak ada pengiriman yang tertahan.", en: "No send is stuck." },
  "emailuji.t.galat": { default: "Daftar ini belum bisa dibaca. Muat ulang halaman sebentar lagi.", en: "This list could not be read. Reload the page in a moment." },
  "emailuji.t.menunggu": { default: "Belum dijawab selama", en: "Unanswered for" },
  "emailuji.t.menit": { default: "menit", en: "minutes" },
  "emailuji.r.hasil.PENDING": { default: "Dalam antrean: belum ada jawaban dari server email", en: "Queued: no answer from the email server yet" },
  "emailuji.r.hasil.SENT": { default: "Diserahkan: diterima server email, belum dipastikan sampai", en: "Handed off: accepted by the email server, arrival not confirmed" },
  "emailuji.r.hasil.BATAS_ALAMAT": { default: "Tidak dikirim: batas PINTAR untuk alamat ini", en: "Not sent: PINTAR's limit for this address" },
  "emailuji.r.hasil.BATAS_UMUM": { default: "Tidak dikirim: batas pengiriman PINTAR per jam", en: "Not sent: PINTAR's hourly sending limit" },
  "emailuji.r.hasil.REFUSED_BY_HOST": { default: "Gagal: ditolak server email", en: "Unsuccessful: refused by the email server" },
  "emailuji.r.hasil.FAILED": { default: "Gagal: server email tidak terjangkau", en: "Unsuccessful: the email server could not be reached" },
  "emailuji.ditolak": { default: "Halaman ini hanya untuk admin platform.", en: "This page is for the platform administrator only." },
  "emailuji.eyebrow": { default: "Email", en: "Email" },
  "emailuji.judul": { default: "Kirim email uji", en: "Send a test email" },
  "emailuji.intro": { default: "Kirim satu email uji ke kotak masuk yang Anda pilih, untuk memastikan email PINTAR sampai. Email ini melewati jalur dan batas pengiriman yang sama dengan email PINTAR lainnya.", en: "Send one test email to an inbox you choose, to check that PINTAR's email arrives. It takes the same path and the same sending limits as every other PINTAR email." },
  "emailuji.ke": { default: "Alamat email tujuan", en: "Send to this email address" },
  "emailuji.tombol": { default: "Kirim email uji", en: "Send test email" },
  "emailuji.mengirim": { default: "Mengirim…", en: "Sending…" },
  "emailuji.terkirim": { default: "Email uji sudah diserahkan ke server email untuk", en: "The test email was handed to the email server for" },
  "emailuji.periksa": { default: "Periksa kotak masuk alamat itu, termasuk folder spam.", en: "Check that inbox, including the spam folder." },
  "emailuji.rujukan": { default: "Rujukan:", en: "Reference:" },
  "emailuji.alasan.batas_alamat": { default: "Belum terkirim: alamat ini sudah menerima cukup banyak email dari PINTAR dalam waktu dekat. Coba lagi nanti.", en: "Not sent: this address has had enough email from PINTAR for now. Try again later." },
  "emailuji.alasan.batas_umum": { default: "Belum terkirim: PINTAR sudah mencapai batas pengirimannya untuk saat ini. Coba lagi nanti.", en: "Not sent: PINTAR has reached its sending limit for now. Try again later." },
  "emailuji.alasan.ditolak_server": { default: "Belum terkirim: server email menolak pesan ini.", en: "Not sent: the email server refused this message." },
  "emailuji.alasan.gagal_kirim": { default: "Belum terkirim: PINTAR tidak dapat tersambung ke server email.", en: "Not sent: PINTAR could not connect to the email server." },
  "emailuji.alasan.ditahan_uji": { default: "Tidak dikirim: di luar PINTAR produksi, email hanya dikirim ke alamat milik PINTAR atau alamat uji.", en: "Not sent: outside production PINTAR, email goes only to PINTAR's own addresses or test addresses." },
  "emailuji.pengaturan.hilang": { default: "Belum terkirim: sebuah pengaturan email belum diisi.", en: "Not sent: an email setting has not been filled in." },
  "emailuji.pengaturan.tidak_sah": { default: "Belum terkirim: sebuah pengaturan email isinya tidak sah.", en: "Not sent: an email setting does not hold a valid value." },
  "emailuji.pengaturan.tidak_aman": { default: "Belum terkirim: pengaturan email tidak memakai sambungan yang aman.", en: "Not sent: the email settings do not use a secure connection." },
  "emailuji.pengaturan.umum": { default: "Belum terkirim: pengaturan email di server belum lengkap.", en: "Not sent: the email settings on the server are incomplete." },
  "emailuji.pengaturan.nama": { default: "Pengaturan yang perlu diperbaiki:", en: "The setting to fix:" },
  "emailuji.galat.alamat": { default: "Tulis alamat email yang lengkap, misalnya nama@sekolah.sch.id.", en: "Enter a complete email address, for example name@school.sch.id." },
  "emailuji.galat.sesi": { default: "Sesi Anda sudah berakhir. Masuk lagi, lalu kirim ulang.", en: "Your session has ended. Sign in again, then send it again." },
  "emailuji.galat.ditolak": { default: "Hanya admin platform yang dapat mengirim email uji.", en: "Only the platform administrator can send a test email." },
  "emailuji.galat.asal": { default: "Belum terkirim: permintaan ini tidak datang dari halaman PINTAR di alamat ini. Buka halaman ini lagi dari alamat PINTAR, lalu kirim ulang.", en: "Not sent: this request did not come from a PINTAR page at this address. Open this page again from PINTAR's address, then send it again." },
  "emailuji.galat.umum": { default: "Belum terkirim: terjadi kesalahan di PINTAR. Coba lagi sebentar lagi.", en: "Not sent: something went wrong in PINTAR. Try again in a moment." },
  "emailuji.galat.jaringan": { default: "Permintaan tidak sampai ke PINTAR. Periksa sambungan internet, lalu coba lagi.", en: "The request did not reach PINTAR. Check the internet connection, then try again." },
  "aktivasi.ditolak": { default: "Halaman ini untuk Admin sekolah atau Admin platform.", en: "This page is for the people who manage a school's records." },
  "aktivasi.eyebrow": { default: "Akun", en: "Accounts" },
  "aktivasi.judul": { default: "Aktifkan akun", en: "Activate accounts" },
  // polish batch 2 (UX-11): each sentence stops where the sign-in address goes; the screen puts the
  // environment's own address there (src/components/aktivasi/alamat.ts), or «halaman Masuk PINTAR» when it has none
  "aktivasi.intro": { default: "Orang yang sudah didata sekolah Anda tetapi belum bisa masuk. Pilih caranya untuk masing-masing: dengan email, atau dengan kartu kelas dan PIN. Untuk guru dan staf, berikan perannya di Peran & akses lebih dulu, lalu aktifkan dengan email. PINTAR tidak mengirim email atau pesan apa pun saat akun dibuat.", en: "People your school has recorded who cannot sign in yet. Choose how each one signs in: with email, or with a classroom card and PIN. PINTAR sends no email or message of any kind when the account is made." },
  "aktivasi.intro.buka": { default: "Untuk akun email, minta orangnya mengaktifkan akunnya di", en: "For an email account, ask the person to activate it at" },
  "aktivasi.halaman_masuk": { default: "halaman Masuk PINTAR", en: "PINTAR's sign-in page" },
  "aktivasi.kosong": { default: "Tidak ada orang yang menunggu akun. Orang yang baru dicatat di Pendataan muncul di sini.", en: "Nobody is waiting for an account. People newly recorded on Pendataan appear here." },
  "aktivasi.tunggu.cari": { default: "Cari nama atau no. registrasi sekolah", en: "Search by name or school registration number" },
  // B2 (D-174, D-175): the approved explanation, as the search's help line
  "aktivasi.tunggu.cari_arti": { default: "Nomor registrasi orang ini di sekolah tersebut. Berbeda dari PINTAR ID dan NIS/NISN.", en: "This person's registration number at that school. Different from the PINTAR ID and the NIS/NISN." },
  "aktivasi.tunggu.jumlah": { default: "{n} orang menunggu akun.", en: "{n} people are waiting for an account." },
  "aktivasi.tunggu.cocok": { default: "{n} orang yang menunggu akun cocok dengan pencarian ini.", en: "{n} people waiting for an account match this search." },
  "aktivasi.tunggu.tidak_cocok": { default: "Tidak ada orang yang menunggu akun yang cocok dengan pencarian ini.", en: "Nobody waiting for an account matches this search." },
  "aktivasi.surel": { default: "Alamat email", en: "Email address" },
  "aktivasi.dengan_surel": { default: "Aktifkan dengan email", en: "Activate with email" },
  "aktivasi.dengan_kartu": { default: "Buat kartu kelas", en: "Make a classroom card" },
  // M7 (D-085): a whole class's cards in one press, and the printable class set
  "aktivasi.kelas.judul": { default: "Kartu untuk satu kelas", en: "Cards for a whole class" },
  "aktivasi.kelas.arti": { default: "Buat kartu kelas untuk semua murid di satu kelas yang belum punya akun, dengan sekali tekan. Setiap kartu tetap dibuat dan dicatat untuk muridnya masing-masing.", en: "Make classroom cards for every student in one class who has no account yet, with one press. Each card is still made and recorded for its own student." },
  "aktivasi.kelas.pilih": { default: "Kelas", en: "Class" },
  "aktivasi.kelas.murid": { default: "murid belum punya akun", en: "students without an account" },
  "aktivasi.kelas.tombol": { default: "Buat kartu untuk kelas ini", en: "Make cards for this class" },
  "aktivasi.kelas.banyak.judul": { default: "Beberapa kelas sekaligus", en: "Several classes at once" },
  "aktivasi.kelas.banyak.semua": { default: "Pilih semua", en: "Select all" },
  "aktivasi.kelas.banyak.terpilih": { default: "Dipilih: {murid} murid di {kelas} kelas.", en: "Selected: {murid} students in {kelas} classes." },
  "aktivasi.kelas.banyak.dikecualikan": { default: "Tidak dihitung: murid yang sudah punya kartu atau akun, murid yang memegang peran staf, dan murid yang datanya masih menunggu di Pendataan.", en: "Not counted: students who already have a card or an account, students who hold a staff role, and students whose data still waits in Pendataan." },
  "aktivasi.kelas.banyak.tombol": { default: "Buat kartu untuk {murid} murid", en: "Make cards for {murid} students" },
  "aktivasi.kelas.membuat": { default: "Membuat kartu…", en: "Making cards…" },
  "aktivasi.kelas.lembar": { default: "Kartu kelas", en: "Class cards" },
  "aktivasi.kelas.sekali": { default: "Kartu dibuat. Cetak atau catat sekarang: PIN hanya ditampilkan sekali dan tidak bisa ditampilkan lagi setelah halaman ini ditutup.", en: "Cards made. Print them or write them down now: the PINs are shown only once and cannot be shown again once this page is closed." },
  "aktivasi.kelas.cetak": { default: "Cetak kartu kelas", en: "Print the class cards" },
  "aktivasi.kelas.nomor": { default: "Nomor kartu", en: "Card number" },
  "aktivasi.kelas.belum": { default: "Kartu untuk murid berikut belum dibuat. Mereka tetap ada di daftar di bawah:", en: "No card was made for these students. They are still in the list below:" },
  "aktivasi.kartu_dibuat": { default: "Kartu dibuat. Catat sekarang — PIN hanya ditampilkan sekali:", en: "Card made. Write it down now — the PIN is shown only once:" },
  "aktivasi.gagal": { default: "Belum berhasil, dan belum ada yang dibuat. Coba lagi. Jika tetap gagal, muat ulang halaman ini.", en: "That did not work, and nothing was made. Try again. If it still fails, reload this page." },
  "aktivasi.baru.judul": { default: "Orang baru di luar pendataan", en: "A new person outside the intake" },
  "aktivasi.baru.arti": { default: "Untuk pengelola pertama sebuah sekolah. Setelah dibuat, beri peran di Konfigurasi.", en: "For a school's first administrator. Once created, give them a role in Configuration." },
  "aktivasi.baru.nama": { default: "Nama", en: "Name" },
  "aktivasi.baru.tombol": { default: "Buat dan aktifkan", en: "Create and activate" },
  "aktivasi.baru.ok": { default: "PINTAR tidak mengirim email ke orang ini sekarang. Beri dulu perannya di Konfigurasi. Lalu minta orang ini membuka", en: "PINTAR has not emailed this person. First give them a role in Configuration. Then ask them to open" },
  "aktivasi.baru.ok.lalu": { default: ", dan mengetik alamat email ini. Kode aktivasi dikirim saat itu.", en: " and type this email address. The activation code is sent then." },
  "aktivasi.surel_dibuat": { default: "Akun dibuat untuk alamat", en: "Account made for the address" },
  "aktivasi.surel_arti": { default: "PINTAR tidak mengirim email ke orang ini sekarang. Minta orang ini membuka", en: "PINTAR has not emailed this person. Ask them to open" },
  "aktivasi.surel_arti.lalu": { default: ", lalu mengetik alamat email ini. Kode aktivasi dikirim saat itu.", en: " and type this email address. The activation code is sent then." },
  "aktivasi.kartu_arti": { default: "PINTAR tidak mengirim apa pun. Berikan nomor kartu dan PIN ini kepada orangnya. Di", en: "PINTAR has not sent anything. Give this card number and PIN to the person. On" },
  "aktivasi.kartu_arti.lalu": { default: " ia memilih “Gunakan kartu kelas”, lalu mengetik keduanya.", en: " they choose “Use a class card” and type both." },
  "aktivasi.galat.nama": { default: "Tulis nama orangnya dulu.", en: "Write the person's name first." },
  "aktivasi.galat.surel": { default: "Alamat email ini belum lengkap. Contoh: nama@sekolah.sch.id", en: "This email address isn't complete. Example: name@school.sch.id" },
  "aktivasi.galat.ditolak": { default: "PINTAR menolak, dan tidak ada yang dibuat. Orang ini mungkin sudah punya akun, atau bukan dari sekolah yang Anda kelola. Muat ulang halaman ini untuk melihat daftar terbaru.", en: "PINTAR refused, and nothing was made. This person may already have an account, or may not belong to a school you manage. Reload this page to see the current list." },
  "aktivasi.galat.baru_ditolak": { default: "PINTAR menolak, dan tidak ada yang dibuat. Hanya Admin platform yang bisa membuat orang di luar pendataan.", en: "PINTAR refused, and nothing was made. Only a platform administrator can create a person outside the intake." },
  "aktivasi.galat.dipakai": { default: "Akun belum bisa dibuat. Alamat email ini mungkin sudah dipakai akun lain. Coba alamat lain.", en: "The account could not be made. This email address may already belong to another account. Try another address." },
  "aktivasi.galat.kartu": { default: "Kartu belum bisa dibuat, dan tidak ada yang tersimpan. Coba lagi.", en: "The card could not be made, and nothing was saved. Try again." },
  "aktivasi.galat.sesi": { default: "Sesi Anda sudah berakhir, dan tidak ada yang dibuat. Masuk lagi, lalu ulangi.", en: "Your session has ended, and nothing was made. Sign in again, then repeat this." },
  "aktivasi.galat.jaringan": { default: "PINTAR belum bisa dihubungi. Periksa sambungan internet, lalu coba lagi.", en: "PINTAR could not be reached. Check the internet connection, then try again." },

  // ─────────────────────────── DAISY-19 · the email frame (src/components/email)
  // The frame's words, moved from the prototype's KATA (docs/coordination/ux/
  // email-frame/bingkai.mts) unchanged, plus the staging line (ruling 3) and
  // the delivery test Gate 2E sends once (BOB-25, UJI_PENGIRIMAN).
  "email.bingkai.merek": { default: "PINTAR", en: "PINTAR" },
  "email.bingkai.alasan": { default: "Anda menerima email ini karena alamat ini terhubung dengan akun PINTAR.", en: "You are receiving this email because this address is linked to a PINTAR account." },
  "email.bingkai.tidak_pernah": { default: "PINTAR tidak pernah meminta PIN atau password lewat email.", en: "PINTAR never asks for a PIN or password by email." },
  "email.bingkai.tanya": { default: "Ada pertanyaan? Tulis ke", en: "Questions? Write to" },
  "email.bingkai.cadangan": { default: "Jika tombol tidak bisa dibuka, salin alamat ini ke peramban Anda:", en: "If the button does not open, copy this address into your browser:" },
  "email.bingkai.uji": { default: "Email uji dari PINTAR versi uji coba.", en: "A test email from PINTAR's test version." },
  // D1 step 2 (DAISY-37 (2)): the context line, drawn only where the email's data carries a place; with Dr Gladys for
  // confirmation before final terminology acceptance (a PINTAR ID is the person's own, not a school's)
  "email.bingkai.konteks": { default: "Akun PINTAR Anda di", en: "Your PINTAR account at" },
  "email.bingkai.konteks.dan": { default: "dan", en: "and" },
  "email.uji.subjek": { default: "Uji pengiriman email PINTAR", en: "PINTAR email delivery test" },
  "email.uji.pratinjau": { default: "Email ini memastikan email dari PINTAR sampai ke kotak masuk Anda.", en: "This email checks that email from PINTAR reaches your inbox." },
  "email.uji.judul": { default: "Uji pengiriman email", en: "Email delivery test" },
  "email.uji.isi": { default: "Email ini dikirim untuk memastikan email dari PINTAR sampai ke kotak masuk Anda dan tampil dengan benar.", en: "This email was sent to check that email from PINTAR reaches your inbox and displays correctly." },
  "email.uji.dikirim": { default: "Dikirim", en: "Sent" },
  "email.uji.tenang": { default: "Tidak ada yang perlu Anda lakukan.", en: "There is nothing you need to do." },
  "email.uji.alasan": { default: "Anda menerima email ini karena Admin platform PINTAR sedang menguji pengiriman email.", en: "You are receiving this email because PINTAR's Admin platform is testing email delivery." },
  // DAISY-20 (Gate 3, D-054, D-077, D-079): «Aktifkan akun PINTAR Anda», signed out.
  "aktifkan.judul": { default: "Aktifkan akun PINTAR Anda", en: "Activate your PINTAR account" },
  "aktifkan.lede": { default: "Masukkan email yang didaftarkan sekolah Anda. Jika alamat ini terdaftar dan akunnya belum aktif, PINTAR mengirim kode aktivasi ke sana.", en: "Enter the email address your school registered for you. If it is registered and its account is not active yet, PINTAR sends an activation code to it." },
  "aktifkan.kirim": { default: "Kirim kode", en: "Send the code" },
  "aktifkan.mengirim": { default: "Mengirim kode…", en: "Sending the code…" },
  "aktifkan.sudah_aktif": { default: "Akun Anda sudah aktif?", en: "Is your account already active?" },
  "aktifkan.ke_masuk": { default: "Masuk ke PINTAR", en: "Sign in to PINTAR" },
  "aktifkan.kode_judul": { default: "Masukkan kode aktivasi", en: "Enter the activation code" },
  "aktifkan.kode_terkirim": { default: "Jika alamat ini terdaftar dan akunnya belum aktif, PINTAR sedang mengirim kode aktivasi ke sana. Biasanya kode tiba dalam satu menit. Buka email Anda, lalu ketik kodenya di sini.", en: "If this address is registered and its account is not active yet, PINTAR is sending an activation code to it. It usually arrives within a minute. Open your email, then type the code here." },
  "aktifkan.berlaku": { default: "Kode berlaku selama", en: "The code is valid for" },
  "aktifkan.berlaku_lalu": { default: ".", en: "." },
  "aktifkan.kode_label": { default: "Kode aktivasi", en: "Activation code" },
  "aktifkan.lanjut": { default: "Lanjut", en: "Continue" },
  "aktifkan.memeriksa": { default: "Memeriksa kode…", en: "Checking the code…" },
  "aktifkan.kode_bantu": { default: "Belum ada email? Periksa folder Spam atau Promosi. Kode hanya dikirim ke alamat yang didaftarkan sekolah Anda, jadi pastikan alamatnya benar.", en: "No email yet? Check your Spam or Promotions folder. The code goes only to the address your school registered, so make sure the address is right." },
  "aktifkan.kirim_ulang": { default: "Kirim ulang kode", en: "Send the code again" },
  "aktifkan.kirim_ulang_dalam": { default: "Kode bisa dikirim ulang dalam", en: "You can ask again in" },
  "aktifkan.kode_ulang_ok": { default: "Jika alamat ini terdaftar, PINTAR sedang mengirim kode baru. Pakai kode dari email yang paling baru.", en: "If this address is registered, PINTAR is sending a new code. Use the code from the newest email." },
  "aktifkan.email_lain": { default: "Gunakan email lain", en: "Use a different email" },
  "aktifkan.kode_kosong": { default: "Ketik kode dari email dulu.", en: "Type the code from the email first." },
  "aktifkan.kode_salah": { default: "Kode ini tidak cocok atau sudah tidak berlaku. Periksa kodenya, atau minta kode baru.", en: "This code doesn't match or is no longer valid. Check the code, or ask for a new one." },
  "aktifkan.kode_sering": { default: "Kode sudah terlalu sering dicoba untuk alamat ini.", en: "The code has been tried too many times for this address." },
  "aktifkan.ramai": { default: "Sedang banyak permintaan bersamaan.", en: "There are many requests at once." },
  "lupa.judul": { default: "Lupa password", en: "Forgot your password" },
  "lupa.lede": { default: "Ketik email atau username akun PINTAR Anda. Jika akun itu sudah aktif, PINTAR mengirim kode ke email akun itu untuk membuat password baru.", en: "Type the email address or username of your PINTAR account. If that account is active, PINTAR sends a code to its email address so you can make a new password." },
  "lupa.nama_label": { default: "Email atau username", en: "Email or username" },
  "lupa.nama_kosong": { default: "Ketik email atau username akun Anda dulu.", en: "Type your account's email address or username first." },
  "lupa.belum_aktif": { default: "Belum pernah mengaktifkan akun?", en: "Never activated your account?" },
  "lupa.ke_aktifkan": { default: "Aktifkan akun", en: "Activate your account" },
  "lupa.ke_masuk": { default: "Kembali ke halaman masuk", en: "Back to sign in" },
  "lupa.kode_judul": { default: "Periksa email Anda", en: "Check your email" },
  "lupa.kode_terkirim": { default: "Jika nama ini milik akun PINTAR yang sudah aktif, PINTAR sedang mengirim kode ke email akun itu. Biasanya kode tiba dalam satu menit. Ketik kodenya di sini.", en: "If this name belongs to an active PINTAR account, PINTAR is sending a code to that account's email address. It usually arrives within a minute. Type the code here." },
  "lupa.kode_label": { default: "Kode untuk membuat password baru", en: "Code to make a new password" },
  "lupa.kode_ulang_ok": { default: "Jika nama ini milik akun yang sudah aktif, PINTAR sedang mengirim kode baru. Pakai kode dari email yang paling baru.", en: "If this name belongs to an active account, PINTAR is sending a new code. Use the code from the newest email." },
  "lupa.kode_bantu": { default: "Belum ada email? Periksa folder Spam atau Promosi. Kode hanya dikirim ke email akun itu sendiri.", en: "No email yet? Check your Spam or Promotions folder. The code goes only to the account's own email address." },
  "lupa.nama_lain": { default: "Gunakan email atau username lain", en: "Use a different email or username" },
  "lupa.p_judul": { default: "Buat password baru", en: "Make a new password" },
  "lupa.p_lede": { default: "Setelah password baru disimpan, akun ini keluar dari semua perangkat lain.", en: "Once the new password is saved, this account is signed out of every other device." },
  "lupa.berakhir": { default: "Waktu untuk membuat password baru sudah habis. Minta kode baru, lalu coba lagi.", en: "The time to make a new password has run out. Ask for a new code, then try again." },
  "lupa.selesai_judul": { default: "Password Anda sudah diganti", en: "Your password has been changed" },
  "lupa.selesai_isi": { default: "Akun ini sudah keluar dari semua perangkat lain. Mulai sekarang, masuk dengan password baru Anda.", en: "This account has been signed out of every other device. From now on, sign in with your new password." },
  "lupa.lanjut": { default: "Lanjut", en: "Continue" },
  "email.pulih.subjek": { default: "Kode untuk membuat password baru PINTAR", en: "Your PINTAR code to make a new password" },
  "email.pulih.pratinjau": { default: "Pakai kode ini untuk membuat password baru akun PINTAR Anda.", en: "Use this code to make a new password for your PINTAR account." },
  "email.pulih.judul": { default: "Buat password baru", en: "Make a new password" },
  "email.pulih.isi": { default: "Ketik kode ini di halaman Lupa password PINTAR untuk membuat password baru.", en: "Type this code on PINTAR's Forgot your password page to make a new password." },
  "email.pulih.label": { default: "Kode", en: "Code" },
  "email.pulih.bukan_anda": { default: "Jika Anda tidak meminta kode ini, abaikan email ini: password Anda tidak berubah. Jangan berikan kode ini kepada siapa pun.", en: "If you didn't ask for this code, ignore this email: your password hasn't changed. Don't give this code to anyone." },
  "email.pulih.alasan": { default: "Anda menerima email ini karena kode untuk membuat password baru diminta untuk akun PINTAR dengan alamat ini.", en: "You are receiving this email because a code to make a new password was requested for the PINTAR account with this address." },
  "email.diubah.subjek": { default: "Password PINTAR Anda sudah diganti", en: "Your PINTAR password has been changed" },
  "email.diubah.pratinjau": { default: "Password akun PINTAR Anda baru saja diganti.", en: "Your PINTAR account's password was just changed." },
  "email.diubah.judul": { default: "Password Anda sudah diganti", en: "Your password has been changed" },
  "email.diubah.isi": { default: "Password akun PINTAR Anda diganti pada", en: "Your PINTAR account's password was changed on" },
  "email.diubah.sesi": { default: "Akun ini sudah keluar dari semua perangkat. Masuk lagi dengan password baru.", en: "This account has been signed out of every device. Sign in again with the new password." },
  "email.diubah.bukan_anda": { default: "Jika bukan Anda yang menggantinya, segera buat password baru lewat Lupa password dan hubungi admin sekolah Anda.", en: "If it wasn't you who changed it, make a new password at once through Forgot your password and contact your school's administrator." },
  "email.diubah.tombol": { default: "Buat password baru", en: "Make a new password" },
  "email.diubah.alasan": { default: "Anda menerima email ini karena password akun PINTAR dengan alamat ini baru saja diganti.", en: "You are receiving this email because the password of the PINTAR account with this address was just changed." },
  "lupa.ke_pin": { default: "Pakai PINTAR ID dan PIN", en: "Use your PINTAR ID and PIN" },
  "lupa.pin.judul": { default: "Pulihkan dengan PINTAR ID dan PIN", en: "Recover with your PINTAR ID and PIN" },
  "lupa.pin.lede": { default: "Ketik PINTAR ID yang ada di kartu PINTAR Anda dan PIN pribadi Anda. Setelah itu Anda membuat password baru.", en: "Type the PINTAR ID on your PINTAR card and your personal PIN. Then you make a new password." },
  "lupa.pin.id_label": { default: "PINTAR ID", en: "PINTAR ID" },
  "lupa.pin.pin_label": { default: "PIN pribadi (4 angka)", en: "Personal PIN (4 digits)" },
  "lupa.pin.id_salah": { default: "Periksa PINTAR ID: 8 huruf dan angka, seperti A14C D7ST.", en: "Check the PINTAR ID: 8 letters and digits, like A14C D7ST." },
  "lupa.pin.kosong": { default: "Ketik PIN Anda: 4 angka.", en: "Type your PIN: 4 digits." },
  "lupa.pin.salah": { default: "PINTAR ID atau PIN tidak cocok. Periksa keduanya, lalu coba lagi.", en: "The PINTAR ID or the PIN doesn't match. Check both, then try again." },
  "lupa.pin.terkunci": { default: "Pemulihan dengan PIN untuk PINTAR ID ini ditutup sementara setelah beberapa PIN tidak cocok. Anda tetap bisa memulihkan akun lewat email.", en: "Recovery with a PIN for this PINTAR ID is locked for a while after several PINs that didn't match. You can still recover your account by email." },
  "lupa.pin.sering": { default: "Terlalu banyak percobaan dari perangkat ini.", en: "Too many tries from this device." },
  "lupa.pin.ditangguhkan": { default: "Pemulihan dengan PIN untuk PINTAR ID ini dihentikan setelah terlalu banyak PIN tidak cocok. Pulihkan akun lewat email, lalu buat PIN baru di Akun saya.", en: "Recovery with a PIN for this PINTAR ID has been stopped after too many PINs that didn't match. Recover your account by email, then make a new PIN in My account." },
  "lupa.pin.belum_aktif": { default: "Akun ini belum selesai diaktifkan. Aktifkan akun PINTAR Anda lebih dulu.", en: "This account hasn't finished activation. Activate your PINTAR account first." },
  "lupa.pin.ke_email": { default: "Pulihkan lewat email", en: "Recover by email" },
  "lupa.pin.periksa": { default: "Lanjut", en: "Continue" },
  "idpage.judul": { default: "Kartu PINTAR", en: "PINTAR card" },
  "idpage.lede": { default: "Ini PINTAR ID dari sebuah kartu PINTAR. PINTAR ID bukan kunci: untuk masuk, pemiliknya memakai email atau nama pengguna dan password.", en: "This is the PINTAR ID from a PINTAR card. A PINTAR ID is not a key: to sign in, its owner uses their email or username and password." },
  "idpage.id_label": { default: "PINTAR ID", en: "PINTAR ID" },
  "idpage.masuk": { default: "Masuk ke PINTAR", en: "Sign in to PINTAR" },
  "idpage.pulih": { default: "Lupa password? Pulihkan dengan PIN", en: "Forgot your password? Recover with your PIN" },
  "akun.pin.judul": { default: "Buat PIN baru", en: "Make a new PIN" },
  "akun.pin.arti": { default: "PIN lama Anda tidak berlaku lagi. Buat PIN baru 4 angka: PIN ini dipakai untuk memulihkan akun dengan PINTAR ID Anda. Jangan berikan kepada siapa pun.", en: "Your old PIN no longer works. Make a new 4-digit PIN: it is used to recover your account with your PINTAR ID. Don't give it to anyone." },
  "akun.pin.label": { default: "PIN baru (4 angka)", en: "New PIN (4 digits)" },
  "akun.pin.ulang": { default: "Ketik PIN itu sekali lagi", en: "Type that PIN once more" },
  "akun.pin.beda": { default: "Kedua PIN tidak sama.", en: "The two PINs are not the same." },
  "akun.pin.simpan": { default: "Simpan PIN baru", en: "Save the new PIN" },
  "akun.pin.menyimpan": { default: "Menyimpan…", en: "Saving…" },
  "akun.pin.tersimpan": { default: "PIN baru tersimpan.", en: "Your new PIN is saved." },
  "aktivasi.staf.judul": { default: "Murid yang menjadi staf", en: "A student who becomes staff" },
  "aktivasi.staf.arti": { default: "Kartu kelas hanya untuk murid. Bila seorang murid menjadi staf, ubah kartunya menjadi akun email lebih dulu. Orangnya tetap sama: nomor registrasi sekolah, kelas dan semua hasil belajarnya tetap. Setelah ia mengaktifkan akun email itu, berikan perannya.", en: "A class card is for students only. When a student becomes staff, turn their card into an email account first. They stay the same person: the same school registration number, classes and all their learning stay. Once they have activated that email account, give them their role." },
  "aktivasi.staf.pilih": { default: "Ubah menjadi akun email", en: "Turn into an email account" },
  "aktivasi.staf.email": { default: "Alamat email orang ini", en: "This person's email address" },
  "aktivasi.staf.email.arti": { default: "Alamat yang akan ia pakai untuk masuk. Dengan alamat ini ia meminta sendiri kode aktivasinya di «Aktifkan akun».", en: "The address they will sign in with. With it, they ask for their own activation code at «Activate account»." },
  "aktivasi.staf.alasan": { default: "Alasan", en: "Reason" },
  "aktivasi.staf.alasan.arti": { default: "Misalnya: diangkat menjadi asisten guru. 10 sampai 500 karakter; dicatat.", en: "For example: appointed as a teaching assistant. 10 to 500 characters; recorded." },
  "aktivasi.staf.konfirmasi": { default: "Kartu kelasnya akan langsung berhenti berlaku. Ubah sekarang?", en: "Their class card will stop working at once. Change it now?" },
  "aktivasi.staf.ya": { default: "Ya, ubah menjadi akun email", en: "Yes, turn it into an email account" },
  "aktivasi.staf.sibuk": { default: "Mengubah…", en: "Changing…" },
  "aktivasi.staf.ok.1": { default: "sekarang memakai akun email", en: "now has an email account at" },
  "aktivasi.staf.ok.2": { default: "Kartu kelasnya tidak berlaku lagi. Minta ia membuka «Aktifkan akun» dan meminta kode dengan alamat ini; setelah akun aktif, berikan perannya.", en: "Their class card no longer works. Ask them to open «Activate account» and ask for a code with this address; once the account is active, give them their role." },
  "aktivasi.staf.gagal.DITOLAK": { default: "Anda tidak bisa mengubah akun murid ini.", en: "You can't change this student's account." },
  "aktivasi.staf.gagal.ALASAN_WAJIB": { default: "Tuliskan alasannya, 10 sampai 500 karakter.", en: "Write the reason, 10 to 500 characters." },
  "aktivasi.staf.gagal.EMAIL_TIDAK_SAH": { default: "Periksa alamat emailnya.", en: "Check the email address." },
  "aktivasi.staf.gagal.EMAIL_TERPAKAI": { default: "Alamat ini sudah dipakai akun lain. Pakai alamat lain.", en: "Another account already uses this address. Use another address." },
  "aktivasi.staf.gagal.KARTU_TIDAK_ADA": { default: "Orang ini tidak punya kartu kelas.", en: "This person has no class card." },
  "aktivasi.staf.gagal.BELUM_MASUK": { default: "Sesi Anda sudah berakhir. Masuk lagi, lalu coba lagi.", en: "Your session has ended. Sign in again, then try again." },
  "aktivasi.staf.gagal.PERMINTAAN_DITOLAK": { default: "Muat ulang halaman ini, lalu coba lagi.", en: "Reload this page, then try again." },
  "aktivasi.staf.gagal.PERMINTAAN_TIDAK_SAH": { default: "Isi alamat email dan alasannya.", en: "Fill in the email address and the reason." },
  "aktivasi.staf.gagal.LAYANAN_TIDAK_TERSEDIA": { default: "Akun belum bisa diubah. Kartu kelasnya masih berlaku. Coba lagi sebentar lagi.", en: "The account could not be changed yet. The class card still works. Try again in a moment." },
  "orang.judul": { default: "Koreksi data orang", en: "Correct a person's details" },
  "orang.benda": { default: "orang", en: "people" },
  "orang.intro.sekolah": { default: "Orang di sekolah ini yang sudah punya akun email. Anda bisa mengoreksi alamat email yang salah sebelum orangnya mengaktifkan akun. Nama dan username dikoreksi oleh Admin platform.", en: "People at this school who have an email account. You can correct a wrong email address before the person activates their account. Names and usernames are corrected by the platform admin." },
  "orang.intro.platform": { default: "Semua orang yang punya akun email. Koreksi alamat email, nama, atau username dengan alasan; setiap koreksi dicatat.", en: "Everyone with an email account. Correct an email address, a name or a username with a reason; every correction is recorded." },
  "orang.cari": { default: "Nama, email, username, atau PINTAR ID", en: "Name, email, username or PINTAR ID" },
  "orang.kosong": { default: "Belum ada orang dengan akun email di sini.", en: "Nobody here has an email account yet." },
  "orang.kolom.nama": { default: "Nama", en: "Name" },
  "orang.kolom.id": { default: "PINTAR ID", en: "PINTAR ID" },
  "orang.kolom.email": { default: "Email", en: "Email" },
  "orang.kolom.username": { default: "Username", en: "Username" },
  "orang.kolom.keadaan": { default: "Akun", en: "Account" },
  "orang.kolom.tindakan": { default: "Tindakan", en: "Action" },
  "orang.aktif": { default: "Aktif", en: "Active" },
  "orang.belum_aktif": { default: "Belum diaktifkan", en: "Not activated yet" },
  "orang.koreksi": { default: "Koreksi", en: "Correct" },
  "orang.panel": { default: "Koreksi", en: "Correct" },
  "orang.alasan": { default: "Alasan", en: "Reason" },
  "orang.alasan.arti": { default: "Mengapa dikoreksi. Dicatat bersama koreksinya.", en: "Why it is corrected. Recorded with the correction." },
  "orang.menyimpan": { default: "Menyimpan…", en: "Saving…" },
  "orang.email.judul": { default: "Alamat email", en: "Email address" },
  "orang.email.sekarang": { default: "Sekarang:", en: "Now:" },
  "orang.email.baru": { default: "Alamat yang benar", en: "The right address" },
  "orang.email.tombol": { default: "Koreksi email", en: "Correct the email" },
  "orang.email.ok.belum": { default: "Email dikoreksi. Kode lama tidak berlaku lagi; orangnya mengaktifkan akun dengan alamat yang benar.", en: "The email is corrected. Old codes no longer work; the person activates the account at the right address." },
  "orang.email.ok.aktif": { default: "Email dikoreksi. Orangnya masuk dengan alamat baru; PINTAR mengirim surel keamanan ke alamat lama dan alamat baru.", en: "The email is corrected. The person signs in with the new address; PINTAR sends a security email to the old and the new address." },
  "orang.email.hanya_platform": { default: "Akun ini sudah aktif: emailnya hanya bisa dikoreksi oleh Admin platform.", en: "This account is active: its email can only be corrected by the platform admin." },
  "orang.nama.judul": { default: "Nama", en: "Name" },
  "orang.nama.arti": { default: "Sertifikat yang sudah terbit tetap memakai nama saat diterbitkan.", en: "Certificates already issued keep the name as issued." },
  "orang.nama.baru": { default: "Nama yang benar", en: "The right name" },
  "orang.nama.tombol": { default: "Koreksi nama", en: "Correct the name" },
  "orang.nama.ok": { default: "Nama dikoreksi dan dicatat.", en: "The name is corrected and recorded." },
  "orang.username.judul": { default: "Username", en: "Username" },
  "orang.username.arti": { default: "Username dipakai untuk masuk. Beri tahu orangnya username yang baru.", en: "The username is used to sign in. Tell the person their new username." },
  "orang.username.baru": { default: "Username yang benar", en: "The right username" },
  "orang.username.aturan": { default: "4–20 karakter: huruf kecil, angka, titik, garis bawah; diawali huruf.", en: "4–20 characters: lowercase letters, numbers, dots, underscores; starting with a letter." },
  "orang.username.tombol": { default: "Koreksi username", en: "Correct the username" },
  "orang.username.ok": { default: "Username dikoreksi dan dicatat.", en: "The username is corrected and recorded." },
  "orang.identitas.hanya_platform": { default: "Nama dan username hanya bisa dikoreksi oleh Admin platform.", en: "Names and usernames can only be corrected by the platform admin." },
  "orang.gagal.DITOLAK": { default: "Anda tidak bisa membuat koreksi ini.", en: "You can't make this correction." },
  "orang.gagal.REASON_REQUIRED": { default: "Tuliskan alasannya.", en: "Write the reason." },
  "orang.gagal.IDENTITY_NOT_FOUND": { default: "Orang ini tidak ditemukan, atau belum punya username.", en: "This person was not found, or has no username yet." },
  "orang.gagal.NAME_INVALID": { default: "Nama 1 sampai 200 karakter.", en: "A name is 1 to 200 characters." },
  "orang.gagal.NAME_UNCHANGED": { default: "Itu sudah nama orang ini.", en: "That is already this person's name." },
  "orang.gagal.PERMINTAAN_TIDAK_SAH": { default: "Muat ulang halaman ini, lalu coba lagi.", en: "Reload this page, then try again." },
  "orang.gagal.LAYANAN_TIDAK_TERSEDIA": { default: "Koreksi belum tersimpan. Coba lagi sebentar lagi.", en: "The correction was not saved yet. Try again in a moment." },
  "aktivasi.orang.tautan": { default: "Koreksi data orang", en: "Correct a person's details" },
  "aktivasi.orang.arti": { default: "Email yang salah, nama, atau username orang yang sudah punya akun.", en: "A wrong email, a name or a username of someone who already has an account." },
  "orang.email.gagal.PERMINTAAN_DITOLAK": { default: "Muat ulang halaman ini, lalu coba lagi.", en: "Reload this page, then try again." },
  "orang.email.gagal.LAYANAN_TIDAK_TERSEDIA": { default: "Email belum dikoreksi. Coba lagi sebentar lagi.", en: "The email was not corrected yet. Try again in a moment." },
  "orang.email.gagal.BELUM_MASUK": { default: "Sesi Anda sudah berakhir. Masuk lagi, lalu coba lagi.", en: "Your session has ended. Sign in again, then try again." },
  "orang.email.gagal.DITOLAK": { default: "Anda tidak bisa mengoreksi email orang ini.", en: "You can't correct this person's email." },
  "orang.email.gagal.PERMINTAAN_TIDAK_SAH": { default: "Isi alamat yang benar dan alasannya.", en: "Fill in the right address and the reason." },
  "orang.email.gagal.ALASAN_WAJIB": { default: "Tuliskan alasannya.", en: "Write the reason." },
  "orang.email.gagal.EMAIL_TIDAK_SAH": { default: "Periksa alamat emailnya.", en: "Check the email address." },
  "orang.email.gagal.EMAIL_SAMA": { default: "Itu sudah alamat orang ini.", en: "That is already this person's address." },
  "orang.email.gagal.EMAIL_TERPAKAI": { default: "Alamat ini sudah dipakai akun lain.", en: "Another account already uses this address." },
  "orang.email.gagal.AKUN_EMAIL_TIDAK_ADA": { default: "Orang ini tidak punya akun email.", en: "This person has no email account." },
  "akun.foto.judul": { default: "Foto profil", en: "Profile photo" },
  "akun.foto.arti": { default: "Foto ini hanya tampil di profil Anda. Foto tidak dicetak di sertifikat.", en: "This photo shows on your profile only. It is not printed on any certificate." },
  "akun.foto.alt": { default: "Foto profil Anda", en: "Your profile photo" },
  "akun.foto.pilih": { default: "Pilih foto", en: "Choose a photo" },
  "akun.foto.ganti": { default: "Ganti foto", en: "Change the photo" },
  "akun.foto.batas": { default: "PNG, JPEG, atau WebP; paling besar 2 MB.", en: "PNG, JPEG or WebP; at most 2 MB." },
  "akun.foto.besar": { default: "Foto ini lebih besar dari 2 MB. Pilih foto yang lebih kecil.", en: "This photo is larger than 2 MB. Choose a smaller one." },
  "akun.foto.jenis": { default: "Pilih berkas PNG, JPEG, atau WebP.", en: "Choose a PNG, JPEG or WebP file." },
  "akun.foto.hapus": { default: "Hapus foto", en: "Remove the photo" },
  "akun.foto.naik": { default: "Menyimpan foto…", en: "Saving the photo…" },
  "akun.foto.ok": { default: "Foto profil disimpan.", en: "Profile photo saved." },
  "akun.foto.dihapus": { default: "Foto profil dihapus dari profil Anda.", en: "The photo is removed from your profile." },
  "akun.foto.gagal": { default: "Foto belum tersimpan. Coba lagi sebentar lagi.", en: "The photo was not saved yet. Try again in a moment." },
  "aktivasi.ulang.judul": { default: "Kartu hilang atau rusak", en: "Lost or damaged card" },
  "aktivasi.ulang.arti": { default: "Terbitkan kartu baru untuk murid yang kehilangan kartunya atau kartunya rusak. Kartu lama langsung berhenti berlaku; akun, kelas dan semua hasil belajarnya tetap.", en: "Issue a new card for a student whose card is lost or damaged. The old card stops working at once; their account, class and all their learning stay." },
  "aktivasi.ulang.cari": { default: "Cari nama murid", en: "Search for a student's name" },
  "aktivasi.ulang.kosong": { default: "Belum ada murid yang punya kartu kelas.", en: "No student has a class card yet." },
  "aktivasi.ulang.tidak_ketemu": { default: "Tidak ada nama yang cocok.", en: "No name matches." },
  "aktivasi.ulang.akhiran": { default: "Kartu berakhiran", en: "Card ending in" },
  "aktivasi.ulang.pilih": { default: "Terbitkan kartu baru", en: "Issue a new card" },
  "aktivasi.ulang.alasan": { default: "Mengapa?", en: "Why?" },
  "aktivasi.ulang.hilang": { default: "Kartunya hilang", en: "The card is lost" },
  "aktivasi.ulang.rusak": { default: "Kartunya rusak", en: "The card is damaged" },
  "aktivasi.ulang.konfirmasi": { default: "Kartu lama akan langsung berhenti berlaku. Terbitkan kartu baru sekarang?", en: "The old card will stop working at once. Issue the new card now?" },
  "aktivasi.ulang.ya": { default: "Ya, terbitkan kartu baru", en: "Yes, issue the new card" },
  "aktivasi.ulang.batal": { default: "Batal", en: "Cancel" },
  "aktivasi.ulang.sibuk": { default: "Menerbitkan…", en: "Issuing…" },
  "aktivasi.ulang.lembar": { default: "Kartu baru", en: "New card" },
  "aktivasi.ulang.gagal.DITOLAK": { default: "Anda tidak bisa menerbitkan kartu untuk murid ini.", en: "You can't issue a card for this student." },
  "aktivasi.ulang.gagal.KARTU_TIDAK_ADA": { default: "Murid ini belum punya kartu kelas. Buat kartunya di atas.", en: "This student has no class card yet. Make it above." },
  "aktivasi.ulang.gagal.ALASAN_TIDAK_SAH": { default: "Pilih alasannya: hilang atau rusak.", en: "Choose why: lost or damaged." },
  "aktivasi.ulang.gagal.BELUM_MASUK": { default: "Sesi Anda sudah berakhir. Masuk lagi, lalu coba lagi.", en: "Your session has ended. Sign in again, then try again." },
  "aktivasi.ulang.gagal.PERMINTAAN_DITOLAK": { default: "Muat ulang halaman ini, lalu coba lagi.", en: "Reload this page, then try again." },
  "aktivasi.ulang.gagal.LAYANAN_TIDAK_TERSEDIA": { default: "Kartu baru belum bisa diterbitkan. Kartu lama masih berlaku. Coba lagi sebentar lagi.", en: "The new card could not be issued yet. The old card still works. Try again in a moment." },
  "aktivasi.ulang.rujukan": { default: "Rujukan", en: "Reference" },
  "keamanan.eyebrow": { default: "Konfigurasi", en: "Configuration" },
  "keamanan.judul": { default: "Keamanan akun", en: "Account security" },
  "keamanan.intro": { default: "Pemulihan dengan PIN: lihat keadaan satu PINTAR ID, lalu atur ulang dengan alasan yang tercatat.", en: "Recovery with a PIN: see the state of one PINTAR ID, then reset it with a recorded reason." },
  "keamanan.ditolak": { default: "Halaman ini untuk Admin sekolah dan Admin PINTAR.", en: "This page is for school administrators and Admin PINTAR." },
  "keamanan.cari_judul": { default: "Pemulihan dengan PIN", en: "Recovery with a PIN" },
  "keamanan.id_label": { default: "PINTAR ID", en: "PINTAR ID" },
  "keamanan.lihat": { default: "Lihat", en: "Look up" },
  "keamanan.memuat": { default: "Memeriksa…", en: "Checking…" },
  "keamanan.k.NORMAL": { default: "Bisa dipakai", en: "Available" },
  "keamanan.k.LOCKED": { default: "Ditutup sementara, sampai", en: "Locked for a while, until" },
  "keamanan.k.SUSPENDED": { default: "Dihentikan", en: "Stopped" },
  "keamanan.pin_baru": { default: "Pemiliknya belum membuat PIN baru.", en: "Its owner hasn't made a new PIN yet." },
  "keamanan.tanpa_email": { default: "Orang ini tidak punya akun email, jadi tidak memulihkan akun dengan PIN.", en: "This person has no email account, so they don't recover with a PIN." },
  "keamanan.alasan_label": { default: "Alasan atur ulang (wajib, tercatat)", en: "Reason for the reset (required, recorded)" },
  "keamanan.atur_ulang": { default: "Atur ulang pemulihan PIN", en: "Reset PIN recovery" },
  "keamanan.mengatur": { default: "Mengatur ulang…", en: "Resetting…" },
  "keamanan.selesai": { default: "Pemulihan dengan PIN sudah diatur ulang, dan semua sesi pemiliknya diakhiri. Pemiliknya harus membuat PIN baru di Akun saya; pemiliknya dan penerima keamanan PINTAR dikirimi email.", en: "Recovery with a PIN has been reset, and all its owner's sessions have ended. Its owner must make a new PIN in My account; the owner and PINTAR's security recipient are sent an email." },
  "keamanan.gagal.ID_TIDAK_SAH": { default: "Periksa PINTAR ID: 8 huruf dan angka.", en: "Check the PINTAR ID: 8 letters and digits." },
  "keamanan.gagal.TIDAK_ADA": { default: "Tidak ada orang dengan PINTAR ID ini yang bisa Anda bantu.", en: "Nobody you can help has this PINTAR ID." },
  "keamanan.gagal.ALASAN_KOSONG": { default: "Tulis alasannya. Alasan ini tercatat.", en: "Write the reason. It is recorded." },
  "keamanan.gagal.DITOLAK": { default: "Hanya Admin sekolah dan Admin PINTAR yang bisa melakukan ini.", en: "Only a school administrator or an Admin PINTAR can do this." },
  "keamanan.gagal.BELUM_MASUK": { default: "Sesi Anda sudah berakhir. Masuk lagi.", en: "Your session has ended. Sign in again." },
  // D-101 (1): one's own recovery is assisted by another administrator, never by oneself
  "keamanan.gagal.SENDIRI": { default: "Pemulihan akun Anda sendiri dibantu oleh admin lain, bukan dari sini.", en: "Your own account's recovery is done by another administrator, not here." },
  // BOB-29 (Gate 6): a class card (.kartu) is never named and types the card's PIN; staff type their personal PIN
  "kunci.judul": { default: "PINTAR terkunci", en: "PINTAR is locked" },
  "kunci.untuk": { default: "Terkunci untuk", en: "Locked for" },
  "kunci.lede": { default: "Komputer ini tidak dipakai selama 5 menit, jadi PINTAR menutup layar ini agar data Anda aman. Ketik PIN pribadi Anda untuk melanjutkan.", en: "This computer wasn't used for 5 minutes, so PINTAR closed this screen to keep your information safe. Type your personal PIN to continue." },
  "kunci.lede.kartu": { default: "Komputer ini tidak dipakai selama 5 menit, jadi PINTAR menutup layar ini. Ketik PIN kartu Anda untuk melanjutkan.", en: "This computer wasn't used for 5 minutes, so PINTAR closed this screen. Type your card's PIN to continue." },
  "kunci.pin_label": { default: "PIN pribadi (4 angka)", en: "Personal PIN (4 digits)" },
  "kunci.pin_label.kartu": { default: "PIN kartu", en: "Card PIN" },
  "kunci.kosong": { default: "Ketik PIN Anda: 4 angka.", en: "Type your PIN: 4 digits." },
  "kunci.kosong.kartu": { default: "Ketik PIN kartu Anda.", en: "Type your card's PIN." },
  "kunci.lanjut": { default: "Lanjutkan", en: "Continue" },
  "kunci.memeriksa": { default: "Memeriksa…", en: "Checking…" },
  "kunci.tidak_cocok.2": { default: "PIN tidak cocok. Anda bisa mencoba 2 kali lagi.", en: "That PIN doesn't match. You can try 2 more times." },
  "kunci.tidak_cocok.1": { default: "PIN tidak cocok. Anda bisa mencoba 1 kali lagi; jika tidak cocok lagi, Anda perlu masuk lagi.", en: "That PIN doesn't match. You can try once more; if it doesn't match again, you'll need to sign in again." },
  "kunci.berakhir": { default: "Sesi di komputer ini sudah berakhir. Masuk lagi untuk melanjutkan.", en: "The session on this computer has ended. Sign in again to continue." },
  "kunci.masuk": { default: "Masuk", en: "Sign in" },
  "kunci.tanpa_pin": { default: "Akun ini belum punya PIN, jadi layar ini tidak bisa dibuka dengan PIN. Keluar, lalu masuk lagi.", en: "This account has no PIN yet, so this screen can't be opened with a PIN. Sign out, then sign in again." },
  "kunci.lupa": { default: "Lupa PIN? Keluar, lalu masuk lagi dengan password Anda.", en: "Forgot your PIN? Sign out, then sign in again with your password." },
  "kunci.lupa.kartu": { default: "Lupa PIN? Keluar, lalu minta bantuan guru Anda.", en: "Forgot your PIN? Sign out, then ask your teacher for help." },
  "kunci.bukan_anda.arti": { default: "Keluar dulu, supaya Anda bisa masuk dengan akun Anda sendiri.", en: "Sign out first, so you can sign in with your own account." },
  "kunci.gagal": { default: "PINTAR belum bisa memeriksa PIN. Coba lagi sebentar lagi.", en: "PINTAR couldn't check the PIN. Try again in a moment." },
  "jaga.peringatan": { default: "Komputer ini belum dipakai selama 4 menit. Sebentar lagi PINTAR menutup layar ini; Anda bisa membukanya lagi dengan PIN.", en: "This computer hasn't been used for 4 minutes. In a moment PINTAR will close this screen; you can open it again with your PIN." },
  "jaga.masih": { default: "Saya masih di sini", en: "I'm still here" },
  "perangkat.judul": { default: "Komputer siapa ini?", en: "Whose computer is this?" },
  "perangkat.lede": { default: "PINTAR menjaga akun Anda sesuai komputer yang Anda pakai. Anda bisa mengubah pilihan ini nanti di Akun saya.", en: "PINTAR looks after your account to suit the computer you use. You can change this later in My account." },
  "perangkat.bersama": { default: "Komputer bersama", en: "A shared computer" },
  "perangkat.bersama.arti": { default: "Dipakai bergantian, seperti komputer sekolah atau lab. Setelah 5 menit tidak dipakai, PINTAR menutup layar dan Anda membukanya lagi dengan PIN. Ini pilihan yang lebih aman.", en: "Used by others too, like a school or lab computer. After 5 minutes without use, PINTAR closes the screen and you open it again with your PIN. This is the safer choice." },
  "perangkat.pribadi": { default: "Komputer pribadi saya", en: "My personal computer" },
  "perangkat.pribadi.arti": { default: "Hanya Anda yang memakainya. Anda tetap masuk hingga 7 hari tanpa dipakai.", en: "Only you use it. You stay signed in for up to 7 days without use." },
  "perangkat.catatan": { default: "Ini pilihan Anda untuk browser ini, bukan bukti kepemilikan.", en: "This is your choice for this browser, not proof of ownership." },
  "perangkat.simpan": { default: "Simpan pilihan", en: "Save my choice" },
  "perangkat.menyimpan": { default: "Menyimpan…", en: "Saving…" },
  "perangkat.gagal": { default: "Pilihan ini belum tersimpan. Coba lagi.", en: "This choice wasn't saved. Try again." },
  "akun.perangkat.judul": { default: "Komputer ini", en: "This computer" },
  "akun.perangkat.SHARED": { default: "Komputer bersama: layar ditutup setelah 5 menit tidak dipakai.", en: "A shared computer: the screen closes after 5 minutes without use." },
  "akun.perangkat.PERSONAL": { default: "Komputer pribadi Anda: Anda tetap masuk hingga 7 hari.", en: "Your personal computer: you stay signed in for up to 7 days." },
  "akun.perangkat.ubah": { default: "Ubah", en: "Change" },
  "akun.semua.judul": { default: "Keluar dari semua perangkat", en: "Sign out of every device" },
  "akun.semua.arti": { default: "Akun Anda keluar dari setiap komputer dan perangkat tempat Anda masuk, termasuk yang ini. Setelah itu Anda masuk lagi di perangkat yang Anda pakai.", en: "Your account is signed out of every computer and device where you're signed in, including this one. Then you sign in again on the device you use." },
  "akun.semua.tombol": { default: "Keluar dari semua perangkat", en: "Sign out of every device" },
  "akun.semua.yakin": { default: "Keluar dari semua perangkat sekarang?", en: "Sign out of every device now?" },
  "akun.semua.ya": { default: "Keluar dari semua", en: "Sign out everywhere" },
  "akun.semua.batal": { default: "Batal", en: "Cancel" },
  "akun.semua.gagal": { default: "PINTAR belum bisa mengeluarkan akun Anda dari semua perangkat. Coba lagi.", en: "PINTAR couldn't sign you out everywhere yet. Try again." },
  "masuk.sesi_berakhir": { default: "Sesi di komputer ini sudah berakhir. Masuk lagi untuk melanjutkan.", en: "The session on this computer has ended. Sign in again to continue." },
  "keamanan.gagal.PERMINTAAN_DITOLAK": { default: "Muat ulang halaman ini, lalu coba lagi.", en: "Reload this page, then try again." },
  "keamanan.gagal.LAYANAN_TIDAK_TERSEDIA": { default: "PINTAR belum bisa menjawab. Coba lagi sebentar lagi.", en: "PINTAR can't answer yet. Try again in a moment." },
  "keamanan.catatan_judul": { default: "Catatan keamanan terbaru", en: "Latest security record" },
  "keamanan.catatan_kosong": { default: "Belum ada catatan.", en: "No record yet." },
  "keamanan.kolom.waktu": { default: "Waktu", en: "Time" },
  "keamanan.kolom.peristiwa": { default: "Kejadian", en: "Event" },
  "keamanan.kolom.id": { default: "PINTAR ID", en: "PINTAR ID" },
  "keamanan.a.identity.recovery_pin_ok": { default: "PIN cocok untuk pemulihan", en: "PIN matched for recovery" },
  "keamanan.a.identity.recovery_pin_wrong": { default: "PIN pemulihan tidak cocok", en: "Recovery PIN did not match" },
  "keamanan.a.identity.recovery_locked": { default: "Pemulihan dengan PIN ditutup sementara", en: "PIN recovery locked" },
  "keamanan.a.identity.recovery_suspended": { default: "Pemulihan dengan PIN dihentikan", en: "PIN recovery stopped" },
  "keamanan.a.identity.recovery_restored": { default: "Pemulihan dengan PIN dipulihkan", en: "PIN recovery restored" },
  "keamanan.a.identity.recovery_verified": { default: "Izin membuat password baru diberikan", en: "Permission to make a new password given" },
  "keamanan.a.identity.password_set": { default: "Password ditulis", en: "Password written" },
  "keamanan.a.identity.pin_set": { default: "PIN dibuat", en: "PIN made" },
  "keamanan.a.account.card_reissued": { default: "Kartu kelas diterbitkan ulang", en: "Class card re-issued" },
  "email.aman.id": { default: "PINTAR ID", en: "PINTAR ID" },
  "email.aman.waktu": { default: "Waktu", en: "Time" },
  "email.aman.tombol": { default: "Pulihkan akun lewat email", en: "Recover your account by email" },
  "email.aman.admin_catatan": { default: "Email ini untuk penerima keamanan PINTAR. Isinya tidak memuat PIN, kode, password atau alamat siapa pun.", en: "This email is for PINTAR's security recipient. It carries no PIN, code, password or anyone's address." },
  "email.aman.alasan": { default: "Anda menerima email ini karena ada kejadian keamanan pada akun PINTAR dengan alamat ini.", en: "You are receiving this email because of a security event on the PINTAR account with this address." },
  "email.aman.alasan_admin": { default: "Anda menerima email ini sebagai penerima keamanan PINTAR.", en: "You are receiving this email as PINTAR's security recipient." },
  "email.aman.terkunci.subjek": { default: "Pemulihan dengan PIN untuk akun PINTAR Anda ditutup sementara", en: "Recovery with a PIN for your PINTAR account is locked for a while" },
  "email.aman.terkunci.judul": { default: "Pemulihan dengan PIN ditutup sementara", en: "Recovery with a PIN is locked for a while" },
  "email.aman.terkunci.isi": { default: "Seseorang memasukkan PIN yang tidak cocok beberapa kali untuk PINTAR ID Anda, jadi pemulihan dengan PIN ditutup sementara. Akun, password dan perangkat Anda tidak berubah.", en: "Someone typed a PIN that didn't match several times for your PINTAR ID, so recovery with a PIN is locked for a while. Your account, password and devices have not changed." },
  "email.aman.terkunci.bukan_anda": { default: "Jika bukan Anda, PIN Anda tetap aman selama tidak Anda berikan kepada siapa pun. Anda selalu bisa memulihkan akun lewat email.", en: "If it wasn't you, your PIN stays safe as long as you don't give it to anyone. You can always recover your account by email." },
  "email.aman.terkunci.subjek_admin": { default: "Pemulihan dengan PIN ditutup sementara", en: "PIN recovery locked" },
  "email.aman.terkunci.isi_admin": { default: "Pemulihan dengan PIN untuk PINTAR ID ini ditutup sementara setelah tiga PIN tidak cocok.", en: "Recovery with a PIN for this PINTAR ID is locked for a while after three PINs that didn't match." },
  "email.aman.ditangguhkan.subjek": { default: "Pemulihan dengan PIN untuk akun PINTAR Anda dihentikan", en: "Recovery with a PIN for your PINTAR account has been stopped" },
  "email.aman.ditangguhkan.judul": { default: "Pemulihan dengan PIN dihentikan", en: "Recovery with a PIN has been stopped" },
  "email.aman.ditangguhkan.isi": { default: "PIN yang tidak cocok dimasukkan terlalu sering untuk PINTAR ID Anda, jadi pemulihan dengan PIN dihentikan. Akun, password dan perangkat Anda tidak berubah. Untuk memakainya lagi, pulihkan akun lewat email, lalu buat PIN baru di Akun saya.", en: "A PIN that didn't match was typed too often for your PINTAR ID, so recovery with a PIN has been stopped. Your account, password and devices have not changed. To use it again, recover your account by email, then make a new PIN in My account." },
  "email.aman.ditangguhkan.bukan_anda": { default: "Jika bukan Anda, seseorang mungkin mencoba menebak PIN Anda. PIN lama Anda tidak akan berlaku lagi.", en: "If it wasn't you, someone may be trying to guess your PIN. Your old PIN will not work again." },
  "email.aman.ditangguhkan.subjek_admin": { default: "Pemulihan dengan PIN dihentikan", en: "PIN recovery stopped" },
  "email.aman.ditangguhkan.isi_admin": { default: "Pemulihan dengan PIN untuk PINTAR ID ini dihentikan setelah ditutup sementara tiga kali. Hanya pemulihan lewat email (lalu PIN baru) atau atur ulang oleh admin platform yang memulihkannya.", en: "Recovery with a PIN for this PINTAR ID has been stopped after being locked three times. Only an email recovery (then a new PIN) or the platform administrator's reset restores it." },
  "email.aman.pulih_pin.subjek": { default: "PINTAR ID dan PIN Anda dipakai untuk memulihkan akun", en: "Your PINTAR ID and PIN were used to recover your account" },
  "email.aman.pulih_pin.judul": { default: "Pemulihan akun dengan PIN", en: "Account recovery with a PIN" },
  "email.aman.pulih_pin.isi": { default: "PINTAR ID dan PIN Anda baru saja dipakai untuk mulai membuat password baru.", en: "Your PINTAR ID and PIN were just used to start making a new password." },
  "email.aman.pulih_pin.bukan_anda": { default: "Jika bukan Anda, segera pulihkan akun lewat email dan hubungi admin sekolah Anda: seseorang mungkin tahu PIN Anda.", en: "If it wasn't you, recover your account by email at once and contact your school's administrator: someone may know your PIN." },
  "email.aman.pulih_pin.subjek_admin": { default: "Pemulihan dengan PIN berhasil", en: "PIN recovery succeeded" },
  "email.aman.pulih_pin.isi_admin": { default: "PINTAR ID dan PIN yang cocok dipakai untuk mulai memulihkan akun ini.", en: "A matching PINTAR ID and PIN were used to start recovering this account." },
  "email.aman.diatur_ulang.subjek": { default: "Pemulihan dengan PIN untuk akun PINTAR Anda diatur ulang", en: "Recovery with a PIN for your PINTAR account was reset" },
  "email.aman.diatur_ulang.judul": { default: "Buat PIN baru", en: "Make a new PIN" },
  "email.aman.diatur_ulang.isi": { default: "Admin PINTAR mengatur ulang pemulihan dengan PIN untuk akun Anda. PIN lama Anda tidak berlaku lagi, dan Anda sudah dikeluarkan dari semua perangkat: masuk ke PINTAR, lalu buat PIN baru di Akun saya.", en: "A PINTAR administrator reset recovery with a PIN for your account. Your old PIN no longer works, and you have been signed out of every device: sign in to PINTAR, then make a new PIN in My account." },
  "email.aman.diatur_ulang.bukan_anda": { default: "Jika Anda tidak memintanya, hubungi admin sekolah Anda.", en: "If you didn't ask for this, contact your school's administrator." },
  "email.aman.diatur_ulang.subjek_admin": { default: "Pemulihan dengan PIN diatur ulang", en: "PIN recovery reset" },
  "email.aman.diatur_ulang.isi_admin": { default: "Pemulihan dengan PIN untuk PINTAR ID ini diatur ulang oleh admin sekolah atau admin platform. Pemiliknya harus membuat PIN baru.", en: "A school administrator or the platform administrator reset recovery with a PIN for this PINTAR ID. Its owner must make a new PIN." },
  // CR-13 (D-120 QN1): an email corrected after activation, told to the old and the new address (DAISY: copy to review)
  "email.aman.email_dikoreksi.subjek": { default: "Alamat email akun PINTAR Anda dikoreksi", en: "The email address of your PINTAR account was corrected" },
  "email.aman.email_dikoreksi.judul": { default: "Alamat email dikoreksi", en: "Email address corrected" },
  "email.aman.email_dikoreksi.isi": { default: "Alamat email untuk masuk ke akun PINTAR dengan PINTAR ID ini sudah dikoreksi oleh admin. Mulai sekarang PINTAR mengirim email ke alamat yang baru. Akun ini sudah keluar dari semua perangkat; masuklah lagi dengan alamat yang baru. Password dan PIN Anda tetap sama.", en: "The sign-in email address of the PINTAR account with this PINTAR ID has been corrected by an administrator. From now on PINTAR sends email to the new address. This account has been signed out of every device; sign in again with the new address. Your password and PIN stay the same." },
  "email.aman.email_dikoreksi.bukan_anda": { default: "Bukan Anda yang meminta koreksi ini? Segera hubungi admin sekolah Anda.", en: "Didn't ask for this correction? Contact your school's administrator straight away." },
  "email.aman.email_dikoreksi.subjek_admin": { default: "Alamat email sebuah akun dikoreksi", en: "An account's email address was corrected" },
  "email.aman.email_dikoreksi.isi_admin": { default: "Alamat email untuk masuk ke akun dengan PINTAR ID ini sudah dikoreksi. Siapa yang mengoreksi, alasannya dan kedua alamat ada di catatan keamanan.", en: "The sign-in email address of the account with this PINTAR ID has been corrected. Who corrected it, the reason and both addresses are in the security record." },
  "aktifkan.minta_sering": { default: "Kode untuk alamat ini sudah terlalu sering diminta, jadi kode tidak dikirim.", en: "A code has been asked for this address too often, so no code was sent." },
  "aktifkan.email_tertahan": { default: "PINTAR belum bisa mengirim email saat ini, jadi kode tidak dikirim.", en: "PINTAR can't send email right now, so no code was sent." },
  "aktifkan.tidak_tersedia": { default: "PINTAR sedang tidak dapat memproses ini. Coba lagi sebentar lagi.", en: "PINTAR can't handle this right now. Try again in a little while." },
  "aktifkan.rujukan_arti": { default: "Bila masih terjadi, sampaikan kode rujukan berikut kepada yang mengurus PINTAR di sekolah Anda.", en: "If it keeps happening, give the reference that follows to whoever looks after PINTAR at your school." },
  // DAISY-20: the wizard, signed in (username → password → PIN → name → the welcome).
  "aktifkan.langkah": { default: "Langkah", en: "Step" },
  "aktifkan.dari": { default: "dari", en: "of" },
  "aktifkan.memuat": { default: "Memuat…", en: "Loading…" },
  "aktifkan.menyimpan": { default: "Menyimpan…", en: "Saving…" },
  "aktifkan.menyelesaikan": { default: "Menyelesaikan aktivasi…", en: "Finishing the activation…" },
  "aktifkan.keluar": { default: "Keluar dan lanjutkan nanti", en: "Sign out and continue later" },
  "aktifkan.mulai_lagi": { default: "Mulai lagi", en: "Start again" },
  "aktifkan.belum_masuk": { default: "Sesi aktivasi Anda sudah berakhir. Mulai lagi dengan meminta kode baru.", en: "Your activation session has ended. Start again by asking for a new code." },
  "aktifkan.tidak_berlaku": { default: "Akun ini tidak perlu diaktifkan di sini.", en: "This account doesn't need activating here." },
  "aktifkan.sudah_selesai": { default: "Akun Anda sudah aktif. Tidak ada lagi yang perlu diisi.", en: "Your account is already active. There is nothing more to fill in." },
  "aktifkan.belum_lengkap": { default: "Masih ada langkah yang belum selesai. Lengkapi dulu langkah ini.", en: "A step isn't finished yet. Complete this step first." },
  "aktifkan.u_judul": { default: "Pilih username", en: "Choose a username" },
  "aktifkan.u_lede": { default: "Selain email, Anda bisa masuk ke PINTAR dengan username. Pilih dengan teliti: username tidak bisa diganti.", en: "Besides your email, you can sign in to PINTAR with a username. Choose carefully: a username can't be changed." },
  "aktifkan.u_label": { default: "Username", en: "Username" },
  "aktifkan.u_aturan": { default: "4–20 karakter: huruf kecil, angka, titik (.) atau garis bawah (_), diawali huruf.", en: "4–20 characters: lowercase letters, numbers, dots (.) or underscores (_), starting with a letter." },
  "aktifkan.u_simpan": { default: "Simpan username", en: "Save the username" },
  "aktifkan.p_judul": { default: "Buat password", en: "Create a password" },
  "aktifkan.p_lede": { default: "Password ini dipakai untuk masuk ke PINTAR, bersama email atau username Anda.", en: "You'll use this password to sign in to PINTAR, with your email or username." },
  "aktifkan.p_min": { default: "Paling sedikit", en: "At least" },
  "aktifkan.p_min_lalu": { default: "karakter.", en: "characters." },
  "aktifkan.p_wajib": { default: "Harus berisi", en: "Must include" },
  "aktifkan.p_k.HURUF_KECIL": { default: "huruf kecil", en: "a lowercase letter" },
  "aktifkan.p_k.HURUF_BESAR": { default: "huruf besar", en: "an uppercase letter" },
  "aktifkan.p_k.ANGKA": { default: "angka", en: "a number" },
  "aktifkan.p_k.SIMBOL": { default: "simbol", en: "a symbol" },
  "aktifkan.p_bocor": { default: "Password yang pernah bocor di internet tidak bisa dipakai.", en: "A password that has appeared in a known data leak can't be used." },
  "aktifkan.p_label": { default: "Password", en: "Password" },
  "aktifkan.p_ulang": { default: "Ketik ulang password", en: "Type the password again" },
  "aktifkan.p_simpan": { default: "Simpan password", en: "Save the password" },
  "aktifkan.p_kosong": { default: "Ketik password dulu.", en: "Type a password first." },
  "aktifkan.p_beda": { default: "Kedua password belum sama. Ketik ulang keduanya.", en: "The two passwords don't match. Type both again." },
  "aktifkan.n_judul": { default: "Buat PIN pribadi", en: "Create your personal PIN" },
  "aktifkan.n_lede": { default: "PIN ini rahasia kedua Anda, di samping password. Jangan beri tahu siapa pun, termasuk yang mengurus PINTAR di sekolah Anda.", en: "This PIN is your second secret, alongside your password. Don't tell anyone, including whoever looks after PINTAR at your school." },
  "aktifkan.n_label": { default: "PIN (4 angka)", en: "PIN (4 digits)" },
  "aktifkan.n_aturan": { default: "Hindari PIN yang mudah ditebak: angka yang sama (1111), berurutan (1234), berpola (1212, 2580), atau tahun (1990).", en: "Avoid a PIN that is easy to guess: one digit repeated (1111), digits in order (1234), a pattern (1212, 2580), or a year (1990)." },
  "aktifkan.n_ulang": { default: "Ketik ulang PIN", en: "Type the PIN again" },
  "aktifkan.n_simpan": { default: "Simpan PIN", en: "Save the PIN" },
  "aktifkan.n_beda": { default: "Kedua PIN belum sama. Ketik ulang keduanya.", en: "The two PINs don't match. Type both again." },
  "aktifkan.m_judul": { default: "Periksa nama Anda", en: "Check your name" },
  "aktifkan.m_lede": { default: "Nama ini dipakai di seluruh PINTAR, termasuk di sertifikat Anda. Pastikan ejaannya benar.", en: "This name is used throughout PINTAR, including on your certificates. Make sure it is spelled correctly." },
  "aktifkan.m_sekali": { default: "Nama dikonfirmasi sekali saja. Setelah itu, untuk mengubahnya, hubungi yang mengurus PINTAR di sekolah Anda.", en: "You confirm your name once. After that, to change it, contact whoever looks after PINTAR at your school." },
  "aktifkan.m_benar": { default: "Sudah benar", en: "That's right" },
  "aktifkan.m_ubah": { default: "Ubah nama", en: "Change the name" },
  "aktifkan.m_label": { default: "Nama lengkap", en: "Full name" },
  "aktifkan.m_batal": { default: "Batal", en: "Cancel" },
  "aktifkan.w_siap": { default: "Akun Anda sudah aktif. Mulai sekarang, masuk dengan email atau username, dan password Anda.", en: "Your account is active. From now on, sign in with your email or username, and your password." },
  "aktifkan.w_kartu_terkirim": { default: "Kartu PINTAR Anda sudah diserahkan ke server email untuk dikirim ke alamat Anda. PINTAR tidak bisa memastikan email itu sampai; jika belum ada di kotak masuk, periksa folder Spam, atau kirim lagi dari Akun saya.", en: "Your PINTAR Card has been handed to the email server for your address. PINTAR can't confirm it arrives; if it isn't in your inbox, check your Spam folder, or send it again from My account." },
  "aktifkan.w_kartu_belum": { default: "Kartu PINTAR belum bisa dikirim ke email Anda sekarang. Anda bisa mengirimnya lagi nanti dari Akun saya.", en: "Your PINTAR Card couldn't be emailed just now. You can send it again later from My account." },
  "aktifkan.w_masuk": { default: "Masuk ke PINTAR", en: "Go to PINTAR" },
  // DAISY-20: what the server can refuse, one sentence per code (BOB-24's C9 rules and PIN list; BOB-26 §3).
  "aktifkan.kode.USERNAME_LENGTH": { default: "Username harus 4–20 karakter.", en: "A username is 4–20 characters." },
  "aktifkan.kode.USERNAME_CHARACTERS": { default: "Username hanya boleh berisi huruf kecil, angka, titik, dan garis bawah.", en: "A username can only contain lowercase letters, numbers, dots and underscores." },
  "aktifkan.kode.USERNAME_START": { default: "Username harus diawali huruf.", en: "A username must start with a letter." },
  "aktifkan.kode.USERNAME_EMAIL_SHAPE": { default: "Username tidak boleh berisi @. Email Anda sendiri sudah bisa dipakai untuk masuk.", en: "A username can't contain @. Your email already works for signing in." },
  "aktifkan.kode.USERNAME_ID_SHAPE": { default: "Username yang hanya 8 huruf dan angka tidak bisa dipakai. Tambahkan satu karakter, atau pakai titik atau garis bawah.", en: "A username of only 8 letters and numbers can't be used. Add a character, or use a dot or an underscore." },
  "aktifkan.kode.USERNAME_NUMBER": { default: "Username tidak boleh hanya berisi angka.", en: "A username can't be only numbers." },
  "aktifkan.kode.USERNAME_RESERVED": { default: "Username ini disediakan untuk PINTAR sendiri. Pilih yang lain.", en: "This username is kept for PINTAR itself. Choose another." },
  "aktifkan.kode.USERNAME_TAKEN": { default: "Username ini sudah dipakai orang lain. Pilih yang lain.", en: "Someone else already has this username. Choose another." },
  "aktifkan.kode.USERNAME_ALREADY_SET": { default: "Username Anda sudah tersimpan dan tidak bisa diganti.", en: "Your username is already saved and can't be changed." },
  "aktifkan.kode.PASSWORD_LEMAH.PANJANG": { default: "Password ini terlalu pendek.", en: "This password is too short." },
  "aktifkan.kode.PASSWORD_LEMAH.BOCOR": { default: "Password ini pernah bocor di internet, jadi orang lain bisa menebaknya. Pilih password lain.", en: "This password has appeared in a data leak, so others could guess it. Choose another." },
  "aktifkan.kode.PASSWORD_LEMAH.KARAKTER": { default: "Password ini belum berisi semua jenis karakter yang diminta.", en: "This password doesn't include every kind of character asked for." },
  "aktifkan.kode.PASSWORD_TERLALU_PANJANG": { default: "Password ini terlalu panjang. Pilih yang lebih pendek.", en: "This password is too long. Choose a shorter one." },
  "aktifkan.kode.PIN_FORMAT": { default: "PIN harus 4 angka.", en: "A PIN is 4 digits." },
  "aktifkan.kode.PIN_REPEATED": { default: "PIN ini hanya satu angka yang diulang. Pilih PIN lain.", en: "This PIN is one digit repeated. Choose another." },
  "aktifkan.kode.PIN_SEQUENCE": { default: "PIN ini angka berurutan, jadi mudah ditebak. Pilih PIN lain.", en: "This PIN is digits in order, so it is easy to guess. Choose another." },
  "aktifkan.kode.PIN_PATTERN": { default: "PIN ini berpola, seperti 1212 atau 1122, jadi mudah ditebak. Pilih PIN lain.", en: "This PIN is a pattern, like 1212 or 1122, so it is easy to guess. Choose another." },
  "aktifkan.kode.PIN_KEYPAD": { default: "PIN ini satu garis lurus di papan angka, jadi mudah ditebak. Pilih PIN lain.", en: "This PIN is a straight line on the keypad, so it is easy to guess. Choose another." },
  "aktifkan.kode.PIN_YEAR": { default: "PIN ini terbaca seperti tahun, jadi mudah ditebak. Pilih PIN lain.", en: "This PIN reads like a year, so it is easy to guess. Choose another." },
  "aktifkan.kode.PIN_COMMON": { default: "PIN ini termasuk yang paling sering dipakai orang. Pilih PIN lain.", en: "This PIN is one of the most commonly used. Choose another." },
  "aktifkan.kode.PIN_ALREADY_SET": { default: "PIN Anda sudah tersimpan.", en: "Your PIN is already saved." },
  "aktifkan.kode.PIN_REUSED": { default: "PIN ini pernah Anda pakai dan tidak bisa dipakai lagi. Pilih PIN lain.", en: "You have used this PIN before, and it can't be used again. Choose another." },
  "aktifkan.kode.NAMA_TIDAK_SAH": { default: "Tulis nama Anda. Nama tidak boleh kosong atau lebih dari 200 karakter.", en: "Write your name. It can't be empty or longer than 200 characters." },
  "aktifkan.kode.NAMA_SUDAH_DIKONFIRMASI": { default: "Nama Anda sudah dikonfirmasi.", en: "Your name is already confirmed." },
  // DAISY-20: «Masuk ke PINTAR» with a password (D-054(a)); the email link stays behind «Lupa password?» until C14.
  "auth.pw_identitas": { default: "Email atau username", en: "Email or username" },
  "auth.pw_password": { default: "Password", en: "Password" },
  "auth.pw_show": { default: "Tampilkan password", en: "Show password" },
  "auth.pw_hide": { default: "Sembunyikan password", en: "Hide password" },
  "auth.pw_masuk": { default: "Masuk", en: "Sign in" },
  "auth.pw_kosong": { default: "Isi email atau username, dan password Anda dulu.", en: "Fill in your email or username, and your password, first." },
  "auth.pw_gagal": { default: "Email, username, atau password belum cocok. Periksa lagi, lalu coba sekali lagi.", en: "The email, username or password doesn't match. Check them, then try once more." },
  "auth.pw_sering": { default: "Sudah terlalu sering dicoba.", en: "It has been tried too many times." },
  "auth.pw_lupa": { default: "Lupa password?", en: "Forgot your password?" },
  "auth.link_h1": { default: "Masuk dengan tautan email", en: "Sign in with an email link" },
  "auth.link_lede": { default: "Masukkan email Anda. Jika alamat itu terhubung dengan akun PINTAR, tautan untuk masuk dikirim ke sana.", en: "Enter your email. If that address is linked to a PINTAR account, a sign-in link is sent to it." },
  "auth.ke_password": { default: "Masuk dengan password", en: "Sign in with a password" },
  // owner ruling 2 (9 Nov): a closed account asks to be reopened, signed out; an Admin PINTAR decides after verifying identity
  "auth.tutup_tanya": { default: "Akun Anda sudah ditutup?", en: "Has your account been closed?" },
  "auth.tutup_go": { default: "Minta dibuka kembali", en: "Ask for it to be reopened" },
  "buka_kembali.judul": { default: "Minta akun dibuka kembali", en: "Ask for your account to be reopened" },
  "buka_kembali.arti": { default: "Akun yang sudah ditutup tidak dibuka dengan sendirinya. Admin PINTAR membaca permintaan ini, memastikan bahwa Anda pemilik akun itu, lalu memutuskan. Catatan Anda tetap tersimpan selama akun tertutup.", en: "A closed account is never reopened by itself. An Admin PINTAR reads this request, makes sure you are the account's owner, then decides. Your records stay kept while the account is closed." },
  "buka_kembali.identitas": { default: "Email atau username", en: "Email or username" },
  "buka_kembali.pesan": { default: "Pesan untuk Admin PINTAR", en: "Message for the Admin PINTAR" },
  "buka_kembali.pesan_arti": { default: "Tuliskan mengapa Anda ingin kembali dan bagaimana Admin PINTAR dapat menghubungi Anda untuk memastikan identitas Anda. 10 sampai 500 karakter.", en: "Say why you want to come back and how an Admin PINTAR can reach you to confirm who you are. 10 to 500 characters." },
  "buka_kembali.kirim": { default: "Kirim permintaan", en: "Send the request" },
  "buka_kembali.terkirim": { default: "Terima kasih. Jika akun itu memang sudah ditutup, permintaan Anda kini menunggu di Admin PINTAR. Akun dibuka kembali hanya setelah Admin PINTAR memastikan identitas Anda.", en: "Thank you. If that account has been closed, your request is now waiting with an Admin PINTAR. The account is reopened only after an Admin PINTAR has confirmed who you are." },
  "buka_kembali.galat.isian": { default: "Isi email atau PINTAR ID, dan pesan 10 sampai 500 karakter.", en: "Fill in the email or PINTAR ID, and a message of 10 to 500 characters." },
  "buka_kembali.galat.tunggu": { default: "Baru saja ada permintaan dari jaringan ini. Tunggu beberapa menit, lalu coba lagi.", en: "A request was just sent from this network. Wait a few minutes, then try again." },
  "buka_kembali.galat.umum": { default: "Permintaan belum terkirim. Coba lagi.", en: "The request was not sent. Try again." },
  "buka_kembali.ke_masuk": { default: "Kembali ke halaman masuk", en: "Back to sign-in" },
  "keamanan.permintaan.buka_kembali": { default: "Buka kembali akun", en: "Reopen the account" },
  "keamanan.permintaan.pesan": { default: "Pesan", en: "Message" },
  "keamanan.permintaan.cara_verifikasi": { default: "Bagaimana identitas orang ini dipastikan", en: "How this person's identity was confirmed" },
  "keamanan.permintaan.cara_verifikasi_arti": { default: "Wajib, 10 sampai 300 karakter. Tercatat di jejak audit.", en: "Required, 10 to 300 characters. Recorded in the audit trail." },
  "keamanan.permintaan.verifikasi_centang": { default: "Saya sudah memastikan bahwa orang ini pemilik akun.", en: "I have confirmed this person owns the account." },
  "keamanan.akun.tutup_lewat_permintaan": { default: "Akun yang ditutup atas permintaan pemiliknya dibuka kembali hanya dari permintaannya di antrean, setelah identitasnya dipastikan.", en: "An account closed at its owner's request is reopened only from their request in the queue, after their identity is confirmed." },
  "keamanan.akun.ok.buka": { default: "Akun dibuka kembali. Pemiliknya dapat masuk lagi.", en: "The account is reopened. Its owner can sign in again." },
  "akun.tinggal.jenis.reopen": { default: "Minta akun dibuka kembali", en: "Reopen my account" },
  "akun.tinggal.galat.account_reopen_via_request": { default: "Akun yang ditutup atas permintaan pemiliknya dibuka kembali hanya dari permintaannya, setelah identitasnya dipastikan.", en: "An account closed at its owner's request is reopened only from their request, after their identity is confirmed." },
  "audit.aksi.account.reopen_requested": { default: "Permintaan membuka kembali akun", en: "Request to reopen an account" },
  "auth.aktifkan_tanya": { default: "Belum mengaktifkan akun?", en: "Haven't activated your account yet?" },
  "auth.aktifkan_go": { default: "Aktifkan akun", en: "Activate your account" },
  // DAISY-20: Akun saya (BOB-26 §4), staff only (C17).
  "sesi.akun": { default: "Akun saya", en: "My account" },
  "akun.judul": { default: "Akun saya", en: "My account" },
  "akun.intro": { default: "PINTAR ID dan Kartu PINTAR Anda.", en: "Your PINTAR ID and PINTAR Card." },
  "akun.id": { default: "PINTAR ID", en: "PINTAR ID" },
  "akun.id_arti": { default: "PINTAR ID bukan rahasia. Nomor ini menunjukkan siapa Anda di PINTAR, dan tidak bisa dipakai untuk masuk.", en: "Your PINTAR ID isn't a secret. It shows who you are in PINTAR, and it can't be used to sign in." },
  "akun.qr": { default: "Kode QR untuk PINTAR ID Anda", en: "QR code for your PINTAR ID" },
  "akun.kartu_judul": { default: "Kartu PINTAR", en: "PINTAR Card" },
  "akun.kartu_arti": { default: "Kirim Kartu PINTAR Anda ke email Anda, untuk disimpan atau ditunjukkan.", en: "Send your PINTAR Card to your email, to keep or to show." },
  // W3.20 (DAISY-24; D-074, D-120 Q16): the PINTAR Digital Card's two faces. The face itself is Bahasa Indonesia only
  // (kartu-pintar ronde-2, «Already decided by Yazid»); the en rows name the faces for a reader of the English page.
  "akun.kartu.depan": { default: "Kartu PINTAR, sisi depan", en: "PINTAR Card, front" },
  "akun.kartu.belakang": { default: "Kartu PINTAR, sisi belakang", en: "PINTAR Card, back" },
  // Daisy's words, approved as they stand (D-074(7))
  "akun.kartu.petunjuk": { default: "Pindai untuk membuka halaman masuk PINTAR.", en: "Scan to open the PINTAR sign-in page." },
  "akun.kirim": { default: "Kirim kartu ke email saya", en: "Email the card to me" },
  "akun.mengirim": { default: "Mengirim…", en: "Sending…" },
  "akun.terkirim": { default: "Kartu sudah diserahkan ke server email untuk dikirim ke alamat Anda. PINTAR tidak bisa memastikan email itu sampai; jika belum ada di kotak masuk, periksa folder Spam.", en: "The card has been handed to the email server for your address. PINTAR can't confirm it arrives; if it isn't in your inbox, check your Spam folder." },
  "akun.belum": { default: "Kartu belum bisa dikirim sekarang.", en: "The card couldn't be sent just now." },
  "akun.coba_dalam": { default: "Coba lagi dalam", en: "Try again in" },
  "akun.coba_nanti": { default: "Coba lagi nanti.", en: "Try again later." },
  "akun.gagal_muat": { default: "Data akun Anda belum bisa dimuat. Muat ulang halaman ini.", en: "Your account details couldn't be loaded. Reload this page." },
  // DAISY-20 × D-077(2): a new person's name, confirmed before the person is made; D-019 amended: where an email account starts.
  "aktivasi.halaman_aktifkan": { default: "halaman Aktifkan akun PINTAR", en: "PINTAR's account activation page" },
  "aktivasi.baru.periksa_judul": { default: "Periksa sebelum dibuat", en: "Check before it is made" },
  "aktivasi.baru.periksa_arti": { default: "Nama ini dicatat persis seperti tertulis di atas, dan orang ini akan melihatnya saat mengaktifkan akunnya. Periksa ejaannya sekarang.", en: "This name is recorded exactly as written above, and this person will see it when they activate their account. Check the spelling now." },
  "aktivasi.baru.benar": { default: "Sudah benar, buat dan aktifkan", en: "That's right — create and activate" },
  "aktivasi.baru.ubah": { default: "Ubah", en: "Change" },
  // DAISY-20 × D-077(3): every name of an intake, before the one approval. Never says a name goes on a card (C17).
  "pendataan.nama.judul": { default: "Nama yang akan dicatat", en: "The names to be recorded" },
  "pendataan.nama.arti": { default: "Semua baris dari daftar, dengan nama persis seperti akan dicatat. Periksa ejaannya sebelum menyetujui. Jika ada nama yang keliru, jangan setujui: perbaiki berkasnya, lalu mulai pendataan baru dengan berkas itu.", en: "Every row of the list, with each name exactly as it will be recorded. Check the spelling before you approve. If a name is wrong, don't approve: correct the file, then start a new intake with it." },
  "pendataan.nama.sudah": { default: "sudah terdaftar", en: "already registered" },
  "pendataan.nama.gagal": { default: "Daftar nama belum bisa dibaca seluruhnya, jadi persetujuan belum bisa diberikan. Muat ulang halaman ini.", en: "The list of names couldn't be read in full, so it can't be approved yet. Reload this page." },
  // DAISY-20 × BOB-26 §5: the activation code email (KODE_AKTIVASI, KODE_ULANG). The duration is the data's, never typed (D-079 addendum).
  "email.kode.subjek": { default: "Kode aktivasi akun PINTAR Anda", en: "Your PINTAR account activation code" },
  "email.kode.pratinjau": { default: "Pakai kode ini untuk mengaktifkan akun PINTAR Anda.", en: "Use this code to activate your PINTAR account." },
  "email.kode.judul": { default: "Aktifkan akun PINTAR Anda", en: "Activate your PINTAR account" },
  "email.kode.halo": { default: "Halo,", en: "Hello," },
  "email.kode.isi": { default: "Ketik kode ini di halaman Aktifkan akun PINTAR Anda untuk melanjutkan aktivasi.", en: "Type this code on the Activate your PINTAR account page to continue." },
  "email.kode.ulang.subjek": { default: "Kode aktivasi baru untuk akun PINTAR Anda", en: "A new activation code for your PINTAR account" },
  "email.kode.ulang.pratinjau": { default: "Ini kode baru yang Anda minta.", en: "Here is the new code you asked for." },
  "email.kode.ulang.judul": { default: "Kode aktivasi baru", en: "A new activation code" },
  "email.kode.ulang.isi": { default: "Anda meminta kode baru. Ketik kode ini di halaman Aktifkan akun PINTAR Anda.", en: "You asked for a new code. Type this code on the Activate your PINTAR account page." },
  "email.kode.label": { default: "Kode aktivasi", en: "Activation code" },
  "email.kode.berlaku": { default: "Kode ini berlaku selama", en: "This code is valid for" },
  "email.kode.berlaku_lalu": { default: ". Jika sudah lewat, minta kode baru di halaman yang sama.", en: ". If it runs out, ask for a new code on the same page." },
  "email.kode.bukan_anda": { default: "Jika Anda tidak meminta kode ini, abaikan email ini. Jangan berikan kode ini kepada siapa pun.", en: "If you didn't ask for this code, ignore this email. Don't give this code to anyone." },
  "email.kode.alasan": { default: "Anda menerima email ini karena kode aktivasi diminta untuk alamat ini di PINTAR.", en: "You are receiving this email because an activation code was requested for this address in PINTAR." },
  // DAISY-20 × BOB-26 §5: the PINTAR Card email (KARTU_DIGITAL), staff only (C17).
  "email.kartu.subjek": { default: "Kartu PINTAR Anda", en: "Your PINTAR Card" },
  "email.kartu.pratinjau": { default: "PINTAR ID Anda:", en: "Your PINTAR ID:" },
  "email.kartu.judul": { default: "Kartu PINTAR Anda", en: "Your PINTAR Card" },
  "email.kartu.isi": { default: "Ini Kartu PINTAR Anda.", en: "This is your PINTAR Card." },
  "email.kartu.bukan_rahasia": { default: "PINTAR ID bukan rahasia: boleh ditunjukkan, dan tidak bisa dipakai untuk masuk. Password dan PIN Anda tetap rahasia.", en: "Your PINTAR ID isn't a secret: you can show it, and it can't be used to sign in. Your password and PIN stay secret." },
  "email.kartu.tombol": { default: "Buka Akun saya", en: "Open My account" },
  "email.kartu.alasan": { default: "Anda menerima email ini karena akun PINTAR Anda baru diaktifkan, atau kartunya diminta dari Akun saya.", en: "You are receiving this email because your PINTAR account was just activated, or its card was requested from My account." },
  "sync.sesi_ditutup": { default: "Asesmen ini sudah ditutup, jadi jawaban terakhir tidak lagi dapat dikirim.", en: "This assessment is already closed, so the last answer could not be sent." },

  // ═══════════════════════════ UX-1 · the role-based first-login tour (r2.1).
  // Daisy's approved copy, verbatim. Two corrections carried in from the later
  // Sauron rulings, which take precedence over the superseded r2 text they
  // replace: the educator's teaching-context wording (§D-1, §D-2 — visibility
  // is not the teaching context and not authority) and the canonical EN
  // "Mastery Check". Nothing else was reworded.
  "tur.tur": { default: "Tur PINTAR", en: "PINTAR tour" },
  "tur.nama.belajar": { default: "Tur halaman Belajar", en: "Tour of the Learning page" },
  "tur.nama.pengajar": { default: "Tur untuk guru", en: "Tour for educators" },
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
  "tur.nt.1.isi": { default: "Semua yang disediakan untuk Anda ada di sini, sudah diurutkan. Yang paling atas dikerjakan lebih dulu; tombolnya membuka langkah berikutnya.", en: "Everything assigned is here, already in order. Begin with the one at the top — its button opens the next step." },
  "tur.nt.1.kosong": { default: "Saat ada materi yang disediakan untuk Anda, kartunya muncul di sini, lengkap dengan tombol untuk memulai.", en: "When something is assigned, its card appears here, with a button to begin." },
  "tur.nt.2.judul": { default: "Setiap materi punya lima langkah", en: "Every assignment has five steps" },
  "tur.nt.2.isi": { default: "Pemetaan Awal, Peta Bacaan, Pelajaran, Uji Penguasaan, lalu Hasil. Satu langkah terbuka pada satu waktu; Pemetaan Awal bukan ujian. Uji Cepat dari guru berada di luar lima langkah ini dan muncul di daftar Belajar.", en: "Initial Mapping, Reading Map, Lessons, Mastery Check, then Results. One step is open at a time; the Initial Mapping is not a test. A Quick Assessment from a teacher sits outside these five steps and appears in the Learning list." },
  "tur.nt.3.judul": { default: "Tempat membaca dan menonton", en: "Where you read and watch" },
  "tur.nt.3.isi": { default: "Peta Bacaan menunjukkan bagian yang perlu dibaca lebih dulu, beserta alasannya. Pelajaran dibuka dari sana, dan posisi baca tersimpan.", en: "The Reading Map shows which part to read first, and why. Lessons open from there, and your place is saved." },
  "tur.nt.4.judul": { default: "Saat mengerjakan soal", en: "While you answer" },
  // DAISY-26 (UX-24): the tour says what the button says, «Simpan jawaban ini»
  "tur.nt.4.isi": { default: "Pilih satu jawaban, lalu simpan. Jawaban yang sudah Anda simpan tercatat. Bila perlu, tombol bantuan kecil bisa muncul — memakainya tidak mengurangi apa pun.", en: "Choose one answer, then save it. The answers you save are recorded. If it is needed, a small help button may appear — using it never takes anything away." },
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
  "tur.sm.1.isi": { default: "Materi yang disediakan untuk Anda ada di sini, sudah diurutkan. Mulai dari yang paling atas; tombolnya membawa ke langkah berikutnya.", en: "Everything assigned is here, already in order. Start at the top — its button takes you to the next step." },
  "tur.sm.1.kosong": { default: "Materi yang disediakan untuk Anda akan muncul di sini, sudah diurutkan. Yang paling atas dikerjakan lebih dulu.", en: "Assigned work will appear here, already in order. The one at the top comes first." },
  "tur.sm.2.judul": { default: "Lima langkah di setiap materi", en: "Five steps in every assignment" },
  "tur.sm.2.isi": { default: "Pemetaan Awal, Peta Bacaan, Pelajaran, Uji Penguasaan, lalu Hasil. Hanya satu langkah yang terbuka pada satu waktu. Pemetaan Awal bukan ujian.", en: "Initial Mapping, Reading Map, Lessons, Mastery Check, then Results. Only one step is open at a time. The Initial Mapping is not a test." },
  "tur.sm.3.judul": { default: "Tempat belajar", en: "Where you learn" },
  "tur.sm.3.isi": { default: "Peta Bacaan menunjukkan bagian yang perlu dibaca lebih dulu, beserta alasannya. Pelajaran dibuka dari sana, dan posisi baca tersimpan.", en: "The Reading Map shows which part to read first, and why. Lessons open from there, and your place is saved." },
  "tur.sm.4.judul": { default: "Mengerjakan asesmen", en: "Taking an assessment" },
  "tur.sm.4.isi": { default: "Pilih jawaban, lalu simpan. Jawaban yang sudah Anda simpan tercatat. Uji Cepat yang dibuka guru juga muncul di halaman Belajar.", en: "Choose an answer, then save it. The answers you save are recorded. Quick Assessments your teacher opens also appear on the Learning page." },
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
  "tur.pg.3.isi": { default: "Asesmen yang jendelanya masih terbuka, dengan jumlah murid yang sudah mengumpulkan. Angka ini hitungan, bukan penilaian.", en: "Assessments whose window is still open, with how many students have submitted. These numbers are counts, not judgments." },
  "tur.pg.3.kosong": { default: "Saat ada asesmen yang jendelanya terbuka, daftarnya muncul di halaman ini.", en: "When an assessment window is open, it appears on this page." },
  "tur.pg.4.judul": { default: "Uji Cepat", en: "Quick Assessment" },
  "tur.pg.4.isi": { default: "Dari halaman kelas: atur, tinjau, lalu sediakan. Murid baru menerimanya setelah Anda menekan Sediakan. Hasilnya ikut menjadi bukti belajar; Uji Cepat tidak menerbitkan sertifikat.", en: "From a class page: configure, review, then make it available. Students receive it only after you press Make available. Results become learning evidence; a Quick Assessment does not issue a certificate." },
  "tur.pg.5.judul": { default: "Menyediakan materi", en: "Making material available" },
  "tur.pg.5.isi": { default: "Bab yang sudah diterbitkan sekolah tidak otomatis sampai ke murid. Tinjau yang akan diterima murid, lalu sediakan untuk kelas yang dipilih.", en: "A chapter the school has published does not reach students by itself. Review what students will receive, then make it available to the selected class." },
  "tur.pg.6.judul": { default: "Apa yang sudah bisa disimpulkan", en: "What can be concluded" },
  "tur.pg.6.isi": { default: "PINTAR baru menyimpulkan bila buktinya cukup. «Belum cukup bukti» adalah keadaan biasa — artinya belum, bukan buruk.", en: "PINTAR only draws a conclusion when there is enough evidence. «Not yet enough evidence» is a normal state — it means not yet, not bad." },
  "tur.pg.7.judul": { default: "Bantuan", en: "Help" },
  "tur.pg.7.isi": { default: "Tur ini bisa dibuka lagi dari sini, termasuk langsung ke satu langkah. Untuk pertanyaan lain, hubungi bagian layanan sekolah.", en: "You can reopen this tour from here, or go straight to one step. For anything else, contact your school's support." },

  // ══════════════════════════════════ UX-1 Slice 3 — the educator's teaching
  // surface. Educator-facing, and deliberately NOT declared staff-only: the
  // internal-word guard runs over every one of these tellings, which is worth
  // more than the exemption would be.
  "mengajar.judul": { default: "Kelas", en: "Classes" },
  "nav.kelas": { default: "Mengajar", en: "Classes" },
  // DAISY-03: "Pimpinan", not "Beranda". Beside Kelas or Konfigurasi, "Beranda"
  // named nothing -- every place is somebody's home -- and D-010 calls it Pimpinan.
  "nav.pimpinan": { default: "Pimpinan", en: "Management" },
  "nav.pendataan": { default: "Pendataan", en: "Intake" },
  "nav.aktivasi": { default: "Aktivasi akun", en: "Account activation" },
  "nav.konfigurasi": { default: "Konfigurasi", en: "Configuration" },
  "nav.studio": { default: "Studio", en: "Studio" },
  "nav.tempat": { default: "Tempat kerja Anda", en: "Your places" },
  "nav.menu": { default: "Menu", en: "Menu" },
  // E1 (D-170(c)): the design system's approved shell words (J3, question 1), entering the copy table with the build
  "nav.ciutkan": { default: "Ciutkan navigasi", en: "Collapse navigation" },
  "nav.lebarkan": { default: "Lebarkan navigasi", en: "Expand navigation" },
  "nav.buka_menu": { default: "Buka menu", en: "Open menu" },
  "nav.tutup_menu": { default: "Tutup menu", en: "Close menu" },
  "tombol.menerbitkan": { default: "Menerbitkan…", en: "Publishing\u2026" },
  "studio.langkah.selesai.terbitkan": { default: "Diterbitkan", en: "Published" },
  // W1.6 (Batch 3; UX-36, J4.3): the second person's other outcome at «Setujui isi», an in-page confirmation with a
  // reason (Daisy, Confirmation). These words are engineering's, listed for Daisy's review in the Batch 3 report
  "studio.kembali.tombol": { default: "Kembalikan ke penyusun", en: "Send back to the author" },
  "studio.kembali.judul": { default: "Kembalikan paket ini ke penyusun?", en: "Send this package back to its author?" },
  "studio.kembali.arti": { default: "Paket kembali ke langkah Susun isi. Penyusun membaca alasan Anda, memperbaikinya, lalu mengajukannya lagi untuk ditinjau. Alasan dan nama Anda tercatat di Riwayat perbaikan.", en: "The package goes back to the Put the content together step. Its author reads your reason, corrects it, and sends it for review again. Your reason and your name are kept in the Correction history." },
  "studio.kembali.alasan": { default: "Alasan", en: "Reason" },
  "studio.kembali.alasan_arti": { default: "Tulis apa yang perlu diperbaiki, 10 sampai 1000 karakter.", en: "Write what needs correcting, in 10 to 1000 characters." },
  "studio.kembali.batal": { default: "Batal", en: "Cancel" },
  "studio.kembali.alasan_dari": { default: "Alasan peninjau", en: "The reviewer\u2019s reason" },
  "studio.kembali.jalan_unggah": { default: "Isi diperbaiki di buku kerjanya: unggah buku kerja perbaikan, dan perbaikannya menjadi versi berikutnya dari paket ini. Bila isinya tidak perlu diubah, tandai sudah tersusun lagi lalu ajukan kembali.", en: "The content is corrected in its workbook: upload the corrected workbook, and the correction becomes this package\u2019s next version. If nothing in the content needs to change, mark it as put together again and send it for review again." },
  "tombol.mengembalikan": { default: "Mengembalikan…", en: "Sending back\u2026" },
  "galat.sent_back": { default: "Paket ini dikembalikan ke penyusun beserta alasan Anda.", en: "This package was sent back to its author with your reason." },
  "galat.sendback_not_reviewer": { default: "Mengembalikan paket ke penyusun bukan wewenang Anda di sekolah ini.", en: "Sending a package back to its author is not yours to do in this school." },
  "galat.sendback_not_in_review": { default: "Paket ini sudah tidak berada di langkah Setujui isi, mungkin karena rekan baru saja mengambilnya. Muat ulang halaman untuk melihat langkah yang berlaku sekarang.", en: "This package is no longer at the Approve the content step, perhaps because a colleague has just taken it. Reload the page to see the step it is at now." },
  "galat.sendback_reviewer_is_author": { default: "Anda menyusun paket ini, jadi yang mengembalikannya harus orang lain.", en: "You wrote this package, so someone else sends it back." },
  "galat.sendback_reason_missing": { default: "Tulis alasannya, 10 sampai 1000 karakter.", en: "Write the reason, in 10 to 1000 characters." },
  // W1.8 (Batch 3; J4.12): «Riwayat perbaikan» names every review outcome of each version, from content_review_outcomes
  "studio.paket.riwayat.disetujui": { default: "Disetujui", en: "Approved" },
  "studio.paket.riwayat.dikembalikan": { default: "Dikembalikan ke penyusun", en: "Sent back to the author" },
  "studio.integritas.tindak": { default: "Tindak lanjut", en: "Follow-up" },
  "pimpinan.keadaan.menunggu_keputusan": { default: "Menunggu keputusan", en: "Awaiting a decision" },
  "kesiapan.pita.judul": { default: "Hasil {n} murid yang sudah mengerjakan", en: "Results of the {n} students who have taken it" },
  "laporan.standar.class_learning_intelligence": { default: "Laporan belajar kelas", en: "Class learning report" },
  "laporan.standar.institution_learning_intelligence": { default: "Laporan belajar sekolah", en: "School learning report" },
  "laporan.standar.learner_result": { default: "Hasil murid", en: "Student result" },
  "laporan.tampilan.bar": { default: "Diagram batang", en: "Bar chart" },
  "laporan.tampilan.list": { default: "Daftar", en: "List" },
  "laporan.tampilan.table": { default: "Tabel", en: "Table" },
  "laporan.tampilan.card_list": { default: "Kartu", en: "Cards" },
  "laporan.tampilan.distribution": { default: "Sebaran", en: "Distribution" },
  "laporan.tampilan.hero_stat": { default: "Angka utama", en: "Headline figure" },
  "laporan.tampilan.summary": { default: "Ringkasan", en: "Summary" },
  "studio.definisi.unit.soal": { default: "soal", en: "questions" },
  "studio.definisi.unit.tenggang": { default: "tenggang kirim paling lama", en: "send grace at most" },
  "studio.definisi.unit.detik": { default: "detik", en: "seconds" },
  "studio.definisi.unit.percobaan": { default: "percobaan paling banyak", en: "attempts at most" },
  "studio.definisi.f.judul": { default: "Nama aturan", en: "Rule name" },
  "studio.definisi.f.mode": { default: "Jenis asesmen", en: "Assessment type" },
  "studio.definisi.f.jumlah": { default: "Jumlah soal", en: "Number of questions" },
  "studio.definisi.f.keselamatan": { default: "Minimum soal keselamatan", en: "Minimum safety questions" },
  "studio.definisi.f.ragu": { default: "Jendela ragu (detik)", en: "Hesitation window (seconds)" },
  "studio.definisi.f.tenggang": { default: "Tenggang kirim (detik)", en: "Late-submission grace (seconds)" },
  "studio.definisi.f.percobaan": { default: "Batas percobaan", en: "Attempt limit" },
  "studio.definisi.f.acak": { default: "Urutan", en: "Order" },
  "studio.definisi.f.jeda": { default: "Boleh dijeda", en: "May be paused" },
  "studio.definisi.f.luring": { default: "Boleh dikerjakan luring", en: "May be taken offline" },
  "studio.definisi.acak.NONE": { default: "Soal dan pilihan jawaban tidak diacak", en: "Questions and answer choices in their order" },
  "studio.definisi.acak.ITEMS": { default: "Urutan soal diacak", en: "Questions shuffled" },
  "studio.definisi.acak.ITEMS_AND_OPTIONS": { default: "Urutan soal dan pilihan jawaban diacak", en: "Questions and answer choices shuffled" },
  // W1.3 (Batch 3; RV-14, DG-28/29): each field says what it is for and its limit, in words; a time in minutes
  "studio.definisi.wajib": { default: "Semua isian wajib diisi, kecuali yang bertanda (opsional).", en: "Every field is required except those marked (optional)." },
  "studio.definisi.unit.menit": { default: "menit", en: "minutes" },
  "studio.definisi.kata.antara": { default: "antara", en: "between" },
  "studio.definisi.kata.dan": { default: "dan", en: "and" },
  "studio.definisi.f.tenggang_menit": { default: "Tenggang kirim (menit)", en: "Late-submission grace (minutes)" },
  "studio.definisi.f.komposisi": { default: "Jumlah soal per tingkat kesulitan", en: "Questions per difficulty" },
  "studio.definisi.f.selama": { default: "Selama mengerjakan", en: "While it is being taken" },
  "studio.definisi.petunjuk.jumlah": { default: "Berapa soal yang dikerjakan setiap murid; boleh", en: "How many questions each student answers; allowed" },
  "studio.definisi.petunjuk.keselamatan": { default: "Berapa soal bertanda keselamatan yang paling sedikit harus ada. Kosongkan bila tidak ada.", en: "The fewest safety-marked questions it must hold. Leave empty if none." },
  "studio.definisi.petunjuk.ragu": { default: "Kosongkan bila arah berpikir tidak ditawarkan. Bila diisi: setelah berapa detik di satu soal murid ditawari arah berpikir; boleh", en: "Leave empty if no direction to think in is offered. If filled in: after how many seconds on one question the student is offered one; allowed" },
  "studio.definisi.petunjuk.tenggang": { default: "Berapa lama jawaban yang terkirim sesudah waktu habis masih diterima, misalnya karena sinyal putus; paling lama", en: "How long an answer sent after time is up is still accepted, for example after a lost signal; at most" },
  "studio.definisi.petunjuk.percobaan": { default: "Berapa kali seorang murid boleh mengerjakannya; paling banyak", en: "How many times one student may take it; at most" },
  "studio.definisi.petunjuk.komposisi": { default: "Kosongkan bila tingkat kesulitan soal tidak diatur.", en: "Leave empty if the difficulty of the questions is not set." },
  "studio.definisi.petunjuk.jeda": { default: "Murid boleh menyimpan, berhenti, lalu melanjutkan nanti.", en: "Students may save, stop and carry on later." },
  "studio.definisi.petunjuk.luring": { default: "Murid boleh terus mengerjakan saat sinyal putus; jawabannya terkirim ketika tersambung lagi.", en: "Students may keep working when the signal drops; their answers are sent when it returns." },
  "config.sekolah.sintetis": { default: "data uji", en: "test data" },
  "config.sekolah.aktif": { default: "aktif", en: "active" },
  "config.sekolah.nonaktif": { default: "nonaktif", en: "inactive" },
  // Sharon F1 (7a2c1751): the school's own clock; every date it records is decided on it
  "config.sekolah.zona.Asia/Jakarta": { default: "WIB", en: "WIB" },
  "config.sekolah.zona.Asia/Makassar": { default: "WITA", en: "WITA" },
  "config.sekolah.zona.Asia/Jayapura": { default: "WIT", en: "WIT" },
  "config.sekolah.zona.label": { default: "Zona waktu sekolah", en: "School time zone" },
  "config.sekolah.zona.simpan": { default: "Simpan zona waktu", en: "Save time zone" },
  "config.sekolah.zona.sekolah": { default: "Sekolah", en: "School" },
  "audit.aksi.institution.time_zone_changed": { default: "Zona waktu sekolah diubah", en: "School time zone changed" },
  // D-138/D-140: the audit trail in words (Jejak audit), never its codes or tables
  "audit.aksi.ASSESSMENT_DEFINITION_CREATED": { default: "Aturan asesmen dibuat", en: "Assessment rule created" },
  "audit.aksi.ASSESSMENT_DEFINITION_RELABELLED": { default: "Nama aturan asesmen diubah", en: "Assessment rule renamed" },
  "audit.aksi.ASSESSMENT_DEFINITION_VERSIONED": { default: "Aturan asesmen diperbarui", en: "Assessment rule updated" },
  "audit.aksi.CERTIFICATE_TEMPLATE_SAVED": { default: "Tata letak sertifikat disimpan", en: "Certificate layout saved" },
  "audit.aksi.COURSE_CORRECTION_UPLOADED": { default: "Koreksi materi diunggah", en: "Content correction uploaded" },
  "audit.aksi.COURSE_REVISION_CREATED": { default: "Revisi materi dibuat", en: "Content revision created" },
  "audit.aksi.EVIDENCE_RECLASSIFIED": { default: "Bukti asesmen diklasifikasi ulang", en: "Assessment evidence reclassified" },
  "audit.aksi.FINDING_ACKNOWLEDGED": { default: "Temuan pemeriksaan materi dicatat", en: "Content check finding acknowledged" },
  "audit.aksi.INTEGRITY_SIGNAL_REVIEWED": { default: "Tanda integritas ditinjau", en: "Integrity signal reviewed" },
  "audit.aksi.LEARNING_ASSIGNED": { default: "Materi disediakan untuk kelas", en: "Content made available to a class" },
  "audit.aksi.LEARNING_RELEASE_MOVED": { default: "Kelas dipindah ke terbitan materi lain", en: "Class moved to another content release" },
  "audit.aksi.QUESTION_HEALTH_REVIEWED": { default: "Kesehatan soal ditinjau", en: "Question health reviewed" },
  "audit.aksi.RELEASE_CREATED": { default: "Terbitan materi dibuat", en: "Content release created" },
  "audit.aksi.RELEASE_DISTRIBUTION_GRANTED": { default: "Terbitan materi dibagikan ke sekolah", en: "Content release shared with a school" },
  "audit.aksi.RELEASE_DISTRIBUTION_WITHDRAWN": { default: "Pembagian terbitan materi ditarik", en: "Content release sharing withdrawn" },
  "audit.aksi.RELEASE_FROZEN": { default: "Terbitan materi dikunci", en: "Content release frozen" },
  "audit.aksi.RELEASE_PUBLISHED": { default: "Materi diterbitkan", en: "Content published" },
  "audit.aksi.RELEASE_WITHDRAWN": { default: "Terbitan materi ditarik", en: "Content release withdrawn" },
  "audit.aksi.account.activated": { default: "Akun diaktifkan", en: "Account activated" },
  "audit.aksi.account.activation_authorized": { default: "Aktivasi akun disetujui", en: "Account activation authorised" },
  "audit.aksi.account.card_reissued": { default: "Kartu kelas dicetak ulang", en: "Class card reissued" },
  "audit.aksi.account.new_person_authorized": { default: "Orang baru disetujui untuk diaktifkan", en: "New person authorised for activation" },
  "audit.aksi.assessment_result.recomputed": { default: "Hasil asesmen dihitung ulang", en: "Assessment result recomputed" },
  "audit.aksi.assessment_session.deadline_extended": { default: "Batas waktu asesmen diperpanjang", en: "Assessment deadline extended" },
  "audit.aksi.assessment_session.terminated": { default: "Asesmen dihentikan", en: "Assessment stopped" },
  "audit.aksi.briefing.holding": { default: "Pengarahan ditahan", en: "Briefing held" },
  "audit.aksi.briefing.opened": { default: "Pengarahan dibuka", en: "Briefing opened" },
  "audit.aksi.briefing.transition": { default: "Keadaan pengarahan berubah", en: "Briefing state changed" },
  "audit.aksi.certificate.issued": { default: "Sertifikat diterbitkan", en: "Certificate issued" },
  "audit.aksi.certificate.prepared": { default: "Sertifikat disiapkan", en: "Certificate prepared" },
  "audit.aksi.certificate.revoked": { default: "Sertifikat dicabut", en: "Certificate revoked" },
  "audit.aksi.class.status_changed": { default: "Keadaan kelas berubah", en: "Class status changed" },
  "audit.aksi.content.status_changed": { default: "Keadaan materi berubah", en: "Content status changed" },
  "audit.aksi.enrollment.created": { default: "Murid dimasukkan ke kelas", en: "Student added to a class" },
  "audit.aksi.evaluation.assume": { default: "Peragaan dimulai", en: "Demonstration started" },
  "audit.aksi.evaluation.exit": { default: "Peragaan diakhiri", en: "Demonstration ended" },
  "audit.aksi.evaluator.grant": { default: "Akses peragaan diberikan", en: "Demonstration access granted" },
  "audit.aksi.evaluator.revoke": { default: "Akses peragaan dicabut", en: "Demonstration access revoked" },
  "audit.aksi.feedback_cycle.closed": { default: "Putaran umpan balik ditutup", en: "Feedback round closed" },
  "audit.aksi.feedback_cycle.opened": { default: "Putaran umpan balik dibuka", en: "Feedback round opened" },
  "audit.aksi.feedback_question_set.published": { default: "Pertanyaan umpan balik diterbitkan", en: "Feedback questions published" },
  "audit.aksi.feedback_threshold.published": { default: "Batas tampil umpan balik diterbitkan", en: "Feedback threshold published" },
  "audit.aksi.identity.device_declared": { default: "Jenis komputer dicatat", en: "Computer type recorded" },
  "audit.aksi.identity.email_corrected": { default: "Alamat email dikoreksi", en: "Email address corrected" },
  "audit.aksi.identity.name_confirmed": { default: "Nama dikonfirmasi", en: "Name confirmed" },
  "audit.aksi.identity.name_corrected": { default: "Nama dikoreksi", en: "Name corrected" },
  "audit.aksi.identity.name_corrected_at_activation": { default: "Nama dikoreksi saat aktivasi", en: "Name corrected at activation" },
  "audit.aksi.identity.password_set": { default: "Password dibuat", en: "Password set" },
  "audit.aksi.identity.pin_set": { default: "PIN dibuat", en: "PIN set" },
  "audit.aksi.identity.recovery_locked": { default: "Pemulihan akun dikunci", en: "Account recovery locked" },
  "audit.aksi.identity.recovery_pin_ok": { default: "PIN pemulihan benar", en: "Recovery PIN correct" },
  "audit.aksi.identity.recovery_pin_wrong": { default: "PIN pemulihan salah", en: "Recovery PIN wrong" },
  "audit.aksi.identity.recovery_restored": { default: "Akun dipulihkan", en: "Account restored" },
  "audit.aksi.identity.recovery_suspended": { default: "Pemulihan akun ditangguhkan", en: "Account recovery suspended" },
  "audit.aksi.identity.recovery_verified": { default: "Pemulihan akun diverifikasi", en: "Account recovery verified" },
  "audit.aksi.identity.session_ended": { default: "Keluar dari PINTAR", en: "Signed out" },
  "audit.aksi.identity.session_pin_wrong": { default: "PIN sesi salah", en: "Session PIN wrong" },
  "audit.aksi.identity.session_resumed": { default: "Sesi dilanjutkan", en: "Session resumed" },
  "audit.aksi.identity.setup_completed": { default: "Penyiapan akun selesai", en: "Account setup completed" },
  "audit.aksi.identity.username_claimed": { default: "Nama pengguna dipilih", en: "Username chosen" },
  "audit.aksi.identity.username_corrected": { default: "Nama pengguna dikoreksi", en: "Username corrected" },
  "audit.aksi.import.completed": { default: "Pendataan selesai", en: "Intake completed" },
  "audit.aksi.import.confirmed": { default: "Pendataan disetujui", en: "Intake confirmed" },
  "audit.aksi.import.pilot_completed": { default: "Uji coba pendataan selesai", en: "Intake pilot completed" },
  "audit.aksi.import.pilot_verified": { default: "Uji coba pendataan diperiksa", en: "Intake pilot verified" },
  "audit.aksi.ingest.materialised": { default: "Data pendataan diterapkan", en: "Intake data applied" },
  "audit.aksi.ingest.prepared": { default: "Data pendataan disiapkan", en: "Intake data prepared" },
  "audit.aksi.institution.created": { default: "Sekolah dibuat", en: "School created" },
  "audit.aksi.institution.state_changed": { default: "Keadaan sekolah berubah", en: "School status changed" },
  "audit.aksi.institution_namespace.reserved": { default: "Kode sekolah dipesan", en: "School code reserved" },
  "audit.aksi.learner_detail.opened": { default: "Rincian murid dibuka", en: "Student details opened" },
  "audit.aksi.lesson_review.requested": { default: "Tinjauan pelajaran diminta", en: "Lesson review requested" },
  "audit.aksi.maintenance.activated": { default: "Pemeliharaan diaktifkan", en: "Maintenance activated" },
  "audit.aksi.maintenance.cancelled": { default: "Pemeliharaan dibatalkan", en: "Maintenance cancelled" },
  "audit.aksi.maintenance.deactivated": { default: "Pemeliharaan dinonaktifkan", en: "Maintenance deactivated" },
  "audit.aksi.maintenance.emergency_stop": { default: "Pemeliharaan darurat dimulai", en: "Emergency maintenance started" },
  "audit.aksi.maintenance.ended_now": { default: "Pemeliharaan diakhiri", en: "Maintenance ended" },
  "audit.aksi.maintenance.scheduled": { default: "Pemeliharaan dijadwalkan", en: "Maintenance scheduled" },
  "audit.aksi.maintenance.started_now": { default: "Pemeliharaan dimulai", en: "Maintenance started" },
  "audit.aksi.management_decision.advanced": { default: "Kasus pimpinan diteruskan", en: "Management case advanced" },
  "audit.aksi.management_decision.raised": { default: "Kasus pimpinan diajukan", en: "Management case raised" },
  "audit.aksi.membership.closed": { default: "Keanggotaan diakhiri", en: "Membership ended" },
  "audit.aksi.membership.created": { default: "Keanggotaan dibuat", en: "Membership created" },
  "audit.aksi.metric_catalogue.published": { default: "Daftar ukuran laporan diterbitkan", en: "Report measures published" },
  "audit.aksi.mode_policy.changed": { default: "Batas asesmen diubah", en: "Assessment limits changed" },
  "audit.aksi.notice.published": { default: "Pengumuman diterbitkan", en: "Notice published" },
  "audit.aksi.notice.withdrawn": { default: "Pengumuman ditarik", en: "Notice withdrawn" },
  "audit.aksi.period.rollover": { default: "Tahun ajaran dilanjutkan", en: "School year rolled over" },
  "audit.aksi.platform_config.updated": { default: "Pengaturan platform diubah", en: "Platform settings changed" },
  "audit.aksi.platform_environment.changed": { default: "Lingkungan platform diubah", en: "Platform environment changed" },
  "audit.aksi.professional_learning.enrolled": { default: "Guru didaftarkan untuk belajar", en: "Teacher enrolled for learning" },
  "audit.aksi.question_health.recomputed": { default: "Kesehatan soal dihitung ulang", en: "Question health recomputed" },
  "audit.aksi.question_health.transition": { default: "Keadaan kesehatan soal berubah", en: "Question health status changed" },
  "audit.aksi.quick_assessment.launched": { default: "Uji Cepat dimulai", en: "Quick Assessment started" },
  "audit.aksi.quick_assessment.selected": { default: "Soal Uji Cepat dipilih", en: "Quick Assessment questions chosen" },
  "audit.aksi.report_template.provisioned": { default: "Templat laporan disiapkan", en: "Report template provisioned" },
  "audit.aksi.report_template.saved": { default: "Templat laporan disimpan", en: "Report template saved" },
  "audit.aksi.role.first_system_admin_bootstrapped": { default: "Admin platform pertama ditetapkan", en: "First platform admin set up" },
  "audit.aksi.role.granted": { default: "Peran diberikan", en: "Role granted" },
  "audit.aksi.role.revoked": { default: "Peran dicabut", en: "Role revoked" },
  "audit.aksi.school.founded": { default: "Sekolah didirikan di PINTAR", en: "School founded in PINTAR" },
  "audit.aksi.school_pass_mark.set": { default: "Batas ketuntasan ditetapkan", en: "Pass mark set" },
  "audit.aksi.scoring_policy.published": { default: "Aturan perhitungan nilai diterbitkan", en: "Scoring rules published" },
  "audit.aksi.structure.academic_year_created": { default: "Tahun ajaran dibuat", en: "School year created" },
  "audit.aksi.structure.bagian_created": { default: "Bagian dibuat", en: "Section created" },
  "audit.aksi.structure.deactivated": { default: "Bagian struktur dinonaktifkan", en: "Structure item deactivated" },
  "audit.aksi.structure.jenjang_created": { default: "Jenjang dibuat", en: "Level created" },
  "audit.aksi.structure.kelas_created": { default: "Kelas dibuat", en: "Class created" },
  "audit.aksi.structure.reguler_created": { default: "Program reguler dibuat", en: "Regular programme created" },
  "audit.aksi.structure.renamed": { default: "Nama dalam struktur diubah", en: "Structure item renamed" },
  "audit.aksi.structure.tingkat_created": { default: "Tingkat dibuat", en: "Grade created" },
  "audit.aksi.support_report.moved": { default: "Laporan masalah diperbarui", en: "Problem report updated" },
  "audit.aksi.support_report.received": { default: "Laporan masalah diterima", en: "Problem report received" },
  "audit.ranah.account": { default: "Akun", en: "Account" },
  "audit.ranah.assessment_result": { default: "Hasil asesmen", en: "Assessment result" },
  "audit.ranah.assessment_session": { default: "Asesmen", en: "Assessment" },
  "audit.ranah.briefing": { default: "Pengarahan", en: "Briefing" },
  "audit.ranah.certificate": { default: "Sertifikat", en: "Certificate" },
  "audit.ranah.class": { default: "Kelas", en: "Class" },
  "audit.ranah.content": { default: "Materi", en: "Content" },
  "audit.ranah.enrollment": { default: "Keanggotaan kelas", en: "Class enrolment" },
  "audit.ranah.evaluation": { default: "Peragaan", en: "Demonstration" },
  "audit.ranah.evaluator": { default: "Akses peragaan", en: "Demonstration access" },
  "audit.ranah.feature_flag": { default: "Fitur platform", en: "Platform feature" },
  "audit.ranah.feedback_cycle": { default: "Umpan balik", en: "Feedback" },
  "audit.ranah.feedback_question_set": { default: "Umpan balik", en: "Feedback" },
  "audit.ranah.feedback_threshold": { default: "Umpan balik", en: "Feedback" },
  "audit.ranah.identity": { default: "Akun", en: "Account" },
  "audit.ranah.import": { default: "Pendataan", en: "Intake" },
  "audit.ranah.ingest": { default: "Pendataan", en: "Intake" },
  "audit.ranah.institution": { default: "Sekolah", en: "School" },
  "audit.ranah.institution_namespace": { default: "Sekolah", en: "School" },
  "audit.ranah.learner_detail": { default: "Murid", en: "Student" },
  "audit.ranah.lesson_review": { default: "Materi", en: "Content" },
  "audit.ranah.maintenance": { default: "Pemeliharaan", en: "Maintenance" },
  "audit.ranah.management_decision": { default: "Kasus pimpinan", en: "Management case" },
  "audit.ranah.membership": { default: "Keanggotaan", en: "Membership" },
  "audit.ranah.metric_catalogue": { default: "Laporan", en: "Reports" },
  "audit.ranah.mode_policy": { default: "Asesmen", en: "Assessment" },
  "audit.ranah.notice": { default: "Pengumuman", en: "Notice" },
  "audit.ranah.period": { default: "Tahun ajaran", en: "School year" },
  "audit.ranah.platform_config": { default: "Platform", en: "Platform" },
  "audit.ranah.platform_environment": { default: "Platform", en: "Platform" },
  "audit.ranah.probe": { default: "Pemeriksaan sistem", en: "System check" },
  "audit.ranah.professional_learning": { default: "Belajar guru", en: "Teacher learning" },
  "audit.ranah.question_health": { default: "Kesehatan soal", en: "Question health" },
  "audit.ranah.quick_assessment": { default: "Uji Cepat", en: "Quick Assessment" },
  "audit.ranah.report_template": { default: "Laporan", en: "Reports" },
  "audit.ranah.role": { default: "Peran", en: "Role" },
  "audit.ranah.school": { default: "Sekolah", en: "School" },
  "audit.ranah.school_pass_mark": { default: "Ketuntasan", en: "Pass mark" },
  "audit.ranah.scoring_policy": { default: "Asesmen", en: "Assessment" },
  "audit.ranah.selfcheck": { default: "Pemeriksaan sistem", en: "System check" },
  "audit.ranah.structure": { default: "Struktur sekolah", en: "School structure" },
  "audit.ranah.support_report": { default: "Laporan masalah", en: "Problem report" },
  "audit.ranah.transfer": { default: "Pindah sekolah", en: "School transfer" },
  "audit.ranah.ASSESSMENT": { default: "Asesmen", en: "Assessment" },
  "audit.ranah.CERTIFICATE": { default: "Sertifikat", en: "Certificate" },
  "audit.ranah.COURSE": { default: "Materi", en: "Content" },
  "audit.ranah.EVIDENCE": { default: "Asesmen", en: "Assessment" },
  "audit.ranah.FINDING": { default: "Materi", en: "Content" },
  "audit.ranah.INTEGRITY": { default: "Integritas", en: "Integrity" },
  "audit.ranah.LEARNING": { default: "Materi", en: "Content" },
  "audit.ranah.QUESTION": { default: "Kesehatan soal", en: "Question health" },
  "audit.ranah.RELEASE": { default: "Materi", en: "Content" },
  "audit.tabel.academic_periods": { default: "Tahun ajaran", en: "School year" },
  "audit.tabel.assessment_assignments": { default: "Penugasan asesmen", en: "Assessment assignment" },
  "audit.tabel.assessment_definitions": { default: "Aturan asesmen", en: "Assessment rule" },
  "audit.tabel.assessment_results": { default: "Hasil asesmen", en: "Assessment result" },
  "audit.tabel.assessment_sessions": { default: "Asesmen", en: "Assessment" },
  "audit.tabel.audit_log": { default: "Jejak audit", en: "Audit trail" },
  "audit.tabel.briefings": { default: "Pengarahan", en: "Briefing" },
  "audit.tabel.broadcast_notices": { default: "Pengumuman", en: "Notice" },
  "audit.tabel.certificate_templates": { default: "Tata letak sertifikat", en: "Certificate layout" },
  "audit.tabel.certificates": { default: "Sertifikat", en: "Certificate" },
  "audit.tabel.classes": { default: "Kelas", en: "Class" },
  "audit.tabel.courses": { default: "Materi", en: "Content" },
  "audit.tabel.enrollments": { default: "Keanggotaan kelas", en: "Class enrolment" },
  "audit.tabel.evaluation_evaluators": { default: "Akses peragaan", en: "Demonstration access" },
  "audit.tabel.evaluation_sessions": { default: "Peragaan", en: "Demonstration" },
  "audit.tabel.feature_flags": { default: "Fitur platform", en: "Platform feature" },
  "audit.tabel.feedback_cycles": { default: "Putaran umpan balik", en: "Feedback round" },
  "audit.tabel.feedback_question_sets": { default: "Pertanyaan umpan balik", en: "Feedback questions" },
  "audit.tabel.feedback_thresholds": { default: "Batas tampil umpan balik", en: "Feedback threshold" },
  "audit.tabel.import_jobs": { default: "Pendataan", en: "Intake" },
  "audit.tabel.ingest_batches": { default: "Pendataan", en: "Intake" },
  "audit.tabel.institutions": { default: "Sekolah", en: "School" },
  "audit.tabel.integrity_signals": { default: "Tanda integritas", en: "Integrity signal" },
  "audit.tabel.learning_assignments": { default: "Materi untuk kelas", en: "Class content" },
  "audit.tabel.maintenance_windows": { default: "Pemeliharaan", en: "Maintenance" },
  "audit.tabel.management_decisions": { default: "Kasus pimpinan", en: "Management case" },
  "audit.tabel.memberships": { default: "Keanggotaan", en: "Membership" },
  "audit.tabel.metric_catalogue": { default: "Ukuran laporan", en: "Report measures" },
  "audit.tabel.mode_policy": { default: "Batas asesmen", en: "Assessment limits" },
  "audit.tabel.org_nodes": { default: "Struktur sekolah", en: "School structure" },
  "audit.tabel.persons": { default: "Orang", en: "Person" },
  "audit.tabel.platform_config": { default: "Pengaturan platform", en: "Platform settings" },
  "audit.tabel.platform_environment": { default: "Lingkungan platform", en: "Platform environment" },
  "audit.tabel.probe": { default: "Pemeriksaan sistem", en: "System check" },
  "audit.tabel.plp_releases": { default: "Terbitan materi", en: "Content release" },
  "audit.tabel.question_health": { default: "Kesehatan soal", en: "Question health" },
  "audit.tabel.recovery_ladder": { default: "Pemulihan akun", en: "Account recovery" },
  "audit.tabel.release_distributions": { default: "Pembagian materi", en: "Content sharing" },
  "audit.tabel.report_templates": { default: "Templat laporan", en: "Report template" },
  "audit.tabel.role_assignments": { default: "Peran", en: "Role" },
  "audit.tabel.school_pass_marks": { default: "Batas ketuntasan", en: "Pass mark" },
  "audit.tabel.scoring_policy": { default: "Aturan perhitungan nilai", en: "Scoring rules" },
  "audit.tabel.support_reports": { default: "Laporan masalah", en: "Problem report" },
  "audit.tabel.transfers": { default: "Pindah sekolah", en: "School transfer" },
  "audit.aksi.lain": { default: "Perubahan tercatat", en: "Change recorded" },

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
  "nav.pembelajaran": { default: "Belajar", en: "My Learning" },
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
  "umpanbalik.pimpinan.kosong": { default: "Belum ada putaran umpan balik dalam lingkup ini.", en: "No round of feedback has been held in this part of the school yet." },
  "umpanbalik.pimpinan.buka": { default: "Buka umpan balik kelas", en: "Open class feedback" },

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
  "umpanbalik.kelas.judul": { default: "Kelas dalam lingkup ini", en: "Classes in this part of the school" },
  "umpanbalik.kelas.sub": { default: "Putaran umpan balik dimulai untuk satu kelas dan satu gurunya.", en: "A feedback round is started for one class and one of its educators." },
  "umpanbalik.kelas.kosong": { default: "Belum ada kelas dalam lingkup ini.", en: "There are no classes in this part of the school yet." },
  "umpanbalik.kelas.buka": { default: "Buka kelas", en: "Open class" },
  "umpanbalik.kelas.putaran": { default: "Putaran untuk kelas ini", en: "Rounds for this class" },

  "umpanbalik.buka.judul": { default: "Mulai putaran umpan balik", en: "Start a feedback round" },
  "umpanbalik.buka.sub": { default: "Pilih guru yang akan ditanyakan kepada kelas ini.", en: "Choose the educator this class will be asked about." },
  "umpanbalik.buka.kosong": { default: "Tidak ada guru yang bisa ditanyakan untuk kelas ini.", en: "There is no educator this class can be asked about." },
  "umpanbalik.buka.tanpa_wewenang": { default: "Kelas ini bukan wewenang Anda.", en: "This class is not yours." },
  "umpanbalik.buka.aksi": { default: "Mulai putaran", en: "Start a round" },
  "umpanbalik.buka.memulai": { default: "Memulai…", en: "Starting…" },
  "umpanbalik.buka.dibuka": { default: "Putaran umpan balik untuk kelas ini sudah dimulai.", en: "The feedback round for this class has started." },
  "umpanbalik.buka.sudah_ada": { default: "Kelas ini sudah punya putaran tentang guru itu pada periode ini.", en: "This class already has a round about that educator in this period." },
  "umpanbalik.buka.bukan_pengajar": { default: "Guru itu tidak lagi tercatat mengajar kelas ini.", en: "That educator is no longer recorded as teaching this class." },
  "umpanbalik.buka.bukan_wewenang": { default: "Kelas ini bukan wewenang Anda untuk memulai putaran.", en: "This class is not yours to start a round for." },
  "umpanbalik.buka.bukan_akademik": { default: "Kelas ini terhubung dengan materi di luar kurikulum akademik, sehingga putaran umpan balik tidak dibuka untuknya.", en: "This class is connected to material outside the academic curriculum, so a feedback round is not opened for it." },
  "umpanbalik.buka.kelas_belum_siap": { default: "Kelas ini belum siap untuk putaran umpan balik.", en: "This class is not ready for a feedback round." },
  "umpanbalik.buka.belum_siap": { default: "PINTAR belum siap memulai putaran umpan balik.", en: "PINTAR is not ready to start a feedback round." },
  "umpanbalik.buka.subjek_sendiri": { default: "Putaran tentang pengajaran Anda sendiri dimulai oleh orang lain.", en: "A round about your own teaching is started by somebody else." },
  "umpanbalik.buka.tak_pasti": { default: "Sambungan terputus sebelum ada jawaban pasti. Buka kembali halaman ini untuk melihat keadaannya.", en: "The connection dropped before there was a definite answer. Open this page again to see where things stand." },
  "mengajar.kembali": { default: "Mengajar", en: "Classes" },
  "mengajar.sedia.kode.assign_not_allowed": { default: "Anda tidak berwenang menyediakan materi untuk kelas ini.", en: "You are not allowed to make material available to this class." },
  "mengajar.sedia.kode.assign_class_invalid": { default: "Kelas ini tidak aktif atau belum punya tahun ajaran.", en: "This class is inactive or has no academic year." },
  "mengajar.sedia.kode.assign_release_not_published": { default: "Materi ini belum terbit, jadi belum bisa disediakan.", en: "This material is not published yet, so it cannot be made available." },
  "mengajar.sedia.kode.assign_window_invalid": { default: "Tanggal selesai harus sesudah tanggal mulai.", en: "The end date must be after the start date." },
  "mengajar.sedia.kode.assign_exists": { default: "Materi ini sudah disediakan untuk kelas ini.", en: "This material is already available to this class." },
  "mengajar.sedia.kode.assign_pre_test_missing": { default: "Materi ini belum punya Pemetaan Awal. Tandai soal Pemetaan awal di buku kerja, unggah sebagai versi berikutnya di Studio, lalu terbitkan lagi.", en: "This material has no Initial Mapping yet. Mark Initial Mapping questions and publish again." },
  "mengajar.sedia.kode.assign_post_test_missing": { default: "Materi ini belum punya Uji Penguasaan. Tandai soal Cek penguasaan di buku kerja, unggah sebagai versi berikutnya di Studio, lalu terbitkan lagi.", en: "This material has no Mastery Check yet. Mark Mastery Check questions and publish again." },
  "mengajar.sedia.kode.assign_pre_test_too_short": { default: "Soal Pemetaan awal di materi ini kurang dari yang diminta.", en: "This material has fewer Initial Mapping questions than it asks for." },
  "mengajar.sedia.kode.assign_post_test_too_short": { default: "Soal Cek penguasaan di materi ini kurang dari yang diminta.", en: "This material has fewer Mastery Check questions than it asks for." },
  "mengajar.sedia.kode.assign_cycle_overlap": { default: "Soal Cek penguasaan berada di kelompok paralel yang sama dengan soal Pemetaan awal, sehingga tidak bisa dipakai. Pisahkan kelompoknya di buku kerja, unggah sebagai versi berikutnya di Studio, lalu terbitkan lagi.", en: "The Mastery Check questions share a parallel group with the Initial Mapping questions, so they cannot be used. Separate the groups and publish again." },
  // D-183 (F-4(f)): proposed words, awaiting Dr Gladys (K1 B35)
  "mengajar.sedia.kode.assign_exposed_content": { default: "Soal Pemetaan Awal dan Cek penguasaan pelajaran ini pernah terbuka untuk umum, jadi tidak dapat dipakai sebagai asesmen di sekolah. Gunakan versi pelajaran yang soalnya sudah diganti.", en: "This lesson's Pemetaan Awal and Cek penguasaan questions were once made public, so they cannot be used as an assessment in a school. Use a version of the lesson whose questions have been replaced." },
  "mengajar.sedia.kode.assign_pass_mark_missing": { default: "Batas ketuntasan pelajaran ini belum ditetapkan, jadi pelajaran ini belum bisa disediakan untuk kelas. Admin sekolah menetapkannya di Konfigurasi → Batas ketuntasan.", en: "This lesson has no pass mark yet, so it cannot be given to a class. The school admin sets it in Configuration → Pass mark." },
  "mengajar.sedia.batas": { default: "Batas ketuntasan:", en: "Pass mark:" },
  "mengajar.siap.asal.pintar": { default: "Materi PINTAR", en: "PINTAR material" },
  "mengajar.siap.asal.sekolah": { default: "Materi sekolah", en: "School material" },
  "mengajar.sedia.batas_belum": { default: "Batas ketuntasan belum ditetapkan. Admin sekolah menetapkannya di Konfigurasi → Batas ketuntasan; sampai itu, pelajaran ini belum bisa disediakan.", en: "No pass mark has been set. The school admin sets it in Configuration → Pass mark; until then this lesson cannot be given." },
  "mengajar.sedia.kode.assign_input_invalid": { default: "Kelas atau materi tidak dikenali.", en: "The class or material was not recognised." },
  "mengajar.sedia.kode.assign_failed": { default: "Materi belum berhasil disediakan. Coba lagi sebentar lagi.", en: "The material could not be made available. Try again in a moment." },
  "cycle.pemetaan.belum_ada": { default: "Pemetaan Awal untuk pelajaran ini belum disiapkan. Tanyakan kepada guru.", en: "The Initial Mapping for this lesson is not ready yet. Ask the teacher." },
  "cycle.penguasaan.belum_ada": { default: "Uji Penguasaan untuk pelajaran ini belum disiapkan. Tanyakan kepada guru.", en: "The Mastery Check for this lesson is not ready yet. Ask the teacher." },
  "mengajar.sapa.pagi": { default: "Selamat pagi", en: "Good morning" },
  "mengajar.sapa.siang": { default: "Selamat siang", en: "Good afternoon" },
  "mengajar.sapa.sore": { default: "Selamat sore", en: "Good evening" },
  "mengajar.sapa.malam": { default: "Selamat malam", en: "Good evening" },
  "mengajar.beranda.intro": { default: "Satu hal yang paling layak dikerjakan lebih dulu, lalu kelas dalam lingkup mengajar Anda.", en: "The one thing most worth doing first, then the classes in your teaching scope." },
  "mengajar.layak.eyebrow": { default: "Layak dikerjakan lebih dulu", en: "Worth doing first" },
  "mengajar.layak.kosong": { default: "Tidak ada yang menunggu keputusan Anda hari ini.", en: "Nothing is waiting on your decision today." },
  // W16: a class with no material at all while the school has published some (no course is proposed: BOB-40)
  "mengajar.layak.kelas_baru": { default: "Materi yang diterbitkan sekolah belum disediakan untuk", en: "The school's published material is not yet available to" },
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
  "mengajar.kelas.intro": { default: "Kelas ini tampil karena sekolah menugaskan Anda ke lingkup yang mencakupnya. Daftar murid berasal dari pendaftaran sekolah, bukan dari PINTAR.", en: "This class appears because the school assigned you to a scope that contains it. The student list comes from the school's enrolment, not from PINTAR." },
  "mengajar.pindah": { default: "Pindah kelas", en: "Switch class" },
  "mengajar.fakta.mapel": { default: "Mata pelajaran", en: "Subject" },
  "mengajar.fakta.murid": { default: "Murid terdaftar", en: "Enrolled students" },
  "mengajar.fakta.materi": { default: "Materi tersedia", en: "Material available" },
  "mengajar.fakta.materi.kosong": { default: "Belum ada", en: "None yet" },
  "mengajar.fakta.berubah": { default: "Perubahan terakhir", en: "Last changed" },
  "mengajar.aksi.uji_cepat": { default: "Uji Cepat", en: "Quick Assessment" },
  "mengajar.aksi.bukti": { default: "Lihat bukti", en: "See evidence" },
  "mengajar.aksi.langkah": { default: "Langkah berikutnya", en: "What next" },
  "mengajar.materi.judul": { default: "Materi untuk kelas ini", en: "Material for this class" },
  "mengajar.materi.sub": { default: "Urutan mengikuti kurikulum sekolah. Menyediakan materi tidak sama dengan menerbitkannya; penerbitan dilakukan sekolah.", en: "Order follows the school's curriculum. Making material available is not the same as publishing it; the school publishes." },
  "mengajar.materi.kosong": { default: "Belum ada materi yang disediakan untuk kelas ini.", en: "No material has been made available to this class yet." },
  "mengajar.materi.berakhir": { default: "Sudah berakhir ({n})", en: "Ended or withdrawn ({n})" },
  "mengajar.materi.diakhiri_pada": { default: "Diakhiri {tanggal} · hasilnya tetap dihitung", en: "Ended {tanggal} · its results still count" },
  "mengajar.materi.ditarik_pada": { default: "Ditarik {tanggal} · hasilnya tidak dihitung di laporan kelas dan sekolah", en: "Withdrawn {tanggal} · its results are not counted in class or school reports" },
  "mengajar.materi.alasan": { default: "Alasan: {alasan}", en: "Reason: {alasan}" },
  "mengajar.materi.hasil_murid": { default: "Hasil tiap murid ada di halaman muridnya.", en: "Each student's result is on that student's page." },
  "mengajar.materi.tanpa_judul": { default: "Materi tanpa judul", en: "Untitled material" },
  "mengajar.murid1.eyebrow": { default: "Catatan belajar", en: "Learning record" },
  "mengajar.murid1.catatan": { default: "Catatan belajar satu murid di kelas Anda, untuk mendukung belajarnya. Tidak dibandingkan dengan murid lain dan bukan peringkat.", en: "One student's learning record in your class, to support their learning. It is not compared with other students and is not a ranking." },
  "mengajar.murid1.tugas": { default: "Penilaian di kelas ini", en: "Assessments in this class" },
  "mengajar.murid1.tugas_kosong": { default: "Belum ada asesmen yang dibuka di kelas ini.", en: "No assessment has opened in this class yet." },
  "mengajar.murid1.hasil": { default: "Hasil resmi", en: "Official results" },
  "mengajar.murid1.hasil_arti": { default: "Penguasaan yang tercatat pada tiap asesmen yang sudah dinilai.", en: "The mastery recorded on each assessment that has been scored." },
  "mengajar.murid1.hasil_kosong": { default: "Belum ada hasil resmi untuk murid ini.", en: "No official result for this student yet." },
  // W2.18 (J5.13): the objectives the learner has not yet reached, by their statement; «belum» is never failure (X.5)
  "mengajar.murid1.tujuan": { default: "Tujuan pembelajaran yang belum tercapai", en: "Learning objectives not yet reached" },
  "mengajar.murid1.tujuan_arti": { default: "Dari Uji Penguasaan terakhir murid ini di kelas ini: tujuan yang penguasaannya masih di bawah target. Ini yang perlu dipelajari lagi, bukan penilaian atas muridnya.", en: "From this student's latest Mastery Check in this class: the objectives whose mastery is still below the target. This is what to work on next, not a judgment of the student." },
  "mengajar.murid1.tujuan_kosong": { default: "Tidak ada tujuan pembelajaran yang tercatat di bawah target pada Uji Penguasaan murid ini di kelas ini.", en: "No learning objective is recorded below the target on this student's Mastery Checks in this class." },
  "mengajar.murid.judul": { default: "Murid", en: "Students" },
  "mengajar.murid.sub": { default: "Nama diurutkan abjad; tidak ada peringkat.", en: "Names in alphabetical order; there is no ranking." },
  "mengajar.murid.kosong": { default: "Belum ada murid terdaftar di kelas ini.", en: "No student is enrolled in this class yet." },
  "mengajar.status.tersedia": { default: "Tersedia", en: "Available" },
  "mengajar.status.selesai": { default: "Selesai", en: "Finished" },
  "mengajar.status.belum": { default: "Belum disediakan", en: "Not yet available" },
  "mengajar.status.siap": { default: "Siap disediakan", en: "Ready to make available" },
  "mengajar.status.berjalan": { default: "Berjalan", en: "Open" },
  // W16: made available with a future «Mulai»; learners cannot open it until then
  "mengajar.status.dijadwalkan": { default: "Dijadwalkan", en: "Scheduled" },
  // W2.21 (owner, 9 Nov): ending or withdrawing a lesson assignment on the record
  "mengajar.status.diakhiri": { default: "Diakhiri", en: "Ended" },
  "mengajar.status.ditarik": { default: "Ditarik", en: "Withdrawn" },
  "mengajar.akhiri.buka": { default: "Akhiri atau tarik", en: "End or withdraw" },
  "mengajar.akhiri.judul": { default: "Akhiri atau tarik penugasan", en: "End or withdraw this assignment" },
  "mengajar.akhiri.arti": { default: "Murid kelas ini tidak dapat memulai lagi materi ini. Hasil, sertifikat dan kemajuan belajar yang sudah ada tetap tersimpan. Paket pelajarannya tetap terbit dan dapat diberikan lagi.", en: "Students in this class can no longer start this material. Results, certificates and learning progress already recorded are kept. The lesson package stays published and can be given again." },
  "mengajar.akhiri.selesai_n": { default: "Sudah menyelesaikan", en: "Finished" },
  "mengajar.akhiri.belum_n": { default: "Belum memulai", en: "Not started" },
  "mengajar.akhiri.berjalan": { default: "Masih mengerjakan asesmen", en: "Still answering an assessment" },
  "mengajar.akhiri.berjalan_kosong": { default: "Tidak ada murid yang sedang mengerjakan asesmen materi ini.", en: "No student is answering an assessment of this material." },
  "mengajar.akhiri.jenis": { default: "Mengapa penugasan ini berakhir?", en: "Why is this assignment ending?" },
  "mengajar.akhiri.jenis.ended": { default: "Diakhiri: materi sudah selesai dibahas", en: "Ended: the material has been covered" },
  "mengajar.akhiri.jenis.withdrawn": { default: "Ditarik: diberikan karena keliru", en: "Withdrawn: given by mistake" },
  "mengajar.akhiri.alasan": { default: "Alasan", en: "Reason" },
  "mengajar.akhiri.alasan.arti": { default: "10 sampai 300 karakter. Tercatat di jejak audit sekolah dan terlihat oleh guru kelas ini.", en: "10 to 300 characters. Recorded in the school's audit trail and visible to this class's teachers." },
  "mengajar.akhiri.konfirmasi": { default: "Tutup juga asesmen yang masih dikerjakan murid di atas. Asesmen itu ditutup sekarang dan tidak dinilai; jawaban yang sudah tersimpan tetap ada.", en: "Also close the assessments the students above are still answering. They close now and are not scored; the answers already saved are kept." },
  "mengajar.akhiri.tombol": { default: "Akhiri penugasan", en: "End assignment" },
  "mengajar.akhiri.tanpa_judul": { default: "materi ini", en: "this material" },
  "hasilbelajar.ditarik": { default: "Guru Anda menarik penugasan ini. Hasil Anda tetap tersimpan di sini.", en: "Your teacher withdrew this assignment. Your result stays here." },
  "hasilbelajar.ditutup_awal": { default: "Pemetaan Awal selesai: {persen}. Materi ini ditutup sebelum Uji Penguasaan.", en: "Initial Mapping finished: {persen}. This material closed before the Mastery Check." },
  "mengajar.murid1.ditarik": { default: "Ditarik · tidak dihitung di laporan kelas dan sekolah", en: "Withdrawn · not counted in class or school reports" },
  "sync.diakhiri_sekolah": { default: "Asesmen ini sudah ditutup dan tidak dinilai. Jawaban yang sudah tersimpan tetap ada. Bila ada pertanyaan, tanyakan kepada guru Anda.", en: "This assessment has been closed and is not scored. The answers already saved are kept. If you have a question, ask your teacher." },
  "mengajar.akhiri.tombol_tarik": { default: "Tarik penugasan", en: "Withdraw assignment" },
  "mengajar.akhiri.tanya": { default: "Akhiri penugasan {kursus}?", en: "End the assignment {kursus}?" },
  "mengajar.akhiri.tanya_tarik": { default: "Tarik penugasan {kursus}?", en: "Withdraw the assignment {kursus}?" },
  "mengajar.akhiri.akibat": { default: "Materi ini tidak lagi muncul untuk dikerjakan di halaman Belajar murid kelas ini. Hasil yang sudah ada tetap tersimpan, tetap terlihat oleh murid, dan tetap dihitung.", en: "This material can no longer be worked on from the class's students' Belajar pages. Results already made are kept, still seen by the students, and still counted." },
  "mengajar.akhiri.akibat_tarik": { default: "Materi ini tidak lagi muncul di halaman Belajar murid kelas ini. Hasil yang sudah ada tetap tersimpan tetapi tidak dihitung di laporan kelas dan sekolah.", en: "This material no longer appears on the class's students' Belajar pages. Results already made are kept but not counted in class or school reports." },
  "mengajar.akhiri.ok_tarik": { default: "Penugasan ditarik. Hasil murid tetap tersimpan tetapi tidak dihitung di laporan kelas dan sekolah.", en: "Assignment withdrawn. Students' results are kept but not counted in class or school reports." },
  "mengajar.akhiri.tutup": { default: "Tutup tanpa mengubah", en: "Close without changing anything" },
  "mengajar.akhiri.batal": { default: "Batal", en: "Cancel" },
  "mengajar.akhiri.ok": { default: "Penugasan diakhiri. Hasil murid tetap tersimpan.", en: "Assignment ended. Students' results are kept." },
  "mengajar.sedia.kode.assign_not_live": { default: "Penugasan ini sudah diakhiri atau ditarik.", en: "This assignment has already been ended or withdrawn." },
  "mengajar.sedia.kode.assign_kind_invalid": { default: "Pilih Selesai atau Ditarik.", en: "Choose Finished or Withdrawn." },
  "mengajar.sedia.kode.assign_reason_required": { default: "Tuliskan alasannya, 10 sampai 300 karakter.", en: "Write the reason, 10 to 300 characters." },
  "mengajar.sedia.kode.assign_in_progress": { default: "Masih ada murid yang mengerjakan asesmen materi ini. Centang konfirmasi untuk mengakhirinya, atau kembali setelah mereka selesai.", en: "Some students are still answering an assessment of this material. Tick the confirmation to end it, or come back once they have finished." },
  "mengajar.siap.langkah1": { default: "Pilih materi", en: "Choose material" },
  "mengajar.siap.langkah2": { default: "Tinjau yang akan diterima murid", en: "Review what students receive" },
  "mengajar.siap.langkah3": { default: "Sediakan", en: "Make available" },
  "mengajar.siap.eyebrow": { default: "Siapkan materi", en: "Prepare learning" },
  "mengajar.siap.judul": { default: "Yang akan diterima murid", en: "What students will receive" },
  "mengajar.siap.intro": { default: "Belum ada yang berubah untuk murid. Semua di bawah ini baru berlaku setelah Anda menekan tombol sediakan di bagian akhir.", en: "Nothing has changed for students yet. Everything below only takes effect after you press the make-available button at the end." },
  "mengajar.siap.pilih": { default: "Pilih materi yang akan disediakan", en: "Choose the material to make available" },
  "mengajar.siap.pilih.kosong": { default: "Belum ada materi terbitan sekolah yang bisa disediakan untuk kelas ini.", en: "The school has published no material that can be made available to this class yet." },
  // DAISY-26 (UX-20): a release is known by its date, which now starts the line; the version number is gone
  "mengajar.siap.diterbitkan": { default: "Diterbitkan sekolah", en: "Published by the school" },
  "mengajar.siap.pelajaran": { default: "pelajaran", en: "lessons" },
  "mengajar.siap.soal": { default: "soal", en: "items" },
  "mengajar.siap.terima": { default: "Yang akan diterima murid", en: "What students receive" },
  "mengajar.siap.jendela": { default: "Jendela", en: "Window" },
  "mengajar.siap.jendela.arti": { default: "Murid melihat materi ini di halaman Belajar selama jendela terbuka.", en: "Students see this material on their Learning page while the window is open." },
  "mengajar.siap.mulai": { default: "Mulai", en: "From" },
  "mengajar.siap.sampai": { default: "Sampai", en: "Until" },
  "mengajar.siap.sampai.kosong": { default: "Tanpa batas akhir", en: "No end date" },
  "mengajar.siap.disediakan": { default: "Disediakan untuk", en: "Made available to" },
  "mengajar.siap.dipilih": { default: "dipilih", en: "selected" },
  "mengajar.siap.terdaftar": { default: "murid terdaftar hari ini", en: "students enrolled today" },
  "mengajar.siap.tinjau": { default: "Tinjauan sebelum disediakan", en: "Review before making available" },
  "mengajar.siap.akibat.1": { default: "Setelah disediakan,", en: "Once made available," },
  "mengajar.siap.akibat.2": { default: "akan melihat materi ini di halaman Belajar mereka.", en: "will see this material on their Learning page." },
  "mengajar.siap.akibat.3": { default: "Anda bisa mengubah jendelanya nanti, tetapi tidak bisa menarik kembali pekerjaan yang sudah dimulai murid.", en: "You can change the window later, but you cannot take back work a student has already started." },
  "mengajar.siap.komit": { default: "Sediakan", en: "Make available" },
  "mengajar.siap.kembali": { default: "Kembali ke pilihan materi", en: "Back to material choice" },
  "mengajar.instrumen.PRE_TEST": { default: "Pemetaan Awal", en: "Initial Mapping" },
  "mengajar.instrumen.POST_TEST": { default: "Uji Penguasaan", en: "Mastery Check" },
  "mengajar.instrumen.STANDALONE": { default: "Asesmen Mandiri", en: "Standalone Assessment" },
  // DAISY-04. The fourth assessment mode had no label, so any class that had run an
  // Uji Cepat took the Siapkan page down with it (audit M7). D-015 names it.
  "mengajar.instrumen.QUICK": { default: "Uji Cepat", en: "Quick Assessment" },
  // ...and the five modes FABLE-04 added (migration 0038), none of which had a
  // label either. Every value of assessment_mode now has one; DAISY-04-GALAT-01
  // reads the enum from the migrations so the next mode added cannot slip by.
  "mengajar.instrumen.PRACTICE": { default: "Latihan", en: "Practice" },
  "mengajar.instrumen.TEST": { default: "Tes", en: "Test" },
  "mengajar.instrumen.EXAM": { default: "Ujian", en: "Exam" },
  "mengajar.instrumen.PUBLIC_DEMO": { default: "Demonstrasi", en: "Demonstration" },
  "mengajar.instrumen.PAPER": { default: "Tes di Kertas", en: "Paper Test" },
  // DAISY-04 (D-011): PINTAR's own error and not-found pages, never Next's English
  // defaults. Calm, no blame, no raw message; a short reference to pass on.
  "galat.judul": { default: "Maaf, halaman ini tidak bisa ditampilkan", en: "Sorry, this page could not be shown" },
  "galat.arti": { default: "Coba lagi sebentar lagi. Jika masih terjadi, sampaikan kode rujukan di bawah kepada pengelola sekolah Anda.", en: "Please try again in a moment. If it keeps happening, give the reference below to your school's administrator." },
  "galat.rujukan": { default: "Kode rujukan", en: "Reference" },
  "galat.ulang": { default: "Coba lagi", en: "Try again" },
  "galat.beranda": { default: "Ke halaman awal", en: "Go to the start page" },
  "tidak_ada.judul": { default: "Halaman ini tidak ada", en: "This page does not exist" },
  "tidak_ada.arti": { default: "Alamatnya mungkin keliru, atau halaman ini sudah dipindahkan.", en: "The address may be mistyped, or the page may have moved." },
  "mengajar.instrumen.sertifikat": { default: "Sertifikat", en: "Certificate" },
  "mengajar.instrumen.sertifikat.arti": { default: "Diterbitkan sekolah bila murid memenuhi capaian; bisa diperiksa siapa pun lewat tautan.", en: "Issued by the school when a student meets the standard; anyone can check it through its link." },
  "mengajar.percobaan": { default: "kesempatan", en: "attempt" },
  "mengajar.cepat.eyebrow": { default: "Uji Cepat", en: "Quick Assessment" },
  "mengajar.cepat.judul": { default: "Uji Cepat", en: "Quick Assessment" },
  "mengajar.cepat.intro": { default: "Beberapa soal untuk mengecek pemahaman hari ini. Hasilnya dinilai seperti asesmen lain dan menjadi bagian dari bukti pembelajaran kelas ini.", en: "A few items to check today's understanding. The result is scored like any other assessment and becomes part of this class's learning evidence." },
  "mengajar.cepat.langkah1": { default: "Atur", en: "Configure" },
  "mengajar.cepat.langkah2": { default: "Tinjau", en: "Review" },
  "mengajar.cepat.langkah3": { default: "Sediakan", en: "Make available" },
  "mengajar.cepat.bab": { default: "Bab", en: "Chapter" },
  "mengajar.cepat.bab.arti": { default: "Soal diambil dari terbitan yang sudah diterbitkan sekolah untuk bab ini.", en: "Items come from the release the school has published for this chapter." },
  "mengajar.cepat.bab.kosong": { default: "Belum ada bab yang disediakan untuk kelas ini, jadi belum ada soal yang bisa diambil.", en: "No chapter has been made available to this class yet, so there are no items to draw from." },
  "mengajar.cepat.jumlah": { default: "Jumlah soal", en: "Number of items" },
  // DAISY-26 (UX-32): the range as the teacher's choice, «Antara 3 dan 20 soal.», not the machinery behind it
  "mengajar.cepat.jumlah.antara": { default: "Antara", en: "Between" },
  "mengajar.cepat.jumlah.dan": { default: "dan", en: "and" },
  "mengajar.cepat.jendela": { default: "Jendela", en: "Window" },
  "mengajar.cepat.jendela.arti": { default: "Berhitung sejak disediakan. Tiap murid mendapat satu kesempatan.", en: "Counted from the moment it is made available. Each student gets one attempt." },
  "mengajar.cepat.menit": { default: "menit", en: "min" },
  "mengajar.cepat.untuk": { default: "Untuk", en: "For" },
  "mengajar.cepat.lanjut": { default: "Lanjut ke tinjauan", en: "Continue to review" },
  "mengajar.cepat.tinjau": { default: "Yang akan terjadi", en: "What will happen" },
  "mengajar.cepat.rv1": { default: "Murid kelas ini yang masuk PINTAR melihat Uji Cepat itu di halaman Belajar mereka.", en: "Students in this class who are signed in see that Quick Assessment on their Learning page." },
  "mengajar.cepat.rv2": { default: "Satu kesempatan untuk tiap murid, dan jendelanya mulai berjalan begitu disediakan.", en: "One attempt for each student, and the window starts the moment it is made available." },
  "mengajar.cepat.rv3": { default: "Hasilnya tercatat sebagai bukti pembelajaran. Uji Cepat tidak menerbitkan sertifikat.", en: "The result is recorded as learning evidence. A Quick Assessment does not issue a certificate." },
  "mengajar.cepat.rv4": { default: "Murid yang tidak sempat mengerjakan tidak dicatat sebagai tidak mampu — tercatat belum mengumpulkan.", en: "A student who does not get to it is not recorded as unable — only as not yet submitted." },
  "mengajar.cepat.akibat": { default: "Begitu disediakan, jendela mulai berjalan untuk semua murid dan murid bisa langsung mulai mengerjakan.", en: "The moment it is made available, the window starts for every student and they can begin straight away." },
  "mengajar.cepat.komit": { default: "Sediakan Uji Cepat sekarang", en: "Make the Quick Assessment available now" },
  "mengajar.cepat.ok": { default: "Uji Cepat disediakan untuk kelas ini.", en: "The Quick Assessment is now available to this class." },
  "mengajar.sedia.ok": { default: "Materi disediakan untuk kelas ini.", en: "The material is now available to this class." },
  "mengajar.cepat.ubah": { default: "Ubah pengaturan", en: "Change settings" },
  "mengajar.cepat.hidup.eyebrow": { default: "Tersedia untuk kelas ini", en: "Available to this class" },
  "mengajar.cepat.hidup.judul": { default: "Uji Cepat sedang berjalan", en: "The Quick Assessment is open" },
  "mengajar.cepat.hidup.kumpul": { default: "Sudah mengumpulkan", en: "Submitted" },
  "mengajar.cepat.hidup.sisa": { default: "Sisa waktu", en: "Time left" },
  "mengajar.cepat.hidup.menit": { default: "menit lagi", en: "min left" },
  "mengajar.cepat.hidup.catatan": { default: "Angka di atas adalah hitungan, bukan penilaian. Yang belum mengumpulkan mungkin belum membuka PINTAR.", en: "The numbers above are counts, not judgments. Those who have not submitted may simply not have opened PINTAR." },
  "mengajar.cepat.hidup.siapa": { default: "Lihat siapa yang sudah mengumpulkan", en: "See who has submitted" },
  // DAISY-27 (UX-03, with BOB-32): why an Uji Cepat was not made available, one sentence per code
  // (src/components/mengajar/tolakUjiCepat.ts). «Sudah ada Uji Cepat yang berjalan» is retired: it was never the cause
  "mengajar.cepat.tolak.awal": { default: "Uji Cepat belum disediakan.", en: "The Quick Assessment was not made available." },
  "mengajar.cepat.tolak.pilih_jumlah": { default: "Pilih antara", en: "Choose between" },
  "mengajar.cepat.tolak.pilih_jumlah2": { default: "soal, masing-masing sekali.", en: "questions, each one once." },
  "mengajar.cepat.tolak.pilih_bukan": { default: "Ada soal pilihan Anda yang tidak tersedia untuk Uji Cepat bab ini. Pilih ulang dari daftar soalnya.", en: "One of the questions you chose is not available for a Quick Assessment on this chapter. Choose again from its list." },
  "mengajar.cepat.tolak.pilih_versi": { default: "Dua soal pilihan Anda adalah versi dari soal yang sama. Pilih salah satunya saja.", en: "Two of the questions you chose are versions of the same question. Choose only one of them." },
  "mengajar.cepat.pilih": { default: "Pilih soal", en: "Choose the questions" },
  "mengajar.cepat.pilih.arti": { default: "Centang soal yang ingin diberikan. Semua murid mendapat soal yang sama, dengan urutan yang diacak untuk masing-masing.", en: "Tick the questions to give. Every student gets the same questions, each in their own shuffled order." },
  "mengajar.cepat.pilih.tampilkan": { default: "Tampilkan soal bab ini", en: "Show this chapter's questions" },
  "mengajar.cepat.pilih.kosong": { default: "Bab ini belum punya soal yang bisa dipakai untuk Uji Cepat.", en: "This chapter has no questions that can be used for a Quick Assessment yet." },
  "mengajar.cepat.dipilih": { default: "soal dipilih", en: "questions chosen" },
  "mengajar.cepat.peran.PRE_TEST": { default: "Juga di Pemetaan Awal", en: "Also in the Initial Mapping" },
  "mengajar.cepat.peran.POST_TEST": { default: "Juga di Uji Penguasaan", en: "Also in the Mastery Check" },
  "mengajar.cepat.tingkat.MUDAH": { default: "Mudah", en: "Easy" },
  "mengajar.cepat.tingkat.SEDANG": { default: "Sedang", en: "Medium" },
  "mengajar.cepat.tingkat.SULIT": { default: "Sulit", en: "Hard" },
  "mengajar.cepat.tinjau.soal": { default: "Soal yang akan diterima murid", en: "The questions the students will receive" },
  "mengajar.cepat.tinjau.ubah": { default: "Ubah pilihan soal", en: "Change the questions" },
  "mengajar.cepat.terakhir": { default: "Uji Cepat terakhir", en: "The last Quick Assessment" },
  "mengajar.cepat.pelajaran": { default: "Pelajaran", en: "Lesson" },
  "mengajar.cepat.tolak.ketuntasan": { default: "Batas ketuntasan pelajaran ini belum ditetapkan, jadi pelajaran ini belum bisa disediakan untuk kelas. Admin sekolah menetapkannya di Konfigurasi → Batas ketuntasan.", en: "This lesson has no pass mark yet, so it cannot be given to a class. The school admin sets it in Configuration → Pass mark." },
  "mengajar.cepat.tolak.bank": { default: "Bab itu belum punya cukup soal untuk jumlah yang dipilih. Pilih jumlah soal yang lebih sedikit, atau bab lain.", en: "That chapter does not have enough questions for the number chosen. Choose fewer items, or another chapter." },
  "mengajar.cepat.tolak.jumlah": { default: "Jumlah soal harus antara", en: "The number of items must be between" },
  "mengajar.cepat.tolak.menit": { default: "Waktu pengerjaan itu tidak bisa dipakai. Pilih", en: "That time window cannot be used. Choose" },
  // UX-45: the recovery line is tolak.arti's educator telling, said after this one (kalimatTolakUjiCepat)
  "mengajar.cepat.tolak.izin": { default: "Anda tidak dapat menyediakan Uji Cepat untuk kelas ini dengan bab itu.", en: "You cannot make a Quick Assessment available for this class with that chapter." },
  "mengajar.cepat.tolak.tidak_ada": { default: "Kelas atau bab itu tidak ditemukan. Muat ulang halaman ini, lalu pilih lagi.", en: "That class or chapter was not found. Reload this page, then choose again." },
  "mengajar.cepat.tolak.umum": { default: "Ada kendala di PINTAR. Coba sekali lagi. Bila masih terjadi, sampaikan kepada yang mengurus PINTAR di sekolah Anda.", en: "Something went wrong in PINTAR. Try once more. If it happens again, tell whoever looks after PINTAR at your school." },
  "mengajar.cepat.atau": { default: "atau", en: "or" },
  "mengajar.bukti.eyebrow": { default: "Bukti", en: "Evidence" },
  "mengajar.bukti.judul": { default: "Apa yang sudah bisa disimpulkan", en: "What can be concluded so far" },
  "mengajar.bukti.intro": { default: "PINTAR hanya menyimpulkan bila bukti resminya cukup. Belum cukup bukan berarti buruk — artinya belum.", en: "PINTAR only concludes when the official evidence is enough. Not yet enough does not mean bad — it means not yet." },
  "mengajar.bukti.keadaan": { default: "Keadaan hari ini", en: "Where things stand today" },
  "mengajar.bukti.kumpul": { default: "Mengumpulkan", en: "Submitted" },
  "mengajar.bukti.jendela": { default: "Jendela", en: "Window" },
  "mengajar.bukti.belum": { default: "Belum mengerjakan", en: "Not yet attempted" },
  // W8: started and not handed in, apart from never started («Belum mengerjakan»)
  "mengajar.bukti.mulai": { default: "Sudah mulai, belum mengumpulkan", en: "Started, not submitted yet" },
  "mengajar.bukti.siapa": { default: "Lihat nama murid", en: "See the students' names" },
  // E-C2-1 (C2): the participant form; pending copy approval
  "mengajar.bukti.siapa_peserta": { default: "Lihat nama peserta", en: "See the participants' names" },
  // C2 (D-169(b)): pending copy approval
  "mengajar.bukti.pd.arti": { default: "Kelas pengembangan profesi tidak menghasilkan angka akademik kelas. Kemajuan dan hasil setiap peserta tercatat di Catatan pengembangan profesi.", en: "A professional-learning class produces no academic class figure. Each participant's progress and result is in the professional-learning record." },
  // C2: pending copy approval
  "mengajar.bukti.pd.buka": { default: "Buka catatan pengembangan profesi", en: "Open the professional-learning record" },
  "mengajar.bukti.murid": { default: "murid", en: "students" },
  "mengajar.bukti.poin": { default: "poin", en: "points" },
  // UX-41 (DAISY-29's words): the rows are learning objectives, each named by its statement; a «bagian» is the school's structure (D-006)
  "mengajar.bukti.bagian": { default: "Penguasaan per bagian", en: "Mastery by part" },
  "mengajar.bukti.keliru": { default: "Pemahaman keliru yang berulang di kelas ini", en: "Recurring misunderstandings in this class" },
  "mengajar.bukti.kali": { default: "kali", en: "times" },
  "mengajar.bukti.kosong": { default: "Belum ada asesmen yang berjalan atau selesai di kelas ini, jadi belum ada keadaan untuk dilaporkan.", en: "No assessment is open or finished in this class yet, so there is nothing to report on." },
  "mengajar.bukti.simpulan": { default: "Kesimpulan", en: "Conclusions" },
  "mengajar.bukti.kaki": { default: "Yang tidak tampil di sini: sinyal mutu soal dan sinyal integritas. Keduanya ditinjau Kepala departemen, bukan guru. Jawaban kelas untuk setiap soal ada di «Lihat per soal».", en: "Not shown here: item quality signals and integrity signals. Both are reviewed by the Head of department, not the teacher. The class's answers to each question are under «Lihat per soal»." },
  "mengajar.langkah.eyebrow": { default: "Langkah berikutnya", en: "What next" },
  "mengajar.langkah.judul": { default: "Yang bisa Anda lakukan sekarang", en: "What you can do now" },
  "mengajar.langkah.intro": { default: "Diurutkan dari yang paling masuk akal hari ini, berdasarkan apa yang PINTAR tahu tentang kelas ini.", en: "Ordered by what makes most sense today, from what PINTAR knows about this class." },
  "mengajar.langkah.buka": { default: "Buka", en: "Open" },
  "mengajar.langkah.f1": { default: "Lihat murid yang belum mengumpulkan", en: "See the students who have not submitted" },
  "mengajar.langkah.f1w": { default: "Selama jendela masih terbuka. Ini daftar, bukan peringkat.", en: "While the window is still open. This is a list, not a ranking." },
  "mengajar.langkah.f2": { default: "Ubah jendela asesmen yang berjalan", en: "Change the window of an open assessment" },
  "mengajar.langkah.f2w": { default: "Bila kelas butuh waktu lebih. Murid melihat jendela yang baru di halaman Belajar mereka.", en: "If the class needs more time. Students see the new window on their Learning page." },
  "mengajar.langkah.f3": { default: "Beri waktu tambahan untuk satu murid", en: "Give one student extra time" },
  "mengajar.langkah.f3w": { default: "Untuk sesi yang terputus atau alasan lain yang sah. Dicatat dengan alasan; tidak mengubah sesi murid lain.", en: "For an interrupted session or another legitimate reason. Recorded with a reason; other students' sessions are unchanged." },
  "mengajar.langkah.f4": { default: "Siapkan materi berikutnya untuk kelas ini", en: "Prepare the next material for this class" },
  "mengajar.langkah.f4w": { default: "Sudah diterbitkan sekolah. Bisa disediakan sekarang; murid mulai sesuai jendela yang Anda pilih.", en: "Published by the school. Can be made available now; students start according to the window you choose." },
  "mengajar.langkah.f5": { default: "Uji Cepat untuk mengecek pemahaman hari ini", en: "Quick Assessment to check today's understanding" },
  "mengajar.langkah.f5w": { default: "Beberapa soal, satu jendela pendek. Hasilnya menjadi bukti pembelajaran seperti asesmen lain.", en: "A few items, one short window. The result becomes learning evidence like any other assessment." },
  "mengajar.langkah.f6": { default: "Susun materi sendiri", en: "Draft your own material" },
  "mengajar.langkah.f6w": { default: "Anda bisa menyusun dan mengunggah. Persetujuan dan penerbitan dilakukan Kepala departemen dan sekolah.", en: "You can draft and upload. Approval and publishing are done by the Head of Department and the school." },
  "mengajar.siapa.judul": { default: "Siapa yang sudah mengumpulkan", en: "Who has submitted" },
  "mengajar.siapa.sudah": { default: "Sudah mengumpulkan", en: "Have submitted" },
  "mengajar.siapa.belum": { default: "Belum mengerjakan", en: "Not yet attempted" },
  "mengajar.siapa.kosong": { default: "Tidak ada murid dalam daftar ini.", en: "No student in this list." },
  "mengajar.siapa.sedang": { default: "Sudah mulai, belum mengumpulkan", en: "Started, not submitted yet" },
  "mengajar.siapa.catatan": { default: "Tiga daftar nama, diurutkan abjad. Bukan peringkat, bukan penilaian, dan tidak menyebut sebabnya — PINTAR tidak tahu sebabnya.", en: "Three lists of names in alphabetical order. Not a ranking, not a judgment, and it names no reason — PINTAR does not know the reason." },
};

/** Words that must never appear on a learner-facing surface (doc 12 "complexity leaking"). */
export const INTERNAL_WORDS = [
  "PINTAR 4.0", "FROZEN", "SUPERSEDED", "VALIDATION_FAILED", "IN_REVIEW", "INGESTED", "STRUCTURED",
  "SYNTHETIC", "PUBLIC_DEMO", "PREVIEW", "OFFICIAL", "evidence_class", "Menunggu", "Wrong", "Failed",
  "Salah", "Incorrect", "Penalty",
];

/** What a key with no copy renders (DAISY-04): calm, and never the key itself. */
export const TANPA_SALINAN = "\u2014";

export function t(
  event: HleEvent,
  persona: Persona = "learner",
  ctx: TellingContext = {},
): string {
  const row = table[event];
  // DAISY-04 (D-011). A key with no row -- one built from data, like an
  // assessment mode the copy had not caught up with -- used to throw from the
  // property read below and take the whole page down with it: the Siapkan
  // crash (audit M7). It now renders a calm dash, the fallback PINTAR already
  // uses for an unmapped enum, and never the raw key, which would put an
  // identifier on a reader's screen. The log names the key so it gets written.
  // The internal-word guard below is unchanged and still throws: that one is a
  // test of the copy, not a gap in it.
  if (!row) {
    console.warn(`HLE: no copy for "${String(event)}"`);
    return TANPA_SALINAN;
  }
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
  /**
   * A4 (Daisy, owner 9 Nov): English counts its nouns. Indonesian «1 murid» and «5 murid» share one sentence; English
   * «1 learners» does not, so a sentence built from a count passes through here: «1 students» → «1 student» (and the
   * learners, participants, topics, pairs, sittings and objectives PINTAR counts). Indonesian is returned unchanged.
   */
  tunggal(teks: string, locale: Locale = "id"): string {
    if (locale !== "en") return teks;
    return teks.replace(/(^|[^\d.,])1 (student|learner|participant|topic|pair|sitting|objective|learning objective)s\b/g, "$11 $2");
  },
  /** A4: the noun beside a count, singular in English when the count is one («1 learner»); Indonesian unchanged. */
  satuan(count: number, kata: string, locale: Locale = "id"): string {
    return locale === "en" && count === 1 ? kata.replace(/^(students|learners|participants)$/i, (w) => w.slice(0, -1)) : kata;
  },
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
  /**
   * A wait a person reads (DAISY-13): seconds under a minute, else whole
   * minutes rounded up, never shorter than the wait given. The unit's own
   * plural in each language ("30 detik", "1 minute", "5 minutes").
   */
  durasi(detik: number, locale: Locale = "id"): string {
    const menit = detik >= 60;
    return new Intl.NumberFormat(LOCALE_TAG[locale], { style: "unit", unit: menit ? "minute" : "second", unitDisplay: "long" })
      .format(menit ? Math.ceil(detik / 60) : Math.ceil(detik));
  },
  // W3.3 (Batch 2): the formal form, «9 Oktober 2026», written by the one date helper (src/lib/tanggal.ts); on the
  // issuing school's clock when the caller passes its zone (the owner's ruling, 10 Nov), else WIB as before.
  date(iso: string, locale: Locale = "id", zona?: string | null): string {
    return tanggal(iso, "resmi", locale, zona) || iso;
  },
};

/**
 * THE SCHOOL'S CALENDAR DAY (DAISY-14, audit M10). A teacher picks days, not
 * instants: "from 25 September to 30 September" means from the first moment
 * of the 25th to the last of the 30th, on the school's clock. Siapkan used to
 * send `${day}T00:00:00Z` and `${day}T23:59:59Z`, which are midnight in
 * London: the assignment opened at 07:00 WIB, closed at 06:59 WIB the day after
 * its last, and "from today" stayed shut until seven in the morning. These
 * read the day in TIMEZONE instead, with the zone's own offset on that date
 * (asked of Intl rather than written down, so a zone with daylight saving
 * would still be right), and the same helper gives Siapkan its "today".
 */
/**
 * Sharon F1 (7a2c1751): a school's «today» is its own. Indonesia keeps WIB, WITA and WIT; a school's zone is
 * institutions.zona_waktu (20270112195000), read through zonaSekolah (src/lib/zona-sekolah.ts). Each helper below takes
 * it, and keeps WIB for a caller that has no school.
 */
export const ZONA_SEKOLAH = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;
export type ZonaSekolah = (typeof ZONA_SEKOLAH)[number];
export function zonaSah(z: unknown): ZonaSekolah {
  return (ZONA_SEKOLAH as readonly string[]).includes(String(z)) ? (z as ZonaSekolah) : "Asia/Jakarta";
}

function selisihZona(hari: string, zona: string = TIMEZONE): string {
  const nama = new Intl.DateTimeFormat("en-US", { timeZone: zonaSah(zona), timeZoneName: "longOffset" })
    .formatToParts(new Date(`${hari}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-]\d{2}):?(\d{2})?/.exec(nama);
  return m ? `${m[1]}:${m[2] ?? "00"}` : "+00:00";
}

/** Today's date on the school's clock, as a date input writes it (yyyy-mm-dd). */
export function hariIniSekolah(sekarang: Date = new Date(), zona: string = TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric", month: "2-digit", day: "2-digit", timeZone: zonaSah(zona),
  }).format(sekarang);
}

/**
 * The first ("awal", 00:00:00) or last ("akhir", 23:59:59) instant of a
 * yyyy-mm-dd day on the school's clock, as an ISO timestamp with its offset;
 * null for anything that is not such a day.
 */
export function batasHari(hari: string, ujung: "awal" | "akhir", zona: string = TIMEZONE): string | null {
  // a real calendar day: 2026-02-30 is refused, not rolled into March
  const tengah = new Date(`${hari}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hari) || Number.isNaN(tengah.getTime()) || tengah.toISOString().slice(0, 10) !== hari) return null;
  return `${hari}T${ujung === "awal" ? "00:00:00" : "23:59:59"}${selisihZona(hari, zona)}`;
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
// `audit.`: the Jejak Audit's words for an action, an area and a table (D-140, DG-11), read on Konfigurasi only, by the
// administrators who may read the log; never addressed to a learner or to the public.
const STAFF_ONLY_PREFIXES = ["studio.", "config.", "pimpinan.", "pendataan.", "audit."] as const;

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
