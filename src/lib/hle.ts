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
  | "sync.done";

type Table = Record<HleEvent, Partial<Record<Persona, string>> & { default: string }>;

const table: Table = {
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
export function renderAll(): Array<{ event: HleEvent; persona: Persona; text: string }> {
  const out: Array<{ event: HleEvent; persona: Persona; text: string }> = [];
  for (const event of Object.keys(table) as HleEvent[]) {
    for (const persona of ["learner", "educator", "staff", "public"] as Persona[]) {
      out.push({ event, persona, text: t(event, persona) });
    }
  }
  return out;
}
