-- Z · D-1, Sharon's ruling-56 condition (RULING55-D1-D8-D6-7ba18b03.md, addendum of 18 Nov 15:10): until she accepts
-- the multi-answer repair (20270123100000), a staging import or a walkthrough world is CHECKED for multi-answer content,
-- not promised free of it. Run it read only, before each import and against each walkthrough world:
--
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f scripts/release/before-import/d1-multi-answer.sql
--
-- It writes nothing. Its last line is the verdict: NONE (no multi-answer item), or REPORT with the counts, which goes to
-- Bob and Sharon before the import proceeds. It names no person and no response.
begin transaction read only;
select 'items|' || coalesce(string_agg(x.status || ':' || x.n, ',' order by x.status), '-')
  from (select i.status::text as status, count(*) as n from public.items i where i.item_type = 'MCQ_MULTI' group by i.status) x;
select 'final_responses|' || count(*)
  from public.responses r join public.presented_items p on p.id = r.presented_item_id
  join public.items i on i.id = p.item_id
 where i.item_type = 'MCQ_MULTI' and r.is_final;
select 'courses|' || coalesce(string_agg(distinct c.title, ', '), '-')
  from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
  join public.courses c on c.id = m.course_id
 where i.item_type = 'MCQ_MULTI';
select 'verdict|' || case when exists (select 1 from public.items i where i.item_type = 'MCQ_MULTI')
                          then 'REPORT: multi-answer content is present; tell Bob and Sharon before importing'
                          else 'NONE' end;
rollback;
