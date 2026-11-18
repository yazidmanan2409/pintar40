begin transaction read only;
select 'items' as what, i.status::text as state, count(*) as n from public.items i where i.item_type = 'MCQ_MULTI' group by i.status
union all
select 'final_responses', i.status::text, count(*) from public.responses r join public.presented_items p on p.id = r.presented_item_id join public.items i on i.id = p.item_id
 where i.item_type = 'MCQ_MULTI' and r.is_final group by i.status
order by 1, 2;
rollback;
