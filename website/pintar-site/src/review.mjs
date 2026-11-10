// The review document for the owner (English). It lives beside the site in
// review/, links into site/, and is never uploaded. It reads the same photo
// list the pages use, so the asset plan cannot drift from the design.

import { PHOTOS, ROUTES, NAV_LABEL, esc } from "./core.mjs";

const PH_PLAN = {
  P1: { subject: "Teacher kneeling at two learners’ desk, reading a worksheet with them. State SMP, white-and-navy uniforms, morning daylight through louvred windows.",
    composition: "Eye level, 35 mm, people in the right two-thirds; the left third quiet. No faces to camera.", message: "PINTAR starts with the teacher understanding a learner, not with software.",
    use: "Home hero", source: "Commission" },
  P2: { subject: "SMA learner studying on a home veranda, notebook beside a phone, late-afternoon light.", composition: "Portrait, three-quarter view, hands and notebook in focus.",
    message: "Learning continues beyond the classroom, with a clear next step.", use: "Who It’s For · Learners", source: "Commission" },
  P3: { subject: "Teacher in the staff room after lessons, reviewing results on a laptop beside a stack of exercise books.", composition: "Portrait, over-the-shoulder; the screen deliberately unreadable.",
    message: "Evidence that helps tomorrow’s lesson.", use: "Home · Capabilities; Who It’s For · Educators", source: "Commission" },
  P4: { subject: "Principal and deputy at a meeting table discussing a printed A4 school summary.", composition: "Landscape, table-height, the paper central and blurred.",
    message: "Leadership sees patterns and discusses them.", use: "Who It’s For · Leadership", source: "Commission" },
  P5: { subject: "School operator in the administration office preparing class cards at the start of the year.", composition: "Portrait, hands and cards in focus.",
    message: "Administration done carefully, without becoming educational decision-making.", use: "Who It’s For · Administrators", source: "Commission" },
  P6: { subject: "School courtyard in the morning before lessons; learners walking to class, shot from a distance.", composition: "Wide, high vantage, no recognisable faces.",
    message: "The institution as a whole, over time.", use: "Home · pause; Who It’s For · Institutions", source: "Commission, or the client’s own school with consent" },
  P7: { subject: "Close detail of a learner’s hand writing an answer on a printed initial-mapping sheet.", composition: "Macro, wide crop, shallow depth; the sheet’s text out of focus.",
    message: "Diagnosis begins with what a learner already knows.", use: "Why PINTAR · hero", source: "Commission" },
  P8: { subject: "A PINTAR team member guiding a deputy principal through a laptop at a school table.", composition: "Landscape, both people in profile, screen unreadable.",
    message: "A demonstration is a guided conversation, not a sales pitch.", use: "Demo band on every page", source: "Commission" },
};

const DIAGRAMS = [
  ["D0", "Class summary (concept illustration)", "Home · hero", "One class after a Mastery Check: mastery by part (by learning objective), the hardest questions with counts, and a figure held back because there is not enough data. Labelled «Ilustrasi · data rekaan».", "The proposition made concrete in the first screen, in the product’s own metric names."],
  ["D1", "Connects", "Home · below the hero photograph", "Teaching · Learning · Assessment · Decisions, joined by “evidence you can trace”.", "The proposition in four words."],
  ["D2", "The learning cycle (serpentine)", "Home · How it works; Why PINTAR (with questions)", "Seven stages: 1→4 across the top, 5→7 back along the bottom, and a distinct return panel under stage 1 pointing up to Diagnose. Document order is 1–7 then the return; phones show one column in that order.", "The philosophy in one picture, without inventing an eighth stage."],
  ["D5", "Evidence states (concept illustration)", "Why PINTAR · Principles", "Average mastery on the Mastery Check, from 22 of 24 learners, meets the metric’s minimum sample and is shown; with 4 of 24 it is below the minimum and the report shows the product’s own sentence instead. No threshold number is given, because none is published.", "Too little evidence is not weakness, shown rather than told."],
  ["D3", "Shared material", "Features · C", "One piece of shared material, two institutions, each adding its own, with learner data visible only within each.", "Sharing without leaking learner data."],
  ["D4", "Release and correction", "Features · C", "Draft → second-person review → approved → released; send-back; version 1 kept, version 2 the correction.", "Why results stay explainable."],
  ["D11", "Who sees what", "Features · B", "Learners, educators, leadership and certificate checkers: what each sees, and what they do not.", "Reports without rankings or over-exposure."],
  ["D6", "One person, several roles", "Features · D", "Teaching at School A, managing at School B, learning in a professional-development programme.", "Identity and access in one picture."],
  ["D7", "Layered cross-section", "Home · Trust (dark); Trust & Security", "The calm surface, then seven named layers. Each is explained once, with one example, in the list below it.", "“Calm on the surface. Rigorous underneath.”"],
  ["D8", "Today and what comes next", "Home", "4.0 and 4.1: available. 4.5 and 5.0: future direction, without dates.", "An honest future, kept brief."],
  ["D9", "AI-assisted question drafts", "Features · New in 4.1", "Educator chooses source and objective → AI drafts → drafts checked → educator decides (emphasised) → the usual second-person review, approval and release.", "“AI assists. Educators decide.”"],
  ["D10", "Continue on another device", "Features · New in 4.1", "First device → short-lived single-use code → second device; one device saves answers at a time.", "Continuity without a shared password."],
];

const SECTIONS = [
  ["Home", [
    ["Hero", "Sans headline with the second clause in teal, lead, «See how it works» + D0 class panel"],
    ["Below the hero", "P1 (21:9 / 4:5) + D1"],
    ["01 How it works", "D2 serpentine cycle"],
    ["02 Capabilities", "P3 + five capabilities (incl. AI-assisted drafts), marked Available"],
    ["03 Who it’s for", "Typographic list of five roles"],
    ["Pause", "P6"],
    ["04 Trust & Security", "Dark band + D7 names"],
    ["05 Today and what comes next", "D8 + «AI assists. Educators decide.»"],
    ["Closing", "Request a demo + P8 (the second and last demo invitation; the first is the header)"],
  ]],
  ["Why PINTAR", [["Hero", "Typography + P7"], ["01 The problem", "Three observations"], ["02 Philosophy", "D2 with each stage’s question"], ["03 Principles", "Four principles + D5"], ["Closing", "Demo band + P8"]]],
  ["Features", [["Hero", "Available / Future direction legend"], ["A Learning and teaching", "Journey strip"], ["B Reports and assessment", "D11"], ["C Material", "D3 + D4"], ["D Accounts and institutions", "D6"], ["New in 4.1", "D9 + D10"], ["Future direction", "4.5, 5.0, beyond: three short columns"], ["Closing", "Demo band + P8"]]],
  ["Who It’s For", [["Hero", "Typography + anchor bar"], ["Five roles", "P2, P3, P4, P5, P6 with four practical benefits each"], ["Closing", "Demo band + P8"]]],
  ["Trust & Security", [["Hero", "D7 on paper"], ["In practice", "Seven safeguards, one explanation and one example each"], ["What we do not claim", "Framed text"], ["Closing", "Demo band + P8"]]],
  ["Contact · Privacy · Terms", [["Contact", "Typography + one form (subject preselected from demo buttons)"], ["Privacy, Terms", "Typography, contents list, draft and «to confirm» markers"]]],
];

// Every capability the launch copy presents as available, with where it
// appears and the specification it rests on. The specification establishes
// intended scope, not implementation: each row must be confirmed against the
// scope Dr Gladys and her team accept for 4.1 before publication.
const CLAIMS = [
  ["Initial Mapping gives a starting point; the Personal Reading Map gives an initial reading order (not continuous adaptation)", "Home D2, Features A", "LRN-01, TCH-01; product strings"],
  ["Step-by-step help while learning, before the Mastery Check", "Home D2, Features A, Who · Learners", "ASM-05"],
  ["Educators see mastery by learning objective («Penguasaan per bagian») and the hardest questions with counts and chosen options", "Home hero D0, Home capabilities, Features B, Who · Educators", "RPT-01; product strings"],
  ["A figure is withheld below its metric’s minimum sample, with «Belum cukup data untuk menampilkan angka ini.»", "Home D0, Why D5, Features B", "EVD-01, RPT-01, metric catalogue"],
  ["«Change since the Initial Mapping» is a reported figure", "Home D0", "Product strings (hasil.delta)"],
  ["Reports without rankings", "Home, Why, Features B, Who", "DEC-12"],
  ["One official result per attempt; a double submit gives one result; scoring rules recorded and recalculable", "Features B, Trust 03", "ASM-02, ASM-03"],
  ["Answer keys designed to stay off learners’ devices", "Trust 03", "ASM-05, SEC-03; OD-12"],
  ["A4-ready reports; class and school summaries", "Features B, Who · Leadership", "RPT-02"],
  ["Certificates with a public check showing validity, issuer, date and achievement, without the holder’s name", "Features B, Trust 07, D11", "CRT-01 (payload is a reconciliation item)"],
  ["Digital Card", "Features B", "CRD-01"],
  ["Shared material used by permitted institutions; institutions add their own; sources and permissions recorded", "Features C, D3, Who · Institutions", "STU-01, STU-02, DEC-04/05; OD-20"],
  ["Second-person review before release; released versions kept; corrections become new versions", "Features C, D4, Trust 04", "STU-04, STU-05, DEC-06"],
  ["Per-question history, including educators’ misconception notes (4.1)", "Features · New in 4.1", "AIQ-02"],
  ["AI-assisted multiple-choice drafts: permitted source and objective, checks, educator decides, usual approval; no learner personal data; manual fallback (4.1)", "Home capabilities, Features D9", "AIQ-01; OD-16"],
  ["Continuing on another device with a short-lived single-use code; one device saves at a time (4.1)", "Features D10, roadmap", "CNT-01; OD-16"],
  ["Accounts created by the institution; no self sign-up", "Features D", "ACC-01"],
  ["Class cards for learners, for learning only; replaceable when lost", "Features D, Who · Administrators", "DEC-07, CRD-01"],
  ["Class changes, moving up, transfers and retirement without losing records", "Home, Features D, Trust 05, Who", "PRG-01, TRF-01/02, STF-01; OD-02, OD-08"],
  ["Removed access designed to take effect from the next request", "Features D", "REV-01 (retained checks)"],
  ["Each action checked against the role and place; teaching access at A does not apply at B", "Features D6, Trust 01", "CTX-01, PER-01"],
  ["Institutions’ data logically separated within one system", "Trust 02, Who · Institutions", "SEC-01"],
  ["Consequential actions recorded; a leader opening one learner’s record is recorded", "Trust 06, Who · Leadership", "AUD-01"],
  ["Professional-development participation kept apart from academic results", "Features A, Who · Educators", "PDP-01"],
  ["Classes, groups and periods at institutional scale", "Features A, Who · Administrators", "ADM-01"],
  ["A guided demonstration with sample data, of the parts ready to show", "Demo bands, Contact", "To confirm: demonstration environment"],
];

const UNRESOLVED = [
  ["Accepted 4.1 scope and the date of acceptance", "Dr Gladys and her team’s acceptance record", "Launch prerequisite; then reconcile every row of the claims checklist"],
  ["What a guided demonstration can show, and in which environment", "Product lead", "Demo copy and Contact"],
  ["Ready-to-use material by subject and level, and source licences", "Content owner (OD-20)", "Features C"],
  ["Certificate verification payload as released", "Release evidence (CRT-01)", "Trust 07, D11"],
  ["Registered address and NIB", "Company deed and NIB (OSS)", "Privacy §1"],
  ["Hosting provider, its log contents and retention", "Hosting account or contract", "Privacy §3, §6"],
  ["Email provider for pintarselalu.com, data location, any overseas transfer", "Email service contract", "Privacy §6"],
  ["How long the mailbox keeps email", "Company retention decision", "Privacy §7"],
  ["Data protection officer (UU PDP Art. 53), if required", "Legal counsel", "Privacy §11"],
  ["PSE (private electronic system operator) registration", "Legal counsel", "Launch"],
  ["Trademark status of PINTAR", "DJKI records", "Terms §2"],
  ["Production HTTPS and domain", "Hosting configuration", "Privacy §7, indexing, hreflang"],
  ["Daily cleanup scheduled on the server", "Server cron (server/cleanup.php)", "Privacy §7 retention wording"],
  ["Mail delivery confirmed (SPF/DKIM, or SMTP)", "A test message in the real inbox", "Contact form"],
  ["Effective dates of the legal pages", "Owner, after legal review", "Privacy, Terms"],
  ["Terminology decision (school vs universal terms)", "OD-11", "All copy"],
  ["Photography commission and consent (minors)", "Owner", "All photographs"],
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
<title>Website Review 2 — PINTAR public website, launch wording</title>
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
  .rv .decision { border-left: 3px solid var(--teal); padding: .25rem 0 .25rem 1rem; margin-top: 1rem; }
  .rv .decision b { color: var(--ink); }
  .rv code { font-size: .875rem; }
</style>
</head>
<body>
<main class="wrap rv" id="isi">
  <p class="label">PINTAR public website · review build 2 · launch wording for PINTAR 4.1</p>
  <h1 class="h1">The revised website, <em>still unpublished.</em></h1>
  <p class="lead" style="margin-top:1.5rem">This build carries the intended launch wording for when PINTAR 4.1 has been accepted by Dr Gladys and her team. Preparing the wording does not mean acceptance has occurred. Every page is <code>noindex</code> and carries a review strip, and nothing has been deployed. Production deployment still needs the owner’s explicit authorisation.</p>

  <section>
    <h2>1. What changed in this revision</h2>
    <h3>Visual</h3>
    <ul class="dot">
      <li><b>Type, after screenshot 4:</b> confident Inter Display headlines with one clause in the brand teal, Inter for reading, IBM Plex Mono for small labels. Newsreader is retired, and first-visit fonts fall from about 170 KB to about 88 KB.</li>
      <li><b>A concrete hero:</b> the headline now sits beside a concept panel of one class after a Mastery Check (D0), labelled as an illustration with invented data.</li>
      <li><b>The cycle is a serpentine</b> in the arrangement of screenshot 2: stages 1→4 across the top, 5→7 back along the bottom, and a distinct return panel pointing up to Diagnose. It has seven stages, with no eighth invented. On phones it is one column in the same order.</li>
      <li><b>Lighter footer:</b> the wordmark and its line, the pages, then one base row with ©&nbsp;PT ZAYD PINTAR SELALU (ZPS), the email, Contact / Privacy / Terms and ID | EN. The language and company columns are gone.</li>
      <li><b>Two demo invitations on the homepage:</b> the header and the closing section. The hero keeps «Lihat cara kerjanya». Both use the one contact form, with the demo subject preselected.</li>
    </ul>
    <h3>Copy, both languages</h3>
    <ul class="dot">
      <li><b>Launch wording:</b> 4.0 and 4.1 are presented as available. 4.5, 5.0 and beyond are «Arah ke depan / Future direction», without dates. Every former «verifikasi rilis / direncanakan» label is gone, and a check enforces that.</li>
      <li><b>What educators see and do comes first;</b> governance follows. Jargon is cut: «tergovernansi», «kanonik» (now «materi bersama»), «pemutar», «teaching grant». So are the awkward English phrases and «anak».</li>
      <li><b>Each page has one job:</b> Home introduces, Why explains the philosophy, Features gives capabilities and boundaries, Who It’s For gives benefits, Trust gives safeguards. The comparison with other LMS, library and exam platforms is removed.</li>
      <li><b>Trust</b> now explains each of the seven safeguards once, with one example. Separation is described as logical separation within one system. Certificate verification states what it shows and what it does not.</li>
      <li><b>The evidence illustration</b> says what the percentage measures (average mastery on the Mastery Check). It uses the product’s rule, a minimum sample per metric in the metric catalogue, without inventing a number, and the product’s own sentence for withheld figures.</li>
      <li><b>Product names</b> follow the application: Pemetaan Awal, Peta Bacaan Personal, Uji Penguasaan in Indonesian; the application’s English names Initial Mapping, Personal Reading Map, Mastery Check in English. Quiet Intelligence stays as it is.</li>
      <li><b>Boundaries stated where a reader could blur them:</b>
        <ul class="dot">
          <li>question reporting now, question health in 4.5;</li>
          <li>professional-development participation now, growth journeys in 5.0;</li>
          <li>released versions in 4.0, per-question history in 4.1;</li>
          <li>an initial reading order, not continuous adaptation;</li>
          <li>Content Studio capability, not a promise of ready material;</li>
          <li>a demo of the parts ready to show.</li>
        </ul></li>
      <li><b>The AI workflow</b> now has five steps, as AIQ-01 sets out: the educator chooses a permitted source and objective; AI drafts; the drafts are checked; the educator decides; then the usual second-person review, approval and release. The retained line is «AI membantu. Pendidik memutuskan.»</li>
    </ul>
    <h3>Functional and privacy</h3>
    <ul class="dot">
      <li><b>Fixed a false «sent».</b> A message whose delivery failed was remembered as a duplicate, so the retry was wrongly confirmed. Messages are now remembered only after delivery. A check proves the retry is really sent.</li>
      <li><b>Deletion as it really happens.</b> Expired security records are deleted on each use of the form and by <code>server/cleanup.php</code>, a daily job to schedule. The privacy policy says «deleted at the next cleanup», not an exact deadline.</li>
      <li><b>Privacy policy corrected:</b>
        <ul class="dot">
          <li>it now distinguishes the form (no copy kept) from the mailbox (where messages live);</li>
          <li>it counts the security records and the hosting logs in the summary;</li>
          <li>it calls the IP hash a pseudonym, not anonymisation, and separates it from the host’s raw logs;</li>
          <li>it separates assessment provenance from personal-data retention.</li>
        </ul></li>
      <li><b>Unchanged:</b> spam protection, rate limits and bilingual moderation; human review of ambiguous messages; the two prescribed rejection messages.</li>
    </ul>
  </section>

  <section>
    <h2>2. Site map</h2>
    <div class="pages">${pages.map((k) => `<div><b>${LABEL[k]}</b><br><a class="link" href="${link(k, "id")}">ID /${ROUTES[k].id}</a> <a class="link" href="${link(k, "en")}">EN /${ROUTES[k].en}</a></div>`).join("")}</div>
  </section>

  <section>
    <h2>3. Launch claims to confirm against the accepted 4.1 scope</h2>
    <p>This is an internal checklist and is never published. Each claim the launch copy presents as available is listed with where it appears and the master-specification reference behind it. The specification sets intended scope, not proof of implementation or acceptance. Resolve each row against the scope Dr Gladys and her team accept, and change or remove any claim that differs, before publication.</p>
    <div class="wrapx"><table><thead><tr><th>#</th><th>Claim (as available at launch)</th><th>Where</th><th>Specification</th><th>Confirmed</th></tr></thead><tbody>
      ${CLAIMS.map(([c, w, r], i) => `<tr><td>${i + 1}</td><td>${c}</td><td>${w}</td><td>${r}</td><td>☐</td></tr>`).join("")}
    </tbody></table></div>
  </section>


  <section>
    <h2>4. Visual assets, mapped to sections</h2>
    <h3>Photographs (eight, reused across pages; none exist yet)</h3>
    <p>I recommend one commissioned documentary shoot over two or three days, across at least two regions (for example Java and Sulawesi or Nusa Tenggara). It should use natural light, real schools, real staff and learners in their own uniforms, with nothing posed to camera. Stock imagery of “Indonesian classrooms” is usually generic, and AI-generated people are ruled out. Until the shoot, each photograph is a correctly proportioned placeholder whose caption is its brief.</p>
    <div class="wrapx"><table><thead><tr><th>#</th><th>Subject</th><th>Composition</th><th>Message</th><th>Ratio (desktop / phone)</th><th>Used in</th><th>Source</th></tr></thead><tbody>
      ${Object.entries(PHOTOS).map(([id, p]) => `<tr><td><b>${id}</b></td><td>${esc(PH_PLAN[id].subject)}</td><td>${esc(PH_PLAN[id].composition)}</td><td>${esc(PH_PLAN[id].message)}</td><td>${p.r} / ${p.rm}</td><td>${esc(PH_PLAN[id].use)}</td><td>${esc(PH_PLAN[id].source)}</td></tr>`).join("")}
    </tbody></table></div>
    <p style="margin-top:1rem">Delivery: 2400 px on the long edge, then exported as AVIF and WebP at 640, 1024, 1600 and 2400 px with <code>srcset</code> and <code>loading="lazy"</code> below the fold. Each placeholder already carries the final image’s alternative text.</p>
    <h3>Diagrams and infographics (native HTML and SVG, built)</h3>
    <div class="wrapx"><table><thead><tr><th>#</th><th>Diagram</th><th>Where</th><th>What it shows</th><th>Why it is there</th></tr></thead><tbody>
      ${DIAGRAMS.map(([id, n, w, s, y]) => `<tr><td><b>${id}</b></td><td>${n}</td><td>${w}</td><td>${s}</td><td>${y}</td></tr>`).join("")}
    </tbody></table></div>
    <h3>Section by section</h3>
    <div class="wrapx"><table><thead><tr><th>Page</th><th>Section</th><th>Visual treatment</th></tr></thead><tbody>
      ${SECTIONS.map(([pg, rows]) => rows.map(([s, v], i) => `<tr><td>${i ? "" : `<b>${pg}</b>`}</td><td>${s}</td><td>${v}</td></tr>`).join("")).join("")}
    </tbody></table></div>
    <h3>Product screenshots</h3>
    <p>Once 4.1 is accepted, authentic screenshots of the real product, with sample data and clearly labelled, can replace one or two concept illustrations (for example D0 on the homepage). None are used now, and none should be until the accepted build exists.</p>
  </section>
  <section>
    <h2>5. Verified in this build</h2>
    <ul class="dot">
      <li><b>Reading order:</b> on desktop the cycle is laid out 1→4, then 5→7 right to left, then the return under stage 1. The document order is 1–7, then the return. At 390 px it is one column in that order.</li>
      <li><b>Language switching:</b> on all 16 pages, both switches (header and footer) lead to the same page in the other language.</li>
      <li><b>Contact form:</b> delivered; double submit not resent; failed delivery reported, and the retry really sent; abuse refused with the prescribed wording in both languages and never echoed; reports flagged «PERLU DITINJAU» and delivered; honeypot; rate limit; foreign origin; header injection; works without JavaScript.</li>
      <li><b>Footer and demo placements:</b> no language or company column; ©, email, Contact / Privacy / Terms, ID | EN; no footer demo link; on the homepage, only the header and closing demo invitations.</li>
      <li><b>Launch wording:</b> no verification or planned labels anywhere; the future direction is marked; the AI workflow has five steps, including the educator’s decision and the usual approval.</li>
      <li><b>Also covered:</b> contrast, 14 px minimum text, 44 px controls, no overflow from 320 to 1440 px, reduced motion, no-JavaScript, nothing stored on the device, and 47 moderation cases.</li>
      <li><b>Run:</b> <code>node verify/check.mjs</code>. Every new check was proved able to fail by planting each regression it guards against.</li>
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
