# Interaction, feedback and motion

## One grammar for every act

**Receive → acknowledge → explain the status → give the next step.**

When an act takes time: **click → acknowledged → processing → completed or failed → next action.**

| Stage | What the person sees | Rule |
|---|---|---|
| Click | The pressed ground for an instant. | Every control has a pressed state. |
| Acknowledged | At once (under 100 ms): the button keeps its colour, shows the working dot and its progressive word («Menyimpan…»), and cannot be pressed again. | A click is never met with nothing. One click saves once (TombolKirim). |
| Processing | The status line beside the action says what is happening. Over 3 seconds, it says why: «Jaringan sedang lambat. PINTAR masih bekerja; Anda tidak perlu menekan lagi.» | Never fake progress: no bar that moves by itself, no percentage PINTAR does not know. |
| Completed | Only after the server confirms: the button shows ✓ and its result word («Tersimpan»), and the result line says what changed for whom. | Never claim success before authoritative confirmation. A no-op is not a success. |
| Did not complete | The button returns to its verb; an error line (`role="alert"`) says what did not happen, why if known, what to do, and that the person's input is still there. | Nothing typed is ever lost to a failure. |
| Next action | The result line offers the next step («Lihat siapa yang sudah mulai»). | Every terminal state has a way forward. |

**Words.** The verb, its progressive, its result:

| Act | Rest | Working | Done |
|---|---|---|---|
| Save | Simpan | Menyimpan… | ✓ Tersimpan |
| Send | Kirim | Mengirim… | ✓ Terkirim |
| Publish | Terbitkan | Menerbitkan… | ✓ Diterbitkan (question 2, 5 Oct: the result names what happened) |
| Check | Periksa | Memeriksa… | the result itself |

A completed button returns to its verb as soon as there is something new to do (the form changes).

**Email never ends in ✓.** PINTAR cannot confirm that an email arrived (D-098(c)). An email action returns to its verb, and its line says PINTAR is sending: «Jika alamat ini terdaftar, PINTAR sedang mengirim kode baru.» (aktifkan.kode_ulang_ok). EMAILJUJUR-L01 enforces it for the code emails. Two of today's lines still claim a send and should follow it in the application pass: akun.terkirim («Kartu sudah dikirim ke email Anda.») and aktifkan.w_kartu_terkirim («Kartu PINTAR Anda juga sudah dikirim ke email Anda.»).

**Built on what exists.** TombolKirim (busy, disabled while pending, its own «…» word, one submit), BarisHasil (the result at the action, `role="status"`), MemuatHalaman (the loading shell) and TandaTautan (the working mark on a navigation link). The proposal restyles them and adds the ✓ result state and the 3-second explanation; it invents no second mechanism.

**Timing objectives (D-047(b)).** Acknowledgement under 100 ms; ordinary navigation about 0.5 to 1 s; a save under 1 s; a heavy page shows useful content within 1 to 2 s; anything over 3 s is exceptional and is explained.

## States

| State | Look | Rule |
|---|---|---|
| Default | As designed. | |
| Hover | One step of ground (`surface-2`) or of ink. | Never the only sign that something is interactive: touch has no hover. |
| Pressed | One more step (`surface-3`; `pintar-primary-pressed`). | |
| Focus | The 2 px `focus-ring`, 2 px offset, on every focusable thing. | Never removed, never recoloured. |
| Selected | `pintar-primary-soft`, or the 2 px tab underline, with weight 600. | |
| Processing | The control's own colour, the working dot, the progressive word, `aria-busy`. | |
| Completed | `status-ok-soft` ground, ✓, the result word. | |
| Disabled | `surface-2` and `ink-disabled`, no border. | Rare. Its reason is written beside it. Prefer leaving a control enabled and explaining on use. A place a person may not use is absent, not disabled. |
| Error | The field's `status-blocked` edge and its message. | |

## Validation

- Check on submit, not on every keystroke. A fixed field clears its own message as the person types.
- Each invalid field says what is wrong under itself, in words that say how to fix it.
- A form of more than three fields also gets the error summary at its top: it takes focus, and each line links to its field.
- Mark the optional fields «(opsional)»; required is the default and carries no asterisk.
- Never clear what the person typed.

## Loading and empty

- **Loading** is the page's own shape in `surface-2` blocks, with one sentence («Memuat halaman…»). No spinner and no sweeping shimmer.
- **Empty** has three different sentences: "not yet" (a beginning, with the first action), "not enough yet" (how much there is and how much is needed), "nothing matches" (a way back). If nothing needs attention, the section is absent rather than an empty box.

## Results and alerts

- A result is said **at the action** that caused it (`role="status"`; `role="alert"` for a failure). PINTAR has no toasts: a message far from its cause is easy to miss and hard to find again.
- A state of a whole section is an **alert at the top of that section**. It is dismissible only if nothing is lost by dismissing it.

## Motion

**The approved vocabulary (question 8, 5 Oct).** Restrained, and only where it acknowledges, guides attention, explains continuity or confirms completion; if it does none of these, it does not belong. Under `prefers-reduced-motion`, every nonessential motion is removed.

| Token | ms | Status |
|---|---|---|
| `duration-fast` | 120 | Approved. Hover and press colour, a checkbox's tick. |
| `duration-base` | 160 | Kept (v2 `motion-fast`). An ordinary colour or opacity change: a state change (a tab, a segment, a switch), a result line appearing, a disclosure's chevron turning. |
| `duration-slow` | 240 | Approved. A floating layer entering: a dialog, a drawer, a menu. |
| `duration-pulse` | 900 | Kept (today's `pin-denyut` pulse), now named. The working dot only. |

- **What never moves:** nothing spins, bounces, slides, counts up or celebrates. A progress bar's width is a committed count and never animates.
- **Travel, 8 px at most:** a dialog rises 8 px as it enters; a drawer slides 8 px from its side; a menu moves 4 px away from its button. Nothing travels further.
- **A disclosure's chevron turns** (180°, at `duration-base`).
- **Never in the way:** no animation delays the next action.
