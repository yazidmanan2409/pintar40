#!/bin/bash
# Bob's offline rehearsal of the v4 jalankan-e.sh (OpenAI, streamed; then both providers blinded together), run under zsh (the macOS default) and,
# for the happy path, bash too. The happy path, then ten stop paths. A process-list sampler runs throughout (Sharon R1).
# Never contacts a provider: the key check goes to local mocks, and the run is the offline dry run, whose Anthropic
# calls go through the real streaming adapter and parser with a local stream in fetch's place.
S="$1"; TGZ="$S/pkg4/pintar-e-local-v4.tar.gz"; H="$(cd "$(dirname "$0")" && pwd)"; OUT="$S/rehearsal-results.txt"; : > "$OUT"
case_run() { # name, shell, mock behaviour, input, extra-setup
  local name="$1" sh="$2" beh="$3" input="$4" setup="${5:-}"; local R="$S/reh4-$name"; rm -rf "$R"; mkdir -p "$R"; ( cd "$R" && tar -xzf "$TGZ" )
  # the void run 1 next to the package, as on the owner's Mac (a synthetic ledger with the recorded fields), unless removed
  mkdir -p "$R/pintar-e-local/hasil/PRIVAT-simpan-jangan-dikirim/runs"
  printf '%s' '{"version":1,"caps_usd":{"per_provider":5,"total":10},"runs":[],"entries":[{"provider":"anthropic","chapter":1,"attempt":1,"status":"overrun","cost_usd":"0.129986"}]}' \
    > "$R/pintar-e-local/hasil/PRIVAT-simpan-jangan-dikirim/runs/ledger.json"
  # Anthropic's run 2 next to the package: two sealed answer files (a marker no output may ever contain) and a ledger
  # with the recorded request ids and costs and the files' real SHA-256
  local V="$R/pintar-e-local-v3/hasil/PRIVAT-simpan-jangan-dikirim/runs"; mkdir -p "$V/anthropic"
  printf '%s' '{"items":"FIXTURE-SEALED-ANTHROPIC bab 1"}' > "$V/anthropic/bab1.json"
  printf '%s' '{"items":"FIXTURE-SEALED-ANTHROPIC bab 2"}' > "$V/anthropic/bab2.json"
  node -e 'const c=require("node:crypto"),f=require("node:fs"),d=process.argv[1],h=(b)=>c.createHash("sha256").update(f.readFileSync(d+"/anthropic/bab"+b+".json")).digest("hex");
    f.writeFileSync(d+"/ledger.json", JSON.stringify({version:1,caps_usd:{per_provider:4.87,total:9.87},runs:[],entries:[
      {provider:"anthropic",chapter:1,attempt:1,status:"ok",request_id:"req_011Ch9PeLYw4LJjgUQn5GrUo",cost_usd:"0.193536",response_sha256:h(1)},
      {provider:"anthropic",chapter:2,attempt:1,status:"ok",request_id:"req_011Ch9PoBLnrwRi6dP8NjrJN",cost_usd:"0.158732",response_sha256:h(2)}]}))' "$V"
  [ -n "$setup" ] && ( cd "$R/pintar-e-local-v4" && eval "$setup" )
  node "$H/mock-api.mjs" 47111 "$R/seenA.json" "$beh" & local PA=$!   # must receive nothing in v4
  node "$H/mock-api.mjs" 47112 "$R/seenO.json" "$beh" & local PO=$!
  ( while :; do ps -eo args; sleep 0.05; done ) > "$R/ps-samples.txt" 2>/dev/null & local PS=$!
  sleep 1
  printf "$input" | E_REHEARSE_ANTHROPIC_BASE=http://127.0.0.1:47111 E_REHEARSE_OPENAI_BASE=http://127.0.0.1:47112 \
    $sh "$R/pintar-e-local-v4/jalankan-e.sh" ${FLAG:---rehearse} > "$R/out.txt" 2>&1; local rc=$?
  [ -n "${AFTER:-}" ] && ( cd "$R/pintar-e-local-v4" && eval "$AFTER" ) > "$R/out-after.txt" 2>&1
  kill $PA $PO $PS 2>/dev/null; wait $PA $PO $PS 2>/dev/null
  local HD="$R/pintar-e-local-v4/${HDIR:-hasil}"
  local runs=no; [ -d "$HD/PRIVAT-simpan-jangan-dikirim/runs" ] && runs=yes
  local leak=none; grep -rlq "REHEARSALKEY" "$HD" "$R/out.txt" 2>/dev/null && leak=FOUND
  local psleak=none; grep -q "REHEARSALKEY" "$R/ps-samples.txt" && psleak=FOUND
  local think=none; grep -rlq "THINKING-CANARY" "$HD" "$R/out.txt" 2>/dev/null && think=FOUND
  local sealed=none; grep -rlq "FIXTURE-SEALED-ANTHROPIC" "$HD" "$R/out.txt" 2>/dev/null && sealed=FOUND
  local ant=none; [ -s "$R/seenA.json" ] && ant=CONTACTED
  local n=$(grep -c '^' "$R/ps-samples.txt")
  echo "$name ($sh): exit=$rc runs_dir=$runs key_in_outputs=$leak key_in_process_list=$psleak ($n ps lines) thinking_in_outputs=$think sealed_anthropic_in_outputs=$sealed anthropic_mock=$ant harness_openai_mock=$([ -s "$R/seenO.json" ] && echo contacted || echo none) | $(grep -E 'STOPPED|== Done' "$R/out.txt" | head -1)$([ -f "$R/out-after.txt" ] && echo " | then the real procedure: $(grep -E 'STOPPED|== Done' "$R/out-after.txt" | head -1)")" | tee -a "$OUT"
}
K='sk-proj-REHEARSALKEYOOO\n'
case_run happy        zsh  ok   "${K}RUN\n"
case_run happy-bash   bash ok   "${K}RUN\n"
case_run no-go        zsh  ok   "${K}run\n"
case_run anthropic-key zsh ok   'sk-ant-REHEARSALKEYAAA\nRUN\n'
case_run empty        zsh  ok   '\nRUN\n'
case_run key-denied   zsh  deny "${K}RUN\n"
case_run tampered     zsh  ok   "${K}RUN\n" 'echo "// x" >> docs/completion-4.1/c3-eval/prices.json'
case_run old-hasil    zsh  ok   "${K}RUN\n" 'mkdir hasil'
case_run dotenv       zsh  ok   "${K}RUN\n" 'touch .env'
case_run void-missing zsh  ok   "${K}RUN\n" 'rm -r ../pintar-e-local'
case_run void-altered zsh  ok   "${K}RUN\n" 'sed -i "s/0.129986/0.000000/" ../pintar-e-local/hasil/PRIVAT-simpan-jangan-dikirim/runs/ledger.json'
case_run v3-missing   zsh  ok   "${K}RUN\n" 'rm -r ../pintar-e-local-v3'
case_run v3-altered   zsh  ok   "${K}RUN\n" 'printf x >> ../pintar-e-local-v3/hasil/PRIVAT-simpan-jangan-dikirim/runs/anthropic/bab1.json'
# The owner's practice run on the Mac (--latihan): its own local stand-in, the dummy key, results in hasil-latihan.
FLAG=--latihan HDIR=hasil-latihan case_run latihan          zsh ok 'sk-proj-latihan\nRUN\n'
FLAG=--latihan HDIR=hasil-latihan case_run latihan-realkey  zsh ok "${K}RUN\n"
# after a practice run, the real procedure still starts in the same folder (here in rehearse mode) and writes to hasil
FLAG=--latihan HDIR=hasil AFTER="printf '${K}RUN\\n' | E_REHEARSE_OPENAI_BASE=http://127.0.0.1:47112 zsh jalankan-e.sh --rehearse" case_run latihan-then-real zsh ok 'sk-proj-latihan\nRUN\n'
# Sharon P-2: the real procedure (no flag) refuses to start beside a practice run or with stray settings. Each case
# stops before Step A, so no key prompt and no network is reached.
FLAG=' ' case_run live-beside-mock zsh ok '\nRUN\n' 'node latihan-mock.mjs /dev/null & echo $! > ../../mock.pid; sleep 0.5'
kill "$(cat "$S/mock.pid")" 2>/dev/null; sleep 0.5
E_REHEARSE=1 FLAG=' ' case_run live-stray-vars zsh ok '\nRUN\n'
# R2, without contacting a provider: run the script's own live-mode unset line, with stray rehearsal variables set.
L="$(grep -E '^if \[ "\$MODE" = live \]; then unset E_REHEARSE' "$H/../jalankan-e.sh")"
left="$(E_REHEARSE=1 E_REHEARSE_ANTHROPIC_BASE=x E_REHEARSE_OPENAI_BASE=y zsh -c "MODE=live; $L; env | grep -c '^E_REHEARSE' || true")"
echo "stray-rehearsal-vars (zsh): variables left after the live-mode unset = $left (expect 0)" | tee -a "$OUT"
R="$S/reh4-happy"; P="$R/pintar-e-local-v4/hasil"
echo "--- happy path (zsh) ringkasan:" >> "$OUT"; cat "$P/untuk-bob/ringkasan.txt" >> "$OUT"
echo "--- happy path: files in hasil (untuk-bob must hold only asal-jawaban.txt, ledger.json, ringkasan.txt, summary.json; untuk-sharon and untuk-juri only the kit's blinded files):" >> "$OUT"
( cd "$P" && find . -type f | LC_ALL=C sort | grep -v '/latihan/material-before/' ) >> "$OUT"
echo "--- happy path: every OpenAI attempt that reached the transport streamed (ledger stream evidence), and reasoning was counted, not kept:" >> "$OUT"
node -e 'const l=require(process.argv[1]); for (const e of l.entries) console.log(`${e.provider} bab${e.chapter} a${e.attempt}: ${e.status}, max_output ${e.max_output_tokens}, reserved ${e.reserved_usd}, cost ${e.cost_usd} (${e.cost_basis}), stream ${e.stream ? `events ${e.stream.events}, bytes ${e.stream.bytes}, thinking blocks ${e.stream.thinking_blocks}, stop ${e.stream.stop_reason}` : "none (HTTP error before the stream)"}`)' "$P/PRIVAT-simpan-jangan-dikirim/runs/ledger.json" >> "$OUT"
echo "--- happy path: what each mock received (the auth shown is the rehearsal dummy; the Anthropic mock must be empty):" >> "$OUT"
cat "$R/seenO.json" >> "$OUT"; echo >> "$OUT"; if [ -s "$R/seenA.json" ]; then cat "$R/seenA.json" >> "$OUT"; else echo "anthropic mock: nothing received" >> "$OUT"; fi
echo "--- happy path: which attempt produced each accepted chapter (Ruling 52, both providers):" >> "$OUT"; cat "$P/untuk-bob/asal-jawaban.txt" >> "$OUT"
echo "--- happy path: what was copied for blinding from Anthropic (Sharon R-2: bab1.json and bab2.json only):" >> "$OUT"
ls "$P/PRIVAT-simpan-jangan-dikirim/gabungan/anthropic" | tr '\n' ' ' >> "$OUT"; echo >> "$OUT"
echo "--- happy path: the blinded set (both providers, 60 items expected) and its provider codes:" >> "$OUT"
node -e 'const m=require(process.argv[1]); console.log(Object.keys(m.items).length + " items; providers " + Object.entries(m.providers).map(([k,v])=>k+"="+v.folder).sort().join(", "))' "$P/PRIVAT-simpan-jangan-dikirim/out/SEALED/map.json" >> "$OUT"
echo "--- shells: $(zsh --version); bash $BASH_VERSION" >> "$OUT"
# Controls: prove the detectors would catch a leak.
# (1) The process-list sampler sees a key that sits in a live process's argv (the risk Sharon R1 names).
node -e 'setTimeout(() => {}, 2000)' sk-ant-REHEARSALKEYCONTROL & CP=$!; sleep 0.5
c1=none; ps -eo args | grep -q '^node -e .*REHEARSALKEYCONTROL' && c1=CAUGHT; wait $CP
echo "control-R1: a key in a live process's argv is visible in the process list = $c1 (expect CAUGHT)" | tee -a "$OUT"
# (2) The exact-value scan, as the script runs it, finds a planted key (Sharon R3).
C="$S/control-r3"; rm -rf "$C"; mkdir -p "$C/hasil/untuk-bob"; echo "x sk-ant-REHEARSALKEYAAA y" > "$C/hasil/untuk-bob/x.txt"
echo "x sk-proj-REHEARSALKEYOOO y" >> "$C/hasil/untuk-bob/x.txt"
c2="$(zsh -c 'K_OPENAI=sk-proj-REHEARSALKEYOOO; grep -rqF -f <(printf "%s\n" "$K_OPENAI") "$1"; echo $?' _ "$C/hasil")"
echo "control-R3: the exact-value scan on a planted key returns $c2 (expect 0, which stops the script)" | tee -a "$OUT"
# (3) The thinking detector finds the canary when it is present (S-2): the runner's own mock puts it in every stream.
c3=none; grep -q "THINKING-CANARY" "$R/pintar-e-local-v4/docs/completion-4.1/c3-eval/runner.mjs" && c3=CAUGHT
echo "control-S2: the canary the mock streams as thinking is findable by the same grep = $c3 (expect CAUGHT)" | tee -a "$OUT"
