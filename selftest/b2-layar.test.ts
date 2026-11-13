/**
 * B2 · PRINTED-REPORT IDENTIFICATION through the running app (docs/completion-4.1/batches/B2-COMPLETION.md §6; THE PLAN
 * §5.2), against real Auth and PostgREST. The print action is driven as the browser drives it (its server action, by
 * the build's own id, with the page's cookies). Each test removes the rows it wrote and proves them gone (P3).
 *
 *   B2-A01  a press writes one PRINT_REQUEST: the action answers with that row's reference, the person's name as the
 *           platform holds it and the instant in the school's clock; the row names the report, the node and the
 *           requester, and is the school's. A request carrying another person's or user's id still writes as the
 *           session's user (Sharon's change 1)
 *   B2-A02  a writer that fails: the action answers CETAK_GAGAL, no row is written, the failure is counted
 *   B2-A03  a forged scope (another school's node) is refused CETAK_TIDAK_BOLEH and writes nothing
 *   B2-A04  the page as served: the default footer is the short browser line, names no person and carries no
 *           reference-shaped text; «Cetak laporan» is offered
 *   B2-A05  an empty report (a learner with no result) offers no «Cetak laporan»
 *   B2-A06  B2-R-A1 (Daisy's line; the Chief Architect's condition), one test each way: the platform admin, in Alpha's
 *           context, printing Beta's summary, where they hold a context of their own, is answered CETAK_KONTEKS_LAIN;
 *           Alpha's admin, who holds none at Beta, still gets CETAK_TIDAK_BOLEH; neither writes a row
 */
import { existsSync, readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { Checks, compiledBundle, type Context, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";
import { lit, psql } from "./bob26.test";
import { pilihKonteksCookie, tersusun } from "./konteks-uji";

const ADMIN = { email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" };
const SYS = { email: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" };
const SISWA = { email: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" };
const CTK = /CTK-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}/;

/** A school admin's session in Mengelola at their school: a staff print is the working context's (§2.11). */
async function masukMengelola(ctx: Context, p: { email: string; password: string }, sekolah: string): Promise<string> {
  const cookie = await masuk(ctx, p);
  await pilihKonteksCookie(ctx.appUrl!, cookie, `MENGELOLA:${sekolah}`);
  return cookie;
}

async function masuk(ctx: Context, p: { email: string; password: string }): Promise<string> {
  const jar = new Map<string, string>();
  const client = createServerClient(ctx.supabaseUrl!, ctx.supabaseAnonKey!, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { error } = await client.auth.signInWithPassword(p);
  if (error) throw new Error(`sign-in failed for ${p.email}: ${error.message}`);
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

/** The server action's id for an exported function of a file, from the production build's manifest (null when absent). */
function idAksi(ctx: Context, berkas: string, nama: string): string | null {
  const p = compiledBundle(ctx, "server", "server-reference-manifest.json");
  if (!existsSync(p)) return null;
  const m = JSON.parse(readFileSync(p, "utf8")) as { node?: Record<string, { filename?: string; exportedName?: string }> };
  for (const [id, a] of Object.entries(m.node ?? {})) if ((a.filename ?? "").endsWith(berkas) && (a.exportedName ?? nama) === nama) return id;
  return null;
}

/** «Cetak laporan» as the button sends it: the action, from the page, with the page's cookies; its answer as JSON. */
async function tekan(ctx: Context, cookie: string, jalan: string, permintaan: unknown): Promise<Record<string, unknown> | null> {
  const aksi = idAksi(ctx, "src/app/laporan/cetak/actions.ts", "cetakLaporan");
  if (!aksi) return null;
  const r = await fetch(`${ctx.appUrl}${jalan}`, { method: "POST", redirect: "manual",
    headers: { "next-action": aksi, origin: ctx.appUrl!, cookie, accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" },
    body: JSON.stringify([permintaan]) });
  const teks = await r.text();
  const m = /^1:(\{.*\})$/m.exec(teks);
  try { return m ? JSON.parse(m[1]) : { tak_terbaca: teks.slice(0, 200), status: r.status }; } catch { return { tak_terbaca: teks.slice(0, 200) }; }
}

const titik = () => Number(psql("select case when is_called then last_value else last_value - 1 end from public.accountability_events_id_seq"));
const baris = (dari: number) => JSON.parse(psql(`select coalesce(json_agg(row_to_json(e) order by e.id), '[]') from public.accountability_events e where e.id > ${dari} and e.kind = 'PRINT_REQUEST'`)) as
  Array<{ id: number; person_id: string; institution_ids: string[]; resource: Record<string, string>; print_ref: string }>;
function buang(dari: number): string {
  psql(`begin; set local session_replication_role = replica; delete from public.accountability_events where id > ${dari} and kind = 'PRINT_REQUEST'; commit;`);
  return psql(`select count(*) from public.accountability_events where id > ${dari} and kind = 'PRINT_REQUEST'`);
}
const simpulSekolah = (slug: string) => psql(`select o.id from public.org_nodes o join public.institutions i on i.id = o.institution_id
  where i.is_synthetic and i.slug like ${lit(slug + "%")} and o.kind = 'INSTITUTION' order by i.created_at desc limit 1`);
const sekolahDari = (slug: string) => psql(`select i.id from public.institutions i where i.is_synthetic and i.slug like ${lit(slug + "%")} order by i.created_at desc limit 1`);
const orangDari = (email: string) => psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)}`);

export const b2AppTests: SelfTest[] = [
  {
    id: "B2-A01",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      const cookie = await masukMengelola(ctx, ADMIN, sekolahDari("synth-alpha-"));
      const S = simpulSekolah("synth-alpha-"), A = sekolahDari("synth-alpha-"), P = orangDari(ADMIN.email);
      const nama = psql(`select display_name from public.persons where id = ${lit(P)}`);
      const lain = orangDari(SISWA.email);
      const dari = titik();
      try {
        const h = await tekan(ctx, cookie, `/dekan/ringkasan?simpul=${S}`, { laporan: "ringkasan.simpul", simpul: S });
        if (!c.expect(h !== null, "the build's server-action manifest names no cetakLaporan")) return c.verdict("");
        const b = baris(dari);
        c.expect(h?.ok === true && typeof h?.ref === "string" && CTK.test(String(h.ref)), `the press answered ${JSON.stringify(h)}`);
        c.expect(b.length === 1 && b[0].print_ref === h?.ref, `one press left ${b.length} print row(s) (${b.map((x) => x.print_ref).join(", ")}); the answer named ${h?.ref}`);
        c.expect(b[0]?.person_id === P && JSON.stringify(b[0]?.institution_ids) === JSON.stringify([A])
          && b[0]?.resource?.report === "ringkasan.simpul" && b[0]?.resource?.node_id === S,
          `the row: ${JSON.stringify(b[0])} (expected the requester, {Alpha}, the report and its node)`);
        c.expect(h?.nama === nama && /pukul \d{2}\.\d{2} WI(B|TA|T)$/.test(String(h?.waktu)), `the footer's words: «${h?.nama}» (the platform holds «${nama}»), «${h?.waktu}»`);
        // Sharon's change 1: what the request carries about a person is not read
        const n = titik();
        const h2 = await tekan(ctx, cookie, `/dekan/ringkasan?simpul=${S}`, { laporan: "ringkasan.simpul", simpul: S, person_id: lain, authUserId: "00000000-0000-0000-0000-000000000000" });
        const b2 = baris(n);
        c.expect(h2?.ok === true && b2.length === 1 && b2[0].person_id === P, `a request carrying another person's id wrote ${JSON.stringify(b2.map((x) => x.person_id))} (expected the session's own ${P})`);
        c.expect(h2?.ref !== h?.ref, "two presses gave one reference");
      } finally {
        c.expect(buang(dari) === "0", "the test's print rows are still there");
      }
      return c.verdict("a press as Alpha's admin wrote exactly one PRINT_REQUEST, Alpha's, naming the report, its node and the admin; the answer carried that row's reference, the name the platform holds and the instant on the school's clock; a request carrying another person's and another user's id wrote as the session's user; each press its own reference; every row removed");
    },
  },
  {
    id: "B2-A02",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      const cookie = await masukMengelola(ctx, ADMIN, sekolahDari("synth-alpha-"));
      const S = simpulSekolah("synth-alpha-");
      const gagal = () => Number(psql(`select coalesce(sum(n), 0) from public.accountability_write_failures where kind = 'PRINT_REQUEST'`));
      const dari = titik(); const g0 = gagal();
      psql(`create or replace function public.b2_uji_tolak() returns trigger language plpgsql as $f$ begin raise exception 'B2-A02 planted writer failure'; end $f$;
        create trigger b2_uji_tolak before insert on public.accountability_events for each row execute function public.b2_uji_tolak();`);
      try {
        const h = await tekan(ctx, cookie, `/dekan/ringkasan?simpul=${S}`, { laporan: "ringkasan.simpul", simpul: S });
        if (!c.expect(h !== null, "the build's server-action manifest names no cetakLaporan")) return c.verdict("");
        c.expect(h?.ok === false && h?.kode === "CETAK_GAGAL", `a failing writer answered ${JSON.stringify(h)} (expected CETAK_GAGAL)`);
        c.expect(baris(dari).length === 0, "a failing writer still left a print row");
        c.expect(gagal() === g0 + 1, `the failure was counted ${gagal() - g0} time(s)`);
      } finally {
        psql("drop trigger if exists b2_uji_tolak on public.accountability_events; drop function if exists public.b2_uji_tolak();");
        psql(`update public.accountability_write_failures set n = n - 1 where kind = 'PRINT_REQUEST' and day = (now() at time zone 'Asia/Jakarta')::date and n > 1;
          delete from public.accountability_write_failures where kind = 'PRINT_REQUEST' and day = (now() at time zone 'Asia/Jakarta')::date and n = 1 and ${g0} = 0;`);
        c.expect(buang(dari) === "0", "the test's print rows are still there");
      }
      return c.verdict("with the writer failing, the press answered CETAK_GAGAL (the page opens no dialog and says so), wrote nothing and counted the failure once; the planted trigger and the count were removed");
    },
  },
  {
    id: "B2-A03",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      const cookie = await masukMengelola(ctx, ADMIN, sekolahDari("synth-alpha-"));
      const lain = simpulSekolah("synth-beta-");
      const dari = titik();
      try {
        const h = await tekan(ctx, cookie, `/dekan/ringkasan?simpul=${lain}`, { laporan: "ringkasan.simpul", simpul: lain });
        if (!c.expect(h !== null, "the build's server-action manifest names no cetakLaporan")) return c.verdict("");
        c.expect(h?.ok === false && h?.kode === "CETAK_TIDAK_BOLEH", `Alpha's admin printing Beta's summary answered ${JSON.stringify(h)}`);
        const h2 = await tekan(ctx, cookie, "/dekan/ringkasan", { laporan: "laporan.lain", simpul: lain });
        c.expect(h2?.ok === false && h2?.kode === "CETAK_TIDAK_BOLEH", `an unknown report answered ${JSON.stringify(h2)}`);
        c.expect(baris(dari).length === 0, "a refused print left a row");
      } finally {
        c.expect(buang(dari) === "0", "the test's print rows are still there");
      }
      return c.verdict("a press for another school's summary, and one naming a report that does not print, were refused CETAK_TIDAK_BOLEH and wrote nothing");
    },
  },
  {
    id: "B2-A06",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      const alpha = sekolahDari("synth-alpha-"), beta = simpulSekolah("synth-beta-");
      const dari = titik();
      try {
        // the platform admin holds Mengelola at every school, Beta's included: the context's own answer
        const sys = await masukMengelola(ctx, SYS, alpha);
        const h = await tekan(ctx, sys, `/dekan/ringkasan?simpul=${beta}`, { laporan: "ringkasan.simpul", simpul: beta });
        if (!c.expect(h !== null, "the build's server-action manifest names no cetakLaporan")) return c.verdict("");
        c.expect(h?.ok === false && h?.kode === "CETAK_KONTEKS_LAIN", `the platform admin in Alpha's context printing Beta's summary answered ${JSON.stringify(h)} (expected CETAK_KONTEKS_LAIN: Beta is one of their own contexts)`);
        // Alpha's admin holds no context at Beta: the general refusal, which tells them nothing about Beta
        const adm = await masukMengelola(ctx, ADMIN, alpha);
        const h2 = await tekan(ctx, adm, `/dekan/ringkasan?simpul=${beta}`, { laporan: "ringkasan.simpul", simpul: beta });
        c.expect(h2?.ok === false && h2?.kode === "CETAK_TIDAK_BOLEH", `Alpha's admin printing Beta's summary answered ${JSON.stringify(h2)} (expected CETAK_TIDAK_BOLEH: no context of theirs at Beta)`);
        c.expect(baris(dari).length === 0, "a refused print left a row");
      } finally {
        c.expect(buang(dari) === "0", "the test's print rows are still there");
      }
      return c.verdict("a print refused for the working context answered CETAK_KONTEKS_LAIN (Daisy's line with the chooser) where the report's school is one of the person's own contexts, and CETAK_TIDAK_BOLEH where it is not; neither wrote a row");
    },
  },
  {
    id: "B2-A04",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      const cookie = await masukMengelola(ctx, ADMIN, sekolahDari("synth-alpha-"));
      const S = simpulSekolah("synth-alpha-");
      const r = await fetch(`${ctx.appUrl}/dekan/ringkasan?simpul=${S}`, { headers: { cookie }, redirect: "manual" });
      const html = tersusun(await r.text());
      const gaya = /<style data-kaki-cetak="">([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "";
      const pendek = t("laporan.cetak.kaki.pendek", "staff");
      c.expect(r.status === 200, `the school summary answered ${r.status}`);
      c.expect(gaya.includes(JSON.stringify(pendek)) && /@page laporan \{ @bottom-left/.test(gaya), `the default footer is not the short browser line: «${gaya.slice(0, 200)}»`);
      c.expect(!CTK.test(html), "the page as served carries reference-shaped text");
      c.expect(!/Dicetak oleh|oleh \{nama\}/.test(gaya), "the default footer names a person");
      c.expect(html.includes(`>${t("laporan.cetak", "staff")}</button>`), "«Cetak laporan» is not offered on a report with figures");
      return c.verdict("the summary as served: the footer is the short browser line, names no person, and nothing reference-shaped is on the page; «Cetak laporan» is offered");
    },
  },
  {
    id: "B2-A05",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      // a learner of Alpha with no finished result, as the page reads it
      const P = orangDari(SISWA.email);
      const ada = Number(psql(`select count(*) from public.hasil_belajar_sesi_orang(${lit(P)}) where keadaan <> 'BERJALAN'`));
      const cookie = await masuk(ctx, SISWA);
      const r = await fetch(`${ctx.appUrl}/belajar/hasil`, { headers: { cookie }, redirect: "manual" });
      const html = tersusun(await r.text());
      const tombol = html.includes(`>${t("laporan.cetak", "learner")}</button>`);
      c.expect(r.status === 200, `/belajar/hasil answered ${r.status}`);
      c.expect(ada > 0 ? tombol : !tombol, `${ada} chapter(s) with a result, and «Cetak laporan» ${tombol ? "is" : "is not"} offered`);
      if (ada > 0) c.note(`${SISWA.email} has ${ada} result(s) in this stack: the button's presence was checked, its absence was not`);
      return c.verdict(ada > 0 ? "a learner with results is offered «Cetak laporan»" : "a learner with no finished result is not offered «Cetak laporan» (the report has nothing in it)");
    },
  },
];
