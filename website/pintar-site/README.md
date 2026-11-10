# PINTAR public website

The public website for PINTAR, in Bahasa Indonesia (default) and English. It is
a static site with one small PHP contact handler. It is **in review**: every page
is `noindex`, carries a review strip, and nothing has been deployed.

The copy is **launch wording for PINTAR 4.1**: 4.0 and 4.1 are presented as
available; 4.5, 5.0 and beyond as future direction without dates. The site
launches only once Dr Gladys and her team have accepted 4.1, and only with the
owner's explicit authorisation. Preparing the wording does not mean acceptance
has occurred. Every claim presented as available is listed in
`review/index.html`, section 3, for confirmation against the accepted scope.

| Folder | What it is | Uploaded? |
|---|---|---|
| `site/` | The website: built HTML, CSS, JS, fonts, and `api/kontak.php` | **Yes**, its contents |
| `src/` | Page sources: copy for both languages, layout and diagrams | No |
| `build.mjs` | Writes `site/**/index.html` from `src/` (no dependencies) | No |
| `server/` | Contact form configuration example and the daily cleanup job, kept **outside** the public folder | Copied by hand, see below |
| `review/` | The owner's review document: changes, launch-claims checklist, asset plan, unresolved facts | **Never** |
| `images/` | Image originals and their generation prompts (`images/README.md`); `node images.mjs` turns them into WebP in `site/assets/img/` | **Never** (the WebP files in `site/` are) |
| `verify/` | Acceptance checks | No |

## Build and view

```
node website/pintar-site/build.mjs                 # review build: noindex and a review strip on every page
node website/pintar-site/build.mjs --publish       # removes both; only once 4.1 is accepted and the owner authorises publication
php -S 127.0.0.1:8080 website/pintar-site/verify/router.php
# open http://127.0.0.1:8080/test/pintar/   (and /test/pintar/en/)
```

Pages (Indonesian / English):

| Indonesian | English |
|---|---|
| `/` | `/en/` |
| `/mengapa-pintar/` | `/en/why-pintar/` |
| `/fitur/` | `/en/features/` |
| `/untuk-siapa/` | `/en/who-its-for/` |
| `/keamanan/` | `/en/trust-and-security/` |
| `/kontak/` | `/en/contact/` |
| `/privasi/` | `/en/privacy/` |
| `/ketentuan/` | `/en/terms/` |

Every link is relative, so the site works from any folder.

Type is self-hosted: Inter (variable, with the optical-size axis, so headlines
use Inter Display) and IBM Plex Mono 500 for small labels, both under the SIL
Open Font License (`site/assets/fonts/OFL-*.txt`). The site sets no cookies.

## Images

Five image slots (P1–P5, defined in `src/core.mjs`). Each declares its source:
AI-generated illustration, licensed photograph, or product screenshot, and the
page labels it accordingly. Generated images are never presented as PINTAR users
or partner institutions, and no product screenshot is simulated. Until a slot has
an image, it shows a labelled placeholder with the brief.

```
# save the original as website/pintar-site/images/P1.png (or .jpg/.webp), then:
node website/pintar-site/images.mjs   # WebP at 640, 1024, 1600 (and 2400) px, metadata removed; needs ffmpeg
node website/pintar-site/build.mjs
```

## Contact form

- **One form.** «Minta Demo» anywhere on the site opens `kontak/?subjek=demo`, with the subject already chosen.
- **The handler.** `site/api/kontak.php` (PHP 8.1 or later) does everything on the server:
  - checks method, origin, size and encoding;
  - stops bots with a honeypot and a timing check;
  - validates every field;
  - limits each sender to 5 valid submissions an hour;
  - answers double submits without sending twice (a message is remembered only after it is delivered, so a retry after a failed delivery is really sent);
  - moderates content;
  - delivers by email to info@pintarselalu.com.
- **Without JavaScript.** The form still works, and the server answers with a page.
- **Configuration.** Copy `server/pintar-contact-config.example.php` to `pintar-contact-config.php` **one level above** the public folder (for example `/home/<account>/pintar-contact-config.php`), and set the transport:
  - `mail`: the host's mail system, which needs SPF and DKIM for pintarselalu.com;
  - `smtp`: an authenticated mailbox, whose password lives only in that file.

  Then send a test message and confirm it arrives.
- **Storage.**
  - The handler keeps no message content.
  - Rate-limit and duplicate entries are keyed hashes, expiring after one hour.
  - The security log holds only time, decision, category and a keyed IP hash (a pseudonym, not anonymisation), expiring after 30 days.
  - Expired entries are deleted on each use of the form, and by `server/cleanup.php`. Copy it as `pintar-contact-cleanup.php` beside the configuration file and schedule it daily, for example `17 3 * * * php /home/<account>/pintar-contact-cleanup.php` (it expects the public folder at `public_html/`).
  - It is all stored outside the public folder.
  - `api/lib/.htaccess` denies the library to the web.
  - The host's own access logs (with raw IP addresses) are separate, and follow the host's retention.

### Moderation

`site/api/lib/moderation-rules.php` is the configuration, and `moderation.php` is the engine.

- **Normalisation** undoes disguises before matching: Unicode compatibility forms, look-alike letters from other scripts, zero-width characters, accents, l33t spelling, spaced or stretched letters, and full-width text.
- **Reject:** clear obscenity, slurs, threats, abuse aimed at a person, spam or phishing with links, dangerous links, and repeated or bot text. The visitor sees only the owner's neutral wording, and the text is never echoed.
- **Flag (still delivered):** reports and quotations of offensive language, sensitive but legitimate topics, a single insult, and suspicious links. These arrive marked **«[PERLU DITINJAU]»**, so that a person decides.
- **Allow:** everything else, including criticism and complaints.

To change what is caught, edit the lists. Then run the cases.

## Verification

```
php  website/pintar-site/verify/moderation-cases.php   # 47 moderation cases, ID and EN
node website/pintar-site/verify/check.mjs              # 1178 browser and server checks (needs php and Chromium)
```

`check.mjs` covers:

- **Build and pages:** the build is current; every page exists in both languages with the right `lang`, one `h1`, a title, a description, `noindex` and the review strip; both language switches (header and footer) land on the same page.
- **Launch wording:** no «release verification» or «planned» labels anywhere; future direction is marked; the AI workflow has five steps including the educator's decision and the usual approval.
- **Footer and demo:** no language or company column; ©, email, Contact / Privacy / Terms and ID | EN; no footer demo link; on the homepage, only the header and closing demo invitations.
- **Reading order:** the cycle's seven stages and return keep their document order, laid out as a serpentine at 1440 px and one column at 390 px; on Features every headline precedes its visual, and sits above it on phones.
- **Reading comfort and diagrams:** body text in feature and audience sections is at least 15 px, line height 1.4, at most 40 em wide; no diagram overflows its column.
- **Story and accuracy:** the hero headline and the completed class panel (sample data, what each percentage measures, learner counts, the educator's decision set apart); the evidence thread on Home and Why; no availability chips on current features; no internal-review phrasing in public copy; every image declares its source.
- **Links and requests:** links and assets are relative and real, and nothing is requested from another host.
- **Layout and accessibility:** contrast is measured; no text is under 14 px; controls are 44 px; there is no sideways overflow from 320 to 1440 px; every planned photograph has its alternative text.
- **Motion:** reduced motion and no-JavaScript hide nothing; with motion allowed, every entrance completes and nothing loops.
- **Phone menu:** it opens, and Escape closes it.
- **Contact form:** the full journey in both languages, in the browser and over HTTP, including moderation, rate limit, honeypot, origin, header injection, and a failed delivery followed by a real retry.
- **Storage:** no cookie and nothing stored on the device.

It has been proved able to fail: planted faults were each caught. They were a removed rule, an echoed refusal, low contrast, a stale build, local storage, a disabled rate limit, a missing consent check, a message remembered before sending, a footer demo link, swapped cycle positions, an old «planned» label, internal-review wording, the educator's note merged into the report, and a visual placed before its headline.

## Before publication

See `review/index.html`, sections 3 and 6. In short:

- acceptance of 4.1 by Dr Gladys and her team, and every launch claim confirmed against the accepted scope;
- the photography commission;
- the company facts marked «konfirmasi» on the legal pages, and a legal review;
- mail delivery confirmed, and the daily cleanup job scheduled;
- the production domain;
- the owner's go-ahead.
