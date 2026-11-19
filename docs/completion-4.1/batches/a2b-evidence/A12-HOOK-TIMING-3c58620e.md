# A2b · A12, the request hook's timing: the raw figures

Second Eye, 16 Nov 2026, on the local stack (one machine for every case), for the frozen candidate `3c58620e`.
Sharon reads it (PLAN-A2B-C2W.md §2.4 A12). Recorded on the C2w branch as an evidence file, at the Chief Architect's
request, so that the candidate does not move.

- **The statement:** 6b of `docs/completion-4.1/checkpoint/PROMOTION-PRECONDITIONS.md`, as written there.
  - It makes 200 calls of `pintar_permintaan.periksa()` on an ordinary RPC path, with authenticated claims whose
    subject matches no one.
  - It runs in a read-only transaction.
  - The first interval, which holds the set-up, is left out.
- **The cases:** each case is 7 runs.
  - **before:** `main` at `eff99f98`, 267 migrations, a fresh reset, no window.
  - **after:** the candidate `3c58620e`, 281 migrations, a fresh reset, no window.
  - **after-window:** the candidate with one active PLANNED class window (a class of one school, active for 5
    minutes, `reason_code` RUTIN).
- **Sharon's gate:** p95 ≤ 1 ms with no window active, and after ≤ before + 0.5 ms. The cost with a work-scoped
  window active is measured too. **Met:**

| Case | p95 range over the 7 runs (ms) |
|---|---|
| before (267) | 0.032–0.064 |
| after (281) | 0.016–0.025 |
| after, with a class window | 0.058–0.106 |

## Raw output (calls, p50 ms, p95 ms per run)

### before

```
before 267 no-window
267
0
200,0.0440,0.0570
200,0.0300,0.0480
200,0.0470,0.0561
200,0.0300,0.0490
200,0.0300,0.0420
200,0.0300,0.0641
200,0.0300,0.0321
```

### after

```
after 281 no-window
281
0
200,0.0150,0.0181
200,0.0190,0.0250
200,0.0150,0.0161
200,0.0150,0.0160
200,0.0150,0.0211
200,0.0150,0.0160
200,0.0150,0.0170
```

### after-window

```
after 281 class-window-active
1f97180c-5dc2-4fe3-8974-eb44b9f23b29,PLANNED,{03c07a0d-b366-489f-b388-1357c1afabcf}
INSERT 0 1
200,0.0800,0.1062
200,0.0510,0.0601
200,0.0520,0.0790
200,0.0510,0.0582
200,0.0510,0.0630
200,0.0550,0.0820
200,0.0510,0.0611
```

