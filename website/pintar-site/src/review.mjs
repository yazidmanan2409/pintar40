// The review document for the owner (English). It lives beside the site in
// review/, links into site/, and is never uploaded. It reads the same image
// list the pages use, so the asset plan cannot drift from the design.

import { PHOTOS, ROUTES, NAV_LABEL, IMAGE_KIND, imageReady, esc } from "./core.mjs";

// What each image does, and where. The prompts themselves are in images/README.md.
const IMG_PLAN = {
  P1: { message: "The situation a teacher recognises: one answer, one misunderstanding, at the desk.", use: "Home, under the hero", ratio: "3:2 generated · 2:1 desktop, 4:5 phone" },
  P2: { message: "Evidence turning into tomorrow’s lesson.", use: "Home · Capabilities; Who It’s For · Educators", ratio: "2:3 generated · 4:5" },
  P3: { message: "Learning continues beyond the classroom, with a clear next step.", use: "Who It’s For · Learners", ratio: "2:3 generated · 4:5" },
  P4: { message: "Leadership discusses patterns, on paper, together.", use: "Who It’s For · Leadership", ratio: "3:2 generated · 3:2 desktop, 4:5 phone" },
  P5: { message: "The institution as a whole, over time; a pause before Trust.", use: "Home pause; Who It’s For · The institution", ratio: "3:2 generated · 2:1 / 4:3" },
};

const DIAGRAMS = [
  ["D1", "The evidence-to-decision thread", "Home 01; Why PINTAR hero", "Learning objective → evidence → educator judgement → next teaching step, with four marks (ring, dot, diamond, arrow) and the judgement step tinted. The same marks label the hero panel and the annotated report, so the sequence is recognisable across the site.", "The organising idea, drawn once and reused, not repeated as a slogan."],
  ["D0", "Class summary (completed)", "Home hero", "One class after a Mastery Check, told along the thread: learning objectives with % of answers correct (3 questions, 24 learners), the hardest questions with counts and the option chosen, then a separate, attributed note «Written by the educator · example» with a judgement and the next step. «Sample data»; «not a screenshot».", "The visitor recognises the situation and sees how evidence becomes tomorrow’s lesson."],
  ["D2", "The learning cycle (serpentine)", "Home 02; Why PINTAR", "Seven stages, 1→4 across the top, 5→7 back along the bottom, and the return to Diagnose. Unchanged.", "The philosophy in one picture."],
  ["D12", "Annotated question report", "Features · Reports and assessment", "One question’s report (answers chosen, with counts), numbered to three notes on what the educator notices. Sample data; the reading is the educator’s.", "Shows what the educator notices and how it informs their judgement, instead of an audience table."],
  ["—", "Learning journey", "Features · Learning and teaching", "Starting point (Initial Mapping), reading order (Personal Reading Map), assigned learning and practice, the Mastery Check, the result by objective, which becomes evidence (the thread’s dot).", "Explains the learner’s path visually."],
  ["D4", "Publication and correction", "Features · Content Studio", "Draft → reviewed by a second person → approved → released → shared use by permitted institutions (learner data stays within each); return with notes; version 1 kept, version 2 the correction.", "Reviewed material, shared use and preserved versions in one diagram."],
  ["D6", "One person, several roles", "Features · Accounts; Who It’s For · Administrators", "One account; three places, each with the role that place assigned. Choosing a place does not grant anything; the assigned role does.", "Identity and access in one picture."],
  ["D9", "AI-assisted question drafts", "Features · AI-assisted drafts", "Educator chooses → AI drafts → drafts checked → educator decides (the thread’s diamond) → reviewed by a second person, approved, released.", "“AI assists. Educators decide.”"],
  ["D5", "Evidence states", "Why PINTAR · Principles", "The same figure with enough data (shown) and with too little (the product’s sentence).", "Too little evidence is not weakness."],
  ["D7", "Layered cross-section", "Home 05 (dark); Trust", "The calm surface, then seven named safeguards.", "“Calm on the surface. Rigorous underneath.”"],
  ["D8", "Versions and the future direction", "Features, at the end", "4.0 and 4.1 available; 4.5 and 5.0 future direction, with the boundaries (question health, growth journeys, adaptive paths) stated here once.", "History and the future kept out of the current offer’s way."],
];

const SECTIONS = [
  ["Home", [
    ["Hero", "«Nilai menunjukkan hasil. Pemahaman menentukan langkah berikutnya.» + D0, the completed class panel"],
    ["Under the hero", "P1, full width"],
    ["01 From evidence to decision", "D1, the thread"],
    ["02 How it works", "D2, the cycle"],
    ["03 Capabilities", "P2 + five capabilities + «AI membantu. Pendidik memutuskan.»"],
    ["04 Who it’s for", "Typographic list: four roles and foundations"],
    ["Pause", "P5"],
    ["05 Trust & Security", "Dark band + D7"],
    ["06 What comes next", "Two sentences and a link to Features · Future direction"],
    ["Closing", "Typographic demo band (the second and last demo invitation)"],
  ]],
  ["Why PINTAR", [["Hero", "Typography + D1, the thread"], ["01 The problem", "Three observations"], ["02 Philosophy", "D2 with each stage’s question"], ["03 Principles", "Four principles + D5"], ["Closing", "Demo band"]]],
  ["Features", [["Hero", "Headline, one sentence, anchor bar"], ["01 Learning and teaching", "Text left, learning journey right"], ["02 Reports and assessment", "D12 left, text right"], ["03 Content Studio", "Headline and intro, D4 full width, three short notes"], ["04 Accounts and institutions", "Text left, D6 right"], ["05 AI-assisted drafts", "Sunk band, headline «AI membantu. Pendidik memutuskan.», D9 full width"], ["06 Versions and the future direction", "D8"], ["Closing", "Demo band"]]],
  ["Who It’s For", [["Hero", "Typography + anchor bar"], ["Four roles and the institution", "P3, P2, P4, D6 (administrators), P5, each with four practical benefits"], ["Closing", "Demo band"]]],
  ["Trust & Security", [["Hero", "D7 on paper"], ["In practice", "Seven safeguards, one explanation and one example each"], ["Security questions", "Framed text"], ["Closing", "Demo band"]]],
  ["Contact · Privacy · Terms", [["Contact", "Typography + one form"], ["Privacy, Terms", "Typography, contents list, draft and «to confirm» markers"]]],
];

// Every capability the launch copy presents as available, with where it
// appears and the specification it rests on. The specification establishes
// intended scope, not implementation: each row must be confirmed against the
// scope Dr Gladys and her team accept for 4.1 before publication.
const CLAIMS = [
  ["Initial Mapping gives a starting point; the Personal Reading Map suggests an initial reading order", "Home D2, Features 01", "LRN-01, TCH-01; product strings"],
  ["Step-by-step help while learning", "Home D2, Features 01, Who · Learners", "ASM-05"],
  ["What «penguasaan» percentages represent. The site shows «% of answers correct» in its illustrations and says it is evidence, not yet a judgement of mastery; product copy elsewhere says educators see «mastery by learning objective»", "Home D0, Features 02 and D12, Why D5, Who · Educators and Leadership", "RPT-01; metric catalogue; product strings («Penguasaan per bagian»)"],
  ["Question-level reporting: how many answered correctly and which option was chosen, with counts", "Home D0, Features 02 and D12, Who · Educators", "RPT-01"],
  ["Metric-specific minimum-sample rules, and their actual behaviour: below the minimum the figure is withheld with «Belum cukup data untuk menampilkan angka ini.»", "Why D5, Features 02, Who · Leadership, Home capabilities", "EVD-01, RPT-01, metric catalogue"],
  ["Change since the Initial Mapping: whether it is supported, and under what comparison rules. Removed from the hero in this revision; not claimed anywhere now", "(none)", "Product strings (hasil.delta)"],
  ["The educator’s judgement and next step in D0 are illustrative and set apart as the educator’s own note; the site does not claim PINTAR recommends an intervention or stores such a note", "Home D0", "Out of scope: intervention planning is 5.0"],
  ["Reports without rankings", "Home, Why, Features 02, Who", "DEC-12"],
  ["One official result per attempt; a double submit gives one result; scoring rules recorded", "Features 02, Trust 03", "ASM-02, ASM-03"],
  ["Answer keys designed to stay off learners’ devices", "Trust 03", "ASM-05, SEC-03; OD-12"],
  ["A4-ready reports; class and school summaries", "Features 02, Who · Leadership", "RPT-02"],
  ["Certificates with a public check: validity, issuer, date and achievement, without the holder’s name. Confirm the released payload", "Features 02, Trust 07, Who · Learners", "CRT-01"],
  ["Shared material used by permitted institutions; institutions add their own; sources and permissions recorded", "Features 03 D4, Who · Institution", "STU-01, STU-02, DEC-04/05; OD-20"],
  ["Second-person review before release; released versions kept; corrections become new versions", "Features 03 D4, Trust 04", "STU-04, STU-05, DEC-06"],
  ["Per-question history, including educators’ misconception notes (4.1)", "Features 03", "AIQ-02"],
  ["AI-assisted multiple-choice drafts: permitted source and objective, checks, educator decides, second-person review before release; no learner personal data; manual fallback (4.1)", "Home capabilities, Features 05 D9", "AIQ-01; OD-16"],
  ["Continuing on another device with a single-use code (4.1)", "Features 01", "CNT-01; OD-16"],
  ["Accounts created by the institution, with roles assigned in each place", "Features 04", "ACC-01"],
  ["Access wording: choosing a place does not itself grant permission; the role assigned in that place governs access; teaching access at A does not apply at B", "Features 04 D6, Who · Administrators, Trust 01", "CTX-01, PER-01"],
  ["Class cards for signing in to learn; replaceable when lost", "Features 04, Who · Administrators", "DEC-07, CRD-01"],
  ["Class changes, moving up, transfers and retirement without losing records; the end of someone’s access handled deliberately", "Home, Features 04, Trust 05, Who", "PRG-01, TRF-01/02, STF-01, REV-01; OD-02, OD-08"],
  ["Institutional separation: logical separation within one system; shared material does not give another institution access to learner data", "Features 03 D4, Trust 02, Who · Institution", "SEC-01"],
  ["Consequential actions recorded; a leader opening one learner’s record is recorded", "Trust 06, Who · Leadership", "AUD-01"],
  ["Professional-development participation kept apart from academic results", "Features 04, D6, Who · Educators", "PDP-01"],
  ["Classes, groups and periods at institutional scale", "Features 01, Who · Administrators", "ADM-01"],
  ["A guided demonstration tailored to the visitor’s role, with sample data. Resolve demonstration readiness internally before publication", "Demo bands, Contact", "To confirm: demonstration environment"],
];

const UNRESOLVED = [
  ["Accepted 4.1 scope and the date of acceptance", "Dr Gladys and her team’s acceptance record", "Launch prerequisite; then every row of the claims checklist"],
  ["What «penguasaan» percentages represent, and the metric minimum-sample rules", "Metric catalogue and the accepted build", "D0, D5, D12, Features 02"],
  ["Whether change since the Initial Mapping is reported, and how", "Product lead; accepted build", "Not claimed now; could return to D0"],
  ["Certificate verification payload as released", "Release evidence (CRT-01)", "Trust 07, Features 02"],
  ["Demonstration environment and readiness", "Product lead", "Demo copy and Contact"],
  ["Ready-to-use material by subject and level, and source licences", "Content owner (OD-20)", "Features 03 (kept general)"],
  ["Use of AI-generated illustrations at launch, or replacement with licensed or commissioned photography (with consent)", "Owner", "P1–P5"],
  ["Registered address and NIB", "Company deed and NIB (OSS)", "Privacy §1"],
  ["Hosting provider, its log contents and retention", "Hosting account or contract", "Privacy §3, §6"],
  ["Email provider for pintarselalu.com, data location, any overseas transfer", "Email service contract", "Privacy §6"],
  ["How long the mailbox keeps email", "Company retention decision", "Privacy §7"],
  ["Data protection officer (UU PDP Art. 53), if required; PSE registration", "Legal counsel", "Privacy §11; launch"],
  ["Trademark status of PINTAR", "DJKI records", "Terms §2"],
  ["Production domain, HTTPS, daily cleanup scheduled, mail delivery confirmed", "Hosting configuration; a test message", "Privacy §7; contact form"],
  ["Effective dates of the legal pages", "Owner, after legal review", "Privacy, Terms"],
  ["Repository history: this lane predates main’s rewrite", "Owner’s approval to move the work onto the new main", "Repository"],
];

export default function review() {
  const link = (key, lang) => `../site/${ROUTES[key][lang]}`;
  const pages = ["home", "why", "features", "audiences", "trust", "contact", "privacy", "terms"];
  const LABEL = { ...Object.fromEntries(Object.entries(NAV_LABEL).map(([k, v]) => [k, v.en])), home: "Home" };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Website Review 3 — PINTAR public website</title>
<link rel="stylesheet" href="../site/assets/css/site.css">
<style>
  .rv { padding-block: 5rem 8rem; }
  .rv section { padding-block: 3.5rem; border-top: 1px solid var(--ink); }
  .rv h2 { font: 600 2rem/1.1 var(--sans); letter-spacing: -0.02em; margin-bottom: 1.25rem; }
  .rv h3 { font: 600 1.0625rem/1.4 var(--sans); margin: 2rem 0 .75rem; }
  .rv p, .rv li { color: var(--ink-2); max-width: 48rem; }
  .rv p + p { margin-top: .75rem; }
  .rv ul.dot { display: grid; gap: .5rem; } .rv ul.dot li { padding-left: 1.25rem; position: relative; } .rv ul.dot li::before { content: "—"; position: absolute; left: 0; color: var(--teal); }
  .rv table { width: 100%; border-collapse: collapse; font-size: .9375rem; margin-top: 1rem; }
  .rv th, .rv td { text-align: left; vertical-align: top; padding: .65rem .75rem .65rem 0; border-bottom: 1px solid var(--line); }
  .rv th { font-weight: 600; color: var(--ink); border-bottom-color: var(--ink); }
  .rv td { color: var(--ink-2); }
  .rv .wrapx { overflow-x: auto; }
  .rv .pages { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0; border-top: 1px solid var(--line); }
  .rv .pages div { padding: 1rem 0; border-bottom: 1px solid var(--line); }
  .rv .pages a { margin-right: 1rem; }
  .rv code { font-size: .875rem; }
  .rv .st { font: 500 .875rem/1.3 var(--mono); color: var(--teal); white-space: nowrap; }
</style>
</head>
<body>
<main class="wrap rv" id="isi">
  <p class="label">PINTAR public website · review build 3 · launch wording for PINTAR 4.1</p>
  <h1 class="h1">Understand <em>what to teach next.</em></h1>
  <p class="lead" style="margin-top:1.5rem">This build carries the intended launch wording for when PINTAR 4.1 has been accepted by Dr Gladys and her team. Preparing the wording does not mean acceptance has occurred. Every page is <code>noindex</code> and carries a review strip, and nothing has been deployed. Publication needs the accepted scope, public claims that match it, and the owner’s explicit authorisation.</p>

  <section>
    <h2>1. What changed in this revision</h2>
    <h3>The story</h3>
    <ul class="dot">
      <li><b>One organising idea:</b> learning objective → evidence → educator judgement → next teaching step. It is drawn once as a thread with four marks, and the same marks label the hero panel and the annotated report, so the sequence is recognisable without being repeated as a slogan.</li>
      <li><b>Homepage opening:</b> «Nilai menunjukkan hasil. Pemahaman menentukan langkah berikutnya.» / «A score shows the result. Understanding shows what to teach next.» The lead is one simple sentence; the class panel carries the detail.</li>
      <li><b>The class panel is complete:</b> learning objectives with «% of answers correct» from 3 questions and 24 learners, said to be evidence and not yet a judgement of mastery; the hardest questions with counts and the option most chosen; then a separate note, «Written by the educator · example», with a judgement and the next step. «Change since the Initial Mapping» is removed until its support is confirmed. The panel does not suggest PINTAR recommends an intervention.</li>
      <li><b>One current product:</b> the availability chips and A/B letters are gone from Features and the homepage. «New in 4.1» is a small tag on three items. Versions and the future direction sit together at the end of Features; the homepage has two sentences and a link instead of the roadmap.</li>
    </ul>
    <h3>The Features page, redesigned</h3>
    <ul class="dot">
      <li><b>Organised by what people accomplish:</b> learning and teaching, reports and assessment, the Content Studio, accounts and institutions, AI-assisted drafts, then versions and what comes next. An anchor bar replaces the status legend.</li>
      <li><b>The reading pattern of Who It’s For:</b> a clear label, a headline at a sensible size, the explanation directly under it, four well-spaced benefit rows at body size, and one focal visual. The small two-column notes and the detached intro paragraphs are gone.</li>
      <li><b>Variety within one system:</b> journey on the right; the annotated report on the left; the publication diagram full width with three short notes; the roles diagram on the right; the AI workflow full width in a sunk band under «AI membantu. Pendidik memutuskan.» On phones every section reads headline, text, then visual.</li>
      <li><b>Each visual does one job:</b> the learning journey shows the starting point, assigned learning, practice and assessment; the annotated report shows what an educator notices instead of an audience table; one publication diagram covers review, shared use and preserved versions; the roles diagram shows that access comes from the role assigned in each place.</li>
    </ul>
    <h3>Copy, both languages</h3>
    <ul class="dot">
      <li><b>No internal-review language in public copy:</b> «not part of 4.0», «not promised here», «not an audit report», «ready to show at the time» and the repeated «no dates or promises» are gone. The one future boundary sits in the versions section; the rest is on the checklist below. A check now fails if any of these return.</li>
      <li><b>Demonstrations:</b> «a guided demonstration tailored to your role, using sample data».</li>
      <li><b>Simplified phrasing:</b> «what can be concluded», «which figures the evidence supports», «mastery by part», «the evidence minimum», «the usual approval» and «removed access» are rewritten.</li>
      <li><b>Institutions are no longer a person’s role:</b> Who It’s For now covers four roles and «the institution as a whole»; the homepage lists «foundations and governing bodies».</li>
      <li><b>Terms</b> now names Inter and IBM Plex Mono, and explains that AI-generated illustrations are not photographs of PINTAR users or partner institutions.</li>
    </ul>
    <h3>Images</h3>
    <ul class="dot">
      <li><b>Five images instead of eight,</b> each placed where it explains the situation: the classroom, the staff room, studying at home, a leadership meeting, the school in the morning. Why PINTAR and the demo bands now use the thread and typography instead of a photograph; administrators get the roles diagram.</li>
      <li><b>Every image declares its source:</b> AI-generated illustration, licensed photograph, or product screenshot. Generated images carry a visible «Ilustrasi, dibuat dengan AI» label and are never presented as PINTAR users. No product screenshot is used or faked.</li>
      <li><b>Drop-in:</b> save an image as <code>images/P1.png</code> etc., run <code>node images.mjs</code> (WebP at 640–2400 px, metadata removed) and <code>node build.mjs</code>.</li>
    </ul>
  </section>

  <section>
    <h2>2. Site map</h2>
    <div class="pages">${pages.map((k) => `<div><b>${LABEL[k]}</b><br><a class="link" href="${link(k, "id")}">ID /${ROUTES[k].id}</a> <a class="link" href="${link(k, "en")}">EN /${ROUTES[k].en}</a></div>`).join("")}</div>
  </section>

  <section>
    <h2>3. Launch claims to confirm against the accepted 4.1 scope</h2>
    <p>This is an internal checklist and is never published. Each claim the launch copy presents as available is listed with where it appears and the master-specification reference behind it. The specification sets intended scope, not proof of implementation or acceptance. Resolve each row against the scope Dr Gladys and her team accept, and change or remove any claim that differs, before publication.</p>
    <div class="wrapx"><table><thead><tr><th>#</th><th>Claim or wording to confirm</th><th>Where</th><th>Specification</th><th>Confirmed</th></tr></thead><tbody>
      ${CLAIMS.map(([c, w, r], i) => `<tr><td>${i + 1}</td><td>${c}</td><td>${w}</td><td>${r}</td><td>☐</td></tr>`).join("")}
    </tbody></table></div>
  </section>

  <section>
    <h2>4. Images and explanatory graphics</h2>
    <h3>Images (five; prompts in <code>images/README.md</code>)</h3>
    <p>All five are planned as AI-generated illustrations in one documentary style: muted, natural light, a 35 mm rangefinder look, nobody looking at the camera, nothing legible. Each is labelled as an illustration wherever it appears. Before publication, decide whether to keep them or replace any with licensed or commissioned photography, with consent.</p>
    <div class="wrapx"><table><thead><tr><th>#</th><th>Image</th><th>What it shows</th><th>Its job</th><th>Where</th><th>Format</th><th>Source</th><th>Status</th></tr></thead><tbody>
      ${Object.entries(PHOTOS).map(([id, p]) => `<tr><td><b>${id}</b></td><td>${esc(p.name_en)}</td><td>${esc(p.en)}</td><td>${esc(IMG_PLAN[id].message)}</td><td>${esc(IMG_PLAN[id].use)}</td><td>${IMG_PLAN[id].ratio}</td><td>${IMAGE_KIND[p.kind].en}</td><td class="st">${imageReady(id) ? "In the build" : "Prompt ready · awaiting generation"}</td></tr>`).join("")}
    </tbody></table></div>
    <h3>Explanatory graphics (native HTML and SVG, complete)</h3>
    <div class="wrapx"><table><thead><tr><th>#</th><th>Graphic</th><th>Where</th><th>What it shows</th><th>Why it is there</th></tr></thead><tbody>
      ${DIAGRAMS.map(([id, n, w, s, y]) => `<tr><td><b>${id}</b></td><td>${n}</td><td>${w}</td><td>${s}</td><td>${y}</td></tr>`).join("")}
    </tbody></table></div>
    <h3>Section by section</h3>
    <div class="wrapx"><table><thead><tr><th>Page</th><th>Section</th><th>Visual treatment</th></tr></thead><tbody>
      ${SECTIONS.map(([pg, rows]) => rows.map(([s, v], i) => `<tr><td>${i ? "" : `<b>${pg}</b>`}</td><td>${s}</td><td>${v}</td></tr>`).join("")).join("")}
    </tbody></table></div>
    <h3>Product screenshots</h3>
    <p>None are used, and none are simulated. Once 4.1 is accepted, an authentic excerpt of a question report from the accepted product, with sample data and labelled as a screenshot, could replace D12 on Features.</p>
  </section>

  <section>
    <h2>5. Verified in this build</h2>
    <ul class="dot">
      <li><b>Reading order:</b> on Features, every section’s headline and text come before its visual in the document, and sit above it at 390 px; at 1440 px the compositions alternate. The cycle keeps stages 1–7 then the return, as a serpentine at 1440 px and one column at 390 px.</li>
      <li><b>Body-text comfort:</b> introductions and benefit rows are at least 15 px with a line height of at least 1.4 and no wider than 40 em, on every page at 390 and 1440 px.</li>
      <li><b>Diagram legibility:</b> no text under 14 px anywhere; no diagram overflows its column at 320, 390, 768, 1024 or 1440 px; contrast is measured on every page.</li>
      <li><b>Story and accuracy:</b> the hero headline; the panel’s «sample data», what each percentage measures, the learner count, and percentage correct distinguished from mastery; the educator’s decision set apart and attributed; the thread on Home and Why; no availability chips or A/B letters on Features; versions last; no internal-review phrasing on any page; every image declares its source.</li>
      <li><b>Unchanged and still checked:</b> language switching on all 16 pages (header and footer); the contact form (delivery, double submit, failed delivery and a real retry, moderation in both languages without echo, flagged reports, honeypot, rate limit, origin, header injection, no JavaScript); the footer and the two demo placements; 47 moderation cases.</li>
      <li><b>Run:</b> <code>node verify/check.mjs</code>. The new checks were proved able to fail by planting each regression: internal-review wording, the educator’s note merged into the report, and a visual placed before its headline.</li>
    </ul>
  </section>

  <section>
    <h2>6. Unresolved facts, and the source that resolves each</h2>
    <div class="wrapx"><table><thead><tr><th>Fact</th><th>Source needed</th><th>Affects</th></tr></thead><tbody>
      ${UNRESOLVED.map(([f, src, a]) => `<tr><td>${f}</td><td>${src}</td><td>${a}</td></tr>`).join("")}
    </tbody></table></div>
  </section>
</main>
</body>
</html>
`;
}
