-- ROLLBACK OF MIGRATIONS 189-193 (Batch 5), the Batch 5 promotion gate's recovery arrangement (owner, 3 Nov, condition 5).
--
-- NOT A MIGRATION and NEVER APPLIED BY ANY WORKFLOW. It returns a database at 193 to staging's schema at 188 for every
-- object 189-193 created or replaced: record_integrity_review and integrity_signals_awaiting_review are restored from the
-- repository's own pre-Batch-5 definitions (byte-identical to staging's: md5(prosrc) compared read-only on 3 Nov,
-- 14e24ea3… and e1cd1099…), and the new functions, the result_views table and their registry rows are removed. Run as
-- the database owner in one transaction, only on the owner's say. The physical backup remains the recovery point for
-- data; this script is the schema's way back without a restore.
--
-- What a rollback keeps and loses, by design:
--   * KEPT: every audit row 190's record_integrity_review wrote (INTEGRITY_SIGNAL_REVIEWED, now marked scope 'signal')
--     is valid under 188; 188's waiting list reads any review as covering its sitting again (FD-7's rule);
--   * KEPT: every certificate revoked on the new screen (revoke_certificate is 188's, unchanged): REVOKED stays REVOKED;
--   * LOST: result_views (UX-40's «seen» marks for finished results). Nothing else reads it; a new result simply stops
--     being offered as the next step. Its row count is reported before it is dropped.
--
-- Tested locally on 3 Nov: applied at 193, then the two functions' md5(prosrc) equal staging's, the new objects are
-- gone, 188 migrations remain, and `supabase migration up` re-applies 189-193 cleanly (Batch 5 promotion record).

begin;

do $$
declare n bigint;
begin
  if to_regclass('public.result_views') is not null then
    execute 'select count(*) from public.result_views' into n;
    raise notice 'rollback: result_views holds % row(s); they are dropped with it', n;
  end if;
end $$;

-- 193: a new result is the next step (UX-40)
drop function if exists public.my_new_results();
drop function if exists public.note_result_seen(uuid);
drop table if exists public.result_views;

-- 192: the objectives a learner has not yet reached (W2.18)
drop function if exists public.tujuan_belum_tercapai(uuid, uuid);

-- 191: the waiting list a page at a time (W2.10)
drop function if exists public.orang_kelas_menunggu_akun(uuid);
drop function if exists public.kelas_menunggu_akun(uuid);
drop function if exists public.kelas_menunggu_akun_anggota(uuid, uuid);
drop function if exists public.persons_awaiting_account_page(uuid, text, integer);
drop function if exists public.menunggu_akun_boleh(uuid);

-- 190: the integrity review (W2.7): the two replaced functions back to 188's text, the new ones removed
drop function if exists public.integrity_reviews_recorded(integer);
create or replace function public.integrity_signals_awaiting_review()
returns table (signal_id uuid, session_id uuid, institution_id uuid, category public.integrity_category,
               observed_at timestamptz, may_refer boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select s.id, s.session_id, s.institution_id, s.category, s.observed_at,
         (not public.session_is_professional(s.session_id) and ses.class_node_id is not null
          and public.can_on_node('CAN_REVIEW_INTEGRITY', ses.class_node_id))
    from public.integrity_signals s
    join public.assessment_sessions ses on ses.id = s.session_id
   where public.current_person_id() is not null
     and public.can_in_institution('CAN_REVIEW_INTEGRITY', s.institution_id)
     and (not public.session_is_professional(s.session_id) or public.is_system_admin())
     and not exists (
       select 1 from public.integrity_signals o
         join public.audit_log a on a.target_table = 'integrity_signals' and a.target_id = o.id::text
        where o.session_id = s.session_id and a.action = 'INTEGRITY_SIGNAL_REVIEWED' and a.at >= s.observed_at)
   order by s.observed_at desc, s.id
   limit 200
$$;
revoke all on function public.integrity_signals_awaiting_review() from public, anon;
grant execute on function public.integrity_signals_awaiting_review() to authenticated;

create or replace function public.record_integrity_review(p_signal uuid, p_decision text, p_note text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid; sig record;
begin
  v_actor := public.current_person_id();
  if v_actor is null then raise exception 'recording an integrity review requires an authenticated actor'; end if;
  if p_decision not in ('NO_CONCERN', 'DISCUSSED_WITH_LEARNER', 'REFERRED_TO_INSTITUTION') then
    raise exception
      'an integrity review records what the reviewer did, not a verdict about the learner: unknown decision %',
      p_decision;
  end if;

  select s.id, s.institution_id, s.session_id, s.category into sig
    from public.integrity_signals s where s.id = p_signal;
  if sig.id is null then raise exception 'unknown integrity signal %', p_signal; end if;
  if not public.can_in_institution('CAN_REVIEW_INTEGRITY', sig.institution_id)
     -- BOB-46 (D-069(c)): a professional-learning signal reaches no school role
     or (public.session_is_professional(sig.session_id) and not public.is_system_admin()) then
    raise exception 'reviewing an integrity signal requires CAN_REVIEW_INTEGRITY in the owning institution';
  end if;

  -- No second log table (doc 16): the decision is an audit row, and the signal
  -- row itself is not mutated into carrying an outcome.
  perform public.audit_write('INTEGRITY_SIGNAL_REVIEWED', 'integrity_signals', p_signal::text,
    sig.institution_id,
    jsonb_build_object('session_id', sig.session_id, 'category', sig.category,
                       'decision', p_decision, 'note', p_note));

  -- BOB-39: a referral is Management's to consider, so it reaches their queue.
  -- Same transaction: if the referral is refused, so is the review.
  if p_decision = 'REFERRED_TO_INSTITUTION' then
    perform public.refer_integrity_signal(p_signal, p_note);
  end if;
  return p_signal;
end $$;
revoke all on function public.record_integrity_review(uuid, text, text) from public, anon;
grant execute on function public.record_integrity_review(uuid, text, text) to authenticated;
drop function if exists public.integrity_signal_decided(uuid);

-- 189: a school's certificates (W2.5)
drop function if exists public.sertifikat_sekolah(uuid, text, integer, uuid);

delete from public.client_rpc_registry where function_name in
  ('sertifikat_sekolah', 'integrity_reviews_recorded', 'persons_awaiting_account_page', 'kelas_menunggu_akun',
   'orang_kelas_menunggu_akun', 'tujuan_belum_tercapai', 'note_result_seen', 'my_new_results');

delete from supabase_migrations.schema_migrations
 where version in ('20261222100000', '20261223100000', '20261224100000', '20261225100000', '20261227100000');

commit;
