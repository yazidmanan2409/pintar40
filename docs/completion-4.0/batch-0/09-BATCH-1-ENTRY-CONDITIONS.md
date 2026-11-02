# Batch 0 · Deliverable 9 · Batch 1 entry conditions (2 Nov 2026)

Batch 1 (E: data model and security) does **not** start automatically. It starts when every **START** condition below holds. Its merge to `main` additionally needs the **MERGE** conditions.

## 1. To START Batch 1 (implementation on the development branch)

| # | Condition | Who | Status at the end of Batch 0 |
|---|---|---|---|
| S-1 | The owner accepts the Batch 0 evidence package (deliverables 1–10) and authorises Batch 1 explicitly | Owner | Pending |
| S-2 | **F-3 ruled:** CR-91, the class-card trust boundary (recommendation: Option A, class cards for learners only) | Owner | Open |
| S-3 | **F-4a and F-4b ruled** (deliverable 5 §2.7): private content store named; Claude authorised to replace the two real-chapter fixtures and to remove the exposed keyed files from the tree | Owner | Open |
| S-4 | A **CI allowance for Batch 1**, about 200 runner-minutes by E's measured per-batch cost. GitHub bills 0 ms on this public repository, so this is a governance limit | Owner | Open |
| S-5 | CI re-established on the current image (Batch 0 B0-A) | Claude | See deliverable 2 |
| S-6 | The accessibility harness exists and has a recorded baseline (B0-B) | Claude | See deliverable 3 |
| S-7 | The sensitive-material guard is in force (B0-C, SEC-G01/G02, pre-commit) | Claude | Done (commit 0fb65bb) |

**Not required to start:** F-5, F-6 to F-20, Daisy's designs, Dr Gladys's answers. They gate later batches (E, D).

## 2. To MERGE Batch 1 to `main` (and so to staging)

| # | Condition | Who |
|---|---|---|
| M-1 | **Branch protection on `main` configured and verified** (deliverable 4 §6 R-1). Claude cannot set or see it from this session; the owner confirms it in writing | Owner |
| M-2 | **The staging freeze lifted** (D-140(d), D-141(a)). Batch 1 changes the database, and its exit gate needs the migrations applied to staging and counted by facts | Owner |
| M-3 | Batch 1's own exit gate (E) green on its head: each change red on the old code and green on the new; the security suite green; CI and journeys green; the a11y baseline not worse | Claude |
| M-4 | The owner's explicit push approval for that merge (one per batch) | Owner |

**Recommended now (not blocking):**
- R-2 secret scanning and push protection;
- R-3 environment protection;
- R-4 fork-PR approval (deliverable 4 §6).

## 3. Batch 1 scope as it now stands (no expansion)

E's batch 1, with three precisions from Batch 0:
- **W5.2 answer keys:**
  - replace `audit/fixtures/sd5-matematika-bab{1,2}.paket.json` with synthetic fixtures;
  - re-point L4-C01 and the journeys;
  - remove the exposed keyed files from the tree (if F-4b says yes);
  - drop their `nyata-F4` allow entries, so the guard then refuses any real key.
- **The owner's personal address** (deliverable 4 §4.1): replace it in the three files with a role address, if the owner chooses option (b). This touches the staging request file, so it waits for M-2.
- **Every migration in Batch 1 joins the production upgrade set** (deliverable 7). Batch 1's migrations are written assuming production will apply them in the same rehearsed release as 112–177.
