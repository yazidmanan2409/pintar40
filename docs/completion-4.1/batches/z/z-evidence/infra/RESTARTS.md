# Z9 · the session machine's restarts on 23 Nov (stream A; ruling 86 item 3)

## What restarts

The whole session machine restarts, not just a process inside it:

- the kernel boots again (dmesg starts at 0.000000, and `/proc/uptime` starts again);
- every process is gone, including dockerd, containerd and the Supabase containers;
- the disk survives: the repository, the scratchpad and Docker's images and containers are still there after the restart.

It is a Firecracker microVM: kernel `6.18.44-fc`, with `rdinit=/process_api -- --firecracker-init` on the command line.

## Evidence (read at 22:19Z, about 6 minutes after the latest restart)

| Reading | Value | What it says |
|---|---|---|
| `/proc/uptime` | 389.5 s at 22:19:54Z | booted 22:13:25Z |
| RAM, swap | 16.0 GB total, 15.0 GB available; no swap | — |
| Memory cgroup (v1, `/sys/fs/cgroup/memory`) | `limit_in_bytes` unlimited (9223372036854771712); `failcnt` 0; `oom_control`: `under_oom 0`, `oom_kill 0`; `max_usage_in_bytes` 5.47 GB since boot | no memory limit is set, and no OOM kill this boot |
| `vm.panic_on_oom` | 0 | an OOM would kill a process, not panic and reboot the kernel |
| `kernel.panic` | 1, with `reboot=k panic=1` on the command line | only a kernel panic reboots the machine |
| dmesg (this boot) | no OOM report, no "Killed process", no panic | — |
| `df /` | 61% used, 16 GB free | not disk |
| systemd journal, wtmp, `/var/log` | no journal; wtmp has no boot records today | nothing from before the restart survives |

**Limit of this evidence:**

- The counters above start again at every boot, so they say nothing about the moment just before a restart.
- To catch the next one, `scratchpad/vakt.sh` now writes one line every 30 s to `vakt.log`, a file that survives a restart. Each line records:
  - uptime, MemAvailable and the cgroup's usage, maximum and failcnt;
  - oom_kill, the load, disk use and the process count;
  - any OOM or panic line in dmesg.

## Restarts today (UTC)

| # | When | Known from | Precision | What it voided |
|---|---|---|---|---|
| 1 | about 16:06Z | uptime 12 min at 16:18Z (`preflight-ec082bc4-docker-down/WHY.txt`) | ± 1 min | pre-flight on ec082bc4 |
| 2 | between about 17:20Z and 18:50Z | after it, `supabase/realtime` had to be pulled again and every registry refused (`preflight-f5700bd1-registry/WHY.txt`) | not measured | pre-flight on f5700bd1 (registry) |
| 3 | about 19:45Z | the local database refused connections at about 19:47Z during step 1(a) of the 19:49Z ruling; dockerd was restarted by hand | ± 5 min | nothing (no run in progress) |
| 4 | between about 20:17Z and 20:25Z | the database refused again at about 20:25Z, after the diagnostic dispatch; dockerd was restarted by hand | ± 5 min | nothing |
| 5 | **21:17:40Z** | uptime 143 s at 21:20:03Z | ± 5 s | 1st pre-flight on 7615d6b1 (`preflight-7615d6b1-container-restart/`) |
| 6 | **22:13:25Z** | uptime 41 s at 22:14:06Z | ± 5 s | 2nd pre-flight on 7615d6b1 (`preflight-7615d6b1-container-restart-2/`) |
| 7 | **22:29:34Z** | uptime 330 s at 22:35:04Z | ± 5 s | 3rd pre-flight on 7615d6b1 (`preflight-7615d6b1-container-restart-3/`) |

- **Intervals:** the two precise restarts are 55 min 45 s apart. The earlier gaps are shorter (about 25 to 90 min).
- **Against the full run:** a full local pre-flight needs about 55 to 60 minutes (the GREEN run on f5700bd1 did fit), so it now straddles at least one restart.

## Finding

**Not memory:**

- No memory limit is set, and the peak this boot was 5.5 of 16 GB.
- An OOM kill cannot reboot this kernel (`panic_on_oom 0`).
- No OOM shows in this boot's dmesg.

**Not disk:** the disk is 61% used.

**What it fits:**

- The restarts come from outside the VM: the host stops or replaces the microVM and boots it again on the same disk, and the guest has no say.
- This fits a session-lifetime or idle/suspend policy of the managed cloud environment.

**Not proven:** nothing inside the VM records why, and no log from before a restart survives. `vakt.log` will show whether the next restart comes with memory pressure (it should not) or out of a quiet machine.

**What follows (ruling 86 items 2 and 4):**

- No local attempt under unchanged conditions. The third local run on 7615d6b1, started 22:15Z before ruling 86 reached this session, is left to finish or be voided; no fourth is started.
- The verification of record moves to GitHub's runners (`../EQUIVALENCE.md`).

## The first restart the logger saw (#7, 22:29:34Z)

`vakt.log`'s last line before #7 is at 22:28:46Z. The machine was healthy:

- uptime 922 s;
- MemAvailable 14.6 GB of 16 GB;
- cgroup usage 4.0 GB, peak 5.47 GB;
- failcnt 0, oom_kill 0;
- no OOM or panic line in dmesg.

The next line would have been at 22:29:16Z. None was written, and the machine booted again at 22:29:34Z. #7 came **16 minutes** after #6.

This is the measurement that rules out memory. The restart came from outside, out of a machine with nothing wrong inside it.
