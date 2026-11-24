# Request for legal advice, part 2: PINTAR's first use (a draft for the owner)

**Status:** FIT TO SEND (Sharon, `COUNSEL-BRIEF-P2-371e3b48.md`) once the mail host's processing region is confirmed. Supabase was confirmed on 24 Nov. The backup is a proposal and is stated as such. Prepared by Bob on 24 Nov 2026 (ruling 89; readiness register PR-1, PR-2 and PR-19). It is for Sharon's check, then the owner's confirmation of scope.
- **It follows part 1** (`COUNSEL-BRIEF-RULING85.md`, the AI questions), which stays unchanged and fit to send.
- **Fees:** the estimate requested in part 1 must be **re-confirmed for both parts together** before any work begins. No fees are incurred until the owner confirms in writing.

## 1 · The first use, as decided (ruling 57)

- **Who:** a pilot of **10 adults** in professional learning: one school, one class, at most 10 people active at once. **No children.**
- **What:** existing features only (lessons, practice, assessments and results). **No certificates are issued in the pilot.**
- **The AI drafting feature is not active in the pilot.** No pilot data goes to any AI provider. Part 1's questions concern a later, optional feature and are separate from this request.
- **Every provider that holds or carries pilot personal data:**

  | Provider | What it holds or carries | Region |
  |---|---|---|
  | Supabase | The database (accounts, learning activity, results, audit records), stored files, and its own daily backups | Singapore (`ap-southeast-1`), confirmed by the owner from the dashboard (24 Nov) |
  | Vercel | Hosts the application; personal data passes through it in requests and is not stored by PINTAR there | Singapore (`sin1`, from `vercel.json`) |
  | Namecheap (the `pintarselalu.com` mail host) | Sends sign-in and notice emails over SMTPS (`pintarselalu.com:465`, from `noreply@pintarselalu.com`), configured in Supabase Auth by `configure-supabase-smtp.yml` | *Unverified: the owner confirms where Namecheap processes this mail* |
  | Google Cloud Storage, **if the off-site backup is authorised and switched on** (the owner's preferred option) | Encrypted off-site backup copies | Jakarta (`asia-southeast2`), proposed; not yet created |

- **Who runs it:** PINTAR's owner operates the platform. The school appoints its own administrator, who enrols learners.
- **Any larger use,** including any use with children, needs a new owner decision, and is not part of this request except where question 8 asks.

## 2 · The questions

1. **Status under UU PDP (Law 27/2022).** For the pilot, is PINTAR the controller, a processor for the school, or a joint controller? What written agreement with the school is needed?
2. **PSE registration.** Does operating PINTAR for this pilot require registration as a private electronic system operator (PSE Lingkup Privat)? If so, before the pilot or before wider use?
3. **Retention and deletion (roadmap decision R-2).** For each kind of record we keep, is our proposed retention lawful and proportionate? The records are: account data, learning activity and answers, results, audit records, and backups. The proposal is attached on request. Off-site backups are encrypted to two recovery keys held by separate custodians. In particular: may a backup keep data after a person's deletion request, until the backup expires (privacy line O11)?
4. **Data location (E-K6-1).** Is holding the pilot's personal data with providers outside Indonesia acceptable? What safeguards or notices does UU PDP require for that transfer?
5. **Content rights (Q5).** Educators upload or import their own teaching material and questions. What licence or terms should PINTAR obtain from the school and the educators to store, display and reuse that content within the school?
6. **Notices and consent for adults.** What must the pilot's privacy notice say? Is consent the right basis for an adult learner's data, or another basis such as a contract with the school?
7. **Breaches and people's requests.**
   - Under UU PDP, what must be in place before the pilot to handle a personal-data breach? Who notifies whom (the authority, the school, the people affected), how fast, and is that PINTAR's duty or the school's?
   - What response times apply to an adult's request to access, correct or delete their data?
   - Is PINTAR's existing account-closure and deletion process (a request, then closure, then anonymisation) sufficient, or what must be added?
8. **Looking ahead: learners under 18.** At a high level only, which of the answers above change when the platform later serves children (parental consent, and the minors' provisions)? This is for planning; it does not ask for full advice now.

## 3 · What we ask for

- A written view on questions 1–7 for the pilot, with any condition stated so that we can verify it.
- A short note on question 8.
- Anything in the pilot's design you would change before it starts.

**Attached on request:**
- the retention proposal;
- the data map (what is stored, where, and who can read it);
- the provider terms we rely on.

No evaluation results and no real-person data are included.
