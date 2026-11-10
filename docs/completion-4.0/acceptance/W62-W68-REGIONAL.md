# W6.2 and W6.8 from Indonesia: the controlled measurement (8 Nov 2026)

**Owner, 8 Nov:** «Arrange controlled W6.2 and W6.8 measurements from Indonesia. Preserve the existing performance targets.»

**The targets, unchanged:**
- **W6.2 (U-PERF):** a first screen in ≤ 3 s.
- **W6.8 (D-031):** with 50 learners at once, an answer saved at p95 ≤ 1 s and p99 ≤ 3 s; nothing lost, duplicated or unscored; server errors under 0.1 %.

**Why it must come from Indonesia:** the app and database open every first screen in ≤ 492 ms when co-located. Every staging figure so far was taken from GitHub's runners in the US, and the gap is the distance. Staging serves from Singapore: Vercel `sin1`, beside Supabase (`batch-8/evidence/w69-bukti-pemeriksaan.md` §2d). Schools are in Indonesia, so the figure that judges the target is one taken from there.

**What is ready:**
- **`.github/workflows/perf-regional.yml`:** the same harness as the runs of record, with nothing changed but the machine.
  - `journey.mjs` for W6.2;
  - `l1-browser.mjs` with the same database sampling and D-031 judge for W6.8;
  - a `where` probe that proves where the machine meets the network.
- **R0-PIN-01:** accepts the regional runner only because it is labelled `ubuntu-24.04` too.

**What needs you:** one machine in Indonesia, registered to the repository for the measurement and removed after. Nothing else.

---

## 1 · The machine (choose one; A is the controlled figure)

| | A · a cloud VM in Jakarta (recommended) | B · a computer on a school's or home connection |
|---|---|---|
| Measures | Indonesia's network path to staging, without one building's last mile | the same plus a real last mile (Wi-Fi, ISP) |
| Where | GCP `asia-southeast2` (Jakarta), AWS `ap-southeast-3` (Jakarta), or an Indonesian provider | any Ubuntu 24.04 machine in Indonesia |
| Size | 4 vCPU, 16 GB RAM, 30 GB disk (50 browser sessions in 5 runners of 10) | the same for W6.8; any for W6.2 alone |
| OS | **Ubuntu 24.04 LTS** (Playwright 1.55's browser build) | Ubuntu 24.04 LTS |
| Cost and time | a few hours of one VM | none |

A gives the controlled figure for the record. B, for W6.2 only, is a useful reality check if available.

## 2 · Register it (about 15 minutes)

1. In GitHub, open the repository, then **Settings → Actions → Runners → New self-hosted runner**, and choose **Linux x64**.
2. On the machine, run the download and `config.sh` commands GitHub shows. At the configure step add:
   `--labels indonesia,ubuntu-24.04 --name indonesia-1`
   Then `./run.sh`, or `sudo ./svc.sh install && sudo ./svc.sh start`.
3. **For W6.8, register 5 runners** on the same VM: five folders, names `indonesia-1` to `indonesia-5`, the same labels. The five shards must start together.
4. Tell me it is registered. I dispatch, in this order:
   1. `perf-regional.yml` mode `where`: proves the machine reaches staging from the region.
   2. `perf-regional.yml` mode `journey`, reps 3: **W6.2**.
   3. `perf-l1.yml` mode `seed`, label `ID1`, total 50, kelas 2, on GitHub's runner: fresh synthetic learners for the wave.
   4. `perf-regional.yml` mode `browser`, label `ID1`, 5 shards × 10: **W6.8**.
5. **After the measurement, remove the runners** in **Settings → Actions → Runners**, and delete the VM.

## 3 · Security, read before registering

- **The jobs read staging's keys on that machine.** That means the service-role key and the database URL, masked in logs but present in the job's environment while it runs. Use a machine only you control. Never use a shared computer, and never one with other users. Staging only: production's keys are never read by these jobs.
- **This repository is public.** A self-hosted runner can be targeted by a workflow in someone else's pull request. Before registering, open **Settings → Actions → General** and, under the approval for fork pull request workflows, choose to require approval for all external contributors. Keep the runner registered only for the measurement window.
- **`perf-regional.yml` is dispatch-only.** No push or pull request runs it.

## 4 · What is recorded

The runs go into `batch-8/evidence/w69-bukti-pemeriksaan.md` as §2e, beside the US figures, with:
- each run id and the machine's `where` output;
- W6.2 per role and step against 3 s;
- W6.8 against each D-031 criterion.

The register's W6.2 and W6.8 rows move only on these figures. If a target is not met from Indonesia, the row stays NOT MET with the cut of where the time goes, as §2d did.
