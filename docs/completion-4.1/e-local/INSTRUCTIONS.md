# PINTAR E · running the evaluation on your Mac

About 15 minutes. You need your two evaluation keys, and nothing else.

**Typing `RUN` at step 5 is the only thing that makes paid calls.** Everything before it is free. You can stop at any
point by closing the Terminal window or pressing Control-C.

## 1 · Install Node.js (once)

1. Go to **nodejs.org** → Download → **macOS Installer (.pkg)**, version **22 LTS or newer**, for **Apple Silicon (ARM64)**.
2. Open the downloaded file and follow the installer.
3. Open **Terminal** (Applications › Utilities › Terminal), type `node --version` and press Return.
   It must show `v22` or higher.

## 2 · Check the package

1. Save `pintar-e-local.tar.gz` in your **Downloads** folder. Use this fresh copy only: do not add other files to
   the folder it unpacks into.
2. In Terminal, type:
   ```
   cd ~/Downloads
   shasum -a 256 pintar-e-local.tar.gz
   ```
3. The long code it prints must be **exactly** the one in Bob's **separate message** (not the one beside the file).
   If it differs, stop and tell Bob.

## 3 · Unpack it

```
tar -xzf pintar-e-local.tar.gz
cd pintar-e-local
```

## 4 · Start the script

Close any programs you don't need. Then:

```
zsh jalankan-e.sh
```

- **Step A** runs by itself, for about a minute. It checks Node, the package and the frozen material, runs every
  self-test, and does an offline practice run. Nothing is sent anywhere.
- **Step B** asks for each key in turn: first **Anthropic**, then **OpenAI**. Copy the key from where you saved it,
  click in Terminal, paste with Command-V and press Return. **Nothing shows as you paste; that is intended.**
  The script clears your clipboard after the second key.
- **Step C** checks both keys at no cost. You should see two lines ending in **`CONFIRMED`**.
  If not, the script stops, and nothing is spent. Tell Bob what it printed.

## 5 · The paid run: type `RUN`

The script shows the limits again and asks you to type **`RUN`**.
- Type `RUN` in capital letters and press Return. That is your authorisation for the paid calls.
- Anything else stops the script without spending.

The run takes a few minutes. Leave the Mac awake and the window open. When it finishes, the script:
- blinds the questions;
- checks every result file for the exact text of both keys, and stops if it finds either one;
- clears both keys from its memory;
- prints a short summary of costs and times.

## 6 · What to send, and what to keep

Everything is in the folder `~/Downloads/pintar-e-local/hasil`:

| File or folder | What to do |
|---|---|
| `untuk-bob.zip` | **1st. Send to Bob** (attach it in his session). It holds costs, times and the sealed map's fingerprint. It has no questions and no key. Bob records the fingerprint |
| `untuk-sharon.zip` | **2nd. Send to Bob when he says the fingerprint is recorded.** He passes it to Sharon. It holds the questions and options only, and names no provider |
| `untuk-juri.zip` | **3rd. Keep it until Bob says Sharon's check is recorded** and sends you the judges' scoring guide. Then give both to the three judges |
| `PRIVAT-simpan-jangan-dikirim` | **Keep it safe, and send it to no one.** It holds the raw answers and the map of which provider wrote which question. Bob asks for it only after every score is final |

## 7 · Revoke both keys

- **Anthropic Console:** your evaluation workspace → API keys → delete the temporary key.
- **OpenAI:** your evaluation project → API keys → revoke the temporary key.

**Do this straight after step 5.** Then close the Terminal window, and tell Bob "keys revoked" with the time you
did it.

## One accepted risk

While the run is going, another program running under your account could read the keys from the runner's memory.
That is why you close programs you don't need before step 4. The run takes only minutes, and the keys are revoked
straight after.

## If the script stops

- It always says why on a line starting **`STOPPED`**, and nothing after that line runs.
- If it stopped **before** step 5, nothing was spent. Delete the `hasil` folder (or rename it) and run step 4 again.
- If it stopped **during or after** step 5, do not run it again. Send Bob the file
  `hasil/PRIVAT-simpan-jangan-dikirim/run-log.txt`. It holds no key.
- The script was rehearsed with Linux tools, not the Mac's own. If a step **after** the run fails because of that
  (the blinding, the zip or the scan), your results are safe in the PRIVAT folder, the keys are already cleared, and
  nothing has been sent. Bob recovers it with you by hand, with no security impact. Every step before the key prompt
  runs on your Mac, and stops safely before any spend.
