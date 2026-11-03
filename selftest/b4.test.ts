/**
 * BATCH 4 · ADMINISTRATION, IDENTITY AND ACCOUNT MANAGEMENT (owner, 3 Nov: «Batch 4 development GO», D-152). Each
 * guard is RED on the code Batch 3 closed with (cb1ff3e) and GREEN after Batch 4.
 *
 *  B4-KARTU-K01  D-152(a) · the source: «Murid yang menjadi staf» is on Aktivasi beside «Kartu hilang atau rusak», posts
 *                to /api/akun/kartu-ke-email, whose source asks authorize_card_conversion with the CALLER's client
 *                and only then uses the service key for Auth's one address write; every refusal code has its
 *                sentence in both languages.
 *  B4-KARTU-A01  D-152(a) · live: a class-card learner signs in with the card; the platform admin's conversion without
 *                a reason is refused; with one it answers ok; the card no longer signs in; the same account row and
 *                Auth user are now an EMAIL account; the person activates it with a code to the new address and signs
 *                in with their password; a staff role is then accepted where it was refused (CR-91); the conversion is
 *                audited with its reason, the old card and the new address.
 */
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";
import { t, type HleEvent } from "../src/lib/hle";
import { STATUS_KARTU_JADI_EMAIL, KODE_KARTU_JADI_EMAIL_DARI_DB } from "../src/lib/kartu-jadi-email-kontrak";
import { aktifkan } from "./bob28.test";
import { ipUji, lit, Peramban, psql } from "./bob26.test";
import { pilihKonteksPeramban } from "./konteks-uji";

const baca = (root: string, p: string) => { try { return readFileSync(join(root, p), "utf8"); } catch { return ""; } };
/** Source without its comments, so a comment cannot satisfy a guard. */
const kode = (x: string) => x.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");

export const b4Tests: SelfTest[] = [
  {
    id: "B4-KARTU-K01",
    run: async (ctx) => {
      const c = new Checks();
      const halaman = kode(baca(ctx.repoRoot, "src/app/aktivasi/page.tsx"));
      c.expect(/<KartuUlang locale=\{locale\} pemegang=\{pemegang\} \/>\s*<KartuJadiEmail locale=\{locale\} pemegang=\{pemegang\} \/>/.test(halaman),
        "Aktivasi does not offer «Murid yang menjadi staf» beside «Kartu hilang atau rusak»");
      const komp = kode(baca(ctx.repoRoot, "src/components/aktivasi/KartuJadiEmail.tsx"));
      c.expect(/fetch\("\/api\/akun\/kartu-ke-email"/.test(komp) && /<BidangTeks id=\{`staf-email-/.test(komp) && /<BidangTeks id=\{`staf-alasan-/.test(komp),
        "the section does not post the address and the reason to /api/akun/kartu-ke-email through the text fields");
      const rute = kode(baca(ctx.repoRoot, "src/app/api/akun/kartu-ke-email/route.ts"));
      const tanya = rute.indexOf('caller.rpc("authorize_card_conversion"');
      const tulis = rute.indexOf("supabaseService().auth.admin.updateUserById(");
      c.expect(tanya > 0 && tulis > tanya && (rute.match(/supabaseService\(\)/g) ?? []).length === 1,
        "the route does not ask the database with the caller's client before its one service-key write");
      c.expect(/if \(!asalSendiri\(/.test(rute) && /if \(!user\) return gagal\("BELUM_MASUK"\)/.test(rute), "the route does not refuse a foreign origin or a signed-out caller");
      for (const kodeDb of ["REASON_REQUIRED", "EMAIL_INVALID", "EMAIL_TAKEN", "CARD_NOT_FOUND"]) {
        c.expect(kodeDb in KODE_KARTU_JADI_EMAIL_DARI_DB, `${kodeDb} reaches no code of the contract`);
      }
      for (const k of Object.keys(STATUS_KARTU_JADI_EMAIL)) {
        for (const locale of ["id", "en"] as const) {
          const kata = t(`aktivasi.staf.gagal.${k}` as HleEvent, "staff", { locale });
          c.expect(!!kata && !kata.startsWith("aktivasi."), `«${k}» has no sentence in ${locale}`);
        }
      }
      return c.verdict("the source of src/app/aktivasi/page.tsx offers «Murid yang menjadi staf» beside «Kartu hilang atau rusak»; "
        + "src/components/aktivasi/KartuJadiEmail.tsx posts the address and the reason (TextField) to /api/akun/kartu-ke-email, whose source "
        + "refuses a foreign origin and a signed-out caller, asks authorize_card_conversion with the caller's client and only then makes its "
        + "one service-key write (Auth's address move); each database refusal maps to a contract code with a sentence in both languages");
    },
  },
];

export const b4AppTests: SelfTest[] = [
  {
    id: "B4-KARTU-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const nama = `Murid Asisten ${tag}`;
      const email = `b4-asisten-${tag}@local.invalid`;
      // a learner of a synthetic school of its own, provisioned as the intake does (BOB28-A03's)
      const murid = psql(`
        do $$ declare v_p uuid; v_inst uuid; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          insert into public.institutions (name, slug, is_synthetic, is_active)
          values (${lit(`Sekolah Asisten ${tag}`)}, ${lit(`sekolah-asisten-${tag}`)}, true, true) returning id into v_inst;
          update public.institutions set namespace = (select x from generate_series(1, 500) g, lateral (select upper(substr(md5(${lit(tag)} || g), 1, 3)) x) q
                                                      where x ~ '^[A-Z]{3}$' and not exists (select 1 from public.institutions t where upper(t.namespace) = q.x) limit 1)
           where id = v_inst;
          insert into public.persons (display_name) values (${lit(nama)}) returning id into v_p;
          perform public.issue_institutional_id(v_p, v_inst);
        end $$;
        select id from public.persons where display_name = ${lit(nama)};`).split("\n").pop()!;
      const sys = new Peramban(asal, ipUji());
      c.expect((await sys.jsonDari("/masuk/password", { form: { identitas: "uji.sysadmin", password: "Sintetis-Sys-91!" } })).status === 200, "the platform admin could not sign in");
      await pilihKonteksPeramban(sys, "MENGELOLA:PLATFORM");
      const buat = await sys.jsonDari("/api/akun/aktivasi", { json: { mode: "CLASSROOM_CARD", person_id: murid } });
      const k = buat.body as { card?: string; pin?: string };
      if (!c.expect(buat.status === 200 && /^\d{10}$/.test(k.card ?? ""), `the card could not be made (${buat.status})`)) return c.verdict("");
      const akunSebelum = psql(`select id || '/' || auth_user_id from public.accounts where person_id = ${lit(murid)}`);
      const m1 = await new Peramban(asal, ipUji()).jsonDari("/masuk/kartu", { form: { kartu: k.card!, pin: k.pin! } });
      c.expect(m1.status === 200, `the card could not sign in first (${m1.status})`);

      // the screen offers it, then the conversion
      const halaman = await sys.kirim("/aktivasi");
      const teks = await halaman.text();
      c.expect(halaman.status === 200 && teks.includes(t("aktivasi.staf.judul", "staff", { locale: "id" })), "Aktivasi does not show «Murid yang menjadi staf»");
      const tanpa = await sys.jsonDari("/api/akun/kartu-ke-email", { json: { person_id: murid, email, alasan: "  " } });
      c.expect(tanpa.status === 400 && tanpa.body?.code === "ALASAN_WAJIB", `without a reason the conversion answered ${tanpa.status} ${JSON.stringify(tanpa.body)}`);
      const ubah = await sys.jsonDari("/api/akun/kartu-ke-email", { json: { person_id: murid, email: email.toUpperCase(), alasan: "Diangkat menjadi asisten guru" } });
      if (!c.expect(ubah.status === 200 && ubah.body?.ok === true, `the conversion answered ${ubah.status} ${JSON.stringify(ubah.body)}`)) return c.verdict("");

      const m2 = await new Peramban(asal, ipUji()).jsonDari("/masuk/kartu", { form: { kartu: k.card!, pin: k.pin! } });
      c.expect(m2.status !== 200, `the card still signs in after the conversion (${m2.status})`);
      const akunSesudah = psql(`select id || '/' || auth_user_id || '/' || kind || '/' || coalesce(card_number, '-') from public.accounts where person_id = ${lit(murid)}`);
      c.expect(akunSesudah === `${akunSebelum}/EMAIL/-`, `the account after reads ${akunSesudah}; before ${akunSebelum}`);

      const sandi = await aktifkan(c, asal, email, `asisten.${tag}`, "5937");
      if (sandi) {
        const m3 = await new Peramban(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: email, password: sandi } });
        c.expect(m3.status === 200, `the activated person could not sign in with their password (${m3.status})`);
      }
      // CR-91 still decides: a staff role is now accepted for this person (it was refused over the card)
      const peran = psql(`
        do $$ declare v_node uuid; begin
          select n.id into v_node from public.org_nodes n join public.institutional_identities ii on ii.institution_id = n.institution_id
           where ii.person_id = ${lit(murid)} and n.kind = 'INSTITUTION' limit 1;
          perform set_config('app.seed_intent', 'synthetic', true);
          insert into public.role_assignments (person_id, role, scope_node_id, valid_until) values (${lit(murid)}, 'EDUCATOR', v_node, now() + interval '1 year');
        end $$;
        select count(*) from public.role_assignments where person_id = ${lit(murid)} and revoked_at is null;`).split("\n").pop();
      c.expect(peran === "1", `the staff role after the conversion: ${peran}`);
      const jejak = psql(`select (summary ->> 'reason') || '|' || (summary #>> '{from,card_number}') || '|' || (summary #>> '{to,email}')
                            from public.audit_log where action = 'account.card_converted_to_email' and target_id = ${lit(murid)}`);
      c.expect(jejak === `Diangkat menjadi asisten guru|${k.card}|${email}`, `the conversion is audited as «${jejak}»`);
      return c.verdict("a class-card learner signed in with the card; without a reason the conversion was refused (ALASAN_WAJIB); with one "
        + "it answered ok, after which the card signed nobody in; the same account row and Auth user are an EMAIL account; the person "
        + "activated it with a code to the new address and signed in with their password; a staff role was then accepted (CR-91 still "
        + "decides in the database); the conversion is audited with its reason, the old card and the new address");
    },
  },
];
