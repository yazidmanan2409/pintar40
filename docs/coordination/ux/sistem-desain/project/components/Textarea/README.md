Longer text, with its limit said only as it is reached.

**Status: CHANGED,** with the field rules above.

**Markup.** As TextField, with `textarea.pds-textarea` (120 px tall, resizable vertically).

**Rules**
- Say who will read the text («Murid membaca catatan ini sebelum mulai Bab 3.»).
- If there is a limit, show the count quietly, and say «Tersisa 12 karakter.» only within 50 of it. Use `maxlength`; never cut text silently.
- Never a rich-text editor for a short note.
