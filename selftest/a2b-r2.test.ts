/**
 * A2B-R2 — STUDIO'S DISTRIBUTION READS FAIL OPEN, AS S-1 DID (Second Eye's S-1 sweep, 16 Nov; the Chief Architect,
 * 16 Nov 11:59: option (b), placed as C2w's first item; TEAM-INSTRUCTIONS register A2B-R2).
 *
 * Pustaka PINTAR's «Tarik izin» (withdrawDistributionAction) decided its working context (§2.11) from a direct read of
 * release_distributions, on which a staff client holds no SELECT: the read came back empty, the target had no school,
 * and the context check passed having checked nothing (withdraw_release_distribution still authorised the act). The
 * Kanonik page read the same table for its list of grants still open, so the list could only be empty and «Tarik
 * izin» never had a grant to offer.
 *
 * A2B-R2D, in the database, rolled back: distribusi_tempat(p_distribution) gives a distribution's release, its owning
 * library and its receiving school to whoever withdraw_release_distribution would let withdraw it (SYSTEM_ADMIN, or
 * CAN_PUBLISH in the owning library), and refuses anyone else, and an unknown id, with withdraw's own sentence (no
 * existence oracle); distribusi_berlaku() lists the ACTIVE grants its caller may withdraw, and nothing to anyone else.
 *
 * A2B-R2A, against the running build, each form posted as a browser without script posts it: Admin platform working
 * in Sekolah Sintetis Alpha is refused for the context on «Tarik izin» of a library grant to Alpha, and nothing is
 * written; an unknown grant is refused ACTION_NOT_ALLOWED before any write; working in Pustaka PINTAR, the Kanonik
 * form lists the open grant by name, and the same «Tarik izin» withdraws it (the control).
 * Both are red on the build before the fix (3c58620e).
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createServerClient } from "@supabase/ssr";
import { Checks, compiledBundle, type Context, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";
import { pilihKonteksCookie } from "./konteks-uji";

const SYS = { email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" };
const ALPHA_ADMIN = "alpha-admin@synthetic.pintar.test";
const ID = (n: string) => `a2b52000-0000-4000-8000-${n.padStart(12, "0")}`;
const KURSUS = ID("c1"), RILIS = ID("e1"), DIST = ID("d1");
/** withdraw_release_distribution's own refusal, which the new reads raise too (POLA_STUDIO reads it ACTION_NOT_ALLOWED). */
const TOLAK = "withdrawing a distribution requires SYSTEM_ADMIN or CAN_PUBLISH in the owning canonical tenant";

const pustaka = () => psql("select id from public.institutions where tenant_kind = 'PLATFORM_CANONICAL' order by name limit 1");
const alpha = () => psql("select id from public.institutions where name = 'Sekolah Sintetis Alpha'");
const sysOrang = () => psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(SYS.email)}`);

/** The library's course, its published release, and its grant to Alpha, as committed rows (triggers off for the plant). */
function siapkan(L: string, A: string, sys: string): void {
  psql(`begin;
set local session_replication_role = replica;
delete from public.release_distributions where id = ${lit(DIST)} or plp_release_id = ${lit(RILIS)};
delete from public.plp_releases where id = ${lit(RILIS)};
delete from public.courses where id = ${lit(KURSUS)};
insert into public.courses (id, institution_id, subject, stage, grade_label, title)
values (${lit(KURSUS)}, ${lit(L)}, 'Matematika', 'SD', 'Kelas 5', 'Pecahan uji A2B-R2');
insert into public.plp_releases (id, institution_id, course_id, version_label, status, published_at, frozen_at)
values (${lit(RILIS)}, ${lit(L)}, ${lit(KURSUS)}, '9.2.0', 'PUBLISHED', now() - interval '1 day', now() - interval '1 day');
insert into public.release_distributions (id, plp_release_id, institution_id, status, authorized_by_person_id, authorized_at)
values (${lit(DIST)}, ${lit(RILIS)}, ${lit(A)}, 'ACTIVE', ${lit(sys)}, now() - interval '1 hour');
commit;`);
}
function bersihkan(): string {
  psql(`begin; set local session_replication_role = replica;
delete from public.release_distributions where id = ${lit(DIST)} or plp_release_id = ${lit(RILIS)};
delete from public.plp_releases where id = ${lit(RILIS)};
delete from public.courses where id = ${lit(KURSUS)};
commit;`);
  return psql(`select (select count(*) from public.release_distributions where id = ${lit(DIST)})
    + (select count(*) from public.plp_releases where id = ${lit(RILIS)}) + (select count(*) from public.courses where id = ${lit(KURSUS)})`);
}

/** Rows of one psql run, each «key|value». */
function baris(sql: string): { hasil: Record<string, string>; err: string } {
  const r = spawnSync("psql", [process.env.SUPABASE_DB_URL!, "-XqAt", "-v", "ON_ERROR_STOP=1"], { encoding: "utf8", input: sql });
  const hasil: Record<string, string> = {};
  for (const l of (r.stdout ?? "").split("\n")) { const i = l.indexOf("|"); if (i > 0) hasil[l.slice(0, i)] = l.slice(i + 1); }
  return { hasil, err: r.status === 0 ? "" : (r.stderr ?? "").trim().split("\n").filter((x) => /ERROR|DETAIL/.test(x)).join(" ") };
}
const sebagai = (uid: string) => `select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);`;

async function masuk(ctx: Context): Promise<string> {
  const jar = new Map<string, string>();
  const client = createServerClient(ctx.supabaseUrl!, ctx.supabaseAnonKey!, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { error } = await client.auth.signInWithPassword(SYS);
  if (error) throw new Error(`sign-in failed for ${SYS.email}: ${error.message}`);
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}
/** A server action's id, from the production build's manifest (null when absent). */
function idAksi(ctx: Context, berkas: string, nama: string): string | null {
  const p = compiledBundle(ctx, "server", "server-reference-manifest.json");
  if (!existsSync(p)) return null;
  const m = JSON.parse(readFileSync(p, "utf8")) as { node?: Record<string, { filename?: string; exportedName?: string }> };
  for (const [id, a] of Object.entries(m.node ?? {})) if ((a.filename ?? "").endsWith(berkas) && (a.exportedName ?? nama) === nama) return id;
  return null;
}
/** The form posted as a browser without script posts it; where it sends you. */
async function kirim(ctx: Context, cookie: string, aksi: string, isian: Record<string, string>): Promise<string> {
  const fd = new FormData();
  fd.set(`$ACTION_ID_${aksi}`, "");
  for (const [k, v] of Object.entries(isian)) fd.set(k, v);
  const r = await fetch(`${ctx.appUrl}/studio/kanonik`, { method: "POST", body: fd, redirect: "manual", headers: { cookie, origin: ctx.appUrl! } });
  const ke = r.headers.get("location") ?? "";
  return ke ? decodeURIComponent(ke) : `status ${r.status}`;
}
async function halaman(ctx: Context, cookie: string, jalan: string): Promise<string> {
  return (await fetch(`${ctx.appUrl}${jalan}`, { headers: { cookie }, redirect: "manual" })).text();
}
const ditolakKonteks = (ke: string) => /alasan=lain/.test(ke) || /CONTEXT_OTHER_PLACE/.test(ke);
const status = () => psql(`select coalesce((select status::text from public.release_distributions where id = ${lit(DIST)}), 'tidak ada')`);
/** The «Tarik izin» select's options, by value. */
const pilihanTarik = (html: string) => {
  const a = html.indexOf('name="distribusi"');
  if (a < 0) return [] as string[];
  const b = html.indexOf("</select>", a);
  return [...html.slice(a, b < 0 ? undefined : b).matchAll(/<option\b[^>]*value="([^"]*)"/g)].map((m) => m[1]).filter(Boolean);
};

export const a2bR2DbTests: SelfTest[] = [
  {
    id: "A2B-R2D",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const L = pustaka(), A = alpha(), sys = sysOrang();
      const sysUid = psql(`select id from auth.users where email = ${lit(SYS.email)}`);
      const adminUid = psql(`select id from auth.users where email = ${lit(ALPHA_ADMIN)}`);
      if (!c.expect(L !== "" && A !== "" && sys !== "" && sysUid !== "" && adminUid !== "", "the synthetic library, Alpha, Admin platform or Alpha's admin is missing")) return c.verdict("");
      const coba = (sql: string) => `(select pg_temp.r2_coba($q$${sql}$q$))`;
      const r = baris(`begin;
set local session_replication_role = replica;
insert into public.courses (id, institution_id, subject, stage, grade_label, title)
values (${lit(KURSUS)}, ${lit(L)}, 'Matematika', 'SD', 'Kelas 5', 'Pecahan uji A2B-R2');
insert into public.plp_releases (id, institution_id, course_id, version_label, status, published_at, frozen_at)
values (${lit(RILIS)}, ${lit(L)}, ${lit(KURSUS)}, '9.2.0', 'PUBLISHED', now() - interval '1 day', now() - interval '1 day');
insert into public.release_distributions (id, plp_release_id, institution_id, status, authorized_by_person_id, authorized_at)
values (${lit(DIST)}, ${lit(RILIS)}, ${lit(A)}, 'ACTIVE', ${lit(sys)}, now() - interval '1 hour');
set local session_replication_role = origin;
create function pg_temp.r2_coba(p_sql text) returns text language plpgsql as $c$
begin execute p_sql; return 'OK'; exception when others then return SQLERRM; end $c$;
select 'ada|' || (to_regprocedure('public.distribusi_tempat(uuid)') is not null and to_regprocedure('public.distribusi_berlaku()') is not null)::text;
${sebagai(sysUid)}
select 'baca|' || ${coba(`select public.distribusi_tempat('${DIST}')::text`)};
select 'tempat|' || coalesce((select (j ->> 'terbitan') || ':' || (j ->> 'pemilik') || ':' || (j ->> 'sekolah') from (select public.distribusi_tempat('${DIST}') as j) x), 'null');
select 'berlaku|' || coalesce((select string_agg(id::text || ':' || plp_release_id::text || ':' || institution_id::text, ',') from public.distribusi_berlaku() where id = '${DIST}'), 'kosong');
${sebagai(adminUid)}
select 'lain|' || ${coba(`select public.distribusi_tempat('${DIST}')`)};
select 'entah|' || ${coba(`select public.distribusi_tempat('${ID("dead")}')`)};
select 'berlaku_lain|' || (select count(*) from public.distribusi_berlaku())::text;
select set_config('request.jwt.claims', '', true);
select 'langsung|' || has_table_privilege('authenticated', 'public.release_distributions', 'select')::text;
select 'paparan|' || coalesce((select string_agg(function_name || ':' || exposure::text, ',' order by function_name) from public.client_rpc_registry where function_name in ('distribusi_tempat', 'distribusi_berlaku')), 'tidak ada');
select 'hak|' || coalesce((select string_agg(p.proname || ':' || has_function_privilege('anon', p.oid, 'execute')::text || ':' || has_function_privilege('service_role', p.oid, 'execute')::text
  || ':' || has_function_privilege('authenticated', p.oid, 'execute')::text || ':' || p.provolatile, ',' order by p.proname)
  from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname in ('distribusi_tempat', 'distribusi_berlaku')), 'tidak ada');
rollback;`);
      const h = r.hasil;
      c.expect(!r.err, `A2B-R2D failed to run: ${r.err}`);
      c.expect(h.ada === "true", `distribusi_tempat(uuid) and distribusi_berlaku() must exist: ${h.ada}`);
      c.expect(h.tempat === `${RILIS}:${L}:${A}`, `Admin platform is given the grant's release, owning library and receiving school: ${h.tempat} (${h.baca})`);
      c.expect(h.berlaku === `${DIST}:${RILIS}:${A}`, `Admin platform's open grants include it, by id, release and school: ${h.berlaku}`);
      c.expect(h.lain === TOLAK && h.entah === TOLAK, `another school's admin, and an unknown id, are refused alike with withdraw's sentence: «${h.lain}», «${h.entah}»`);
      c.expect(h.berlaku_lain === "0", `distribusi_berlaku lists nothing to someone who may not withdraw: ${h.berlaku_lain}`);
      c.expect(h.paparan === "distribusi_berlaku:PLATFORM,distribusi_tempat:PLATFORM", `both are registered PLATFORM, as withdraw_release_distribution is: ${h.paparan}`);
      c.expect(h.hak === "distribusi_berlaku:false:false:true:s,distribusi_tempat:false:false:true:s", `both are stable reads for authenticated alone (anon, service_role refused): ${h.hak}`);
      c.expect(h.langsung === "false", `the control: a staff client holds no SELECT on release_distributions: ${h.langsung}`);
      return c.verdict("distribusi_tempat gives a grant's release, owning library and receiving school to whoever may withdraw it (withdraw_release_distribution's rule); another school's admin and an unknown id are refused alike with withdraw's own sentence; distribusi_berlaku lists the open grants its caller may withdraw and nothing to anyone else; both PLATFORM, stable, for authenticated alone; a staff client holds no select on the table");
    },
  },
];

export const a2bR2AppTests: SelfTest[] = [
  {
    id: "A2B-R2A",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      const L = pustaka(), A = alpha(), sys = sysOrang();
      const tarik = idAksi(ctx, "src/app/studio/actions.ts", "withdrawDistributionAction");
      if (!c.expect(tarik !== null, "the build's server-action manifest names no withdrawDistributionAction")) return c.verdict("");
      if (!c.expect(L !== "" && A !== "" && sys !== "", "the synthetic library, Alpha or Admin platform is missing")) return c.verdict("");
      siapkan(L, A, sys);
      try {
        const cookie = await masuk(ctx);
        // 1. working in Alpha: «Tarik izin» of the library's grant to Alpha is refused for the context, and nothing is written
        await pilihKonteksCookie(ctx.appUrl!, cookie, `MENGELOLA:${A}`);
        const diAlpha = await kirim(ctx, cookie, tarik!, { distribusi: DIST, alasan: "Uji A2B-R2" });
        c.expect(ditolakKonteks(diAlpha), `«Tarik izin», working in Alpha, must be refused for the context (the grant is the library's act): sent to ${diAlpha}`);
        c.expect(status() === "ACTIVE", `nothing may be written by a refused act: the grant is ${status()}`);
        // 2. fail closed: an unknown grant is refused ACTION_NOT_ALLOWED, before any write
        await pilihKonteksCookie(ctx.appUrl!, cookie, `MENGELOLA:${L}`);
        const entah = await kirim(ctx, cookie, tarik!, { distribusi: ID("dead"), alasan: "Uji A2B-R2" });
        c.expect(/kode=ACTION_NOT_ALLOWED/.test(entah), `an unknown grant must be refused ACTION_NOT_ALLOWED: sent to ${entah}`);
        // 3. the display: in Pustaka PINTAR, the «Tarik izin» form offers the open grant
        const daftar = pilihanTarik(await halaman(ctx, cookie, "/studio/kanonik"));
        c.expect(daftar.includes(DIST), `the Kanonik «Tarik izin» form must offer the open grant: options ${JSON.stringify(daftar)}`);
        // 4. the control: working in Pustaka PINTAR, the same «Tarik izin» withdraws it
        const diPustaka = await kirim(ctx, cookie, tarik!, { distribusi: DIST, alasan: "Uji A2B-R2" });
        c.expect(/kode=DISTRIBUTION_WITHDRAWN/.test(diPustaka) && status() === "WITHDRAWN",
          `working in Pustaka PINTAR, «Tarik izin» must withdraw the grant: sent to ${diPustaka}; the grant is ${status()}`);
      } finally {
        c.expect(bersihkan() === "0", "the test's course, release or grant is still there");
      }
      return c.verdict("A2B-R2, executed against the build: Admin platform working in Alpha is refused for the context on «Tarik izin» of the library's grant to Alpha, with nothing written; an unknown grant is refused ACTION_NOT_ALLOWED before any write; working in Pustaka PINTAR, the Kanonik form offers the open grant by its id, and the same «Tarik izin» withdraws it");
    },
  },
];
