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
