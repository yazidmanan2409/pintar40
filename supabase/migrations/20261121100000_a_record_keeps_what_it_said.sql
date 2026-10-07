-- ═══════════════════════════════════════════════════════════════════════════
-- FOLLOW-UPS 19, 20 AND 21 (JOURNEY-LOG; found beside D-093, 3 Oct; D-100(d)
-- item 5). Three records that lost or never kept what they said. Each is the
-- smallest fix the log names, nothing wider.
--
-- 19. A REJECTED TRANSFER KEEPS ITS REQUEST'S REASON. `transfer_reject` wrote
--     `reason = coalesce(p_reason, reason)`, so a rejection's own reason
--     replaced the reason the request was made with, and `transfers_audit`
--     recorded no reason at all. The rejection's reason now has its own
--     column; the request's is never touched; the audit row carries both, with
--     the state it moved from and to (D-093).
--
-- 20. A REVISED REPORT TEMPLATE SAYS WHAT EACH VERSION SHOWED. `save_report_template`
--     bumps the version and replaces the selection, and its audit row kept
--     only a count, so what an earlier version showed could not be
--     reconstructed. The row now carries the selection saved and, for a
--     revision, the version and selection it replaced. No schema change.
--
-- 21. A STUDIO CONTENT STEP IS ON THE RECORD. Steps 1–4 («langkah») move a
--     chapter's items, lessons, modules, definitions and course together, by
--     direct updates; release freeze, publish and withdraw were audited, the
--     steps before them were not. The course's own status change, which ends
--     every step, now writes one audit row with the state it moved from and
--     to and the reviewer of record. Not an audit of every row.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────── 19
alter table public.transfers add column rejection_reason text;
comment on column public.transfers.rejection_reason is
  'Follow-up 19: why a transfer was rejected, kept apart from the request''s own reason, which a rejection never changes.';

create or replace function public.transfer_reject(p_transfer uuid, p_reason text)
returns void language plpgsql security definer set search_path = public, pg_temp as $function$
declare t record;
begin
  select * into t from public.transfers where id = p_transfer;
  if t.id is null then raise exception 'transfer not found'; end if;
  if not (public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.to_institution_id) or public.can_on_node('CAN_AUTHORIZE_TRANSFER', t.from_institution_id)) then
    raise exception 'not authorized';
  end if;
  -- the request's reason stays the request's; the rejection says its own
  update public.transfers set status = 'REJECTED', rejection_reason = nullif(btrim(coalesce(p_reason, '')), '')
   where id = p_transfer;
end $function$;
revoke all on function public.transfer_reject(uuid, text) from public, anon;
grant execute on function public.transfer_reject(uuid, text) to authenticated;

create or replace function public.transfers_audit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
declare v jsonb;
begin
  v := jsonb_build_object('person_id', new.person_id, 'record_classes', new.record_classes,
                          'from_state', case when tg_op = 'UPDATE' then old.status end, 'to_state', new.status,
                          'reason', new.reason, 'rejection_reason', new.rejection_reason);
  perform public.audit_write('transfer.'||lower(new.status::text), 'transfers', new.id::text, new.from_institution_id,
    v || jsonb_build_object('to_institution_id', new.to_institution_id));
  perform public.audit_write('transfer.'||lower(new.status::text), 'transfers', new.id::text, new.to_institution_id,
    v || jsonb_build_object('from_institution_id', new.from_institution_id));
  return null;
end $function$;
revoke all on function public.transfers_audit() from public, anon, authenticated;

-- ───────────────────────────────────────────────────────────────────── 20
create or replace function public.save_report_template(p_institution uuid, p_standard_report text, p_title_key text, p_metrics jsonb, p_template uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_id uuid; v_version int; v_inst uuid; v_entry jsonb; v_ord smallint := 0; n int;
        v_from_version int; v_from_selection jsonb; v_selection jsonb;
begin
  -- 1. AUTHORIZATION, BEFORE ANYTHING IS RESOLVED.
  if p_institution is null
     or not public.can_in_institution('CAN_MANAGE_REPORT_TEMPLATES', p_institution) then
    raise exception 'assembling a report template requires CAN_MANAGE_REPORT_TEMPLATES in that institution';
  end if;

  -- 2. the shape of the request
  if p_metrics is null or jsonb_typeof(p_metrics) <> 'array' then
    raise exception 'a report template is a list of metrics to show, and none was given';
  end if;
  n := jsonb_array_length(p_metrics);
  if n = 0 then
    raise exception 'a report template must show at least one metric';
  end if;
  -- A STANDARD REPORT, NOT A CANVAS. The cap is a product boundary, not a
  -- technical one: a template that names forty metrics is a report nobody
  -- reads and an evaluation nobody budgeted for.
  if n > 12 then
    raise exception 'a report template shows at most 12 metrics, and this one names %', n;
  end if;

  -- 3. the template itself. An update must belong to the institution the
  --    caller was authorized for -- naming someone else's template here must
  --    not borrow this caller's capability.
  if p_template is null then
    insert into public.report_templates
      (institution_id, template_version, standard_report, title_key, branding)
    values (p_institution, 1, p_standard_report, p_title_key, '{}'::jsonb)
    returning id, template_version into v_id, v_version;
  else
    select t.institution_id, t.template_version into v_inst, v_version
      from public.report_templates t where t.id = p_template;
    if v_inst is null then raise exception 'no such report template'; end if;
    if v_inst <> p_institution then
      raise exception 'that report template belongs to another institution';
    end if;
    -- follow-up 20: what the version being replaced showed, before it goes
    v_from_version := v_version;
    select coalesce(jsonb_agg(jsonb_build_object('metric_id', m.metric_id, 'visualization', m.visualization) order by m.ordinal), '[]'::jsonb)
      into v_from_selection
      from public.report_template_metrics m where m.template_id = p_template;
    -- A NEW VERSION, NOT A SILENT EDIT. `generated_reports` records the
    -- template version it was made from, so a report already issued keeps
    -- saying which assembly produced it.
    v_version := v_version + 1;
    update public.report_templates
       set template_version = v_version,
           standard_report  = p_standard_report,
           title_key        = p_title_key
     where id = p_template
    returning id into v_id;
    delete from public.report_template_metrics where template_id = v_id;
  end if;

  -- 4. the selection. Every row goes through `enforce_report_template_metric`,
  --    which is where "from the approved subset" is decided: the metric must
  --    exist in the LIVE catalogue, must not be deprecated, and the
  --    visualization must be one that metric permits.
  for v_entry in select * from jsonb_array_elements(p_metrics) loop
    if v_entry ->> 'metric_id' is null or v_entry ->> 'visualization' is null then
      raise exception 'each entry names a metric_id and a visualization; entry % names %',
        v_ord + 1, v_entry;
    end if;
    v_ord := v_ord + 1;
    insert into public.report_template_metrics (template_id, metric_id, ordinal, visualization)
    values (v_id, v_entry ->> 'metric_id', v_ord, v_entry ->> 'visualization');
  end loop;
  select jsonb_agg(jsonb_build_object('metric_id', m.metric_id, 'visualization', m.visualization) order by m.ordinal)
    into v_selection
    from public.report_template_metrics m where m.template_id = v_id;

  -- 5. CONFIGURING A SCHOOL'S REPORTING IS AN ACT OF ADMINISTRATION. It names
  --    the template and its version, and carries no figure: a template is a
  --    request for numbers, never a number. Follow-up 20: it names the
  --    metrics each version showed (which metric, drawn how), so an earlier
  --    version's selection survives the next save.
  perform public.audit_write('report_template.saved', 'report_templates', v_id::text, p_institution,
    jsonb_build_object('standard_report', p_standard_report, 'title_key', p_title_key,
                       'template_version', v_version, 'metrics', n,
                       'catalogue_version', public.current_metric_catalogue(),
                       'selection', v_selection, 'from_version', v_from_version, 'from_selection', v_from_selection));
  return v_id;
end $function$;
revoke all on function public.save_report_template(uuid, text, text, jsonb, uuid) from public, anon;
grant execute on function public.save_report_template(uuid, text, text, jsonb, uuid) to authenticated;

-- ───────────────────────────────────────────────────────────────────── 21
create or replace function public.courses_status_audit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $function$
begin
  perform public.audit_write('content.status_changed', 'courses', new.id::text, new.institution_id,
    jsonb_build_object('course', new.id, 'from_state', old.status, 'to_state', new.status,
                       'reviewed_by_person_id', new.reviewed_by_person_id));
  return null;
end $function$;
revoke all on function public.courses_status_audit() from public, anon, authenticated;
create trigger courses_status_audit after update of status on public.courses
  for each row when (old.status is distinct from new.status) execute function public.courses_status_audit();

-- ═══════════════════════════════════════════════════ terminal verification
do $$
begin
  if position('rejection_reason = nullif' in pg_get_functiondef('public.transfer_reject(uuid,text)'::regprocedure)) = 0
     or position('coalesce(p_reason, reason)' in pg_get_functiondef('public.transfer_reject(uuid,text)'::regprocedure)) > 0 then
    raise exception 'follow-up 19: a rejection still writes over the request''s reason';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'courses_status_audit' and tgrelid = 'public.courses'::regclass) then
    raise exception 'follow-up 21: a content step is still off the record';
  end if;
end $$;
