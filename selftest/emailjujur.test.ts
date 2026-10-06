/**
 * D-098(c), J1.9 (D-085 M8): A REFUSED EMAIL IS NEVER CALLED SENT.
 *
 *   EMAILJUJUR-K01  the decision (src/lib/aktivasi.ts mintaKode), its tools replaced: when PINTAR cannot send
 *                   (EMAIL_TUNGGU) or codes were asked too often (MINTA_KODE_TUNGGU) the answer says so, carries the
 *                   wait, sends nothing and is the same whether or not the address has an account; neither is ever
 *                   asked after the lookup; the pace is counted on the keyed hash, never the address
 *   EMAILJUJUR-L01  what the person reads: the success no longer says a code «sudah dikirim» / "has been sent"; each
 *                   wait says no code was sent and for how long, in both languages; the contract's reader and the
 *                   screen keep the wait
 *   EMAILJUJUR-D01  the database (supabase/migrations/20261114100000), rolled back: email_sending_wait reads the
 *                   GLOBAL limit and the host's newest refusal; code_request_pace counts every key alike, a minute
 *                   apart and five an hour; email_send_history answers the platform admin only; the signed-out
 *                   decisions are the service role's alone
 */
import { spawnSync } from "node:child_process";
import { Checks, type SelfTest } from "./lib";

const DB_SKRIP = `
begin;
create temp table ej_snap (k text, v jsonb) on commit drop;
grant all on ej_snap to authenticated;
do $ej$
declare k1 text := repeat('1', 64); k2 text := repeat('2', 64); v jsonb := '{}'::jsonb; n int; h text := repeat('c', 64);
        v_id uuid; v_ok text;
begin
  perform selftest.as_owner();
  delete from public.email_send_log;
  v := v || jsonb_build_object('kosong', public.email_sending_wait());
  insert into public.email_send_log (kind, recipient_hash, outcome, settled_at, requested_at)
  values ('UJI_PENGIRIMAN', h, 'SENT', now() - interval '2 minutes', now() - interval '2 minutes');
  v := v || jsonb_build_object('setelah_terkirim', public.email_sending_wait());
  insert into public.email_send_log (kind, recipient_hash, outcome, smtp_code, settled_at, requested_at)
  values ('KODE_AKTIVASI', h, 'REFUSED_BY_HOST', 550, now() - interval '1 minute', now() - interval '1 minute')
  returning id into v_id;
  v := v || jsonb_build_object('host_menolak', public.email_sending_wait());
  update public.email_send_log set settled_at = now() - interval '11 minutes', requested_at = now() - interval '11 minutes' where id = v_id;
  v := v || jsonb_build_object('host_lama', public.email_sending_wait());
  update public.email_send_log set settled_at = now() - interval '1 minute' where id = v_id;
  insert into public.email_send_log (kind, recipient_hash, outcome, settled_at) values ('UJI_PENGIRIMAN', h, 'SENT', now());
  v := v || jsonb_build_object('host_pulih', public.email_sending_wait());
  delete from public.email_send_log;
  select l.max_sends into n from public.email_send_limits l where l.scope = 'GLOBAL' order by l.window_seconds limit 1;
  insert into public.email_send_log (kind, recipient_hash, outcome, settled_at, requested_at)
  select 'UJI_PENGIRIMAN', h, 'SENT', now() - interval '30 minutes', now() - interval '30 minutes' from generate_series(1, n);
  v := v || jsonb_build_object('batas_umum', public.email_sending_wait());
  delete from public.email_send_log;

  v := v || jsonb_build_object('k1_a', public.code_request_pace(k1), 'k1_b', public.code_request_pace(k1), 'k2_a', public.code_request_pace(k2));
  update public.email_code_requests
     set waktu = array[now() - interval '50 minutes', now() - interval '40 minutes', now() - interval '30 minutes',
                       now() - interval '20 minutes', now() - interval '10 minutes']
   where kunci = k1;
  v := v || jsonb_build_object('k1_jam', public.code_request_pace(k1));
  update public.email_code_requests set waktu = array[now() - interval '10 minutes'] where kunci = k1;
  v := v || jsonb_build_object('k1_lagi', public.code_request_pace(k1));

  insert into public.email_send_log (kind, recipient_hash, outcome, smtp_code, settled_at)
  values ('KODE_AKTIVASI', h, 'REFUSED_BY_HOST', 550, now()) returning id into v_id;
  perform selftest.as_user('alpha-admin@synthetic.pintar.test');
  begin
    perform * from public.email_send_history(h, null);
    v_ok := 'answered';
  exception when others then v_ok := sqlstate;
  end;
  v := v || jsonb_build_object('admin_sekolah', v_ok);
  perform selftest.as_user('sysadmin@synthetic.pintar.test');
  v := v || jsonb_build_object(
    'admin_platform_alamat', (select coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'hasil', r.outcome, 'kode', r.smtp_code)), '[]')
                                from public.email_send_history(h, null) r),
    'admin_platform_rujukan', (select count(*) from public.email_send_history(null, v_id)),
    'id', v_id);
  perform selftest.as_owner();
  v := v || jsonb_build_object(
    'anon_tunggu', has_function_privilege('anon', 'public.email_sending_wait()', 'execute'),
    'auth_tunggu', has_function_privilege('authenticated', 'public.email_sending_wait()', 'execute'),
    'anon_pace', has_function_privilege('anon', 'public.code_request_pace(text)', 'execute'),
    'auth_pace', has_function_privilege('authenticated', 'public.code_request_pace(text)', 'execute'),
    'service_pace', has_function_privilege('service_role', 'public.code_request_pace(text)', 'execute'),
    'anon_riwayat', has_function_privilege('anon', 'public.email_send_history(text,uuid)', 'execute'),
    'auth_baca_pace', has_table_privilege('authenticated', 'public.email_code_requests', 'select'),
    'kolom_alamat', exists (select 1 from information_schema.columns where table_schema = 'public'
                              and table_name in ('email_send_log', 'email_code_requests') and column_name ~ 'email|address|alamat'));
  insert into ej_snap values ('DB', v);
end $ej$;
select v::text from ej_snap;
rollback;
`;

export const emailJujurTests: SelfTest[] = [
  {
    id: "EMAILJUJUR-K01",
    requires: [],
    run: async () => {
      const c = new Checks();
      process.env.CARD_PEPPER ??= "selftest-card-pepper-emailjujur-32plus";
      const a = await import("../src/lib/aktivasi");
      const jalan = async (opsi: { kirim?: number | Error; minta?: number }, ada: boolean, email?: string) => {
        const tanya: string[] = [];
        const kunci: string[] = [];
        const nanti: Array<() => Promise<void>> = [];
        const h = await a.mintaKode({ origin: true, email: email ?? (ada ? "Ada@Local.Invalid" : "tiada@local.invalid"), ulang: null }, {
          sasaran: async () => { tanya.push("sasaran"); return ada ? { authUserId: "00000000-0000-0000-0000-000000000001", nama: "X" } : null; },
          jedaKirimUlang: async () => { tanya.push("jeda"); return 60; },
          jedaPengiriman: async () => {
            tanya.push("kirim");
            if (opsi.kirim instanceof Error) throw opsi.kirim;
            return opsi.kirim ?? 0;
          },
          catatPermintaan: async (k) => { tanya.push("minta"); kunci.push(k); return opsi.minta ?? 0; },
          kirim: async () => {},
          nanti: (kerja) => { nanti.push(kerja); },
          catatGalat: () => {},
        });
        return { h, tanya, kunci, nanti: nanti.length };
      };

      // PINTAR cannot send: everybody is told so, with the wait; nothing is looked up, counted or sent
      const t1 = await jalan({ kirim: 300 }, true), t0 = await jalan({ kirim: 300 }, false);
      c.expect(t1.h.status === 503 && JSON.stringify(t1.h.body) === JSON.stringify({ ok: false, code: "EMAIL_TUNGGU", tunggu: 300 }) && t1.h.retryAfter === 300,
        `PINTAR unable to send was answered ${t1.h.status} ${JSON.stringify(t1.h.body)}; expected 503 EMAIL_TUNGGU with its wait`);
      c.expect(JSON.stringify(t1.h) === JSON.stringify(t0.h), "PINTAR unable to send is answered differently when the address has an account");
      c.expect(t1.nanti === 0 && t0.nanti === 0 && !t1.tanya.includes("sasaran") && !t1.tanya.includes("minta"),
        `with PINTAR unable to send, the request still ${JSON.stringify(t1.tanya)}, ${t1.nanti} send(s) scheduled`);

      // asked too often: the same for every address, with the wait, and nothing looked up or sent
      const p1 = await jalan({ minta: 45 }, true), p0 = await jalan({ minta: 45 }, false);
      c.expect(p1.h.status === 429 && JSON.stringify(p1.h.body) === JSON.stringify({ ok: false, code: "MINTA_KODE_TUNGGU", tunggu: 45 }),
        `codes asked too often were answered ${p1.h.status} ${JSON.stringify(p1.h.body)}; expected 429 MINTA_KODE_TUNGGU with its wait`);
      c.expect(JSON.stringify(p1.h) === JSON.stringify(p0.h), "codes asked too often are answered differently when the address has an account");
      c.expect(p1.nanti === 0 && !p1.tanya.includes("sasaran"), `asked too often, the request still ${JSON.stringify(p1.tanya)}`);
      c.expect(p1.kunci.length === 1 && /^[0-9a-f]{64}$/.test(p1.kunci[0]) && p0.kunci.length === 1 && p1.kunci[0] !== p0.kunci[0],
        `the pace is not counted on a keyed hash per address: ${JSON.stringify([p1.kunci, p0.kunci])}`);
      const kecil = await jalan({}, true, "  ada@local.invalid ");
      c.expect(kecil.kunci[0] === p1.kunci[0], "the same address typed in another case or with spaces is counted as another address");

      // the order: both waits before the lookup, so neither can depend on the account
      const ok1 = await jalan({}, true), ok0 = await jalan({}, false);
      c.expect(ok1.tanya.indexOf("kirim") < ok1.tanya.indexOf("sasaran") && ok1.tanya.indexOf("minta") < ok1.tanya.indexOf("sasaran"),
        `the waits are asked after the lookup: ${JSON.stringify(ok1.tanya)}`);
      c.expect(JSON.stringify(ok1.h) === JSON.stringify(ok0.h) && ok1.h.status === 200 && ok1.nanti === 1 && ok0.nanti === 0,
        `able to send: ${JSON.stringify([ok1.h, ok0.h])}, sends scheduled ${ok1.nanti}/${ok0.nanti}; expected one answer and one send, for the account only`);

      // the sending state unreadable (or the settings missing): a server failure with a reference, nothing sent
      const g = await jalan({ kirim: new Error("PINTAR_SMTP_HOST is not set") }, true);
      const gb = g.h.body as { ok: boolean; code?: string; ref?: string };
      c.expect(g.h.status === 503 && gb.code === "LAYANAN_TIDAK_TERSEDIA" && /^[A-Z0-9]{6}$/.test(gb.ref ?? "") && g.nanti === 0,
        `an unreadable sending state was answered ${JSON.stringify(g.h)}; expected the server's failure with a reference, nothing sent`);
      return c.verdict("unable to send and asked too often are each answered with what PINTAR knows, the wait included, alike for every address and before the lookup, and with nothing sent; the pace is counted on the keyed hash; an unreadable sending state is the server's failure");
    },
  },
  {
    id: "EMAILJUJUR-L01",
    requires: [],
    run: async () => {
      const c = new Checks();
      const { t } = await import("../src/lib/hle");
      const j = await import("../src/components/aktifkan/jawaban");
      const { bacaJawabanMintaKode } = await import("../src/lib/aktivasi-kontrak");
      for (const locale of ["id", "en"] as const) {
        const s = (k: Parameters<typeof t>[0]) => t(k, "public", { locale });
        for (const k of ["aktifkan.kode_terkirim", "aktifkan.kode_ulang_ok"] as const) {
          c.expect(!/sudah dikirim|telah dikirim|has been sent|was sent/i.test(s(k)) && /sedang mengirim|is sending/i.test(s(k)),
            `${locale} ${k} still claims a send PINTAR has not made: «${s(k)}»`);
        }
        for (const [kode, kata] of [["EMAIL_TUNGGU", /tidak dikirim|no code was sent/i], ["MINTA_KODE_TUNGGU", /tidak dikirim|no code was sent/i]] as const) {
          const g = j.baca("kode", { ok: false, code: kode, tunggu: 300 });
          const kal = !g.ok ? j.kalimat(g, s, locale) : "";
          c.expect(!g.ok && g.tunggu === 300 && j.menunggu(g) && kata.test(kal) && /5/.test(kal),
            `${locale} ${kode} reads «${kal}» (wait ${!g.ok ? g.tunggu : "-"}); expected it to say no code was sent and to wait 5 minutes`);
        }
        const kosong = j.baca("kode", { ok: false, code: "EMAIL_TUNGGU" }, "120");
        c.expect(!kosong.ok && kosong.tunggu === 120, `${locale}: a wait given only by Retry-After was not kept`);
      }
      const r = bacaJawabanMintaKode({ ok: false, code: "MINTA_KODE_TUNGGU", tunggu: 59.2 }) as { code: string; tunggu?: number };
      c.expect(r.code === "MINTA_KODE_TUNGGU" && r.tunggu === 60, `the contract's reader does not keep the wait: ${JSON.stringify(r)}`);
      return c.verdict("the success says PINTAR is sending, never that it has sent; each wait says no code was sent and how long to wait, in both languages, from the body or Retry-After");
    },
  },
  {
    id: "EMAILJUJUR-D01",
    requires: ["db"],
    run: async () => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", DB_SKRIP, db], { encoding: "utf8" });
      const pesan = (r.stderr || "").trim().split("\n").find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop();
      if (!c.expect(r.status === 0, `the database half could not run: ${pesan}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v: Record<string, any> = JSON.parse(r.stdout.trim().split("\n").filter((l) => l.startsWith("{")).pop() ?? "{}");
      c.expect(v.kosong === 0 && v.setelah_terkirim === 0, `with nothing refused, email_sending_wait says ${v.kosong}/${v.setelah_terkirim}`);
      c.expect(v.host_menolak >= 530 && v.host_menolak <= 540, `a refusal by the host a minute ago gives a wait of ${v.host_menolak} s; expected about nine minutes`);
      c.expect(v.host_lama === 0, `a refusal eleven minutes ago still holds sending (${v.host_lama} s)`);
      c.expect(v.host_pulih === 0, `a send the host accepted after its refusal still holds sending (${v.host_pulih} s)`);
      c.expect(v.batas_umum >= 1700 && v.batas_umum <= 1800, `the GLOBAL limit full for half an hour gives a wait of ${v.batas_umum} s; expected about thirty minutes`);
      c.expect(v.k1_a === 0 && v.k1_b >= 1 && v.k1_b <= 60 && v.k2_a === 0,
        `the pace: first ${v.k1_a}, again at once ${v.k1_b}, another address ${v.k2_a}; expected 0, up to a minute, 0`);
      c.expect(v.k1_jam >= 590 && v.k1_jam <= 600, `five requests in the hour leave a wait of ${v.k1_jam} s; expected about ten minutes`);
      c.expect(v.k1_lagi === 0, `one request ten minutes ago still holds the next (${v.k1_lagi} s)`);
      c.expect(v.admin_sekolah === "42501", `a school administrator reading the send history was answered ${v.admin_sekolah}, not refused`);
      const baris = v.admin_platform_alamat as Array<{ id: string; hasil: string; kode: number }>;
      c.expect(baris.length === 1 && baris[0].id === v.id && baris[0].hasil === "REFUSED_BY_HOST" && baris[0].kode === 550 && v.admin_platform_rujukan === 1,
        `the platform admin's lookup by address read ${JSON.stringify(baris)} and by reference ${v.admin_platform_rujukan} row(s)`);
      c.expect(!v.anon_tunggu && !v.auth_tunggu && !v.anon_pace && !v.auth_pace && v.service_pace && !v.anon_riwayat && !v.auth_baca_pace,
        `the grants: ${JSON.stringify({ anon_tunggu: v.anon_tunggu, auth_tunggu: v.auth_tunggu, anon_pace: v.anon_pace, auth_pace: v.auth_pace, service_pace: v.service_pace, anon_riwayat: v.anon_riwayat, auth_baca_pace: v.auth_baca_pace })}`);
      c.expect(!v.kolom_alamat, "the send log or the pace table has a column that could hold an address");
      return c.verdict("email_sending_wait holds sending while the GLOBAL limit is full or for ten minutes after the host's newest refusal, and not after a later acceptance; code_request_pace counts every key alike, a minute apart and five an hour; the send history answers the platform admin by address hash and by reference, and refuses a school admin; the signed-out decisions are the service role's alone; no address is held");
    },
  },
];
