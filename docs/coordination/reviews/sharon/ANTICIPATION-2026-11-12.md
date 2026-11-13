# Defects found on 12 Nov 2026, classed by the owner's principle

Sharon, 13 Nov 2026. Bob's instruction of 13 Nov (`TEAM-INSTRUCTIONS.md`, "Before any correction is built", at
`57161d585dc4bf9d09e04dbb8c3e3d03cabc339d`): mark each defect as "could reasonably have been anticipated" or not, and
name the question that would have caught it.

The five questions:
- **Q1:** what else reads or writes this state;
- **Q2:** the opposite and neighbouring act;
- **Q3:** which locks, in what order, and who else takes them;
- **Q4:** how "before" is told from "after";
- **Q5:** who runs each check, with what access, and where it renders.

This classes the defects found in my reviews of 12 Nov, so the first count has a baseline. It includes those that
trace to my own designs.

| Defect | Found by | Anticipable? | Question | Note |
|---|---|---|---|---|
| L1-F4: history against live attachments measured by transaction **start** times | Sharon (interim, `ea3c4b6f`) | **Yes** | Q4 | `now()` is the transaction's start; any page comparing two `now()` values across transactions should ask this |
| L1-F2: an issuer locks the account, then the person through L1-F4's guard (a cycle with a suspension) | Sharon (`e27f4a77`) | **Yes** | Q3 | **Traces to my own L1-R2 design (§2b):** I specified the issuers' account lock without following their insert into L1-F4's guard |
| L1-F2: three more functions with the same shape; `auth.users` against accounts (a second cycle) | Second Eye's path list (`9db58dd5`) | **Yes** | Q3 | Found by applying the rule to every path, which is the question in action |
| My two race plants could not bite (other locks already serialised the races) | Second Eye (`e27f4a77`) | **Yes** | Q3 | My plant specification did not ask who else takes those locks |
| L1F4-A1: a deletion racing a reopen | Bob (`3a63a2b2`) | **Yes** | Q2, Q3 | The reopen is the deletion's opposite act; neither took the person row |
| L1F4-A2: a reopen approved after a deletion | Sharon (`3a63a2b2`) | **Yes** | Q2 | The neighbouring act, without any race |
| F1-R1b: no existing check held a later revision until its explanations were rewritten | Second Eye (`97a40ebb`) | **Yes** | Q1 | **My §3a.5** assumed the content checks read a rationale on that path. They did not |
| B2 register R-S1: the page can show fewer chapters than the record counts | Sharon (`bfe949b1`) | **Yes** | Q1 | Non-blocking; two readers of one selection |
| Journeys job B: database port "already in use" (third time) | CI | Infrastructure, not code. After the first occurrence (7 Nov), **yes** | Q5 | Fixed at the cause in `b24d73ff` |

**Design-stage findings, not defects in a build** (counted separately; caught by asking the questions before A2a is
built):
- A2a, 28 readers of a window's schools: Q1.
- The fence after the person and account locks in a suspension: Q3.

**Count for 12 Nov:**
- 9 defects;
- 9 could reasonably have been anticipated (one only after its first occurrence);
- by question: Q3 ×4, Q2 ×2, Q1 ×2, Q4 ×1, Q5 ×1 (A1 counted under both Q2 and Q3);
- 3 trace to my own designs or specifications.

From here on, each result review carries this marking for every defect it finds.
