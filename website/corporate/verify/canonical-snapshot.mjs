// PINTAR corporate website — what the website was last reconciled against.
//
// THIS IS NOT A SPECIFICATION. The canonical PINTAR product is the only
// specification; the website represents it, never the reverse. This file is
// the record of the product values the website was reconciled with, pinned
// to the product commit they were read from, so that website verification is
// deterministic and a change in the product is NOTICED rather than silently
// absorbed. verify/canonical.mjs compares the live product with these values
// (reporting "canonical product changed — website reconciliation required")
// and the website with these values ("website misrepresents canonical
// PINTAR").
//
// When the product changes: reconcile the WEBSITE with the product first,
// then re-record this file by running
//     node verify/canonical.mjs --print --at <commit>
// against the commit it was reconciled with, and update SOURCE_COMMIT.
// Never edit a value here to make a failing check pass.
//
// Generated from the product with `node verify/canonical.mjs --print --at 2ac7ab6`
// and confirmed identical on main at 19f01b2 (the merge this lane carries).

export const SOURCE_COMMIT = "2ac7ab6";
export const CONFIRMED_UNCHANGED_AT = ["19f01b2"];
export const CATALOGUE_FILE = "20260918100000_metric_catalogue.sql";

/** src/lib/hle.ts copy rows the site shows or quotes, exactly as the table holds them. */
export const LABELS = {
  "metrik.peserta.label": {"default": "Peserta", "en": "Students"},
  "metrik.peserta.arti": {"default": "Banyaknya murid yang mengerjakan penilaian di kelas ini.", "en": "How many students took the assessment in this class."},
  "metrik.pemahaman.label": {"default": "Pemahaman", "en": "Comprehension"},
  "metrik.pemahaman.arti": {"default": "Rata-rata penguasaan kelas pada penilaian akhir.", "en": "The class's average mastery on the Mastery Check."},
  "metrik.kenaikan.label": {"default": "Kenaikan", "en": "Gain"},
  "metrik.kenaikan.arti": {"default": "Selisih penguasaan sebelum dan sesudah pembelajaran, per murid.", "en": "The difference in mastery before and after the lessons, per student."},
  "metrik.kesiapan.label": {"default": "Sebaran kesiapan", "en": "Readiness distribution"},
  "metrik.kesiapan.arti": {"default": "Banyaknya murid pada tiap tingkat kesiapan.", "en": "How many students sit at each readiness tier."},
  "metrik.topik.label": {"default": "Penguasaan per topik", "en": "Mastery by topic"},
  "metrik.topik.arti": {"default": "Rata-rata penguasaan kelas pada tiap topik.", "en": "The class's average mastery on each topic."},
  "metrik.miskonsepsi.label": {"default": "Pemahaman keliru yang berulang", "en": "Recurring misunderstandings"},
  "metrik.miskonsepsi.arti": {"default": "Pola jawaban keliru yang muncul pada banyak murid, dengan saran penanganannya.", "en": "Patterns of mistaken answers shared by many students, with what to do about them."},
  "metrik.peserta_institusi.label": {"default": "Peserta", "en": "Students"},
  "metrik.peserta_institusi.arti": {"default": "Banyaknya murid yang mengerjakan penilaian di sekolah ini.", "en": "How many students took the assessment in this school."},
  "metrik.kenaikan_institusi.label": {"default": "Kenaikan", "en": "Gain"},
  "metrik.kenaikan_institusi.arti": {"default": "Rata-rata kenaikan penguasaan murid di sekolah ini.", "en": "The average gain in mastery across this school's students."},
  "metrik.gerbang_keselamatan.label": {"default": "Butir wajib", "en": "Required items"},
  "metrik.gerbang_keselamatan.arti": {"default": "Bagian murid yang menjawab benar seluruh butir wajib.", "en": "The share of students who answered every required item correctly."},
  "metrik.kompetensi.label": {"default": "Capaian kompetensi", "en": "Competency attainment"},
  "metrik.kompetensi.arti": {"default": "Rata-rata penguasaan pada tiap ranah yang diukur.", "en": "The average mastery in each domain that was measured."},
  "kesiapan.siap_sertifikasi": {"default": "Siap sertifikasi", "en": "Ready for certification"},
  "kesiapan.perlu_review": {"default": "Perlu review", "en": "Needs review"},
  "kesiapan.butuh_pendampingan": {"default": "Butuh pendampingan ekstra", "en": "Needs extra support"},
  "kesiapan.belum_post_test": {"default": "Belum mengerjakan penilaian akhir", "en": "Mastery Check not yet taken"},
  "pimpinan.kesiapan.judul": {"default": "Kesiapan bukti", "en": "Evidence readiness"},
  "pimpinan.kesiapan.catatan": {"default": "Bukti yang belum cukup bukan hasil yang buruk. Artinya PINTAR belum boleh menyimpulkan apa pun, dan angkanya muncul sendiri ketika buktinya memenuhi syarat.", "en": "Evidence that is not yet enough is not a poor result. It means PINTAR may not conclude anything yet, and the figure appears on its own once the evidence qualifies."},
  "pimpinan.kesiapan.cukup": {"default": "Cukup untuk ditafsirkan", "en": "Enough to interpret"},
  "pimpinan.kesiapan.belum_cukup": {"default": "Sudah ada, belum cukup", "en": "Some, not enough yet"},
  "pimpinan.kesiapan.belum_ada": {"default": "Belum ada yang memenuhi syarat", "en": "Nothing qualifying yet"},
  "pimpinan.bukti.judul": {"default": "Yang didukung bukti", "en": "What the evidence supports"},
  "pimpinan.bukti.dari": {"default": "dari", "en": "from"},
  "laporan.metrik.belum_cukup_data": {"default": "Belum cukup data untuk menampilkan angka ini.", "en": "Not enough data to show this figure yet."},
  "laporan.metrik.belum_ada_bukti": {"default": "Belum ada bukti yang memenuhi syarat untuk angka ini.", "en": "No qualifying evidence for this figure yet."},
  "mengajar.bukti.judul": {"default": "Apa yang sudah bisa disimpulkan", "en": "What can be concluded so far"},
  "mengajar.bukti.intro": {"default": "PINTAR hanya menyimpulkan bila bukti resminya cukup. Belum cukup bukan berarti buruk — artinya belum.", "en": "PINTAR only concludes when the official evidence is enough. Not yet enough does not mean bad — it means not yet."},
  "mengajar.bukti.kaki": {"default": "Yang tidak tampil di sini: penilaian per soal dan sinyal integritas. Keduanya ditinjau Kepala Departemen, bukan pengajar.", "en": "Not shown here: item-level review and integrity signals. Both are reviewed by the Head of Department, not the educator."},
  "mengajar.bukti.keadaan": {"default": "Keadaan hari ini", "en": "Where things stand today"},
  "mengajar.bukti.kumpul": {"default": "Mengumpulkan", "en": "Submitted"},
  "mengajar.bukti.simpulan": {"default": "Kesimpulan", "en": "Conclusions"},
  "mengajar.bukti.poin": {"default": "poin", "en": "points"},
  "mengajar.bukti.kali": {"default": "kali", "en": "times"},
  "mengajar.langkah.judul": {"default": "Yang bisa Anda lakukan sekarang", "en": "What you can do now"},
  "mengajar.langkah.f4": {"default": "Siapkan materi berikutnya untuk kelas ini", "en": "Prepare the next material for this class"},
  "mengajar.langkah.f5": {"default": "Uji Cepat untuk mengecek pemahaman hari ini", "en": "Quick Assessment to check today's understanding"},
  "mengajar.langkah.f6w": {"default": "Anda bisa menyusun dan mengunggah. Persetujuan dan penerbitan dilakukan Kepala Departemen dan sekolah.", "en": "You can draft and upload. Approval and publishing are done by the Head of Department and the school."},
  "bukti.dari": {"default": "Dari", "en": "From"},
  "bukti.murid": {"default": "murid", "en": "students"},
  "bukti.minimum": {"default": "minimum", "en": "minimum"},
  "tindakan.lanjut": {"default": "Tidak perlu diulang — lanjutkan ke materi berikutnya.", "en": "No need to reteach — move on to the next topic."},
  "tindakan.ulangi": {"default": "Ulangi topik ini bersama-sama sebelum lanjut.", "en": "Go over this topic together before moving on."},
  "tindakan.fokus": {"default": "Fokuskan waktu tambahan pada murid di dua tingkat kesiapan terbawah.", "en": "Focus extra time on students in the two lowest readiness tiers."},
  "cycle.step.pretest": {"default": "Pemetaan Awal", "en": "Initial Mapping"},
  "cycle.step.map": {"default": "Peta Bacaan Personal", "en": "Personal Reading Map"},
  "cycle.step.lesson": {"default": "Pelajaran", "en": "Lesson"},
  "cycle.step.posttest": {"default": "Uji Penguasaan", "en": "Mastery Check"},
  "cycle.step.result": {"default": "Hasil", "en": "Result"},
  "role.EDUCATOR": {"default": "Guru", "en": "Teacher"},
  "role.HEAD_OF_DEPARTMENT": {"default": "Kepala departemen", "en": "Head of department"},
  "role.DEAN": {"default": "Dekan", "en": "Dean"},
  "role.INSTITUTION_ADMIN": {"default": "Admin sekolah", "en": "School administrator"},
  "studio.nav.kuis": {"default": "Uji Cepat", "en": "Quick Assessment"},
  "studio.kanonik.judul": {"default": "Pustaka PINTAR", "en": "PINTAR Library"},
  "app.name": {"default": "PINTAR", "en": "PINTAR"},
};

/** MC-1 metric definitions (supabase/migrations/20260918100000_metric_catalogue.sql). */
export const METRICS = {
  "class.participants": {"label": "metrik.peserta.label", "meaning": "metrik.peserta.arti", "scope": "CLASS", "minimum": 1, "visualizations": ["hero_stat"], "audiences": ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "class.comprehension": {"label": "metrik.pemahaman.label", "meaning": "metrik.pemahaman.arti", "scope": "CLASS", "minimum": 5, "visualizations": ["hero_stat", "bar"], "audiences": ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "class.net_gain": {"label": "metrik.kenaikan.label", "meaning": "metrik.kenaikan.arti", "scope": "CLASS", "minimum": 5, "visualizations": ["hero_stat", "bar"], "audiences": ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "class.readiness_distribution": {"label": "metrik.kesiapan.label", "meaning": "metrik.kesiapan.arti", "scope": "CLASS", "minimum": 5, "visualizations": ["distribution"], "audiences": ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "class.topic_mastery": {"label": "metrik.topik.label", "meaning": "metrik.topik.arti", "scope": "LESSON", "minimum": 5, "visualizations": ["bar", "list"], "audiences": ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "class.misconceptions": {"label": "metrik.miskonsepsi.label", "meaning": "metrik.miskonsepsi.arti", "scope": "CLASS", "minimum": 3, "visualizations": ["card_list"], "audiences": ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "institution.participants": {"label": "metrik.peserta_institusi.label", "meaning": "metrik.peserta_institusi.arti", "scope": "INSTITUTION", "minimum": 1, "visualizations": ["hero_stat"], "audiences": ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "institution.net_gain": {"label": "metrik.kenaikan_institusi.label", "meaning": "metrik.kenaikan_institusi.arti", "scope": "INSTITUTION", "minimum": 10, "visualizations": ["hero_stat", "bar"], "audiences": ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "institution.safety_gate_pass_rate": {"label": "metrik.gerbang_keselamatan.label", "meaning": "metrik.gerbang_keselamatan.arti", "scope": "INSTITUTION", "minimum": 10, "visualizations": ["hero_stat"], "audiences": ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "institution.cohort_comparison": {"label": "metrik.perbandingan_kohort.label", "meaning": "metrik.perbandingan_kohort.arti", "scope": "COHORT", "minimum": 5, "visualizations": ["table"], "audiences": ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "institution.competency_outcomes": {"label": "metrik.kompetensi.label", "meaning": "metrik.kompetensi.arti", "scope": "INSTITUTION", "minimum": 10, "visualizations": ["table", "list"], "audiences": ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "institution.verified_credentials": {"label": "metrik.kredensial.label", "meaning": "metrik.kredensial.arti", "scope": "INSTITUTION", "minimum": 1, "visualizations": ["hero_stat"], "audiences": ["HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"]},
  "item.correctness_rate": {"label": "metrik.item_benar.label", "meaning": "metrik.item_benar.arti", "scope": "ITEM", "minimum": 30, "visualizations": ["bar"], "audiences": ["HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN"]},
  "item.distractor_uptake": {"label": "metrik.pengecoh.label", "meaning": "metrik.pengecoh.arti", "scope": "ITEM", "minimum": 30, "visualizations": ["bar", "table"], "audiences": ["HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN"]},
  "item.position_effect": {"label": "metrik.posisi.label", "meaning": "metrik.posisi.arti", "scope": "ITEM", "minimum": 30, "visualizations": ["table"], "audiences": ["HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN"]},
  "learner.result": {"label": "metrik.hasil_murid.label", "meaning": "metrik.hasil_murid.arti", "scope": "LEARNER_IN_INSTITUTION", "minimum": 1, "visualizations": ["summary"], "audiences": ["STUDENT", "EDUCATOR", "HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN"]},
};

/** MC-1 readiness tiers. max is exclusive; the top tier ends at 1.0001 so 100% is included. */
export const TIERS = {
  "kesiapan.belum_post_test": {"ordinal": 1, "min": null, "max": null, "requiresSafetyGate": false, "appliesWithoutPostTest": true},
  "kesiapan.butuh_pendampingan": {"ordinal": 2, "min": 0, "max": 0.6, "requiresSafetyGate": false, "appliesWithoutPostTest": false},
  "kesiapan.perlu_review": {"ordinal": 3, "min": 0.6, "max": 0.8, "requiresSafetyGate": false, "appliesWithoutPostTest": false},
  "kesiapan.siap_sertifikasi": {"ordinal": 4, "min": 0.8, "max": 1.0001, "requiresSafetyGate": true, "appliesWithoutPostTest": false},
};

/** The figures each real surface asks the evaluator for:
 *  educatorClass = src/lib/pengajar.ts METRIK_KELAS (/mengajar/[kelas]/bukti),
 *  managementClass / managementInstitution = src/lib/pimpinan.ts METRIK_SIMPUL / METRIK_INSTITUSI (/pimpinan). */
export const SURFACES = {
  educatorClass: ["class.comprehension", "class.net_gain", "class.topic_mastery", "class.misconceptions", "class.readiness_distribution"],
  managementClass: ["class.participants", "class.comprehension", "class.net_gain", "class.readiness_distribution"],
  managementInstitution: ["institution.participants", "institution.net_gain", "institution.safety_gate_pass_rate", "institution.competency_outcomes"],
};

/** src/app/globals.css token set v2: the primary is APPROVED (2026-09-16) and NOT FROZEN. */
export const TOKENS = {
  "--pintar-primary": "#245F55",
  "--pintar-primary-ink": "#FFFFFF",
  "--pintar-primary-soft": "#E3EFEC",
  "--pintar-primary-hover": "#1E5148",
};

/** sha256 of the product's supplied logo and self-hosted typeface. */
export const ASSETS = {
  "public/brand/pintar-selalu-logo.png": "0e85e80fb232b299016f3d363102823686a7489e86cb957cfbe0e48128a86463",
  "public/fonts/plus-jakarta-sans-latin.woff2": "153fc85b70298beeb1d61a5f723331649e7f23bb77302a66e61cb3e2fbdb5e79",
  "public/fonts/plus-jakarta-sans-latin-ext.woff2": "38e3b8fd8045048eb311d90170a4429ed2c8f405852dc3d91b5af8452758703f",
  "public/fonts/OFL-PlusJakartaSans.txt": "995c7199cab65954f545996326755daee7b63cc6b42b06c13da1f9502ab08a99",
};

/** Every migration that writes the metric catalogue, and every one that defines
 *  role capabilities, by sha256. A new or edited one means the policy the site
 *  describes may have moved. */
export const CATALOGUE_WRITERS = {
  "20260918100000_metric_catalogue.sql": "200db05698e033f45fec0559dea6c66923d514bc5a1b4b038ecde253da2ea58a",
  "20260918120000_reports_and_templates.sql": "e74b8a59712c24e0021b42f966824b78a92979ceb676bc10715da0121a6a6bca",
  "20260923110000_a_calculator_declares_what_it_computes_over.sql": "50fc966f9596c172104f5b71602d2aca3bcb86401320c2c4ab459b0f327d9e3c",
  "20261002110000_a_template_may_not_name_a_retired_metric.sql": "033b8c80f4d1bea0743260eaec29f7901aabc80bd6a56443dbb4edbde5546673",
};
export const CAPABILITY_DEFINERS = {
  "20260912004158_foundation_base.sql": "84a61c411bd229c9ea6d19140d46afd51e77454db86856cb8b3cd29cf9d9b094",
  "20260912004431_authorization.sql": "b90439adcca9dae1c274ac579426b941669b322b1251f5230289e68b291c260a",
  "20260912004654_function_privileges.sql": "a8efdb9fdd57e63c0c8f57220ae6f6e4b19f5f120a4d00806540deac153c2d1d",
  "20260923130000_management_may_open_a_learner_on_purpose.sql": "9c8d5453a7b99aee3635e0500639b5abe4f90bedccad4774b1659001f10d1f50",
  "20260924100000_an_administrator_is_not_an_examiner.sql": "29440c17919b126412e88f16cd6e112f3ba53af10d647620e4464fa7b69ff7fa",
  "20260926100000_a_school_gives_a_person_a_number.sql": "8d98add2574d9de45ad779af98aeef433bf0e158e14390eb634dd0ed17ace8e3",
};

// ---------------------------------------------------- where the site holds them
// Not product values: the website's own names for the product values above.

/** shared/style.css brand token -> the product token it must equal. */
export const SITE_TOKENS = {
  "--brand-primary": "--pintar-primary",
  "--brand-primary-ink": "--pintar-primary-ink",
  "--brand-primary-soft": "--pintar-primary-soft",
  "--brand-primary-hover": "--pintar-primary-hover",
};

/** The site's copy of each asset -> the product file it must equal, byte for byte. */
export const SITE_ASSETS = {
  "shared/brand/pintar-selalu-logo.png": "public/brand/pintar-selalu-logo.png",
  "shared/fonts/plus-jakarta-sans-latin.woff2": "public/fonts/plus-jakarta-sans-latin.woff2",
  "shared/fonts/plus-jakarta-sans-latin-ext.woff2": "public/fonts/plus-jakarta-sans-latin-ext.woff2",
  "shared/fonts/OFL-PlusJakartaSans.txt": "public/fonts/OFL-PlusJakartaSans.txt",
};
