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
import { ipUji, lit, psql } from "./bob26.test";
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
];
