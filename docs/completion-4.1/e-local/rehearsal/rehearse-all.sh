#!/bin/bash
# Bob's offline rehearsal of jalankan-e.sh: the happy path, then five stop paths. Never contacts a provider.
S="$1"; TGZ="$S/pkg/pintar-e-local.tar.gz"; H="$S/harness"; OUT="$S/rehearsal-results.txt"; : > "$OUT"
case_run() { # name, mock behaviour, input, extra-setup
  local name="$1" beh="$2" input="$3" setup="${4:-}"; local R="$S/reh-$name"; rm -rf "$R"; mkdir -p "$R"; ( cd "$R" && tar -xzf "$TGZ" )
  [ -n "$setup" ] && ( cd "$R/pintar-e-local" && eval "$setup" )
  node "$H/mock-api.mjs" 47111 "$R/seenA.json" "$beh" & local PA=$!
  node "$H/mock-api.mjs" 47112 "$R/seenO.json" "$beh" & local PO=$!
  sleep 1
  printf "$input" | E_REHEARSE_ANTHROPIC_BASE=http://127.0.0.1:47111 E_REHEARSE_OPENAI_BASE=http://127.0.0.1:47112 \
    bash "$R/pintar-e-local/jalankan-e.sh" --rehearse > "$R/out.txt" 2>&1; local rc=$?
  kill $PA $PO 2>/dev/null; wait $PA $PO 2>/dev/null
  local runs=no; [ -d "$R/pintar-e-local/hasil/PRIVAT-simpan-jangan-dikirim/runs" ] && runs=yes
  local leak=none; grep -rlq "REHEARSALKEY" "$R/pintar-e-local/hasil" "$R/out.txt" 2>/dev/null && leak=FOUND
  echo "$name: exit=$rc runs_dir=$runs key_text_in_outputs=$leak | $(grep -E 'STOPPED|== Done' "$R/out.txt" | head -1)" | tee -a "$OUT"
}
K='sk-ant-REHEARSALKEYAAA\nsk-proj-REHEARSALKEYOOO\n'
case_run happy      ok   "${K}RUN\n"
case_run no-go      ok   "${K}run\n"
case_run swapped    ok   'sk-proj-REHEARSALKEYOOO\nsk-ant-REHEARSALKEYAAA\nRUN\n'
case_run empty      ok   '\nsk-proj-REHEARSALKEYOOO\nRUN\n'
case_run key-denied deny "${K}RUN\n"
case_run tampered   ok   "${K}RUN\n" 'echo "// x" >> docs/completion-4.1/c3-eval/prices.json'
case_run old-hasil  ok   "${K}RUN\n" 'mkdir hasil'
R="$S/reh-happy"; echo "--- happy path ringkasan:" >> "$OUT"; cat "$R/pintar-e-local/hasil/untuk-bob/ringkasan.txt" >> "$OUT"
echo "--- happy path: provider or model names in the Sharon and judge files:" >> "$OUT"
grep -rliE "anthropic|openai|claude|gpt|sonnet" "$R/pintar-e-local/hasil/untuk-sharon" "$R/pintar-e-local/hasil/untuk-juri" >> "$OUT" || echo "none" >> "$OUT"
echo "--- happy path: what each mock received (auth shown is the rehearsal dummy):" >> "$OUT"; cat "$R/seenA.json" "$R/seenO.json" >> "$OUT"; echo >> "$OUT"
echo "--- happy path: the bash version used: $BASH_VERSION" >> "$OUT"
