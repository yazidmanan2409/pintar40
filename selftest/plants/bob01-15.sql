-- bob01-15 — THE DIRECT WRITE PATH IS OPEN AGAIN (BOB-08 a). W8-01's insert policy and the client grant return.
grant insert, update on public.org_nodes to authenticated;
create policy org_nodes_insert on public.org_nodes for insert to authenticated
  with check (public.has_scope('INSTITUTION_ADMIN'::public.app_role, institution_id));
