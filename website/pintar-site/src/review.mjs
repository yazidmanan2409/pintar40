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
  ["D1", "Connects", "Home · hero", "Teaching · Learning · Assessment · Decisions, joined by “evidence you can trace”.", "The proposition in four words, read in two seconds."],
  ["D2", "The learning cycle", "Home · How it works; Why PINTAR (full)", "Seven stages, each with its question and what PINTAR does; a return line to the start. Stages light up once, in order.", "Replaces paragraphs on the philosophy."],
  ["D5", "Evidence states (concept illustration)", "Home · Why; Why PINTAR · Principles", "72% from 22 of 24 learners, against “—” from 4 of 24: “not enough evidence yet, not weakness”. Labelled as an illustration.", "PINTAR’s most distinctive honesty, shown not told."],
  ["D3", "Canonical content", "Features · B", "One canonical release, two institutions, each with its own additions and its own evidence, kept apart.", "Sharing without leaking."],
  ["D4", "Governed publishing", "Features · B", "Draft → second-person review → approved → frozen and released; send-back loop; R1 untouched, R2 the correction.", "Why history is trustworthy."],
  ["D11", "Who sees what", "Features · C", "Learners, educators, leadership, certificate checkers: what each sees, and what they do not.", "Reports without ranking or over-exposure."],
  ["D6", "One person, many roles", "Features · D", "Teaching at School A, managing at School B, learning in a training programme; a role is not a permission.", "Identity and context in one picture."],
  ["D7", "Layered cross-section", "Home · Trust (dark); Trust & Security (full)", "The calm surface, then seven layers beneath it. Layers appear once, top to bottom.", "“Calm on the surface. Rigorous underneath.”"],
  ["D8", "Roadmap", "Home · What comes next", "4.0 Foundation (in release verification), 4.1 Next (planned), 4.5 and 5.0 (direction), 5.0+ (possibilities). Status is a word and a shape.", "An honest future, at a glance."],
  ["D9", "AI drafts, educator decides", "Features · 4.1", "AI drafts → educator reviews, edits or rejects (emphasised) → usual approval → release.", "“AI assists. Educators decide.”"],
  ["D10", "Continue on another device", "Features · 4.1", "First device → short-lived single-use code → second device; one writer at a time.", "Continuity without a shared password."],
  ["D12", "What PINTAR is not", "Why PINTAR · 04", "LMS distributes, library stores, exam platform measures; PINTAR connects them and explains.", "Positioning without naming competitors."],
];

const SECTIONS = [
  ["Home", [
    ["Hero", "Typography (display serif, two deliberate lines) + P1, 21:9 desktop / 4:5 phone + D1"],
    ["01 Why PINTAR", "Headline + D5 concept illustration"],
    ["02 How it works", "D2 cycle, progressive emphasis"],
    ["03 Capabilities (4.0 Foundation)", "P3 (sticky on desktop) + typographic index of four capabilities"],
    ["04 Who it’s for", "Typographic list of five roles"],
    ["Pause", "P6, 21:9"],
    ["05 Trust & Security", "Dark band + D7 (compact)"],
    ["06 What comes next", "D8 roadmap + “AI assists. Educators decide.”"],
    ["Request a demo", "P8 + button to the contact form, subject preselected"],
  ]],
  ["Why PINTAR", [["Hero", "Typography + P7 detail"], ["01 The problem", "Three numbered observations (typography only)"], ["02 Philosophy", "D2 full cycle"], ["03 Principles", "Four principles + D5"], ["04 Difference", "D12"], ["Demo", "P8"]]],
  ["Features", [["Hero", "Status legend"], ["A Learning & teaching", "Journey strip"], ["B Content", "D3 + D4"], ["C Assessment & reports", "D11"], ["D Identity & institutions", "D6"], ["4.1 Next", "D9 + D10"], ["Further ahead", "Three typographic columns, dashed status"], ["Demo", "P8"]]],
  ["Who It’s For", [["Hero", "Typography + anchor bar"], ["Learners", "P2"], ["Educators", "P3"], ["Leadership", "P4"], ["Administrators", "P5"], ["Institutions", "P6"], ["Demo", "P8"]]],
  ["Trust & Security", [["Hero", "D7 full, on paper"], ["In practice", "Seven layers with a real-life example each (typography)"], ["What we do not claim", "Framed text block"], ["Demo", "P8"]]],
  ["Contact · Privacy · Terms", [["Contact", "Typography + form; no photograph (focus)"], ["Privacy, Terms", "Typography with a sticky contents list; draft and «to confirm» markers"]]],
];

export default function review() {
  const link = (key, lang) => `../site/${ROUTES[key][lang]}`;
  const pages = ["home", "why", "features", "audiences", "trust", "contact", "privacy", "terms"];
  const LABEL = { ...Object.fromEntries(Object.entries(NAV_LABEL).map(([k, v]) => [k, v.en])), home: "Home" };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Website Review — PINTAR public website, first review</title>
<link rel="stylesheet" href="../site/assets/css/site.css">
<style>
  .rv { padding-block: 5rem 8rem; }
  .rv section { padding-block: 3.5rem; border-top: 1px solid var(--ink); }
  .rv h2 { font: 380 2.25rem/1.1 var(--serif); margin-bottom: 1.25rem; }
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
  <p class="label">PINTAR public website · Task 01 · first visual review</p>
  <h1 class="h1">The website, before it is published.</h1>
  <p class="lead" style="margin-top:1.5rem">Every page is designed and built, in Bahasa Indonesia and English. This page explains the decisions in brief, maps every visual to its section, and lists what needs your ruling. Nothing has been deployed.</p>

  <section>
    <h2>1. Creative direction</h2>
    <p><b>Typography leads.</b> Newsreader, a contemporary serif, carries what is said: large, light and set with deliberate line breaks. Inter, the typeface of PINTAR’s own wordmark and reports, carries what is read and operated. The wordmark is the text-only «PINTAR» in Inter Bold, <code>#075056</code>, 0.14 em tracking (D-192, D-193).</p>
    <p><b>Colour is quiet.</b> Warm white <code>#F6F4EF</code>, a soft neutral <code>#EDE9E1</code>, charcoal <code>#1B1E1D</code>, and the brand teal <code>#075056</code> used sparingly, with one deep-teal band per page at most. No gradients, decorative icons or stock illustration.</p>
    <p><b>Images explain.</b> Documentary photographs of Indonesian schools show people. Native diagrams show how PINTAR works, and each replaces paragraphs. There are no product screenshots yet and none are faked: the one evidence picture is labelled as a concept illustration.</p>
    <p><b>Layout.</b> A 12-column grid with a maximum width of 86 rem and wide margins. Splits are asymmetric (5/7, 7/5), with hairline rules instead of cards, and one focal point per section.</p>
    <p><b>Motion.</b> Text and figures rise 18 px and fade in once (680 ms). Diagram stages light up once, in sequence. There is no parallax, autoplay, looping or scroll hijacking. With reduced motion everything is present and still; without JavaScript every page is complete.</p>
    <p><b>Inspiration, not imitation.</b> From Leica: precision, confident photography and captioned editorial composition (the viewfinder marks on photo frames are a quiet nod). From MUJI: warmth, honesty, whitespace and restraint. No marks, layouts or assets are copied.</p>
  </section>

  <section>
    <h2>2. Site map and navigation</h2>
    <p>The navigation follows your structure: <b>Why PINTAR · Features · Who It’s For · Trust & Security</b>, the ID / EN switch, and one action: <b>Request a Demo</b>. As you recommended, demo requests use the Contact form with «Minta demo» preselected: one form, one handler. The footer adds Contact · Privacy · Terms. There is no cookie page because the site sets no cookies; the Privacy Policy says so.</p>
    <div class="pages">${pages.map((k) => `<div><b>${LABEL[k]}</b><br><a class="link" href="${link(k, "id")}">ID /${ROUTES[k].id}</a> <a class="link" href="${link(k, "en")}">EN /${ROUTES[k].en}</a></div>`).join("")}</div>
    <p style="margin-top:1rem">Bahasa Indonesia is the default, at the root. English lives under <code>/en/</code>, with its own natural slugs. The switch always lands on the same page in the other language. Nothing is remembered on the device.</p>
  </section>

  <section>
    <h2>3. Visual assets, mapped to sections</h2>
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
    <p>When 4.0 is accepted on staging, authentic screenshots of the real product, with sample data and clearly labelled, can replace one or two diagrams (for example the class evidence screen in Features · C). None are used now.</p>
  </section>

  <section>
    <h2>4. Homepage, and 5. supporting pages</h2>
    <p>Open the pages above. The homepage answers, in order: what PINTAR is (hero and D1), why it matters (D5), how it works (D2), what it does (four capabilities, status shown), who it is for, why to trust it (D7), where it is going (D8), and how to see it (Request a Demo).</p>
  </section>

  <section>
    <h2>6. Mobile and bilingual behaviour</h2>
    <ul class="dot">
      <li><b>Responsive:</b> every page is checked for horizontal overflow at 320, 390, 768, 1024 and 1440 px. Diagrams reflow from horizontal to vertical; photographs switch to their phone crop (mostly 4:5).</li>
      <li><b>Phone navigation:</b> on a phone the navigation is a full-screen menu with large serif links, and the language switch stays visible.</li>
      <li><b>Bilingual copy:</b> both languages are written, not translated; Indonesian runs longer, and the layouts are tested in it. Terms follow the universal vocabulary (Peserta didik, Pendidik, Pimpinan, Institusi), pending the written terminology decision.</li>
      <li><b>Accessibility:</b>
        <ul class="dot">
          <li>measured contrast, no text under 14 px, controls of 44 px or more, visible focus, and a skip link;</li>
          <li>one H1 per page, alternative text on every photograph, diagrams as real lists, form errors linked to their fields with a summary, and status in words, not colour alone.</li>
        </ul></li>
    </ul>
  </section>

  <section>
    <h2>7. Implementation, and what needs your approval</h2>
    <p><b>Build.</b> The site is static, with a zero-dependency Node build (<code>node build.mjs</code>) that writes plain HTML to <code>site/</code>; the result uploads to the existing Namecheap hosting as it is. Pages are under 20 KB of HTML each, with one stylesheet (47 KB), one small script (8 KB) and self-hosted fonts (Inter and Newsreader, about 170 KB on a first visit, then cached).</p>
    <p><b>Contact form.</b> <code>api/kontak.php</code> (PHP 8.1 or later, already available on that hosting) does all of the following on the server:</p>
    <ul class="dot">
      <li>validates every field and refuses foreign origins;</li>
      <li>stops bots with a honeypot and a timing check;</li>
      <li>limits each sender to five messages an hour and ignores double submits;</li>
      <li>moderates content in Indonesian and English;</li>
      <li>delivers by email to info@pintarselalu.com.</li>
    </ul>
    <p>Credentials, if SMTP is used, live in a config file outside the public folder.</p>
    <p><b>Moderation.</b> Moderation is rule-based and configurable:</p>
    <ul class="dot">
      <li>normalisation defeats disguises such as look-alike letters, zero-width characters, l33t spelling, spaced or stretched letters and full-width text;</li>
      <li>clear abuse is refused with your exact wording;</li>
      <li>reports, quotations and borderline messages are delivered marked «PERLU DITINJAU», never discarded;</li>
      <li>nothing of a refused message is kept, only the time, a category and a hashed address, for 30 days.</li>
    </ul>
    <p>The 47 acceptance cases cover both languages and all three outcomes.</p>
    <h3>Decisions for you</h3>
    <div class="decision"><b>1 · Public status of 4.0.</b> The site labels 4.0 “Fondasi · verifikasi rilis / Foundation · in release verification”, because no release has been accepted for production. Once 4.0 is accepted, one constant changes it to “available”. Please confirm the wording, and who confirms the switch.</div>
    <div class="decision"><b>2 · Photography.</b> Approve a commissioned documentary shoot (eight images, two regions), and the consent process for minors (parental consent forms) and staff.</div>
    <div class="decision"><b>3 · Company facts for the legal pages.</b>
      <ul class="dot">
        <li>Registered address and NIB.</li>
        <li>Hosting and email providers, and whether any data leaves Indonesia.</li>
        <li>How long the mailbox keeps email.</li>
        <li>Whether a data protection officer is appointed.</li>
        <li>Trademark status.</li>
        <li>An effective date.</li>
      </ul>
      Whether the website needs a PSE (private electronic system operator) registration should be checked by counsel. Both legal pages are drafts until a qualified reviewer approves them.</div>
    <div class="decision"><b>4 · Mail delivery.</b> Either use the host’s mail() with SPF and DKIM set for pintarselalu.com (no password), or an authenticated SMTP mailbox (more reliable). Either way, a test message must be confirmed in the real inbox before launch.</div>
    <div class="decision"><b>5 · Domain and indexing.</b> Every page is <code>noindex</code> while in review. Publication (<code>node build.mjs --publish</code>) needs the production domain, for canonical and hreflang URLs, and your go-ahead. I have not deployed anything.</div>
    <div class="decision"><b>6 · Mini-PINTAR and the paused corporate site.</b> Per the brief, the new site does not link to Mini-PINTAR. Should Mini-PINTAR stay online elsewhere, or be retired with the paused corporate site once this one is published?</div>
    <div class="decision"><b>7 · Repository history (not a design matter).</b> Main was rewritten (a new 368-commit history from 9 October). This website lane still carries the old history, which may include what the rewrite removed. With your approval I can move the website work onto the new main and replace the lane.</div>
  </section>
</main>
</body>
</html>
`;
}
