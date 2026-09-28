-- BOB-11 (M9, read side) -- LESSON MEDIA PLAY.
--
-- The player's <video> and <audio> pointed at /api/assets/read-url, which
-- answers JSON, so nothing played. The route gains a redirect mode in the app;
-- this migration adds the one database question the route did not have.
--
-- A SCHOOL'S STAFF PREVIEW THEIR OWN SCHOOL'S MEDIA, published or not.
-- may_read_lesson_media (0030) answers only for a learner whose assignment
-- names the path, so an author or reviewer could not hear or see a lesson's
-- media before it was released to anyone -- exactly when they need to. The
-- new question is asked per exact path, as the learner's is, never by prefix:
-- the caller may draft or review in the school whose lesson names that path.
-- Another school's staff, a learner and anyone else get false, the same answer
-- an unknown path gets, so it is no existence oracle.

create function public.may_preview_lesson_media(p_path text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(p_path, '') <> '' and exists (
    select 1
      from public.lessons l, lateral jsonb_array_elements(coalesce(l.media, '[]'::jsonb)) e
     where e ->> 'path' = p_path
       and (public.can_in_institution('CAN_DRAFT', l.institution_id)
            or public.can_in_institution('CAN_REVIEW', l.institution_id)))
$$;
revoke all on function public.may_preview_lesson_media(text) from public, anon;
grant execute on function public.may_preview_lesson_media(text) to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values ('may_preview_lesson_media', 'STAFF',
        'BOB-11 (M9): whether the caller may hear or see a lesson''s media before release -- true only when a '
        || 'lesson of a school where the caller may draft (or review) names that exact path. Asked by the '
        || 'signed-read route and by Studio''s preview; grants nothing itself.',
        'CAPABILITY', 'CAN_DRAFT')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
begin
  if has_function_privilege('anon', 'public.may_preview_lesson_media(text)', 'execute') then
    raise exception 'BOB-11: anon can execute may_preview_lesson_media';
  end if;
  -- no caller: no school, so no preview of anything
  if public.may_preview_lesson_media('pelajaran/pecahan-senilai.mp3') then
    raise exception 'BOB-11: a caller with no person may preview lesson media';
  end if;
end $$;
