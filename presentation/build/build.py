# -*- coding: utf-8 -*-
"""
PINTAR — deck renderer.

Reads the one canonical content model in content.py and renders it in three
language editions. A slide's claim is written once; the editions differ only
in how that claim is said, never in what it says.

    lang = "id"  Bahasa Indonesia (primary, canonical)
    lang = "en"  English
    lang = "bi"  Bahasa Indonesia primary + English secondary

Every block is measured before it is placed, and a slide whose content will
not fit is a build failure, not a slide nobody checked.

Usage:  python3 build.py [output-dir]
"""

import math
import os
import sys

from pptx.enum.text import PP_ALIGN

from deck import (
    H, ML, MT, MB, CW,
    SURFACE_0, SURFACE_1, INK_1, INK_2, INK_3, LINE_1,
    PRIMARY, PRIMARY_SOFT, ON_DARK, ON_DARK_2,
    T_DISPLAY, T_STATEMENT, T_TITLE, T_LEDE, T_BODY, T_SMALL, T_META,
    T_DIAGRAM, BI_RATIO, BI_MIN,
    new_deck, add_slide, notes, box, rule, vrule, text, para, eyebrow, footer,
    provenance, tone, accent, arrow, step_number, screen_frame, screen_need,
    screen_fit, callout, word_overflows,
    block_h,
)
import content as C

FOOT_TOP = H - MB - 0.38        # everything must end above this
OVERFLOW = []                   # collected, then raised as one build failure


# ---------------------------------------------------------------------------
# Language resolution
# ---------------------------------------------------------------------------
def tx(node, lang):
    """The primary string for this edition."""
    if node is None:
        return None
    if isinstance(node, str):
        return node
    return node["id"] if lang in ("id", "bi") else node["en"]


def sx(node, lang):
    """The secondary string — bilingual edition only, and only when it differs."""
    if lang != "bi" or node is None or isinstance(node, str):
        return None
    return node["en"] if node["en"] != node["id"] else None


def is_bi(lang):
    return lang == "bi"


# ---------------------------------------------------------------------------
# Measured blocks
# ---------------------------------------------------------------------------
def multiline(s, size, color=INK_1, bold=False, before=0, spacing=1.12):
    """Explicit newlines become real paragraphs — a run cannot break a line."""
    return [para(seg, size, color, bold, before if i == 0 else 0, spacing)
            for i, seg in enumerate(s.split("\n"))]


def bi_block(node, lang, size, color=INK_1, sec_color=INK_2, bold=False,
             before=0, spacing=1.14, sec_gap=3.0):
    out = multiline(tx(node, lang), size, color, bold, before, spacing)
    second = sx(node, lang)
    if second:
        out += multiline(second, max(BI_MIN, size * BI_RATIO), sec_color,
                         False, sec_gap, 1.10)
    return out


def bi_h(node, lang, width_in, size, spacing=1.14, bold=False, sec_gap=3.0):
    h = block_h(tx(node, lang), width_in, size, spacing, bold)
    second = sx(node, lang)
    if second:
        h += sec_gap / 72.0 + block_h(
            second, width_in, max(BI_MIN, size * BI_RATIO), 1.10)
    return h


def place(slide, x, y, w, node, lang, size, color=INK_1, sec_color=INK_2,
          bold=False, spacing=1.14, sec_gap=3.0):
    """Draw a measured (bilingual) block and return the height it consumed."""
    h = bi_h(node, lang, w, size, spacing, bold, sec_gap)
    text(slide, x, y, w, h + 0.32,
         bi_block(node, lang, size, color, sec_color, bold, 0, spacing, sec_gap))
    return h


def prov_text(node, lang):
    """
    A provenance label states a limitation, so the bilingual edition carries
    it in both languages rather than only the primary one.
    """
    if node is None:
        return None
    second = sx(node, lang)
    return f"{tx(node, lang)}  /  {second}" if second else tx(node, lang)


def note_overflow(spec, lang, detail):
    OVERFLOW.append(f"{spec['key']:16s} [{lang}] {detail}")


# ---------------------------------------------------------------------------
# Shared slide furniture
# ---------------------------------------------------------------------------
def head_h(spec, lang, title_size=T_TITLE):
    h = 0.0
    if spec.get("eyebrow"):
        h += 0.36
    h += bi_h(spec["title"], lang, CW, title_size, 1.10, True, 4.0) + 0.16
    if spec.get("lede"):
        h += bi_h(spec["lede"], lang, CW * 0.80, T_LEDE, 1.26) + 0.16
    return h + 0.14


def head(slide, spec, lang, dark=False, title_size=T_TITLE):
    """Eyebrow + title + lede. Returns the y at which content may start."""
    ink = ON_DARK if dark else INK_1
    ink_soft = ON_DARK_2 if dark else INK_2
    meta = ON_DARK_2 if dark else INK_3

    y = MT
    if spec.get("eyebrow"):
        eyebrow(slide, tx(spec["eyebrow"], lang), y=y, color=meta)
        y += 0.36
    y += place(slide, ML, y, CW, spec["title"], lang, title_size,
               ink, ink_soft, True, 1.10, 4.0) + 0.16
    if spec.get("lede"):
        y += place(slide, ML, y, CW * 0.80, spec["lede"], lang, T_LEDE,
                   ink_soft, meta, False, 1.26) + 0.16
    return y + 0.14


def band_h(spec, lang, width=CW):
    node = spec.get("band")
    if not node:
        return 0.0
    inner = width - 0.72
    short = len(tx(node, lang)) < 34
    size = 19 if short else T_BODY
    return bi_h(node, lang, inner, size, 1.22, short) + 0.44


def band(slide, spec, lang, y, width=CW, x=ML, height=None):
    node = spec.get("band")
    if not node:
        return 0.0
    strong, soft = tone(spec.get("band_tone", "well"))
    inner = width - 0.72
    short = len(tx(node, lang)) < 34
    size = 19 if short else T_BODY
    h = height or band_h(spec, lang, width)
    box(slide, x, y, width, h, fill=soft, line=None, radius=0.12)
    vrule(slide, x, y, h, color=strong, thickness=2.5)
    text(slide, x + 0.36, y + 0.22, inner, h,
         bi_block(node, lang, size, strong if short else INK_1, INK_2,
                  short, 0, 1.22, 3.0))
    return h


def footnote_h(spec, lang):
    node = spec.get("footnote")
    if not node:
        return 0.0
    return bi_h(node, lang, CW * 0.86, T_SMALL, 1.30) + 0.20


def footnote(slide, spec, lang, y, dark=False):
    node = spec.get("footnote")
    if not node:
        return 0.0
    color = ON_DARK_2 if dark else INK_3
    line = ON_DARK_2 if dark else LINE_1
    rule(slide, ML, y, CW * 0.42, color=line)
    place(slide, ML, y + 0.18, CW * 0.86, node, lang, T_SMALL, color, color,
          False, 1.30, 2.5)
    return footnote_h(spec, lang)


SCREEN_LANG_NOTE = {
    "en": "The interface is shown in Indonesian, the product's own language.",
    "bi": "Antarmuka ditampilkan dalam bahasa Indonesia, bahasa produknya.  /  "
          "The interface is shown in Indonesian, the product's own language.",
}


def fit_gaps(text_total, gap_total, avail, floor=0.45):
    """
    How far the white space on a slide may be squeezed so its content fits.

    Only gaps are scaled, never type: the bilingual edition carries the same
    words at the same size, laid out more tightly. Below `floor` the slide is
    genuinely too dense and the copy has to be shortened instead.
    """
    if text_total + gap_total <= avail:
        return 1.0
    if gap_total <= 0:
        return None
    g = (avail - text_total) / gap_total
    return g if g >= floor else None


def centre(y_top, y_bottom, group_h, bias=0.42):
    """
    Place a group of known height in a band, seated a little above centre —
    optical centre reads calmer than geometric centre on a 16:9 slide.
    """
    slack = max(0.0, (y_bottom - y_top) - group_h)
    return y_top + slack * bias


# ---------------------------------------------------------------------------
# Layouts
# ---------------------------------------------------------------------------
def lay_cover(prs, spec, lang, n, total):
    slide = add_slide(prs, PRIMARY)
    text(slide, ML, 0.95, CW, 0.5,
         [para(spec["wordmark"], 22, ON_DARK, True, 0, 1.0)])
    rule(slide, ML, 1.64, 1.5, color=ON_DARK_2, thickness=1.5)

    title = tx(spec["title"], lang)
    th = block_h(title, CW * 0.86, T_DISPLAY, 1.12, True)
    y = 2.45
    text(slide, ML, y, CW * 0.86, th + 0.4,
         multiline(title, T_DISPLAY, ON_DARK, True, 0, 1.12))
    y += th + 0.30
    second = sx(spec["title"], lang)
    if second:
        s2 = 19
        h2 = block_h(second, CW * 0.86, s2, 1.16)
        text(slide, ML, y, CW * 0.86, h2 + 0.3,
             multiline(second, s2, ON_DARK_2, False, 0, 1.16))
        y += h2 + 0.26

    sub_y = max(y + 0.35, 5.30)
    place(slide, ML, sub_y, CW * 0.8, spec["sub"], lang, T_LEDE,
          ON_DARK_2, ON_DARK_2, False, 1.2, 2.5)
    rule(slide, ML, H - MB - 0.54, CW, color=ON_DARK_2)
    text(slide, ML, H - MB - 0.40, CW, 0.3,
         [para(tx(spec["meta"], lang), T_META, ON_DARK_2, False, 0, 1.0)])
    return slide


def lay_closing(prs, spec, lang, n, total):
    slide = add_slide(prs, PRIMARY)
    statement = tx(spec["statement"], lang)
    sh = block_h(statement, CW * 0.88, T_STATEMENT, 1.20, True)
    second = sx(spec["statement"], lang)
    s2h = block_h(second, CW * 0.88, 17, 1.20) + 0.30 if second else 0.0
    subh = bi_h(spec["sub"], lang, CW * 0.8, T_SMALL, 1.3)
    group = sh + 0.28 + s2h + 0.44 + subh

    y = centre(MT + 0.4, FOOT_TOP, group, 0.40)
    text(slide, ML, y, CW * 0.88, sh + 0.5,
         multiline(statement, T_STATEMENT, ON_DARK, True, 0, 1.20))
    y += sh + 0.28
    if second:
        text(slide, ML, y, CW * 0.88, s2h + 0.4,
             multiline(second, 17, ON_DARK_2, False, 0, 1.20))
        y += s2h
    rule(slide, ML, y + 0.12, 1.5, color=ON_DARK_2, thickness=1.5)
    place(slide, ML, y + 0.34, CW * 0.8, spec["sub"], lang, T_SMALL,
          ON_DARK_2, ON_DARK_2, False, 1.3, 2.5)
    return slide


def lay_statement(prs, spec, lang, n, total):
    dark = spec.get("dark", False)
    soft = spec.get("soft", False)
    slide = add_slide(prs, PRIMARY if dark else SURFACE_0)
    ink = ON_DARK if dark else INK_1
    ink2 = ON_DARK_2 if dark else INK_2
    meta = ON_DARK_2 if dark else INK_3

    top = MT
    if spec.get("eyebrow"):
        eyebrow(slide, tx(spec["eyebrow"], lang), y=top, color=meta)
        top += 0.46

    size = spec.get("statement_size", T_STATEMENT)
    inner = CW * (0.86 if soft else 0.80)
    sh = bi_h(spec["statement"], lang, inner, size, 1.18, True, 6.0)
    subh = bi_h(spec["sub"], lang, CW * 0.72, T_LEDE, 1.26) if spec.get("sub") else 0.0
    fnh = footnote_h(spec, lang)

    group = (sh + (1.0 if soft else 0.0)) + (0.62 + subh if subh else 0.0)
    y = centre(top + 0.25, FOOT_TOP - (fnh + 0.45 if fnh else 0.0), group, 0.34)

    if soft:
        panel_h = sh + 1.0
        box(slide, ML, y, CW, panel_h, fill=PRIMARY_SOFT, line=None, radius=0.16)
        vrule(slide, ML, y, panel_h, color=PRIMARY, thickness=3.0)
        place(slide, ML + 0.55, y + 0.5, inner, spec["statement"], lang, size,
              PRIMARY, INK_2, True, 1.18, 6.0)
        y += panel_h
    else:
        place(slide, ML, y, inner, spec["statement"], lang, size, ink, ink2,
              True, 1.18, 6.0)
        y += sh

    if subh:
        y += 0.62
        place(slide, ML, y, CW * 0.72, spec["sub"], lang, T_LEDE, ink2, meta,
              False, 1.26)
        y += subh
    if fnh:
        footnote(slide, spec, lang, FOOT_TOP - fnh, dark=dark)
    if y > FOOT_TOP + 0.02:
        note_overflow(spec, lang, f"statement ends at {y:.2f}in")
    return slide


def lay_flow(prs, spec, lang, n, total):
    slide = add_slide(prs, SURFACE_0)
    y0 = head(slide, spec, lang)
    steps = spec["steps"]
    k = len(steps)
    bh = band_h(spec, lang)
    fh = footnote_h(spec, lang)
    prov_h = (block_h(prov_text(spec["prov"], lang), CW, T_META, 1.22)
              + 0.12) if spec.get("prov") else 0.0

    if spec.get("compact"):
        return _flow_compact(slide, spec, lang, y0, steps, bh, fh, prov_h)

    gap = 0.20
    arrow_w = 0.34
    cw = (CW - (k - 1) * (arrow_w + gap)) / k
    inner = cw - 0.44

    # One label size for the whole row: a long term steps the row down a
    # notch rather than being broken across a line.
    label_size = T_DIAGRAM
    for candidate in (T_DIAGRAM, 11.5, 11.0, 10.5):
        label_size = candidate
        if not any(word_overflows(tx(st["label"], lang), inner, candidate, True)
                   for st in steps):
            break
    else:
        note_overflow(spec, lang, "a step label cannot fit its card")

    content_h = []
    for st in steps:
        h = block_h(tx(st["label"], lang), inner, label_size, 1.14, True)
        if st.get("term_en") and lang in ("en", "bi"):
            h += 0.26
        if st.get("body"):
            h += 0.10 + bi_h(st["body"], lang, inner, T_SMALL, 1.24)
        content_h.append(h)
    row_h = max(0.86, max(content_h) + 0.52)

    # A row of steps carries the slide; let it take a fair share of the height
    # rather than hugging the title. Label-only cards stay compact — a tall
    # empty box says nothing.
    tail = (0.34 + bh if bh else 0.0) + (0.34 + fh if fh else 0.0) \
        + (0.22 + prov_h if prov_h else 0.0)
    if any(st.get("body") for st in steps):
        row_h = min(2.05, max(row_h, (FOOT_TOP - y0 - tail) * 0.60))

    group = row_h + tail
    y = centre(y0, FOOT_TOP, group)

    x = ML
    for i, st in enumerate(steps):
        strong = st.get("strong", False)
        box(slide, x, y, cw, row_h,
            fill=PRIMARY_SOFT if strong else SURFACE_1,
            line=PRIMARY if strong else LINE_1, lw=0.9, radius=0.13)
        ty = y + max(0.26, (row_h - content_h[i]) / 2)
        lh = block_h(tx(st["label"], lang), inner, label_size, 1.14, True)
        text(slide, x + 0.22, ty, inner, lh + 0.3,
             multiline(tx(st["label"], lang), label_size,
                       PRIMARY if strong else INK_1, True, 0, 1.14))
        ty += lh
        if st.get("term_en") and lang in ("en", "bi"):
            text(slide, x + 0.22, ty + 0.04, inner, 0.24,
                 [para(st["term_en"], T_META, INK_3, False, 0, 1.1)])
            ty += 0.26
        if st.get("body"):
            place(slide, x + 0.22, ty + 0.10, inner, st["body"], lang, T_SMALL,
                  INK_2, INK_3, False, 1.24, 2.5)
        x += cw
        if i < k - 1:
            arrow(slide, x, y, arrow_w, row_h, "\u2192", INK_3, 15)
            x += arrow_w + gap

    y += row_h
    if bh:
        y += 0.34
        band(slide, spec, lang, y)
        y += bh
    if fh:
        y += 0.34
        footnote(slide, spec, lang, y)
        y += fh
    if prov_h:
        y += 0.22
        provenance(slide, prov_text(spec["prov"], lang), y=y)
        y += prov_h
    if y > FOOT_TOP + 0.03:
        note_overflow(spec, lang, f"flow ends at {y:.2f}in")
    return slide


def _flow_compact(slide, spec, lang, y0, steps, bh, fh, prov_h):
    """
    A short list of named steps, wrapped so no label is ever broken mid-word.
    Four across is the widest that keeps a long Indonesian label on one or two
    lines; seven steps therefore read as 4 + 3, which is also easier to scan
    than seven narrow columns.
    """
    k = len(steps)
    per_row = 4 if k > 5 else k
    nrows = math.ceil(k / per_row)
    gap = 0.22
    row_gap = 0.20
    cw = (CW - (per_row - 1) * gap) / per_row
    inner = cw - 0.90

    row_h = 0.72
    for st in steps:
        if word_overflows(tx(st["label"], lang), inner, T_DIAGRAM, True):
            note_overflow(spec, lang,
                          f"step label too wide: {tx(st['label'], lang)!r}")
        row_h = max(row_h, 0.44 + block_h(tx(st["label"], lang), inner,
                                          T_DIAGRAM, 1.14, True))

    body_h = nrows * row_h + (nrows - 1) * row_gap
    group = body_h + (0.34 + bh if bh else 0.0) + (0.34 + fh if fh else 0.0) \
        + (0.22 + prov_h if prov_h else 0.0)
    y = centre(y0, FOOT_TOP, group)

    for i, st in enumerate(steps):
        r, c = divmod(i, per_row)
        x = ML + c * (cw + gap)
        ry = y + r * (row_h + row_gap)
        box(slide, x, ry, cw, row_h, fill=SURFACE_1, line=LINE_1, lw=0.9,
            radius=0.13)
        step_number(slide, x + 0.22, ry + (row_h - 0.30) / 2, 0.30, i + 1)
        lh = block_h(tx(st["label"], lang), inner, T_DIAGRAM, 1.14, True)
        text(slide, x + 0.64, ry + (row_h - lh) / 2, inner, lh + 0.3,
             multiline(tx(st["label"], lang), T_DIAGRAM, INK_1, True, 0, 1.14))

    y += body_h
    if bh:
        y += 0.34
        band(slide, spec, lang, y)
        y += bh
    if fh:
        y += 0.34
        footnote(slide, spec, lang, y)
        y += fh
    if prov_h:
        y += 0.22
        provenance(slide, prov_text(spec["prov"], lang), y=y)
        y += prov_h
    if y > FOOT_TOP + 0.03:
        note_overflow(spec, lang, f"compact flow ends at {y:.2f}in")
    return slide


def lay_columns(prs, spec, lang, n, total):
    slide = add_slide(prs, SURFACE_0)
    y0 = head(slide, spec, lang)
    cols = spec["columns"]
    k = len(cols)
    gap = 0.22
    cw = (CW - (k - 1) * gap) / k
    inner = cw - 0.62

    # measure text and air separately, so only air is squeezed
    col_text, col_air = 0.0, 0.0
    for col in cols:
        t = block_h(tx(col["label"], lang), inner, T_META, 1.15, True)
        a = 0.30 + 0.20 + 0.22
        if is_bi(lang) and col["label"]["en"] != col["label"]["id"]:
            t += 0.26
        if col.get("heading"):
            t += bi_h(col["heading"], lang, inner, T_BODY + 0.5, 1.22, True)
            a += 0.18
        for ln in col.get("lines", []):
            t += bi_h(ln, lang, inner, T_SMALL, 1.26)
            a += 0.16
        if t + a > col_text + col_air:
            col_text, col_air = t, a

    bh = band_h(spec, lang)
    prov_h = (block_h(prov_text(spec["prov"], lang), CW, T_META, 1.22)
              + 0.12) if spec.get("prov") else 0.0
    slide_air = (0.30 if bh else 0.0) + (0.22 if prov_h else 0.0)
    text_total = col_text + bh + prov_h
    g = fit_gaps(text_total, col_air + slide_air, FOOT_TOP - y0)
    if g is None:
        note_overflow(spec, lang, "columns are too dense; shorten the copy")
        g = 0.45
    col_h = col_text + col_air * g
    group = col_h + (0.30 * g + bh if bh else 0.0) \
        + (0.22 * g + prov_h if prov_h else 0.0)
    y = centre(y0, FOOT_TOP, group)

    x = ML
    for col in cols:
        strong = accent(col.get("tone", "quiet"))
        box(slide, x, y, cw, col_h, fill=SURFACE_1, line=LINE_1, lw=0.75,
            radius=0.14)
        vrule(slide, x, y, col_h, color=strong, thickness=2.5)
        ty = y + 0.30 * g
        lh = block_h(tx(col["label"], lang), inner, T_META, 1.15, True)
        text(slide, x + 0.34, ty, inner, lh + 0.3,
             multiline(tx(col["label"], lang), T_META, strong, True, 0, 1.15))
        ty += lh + 0.20 * g
        if is_bi(lang) and col["label"]["en"] != col["label"]["id"]:
            text(slide, x + 0.34, ty - 0.16, inner, 0.26,
                 [para(col["label"]["en"], T_META, INK_3, False, 0, 1.1)])
            ty += 0.20
        if col.get("heading"):
            ty += place(slide, x + 0.34, ty, inner, col["heading"], lang,
                        T_BODY + 0.5, INK_1, INK_2, True, 1.22, 2.5) + 0.18 * g
        for ln in col.get("lines", []):
            ty += place(slide, x + 0.34, ty, inner, ln, lang, T_SMALL,
                        INK_2, INK_3, False, 1.26, 2.0) + 0.16 * g
        x += cw + gap

    y += col_h
    if bh:
        y += 0.30 * g
        band(slide, spec, lang, y)
        y += bh
    if prov_h:
        y += 0.22 * g
        provenance(slide, prov_text(spec["prov"], lang), y=y)
        y += prov_h
    if y > FOOT_TOP + 0.03:
        note_overflow(spec, lang, f"columns end at {y:.2f}in")
    return slide


def lay_contrast(prs, spec, lang, n, total):
    slide = add_slide(prs, SURFACE_0)
    y0 = head(slide, spec, lang)
    gap = 0.30
    pw = (CW - gap) / 2
    inner = pw - 0.72

    bh = band_h(spec, lang)
    short_band = spec.get("band") and len(tx(spec["band"], lang)) < 34
    # A short band sits beside the notice instead of under it — in the
    # bilingual edition that recovers a whole block of height.
    side_by_side = bool(spec.get("notice")) and bool(short_band)
    notice_w = CW * (0.64 if side_by_side else 1.0)
    band_w = CW - notice_w - 0.24 if side_by_side else CW

    nh = (bi_h(spec["notice"], lang, notice_w - 1.10, T_BODY, 1.30) + 0.50) \
        if spec.get("notice") else 0.0
    if side_by_side:
        bh = band_h(spec, lang, band_w)
        nh = max(nh, bh)

    p_text, p_air = 0.0, 0.0
    for side in ("left", "right"):
        col = spec[side]
        t = block_h(tx(col["label"], lang), inner, T_META, 1.15, True)
        a = 0.30 + 0.20 + 0.22 + 0.20
        if is_bi(lang) and col["label"]["en"] != col["label"]["id"]:
            t += 0.26
        t += bi_h(col["heading"], lang, inner, 18, 1.18, True)
        for ln in col["lines"]:
            t += bi_h(ln, lang, inner - 0.22, T_SMALL, 1.26)
            a += 0.16
        if t + a > p_text + p_air:
            p_text, p_air = t, a

    tail = nh + (0.0 if side_by_side else bh)
    slide_air = (0.24 if nh else 0.0) + (0.0 if side_by_side else (0.24 if bh else 0.0))
    g = fit_gaps(p_text + tail, p_air + slide_air, FOOT_TOP - y0)
    if g is None:
        note_overflow(spec, lang, "contrast is too dense; shorten the copy")
        g = 0.45
    ph = p_text + p_air * g
    group = ph + (0.24 * g + nh if nh else 0.0) \
        + (0.0 if side_by_side else (0.24 * g + bh if bh else 0.0))
    y = centre(y0, FOOT_TOP, group, 0.45)

    for idx, side in enumerate(("left", "right")):
        col = spec[side]
        border, soft = tone(col.get("tone", "quiet"))
        strong = accent(col.get("tone", "quiet"))
        x = ML + idx * (pw + gap)
        box(slide, x, y, pw, ph, fill=soft, line=border, lw=0.9, radius=0.15)
        ty = y + 0.30 * g
        lh = block_h(tx(col["label"], lang), inner, T_META, 1.15, True)
        text(slide, x + 0.36, ty, inner, lh + 0.3,
             multiline(tx(col["label"], lang), T_META, strong, True, 0, 1.15))
        ty += lh + 0.20 * g
        if is_bi(lang) and col["label"]["en"] != col["label"]["id"]:
            text(slide, x + 0.36, ty - 0.16, inner, 0.26,
                 [para(col["label"]["en"], T_META, INK_3, False, 0, 1.1)])
            ty += 0.20
        ty += place(slide, x + 0.36, ty, inner, col["heading"], lang, 18,
                    INK_1, INK_2, True, 1.18, 3.0) + 0.22 * g
        for ln in col["lines"]:
            text(slide, x + 0.36, ty, 0.18, 0.24,
                 [para("\u00b7", T_SMALL, strong, True, 0, 1.0)])
            ty += place(slide, x + 0.58, ty, inner - 0.22, ln, lang, T_SMALL,
                        INK_2, INK_3, False, 1.26, 2.0) + 0.16 * g

    y += ph
    if nh:
        y += 0.24 * g
        box(slide, ML, y, notice_w, nh, fill=SURFACE_1, line=LINE_1, lw=0.75,
            radius=0.12)
        vrule(slide, ML, y, nh, color=INK_3, thickness=2.0)
        place(slide, ML + 0.42, y + 0.25, notice_w - 1.10, spec["notice"], lang,
              T_BODY, INK_1, INK_2, False, 1.30, 3.0)
        if side_by_side:
            band(slide, spec, lang, y, width=band_w, x=ML + notice_w + 0.24,
                 height=nh)
        y += nh
    if bh and not side_by_side:
        y += 0.24 * g
        band(slide, spec, lang, y)
        y += bh
    if y > FOOT_TOP + 0.03:
        note_overflow(spec, lang, f"contrast ends at {y:.2f}in")
    return slide


def lay_screen(prs, spec, lang, n, total):
    slide = add_slide(prs, SURFACE_0)
    y0 = head(slide, spec, lang)

    rows = []
    for row in spec["screen"]["rows"]:
        kind, body, secondary, row_tone = row[0], row[1], row[2], row[3]
        value = tx(row[4], lang) if len(row) > 4 and row[4] else None
        rows.append((kind, tx(body, lang),
                     tx(secondary, lang) if secondary else None, row_tone,
                     value))

    parts = []
    if spec.get("prov"):
        parts.append(prov_text(spec["prov"], lang))
    if lang in SCREEN_LANG_NOTE:
        parts.append(SCREEN_LANG_NOTE[lang])
    prov_line = "  ".join(parts)
    prov_h = (block_h(prov_line, CW, T_META, 1.22) + 0.22) if prov_line else 0.0

    sw = CW * 0.505
    gap = 0.46
    cow = CW - sw - gap

    need = screen_need(rows, sw)
    avail = FOOT_TOP - prov_h - y0
    scale = screen_fit(rows, sw, avail)
    if scale is None:
        note_overflow(spec, lang,
                      f"screen needs {need:.2f}in, has {avail:.2f}in")
        scale = 0.60
    frame_h = min(max(need * scale if scale < 1 else need, 2.2), avail)
    y = y0 + max(0.0, (avail - frame_h) * 0.25)
    screen_frame(slide, ML, y, sw, frame_h, tx(spec["screen"]["title"], lang),
                 rows, scale=scale)

    heights = [block_h(tx(co["label"], lang), cow - 0.20, T_META, 1.15, True)
               + 0.05
               + block_h(tx(co["body"], lang), cow - 0.20, T_SMALL, 1.24)
               + (0.04 + block_h(sx(co["body"], lang), cow - 0.20,
                                 max(BI_MIN, T_SMALL * BI_RATIO), 1.16)
                  if sx(co["body"], lang) else 0.0)
               for co in spec["callouts"]]
    co_gap = max(0.26, min(0.62, (frame_h - sum(heights))
                           / max(1, len(heights) - 1))) if len(heights) > 1 else 0
    cy = y + max(0.0, (frame_h - (sum(heights) + co_gap * (len(heights) - 1))) / 2)
    for co, hh in zip(spec["callouts"], heights):
        callout(slide, ML + sw + gap, cy, cow, tx(co["label"], lang),
                tx(co["body"], lang), sx(co["body"], lang))
        cy += hh + co_gap

    if prov_line:
        provenance(slide, prov_line, y=y + frame_h + 0.18)
    return slide


def lay_branch(prs, spec, lang, n, total):
    slide = add_slide(prs, SURFACE_0)
    y0 = head(slide, spec, lang)
    bh = band_h(spec, lang)

    spine_w = 2.55
    node_h = 0.82
    spacing = 0.44

    branch_gap = 0.34
    bw = CW - spine_w - 0.42
    bx = ML + spine_w + 0.42
    bhs = []
    for lab, body in ((spec["yes_label"], spec["yes_body"]),
                      (spec["no_label"], spec["no_body"])):
        lab_h = block_h(tx(lab, lang), bw - 0.68, T_META, 1.15, True)
        if sx(lab, lang):
            lab_h += 0.18
        bhs.append(0.26 + lab_h + 0.12
                   + bi_h(body, lang, bw - 0.68, 17, 1.22) + 0.28)
    g = fit_gaps(max(3 * node_h, sum(bhs)) + bh,
                 max(2 * spacing, branch_gap) + (0.34 if bh else 0.0),
                 FOOT_TOP - y0, floor=0.34)
    if g is None:
        note_overflow(spec, lang, "branch is too dense; shorten the copy")
        g = 0.45
    spacing *= g
    branch_gap *= g
    spine_total = 3 * node_h + 2 * spacing
    branch_total = sum(bhs) + branch_gap

    group = max(spine_total, branch_total) + (0.34 * g + bh if bh else 0.0)
    y = centre(y0, FOOT_TOP, group)

    spine_y = y + max(0.0, (max(spine_total, branch_total) - spine_total) / 2)
    cy = spine_y
    for i, node in enumerate((spec["start"], spec["middle"], spec["decision"])):
        last = i == 2
        box(slide, ML, cy, spine_w, node_h,
            fill=PRIMARY_SOFT if last else SURFACE_1,
            line=PRIMARY if last else LINE_1, lw=0.9, radius=0.13)
        nh = bi_h(node, lang, spine_w - 0.48, T_DIAGRAM, 1.12, True, 2.0)
        place(slide, ML + 0.24, cy + (node_h - nh) / 2, spine_w - 0.48, node,
              lang, T_DIAGRAM, PRIMARY if last else INK_1, INK_2, True, 1.12, 2.0)
        if i < 2:
            arrow(slide, ML, cy + node_h, spine_w, spacing, "↓", INK_3, 15)
        cy += node_h + spacing

    # The fork leaves the decision node, not the spine at large: a stub to the
    # right, one vertical run, then an arrow into each outcome.
    decision_mid = spine_y + 2 * (node_h + spacing) + node_h / 2
    fork_x = ML + spine_w + 0.20
    by = y + max(0.0, (max(spine_total, branch_total) - branch_total) / 2)
    centres, cy2 = [], by
    for hh in bhs:
        centres.append(cy2 + hh / 2)
        cy2 += hh + branch_gap
    top_y = min(min(centres), decision_mid)
    bot_y = max(max(centres), decision_mid)
    rule(slide, ML + spine_w, decision_mid, 0.21, color=INK_3, thickness=1.0)
    vrule(slide, fork_x, top_y, bot_y - top_y, color=INK_3, thickness=1.0)

    for (lab, body, tname), hh, cmid in zip(
            ((spec["yes_label"], spec["yes_body"], "ok"),
             (spec["no_label"], spec["no_body"], "info")), bhs, centres):
        strong, soft = tone(tname)
        box(slide, bx, by, bw, hh, fill=soft, line=strong, lw=0.9, radius=0.14)
        lh = block_h(tx(lab, lang), bw - 0.68, T_META, 1.15, True)
        text(slide, bx + 0.34, by + 0.26, bw - 0.68, lh + 0.3,
             multiline(tx(lab, lang), T_META, strong, True, 0, 1.15))
        if sx(lab, lang):
            text(slide, bx + 0.34, by + 0.26 + lh, bw - 0.68, 0.26,
                 [para(sx(lab, lang), T_META, INK_3, False, 0, 1.1)])
            lh += 0.18
        place(slide, bx + 0.34, by + 0.26 + lh + 0.12, bw - 0.68, body, lang,
              17, INK_1, INK_2, False, 1.22, 3.0)
        rule(slide, fork_x, cmid, 0.12, color=INK_3, thickness=1.0)
        arrow(slide, fork_x + 0.08, cmid - 0.14, 0.20, 0.28,
              "→", strong, 13)
        by += hh + branch_gap

    y += max(spine_total, branch_total)
    if bh:
        y += 0.34 * g
        band(slide, spec, lang, y)
        y += bh
    if y > FOOT_TOP + 0.02:
        note_overflow(spec, lang, f"branch ends at {y:.2f}in")
    return slide


def lay_loop(prs, spec, lang, n, total):
    slide = add_slide(prs, SURFACE_0)
    y0 = head(slide, spec, lang)
    bh = band_h(spec, lang)

    label_w = 1.95
    gap = 0.20
    arrow_w = 0.32
    lane_gap = 0.60

    lane_h = 0.86
    for label, chips, _t in ((spec["top_label"], spec["top"], 0),
                             (spec["bottom_label"], spec["bottom"], 0)):
        k = len(chips)
        cw = (CW - label_w - (k - 1) * (arrow_w + gap)) / k
        for ch in chips:
            lane_h = max(lane_h,
                         0.44 + bi_h(ch, lang, cw - 0.44, T_DIAGRAM, 1.16, True))

    g = fit_gaps(2 * lane_h + bh, lane_gap + (0.34 if bh else 0.0),
                 FOOT_TOP - y0)
    if g is None:
        note_overflow(spec, lang, "loop is too dense; shorten the copy")
        g = 0.45
    lane_gap *= g
    group = 2 * lane_h + lane_gap + (0.34 * g + bh if bh else 0.0)
    y = centre(y0, FOOT_TOP, group)

    for row, (label, chips, tname) in enumerate((
            (spec["top_label"], spec["top"], "primary"),
            (spec["bottom_label"], spec["bottom"], "info"))):
        ly = y + row * (lane_h + lane_gap)
        strong, soft = tone(tname)
        lab_h = 0.26 + (0.24 if is_bi(lang) and
                        label["en"] != label["id"] else 0.0)
        text(slide, ML, ly + (lane_h - lab_h) / 2, label_w - 0.2, 0.3,
             [para(tx(label, lang), T_META, strong, True, 0, 1.1)])
        if is_bi(lang) and label["en"] != label["id"]:
            text(slide, ML, ly + (lane_h - lab_h) / 2 + 0.22, label_w - 0.2, 0.28,
                 [para(label["en"], T_META, INK_3, False, 0, 1.05)])
        k = len(chips)
        cw = (CW - label_w - (k - 1) * (arrow_w + gap)) / k
        x = ML + label_w
        for i, ch in enumerate(chips):
            box(slide, x, ly, cw, lane_h, fill=soft, line=strong, lw=0.9,
                radius=0.13)
            chh = bi_h(ch, lang, cw - 0.44, T_DIAGRAM, 1.16, True, 2.0)
            place(slide, x + 0.22, ly + (lane_h - chh) / 2, cw - 0.44, ch,
                  lang, T_DIAGRAM, INK_1, INK_2, True, 1.16, 2.0)
            x += cw
            if i < k - 1:
                arrow(slide, x, ly, arrow_w, lane_h, "→", INK_3, 14)
                x += arrow_w + gap

    # The loop closes where it really closes: the educator's last step hands
    # over to the learner's first, so the connector traces that path.
    kt, kb = len(spec["top"]), len(spec["bottom"])
    cwt = (CW - label_w - (kt - 1) * (arrow_w + gap)) / kt
    cwb = (CW - label_w - (kb - 1) * (arrow_w + gap)) / kb
    x_from = ML + label_w + (kt - 1) * (cwt + arrow_w + gap) + cwt / 2
    x_to = ML + label_w + cwb / 2
    y_from, y_to = y + lane_h, y + lane_h + lane_gap
    mid = (y_from + y_to) / 2
    vrule(slide, x_from, y_from, mid - y_from, color=INK_3, thickness=1.0)
    rule(slide, min(x_from, x_to), mid, abs(x_from - x_to), color=INK_3,
         thickness=1.0)
    vrule(slide, x_to, mid, max(0.04, (y_to - mid) - 0.18), color=INK_3,
          thickness=1.0)
    arrow(slide, x_to - 0.13, y_to - 0.26, 0.26, 0.26, "↓", INK_3, 13)

    y += 2 * lane_h + lane_gap
    if bh:
        y += 0.34 * g
        band(slide, spec, lang, y)
        y += bh
    if y > FOOT_TOP + 0.02:
        note_overflow(spec, lang, f"loop ends at {y:.2f}in")
    return slide


def lay_list(prs, spec, lang, n, total):
    slide = add_slide(prs, SURFACE_0)
    y0 = head(slide, spec, lang)
    bh = band_h(spec, lang)

    items = spec["items"]
    per_col = math.ceil(len(items) / 2)
    gap = 0.55
    cw = (CW - gap) / 2
    inner = cw - 0.56

    heights = [bi_h(it, lang, inner, T_BODY, 1.28, False, 2.5) for it in items]
    col_needs = [sum(heights[c * per_col:(c + 1) * per_col]) for c in (0, 1)]
    rows_in_col = per_col
    item_gap = 0.26
    body_h = max(col_needs) + item_gap * (rows_in_col - 1)

    group = body_h + (0.34 + bh if bh else 0.0)
    y = centre(y0, FOOT_TOP, group)

    for c in (0, 1):
        cy = y
        x = ML + c * (cw + gap)
        for i in range(c * per_col, min(len(items), (c + 1) * per_col)):
            step_number(slide, x, cy + 0.01, 0.34, i + 1)
            place(slide, x + 0.52, cy, inner, items[i], lang, T_BODY,
                  INK_1, INK_2, False, 1.28, 2.5)
            cy += heights[i] + item_gap

    y += body_h
    if bh:
        y += 0.34
        band(slide, spec, lang, y)
        y += bh
    if y > FOOT_TOP + 0.02:
        note_overflow(spec, lang, f"list ends at {y:.2f}in")
    return slide


def lay_table(prs, spec, lang, n, total):
    """Terminology as two columns of term blocks — a real table reads too dense."""
    slide = add_slide(prs, SURFACE_0)
    y0 = head(slide, spec, lang)
    bh = band_h(spec, lang)

    rows = spec["rows"]
    ncol = 3
    per_col = math.ceil(len(rows) / ncol)
    gap = 0.42
    cw = (CW - (ncol - 1) * gap) / ncol

    heights = [0.46 + bi_h(m, lang, cw - 0.10, T_SMALL, 1.24, False, 2.0)
               for _a, _b, m in rows]
    item_gap = 0.18
    col_needs = []
    for c in range(ncol):
        idxs = list(range(c * per_col, min(len(rows), (c + 1) * per_col)))
        col_needs.append(sum(heights[i] for i in idxs)
                         + item_gap * max(0, len(idxs) - 1))
    body_h = max(col_needs)

    group = body_h + (0.30 + bh if bh else 0.0)
    y = centre(y0, FOOT_TOP, group, 0.30)

    for c in range(ncol):
        cy = y
        x = ML + c * (cw + gap)
        idxs = list(range(c * per_col, min(len(rows), (c + 1) * per_col)))
        for j, i in enumerate(idxs):
            term_id, term_en, meaning = rows[i]
            text(slide, x, cy, cw, 0.28,
                 [para(term_id, T_BODY, PRIMARY, True, 0, 1.1)])
            text(slide, x, cy + 0.22, cw, 0.26,
                 [para(term_en, T_META, INK_3, False, 0, 1.05)])
            place(slide, x, cy + 0.46, cw - 0.10, meaning, lang, T_SMALL,
                  INK_2, INK_3, False, 1.24, 2.0)
            cy += heights[i]
            if j < len(idxs) - 1:
                rule(slide, x, cy + item_gap / 2 - 0.02, cw - 0.10, color=LINE_1)
                cy += item_gap

    y += body_h
    if bh:
        y += 0.30
        band(slide, spec, lang, y)
        y += bh
    if y > FOOT_TOP + 0.02:
        note_overflow(spec, lang, f"terms end at {y:.2f}in")
    return slide


LAYOUTS = {
    "cover": lay_cover,
    "closing": lay_closing,
    "statement": lay_statement,
    "flow": lay_flow,
    "columns": lay_columns,
    "contrast": lay_contrast,
    "screen": lay_screen,
    "branch": lay_branch,
    "loop": lay_loop,
    "list": lay_list,
    "table": lay_table,
}

DARK_LAYOUTS = ("cover", "closing")


# ---------------------------------------------------------------------------
# Deck assembly
# ---------------------------------------------------------------------------
NOTE_HEAD = {"id": "CATATAN PEMAPAR (Bahasa Indonesia)",
             "en": "SPEAKER NOTES (English)"}


def speaker_notes(spec, n):
    nt = spec["notes"]
    return (f"[{n}]  {NOTE_HEAD['id']}\n\n{nt['id']}\n\n"
            f"{'-' * 64}\n\n[{n}]  {NOTE_HEAD['en']}\n\n{nt['en']}\n")


def build(slides, lang, path, title):
    prs = new_deck()
    total = len(slides)
    for i, spec in enumerate(slides, start=1):
        slide = LAYOUTS[spec["layout"]](prs, spec, lang, i, total)
        dark = spec["layout"] in DARK_LAYOUTS or spec.get("dark", False)
        if spec["layout"] != "cover":
            footer(slide, i, total,
                   color=ON_DARK_2 if dark else INK_3,
                   line=ON_DARK_2 if dark else LINE_1)
        notes(slide, speaker_notes(spec, i))
    prs.core_properties.title = title
    prs.core_properties.author = "PINTAR"
    prs.core_properties.comments = (
        "One canonical presentation rendered in three language editions from a "
        "single content model. See presentation/PROVENANCE.md."
    )
    prs.save(path)
    return total


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..")
    os.makedirs(out, exist_ok=True)

    full = C.SLIDES
    by_key = {s["key"]: s for s in C.SLIDES}
    execu = [by_key[k] for k in C.EXEC_KEYS]

    jobs = [
        (full, "id", "PINTAR-4.0-Management-Educators-ID.pptx",
         "PINTAR — Paparan Manajemen & Pendidik"),
        (full, "en", "PINTAR-4.0-Management-Educators-EN.pptx",
         "PINTAR — Management & Educator Presentation"),
        (full, "bi", "PINTAR-4.0-Management-Educators-Bilingual.pptx",
         "PINTAR — Paparan Manajemen & Pendidik (ID/EN)"),
        (execu, "id", "PINTAR-4.0-Executive-ID.pptx",
         "PINTAR — Ringkasan Eksekutif"),
        (execu, "en", "PINTAR-4.0-Executive-EN.pptx",
         "PINTAR — Executive Summary"),
    ]
    for slides, lang, name, title in jobs:
        n = build(slides, lang, os.path.join(out, name), title)
        print(f"{name:52s} {lang:3s} {n:3d} slides")

    if OVERFLOW:
        print("\nOVERFLOW — these slides do not fit and must be fixed:")
        for line in OVERFLOW:
            print("  " + line)
        sys.exit(1)
    print("\nfit check: every slide fits its frame in every edition")


if __name__ == "__main__":
    main()
