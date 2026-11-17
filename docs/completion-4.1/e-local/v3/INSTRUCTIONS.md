# PINTAR E · running the evaluation on your Mac, version 3 (Anthropic only)

About 20–40 minutes, most of it waiting. You need **one new** temporary Anthropic key, because the earlier keys are revoked.
**Do not create an OpenAI key.** OpenAI comes later (Ruling 50).

**Do not run this until Bob says Sharon has passed version 3 and you have authorised the run.**

**What is different from version 2:**
- **Anthropic only.** The script asks for one key and calls one provider.
- **Every answer is streamed.** Anthropic advises streaming for long answers. A stream that breaks off is never used
  as an answer. Its full reservation is counted as spent, and the call is retried within the same limits.
- **No blinding yet.** The frozen kit blinds both providers' questions together. So Anthropic's questions stay sealed
  in the PRIVAT folder, unread, until OpenAI's run. You send Bob only the costs and times.
- **Unchanged from version 2:**
  - each answer may be up to 48,000 tokens long;
  - the limit is US$4.87 for Anthropic (US$5 less the US$0.13 of run 1);
  - **keep the first folder, `~/Downloads/pintar-e-local`, exactly where it is.** The script checks it is there and
    refuses to start without it.

**Typing `RUN` at step 5 is the only thing that makes paid calls.** Everything before it is free. You can stop at any
point by closing the Terminal window or pressing Control-C.

## 0 · Make one new temporary key

**Anthropic Console:** in the same evaluation workspace, keep the workspace limit at US$5 and create a new temporary key.
Save it where you saved the earlier ones.

## 1 · Node.js (done already)

In **Terminal**, type `node --version` and press Return. It must show `v22` or higher.

## 2 · Check the package

1. Save `pintar-e-local-v3.tar.gz` in your **Downloads** folder, next to the first `pintar-e-local` folder.
   Use this fresh copy only. Do not add other files to the folder it unpacks into.
2. In Terminal, type:
   ```
   cd ~/Downloads
   shasum -a 256 pintar-e-local-v3.tar.gz
   ```
3. The long code it prints must be **exactly** the one in Bob's **separate message**, not the one beside the file.
   If it differs, stop and tell Bob.

## 3 · Unpack it

```
tar -xzf pintar-e-local-v3.tar.gz
cd pintar-e-local-v3
```

## 4 · Start the script

Close any programs you don't need. Then:

```
zsh jalankan-e.sh
```

- **Step A** runs by itself, for about a minute. Nothing is sent anywhere. It:
  - checks Node, the package, the first folder and the frozen material;
  - runs every self-test;
  - does an offline practice run.
- **Step B** asks for the **Anthropic** key.
  - Copy it from where you saved it, click in Terminal, paste with Command-V and press Return.
  - **Nothing shows as you paste; that is intended.**
  - The script then clears your clipboard.
- **Step C** checks the key at no cost. You should see one line ending in **`CONFIRMED`**.
  If not, the script stops and nothing is spent. Tell Bob what it printed.

## 5 · The paid run: type `RUN`

The script shows the limits again and asks you to type **`RUN`**.
- Type `RUN` in capital letters and press Return. That is your authorisation for the paid calls.
- Anything else stops the script without spending.

The run can take up to about 40 minutes, because each answer can take several minutes. Plug the Mac in, leave it
awake, and leave the window open. When it finishes, the script:
- checks every result file for the exact text of the key, and stops if it finds it;
- clears the key from its memory;
- prints a short summary of costs and times.

## 6 · What to send, and what to keep

Everything is in the folder `~/Downloads/pintar-e-local-v3/hasil`:

| File or folder | What to do |
|---|---|
| `untuk-bob.zip` | **Send to Bob** (attach it in his session). It holds the costs, token counts, times and the status of each call. It holds no questions and no key |
| `PRIVAT-simpan-jangan-dikirim` | **Keep it safe, and send it to no one.** It holds Anthropic's raw answers. They are blinded later, together with OpenAI's, before anyone reads them |

## 7 · Revoke the key

**Anthropic Console:** your evaluation workspace → API keys → delete the temporary key.

**Do this straight after step 5.** Then close the Terminal window, and tell Bob "key revoked" with the time you did it.

## One accepted risk

While the run is going, another program running under your account could read the key from the runner's memory.
That is why you close programs you don't need before step 4. The key is revoked straight after the run.

## If the script stops

- It always says why on a line starting **`STOPPED`**, and nothing after that line runs.
- **If it stopped before step 5,** nothing was spent:
  - rename the `hasil` folder **inside `pintar-e-local-v3`**;
  - never touch the first `pintar-e-local` folder;
  - run step 4 again.
- **If it stopped during or after step 5,** do not run it again. Send Bob the file
  `hasil/PRIVAT-simpan-jangan-dikirim/run-log.txt`. It holds no key.
- The script was rehearsed with Linux tools, not the Mac's own. If a step **after** the run fails because of that
  (the zip or the scan), your results are safe in the PRIVAT folder, the key is already cleared, and nothing has been
  sent. Bob recovers it with you by hand, with no security impact.
