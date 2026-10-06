/**
 * FOLLOW-UPS 19, 20 AND 21 (JOURNEY-LOG; D-100(d) item 5) — three records that lost or never kept what they said.
 *
 *  S01  the source: migration 20261121100000 keeps the request's reason out of the rejection's update, gives the
 *       rejection its own column and puts both in the audit; the template's audit names the selection it saved and
 *       the one it replaced; a course's status change writes one audit row.
 *  D01  against the database, rolled back: a rejected transfer keeps the reason it was requested with and records its
 *       own, both on the audit row with the states; two saves of a template leave each version's selection on the
 *       record; a Studio step on a course is one audit row with its from and to, and an edit that moves no status none.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Checks, type SelfTest } from "./lib";

const MIGRASI = "supabase/migrations/20261121100000_a_record_keeps_what_it_said.sql";

const DB_SKRIP = `
begin;
do $fu$
declare v jsonb := '{}'::jsonb; c record; inst2 uuid; per2 uuid; enr uuid; tr uuid; v_dulu bigint; j jsonb; v_cat text;
        m1 text; v1 text; m2 text; v2 text; tpl uuid; crs uuid; n int;
begin
  perform selftest.as_owner();
  select * into c from selftest.wp2_school();
  select coalesce(max(id), 0) into v_dulu from public.audit_log;

  -- (19) a transfer requested for one reason and rejected for another
  select ap.institution_id, ap.id into inst2, per2 from public.academic_periods ap
    join public.institutions i on i.id = ap.institution_id
   where ap.institution_id <> c.inst and i.tenant_kind = 'INSTITUTION' order by i.name, ap.created_at limit 1;
  select e.id into enr from public.enrollments e where e.person_id = c.la and e.institution_id = c.inst and e.status = 'ACTIVE' limit 1;
  insert into public.transfers (person_id, from_enrollment_id, from_institution_id, to_institution_id, to_academic_period_id, reason)
  values (c.la, enr, c.inst, inst2, per2, 'Pindah domisili ke kota lain') returning id into tr;
  perform selftest.as_user_uid(c.adm_u);
  perform public.transfer_reject(tr, 'Berkas belum lengkap');
  perform selftest.as_owner();
  select jsonb_build_object('alasan', t.reason, 'penolakan', to_jsonb(t) ->> 'rejection_reason', 'status', t.status) into j
    from public.transfers t where t.id = tr;
  v := v || jsonb_build_object('t19', j);
  select a.summary into j from public.audit_log a
   where a.id > v_dulu and a.action = 'transfer.rejected' and a.target_id = tr::text and a.institution_id = c.inst order by a.id desc limit 1;
  v := v || jsonb_build_object('a19', j);

  -- (20) a template saved, then revised to another selection
  v_cat := public.current_metric_catalogue();
  select m.metric_id, m.allowed_visualizations[1] into m1, v1 from public.metric_definitions m
   where m.catalogue_version = v_cat and not m.deprecated and m.scope = 'INSTITUTION' order by m.metric_id limit 1;
  select m.metric_id, m.allowed_visualizations[1] into m2, v2 from public.metric_definitions m
   where m.catalogue_version = v_cat and not m.deprecated and m.scope = 'INSTITUTION' and m.metric_id <> m1 order by m.metric_id limit 1;
  perform selftest.as_user_uid(c.adm_u);
  tpl := public.save_report_template(c.inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
    jsonb_build_array(jsonb_build_object('metric_id', m1, 'visualization', v1), jsonb_build_object('metric_id', m2, 'visualization', v2)));
  perform public.save_report_template(c.inst, 'institution_learning_intelligence', 'laporan.institusi.judul',
    jsonb_build_array(jsonb_build_object('metric_id', m2, 'visualization', v2)), tpl);
  perform selftest.as_owner();
  select jsonb_agg(jsonb_build_object('versi', a.summary -> 'template_version', 'pilihan', a.summary -> 'selection',
                                      'dari_versi', a.summary -> 'from_version', 'dari_pilihan', a.summary -> 'from_selection') order by a.id)
    into j from public.audit_log a where a.id > v_dulu and a.action = 'report_template.saved' and a.target_id = tpl::text;
  v := v || jsonb_build_object('a20', j, 'm1', m1, 'v1', v1, 'm2', m2, 'v2', v2);

  -- (21) a Studio step on a course, and an edit that moves no status
  select co.id into crs from public.courses co where co.status = 'INGESTED' order by co.id limit 1;
  update public.courses set status = 'STRUCTURED' where id = crs;
  update public.courses set status = 'STRUCTURED' where id = crs;
  select jsonb_agg(jsonb_build_object('dari', a.summary ->> 'from_state', 'ke', a.summary ->> 'to_state') order by a.id), count(*)
    into j, n from public.audit_log a where a.id > v_dulu and a.action = 'content.status_changed' and a.target_id = crs::text;
  v := v || jsonb_build_object('a21', j, 'n21', n, 'ada_kursus', crs is not null);
  raise notice 'FU1921 %', v;
end $fu$;
rollback;
`;

export const fu1921Tests: SelfTest[] = [
  {
    id: "FU1921-S01",
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const mig = readFileSync(join(repoRoot, MIGRASI), "utf8");
      const tolak = mig.slice(mig.indexOf("function public.transfer_reject"), mig.indexOf("function public.transfers_audit"));
      c.expect(/rejection_reason = nullif\(btrim\(coalesce\(p_reason, ''\)\), ''\)/.test(tolak) && !/reason = coalesce\(p_reason, reason\)/.test(tolak),
        "a rejection still writes over the reason the transfer was requested with");
      c.expect(/'reason', new\.reason, 'rejection_reason', new\.rejection_reason/.test(mig) && /'from_state', case when tg_op = 'UPDATE' then old\.status end, 'to_state', new\.status/.test(mig),
        "the transfer's audit row does not carry both reasons and its states");
      c.expect(/'selection', v_selection, 'from_version', v_from_version, 'from_selection', v_from_selection/.test(mig)
        && /v_version := v_version \+ 1;/.test(mig) && /or not public\.can_in_institution\('CAN_MANAGE_REPORT_TEMPLATES', p_institution\) then/.test(mig),
        "the template's audit row does not name the selection saved and the one replaced, or the version bump and capability gate moved");
      c.expect(/create trigger courses_status_audit after update of status on public\.courses\s+for each row when \(old\.status is distinct from new\.status\)/.test(mig)
        && /'content\.status_changed'/.test(mig), "a course's status change is not one audit row");
      return c.verdict("the source: migration 20261121100000 gives a transfer's rejection its own reason and leaves the request's alone, and " +
        "the transfer's audit row carries both with its from and to states; the template's audit row names the selection saved and, for " +
        "a revision, the version and selection it replaced, with the version bump and the capability gate unchanged; a course's status " +
        "change, which ends every Studio step, writes one content.status_changed row");
    },
  },
  {
    id: "FU1921-D01",
    requires: ["db"],
    run: async ({ repoRoot }) => {
      const c = new Checks();
      const db = process.env.SUPABASE_DB_URL!;
      for (const f of ["fable01.sql", "fable06.sql"]) {
        spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-q", "-1", "-f", join(repoRoot, "selftest", "db", f), db], { encoding: "utf8" });
      }
      const r = spawnSync("psql", ["-v", "ON_ERROR_STOP=1", "-At", "-c", DB_SKRIP, db], { encoding: "utf8", maxBuffer: 1 << 24 });
      const baris = (r.stderr || "").split("\n");
      const catat = baris.find((l) => l.includes("NOTICE:  FU1921 "));
      if (!c.expect(!!catat, `the database half could not run: ${baris.find((l) => /ERROR/.test(l)) ?? (r.stderr || "").trim().split("\n").pop()}`)) return c.verdict("");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the database's own JSON
      const v: Record<string, any> = JSON.parse(catat!.slice(catat!.indexOf("FU1921 ") + 7));
      c.expect(v.t19?.alasan === "Pindah domisili ke kota lain" && v.t19?.penolakan === "Berkas belum lengkap" && v.t19?.status === "REJECTED",
        `follow-up 19, the transfer: ${JSON.stringify(v.t19)}`);
      c.expect(v.a19?.reason === "Pindah domisili ke kota lain" && v.a19?.rejection_reason === "Berkas belum lengkap"
        && v.a19?.from_state === "REQUESTED" && v.a19?.to_state === "REJECTED", `follow-up 19, its audit row: ${JSON.stringify(v.a19)}`);
      const a = v.a20 ?? [];
      const pilih = (m: string, vis: string) => ({ metric_id: m, visualization: vis });
      c.expect(a.length === 2 && JSON.stringify(a[0].pilihan) === JSON.stringify([pilih(v.m1, v.v1), pilih(v.m2, v.v2)]) && a[0].dari_versi === null
        && a[1].versi === 2 && a[1].dari_versi === 1 && JSON.stringify(a[1].dari_pilihan) === JSON.stringify(a[0].pilihan)
        && JSON.stringify(a[1].pilihan) === JSON.stringify([pilih(v.m2, v.v2)]), `follow-up 20, the template's two saves: ${JSON.stringify(a)}`);
      c.expect(v.ada_kursus === true && v.n21 === 1 && v.a21?.[0]?.dari === "INGESTED" && v.a21?.[0]?.ke === "STRUCTURED",
        `follow-up 21, the course's step: ${JSON.stringify(v.a21)} (${v.n21} row(s))`);
      return c.verdict("migration 20261121100000 against the database, rolled back: a transfer requested «Pindah domisili ke kota lain» and " +
        "rejected «Berkas belum lengkap» keeps both, and its audit row carries both with REQUESTED → REJECTED; a template saved with two " +
        "metrics and revised to one leaves each version's selection on the record, the revision naming version 1 and what it showed; a " +
        "course moved INGESTED → STRUCTURED writes one content.status_changed row, and an update that moves no status writes none");
    },
  },
];
