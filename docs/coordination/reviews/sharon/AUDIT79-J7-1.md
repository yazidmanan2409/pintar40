# Audit 79 · J7-1: a certificate confirmed «Berlaku» on a result that no longer passes — Sharon's judgement

**Work:** Daisy's `AUDIT-79-TEMUAN-J7.md` (`2002b662`, `ux-1/daisy-experience`), local world W14, synthetic.
Read against `main` `429b7dcc`:
- `putuskan_tinjauan_sertifikat` (`20270115110000`);
- `konfigurasi/sertifikat/page.tsx:150–185`;
- `verify_certificate`.

## (1) Severity: HIGH, an integrity defect in a public credential. Not Critical today, because no real certificate can reach it

**What happens:**
- After a governed key correction, the result in force (`hasil_murid_id`) no longer meets the sealed mark: 67 → 50 against 60.
- The review row says so, with the before, after and target figures.
- Yet `CONFIRMED` is accepted exactly as for a still-passing result.
- The public read then gives `pass` from the **sealed issue payload** (`canonical_payload.result.passed`), and validity BERLAKU.
- **So the public record asserts a pass that PINTAR's own result in force contradicts.** That is the defect.

**Why High and not Critical:**
- It needs an authorised reviewer's act (`boleh_putuskan_tinjauan`), with a 10–300 character reason, and it is audited (`certificate.review_decided`). The UI does require the reason: the textarea is `required` with `minLength` 10.
- Exposure is nil today; see (3).
- **It becomes Critical the moment a real certificate can be issued.** So it must be fixed before the first real certificate, which is D2-R's own gate («before the first certificate is issued to a real participant»).

## (2) Where it is enforced: IN THE DATABASE, refuse

**My recommendation, for the owner to confirm:**
- `putuskan_tinjauan_sertifikat` **refuses `CONFIRMED`** when the result in force no longer satisfies `sertifikat_layak_dengan(session, mastery, gate)`.
- It uses a new code, `CERT_REVIEW_RESULT_NO_LONGER_PASSES`. The only decision left is `REVOKED`.
- The certificate asserts «memenuhi kriteria kelulusan». After a governed correction shows the criteria were not met, keeping it «Berlaku» makes the public verification false. A confirmation dialog cannot make a false public statement true.

**If the owner wants a "keep" decision for such a case** (for example, the institution honours the original award):
- it must be a **distinct decision**, not `CONFIRMED`;
- its public read must say something true, for example validity «DITINJAU» kept, or a distinct state with its own words, never «Berlaku · Lulus»;
- that is a product and policy decision (Daisy and the owner), not a confirmation.

**The UI:** on a row whose new result fails, offer only «Cabut», with words that name the effect, or the owner's distinct decision. Never the same «Konfirmasi berlaku» as on a passing row. **Daisy's proposed cause** (a consequential choice offered the same, whatever the facts beside it) is right, and this is its sharpest case.

**Red-first tests:**
- a now-failing review refuses CONFIRMED in the database (a direct RPC call, not only the page);
- a still-passing review confirms as today;
- the public read after a revocation reads DICABUT.

## (3) Exposure

- **Production (111): the flow does not exist.** The key-correction and certificate-review migration `20270115110000` is number **229** in the repository. No production data read is needed to know that.
- **Staging (309): the flow is live.** These are read-only counts, which is enough:

```sql
begin transaction read only;
-- open reviews, and how many of them are now failing
select count(*) filter (where r.decision is null) as open_reviews,
       count(*) filter (where r.decision is null and not public.sertifikat_layak_dengan(c.session_id, ar.mastery, ar.safety_gate_passed)) as open_now_failing,
       count(*) filter (where r.decision = 'CONFIRMED' and not public.sertifikat_layak_dengan(c.session_id, ar.mastery, ar.safety_gate_passed)) as confirmed_now_failing
  from public.certificate_reviews r
  join public.certificates c on c.id = r.certificate_id
  join public.assessment_results ar on ar.id = public.hasil_murid_id(c.session_id);
rollback;
```

`confirmed_now_failing > 0` would be a public record already asserting a contradicted pass. On staging every school is synthetic, but name them, and revoke them under the owner's authorisation.
