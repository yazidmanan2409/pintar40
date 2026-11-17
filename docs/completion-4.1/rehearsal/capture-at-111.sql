-- The rehearsal's BEFORE capture, beside the fingerprint: what the after-upgrade checks compare against.
-- Read only. Run from the repository root by the workflow (psql -v ON_ERROR_STOP=1 -f), writing under out/r111/.
-- Each file is COPY text format, so the checks read it back with \copy exactly as written.
begin;
set transaction read only;

-- the schemas that exist at 111 (a schema created later holds only new tables)
\copy (select nspname from pg_namespace) to 'out/r111/schemas.tsv'
-- 20270116130000's input: every auth user with a ban, and its value
\copy (select id, banned_until from auth.users where banned_until is not null) to 'out/r111/banned.tsv'
-- 20261021100000's input: the EMAIL accounts not of an evaluation persona (adalah_persona at 111)
\copy (select a.id from public.accounts a where a.kind = 'EMAIL' and not exists (select 1 from public.evaluation_personas e where e.person_id = a.person_id)) to 'out/r111/email-accounts.tsv'
-- 20261227100000's input: the POST_TEST sittings already FINALIZED
\copy (select id, person_id, finalized_at from public.assessment_sessions where mode = 'POST_TEST' and status = 'FINALIZED') to 'out/r111/post-finalized.tsv'
-- 20261113100000's question: finished QUICK sittings with no certificate (eligible at 111)
\copy (select s.id, (select e.eligible from public.certificate_eligibility(s.id) e) from public.assessment_sessions s where s.mode = 'QUICK' and s.status = 'FINALIZED' and not exists (select 1 from public.certificates c where c.session_id = s.id)) to 'out/r111/quick-uncertified.tsv'
-- every certificate as 111 stores it, and as 111's public verification and verification material read it
\copy (select c.id, c.session_id, to_jsonb(c), to_jsonb(v), to_jsonb(m) from public.certificates c left join lateral public.verify_certificate(c.verification_token) v on true left join lateral public.certificate_verification_material(c.verification_token) m on true) to 'out/r111/certificates.tsv'
-- the open sittings and their status (the first closer pass is compared against this)
\copy (select id, status, authoritative_deadline from public.assessment_sessions where status in ('CREATED', 'IN_PROGRESS', 'PAUSED', 'EXPIRED')) to 'out/r111/open-sittings.tsv'

rollback;
