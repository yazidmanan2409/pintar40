-- W1.6 (Batch 1, D-145(c)), part 1 of 2: A REVIEWER MAY SEND A PACKAGE BACK TO ITS AUTHOR.
--
-- UX-36 / J4.3: today a package in review can only be approved; a reviewer who finds a problem has no outcome but to
-- leave it waiting («a rejected chapter is a dead end»). This adds the one edge the allow-list lacked,
-- IN_REVIEW -> VALIDATION_FAILED («returned for correction», the state Studio already shows as «dikembalikan» and
-- whose way forward, VALIDATION_FAILED -> STRUCTURED, already exists), and guards it in enforce_content_status: the
-- step is taken only inside kembalikan_paket() (part 2, 20261214100000), which checks the reviewer's authority, the
-- second person and the reason, and records the outcome. A plain UPDATE making the step is refused by the trigger's
-- existing «illegal content transition» refusal, the same raise (BOB07-K02's coded set is unchanged).
--
-- This file holds only the edge and the trigger, so the trigger's refusals stay the ones BOB07-K02 reads.
-- enforce_content_status is 20260915150000's text with one condition added to step (1); nothing else in it changes.

insert into public.content_status_transitions (from_status, to_status, note) values
  ('IN_REVIEW', 'VALIDATION_FAILED', 'sent back to its author by a reviewer, with a reason (W1.6, kembalikan_paket)');

create or replace function public.enforce_content_status() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_institution uuid;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'INGESTED' then
      raise exception 'content rows are created at INGESTED, not % (%.%)',
        new.status, tg_table_schema, tg_table_name;
    end if;
    if new.author_person_id is null then
      new.author_person_id := public.current_person_id();
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    -- (1) is the transition legal? The graph alone decides, and it knows
    -- nothing about roles.
    -- W1.6 (Batch 1, D-145(c)): IN_REVIEW -> VALIDATION_FAILED is a reviewer sending the package back to its author,
    -- and is legal ONLY inside kembalikan_paket(), which checks CAN_REVIEW, that the reviewer is not the author, and
    -- that a reason is given, and records the outcome. That function marks its own transaction; for any other
    -- statement (an author's plain UPDATE under CAN_DRAFT, say) the edge is as if it were not in the allow-list.
    if not exists (select 1 from public.content_status_transitions t
                    where t.from_status = old.status and t.to_status = new.status)
       or (old.status = 'IN_REVIEW' and new.status = 'VALIDATION_FAILED'
           and coalesce(current_setting('pintar.kirim_balik', true), '') <> 'ya') then
      raise exception 'illegal content transition % -> % on %.% (not in the allow-list)',
        old.status, new.status, tg_table_schema, tg_table_name;
    end if;

    -- (2) may THIS caller make a legal transition? Asked only once the edge is
    -- known to be legal, and asked about the institution that owns the row as
    -- it stands -- never the one the same statement is trying to write.
    v_institution := (to_jsonb(old) ->> 'institution_id')::uuid;

    if new.status = 'APPROVED' then
      -- ADDED IN 0057. Academic sign-off is a capability, not a spare field.
      -- Without this an EDUCATOR passes the UPDATE policy on CAN_DRAFT and
      -- approves by naming a colleague as reviewer.
      if not public.can_in_institution('CAN_REVIEW', v_institution) then
        raise exception 'approving content requires CAN_REVIEW in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      if new.reviewed_by_person_id is null then
        raise exception 'APPROVED requires a reviewer (%.%)', tg_table_schema, tg_table_name;
      end if;
      if new.author_person_id is null then
        raise exception 'APPROVED requires a known author to separate from the reviewer (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      if new.reviewed_by_person_id = new.author_person_id then
        raise exception 'the reviewer may not be the author (%.%)', tg_table_schema, tg_table_name;
      end if;
      -- and the reviewer of record is the caller, so "approve" cannot be
      -- performed on someone else's behalf by naming them
      if new.reviewed_by_person_id is distinct from coalesce(public.current_person_id(),
                                                             new.reviewed_by_person_id) then
        raise exception 'the recorded reviewer is the caller, not a named third party (%.%)',
          tg_table_schema, tg_table_name;
      end if;
      new.reviewed_at := coalesce(new.reviewed_at, now());
    end if;

    if new.status = 'FROZEN' then
      if not public.can_in_institution('CAN_FREEZE_RELEASE', v_institution) then
        raise exception 'sealing content requires CAN_FREEZE_RELEASE in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;

    if new.status = 'PUBLISHED' then
      if not public.can_in_institution('CAN_PUBLISH', v_institution) then
        raise exception 'publishing requires CAN_PUBLISH in the owning institution (INV-32) (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;

    if new.status = 'SUPERSEDED' then
      -- ADDED IN 0057. Withdrawal is the same authority as publication; the
      -- row is never deleted and the chain stays intact.
      if not public.can_in_institution('CAN_PUBLISH', v_institution) then
        raise exception 'withdrawing published content requires CAN_PUBLISH in the owning institution (%.%)',
          tg_table_schema, tg_table_name;
      end if;
    end if;
  end if;

  if new.author_person_id is distinct from old.author_person_id then
    raise exception 'author_person_id is immutable (%.%)', tg_table_schema, tg_table_name;
  end if;
  return new;
end $$;

-- ADR-0021: the trigger function is nobody's to call, as it stood
revoke all on function public.enforce_content_status() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from public.content_status_transitions
                  where from_status = 'IN_REVIEW' and to_status = 'VALIDATION_FAILED') then
    raise exception 'W1.6: the send-back edge is missing';
  end if;
  if position('pintar.kirim_balik' in pg_get_functiondef('public.enforce_content_status()'::regprocedure)) = 0 then
    raise exception 'W1.6: the send-back edge is not guarded';
  end if;
end $$;
