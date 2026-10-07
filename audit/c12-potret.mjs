// C-12's hard gate (D-069(l)), the read-only half: what an academic reader sees, taken before and after a Guru learns
// as a participant, so the two can be compared byte for byte. Nothing here writes: every query runs in a transaction
// that is rolled back, as the database owner, and the catalogue readings are taken AS each reader (their claims and
// the authenticated role), exactly as PostgREST would run them. Kept apart from journey.mjs so it can be run against
// any migrated database (`node audit/c12-potret.mjs <db-url> <params.json>`).
import { execFileSync } from "node:child_process";

const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(String(s))) throw new Error(`not a uuid: ${s}`); return `'${s}'::uuid`; };

/**
 * One JSON object, keyed by what was read:
 *   metrik.<reader>|<metric>|<subject>  every catalogue reading the reader may take, at the Kelas, its Bagian and the
 *                                       school (NODE and TENANT metrics), each item of the Kelas (ITEM), each learner
 *                                       of the Kelas (LEARNER)
 *   sumber.<name>                       the protected sources: count and md5 of their rows
 *   daftar.<name>                       rosters and «Murid» lists: count and md5 of their ids
 *   orang                               the Guru's own identity facts
 */
export function sqlPotret({ sd, kelas, bagian, pembaca, guru }) {
  return `begin;
create temp table c12_potret (v jsonb);
grant all on c12_potret to authenticated;
create function pg_temp.sebagai(p_email text) returns void language plpgsql as $f$
declare v uuid;
begin
  reset role;
  select id into v from auth.users where email = p_email;
  if v is null then raise exception 'no user %', p_email; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', v, 'role', 'authenticated', 'email', p_email)::text, true);
  perform set_config('request.jwt.claim.sub', v::text, true);
  set local role authenticated;
end $f$;
create function pg_temp.pemilik() returns void language plpgsql as $f$
begin
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
end $f$;
grant execute on function pg_temp.sebagai(text), pg_temp.pemilik() to authenticated;
do $s$
declare
  v_sd uuid := ${uuid(sd)}; v_kelas uuid := ${uuid(kelas)}; v_bagian uuid := ${uuid(bagian)};
  v_pembaca text[] := array[${pembaca.map(lit).join(", ")}];
  v_cat text; v_metrik text[]; v_m text; v_lingkup text; v_rd text; x uuid; v_subjek uuid[];
  v_item uuid[]; v_murid uuid[]; v_guru uuid; out jsonb := '{}'::jsonb; v_baca jsonb := '{}'::jsonb;
begin
  v_cat := public.current_metric_catalogue();
  select array_agg(metric_id order by metric_id) into v_metrik from public.metric_definitions where catalogue_version = v_cat;
  select array_agg(distinct p.item_id order by p.item_id) into v_item
    from public.presented_items p join public.assessment_sessions s on s.id = p.session_id where s.class_node_id = v_kelas;
  select array_agg(distinct e.person_id order by e.person_id) into v_murid
    from public.memberships m join public.enrollments e on e.id = m.enrollment_id where m.node_id = v_kelas and m.valid_to is null;
  foreach v_m in array v_metrik loop
    select c.governing_scope::text into v_lingkup from public.metric_definitions d
      join public.metric_calculator_scope c using (calculation_key) where d.catalogue_version = v_cat and d.metric_id = v_m;
    v_subjek := case v_lingkup when 'ITEM' then v_item when 'LEARNER' then v_murid else array[v_kelas, v_bagian, v_sd] end;
    foreach v_rd in array v_pembaca loop
      foreach x in array coalesce(v_subjek, '{}'::uuid[]) loop
        perform pg_temp.sebagai(v_rd);
        v_baca := v_baca || jsonb_build_object(concat_ws('|', v_rd, v_m, x), public.metric_evaluate(v_m, x, v_sd, v_cat));
        perform pg_temp.pemilik();
      end loop;
    end loop;
  end loop;
  out := out || jsonb_build_object('katalog', v_cat, 'jumlah_metrik', coalesce(array_length(v_metrik, 1), 0), 'metrik', v_baca,
    'metrik_md5', md5(v_baca::text),
    'metrik_ok', (select count(*) from jsonb_each(v_baca) e where e.value ->> 'status' = 'ok'));

  -- the protected sources, as the owner: every row's content, hashed
  out := out || jsonb_build_object('sumber', jsonb_build_object(
    'academic_responses', (select jsonb_build_array(count(*), md5(coalesce(string_agg(to_jsonb(r)::text, '|' order by r.id), '')))
                             from public.academic_responses r where r.institution_id = v_sd),
    'academic_certificates', (select jsonb_build_array(count(*), md5(coalesce(string_agg(to_jsonb(c)::text, '|' order by c.id), '')))
                                from public.academic_certificates c where c.institution_id = v_sd),
    'official_sessions_academic', (select jsonb_build_array(count(*), md5(coalesce(string_agg(to_jsonb(s)::text, '|' order by s.id), '')))
                                     from public.official_sessions s join public.org_nodes n on n.id = coalesce(s.class_node_id, s.cohort_node_id)
                                    where s.institution_id = v_sd and n.learning_context = 'ACADEMIC'),
    'question_health_kelas', (select jsonb_build_array(count(*), md5(coalesce(string_agg(to_jsonb(q)::text, '|' order by q.item_id), '')))
                                from public.question_health q where q.item_id = any (coalesce(v_item, '{}'::uuid[]))),
    'item_statistics_kelas', (select jsonb_build_array(count(*), md5(coalesce(string_agg(to_jsonb(t)::text, '|' order by t.item_id), '')))
                                from public.service_item_statistics t where t.item_id = any (coalesce(v_item, '{}'::uuid[]))),
    'briefing_kelas', (select count(distinct s.person_id) from public.official_sessions s
                        where s.class_node_id = v_kelas and s.mode = 'POST_TEST' and not public.release_is_professional(s.plp_release_id))));

  -- rosters: the Kelas, «Murid» at the Bagian and at the school, Konfigurasi's learner list
  out := out || jsonb_build_object('daftar', jsonb_build_object(
    'kelas', (select jsonb_build_array(count(*), md5(coalesce(string_agg(e.person_id::text || ':' || e.status::text, ',' order by e.person_id), '')))
                from public.memberships m join public.enrollments e on e.id = m.enrollment_id where m.node_id = v_kelas and m.valid_to is null),
    'murid_bagian', (select jsonb_build_array(count(distinct e.person_id), md5(coalesce(string_agg(distinct e.person_id::text, ','), '')))
                       from public.memberships m join public.org_nodes n on n.id = m.node_id join public.enrollments e on e.id = m.enrollment_id
                      where n.jalur @> array[v_bagian] and m.valid_to is null and n.member_kind is distinct from 'PARTICIPANT'
                        and e.status in ('PENDING', 'ACTIVE')),
    'murid_sekolah', (select jsonb_build_array(count(distinct e.person_id), md5(coalesce(string_agg(distinct e.person_id::text, ','), '')))
                        from public.memberships m join public.org_nodes n on n.id = m.node_id join public.enrollments e on e.id = m.enrollment_id
                       where n.institution_id = v_sd and m.valid_to is null and n.member_kind is distinct from 'PARTICIPANT'
                         and e.status in ('PENDING', 'ACTIVE')),
    'konfigurasi_murid', (select jsonb_build_array(count(*), md5(coalesce(string_agg(e.id::text, ',' order by e.id), '')))
                            from public.enrollments e where e.institution_id = v_sd and e.status = 'ACTIVE' and public.member_kind(e) is distinct from 'PARTICIPANT')));

  -- the Guru: one person, one account, one number; roles as they were
  select a.person_id into v_guru from public.accounts a join auth.users u on u.id = a.auth_user_id where u.email = ${lit(guru)};
  out := out || jsonb_build_object('orang', jsonb_build_object(
    'person_id', v_guru,
    'persons_named', (select count(*) from public.persons p where p.display_name = (select display_name from public.persons where id = v_guru)),
    'accounts', (select count(*) from public.accounts a where a.person_id = v_guru),
    'numbers', (select count(*) from public.institutional_identities i where i.person_id = v_guru),
    'roles', (select md5(coalesce(string_agg(r.role::text || ':' || coalesce(r.scope_node_id::text, '-') || ':' || r.valid_until::text || ':'
                || coalesce(r.revoked_at::text, '-'), ',' order by r.id), '')) from public.role_assignments r where r.person_id = v_guru),
    'roles_aktif', (select coalesce(string_agg(r.role::text, ',' order by r.role::text), '') from public.role_assignments r
                     where r.person_id = v_guru and r.revoked_at is null and now() < r.valid_until)));
  insert into c12_potret values (out);
end $s$;
select v::text from c12_potret;
rollback;`;
}

/** Runs it against a database URL; the parsed object. */
export function ambilPotret(db, params) {
  const keluar = execFileSync("psql", [db, "-At", "-v", "ON_ERROR_STOP=1", "-c", sqlPotret(params)], { encoding: "utf8", maxBuffer: 1 << 26 });
  const baris = keluar.trim().split("\n").filter((l) => l.startsWith("{"));
  if (!baris.length) throw new Error(`the snapshot returned nothing: ${keluar.slice(0, 300)}`);
  return JSON.parse(baris.at(-1));
}

/** Where two snapshots differ, by key path; [] when byte-identical. */
export function beda(a, b, jalur = "") {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const kunci = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    return kunci.flatMap((k) => beda(a[k], b[k], jalur ? `${jalur}.${k}` : k));
  }
  return [`${jalur}: ${JSON.stringify(a)?.slice(0, 120)} → ${JSON.stringify(b)?.slice(0, 120)}`];
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const [db, f] = process.argv.slice(2);
  const { readFileSync } = await import("node:fs");
  const p = ambilPotret(db, JSON.parse(readFileSync(f, "utf8")));
  console.log(JSON.stringify({ katalog: p.katalog, jumlah_metrik: p.jumlah_metrik, bacaan: Object.keys(p.metrik).length, ok: p.metrik_ok,
    metrik_md5: p.metrik_md5, sumber: p.sumber, daftar: p.daftar, orang: p.orang }, null, 1));
}
