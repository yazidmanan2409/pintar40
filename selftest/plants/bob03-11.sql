-- bob03-11 — BOB-17 gate review: PUBLISH_READINESS IS GRANTED AGAIN. Anyone signed in -- a learner included -- could then read another school's draft lesson titles and finding counts by holding a course's id.
grant execute on function public.publish_readiness(uuid) to authenticated;
