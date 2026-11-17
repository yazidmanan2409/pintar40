#!/bin/bash
# Bob's offline rehearsal of jalankan-e.sh, run under zsh (the macOS default) and, for the happy path, bash too.
# The happy path, then seven stop paths. A process-list sampler runs throughout (Sharon R1). Never contacts a provider.
S="$1"; TGZ="$S/pkg/pintar-e-local.tar.gz"; H="$(cd "$(dirname "$0")" && pwd)"; OUT="$S/rehearsal-results.txt"; : > "$OUT"
case_run() { # name, shell, mock behaviour, input, extra-setup
  local name="$1" sh="$2" beh="$3" input="$4" setup="${5:-}"; local R="$S/reh-$name"; rm -rf "$R"; mkdir -p "$R"; ( cd "$R" && tar -xzf "$TGZ" )
  [ -n "$setup" ] && ( cd "$R/pintar-e-local" && eval "$setup" )
  node "$H/mock-api.mjs" 47111 "$R/seenA.json" "$beh" & local PA=$!
  node "$H/mock-api.mjs" 47112 "$R/seenO.json" "$beh" & local PO=$!
  ( while :; do ps -eo args; sleep 0.05; done ) > "$R/ps-samples.txt" 2>/dev/null & local PS=$!
  sleep 1
  printf "$input" | E_REHEARSE_ANTHROPIC_BASE=http://127.0.0.1:47111 E_REHEARSE_OPENAI_BASE=http://127.0.0.1:47112 \
    $sh "$R/pintar-e-local/jalankan-e.sh" --rehearse > "$R/out.txt" 2>&1; local rc=$?
  kill $PA $PO $PS 2>/dev/null; wait $PA $PO $PS 2>/dev/null
  local runs=no; [ -d "$R/pintar-e-local/hasil/PRIVAT-simpan-jangan-dikirim/runs" ] && runs=yes
  local leak=none; grep -rlq "REHEARSALKEY" "$R/pintar-e-local/hasil" "$R/out.txt" 2>/dev/null && leak=FOUND
  local psleak=none; grep -q "REHEARSALKEY" "$R/ps-samples.txt" && psleak=FOUND
  local n=$(grep -c '^' "$R/ps-samples.txt")
  echo "$name ($sh): exit=$rc runs_dir=$runs key_in_outputs=$leak key_in_process_list=$psleak ($n ps lines) | $(grep -E 'STOPPED|== Done' "$R/out.txt" | head -1)" | tee -a "$OUT"
}
K='sk-ant-REHEARSALKEYAAA\nsk-proj-REHEARSALKEYOOO\n'
case_run happy       zsh  ok   "${K}RUN\n"
case_run happy-bash  bash ok   "${K}RUN\n"
case_run no-go       zsh  ok   "${K}run\n"
case_run swapped     zsh  ok   'sk-proj-REHEARSALKEYOOO\nsk-ant-REHEARSALKEYAAA\nRUN\n'
case_run empty       zsh  ok   '\nsk-proj-REHEARSALKEYOOO\nRUN\n'
case_run key-denied  zsh  deny "${K}RUN\n"
case_run tampered    zsh  ok   "${K}RUN\n" 'echo "// x" >> docs/completion-4.1/c3-eval/prices.json'
case_run old-hasil   zsh  ok   "${K}RUN\n" 'mkdir hasil'
case_run dotenv      zsh  ok   "${K}RUN\n" 'touch .env'
# R2, without contacting a provider: run the script's own live-mode unset line, with stray rehearsal variables set.
L="$(grep -E '^if \[ "\$MODE" = live \]; then unset E_REHEARSE' "$H/../jalankan-e.sh")"
left="$(E_REHEARSE=1 E_REHEARSE_ANTHROPIC_BASE=x E_REHEARSE_OPENAI_BASE=y zsh -c "MODE=live; $L; env | grep -c '^E_REHEARSE' || true")"
echo "stray-rehearsal-vars (zsh): variables left after the live-mode unset = $left (expect 0)" | tee -a "$OUT"
R="$S/reh-happy"; echo "--- happy path (zsh) ringkasan:" >> "$OUT"; cat "$R/pintar-e-local/hasil/untuk-bob/ringkasan.txt" >> "$OUT"
echo "--- happy path: provider or model names in the Sharon and judge files:" >> "$OUT"
grep -rliE "anthropic|openai|claude|gpt|sonnet" "$R/pintar-e-local/hasil/untuk-sharon" "$R/pintar-e-local/hasil/untuk-juri" >> "$OUT" || echo "none" >> "$OUT"
echo "--- happy path: what each mock received (the auth shown is the rehearsal dummy):" >> "$OUT"; cat "$R/seenA.json" "$R/seenO.json" >> "$OUT"; echo >> "$OUT"
echo "--- shells: $(zsh --version); bash $BASH_VERSION" >> "$OUT"
# Controls: prove the two detectors would catch a leak.
# (1) The process-list sampler sees a key that sits in a live process's argv (the risk Sharon R1 names).
node -e 'setTimeout(() => {}, 2000)' sk-ant-REHEARSALKEYCONTROL & CP=$!; sleep 0.5
c1=none; ps -eo args | grep -q '^node -e .*REHEARSALKEYCONTROL' && c1=CAUGHT; wait $CP
echo "control-R1: a key in a live process's argv is visible in the process list = $c1 (expect CAUGHT)" | tee -a "$OUT"
# (2) The exact-value scan, as the script runs it, finds a planted key (Sharon R3).
C="$S/control-r3"; rm -rf "$C"; mkdir -p "$C/hasil/untuk-bob"; echo "x sk-ant-REHEARSALKEYAAA y" > "$C/hasil/untuk-bob/x.txt"
c2="$(zsh -c 'K_ANTHROPIC=sk-ant-REHEARSALKEYAAA; K_OPENAI=sk-proj-REHEARSALKEYOOO; grep -rqF -f <(printf "%s\n" "$K_ANTHROPIC" "$K_OPENAI") "$1"; echo $?' _ "$C/hasil")"
echo "control-R3: the exact-value scan on a planted key returns $c2 (expect 0, which stops the script)" | tee -a "$OUT"
