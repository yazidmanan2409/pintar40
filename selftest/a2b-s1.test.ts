/**
 * A2B-S1A — S-1: A CONTEXT CHECK THAT READS NOTHING CHECKS NOTHING (Sharon, A2B-BATCH2-APP-a186b1a7.md, finding S-1;
 * the Chief Architect, 16 Nov 11:51: fixed in batch 2, before the freeze).
 *
 * Konfigurasi's «Akhiri sekarang», «Mulai sekarang» (ubahPemeliharaanAction) and «Tarik pengumuman»
 * (tarikPengumumanAction) decided the working context (§2.11) from a direct read of maintenance_windows or
 * broadcast_notices. A staff client holds no SELECT on either, so the read came back empty, the target had no school,
 * and the context check passed having checked nothing.
 *
 * Executed against the running build, as the browser sends it: each server action is posted with its id from the
 * production build's manifest and the session's cookies. The person is a controller of two schools (Alpha's Admin
 * sekolah, given Beta's for this test), working in Alpha:
 *   1. «Akhiri sekarang» on Beta's window under way, «Mulai sekarang» on Beta's scheduled window, and «Tarik
 *      pengumuman» on Beta's notice are each refused for the context (the chooser, CONTEXT_OTHER_PLACE), and nothing
 *      is written;
 *   2. an unknown window or notice is refused MAINTENANCE_NOT_ALLOWED before any write (fail closed);
 *   3. the control: working in Beta, the same «Akhiri sekarang» ends Beta's window (the refusal was the context's, not
 *      the authority's).
 * The plant is the build before the fix (the direct read), shown red.
 */
import { existsSync, readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";
import { Checks, compiledBundle, type Context, type SelfTest } from "./lib";
import { lit, psql } from "./bob26.test";
import { pilihKonteksCookie } from "./konteks-uji";

const ADMIN = { email: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" };
const ID = (n: string) => `a2b5e100-0000-4000-8000-${n.padStart(12, "0")}`;
const WB = ID("b1"), WB2 = ID("b2"), WA = ID("a1"), NB = ID("e1"), PERAN = ID("f1");

async function masuk(ctx: Context): Promise<string> {
  const jar = new Map<string, string>();
  const client = createServerClient(ctx.supabaseUrl!, ctx.supabaseAnonKey!, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { error } = await client.auth.signInWithPassword(ADMIN);
  if (error) throw new Error(`sign-in failed for ${ADMIN.email}: ${error.message}`);
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

/** The form posted as a browser without script posts it: the action's id as a field, its fields; where it sends you. */
async function kirim(ctx: Context, cookie: string, aksi: string, isian: Record<string, string>): Promise<string> {
  const fd = new FormData();
  fd.set(`$ACTION_ID_${aksi}`, "");
  for (const [k, v] of Object.entries(isian)) fd.set(k, v);
  const r = await fetch(`${ctx.appUrl}/konfigurasi/pemeliharaan`, { method: "POST", body: fd, redirect: "manual", headers: { cookie, origin: ctx.appUrl! } });
  const ke = r.headers.get("location") ?? "";
  return ke ? decodeURIComponent(ke) : `status ${r.status}`;
}

function siapkan(A: string, B: string, sys: string, admin: string): void {
  psql(`begin;
set local session_replication_role = replica;
delete from public.maintenance_windows where id in (${[WB, WB2, WA].map(lit).join(",")});
delete from public.broadcast_notices where id = ${lit(NB)};
delete from public.role_assignments where id = ${lit(PERAN)};
insert into public.role_assignments (id, person_id, role, scope_node_id, institution_id, valid_from, valid_until, granted_by)
values (${lit(PERAN)}, ${lit(admin)}, 'INSTITUTION_ADMIN', ${lit(B)}, ${lit(B)}, now() - interval '1 day', now() + interval '1 day', null);
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, ends_at, reason, created_by_person_id, activation_recorded_at)
values (${lit(WB)}, 'PLANNED', false, array[${lit(B)}]::uuid[], '{}', now() - interval '10 minutes', now() + interval '1 hour', 'S-1 uji', ${lit(sys)}, now() - interval '10 minutes'),
       (${lit(WB2)}, 'PLANNED', false, array[${lit(B)}]::uuid[], '{}', now() + interval '2 hours', now() + interval '3 hours', 'S-1 uji', ${lit(sys)}, null),
       (${lit(WA)}, 'PLANNED', false, array[${lit(A)}]::uuid[], '{}', now() - interval '10 minutes', now() + interval '1 hour', 'S-1 uji', ${lit(sys)}, now() - interval '10 minutes');
insert into public.broadcast_notices (id, platform, institution_ids, message, publish_at, expires_at, created_by_person_id)
values (${lit(NB)}, false, array[${lit(B)}]::uuid[], 'Pengumuman uji S-1', now() - interval '1 hour', now() + interval '1 day', ${lit(sys)});
commit;`);
}
function bersihkan(): string {
  psql(`begin; set local session_replication_role = replica;
delete from public.broadcast_notices where id = ${lit(NB)};
delete from public.maintenance_windows where id in (${[WB, WB2, WA].map(lit).join(",")});
delete from public.role_assignments where id = ${lit(PERAN)};
commit;`);
  return psql(`select (select count(*) from public.maintenance_windows where id in (${[WB, WB2, WA].map(lit).join(",")}))
    + (select count(*) from public.broadcast_notices where id = ${lit(NB)}) + (select count(*) from public.role_assignments where id = ${lit(PERAN)})`);
}
const ditolakKonteks = (ke: string) => /alasan=lain/.test(ke) || /CONTEXT_OTHER_PLACE/.test(ke);

/** A page as the session reads it, its HTML. */
async function halaman(ctx: Context, cookie: string, jalan: string): Promise<string> {
  const r = await fetch(`${ctx.appUrl}${jalan}`, { headers: { cookie }, redirect: "manual" });
  return r.text();
}
/** The address an action sent the person to, as a path and its query. */
const alamat = (ke: string) => { const u = new URL(ke, "http://x"); return { jalan: u.pathname + u.search, q: u.searchParams }; };
/** The one list row of a window, its HTML. */
const barisJendela = (html: string, id: string) => {
  const a = html.indexOf(`data-jendela="${id}"`);
  if (a < 0) return "";
  const b = html.indexOf("</li>", a);
  return html.slice(a, b < 0 ? undefined : b);
};
const teks = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;|\u00a0/g, " ").replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const WK = ID("c1"), WT = ID("c2");

export const a2bS1Tests: SelfTest[] = [
  {
    id: "A2B-B2K",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      // Daisy's batch 2 review (TINJAUAN-A2B-D8-B2-7a079eb2.md at f9ffc948), the Chief Architect: in this batch
      const c = new Checks();
      const A = psql("select id from public.institutions where name = 'Sekolah Sintetis Alpha'");
      const K = psql(`select id from public.org_nodes where institution_id = ${lit(A)} and kind = 'CLASS' and is_active order by name limit 1`);
      const namaK = psql(`select name from public.org_nodes where id = ${lit(K)}`);
      const sys = psql("select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' and revoked_at is null order by id limit 1");
      const admin = psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(ADMIN.email)}`);
      const namaAdmin = psql(`select display_name from public.persons where id = ${lit(admin)}`);
      const jadwal = idAksi(ctx, "src/app/konfigurasi/actions.ts", "jadwalkanPemeliharaanAction");
      const panjang = idAksi(ctx, "src/app/konfigurasi/actions.ts", "perpanjangPemeliharaanAction");
      const umumkan = idAksi(ctx, "src/app/konfigurasi/actions.ts", "terbitkanPengumumanAction");
      if (!c.expect(jadwal !== null && panjang !== null && umumkan !== null, "the build's manifest names no schedule, extend or publish action")) return c.verdict("");
      psql(`begin; set local session_replication_role = replica;
delete from public.maintenance_windows where id in (${lit(WK)}, ${lit(WT)});
insert into public.maintenance_windows (id, kind, platform, institution_ids, node_ids, starts_at, ends_at, reason, reason_code, created_by_person_id, activation_recorded_at)
values (${lit(WK)}, 'PLANNED', false, array[${lit(A)}]::uuid[], array[${lit(K)}]::uuid[], now() - interval '10 minutes', now() + interval '1 hour', 'PEMBARUAN', 'PEMBARUAN', ${lit(admin)}, now() - interval '10 minutes'),
       (${lit(WT)}, 'PLANNED', false, array[${lit(A)}]::uuid[], '{}', now() + interval '1 day', now() + interval '1 day 1 hour', 'Teks bebas lama', null, ${lit(sys)}, null);
commit;`);
      try {
        const cookie = await masuk(ctx);
        await pilihKonteksCookie(ctx.appUrl!, cookie, `MENGELOLA:${A}`);
        // BL-1: a refused schedule keeps every entered value, reopens step two, and draws the alert
        const isi = { asal: "jadwal", sekolah: A, kelas: K, mulai: "2030-01-05T19:00", selesai: "2030-01-05T21:00", pesan: "Pesan uji BL-1", alasan_kode: "LAINNYA", alasan: "", umumkan: "1" };
        const ke1 = alamat(await kirim(ctx, cookie, jadwal!, isi));
        const q1 = ke1.q;
        c.expect(q1.get("kode") === "MAINTENANCE_REASON_INVALID" && q1.get("pm_cek") === "1" && q1.get("pm_sekolah") === A && q1.get("pm_kelas") === K
          && q1.get("pm_mulai") === isi.mulai && q1.get("pm_selesai") === isi.selesai && q1.get("pm_pesan") === isi.pesan
          && q1.get("pm_alasan_kode") === "LAINNYA" && q1.get("pm_umumkan") === "1",
          `BL-1: a refused schedule must come back with every entered value: ${ke1.jalan}`);
        const h1 = await halaman(ctx, cookie, ke1.jalan);
        c.expect(new RegExp(`name="pm_kelas" value="${K}" checked`).test(h1) && new RegExp(`name="kelas" value="${K}"`).test(h1),
          "BL-1: the class stays chosen (its checkbox) and step two carries it");
        c.expect(/name="alasan_kode" value="LAINNYA" checked/.test(h1) && /Pesan uji BL-1<\/textarea>/.test(h1) && /name="umumkan" value="1" checked/.test(h1),
          "BL-1: step two is redrawn with its reason, message and announcement box as entered");
        c.expect(/name="pm_mulai" value="2030-01-05T19:00"/.test(h1) && /name="pm_selesai" value="2030-01-05T21:00"/.test(h1), "BL-1: the times stay in their fields");
        c.expect(/role="alert"/.test(h1) && /data-fokus-peringatan/.test(h1), "BL-1: the refusal is an alert that takes focus");
        // the sweep: the extend's refusal keeps its new end and reason, and its form stays open
        const ke2 = alamat(await kirim(ctx, cookie, panjang!, { asal: "jendela", hal_jendela: "1", jendela: WK, baris: WK, selesai: "2020-01-01T08:00", alasan: "Alasan uji" }));
        c.expect(ke2.q.get("kode") === "MAINTENANCE_EXTEND_NOT_LATER" && ke2.q.get("panjang") === WK && ke2.q.get("pp_selesai") === "2020-01-01T08:00" && ke2.q.get("pp_alasan") === "Alasan uji",
          `the extend's refusal must keep its new end and reason, its form open: ${ke2.jalan}`);
        const h2 = await halaman(ctx, cookie, ke2.jalan);
        c.expect(/data-perpanjang=""/.test(h2) && /name="alasan"[^>]*value="Alasan uji"/.test(h2), "the extend form is open again with its reason");
        // the sweep: the announcement's refusal keeps its scope and message
        const ke3 = alamat(await kirim(ctx, cookie, umumkan!, { asal: "umumkan", sekolah: A, pesan: "Pengumuman uji BL-1", terbit: "", sampai: "" }));
        c.expect(ke3.q.get("kode") === "NOTICE_INPUT_INVALID" && ke3.q.get("pu_sekolah") === A && ke3.q.get("pu_pesan") === "Pengumuman uji BL-1",
          `the announcement's refusal must keep its scope and message: ${ke3.jalan}`);
        const h3 = await halaman(ctx, cookie, ke3.jalan);
        c.expect(new RegExp(`name="sekolah" value="${A}" checked`).test(h3) && /name="pesan"[^>]*value="Pengumuman uji BL-1"/.test(h3), "the announcement form is drawn again as entered");
        // BL-2 and C-5: the row names the class and who scheduled it; a coded reason is «Alasan: …», old text «Alasan (dicatat): …»
        const daftar = await halaman(ctx, cookie, "/konfigurasi/pemeliharaan");
        const bk = teks(barisJendela(daftar, WK)), bt = teks(barisJendela(daftar, WT));
        c.expect(bk.includes(`kelas ${namaK}`) && bk.includes(`Dijadwalkan oleh ${namaAdmin}`), `BL-2: the class window's row must name its class and who scheduled it: «${bk.slice(0, 260)}»`);
        c.expect(bk.includes("Alasan: Pembaruan sistem") && !bk.includes("Alasan (dicatat): Pembaruan sistem") && bt.includes("Alasan (dicatat): Teks bebas lama"),
          `C-5: a coded reason reads «Alasan: …», an old free text «Alasan (dicatat): …»: «${bk.slice(0, 200)}» / «${bt.slice(0, 200)}»`);
        // C-6: «Akhiri sekarang» opens its confirmation with the reason inside the box, and one «Batal»
        const terbuka = barisJendela(await halaman(ctx, cookie, `/konfigurasi/pemeliharaan?ubah=${WK}`), WK);
        const kotak = terbuka.slice(terbuka.indexOf("data-bahaya-tanya"));
        c.expect(terbuka.includes("data-bahaya-tanya") && /name="alasan"/.test(kotak) && (teks(terbuka).match(/\bBatal\b/g) ?? []).length === 1,
          `C-6: the end confirmation must hold the reason field inside its box, with one «Batal»: ${(teks(terbuka).match(/\bBatal\b/g) ?? []).length} «Batal»; field in box ${/name="alasan"/.test(kotak)}`);
      } finally {
        psql(`begin; set local session_replication_role = replica; delete from public.maintenance_windows where id in (${lit(WK)}, ${lit(WT)}) or reason = 'Pengumuman uji BL-1'; commit;`);
        c.expect(psql(`select count(*) from public.maintenance_windows where id in (${lit(WK)}, ${lit(WT)})`) === "0", "the test's windows are still there");
      }
      return c.verdict("Daisy's batch 2 review against the build: a refused schedule keeps its school, class, times, message, reason and announcement box, redraws step two and focuses its alert (BL-1); the extend's refusal keeps its new end and reason with its form open, and the announcement's its scope and message (the sweep); the row names its class and «Dijadwalkan oleh» (BL-2); a coded reason reads «Alasan: …» and old text «Alasan (dicatat): …» (C-5); «Akhiri sekarang» opens with the reason inside its box and one «Batal» (C-6)");
    },
  },
  {
    id: "A2B-S1A",
    requires: ["app", "network", "db", "build"],
    run: async (ctx) => {
      const c = new Checks();
      const A = psql("select id from public.institutions where name = 'Sekolah Sintetis Alpha'");
      const B = psql("select id from public.institutions where name = 'Sekolah Sintetis Beta'");
      const sys = psql("select person_id from public.role_assignments where role = 'SYSTEM_ADMIN' and revoked_at is null order by id limit 1");
      const admin = psql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(ADMIN.email)}`);
      const ubah = idAksi(ctx, "src/app/konfigurasi/actions.ts", "ubahPemeliharaanAction");
      const tarik = idAksi(ctx, "src/app/konfigurasi/actions.ts", "tarikPengumumanAction");
      if (!c.expect(ubah !== null && tarik !== null, "the build's server-action manifest names no ubahPemeliharaanAction or tarikPengumumanAction")) return c.verdict("");
      siapkan(A, B, sys, admin);
      try {
        const cookie = await masuk(ctx);
        await pilihKonteksCookie(ctx.appUrl!, cookie, `MENGELOLA:${A}`);
        // 1. working in Alpha: Beta's window and notice are refused for the context, and nothing is written
        const akhiri = await kirim(ctx, cookie, ubah!, { asal: "jendela", hal_jendela: "1", jendela: WB, aksi: "AKHIRI", alasan: "Uji S-1" });
        const mulai = await kirim(ctx, cookie, ubah!, { asal: "jendela", hal_jendela: "1", jendela: WB2, aksi: "MULAI", alasan: "Uji S-1" });
        const tarikB = await kirim(ctx, cookie, tarik!, { asal: "tarik", pengumuman: NB, alasan: "Uji S-1" });
        const tetap = psql(`select (select (ended_at is null)::text from public.maintenance_windows where id = ${lit(WB)}) || ':'
          || (select (activation_recorded_at is null and starts_at > now())::text from public.maintenance_windows where id = ${lit(WB2)}) || ':'
          || (select (withdrawn_at is null)::text from public.broadcast_notices where id = ${lit(NB)})`);
        c.expect(ditolakKonteks(akhiri), `«Akhiri sekarang» on Beta's window, working in Alpha, must be refused for the context: sent to ${akhiri}`);
        c.expect(ditolakKonteks(mulai), `«Mulai sekarang» on Beta's window, working in Alpha, must be refused for the context: sent to ${mulai}`);
        c.expect(ditolakKonteks(tarikB), `«Tarik pengumuman» on Beta's notice, working in Alpha, must be refused for the context: sent to ${tarikB}`);
        c.expect(tetap === "true:true:true", `nothing may be written by a refused act (window ended, window started, notice withdrawn): ${tetap}`);
        // 2. fail closed: an unknown window or notice is refused MAINTENANCE_NOT_ALLOWED, before any write
        const entahJ = await kirim(ctx, cookie, ubah!, { asal: "jendela", hal_jendela: "1", jendela: ID("dead"), aksi: "AKHIRI", alasan: "Uji S-1" });
        const entahN = await kirim(ctx, cookie, tarik!, { asal: "tarik", pengumuman: ID("dead"), alasan: "Uji S-1" });
        c.expect(/kode=MAINTENANCE_NOT_ALLOWED/.test(entahJ) && /kode=MAINTENANCE_NOT_ALLOWED/.test(entahN),
          `an unknown window and an unknown notice must be refused MAINTENANCE_NOT_ALLOWED: ${entahJ}; ${entahN}`);
        // 3. the control: working in Beta, the same act ends Beta's window
        await pilihKonteksCookie(ctx.appUrl!, cookie, `MENGELOLA:${B}`);
        const diB = await kirim(ctx, cookie, ubah!, { asal: "jendela", hal_jendela: "1", jendela: WB, aksi: "AKHIRI", alasan: "Uji S-1" });
        const berakhir = psql(`select (ended_at is not null)::text from public.maintenance_windows where id = ${lit(WB)}`);
        c.expect(/kode=MAINTENANCE_ENDED/.test(diB) && berakhir === "true", `working in Beta, «Akhiri sekarang» must end Beta's window: sent to ${diB}; ended ${berakhir}`);
      } finally {
        c.expect(bersihkan() === "0", "the test's windows, notice or role are still there");
      }
      return c.verdict("S-1, executed against the build: a controller of Alpha and Beta, working in Alpha, is refused for the context on Beta's «Akhiri sekarang», «Mulai sekarang» and «Tarik pengumuman», with nothing written; an unknown window or notice is refused MAINTENANCE_NOT_ALLOWED before any write; working in Beta, the same «Akhiri sekarang» ends Beta's window");
    },
  },
];
