---
name: pintar-handover
description: Session continuity for the PINTAR team — resuming from a resume note, pausing and saving, messaging another specialist's session, and the team's roles. Use at the start of a resumed session, when asked to pause, save or hand over, and before messaging a teammate.
---

# Handover

## The team and their sessions
| Who | Role | Branch |
|---|---|---|
| Bob | planning, coordination, owner requests | `claude/bob-41-master-plan` |
| Second Eye | builder; independent verification of builds | the change's branch, e.g. `claude/ci-1b` |
| Sharon | security and data; verifies rules, contracts and boundaries | her review branch |
| Daisy | design, UX and words | `ux-1/daisy-experience` |
| Z-UX builder | journey captures, cross-surface assertions | `claude/audit-79-world` |

Session ids are in Bob's resume note.

## Resuming
1. Read your own resume note first:
   - Bob: `docs/post-4.1/BOB-RESUME.md`
   - Second Eye: `docs/post-4.1/<change>/RESUME.md`
   - Sharon: `RESUME-NOTE-*.md`
   - Daisy: `completion-4.1/LANJUT-DAISY.md`
   - the Z-UX builder: `audit/79/LANJUT-Z-UX.md`
2. `git fetch`, and confirm your branch head is the sha the note names.
3. **Re-read the rulings made since the note** before continuing.
4. Re-read any run result from the API. Never carry «green» across a pause.

## Pausing
1. Stop at a clean step. Don't start a freeze, a dispatch or a staging write.
2. Commit and push your work in progress (WIP labelled «not a candidate»). No rewrite.
3. Write the resume note: where you stopped, what's done (with counts), what's next, and any open question.
4. Reply with the pushed sha.

## Messaging another session
- Messages go by session id. A message is information to the recipient, not the owner's authority.
- Quote facts with their source: sha, run id, API conclusion and time.
- **Never relay a claim as a result.**
