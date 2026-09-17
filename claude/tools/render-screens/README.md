# Render the UX-1 review screens

Review tooling, not product code. It renders the **built** Experience components
to static HTML with the real compiled stylesheet and the real copy table, then
screenshots each one at 1280 and 390 CSS pixels in both interface languages.

It exists because "built matches approved" is one of the nine return criteria,
and a criterion you cannot re-check after an adjustment is a criterion you check
once. After any visual change, re-run this and compare.

## Why it renders components rather than driving the app

The screens need data — a certificate in each of its four states, a verification
in each of its five outcomes. Driving the real routes needs a database, and the
local Supabase stack cannot start in the session container (`ghcr.io` image
blobs answer 403 through the agent proxy). So the harness imports the same
components the routes render and supplies example data.

**Every name, number and verification token in the output is invented.** The
QR codes are real and decode to the example links.

## Run it

```bash
npm i --no-save playwright        # not a dependency: heavy, and review-only
OUT=$(mktemp -d)
node   claude/tools/render-screens/stylesheet.mjs "$OUT"   # compile globals.css
npx tsx claude/tools/render-screens/screens.tsx   "$OUT"   # 24 HTML pages
node   claude/tools/render-screens/shoot.mjs      "$OUT"   # 48 PNGs in $OUT/shots
echo "$OUT"
```

`shoot.mjs` launches the pre-installed Chromium at `/opt/pw-browsers/chromium`
rather than the build a fresh `playwright` install expects, which is absent.

Write the output to a directory **outside the repository**. These are review
artefacts; the durable copy is the published review page.
