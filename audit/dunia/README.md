# Ruling 79's audit world (track 3c)

One shared synthetic world for the twelve journeys in Daisy's final scripts
(`docs/coordination/ux/roadmap/AUDIT-79-SKRIP-PERJALANAN.md`, `a06e13e9`, §3), and the captures that walk them
(`audit/perjalanan/`). A harness, not findings: Second Eye reproduces, Daisy judges.

```bash
scripts/dev/siap.sh                     # the machine first (ruling 83)
audit/dunia/muat.sh                     # reset, then the world; writes audit/dunia/dunia.json (not committed)
node audit/perjalanan/j1.mjs            # a journey: 1280, 390 and 320, keyboard only, ID
AUDIT_BAHASA=en AUDIT_LEBAR=1280 node audit/perjalanan/j1.mjs                 # its walk in EN
AUDIT_LALUAN=pembaca-layar AUDIT_LEBAR=1280 node audit/perjalanan/j1.mjs      # a pass's hook (also jaringan-lambat,
                                                                              # gerak-dikurangi)
```

On CI: `.github/workflows/audit-79-dunia.yml` (this branch only, not a required check), with the captures kept as an
artifact.

## The rules (Daisy's §3)

- Invented names only. Synthetic passwords and card PINs, the same after every reset.
- One school year (TA 2026/2027). ID first; each journey walked once in EN.
- The time zone fixed per school, set by an Admin PINTAR through `atur_zona_waktu_sekolah`: SD Sintetis Melati and SMP
  Sintetis Cendekia are WIB (Asia/Jakarta); the WITA school joins with J12's state. The browser runs in the school's zone. The server's clock is the machine's: the product has no clock override, and
  this track changes no product code.
- A reset returns every state: `muat.sh` always starts from `supabase db reset --local`, and loads the world as one
  transaction.
- Every state is made through the product's own functions where one exists (a card through
  `authorize_account_activation`, a chapter through review, the validator, the MCQ quality gate and publication, a
  pass mark through `set_school_pass_mark`). Where it doesn't, it is written as the seeds write it.

## The states

| State | Where | Status |
|---|---|---|
| W1 · an SD class of six with printed class cards, none activated | `01-sekolah-sd.sql` (SD Sintetis Melati, 4A) | built; J1 runs on it |
| 4A's chapter, J1's «today's task» | `02-bab.sql` (`dunia.bab`, the chapter builder) | built |
| W3 · SMP Sintetis Cendekia, 8A: the core chapter «Persamaan Linear Satu Variabel», sealed at 60; a Pemetaan Awal of 3; an Uji Penguasaan of 6 (2 multi-answer, 1 must-be-right, objectives of 2, 3 and 1 item: CDK8-3 is the thin one) | `03-sekolah-smp.sql` | built (checked at load); J2's learners join with W4–W5 |
| W2 · activated learners by email at Cendekia 8A: one with a personal PIN, one whose PIN the school admin reset (`admin_reset_recovery`); the 8A teacher's PIN | `04-w2.sql` | built (checked at load) |
| The platform: two Admin PINTAR (W19's pair) | `01-sekolah-sd.sql` | built |
| W4–W19 | | next |
