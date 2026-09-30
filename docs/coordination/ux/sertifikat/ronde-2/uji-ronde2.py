"""
Sertifikat round 2: the Python half of the render script. Round 1's helper
(../uji-sertifikat.py) is reused unchanged for the decode tests, the print
simulations, the static fonts and the PDF geometry; this file adds:

  python uji-ronde2.py rusak <manifest.json>   -> damage tolerance: a patch over the symbol, grown
                                                  until each decoder fails (what error correction buys)
  python uji-ronde2.py teks <pdf> <json>       -> the text a PDF viewer gives back for the number and
                                                  the link (copy and search), per page
  python uji-ronde2.py tepi <manifest.json>    -> an office printer's unprintable margin applied to
                                                  a page (the full-bleed band, clipped)

A case passes only when a decoder returns exactly the expected text.
"""
import importlib.util
import json
import os
import sys

_r1 = importlib.util.spec_from_file_location("r1", os.path.join(os.path.dirname(__file__), "..", "uji-sertifikat.py"))
r1 = importlib.util.module_from_spec(_r1)
_r1.loader.exec_module(r1)


def rusak(manifest_path: str) -> None:
    """A mid-grey patch (a stain, a stamp, a fold's wear) placed over the symbol
    away from the three finder patterns, grown in steps of 1 % of the symbol's
    area. Reported: the largest patch each decoder still reads through, at
    300 dpi and at 150 dpi (a phone a little further away)."""
    import cv2
    import numpy as np
    m = json.load(open(manifest_path))
    out = []
    for k in m["kasus"]:
        img300 = r1._raster(m["pdf"], k["halaman"], 300)
        px = 300 / 25.4
        x, y, s = k["kotak"]  # the symbol, modules only, mm
        q = k["tenang"]
        a0, b0 = int((x - q - 2) * px), int((y - q - 2) * px)
        a1, b1 = int((x + s + q + 2) * px), int((y + s + q + 2) * px)
        crop = img300[b0:b1, a0:a1].copy()
        sx, sy, sp = (x - q - 2) * px, (y - q - 2) * px, s * px
        ox, oy = int((x * px) - a0), int((y * px) - b0)
        hasil = {"kode": k["kode"], "nama": k["nama"], "batas": {}}
        for dpi in (300, 150):
            for dec in ("zxing", "opencv"):
                terakhir = 0
                for persen in range(1, 41):
                    sisi = int(round(sp * (persen / 100) ** 0.5))
                    # the patch sits in the lower-right quadrant, clear of the finder patterns
                    cx, cy = ox + int(sp * 0.62), oy + int(sp * 0.62)
                    img = crop.copy()
                    x0 = max(ox, min(cx - sisi // 2, ox + int(sp) - sisi))
                    y0 = max(oy, min(cy - sisi // 2, oy + int(sp) - sisi))
                    cv2.rectangle(img, (x0, y0), (x0 + sisi, y0 + sisi), 150, -1)
                    if dpi != 300:
                        img = cv2.resize(img, None, fx=dpi / 300, fy=dpi / 300, interpolation=cv2.INTER_AREA)
                    if r1._baca(img, k["url"])[dec]:
                        terakhir = persen
                    else:
                        break
                hasil["batas"][f"{dec}@{dpi}"] = terakhir
        # an image of the largest patch zxing read through at 300 dpi
        persen = hasil["batas"]["zxing@300"]
        sisi = int(round(sp * (max(persen, 1) / 100) ** 0.5))
        img = cv2.cvtColor(crop, cv2.COLOR_GRAY2BGR)
        cx, cy = ox + int(sp * 0.62), oy + int(sp * 0.62)
        x0 = max(ox, min(cx - sisi // 2, ox + int(sp) - sisi)); y0 = max(oy, min(cy - sisi // 2, oy + int(sp) - sisi))
        cv2.rectangle(img, (x0, y0), (x0 + sisi, y0 + sisi), (150, 150, 150), -1)
        cv2.imwrite(k["simpan"], img)
        out.append(hasil)
    json.dump(out, sys.stdout)


def teks(pdf: str, spec_json: str) -> None:
    """What a PDF viewer hands back: the page's text as extracted, whether the
    stored number and the link are found by a search for their stored forms,
    and the words the number splits into when a reader double-clicks."""
    import pymupdf
    spec = json.loads(spec_json)
    d = pymupdf.open(pdf)
    out = []
    for s in spec:
        pg = d[s["halaman"]]
        t = pg.get_text()
        cari = {k: len(pg.search_for(v)) > 0 for k, v in s["cari"].items()}
        kata = [w[4] for w in pg.get_text("words")]
        # the number's own words: whatever holds its «/» (not the link, which has a «.»), and its first four characters standing alone
        nomor_kata = [w for w in kata if ("/" in w and "." not in w) or w == s.get("awal")]
        out.append({"halaman": s["halaman"], "cari": cari, "kata_nomor": nomor_kata, "ada_di_teks": {k: v in t for k, v in s["cari"].items()}})
    json.dump(out, sys.stdout)


def tepi(manifest_path: str) -> None:
    """An office printer cannot print the outer few millimetres of a sheet
    (commonly 4.2 mm on lasers, 3 mm with a larger bottom on inkjets). The page
    is rasterised at 300 dpi and that margin is cleared to paper: what leaves the printer."""
    import cv2
    m = json.load(open(manifest_path))
    for k in m["kasus"]:
        img = r1._raster(m["pdf"], k["halaman"], 300, abu=False)
        px = 300 / 25.4
        h, w = img.shape[:2]
        l, t, r, b = [int(v * px) for v in k["tepi"]]
        img[:, :l] = 255; img[:, w - r:] = 255; img[:t, :] = 255; img[h - b:, :] = 255
        cv2.imwrite(k["simpan"], cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
    print("ok")


if __name__ == "__main__":
    if sys.argv[1] == "rusak":
        rusak(sys.argv[2])
    elif sys.argv[1] == "teks":
        teks(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "tepi":
        tepi(sys.argv[2])
