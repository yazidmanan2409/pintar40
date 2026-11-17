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

1. Save `pintar-e-local.tar.gz` in your **Downloads** folder.
2. In Terminal, type:
   ```
   cd ~/Downloads
   shasum -a 256 pintar-e-local.tar.gz
   ```
3. The long code it prints must be **exactly** the one Bob gave you. If it differs, stop and tell Bob.

## 3 · Unpack it

```
tar -xzf pintar-e-local.tar.gz
cd pintar-e-local
```

## 4 · Start the script

```
bash jalankan-e.sh
```

- **Step A** runs by itself, for about a minute. It checks Node, the package and the frozen material, runs every
  self-test, and does an offline practice run. Nothing is sent anywhere.
- **Step B** asks for each key in turn: first **Anthropic**, then **OpenAI**. Copy the key from where you saved it,
  click in Terminal, paste with Command-V and press Return. **Nothing shows as you paste; that is intended.**
- **Step C** checks both keys at no cost. You should see two lines ending in **`CONFIRMED`**.
  If not, the script stops, and nothing is spent. Tell Bob what it printed.

## 5 · The paid run: type `RUN`

The script shows the limits again and asks you to type **`RUN`**.
- Type `RUN` in capital letters and press Return. That is your authorisation for the paid calls.
- Anything else stops the script without spending.

The run takes a few minutes. Leave the Mac awake and the window open. When it finishes, the script:
- clears both keys from its memory;
- blinds the questions;
- prints a short summary of costs and times.

**After pasting, copy any ordinary text** (a word, say) so that the key no longer sits in your clipboard.

## 6 · What to send, and what to keep

Everything is in the folder `~/Downloads/pintar-e-local/hasil`:

| File or folder | What to do |
|---|---|
| `untuk-bob.zip` | **Send to Bob** (attach it in his session). It holds costs, times and the sealed map's fingerprint. It has no questions and no key |
| `untuk-sharon.zip` | **Send to Bob as well.** He passes it to Sharon. It holds the questions and options only, and names no provider |
| `untuk-juri.zip` | **Keep for now.** Bob sends you the judges' scoring guide. Then give both to the three judges |
| `PRIVAT-simpan-jangan-dikirim` | **Keep it safe, and send it to no one.** It holds the raw answers and the map of which provider wrote which question. Bob asks for it only after every score is final |

## 7 · Revoke both keys

- **Anthropic Console:** your evaluation workspace → API keys → delete the temporary key.
- **OpenAI:** your evaluation project → API keys → revoke the temporary key.

Then tell Bob: "keys revoked".

## If the script stops

- It always says why on a line starting **`STOPPED`**, and nothing after that line runs.
- If it stopped **before** step 5, nothing was spent. Delete the `hasil` folder (or rename it) and run step 4 again.
- If it stopped **during or after** step 5, do not run it again. Send Bob the file
  `hasil/PRIVAT-simpan-jangan-dikirim/run-log.txt`. It holds no key.
