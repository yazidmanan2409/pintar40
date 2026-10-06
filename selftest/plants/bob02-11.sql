-- bob02-11 — BOB-11: ANYONE PREVIEWS A SCHOOL'S UNRELEASED MEDIA. The draft-or-review check is gone, so any caller whose school's lesson names the path -- or any school's -- is let hear it.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.may_preview_lesson_media(text)'::regprocedure);
  src := replace(orig, $p$
       and (public.can_in_institution('CAN_DRAFT', l.institution_id)
            or public.can_in_institution('CAN_REVIEW', l.institution_id)))$p$, ')');
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
