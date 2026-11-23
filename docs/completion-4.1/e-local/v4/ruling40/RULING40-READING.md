# Ruling 40 · Provider terms reading (second pass, 23 Nov 2026)

> **Read-only.** Only the providers' official public pages were fetched, with `curl` through the session's HTTPS proxy.
> - No API calls were made to any AI provider.
> - No keys were used, nothing was signed in to, nothing was spent, activated or deployed.
>
> **Brief:** `READING-BRIEF.md`, in this folder.
> **First pass:** `../juri/E-RESULTS-BLIND.md`, section "Ruling 40 reading, first pass".

**How to check this reading**
- Each page's raw HTML was saved to scratch storage only. It is **not** in the repository.
- The `sha256` in each table is the hash of the HTML exactly as served on 23 Nov 2026 (UTC).
- Quotes are verbatim, taken from the page text.
- An ellipsis (…) marks text left out; nothing was reworded inside quotation marks.
- Pages change over time. A later fetch can produce a different hash without the text that matters here having changed.

**Column key**
- **(1) What the document states:** a verbatim quote, plus the page's title and date.
- **(2) Interpretation:** PINTAR's reading. It is interpretation, not a statement from the provider.
- **(3) Needs legal advice or confirmation:** for counsel or the owner.

---

## Pages fetched

| # | URL (as fetched → as served) | Title on the page | Version / date shown | Result | sha256 (raw HTML) |
|---|---|---|---|---|---|
| O1 | `https://openai.com/policies/services-agreement/` | OpenAI Services Agreement | "Updated: December 1, 2025" · "Effective: January 1, 2026" | READ | `6a21e0c1ce87b46f7475eb46bbfd286ee887630c967dbb2c46ad98a287d499fc` |
| O2 | `https://openai.com/policies/usage-policies/` | Usage policies | "Effective: November 20, 2026" (changelog entry 2026-10-21) | READ | `2b4f2516c778f8f171be51950d48008d56a35af2ccb22cb8b08bf7f0363993df` |
| O3 | `https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance` | Under-18 guidance | **No date shown on the page** | READ | `757ce159d73ce79843a1e73504b8ad576861f18c272f723ff1cf1f37e2bfe977` |
| O4 | `https://platform.openai.com/docs/guides/your-data` → `https://developers.openai.com/api/docs/guides/your-data` | Data controls in the OpenAI platform | **No page date shown** (the text cites "As of March 1, 2023") | READ | `00a1b43fd1db13fa2c83aa2f806e1893a7c1cb18cd4706f2c752477dd35f8c19` |
| O5 | `https://developers.openai.com/api/docs/guides/data-residency` | Data residency | **No date shown** | READ | `f0d691c4de30a112fa22b40eb0877a148b1f82dc337b55c5bbc1e83f1a31ecdc` |
| O6 | `https://openai.com/policies/sub-processor-list/` | OpenAI Sub-processor list | "Last updated: October 14, 2026" | READ | `75427f31abb48633ce98c5369d45b34a58de5efaeccc9287d2397bc59f5532b9` |
| O7 | `https://openai.com/policies/data-processing-addendum/` | OpenAI Data Processing Addendum | "Updated: December 1, 2025" · "Effective: January 1, 2026" | READ | `e0ab14b4630f72d1e0888b0137eccab5deb7c1811f5feee574d7fb7b66cb302c` |
| O8 | `https://openai.com/policies/service-terms/` | Service terms | "Updated: November 13, 2026" | READ (searched for labelling and minors terms only) | `0f533b5cad7fd391377f74ce8c140fbbac15f69750d011895af80dfdad06c5b5` |
| O9 | `https://developers.openai.com/api/docs/supported-countries` | Supported countries and territories | No date shown | READ (Indonesia only) | `c9238e84a1464971d1af39df11ba1b1db19db0827129080f3d52f43f406292f2` |
| O10 | `https://platform.openai.com/subprocessors` (the address the DPA names as the Sub-Processor List) | "OpenAI Platform" | — | **NOT READ.** The page is a script-rendered shell with no list text in it. O6 is the list that was read. | `cf7ad4fec8c6a404f92a226b56cc38ebcccbe8e9c51bddfcde6b37332a69df20` |
| A1 | `https://trust.anthropic.com/subprocessors` | "Anthropic Trust Center" (shell only) | — | **NOT READ.** See below. | `a4a61a4fbca793c17557ecfc20ff814d1b65c30ee0f4806f3df33b43b2513df4` |
| A2 | `https://trust.anthropic.com/` | "Anthropic Trust Center" (shell only) | — | **NOT READ** | `a4a61a4fbca793c17557ecfc20ff814d1b65c30ee0f4806f3df33b43b2513df4` |
| A3 | `https://trust.anthropic.com/resources` | "Anthropic Trust Center" (shell only) | — | **NOT READ** | `a4a61a4fbca793c17557ecfc20ff814d1b65c30ee0f4806f3df33b43b2513df4` |

**Why A1 to A3 are NOT READ**
- `trust.anthropic.com` returns HTTP 200, but every path gives the same 7,166-byte HTML shell (identical sha256). Only the page title and meta description are in it.
- The subprocessor names, purposes and locations are drawn by JavaScript loaded from `assets.vanta.com`.
- The proxy refuses that host ("CONNECT tunnel failed, response 403"). It is not on this environment's allowlist.
- Nothing about Anthropic's subprocessors, retention or residency was read. **Nothing about them is inferred here.**

---

## OpenAI

| # | Question | (1) What the document states (verbatim · source) | (2) Interpretation for PINTAR | (3) Needs legal advice or confirmation |
|---|---|---|---|---|
| 1 | **Business terms:** version and date; training on API inputs and outputs | **O1, Services Agreement** (Updated 1 Dec 2025, Effective 1 Jan 2026): "This OpenAI Services Agreement only applies to use of OpenAI's APIs … for customers who are businesses and developers". §4.2: "OpenAI will only use Customer Content as necessary to provide Customer with the Services, comply with applicable law, enforce the OpenAI Policies, and prevent abuse. OpenAI will not use Customer Content to develop or improve the Services, unless Customer explicitly agrees to such use." Definition: "'Customer Content' means the Input and the Output." **O4:** "As of March 1, 2023, data sent to the OpenAI API is not used to train or improve OpenAI models (unless you explicitly opt in to share data with us)." | *Interpretation:* the version matches the first-pass search summary ("v.010126", 1 Jan 2026), and it is now **read**. API inputs (synthetic lesson text, objectives) and outputs (draft items) are not used for training unless PINTAR opts in. PINTAR must not opt in. On training, this is in substance the same as Anthropic Commercial Terms §B. | Which OpenAI entity contracts with PINTAR. O1 says "OpenAI OpCo, LLC, for Customers located outside the EEA or Switzerland". Confirm that this applies to an Indonesian customer. |
| 2 | **Eligibility:** school products; end-user age or minors clauses; teacher-only workflow | **O1 §3.3:** "Customer will not, and will not permit End Users to: … (c) allow minors to use OpenAI Services without consent from their parent or guardian". **O1, definition:** "'End User' means any party: (a) who accesses the Services under Customer's Account; or (b) who uses Customer Applications. End Users may include … students or any other person authorized by Customer". **O3, Under-18 guidance:** "developers should implement additional safeguards when using our API to serve minors (under 18 years old)." And: "You should not use OpenAI services to process any personal data of children under 13 or the applicable age of digital consent without first implementing zero data retention in our API." And: "OpenAI reserves the right to audit organizations for compliance with this policy." **O2:** "Keep young people safe. … OpenAI tools must not be used to endanger anyone under 18." | *Interpretation:* nothing excludes school or education products. In PINTAR's design, only adult educators call the AI. Learners never interact with it, and no learner data is sent. On that design, PINTAR does not "serve minors" through the API (O3), and no minor "uses OpenAI Services" (O1 §3.3(c)). **Caution:** the "End User" definition, limb (b), covers anyone "who uses Customer Applications". If the learner-facing PINTAR app counts as the same "Customer Application" as the educator drafting tool, learners might count as End Users even though they never touch the AI. Keeping the AI drafting tool a separate, educator-only application (or account/project) is the cleaner position. | (a) Whether learners using the non-AI parts of PINTAR are "End Users" under O1 limb (b). If they are, whether §3.3(c) parental consent then applies. (b) O3 has no date, so record the fetch date (23 Nov 2026) as its version. (c) How "applicable age of digital consent" works under Indonesian law (UU PDP). This matters only if learner personal data were ever sent, which the design forbids. |
| 3 | **Educational or assessment content; labelling of AI output** | **O2, Usage Policies** (Effective 20 Nov 2026). Prohibited: "automation of high-stakes actions in sensitive areas without human review. This includes actions, decisions … that materially affect a person's rights … in areas such as: … education". Prohibited: "academic dishonesty". Prohibited: "inference regarding an individual's emotions in the workplace and educational settings, except when necessary for medical or safety reasons". **Labelling:** no general AI-output labelling duty was found in O1 or O2. The only disclosure duty found in O8 (Service Terms, 13 Nov 2026) covers generated *speech*: "Customer must clearly disclose that generated speech is AI-generated". | *Interpretation:* drafting multiple-choice items is not prohibited. The education clause targets automated high-stakes actions "without human review". PINTAR has an educator accept or delete every draft, and the AI does no grading. That is human review, so the design sits outside the clause. No labelling duty applies to text drafts. PINTAR's own provenance marking of AI-assisted items stays a product choice, not a contract duty. PINTAR uses no speech output, so the O8 speech clause does not apply. | (a) Whether an educator's accept/delete step counts as "human review" if the items feed formal, certifying assessments. Same question as Anthropic's "outside of multiple-choice testing" carve-out. (b) Whether Indonesian rules on education or AI require labelling (outside the provider terms). |
| 4 | **API retention; zero retention; data residency** | **O4, Data controls:** "By default, abuse monitoring logs are generated for all API feature usage and retained for up to 30 days, unless longer retention is required by law, or is reasonably necessary to protect our services or any third party from harm." "Eligible customers may have their customer content excluded from these abuse monitoring logs … by getting approved for the Zero Data Retention or Modified Abuse Monitoring controls. Currently, these controls are subject to prior approval by OpenAI and acceptance of additional requirements." Endpoint table: `/v1/chat/completions` and `/v1/responses` show abuse-monitoring retention "30 days". **O5, Data residency:** "Eligible organizations can enable data residency when creating a project … Contact sales to discuss your data residency needs and become eligible." The region table lists the United States, Europe (EEA + Switzerland), Australia, Canada, Japan, India, Singapore, South Korea and the United Kingdom. Singapore shows "Regional storage: Yes", "Regional processing: No". "If your selected Region does not support regional processing … OpenAI may also process and temporarily store Customer Content outside of the Region". **Indonesia is not a residency region.** **O1 §11.3:** on termination, "OpenAI will delete all Customer Content from its systems within thirty days". | *Interpretation:* the first-pass summary (30-day logs; zero retention by prior approval) is now **confirmed as read**. PINTAR sends only synthetic content, so the 30-day default is acceptable on design. Zero retention is not needed, because no children's personal data is processed (compare O3). Residency is sales-gated, and no Indonesian region exists. | Whether Indonesian law requires in-country storage for this content. On design it is non-personal synthetic data, so likely not. Counsel to confirm (PR-1). |
| 5 | **Subprocessors:** names, purposes, locations, page date | **O6, Sub-processor list** ("Last updated: October 14, 2026"). Third-party subprocessors whose rows include "API": **Cloudflare, Ltd.** (content delivery network; "the data center … closest to the End User"). **Microsoft Corporation** (cloud infrastructure; locations include Australia, Belgium, Brazil, Canada, Denmark, France, Germany, India, **Indonesia**, Ireland, Italy, Japan, Malaysia, Mexico, Netherlands, New Zealand, Norway, Poland, Singapore, South Africa, South Korea, Spain, Sweden, Switzerland, United Arab Emirates, United Kingdom, United States). **CoreWeave, Inc.** (cloud infrastructure; Norway, Spain, Sweden, United Kingdom, United States). **Oracle Cloud Infrastructure** (cloud infrastructure; Brazil, Japan, Malaysia, Netherlands, United Kingdom, United States). **Google Cloud Platform** (cloud infrastructure; Finland, Japan, Netherlands, Norway, Singapore, United Kingdom, United States). **Amazon Web Services, Inc.** (cloud infrastructure; United States). **Cerebras** (cloud infrastructure; United States, Canada). **Snowflake, Inc.** ("API*"; data warehousing; United States; "* Except where Zero Data Retention (ZDR) is used"). **TaskUs, LLC** (Philippines; customer support; "API & ChatGPT Business: Moderation of content"). **Salesforce** (customer support; locations include **Indonesia**). **Pylon Labs** (United States; "Customer support***", "At election of customer; applicable to premium support only"). **Accenture International Limited** (United States, Canada, Philippines; customer support; moderation of content). **Fivetran, Inc.** (United States; ETL provider). **Cinder Technologies, Inc.** ("API*"; United States; "Platform for content moderation"). Moderation: "OpenAI may share samples of the flagged Customer Content with relevant Sub-processors … Sharing … only occurs when content is flagged". Affiliates: OpenAI OpCo, LLC (US), OAI International, Inc. (US), OpenAI Ireland Ltd. (IE), OpenAI UK Ltd. (UK), OpenAI Japan Ltd. (JP). "We use the Standard Contractual Clauses as a valid transfer mechanism among affiliates." | *Interpretation:* PINTAR's prompts and drafts can be processed in the US and several other countries, and, if flagged, by moderation vendors in the Philippines and the US. Indonesia appears only as one possible location for Microsoft and Salesforce. That does not guarantee Indonesian processing. | (a) The DPA's formal "Sub-Processor List" address is `platform.openai.com/subprocessors` (O10, NOT READ: script shell). Confirm with OpenAI that O6 is the same list. (b) Whether to subscribe to the change notices (O6 links a form) to use the 30-day objection right (O7 §2.9). |
| 6 | **DPA:** how it is entered; transfer mechanisms; any mention of Indonesia | **O7, DPA** (Updated 1 Dec 2025, Effective 1 Jan 2026): "This OpenAI Data Processing Addendum ('DPA') supplements, and is incorporated into, the OpenAI Services Agreement". **O1 §5.3:** "If Customer uses the Services to process Personal Data, OpenAI and Customer will comply with the DPA, which is incorporated by this reference into the Agreement." **O7 §4.1** (EEA and Swiss data): transfers "on the basis of agreements containing SCCs … or an adequacy decision issued by the European Commission under Article 45 GDPR". **§4.2** (UK data): "the SCCs as amended by the UK Addendum, which are deemed entered into". Schedule §8.1: "Module Two (Controller to Processor) … Module Three (Processor to Sub-Processor)". §8.2(v): "the SCCs will be governed by the laws of England and Wales". §2.9: "Customer may object to the use of such additional Sub-processor within 30 days of receiving notice". **Indonesia: not mentioned in O7.** No text was found saying the DPA must be requested or signed by form. | *Interpretation:* the DPA is **incorporated automatically** into the Services Agreement. This **corrects the first-pass search summary** ("a DPA entered by form"), which was unverified and is not supported by the read text. That matches Anthropic (Commercial Terms §C → DPA). The transfer mechanisms cover EU, Swiss and UK data only. Nothing addresses transfers out of Indonesia. | **PR-1:** the basis under Indonesian law (UU PDP, 27/2022) for any transfer out of Indonesia. Neither provider's DPA mentions Indonesia. On PINTAR's design no personal data is sent. Counsel should confirm that the synthetic-only design keeps the UU PDP transfer rules out of scope, including educators' account data. |

---

## Anthropic

The rows marked "already read" come from the first pass (`../juri/E-RESULTS-BLIND.md`). They were **not re-fetched** in this pass: `anthropic.com` and `www-cdn.anthropic.com` are not on this environment's allowlist. Their quotes and dates are carried over as recorded there.

| # | Question | (1) What the document states | (2) Interpretation for PINTAR | (3) Needs legal advice or confirmation |
|---|---|---|---|---|
| 1 | **Business terms:** version and date; training | *Already read (first pass):* Commercial Terms, effective 17 Jun 2025, unchanged. §B: "Anthropic may not train models on Customer Content from Services". A.1 permits use "to power products and services Customer makes available to its own customers and end users". | *Interpretation:* equivalent to OpenAI O1 §4.2 on training. | None new. |
| 2 | **Eligibility:** minors; teacher-only workflow | *Already read (first pass):* Usage Policy, effective 12 Nov 2026 (the page also shows 17 Nov 2026). "Products serving minors, including organizations providing minors with the ability to directly interact with products that incorporate our API(s)…" must follow extra guidelines. | *Interpretation (Bob's, first pass):* learners never interact with the AI, so the design should fall outside this clause. | Counsel to confirm, as in the first pass. |
| 3 | **Assessment content; labelling** | *Already read (first pass):* high-risk category: "grading an exam or assessment that determines … certification (outside of multiple-choice testing)". | *Interpretation:* the AI does not grade; it drafts multiple-choice items that an educator accepts. That is outside the category. No labelling duty was recorded in the first pass. | Same question as OpenAI row 3 (a). |
| 4 | **Retention; zero retention; residency** | Commercial Terms and DPA: *already read* (DPA effective 24 Feb 2025). **Any retention or residency page on `trust.anthropic.com`: NOT READ** (A2, A3: script shell; content host `assets.vanta.com` blocked). | *Interpretation:* no Anthropic retention period or residency option is established by this reading. | The retention period and any residency option for the Anthropic API still need reading from an official page. |
| 5 | **Subprocessors:** names, purposes, locations, date | **NOT READ.** `https://trust.anthropic.com/subprocessors` returns a 7,166-byte shell. Its title is "Anthropic Trust Center" and it contains no subprocessor text. The content loads from `assets.vanta.com`, which the proxy refuses (403). sha256 `a4a61a4f…df4` (A1). | *Interpretation:* none. **Not inferred from any summary.** | **Still open.** Unblocking needs `assets.vanta.com` (and possibly further Vanta API hosts) on the allowlist, or a PDF copy of the list obtained by the owner. |
| 6 | **DPA:** how entered; transfers; Indonesia | *Already read (first pass):* DPA effective 24 Feb 2025, incorporated automatically by Commercial Terms §C. EU SCCs (Modules 2 and 3) with UK and Swiss addenda; help with transfer impact assessments. Indonesia not mentioned. | *Interpretation:* on this criterion it is now **at parity** with OpenAI (automatic; SCCs; no Indonesia). | PR-1, as for OpenAI row 6. |

---

## Same-criteria comparison (summary)

| # | OpenAI | Anthropic |
|---|---|---|
| 1 | READ. No training on Customer Content without opt-in (Services Agreement, effective 1 Jan 2026). | Read in the first pass. No training (Commercial Terms, 17 Jun 2025). |
| 2 | READ. Parental consent if minors use the Services. Under-18 guidance applies to apps that "serve minors". Not triggered on PINTAR's design, but see the "End User" caution. | Read in the first pass. Minors clause triggered by "directly interact". Not triggered on design. |
| 3 | READ. Prohibits automated high-stakes education decisions "without human review". No text-labelling duty. | Read in the first pass. Grading carve-out "outside of multiple-choice testing". |
| 4 | READ. 30-day abuse logs. Zero retention by approval. Residency sales-gated; no Indonesian region. | Terms and DPA read; **retention/residency page NOT READ**. |
| 5 | READ (list dated 14 Oct 2026). | **NOT READ.** |
| 6 | READ. Automatic incorporation; SCCs (EU, Swiss, UK). No Indonesia. | Read in the first pass. Automatic; SCCs plus addenda. No Indonesia. |

---

## Open points for the owner (D-7, 25 Nov 10:00 UTC)

1. **Anthropic subprocessors: still NOT READ.**
   - The trust centre at `trust.anthropic.com` loads its content from `assets.vanta.com`, which this environment blocks.
   - **Owner decision:** either allow `assets.vanta.com` (plus whatever Vanta API host it then calls) for one more read-only pass, or obtain the list from Anthropic directly.
   - Until then, criterion 5 is unmet for Anthropic, and criterion 4 is only partly met.
2. **The first-pass OpenAI summary corrected one claim.**
   - The OpenAI DPA is **incorporated automatically** (O1 §5.3, O7 preamble), not "entered by form".
   - All other first-pass summary items are now confirmed by reading: the 1 Jan 2026 terms, the 20 Nov 2026 usage policies, 30-day logs, zero retention by approval and the under-18 page.
3. **The "End User" definition (OpenAI O1)** covers anyone "who uses Customer Applications", including "students".
   - Counsel should advise whether the learner-facing app must be kept separate from the educator-only AI drafting tool (a separate application, account or project), so that §3.3(c) parental consent and the Under-18 guidance clearly do not apply.
4. **PR-1 (Indonesia, UU PDP)** is unchanged and still with counsel.
   - Neither provider's DPA mentions Indonesia. Both rely on EU, UK and Swiss mechanisms.
   - Counsel to confirm that the synthetic-only design, with no learner data, keeps transfer rules out of scope, and to say how educators' own account data is treated.
5. **"Human review" in formal assessment.**
   - Counsel to confirm that educator accept/delete counts as human review (OpenAI O2), and that drafting multiple-choice items is outside Anthropic's grading category, if PINTAR items are ever used in certifying assessments.
6. **Undated OpenAI pages** (O3 Under-18, O4 Data controls, O5 Data residency): record them as "version as fetched 23 Nov 2026", using the hashes above.
7. **Sub-Processor List address.**
   - The DPA names `platform.openai.com/subprocessors` (not readable here).
   - The list that was read is at `openai.com/policies/sub-processor-list/`.
   - Optionally, confirm they are the same list and subscribe to change notices (30-day objection window).

---

## Owner clarification (23 Nov 2026)

**Technical separation is not contractual compliance.** Point 3 above has two separate questions:
- **(a) Technical:** whether the educator drafting tool is separated from the learner app (its own application, account or API project). That is a design and engineering matter.
- **(b) Contractual:** who counts as an "End User" under OpenAI's Services Agreement, and whether §3.3(c) parental consent or the Under-18 guidance applies. **That is for counsel.**

**A separate API project alone does not establish compliance.** (a) can support the answer to (b) but cannot replace it.

**These stay open for counsel:**
- point 3 (b);
- PR-1;
- "human review" in certifying assessment;
- the Anthropic minors clause, as read on PINTAR's design.

**Status:** no provider is activated, nothing is spent, and D-7 (25 Nov, 10:00 UTC) is preserved.

---

## Third pass (Anthropic trust centre), 23 Nov 2026, about 05:50 UTC

**Scope:** one bounded, read-only step, requested by Bob on the owner's instruction.
- No AI provider API was called.
- No key or sign-in was used, and nothing was spent.

### Step 1: external hosts referenced by the saved shell (A1)

**Source:** `https://trust.anthropic.com/subprocessors`, as fetched in the second pass.
- sha256: `a4a61a4fbca793c17557ecfc20ff814d1b65c30ee0f4806f3df33b43b2513df4`
- Shell attributes: `data-version="d8e6a1b1584d28f42f5dd46231fdad342dab66e2"`, `data-deployed-at="2026-11-21T02:02:47Z"`.

The hosts were extracted from the saved file only. No new request was made in this step.

| Host | Where it appears in the shell | What it is for, as far as the shell shows |
|---|---|---|
| `assets.vanta.com` | 16 × `<link rel="modulepreload">` (JS chunks); 2 × `<link rel="preload" as="font">`; 2 × `<link rel="stylesheet">`; the inline loader's fetch preload `https://assets.vanta.com/static/signature-manifest.d8e6a1b1584d28f42f5dd46231fdad342dab66e2.json` (`data-signature-manifest-url`); the inline loader's main module `https://assets.vanta.com/static/index-trust-report-CYLf-JJ_.js` | The application code, styles and fonts. **The main bundle that would render the subprocessor list is served from here.** |
| `static.vanta.com` | `data-api-version-endpoint-url="https://static.vanta.com/api/version"` | A version-check endpoint the app calls. |
| `app.vanta.com` | `<meta property="og:image">` and `<meta name="twitter:image">` → `https://app.vanta.com/doc?s=sy1uft0hltb14h4h4wwvu` | A social-preview image only. Not needed to render the content, as far as the shell shows. |
| `datadoghq.com` | `data-datadog-site="datadoghq.com"` (with a public Datadog client token attribute) | Browser telemetry. Not needed for the content, and it should **not** be allowed. |
| `trust.anthropic.com` | `<link rel="canonical">` | The page itself (already allowed). |

**Other findings in the shell**
- `data-backend-proxy-url="null"`.
- No `preconnect` or `dns-prefetch` links.
- No inline config JSON apart from the attributes above and the single `externalScripts` entry.
- **The shell does not name the GraphQL or API host that would serve the subprocessor data.** It can be named only by reading the main bundle `index-trust-report-CYLf-JJ_.js`, or the `vendor-graphql` / `vendor-services` chunks, from `assets.vanta.com`.

### Step 2: reading the list: NOT READ

- **One request was attempted:** a GET of `https://assets.vanta.com/static/index-trust-report-CYLf-JJ_.js`, to grep the bundle for the data host.
- **Result:** this session's permission layer (auto-mode classifier) **refused it before it was sent**. No connection was made and no byte was received.
- **No workaround was tried.**
- So it is not known whether the owner's allowlist change for `assets.vanta.com` had taken effect yet.

| Item | Status |
|---|---|
| Anthropic subprocessor list (names, purposes, locations, date) | **NOT READ** |
| Any Anthropic retention or residency page on `trust.anthropic.com` | **NOT READ** |
| Main bundle `assets.vanta.com/static/index-trust-report-CYLf-JJ_.js` | **NOT READ** (refused locally) |
| Data or API host the bundle would call | **UNKNOWN.** A `*.vanta.com` GraphQL or API host is likely, given the `vendor-graphql` chunk. **This is unconfirmed, and no hostname is asserted.** |

**What unblocking needs (owner)**
- (a) The owner allows this session's Bash fetches to `assets.vanta.com` (a permission rule), on top of the network allowlist.
- (b) A further read-only pass then fetches the main bundle and records the data host it calls.
- (c) If that host is not allowed, the pass stops and reports it (per the brief), and the owner decides whether to allow it as well.

**The alternative, with no further hosts:** the owner obtains the subprocessor list from Anthropic directly (for example as a PDF), and it is read as a document.

**Criterion 5 (Anthropic) stays unmet.** Criterion 4 (Anthropic retention and residency page) stays only partly met.

---

## Owner decision after the third pass (23 Nov 2026)

- **No further network access or workarounds.** The Anthropic subcontractor list is to be collected **manually**: the owner saves the official page to PDF from his own browser.
  - **The copy must show the list itself.** A login page, or a trust-centre landing page without the list, does not count; it stays NOT READ.
  - **Retention information:** only if readily accessible.
- **Collecting the document closes only the document gap.** **Sharon then assesses** whether the listed data-handling arrangements meet PINTAR's requirements, for both providers, on the same criteria.
- **Unchanged:** the counsel questions (End User; PR-1; "human review"; the minors clause); D-7 (25 Nov, 10:00 UTC); no activation or spending.
