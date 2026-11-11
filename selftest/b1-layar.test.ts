/**
 * B1 · ACCOUNTABILITY EVENTS through the running app (docs/completion-4.1/batches/B1-COMPLETION.md, «Tests»; THE PLAN
 * §5.1 H «App» and «Rendered»), against real Auth, PostgREST and the mail sink. Each test commits what it does (people,
 * sessions, events) and ends by proving it is gone (THE PLAN §4.1 P3): no live role, no session, no event row of its own.
 *
 *   B1-A01  every sign-in path of THE PLAN's table C and the sign-out, with the seeded teacher and class card: a password
 *           (a wrong one twice: two rows; a name nobody has; the right one), the class card (a wrong PIN; the right one),
 *           a recovery code that does not match, a PINTAR ID nobody holds and a malformed one, a new password with no
 *           grant, a sign-in link that could not be used at the callback, and sign-out from each browser. Each request
 *           leaves exactly one row with its kind, method, the route's own code, the person when the identifier named
 *           one, a hash on a failure only, and the /24 of the address it came from. Then a scan over every text column
 *           of those rows finds no password, PIN, code, card number, typed name or full address.
 *   B1-A03  the paths that need the mail sink, with a person activated for the test: the right recovery code and its new
 *           password, a wrong PIN for the person's own ID (found by the ID), the right PIN and its new password, and
 *           sign-out: one row each, no secret.
 *   B1-A02  a writer that fails (a trigger planted on the store for the test) does not block a sign-in or a sign-out:
 *           both answer as ever, nothing is written, each failure is counted, and the health read reports the count.
 *   B1-L01  «Catatan masuk dan cetak» through the running app: a teacher is refused; a school's administrator reads their
 *           own sign-in by name, with no network origin; the platform administrator reads it with the /24; a reference
 *           not there says the purged reference's own sentence; no match says so; «Jejak audit» links to it.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, visibleText, type SelfTest } from "./lib";
import { t } from "../src/lib/hle";
import { Peramban, daftar, ipUji, kodeDari, lit, psql, sandiBagas, sinkTunggu } from "./bob26.test";
import { aktifkan, cobaPin, pintarIdDari } from "./bob28.test";
import { pilihKonteksPeramban } from "./konteks-uji";

type Baris = { id: number; kind: string; method: string | null; outcome: string; person_id: string | null; identifier_hash: string | null;
  institution_ids: string[]; network_origin: string | null; resource: unknown; print_ref: string | null };

/** Where the store's ids stand now (the sequence, not the rows: a purge leaves no row to read it from). */
const titik = () => Number(psql("select case when is_called then last_value else last_value - 1 end from public.accountability_events_id_seq"));
/** How many rows were written after `dari` (one request, one row). */
const sejak = (dari: number) => Number(psql(`select count(*) from public.accountability_events where id > ${dari}`));
const baris = (dari: number): Baris[] => JSON.parse(psql(`select coalesce(json_agg(row_to_json(e) order by e.id), '[]') from public.accountability_events e where e.id > ${dari}`));
const personDari = (email: string) => psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(email)}`);
const asal24 = (ip: string) => ip.split(".").slice(0, 3).join(".") + ".0/24";

/** The server action's id for an exported function of a file, from the production build's manifest (null when absent). */
function idAksi(repoRoot: string, berkas: string, nama: string): string | null {
  const p = join(repoRoot, ".next", "server", "server-reference-manifest.json");
  if (!existsSync(p)) return null;
  const m = JSON.parse(readFileSync(p, "utf8")) as { node?: Record<string, { workers?: Record<string, unknown>; exportedName?: string; filename?: string }> };
  for (const [id, a] of Object.entries(m.node ?? {})) {
    if ((a.filename ?? "").endsWith(berkas) && (a.exportedName ?? nama) === nama) return id;
  }
  return null;
}

/** P3: the test's rows gone, past the guard (the harness's own hand, never a product path), and proven gone. */
function buangBaris(dari: number): string {
  psql(`begin; set local session_replication_role = replica; delete from public.accountability_events where id > ${dari}; commit;`);
  return psql(`select count(*) from public.accountability_events where id > ${dari}`);
}

export const b1AppTests: SelfTest[] = [
  {
    id: "B1-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const GURU = { email: "alpha-guru@synthetic.pintar.test", sandi: "Sintetis-AlphaGuru-52!" };
      const orang = personDari(GURU.email);
      const kartu = psql("select a.person_id from public.accounts a where a.card_number = '7001'");
      const mulai = psql("select now()::text");
      const awal = titik();
      const langkah: Array<[string, number]> = [];
      let terakhir = 0;
      /** one request, one row: the rows this step wrote */
      const satu = (nama: string) => { const n = sejak(awal); langkah.push([nama, n - terakhir]); terakhir = n; };
      const tag = randomBytes(3).toString("hex");
      const tiadaId = `ZZ${randomBytes(4).toString("hex").toUpperCase().replace(/[^0-9A-HJKMNP-TV-Z]/g, "Z").slice(0, 6)}`;
      const rahasia: string[] = [GURU.sandi, GURU.email, "alpha-guru", "7001", "2468", "1357", "Salah-Sekali-1", `tiada.${tag}`, tiadaId, "482913"];
      const ip: string[] = [];
      const b = () => { const x = ipUji(); ip.push(x); return new Peramban(asal, x); };
      let aksi: string | null = null;
      try {
        c.expect(psql(`select count(*) from public.persons where pintar_id = ${lit(tiadaId)}`) === "0", `the ID nobody holds is somebody's (${tiadaId})`);
        // 1. a password: wrong twice (two attempts, two rows), a name nobody has, the right one; then sign-out
        const p = b();
        const salah1 = await p.jsonDari("/masuk/password", { form: { identitas: GURU.email, password: "Salah-Sekali-1" } }); satu("password salah 1");
        const salah2 = await p.jsonDari("/masuk/password", { form: { identitas: GURU.email, password: "Salah-Sekali-1" } }); satu("password salah 2");
        const tiada = await p.jsonDari("/masuk/password", { form: { identitas: `tiada.${tag}`, password: "Salah-Sekali-1" } }); satu("nama tiada");
        const benar = await p.jsonDari("/masuk/password", { form: { identitas: GURU.email, password: GURU.sandi } }); satu("password benar");
        c.expect(salah1.status === 401 && salah2.status === 401 && tiada.status === 401 && benar.status === 200,
          `the password door answered ${[salah1, salah2, tiada, benar].map((x) => x.status).join(", ")}`);
        const k1 = await p.kirim("/keluar", { method: "POST" }); satu("keluar password");
        c.expect(k1.status === 303, `sign-out answered ${k1.status}`);
        // 2. the class card: a wrong PIN, the right one; then sign-out
        const k = b();
        const kSalah = await k.jsonDari("/masuk/kartu", { form: { kartu: "7001", pin: "1357" } }); satu("kartu salah");
        const kBenar = await k.jsonDari("/masuk/kartu", { form: { kartu: "7001", pin: "2468" } }); satu("kartu benar");
        c.expect(kSalah.status === 401 && kSalah.body?.code === "CARD_NOT_MATCHED" && kBenar.status === 200, `the card door answered ${kSalah.status} ${JSON.stringify(kSalah.body)}, ${kBenar.status}`);
        await k.kirim("/keluar", { method: "POST" }); satu("keluar kartu");
        // 3. a recovery code that does not match, for the teacher's address (the account is found; the code is not)
        const z = b();
        const kodeSalah = await z.jsonDari("/masuk/lupa/periksa", { form: { nama: GURU.email, kode: "482 913" } }); satu("kode salah");
        // 4. the PINTAR ID and PIN: an ID nobody holds with a PIN, a malformed ID
        const w = b();
        const pinSalah = await w.jsonDari("/masuk/lupa/pin", { form: { id: tiadaId, pin: "1357" } }); satu("pin salah");
        const w2 = b();
        const rusak = await w2.jsonDari("/masuk/lupa/pin", { form: { id: "ABC", pin: "1357" } }); satu("id rusak");
        // 5. a new password with no recovery grant
        const tanpaIzin = await w2.jsonDari("/masuk/lupa/password", { form: { password: sandiBagas() } }); satu("password tanpa izin");
        c.expect(kodeSalah.body?.code === "KODE_TIDAK_COCOK" && pinSalah.body?.code === "PIN_TIDAK_COCOK" && rusak.body?.code === "ID_TIDAK_SAH"
          && tanpaIzin.body?.code === "PEMULIHAN_BERAKHIR", `the recovery doors answered ${JSON.stringify([kodeSalah.body, pinSalah.body, rusak.body, tanpaIzin.body])}`);
        // 6. a sign-in link that cannot be used, at the callback (the server action the callback page calls)
        aksi = idAksi(ctx.repoRoot, "src/app/auth/callback/actions.ts", "tukarKode");
        if (aksi) {
          const lIp = ipUji(); ip.push(lIp);
          const r = await fetch(`${asal}/auth/callback`, { method: "POST", headers: { "next-action": aksi, origin: asal, "x-real-ip": lIp,
            accept: "text/x-component", "content-type": "text/plain;charset=UTF-8" }, body: JSON.stringify(["kode-yang-tidak-ada", ""]) });
          await r.text();
          satu("tautan tidak berlaku");
          c.expect(r.status === 200, `the callback's exchange answered ${r.status}`);
        } else {
          c.note("the build's server-action manifest names no tukarKode: the callback's failure was not driven");
        }

        // the rows, one per request
        const lain = langkah.filter(([, n]) => n !== 1);
        c.expect(lain.length === 0, `a request did not leave exactly one row: ${lain.map(([n, x]) => `${n}=${x}`).join(", ")}`);
        const rows = baris(awal);
        const ringkas = rows.map((r) => [r.kind, r.method, r.outcome, r.person_id === orang ? "GURU" : r.person_id === kartu ? "KARTU" : r.person_id ? "LAIN" : "-",
          r.identifier_hash ? "H" : "-", r.network_origin].join(" "));
        const harap = [
          `SIGN_IN_FAILED PASSWORD MASUK_TIDAK_COCOK GURU H ${asal24(ip[0])}`,
          `SIGN_IN_FAILED PASSWORD MASUK_TIDAK_COCOK GURU H ${asal24(ip[0])}`,
          `SIGN_IN_FAILED PASSWORD MASUK_TIDAK_COCOK - H ${asal24(ip[0])}`,
          `SIGN_IN_OK PASSWORD OK GURU - ${asal24(ip[0])}`,
          `SIGN_OUT  OK GURU - ${asal24(ip[0])}`,
          `SIGN_IN_FAILED CARD CARD_NOT_MATCHED KARTU H ${asal24(ip[1])}`,
          `SIGN_IN_OK CARD OK KARTU - ${asal24(ip[1])}`,
          `SIGN_OUT  OK KARTU - ${asal24(ip[1])}`,
          `SIGN_IN_FAILED CODE KODE_TIDAK_COCOK GURU H ${asal24(ip[2])}`,
          `SIGN_IN_FAILED RECOVERY_PIN PIN_TIDAK_COCOK - H ${asal24(ip[3])}`,
          `SIGN_IN_FAILED RECOVERY_PIN ID_TIDAK_SAH - H ${asal24(ip[4])}`,
          `SIGN_IN_FAILED PASSWORD PEMULIHAN_BERAKHIR - - ${asal24(ip[4])}`,
          ...(aksi ? [`SIGN_IN_FAILED LINK TAUTAN_TIDAK_BERLAKU - - ${asal24(ip[5])}`] : []),
        ];
        for (let i = 0; i < Math.max(harap.length, ringkas.length); i++) c.expect(ringkas[i] === harap[i], `row ${i + 1}: «${ringkas[i]}», expected «${harap[i]}»`);
        // a person's row holds their live schools at that instant (the teacher's: Alpha's)
        const sekolahGuru = JSON.parse(psql(`select coalesce(json_agg(x order by x), '[]') from unnest(public.akuntabilitas_sekolah_orang(${lit(orang)}, now())) x`)) as string[];
        c.expect(sekolahGuru.length > 0 && rows.filter((r) => r.person_id === orang).every((r) => JSON.stringify(r.institution_ids) === JSON.stringify(sekolahGuru)),
          `a row of the teacher does not hold their schools (${JSON.stringify(sekolahGuru)})`);
        // the same name, the same hash; different names, different hashes
        const h = rows.filter((r) => r.method === "PASSWORD" && r.outcome === "MASUK_TIDAK_COCOK").map((r) => r.identifier_hash);
        c.expect(h.length === 3 && h[0] === h[1] && h[2] !== h[0], `the hashes of two tries of one name and one of another: ${JSON.stringify(h)}`);
        // no secret in any text column of these rows (kind, method, outcome, origin, resource, reference; the hash whole)
        const teks = rows.map((r) => JSON.stringify([r.kind, r.method, r.outcome, r.network_origin, r.resource, r.print_ref])).join("\n");
        const bocor = [...rahasia.filter((x) => x && teks.toLowerCase().includes(x.toLowerCase())), ...ip.filter((x) => new RegExp(`${x.replace(/\./g, "\\.")}(?![0-9])`).test(teks))];
        c.expect(bocor.length === 0, `a row holds a secret or a full address: ${bocor.join(", ")}`);
        c.expect(rows.every((r) => r.identifier_hash === null || /^[0-9a-f]{64}$/.test(r.identifier_hash)), "a hash is not a 64-character hexadecimal digest");
      } finally {
        // P3: no session of this test, no event row of this test left behind
        const sisa = buangBaris(awal);
        const sesi = psql(`select count(*) from auth.sessions s join public.accounts a on a.auth_user_id = s.user_id where a.person_id in (${lit(orang)}, ${lit(kartu)}) and s.created_at >= ${lit(mulai)}::timestamptz`);
        c.expect(sisa === "0" && sesi === "0", `the test left ${sisa} event row(s) and ${sesi} session(s) behind`);
      }
      return c.verdict("through the running app: a wrong password twice (two rows, one hash), a name nobody has (a hash and nobody), the right "
        + "password, the class card wrong and right, a recovery code that did not match (the account found), a PINTAR ID nobody holds and a "
        + "malformed one, a new password with no grant, " + (aksi ? "a sign-in link that could not be used at the callback, " : "")
        + "and each browser's sign-out: every request left exactly one row with its kind, method, the route's own code, the person where the "
        + "identifier named one, a hash on a failure only and the /24 it came from; no text column holds a password, PIN, code, card number, "
        + "typed name or full address; nothing of the test is left behind");
    },
  },
  {
    id: "B1-A03",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const email = `b1-wati-${tag}@local.invalid`;
      const username = `wati.${tag}`;
      await daftar(asal, "Wati Rahayu", email);
      const sandi = await aktifkan(c, asal, email, username, "2817");
      if (!sandi) return c.verdict("");
      const orang = personDari(email);
      const mulai = psql("select now()::text");
      const awal = titik();
      const langkah: Array<[string, number]> = [];
      let terakhir = 0;
      const satu = (nama: string) => { const n = sejak(awal); langkah.push([nama, n - terakhir]); terakhir = n; };
      const rahasia: string[] = [sandi, email, username, "2817", "1357"];
      const ip: string[] = [];
      const b = () => { const x = ipUji(); ip.push(x); return new Peramban(asal, x); };
      try {
        // the recovery code, right; the new password; sign-out
        const z = b();
        await z.jsonDari("/masuk/lupa/kode", { form: { nama: username } });
        const kode = kodeDari((await sinkTunggu(email, 3)).find((m) => /password baru/i.test(m.Subject)));
        rahasia.push(kode);
        const kodeBenar = await z.jsonDari("/masuk/lupa/periksa", { form: { nama: username, kode } }); satu("kode benar");
        const baru = sandiBagas(); rahasia.push(baru);
        const ganti = await z.jsonDari("/masuk/lupa/password", { form: { password: baru } }); satu("password baru");
        await z.kirim("/keluar", { method: "POST" }); satu("keluar kode");
        // the PINTAR ID with a wrong PIN (the person found by the ID), the right PIN, its new password; sign-out
        const id = pintarIdDari(email);
        const pinSalah = await cobaPin(asal, id, "1357", b()); satu("pin salah");
        const w = b();
        const pinBenar = await w.jsonDari("/masuk/lupa/pin", { form: { id, pin: "2817" } }); satu("pin benar");
        const baru2 = sandiBagas(); rahasia.push(baru2);
        const ganti2 = await w.jsonDari("/masuk/lupa/password", { form: { password: baru2 } }); satu("password baru pin");
        await w.kirim("/keluar", { method: "POST" }); satu("keluar pin");
        c.expect(kodeBenar.status === 200 && ganti.status === 200 && pinSalah.r.body?.code === "PIN_TIDAK_COCOK" && pinBenar.status === 200 && ganti2.status === 200,
          `the recovery doors answered ${kodeBenar.status}, ${ganti.status}, ${JSON.stringify(pinSalah.r.body)}, ${pinBenar.status}, ${ganti2.status}`);
        const lain = langkah.filter(([, n]) => n !== 1);
        c.expect(lain.length === 0, `a request did not leave exactly one row: ${lain.map(([n, x]) => `${n}=${x}`).join(", ")}`);
        const rows = baris(awal);
        const ringkas = rows.map((r) => [r.kind, r.method, r.outcome, r.person_id === orang ? "WATI" : r.person_id ? "LAIN" : "-", r.identifier_hash ? "H" : "-", r.network_origin].join(" "));
        const harap = [
          `SIGN_IN_OK CODE OK WATI - ${asal24(ip[0])}`, `SIGN_IN_OK PASSWORD OK WATI - ${asal24(ip[0])}`, `SIGN_OUT  OK WATI - ${asal24(ip[0])}`,
          `SIGN_IN_FAILED RECOVERY_PIN PIN_TIDAK_COCOK WATI H ${asal24(ip[1])}`, `SIGN_IN_OK RECOVERY_PIN OK WATI - ${asal24(ip[2])}`,
          `SIGN_IN_OK PASSWORD OK WATI - ${asal24(ip[2])}`, `SIGN_OUT  OK WATI - ${asal24(ip[2])}`,
        ];
        for (let i = 0; i < Math.max(harap.length, ringkas.length); i++) c.expect(ringkas[i] === harap[i], `row ${i + 1}: «${ringkas[i]}», expected «${harap[i]}»`);
        const teks = rows.map((r) => JSON.stringify([r.kind, r.method, r.outcome, r.network_origin, r.resource, r.print_ref])).join("\n");
        const bocor = [...rahasia.filter((x) => x && teks.toLowerCase().includes(x.toLowerCase())), ...ip.filter((x) => new RegExp(`${x.replace(/\./g, "\\.")}(?![0-9])`).test(teks))];
        c.expect(bocor.length === 0, `a row holds a secret or a full address: ${bocor.join(", ")}`);
      } finally {
        psql(`begin; set local session_replication_role = replica;
          update public.role_assignments set revoked_at = now() where person_id = ${lit(orang)} and revoked_at is null; commit;`);
        const sisa = buangBaris(awal);
        const sesi = psql(`select count(*) from auth.sessions s join public.accounts a on a.auth_user_id = s.user_id where a.person_id = ${lit(orang)} and s.created_at >= ${lit(mulai)}::timestamptz`);
        const peran = psql(`select count(*) from public.role_assignments where person_id = ${lit(orang)} and revoked_at is null`);
        c.expect(sisa === "0" && sesi === "0" && peran === "0", `the test left ${sisa} event row(s), ${sesi} session(s) and ${peran} live role(s) behind`);
      }
      return c.verdict("with an activated person and the mail sink: the right recovery code, its new password, a wrong PIN for the person's own "
        + "ID (the person found by the ID), the right PIN and its new password, and each sign-out each left exactly one row as expected; no "
        + "text column holds a secret or a full address; nothing of the test is left behind");
    },
  },
  {
    id: "B1-A02",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const awal = titik();
      const hitung = () => psql("select coalesce(sum(n), 0) from public.accountability_write_failures");
      const gagalAwal = Number(hitung());
      const harian = psql("select coalesce(json_agg(row_to_json(f)), '[]') from public.accountability_write_failures f");
      psql(`create or replace function public.b1_a02_tolak() returns trigger language plpgsql set search_path = public, pg_temp as $f$
              begin raise exception 'B1-A02: the writer fails, as planted'; end $f$;
            revoke all on function public.b1_a02_tolak() from public, anon, authenticated, service_role;
            create trigger b1_a02_tolak before insert on public.accountability_events for each row execute function public.b1_a02_tolak();`);
      try {
        const g = new Peramban(asal, ipUji());
        const m = await g.jsonDari("/masuk/password", { form: { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" } });
        const rumah = await g.kirim("/mulai");
        const keluar = await g.kirim("/keluar", { method: "POST" });
        const sesudah = Number(hitung());
        const sehat = JSON.parse(psql("select public.pintar_periksa_kesehatan()::text")) as { ok: boolean; gagal_tulis_akuntabilitas: { n: number } };
        c.expect(m.status === 200 && rumah.status >= 300 && rumah.status < 400 && keluar.status === 303, `a failing writer blocked the sign-in or sign-out (${m.status}, ${rumah.status}, ${keluar.status})`);
        c.expect(sejak(awal) === 0, "a row was written while the writer fails");
        c.expect(sesudah - gagalAwal === 2 && sehat.ok === false && sehat.gagal_tulis_akuntabilitas.n >= 2,
          `the failures were counted ${sesudah - gagalAwal} time(s); the health read says ${JSON.stringify(sehat)}`);
      } finally {
        psql(`drop trigger if exists b1_a02_tolak on public.accountability_events; drop function if exists public.b1_a02_tolak();`);
        // P3: the count as it was, no event row, no session
        psql(`begin; delete from public.accountability_write_failures;
          insert into public.accountability_write_failures select * from json_populate_recordset(null::public.accountability_write_failures, ${lit(harian)}::json); commit;`);
        const sisa = buangBaris(awal);
        c.expect(Number(hitung()) === gagalAwal && sisa === "0" && psql("select count(*) from pg_trigger where tgname = 'b1_a02_tolak'") === "0",
          `the test left the count at ${hitung()} (was ${gagalAwal}), ${sisa} event row(s) or its trigger behind`);
      }
      return c.verdict("with the writer failing: the sign-in and the sign-out answered as ever, nothing was written, both failures were counted, "
        + "and the health read reports the count; the planted failure, the count and every row of the test are gone afterwards");
    },
  },
  {
    id: "B1-L01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const awal = titik();
      const ipA = ipUji(), ipS = ipUji();
      const admin = new Peramban(asal, ipA), sys = new Peramban(asal, ipS), guru = new Peramban(asal, ipUji());
      try {
        const ma = await admin.jsonDari("/masuk/password", { form: { identitas: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" } });
        const ms = await sys.jsonDari("/masuk/password", { form: { identitas: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" } });
        const mg = await guru.jsonDari("/masuk/password", { form: { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" } });
        if (!c.expect(ma.status === 200 && ms.status === 200 && mg.status === 200, `the three could not sign in (${ma.status}, ${ms.status}, ${mg.status})`)) return c.verdict("");
        await pilihKonteksPeramban(admin, { tujuan: "MENGELOLA" });
        await pilihKonteksPeramban(sys, "MENGELOLA:PLATFORM");
        const halaman = async (b: Peramban, q = "") => { const r = await b.kirim(`/konfigurasi/catatan-masuk${q}`); return { status: r.status, html: await r.text() }; };
        const teks = (h: string) => visibleText(h);
        // a teacher: refused
        const tg = await halaman(guru);
        c.expect(!/data-akuntabilitas=""/.test(tg.html) && (teks(tg.html).includes(t("akuntabilitas.ditolak", "staff")) || (tg.status >= 300 && tg.status < 400)),
          `a teacher reached the record (${tg.status}): ${teks(tg.html).slice(0, 200)}`);
        // the school's admin: their own sign-in, by name, no origin column
        const ta = await halaman(admin);
        const namaAdmin = psql("select p.display_name from public.persons p join public.accounts a on a.person_id = p.id join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-admin@synthetic.pintar.test'");
        const alamatPenuh = (h: string, x: string) => new RegExp(`${x.replace(/\./g, "\\.")}(?![0-9])`).test(h);
        c.expect(ta.status === 200 && /data-akuntabilitas-baris="SIGN_IN_OK"/.test(ta.html) && ta.html.includes(`data-akuntabilitas-orang="">${namaAdmin}<`)
          && !teks(ta.html).includes(t("akuntabilitas.kolom.asal", "staff")) && !ta.html.includes(asal24(ipA)) && !alamatPenuh(ta.html, ipA),
          `the school's admin's page: ${ta.status}; ${teks(ta.html).slice(0, 400)}`);
        c.expect(/class="pin-koleksi pin-akuntabilitas"/.test(ta.html) && /<th scope="row" class="pin-tabel-nama" data-label="/.test(ta.html), "the rows are not the Collection's, labelled for stacking");
        // the platform admin: with the /24, never the address
        const ts = await halaman(sys);
        c.expect(ts.status === 200 && teks(ts.html).includes(t("akuntabilitas.kolom.asal", "staff")) && ts.html.includes(asal24(ipA)) && !alamatPenuh(ts.html, ipA),
          `the platform admin's page does not show the /24 (${asal24(ipA)}): ${ts.status}`);
        // a reference that is not there; no match; the filter by kind
        const hilang = await halaman(admin, "?cari=CTK-0000-0000");
        c.expect(teks(hilang.html).includes(t("akuntabilitas.rujukan_hilang", "staff").split("{tanggal}")[0]) && /data-kosong="tidak_cocok"/.test(hilang.html),
          `a purged reference: ${teks(hilang.html).slice(0, 300)}`);
        const nihil = await halaman(admin, "?cari=tidak-ada-yang-bernama-ini");
        c.expect(teks(nihil.html).includes(t("akuntabilitas.tidak_cocok", "staff")), `no match: ${teks(nihil.html).slice(0, 300)}`);
        const keluar = await halaman(admin, "?jenis=SIGN_OUT");
        c.expect(!/data-akuntabilitas-baris="SIGN_IN_OK"/.test(keluar.html), "the kind filter lets a sign-in through");
        // «Jejak audit» leads to it
        const jejak = await admin.kirim("/konfigurasi/audit");
        c.expect(/data-akuntabilitas-tautan=""><a class="pin-tautan" href="\/konfigurasi\/catatan-masuk">/.test(await jejak.text()), "«Jejak audit» has no way to the record");
      } finally {
        for (const b of [admin, sys, guru]) await b.kirim("/keluar", { method: "POST" }).catch(() => undefined);
        const sisa = buangBaris(awal);
        c.expect(sisa === "0", `the test left ${sisa} event row(s) behind`);
      }
      return c.verdict("a teacher is refused; the school's admin reads their own sign-in by name without any network origin; the platform admin "
        + "reads it with its /24 and never the address; a reference not there says that print records are kept 12 months, from the record's "
        + "start; no match says so; the kind filter holds; «Jejak audit» links to the record; the test's own rows are gone afterwards");
    },
  },
];
