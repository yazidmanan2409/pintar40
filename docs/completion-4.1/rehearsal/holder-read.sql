-- One certificate as its holder reads it (my_certificate), signed in as the holder. Read only.
-- psql -v cert=<certificate id> -v sess=<its session> -v sub=<the holder's auth user> -f holder-read.sql
-- Prints one COPY text line: the certificate id, then my_certificate's row as jsonb.
begin transaction read only;
select set_config('request.jwt.claim.sub', :'sub', true) \g /dev/null
select set_config('request.jwt.claims', json_build_object('sub', :'sub', 'role', 'authenticated')::text, true) \g /dev/null
copy (select :'cert', to_jsonb(mc) from public.my_certificate(:'sess') mc) to stdout;
rollback;
