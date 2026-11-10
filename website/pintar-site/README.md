# PINTAR public website

The public website for PINTAR, in Bahasa Indonesia (default) and English. It is
a static site with one small PHP contact handler. It is **in review**: every page
is `noindex`, and nothing has been deployed.

| Folder | What it is | Uploaded? |
|---|---|---|
| `site/` | The website: built HTML, CSS, JS, fonts, and `api/kontak.php` | **Yes**, its contents |
| `src/` | Page sources: copy for both languages, layout and diagrams | No |
| `build.mjs` | Writes `site/**/index.html` from `src/` (no dependencies) | No |
| `server/` | Contact form configuration example, kept **outside** the public folder | Copied by hand, see below |
| `review/` | The owner's review document: direction, asset plan, decisions | **Never** |
| `verify/` | Acceptance checks | No |

## Build and view

```
node website/pintar-site/build.mjs                 # review build: noindex on every page
node website/pintar-site/build.mjs --publish       # only once the owner approves publication
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

## Contact form

- **One form.** «Minta Demo» anywhere on the site opens `kontak/?subjek=demo`, with the subject already chosen.
- **The handler.** `site/api/kontak.php` (PHP 8.1 or later) does everything on the server:
  - checks method, origin, size and encoding;
  - stops bots with a honeypot and a timing check;
  - validates every field;
  - limits each sender to 5 valid submissions an hour;
  - answers double submits without sending twice;
  - moderates content;
  - delivers by email to info@pintarselalu.com.
- **Without JavaScript.** The form still works, and the server answers with a page.
- **Configuration.** Copy `server/pintar-contact-config.example.php` to `pintar-contact-config.php` **one level above** the public folder (for example `/home/<account>/pintar-contact-config.php`), and set the transport:
  - `mail`: the host's mail system, which needs SPF and DKIM for pintarselalu.com;
  - `smtp`: an authenticated mailbox, whose password lives only in that file.

  Then send a test message and confirm it arrives.
- **Storage.**
  - The handler keeps no message content.
  - Rate-limit and duplicate entries are keyed hashes, deleted after one hour.
  - The security log holds only time, decision, category and hashed IP, deleted after 30 days.
  - It is all stored outside the public folder.
  - `api/lib/.htaccess` denies the library to the web.

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
node website/pintar-site/verify/check.mjs              # 994 browser and server checks (needs php and Chromium)
```

`check.mjs` covers:

- **Build and pages:** the build is current; every page exists in both languages with the right `lang`, one `h1`, a title, a description and `noindex`; the language switch lands on the same page.
- **Links and requests:** links and assets are relative and real, and nothing is requested from another host.
- **Layout and accessibility:** contrast is measured; no text is under 14 px; controls are 44 px; there is no sideways overflow from 320 to 1440 px; every planned photograph has its alternative text.
- **Motion:** reduced motion and no-JavaScript hide nothing; with motion allowed, every entrance completes and nothing loops.
- **Phone menu:** it opens, and Escape closes it.
- **Contact form:** the full journey in both languages, in the browser and over HTTP, including moderation, rate limit, honeypot, origin and header injection.
- **Storage:** no cookie and nothing stored on the device.

It has been proved able to fail: planted faults were each caught. They were a removed rule, an echoed refusal, low contrast, a stale build, local storage, a disabled rate limit and a missing consent check.

## Before publication

See `review/index.html`, section 7. In short:

- the public status wording for 4.0;
- the photography commission;
- the company facts marked «konfirmasi» on the legal pages, and a legal review;
- mail delivery confirmed;
- the production domain;
- the owner's go-ahead.
