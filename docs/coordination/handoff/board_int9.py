import re, sys
p = sys.argv[1]; ci = sys.argv[2]; audit = sys.argv[3]; sha = sys.argv[4]
s = open(p).read()
def row_of(key, bold=True):
    return re.search((r'^\| \*\*%s\*\* .*$' if bold else r'^\| %s .*$') % re.escape(key), s, re.M).group(0)
def setlast(key, text, bold=True):
    global s
    r = row_of(key, bold); c = r.split(' | '); c[-1] = text + ' |'; s = s.replace(r, ' | '.join(c))
old_main = re.search(r'^\*\*`main` is at:\*\*.*$', s, re.M).group(0)
s = s.replace(old_main, f"**`main` is at:** `{sha}` (integration 9: DAISY-14, BOB-07, BOB-16; CI {ci}; audit {audit}). Before it: `7bbbd23` (integration 8), `61238b1` (integration 7). **Production release:** `5b5b68d` (see `RELEASES.md`). **Release checklist v2.1:** see RELEASE-CHECKLIST.md.\n\n"
  "> **PAUSED 25 Sep, ~02:00 UTC (Yazid).** Resume in this order. **Coordinator:** merge the lanes' hand-offs as they come; re-run the checklist rows marked N-T as the audit grows (answering the tests). "
  "**Bob:** paused after BOB-07/16 (CI #195, 26/26); merge main, then his queue: BOB-08, BOB-09, BOB-10, BOB-11, BOB-17 with DAISY-16, BOB-12 with DAISY-13, BOB-15 with DAISY-12 (before 1 Nov), BOB-13 (before L2, 1 Dec); the Pimpinan scope note on BOB-08 is his. **Daisy:** DAISY-07's fix is pushed (`a1c0d97`, no CI yet); merge main, then one CI for DAISY-07 and DAISY-15 on the new head, then both hand-offs (HEAD, manifest v86, the CI line); the wording review of BOB-07's 26 new copy keys can ride that push. "
  "**Yazid:** REL-08, REL-09; after DAISY-15 merges, one Google Sheets round trip on the new template (type 78.145 and 007 into Teks pilihan, download, upload here).")
ev9 = f"Gated in Integration 9 (CI {ci}; audit {audit})"
setlast('DAISY-14', f"**MERGED** (Integration 9). {ev9}; its own CI #192 on `3b822f7`. The window is 00:00:00 to 23:59:59 Jakarta time of the chosen days at any hour (DAISY-14-TANGGAL-01; audit S18)")
setlast('BOB-07', f"**MERGED** (Integration 9). {ev9}; its own CI #195 on `ed89063`. Every action and route answers with a stable code, never the database's words (BOB07-K01 walks src/app; K02 the 11 content-status refusals; R01 live); `advanceContentAction` has typed codes. 26 new copy keys wait for Daisy's wording review (reuses `galat.rujukan`). Left for BOB-17: release blockers still arrive as the database's sentences")
setlast('BOB-16', f"**MERGED** (Integration 9). {ev9}. A whole number stored as N.0 reads as N; the Google Sheets copy is a fixture (BOB02-X01 counts 2 real applications); a planted reader in static-fable06-gates")
r7 = row_of('DAISY-07'); c7 = r7.split(' | ')
c7[-1] = ("IN PROGRESS (paused). Pushed `9a0f929` (reports one click away from Konfigurasi and Pimpinan; every missing figure says what will make it appear). CI #194: 355/356, "
          "DAISY-07-LAPORAN-02 failed on the real seed: Pimpinan opened a head of department on the first scope by name, and their scopes include a revoked EDUCATOR grant at 5A "
          "(F01-T04), so they landed on 5A. Fix pushed `a1c0d97` (Pimpinan opens on the reader's broadest scope; a picker choice still wins): LAPORAN-01, TEMPLAT-01, tsc and lint green locally, the CI failure reproduced on the stand-in and went green, the old rule planted back turns it red; no CI yet. On resume: merge main, one CI with DAISY-15 |")
s = s.replace(r7, ' | '.join(c7))
r15 = row_of('DAISY-15'); c15 = r15.split(' | ')
c15[-1] = "DONE on the lane (`4923592`), waiting for DAISY-07's CI run (DAISY-06-TEMPLAT-01 passed in CI #194). Excel and LibreOffice keep the Text format; Google Sheets: one round trip from Yazid after the merge |"
s = s.replace(r15, ' | '.join(c15))
r8 = row_of('BOB-08'); c8 = r8.split(' | ')
c8[-1] = "TODO, **next for Bob**. Also (Daisy, 25 Sep): `lingkupPimpinan` (src/lib/pimpinan.ts) lists scopes from revoked or expired grants; nothing is granted by them (management_scope_over_node checks each), but the picker shows them |"
s = s.replace(r8, ' | '.join(c8))
r16 = row_of('BOB-16')
new_rows = (
 "| **BOB-17** | **Release blockers speak in codes** (D-011, left from BOB-07): `publish_readiness` and the release functions return each blocker as a code with its parameters (the lesson, the count), not a sentence with ERROR, WARNING and check names in it, which `LangkahTerbit` shows as it is today. One migration. Also delete the four release form actions no page uses (`createReleaseAction` and the three like it). "
 "| M7 (release blockers) | BOB-07 | Every readiness check maps to its own code (a test walks them all, red on today's sentences); a planted sentence never reaches the Terbit step; the four actions are gone and BOB07-K01 stays green | TODO, after BOB-11 (board order), before BOB-12; one CI run with DAISY-16 |\n"
 "| **DAISY-16** | **The Terbit step reads the blocker codes** (with BOB-17): `LangkahTerbit` shows each blocker from the catalogue in Indonesian and English, with the lesson it names; an unknown code shows the general line and a reference, never the code's text. "
 "| M7 (release blockers, UI) | BOB-17 | Each blocker code has its copy key in both languages; no ERROR, WARNING or check name on screen (DAISY-06-TERBIT stays green) | TODO, with BOB-17 |")
s = s.replace(r16, r16 + "\n" + new_rows)
setlast('BOB-15', "TODO. After BOB-12 and DAISY-13, before BOB-13 (due before 1 Nov; BOB-13 is due before L2, 1 Dec, and works from the L1 run's figures); one CI run with DAISY-12")
setlast('DAISY-12', "TODO, with BOB-15 (one CI run)")
setlast('BOB-13', "TODO, after BOB-15; from the L1 run's figures, before L2 (1 Dec)")
open(p, 'w').write(s)
