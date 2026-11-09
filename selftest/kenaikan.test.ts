/**
 * «KENAIKAN KELAS DAN KELULUSAN» (Daisy's approved flow; owner, 9 Nov; ACCOUNT-LIFECYCLE-INVENTORY.md §10).
 *
 *  KENAIKAN-K01  the pure part (src/lib/kenaikan.ts): every select value reads back as its decision and is written the
 *                same way; anything else (an empty choice, a bad id, an unknown reason) is no decision; the address form
 *                carries ids and codes only and drops what is malformed instead of repairing it.
 *  KENAIKAN-A01  the running app, as the school's admin, through the screen (no script, the forms as a browser sends
 *                them): the class is chosen; every learner is listed, the Tingkat-only one marked; «Naikkan semua ke»
 *                pre-selects the destination; the exceptions are set (a repeat straight into the repeat class, a
 *                graduate); the review names each outcome and the teachers; a confirmation without the teachers'
 *                review is refused and changes nothing; the confirmation applies everything and the outcome page names
 *                every learner with where they are now, as the database holds it.
 */
import { randomBytes } from "node:crypto";
import { Checks, type SelfTest } from "./lib";
import { daftar, ipUji, lit, psql } from "./bob26.test";
import { aktifkan } from "./bob28.test";
import { Komputer } from "./bob29.test";
import { pilihKonteksPeramban, tersusun } from "./konteks-uji";
import { bacaNilai, dariForm, kodekan, nilaiDari, urai } from "../src/lib/kenaikan";
import { alasanAudit } from "../src/lib/jejak-audit";

const ID = "11111111-2222-4333-8444-555555555555";
const ID2 = "66666666-7777-4888-9999-000000000000";

export const kenaikanTests: SelfTest[] = [
  {
    id: "JEJAK-K01",
    requires: [],
    run: async () => {
      // E7: «Jejak audit» reads who and why from the summary keys written for it, and nothing else
      const c = new Checks();
      const a = alasanAudit({ reason_code: "DECEASED", explanation: "  keterangan keluarga  ", effective_date: "2026-11-02", actor_role: "INSTITUTION_ADMIN",
        mapping: [{ from_node: "x" }], person_id: "11111111-2222-4333-8444-555555555555", outcomes: [1, 2] }, "id");
      c.expect(a.alasan === "Meninggal dunia · keterangan keluarga", `the reason reads «${a.alasan}»`);
      c.expect(a.berlaku === "2026-11-02" && a.peran === "Admin sekolah", `the date or role reads ${a.berlaku} ${a.peran}`);
      c.expect(!JSON.stringify(a).includes("11111111") && !JSON.stringify(a).includes("from_node"), "a summary's ids or mapping reached the screen");
      const r = alasanAudit({ reason: "Tidak lagi mengajar", actor_role: "BUKAN_PERAN", effective_date: "kemarin" }, "en");
      c.expect(r.alasan === "Tidak lagi mengajar" && r.peran === null && r.berlaku === null, `an unknown role or a malformed date was shown: ${JSON.stringify(r)}`);
      c.expect(JSON.stringify(alasanAudit(null, "id")) === JSON.stringify({ alasan: null, berlaku: null, peran: null }), "an empty summary is not empty");
      return c.verdict("the reason code in words with the free reason, the effective date and the actor's role are read; a summary's ids, mappings and counts, an unknown role and a malformed date are not");
    },
  },
  {
    id: "KENAIKAN-K01",
    requires: [],
    run: async () => {
      const c = new Checks();
      for (const v of [`NAIK:${ID2}`, `TINGGAL:${ID2}`, "LULUS", "PINDAH", "KELUAR:WITHDRAWN", "KELUAR:TRANSFER_EXTERNAL", "KELUAR:MOVED_ABROAD", "KELUAR:DECEASED"]) {
        const d = bacaNilai(ID, v);
        c.expect(d !== null && nilaiDari(d) === v, `«${v}» does not read back as itself (${JSON.stringify(d)})`);
      }
      for (const v of ["", "NAIK", "NAIK:bukan", "KELUAR:OTHER", "KELUAR:", "LULUS:x", "HAPUS"]) {
        c.expect(bacaNilai(ID, v) === null, `«${v}» was read as a decision`);
      }
      c.expect(bacaNilai("bukan-uuid", "LULUS") === null, "a decision for a malformed person was read");
      const ds = [bacaNilai(ID, `NAIK:${ID2}`)!, bacaNilai(ID2, "KELUAR:DECEASED")!];
      const k = kodekan(ds);
      c.expect(JSON.stringify(urai(k)) === JSON.stringify(ds), "the address form does not carry the decisions back");
      c.expect(!/[^A-Za-z0-9_-]/.test(k), "the address form is not base64url");
      c.expect(urai("bukan") .length === 0 && urai(Buffer.from('[["x","LULUS"],[1,2]]').toString("base64url")).length === 0,
        "a malformed address form was repaired into decisions");
      const f = dariForm([[`k[${ID}]`, "LULUS"], [`k[${ID2}]`, ""], ["kelas", ID]]);
      c.expect(f.length === 1 && f[0].person_id === ID, "the form's selects are not read one decision each, an empty one absent");
      return c.verdict("every select value reads back as its decision; empty, malformed and unknown values are no decision; the address form carries ids and codes only and drops what is malformed");
    },
  },
];

/** A form of a rendered page, found by a field it holds, as a browser would send it: its hidden fields, then `isi`. */
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
const teks = (html: string) => tersusun(html).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/\s+/g, " ");

export const kenaikanAppTests: SelfTest[] = [
  {
    id: "KENAIKAN-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      // Alpha: this year's Tingkat 5 with Kelas 5X (A, B, C) and D in the Tingkat only; next year Kelas 6X and 5X-ulang
      const [alpha, k5, k6, kul, tahun, a, b, cc, d] = psql(`
        do $$ declare v_i uuid; v_root uuid; v_per uuid; v_next uuid; v_t5 uuid; v_k5 uuid; v_t6 uuid; v_k6 uuid; v_t5b uuid; v_kul uuid;
                      v_p uuid; v_e uuid; r record; v_prog uuid; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          select i.id into v_i from public.institutions i where i.slug like 'synth-alpha-%' and i.is_active order by i.created_at desc limit 1;
          -- a Tingkat sits under a programme (the structure's containment): Alpha's first one
          select n.id into v_root from public.org_nodes n where n.institution_id = v_i and n.kind = 'PROGRAMME' and n.is_active order by n.created_at limit 1;
          select ap.id into v_per from public.academic_periods ap where ap.institution_id = v_i and current_date between ap.starts_on and ap.ends_on
           order by ap.starts_on desc limit 1;
          if v_per is null then select ap.id into v_per from public.academic_periods ap where ap.institution_id = v_i order by ap.starts_on desc limit 1; end if;
          -- next year: the school's own where it has one (school years do not overlap), else one made for the test
          select nx.id into v_next from public.academic_periods nx, public.academic_periods ap
           where ap.id = v_per and nx.institution_id = v_i and nx.starts_on > ap.starts_on order by nx.starts_on limit 1;
          if v_next is null then
            insert into public.academic_periods (institution_id, name, starts_on, ends_on)
            select v_i, 'Kenaikan ' || ${lit(tag)}, ap.ends_on + 1, ap.ends_on + 366 from public.academic_periods ap where ap.id = v_per returning id into v_next;
          end if;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_root, 'COHORT', 'Tingkat 5 ' || ${lit(tag)}, v_per) returning id into v_t5;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_t5, 'CLASS', 'Kelas 5X ' || ${lit(tag)}, v_per) returning id into v_k5;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_root, 'COHORT', 'Tingkat 6 ' || ${lit(tag)}, v_next) returning id into v_t6;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_t6, 'CLASS', 'Kelas 6X ' || ${lit(tag)}, v_next) returning id into v_k6;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_root, 'COHORT', 'Tingkat 5 baru ' || ${lit(tag)}, v_next) returning id into v_t5b;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_t5b, 'CLASS', 'Kelas 5X ulang ' || ${lit(tag)}, v_next) returning id into v_kul;
          for r in select * from (values ('A'), ('B'), ('C'), ('D')) t(k) loop
            insert into public.persons (display_name) values ('Murid ' || r.k || ' ' || ${lit(tag)}) returning id into v_p;
            insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (v_p, v_i, v_per, 'ACTIVE') returning id into v_e;
            insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, case when r.k = 'D' then v_t5 else v_k5 end, v_per);
          end loop;
          perform set_config('kn.ids', v_i || '|' || v_k5 || '|' || v_k6 || '|' || v_kul || '|' || v_next, false);
        end $$;
        select current_setting('kn.ids') || '|' || string_agg(p.id::text, '|' order by p.display_name)
          from public.persons p where p.display_name like 'Murid _ ' || ${lit(tag)};`).split("\n").pop()!.split("|");
      if (!c.expect([alpha, k5, k6, kul, tahun, a, b, cc, d].every((x) => /^[0-9a-f-]{36}$/.test(x ?? "")), "the fixture was not made")) return c.verdict("");
      const nama = (k: string) => `Murid ${k} ${tag}`;

      const admin = new Komputer(asal, ipUji());
      const m = await admin.jsonDari("/masuk/password", { form: { identitas: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" } });
      if (!c.expect(m.status === 200, `Alpha's admin could not sign in (${m.status})`)) return c.verdict("");
      await admin.halaman("/konfigurasi");
      await admin.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      await pilihKonteksPeramban(admin, `MENGELOLA:${alpha}`);

      // 1. the class, offered by year
      const h1 = await (await admin.halaman("/konfigurasi/rollover")).text();
      c.expect(/data-kenaikan-langkah="kelas"/.test(h1) && h1.includes(`value="${k5}"`), "step 1 does not offer Kelas 5X");

      // 2. every learner, D marked; «Naikkan semua ke 6X» pre-selects
      const h2 = await (await admin.halaman(`/konfigurasi/rollover?kn_kelas=${k5}&kn_tahun=${tahun}&kn_semua=${k6}`)).text();
      const t2 = teks(h2);
      c.expect(["A", "B", "C", "D"].every((k) => t2.includes(nama(k))), `step 2 does not list all four learners: ${t2.slice(0, 300)}`);
      c.expect(new RegExp(`data-murid="${d}"[\\s\\S]{0,600}Di Tingkat, belum di kelas`).test(tersusun(h2)), "D is not marked as in the Tingkat without a class");
      c.expect((tersusun(h2).match(new RegExp(`<option[^>]*value="NAIK:${k6}"[^>]*selected`, "g")) ?? []).length === 4
        || (tersusun(h2).match(new RegExp(`<option selected=""[^>]*value="NAIK:${k6}"`, "g")) ?? []).length === 4,
        "«Naikkan semua ke» did not pre-select 6X for all four");
      // the exceptions: B repeats straight into 5X ulang, C graduates
      const f2 = formDengan(h2, 'name="k[', { [`k[${a}]`]: `NAIK:${k6}`, [`k[${b}]`]: `TINGGAL:${kul}`, [`k[${cc}]`]: "LULUS", [`k[${d}]`]: `NAIK:${k6}` });
      if (!c.expect(typeof f2 !== "string", `step 2's form: ${f2}`)) return c.verdict("");
      const r2 = await admin.kirim("/konfigurasi/rollover", { form: f2 as Record<string, string> });
      const ke3 = r2.headers.get("location") ?? "";
      if (!c.expect([303, 307].includes(r2.status) && /kn_langkah=tinjau/.test(ke3), `«Tinjau hasil» answered ${r2.status} ${ke3}`)) return c.verdict("");
      c.expect(!/Murid/.test(decodeURIComponent(ke3)), "the address carries a learner's name");

      // 3. the review: each outcome by name; nothing changed yet
      const h3 = await (await admin.halaman(new URL(ke3, asal).pathname + new URL(ke3, asal).search)).text();
      const t3 = teks(h3);
      c.expect(t3.includes(`${nama("A")} Naik ke Kelas 6X ${tag}`) && t3.includes(`${nama("B")} Tinggal kelas di Kelas 5X ulang ${tag}`)
        && t3.includes(`${nama("C")} Lulus`) && t3.includes(`${nama("D")} Naik ke Kelas 6X ${tag}`), `the review does not name each outcome: ${t3.slice(0, 400)}`);
      c.expect(/data-kenaikan-guru=""/.test(h3), "the review does not show the teachers");
      c.expect(psql(`select count(*) from public.enrollments where academic_period_id = ${lit(tahun)} and person_id in (${[a, b, cc, d].map(lit).join(",")})`) === "0", "the review changed something");
      // a confirmation without the teachers' review is refused by the database, and changes nothing
      const tanpa = formDengan(h3, 'name="guru_ditinjau"', {});
      if (!c.expect(typeof tanpa !== "string", `step 3's form: ${tanpa}`)) return c.verdict("");
      const r3a = await admin.kirim("/konfigurasi/rollover", { form: tanpa as Record<string, string> });
      c.expect(/kn_kode=PROMO_TEACHERS_UNREVIEWED/.test(r3a.headers.get("location") ?? ""), `without the teachers' review: ${r3a.status} ${r3a.headers.get("location")}`);
      c.expect(psql(`select count(*) from public.enrollments where academic_period_id = ${lit(tahun)} and person_id in (${[a, b, cc, d].map(lit).join(",")})`) === "0", "a refused confirmation changed something");
      // the confirmation
      const r3 = await admin.kirim("/konfigurasi/rollover", { form: { ...(tanpa as Record<string, string>), guru_ditinjau: "ya" } });
      const ke4 = r3.headers.get("location") ?? "";
      if (!c.expect(/kn_langkah=selesai/.test(ke4), `«Konfirmasi» answered ${r3.status} ${ke4}`)) return c.verdict("");

      // 4. the outcome, as the database holds it
      const t4 = teks(await (await admin.halaman(new URL(ke4, asal).pathname + new URL(ke4, asal).search)).text());
      c.expect(t4.includes("4 murid diproses") && t4.includes(`${nama("A")} Naik ke Kelas 6X ${tag} Kelas 6X ${tag}`)
        && t4.includes(`${nama("B")} Tinggal kelas di Kelas 5X ulang ${tag} Kelas 5X ulang ${tag}`) && t4.includes(`${nama("C")} Lulus Lulus`)
        && t4.includes(`${nama("D")} Naik ke Kelas 6X ${tag} Kelas 6X ${tag}`), `the outcome page: ${t4.slice(0, 500)}`);
      const db = psql(`select string_agg(p.display_name || '=' || coalesce(n.name, e.status || '/' || coalesce(e.end_reason::text, '')), ',' order by p.display_name)
                         from public.persons p join public.enrollments e on e.person_id = p.id
                         left join public.memberships m on m.enrollment_id = e.id and m.valid_to is null
                         left join public.org_nodes n on n.id = m.node_id
                        where p.id in (${[a, b, cc, d].map(lit).join(",")}) and (e.status in ('PENDING', 'ACTIVE') or e.end_reason = 'COMPLETED')`);
      c.expect(db === `${nama("A")}=Kelas 6X ${tag},${nama("B")}=Kelas 5X ulang ${tag},${nama("C")}=ENDED/COMPLETED,${nama("D")}=Kelas 6X ${tag}`, `the database holds ${db}`);
      return c.verdict("as Alpha's admin, through the screen: Kelas 5X chosen; all four learners listed, the Tingkat-only one marked; «Naikkan semua ke» pre-selected 6X; " +
        "the repeat set straight to 5X ulang and the graduate set; the review named each outcome and the teachers and changed nothing; a confirmation " +
        "without the teachers' review was refused (PROMO_TEACHERS_UNREVIEWED) and changed nothing; the confirmation applied all four and the outcome " +
        "page names each learner with where they are now, as the database holds it; no name travels in the address");
    },
  },
  {
    id: "KEMBALI-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      // E3 «Akhiri pendaftaran» and E4 «Daftarkan kembali» on Konfigurasi · Pindah kelas, as the school's admin
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const [alpha, kelas, kelas2, a, b] = psql(`
        do $$ declare v_i uuid; v_prog uuid; v_per uuid; v_t uuid; v_k uuid; v_k2 uuid; v_p uuid; v_e uuid; r record; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          select i.id into v_i from public.institutions i where i.slug like 'synth-alpha-%' and i.is_active order by i.created_at desc limit 1;
          select n.id into v_prog from public.org_nodes n where n.institution_id = v_i and n.kind = 'PROGRAMME' and n.is_active order by n.created_at limit 1;
          select ap.id into v_per from public.academic_periods ap where ap.institution_id = v_i order by ap.starts_on limit 1;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_prog, 'COHORT', 'Tingkat E ' || ${lit(tag)}, v_per) returning id into v_t;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_t, 'CLASS', 'Kelas E ' || ${lit(tag)}, v_per) returning id into v_k;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_t, 'CLASS', 'Kelas F ' || ${lit(tag)}, v_per) returning id into v_k2;
          for r in select * from (values ('A'), ('B')) t(k) loop
            insert into public.persons (display_name) values ('Murid ' || r.k || ' kembali ' || ${lit(tag)}) returning id into v_p;
            insert into public.enrollments (person_id, institution_id, academic_period_id, status, valid_from)
            values (v_p, v_i, v_per, 'ACTIVE', now() - interval '20 days') returning id into v_e;
            insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_k, v_per);
          end loop;
          perform set_config('kb.ids', v_i || '|' || v_k || '|' || v_k2, false);
        end $$;
        select current_setting('kb.ids') || '|' || string_agg(p.id::text, '|' order by p.display_name)
          from public.persons p where p.display_name like 'Murid _ kembali ' || ${lit(tag)};`).split("\n").pop()!.split("|");
      if (!c.expect([alpha, kelas, kelas2, a, b].every((x) => /^[0-9a-f-]{36}$/.test(x ?? "")), "the fixture was not made")) return c.verdict("");
      const nama = (k: string) => `Murid ${k} kembali ${tag}`;
      const tempat = (orang: string) => psql(`select coalesce(string_agg(n.name || '/' || e.status, ','), '-') from public.enrollments e
        join public.memberships m on m.enrollment_id = e.id and m.valid_to is null join public.org_nodes n on n.id = m.node_id
        where e.person_id = ${lit(orang)} and e.status in ('PENDING', 'ACTIVE')`);
      const admin = new Komputer(asal, ipUji());
      const m = await admin.jsonDari("/masuk/password", { form: { identitas: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" } });
      if (!c.expect(m.status === 200, `Alpha's admin could not sign in (${m.status})`)) return c.verdict("");
      await admin.halaman("/konfigurasi");
      await admin.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      await pilihKonteksPeramban(admin, `MENGELOLA:${alpha}`);

      // E3: both leave from their row in Kelas E, with a reason and today's date
      for (const [orang, alasan] of [[a, "WITHDRAWN"], [b, "WITHDRAWN"]] as const) {
        const penempatan = psql(`select m.id from public.memberships m join public.enrollments e on e.id = m.enrollment_id where e.person_id = ${lit(orang)} and m.valid_to is null`);
        const h = await (await admin.halaman(`/konfigurasi/pindah?dari=${kelas}&akhiri=${penempatan}`)).text();
        const f = formDengan(h, `data-akhiri-form="${penempatan}"`, { alasan, tanggal: psql("select (now() at time zone 'Asia/Jakarta')::date::text") });
        if (!c.expect(typeof f !== "string", `the «Akhiri pendaftaran» panel: ${f}`)) return c.verdict("");
        const r = await admin.kirim("/konfigurasi/pindah", { form: f as Record<string, string> });
        c.expect(/hasil=ok/.test(r.headers.get("location") ?? "") && tempat(orang) === "-", `ending ${orang === a ? "A" : "B"}: ${r.status} ${r.headers.get("location")}; now ${tempat(orang)}`);
      }
      // E4: both are listed under «Murid yang sudah keluar»; A's ending is undone (back in Kelas E), B returns into Kelas F
      const h4 = await (await admin.halaman("/konfigurasi/pindah")).text();
      c.expect(teks(h4).includes(nama("A")) && teks(h4).includes(nama("B")), "«Murid yang sudah keluar» does not list both");
      const fa = formDengan(h4, `name="orang" value="${a}"`, { jenis: "CORRECTION", alasan: "dicatat keliru, belum keluar", kelas: "" });
      const fb = formDengan(h4, `name="orang" value="${b}"`, { jenis: "RETURN", alasan: "kembali bersekolah di sini", kelas: kelas2 });
      if (!c.expect(typeof fa !== "string" && typeof fb !== "string", `the re-enrolment forms: ${fa} ${fb}`)) return c.verdict("");
      for (const f of [fa, fb]) {
        const r = await admin.kirim("/konfigurasi/pindah", { form: f as Record<string, string> });
        c.expect(/hasil=ok/.test(r.headers.get("location") ?? ""), `a re-enrolment answered ${r.status} ${r.headers.get("location")}`);
      }
      c.expect(tempat(a) === `Kelas E ${tag}/ACTIVE` || tempat(a) === `Kelas E ${tag}/PENDING`, `after the correction A is ${tempat(a)}`);
      c.expect(/^Kelas F /.test(tempat(b)), `after the return B is ${tempat(b)}`);
      const sejarah = psql(`select count(*) from public.enrollments where person_id in (${lit(a)}, ${lit(b)}) and status = 'ENDED' and end_reason = 'WITHDRAWN'`);
      c.expect(sejarah === "2", `the two endings were not kept (${sejarah})`);
      return c.verdict("as Alpha's admin, on Pindah kelas: two learners' enrolments ended from their rows with a reason and the date; both listed under «Murid yang sudah keluar»; " +
        "one ending undone (back in its Kelas), the other a return into another Kelas; both endings kept in the history");
    },
  },
  {
    id: "PENUGASAN-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      // W2.21 «Akhiri penugasan» on the class page, as Alpha's Guru, through the running app
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      // a class of the test's own, taught by Alpha's Guru, with one learner and one lesson in force (its learning
      // assignment ACTIVE and its assessment OPEN, as assign_release leaves them; written past the triggers)
      const [alpha, kelas, la, aa] = psql(`
        do $$ declare v_i uuid; v_prog uuid; v_per uuid; v_t uuid; v_k uuid; v_g uuid; v_p uuid; v_e uuid; v_r uuid; v_d uuid; v_la uuid; v_aa uuid; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          select i.id into v_i from public.institutions i where i.slug like 'synth-alpha-%' and i.is_active order by i.created_at desc limit 1;
          select n.id into v_prog from public.org_nodes n where n.institution_id = v_i and n.kind = 'PROGRAMME' and n.is_active order by n.created_at limit 1;
          select ap.id into v_per from public.academic_periods ap where ap.institution_id = v_i order by ap.starts_on limit 1;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_prog, 'COHORT', 'Tingkat P ' || ${lit(tag)}, v_per) returning id into v_t;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_t, 'CLASS', 'Kelas P ' || ${lit(tag)}, v_per) returning id into v_k;
          select a.person_id into v_g from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = 'alpha-guru@synthetic.pintar.test';
          insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
          values (v_g, 'EDUCATOR', v_k, v_i, now() - interval '1 day', now() + interval '365 days');
          insert into public.persons (display_name) values ('Murid P ' || ${lit(tag)}) returning id into v_p;
          insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (v_p, v_i, v_per, 'ACTIVE') returning id into v_e;
          insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, v_k, v_per);
          -- a lesson Alpha already teaches (its own or one PINTAR shares with it) and that lesson's Cek penguasaan
          select la0.plp_release_id, aa0.assessment_definition_id into v_r, v_d
            from public.learning_assignments la0 join public.assessment_assignments aa0 on aa0.learning_assignment_id = la0.id
            join public.assessment_definitions d on d.id = aa0.assessment_definition_id
           where la0.institution_id = v_i and d.mode = 'POST_TEST' order by la0.created_at limit 1;
          if v_r is null then raise exception 'Alpha teaches no lesson with a Cek penguasaan'; end if;
          set local session_replication_role = replica;
          insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id, status, assigned_at)
          select v_i, r.id, r.course_id, v_k, v_per, 'ACTIVE', now() from public.plp_releases r where r.id = v_r returning id into v_la;
          insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id, opens_at, status, assigned_at)
          values (v_i, v_d, v_la, v_k, v_per, now() - interval '1 day', 'OPEN', now()) returning id into v_aa;
          set local session_replication_role = origin;
          perform set_config('pa.ids', v_i || '|' || v_k || '|' || v_la || '|' || v_aa, false);
        end $$;
        select current_setting('pa.ids');`).split("\n").pop()!.split("|");
      if (!c.expect([alpha, kelas, la, aa].every((x) => /^[0-9a-f-]{36}$/.test(x ?? "")), "the fixture was not made (Alpha needs a published lesson with a Cek penguasaan)")) return c.verdict("");
      const keadaan = () => psql(`select la.status || '/' || aa.status from public.learning_assignments la, public.assessment_assignments aa where la.id = ${lit(la)} and aa.id = ${lit(aa)}`);
      const guru = new Komputer(asal, ipUji());
      const m = await guru.jsonDari("/masuk/password", { form: { identitas: "alpha-guru@synthetic.pintar.test", password: "Sintetis-AlphaGuru-52!" } });
      if (!c.expect(m.status === 200, `Alpha's Guru could not sign in (${m.status})`)) return c.verdict("");
      await guru.halaman("/mengajar");
      await guru.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      await pilihKonteksPeramban(guru, `MENGAJAR:${alpha}`);

      // the material's row offers «Akhiri atau tarik»; the panel says what is kept and asks for the kind and a reason
      const h1 = await (await guru.halaman(`/mengajar/${kelas}`)).text();
      c.expect(h1.includes(`data-akhiri-buka="${la}"`), "the class page does not offer «Akhiri atau tarik» on the lesson in force");
      const h2 = await (await guru.halaman(`/mengajar/${kelas}?akhiri=${la}`)).text();
      c.expect(teks(h2).includes("Hasil, sertifikat dan kemajuan belajar yang sudah ada tetap tersimpan"), "the panel does not say what is kept");
      // a refusal first: a 3-character reason changes nothing and comes back with its sentence
      const f1 = formDengan(h2, `data-akhiri="${la}"`, { jenis: "WITHDRAWN", alasan: "oke" });
      if (!c.expect(typeof f1 !== "string", `the «Akhiri penugasan» panel: ${f1}`)) return c.verdict("");
      const r1 = await guru.kirim(`/mengajar/${kelas}`, { form: f1 as Record<string, string> });
      c.expect(/kode=ASSIGN_REASON_REQUIRED/.test(r1.headers.get("location") ?? "") && keadaan() === "ACTIVE/OPEN",
        `a 3-character reason: ${r1.status} ${r1.headers.get("location")}; now ${keadaan()}`);
      const h3 = await (await guru.halaman(r1.headers.get("location") ?? `/mengajar/${kelas}?akhiri=${la}`)).text();
      c.expect(teks(h3).includes("Tuliskan alasannya, 5 sampai 300 karakter."), "the refusal's sentence is not shown on the panel");
      // the withdrawal, on the record
      const f2 = formDengan(h2, `data-akhiri="${la}"`, { jenis: "WITHDRAWN", alasan: `diberikan ke kelas yang salah ${tag}` });
      const r2 = await guru.kirim(`/mengajar/${kelas}`, { form: f2 as Record<string, string> });
      c.expect(/diakhiri=ok/.test(r2.headers.get("location") ?? "") && keadaan() === "WITHDRAWN/CLOSED",
        `the withdrawal: ${r2.status} ${r2.headers.get("location")}; now ${keadaan()}`);
      const audit = psql(`select count(*) from public.audit_log where action = 'learning_assignment.withdrawn' and target_id = ${lit(la)} and summary ->> 'reason' = ${lit(`diberikan ke kelas yang salah ${tag}`)}`);
      c.expect(audit === "1", `the withdrawal has ${audit} audit row(s) with its reason`);
      const h4 = await (await guru.halaman(`/mengajar/${kelas}?diakhiri=ok`)).text();
      c.expect(teks(h4).includes("Penugasan diakhiri. Hasil murid tetap tersimpan.") && teks(h4).includes("Ditarik"),
        "the class page does not confirm the withdrawal and show the material as «Ditarik»");
      c.expect(!h4.includes(`data-akhiri-buka="${la}"`), "a withdrawn assignment is still offered «Akhiri atau tarik»");
      return c.verdict("as Alpha's Guru on the class page: the lesson in force offers «Akhiri atau tarik»; the panel says what is kept; " +
        "a 3-character reason is refused with its sentence and changes nothing; the withdrawal is recorded (WITHDRAWN, its assessment CLOSED, " +
        "one learning_assignment.withdrawn row with the reason) and the page confirms it and shows «Ditarik»");
    },
  },
  {
    id: "SERTIFIKAT-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      // W2.22 «Terbitkan ulang» on Konfigurasi · Sertifikat, as Alpha's admin, through the running app
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const salah = `Murid Salah Ketik ${tag}`, benar = `Murid Benar ${tag}`;
      // a learner of the test's own with an issued certificate under a misspelt name, and the name corrected since
      const [alpha, sert, token] = psql(`
        do $$ declare v_i uuid; v_per uuid; v_p uuid; v_e uuid; v_tpl uuid; v_s uuid; v_snap uuid; v_c uuid; v_num text; v_tok text; v_iso text; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          select i.id into v_i from public.institutions i where i.slug like 'synth-alpha-%' and i.is_active order by i.created_at desc limit 1;
          select ap.id into v_per from public.academic_periods ap where ap.institution_id = v_i order by ap.starts_on limit 1;
          select s.id into v_tpl from public.assessment_sessions s where s.institution_id = v_i and s.mode = 'POST_TEST' order by s.created_at limit 1;
          if v_tpl is null then raise exception 'Alpha has no Cek penguasaan sitting to copy'; end if;
          insert into public.persons (display_name) values (${lit(salah)}) returning id into v_p;
          insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (v_p, v_i, v_per, 'ACTIVE') returning id into v_e;
          -- the sitting the certificate is for, copied from one of Alpha's (written past the provenance guard: whether PINTAR
          -- still shares that lesson with Alpha is not what this test is about, and earlier tests may have withdrawn it)
          set local session_replication_role = replica;
          insert into public.assessment_sessions (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, plp_release_id,
            assessment_definition_id, assessment_definition_version, engine_version, scoring_policy_version, evidence_channel, evidence_class,
            mode, status, shuffle_seed, started_at, deadline_extended_count)
          select gen_random_uuid(), v_p, x.institution_id, v_e, x.academic_period_id, x.class_node_id, x.plp_release_id, x.assessment_definition_id,
                 x.assessment_definition_version, x.engine_version, x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode,
                 'CREATED', x.shuffle_seed, now(), 0
            from public.assessment_sessions x where x.id = v_tpl returning id into v_s;
          set local session_replication_role = origin;
          insert into public.certificate_identity_snapshots (person_id, institution_id, name_as_issued, snapshot_hash)
          values (v_p, v_i, ${lit(salah)}, md5(${lit(salah)})) returning id into v_snap;
          v_num := 'UJI-' || ${lit(tag)} || '/00001';
          v_tok := replace(replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '+', '-'), '/', '_'), '=', '');
          v_iso := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
          insert into public.certificates (session_id, person_id, institution_id, snapshot_id, certificate_number, verification_token, status,
            issued_at_iso, canonical_payload, institution_as_issued, course_subject_as_issued, course_title_as_issued, language_as_issued)
          select v_s, v_p, v_i, v_snap, v_num, v_tok, 'ELIGIBLE', v_iso,
                 jsonb_build_object('certificate_number', v_num, 'identity_snapshot_hash', md5(${lit(salah)}),
                   'result', jsonb_build_object('score', 0.85, 'predikat', 'Baik', 'passed', true, 'safety_gate', true), 'issued_at', v_iso,
                   'plp_release_id', s.plp_release_id, 'release_content_sha256', null, 'assessment_definition_id', s.assessment_definition_id,
                   'assessment_definition_version', s.assessment_definition_version, 'scoring_policy_version', s.scoring_policy_version, 'key_version', 1),
                 i.name, co.subject, co.title, 'id'
            from public.assessment_sessions s join public.institutions i on i.id = s.institution_id
            join public.plp_releases r on r.id = s.plp_release_id join public.courses co on co.id = r.course_id where s.id = v_s
          returning id into v_c;
          perform public.certificate_seal(v_c, 1::smallint, repeat('s', 43));
          set local session_replication_role = replica;
          update public.persons set display_name = ${lit(benar)} where id = v_p;
          set local session_replication_role = origin;
          perform set_config('sa.ids', v_i || '|' || v_c || '|' || v_tok, false);
        end $$;
        select current_setting('sa.ids');`).split("\n").pop()!.split("|");
      if (!c.expect(/^[0-9a-f-]{36}$/.test(alpha ?? "") && /^[0-9a-f-]{36}$/.test(sert ?? "") && (token ?? "").length >= 43, "the fixture was not made")) return c.verdict("");
      const admin = new Komputer(asal, ipUji());
      const m = await admin.jsonDari("/masuk/password", { form: { identitas: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" } });
      if (!c.expect(m.status === 200, `Alpha's admin could not sign in (${m.status})`)) return c.verdict("");
      await admin.halaman("/konfigurasi");
      await admin.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      await pilihKonteksPeramban(admin, `MENGELOLA:${alpha}`);

      // the certificate's panel sets what is written beside what is recorded now, and offers the replacement
      const h1 = await (await admin.halaman(`/konfigurasi/sertifikat?pilih=${sert}`)).text();
      c.expect(teks(h1).includes(salah) && teks(h1).includes(benar) && h1.includes(`data-ganti-form="${sert}"`),
        "the panel does not show the name on the certificate beside the corrected one with «Terbitkan ulang»");
      const f = formDengan(h1, `data-ganti-form="${sert}"`, { alasan: `nama salah ketik saat terbit ${tag}` });
      if (!c.expect(typeof f !== "string", `the «Terbitkan ulang» form: ${f}`)) return c.verdict("");
      const r = await admin.kirim("/konfigurasi/sertifikat", { form: f as Record<string, string> });
      c.expect(/hasil=ok/.test(r.headers.get("location") ?? "") && /jenis=ganti/.test(r.headers.get("location") ?? ""),
        `the reissue answered ${r.status} ${r.headers.get("location")}`);
      const [lama, baru, barutok, alasan] = psql(`select o.status || '|' || n.status || '|' || n.verification_token || '|' || n.correction_reason
        from public.certificates o join public.certificates n on n.supersedes_certificate_id = o.id where o.id = ${lit(sert)} and n.status <> 'ELIGIBLE'`).split("|");
      c.expect(lama === "SUPERSEDED" && baru === "ISSUED" && alasan === `nama salah ketik saat terbit ${tag}`,
        `after the reissue: original ${lama}, replacement ${baru}, reason «${alasan}»`);
      const namaBaru = psql(`select sn.name_as_issued from public.certificates n join public.certificate_identity_snapshots sn on sn.id = n.snapshot_id
        where n.supersedes_certificate_id = ${lit(sert)} and n.status = 'ISSUED'`);
      c.expect(namaBaru === benar, `the replacement carries «${namaBaru}»`);
      // the replacement's own public check: signed by this server's key, it answers BERLAKU; the original says it was replaced
      if (barutok) {
        const v = await fetch(`${asal}/api/verifikasi/${encodeURIComponent(barutok)}`).then((x) => x.json()).catch(() => null) as { validity?: string } | null;
        c.expect(v?.validity === "BERLAKU", `the replacement's public check says ${JSON.stringify(v)}`);
      }
      const h2 = await (await admin.halaman(r.headers.get("location") ?? `/konfigurasi/sertifikat?pilih=${sert}`)).text();
      c.expect(teks(h2).includes("Sertifikat sebelumnya tetap tersimpan sebagai digantikan") && h2.includes("data-digantikan-oleh="),
        "the panel does not confirm the reissue and say what replaced the certificate");
      return c.verdict("as Alpha's admin on Konfigurasi · Sertifikat: the panel sets the misspelt name on the certificate beside the corrected one; " +
        "«Terbitkan ulang» with a reason issues a replacement carrying the corrected name, signed by the server (its public check BERLAKU); " +
        "the original is kept as SUPERSEDED and the panel says which certificate replaced it");
    },
  },
  {
    id: "STAF-A01",
    requires: ["app", "network", "db"],
    run: async (ctx) => {
      // E5 and §11 through the running app, as Alpha's admin: Pak Yusuf becomes Kepala departemen too, goes back to Guru,
      // then leaves the school
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      const nama = `Pak Yusuf ${tag}`;
      const [alpha, orang, dept] = psql(`
        do $$ declare v_i uuid; v_prog uuid; v_per uuid; v_t uuid; v_k uuid; v_p uuid; v_d uuid; begin
          perform set_config('app.seed_intent', 'synthetic', true);
          select i.id into v_i from public.institutions i where i.slug like 'synth-alpha-%' and i.is_active order by i.created_at desc limit 1;
          select n.id into v_prog from public.org_nodes n where n.institution_id = v_i and n.kind = 'PROGRAMME' and n.is_active order by n.created_at limit 1;
          select n.id into v_d from public.org_nodes n where n.institution_id = v_i and n.kind = 'DEPARTMENT' and n.is_active order by n.created_at limit 1;
          select ap.id into v_per from public.academic_periods ap where ap.institution_id = v_i order by ap.starts_on limit 1;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_prog, 'COHORT', 'Tingkat Y ' || ${lit(tag)}, v_per) returning id into v_t;
          insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_i, v_t, 'CLASS', 'Kelas Y ' || ${lit(tag)}, v_per) returning id into v_k;
          insert into public.persons (display_name) values (${lit(nama)}) returning id into v_p;
          insert into public.role_assignments (person_id, role, scope_node_id, institution_id, valid_from, valid_until)
          values (v_p, 'EDUCATOR', v_k, v_i, now() - interval '30 days', now() + interval '365 days');
          perform set_config('sy.ids', v_i || '|' || v_p || '|' || v_d, false);
        end $$;
        select current_setting('sy.ids');`).split("\n").pop()!.split("|");
      if (!c.expect([alpha, orang, dept].every((x) => /^[0-9a-f-]{36}$/.test(x ?? "")), "the fixture was not made")) return c.verdict("");
      const hidup = () => psql(`select coalesce(string_agg(ra.role::text, ',' order by ra.role), '-') from public.role_assignments ra
        where ra.person_id = ${lit(orang)} and ra.revoked_at is null and now() < ra.valid_until`);
      const admin = new Komputer(asal, ipUji());
      const m = await admin.jsonDari("/masuk/password", { form: { identitas: "alpha-admin@synthetic.pintar.test", password: "Sintetis-AlphaAdmin-27!" } });
      if (!c.expect(m.status === 200, `Alpha's admin could not sign in (${m.status})`)) return c.verdict("");
      await admin.halaman("/konfigurasi");
      await admin.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      await pilihKonteksPeramban(admin, `MENGELOLA:${alpha}`);

      // «Peran & akses» names the person and opens their page
      const h0 = await (await admin.halaman("/konfigurasi/roles")).text();
      const h1 = await (await admin.halaman(`/konfigurasi/staf?orang=${orang}`)).text();
      c.expect(teks(h1).includes(nama) && teks(h1).includes("Menyediakan materi untuk kelas"), `the person's page does not show the role and its responsibilities in words: ${teks(h1).slice(0, 400)}`);
      // 1. promotion: the review says what is gained, then one confirmation
      const sampai = psql("select ((now() at time zone 'Asia/Jakarta')::date + 200)::text");
      const q = new URLSearchParams({ orang, tinjau: "1", tambah_peran: "HEAD_OF_DEPARTMENT", tambah_tempat: dept, tambah_sampai: sampai, alasan: `menjadi Kepala departemen juga ${tag}` });
      const h2 = await (await admin.halaman(`/konfigurasi/staf?${q.toString()}`)).text();
      c.expect(h2.includes("data-staf-tinjau") && teks(h2).includes("Meninjau materi"), "the review does not show what is gained");
      const f2 = formDengan(h2, "data-staf-terapkan", {});
      if (!c.expect(typeof f2 !== "string", `the confirmation form: ${f2}`)) return c.verdict("");
      const r2 = await admin.kirim("/konfigurasi/staf", { form: f2 as Record<string, string> });
      c.expect(/hasil=ok/.test(r2.headers.get("location") ?? "") && hidup() === "EDUCATOR,HEAD_OF_DEPARTMENT", `the promotion: ${r2.headers.get("location")}; now ${hidup()}`);
      // 2. demotion: back to Guru only; teaching stays
      const hod = psql(`select id from public.role_assignments where person_id = ${lit(orang)} and role = 'HEAD_OF_DEPARTMENT' and revoked_at is null`);
      const q3 = new URLSearchParams({ orang, tinjau: "1", cabut: hod, alasan: `kembali menjadi Guru saja ${tag}` });
      const h3 = await (await admin.halaman(`/konfigurasi/staf?${q3.toString()}`)).text();
      c.expect(teks(h3).includes("Tanggung jawab yang hilang") && teks(h3).includes("Meninjau materi"), "the demotion's review does not show what is lost");
      const f3 = formDengan(h3, "data-staf-terapkan", {});
      const r3 = await admin.kirim("/konfigurasi/staf", { form: f3 as Record<string, string> });
      c.expect(/hasil=ok/.test(r3.headers.get("location") ?? "") && hidup() === "EDUCATOR", `the demotion: ${r3.headers.get("location")}; now ${hidup()}`);
      // 3. the person leaves the school (E5)
      const h4 = await (await admin.halaman(`/konfigurasi/staf?orang=${orang}`)).text();
      const f4 = formDengan(h4, "data-staf-akhiri", { kategori: "RESIGNATION", tanggal: psql("select (now() at time zone 'Asia/Jakarta')::date::text"), alasan: `mengundurkan diri akhir semester ${tag}` });
      if (!c.expect(typeof f4 !== "string", `the «Akhiri tugas» form: ${f4}`)) return c.verdict("");
      const r4 = await admin.kirim("/konfigurasi/staf", { form: f4 as Record<string, string> });
      c.expect(/hasil=ok/.test(r4.headers.get("location") ?? "") && hidup() === "-", `the departure: ${r4.headers.get("location")}; now ${hidup()}`);
      const jejak = psql(`select count(*) from public.audit_log where action = 'staff.ended_at_school' and target_id = ${lit(orang)} and summary ->> 'reason_code' = 'RESIGNATION'`);
      const ubah = psql(`select count(*) from public.audit_log where action = 'role.changed' and target_id = ${lit(orang)}`);
      c.expect(jejak === "1" && ubah === "2", `audit: ${jejak} staff.ended_at_school, ${ubah} role.changed`);
      c.expect(h0.includes(`data-staf-buka="${orang}"`), "«Peran & akses» does not open the person's page from their name");
      return c.verdict("as Alpha's admin: «Peran & akses» opens Pak Yusuf's page from his name; the page sets his role and its responsibilities in words; " +
        "made Kepala departemen as well after a review of what is gained, then back to Guru after a review of what is lost (teaching kept), " +
        "then his duties at the school ended with a category, the date and a reason; audit log rows: two role.changed, one staff.ended_at_school");
    },
  },
  {
    id: "AKUN-A01",
    requires: ["app", "network", "db", "mailsink"],
    run: async (ctx) => {
      // L1–L4 and §5b through the running app: a learner reads how to leave; an educator asks to delete their personal
      // data and closes their account; the PINTAR Administrator carries out the deletion from the queue
      const c = new Checks();
      const asal = ctx.appUrl!;
      const tag = randomBytes(4).toString("hex");
      // a learner first: «Meninggalkan PINTAR» says the request goes through the school, and offers no form
      const murid = new Komputer(asal, ipUji());
      const mm = await murid.jsonDari("/masuk/password", { form: { identitas: "alpha-siswa-1@synthetic.pintar.test", password: "Sintetis-AlphaSiswa1-76!" } });
      if (c.expect(mm.status === 200, `the learner could not sign in (${mm.status})`)) {
        await murid.halaman("/belajar");
        await murid.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
        const hm = await (await murid.halaman("/akun")).text();
        c.expect(hm.includes("data-tinggal-lewat-sekolah") && !hm.includes("data-minta-akun="), "the learner's Akun saya does not send the request through the school, or offers a form");
      }
      // an educator of their own
      const email = `tinggal-${tag}@local.invalid`;
      const orang = await daftar(asal, `Guru Tinggal ${tag}`, email);
      const sandi = await aktifkan(c, asal, email, `tinggal.${tag}`, "5937");
      if (!sandi) return c.verdict("");
      const guru = new Komputer(asal, ipUji());
      const m = await guru.jsonDari("/masuk/password", { form: { identitas: email, password: sandi } });
      if (!c.expect(m.status === 200, `the educator could not sign in (${m.status})`)) return c.verdict("");
      await guru.halaman("/akun");
      await guru.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      const h1 = await (await guru.halaman("/akun")).text();
      c.expect(teks(h1).includes("Meninggalkan PINTAR") && teks(h1).includes("saat ini 7 hari"), "Akun saya does not say what leaving means, backups included");
      const f1 = formDengan(h1, 'data-minta-akun="DELETE_PERSONAL_DATA"', { konfirmasi: "ya" });
      if (!c.expect(typeof f1 !== "string", `the deletion request form: ${f1}`)) return c.verdict("");
      const r1 = await guru.kirim("/akun", { form: f1 as Record<string, string> });
      c.expect(/hasil=ok/.test(r1.headers.get("location") ?? ""), `the deletion request answered ${r1.status} ${r1.headers.get("location")}`);
      const h2 = await (await guru.halaman("/akun")).text();
      c.expect(teks(h2).includes("Diterima"), "the request does not read back as «Diterima»");
      const f2 = formDengan(h2, 'data-minta-akun="CLOSE"', { konfirmasi: "ya" });
      if (!c.expect(typeof f2 !== "string", `the closure form: ${f2}`)) return c.verdict("");
      const r2 = await guru.kirim("/akun", { form: f2 as Record<string, string> });
      c.expect(/\/keluar/.test(r2.headers.get("location") ?? ""), `the closure answered ${r2.status} ${r2.headers.get("location")}`);
      const keadaan = psql(`select category from public.person_suspensions where person_id = ${lit(orang)} and ended_at is null`);
      c.expect(keadaan === "CLOSED_AT_REQUEST", `after closing, the account is «${keadaan}»`);
      const lagi = await new Komputer(asal, ipUji()).jsonDari("/masuk/password", { form: { identitas: email, password: sandi } });
      c.expect(lagi.status !== 200, `a closed account signed in again (${lagi.status})`);
      // the PINTAR Administrator finds the request and deletes the closed account's personal data
      const sys = new Komputer(asal, ipUji());
      const ms = await sys.jsonDari("/masuk/password", { form: { identitas: "sysadmin@synthetic.pintar.test", password: "Sintetis-Sys-91!" } });
      if (!c.expect(ms.status === 200, `the PINTAR Administrator could not sign in (${ms.status})`)) return c.verdict("");
      await sys.halaman("/konfigurasi");
      await sys.jsonDari("/api/sesi/perangkat", { form: { mode: "PERSONAL" } });
      await pilihKonteksPeramban(sys, "MENGELOLA:PLATFORM");
      const pid = psql(`select pintar_id from public.persons where id = ${lit(orang)}`);
      const h3 = await (await sys.halaman(`/konfigurasi/keamanan?pid=${pid}`)).text();
      c.expect(h3.includes('data-akun-keadaan="CLOSED_AT_REQUEST"') && teks(h3).includes("Ditutup atas permintaan sendiri"), "the platform's view does not read the closure as a closure");
      const req = psql(`select id from public.account_requests where person_id = ${lit(orang)} and kind = 'DELETE_PERSONAL_DATA'`);
      const f3 = formDengan(h3, `data-hapus-data="${req}"`, {});
      if (!c.expect(typeof f3 !== "string", `the deletion form in the queue: ${f3}`)) return c.verdict("");
      const r3 = await sys.kirim("/konfigurasi/keamanan", { form: f3 as Record<string, string> });
      c.expect(/hasil=ok/.test(r3.headers.get("location") ?? ""), `the deletion answered ${r3.status} ${r3.headers.get("location")}`);
      const sesudah = psql(`select display_name || '|' || (anonymized_at is not null) from public.persons where id = ${lit(orang)}`);
      c.expect(sesudah === `${pid}|true`, `after the deletion the person reads «${sesudah}»`);
      return c.verdict("a learner's Akun saya sends the request through the school and offers no form; an educator's rendered Akun saya says what leaving means (backups 7 days); " +
        "their deletion request reads back «Diterima»; the closure takes effect at once (CLOSED_AT_REQUEST, sign-in refused); the PINTAR Administrator reads it as a closure " +
        "and carries out the deletion from the queue: the name becomes the PINTAR ID, anonymized_at set");
    },
  },
];
