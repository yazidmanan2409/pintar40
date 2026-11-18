# PINTAR E · running the evaluation on your Mac, version 4 (OpenAI, then both blinded together)

About 20–40 minutes, most of it waiting. You need **one new** temporary **OpenAI** key. **Do not create an Anthropic key.**
Anthropic's part is done: its questions are sealed in `~/Downloads/pintar-e-local-v3`.

**Do not run the paid run until Bob says Sharon has passed version 4 and you have authorised it.**
The practice run below is free and needs no key.

**What is different from version 3:**
- **OpenAI only.** The script asks for one key and calls one provider, with the same frozen rules, the same 48,000-token
  limit and the default reasoning setting, as Ruling 50 requires.
- **The limits:**
  - US$5.00 for OpenAI, which is your balance, with auto-reload off;
  - US$9.51 for the evaluation in total, which is US$10 less the US$0.48 Anthropic has cost.
- **Both earlier folders must stay where they are, unchanged:**
  - `~/Downloads/pintar-e-local`, the first run;
  - `~/Downloads/pintar-e-local-v3`, Anthropic's sealed questions.

  The script checks both, by their fingerprints, and refuses to start without them.
- **After the run, the script blinds both providers' questions together** (Ruling 51). This is the first time anyone can
  see a question, and no one can tell which provider wrote it.

**Typing `RUN` at step 5 is the only thing that makes paid calls.** Everything before it is free. You can stop at any
point by closing the Terminal window or pressing Control-C.

## Before anything else: the free practice run on your Mac (no key, no cost)

This runs the whole procedure on your Mac with its own tools, using a dummy key and a local stand-in. **It uses mock
questions for both providers**, and it never reads Anthropic's real sealed questions; it only checks their fingerprints.

1. Do steps 1 to 3 below. **Skip step 0: you need no key for this.**
2. In Terminal, inside `pintar-e-local-v4`, type:
   ```
   zsh jalankan-e.sh --latihan
   ```
3. At the key prompt, type exactly `sk-proj-latihan` and press Return. **Never paste a real key here;** the practice
   run refuses anything else.
4. At the RUN prompt, type `RUN`. The run is the offline practice one: no provider is called.
5. Send Bob **only** `hasil-latihan/untuk-bob.zip`. Leave the `hasil-latihan` folder where it is. The real run writes
   to `hasil`, in the same folder.
6. If anything stops, send Bob what the screen shows. Nothing was spent and no key was involved.

## 0 · Make one new temporary key

**OpenAI:** in the same evaluation project, create a new temporary key with the same permissions as before: List models
Read, Responses Write, nothing else. Keep auto-reload off. Save the key where you saved the earlier ones.

## 1 · Node.js (done already)

In **Terminal**, type `node --version` and press Return. It must show `v22` or higher.

## 2 · Check the package

1. Save `pintar-e-local-v4.tar.gz` in your **Downloads** folder, next to `pintar-e-local` and `pintar-e-local-v3`.
   Use this fresh copy only. Do not add other files to the folder it unpacks into.
2. In Terminal, type:
   ```
   cd ~/Downloads
   shasum -a 256 pintar-e-local-v4.tar.gz
   ```
3. The long code it prints must be **exactly** the one in Bob's **separate message**, not the one beside the file.
   If it differs, stop and tell Bob.

## 3 · Unpack it

```
tar -xzf pintar-e-local-v4.tar.gz
cd pintar-e-local-v4
```

## 4 · Start the script

Close any programs you don't need. Then:

```
zsh jalankan-e.sh
```

- **Step A** runs by itself, for about a minute. Nothing is sent anywhere. It:
  - checks Node, the package, both earlier folders and the frozen material;
  - runs every self-test;
  - does an offline practice run.
- **Step B** asks for the **OpenAI** key.
  - Copy it from where you saved it, click in Terminal, paste with Command-V and press Return.
  - **Nothing shows as you paste; that is intended.**
  - The script then clears your clipboard.
- **Step C** checks the key at no cost. You should see one line ending in **`CONFIRMED`**.
  If not, the script stops and nothing is spent. Tell Bob what it printed.

## 5 · The paid run: type `RUN`

The script shows the limits again and asks you to type **`RUN`**.
- Type `RUN` in capital letters and press Return. That is your authorisation for the paid calls.
- Anything else stops the script without spending.

The run can take up to about 40 minutes. Plug the Mac in, leave it awake, and leave the window open. When it finishes,
the script:
- blinds both providers' questions together;
- checks every result file for the exact text of the key, and stops if it finds it;
- clears the key from its memory;
- prints a short summary of costs and times.

## 6 · What to send, and what to keep

Everything is in the folder `~/Downloads/pintar-e-local-v4/hasil`:

| File or folder | What to do |
|---|---|
| `untuk-bob.zip` | **1st. Send to Bob.** It holds OpenAI's costs, times and statuses, and the sealed map's fingerprint. It holds no questions and no key. Bob records the fingerprint |
| `untuk-sharon.zip` | **2nd. Send to Bob when he says the fingerprint is recorded.** He passes it to Sharon for the key check. It holds the questions and options only, and names no provider |
| `untuk-juri.zip` | **3rd. Keep it until Bob says Sharon's check is recorded** and sends you the judges' guide. Then give both to the three judges |
| `PRIVAT-simpan-jangan-dikirim` | **Keep it safe, and send it to no one.** It holds both providers' raw answers and the map of which provider wrote which question. Bob asks for it only after every score is final |

Keep `~/Downloads/pintar-e-local` and `~/Downloads/pintar-e-local-v3` as they are, too.

## 7 · Revoke the key

**OpenAI:** your evaluation project → API keys → revoke the temporary key.

**Do this straight after step 5.** Then close the Terminal window, and tell Bob "key revoked" with the time you did it.

## One accepted risk

While the run is going, another program running under your account could read the key from the runner's memory.
That is why you close programs you don't need before step 4. The key is revoked straight after the run.

## If the script stops

- It always says why on a line starting **`STOPPED`**, and nothing after that line runs.
- **If it stopped before step 5,** nothing was spent:
  - rename the `hasil` folder **inside `pintar-e-local-v4`**;
  - never touch `pintar-e-local` or `pintar-e-local-v3`;
  - run step 4 again.
- **If it stopped during or after step 5,** do not run it again. Send Bob the file
  `hasil/PRIVAT-simpan-jangan-dikirim/run-log.txt`. It holds no key.
- If a step **after** the run fails (the blinding, the zip or the scan), your results are safe in the PRIVAT folder, the
  key is already cleared, and nothing has been sent. Bob recovers it with you by hand, with no security impact.
