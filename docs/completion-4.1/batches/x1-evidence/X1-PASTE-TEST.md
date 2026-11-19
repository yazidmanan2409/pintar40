# X-1 · The paste test (point 5): does quoted multi-line text survive as one cell?

Second Eye, 16 Nov 2026. For Daisy's rule ⟨TES⟩ in `X1-PANDUAN-AI-EKSTERNAL.md` §B rule 5 and §C rule 3 (on
`ux-1/daisy-experience` at `26061f31`). Run on the local stack, C2w branch.

## Method

1. **The AI's answer.** Prompt A's five tables, written by hand to its rules (synthetic content: «Mengenal Pecahan»,
   one lesson, one question, four options). The «Isi pelajaran» has three line breaks, and is quoted "…" as rule 5
   asks. It is pasted from row 2, as §A.3 says.
2. **The paste, two ways.** LibreOffice Calc stands in for the teacher's spreadsheet. Excel and Google Sheets were not
   available here.
   - **(A) Plain text:** a tab-separated table, as an AI gives it in a code block. It goes through Calc's text import
     (tab-separated, `"` as the quote), which is how a spreadsheet parses pasted text.
   - **(B) A rendered chat table:** as a chat interface draws a markdown table, and as it is copied (HTML). Markdown
     cannot hold a line break inside a cell, so the AI writes `<br>`. It goes through Calc's HTML import.
   - **(B′) The same table without the quotes.**
3. **PINTAR's own reader.** Each sheet is read with `bacaBukuKerja` and the five are converted with
   `bukuKerjaKePaket`, as the upload does.
4. **The upload, on the local stack.** As the synthetic school's teacher: `prepare_ingest_batch`, then
   `confirm_ingest_batch`. The stored `lessons.body_markdown` is read back. It is all rolled back.

## Result

| Path | The «Isi pelajaran» cell | Stored lesson body |
|---|---|---|
| **(A)** plain text, quoted | **One cell.** The quotes are removed and the 3 line breaks are kept | Clean, with its paragraphs |
| **(B)** rendered table, quoted | **One cell** with its 3 line breaks, but the **quotes stay as characters**: `"Pecahan … di rumah."` | **Wrapped in literal `"…"`**. Prepare and confirm raise nothing |
| **(B′)** rendered table, no quotes | **One cell.** Clean, with its 3 line breaks | (as A) |

**So rule 5's quotes help only when the AI answers in plain text. In a rendered table, the usual case in a chat,
they end up in the lesson itself, and PINTAR does not flag them.** In a rendered table the line breaks survive by
themselves, as `<br>`.

**For Daisy's decision:**
- The fallback you named, «Tulis teks dalam satu paragraf saja; jangan memakai baris baru di dalam sel.», is safe on
  both paths. It costs the lesson its paragraphs.
- Dropping the quote instruction and leaving line breaks to the AI is safe in a rendered table, but not as plain
  text. There an unquoted line break splits the row.

## §A.5's list of problem codes

This sample followed the prompt, so prepare and confirm raised **no** problem code. The test does not confirm which
codes come up most from real AI output. That needs real answers from the AIs teachers use, which this test does not
have (no external calls in C2w and C3w, ruling 42).
