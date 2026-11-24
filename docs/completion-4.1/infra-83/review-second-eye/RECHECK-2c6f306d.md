# Second Eye's recheck of ruling 83 at 2c6f306d: the evidence, verbatim

Relayed by Bob, 24 Nov 2026 00:16Z. Committed by the Z-UX builder, who owns `claude/infra-83`. Nothing below is
edited, apart from the headings.

**B-1 PASSES ON A REAL REBOOT, and S-1 PASSES.**

## B-1 on a real reboot

- State: uptime 25.61 s; boot_id f47367b6-d784-4133-afff-ebc097c16516 (the previous boot was
  d59653e6-2fbd-45b2-b350-5011fb4dc0b3); 0 dockerd or containerd processes; /run/containerd/containerd.sock and
  .ttrpc dated 23:38:03 (left by the previous boot).
- siap.sh (2c6f306d) did the following:
  - named «a REBOOT at 2026-11-23T23:59:32Z, after uptime 392s (the previous boot's last beat: 2026-11-23T23:38:15Z,
    oom_kill=0)»;
  - removed the stale /run/containerd/containerd.sock and .ttrpc, /var/run/docker.sock,
    /var/run/docker/containerd/containerd.sock and .ttrpc, and the docker.pid and containerd.pid files;
  - «runtime pulih», images ok 6/6.
- Then «INFRA stack: supabase start failed twice», which was his test setup: the review worktree had no node_modules
  («npx canceled due to missing packages … supabase@3.3.0»). With node_modules present, on the same boot: «stack pulih
  (database, Auth, Mailpit healthy) / port 3999 ok / READY rc=0».

## N-4, MUST FIX (one regex and three controls)

The GHCR narrowing leaks. In SIG_MESIN, `/v2/` matches any versioned API path, and `registr` matches «registration»
and «registrasi». These three app refusals wrongly classify as INFRA registry:

- «fetch https://api.provider.example/v2/messages failed: 403 Forbidden (agent proxy: …)»
- «POST https://id.example.com/registration failed: Forbidden (agent proxy: …)»
- «kirim email registrasi gagal: Forbidden (agent proxy: …)»

Fix: drop `/v2/` and `registr`. Keep ghcr\.io, pkg-containers\.githubusercontent\.com, httpReadSeeker, «Pulling from»
and «docker image», or tie the entry to a registry host the way the `request blocked` entry already is. Plant the three
lines as FAIL controls next to the real GHCR lines, red first. No new reboot proof is needed.

## Nit

With missing dependencies, siap.sh should name the npx line («missing packages: supabase@3.3.0 — run npm ci») instead
of only «supabase start failed twice».

After N-4, ruling 83 is a PASS from Second Eye.

## Run 2: the one-run real-reboot proof of 2c6f306d (relayed by Bob, 00:24Z)

B-1 is now closed from his side.

State (00:16:31Z): uptime 26.77 s; boot_id da41f0f6-474e-4dcf-bfa7-b293b4873736; 0 dockerd or containerd processes.
Left by the previous boot (dockerd's managed containerd):

```
  srw-rw---- root docker 0 2026-11-23T23:59:58 /var/run/docker.sock
  -rw-r--r-- root root   3 2026-11-23T23:59:58 /var/run/docker/containerd/containerd.pid
  srw-rw---- root root   0 2026-11-24T00:00:00 /var/run/docker/containerd/containerd.sock (+ .ttrpc, containerd-debug.sock)
  (no /run/containerd socket this time)
```

siap.sh from 2c6f306d, unchanged, worktree outside /tmp with node_modules (00:16:31Z → 00:16:38Z):

```
  siap: the machine restarted since the last check: a REBOOT at 2026-11-24T00:16:05Z, after uptime 99s (the previous boot's last beat: 2026-11-24T00:01:11Z, oom_kill=0) (no run was in progress)
  siap: disk ok (15.3G free, minimum 10G)
  siap: runtime dead: restarting containerd and dockerd
  siap: runtime: removed the stale socket /var/run/docker.sock
  siap: runtime: removed the stale socket /var/run/docker/containerd/containerd.sock
  siap: runtime: removed the stale socket /var/run/docker/containerd/containerd.sock.ttrpc
  siap: runtime: removed the stale pid file /var/run/docker.pid
  siap: runtime: removed the stale pid file /var/run/docker/containerd/containerd.pid
  siap: runtime pulih (restarted; containerd and dockerd answer)
  siap: images ok (6 present, all pinned by digest)
  siap: Mailpit not answering: (re)starting the sink as CI does
  siap: stack pulih (database, Auth, Mailpit healthy)
  siap: port 3999 ok (free)
  READY
  rc=0
```

That is READY in one run, in 7 s, and it holds both ways a boot leaves its runtime (/run/containerd at 00:00Z,
/var/run/docker now).
