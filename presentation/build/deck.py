"""
PINTAR — presentation design system.

One visual language, three language editions. This module owns the palette,
the type scale, the grid and the slide primitives; `content.py` owns the
words; `build.py` renders. Nothing here decides what is said.

Design doctrine (docs/rebuild/15 "Design language"): quiet, warm, intelligent.
Warm neutral ground, one deep-green primary, restrained semantic colour,
generous whitespace, one type family, strong hierarchy. Colour communicates
meaning, never decoration. No elevation, no gradient, no alarm.
"""

import math

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR, MSO_AUTO_SIZE
from pptx.enum.shapes import MSO_SHAPE

# --------------------------------------------------------------------------
# Palette — the PINTAR Experience tokens
# --------------------------------------------------------------------------
SURFACE_0 = RGBColor(0xFB, 0xFA, 0xF7)   # page ground, warm off-white
SURFACE_1 = RGBColor(0xFF, 0xFF, 0xFF)   # cards
SURFACE_2 = RGBColor(0xF3, 0xF1, 0xEC)   # quiet wells
INK_1 = RGBColor(0x1F, 0x2A, 0x33)       # primary text
INK_2 = RGBColor(0x4E, 0x5A, 0x64)       # secondary text
INK_3 = RGBColor(0x5F, 0x6A, 0x73)       # meta, captions
LINE_1 = RGBColor(0xE6, 0xE2, 0xDA)      # hairlines
PRIMARY = RGBColor(0x24, 0x5F, 0x55)     # deep green
PRIMARY_SOFT = RGBColor(0xE3, 0xEF, 0xEC)
PRIMARY_INK = RGBColor(0xFF, 0xFF, 0xFF)
OK = RGBColor(0x2F, 0x6E, 0x4A)
OK_SOFT = RGBColor(0xE6, 0xF1, 0xEA)
ATTENTION = RGBColor(0x8A, 0x5F, 0x00)
ATTENTION_SOFT = RGBColor(0xF7, 0xEE, 0xD8)
BLOCKED = RGBColor(0x8C, 0x3B, 0x3B)
BLOCKED_SOFT = RGBColor(0xF6, 0xE4, 0xE4)
INFO = RGBColor(0x3D, 0x5A, 0x80)
INFO_SOFT = RGBColor(0xE7, 0xED, 0xF5)
ON_DARK = RGBColor(0xF4, 0xF7, 0xF5)
ON_DARK_2 = RGBColor(0xB9, 0xCD, 0xC6)

FONT = "Plus Jakarta Sans"
MONO = "IBM Plex Mono"

# --------------------------------------------------------------------------
# Grid — 16:9, 13.333in x 7.5in
# --------------------------------------------------------------------------
W = 13.3333
H = 7.5
ML = 0.85
MR = 0.85
MT = 0.54
MB = 0.50
CW = W - ML - MR

T_DISPLAY = 40
T_STATEMENT = 33
T_TITLE = 25
T_LEDE = 16.5
T_BODY = 13.5
T_SMALL = 11.5
T_META = 9.5
T_DIAGRAM = 12.5

BI_RATIO = 0.70
BI_MIN = 10.0


def tone(name):
    """Semantic pair (strong colour, soft fill)."""
    return {
        "ok": (OK, OK_SOFT),
        "attention": (ATTENTION, ATTENTION_SOFT),
        "blocked": (BLOCKED, BLOCKED_SOFT),
        "info": (INFO, INFO_SOFT),
        "primary": (PRIMARY, PRIMARY_SOFT),
        "quiet": (LINE_1, SURFACE_1),
        "well": (LINE_1, SURFACE_2),
    }[name]


def accent(name):
    """
    The colour a tone lends to a label or an accent rule.

    `quiet` and `well` border in the hairline colour, which is correct for a
    hairline and illegible as text — so their accent is ink, not the line.
    """
    strong, _soft = tone(name)
    return INK_2 if name in ("quiet", "well") else strong


# --------------------------------------------------------------------------
# Measurement
#
# Nothing in this deck is allowed to overflow in any of the three editions,
# so every block is measured before it is placed. The estimator is
# deliberately slightly pessimistic: a little extra air is a design choice,
# a collision is a defect.
# --------------------------------------------------------------------------
_NARROW = set("iltfjrI.,'!:;|()[]{}/\\ \u00b7-\u2013\u2014")
_WIDE = set("mwMW@%\u2014")


def _char_em(c, bold):
    """Rough advance width of one character, in em, for Plus Jakarta Sans."""
    if c in _WIDE:
        w = 0.90
    elif c in _NARROW:
        w = 0.33
    elif c.isupper():
        w = 0.68
    elif c.isdigit():
        w = 0.58
    else:
        w = 0.55
    return w * (1.04 if bold else 1.0)


def _word_em(word, bold):
    return sum(_char_em(c, bold) for c in word)


def est_lines(s, width_in, size_pt, bold=False, ratio=None):
    """
    Lines this string will take, wrapped the way a renderer wraps it.

    Counting characters and dividing over-estimates how much fits: real
    glyphs differ in width and words cannot be split. So this measures each
    word and walks them greedily, as the layout engine does. `ratio` is
    accepted for callers that want to widen or tighten the estimate.
    """
    if not s:
        return 0
    avail = width_in * 72.0 / size_pt
    if ratio:
        avail *= 0.55 / ratio
    space = _char_em(" ", bold)
    lines = 0
    for seg in s.split("\n"):
        words = seg.split()
        if not words:
            lines += 1
            continue
        lines += 1
        used = 0.0
        for w in words:
            ww = _word_em(w, bold)
            need = ww if used == 0 else ww + space
            if used + need <= avail:
                used += need
            else:
                lines += 1
                used = ww
    return lines


def block_h(s, width_in, size_pt, spacing=1.15, bold=False):
    return est_lines(s, width_in, size_pt, bold) * size_pt * spacing / 72.0


def word_overflows(s, width_in, size_pt, bold=False):
    """
    True when a single word is wider than the space it is given.

    A renderer answers that by breaking the word in the middle, which no
    amount of measuring the paragraph would have caught.
    """
    if not s:
        return False
    widest = max((_word_em(w, bold) for w in s.replace("\n", " ").split()),
                 default=0.0)
    return widest * size_pt / 72.0 > width_in


# --------------------------------------------------------------------------
# Deck / slide scaffolding
# --------------------------------------------------------------------------
def new_deck():
    prs = Presentation()
    prs.slide_width = Inches(W)
    prs.slide_height = Inches(H)
    return prs


def add_slide(prs, bg=SURFACE_0):
    slide = prs.slides.add_slide(prs.slide_layouts[6])   # blank
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = bg
    return slide


def notes(slide, text_):
    slide.notes_slide.notes_text_frame.text = text_


# --------------------------------------------------------------------------
# Primitives
# --------------------------------------------------------------------------
_PML = "{http://schemas.openxmlformats.org/presentationml/2006/main}"


def _plain(sh):
    """
    Drop the theme style reference python-pptx attaches to an autoshape.

    That reference carries the theme's soft drop shadow. PINTAR's design
    language has no elevation at all, so the honest fix is to remove the
    reference rather than fight it property by property.
    """
    el = sh._element
    for st in el.findall(_PML + "style"):
        el.remove(st)
    sh.shadow.inherit = False
    return sh


def box(slide, x, y, w, h, fill=None, line=None, lw=1.0, radius=None):
    kind = MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE
    sh = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    if radius:
        short = min(w, h)
        sh.adjustments[0] = max(0.0, min(0.5, radius / short)) if short else 0.0
    if fill is None:
        sh.fill.background()
    else:
        sh.fill.solid()
        sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(lw)
    return _plain(sh)


def rule(slide, x, y, w, color=LINE_1, thickness=0.75):
    """A hairline, drawn as a thin filled rectangle so its weight is exact."""
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y),
                                Inches(w), Inches(thickness / 72.0))
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    return _plain(sh)


def vrule(slide, x, y, h, color=LINE_1, thickness=0.75):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y),
                                Inches(thickness / 72.0), Inches(h))
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    return _plain(sh)


def text(slide, x, y, w, h, lines, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
         font=FONT):
    """`lines` is a list of (string, size, colour, bold, space_before, spacing)."""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    for i, spec in enumerate(lines):
        s, size, color, bold, space_before, spacing = spec
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if space_before:
            p.space_before = Pt(space_before)
        p.space_after = Pt(0)
        if spacing:
            p.line_spacing = spacing
        r = p.add_run()
        r.text = s if s is not None else ""
        f = r.font
        f.name = font
        f.size = Pt(size)
        f.color.rgb = color
        f.bold = bold
    return tb


def para(s, size, color=INK_1, bold=False, before=0, spacing=1.12):
    return (s, size, color, bold, before, spacing)


def eyebrow(slide, s, x=ML, y=MT, color=INK_3, w=None):
    """A small uppercase label. Letter-spacing is faked with spaces."""
    if not s:
        return None
    spaced = " ".join(list(s.upper().replace(" ", " ")))
    return text(slide, x, y, w or CW, 0.3,
                [para(spaced, T_META, color, False, 0, 1.0)])


def footer(slide, n, total, wordmark="PINTAR", color=INK_3, line=LINE_1):
    rule(slide, ML, H - MB - 0.22, CW, color=line)
    text(slide, ML, H - MB - 0.10, CW * 0.6, 0.25,
         [para(wordmark, T_META, color, False, 0, 1.0)])
    text(slide, ML + CW * 0.6, H - MB - 0.10, CW * 0.4, 0.25,
         [para(f"{n}", T_META, color, False, 0, 1.0)], align=PP_ALIGN.RIGHT)


def provenance(slide, s, y=None, color=INK_3, width=CW):
    """The honest label under a reconstructed screen or a design diagram."""
    if not s:
        return
    text(slide, ML, y if y is not None else (H - MB - 0.62), width, 0.44,
         [para(s, T_META, color, False, 0, 1.22)])


def arrow(slide, x, y, w, h, glyph="→", color=INK_3, size=16):
    text(slide, x, y, w, h, [para(glyph, size, color, False, 0, 1.0)],
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


def step_number(slide, x, y, d, n, color=PRIMARY, fill=PRIMARY_SOFT):
    box(slide, x, y, d, d, fill=fill, line=None, radius=d / 2)
    text(slide, x, y + (d - 0.20) / 2, d, 0.22,
         [para(str(n), T_SMALL, color, True, 0, 1.0)], align=PP_ALIGN.CENTER)


def callout(slide, x, y, w, label, body, secondary=None, tone_name="primary"):
    """An annotation beside a screen: a coloured rule, a label, a line."""
    strong, _ = tone(tone_name)
    lh = block_h(label, w - 0.20, T_META, 1.15, True)
    bh = block_h(body, w - 0.20, T_SMALL, 1.24)
    sh_ = block_h(secondary, w - 0.20, max(BI_MIN, T_SMALL * BI_RATIO), 1.16) \
        if secondary else 0.0
    total = lh + 0.05 + bh + (0.04 + sh_ if secondary else 0.0)
    vrule(slide, x, y + 0.02, max(0.34, total), color=strong, thickness=2.0)
    lines = [para(label, T_META, strong, True, 0, 1.15),
             para(body, T_SMALL, INK_1, False, 4, 1.24)]
    if secondary:
        lines.append(para(secondary, max(BI_MIN, T_SMALL * BI_RATIO), INK_2,
                          False, 2.5, 1.16))
    text(slide, x + 0.18, y, w - 0.18, total + 0.3, lines)
    return total


# --------------------------------------------------------------------------
# Screen reconstruction
#
# A faithful layout reconstruction of a built PINTAR screen — never presented
# as a photograph of one. Row heights are measured first so a screen can
# never overflow its frame; `screen_need` lets the caller check before
# drawing, and build.py turns an overflow into a build failure rather than
# into a slide nobody looked at.
# --------------------------------------------------------------------------
SCREEN_HEAD = 0.40
SCREEN_PAD_TOP = 0.20
SCREEN_PAD_BOTTOM = 0.20
SCREEN_GAP = 0.09


def _screen_row_h(kind, body, secondary, inner_w):
    if kind == "gap":
        return 0.16
    if kind == "h1":
        h = block_h(body, inner_w, 17, 1.10, True) + 0.10
        if secondary:
            h += block_h(secondary, inner_w, T_SMALL, 1.16) + 0.06
        return h
    if kind == "lede":
        return block_h(body, inner_w, T_SMALL, 1.26) + 0.12
    if kind == "meta":
        return block_h(body, inner_w, T_META, 1.20) + 0.14
    h = 0.26 + block_h(body, inner_w - 0.36, T_SMALL, 1.12, kind == "row-strong")
    if secondary:
        h += block_h(secondary, inner_w - 0.36, T_META, 1.14) + 0.04
    return h


def _row_value(row):
    """A row may carry a right-aligned value (a count, a figure)."""
    return row[4] if len(row) > 4 else None


def screen_parts(rows, w):
    """
    Split the frame's height into the part that is text and the part that is
    air. Only the air may be compressed to fit a tighter slide; the type size
    inside a screen is the same in every edition.
    """
    inner_w = w - 0.56
    air = SCREEN_HEAD + SCREEN_PAD_TOP + SCREEN_PAD_BOTTOM
    ink = 0.0
    for i, row in enumerate(rows):
        kind, body, secondary = row[0], row[1], row[2]
        h = _screen_row_h(kind, body, secondary, inner_w)
        if kind in ("row", "row-strong"):
            air += 0.26
            ink += h - 0.26
        else:
            ink += h
        if i < len(rows) - 1:
            air += SCREEN_GAP if kind not in ("meta", "lede", "h1") else 0.04
    return ink, air


def screen_need(rows, w):
    ink, air = screen_parts(rows, w)
    return ink + air


def screen_fit(rows, w, avail):
    """The air scale that makes these rows fit `avail`, or None if they cannot."""
    ink, air = screen_parts(rows, w)
    if air <= 0:
        return 1.0
    scale = (avail - ink) / air
    if scale >= 1.0:
        return 1.0
    return scale if scale >= 0.60 else None


def screen_frame(slide, x, y, w, h, title, rows, head_fill=SURFACE_2, scale=1.0):
    inner_w = w - 0.56
    head_h = SCREEN_HEAD * scale
    pad_top = SCREEN_PAD_TOP * scale
    gap = SCREEN_GAP * scale
    row_air = 0.26 * scale
    box(slide, x, y, w, h, fill=SURFACE_1, line=LINE_1, lw=0.75, radius=0.16)
    box(slide, x, y, w, head_h, fill=head_fill, line=None, radius=0.16)
    box(slide, x, y + head_h - 0.16, w, 0.16, fill=head_fill, line=None)
    rule(slide, x, y + head_h, w, color=LINE_1)
    text(slide, x + 0.28, y + head_h / 2 - 0.08, inner_w, 0.24,
         [para(title, T_META, INK_3, False, 0, 1.0)])

    cy = y + head_h + pad_top
    for i, row in enumerate(rows):
        kind, body, secondary, row_tone = row[0], row[1], row[2], row[3]
        value = _row_value(row)
        rh = _screen_row_h(kind, body, secondary, inner_w)
        if kind in ("row", "row-strong"):
            rh = rh - 0.26 + row_air
        if kind == "gap":
            cy += rh
            continue
        if kind == "h1":
            text(slide, x + 0.28, cy, inner_w, rh,
                 [para(body, 17, INK_1, True, 0, 1.10)]
                 + ([para(secondary, T_SMALL, INK_2, False, 4, 1.16)]
                    if secondary else []))
        elif kind == "lede":
            text(slide, x + 0.28, cy, inner_w, rh,
                 [para(body, T_SMALL, INK_2, False, 0, 1.26)])
        elif kind == "meta":
            text(slide, x + 0.28, cy, inner_w, rh,
                 [para(body, T_META, INK_3, False, 0, 1.20)])
        else:
            strong, soft = tone(row_tone or "quiet")
            fill = soft if row_tone and row_tone != "quiet" else SURFACE_1
            box(slide, x + 0.28, cy, inner_w, rh, fill=fill, line=strong,
                lw=0.75, radius=0.10)
            lines = [para(body, T_SMALL, INK_1, kind == "row-strong", 0, 1.12)]
            if secondary:
                lines.append(para(secondary, T_META, INK_3, False, 3.5, 1.14))
            text(slide, x + 0.46, cy + row_air / 2, inner_w - 0.36, rh, lines)
            if value:
                text(slide, x + 0.28, cy + row_air / 2, inner_w - 0.18, rh,
                     [para(value, T_SMALL, INK_1,
                           kind == "row-strong", 0, 1.12)],
                     align=PP_ALIGN.RIGHT)
        if i < len(rows) - 1:
            cy += rh + (gap if kind not in ("meta", "lede", "h1") else 0.04)
        else:
            cy += rh
    return cy
