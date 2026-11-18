// Writes KATALOG-COVERAGE.md: every catalogue entry with its version, status and the source that supports it.
// Internal verification only; not part of the reader-facing PDF.
import { writeFileSync } from "node:fs";
import { VERSI, KANDIDAT, STATUS } from "./fitur.mjs";
import { RENCANA } from "./rencana.mjs";
// Source per entry. HB = Handbook Draft 01a section (verified against code on main); COV = handbook coverage
// map row; RM = Consolidated Roadmap Rev 3 (doc control 3.3, 4.1 master-plan branch); ST = 4.1 status report
// 18 Nov 2026; OR = OWNER-RULINGS-4.1; DTT = DECISIONS-TO-TRACK.
const SRC = {
  "40-buka-sekolah": "HB 6.2 · COV 1", "40-persiapan": "HB 7.2 · COV 2", "40-struktur": "HB 7.3 · COV 2", "40-ketuntasan": "HB 7.4 · COV 2",
  "40-pendataan": "HB 7.5 · COV 3/4", "40-aktivasi": "HB 5.2 · COV 3", "40-kartu-kelas": "HB 7.6–7.7, 11.2 · COV 4", "40-akun-saya": "HB 5.7 · COV 3",
  "40-masuk-aman": "HB 5.4, 11.3 · COV 4", "40-pemulihan": "HB 5.6, 7.7 · COV 5", "40-peran": "HB 4.2, 7.8 · COV 3", "40-penangguhan": "HB 6.4–6.5 · COV 5",
  "40-tinggalkan": "HB 5.7, 11.13 · COV 5", "40-pindah-kelas": "HB 7.9 · COV 6", "40-pindah-sekolah": "HB 7.10 · COV 6", "40-keluar-kembali": "HB 7.11 · COV 6",
  "40-akhir-tugas": "HB 7.11 · COV 6", "40-kenaikan": "HB 7.14 · COV 2", "40-paket": "HB 10.3 · COV 7", "40-tinjauan": "HB 10.4–10.5 · COV 7",
  "40-bank-soal": "HB 10.5 · COV 7", "40-aturan": "HB 10.6 · COV 7", "40-revisi": "HB 10.7 · COV 7", "40-pustaka": "HB 6.3 · COV 7",
  "40-kesehatan-soal": "HB 10.11 · COV 7", "40-sediakan": "HB 9.2–9.3 · COV 8", "40-belajar": "HB 11.4 · COV 8", "40-pemetaan": "HB 11.5 · COV 8",
  "40-peta-bacaan": "HB 11.6 · COV 8", "40-bantuan": "HB 11.6 · COV 8", "40-uji-penguasaan": "HB 11.7 · COV 9 (attempts per Bob's review 17 Nov)", "40-uji-cepat": "HB 9.5 · COV 8",
  "40-baca-lagi": "Tugas 12 sample (hle mengajar.ulang.*) · COV 8", "40-hasil": "HB 11.8 · COV 9", "40-lihat-bukti": "HB 9.6; Tugas 12 sample · COV 15", "40-per-soal": "HB 9.6; Tugas 12 sample · COV 15",
  "40-ringkasan": "HB 8.4 · COV 15", "40-pimpinan": "HB 8.3 · COV 15", "40-integritas": "HB 8.6 · COV 15", "40-sertifikat": "HB 7.15, 13 · COV 14",
  "40-cetak": "HB 8.4; website Features · COV 15", "40-pengembangan": "HB 12.1–12.5 · COV 16", "40-darurat": "THE PLAN §5.3 C (4.0: maintenance_windows platform or schools, T−15, drain, 60/30/15; stop_pintar_now platform or school) and D6 (4.0 deadlines keep running) · COV 11/12", "40-audit": "HB 6.9, 7.17 · COV 15",
  "40-email": "HB 6.8, 7.17 · COV 1", "40-bahasa": "HB 5.1", "40-tur": "HB 5.11 · COV 39", "40-lapor": "code: «Laporkan masalah» (D-037) · COV 16",
  "41-admin": "HB 6.6 · ST §3 B0", "41-atur-sesi": "HB 9.8 · ST §3 A1", "41-kesempatan": "HB 7.13, 9.8 · ST §3 A1", "41-ditinggalkan": "HB 9.9, 11.10 · ST §3 A1",
  "41-ditangguhkan": "HB 6.5 · ST §3 A1", "41-meja-kerja": "HB 10.2, 10.7 · ST §3 C1w", "41-kunci": "HB 10.8 · ST §3 C1w", "41-catatan-masuk": "HB 7.16 · ST §3 B1 · THE PLAN D-4 (print requests; no school export or export event in 4.1)",
  "41-referensi-cetak": "HB 18.2 · ST §3 B2", "41-darurat": "THE PLAN D6 + owner ruling D-1 (11 Nov): held with exact remaining time · ST §3 A2a", "41-pemeliharaan": "HB 5.8, 7.12 · ST §3 A2b", "41-penolakan-seragam": "HB 5.3 · RM 4.1 corrections (S-1)",
  "41-catatan-peninjau": "HB 10.9 · ST §3 C2w · OWNER-RETURN-18NOV 07:58 (before-read done; merge refused by a repository rule, not yet on staging)", "41-tarik-peredaran": "Bob's review 17 Nov §2.3 · ST §3 C2w", "41-satu-penulis": "HB 9.11 · ST §4 A3", "41-pemulihan-sesi": "HB 9.11, 11.11 · ST §4 A3",
  "41-kesempatan-versi": "OR ruling 46 · ST §4 A3", "41-ai-sendiri": "OR ruling 41; X1 guide · COV 18b (standard Studio import)", "41-ai-terpadu": "OR rulings 38–44 (optional paid per-school add-on; PINTAR-qualified options) · ST §5 C3w (design approved)",
  "42-mode-ujian": "RM 4.2 A.1", "42-jabatan": "RM 4.2 B.2 (O41-8)", "42-dua-sekolah": "RM 4.2 B.2 (O41-12, principle approved)", "42-satu-orang": "RM 4.2 B.9 (Rev 3.1)",
  "42-koreksi-struktur": "RM 4.2 B.6", "42-tanpa-guru": "RM 4.2 B.10 (Rev 3.1)", "42-serah-terima": "RM 4.2 B.11 [execution plan]", "42-koreksi-pengembangan": "RM 4.2 B.6",
  "42-tolak-permintaan": "RM 4.2 C.5", "42-ganti-password": "RM 4.2 C.5", "42-ekspor": "RM 4.2 C.3 · THE PLAN D-4 (export and its event arrive together)", "42-periode-lalu": "RM 4.2 C.4", "42-kesehatan-terjadwal": "RM 4.2 item 7 [execution plan]",
  "45-kecerdasan-soal": "RM 4.5 item 1", "45-perbaikan-statistik": "RM 4.5 'Early 4.5 verification' (RD-4; suspected findings, Bob 18 Nov)", "45-pemahaman-keliru": "Reconciliation §1 via RM; planning audit rev 6 row 4.5-09 (R-3); added on Bob's verification 18 Nov", "45-kompetensi": "RM 4.5 item 1", "45-empat-pernyataan": "RM 4.5 item 2",
  "45-sebaran": "RM 4.5 item 3", "45-quiet": "RM 4.5 item 3", "45-sejarah": "RM 4.5 item 6", "45-evaluasi": "RM 4.5 item 4 + lifecycle (R-1 open)", "45-perlindungan": "RM 4.5 item 5",
  "45-whatsapp": "RM 4.5 carried (O41-2)", "45-akses-tidak-biasa": "RM 4.5 carried (D-088)",
  "50-pertumbuhan": "RM 5.0 item 1", "50-kesepakatan": "RM 5.0 item 1", "50-intervensi": "RM 5.0 item 2 (R-4 open)", "50-tiga-klaim": "RM 5.0 item 3", "50-jalur": "RM 5.0 item 4", "50-institusi": "RM 5.0 item 5",
  "k-batas-waktu": "RM 4.2 A (candidate)", "k-ai-sendiri": "DTT (X-2/X-3/X-4)", "k-masa-simpan": "RM 4.2 C.8 (unassigned, Rev 3.1)", "k-tutup-sekolah": "RM 4.2 'Later than 4.2'",
  "k-yayasan": "RM 4.2 'Later than 4.2'", "k-tanggal-tahun": "RM 4.2 'Later than 4.2'", "k-batal-cabut": "RM 4.2 'Later than 4.2'", "k-pulihkan-rilis": "RM 4.2 'Later than 4.2'",
  "k-sesuaikan-pustaka": "RM 4.2 'Later than 4.2'", "k-pengarahan": "RM 4.2 'Later than 4.2' (briefings); hidden in 4.0 per code comment", "k-hapus-keluarga": "RM 4.2 'Later than 4.2'",
  "k-share-learn": "RM 4.5 'Items raised for source reconciliation'", "k-portal-ortu": "RM disposition table; COV 38", "k-kegunaan-qi": "RM 4.5 'Items raised for source reconciliation'",
};
const rows = [];
for (const v of VERSI) for (const k of v.kelompok) for (const f of k.fitur) rows.push(`| \`${f.id}\` | ${f.nama} | ${v.v} | ${STATUS[f.status]}${RENCANA[f.id] ? ` · ${RENCANA[f.id].keadaan} (${RENCANA[f.id].kode})` : ""} | ${SRC[f.id] ?? "**MISSING**"} |`);
const krows = KANDIDAT.map((k) => `| \`${k.id}\` | ${k.nama} | — | ${k.status} | ${SRC[k.id] ?? "**MISSING**"} |`);
const missing = [...rows, ...krows].filter((r) => r.includes("**MISSING**")).length;
writeFileSync(new URL("./KATALOG-COVERAGE.md", import.meta.url), `# Katalog Lengkap Fitur PINTAR 4.0–5.0 · coverage checklist

**Internal verification only. Not part of the reader-facing PDF.** Generated by \`coverage.mjs\` from \`fitur.mjs\`.
Status is as of 18 November 2026. Planning states (4.2, 4.5, 5.0) come from \`rencana.mjs\`, which is taken from Bob's planning audit (\`docs/roadmap/PLANNING-AUDIT-4.2-4.5-5.0.md\`, revision 6, \`71a6f87e\`).

## Sources and precedence

- **RM**: *PINTAR Consolidated Roadmap 4.0–5.0*, Revision 3 (doc control 3.3, including Rev 3.1's correction of the 4.2 inventory), \`docs/roadmap/\` on the 4.1 master-plan branch. It consolidates the roadmap, the reconciliation of 11 Nov and the owner record.
- **OR**: \`OWNER-RULINGS-4.1.md\` (rulings 38–46 on AI drafting and attempts).
- **ST**: 4.1 progress report, 18 Nov 2026 (\`docs/completion-4.1/STATUS-2026-11-18.md\`). It is the status evidence for 4.1.
- **HB**: Handbook Draft 01a section. Its descriptions were traced to screens and code on \`main\` and corrected after Bob's review of 17 Nov.
- **COV**: the handbook coverage map's feature row, \`docs/handbook/PINTAR-HANDBOOK-FEATURE-COVERAGE.md\`.
- **DTT**: \`docs/roadmap/DECISIONS-TO-TRACK.md\`.

**Not read directly:** \`PINTAR-ROADMAP.md\`, \`ROADMAP-RECONCILIATION-2026-11-11.md\` and the roadmap folder's \`OWNER-DECISIONS-2026-11-11.md\`. They exist on branch \`claude/roadmap-45-50\` (\`2f419b52\`), not on \`main\` (planning audit finding G-1). RM consolidates them and is used in their place; Bob confirmed this is acceptable (18 Nov).

## Entries (${rows.length} features, ${krows.length} candidates; ${missing} without a source)

| id | Feature | Version | Status | Source |
|---|---|---|---|---|
${rows.join("\n")}

## Candidates and unassigned items (kept outside every version)

| id | Item | Version | Status | Source |
|---|---|---|---|---|
${krows.join("\n")}

## Deliberately not listed as features

- **AI provider evaluation (E).** It is an evaluation, not a feature. It appears only in the technical reference, as deciding whether integrated AI can be offered.
- **Z integrated acceptance and the educator walkthrough.** These are milestones, not features. They are mentioned in the 4.1 chapter introduction.
- **«Umpan balik kelas» (class feedback rounds) and the «Ruang Peragaan» demonstration room.** Both exist in code but appear in no roadmap. The handbook also omits them until the owner decides (COV §5 item 17). Bob confirmed (18 Nov): keep them out until the owner decides.
- **Post-4.1 codebase rationalisation.** Internal work, not user-facing.
- **Beyond-5.0 research horizon and Contextual Intelligence.** Research only, with no version commitment.
- **The scoring-policy prerequisite (audit row 4.5-10).** An internal guarantee that a recomputation uses the sitting's own scoring policy; not a reader-facing feature.
- **Context Passport.** Its internal continuity capability is carried by «Sejarah yang dapat dijelaskan» (RM 4.5 item 6).

## Bob's verification (18 Nov 2026), applied in revision 3

1. **Statuses.** 4.0 and B0–A2b confirmed. C2w stays «Sedang dikembangkan» until Bob confirms its merge and staging promotion. A3 and C3w confirmed; C3w is described as an optional, separately paid add-on offered from PINTAR-qualified options (rulings 38 and 40).
2. **Labels.** 4.2 reads «Ditunda ke 4.2; rencana rinci belum disusun» (owner deferrals; no approved plan). 4.5 and 5.0 read «Arah disetujui; belum direncanakan» (the 11 Nov owner record: implementation needs separate planning and authorisation).
3. **«Catatan peninjau».** Free-text, attributed, dated and immutable notes beside a sealed question; never shown to learners, printed or used in calculations; not coded misconception notes (R-3 pending).
4. **«Laporkan masalah».** Listed in 4.0 (RM Appendix A, "Staff can report an issue and see status").
5. **\`40-tinggalkan\`.** Reworded: a learner is told the request goes through the school with the family; deletion itself is a later item (\`k-hapus-keluarga\`).
6. **Misconception mapping.** Added to 4.5 (\`45-pemahaman-keliru\`), depending on R-3.
7. **Working names.** Marked pending the owner; «Quiet Intelligence» carries a note that the owner chooses the Indonesian name.
8. **4.1 scope additions.** \`41-darurat\` says 4.1 added the class-level stop; \`41-pemeliharaan\` says 4.1 added class- and school-level scheduled maintenance.
9. **Planning states.** From audit revision 6; open choices are paraphrased from its recommended answers and none is written as decided.
`);
console.log(`coverage: ${rows.length} features, ${krows.length} candidates, ${missing} missing`);
