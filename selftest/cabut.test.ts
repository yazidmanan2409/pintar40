/**
 * CABUT (owner, 9 Nov, acceptance principle B): A SCHOOL ENDS AN EDUCATOR'S AUTHORITY THERE AT ONCE, WITHOUT TOUCHING
 * THEIR PINTAR IDENTITY.
 *
 *  CABUT-A01  the running app, Auth and PostgREST (CI), two sessions at the same time:
 *    1. an educator who teaches Kelas 5A at Alpha and a class at Beta is signed in and working in «Mengajar» at Alpha;
 *    2. Alpha's Admin sekolah, signed in in a browser of their own, revokes the Alpha role with a reason (revoke_role,
 *       the act «Konfigurasi · Peran» asks the database for, with the admin's own token);
 *    3. the educator's very next requests, from the same still-open browser and the same token, are refused by the
 *       server: the class page and the Alpha working context, and PostgREST's reads of Alpha's structure and of Kelas
 *       5A's placements;
 *    4. their Beta role is untouched: the Beta context opens and Beta's class reads;
 *    5. nothing is erased: the revoked row stays (who, when, why), role.granted and role.revoked are both audited, the
 *       person, the account and the session stand (the identity is not suspended), and a fresh sign-in still works.
 *
 * Nothing new grants or refuses anything: authority is role_assignments read on every request (has_scope, RLS), and the
 * working context is re-checked against the grants as they are now (konteks_saya, 20261210100000).
 */
import { randomBytes } from "node:crypto";
import { Checks, type SelfTest } from "./lib";
import { daftar, ipUji, lit, psql } from "./bob26.test";
import { aktifkan } from "./bob28.test";
import { Komputer } from "./bob29.test";
import { pilihKonteksPeramban } from "./konteks-uji";

type Ctx = { url: string; anon: string };

async function rest(k: Ctx, akses: string, jalur: string, isi?: unknown): Promise<{ status: number; body: unknown }> {
  const r = await fetch(`${k.url}/rest/v1/${jalur}`, {
    method: isi === undefined ? "GET" : "POST",
    headers: { apikey: k.anon, authorization: `Bearer ${akses}`, "content-type": "application/json" },
    body: isi === undefined ? undefined : JSON.stringify(isi),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const banyak = (r: { status: number; body: unknown }) => (r.status === 200 && Array.isArray(r.body) ? r.body.length : -1);

export const cabutAppTests: SelfTest[] = [
  {
    id: "CABUT-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const k: Ctx = { url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" };
      if (!c.expect(k.url !== "" && k.anon !== "", "the test needs the API's address and anon key")) return c.verdict("");
      const tag = randomBytes(4).toString("hex");
      const email = `cabut-${tag}@local.invalid`;
      const nama = `Guru Cabut ${tag}`;

      // the educator: EDUCATOR on Alpha's Kelas 5A («Orang baru», as BOB-28 makes one), then a class at Beta
      const orang = await daftar(asal, nama, email);
      const [alpha, kelasA, beta, kelasB] = psql(`
        with a as (select ra.institution_id, ra.scope_node_id from public.role_assignments ra
                    where ra.person_id = ${lit(orang)} and ra.role = 'EDUCATOR' limit 1),
             b as (select n.institution_id, n.id from public.org_nodes n, a
                    where n.kind = 'CLASS' and n.is_active and n.institution_id <> a.institution_id
                      and exists (select 1 from public.institutions i where i.id = n.institution_id and i.is_active and i.slug like 'synth-beta-%')
                    order by n.created_at limit 1)
        select a.institution_id || '|' || a.scope_node_id || '|' || b.institution_id || '|' || b.id from a, b`).split("|");
      if (!c.expect([alpha, kelasA, beta, kelasB].every((x) => /^[0-9a-f-]{36}$/.test(x ?? "")), "the fixture has no Alpha class and Beta class")) return c.verdict("");
      psql(`do $$ begin
        perform set_config('app.seed_intent', 'synthetic', true);
        insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
        values (${lit(orang)}, 'EDUCATOR', ${lit(kelasB)}, ${lit(beta)}, now() - interval '1 day', now() + interval '365 days');
      end $$`);
      // a learner of the test's own in Kelas 5A, so the class has someone to show (and to hide)
      const muridA = `Murid Cabut ${tag}`;
      psql(`do $$ declare v_p uuid; v_e uuid; v_per uuid; begin
        perform set_config('app.seed_intent', 'synthetic', true);
        select n.academic_period_id into v_per from public.org_nodes n where n.id = ${lit(kelasA)};
        insert into public.persons (display_name) values (${lit(muridA)}) returning id into v_p;
        insert into public.enrollments (person_id, institution_id, academic_period_id, status)
        values (v_p, ${lit(alpha)}, v_per, 'PENDING') returning id into v_e;
        insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, ${lit(kelasA)}, v_per);
      end $$`);
      const peranA = psql(`select id from public.role_assignments where person_id = ${lit(orang)} and scope_node_id = ${lit(kelasA)} and revoked_at is null`);
      const sandi = await aktifkan(c, asal, email, `cabut.${tag}`, "4826");
      if (!sandi) return c.verdict("");

      // 1. the educator works at Alpha
      const guru = new Komputer(asal, ipUji());
      const m = await guru.jsonDari("/masuk/password", { form: { identitas: email, password: sandi, lanjut: "/mengajar" } });
      if (!c.expect(m.status === 200, `the educator could not sign in (${m.status})`)) return c.verdict("");
      await guru.halaman("/mengajar"); // the first page makes the session's row; then it is declared personal
      await guru.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      await pilihKonteksPeramban(guru, `MENGAJAR:${alpha}`);
      const kelasSebelum = await guru.halaman(`/mengajar/${kelasA}`);
      const htmlSebelum = await kelasSebelum.text();
      const tokenGuru = guru.sesi();
      if (!c.expect(kelasSebelum.status === 200 && tokenGuru !== null, `before: Kelas 5A answered ${kelasSebelum.status} ${kelasSebelum.headers.get("location") ?? ""}`)) return c.verdict("");
      const strukturSebelum = banyak(await rest(k, tokenGuru!.access, `org_nodes?select=id&institution_id=eq.${alpha}`));
      const tempatSebelum = banyak(await rest(k, tokenGuru!.access, `memberships?select=id&node_id=eq.${kelasA}&valid_to=is.null`));
      c.expect(strukturSebelum > 0 && tempatSebelum > 0, `before: the educator reads ${strukturSebelum} Alpha node(s) and ${tempatSebelum} placement(s) of Kelas 5A`);
      c.expect(htmlSebelum.includes(muridA), `before: Kelas 5A's page does not show its learner «${muridA}»`);

      // 2. Alpha's admin, in a browser of their own, ends the Alpha role with a reason
      const admin = new Komputer(asal, ipUji());
      const ma = await admin.jsonDari("/masuk/password", { form: { identitas: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" } });
      if (!c.expect(ma.status === 200, `Alpha's admin could not sign in (${ma.status})`)) return c.verdict("");
      await admin.halaman("/konfigurasi");
      await admin.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      await pilihKonteksPeramban(admin, `MENGELOLA:${alpha}`);
      await admin.halaman("/konfigurasi");
      const tokenAdmin = admin.sesi();
      const alasan = `Tidak lagi mengajar di sekolah ini (uji ${tag})`;
      const cabut = await rest(k, tokenAdmin?.access ?? "", "rpc/revoke_role", { p_assignment: peranA, p_reason: alasan });
      if (!c.expect(cabut.status === 204 || cabut.status === 200, `the revocation answered ${cabut.status} ${JSON.stringify(cabut.body)}`)) return c.verdict("");

      // 3. the educator's next requests, same browser, same token: refused by the server
      const kelasSesudah = await guru.halaman(`/mengajar/${kelasA}`);
      const htmlSesudah = await kelasSesudah.text();
      c.expect(!(kelasSesudah.status === 200 && htmlSesudah.includes(muridA)), `after: Kelas 5A still shows «${muridA}» (${kelasSesudah.status})`);
      const strukturSesudah = banyak(await rest(k, tokenGuru!.access, `org_nodes?select=id&institution_id=eq.${alpha}`));
      const tempatSesudah = banyak(await rest(k, tokenGuru!.access, `memberships?select=id&node_id=eq.${kelasA}&valid_to=is.null`));
      c.expect(strukturSesudah === 0 && tempatSesudah === 0,
        `after: the same token still reads ${strukturSesudah} Alpha node(s) and ${tempatSesudah} placement(s) of Kelas 5A`);
      const konteks = await rest(k, tokenGuru!.access, "rpc/konteks_saya", {});
      c.expect((konteks.body as { keadaan?: string } | null)?.keadaan !== "ADA",
        `after: the Alpha working context is still held: ${JSON.stringify(konteks.body)}`);

      // 4. Beta is untouched
      await pilihKonteksPeramban(guru, `MENGAJAR:${beta}`);
      const kelasBeta = await guru.halaman(`/mengajar/${kelasB}`);
      c.expect(kelasBeta.status === 200, `after: the Beta class answered ${kelasBeta.status}`);
      c.expect(banyak(await rest(k, tokenGuru!.access, `org_nodes?select=id&institution_id=eq.${beta}`)) > 0, "after: Beta's structure is no longer readable");

      // 5. nothing erased; the identity stands
      const baris = psql(`select (ra.revoked_at is not null) || '|' || coalesce(ra.revoked_reason, '') || '|' ||
                                 (ra.revoked_by = (select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id
                                                    where u.email = 'alpha-admin@synthetic.pintar.test'))::text
                            from public.role_assignments ra where ra.id = ${lit(peranA)}`);
      c.expect(baris === `true|${alasan}|true`, `the revoked row reads ${baris}`);
      const jejak = psql(`select string_agg(action, ',' order by action) from public.audit_log
                           where target_table = 'role_assignments' and target_id = ${lit(peranA)}`);
      c.expect(jejak === "role.granted,role.revoked", `the role's audit reads ${jejak}`);
      c.expect(psql(`select summary ->> 'reason' from public.audit_log where target_id = ${lit(peranA)} and action = 'role.revoked'`) === alasan,
        "role.revoked does not carry the reason");
      const identitas = psql(`select count(*) from public.persons p join public.accounts a on a.person_id = p.id
                               join auth.users u on u.id = a.auth_user_id
                               where p.id = ${lit(orang)} and u.banned_until is null and u.deleted_at is null`);
      const sesiMasih = psql(`select count(*) from public.device_sessions where session_id = ${lit(tokenGuru!.id)} and ended_at is null`);
      c.expect(identitas === "1" && sesiMasih === "1", `the identity or the session was suspended (person+account ${identitas}, session ${sesiMasih})`);
      const lagi = await new Komputer(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: email, password: sandi } });
      c.expect(lagi.status === 200, `a fresh sign-in after the revocation answered ${lagi.status}`);

      return c.verdict(
        `an educator signed in at Alpha read Kelas 5A (its learner on the page; ${strukturSebelum} node(s), ${tempatSebelum} placement(s) through PostgREST); ` +
        "Alpha's admin, in another browser, revoked the Alpha role with a reason; the educator's next requests with the same browser " +
        "and token were refused (the class page without its learners, 0 Alpha nodes, 0 placements, the Alpha context cleared); the " +
        "Beta context and class still answer; the revoked row keeps who, when and why, role.granted and role.revoked are both " +
        "audited, the person, the account (not banned) and the session stand, and a fresh sign-in works",
      );
    },
  },
];
