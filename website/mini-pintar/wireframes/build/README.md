# Wireframe build

Structural wireframes for the Mini-PINTAR M1 review. Greyscale, annotated,
layout and behaviour only — visual direction is stage H and is deliberately
not applied here.

These are a *design artefact*, not the website. No code in this directory is
part of the Mini-PINTAR implementation.

```
python3 gen.py                     # writes d1/d2/m1/m2/detail .html
CH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
for f in d1 d2; do $CH --headless --no-sandbox --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1000,2400 --screenshot=$f.png $f.html; done
for f in m1 m2; do $CH --headless --no-sandbox --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1000,3600 --screenshot=$f.png $f.html; done
$CH --headless --no-sandbox --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1120,1600 --screenshot=detail.png detail.html
python3 crop.py                    # trims the trailing white, in place
cp d1.png ../desktop-01-threshold-to-lesson.png
cp d2.png ../desktop-02-check-to-return.png
cp m1.png ../mobile-01-threshold-to-lesson.png
cp m2.png ../mobile-02-check-to-return.png
cp detail.png ../detail-belum-cukup-bukti.png
```

The last five lines matter: `crop.py` writes back over `build/*.png` and does
**not** touch the published sheets in the parent directory. Skipping the copy
leaves the review reading a stale wireframe while the generator says
otherwise — which happened once, during the tier relabel.

Copy shown in the frames is the Indonesian content of
`../../M1-CONTENT-AND-INTERACTION.md` §3, abbreviated to fit.
