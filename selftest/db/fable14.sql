-- FABLE-14 database suite: BOB-06, every school has its standard reports
-- (D-010, audit B6b).
--
-- Ordering: depends on fable01.sql (role switches) and fable11.sql (f11_user,
-- f11_raised, f11_note). Never applied as a migration; never present in
-- production.
--
-- It works inside the seeded learning-cycle school (supabase/seed/
-- learning_cycle.sql): its admin and a dean made here read the school's two
-- summaries, and a school created here is given both at creation.
--
--   F14-P01  every school carries PINTAR's standard class and school reports,
--            drawn from the live catalogue, and the platform's canonical
--            tenant carries none; a school created now is given both, audited
--   F14-P02  the school's admin opens the class summary at a class and a dean
--            the school summary at the school, each with every standard metric
--            decided for them; a school's own assembly sits beside the
--            standard one at its own version 1
--   F14-N01  PINTAR's rows are not the school's to edit, extend or remove, a
--            reader without the capability still writes no template, and no
--            client can hold the provisioning pass or call the provisioner
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f11_user(text, public.app_role, uuid)') is null
     or to_regprocedure('selftest.f11_raised(text)') is null then
    raise exception 'apply fable01.sql and fable11.sql before fable14.sql';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable14()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; n int; m int; v jsonb; v_tag text; v_err jsonb;
  v_inst uuid; v_cls uuid; v_root uuid; v_new uuid; v_edu uuid;
  v_tpl_kelas uuid; v_tpl_sekolah uuid; v_own uuid; v_cat text;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  m_refused int := 0;
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);
    v_cat := public.current_metric_catalogue();
    select i.id into v_inst from public.institutions i where i.slug like 'synth-siklus-%' order by i.created_at desc limit 1;
    if v_inst is null then raise exception 'the seeded learning-cycle school is not there'; end if;
    select n.id into v_cls from public.org_nodes n where n.institution_id = v_inst and n.kind = 'CLASS' order by n.created_at limit 1;
    select n.id into v_root from public.org_nodes n where n.institution_id = v_inst and n.kind = 'INSTITUTION' limit 1;
    perform selftest.f11_user('f14-dekan-' || v_tag || '@local.invalid', 'DEAN', v_root);
    v_edu := selftest.f11_user('f14-guru-' || v_tag || '@local.invalid', 'EDUCATOR', v_root);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F14-P01  EVERY SCHOOL CARRIES BOTH; THE CANONICAL TENANT NEITHER; A NEW
    --          SCHOOL IS GIVEN BOTH AT CREATION.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      for r in
        select i.id, i.slug, i.tenant_kind,
               (select count(*) from public.report_templates t where t.institution_id = i.id and t.is_standard
                   and t.standard_report = 'class_learning_intelligence' and t.template_version = 1) as kelas,
               (select count(*) from public.report_templates t where t.institution_id = i.id and t.is_standard
                   and t.standard_report = 'institution_learning_intelligence' and t.template_version = 1) as sekolah,
               (select count(*) from public.report_templates t where t.institution_id = i.id and t.is_standard) as semua
          from public.institutions i
      loop
        if r.tenant_kind = 'INSTITUTION' and (r.kelas <> 1 or r.sekolah <> 1 or r.semua <> 2) then
          v_probs := selftest.f11_note(v_probs, 'F14-P01',
            format('school %s carries %s class and %s school standard report(s) of %s standard row(s)', r.slug, r.kelas, r.sekolah, r.semua));
        elsif r.tenant_kind <> 'INSTITUTION' and r.semua <> 0 then
          v_probs := selftest.f11_note(v_probs, 'F14-P01', format('the %s tenant %s carries %s standard report(s)', r.tenant_kind, r.slug, r.semua));
        end if;
      end loop;
      select count(*) into n from public.institutions i where i.tenant_kind = 'INSTITUTION';
      if n < 3 then v_probs := selftest.f11_note(v_probs, 'F14-P01', format('only %s school(s) to look at', n)); end if;

      -- the assembly is the standard one, in its order, and the catalogue's
      select t.id into v_tpl_kelas from public.report_templates t
       where t.institution_id = v_inst and t.is_standard and t.standard_report = 'class_learning_intelligence';
      select t.id into v_tpl_sekolah from public.report_templates t
       where t.institution_id = v_inst and t.is_standard and t.standard_report = 'institution_learning_intelligence';
      if (select string_agg(m2.metric_id, ',' order by m2.ordinal) from public.report_template_metrics m2 where m2.template_id = v_tpl_kelas)
         is distinct from 'class.participants,class.comprehension,class.net_gain,class.readiness_distribution,class.topic_mastery,class.misconceptions' then
        v_probs := selftest.f11_note(v_probs, 'F14-P01', 'the class report is not the standard assembly: ' ||
          coalesce((select string_agg(m2.metric_id, ',' order by m2.ordinal) from public.report_template_metrics m2 where m2.template_id = v_tpl_kelas), 'none'));
      end if;
      if (select string_agg(m2.metric_id, ',' order by m2.ordinal) from public.report_template_metrics m2 where m2.template_id = v_tpl_sekolah)
         is distinct from 'institution.participants,institution.net_gain,institution.safety_gate_pass_rate,institution.verified_credentials,institution.competency_outcomes,institution.cohort_comparison' then
        v_probs := selftest.f11_note(v_probs, 'F14-P01', 'the school report is not the standard assembly: ' ||
          coalesce((select string_agg(m2.metric_id, ',' order by m2.ordinal) from public.report_template_metrics m2 where m2.template_id = v_tpl_sekolah), 'none'));
      end if;
      select count(*) into n from public.report_template_metrics m2
        join public.report_templates t on t.id = m2.template_id and t.is_standard
        left join public.metric_definitions d on d.catalogue_version = v_cat and d.metric_id = m2.metric_id
       where d.metric_id is null or d.deprecated or not (m2.visualization = any (d.allowed_visualizations));
      if n <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F14-P01', format('%s standard row(s) name a metric or drawing the live catalogue does not offer', n));
      end if;

      -- a school created now
      insert into public.institutions (name, slug, is_synthetic, is_active)
      values ('F14 sekolah ' || v_tag, 'f14-sekolah-' || v_tag, true, true) returning institutions.id into v_new;
      select count(*) into n from public.report_templates t where t.institution_id = v_new and t.is_standard and t.created_by_person_id is null;
      select count(*) into m from public.audit_log a where a.institution_id = v_new and a.action = 'report_template.provisioned';
      if n <> 2 or m <> 2 then
        v_probs := selftest.f11_note(v_probs, 'F14-P01', format('a school created now has %s standard report(s) and %s audit row(s), expected 2 and 2', n, m));
      end if;
      if (select string_agg(m2.metric_id, ',' order by m2.ordinal) from public.report_template_metrics m2
            join public.report_templates t on t.id = m2.template_id
           where t.institution_id = v_new and t.is_standard and t.standard_report = 'class_learning_intelligence')
         is distinct from 'class.participants,class.comprehension,class.net_gain,class.readiness_distribution,class.topic_mastery,class.misconceptions' then
        v_probs := selftest.f11_note(v_probs, 'F14-P01', 'the class report is not the standard assembly in a school created now');
      end if;
    exception when others then
      v_probs := selftest.f11_note(v_probs, 'F14-P01', 'the test could not run: ' || left(sqlerrm, 150));
      perform selftest.as_owner();
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F14-P02  THE SUMMARIES OPEN FOR THE PEOPLE THEY ARE FOR; A SCHOOL'S OWN
    --          ASSEMBLY SITS BESIDE THE STANDARD ONE.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('siklus-admin@synthetic.pintar.test');
      select count(*) into n from public.report_templates t where t.institution_id = v_inst and t.is_standard;
      if n <> 2 then v_probs := selftest.f11_note(v_probs, 'F14-P02', format('the school''s admin reads %s standard report(s)', n)); end if;
      v := public.generate_report(v_tpl_kelas, v_cls);
      select count(*) into n from jsonb_array_elements(v -> 'entries') e where e ->> 'status' is not null;
      if jsonb_array_length(coalesce(v -> 'entries', '[]'::jsonb)) <> 6 or n <> 6 then
        v_probs := selftest.f11_note(v_probs, 'F14-P02', format('the admin''s class summary carries %s entry(ies), %s decided', jsonb_array_length(coalesce(v -> 'entries', '[]'::jsonb)), n));
      end if;

      perform selftest.as_user('f14-dekan-' || v_tag || '@local.invalid');
      v := public.generate_report(v_tpl_sekolah, v_root);
      select count(*) into n from jsonb_array_elements(v -> 'entries') e where e ->> 'status' is not null;
      select count(*) into m from jsonb_array_elements(v -> 'entries') e where e ->> 'status' = 'not_permitted';
      if jsonb_array_length(coalesce(v -> 'entries', '[]'::jsonb)) <> 6 or n <> 6 or m <> 0 then
        v_probs := selftest.f11_note(v_probs, 'F14-P02', format('the dean''s school summary carries %s entry(ies), %s decided, %s refused', jsonb_array_length(coalesce(v -> 'entries', '[]'::jsonb)), n, m));
      end if;

      -- the school assembles its own: version 1 of its own, beside PINTAR's
      perform selftest.as_user('siklus-admin@synthetic.pintar.test');
      v_own := public.save_report_template(v_inst, 'class_learning_intelligence', 'laporan.kelas.judul',
        jsonb_build_array(jsonb_build_object('metric_id', 'class.participants', 'visualization', 'hero_stat')));
      perform selftest.as_owner();
      select count(*) into n from public.report_templates t
       where t.institution_id = v_inst and t.standard_report = 'class_learning_intelligence';
      if v_own is null or n <> 2
         or not exists (select 1 from public.report_templates t where t.id = v_own and not t.is_standard and t.template_version = 1) then
        v_probs := selftest.f11_note(v_probs, 'F14-P02', format('the school''s own class report did not sit beside the standard one (%s row(s))', n));
      end if;
    exception when others then
      v_probs := selftest.f11_note(v_probs, 'F14-P02', 'the test could not run: ' || left(sqlerrm, 150));
      perform selftest.as_owner();
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F14-N01  PINTAR'S ROWS ARE NOT THE SCHOOL'S; THE PASS IS NOBODY ELSE'S.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('siklus-admin@synthetic.pintar.test');
      for r in select * from (values
          ('edit', 'guard', format('update public.report_templates set title_key = %L where id = %L', 'laporan.kelas.judul', v_tpl_kelas)),
          ('flip the mark', 'guard', format('update public.report_templates set is_standard = false where id = %L', v_tpl_kelas)),
          ('revise through save_report_template', 'guard', format('select public.save_report_template(%L, %L, %L, %L::jsonb, %L)',
              v_inst, 'class_learning_intelligence', 'laporan.kelas.judul',
              '[{"metric_id":"class.participants","visualization":"hero_stat"}]', v_tpl_kelas)),
          ('add a metric', 'guard', format('insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization) values (%L, %L, 9, %L)',
              v_tpl_kelas, 'item.correctness_rate', 'bar')),
          ('remove', 'guard', format('delete from public.report_templates where id = %L', v_tpl_kelas)),
          ('write the pass', 'grant', 'insert into public.report_template_provisioning (txid) values (txid_current())'),
          ('call the provisioner', 'grant', format('select public.provision_standard_report_templates(%L)', v_inst))
        ) as c(what, why, sql)
      loop
        -- refused, and refused BY THE RULE: the guard's own words, or a missing
        -- grant -- not a key or a reference that happened to be in the way
        v_err := selftest.f11_raised(r.sql);
        if v_err is null then
          v_probs := selftest.f11_note(v_probs, 'F14-N01', format('the school''s admin could %s', r.what));
        elsif (r.why = 'guard' and coalesce(v_err ->> 'message', '') !~ 'standard report template is PINTAR''s own')
           or (r.why = 'grant' and v_err ->> 'code' <> '42501') then
          v_probs := selftest.f11_note(v_probs, 'F14-N01', format('the school''s admin could %s, refused only by: %s',
            r.what, left(coalesce(v_err ->> 'message', ''), 100)));
        else
          m_refused := m_refused + 1;
        end if;
      end loop;
      perform selftest.as_owner();
      if not exists (select 1 from public.report_templates t where t.id = v_tpl_kelas and t.is_standard
                      and (select count(*) from public.report_template_metrics m2 where m2.template_id = t.id) = 6) then
        v_probs := selftest.f11_note(v_probs, 'F14-N01', 'the standard class report was changed');
      end if;

      -- a reader without the capability still writes no template of its own
      perform selftest.as_user('f14-guru-' || v_tag || '@local.invalid');
      v_err := selftest.f11_raised(format('insert into public.report_templates (institution_id, standard_report, title_key, template_version) values (%L, %L, %L, 7)',
        v_inst, 'learner_result', 'laporan.kelas.judul'));
      if v_err is null then v_probs := selftest.f11_note(v_probs, 'F14-N01', 'an educator wrote a template'); else m_refused := m_refused + 1; end if;
      perform selftest.as_owner();

      if public.report_template_provisioning_pass() is not false then
        v_probs := selftest.f11_note(v_probs, 'F14-N01', 'a provisioning pass is open outside the provisioner');
      end if;
      if has_function_privilege('authenticated', 'public.provision_standard_report_templates(uuid)', 'execute')
         or has_function_privilege('anon', 'public.provision_standard_report_templates(uuid)', 'execute')
         or has_table_privilege('authenticated', 'public.report_template_provisioning', 'insert')
         or exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = 'report_template_provisioning') then
        v_probs := selftest.f11_note(v_probs, 'F14-N01', 'a client is granted the provisioner or the pass');
      end if;
    exception when others then
      v_probs := selftest.f11_note(v_probs, 'F14-N01', 'the test could not run: ' || left(sqlerrm, 150));
      perform selftest.as_owner();
    end;

    raise exception 'f14-rollback';
  exception when others then
    if sqlerrm <> 'f14-rollback' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in
    select * from unnest(
      array['F14-P01', 'F14-P02', 'F14-N01'],
      array['BOB-06 -- every school carries its standard class and school reports (D-010, B6b)',
            'BOB-06 -- the summaries open for the people they are for',
            'BOB-06 -- PINTAR''s standard rows are not a school''s to change'],
      array[
        'every INSTITUTION tenant carries exactly one standard class report and one standard school report at version 1, '
          || 'each the standard assembly in the standard order, every row a metric and drawing the live catalogue offers; '
          || 'the canonical tenant carries none; a school created now is given both, unowned, with a report_template.provisioned audit row each',
        'the school''s admin reads both, and generate_report of the standard class report at a class gives 6 entries each '
          || 'with a status; a dean''s standard school report at the school gives 6, none refused; the school''s own '
          || 'assembly through save_report_template is its own version 1, beside the standard one',
        format('%s refusal(s): the school''s admin could not edit, unmark, revise, extend or remove the standard class '
          || 'report, write the provisioning pass or call the provisioner; an educator wrote no template; no pass is open, '
          || 'and no client is granted the provisioner or the pass (no policies)', m_refused)
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false; detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F14-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-14 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable14() from public;
grant execute on function selftest.run_fable14() to authenticated;
