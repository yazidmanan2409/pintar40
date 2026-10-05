"""The tab icon (Q17, 5 Oct): a functional identifier, not a logo. Run from the repository root:

    python docs/coordination/ux/sistem-desain/alat/buat-ikon-tab.py   # needs Pillow

A solid PINTAR-green square, nothing on it: no letter, no P, no symbol. Rounded where the file is
shown as it is (the tab, the bookmark); full-bleed where the platform rounds it itself (the home
screen). Writes project/assets/AppIcon/. A permanent app-icon design is a separate, later decision.
"""
from pathlib import Path

from PIL import Image, ImageDraw

HIJAU = (0x24, 0x5F, 0x55, 255)  # pintar-primary, #245F55
SUDUT = 6 / 32  # the corner radius as a share of the side: 6 px on the 32 px grid
KE = Path(__file__).resolve().parent.parent / "project" / "assets" / "AppIcon"
KE.mkdir(parents=True, exist_ok=True)


def bulat(sisi: int) -> Image.Image:
    """A rounded square, drawn at 8x and reduced, so the corners are smooth at 16 px."""
    b = sisi * 8
    besar = Image.new("RGBA", (b, b), (0, 0, 0, 0))
    ImageDraw.Draw(besar).rounded_rectangle((0, 0, b - 1, b - 1), radius=round(b * SUDUT), fill=HIJAU)
    return besar.resize((sisi, sisi), Image.LANCZOS)


def penuh(sisi: int) -> Image.Image:
    """Full-bleed and opaque: the platform masks the corners (and fills transparency with black)."""
    return Image.new("RGB", (sisi, sisi), HIJAU[:3])


# favicon.ico: 16, 32 and 48, rounded, transparent corners.
bulat(48).save(KE / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)],
               append_images=[bulat(16), bulat(32)])
# icon.svg: the same shape as vectors, for browsers that take an SVG icon.
(KE / "icon.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">'
    '<rect width="32" height="32" rx="6" fill="#245F55"/></svg>\n')
# apple-icon.png: 180 x 180, full-bleed (iOS rounds it).
penuh(180).save(KE / "apple-icon.png", optimize=True)
# For a web manifest, if one is ever added (none exists today): 192 and 512, full-bleed, so they
# serve as "any" and "maskable" alike (there is nothing in them to fall outside the safe zone).
penuh(192).save(KE / "icon-192.png", optimize=True)
penuh(512).save(KE / "icon-512.png", optimize=True)

for f in sorted(KE.iterdir()):
    print(f"{f.name}: {f.stat().st_size} bytes")
