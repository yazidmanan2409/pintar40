-- d2r-13 — THE FIX OVERREACHES (the owner's condition). Pemetaan Awal stops offering help with the certifying modes.
update public.mode_policy set allows_assistance = false where mode = 'PRE_TEST';
