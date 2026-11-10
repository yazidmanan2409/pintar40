/**
 * B0 · ADMINISTRATOR LOCK-OUT PROTECTION, the screens and the operator's workflow
 * (docs/completion-4.1/batches/B0-COMPLETION.md; the database half is selftest/b0.test.ts).
 *
 *   B0-A01  the running app, as Alpha's admin on Konfigurasi › «Peran & akses»: with no role of the school ending within
 *           30 days the notice is not drawn at all; a role ending in 30 days (on the school's clock) is in the notice, by
 *           name, with its date as the school reads it and the count; a role ending in 31 days is not.
 *   B0-A02  the renewal, as a browser sends it: the notice's «Perpanjang» is a link that opens the renewal form in
 *           place (a native form: a labelled date, a labelled reason, one submit; nothing a keyboard cannot reach); one
 *           press renews (one live assignment with the new end date, audited role.renewed) and the page says so; a short
 *           reason, a date not after the current end and the admin's own role are refused, each in its own sentence,
 *           and the refused self-renewal is recorded.
 *   B0-A03  the last-holder refusal on the existing «Lepaskan» action: a school's only administrator releasing their
 *           own role is told the designed sentence, the role stands and the refusal is recorded; on the person's page
 *           «Akhiri tugas» and «Ubah peran» read a role-guard refusal in the same family of sentences.
 *   B0-A04  the platform admin: opening «Lepaskan» on a school's only administrator says the school will have no
 *           administrator, and on a teacher's role does not; in «Seluruh platform» the only platform admin is offered
 *           the renewal of their own role, with the sentence that says why, and its reason field.
 *   B0-A05  the holder's own home: a role ending in 7 days is announced on the teacher's home with its date, one
 *           ending in 8 days is not.
 *   B0-K02  reads .github/workflows/recover-platform-admin.yml and the screens' source: the workflow is a dispatch
 *           only, staging's database only, its inputs psql variables, one call and no other write, its controlled red
 *           documented; every role action reads the role guard's refusal through the one contract and records it.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { ipUji, lit, psql } from "./bob26.test";
import { Komputer } from "./bob29.test";
import { pilihKonteksPeramban, tersusun } from "./konteks-uji";
import { t } from "../src/lib/hle";
import { tanggal } from "../src/lib/tanggal";

const ADMIN = { identitas: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" };
const SYS = { identitas: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" };
const GURU = { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" };
const id = (k: Parameters<typeof t>[0]) => t(k, "staff", { locale: "id" });

const teks = (html: string) => tersusun(html).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/\s+/g, " ");

/** A form of a rendered page, found by a mark it holds, as a browser would send it: its hidden fields, then `isi`. */
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
const bentukDengan = (html: string, penanda: string) =>
  tersusun(html).split(/<form\b/).slice(1).map((b) => b.split(/<\/form>/)[0]).find((b) => b.includes(penanda)) ?? "";

/** The address of the link that carries `tanda` (an attribute as rendered), or "" when no such link is drawn. */
function tautanDengan(html: string, tanda: string): string {
  const a = (tersusun(html).match(/<a\b[^>]*>/g) ?? []).find((x) => x.includes(tanda)) ?? "";
  return (/\bhref="([^"]*)"/.exec(a)?.[1] ?? "").replace(/&amp;/g, "&");
}

/** The expiry notice of a rendered «Peran & akses», or "" when it is not drawn. */
const pemberitahuan = (html: string) => /<div[^>]*data-peran-berakhir="\d+"[\s\S]*?<\/ul>/.exec(tersusun(html))?.[0] ?? "";

type Dunia = { alpha: string; zona: string; admin: string; raAdmin: string; sys: string; raSys: string; guru: string };
function dunia(): Dunia | string {
  const v = psql(`
    select i.id || '|' || coalesce(i.zona_waktu, 'Asia/Jakarta') || '|' || a.person_id || '|' || ra.id || '|' || s.person_id || '|' || rs.id || '|' || g.person_id
      from public.accounts a join auth.users u on u.id = a.auth_user_id and u.email = ${lit(ADMIN.identitas)}
      join public.role_assignments ra on ra.person_id = a.person_id and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null and ra.scope_node_id = ra.institution_id
      join public.institutions i on i.id = ra.institution_id and i.slug like 'synth-alpha-%'
      join public.accounts s on s.auth_user_id = (select id from auth.users where email = ${lit(SYS.identitas)})
      join public.role_assignments rs on rs.person_id = s.person_id and rs.role = 'SYSTEM_ADMIN' and rs.revoked_at is null and now() < rs.valid_until
      join public.accounts g on g.auth_user_id = (select id from auth.users where email = ${lit(GURU.identitas)})
     limit 1`).split("|");
  if (v.length !== 7 || v.some((x) => !x)) return "the synthetic Alpha school, its admin, the platform admin or the teacher could not be read";
  const [alpha, zona, admin, raAdmin, sys, raSys, guru] = v;
  return { alpha, zona, admin, raAdmin, sys, raSys, guru };
}

/** One call, one transaction (bob26's psql sends one -c). */
function transaksi(...sql: string[]): string {
  return psql(["begin", ...sql, "commit"].join("; "));
}
/** A teacher's role at Alpha's own node whose last day is `hari` days from today on the school's clock (23.59.59). */
function peranUntuk(d: Dunia, orang: string, hari: number): string {
  transaksi("select set_config('app.seed_intent', 'synthetic', true)",
    `insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
     values (${lit(orang)}, 'EDUCATOR', ${lit(d.alpha)}, now() - interval '1 day',
             ((((now() at time zone ${lit(d.zona)})::date + ${hari + 1})::timestamp - interval '1 second') at time zone ${lit(d.zona)}))`);
  return psql(`select id from public.role_assignments where person_id = ${lit(orang)} and role = 'EDUCATOR' and scope_node_id = ${lit(d.alpha)} and revoked_at is null order by created_at desc limit 1`);
}
const orangBaru = (nama: string) => psql(`insert into public.persons (display_name) values (${lit(nama)}) returning id`).split("\n")[0];
/** Whatever a test granted to its own fixture people is ended again (a teacher's role: any path may), so no later reader meets an expiring role. */
const akhiri = (...orang: string[]) => {
  for (const o of orang.filter(Boolean)) {
    psql(`update public.role_assignments set revoked_at = now(), revoked_reason = 'selftest B0: fixture ended' where person_id = ${lit(o)} and revoked_at is null`);
  }
};

/**
 * A school of the test's own, with Alpha's admin as its ONLY administrator and one teacher: whatever other tests left
 * at Alpha, «the school's last administrator» is true here, and nothing of the seeded schools is at stake.
 */
function sekolahSendiri(tag: string): { sekolah: string; raAdmin: string; guru: string; raGuru: string } | string {
  transaksi("select set_config('app.seed_intent', 'synthetic', true)",
    `insert into public.institutions (name, slug, is_synthetic, is_active) values ('Sekolah B0 ${tag}', 'sekolah-b0-${tag}', true, true)`);
  const sekolah = psql(`select id from public.institutions where slug = 'sekolah-b0-${tag}'`);
  if (!/^[0-9a-f-]{36}$/.test(sekolah)) return "the test's own school was not made";
  const guru = orangBaru(`Guru B0 ${tag}`);
  transaksi("select set_config('app.seed_intent', 'synthetic', true)",
    `insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
     select a.person_id, 'INSTITUTION_ADMIN', ${lit(sekolah)}, now() - interval '1 day', now() + interval '90 days'
       from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(ADMIN.identitas)}`,
    `insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
     values (${lit(guru)}, 'EDUCATOR', ${lit(sekolah)}, now() - interval '1 day', now() + interval '90 days')`);
  const raAdmin = psql(`select id from public.role_assignments where institution_id = ${lit(sekolah)} and role = 'INSTITUTION_ADMIN' and revoked_at is null`);
  const raGuru = psql(`select id from public.role_assignments where institution_id = ${lit(sekolah)} and role = 'EDUCATOR' and revoked_at is null`);
  if (!/^[0-9a-f-]{36}$/.test(raAdmin) || !/^[0-9a-f-]{36}$/.test(raGuru)) return "the test's own school has no administrator or teacher";
  return { sekolah, raAdmin, guru, raGuru };
}
/** The test's own school is left without roles again: its only administrator's by the platform admin (the one who may). */
function tinggalkan(sekolah: string): void {
  if (!sekolah) return;
  psql(`update public.role_assignments set revoked_at = now(), revoked_reason = 'selftest B0: fixture ended' where institution_id = ${lit(sekolah)} and role <> 'INSTITUTION_ADMIN' and revoked_at is null`);
  transaksi(`select set_config('request.jwt.claims', json_build_object('sub', u.id, 'role', 'authenticated')::text, true), set_config('request.jwt.claim.sub', u.id::text, true) from auth.users u where u.email = ${lit(SYS.identitas)}`,
    `select public.revoke_role(ra.id, 'selftest B0: the test school is left again') from public.role_assignments ra where ra.institution_id = ${lit(sekolah)} and ra.role = 'INSTITUTION_ADMIN' and ra.revoked_at is null`);
}

async function masuk(asal: string, siapa: { identitas: string; password: string }, konteks: string): Promise<Komputer | string> {
  const k = new Komputer(asal, ipUji());
  const m = await k.jsonDari("/masuk/password", { form: siapa });
  if (m.status !== 200) return `${siapa.identitas} could not sign in (${m.status})`;
  await k.halaman("/konfigurasi");
  await k.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
  await pilihKonteksPeramban(k, konteks);
  return k;
}
const baca = async (k: Komputer, path: string) => (await k.halaman(path)).text();
const hidup = (orang: string) => psql(`select count(*) || '|' || coalesce(max(valid_until)::date::text, '-') from public.role_assignments where person_id = ${lit(orang)} and revoked_at is null and now() < valid_until`);
const jejak = (aksi: string, sasaran: string) => Number(psql(`select count(*) from public.audit_log where action = ${lit(aksi)} and (target_id = ${lit(sasaran)} or summary #>> '{from,assignment}' = ${lit(sasaran)})`));

export const b0LayarTests: SelfTest[] = [
  {
    id: "B0-K02",
    requires: [],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const wf = readFileSync(join(repoRoot, ".github", "workflows", "recover-platform-admin.yml"), "utf8");
      const pemicu = /^on:\s*\n((?:[ \t]+.*\n)+)/m.exec(wf)?.[1] ?? "";
      c.expect(/workflow_dispatch:/.test(pemicu) && !/\b(push|pull_request|schedule|workflow_run):/.test(pemicu), "the recovery workflow runs on something other than a dispatch");
      c.expect(/STAGING_SUPABASE_PROJECT_REF: keijhmdtsgrfvnvocfvk/.test(wf) && /the database URL names production/.test(wf) && /the database URL does not name staging's project/.test(wf),
        "the recovery workflow does not pin staging's database and refuse production's");
      c.expect(/-v pintar_id=/.test(wf) && /:'pintar_id'/.test(wf) && /:'alasan'/.test(wf) && /:'rujukan'/.test(wf)
        && !/\$\{\{\s*(github\.event\.)?inputs\.[a-z_]+\s*\}\}[^\n]*operator_appoint_platform_admin/.test(wf),
        "the recovery workflow splices an input into its SQL instead of passing it as a psql variable");
      const kode = wf.split("\n").filter((l) => !/^\s*#/.test(l));
      c.expect(kode.filter((l) => /operator_appoint_platform_admin\(/.test(l)).length === 1, "the recovery workflow does not make exactly one call");
      c.expect(kode.filter((l) => /\b(insert|update|delete)\b/i.test(l)).length === 0, "the recovery workflow writes outside operator_appoint_platform_admin");
      c.expect(!/echo[^\n]*(DB_URL|PINTAR_ID|\$ALASAN)/.test(kode.join("\n")), "the recovery workflow prints its database URL or the person it names");
      c.expect(/CONTROLLED RED/.test(wf) && /OPERATOR_PERSON_UNKNOWN/.test(wf) && /writes nothing/.test(wf), "the recovery workflow's controlled red is not documented in its header");
      // the screens: every role action reads the guard's refusal through the one contract, and records it
      const aksi = readFileSync(join(repoRoot, "src", "app", "konfigurasi", "actions.ts"), "utf8");
      const staf = readFileSync(join(repoRoot, "src", "app", "konfigurasi", "staf", "actions.ts"), "utf8");
      for (const fn of ["revoke_role", "perpanjang_peran"]) {
        c.expect(new RegExp(`ditolakPeran\\(supabase, "${fn}", error, id\\)`).test(aksi), `${fn}'s refusal is not read through the role contract in src/app/konfigurasi/actions.ts`);
      }
      c.expect(/kodePeranDariGalat\(error\)/.test(aksi) && /rpc\("catat_penolakan_peran"/.test(aksi), "the role actions do not read PR160 by its code or do not record the refusal");
      c.expect((staf.match(/await kodeTolak\(supabase, error, orang, sekolah/g) ?? []).length === 2 && /rpc\("catat_penolakan_peran"/.test(staf),
        "«Akhiri tugas» and «Ubah peran» do not both read the role guard's refusal and record it");
      const halaman = readFileSync(join(repoRoot, "src", "app", "konfigurasi", "page.tsx"), "utf8");
      c.expect(/rpc\("peran_akan_berakhir", \{ p_institution: platformIni \? null : satuSekolah, p_hari: HARI_PERINGATAN\.kelola \}\)/.test(halaman)
        && /rpc\("peran_pemegang_terakhir"/.test(halaman), "«Peran & akses» does not ask the database which roles end and which is the last administrator's");
      const beranda = readFileSync(join(repoRoot, "src", "components", "peran", "PeranSayaBerakhir.tsx"), "utf8");
      c.expect(/p_hari: HARI_PERINGATAN\.sendiri/.test(beranda) && /milik_sendiri/.test(beranda), "the holder's notice does not ask for the holder's own roles within its window");
      for (const f of [["src", "app", "mengajar", "page.tsx"], ["src", "app", "pimpinan", "page.tsx"], ["src", "app", "konfigurasi", "page.tsx"]]) {
        c.expect(/<PeranSayaBerakhir /.test(readFileSync(join(repoRoot, ...f), "utf8")), `${f.join("/")} does not draw the holder's notice`);
      }
      return c.verdict("reads .github/workflows/recover-platform-admin.yml (a dispatch only, staging's database only, its inputs psql variables, one call to "
        + "operator_appoint_platform_admin and no other write, nothing of the person printed, its controlled red documented) and the source of the role screens: "
        + "«Lepaskan», «Perpanjang», «Akhiri tugas» and «Ubah peran» read the role guard's refusal through the one contract and record it; the notices ask the database");
    },
  },
  {
    id: "B0-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const d = dunia();
      if (typeof d === "string") { c.expect(false, d); return c.verdict(""); }
      const tag = randomBytes(4).toString("hex");
      const n30 = `Bu Tiga Puluh ${tag}`, n31 = `Pak Tiga Satu ${tag}`;
      let p30 = "", p31 = "";
      try {
        const k = await masuk(ctx.appUrl!, ADMIN, `MENGELOLA:${d.alpha}`);
        if (typeof k === "string") { c.expect(false, k); return c.verdict(""); }
        // what the school holds before the fixture: none ending, so nothing is drawn
        const awal = Number(psql(`select count(*) from public.role_assignments ra where ra.institution_id = ${lit(d.alpha)} and ra.revoked_at is null and now() >= ra.valid_from and now() < ra.valid_until
          and (ra.valid_until at time zone ${lit(d.zona)})::date - (now() at time zone ${lit(d.zona)})::date <= 30`));
        const h0 = await baca(k, "/konfigurasi/roles");
        c.expect(h0.includes("data-peran-arti"), "«Peran & akses» was not drawn for Alpha's admin");
        if (awal === 0) c.expect(pemberitahuan(h0) === "" && !teks(h0).includes(id("peran.berakhir.judul")), "with no role ending within 30 days the notice is drawn");
        else c.note(`${awal} role(s) of the school already end within 30 days`);
        p30 = orangBaru(n30); p31 = orangBaru(n31);
        const ra30 = peranUntuk(d, p30, 30), ra31 = peranUntuk(d, p31, 31);
        if (!c.expect(/^[0-9a-f-]{36}$/.test(ra30) && /^[0-9a-f-]{36}$/.test(ra31), "the fixture roles were not made")) return c.verdict("");
        const h1 = await baca(k, "/konfigurasi/roles");
        const p = pemberitahuan(h1);
        const sampai = psql(`select valid_until from public.role_assignments where id = ${lit(ra30)}`);
        c.expect(p !== "" && new RegExp(`data-peran-berakhir="${awal + 1}"`).test(p), `the notice does not count ${awal + 1} role(s): ${p.slice(0, 160) || "(not drawn)"}`);
        c.expect(teks(p).includes(id("peran.berakhir.judul")) && teks(p).includes(id("peran.berakhir.jumlah").replace("{n}", String(awal + 1))), `the notice's heading or count sentence is missing: ${teks(p).slice(0, 300)}`);
        c.expect(new RegExp(`data-berakhir="${ra30}" data-sisa-hari="30"`).test(p) && teks(p).includes(n30), "the role ending in 30 days is not in the notice by name");
        c.expect(teks(p).includes(tanggal(sampai, "baca", "id", d.zona)), `the notice does not say the date on the school's clock (${tanggal(sampai, "baca", "id", d.zona)}): ${teks(p).slice(0, 300)}`);
        c.expect(!p.includes(ra31) && !teks(p).includes(n31), "the role ending in 31 days is in the notice");
        c.expect(teks(h1).includes(n31), "the role ending in 31 days is not in the list of roles at all, so its absence from the notice proves nothing");
        c.expect(new RegExp(`perpanjang=${ra30}.*#perpanjang$`).test(tautanDengan(p, `data-buka-perpanjang="${ra30}"`)), `the notice's row does not offer its renewal as a link (${tautanDengan(p, `data-buka-perpanjang="${ra30}"`) || "none"})`);
      } finally {
        akhiri(p30, p31);
      }
      return c.verdict("on Konfigurasi › «Peran & akses», as the school's admin: with no role ending within 30 days no notice is drawn; a role ending in 30 days is in "
        + "the notice by name, counted, with its date on the school's clock and its renewal link; a role ending in 31 days is listed among the roles and not in the notice");
    },
  },
  {
    id: "B0-A02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const d = dunia();
      if (typeof d === "string") { c.expect(false, d); return c.verdict(""); }
      const tag = randomBytes(4).toString("hex");
      const nama = `Bu Perpanjang ${tag}`;
      let orang = "";
      try {
        const k = await masuk(ctx.appUrl!, ADMIN, `MENGELOLA:${d.alpha}`);
        if (typeof k === "string") { c.expect(false, k); return c.verdict(""); }
        orang = orangBaru(nama);
        const ra = peranUntuk(d, orang, 12);
        const lama = psql(`select valid_until from public.role_assignments where id = ${lit(ra)}`);
        const h1 = await baca(k, "/konfigurasi/roles");
        const tautan = tautanDengan(pemberitahuan(h1), `data-buka-perpanjang="${ra}"`);
        if (!c.expect(tautan !== "", "the notice offers no renewal link for the expiring role")) return c.verdict("");
        // the form, opened in place: a native form a keyboard reaches end to end
        const h2 = await baca(k, tautan.split("#")[0]);
        const b = bentukDengan(h2, `data-perpanjang="${ra}"`);
        c.expect(b !== "" && /id="perpanjang"/.test(b) && teks(b).includes(nama) && teks(b).includes(id("peran.perpanjang.judul")), `the renewal form does not open naming the role: ${teks(b).slice(0, 200)}`);
        c.expect(/<label[^>]*for="cfg-perpanjang-sampai"/.test(b) && /<input[^>]*type="date"[^>]*id="cfg-perpanjang-sampai"|<input[^>]*id="cfg-perpanjang-sampai"[^>]*type="date"/.test(b)
          && /<label[^>]*for="cfg-perpanjang-alasan"/.test(b) && /<input[^>]*id="cfg-perpanjang-alasan"[^>]*required/.test(b) && /minLength="10"|minlength="10"/.test(b)
          && /<button[^>]*type="submit"/.test(b) && !/tabindex="-1"/i.test(b),
          "the renewal form is not a native form with a labelled date, a labelled required reason and one submit button");
        c.expect(teks(b).includes(tanggal(lama, "baca", "id", d.zona)), "the renewal form does not say the role's current end date on the school's clock");
        const baru = psql(`select ((now() at time zone ${lit(d.zona)})::date + 200)::text`);
        const kirim = async (isi: Record<string, string>) => {
          const f = formDengan(await baca(k, tautan.split("#")[0]), `data-perpanjang="${ra}"`, isi);
          if (typeof f === "string") return f;
          return (await k.kirim("/konfigurasi/roles", { form: f })).headers.get("location") ?? "";
        };
        // refused, each in its own sentence, nothing changed
        const pendek = await kirim({ valid_until: baru, alasan: "pendek" });
        c.expect(/hasil=gagal/.test(pendek) && /kode=ROLE_RENEW_REASON_REQUIRED/.test(pendek) && /asal=perpanjang/.test(pendek), `a five-character reason answered ${pendek}`);
        c.expect(teks(await baca(k, pendek)).includes(id("peran.galat.role_renew_reason_required")), "the refused renewal (reason) does not say its sentence");
        const mundur = await kirim({ valid_until: psql(`select ((now() at time zone ${lit(d.zona)})::date + 5)::text`), alasan: `masa tugas diperpanjang ${tag}` });
        c.expect(/kode=ROLE_RENEW_UNTIL_INVALID/.test(mundur), `a new end date before the current one answered ${mundur}`);
        c.expect(teks(await baca(k, mundur)).includes(id("peran.galat.role_renew_until_invalid")), "the refused renewal (date) does not say its sentence");
        c.expect(hidup(orang).startsWith("1|") && jejak("role.renewed", ra) === 0, `the refused renewals changed something: ${hidup(orang)}`);
        // the admin's own role (the screen offers no such link; sent as a browser could): refused, said, recorded
        const tolakSebelum = jejak("role.renewal_refused", d.raAdmin);
        const fs = formDengan(await baca(k, tautan.split("#")[0]), `data-perpanjang="${ra}"`, { assignment: d.raAdmin, valid_until: "2040-01-01", alasan: `memperpanjang peran sendiri ${tag}` });
        const sendiri = typeof fs === "string" ? fs : (await k.kirim("/konfigurasi/roles", { form: fs })).headers.get("location") ?? "";
        c.expect(/kode=ROLE_RENEW_SELF/.test(sendiri) && teks(await baca(k, sendiri)).includes(id("peran.galat.role_renew_self")), `renewing one's own role answered ${sendiri}`);
        c.expect(jejak("role.renewal_refused", d.raAdmin) === tolakSebelum + 1, "the refused self-renewal was not recorded (role.renewal_refused)");
        c.expect(tautanDengan(h1, `data-buka-perpanjang="${d.raAdmin}"`) === "" && h1.includes(`id="peran-${d.raAdmin}"`), "the admin's own role is offered a renewal, or its row is not drawn");
        // one press renews
        const ok = await kirim({ valid_until: baru, alasan: `masa tugas diperpanjang satu semester ${tag}` });
        c.expect(/hasil=ok/.test(ok) && /kode=ROLE_RENEWED/.test(ok), `the renewal answered ${ok}`);
        const h3 = await baca(k, ok);
        c.expect(teks(h3).includes(id("galat.role_renewed")), "the page does not say the role was renewed");
        c.expect(hidup(orang) === `1|${baru}` && jejak("role.renewed", ra) === 1,
          `after the renewal the person holds ${hidup(orang)} (live roles | last day, UTC), audited ${jejak("role.renewed", ra)} time(s)`);
        c.expect(psql(`select (revoked_at is not null)::text from public.role_assignments where id = ${lit(ra)}`) === "true", "the renewed assignment was not ended");
        c.expect(!teks(pemberitahuan(h3)).includes(nama) && bentukDengan(h3, "data-perpanjang=") === "", "after the renewal the role is still in the notice, or the form is still open");
      } finally {
        akhiri(orang);
      }
      return c.verdict("as the school's admin: the notice's «Perpanjang» link opens the renewal in place as a native form (a labelled date, a labelled required reason, "
        + "one submit) naming the role and its current end; a short reason, an earlier date and the admin's own role are refused, each in its own sentence, the last "
        + "one recorded; one press renews: one live assignment with the new end date, the old one ended, audited role.renewed, said on the page, gone from the notice");
    },
  },
  {
    id: "B0-A03",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const d = dunia();
      if (typeof d === "string") { c.expect(false, d); return c.verdict(""); }
      const tag = randomBytes(4).toString("hex");
      let sekolah = "";
      try {
        // a school of the test's own, where Alpha's admin is the only administrator
        const w = sekolahSendiri(tag);
        if (typeof w === "string") { c.expect(false, w); return c.verdict(""); }
        sekolah = w.sekolah;
        const orang = w.guru, ra = w.raGuru;
        const k = await masuk(ctx.appUrl!, ADMIN, `MENGELOLA:${sekolah}`);
        if (typeof k === "string") { c.expect(false, k); return c.verdict(""); }
        // «Lepaskan», opened on another row, sent for the admin's own role (the screen offers none for it)
        const h = await baca(k, `/konfigurasi/roles?ubah=${ra}`);
        c.expect(!/data-tanpa-admin/.test(h), "a school admin releasing a teacher's role is told the school will have no administrator");
        const f = formDengan(h, `name="assignment" value="${ra}"`, { assignment: w.raAdmin, alasan: `melepas peran sendiri ${tag}` });
        if (!c.expect(typeof f !== "string", `the «Lepaskan» form: ${f}`)) return c.verdict("");
        const sebelum = jejak("role.revocation_refused", w.raAdmin);
        const ke = (await k.kirim("/konfigurasi/roles", { form: f as Record<string, string> })).headers.get("location") ?? "";
        c.expect(/hasil=gagal/.test(ke) && /kode=ROLE_LAST_SCHOOL_ADMIN/.test(ke) && /asal=cabut/.test(ke), `releasing the school's only administrator answered ${ke}`);
        const h2 = teks(await baca(k, ke));
        c.expect(h2.includes(id("peran.galat.role_last_school_admin")), `the page does not say the last-holder sentence: ${h2.slice(h2.indexOf(id("config.result.failed")), h2.indexOf(id("config.result.failed")) + 240)}`);
        c.expect(!h2.includes(id("galat.action_failed")), "the last-holder refusal is still said as a general failure");
        c.expect(psql(`select (revoked_at is null)::text from public.role_assignments where id = ${lit(w.raAdmin)}`) === "true", "the school's only administrator was released");
        c.expect(jejak("role.revocation_refused", w.raAdmin) === sebelum + 1, "the refused revocation was not recorded (role.revocation_refused)");
        // the person's page reads a role-guard code in the same family, for either act
        for (const jenis of ["akhiri", "ubah"]) {
          const hs = teks(await baca(k, `/konfigurasi/staf?orang=${orang}&jenis=${jenis}&hasil=gagal&kode=ROLE_LAST_SCHOOL_ADMIN`));
          c.expect(hs.includes(id("peran.galat.role_last_school_admin")), `the person's page («${jenis}») does not say the last-holder sentence`);
          const hb = teks(await baca(k, `/konfigurasi/staf?orang=${orang}&jenis=${jenis}&hasil=gagal&kode=ROLE_BUSY`));
          c.expect(hb.includes(id("peran.galat.role_busy")), `the person's page («${jenis}») does not say the try-again sentence`);
        }
      } finally {
        tinggalkan(sekolah);
      }
      return c.verdict("as a school's only administrator: «Lepaskan» sent for their own role is refused with the designed last-holder sentence (not the general failure), "
        + "the role stands and role.revocation_refused is recorded; the person's page says the same sentence, and the try-again one, for «Akhiri tugas» and «Ubah peran»");
    },
  },
  {
    id: "B0-A04",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const d = dunia();
      if (typeof d === "string") { c.expect(false, d); return c.verdict(""); }
      const tag = randomBytes(4).toString("hex");
      let sekolah = "";
      try {
        // a school of the test's own with one administrator and one teacher
        const w = sekolahSendiri(tag);
        if (typeof w === "string") { c.expect(false, w); return c.verdict(""); }
        sekolah = w.sekolah;
        const ra = w.raGuru;
        const k = await masuk(ctx.appUrl!, SYS, `MENGELOLA:${sekolah}`);
        if (typeof k === "string") { c.expect(false, k); return c.verdict(""); }
        const h1 = await baca(k, `/konfigurasi/roles?ubah=${w.raAdmin}`);
        const b1 = bentukDengan(h1, `name="assignment" value="${w.raAdmin}"`);
        c.expect(b1 !== "" && /data-tanpa-admin/.test(b1) && teks(b1).includes(id("peran.cabut.tanpa_admin")),
          `«Lepaskan» on the school's only administrator does not say the school will have no administrator: ${teks(b1).slice(0, 200)}`);
        c.expect(new RegExp(`aria-describedby="peran-tanpa-admin-${w.raAdmin}"`).test(b1) && (b1.match(/<button[^>]*type="submit"/g) ?? []).length === 1,
          "the warning is not tied to the reason field, or the form has more than its one confirmation");
        const h2 = await baca(k, `/konfigurasi/roles?ubah=${ra}`);
        const b2 = bentukDengan(h2, `name="assignment" value="${ra}"`);
        c.expect(b2 !== "" && !/data-tanpa-admin/.test(b2), "«Lepaskan» on a teacher's role says the school will have no administrator");
        // «Seluruh platform»: the only platform admin renews their own role, with its reason
        await pilihKonteksPeramban(k, "MENGELOLA:PLATFORM");
        const lain = Number(psql(`select count(*) from public.role_assignments where role = 'SYSTEM_ADMIN' and revoked_at is null and now() < valid_until and person_id <> ${lit(d.sys)}`));
        if (c.expect(lain === 0, `${lain} other platform admin(s) exist, so the only platform admin's own renewal cannot be shown`)) {
          const h3 = await baca(k, "/konfigurasi/roles");
          c.expect(tautanDengan(h3, `data-buka-perpanjang="${d.raSys}"`).includes(`perpanjang=${d.raSys}`), "the only platform admin is not offered the renewal of their own role");
          const baris = new RegExp(`<li[^>]*id="peran-${d.raSys}"[\\s\\S]*?</li>`).exec(tersusun(h3))?.[0] ?? "";
          c.expect(baris !== "" && !/data-buka-ubah/.test(baris), "the platform admin's own role is offered a release, or its row is not drawn");
          const h4 = await baca(k, `/konfigurasi/roles?perpanjang=${d.raSys}`);
          const b4 = bentukDengan(h4, `data-perpanjang="${d.raSys}"`);
          c.expect(b4 !== "" && teks(b4).includes(id("peran.perpanjang.sendiri")) && /<input[^>]*id="cfg-perpanjang-alasan"[^>]*required/.test(b4),
            `the own-role renewal form does not say why it is allowed, or has no required reason: ${teks(b4).slice(0, 240)}`);
        }
      } finally {
        tinggalkan(sekolah);
      }
      return c.verdict("as the platform admin in a school's context: «Lepaskan» on the school's only administrator says, before its one confirmation, that the school "
        + "will have no administrator, and on a teacher's role says nothing; in «Seluruh platform» the only platform admin is offered the renewal of their own role, "
        + "with the sentence that says why and a required reason");
    },
  },
  {
    id: "B0-A05",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const d = dunia();
      if (typeof d === "string") { c.expect(false, d); return c.verdict(""); }
      try {
        const k = await masuk(ctx.appUrl!, GURU, `MENGAJAR:${d.alpha}`);
        if (typeof k === "string") { c.expect(false, k); return c.verdict(""); }
        const h0 = await baca(k, "/mengajar");
        c.expect(h0.includes('id="isi"') && !/data-peran-saya=/.test(h0), "the teacher's home draws the notice with no role ending within 7 days (or was not drawn)");
        const ra8 = peranUntuk(d, d.guru, 8);
        c.expect(!/data-peran-saya=/.test(await baca(k, "/mengajar")), "a role ending in 8 days is announced on the holder's home");
        psql(`update public.role_assignments set revoked_at = now(), revoked_reason = 'selftest B0: fixture ended' where id = ${lit(ra8)}`);
        const ra7 = peranUntuk(d, d.guru, 7);
        const sampai = psql(`select valid_until from public.role_assignments where id = ${lit(ra7)}`);
        const h7 = await baca(k, "/mengajar");
        const blok = /<div[^>]*data-peran-saya="1"[\s\S]*?<\/div>/.exec(tersusun(h7))?.[0] ?? "";
        c.expect(blok !== "" && new RegExp(`data-peran-saya-baris="${ra7}" data-sisa-hari="7"`).test(blok), `a role ending in 7 days is not announced on the holder's home: ${blok.slice(0, 200) || "(not drawn)"}`);
        c.expect(teks(blok).includes(t("peran.saya.judul", "educator", { locale: "id" })) && teks(blok).includes(tanggal(sampai, "baca", "id", d.zona)) && teks(blok).includes(t("role.EDUCATOR", "educator", { locale: "id" })),
          `the notice does not name the role and its date on the school's clock: ${teks(blok).slice(0, 300)}`);
        c.expect(!/<a\b/.test(blok), "a teacher's notice offers an action that is not theirs");
      } finally {
        psql(`update public.role_assignments set revoked_at = now(), revoked_reason = 'selftest B0: fixture ended' where person_id = ${lit(d.guru)} and role = 'EDUCATOR' and scope_node_id = ${lit(d.alpha)} and revoked_at is null`);
      }
      return c.verdict("on the teacher's own home: nothing with no role ending; a role ending in 8 days is not announced; one ending in 7 days is, by its role and its "
        + "date on the school's clock, with no action that is not the holder's");
    },
  },
];
