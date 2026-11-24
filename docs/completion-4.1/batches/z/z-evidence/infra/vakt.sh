#!/bin/bash
# Z9 ruling 86 item 3: one line every 30 s, so the state just before a restart survives it (the disk persists)
L=/tmp/claude-0/-home-user-pintar40/3ae26a5e-b362-5f89-b723-4c5c6abc8da8/scratchpad/vakt.log
while true; do
  m=/sys/fs/cgroup/memory
  echo "$(date -u +%FT%TZ) up=$(cut -d' ' -f1 /proc/uptime) avail_kB=$(awk '/MemAvailable/{print $2}' /proc/meminfo) usage=$(cat $m/memory.usage_in_bytes) max=$(cat $m/memory.max_usage_in_bytes) failcnt=$(cat $m/memory.failcnt) oom_kill=$(awk '/oom_kill/{print $2}' $m/memory.oom_control) load=$(cut -d' ' -f1-3 /proc/loadavg) disk=$(df --output=pcent / | tail -1 | tr -d ' ') procs=$(ls /proc | grep -c '^[0-9]')" >> $L
  dmesg 2>/dev/null | grep -iE "oom|killed process|out of memory|panic" | tail -3 | sed "s/^/  dmesg: /" >> $L.dmesg
  sleep 30
done
