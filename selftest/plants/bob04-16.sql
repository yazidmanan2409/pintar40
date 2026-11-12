-- bob04-16 — C1w F-1 SHARON'S CORRECTION UNDONE. The learner's own review returns the SEALED rationale again beside a
-- mark the key correction changed (o.rationale, as before 20270117120000).
do $$
declare v text := pg_get_functiondef('public.session_review(uuid)'::regprocedure);
        v_in text := E'           case when public.nilai_jawaban_berlaku(p_session, f.item_id, f.value)\n'
                  || E'                     is distinct from public.grade_response(f.item_id, f.value)\n'
                  || E'                then null   -- F-1 (Sharon): a mark the key correction changed is not explained by the sealed key\n'
                  || E'                else o.rationale end,\n';
begin
  if position(v_in in v) = 0 then raise exception 'bob04-16: session_review does not withhold the rationale where it did'; end if;
  execute replace(v, v_in, E'           o.rationale,\n');
end $$;
