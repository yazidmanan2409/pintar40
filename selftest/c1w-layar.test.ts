/**
 * C1w · THE ITEM WORKBENCH, the screens (docs/completion-4.1/batches/C1W-COMPLETION.md; Daisy, TINJAUAN-A1-C1W Q5, Q6,
 * §C1·N1, §C1·N2, the missing states, C1-B1, C1-B2, C1-R1..R5). The database half is selftest/c1w.test.ts.
 *
 *   C1W-K02  reads the source and runs the pure helpers: Daisy's sentences are in the copy table word for word, each
 *            with its English; the editor's payload (options empty at the end are not sent, one between is); the
 *            problems said with her three sentences and placed beside their fields; what changed in words; step 2's
 *            two sentences or the empty state; «Sedang ditinjau» is a neutral third state on the public page and never
 *            the mark of «Berlaku»; a teacher is never told «Ditarik» of a publisher's withdrawal; the learner's
 *            corrected result and the teacher's note (rendered) say what holds and never speak for the certificate.
 *   C1W-A01  the running app, as the package's author: «Ubah soal ini» turns one article into its form in place, the
 *            fields in Daisy's order; a save with problems lists them at the top and beside each field and writes
 *            nothing; a save is attributed («Diubah oleh …»); a stale save names who saved since; «Tambah soal» and
 *            «Hapus soal»; a submitted draft offers no «Ubah» and says why; «Buang draf ini» lands on Studio with its
 *            line and the draft is gone from the list; a published package's «Riwayat soal (n versi)».
 *   C1W-A02  the running app, a certificate under review (O41-19): the public check says «Sedang ditinjau» with Daisy's
 *            sentence, neutral, no reason and no ✓; the learner's list and card say so and still offer printing;
 *            Konfigurasi › Sertifikat «Sedang ditinjau (1)» decides it («Konfirmasi berlaku» with a reason), after
 *            which the public check is «Berlaku» again and the row keeps «Dikonfirmasi setelah dihitung ulang».
 *   C1W-J01  the journey «a wrong key, found and corrected», with no engineer: the author writes a question's key in
 *            the app, the head of department approves, the package is published, the class sits; the content owner
 *            finds the key wrong and walks the three steps with the exact counts, sees her own waiting state with no
 *            button; the second person confirms through the dialog; the results are recalculated; the teacher's report
 *            shows the result in force with its note, and the learner's result page shows it as current, corrected.
 */
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { ipUji, lit, psql } from "./bob26.test";
import { Komputer } from "./bob29.test";
import { pilihKonteksPeramban, tersusun } from "./konteks-uji";
import { bersihkan as bersihkanGaris } from "./c1w.test";
import { t, type HleEvent } from "../src/lib/hle";
import { bacaMasalah, bidangMasalah, kalimatDampak, kalimatMasalah, kataPerubahan, kemasMasalah, soalDariIsian } from "../src/lib/soal-layar";

export const GURU = { identitas: "siklus-guru@synthetic.pintar.test", password: "Sintetis-SiklusGuru-11!" };
export const KADEP = { identitas: "siklus-kaprodi@synthetic.pintar.test", password: "Sintetis-SiklusKaprodi-22!" };
export const ADMIN = { identitas: "siklus-admin@synthetic.pintar.test", password: "Sintetis-SiklusAdmin-33!" };
export const BOOT_ADMIN = { identitas: "boot-admin@bootstrap.pintar.test", password: "Bootstrap-Admin-9163!" };
export const BOOT_GURU = { identitas: "boot-guru@bootstrap.pintar.test", password: "Bootstrap-Guru-7741!" };
export const BOOT_KADEP = { identitas: "boot-kaprodi@bootstrap.pintar.test", password: "Bootstrap-Kaprodi-5528!" };
type Akun = { identitas: string; password: string };
/** The school a fixture stands in, and the people whose steps a package's lifecycle takes there. */
type Sekolah = { fixture: "cycle_fixture" | "boot_fixture"; guru: Akun; kadep: Akun; admin: Akun };
export const SIKLUS: Sekolah = { fixture: "cycle_fixture", guru: GURU, kadep: KADEP, admin: ADMIN };
// the official bootstrap school: only an OFFICIAL sitting reaches a teacher's report (scoped_official_results)
export const BOOT: Sekolah = { fixture: "boot_fixture", guru: BOOT_GURU, kadep: BOOT_KADEP, admin: BOOT_ADMIN };
export const BOOT_SISWA = { identitas: "boot-siswa@bootstrap.pintar.test", password: "Bootstrap-Siswa-3082!" };
export const ALASAN = "Kunci soal ini tertukar saat diketik.";
export const muridUji = (tag: string) => ({ identitas: `c1w-murid-${tag}@synthetic.pintar.test`, password: `Sintetis-C1wMurid-${tag}!` });

const id = (k: string, untuk: "educator" | "staff" | "learner" | "public" = "staff") => t(k as HleEvent, untuk, { locale: "id" });
const en = (k: string, untuk: "educator" | "staff" | "learner" | "public" = "staff") => t(k as HleEvent, untuk, { locale: "en" });
const baca = (root: string, f: string) => { try { return readFileSync(join(root, f), "utf8"); } catch { return ""; } };
const teks = (html: string) => tersusun(html).replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");
const ke = (r: Response) => (r.headers.get("location") ?? "").replace(/&amp;/g, "&");
/** A form of a rendered page, found by a mark it holds, as a browser sends it: its hidden fields, then `isi`. */
function formDengan(html: string, penanda: string, isi: Record<string, string>): Record<string, string> | string {
  const bentuk = tersusun(html).split(/<form\b/).slice(1).map((b) => b.split(/<\/form>/)[0]).filter((b) => b.includes(penanda));
  if (bentuk.length !== 1) return `${bentuk.length} form(s) hold ${penanda}`;
  const out: Record<string, string> = {};
  for (const m of bentuk[0].matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)) {
    const nama = /\bname="([^"]*)"/.exec(m[0])?.[1];
    const nilai = (/\bvalue="([^"]*)"/.exec(m[0])?.[1] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    if (nama) out[nama] = nilai;
  }
  return { ...out, ...isi };
}
export async function masuk(asal: string, siapa: { identitas: string; password: string }, ...konteks: string[]): Promise<Komputer | string> {
  let galat = "";
  for (const k0 of konteks) {
    const k = new Komputer(asal, ipUji());
    const m = await k.jsonDari("/masuk/password", { form: siapa });
    if (m.status !== 200) return `${siapa.identitas} could not sign in (${m.status})`;
    await k.halaman("/");
    await k.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
    try { await pilihKonteksPeramban(k, k0); return k; } catch (e) { galat += ` ${k0}: ${(e as Error).message.slice(0, 120)}`; }
  }
  return `${siapa.identitas} could not choose a context:${galat}`;
}
/** As one person, one committed transaction: the product's own functions, called as they would be. */
export const sebagai = (email: string, ...sql: string[]) => psql(["begin", `select selftest.as_user(${lit(email)})`, ...sql, "commit"].join("; "));
export const sebagaiUid = (uid: string, ...sql: string[]) => psql(["begin", `select selftest.as_user_uid(${lit(uid)})`, ...sql, "commit"].join("; "));
export function muat(repoRoot: string): void {
  for (const f of ["fable01.sql", "fable03.sql", "fable04.sql", "fable06.sql", "fable09.sql", "fable11.sql", "fable12.sql", "fable13.sql"]) {
    psql(`\\i ${join(repoRoot, "selftest", "db", f)}`);
  }
}
const pertama = (out: string, kunci: string) => new RegExp(`${kunci}=([^\\s|]*)`).exec(out)?.[1] ?? "";

// ------------------------------------------------------------------ the fixture
/**
 * In the seeded learning-cycle school: a package the cycle's teacher uploads (the upload's own functions, as her),
 * which stays a draft; a Kelas of the test's own under the fixture's Tingkat, taught by her; one learner who signs in.
 * Found by its names, so a run that died half-way is cleared by the next.
 */
export type Dunia = { inst: string; kelas: string; course: string; uid: string; pid: string; nama: string };
export function dunia(tag: string, judul: string, sk: Sekolah = SIKLUS): Dunia | string {
  bersihkan();
  const paket = `selftest.f13_paket(${lit(judul)}, 3, 2, false)`;
  const out = psql(`
    do $$ declare f record; v_i uuid; v_k5 uuid; v_par uuid; v_per uuid; v_k uuid; v_g uuid; v_u uuid; v_p uuid; v_e uuid; v_prog uuid; v_b uuid; v jsonb; begin
      perform set_config('app.seed_intent', 'synthetic', true);
      select * into f from selftest.${sk.fixture}();
      select la.node_id, la.institution_id, la.academic_period_id into v_k5, v_i, v_per from public.learning_assignments la where la.id = f.la;
      select n2.parent_id into v_par from public.org_nodes n2 where n2.id = v_k5;
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_par, 'CLASS', 'Kelas C1W ' || ${lit(tag)}, v_per) returning id into v_k;
      select a.person_id into v_g from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(sk.guru.identitas)};
      insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
      values (v_g, 'EDUCATOR', v_k, v_i, now() - interval '1 day', now() + interval '365 days');
      select e.programme_id into v_prog from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id where mm.node_id = v_k5 and mm.valid_to is null limit 1;
      v_u := gen_random_uuid();
      insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                              confirmation_token, recovery_token, email_change_token_new, email_change)
      values (v_u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', ${lit(muridUji(tag).identitas)}, extensions.crypt(${lit(muridUji(tag).password)}, extensions.gen_salt('bf', 4)), now(),
              '{"provider":"email","providers":["email"]}', jsonb_build_object('display_name', 'Murid C1W ' || ${lit(tag)}), now(), now(), '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_u, v_u::text, jsonb_build_object('sub', v_u::text, 'email', ${lit(muridUji(tag).identitas)}, 'email_verified', true), 'email', now(), now(), now());
      select a.person_id into v_p from public.accounts a where a.auth_user_id = v_u;
      update public.persons set display_name = 'Murid C1W ' || ${lit(tag)} where id = v_p;
      insert into public.person_usernames (person_id, username) values (v_p, 'uji.c1w.' || ${lit(tag)}) on conflict do nothing;
      insert into public.person_pins (person_id, pin_hash) values (v_p, extensions.crypt('2817', extensions.gen_salt('bf', 6))) on conflict do nothing;
      update public.account_setup set state = 'COMPLETE', completed_at = now(), password_set_at = now(), name_confirmed_at = now()
       where account_id = (select a.id from public.accounts a where a.auth_user_id = v_u);
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status) values (v_p, v_i, v_per, v_prog, 'ACTIVE') returning id into v_e;
      insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_k, v_per);
      perform set_config('app.seed_intent', '', true);
      -- the teacher's upload, by the upload's own functions, as her
      perform selftest.as_user(${lit(sk.guru.identitas)});
      v_b := selftest.f11_batch(v_i, 'STRUCTURED_PACKAGE', ${paket});
      perform public.prepare_ingest_batch(v_b);
      v := public.confirm_ingest_batch(v_b);
      perform selftest.as_owner();
      perform set_config('c1l.dunia', jsonb_build_object('inst', v_i, 'kelas', v_k, 'course', v -> 'courses' ->> 0, 'uid', v_u, 'pid', v_p,
        'nama', 'Murid C1W ' || ${lit(tag)})::text, false);
    end $$;
    select current_setting('c1l.dunia');`).split("\n").pop() ?? "";
  try {
    const d = JSON.parse(out) as Dunia;
    return d.kelas && d.course && d.uid ? d : `the fixture is incomplete: ${out.slice(0, 200)}`;
  } catch {
    return `the fixture was not made: ${out.slice(0, 300)}`;
  }
}
/** Everything the fixture made, removed again: each package's whole line (c1w.test.ts), then the class and its learner. */
export function bersihkan(): void {
  const garis = psql(`select coalesce(string_agg(c.id::text, ','), '') from public.courses c where c.title like 'C1W layar %' and c.supersedes_course_id is null`);
  for (const c of garis.split(",").filter(Boolean)) {
    psql(`begin; set local session_replication_role = replica;
      delete from public.item_draft_edits where course_id in (select x.course_id from public.course_lineage_chain(${lit(c)}) x);
      commit;`);
    psql(bersihkanGaris(c));
  }
  const kelas = `(select n.id from public.org_nodes n where n.name like 'Kelas C1W %')`;
  const orang = `(select p.id from public.persons p where p.display_name like 'Murid C1W %')`;
  psql(`begin; set local session_replication_role = replica;
    delete from public.lesson_progress where person_id in ${orang};
    delete from public.memberships where node_id in ${kelas};
    delete from public.enrollments where person_id in ${orang};
    delete from public.role_assignments where scope_node_id in ${kelas};
    delete from public.classes where node_id in ${kelas};
    delete from public.org_nodes where name like 'Kelas C1W %';
    commit;`);
}
/** The package's lifecycle, each step by the person whose step it is, through the product's own functions. */
export function terbitkan(course: string, sk: Sekolah = SIKLUS): string {
  const [GURU, KADEP, ADMIN] = [sk.guru, sk.kadep, sk.admin];
  sebagai(GURU.identitas, `select selftest.f12_advance(${lit(course)}, 'STRUCTURED')`, `select selftest.f12_advance(${lit(course)}, 'VALIDATED')`,
    `select selftest.f12_advance(${lit(course)}, 'IN_REVIEW')`);
  sebagai(KADEP.identitas, `select selftest.f12_advance(${lit(course)}, 'APPROVED')`);
  const rel = pertama(sebagai(ADMIN.identitas, `select 'REL=' || (public.create_release(${lit(course)}) ->> 'release')`), "REL");
  sebagai(KADEP.identitas, `select public.freeze_release(${lit(rel)})`,
    `select public.acknowledge_finding('MCQ_QUALITY', f.id, 'C1W') from public.mcq_quality_findings f where f.course_id = ${lit(course)} and f.acknowledged_at is null`,
    `select public.acknowledge_finding('COACHING', f.id, 'C1W') from public.coaching_findings f where f.course_id = ${lit(course)} and f.acknowledged_at is null`);
  sebagai(ADMIN.identitas, `select public.publish_release(${lit(rel)})`, `select selftest.pass_mark(${lit(psql(`select institution_id from public.courses where id = ${lit(course)}`))}, ${lit(course)})`);
  return rel;
}
/** A package the cycle's teacher uploads, by the upload's own functions, as her; it stays a draft. */
export function unggah(inst: string, judul: string): string {
  return pertama(sebagai(GURU.identitas, `do $u$ declare v_b uuid; v jsonb; begin
      v_b := selftest.f11_batch(${lit(inst)}, 'STRUCTURED_PACKAGE', selftest.f13_paket(${lit(judul)}, 1, 1, false));
      perform public.prepare_ingest_batch(v_b);
      v := public.confirm_ingest_batch(v_b);
      perform set_config('c1l.kursus', v -> 'courses' ->> 0, false);
    end $u$`, "select 'C=' || current_setting('c1l.kursus')"), "C");
}
export const soalDi = (course: string, awal: string) => psql(`select i.id from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
  where m.course_id = ${lit(course)} and i.stem like ${lit(awal + "%")} order by i.created_at, i.id limit 1`);
const paketDi = (course: string, q = "") => `/studio/paket/${course}${q}`;

export const c1wLayarTests: SelfTest[] = [
  {
    id: "C1W-K02",
    run: async (ctx) => {
      const c = new Checks();
      const hle = baca(ctx.repoRoot, "src/lib/hle.ts");
      // Daisy's sentences, word for word (her placeholders kept), each with its English
      const DAISY: Array<[string, string, "staff" | "educator" | "learner" | "public"]> = [
        ["studio.soal.ubah", "Ubah soal ini", "staff"], ["studio.soal.simpan", "Simpan soal", "staff"], ["studio.soal.batal", "Batal", "staff"],
        ["studio.soal.v.kunci", "Pilih tepat satu kunci jawaban.", "staff"], ["studio.soal.v.pilihan_kosong", "Pilihan {x} masih kosong.", "staff"],
        ["studio.soal.v.pertanyaan_kosong", "Pertanyaan masih kosong.", "staff"], ["studio.soal.diubah_oleh", "Diubah oleh {nama}, {waktu}", "staff"],
        ["studio.soal.tambah", "Tambah soal", "staff"],
        ["studio.soal.hapus.tanya", "Hapus soal ini dari draf? Catatan bahwa soal ini pernah ada tetap tersimpan.", "staff"],
        ["studio.soal.buang", "Buang draf ini", "staff"], ["studio.soal.buang.tanya", "Buang draf \"{judul}\"? {n} soal di dalamnya dihapus. Catatan audit tetap ada.", "staff"],
        ["studio.soal.dibuang", "Draf \"{judul}\" dibuang.", "staff"],
        ["studio.soal.sedang_ditinjau", "Draf ini sedang ditinjau. Soal dapat diubah lagi bila dikembalikan.", "staff"],
        ["studio.soal.basi", "Soal ini diubah oleh {nama} sejak Anda membukanya. Muat ulang untuk melihat perubahannya.", "staff"],
        ["studio.soal.unggah_menimpa", "Unggahan ini mengganti {n} soal yang diubah di aplikasi.", "staff"],
        ["studio.soal.riwayat", "Riwayat soal ({n} versi)", "staff"], ["studio.soal.riwayat.lihat", "Lihat versi ini", "staff"],
        ["studio.soal.riwayat.baru", "baru di versi paket ini", "staff"], ["studio.soal.riwayat.kunci", "Kunci: {dari} → {ke}", "staff"],
        ["studio.kunci.keliru", "Kunci jawaban keliru?", "staff"], ["studio.kunci.judul", "Perbaiki kunci jawaban", "staff"],
        ["studio.kunci.langkah", "Langkah {i} dari 3", "staff"], ["studio.kunci.sekarang", "kunci sekarang", "staff"],
        ["studio.kunci.l2", "Yang terdampak", "staff"], ["studio.kunci.l3", "Kirim untuk konfirmasi", "staff"],
        ["studio.kunci.dampak", "Soal ini ada di {n} sesi yang sudah selesai, di {k} sekolah.", "staff"],
        ["studio.kunci.dampak.bila", "Bila kunci diperbaiki: {a} hasil berubah · {b} keputusan target berubah · {c} sertifikat akan ditinjau sekolahnya · {d} sertifikat baru dapat diterbitkan.", "staff"],
        ["studio.kunci.dampak.kosong", "Tidak ada sesi selesai yang memakai soal ini. Perbaikan berlaku untuk pengerjaan berikutnya.", "staff"],
        ["studio.kunci.menunggu", "Menunggu konfirmasi orang kedua · diusulkan {waktu}", "staff"],
        ["studio.kunci.antrean", "Perbaikan kunci menunggu konfirmasi", "staff"], ["studio.kunci.konfirmasi", "Konfirmasi perbaikan", "staff"],
        ["studio.kunci.konfirmasi.tanya", "Hasil {n} sesi dihitung ulang. Hasil asli tetap tersimpan.", "staff"], ["studio.kunci.tolak", "Tolak", "staff"],
        ["studio.kunci.orang_kedua", "Anda yang mengusulkan perbaikan ini. Orang kedua yang mengonfirmasinya.", "staff"],
        ["studio.kunci.selesai", "Selesai. {n} hasil dihitung ulang pada {waktu}. Hasil asli dan jawaban murid tetap tersimpan.", "staff"],
        ["mengajar.materi.dihentikan_penerbit", "Dihentikan penerbit · tidak dapat dimulai lagi; hasil tetap dihitung", "educator"],
        ["mengajar.materi.ada_perbaikan", "Ada perbaikan · terbit {tanggal}", "educator"], ["mengajar.materi.pindahkan", "Pindahkan penugasan", "educator"],
        ["hasil.dikoreksi", "Hasil ini dihitung ulang karena penilaian satu soal diperbaiki. Hasil asli tetap tersimpan.", "learner"],
        ["verifikasi.status.DITINJAU", "Sedang ditinjau", "public"],
        ["verifikasi.status.DITINJAU.arti", "Sertifikat ini benar diterbitkan oleh {sekolah}. Penilaian satu soal di asesmennya diperbaiki, dan sekolah penerbit sedang meninjau sertifikat ini. Sampai selesai, sertifikat ini tidak dinyatakan berlaku. Hubungi sekolah penerbit untuk keterangan.", "public"],
        ["sertifikat.status.DITINJAU", "Sedang ditinjau", "learner"],
        ["sertifikat.ditinjau.arti", "Sekolah Anda sedang meninjau sertifikat ini karena penilaian satu soal diperbaiki. Sertifikat tetap tersimpan. Selama ditinjau, pemeriksaan sertifikat menyebutnya sedang ditinjau.", "learner"],
        ["config.tinjau_sertifikat.judul", "Sedang ditinjau ({n})", "staff"],
        ["config.tinjau_sertifikat.baris", "{nama} · {paket} · hasil dihitung ulang {asli} → {baru}, target {t} · sejak {tanggal}", "staff"],
        ["config.tinjau_sertifikat.konfirmasi", "Konfirmasi berlaku", "staff"], ["config.tinjau_sertifikat.cabut", "Cabut", "staff"],
        ["config.tinjau_sertifikat.dikonfirmasi", "Dikonfirmasi setelah dihitung ulang · {alasan}", "staff"],
        ["config.koreksi_kunci.pemberitahuan", "Penilaian satu soal di {paket} diperbaiki pada {tanggal}. {a} hasil di sekolah ini dihitung ulang; {c} sertifikat sedang ditinjau.", "staff"],
      ];
      for (const [k, kata, untuk] of DAISY) {
        c.expect(id(k, untuk) === kata, `«${k}» is not Daisy's wording: «${id(k, untuk)}»`);
        c.expect(!!en(k, untuk) && en(k, untuk) !== kata && en(k, untuk) !== "—", `«${k}» has no English`);
      }
      // C1-B2: the teacher and the learner never read «Ditarik» of a publisher's withdrawal
      c.expect(!/Ditarik|ditarik/.test(id("mengajar.materi.dihentikan_penerbit", "educator")) && !/Ditarik|ditarik/.test(id("mengajar.materi.ada_perbaikan", "educator")),
        "the publisher's withdrawal is called «Ditarik» to a teacher");
      // C1-B1: no learner or teacher line about a recalculated result speaks for the certificate
      for (const k of ["hasil.dihitung_ulang", "hasil.dikoreksi", "hasil.review.kunci_terkini", "map.kunci_terkini"]) {
        c.expect(!/sertifikat|certificate/i.test(id(k, "learner") + en(k, "learner")) && !/kunci jawaban|disegel/i.test(id(k, "learner")), `«${k}» speaks for the certificate, or uses a word the learner is never told`);
      }
      for (const k of ["mengajar.murid1.dihitung_ulang", "mengajar.murid1.dikoreksi"]) {
        c.expect(!/sertifikat|certificate/i.test(id(k, "educator") + en(k, "educator")), `«${k}» speaks for the certificate`);
      }
      // the editor's payload: options left empty at the end are not sent; one between filled ones is (the database names it)
      const isian: Record<string, string> = { pertanyaan: "Berapa 1 + 1?", bacaan: "", kunci: "b", pilihan_A: "1", alasan_A: "Belum.", pilihan_B: "2", alasan_B: "Tepat.",
        pilihan_C: "", alasan_C: "", pilihan_D: "4", alasan_D: "Belum.", tujuan: "" };
      const p = soalDariIsian((k) => isian[k] ?? "");
      c.expect(p.options.length === 4 && p.options.map((o) => `${o.label}${o.is_correct ? "*" : ""}`).join(",") === "A,B*,C,D" && !("objective_ids" in p),
        `the editor's payload: ${JSON.stringify(p.options.map((o) => o.label + (o.is_correct ? "*" : "")))}`);
      const sx = (k: HleEvent) => t(k, "staff", { locale: "id" });
      c.expect(kalimatMasalah({ code: "ITEM_CORRECT_MISSING", field: "options" }, sx) === "Pilih tepat satu kunci jawaban."
        && kalimatMasalah({ code: "OPTION_TEXT_MISSING", field: "body", label: "C" }, sx) === "Pilihan C masih kosong."
        && kalimatMasalah({ code: "ITEM_QUESTION_MISSING", field: "stem" }, sx) === "Pertanyaan masih kosong.",
        "a save's problems are not said with Daisy's three sentences");
      c.expect(bidangMasalah({ code: "ITEM_CORRECT_TOO_MANY" }) === "kunci" && bidangMasalah({ code: "OPTION_TEXT_MISSING", field: "body", label: "C" }) === "pilihan_C"
        && bidangMasalah({ code: "ITEM_QUESTION_MISSING", field: "stem" }) === "pertanyaan", "a problem is not placed beside its field");
      const kemas = kemasMasalah([{ code: "OPTION_TEXT_MISSING", field: "body", label: "C" }, { code: "ITEM_CORRECT_MISSING", field: "options" }]);
      c.expect(JSON.stringify(bacaMasalah(kemas)) === JSON.stringify([{ code: "OPTION_TEXT_MISSING", field: "body", label: "C" }, { code: "ITEM_CORRECT_MISSING", field: "options" }])
        && bacaMasalah("x<y:z:Q,<script>").length === 0, "the problems do not survive the address, or a forged one is read");
      c.expect(JSON.stringify(kataPerubahan({ key: { from: ["B"], to: ["C"] }, options: [{ label: "D", kind: "CHANGED" }], stem: true }, sx))
        === JSON.stringify(["Kunci: B → C", "Pertanyaan diubah", "Pilihan D diubah"]), `what changed, in words: ${JSON.stringify(kataPerubahan({ key: { from: ["B"], to: ["C"] }, options: [{ label: "D", kind: "CHANGED" }], stem: true }, sx))}`);
      const n0 = { sesi_selesai: 0, sekolah: 0, hasil_berubah: 0, putusan_target_berubah: 0, sertifikat_ditinjau: 0, sertifikat_baru_layak: 0 };
      c.expect(kalimatDampak(n0, sx, String).join(" ") === id("studio.kunci.dampak.kosong"), "nothing affected is not the «Tidak ada sesi selesai…» state");
      c.expect(kalimatDampak({ ...n0, sesi_selesai: 4, sekolah: 1, hasil_berubah: 3, putusan_target_berubah: 1, sertifikat_ditinjau: 0, sertifikat_baru_layak: 1 }, sx, String).join(" ")
        === "Soal ini ada di 4 sesi yang sudah selesai, di 1 sekolah. Bila kunci diperbaiki: 3 hasil berubah · 1 keputusan target berubah · 0 sertifikat akan ditinjau sekolahnya · 1 sertifikat baru dapat diterbitkan.",
        "step 2's counts are not Daisy's two sentences");
      // §C1·N1: DITINJAU a third state, neutral (never the ✓ of «Berlaku»), the school's name filled, no reason
      const verifikasi = baca(ctx.repoRoot, "src/app/verifikasi/[token]/page.tsx");
      c.expect(/DITINJAU: \{ word: "verifikasi\.status\.DITINJAU", meaning: "verifikasi\.status\.DITINJAU\.arti", tone: "pin-neutral" \}/.test(verifikasi)
        && /BERLAKU: \{ word: "verifikasi\.status\.BERLAKU", meaning: "verifikasi\.status\.BERLAKU\.arti", tone: "" \}/.test(verifikasi)
        && /\.replace\("\{sekolah\}", row\?\.institution \?\? "—"\)/.test(verifikasi), "the public page has no neutral «Sedang ditinjau»");
      // C1-B1: the learner's result shows the corrected one as current, marked, with the original traceable
      const hasil = baca(ctx.repoRoot, "src/app/belajar/[tugas]/hasil/page.tsx");
      c.expect(/outcome\.dikoreksi \? \(/.test(hasil) && /s\("hasil\.dikoreksi\.tanda"\)/.test(hasil) && /hasil\.dikoreksi\.asli/.test(hasil) && /data-hasil-asli/.test(hasil),
        "the learner's result page does not mark a corrected result and keep the original traceable");
      // C1-B2 and C1-R2 on the class page; «Pindahkan penugasan» is offered after a replacement (the old condition was false)
      const kelas = baca(ctx.repoRoot, "src/app/mengajar/[kelas]/page.tsx");
      c.expect(/keadaanTerbitanKelas\(kerja\)/.test(kelas) && /"mengajar\.materi\.dihentikan_penerbit"/.test(kelas) && /"mengajar\.materi\.ada_perbaikan"/.test(kelas) && /#koreksi/.test(kelas),
        "the class page does not say a stopped or replaced release");
      const paket = baca(ctx.repoRoot, "src/app/studio/paket/[course]/page.tsx");
      c.expect(!/published\.length > 1/.test(paket) && /some\(\(a\) => published\.some\(\(r\) => r\.id !== a\.plp_release_id\)\)/.test(paket), "«Pindahkan penugasan» still needs two published releases");
      // the teacher's note, rendered: a governed correction's reason without its prefix, and the result in force
      // (in a child process of its own, as D78-E01 renders it: the harness runs under the React server condition)
      const anak = spawnSync(process.execPath, ["--import", "tsx", "-e", `(async () => {
        const { createElement: h } = await import("react"); const { renderToStaticMarkup } = await import("react-dom/server");
        const m = await import("file://" + process.cwd() + "/src/components/CatatanHitungUlang.tsx"); const K = m.default?.default ?? m.default;
        process.stdout.write(renderToStaticMarkup(h(K, { baru: 1, asli: 0.5, alasan: process.env.ALASAN, locale: "id" })));
      })().catch((e) => { process.stderr.write(String(e && e.stack || e)); process.exit(1); });`],
      { cwd: ctx.repoRoot, encoding: "utf8", env: { ...process.env, ALASAN: `KOREKSI_KUNCI: ${ALASAN}` } });
      const html = anak.stdout;
      const tk = teks(html);
      c.expect(tk.includes("Hasil yang berlaku sekarang 100%") && tk.includes("hasil asli yang disegel (50%) tetap tersimpan") && tk.includes(`Penilaian satu soal diperbaiki: ${ALASAN}`)
        && !tk.includes("KOREKSI_KUNCI") && /data-dikoreksi=""/.test(html), `the teacher's note on a corrected result: «${tk}»`);
      // the workbook carries the identity column on the Soal sheet, optional (Sharon, blocker 4)
      const { KOLOM } = await import("../src/lib/unggah-kontrak");
      c.expect(KOLOM.Soal.some((k) => k.kunci === "identity" && !k.wajib), "the workbook's Soal sheet has no optional identity column");
      c.expect(/"studio\.koreksi\.galat\.correction_open_revision": \{ default: "[^"]*buang draf revisinya/.test(hle), "CORRECTION_OPEN_REVISION does not tell the owner to finish or discard the revision");
      return c.verdict("Daisy's C1w sentences are the copy table's, word for word, each with its English; the editor's payload, its problems in her sentences beside their fields, what "
        + "changed in words and step 2's sentences are the pure helpers'; «Sedang ditinjau» is the public page's neutral third state; the teacher never reads «Ditarik» of a "
        + "publisher's withdrawal and is offered «Pindahkan penugasan» after a replacement; the learner's corrected result is marked with its original; the teacher's note, "
        + "rendered, gives the result in force and the correction's reason; no recalculation line speaks for the certificate; the workbook carries the identity column");
    },
  },
  {
    id: "C1W-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      muat(ctx.repoRoot);
      const judul = `C1W layar ${tag}`;
      const d0 = dunia(tag, judul);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        const guru0 = await masuk(asal, GURU, `MENGELOLA:${d.inst}`, `MENGAJAR:${d.inst}`);
        if (!c.expect(typeof guru0 !== "string", String(guru0))) return c.verdict("");
        const guru = guru0 as Komputer;
        const item = soalDi(d.course, "Pertanyaan akhir nomor 1");
        const h0 = await (await guru.halaman(paketDi(d.course))).text();
        c.expect(new RegExp(`data-soal-ubah="${item}"`).test(h0) && teks(h0).includes("Ubah soal ini") && teks(h0).includes("Tambah soal") && teks(h0).includes("Buang draf ini"),
          "the draft's article offers no «Ubah soal ini», or the lesson no «Tambah soal», or the page no «Buang draf ini»");
        // the form in place, its heading the focus target, its fields in Daisy's order
        const h1 = await (await guru.halaman(paketDi(d.course, `?pelajaran=1&ubah=${item}`))).text();
        const f = tersusun(h1).split(`data-soal-form="${item}"`)[1] ?? "";
        const urut = ["bacaan", "pertanyaan", "pilihan_A", "pilihan_E", "kunci", "alasan_A", "miskonsepsi_A", "tujuan"].map((b) => f.indexOf(`name="${b}"`));
        c.expect(urut.every((x, i) => x > 0 && (i === 0 || x > urut[i - 1])) && new RegExp(`id="soal-form-judul-${item}" tabindex="-1"`, "i").test(f),
          `the form's fields are not in Daisy's order, or its heading cannot take focus: ${urut.join(",")}`);
        // a save with problems: listed at the top, each beside its field, nothing written
        const revisi0 = psql(`select revision from public.items where id = ${lit(item)}`);
        const fs1 = formDengan(h1, `id="soal-form-${item}"`, { pertanyaan: "", pilihan_A: "Satu", alasan_A: "Ini.", pilihan_B: "", alasan_B: "", pilihan_C: "Tiga", alasan_C: "Itu.", kunci: "" });
        if (!c.expect(typeof fs1 !== "string", `the editor's form: ${fs1}`)) return c.verdict("");
        const r1 = await guru.kirim(paketDi(d.course), { form: fs1 as Record<string, string> });
        const h2 = await (await guru.halaman(ke(r1).replace(asal, ""))).text();
        const t2 = teks(h2);
        c.expect(/c1h=gagal/.test(ke(r1)) && t2.includes("Pertanyaan masih kosong.") && t2.includes("Pilihan B masih kosong.") && t2.includes("Pilih tepat satu kunci jawaban.")
          && /data-soal-ringkasan-galat/.test(h2) && new RegExp(`id="f-${item}-pertanyaan-galat"`).test(h2) && /aria-invalid="true"/.test(h2)
          && psql(`select revision from public.items where id = ${lit(item)}`) === revisi0,
          `a save with problems: ${r1.status} ${ke(r1)} «${t2.slice(t2.indexOf("Soal belum tersimpan"), t2.indexOf("Soal belum tersimpan") + 200)}»`);
        // a save: the key moved to B, attributed
        const fs2 = formDengan(h1, `id="soal-form-${item}"`, { pertanyaan: "Pertanyaan akhir nomor 1 tentang pecahan?", bacaan: "",
          pilihan_A: "Pilihan tepat 1", alasan_A: "Ini tepat.", pilihan_B: "Pilihan lain 1", alasan_B: "Ini belum tepat.", kunci: "B", tujuan: "" });
        const r2 = await guru.kirim(paketDi(d.course), { form: fs2 as Record<string, string> });
        const h3 = await (await guru.halaman(ke(r2).replace(asal, ""))).text();
        c.expect(/c1h=ok/.test(ke(r2)) && psql(`select string_agg(label, '') from public.item_options where item_id = ${lit(item)} and is_correct`) === "B"
          && new RegExp(`data-soal-diubah="${item}"`).test(h3) && teks(h3).includes("Diubah oleh "), `the save: ${r2.status} ${ke(r2)}`);
        // the stale save: the form drawn before that save carries the old revision
        const r3 = await guru.kirim(paketDi(d.course), { form: { ...(fs2 as Record<string, string>), alasan_B: "Ini belum tepat, sungguh." } });
        const h4 = await (await guru.halaman(ke(r3).replace(asal, ""))).text();
        c.expect(/c1=DRAFT_EDIT_CONFLICT/.test(ke(r3)) && /data-soal-basi/.test(h4) && /Soal ini diubah oleh .+ sejak Anda membukanya\. Muat ulang untuk melihat perubahannya\./.test(teks(h4)),
          `the stale save: ${ke(r3)}`);
        // «Tambah soal», then «Hapus soal» on it
        const lesson = psql(`select lesson_id from public.items where id = ${lit(item)}`);
        const h5 = await (await guru.halaman(paketDi(d.course, `?pelajaran=1&tambah=${lesson}`))).text();
        const fs5 = formDengan(h5, `name="lesson" value="${lesson}"`, { pertanyaan: "Soal tambahan C1W?", pilihan_A: "Ya", alasan_A: "Tepat.", pilihan_B: "Tidak", alasan_B: "Belum.", kunci: "A", kegunaan: "" });
        if (!c.expect(typeof fs5 !== "string", `«Tambah soal»'s form: ${fs5}`)) return c.verdict("");
        const r5 = await guru.kirim(paketDi(d.course), { form: fs5 as Record<string, string> });
        const baru = soalDi(d.course, "Soal tambahan C1W");
        c.expect(/c1=DITAMBAH/.test(ke(r5)) && /^[0-9a-f-]{36}$/.test(baru), `«Tambah soal»: ${ke(r5)}`);
        const h6 = await (await guru.halaman(paketDi(d.course, `?pelajaran=1&ubah=${baru}`))).text();
        const fs6 = formDengan(h6, `data-soal-hapus="${baru}"`, {});
        if (!c.expect(typeof fs6 !== "string", `«Hapus soal»'s form: ${fs6}`)) return c.verdict("");
        const r6 = await guru.kirim(paketDi(d.course), { form: fs6 as Record<string, string> });
        c.expect(/c1=DIHAPUS/.test(ke(r6)) && psql(`select count(*) from public.items where id = ${lit(baru)}`) === "0"
          && Number(psql(`select count(*) from public.item_draft_edits where item_id = ${lit(baru)}`)) >= 2, `«Hapus soal»: ${ke(r6)}`);
        // submitted: no «Ubah», and the line
        sebagai(GURU.identitas, `select selftest.f12_advance(${lit(d.course)}, 'STRUCTURED')`, `select selftest.f12_advance(${lit(d.course)}, 'VALIDATED')`,
          `select selftest.f12_advance(${lit(d.course)}, 'IN_REVIEW')`);
        const h7 = await (await guru.halaman(paketDi(d.course))).text();
        c.expect(!/data-soal-ubah=/.test(h7) && teks(h7).includes(id("studio.soal.sedang_ditinjau")), "a submitted draft still offers «Ubah», or does not say why it does not");
        // published: «Riwayat soal (n versi)», collapsed, each version readable
        const kursus2 = d.course;
        sebagai(KADEP.identitas, `select selftest.f12_advance(${lit(kursus2)}, 'APPROVED')`);
        const rel = pertama(sebagai(ADMIN.identitas, `select 'REL=' || (public.create_release(${lit(kursus2)}) ->> 'release')`), "REL");
        sebagai(KADEP.identitas, `select public.freeze_release(${lit(rel)})`);
        const h8 = await (await guru.halaman(paketDi(kursus2))).text();
        c.expect(/<details class="pin-disclosure pin-riwayat-soal" data-riwayat-soal="1">/.test(tersusun(h8)) && teks(h8).includes("Riwayat soal (1 versi)") && teks(h8).includes("Lihat versi ini")
          && !/data-soal-ubah=/.test(h8), "a locked package's question has no «Riwayat soal (1 versi)», or is still editable");
        // «Buang draf ini»: a second upload, discarded; Studio says so and lists it no more
        const judul2 = `C1W layar buang ${tag}`;
        const kursus3 = unggah(d.inst, judul2);
        const h9 = await (await guru.halaman(paketDi(kursus3))).text();
        const fBuang = tersusun(h9).split(/<form\b/).slice(1).map((b) => b.split(/<\/form>/)[0])
          .find((b) => b.includes("data-bahaya-buka") && b.includes(`value="${kursus3}"`) && !b.includes('name="item"'));
        if (!c.expect(Boolean(fBuang), "the package page has no «Buang draf ini» form")) return c.verdict("");
        const hidden: Record<string, string> = {};
        for (const m of (fBuang ?? "").matchAll(/<input\b[^>]*\btype="hidden"[^>]*>/g)) {
          const n = /\bname="([^"]*)"/.exec(m[0])?.[1]; if (n) hidden[n] = /\bvalue="([^"]*)"/.exec(m[0])?.[1] ?? "";
        }
        const r9 = await guru.kirim(paketDi(kursus3), { form: hidden });
        const h10 = await (await guru.halaman(ke(r9).replace(asal, ""))).text();
        const t10 = teks(h10);
        c.expect(/^\/studio\?dibuang=/.test(ke(r9).replace(asal, "")) && t10.includes(`Draf "${judul2}" dibuang.`) && !h10.includes(`/studio/paket/${kursus3}`),
          `«Buang draf ini»: ${r9.status} ${ke(r9)} · ${h10.includes(`/studio/paket/${kursus3}`) ? "still listed" : "line missing"}`);
        c.expect(psql(`select count(*) from public.courses where id = ${lit(kursus3)} and discarded_at is null`) === "0", "the discarded draft is still a package");
        return c.verdict("as the package's author in the running app: «Ubah soal ini» turns one article into its form in place, fields in Daisy's order, its heading focusable; "
          + "a save with problems is refused with «Pertanyaan masih kosong.», «Pilihan B masih kosong.» and «Pilih tepat satu kunci jawaban.» at the top and beside the fields, "
          + "nothing written; a save moves the key and is attributed «Diubah oleh …»; a save from the form drawn before it names who saved since; «Tambah soal» adds and «Hapus "
          + "soal» removes (both on the record); a submitted draft offers no «Ubah» and says why; a locked package's question has «Riwayat soal (1 versi)» with «Lihat versi "
          + "ini»; «Buang draf ini» lands on Studio with «Draf \"…\" dibuang.»");
      } finally {
        bersihkan();
      }
    },
  },
  {
    id: "C1W-A02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      muat(ctx.repoRoot);
      // the fixture: a sealed bootstrap certificate (the product's own functions) and, written past the guards because a
      // review exists only after a confirmed correction (which C1W-S06 drives end to end), one open review of it
      const bersih = () => psql(`begin; set local session_replication_role = replica;
        delete from public.certificate_reviews where institution_id in (select id from public.institutions where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP');
        delete from public.key_corrections where institution_id in (select id from public.institutions where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP') and reason like 'C1W-A02%';
        commit; select selftest.purge_certificates();`);
      try {
        bersih();
        const pre = JSON.parse(psql(`select row_to_json(t) from (select x.certificate_id, x.canonical_payload, s.sesi from (select selftest.boot_attempt(true) as sesi) s,
            lateral public.certificate_prepare(s.sesi, 1::smallint) x) t`)) as { certificate_id: string; canonical_payload: Record<string, unknown>; sesi: string };
        // sealed with the app's own key, as the issuance route signs (the public check recomputes it)
        const { signWithKey } = await import("../src/lib/certificates/sign");
        const tanda = signWithKey(pre.canonical_payload as never, process.env.CERT_SECRET_KEY_V1 ?? "");
        const out = psql(`do $$ declare v_s uuid := ${lit(pre.sesi)}; v_c uuid := ${lit(pre.certificate_id)}; v_r uuid; v_k uuid; v_i uuid; v_item uuid; begin
            perform public.certificate_seal(v_c, 1::smallint, ${lit(tanda)});
            select institution_id into v_i from public.certificates where id = v_c;
            select id into v_r from public.assessment_results where session_id = v_s and supersedes_result_id is null;
            select p.item_id into v_item from public.presented_items p where p.session_id = v_s order by p.position limit 1;
            set local session_replication_role = replica;
            insert into public.key_corrections (institution_id, line_root_course_id, asked_item_id, item_id, course_id, release_id, question_digest, key_before, key_after,
                                                reason, proposed_by_person_id, status, decided_at, decided_by_person_id)
            select v_i, r.course_id, v_item, v_item, r.course_id, r.id, 'x', '{A}', '{B}', 'C1W-A02 kunci tertukar saat diketik',
                   (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-admin@bootstrap.pintar.test'),
                   'CONFIRMED', now(),
                   (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'boot-kaprodi@bootstrap.pintar.test')
              from public.assessment_sessions s join public.plp_releases r on r.id = s.plp_release_id where s.id = v_s returning id into v_k;
            insert into public.certificate_reviews (certificate_id, institution_id, session_id, opened_by_result_id, previous_result_id, key_correction_id)
            values (v_c, v_i, v_s, v_r, v_r, v_k);
            set local session_replication_role = origin;
            perform set_config('c1l.a02', jsonb_build_object('token', (select verification_token from public.certificates where id = v_c), 'cert', v_c)::text, false);
          end $$; select current_setting('c1l.a02');`).split("\n").pop() ?? "";
        const w = JSON.parse(out) as { token: string; cert: string };
        // the public check: neutral, Daisy's sentence with the school, no reason, no ✓ of «Berlaku»
        const v1 = await (await fetch(`${asal}/verifikasi/${encodeURIComponent(w.token)}`)).text();
        const sekolah = psql(`select i.name from public.institutions i join public.certificates c on c.institution_id = i.id where c.id = ${lit(w.cert)}`);
        const t1 = teks(v1);
        c.expect(/<section class="pin-status pin-neutral">/.test(tersusun(v1)) && t1.includes("Sedang ditinjau") && t1.includes(id("verifikasi.status.DITINJAU.arti", "public").replace("{sekolah}", sekolah))
          && !t1.includes("C1W-A02") && !t1.includes(id("verifikasi.status.BERLAKU", "public")), `the public check of a certificate under review: «${t1.slice(0, 400)}»`);
        // the learner: the list's pill and the card's sentence, printing still offered
        const siswa0 = await masuk(asal, BOOT_SISWA, "BELAJAR");
        if (!c.expect(typeof siswa0 !== "string", String(siswa0))) return c.verdict("");
        const siswa = siswa0 as Komputer;
        const l1 = await (await siswa.halaman("/belajar/sertifikat")).text();
        c.expect(/data-ditinjau=""/.test(l1) && teks(l1).includes("Sedang ditinjau"), "the learner's list does not say «Sedang ditinjau»");
        const tugas = /href="\/belajar\/([0-9a-f-]{36})\/sertifikat"/.exec(tersusun(l1))?.[1];
        if (tugas) {
          const k1 = await (await siswa.halaman(`/belajar/${tugas}/sertifikat`)).text();
          c.expect(/data-ditinjau=""/.test(k1) && teks(k1).includes(id("sertifikat.ditinjau.arti", "learner")) && teks(k1).includes(id("sertifikat.cetak", "learner")),
            "the learner's certificate does not say it is under review, or no longer offers printing");
        } else c.expect(false, "the learner's list does not link the certificate");
        // Konfigurasi › Sertifikat: «Sedang ditinjau (1)», confirmed with a reason
        const admin0 = await masuk(asal, BOOT_ADMIN, `MENGELOLA:${psql(`select institution_id from public.certificates where id = ${lit(w.cert)}`)}`);
        if (!c.expect(typeof admin0 !== "string", String(admin0))) return c.verdict("");
        const admin = admin0 as Komputer;
        const s1 = await (await admin.halaman("/konfigurasi/sertifikat")).text();
        c.expect(teks(s1).includes("Sedang ditinjau (1)") && /data-sertifikat-ditinjau="1"/.test(s1) && teks(s1).includes("Konfirmasi berlaku") && /data-bahaya-buka/.test(s1),
          "Konfigurasi › Sertifikat has no «Sedang ditinjau (1)» with its two decisions");
        const ft = formDengan(s1, 'name="tinjauan"', { alasan: "Hasilnya tetap di atas target.", keputusan: "CONFIRMED" });
        if (!c.expect(typeof ft !== "string", `the review's form: ${ft}`)) return c.verdict("");
        const r1 = await admin.kirim("/konfigurasi/sertifikat", { form: ft as Record<string, string> });
        const s2 = await (await admin.halaman(ke(r1).replace(asal, ""))).text();
        c.expect(/tinjau=dikonfirmasi/.test(ke(r1)) && !/data-sertifikat-ditinjau=/.test(s2) && teks(s2).includes("Dikonfirmasi setelah dihitung ulang · Hasilnya tetap di atas target."),
          `the confirmation: ${r1.status} ${ke(r1)}`);
        const v2 = teks(await (await fetch(`${asal}/verifikasi/${encodeURIComponent(w.token)}`)).text());
        c.expect(v2.includes(id("verifikasi.status.BERLAKU", "public")) && !v2.includes("Sedang ditinjau"), "after the confirmation the public check is not «Berlaku»");
        return c.verdict("a certificate under review, in the running app: the public check says «Sedang ditinjau» with Daisy's sentence naming the issuing school, neutral, "
          + "no reason, never «Berlaku»; the learner's list says «Sedang ditinjau» and the card her sentence, with printing still offered; Konfigurasi › Sertifikat shows "
          + "«Sedang ditinjau (1)» with «Konfirmasi berlaku» and «Cabut»; confirmed with a reason, it leaves the section, its row keeps «Dikonfirmasi setelah dihitung "
          + "ulang · …», and the public check is «Berlaku» again");
      } finally {
        try { bersih(); } catch { /* the F04 suite purges again */ }
      }
    },
  },
  {
    id: "C1W-J01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(3).toString("hex");
      muat(ctx.repoRoot);
      const judul = `C1W layar jalan ${tag}`;
      const d0 = dunia(tag, judul, BOOT);
      if (!c.expect(typeof d0 !== "string", String(d0))) return c.verdict("");
      const d = d0 as Dunia;
      try {
        // 1. the author writes the key of «Pertanyaan akhir nomor 1» in the app, and gets it wrong (B, where A is right)
        const guru0 = await masuk(asal, BOOT_GURU, `MENGELOLA:${d.inst}`, `MENGAJAR:${d.inst}`);
        if (!c.expect(typeof guru0 !== "string", String(guru0))) return c.verdict("");
        const guru = guru0 as Komputer;
        const item = soalDi(d.course, "Pertanyaan akhir nomor 1");
        const h1 = await (await guru.halaman(paketDi(d.course, `?pelajaran=1&ubah=${item}`))).text();
        const f1 = formDengan(h1, `id="soal-form-${item}"`, { pertanyaan: "Pertanyaan akhir nomor 1 tentang pecahan?", bacaan: "",
          pilihan_A: "Pilihan tepat 1", alasan_A: "Ini tepat.", pilihan_B: "Pilihan lain 1", alasan_B: "Ini belum tepat.", kunci: "B", tujuan: "" });
        // a screen that is missing is recorded as a failure and the journey goes on by the same function the screen
        // calls, so every later screen is still judged (a bundle without the editor is red at each step, not only here)
        if (c.expect(typeof f1 !== "string", `the editor: ${f1}`)) {
          const r1 = await guru.kirim(paketDi(d.course), { form: f1 as Record<string, string> });
          c.expect(/c1h=ok/.test(ke(r1)), `the author's save: ${ke(r1)}`);
        } else {
          sebagai(BOOT_GURU.identitas, `select public.ubah_soal_draf(${lit(item)}, (select revision from public.items where id = ${lit(item)}),
            jsonb_build_object('stem', 'Pertanyaan akhir nomor 1 tentang pecahan?', 'options', jsonb_build_array(
              jsonb_build_object('label', 'A', 'body', 'Pilihan tepat 1', 'is_correct', false, 'rationale', 'Ini tepat.'),
              jsonb_build_object('label', 'B', 'body', 'Pilihan lain 1', 'is_correct', true, 'rationale', 'Ini belum tepat.'))))`);
        }
        // 2. reviewed, approved, locked and published by the people whose steps they are
        const rel = terbitkan(d.course, BOOT);
        c.expect(psql(`select status from public.plp_releases where id = ${lit(rel)}`) === "PUBLISHED", "the package was not published");
        // 3. the class is given it and the learner sits both tests: every answer the key's, but the truly right A on the mistyped one
        const v = sebagai(BOOT_GURU.identitas, `select 'LA=' || (x ->> 'learning_assignment') || '|PRE=' || (x ->> 'pre_assignment') || '|POST=' || (x ->> 'post_assignment')
          from public.assign_release(${lit(rel)}, ${lit(d.kelas)}, now(), null) x`);
        const pre = pertama(v, "PRE"), post = pertama(v, "POST"), la = pertama(v, "LA");
        const duduk = (aa: string) => pertama(sebagaiUid(d.uid, `do $m$ declare s uuid; r record; begin
            s := public.start_learning_session(${lit(aa)});
            for r in select p.id, p.item_id from public.presented_items p where p.session_id = s order by p.position loop
              perform public.record_answer(r.id, 1, selftest.f09_answer(r.id, r.item_id <> ${lit(item)}));
            end loop;
            perform public.finish_my_session(s);
            perform set_config('c1l.sesi', s::text, false);
          end $m$`, "select 'S=' || current_setting('c1l.sesi')"), "S");
        duduk(pre);
        const sesi = duduk(post);
        const asli = psql(`select mastery from public.assessment_results where session_id = ${lit(sesi)} and supersedes_result_id is null`);
        c.expect(asli === "0.5000", `the sealed result under the wrong key: ${asli}`);
        // 4. the content owner finds the key wrong: «Kunci jawaban keliru?», the three steps, the exact counts
        const admin0 = await masuk(asal, BOOT_ADMIN, `MENGELOLA:${d.inst}`);
        if (!c.expect(typeof admin0 !== "string", String(admin0))) return c.verdict("");
        const admin = admin0 as Komputer;
        const p0 = await (await admin.halaman(paketDi(d.course))).text();
        c.expect(new RegExp(`data-kunci-keliru="${item}"`).test(p0) && teks(p0).includes("Kunci jawaban keliru?"), "the published question offers no «Kunci jawaban keliru?»");
        const p1 = await (await admin.halaman(paketDi(d.course, `?pelajaran=1&kunci=${item}&langkah=1`))).text();
        c.expect(/data-perbaiki-kunci="1"/.test(p1) && teks(p1).includes("Langkah 1 dari 3") && teks(p1).includes("kunci sekarang"), "step 1 is not drawn with the current key marked");
        const q2 = new URLSearchParams({ pelajaran: "1", kunci: item, langkah: "2", baru: "A", alasan: ALASAN }).toString();
        const p2 = await (await admin.halaman(paketDi(d.course, `?${q2}`))).text();
        const t2 = teks(p2);
        c.expect(/data-perbaiki-kunci="2"/.test(p2) && t2.includes("Soal ini ada di 1 sesi yang sudah selesai, di 1 sekolah.")
          && t2.includes("Bila kunci diperbaiki: 1 hasil berubah · ") && t2.includes(" · 0 sertifikat akan ditinjau sekolahnya · ") && t2.includes(d.nama),
          `step 2's exact counts: «${t2.slice(t2.indexOf("Yang terdampak"), t2.indexOf("Yang terdampak") + 400)}»`);
        const q3 = new URLSearchParams({ pelajaran: "1", kunci: item, langkah: "3", baru: "A", alasan: ALASAN }).toString();
        const p3 = await (await admin.halaman(paketDi(d.course, `?${q3}`))).text();
        const f3 = formDengan(p3, "data-kunci-kirim", {});
        let r3: Response | null = null;
        if (c.expect(typeof f3 !== "string", `step 3: ${f3}`)) {
          r3 = await admin.kirim(paketDi(d.course), { form: f3 as Record<string, string> });
        } else {
          sebagai(BOOT_ADMIN.identitas, `select public.ajukan_koreksi_kunci(${lit(item)}, array['A'], ${lit(ALASAN)})`);
        }
        const p4 = await (await admin.halaman(r3 ? ke(r3).replace(asal, "") : paketDi(d.course, "?pelajaran=1"))).text();
        const koreksi = psql(`select id from public.key_corrections where item_id = ${lit(item)} and status = 'PENDING'`);
        c.expect(r3 !== null && /c1=KOREKSI_TERKIRIM/.test(ke(r3)) && /^[0-9a-f-]{36}$/.test(koreksi) && /Menunggu konfirmasi orang kedua · diusulkan /.test(teks(p4))
          && !new RegExp(`data-kunci-keliru="${item}"`).test(p4), `the proposal and the proposer's waiting state: ${r3 ? ke(r3) : "no form"}`);
        // the proposer opening the second person's page: her sentence, no button
        const p5 = await (await admin.halaman(`/studio/tinjau/kunci/${koreksi}`)).text();
        c.expect(/data-kunci-orang-kedua/.test(p5) && !/data-kunci-tegaskan|data-kunci-tolak/.test(p5) && teks(p5).includes(id("studio.kunci.orang_kedua")),
          "the proposer is offered the confirmation, or not told why not");
        // 5. the second person: «Antrean Tinjauan» › «Perbaikan kunci menunggu konfirmasi», then confirms through the dialog
        const kadep0 = await masuk(asal, BOOT_KADEP, `MENGELOLA:${d.inst}`);
        if (!c.expect(typeof kadep0 !== "string", String(kadep0))) return c.verdict("");
        const kadep = kadep0 as Komputer;
        const a1 = await (await kadep.halaman("/studio/tinjau")).text();
        c.expect(teks(a1).includes("Perbaikan kunci menunggu konfirmasi") && new RegExp(`href="/studio/tinjau/kunci/${koreksi}"`).test(a1), "the queue does not list the waiting correction");
        const k1 = await (await kadep.halaman(`/studio/tinjau/kunci/${koreksi}`)).text();
        c.expect(/data-kunci-lama="">B</.test(tersusun(k1)) && /data-kunci-baru="">A</.test(tersusun(k1)) && teks(k1).includes(ALASAN) && /<dialog\b[^>]*class="pin-dialog"/.test(tersusun(k1))
          && teks(k1).includes("Hasil 1 sesi dihitung ulang. Hasil asli tetap tersimpan."), "the second person's page lacks the keys side by side, the reason or the dialog's sentence");
        const fk = formDengan(k1, "data-kunci-tegaskan", {});
        if (c.expect(typeof fk !== "string", `the confirmation's form: ${fk}`)) {
          const rk = await kadep.kirim(`/studio/tinjau/kunci/${koreksi}`, { form: fk as Record<string, string> });
          const k2 = await (await kadep.halaman(ke(rk).replace(asal, ""))).text();
          c.expect(/hasil=ok/.test(ke(rk)) && /data-kunci-selesai/.test(k2) && /Selesai\. 1 hasil dihitung ulang pada .+\. Hasil asli dan jawaban murid tetap tersimpan\./.test(teks(k2)),
            `the confirmation: ${rk.status} ${ke(rk)}`);
        } else {
          sebagai(BOOT_KADEP.identitas, `select public.tegaskan_koreksi_kunci(${lit(koreksi)})`);
        }
        // 6. the results recomputed: the original kept, one result in force, scored from the original answers
        const rantai = psql(`select count(*) || '|' || (select r.mastery from public.assessment_results r where r.id = public.hasil_terkini_id(${lit(sesi)}))
          || '|' || (select r.mastery from public.assessment_results r where r.session_id = ${lit(sesi)} and r.supersedes_result_id is null) from public.assessment_results where session_id = ${lit(sesi)}`);
        c.expect(rantai === "2|1.0000|0.5000", `the sitting's results after the confirmation: ${rantai}`);
        // 7. the teacher's report: the result in force, with its note and the correction's reason
        const g1 = await (await guru.halaman(`/mengajar/${d.kelas}/murid/${d.pid}`)).text();
        const tg = teks(g1);
        c.expect(/data-dikoreksi=""/.test(g1) && tg.includes("Hasil yang berlaku sekarang 100%") && tg.includes("hasil asli yang disegel (50%) tetap tersimpan")
          && tg.includes(`Penilaian satu soal diperbaiki: ${ALASAN}`) && !tg.includes("KOREKSI_KUNCI"), `the teacher's report: «${tg.indexOf("dihitung ulang") >= 0 ? tg.slice(Math.max(0, tg.indexOf("dihitung ulang") - 200), tg.indexOf("dihitung ulang") + 300) : tg.slice(900, 2600)}»`);
        // ... and the learner's own result page: the corrected result as current, marked, the original traceable
        const murid0 = await masuk(asal, muridUji(tag), "BELAJAR");
        if (!c.expect(typeof murid0 !== "string", String(murid0))) return c.verdict("");
        const m1 = await (await (murid0 as Komputer).halaman(`/belajar/${la}/hasil`)).text();
        const tm = teks(m1);
        c.expect(/data-dikoreksi=""/.test(m1) && tm.includes("100%") && tm.includes(id("hasil.dikoreksi", "learner")) && tm.includes("Hasil asli: 50%"),
          `the learner's result page: «${tm.slice(0, 600)}»`);
        // the class page: the assignment moved to the corrected release; nothing says «Ditarik»
        const g2 = await (await guru.halaman(`/mengajar/${d.kelas}`)).text();
        c.expect(!/data-rilis-dihentikan/.test(g2) && psql(`select plp_release_id <> ${lit(rel)} from public.learning_assignments where id = ${lit(la)}`) === "t",
          "the class's assignment did not move to the corrected release");
        return c.verdict("«a wrong key, found and corrected», through the running app with no engineer: the author writes the question's key (mistyped) in the editor; the head of "
          + "department approves and locks, the admin publishes; the class sits (the learner answers the truly right option, sealed 50%); the content owner opens «Kunci "
          + "jawaban keliru?» and walks the three steps, step 2 giving the exact counts and the learner by name; she sees «Menunggu konfirmasi orang kedua» and, on the "
          + "second person's page, only her sentence; the head of department finds it in «Antrean Tinjauan», confirms through the dialog («Hasil 1 sesi dihitung ulang…») "
          + "and reads «Selesai. 1 hasil dihitung ulang…»; the sitting keeps its sealed 50% and gains one result in force, 100%; the teacher's report shows 100% with the "
          + "note and the correction's reason; the learner's result page shows 100% as current, marked recalculated, with «Hasil asli: 50%»; the class's assignment is on the corrected release");
      } finally {
        bersihkan();
      }
    },
  },
];
