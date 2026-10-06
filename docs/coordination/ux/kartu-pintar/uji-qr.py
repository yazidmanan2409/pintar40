"""
Kartu PINTAR, round 1: the QR half of the render script.

  python uji-qr.py matriks <url>              -> JSON: the level Q and H symbols (segno)
  python uji-qr.py uji <manifest.json> <out>  -> decode tests, written as JSON and text
  python uji-qr.py cmyk <#hex> ...            -> each colour through a CMYK profile and back (print shift)
  python uji-qr.py jarak <#hex> ...           -> pairwise CIEDE2000, normal vision and simulated colour blindness
  python uji-qr.py huruf <woff2> <dir>        -> static 400 and 600 instances of the variable font, for the PDF
  python uji-qr.py a4 <pdf>                   -> set every page to exactly A4, then measure the sheet

The level M symbol is not made here: buat-kartu.mts takes it from the app's own
encoder (src/lib/qr.ts), so variants A and B are exactly what PINTAR draws today.
The app encoder only does level M; Q and H come from segno (ISO/IEC 18004).

Decoders: zxing-cpp and OpenCV's QRCodeDetector, two independent code bases.
A case passes only when a decoder returns exactly the expected link.
"""
import json
import math
import sys


def matriks(url: str) -> None:
    import segno
    out = {}
    for level in ("Q", "H"):
        q = segno.make_qr(url, error=level, boost_error=False, mode="byte")
        out[level] = {"versi": q.version, "ecc": q.error.upper(), "mask": q.mask,
                      "matriks": [[1 if x else 0 for x in row] for row in q.matrix]}
    json.dump(out, sys.stdout)


# ── the decode test ──────────────────────────────────────────────────────────
def uji(manifest_path: str, out_path: str) -> None:
    import cv2
    import numpy as np
    import pymupdf
    import zxingcpp

    m = json.load(open(manifest_path))
    url = m["url"]
    doc = pymupdf.open(m["pdf"])

    def raster(page_no: int, dpi: int) -> np.ndarray:
        pix = doc[page_no].get_pixmap(dpi=dpi, colorspace=pymupdf.csRGB, alpha=False)
        a = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, 3)
        return cv2.cvtColor(a, cv2.COLOR_RGB2GRAY)

    def crop(img: np.ndarray, box_mm, dpi: int, pad_mm=3.0) -> np.ndarray:
        s = dpi / 25.4
        x0, y0, w, h = box_mm
        a = max(0, int((x0 - pad_mm) * s)); b = max(0, int((y0 - pad_mm) * s))
        c = int((x0 + w + pad_mm) * s); d = int((y0 + h + pad_mm) * s)
        return img[b:d, a:c].copy()

    def baca(img: np.ndarray) -> dict:
        z = [r.text for r in zxingcpp.read_barcodes(img, formats=zxingcpp.BarcodeFormat.QRCode)]
        try:
            o, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
        except cv2.error:
            o = ""
        return {"zxing": url in z, "opencv": o == url}

    # stress transforms, applied to the 300 dpi actual-size render
    def turun(img, dpi_to):  # downscale: a phone farther away, or a cheap camera
        f = dpi_to / 300
        return cv2.resize(img, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)

    def kabur(img, sigma):  # out of focus
        return cv2.GaussianBlur(img, (0, 0), sigma)

    def miring(img, derajat=25, putar=8):  # held at an angle: the card turned about its vertical axis, seen by a pinhole camera, then turned in plane
        h, w = img.shape[:2]
        th = math.radians(derajat)
        jarak = 2.5 * max(w, h)  # camera distance, in the image's own pixels
        dst = []
        for x, y in ((0, 0), (w, 0), (w, h), (0, h)):
            X, Y = x - w / 2, y - h / 2
            s = jarak / (jarak + X * math.sin(th))
            dst.append([w / 2 + X * math.cos(th) * s, h / 2 + Y * s])
        p = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), np.float32(dst))
        img = cv2.warpPerspective(img, p, (w, h), borderValue=255)
        r = cv2.getRotationMatrix2D((w / 2, h / 2), putar, 1.0)
        return cv2.warpAffine(img, r, (w, h), borderValue=255)

    def pudar(img, kontras=0.35, terang=70):  # faded print, glare, dim light: a third of the contrast left
        f = img.astype(np.float32)
        return np.clip(128 + (f - 128) * kontras + terang * 0.5, 0, 255).astype(np.uint8)

    def gabung(img):  # all of it at once, plus sensor noise and JPEG
        x = miring(pudar(kabur(turun(img, 200), 1.0), 0.45, 50), 18, 6)
        rng = np.random.default_rng(7)
        x = np.clip(x.astype(np.float32) + rng.normal(0, 6, x.shape), 0, 255).astype(np.uint8)
        ok, enc = cv2.imencode(".jpg", x, [cv2.IMWRITE_JPEG_QUALITY, 55])
        return cv2.imdecode(enc, cv2.IMREAD_GRAYSCALE)

    UJI = [
        ("300 dpi, actual size", lambda i: i),
        ("downscaled to 150 dpi", lambda i: turun(i, 150)),
        ("downscaled to 100 dpi", lambda i: turun(i, 100)),
        ("blurred (sigma 1.5 px at 300 dpi)", lambda i: kabur(i, 1.5)),
        ("blurred (sigma 2.5 px at 300 dpi)", lambda i: kabur(i, 2.5)),
        ("angled (25 deg tilt, 8 deg turn)", lambda i: miring(i)),
        ("low contrast (35% left)", lambda i: pudar(i)),
        ("all combined + noise + JPEG", gabung),
    ]

    hasil = []
    halaman = {}
    for kasus in m["kasus"]:
        key = (kasus["halaman"], 300)
        if key not in halaman:
            halaman[key] = raster(kasus["halaman"], 300)
        img = crop(halaman[key], kasus["kotak"], 300)
        baris = {"kode": kasus["kode"], "nama": kasus["nama"], "uji": []}
        for nama, f in UJI:
            r = baca(f(img))
            baris["uji"].append({"nama": nama, **r})
        # graded sweeps, mild to harsh; each records the last value that still decodes before the first failure
        def sapu(f, nilai, dec):
            terakhir = None
            for v in nilai:
                if baca(f(img, v))[dec]:
                    terakhir = v
                else:
                    break
            return terakhir
        if kasus.get("sapu", True):
            baris["batas"] = {}
            for dec in ("zxing", "opencv"):
                baris["batas"][dec] = {
                    "dpi": sapu(turun, list(range(300, 20, -5)), dec),
                    "blur_px": sapu(kabur, [x / 4 for x in range(2, 41)], dec),
                    "kontras": sapu(lambda i, k: pudar(i, k, 0), [round(1 - x / 40, 3) for x in range(0, 39)], dec),
                    "miring": sapu(lambda i, d: miring(i, d, 0), [x * 2.5 for x in range(0, 31)], dec),
                }
        hasil.append(baris)
        cv2.imwrite(kasus["simpan"], img)
    # screen renders (email and phone), as a camera would see a screen
    for layar in m.get("layar", []):
        img = cv2.imread(layar["png"], cv2.IMREAD_GRAYSCALE)
        hasil.append({"kode": layar["kode"], "nama": layar["nama"], "uji": [{"nama": "screen render as sent", **baca(img)}]})
    json.dump(hasil, open(out_path, "w"), indent=1)
    teks = []
    for b in hasil:
        teks.append(f"{b['kode']} {b['nama']}")
        for u in b["uji"]:
            teks.append(f"  {u['nama']:40} zxing {'PASS' if u['zxing'] else 'FAIL'}   opencv {'PASS' if u['opencv'] else 'FAIL'}")
        if "batas" in b:
            for dec in ("zxing", "opencv"):
                x = b["batas"][dec]
                teks.append(f"  {dec} limits: every scale down to {x['dpi']} dpi; blur up to sigma {x['blur_px']} px at 300 dpi; contrast down to {x['kontras']}; tilt up to {x['miring']} deg")
    open(out_path.replace(".json", ".txt"), "w").write("\n".join(teks) + "\n")
    print("\n".join(teks))


# ── fonts for the PDF: static instances of the app's own variable font ─────
def huruf(src: str, out_dir: str) -> None:
    """Chromium embeds a variable font in a PDF as Type3 outlines. Static
    instances cut from the same file embed as ordinary TrueType subsets."""
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    for w in (400, 600):
        f = instancer.instantiateVariableFont(TTFont(src), {"wght": w})
        f.flavor = None
        gaya = "Regular" if w == 400 else "SemiBold"
        for rec in f["name"].names:
            if rec.nameID in (2, 17):
                rec.string = gaya
            elif rec.nameID in (4,):
                rec.string = f"Plus Jakarta Sans {gaya}"
            elif rec.nameID == 6:
                rec.string = f"PlusJakartaSans-{gaya}"
        f.save(f"{out_dir}/plus-jakarta-sans-{w}.ttf")


# ── the A4 sheet: exact page size, then measured ─────────────────────────────
def a4(pdf: str) -> None:
    import pymupdf
    d = pymupdf.open(pdf)
    for pg in d:
        pg.set_mediabox(pymupdf.Rect(0, 0, 210 / 25.4 * 72, 297 / 25.4 * 72))
    d.saveIncr() if d.can_save_incrementally() else None
    d = pymupdf.open(pdf)
    mm = 25.4 / 72
    out = {"halaman": len(d), "ukuran_mm": [round(d[0].rect.width * mm, 3), round(d[0].rect.height * mm, 3)], "per_halaman": [], "fonts": set()}
    for pg in d:
        luas = []
        for dr in pg.get_drawings():
            r = dr["rect"]
            w, h = r.width * mm, r.height * mm
            if abs(w - 89.6) < 0.2 or abs(w - 85.5) < 0.2:
                luas.append([round(r.x0 * mm, 3), round(r.y0 * mm, 3), round(w, 3), round(h, 3), dr.get("type")])
        out["per_halaman"].append(luas)
        out["fonts"] |= {f"{f[2]} {f[3]}" for f in pg.get_fonts()}
    out["fonts"] = sorted(out["fonts"])
    json.dump(out, sys.stdout)


# ── how far apart the six colours are: CIEDE2000, normal vision and simulated CVD ──
def jarak(warna) -> None:
    # Machado, Oliveira and Fernandes (2009), severity 1.0, applied in linear sRGB
    MATRIKS = {
        "normal": None,
        "deuteranopia": [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
        "protanopia": [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    }

    def s2l(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    def l2s(c):
        c = max(0.0, min(1.0, c))
        return round(255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055))

    def sim(h, m):
        if m is None:
            return h
        rgb = [s2l(int(h[i:i + 2], 16)) for i in (1, 3, 5)]
        out = [sum(m[r][c] * rgb[c] for c in range(3)) for r in range(3)]
        return "#%02X%02X%02X" % tuple(l2s(v) for v in out)

    hasil = {}
    for nama, m in MATRIKS.items():
        w = [sim(h, m) for h in warna]
        pas = []
        for i in range(len(w)):
            for j in range(i + 1, len(w)):
                pas.append([i, j, round(de2000(lab(w[i]), lab(w[j])), 1)])
        hasil[nama] = sorted(pas, key=lambda x: x[2])
    json.dump(hasil, sys.stdout)


# ── print shift: sRGB -> CMYK -> sRGB through MuPDF's built-in CMYK profile ─
def cmyk(warna) -> None:
    import pymupdf
    pymupdf.TOOLS.set_icc(True)
    n = len(warna)
    rgb = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, n, 1), False)
    for i, h in enumerate(warna):
        rgb.set_pixel(i, 0, tuple(int(h[j:j + 2], 16) for j in (1, 3, 5)))
    c = pymupdf.Pixmap(pymupdf.csCMYK, rgb)
    back = pymupdf.Pixmap(pymupdf.csRGB, c)
    out = []
    for i, h in enumerate(warna):
        k = [round(v / 2.55) for v in c.pixel(i, 0)]
        hb = "#%02X%02X%02X" % tuple(back.pixel(i, 0))
        out.append({"hex": h, "cmyk": k, "kembali": hb, "de2000": round(de2000(lab(h), lab(hb)), 2)})
    json.dump(out, sys.stdout)


def lab(h):
    def s2l(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = [s2l(int(h[i:i + 2], 16)) for i in (1, 3, 5)]
    X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
    Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    return 116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))


def de2000(l1, l2):  # CIEDE2000
    L1, a1, b1 = l1
    L2, a2, b2 = l2
    Cb = (math.hypot(a1, b1) + math.hypot(a2, b2)) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = (1 + G) * a1, (1 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360
    h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dLp, dCp = L2 - L1, C2p - C1p
    dhp = h2p - h1p
    if C1p * C2p == 0:
        dhp = 0
    elif dhp > 180:
        dhp -= 360
    elif dhp < -180:
        dhp += 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2))
    Lbp, Cbp = (L1 + L2) / 2, (C1p + C2p) / 2
    if C1p * C2p == 0:
        hbp = h1p + h2p
    elif abs(h1p - h2p) <= 180:
        hbp = (h1p + h2p) / 2
    else:
        hbp = (h1p + h2p + 360) / 2
    T = (1 - 0.17 * math.cos(math.radians(hbp - 30)) + 0.24 * math.cos(math.radians(2 * hbp))
         + 0.32 * math.cos(math.radians(3 * hbp + 6)) - 0.20 * math.cos(math.radians(4 * hbp - 63)))
    dth = 30 * math.exp(-((hbp - 275) / 25) ** 2)
    Rc = 2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
    Sl = 1 + 0.015 * (Lbp - 50) ** 2 / math.sqrt(20 + (Lbp - 50) ** 2)
    Sc, Sh = 1 + 0.045 * Cbp, 1 + 0.015 * Cbp * T
    Rt = -math.sin(math.radians(2 * dth)) * Rc
    return math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh))


if __name__ == "__main__":
    if sys.argv[1] == "matriks":
        matriks(sys.argv[2])
    elif sys.argv[1] == "uji":
        uji(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "cmyk":
        cmyk(sys.argv[2:])
    elif sys.argv[1] == "jarak":
        jarak(sys.argv[2:])
    elif sys.argv[1] == "huruf":
        huruf(sys.argv[2], sys.argv[3])
    elif sys.argv[1] == "a4":
        a4(sys.argv[2])
