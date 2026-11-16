-- A2b batch 2, D2 (its database part) · a planned window gives its reason from a controlled list (THE PLAN §5.3 D2;
-- Daisy, A2-KATA-DESAIN B1; the Chief Architect, 16 Nov 09:16: PLANNED rows only; Sharon's GO on the red tests,
-- A2B-BATCH2-TESTS-d837181d.md, with T1 to T5). DRAFT.
--
-- * maintenance_windows.reason_code: one of RUTIN, PEMBARUAN, GANGGUAN, JARINGAN_LISTRIK, LAINNYA, on a PLANNED row
--   only. NULLABLE, with no backfill: every row that exists today has no code and keeps its own text, and so does every
--   EMERGENCY row (A2a's stop_pintar_now is unchanged and writes none). The CHECK is added VALID (Sharon's T3), so it
--   is checked over the existing rows here, where every one passes by having no code (A2B-R04 runs this section over
--   rows of every existing shape).
-- * A code other than LAINNYA carries no free text: the row's reason IS the code (Sharon's T1: free text never reaches
--   the affected as alasan behind a code). LAINNYA carries its text, 1 to 120 characters, counted as characters
--   (char_length; Sharon's T4: the form says «sampai 120 karakter»).
-- * schedule_maintenance gains a trailing p_reason_code text DEFAULT NULL (accepted, Sharon): with no code, 4.0's and
--   A2a's free-text call behaves exactly as before; with one, the rule above, refused MAINTENANCE_INPUT_INVALID. The
--   eight-argument function is replaced (a second overload with a default would make every call ambiguous); its grants
--   are restated (authenticated only; Sharon's C1-1). The audit row names the code.
-- * pintar_status_saya, per window, adds 'alasan_kode' and 'alasan' for a PLANNED window (its code, and its reason:
--   the code for a coded row, the old text for an old row); null for an EMERGENCY, whose free text is not shown.
--   The status read lists only the windows that affect the reader, so an unaffected person gets neither (T2).

create or replace function pg_temp.a2b_ganti(p_fn regprocedure, p_old text, p_new text) returns void
language plpgsql as $$
declare v text := pg_get_functiondef(p_fn); n int;
begin
  n := (length(v) - length(replace(v, p_old, ''))) / greatest(length(p_old), 1);
  if n <> 1 then raise exception 'A2b: % has its anchor % time(s), not once', p_fn, n; end if;
  execute replace(v, p_old, p_new);
end $$;

-- A2B-R04 maintenance_windows: begin
alter table public.maintenance_windows add column reason_code text;
alter table public.maintenance_windows add constraint maintenance_windows_reason_code check (
  reason_code is null
  or (kind = 'PLANNED' and (
        (reason_code = 'LAINNYA' and char_length(btrim(reason)) between 1 and 120)
     or (reason_code in ('RUTIN', 'PEMBARUAN', 'GANGGUAN', 'JARINGAN_LISTRIK') and reason = reason_code))));
comment on column public.maintenance_windows.reason_code is
  'A2b D2: a PLANNED window''s reason from the controlled list; null on every EMERGENCY row and on rows made before D2. '
  'A code other than LAINNYA is the reason itself; LAINNYA carries its text (at most 120 characters).';
-- A2B-R04 maintenance_windows: end

-- ───────────────────────────────────────────────────────────── the writer
drop function public.schedule_maintenance(boolean, uuid[], timestamptz, timestamptz, text, text, boolean, uuid[]);
create function public.schedule_maintenance(p_platform boolean, p_institutions uuid[], p_starts_at timestamp with time zone, p_ends_at timestamp with time zone, p_message text, p_reason text, p_notice boolean, p_nodes uuid[] DEFAULT '{}'::uuid[], p_reason_code text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_me uuid; v_id uuid; v_start timestamptz; v_inst uuid[]; v_nodes uuid[]; v_reason text;
begin
  v_me := public.current_person_id();
  v_inst := case when coalesce(p_platform, false) then '{}'::uuid[]
                 else (select coalesce(array_agg(distinct x), '{}') from unnest(coalesce(p_institutions, '{}')) x) end;
  v_nodes := (select coalesce(array_agg(distinct x order by x), '{}') from unnest(coalesce(p_nodes, '{}')) x);
  if v_me is null or not public.maintenance_may_act(p_platform, v_inst) then
    perform public.maintenance_refuse('MAINTENANCE_NOT_ALLOWED');
  end if;
  -- K10: a class window names classes of exactly one school, chosen with that school, and is not platform-wide;
  -- refused with its designed code before any constraint or trigger
  if cardinality(v_nodes) > 0 and (coalesce(p_platform, false) or cardinality(v_inst) <> 1
       or exists (select 1 from unnest(v_nodes) x
                   where not exists (select 1 from public.org_nodes n
                                      where n.id = x and n.kind = 'CLASS' and n.institution_id = v_inst[1]))) then
    perform public.maintenance_refuse('MAINTENANCE_NODE_INVALID');
  end if;
  v_start := coalesce(p_starts_at, now());
  if v_start < now() - interval '1 minute' or (p_ends_at is not null and p_ends_at <= v_start)
     -- D2: with no code, the free text as before (4.0's and A2a's callers); with a code, below
     or (p_reason_code is null and length(btrim(coalesce(p_reason, ''))) not between 1 and 300)
     -- D2: one of the five planned codes; LAINNYA with its text, 1 to 120 characters; any other code with no text
     -- (Sharon's T1: free text never rides on a code other than LAINNYA), its reason the code itself
     or (p_reason_code is not null and p_reason_code not in ('RUTIN', 'PEMBARUAN', 'GANGGUAN', 'JARINGAN_LISTRIK', 'LAINNYA'))
     or (p_reason_code = 'LAINNYA' and char_length(btrim(coalesce(p_reason, ''))) not between 1 and 120)
     or (p_reason_code <> 'LAINNYA' and btrim(coalesce(p_reason, '')) <> '')
     or (p_message is not null and length(btrim(p_message)) not between 1 and 500)
     or (coalesce(p_notice, false) and nullif(btrim(coalesce(p_message, '')), '') is null)
     or (coalesce(p_notice, false) and cardinality(v_nodes) > 0)   -- a notice is a school's: not for a class window
     or (not coalesce(p_platform, false) and cardinality(v_inst) = 0) then
    perform public.maintenance_refuse('MAINTENANCE_INPUT_INVALID');
  end if;
  v_reason := case when p_reason_code is null or p_reason_code = 'LAINNYA' then btrim(p_reason) else p_reason_code end;
  insert into public.maintenance_windows (kind, platform, institution_ids, node_ids, starts_at, ends_at, message, reason,
                                          reason_code, created_by_person_id)
  values ('PLANNED', coalesce(p_platform, false), v_inst, v_nodes, v_start, p_ends_at,
          nullif(btrim(coalesce(p_message, '')), ''), v_reason, p_reason_code, v_me)
  returning id into v_id;
  perform public.audit_write('maintenance.scheduled', 'maintenance_windows', v_id::text,
    case when coalesce(p_platform, false) then null else v_inst[1] end,
    jsonb_build_object('window', v_id, 'kind', 'PLANNED', 'platform', coalesce(p_platform, false),
                       'institutions', to_jsonb(v_inst), 'nodes', to_jsonb(v_nodes), 'from_state', null, 'to_state',
                       case when v_start <= now() then 'AKTIF' else 'TERJADWAL' end,
                       'starts_at', v_start, 'ends_at', p_ends_at, 'reason', v_reason,
                       'reason_code', p_reason_code));
  -- D-094(b): the matching notice, with no separate workflow
  if coalesce(p_notice, false) then
    insert into public.broadcast_notices (platform, institution_ids, message, publish_at, expires_at,
                                          maintenance_window_id, created_by_person_id)
    values (coalesce(p_platform, false), v_inst, btrim(p_message), now(),
            coalesce(p_ends_at, v_start + interval '1 day'), v_id, v_me);
  end if;
  return v_id;
end $function$;
revoke all on function public.schedule_maintenance(boolean, uuid[], timestamptz, timestamptz, text, text, boolean, uuid[], text) from public, anon, service_role;
grant execute on function public.schedule_maintenance(boolean, uuid[], timestamptz, timestamptz, text, text, boolean, uuid[], text) to authenticated;

-- ───────────────────────────────────────────────────────────── the reader
do $$
begin
  perform pg_temp.a2b_ganti('public.pintar_status_saya()',
    E'''mulai'', w.starts_at, ''selesai'', w.ends_at, ''pesan'', w.message,\n',
    E'''mulai'', w.starts_at, ''selesai'', w.ends_at, ''pesan'', w.message,\n'
    || E'           -- A2b D2: a planned window''s reason (its code, or an old row''s text); never an emergency''s free text\n'
    || E'           ''alasan_kode'', case when w.kind = ''PLANNED'' then w.reason_code end,\n'
    || E'           ''alasan'', case when w.kind = ''PLANNED'' then w.reason end,\n');
end $$;

do $$
declare f regprocedure := 'public.schedule_maintenance(boolean,uuid[],timestamptz,timestamptz,text,text,boolean,uuid[],text)';
begin
  if to_regprocedure('public.schedule_maintenance(boolean,uuid[],timestamptz,timestamptz,text,text,boolean,uuid[])') is not null
     or not exists (select 1 from pg_constraint where conname = 'maintenance_windows_reason_code' and convalidated)
     or has_function_privilege('anon', f, 'execute') or has_function_privilege('service_role', f, 'execute')
     or not has_function_privilege('authenticated', f, 'execute')
     or position('p_reason_code' in pg_get_functiondef(f)) = 0
     or position('''alasan_kode''' in pg_get_functiondef('public.pintar_status_saya()'::regprocedure)) = 0
     or pg_get_function_identity_arguments('public.stop_pintar_now'::regproc) <> 'p_platform boolean, p_institutions uuid[], p_reason text, p_confirmation text, p_nodes uuid[]' then
    raise exception 'A2b D2: the reason code, its CHECK, the writer''s grants, the status read or stop_pintar_now is not as intended';
  end if;
end $$;
