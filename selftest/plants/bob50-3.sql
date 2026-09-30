-- bob50-3 — THE FIX OVERREACHES. The cycle's Uji Penguasaan (POST_TEST) stops certifying along with the Uji Cepat.
update public.mode_policy set certifies = false where mode = 'POST_TEST';
