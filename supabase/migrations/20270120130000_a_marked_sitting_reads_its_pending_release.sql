-- A2a's D1, its gap (D1-2), fixed in A2b as its own commit (Sharon's ruling, A2B-COMMIT2-4010fe83.md at a7d0b378:
-- "This is my D1 gap"). DRAFT.
--
-- D1 (20270119160000) made pengerjaan_tenggat_efektif add the PENDING credit of an unmarked sitting, so that between a
-- lift and the first touch nobody reads the unshifted deadline. A MARKED sitting (darurat_sejak set) was left to its
-- release, and penghentian_kredit excludes the marking stop itself (its t_stop is not before darurat_sejak). So for a
-- marked sitting whose stop has lifted and whose release has not yet run, every reader of the effective deadline
-- (session_state, may_continue_session, pengerjaan_saya, daftar_pengerjaan, maintenance_draining) showed the unshifted
-- deadline until a touch, and under a platform-wide PLANNED window the request hook stopped its learner (PT503).
--
-- The fix: the effective deadline adds, for a marked sitting whose holding chain has ended (penghentian_geser(person,
-- window) not null), that shift beside the S1 credit, exactly as pengerjaan_lepas_darurat would write it: not for a
-- sitting held by A1 (the release writes only its watermark then); nothing while the stop is still in force (the
-- sitting is protected, and its readers say so). After the release, darurat_sejak is null and the term is zero, so
-- the release changes nothing a reader sees.

create or replace function public.pengerjaan_tenggat_efektif(p_session uuid) returns timestamptz
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(s.authoritative_deadline,
                  (select aa.closes_at from public.assessment_assignments aa where aa.id = s.assessment_assignment_id)
                    + make_interval(secs => s.darurat_geser_detik))
         + (public.penghentian_kredit(s)).geser
         -- D1-2: a marked sitting whose stop has lifted reads its pending release, as pengerjaan_lepas_darurat writes it
         + coalesce(case when s.darurat_sejak is not null and not (s.frozen_at is not null and s.unfrozen_at is null)
                         then public.penghentian_geser(s.person_id, s.darurat_jendela_id) end, interval '0')
    from public.assessment_sessions s where s.id = p_session
$$;
revoke execute on function public.pengerjaan_tenggat_efektif(uuid) from public;   -- ADR-0021

do $$
begin
  if position('D1-2' in pg_get_functiondef('public.pengerjaan_tenggat_efektif(uuid)'::regprocedure)) = 0
     or has_function_privilege('anon', 'public.pengerjaan_tenggat_efektif(uuid)'::regprocedure, 'execute') then
    raise exception 'A2a D1-2: the effective deadline does not read a marked sitting''s pending release, or is open to anon';
  end if;
end $$;
