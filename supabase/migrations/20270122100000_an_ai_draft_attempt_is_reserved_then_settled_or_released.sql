-- ---------------------------------------------------------------------------------------------------------------
-- C3w-1 · THE ATTEMPT LEDGER (C3W-1-DESIGN.md §3, §4, §9 on claude/bob-41-master-plan at 8831d62a; Sharon's pre-build
-- review 6a63bdee and her ruling on the red cases, 19 Nov). Red first: C3W-D1, D1b, D2, D3, D4 and R34
-- (selftest/c3w-syarat.test.ts). Vendor-free names throughout (INV-32). No provider is called from the database.
--
--   * ai_opsi, ai_plafon_platform, ai_hak_sekolah: the qualified options, the one platform ceiling and each school's
--     entitlement (with the per-educator limit folded in, §9.1). Operator-written; no client role reads or writes them.
--     An absent entitlement, an absent platform row or an option that is not QUALIFIED refuses (D7: unset is never
--     unlimited). C3w-1 inserts no row outside tests.
--   * ai_permintaan: one row per generation request. It holds the excerpt's sha-256 and never its text; a request
--     refused for personal data holds no hash either (R-3 control 4, a check constraint).
--   * ai_percobaan: one row per provider attempt. RESERVED, then exactly one of SETTLED, RELEASED or UNRECONCILED;
--     UNRECONCILED then SETTLED or RELEASED. Nothing leaves SETTLED or RELEASED, a sending mark is never cleared, and
--     nothing is deleted, by any writer: a guard trigger (D-3).
--   * The service functions (D-1: an id, and for settling and reconciling the closed-shape usage; never a person or a
--     school), executable by service_role only:
--       ai_cadangkan(request)     reserve the worst case, under school, option, platform FOR UPDATE (D-4, C3-4)
--       ai_tandai_kirim(attempt)  the conditional sending claim, true once (D-2)
--       ai_selesaikan(attempt, usage)  settle at the reported cost; a cost above the reservation stops the platform
--       ai_lepaskan(attempt)      release an attempt that provably never left (RESERVED, no sending mark)
--       ai_rekonsiliasi(attempt, usage)  the operator's settle or release of an UNRECONCILED attempt
--       ai_sapu()                 the sweep: unsent at 10 minutes released; sent with no end past
--                                 ai_batas_kirim_tanpa_akhir() made UNRECONCILED (D-3)
--   * A reservation is refused until R-3's check has passed the request (diperiksa_at, set by the check in the next
--     migration): the ledger fails closed.
-- Refusals are PR220 with the code in DETAIL (ai_tolak).
-- ---------------------------------------------------------------------------------------------------------------

create or replace function public.ai_tolak(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR220',
    detail  = p_code,
    message = case p_code
      when 'AI_TIDAK_TERSEDIA'          then 'AI drafting is not available for this school'
      when 'AI_HAK_BERAKHIR'            then 'the school''s AI drafting entitlement is outside its dates'
      when 'AI_JATAH_HABIS'             then 'the school''s or the educator''s AI drafting allowance is used up'
      when 'AI_PLAFON'                  then 'the provider''s or the platform''s AI spending ceiling is reached'
      when 'AI_HAK_SUMBER'              then 'the source-rights confirmation is missing'
      when 'AI_DATA_PRIBADI'            then 'the excerpt holds personal information and was not sent'
      when 'AI_BELUM_DIPERIKSA'         then 'the request has not passed the personal-information check'
      when 'AI_GAGAL'                   then 'the provider failed after the bounded retries'
      when 'AI_PENGGUNAAN_TIDAK_SAH'    then 'the usage is exactly token_masuk, token_keluar and biaya_mikro as non-negative integers, and an optional id_penyedia'
      when 'AI_PERCOBAAN_TIDAK_TERBUKA' then 'the attempt is not in a state this act ends'
      when 'AI_MAJU_SAJA'               then 'an AI attempt only moves forward, and is never deleted'
      else 'the AI drafting request was refused'
    end;
end $$;
revoke all on function public.ai_tolak(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------- tables
create table public.ai_opsi (
  id                        uuid primary key default gen_random_uuid(),
  kunci                     text not null unique check (kunci ~ '^[a-z0-9-]{1,40}$'),
  nama_tampilan             text not null check (length(nama_tampilan) between 1 and 80),
  model_ident               text not null check (length(model_ident) between 1 and 120),
  -- the price basis, in biaya_mikro per token: {"masuk": n, "keluar": n}
  harga_dasar               jsonb not null check (jsonb_typeof(harga_dasar) = 'object'
                              and harga_dasar ->> 'masuk' ~ '^[0-9]{1,12}$' and harga_dasar ->> 'keluar' ~ '^[0-9]{1,12}$'),
  maks_token_keluar         integer not null default 4000 check (maks_token_keluar > 0),
  perkiraan_token_masuk     integer not null default 8000 check (perkiraan_token_masuk > 0),
  status                    text not null check (status in ('QUALIFIED', 'SUSPENDED', 'WITHDRAWN')),
  plafon_biaya              bigint not null check (plafon_biaya >= 0),
  henti_keras_terverifikasi boolean not null,
  -- Sharon, 16 Nov: the provider-side hard stop is a mandatory qualification field
  check (status <> 'QUALIFIED' or henti_keras_terverifikasi)
);
create table public.ai_plafon_platform (
  id           boolean primary key default true check (id),
  plafon       bigint not null check (plafon >= 0),
  berhenti     boolean not null default false,
  berhenti_pada timestamptz
);
create table public.ai_hak_sekolah (
  sekolah            uuid primary key references public.institutions(id),
  opsi               uuid not null references public.ai_opsi(id),
  aktif              boolean not null,
  jatah              bigint not null check (jatah >= 0),
  batas_per_pendidik bigint check (batas_per_pendidik >= 0),
  mulai              timestamptz not null,
  berakhir           timestamptz,
  check (berakhir is null or berakhir > mulai)
);
create table public.ai_permintaan (
  id                          uuid primary key default gen_random_uuid(),
  sekolah                     uuid not null references public.institutions(id),
  pemohon                     uuid not null references public.persons(id),
  course_id                   uuid not null references public.courses(id),
  sumber_jenis                text not null check (sumber_jenis in ('PELAJARAN', 'TEMPEL')),
  lesson_id                   uuid references public.lessons(id),
  excerpt_sha256              text check (excerpt_sha256 ~ '^[0-9a-f]{64}$'),
  tujuan                      text not null check (length(tujuan) between 1 and 500),
  jumlah                      integer not null check (jumlah between 1 and 10),
  kunci_idempoten             text not null check (kunci_idempoten ~ '^[A-Za-z0-9_-]{1,80}$'),
  hak_sumber_dikonfirmasi_at  timestamptz,
  diperiksa_at                timestamptz,
  hasil                       text check (hasil in ('DRAFTED', 'REFUSED_PERSONAL_DATA', 'REFUSED_ENTITLEMENT', 'PROVIDER_FAILED', 'INVALID_OUTPUT')),
  dibuat_at                   timestamptz not null default now(),
  unique (pemohon, kunci_idempoten),
  check ((sumber_jenis = 'PELAJARAN') = (lesson_id is not null)),
  -- R-3, control 4 (Sharon, C3W-R3-DESIGN.md): a request refused for personal data keeps no hash of the excerpt
  constraint ai_permintaan_r3_tanpa_sidik check (hasil is distinct from 'REFUSED_PERSONAL_DATA' or excerpt_sha256 is null)
);
create index ai_permintaan_sekolah on public.ai_permintaan (sekolah);
create table public.ai_percobaan (
  id             uuid primary key default gen_random_uuid(),
  permintaan     uuid not null references public.ai_permintaan(id),
  opsi           uuid not null references public.ai_opsi(id),
  model_ident    text not null,
  harga_dasar    jsonb not null,
  dicadangkan    bigint not null check (dicadangkan >= 0),
  diselesaikan   bigint check (diselesaikan >= 0),
  token_masuk    bigint check (token_masuk >= 0),
  token_keluar   bigint check (token_keluar >= 0),
  id_penyedia    text check (id_penyedia ~ '^[A-Za-z0-9_-]{1,128}$'),
  keadaan        text not null check (keadaan in ('RESERVED', 'SETTLED', 'RELEASED', 'UNRECONCILED')),
  dicadangkan_at timestamptz not null default now(),
  dikirim_at     timestamptz,
  berakhir_at    timestamptz,
  check ((keadaan = 'SETTLED') = (diselesaikan is not null))
);
create index ai_percobaan_permintaan on public.ai_percobaan (permintaan);
create index ai_percobaan_terbuka on public.ai_percobaan (keadaan) where keadaan in ('RESERVED', 'UNRECONCILED');

do $$
declare t text;
begin
  foreach t in array array['ai_opsi', 'ai_plafon_platform', 'ai_hak_sekolah', 'ai_permintaan', 'ai_percobaan'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
  end loop;
end $$;

insert into public.record_class_registry values
  ('ai_hak_sekolah', 'INSTITUTION_SCOPED', 'C3w-1: a school''s AI drafting entitlement and its per-educator limit; operator-written'),
  ('ai_permintaan', 'INSTITUTION_SCOPED', 'C3w-1: one AI drafting request; the excerpt''s hash, never its text'),
  ('ai_percobaan', 'INSTITUTION_SCOPED', 'C3w-1: one provider attempt of a request; reserved, then settled, released or unreconciled')
on conflict do nothing;
-- L1-F4's registry: the requester is an act's actor, as every other such column
insert into public.orang_lampiran (tabel, kolom, kelas, alasan) values
  ('ai_permintaan', 'pemohon', 'BEBAS',
   'an act''s actor (pemohon): an anonymised person cannot sign in to ask, and the request holds no text of theirs')
on conflict do nothing;

-- ---------------------------------------------------------------------------------------------------------------- D-3
-- the call's hard timeout (src/lib/ai/penyedia.ts BATAS_PANGGILAN_MS, 2 minutes) plus 5 minutes; C3W-D3 reads both
create or replace function public.ai_batas_kirim_tanpa_akhir()
returns interval language sql immutable set search_path = public, pg_temp as $$ select interval '7 minutes' $$;
revoke all on function public.ai_batas_kirim_tanpa_akhir() from public, anon, authenticated;
grant execute on function public.ai_batas_kirim_tanpa_akhir() to service_role;

create or replace function public.ai_percobaan_maju()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if tg_op = 'DELETE' then perform public.ai_tolak('AI_MAJU_SAJA'); end if;
  if old.keadaan in ('SETTLED', 'RELEASED') then perform public.ai_tolak('AI_MAJU_SAJA'); end if;
  if old.keadaan <> new.keadaan and not (
       (old.keadaan = 'RESERVED' and new.keadaan in ('SETTLED', 'RELEASED', 'UNRECONCILED'))
    or (old.keadaan = 'UNRECONCILED' and new.keadaan in ('SETTLED', 'RELEASED'))) then
    perform public.ai_tolak('AI_MAJU_SAJA');
  end if;
  if old.dikirim_at is not null and new.dikirim_at is distinct from old.dikirim_at then perform public.ai_tolak('AI_MAJU_SAJA'); end if;
  if new.permintaan <> old.permintaan or new.opsi <> old.opsi or new.dicadangkan <> old.dicadangkan
     or new.dicadangkan_at <> old.dicadangkan_at or new.model_ident <> old.model_ident or new.harga_dasar <> old.harga_dasar then
    perform public.ai_tolak('AI_MAJU_SAJA');
  end if;
  return new;
end $$;
revoke all on function public.ai_percobaan_maju() from public, anon, authenticated;
create trigger ai_percobaan_maju before update or delete on public.ai_percobaan
  for each row execute function public.ai_percobaan_maju();
create or replace function public.ai_percobaan_maju_kosongkan()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  perform public.ai_tolak('AI_MAJU_SAJA');
  return null;
end $$;
revoke all on function public.ai_percobaan_maju_kosongkan() from public, anon, authenticated;
create trigger ai_percobaan_maju_kosongkan before truncate on public.ai_percobaan
  for each statement execute function public.ai_percobaan_maju_kosongkan();

-- ---------------------------------------------------------------------------------------------------------------- D-1b
-- Sharon's closed shape: exactly the three counts as non-negative integers, plus an optional provider request id
create or replace function public.ai_penggunaan_sah(p jsonb)
returns boolean language sql immutable set search_path = public, pg_temp as $$
  select coalesce(jsonb_typeof(p) = 'object'
     and (select bool_and(k in ('token_masuk', 'token_keluar', 'biaya_mikro', 'id_penyedia')) from jsonb_object_keys(p) k)
     and p ? 'token_masuk' and p ? 'token_keluar' and p ? 'biaya_mikro'
     and jsonb_typeof(p -> 'token_masuk') = 'number' and (p ->> 'token_masuk') ~ '^[0-9]{1,15}$'
     and jsonb_typeof(p -> 'token_keluar') = 'number' and (p ->> 'token_keluar') ~ '^[0-9]{1,15}$'
     and jsonb_typeof(p -> 'biaya_mikro') = 'number' and (p ->> 'biaya_mikro') ~ '^[0-9]{1,15}$'
     and (not p ? 'id_penyedia' or (jsonb_typeof(p -> 'id_penyedia') = 'string' and (p ->> 'id_penyedia') ~ '^[A-Za-z0-9_-]{1,128}$')),
    false)
$$;
revoke all on function public.ai_penggunaan_sah(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------------------------- reserve
-- D-4: the school's entitlement, then the option, then the platform, each FOR UPDATE; then the sums under all three
create or replace function public.ai_cadangkan(p_permintaan uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  m public.ai_permintaan%rowtype;
  h public.ai_hak_sekolah%rowtype;
  o public.ai_opsi%rowtype;
  pl public.ai_plafon_platform%rowtype;
  v_terburuk bigint;
  v_sekolah_pakai bigint; v_pendidik_pakai bigint; v_opsi_pakai bigint; v_platform_pakai bigint;
  v_id uuid;
begin
  select * into m from public.ai_permintaan where id = p_permintaan;
  if not found or m.hasil is not null then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  if m.hak_sumber_dikonfirmasi_at is null then perform public.ai_tolak('AI_HAK_SUMBER'); end if;
  if m.diperiksa_at is null then perform public.ai_tolak('AI_BELUM_DIPERIKSA'); end if;
  select * into h from public.ai_hak_sekolah where sekolah = m.sekolah for update;
  if not found or not h.aktif then perform public.ai_tolak('AI_TIDAK_TERSEDIA'); end if;
  if now() < h.mulai or (h.berakhir is not null and now() >= h.berakhir) then perform public.ai_tolak('AI_HAK_BERAKHIR'); end if;
  select * into o from public.ai_opsi where id = h.opsi for update;
  if o.status <> 'QUALIFIED' or not o.henti_keras_terverifikasi then perform public.ai_tolak('AI_TIDAK_TERSEDIA'); end if;
  select * into pl from public.ai_plafon_platform where id for update;
  if not found then perform public.ai_tolak('AI_TIDAK_TERSEDIA'); end if;
  if pl.berhenti then perform public.ai_tolak('AI_PLAFON'); end if;
  -- D11: at most 2 retries, so 3 attempts in all (§9.4)
  if (select count(*) from public.ai_percobaan a where a.permintaan = m.id) >= 3 then perform public.ai_tolak('AI_GAGAL'); end if;
  v_terburuk := o.maks_token_keluar::bigint * (o.harga_dasar ->> 'keluar')::bigint
              + o.perkiraan_token_masuk::bigint * (o.harga_dasar ->> 'masuk')::bigint;
  -- held (RESERVED, UNRECONCILED) at the reserved amount, settled at the settled amount; read under the three locks
  select coalesce(sum(a.jml) filter (where m2.sekolah = m.sekolah), 0),
         coalesce(sum(a.jml) filter (where m2.sekolah = m.sekolah and m2.pemohon = m.pemohon), 0),
         coalesce(sum(a.jml) filter (where a.opsi = o.id), 0),
         coalesce(sum(a.jml), 0)
    into v_sekolah_pakai, v_pendidik_pakai, v_opsi_pakai, v_platform_pakai
    from (select p.permintaan, p.opsi, case when p.keadaan = 'SETTLED' then p.diselesaikan else p.dicadangkan end as jml
            from public.ai_percobaan p where p.keadaan in ('RESERVED', 'UNRECONCILED', 'SETTLED')) a
    join public.ai_permintaan m2 on m2.id = a.permintaan;
  if v_terburuk + v_sekolah_pakai > h.jatah then perform public.ai_tolak('AI_JATAH_HABIS'); end if;
  if h.batas_per_pendidik is not null and v_terburuk + v_pendidik_pakai > h.batas_per_pendidik then perform public.ai_tolak('AI_JATAH_HABIS'); end if;
  if v_terburuk + v_opsi_pakai > o.plafon_biaya then perform public.ai_tolak('AI_PLAFON'); end if;
  if v_terburuk + v_platform_pakai > pl.plafon then perform public.ai_tolak('AI_PLAFON'); end if;
  insert into public.ai_percobaan (permintaan, opsi, model_ident, harga_dasar, dicadangkan, keadaan)
  values (m.id, o.id, o.model_ident, o.harga_dasar, v_terburuk, 'RESERVED')
  returning id into v_id;
  return v_id;
end $$;

-- ---------------------------------------------------------------------------------------------------------------- D-2
create or replace function public.ai_tandai_kirim(p_percobaan uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  update public.ai_percobaan set dikirim_at = now() where id = p_percobaan and keadaan = 'RESERVED' and dikirim_at is null;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- ---------------------------------------------------------------------------------------------------------------- settle
create or replace function public.ai_selesaikan(p_percobaan uuid, p_penggunaan jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  a public.ai_percobaan%rowtype;
  v_sekolah uuid;
  v_biaya bigint;
  n integer;
begin
  if not public.ai_penggunaan_sah(p_penggunaan) then perform public.ai_tolak('AI_PENGGUNAAN_TIDAK_SAH'); end if;
  select p.* into a from public.ai_percobaan p where p.id = p_percobaan;
  if not found then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  select m.sekolah into v_sekolah from public.ai_permintaan m where m.id = a.permintaan;
  perform 1 from public.ai_hak_sekolah where sekolah = v_sekolah for update;
  perform 1 from public.ai_opsi where id = a.opsi for update;
  perform 1 from public.ai_plafon_platform where id for update;
  v_biaya := (p_penggunaan ->> 'biaya_mikro')::bigint;
  update public.ai_percobaan set keadaan = 'SETTLED', diselesaikan = v_biaya, berakhir_at = now(),
         token_masuk = (p_penggunaan ->> 'token_masuk')::bigint, token_keluar = (p_penggunaan ->> 'token_keluar')::bigint,
         id_penyedia = p_penggunaan ->> 'id_penyedia'
   where id = p_percobaan and keadaan = 'RESERVED' and dikirim_at is not null;
  get diagnostics n = row_count;
  if n <> 1 then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  -- §4.3: a cost above its reservation stops the platform (every reservation then refuses AI_PLAFON)
  if v_biaya > a.dicadangkan then
    update public.ai_plafon_platform set berhenti = true, berhenti_pada = coalesce(berhenti_pada, now()) where id;
  end if;
  return jsonb_build_object('keadaan', 'SETTLED', 'melebihi', v_biaya > a.dicadangkan);
end $$;

-- ---------------------------------------------------------------------------------------------------------------- release
-- an attempt that provably never left: RESERVED with no sending mark. False when it is not one (nothing changes)
create or replace function public.ai_lepaskan(p_percobaan uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  a public.ai_percobaan%rowtype;
  v_sekolah uuid;
  n integer;
begin
  select p.* into a from public.ai_percobaan p where p.id = p_percobaan;
  if not found then return false; end if;
  select m.sekolah into v_sekolah from public.ai_permintaan m where m.id = a.permintaan;
  perform 1 from public.ai_hak_sekolah where sekolah = v_sekolah for update;
  perform 1 from public.ai_opsi where id = a.opsi for update;
  perform 1 from public.ai_plafon_platform where id for update;
  update public.ai_percobaan set keadaan = 'RELEASED', berakhir_at = now()
   where id = p_percobaan and keadaan = 'RESERVED' and dikirim_at is null;
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- ---------------------------------------------------------------------------------------------------------------- reconcile
-- operator-run against the provider's own usage record: a usage with no tokens, no cost and no provider id says the call
-- never arrived, and releases; anything else settles at its cost
create or replace function public.ai_rekonsiliasi(p_percobaan uuid, p_penggunaan jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  a public.ai_percobaan%rowtype;
  v_sekolah uuid;
  v_lepas boolean;
  n integer;
begin
  if not public.ai_penggunaan_sah(p_penggunaan) then perform public.ai_tolak('AI_PENGGUNAAN_TIDAK_SAH'); end if;
  select p.* into a from public.ai_percobaan p where p.id = p_percobaan;
  if not found then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  select m.sekolah into v_sekolah from public.ai_permintaan m where m.id = a.permintaan;
  perform 1 from public.ai_hak_sekolah where sekolah = v_sekolah for update;
  perform 1 from public.ai_opsi where id = a.opsi for update;
  perform 1 from public.ai_plafon_platform where id for update;
  v_lepas := (p_penggunaan ->> 'token_masuk')::bigint = 0 and (p_penggunaan ->> 'token_keluar')::bigint = 0
         and (p_penggunaan ->> 'biaya_mikro')::bigint = 0 and not p_penggunaan ? 'id_penyedia';
  if v_lepas then
    update public.ai_percobaan set keadaan = 'RELEASED', berakhir_at = now()
     where id = p_percobaan and keadaan = 'UNRECONCILED';
  else
    update public.ai_percobaan set keadaan = 'SETTLED', diselesaikan = (p_penggunaan ->> 'biaya_mikro')::bigint, berakhir_at = now(),
           token_masuk = (p_penggunaan ->> 'token_masuk')::bigint, token_keluar = (p_penggunaan ->> 'token_keluar')::bigint,
           id_penyedia = p_penggunaan ->> 'id_penyedia'
     where id = p_percobaan and keadaan = 'UNRECONCILED';
  end if;
  get diagnostics n = row_count;
  if n <> 1 then perform public.ai_tolak('AI_PERCOBAAN_TIDAK_TERBUKA'); end if;
  if not v_lepas and (p_penggunaan ->> 'biaya_mikro')::bigint > a.dicadangkan then
    update public.ai_plafon_platform set berhenti = true, berhenti_pada = coalesce(berhenti_pada, now()) where id;
  end if;
  insert into public.audit_log (action, target_table, target_id, institution_id, summary)
  values ('ai_rekonsiliasi', 'ai_percobaan', p_percobaan::text, v_sekolah,
          jsonb_build_object('keadaan', case when v_lepas then 'RELEASED' else 'SETTLED' end,
                             'biaya_mikro', (p_penggunaan ->> 'biaya_mikro')::bigint));
  return jsonb_build_object('keadaan', case when v_lepas then 'RELEASED' else 'SETTLED' end);
end $$;

-- ---------------------------------------------------------------------------------------------------------------- sweep
create or replace function public.ai_sapu()
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_lepas integer := 0; v_tak integer;
begin
  -- RESERVED and never sent, at 10 minutes: released, each under its own three locks (ai_lepaskan)
  for r in select a.id from public.ai_percobaan a
            where a.keadaan = 'RESERVED' and a.dikirim_at is null and a.dicadangkan_at < now() - interval '10 minutes'
            order by a.dicadangkan_at loop
    if public.ai_lepaskan(r.id) then v_lepas := v_lepas + 1; end if;
  end loop;
  -- sent with no end past the hard timeout plus 5 minutes: UNRECONCILED, held and not consumed (the sums do not move)
  update public.ai_percobaan set keadaan = 'UNRECONCILED'
   where keadaan = 'RESERVED' and dikirim_at is not null and dikirim_at < now() - public.ai_batas_kirim_tanpa_akhir();
  get diagnostics v_tak = row_count;
  return jsonb_build_object('dilepas', v_lepas, 'tak_terekonsiliasi', v_tak);
end $$;

do $$
declare f text;
begin
  foreach f in array array['ai_cadangkan(uuid)', 'ai_tandai_kirim(uuid)', 'ai_selesaikan(uuid,jsonb)', 'ai_lepaskan(uuid)',
                           'ai_rekonsiliasi(uuid,jsonb)', 'ai_sapu()'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

do $$
declare bad text;
begin
  -- D-1: the service functions are service_role's alone
  select string_agg(p.oid::regprocedure::text, ', ') into bad from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.proname in ('ai_cadangkan', 'ai_tandai_kirim', 'ai_selesaikan', 'ai_lepaskan', 'ai_rekonsiliasi', 'ai_sapu')
     and (has_function_privilege('authenticated', p.oid, 'execute') or has_function_privilege('anon', p.oid, 'execute')
          or not has_function_privilege('service_role', p.oid, 'execute'));
  if bad is not null then raise exception 'C3w-1 (D-1): service functions reachable by a client role, or not by service_role: %', bad; end if;
  -- no client role reads or writes the ledger
  select string_agg(t, ', ') into bad
    from unnest(array['ai_opsi', 'ai_plafon_platform', 'ai_hak_sekolah', 'ai_permintaan', 'ai_percobaan']) t
   where has_table_privilege('authenticated', 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('anon', 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE');
  if bad is not null then raise exception 'C3w-1: ledger tables reachable by a client role: %', bad; end if;
  -- the usage's closed shape
  if not public.ai_penggunaan_sah('{"token_masuk": 1, "token_keluar": 2, "biaya_mikro": 3}')
     or public.ai_penggunaan_sah('{"token_masuk": 1, "token_keluar": 2, "biaya_mikro": 3, "sekolah": "x"}')
     or public.ai_penggunaan_sah('{"token_masuk": "1", "token_keluar": 2, "biaya_mikro": 3}') then
    raise exception 'C3w-1 (D-1b): ai_penggunaan_sah does not hold the closed shape';
  end if;
  if not exists (select 1 from pg_trigger where tgrelid = 'public.ai_percobaan'::regclass and tgname = 'ai_percobaan_maju') then
    raise exception 'C3w-1 (D-3): the forward-only guard is missing';
  end if;
end $$;
