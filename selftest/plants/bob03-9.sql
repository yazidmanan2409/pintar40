-- bob03-9 — RELEASES ARE WRITTEN DIRECTLY AGAIN (D-041). The client INSERT and UPDATE grants and the two CAN_DRAFT write policies on plp_releases are back, as they were before BOB-03.
grant insert, update on public.plp_releases to authenticated;
create policy plp_releases_insert on public.plp_releases for insert to authenticated
  with check (public.can_in_institution('CAN_DRAFT', institution_id));
create policy plp_releases_update on public.plp_releases for update to authenticated
  using (public.can_in_institution('CAN_DRAFT', institution_id))
  with check (public.can_in_institution('CAN_DRAFT', institution_id));
