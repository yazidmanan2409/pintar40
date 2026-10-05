PINTAR's one grammar for any act that takes time: click, acknowledged at once, processing, then completed or failed, then the next step.

**Status: KEPT and extended.** It is D-047's one pattern, built from TombolKirim (busy, disabled, its own «…» word), BarisHasil (the result at the action, `role="status"`) and TandaTautan. New: the ✓ result word on the button, and the line that explains a wait over 3 seconds.

**Markup.** On the action: `data-aksi`, `data-sibuk` (the progressive, «Menyimpan…»), `data-selesai` (the result word, «Tersimpan»), `data-status` (the status line beside it), `data-hasil` (the result line) with `data-hasil-teks`, and optionally `data-lanjut` (the next step). The product equivalent is TombolKirim plus BarisHasil.

**The sequence**
1. Click: pressed ground.
2. Acknowledged in under 100 ms: the button keeps its colour, shows the working dot and «Menyimpan…», `aria-busy`, and cannot be pressed again.
3. Processing: the status line repeats the word; after 3 s it explains the wait and says a second press is not needed.
4. Completed, only when the server confirms: ✓ «Tersimpan», and the result line says what changed for whom, with the next step.
5. Did not complete: the button returns to its verb; the result line (`role="alert"`) says what did not happen and what to do, and that the input is still there.

**Rules**
- Never claim success before the server confirms it. A no-op is not a success.
- Never fake progress: a sentence and the working dot, never a bar that moves by itself.
- Say the result beside the action, never in a toast.
- A completed button returns to its verb as soon as there is something new to do.

**The words.** Simpan → Menyimpan… → ✓ Tersimpan · Kirim → Mengirim… → ✓ Terkirim · Terbitkan → Menerbitkan… → ✓ Diterbitkan (question 2, 5 Oct: the result names what happened) · Periksa → Memeriksa… → the result.

**Email is the exception.** PINTAR cannot confirm that an email arrived, so an email action never ends in ✓ or «Terkirim»: the button returns to its verb and the line says PINTAR is sending («PINTAR sedang mengirim…», `data-email`). D-098(c); EMAILJUJUR-L01 enforces it for the code emails. «✓ Terkirim» is only for a result the server has authoritatively confirmed, such as feedback answers stored («Sudah terkirim»).

**Try it.** Switch the network to «Slow» or «Fails» in the preview.
