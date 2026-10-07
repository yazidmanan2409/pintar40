# PINTAR 4.0 · Closure landing L1: E1, CR-86 and CR-90 (D-128)

**7 October 2026.** The first of the four landings D-128 authorised. L1 is privacy and correctness: E1, CR-86 and CR-90. FD-5 left L1 under D-128(e), and its count and design are in §4.

**This report was a stop.** The Second Eye read it and ruled L1 GREEN, with L2 GO (D-129).

No screen was redesigned. The secret fields keep their frames, sizes and copy-table words; what changed is how each one hides and reveals. Daisy's presentation of the Secret field is her batch 4b lane.

## 1. What landed

| Item | Ruling | What changed | Proof | Commit |
|---|---|---|---|---|
| **E1** | D-128(b) | `audit/ci/proof-reuse.mjs`: main may cite a successful run **on the identical commit only**. Main's search asks for that exact `head_sha`. A main commit that differs even in an unread document runs in full. Branches keep their rules as they were | CI-W02: the new case (identical commit on main) red first, then green. Every existing refusal is also asserted on main. **Live proof, §2** | 8ee3585 |
| **CR-86** | D-127 Q6, Q10; DG-37 | **One Secret field**, `src/components/KolomRahasia.tsx`. It is masked by default and has its own reveal: a labelled pressed-state toggle that names the field it controls, so no control reveals another field. There is no timer, and the person's own submit re-masks it. **All ten secret inputs use it:** sign-in 2, activation 4 (password, its confirmation, PIN, its confirmation), the PIN way back 1, Akun saya's new PIN 2, and the lock 1. Emailed one-time codes stay plain, readable fields (Q10) | PENUTUPAN-R01 red, then green. It finds no password input in `src/` outside the component, pins each screen's count, keeps one-time codes plain, and renders each screen. Three pinned tests restated (§5) | 8ee3585 |
| **CR-90**, BD-11 part | J2.9, BD-11 | `PenjagaSesi` reloads a page restored from the back-forward cache **on every computer**. Until now only shared and card sessions did this. The journey's new **BD11** step covers Chromium, Firefox and WebKit, each on a computer declared personal and one declared shared (§2). Job B now installs all three engines | journeys 37581007813: **BD11 PASS** | 8ee3585 |

**CR-90 is not closed yet.** Its second line, «a stale `lanjut` never carries the next sign-in», moves to L3 (§3.2).

## 2. The proof

### E1, live

| Check D-128(b) set | Result |
|---|---|
| Main names the branch run as ALREADY PROVEN | Main's run **37584213073** on 8ee3585 reads: «**ALREADY PROVEN** by CI run 37580997224 on `8ee3585` …, whose strict selftest ran and succeeded … This run cancels itself and is not evidence; run 37580997224 is.» Its conclusion is `cancelled`, and no job after the proof job ran |
| The deploy lookup finds it | `ci.yml/runs?head_sha=8ee35850265a3e23e9bad08299a86e285a1b61bc&status=success` returns **37580997224**: branch `claude/awesome-rubin-bqxp6p`, workflow_dispatch, success |
| Nothing differs | Main was fast-forwarded a02088c → 8ee3585, the very commit run 37580997224 proved. No request file was touched |

E1 holds, and stays. Main's run cost an estimated **3 minutes instead of about 70**.

**One wording slip, not new.** In the line quoted above, «this commit the same commit» is missing «is». The phrase has been there since CE-8 (6 Oct). This is the first time it has printed, because the identical commit had never been re-run before. It is cosmetic, but it is in the evidence line, so §8 asks whether to fix it. **Fixed in L2** (D-129).

### BD-11, three engines × two kinds of computer

In each engine and mode, the walk runs these steps:
1. The school admin signs in.
2. The admin opens «Konfigurasi» and checks that their name is on the page.
3. The admin signs out with «Keluar».
4. Back is pressed twice. **The admin's name must not appear.**
5. The teacher signs in on the same browser.
6. Back is pressed three times. **Nothing of the admin's session may show.**

**The step's verdict rules are strict:**
- an engine that cannot start is **BLOCKED**;
- a person never activated is **BLOCKED**;
- an admin page that does not name the admin before sign-out is **BLOCKED**;
- any Back that shows the admin's name is **FAIL**;
- any error is **FAIL**.

**PASS therefore means all six combinations ran and none leaked.** The log line itself stops after the Chromium part: the harness shortens long observations. The verdict is the evidence.

**Evidence class (D-129, to be kept as worded):** *preventive hardening added; no pre-change browser reproduction obtained.* BD-11 was never run on the old code (§3.1). This is not a red → green proof, and no later record may call it one.

## 3. Choices and deviations

### 3.1 The reload went in before BD-11 had failed

The D-127 record said: «a fix only if it fails». I made the reload unconditional before the walk ran, for two reasons:
- a headless engine may never restore from the back-forward cache, so a PASS on the old code would not have proven the old code safe;
- on a computer declared personal, the old code left Back after «Keluar» to the browser alone.

The change is small: one effect moved out of the shared-and-card branch.

**What pins it:**
- BD11 in the journeys;
- BOB29's static pin, which checks that the reload exists, **but not that it runs on every computer**. §8 proposed a pin of that invariant; D-129 approved it to ride L2.

**The evidence class, as D-129 rules it to stay:** preventive hardening added; no pre-change browser reproduction obtained. BD11's PASS is behavioural evidence after the change, in three engines and both modes.

### 3.2 The stale `lanjut` moves to L3

After «Keluar», a Back that reaches the server is sent to `/masuk?lanjut=<that page>`. The next sign-in, by anyone, then lands on that path. **Their own authority still applies:** BD11 shows nothing of the previous session.

Dropping the stale `lanjut` changes where sign-in sends a person. That is the routing L3's hard stop holds until its design is reviewed (D-128(a)). So it belongs to L3's design, where the working context decides landing.

**CR-90 stays open on this line until L3.**

### 3.3 CR-86's walk, in part

CR-86's evidence asks for a walk of activation, reset, Akun saya, the lock and sign-in.

| Field | Status |
|---|---|
| **Activation and sign-in** | Walked through the new field in journeys 37581007813: every step that activates or signs in types through it |
| **The lock** | Rendered by BOB29-A01 and A02 in the strict selftest |
| **The PIN way back and Akun saya's new PIN** | Rendered by PENUTUPAN-R01 only |

The browser walks of the last three belong to the regression after APPLICATION READY. They will be walked there, not assumed.

## 4. FD-5: the count, and a design that needs a ruling

**The count** (staging, read only, 7 Oct):

| Source | Questions | Values |
|---|---|---|
| The four real schools | **124 sealed** + 28 unsealed | only 0.3, 0.5 and 0.7, as every workbook and PINTAR package writes them |
| The synthetic school | **729 sealed** | the same three values |
| The PINTAR library | 0 | — |

- **8 Uji Cepat definitions** carry a difficulty mix, with 12 sittings in all; this is staging test data.
- **No pre-test or post-test is affected:** every one carries an empty mix.

**Why the stored values cannot simply be flipped:**
- The value is part of the sealed-content hash (`content_freeze_hash.sql:121`).
- It is also one of the fields frozen once a question is sealed (`:292`).
- So the immutability guard would refuse a flip, and forcing one would change every sealed release's hash.

**The options:**

| | What | Sealed data | Effect |
|---|---|---|---|
| **A (recommended)** | **Fix the reading, not the data.** The stored value is the author's difficulty: 0.3 Mudah, 0.5 Sedang, 0.7 Sulit. `difficulty_band` reads it that way (≤ 0.4 MUDAH, ≥ 0.7 SULIT). `empirical_difficulty` stays a measured p-value, and any comparison converts explicitly | **untouched:** no value, hash, import or package changes | From the landing on, the teacher's picker and Studio's draw read the author's meaning. Papers already drawn are unchanged |
| B | Flip the stored values to the p-value convention | 853 sealed questions; the immutability guard; release hashes | Needs a governed re-seal of every affected release. High risk, for no gain to a teacher |
| C | Convert new imports only | untouched | Two conventions in one table. Rejected |

**What A changes:**
- one function, `difficulty_band`, and its comment;
- the test fixtures that assumed the p-value meaning (FABLE-05's draw cases; counted when the landing starts);
- one new test: an author's «Mudah» is MUDAH in the band, on the teacher's screen, and in a drawn mix.

**A needs a ruling.** The D-127 record (§4, step 2) proposed the p-value convention before this count existed, and A reverses that choice.

## 5. Instruments restated with the behaviour

| Test | What changed |
|---|---|
| **DAISY-20-LAYAR-01 §4** | Activation asserts two pressed-state reveals per step, each naming its own field (`password`, `ulang`, `pin`, `pin-ulang`). Before, it asserted one reveal per step |
| **UX1-MASUK-AKSES-01 §2** | The sign-in screen's card PIN and password each go through the Secret field, with the copy table's own show and hide words |
| **UX1-MASUK-KONTRAK-01** | Exactly one Secret field asks for the current password |
| **CI-W02** | As in §1 |

## 6. The runs

| Step | Run | Result |
|---|---|---|
| CI on 8ee3585 | 37580997224 | **green first time**: 18/18 jobs; the strict selftest **621 passed, 0 failed** (620 + PENUTUPAN-R01) |
| Journeys on 8ee3585 | 37581007813 | **73 PASS, 1 FAIL**: S23q, CR-52's known A item (D-123(1)). **BD11 PASS** |
| Main fast-forwarded a02088c → 8ee3585 | — | 7 Oct 06:55 UTC |
| CI on main at 8ee3585 | 37584213073 | **ALREADY PROVEN** by 37580997224; cancelled (E1) |
| Staging | — | Not run: L1 has no migration |

**Run locally before the dispatch:**
- typecheck and lint, both clean;
- PENUTUPAN-R01, red on the old screens and green after;
- CI-W02, red, then green;
- the three restated tests.

**The local full suite** showed only the two known local-state items:
- BOB26-K01: `CARD_PEPPER` is not set on this machine. It fails the same way with L1 stashed.
- BOB02-X02: a timing flake under load. It passes alone in 367 ms.

**Not checked:** whether the staging app already serves L1's screens. No L1 step depends on it.

**Checked:** the comment's claim that pages are sent no-store. Run 37580997224's build lists all 100 routes as server-rendered on demand, none static.

## 7. The allowance (1,900 estimated minutes, a ceiling; E3 held)

| Run | Estimate (min) |
|---|---|
| spent before L1 (batch 3b's close) | 621 |
| L1 CI 37580997224 | 72 |
| L1 journeys 37581007813 (BD11 and the full walk) | 38 |
| main 37584213073 (E1, ALREADY PROVEN) | 3 |
| **Spent** | **734** |

- **L1 against its forecast:** about 125 forecast, **113 actual**. Nothing was wasted, and no re-run was needed.
- **Remaining: 1,166 of 1,900.**

**The re-forecast before L2.** L1's measured parts are a branch cycle at 72, journeys at 38 and main at 3.

| Work | At D-128 | Now |
|---|---|---|
| L1 | ≈ 125 | **113** (actual) |
| L2 (cycle + journeys + main; + 14 if a re-run) | ≈ 125 | 113–127 |
| L3 (+ a Golden School walk 44 + staging 3) | ≈ 169 | 160–174 |
| L4 | ≈ 125 | 113–127 |
| P1–P4 (4 × (cycle + main + a Golden School walk)) | ≈ 532 | 476–532 |
| Batch 6 regression | 160–200 | 160–200 |
| Batch 7 fixes (one or two landings) | 89–178 | 75–150 |
| **Remaining work** | — | **1,097–1,310** |
| Contingency: FD-5 alone (it needs no journey) | + 125 | + 75, or **0** if it rides L2's cycle as its own commit |
| Contingency: BD-11 fails | + 89 | **0** (it passed) |

**Against the 1,166 remaining:**
- the low path fits with about 70 to spare;
- the high path is over by about 145, or about 220 with FD-5 alone.

At D-128 every path was over. Now the ceiling binds only on the upper path. **The next firm measure is L3's**, the largest landing.

**I propose nothing on E3**, as D-128(f) rules. Each later report carries the same two lines: what the landing spent, and what remains.

## 8. For the Second Eye

1. **L2: go?** L2 covers CR-84, CR-87, FD-7, FD-8 and FD-9, as D-128 composed it.
2. **FD-5, Option A (§4):** a ruling, because A reverses D-127 §4 step 2. With A ruled, FD-5 can land as **its own commit inside L2's cycle**. One run proves both; main fast-forwards only to a head that run proved, which E1 now requires. Otherwise it lands alone, at about 75.
3. **Two instrument lines to ride L2's commit**, if approved (neither changes behaviour):
   - (a) the missing «is» in the ALREADY PROVEN line (§2);
   - (b) a static pin that the back-forward reload runs on every computer, not only shared or card ones (§3.1).
4. **The stale `lanjut` into L3's design (§3.2):** confirm. CR-90 stays open on that line until then.
