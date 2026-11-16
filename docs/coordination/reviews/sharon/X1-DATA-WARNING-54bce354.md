# X-1 · the data warning in the guide for schools using their own AI

Sharon, 16 Nov 2026 (13:55 UTC). Read-only. **What I reviewed:**
- `docs/coordination/ux/completion-4.1/X1-PANDUAN-AI-EKSTERNAL.md` on `ux-1/daisy-experience` at `54bce3549dd5dcff39e6efb62ff31eeaaa5f4d1d`: §A.2, §A.3, §A.6 and §D's point 3;
- Bob's list as he quoted it, from `AI-EKSTERNAL-PANDUAN-DRAF.md` at `ba98d0dfd3808d2409fc11bdb10bd042cb6d1aa4`.

The guidance only is reviewed here. No product change is involved.

## What holds now

- **The warning is right in shape, but not complete. Five additions are required before it ships.** The responsibility sentence is accurate. Daisy's word-problem answer is acceptable as guidance.

## Q1 · Is the list of what never goes to an outside AI complete? No.

1. **A regression against Bob's draft.** Bob's list has **phone numbers and addresses**. Daisy's §A.2 does not. Restore both.
2. **Start with the principle, then give examples.** A list invites "it wasn't on the list". Open with one rule:
   - «**apa pun yang dapat mengenali seorang murid**, langsung atau bila digabung dengan keterangan lain»
   - (*anything that can identify a learner, directly or combined with other details*),
   - for example «satu-satunya murid kidal di kelas 5B» (*the only left-handed learner in 5B*).
3. **Add these to the learner examples:**
   - **email;**
   - **date of birth;**
   - **NIK;**
   - **parents' or guardians' data;**
   - **health, disability or special-needs information;**
   - **attendance and behaviour notes;**
   - **a learner's own written work,** essays included, even without a name. Spell this out, since "jawaban" may not read as covering it.
4. **Add what comes out of PINTAR itself:**
   - **screenshots of PINTAR screens and files exported from PINTAR** (reports, lists). They carry names even when the teacher pastes "just the table".
5. **Add credentials:**
   - **passwords, login links, invitation codes, and any PINTAR link that opens an account or a class.**

**Optional, not privacy:** exam questions that must stay secret before an assessment. Pasting them out is a test-security risk, not a data-protection one. Daisy may judge whether it belongs here.

## Q2 · Is the wording on responsibility right? Yes, with two additions.

- **The current sentence is accurate:** «diolah oleh perusahaan AI itu, menurut aturannya sendiri. PINTAR tidak dapat melihatnya dan tidak dapat menariknya kembali.» It does not overclaim, and it makes no promise on the provider's behalf. Keep it.
- **Add (a):** whether the text is kept or used to train the AI depends on that service's terms and the account's settings.
  - «Gunakan akun yang disetujui sekolah Anda bila ada, dan periksa pengaturannya.» (*Use the account your school approved, if there is one, and check its settings.*)
  - That is guidance, not a legal claim.
- **Add (b):** responsibility for what is pasted rests with whoever pastes it, under the school's own rules.
  - Say this plainly, without legal terms: «Anda dan sekolah Anda yang bertanggung jawab atas apa yang Anda tempel.» (*You and your school are responsible for what you paste.*)
- **Do not cite Indonesian law by name in the guide.** A legal reading is for the owner. The guide should not suggest one.

## Q3 · Is Daisy's provisional answer on word problems acceptable for guidance? Yes.

- Invented names in the prompts, plus the teacher's check, are the honest safeguard. The guide promises no check that PINTAR does not make.
- **Two small widenings:**
  - the teacher replaces a name that matches **any learner they know of at the school**, not only their own class;
  - and avoids **real identifying local detail** in a problem, such as the school's name, a real street or a real family.
- R-3 decides the product rule later. If the rule changes, the guide changes with it, as §D says.

## The provider facts

As in E, I am an Anthropic model reviewing guidance about outside AI services. The guide names no provider, so no comparison is made here.
