-- 0043 — FABLE-04 §7, §8, §10: the certificate core.
--
-- WHERE THE SECRET LIVES, AND WHY THE SIGNING IS NOT IN HERE. The HMAC key
-- comes from versioned environment variables (`CERT_SECRET_KEY_V1`, `_V2`, …).
-- A secret that the database can read is a secret a database backup carries, so
-- the signing step deliberately does NOT happen in SQL. The split is:
--
--   * the database owns everything deterministic -- the identity snapshot, the
--     certificate number, the opaque verification token, `issued_at`, and the
--     CANONICAL PAYLOAD itself, stored verbatim;
--   * the application owns the key -- it signs the payload the database
--     produced and hands back a signature and a key version;
--   * verification recomputes the HMAC over the STORED payload and compares
--     with `crypto.timingSafeEqual`.
--
-- Because the payload is stored rather than rebuilt at verification time,
-- "tamper with a protected field" is a real test: change the stored payload and
-- the signature no longer matches; change the row a field was copied from and
-- the payload still says what was signed, which is what a certificate is for.
--
-- WHY `ELIGIBLE` IS A ROW AND NOT A CALCULATION. doc 04 §7's lifecycle starts
-- at ELIGIBLE, and issuance is two steps that must not race: the database
-- reserves the number, mints the token and fixes `issued_at` (all idempotent
-- per session), then the application seals it. An unsigned ELIGIBLE row is that
-- intermediate state, and it is not publicly resolvable -- verification answers
-- only for ISSUED, REVOKED and SUPERSEDED.
--
-- ONE CERTIFICATE PER SESSION, ENFORCED BY THE TABLE. A partial unique index on
-- `session_id where supersedes_certificate_id is null` means two concurrent
-- finalize calls are arbitrated by the index rather than by a prior read -- the
-- same mechanism, and the same reasoning, as INV-28's response idempotency.
--
-- PREDIKAT IS A SCORING INTERPRETATION, so its bands live on `scoring_policy`
-- rather than in a function body. FABLE-03 never computed a predikat, so this
-- is new interpretation surface being recorded the moment it is first used --
-- not a retroactive change to what `pintar-scoring/1` meant when it scored.

alter table public.scoring_policy
  add column if not exists predikat_bands jsonb not null default jsonb_build_array(
    jsonb_build_object('min', 0.90, 'predikat', 'Sangat Baik'),
    jsonb_build_object('min', 0.80, 'predikat', 'Baik'),
    jsonb_build_object('min', 0.70, 'predikat', 'Cukup'),
    jsonb_build_object('min', 0.00, 'predikat', 'Perlu Pendampingan'));

create type public.certificate_status as enum ('ELIGIBLE','ISSUED','REVOKED','SUPERSEDED');

-- ---------------------------------------------------------------------------
-- 1. Certificate Identity Snapshot (INV-30).
--    Immutable at issuance. Rendering and verification read the snapshot only,
--    so a later profile change cannot alter an issued certificate.
-- ---------------------------------------------------------------------------
create table public.certificate_identity_snapshots (
  id                 uuid primary key default gen_random_uuid(),
  person_id          uuid not null references public.persons(id),
  institution_id     uuid not null references public.institutions(id),
  name_as_issued     text not null check (btrim(name_as_issued) <> ''),
  photo_path         text,
  photo_content_hash text,
  snapshot_hash      text not null,
  captured_at        timestamptz not null default now(),
  constraint snapshot_photo_hash_pairs
    check ((photo_path is null) = (photo_content_hash is null))
);
alter table public.certificate_identity_snapshots enable row level security;
insert into public.record_class_registry values
  ('certificate_identity_snapshots', 'INSTITUTION_SCOPED',
   'identity as presented on an issued certificate; the public verification route is the learner''s tenant-independent proof (D2)');

-- ---------------------------------------------------------------------------
-- 2. Certificates.
-- ---------------------------------------------------------------------------
create table public.certificates (
  id                        uuid primary key default gen_random_uuid(),
  session_id                uuid not null references public.assessment_sessions(id),
  person_id                 uuid not null references public.persons(id),
  institution_id            uuid not null references public.institutions(id),
  snapshot_id               uuid not null references public.certificate_identity_snapshots(id),
  certificate_number        text not null unique check (btrim(certificate_number) <> ''),
  verification_token        text not null unique check (length(verification_token) >= 43),
  status                    public.certificate_status not null default 'ELIGIBLE',
  issued_at                 timestamptz not null default now(),
  issued_at_iso             text not null,
  canonical_payload         jsonb not null,
  signature                 text,
  key_version               smallint,
  revoked_at                timestamptz,
  revoked_reason            text,
  supersedes_certificate_id uuid references public.certificates(id),
  created_at                timestamptz not null default now(),
  constraint certificate_signed_when_issued
    check (status = 'ELIGIBLE' or (signature is not null and key_version is not null)),
  constraint certificate_revocation_pairs
    check ((status <> 'REVOKED') or (revoked_at is not null and btrim(coalesce(revoked_reason,'')) <> ''))
);
alter table public.certificates enable row level security;
-- §8: concurrent finalize calls can never mint two certificates for one session
create unique index certificates_one_root_per_session
  on public.certificates (session_id) where supersedes_certificate_id is null;
create index certificates_person_idx on public.certificates (person_id, issued_at desc);
insert into public.record_class_registry values
  ('certificates', 'INSTITUTION_SCOPED',
   'D2: a transfer carries no certificate row; the public verification route is the learner''s tenant-independent proof, and a per-institution portability policy flag is the named forward path');

-- A learner may read their own certificate; staff with the assignment
-- capability may read their institution's. No client write path exists at all.
grant select on public.certificates to authenticated;
create policy certificates_select on public.certificates for select to authenticated
  using (person_id = public.current_person_id()
      or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id));
grant select on public.certificate_identity_snapshots to authenticated;
create policy snapshots_select on public.certificate_identity_snapshots for select to authenticated
  using (person_id = public.current_person_id()
      or public.can_in_institution('CAN_ASSIGN_LEARNING', institution_id));

-- Certificates are immutable except along their lifecycle (doc 04 §7).
create function public.enforce_certificate_write() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'a certificate is never deleted; revocation keeps the row (doc 16 §2)';
  end if;
  if tg_op = 'INSERT' then return new; end if;

  if new.session_id <> old.session_id or new.person_id <> old.person_id
     or new.institution_id <> old.institution_id or new.snapshot_id <> old.snapshot_id
     or new.certificate_number <> old.certificate_number
     or new.verification_token <> old.verification_token
     or new.issued_at is distinct from old.issued_at
     or new.issued_at_iso is distinct from old.issued_at_iso
     or new.canonical_payload is distinct from old.canonical_payload then
    raise exception 'a certificate is immutable; a correction is a new chain-linked row (§8)';
  end if;
  if old.status <> 'ELIGIBLE' and (new.signature is distinct from old.signature
                                or new.key_version is distinct from old.key_version) then
    raise exception 'the signature of an issued certificate is immutable (INV-05)';
  end if;
  if not (
       (old.status = 'ELIGIBLE'   and new.status in ('ELIGIBLE','ISSUED'))
    or (old.status = 'ISSUED'     and new.status in ('ISSUED','REVOKED','SUPERSEDED'))
    or (old.status = 'REVOKED'    and new.status = 'REVOKED')
    or (old.status = 'SUPERSEDED' and new.status = 'SUPERSEDED')) then
    raise exception 'illegal certificate transition % -> % (doc 04 §7)', old.status, new.status;
  end if;
  return new;
end $$;
revoke all on function public.enforce_certificate_write() from public, anon, authenticated;
create trigger certificates_write before insert or update or delete on public.certificates
  for each row execute function public.enforce_certificate_write();

create function public.enforce_snapshot_immutable() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'an identity snapshot is never deleted: an issued certificate renders from it (INV-30)';
  end if;
  raise exception 'an identity snapshot is immutable: later profile changes never alter an issued certificate (INV-30)';
end $$;
revoke all on function public.enforce_snapshot_immutable() from public, anon, authenticated;
create trigger snapshots_immutable before update or delete on public.certificate_identity_snapshots
  for each row execute function public.enforce_snapshot_immutable();

-- ---------------------------------------------------------------------------
-- 3. Eligibility. Reads the official_* views, never raw evidence (amended
--    INV-20), and only a certifying mode on OFFICIAL evidence qualifies.
-- ---------------------------------------------------------------------------
create function public.certificate_eligibility(p_session uuid)
returns table (eligible boolean, reason text, mastery numeric, predikat text, passed boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_mode public.assessment_mode; v_certifies boolean; v_min numeric;
        v_mastery numeric; v_gate boolean; v_official boolean; v_bands jsonb; v_pred text;
begin
  select s.mode into v_mode from public.assessment_sessions s where s.id = p_session;
  if v_mode is null then
    eligible := false; reason := 'unknown session'; return next; return;
  end if;
  select m.certifies into v_certifies from public.mode_policy m where m.mode = v_mode;
  if not coalesce(v_certifies, false) then
    eligible := false; reason := format('mode %s does not certify (§8: only formal stages)', v_mode);
    return next; return;
  end if;

  -- INV-20 structurally: the eligibility read goes through official_*, so
  -- SYNTHETIC, PREVIEW and PUBLIC_DEMO evidence is invisible here by
  -- construction rather than by a filter somebody remembered.
  select true into v_official from public.official_sessions o where o.id = p_session;
  if not coalesce(v_official, false) then
    eligible := false; reason := 'this session''s evidence is not OFFICIAL and can never reach ELIGIBLE (INV-20)';
    return next; return;
  end if;

  select r.mastery, r.safety_gate_passed into v_mastery, v_gate
    from public.official_results r where r.session_id = p_session and r.supersedes_result_id is null;
  if v_mastery is null then
    eligible := false; reason := 'this session has no official result yet'; return next; return;
  end if;

  select d.passing_rules ->> 'mastery_min' into v_min
    from public.assessment_sessions s
    join public.assessment_definitions d on d.id = s.assessment_definition_id
   where s.id = p_session;
  select p.predikat_bands into v_bands from public.scoring_policy p
    join public.assessment_sessions s on s.scoring_policy_version = p.version where s.id = p_session;
  select b ->> 'predikat' into v_pred
    from jsonb_array_elements(v_bands) b
   where v_mastery >= (b ->> 'min')::numeric
   order by (b ->> 'min')::numeric desc limit 1;

  passed := v_gate and (v_min is null or v_mastery >= v_min);
  mastery := v_mastery; predikat := v_pred;
  if v_min is null then
    eligible := false; reason := 'this assessment names no pass mark; nothing is certified against an invented one';
  elsif not v_gate then
    eligible := false; reason := 'the safety gate did not pass (INV-10)';
  elsif not passed then
    eligible := false; reason := format('mastery %s is below the %s mark', v_mastery, v_min);
  else
    eligible := true; reason := 'eligible';
  end if;
  return next;
end $$;
revoke all on function public.certificate_eligibility(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Preparation: snapshot, number, opaque token, issued_at, canonical payload.
--    Idempotent per session. Internal — no client grant (§7).
-- ---------------------------------------------------------------------------
create function public.certificate_prepare(p_session uuid, p_key_version smallint)
returns table (certificate_id uuid, canonical_payload jsonb, already_sealed boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_e record; v_s public.assessment_sessions; v_person public.persons; v_snap uuid;
  v_cert public.certificates; v_num text; v_token text; v_iso text; v_payload jsonb;
  v_release uuid; v_sha text; v_def uuid; v_defver integer; v_slug text; v_snaphash text;
  v_id uuid; v_photo_hash text;
begin
  select * into v_cert from public.certificates
   where session_id = p_session and supersedes_certificate_id is null;
  if v_cert.id is not null then
    certificate_id := v_cert.id; canonical_payload := v_cert.canonical_payload;
    already_sealed := v_cert.status <> 'ELIGIBLE';
    return next; return;
  end if;

  select * into v_e from public.certificate_eligibility(p_session);
  if not v_e.eligible then raise exception 'not eligible: %', v_e.reason; end if;

  select * into v_s from public.assessment_sessions where id = p_session;
  select * into v_person from public.persons where id = v_s.person_id;
  select i.slug into v_slug from public.institutions i where i.id = v_s.institution_id;
  select s.plp_release_id, s.assessment_definition_id, s.assessment_definition_version
    into v_release, v_def, v_defver
    from public.assessment_sessions s where s.id = p_session;
  select r.content_sha256 into v_sha from public.plp_releases r where r.id = v_release;

  -- INV-30: what the certificate presents, frozen now.
  v_photo_hash := case when v_person.photo_path is null then null
                       else encode(extensions.digest(v_person.photo_path, 'sha256'), 'hex') end;
  v_snaphash := encode(extensions.digest(
    coalesce(v_person.display_name,'') || '|' || coalesce(v_person.photo_path,'') || '|' ||
    coalesce(v_photo_hash,''), 'sha256'), 'hex');
  insert into public.certificate_identity_snapshots
    (person_id, institution_id, name_as_issued, photo_path, photo_content_hash, snapshot_hash)
  values (v_s.person_id, v_s.institution_id, v_person.display_name,
          v_person.photo_path, v_photo_hash, v_snaphash)
  returning id into v_snap;

  -- D3a: opaque, high-entropy, and derived from nothing. 32 random bytes in
  -- base64url; not the certificate number, not the session id, not a sequence.
  v_token := replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
  v_token := replace(v_token, '=', '');
  v_num := 'PINTAR/' || upper(coalesce(v_slug, 'NA')) || '/' ||
           to_char(now(), 'YYYY') || '/' ||
           lpad((coalesce((select count(*) from public.certificates c
                            where c.institution_id = v_s.institution_id), 0) + 1)::text, 5, '0');
  v_iso := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');

  -- §7's canonical payload. Key order is fixed by construction, so the same
  -- inputs always serialise the same way.
  v_payload := jsonb_build_object(
    'certificate_number', v_num,
    'identity_snapshot_hash', v_snaphash,
    'result', jsonb_build_object('score', v_e.mastery, 'predikat', v_e.predikat,
                                 'passed', v_e.passed, 'safety_gate', true),
    'issued_at', v_iso,
    'plp_release_id', v_release,
    'release_content_sha256', v_sha,
    'assessment_definition_id', v_def,
    'assessment_definition_version', v_defver,
    'scoring_policy_version', v_s.scoring_policy_version,
    -- §7 puts key_version INSIDE the signed payload, so it has to be known
    -- before the payload exists. The caller names the key it will sign with;
    -- the payload is then final at prepare time and never mutated, which is
    -- what the immutability trigger requires.
    'key_version', p_key_version);

  if p_key_version is null or p_key_version < 1 then
    raise exception 'a certificate payload names the key version that will sign it (INV-05, INV-07)';
  end if;
  insert into public.certificates (session_id, person_id, institution_id, snapshot_id,
    certificate_number, verification_token, status, issued_at_iso, canonical_payload)
  values (p_session, v_s.person_id, v_s.institution_id, v_snap, v_num, v_token,
          'ELIGIBLE', v_iso, v_payload)
  returning id into v_id;

  perform public.audit_write('certificate.prepared', 'certificates', v_id::text, v_s.institution_id,
    jsonb_build_object('certificate_id', v_id, 'session_id', p_session, 'number', v_num));
  certificate_id := v_id; canonical_payload := v_payload; already_sealed := false;
  return next;
end $$;
revoke all on function public.certificate_prepare(uuid, smallint) from public, anon, authenticated;

-- Sealing: the application supplies the signature it computed over the payload
-- this database produced. Internal (§7) — the app reaches it as service_role.
create function public.certificate_seal(p_certificate uuid, p_key_version smallint, p_signature text)
returns public.certificate_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cert public.certificates;
begin
  select * into v_cert from public.certificates where id = p_certificate;
  if v_cert.id is null then raise exception 'unknown certificate %', p_certificate; end if;
  if v_cert.status <> 'ELIGIBLE' then return v_cert.status; end if;
  if p_signature is null or length(p_signature) < 32 then
    raise exception 'a certificate is not sealed without a signature';
  end if;
  if p_key_version is null or p_key_version < 1 then
    raise exception 'a signature names the key version that produced it (INV-07)';
  end if;
  if (v_cert.canonical_payload ->> 'key_version')::smallint is distinct from p_key_version then
    raise exception 'the signature names key version % but the payload was built for %: the signed bytes would not match',
      p_key_version, v_cert.canonical_payload ->> 'key_version';
  end if;
  update public.certificates
     set status = 'ISSUED', signature = p_signature, key_version = p_key_version
   where id = p_certificate;
  perform public.audit_write('certificate.issued', 'certificates', p_certificate::text,
    v_cert.institution_id,
    jsonb_build_object('certificate_id', p_certificate, 'key_version', p_key_version));
  return 'ISSUED';
end $$;
revoke all on function public.certificate_seal(uuid, smallint, text) from public, anon, authenticated;

create function public.revoke_certificate(p_certificate uuid, p_reason text) returns public.certificate_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_cert public.certificates;
begin
  select * into v_cert from public.certificates where id = p_certificate;
  if v_cert.id is null then raise exception 'unknown certificate %', p_certificate; end if;
  if not public.can_in_institution('CAN_PUBLISH', v_cert.institution_id) then
    raise exception 'revoking a certificate requires CAN_PUBLISH in that institution';
  end if;
  if p_reason is null or btrim(p_reason) = '' then raise exception 'a revocation records why'; end if;
  update public.certificates set status = 'REVOKED', revoked_at = now(), revoked_reason = p_reason
   where id = p_certificate;
  perform public.audit_write('certificate.revoked', 'certificates', p_certificate::text,
    v_cert.institution_id,
    jsonb_build_object('certificate_id', p_certificate, 'reason', p_reason));
  return 'REVOKED';
end $$;
revoke all on function public.revoke_certificate(uuid, text) from public, anon;
grant execute on function public.revoke_certificate(uuid, text) to authenticated, service_role;

-- The learner's own certificate. LEARNER-classified, ownership-checked.
create function public.my_certificate(p_session uuid)
returns table (certificate_id uuid, certificate_number text, verification_token text,
               status public.certificate_status, issued_at_iso text, predikat text, name_as_issued text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  return query
    select c.id, c.certificate_number, c.verification_token, c.status, c.issued_at_iso,
           c.canonical_payload -> 'result' ->> 'predikat', s.name_as_issued
      from public.certificates c
      join public.certificate_identity_snapshots s on s.id = c.snapshot_id
     where c.session_id = p_session and c.supersedes_certificate_id is null;
end $$;
revoke all on function public.my_certificate(uuid) from public, anon;
grant execute on function public.my_certificate(uuid) to authenticated, service_role;

insert into public.client_rpc_registry values
  ('my_certificate', 'LEARNER', 'the caller''s own certificate for their own session'),
  ('revoke_certificate', 'STAFF', 'CAN_PUBLISH in the certificate''s institution; audited');

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003).
-- ---------------------------------------------------------------------------
do $$
declare n int; bad text; def text; v_ok boolean; v_detail text;
begin
  -- one certificate per session, by the table rather than by a read
  if not exists (select 1 from pg_indexes where indexname = 'certificates_one_root_per_session') then
    raise exception 'nothing stops two concurrent finalizes minting two certificates (§8)';
  end if;

  -- the payload carries every protected field of §7
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname='certificate_prepare';
  foreach bad in array array['certificate_number','identity_snapshot_hash','result','issued_at',
                             'plp_release_id','release_content_sha256','assessment_definition_id',
                             'assessment_definition_version','scoring_policy_version','key_version'] loop
    if def not like '%' || bad || '%' then
      raise exception 'the canonical payload omits the protected field % (INV-05)', bad;
    end if;
  end loop;

  -- no secret is reachable from SQL
  if def ~* '(CERT_SECRET|hmac\()' then
    raise exception 'certificate_prepare reaches for a signing key; the secret never enters the database';
  end if;

  -- eligibility reads official_*, not raw evidence (amended INV-20)
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace where ns.nspname='public' and p.proname='certificate_eligibility';
  if def !~ 'official_sessions' or def !~ 'official_results' then
    raise exception 'certificate_eligibility does not read the eligibility-filtered views (INV-20)';
  end if;
  if def ~ '\yfrom public\.assessment_results\y' then
    raise exception 'certificate_eligibility reads raw evidence directly (INV-20)';
  end if;

  -- the internal certificate engine is unreachable by any client (§7)
  foreach bad in array array['certificate_prepare','certificate_seal','certificate_eligibility'] loop
    select string_agg(r.rolname, ', ') into def from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace, unnest(array['anon','authenticated']) r(rolname)
     where ns.nspname='public' and p.proname = bad
       and has_function_privilege(r.rolname, p.oid, 'EXECUTE');
    if def is not null then
      raise exception '%() is client-executable: an internal certificate function is a forgery surface', bad;
    end if;
  end loop;

  -- snapshots are immutable, certificates are never deleted
  if not exists (select 1 from pg_trigger where tgname = 'snapshots_immutable') then
    raise exception 'nothing enforces INV-30 snapshot immutability';
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'certificates_write') then
    raise exception 'nothing enforces the certificate lifecycle';
  end if;

  -- every gate still holds
  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'RPC exposure contract: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_learner_rpcs_are_guarded() a;
  if not v_ok then raise exception 'ownership reachability: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_evidence_consumer_boundary() a;
  if not v_ok then raise exception 'evidence consumer boundary: %', v_detail; end if;

  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) unpinned: %', n, bad; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s): %', n, bad; end if;
  foreach bad in array array['certificates','certificate_identity_snapshots'] loop
    if not exists (select 1 from public.record_class_registry r
                    where r.table_name = bad and r.portability = 'INSTITUTION_SCOPED') then
      raise exception '% carries no INSTITUTION_SCOPED record class (D2)', bad;
    end if;
  end loop;
end $$;
