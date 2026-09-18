# -*- coding: utf-8 -*-
"""
PINTAR — cross-language and terminology audit.

The three language editions are rendered from one content model, so they
cannot drift structurally. This checks the things a shared model does not
guarantee on its own:

  1. every claim is written in both languages, and neither side is empty;
  2. canonical terminology is used, and obsolete variants are not;
  3. the Learning Safety Doctrine's forbidden words never reach a slide;
  4. no overclaim ("production ready", "guaranteed", "prevents cheating")
     survives anywhere except where the deck explicitly denies it;
  5. every slide carries speaker notes in both languages;
  6. the executive edition is a subset of the full deck, not a second story.

Run:  python3 audit.py       (exit 0 when clean)
"""

import re
import sys

import content as C

FAIL = []
NOTE = []


def walk(node, path="", out=None):
    """Yield every (path, {'id','en'}) language node in the content model."""
    out = [] if out is None else out
    if isinstance(node, dict):
        if set(node.keys()) == {"id", "en"}:
            out.append((path, node))
        else:
            for k, v in node.items():
                walk(v, f"{path}.{k}" if path else str(k), out)
    elif isinstance(node, (list, tuple)):
        for i, v in enumerate(node):
            walk(v, f"{path}[{i}]", out)
    return out


# ---------------------------------------------------------------------------
# 1 · both languages present
# ---------------------------------------------------------------------------
NODES = []
for slide in C.SLIDES:
    for path, node in walk(slide, slide["key"]):
        NODES.append((path, node))

for path, node in NODES:
    if path.endswith(".notes") or ".notes." in path:
        continue
    if not node["id"].strip() or not node["en"].strip():
        FAIL.append(f"empty side of a language pair: {path}")


# ---------------------------------------------------------------------------
# 2 · canonical terminology, and the variants it replaces
# ---------------------------------------------------------------------------
# (Indonesian canonical, English canonical)
PAIRS = [
    ("Pemetaan Awal", "Initial Mapping"),
    ("Peta Bacaan", "Reading Map"),
    ("Pelajaran", "Lessons"),
    ("Uji Penguasaan", "Mastery Check"),
    ("Hasil", "Results"),
    ("Uji Cepat", "Quick Assessment"),
    ("Sertifikat", "Certificates"),
    ("Bantuan", "Help"),
    ("Belum cukup bukti", "Not yet enough evidence"),
]

# Obsolete or prohibited, with the one slide allowed to name them: the
# terminology appendix, which exists precisely to retire them.
OBSOLETE = {
    "Kuis Cepat": {"ap-terms"},
    "Quick Quiz": set(),
    "Quick Test": set(),
    "Mastery Test": {"ap-terms"},
    "Kuis Kilat": set(),
    "Flash Quiz": set(),
    "Tidak masuk sertifikat": set(),
    "Not part of a certificate": set(),
}

# Learning Safety Doctrine — never on any surface this deck depicts.
FORBIDDEN_LEARNER = ["Salah,", " salah ", "Gagal", " gagal ", "Wrong",
                     "Incorrect", "Penalty", "Penalti"]

# The Voice Guide bans "gagal" for a person's work and permits it only for a
# machine outcome. These are the machine outcomes this deck names; anything
# else carrying the word is a defect.
MACHINE_OUTCOMES = ["verifikasi gagal", "verification fail"]

# Overclaims. Each maps to the slides allowed to contain the phrase, which
# are the ones that deny it.
OVERCLAIM = {
    "siap produksi": {"ap-boundaries"},
    "production ready": {"ap-boundaries"},
    "sudah teruji sepenuhnya": set(),
    "fully tested": set(),
    "platform lengkap": set(),
    "complete platform": set(),
    "menjamin": set(),
    "guaranteed": set(),
    "mencegah kecurangan": set(),
    "prevents cheating": set(),
    "menghilangkan bias": set(),
    "eliminates bias": set(),
    "AI-powered": set(),
    "PINTAR Foresight": set(),
}


def slide_text(slide, include_notes=False):
    out = []
    for _p, node in walk(slide):
        out.append(node["id"])
        out.append(node["en"])
    for k in ("wordmark",):
        if slide.get(k):
            out.append(slide[k])
    for row in slide.get("rows", []):
        out.extend([row[0], row[1]])
    for st in slide.get("steps", []):
        if st.get("term_en"):
            out.append(st["term_en"])
    if not include_notes:
        n = slide["notes"]
        out = [t for t in out if t not in (n["id"], n["en"])]
    return "\n".join(out)


SLIDE_TEXT = {s["key"]: slide_text(s) for s in C.SLIDES}
NOTES_TEXT = {s["key"]: s["notes"]["id"] + "\n" + s["notes"]["en"]
              for s in C.SLIDES}

for term, allowed in OBSOLETE.items():
    for key, body in SLIDE_TEXT.items():
        if term.lower() in body.lower() and key not in allowed:
            FAIL.append(f"obsolete term {term!r} on slide {key}")
    for key, body in NOTES_TEXT.items():
        if term.lower() in body.lower() and key not in allowed:
            NOTE.append(f"obsolete term {term!r} appears in the notes of "
                        f"{key} \u2014 confirm the note retires it rather "
                        f"than uses it")

for phrase, allowed in OVERCLAIM.items():
    for key, body in SLIDE_TEXT.items():
        if phrase.lower() in body.lower() and key not in allowed:
            FAIL.append(f"overclaim {phrase!r} on slide {key}")

for word in FORBIDDEN_LEARNER:
    for key, body in SLIDE_TEXT.items():
        low = " " + body.lower() + " "
        for ok in MACHINE_OUTCOMES:
            low = low.replace(ok, " ")
        if word.lower() in low:
            FAIL.append(f"forbidden learner word {word.strip()!r} on slide {key}")

# canonical pairing: an Indonesian term implies its English counterpart in
# the same node's English side, and never a different rendering of it.
for path, node in NODES:
    if ".notes" in path:
        continue
    for idn, eng in PAIRS:
        if idn in node["id"] and idn not in ("Hasil", "Pelajaran", "Bantuan",
                                             "Sertifikat"):
            # the product's own on-screen wording is never translated
            if node["id"] == node["en"]:
                continue
            if eng.lower() not in node["en"].lower() and \
                    idn.lower() not in node["en"].lower():
                NOTE.append(f"{path}: Indonesian says {idn!r}; English side "
                            f"says neither {eng!r} nor {idn!r} — verify")


# ---------------------------------------------------------------------------
# 3 · speaker notes in both languages, on every slide
# ---------------------------------------------------------------------------
for s in C.SLIDES:
    n = s.get("notes") or {}
    for lang in ("id", "en"):
        if not n.get(lang, "").strip():
            FAIL.append(f"{s['key']}: missing {lang} speaker notes")
    if len(n.get("id", "")) < 220 or len(n.get("en", "")) < 220:
        NOTE.append(f"{s['key']}: speaker notes look short for 45–90 seconds")


# ---------------------------------------------------------------------------
# 4 · the executive edition is a derived subset
# ---------------------------------------------------------------------------
keys = [s["key"] for s in C.SLIDES]
if len(keys) != len(set(keys)):
    FAIL.append("duplicate slide keys in the content model")
for k in C.EXEC_KEYS:
    if k not in keys:
        FAIL.append(f"executive edition names a slide that does not exist: {k}")
if C.EXEC_KEYS[0] != "cover" or "closing" not in C.EXEC_KEYS:
    FAIL.append("executive edition must open on the cover and reach the close")
order = [keys.index(k) for k in C.EXEC_KEYS]
if order != sorted(order):
    FAIL.append("executive edition reorders the narrative; it must not")


# ---------------------------------------------------------------------------
# 5 · the doctrine sentences are carried verbatim
# ---------------------------------------------------------------------------
VERBATIM = [
    ("idea", "id", "PINTAR membantu kita memahami apa yang sedang terjadi "
                   "dalam proses belajar"),
    ("idea", "en", "PINTAR helps us understand what is happening in the "
                   "learning process"),
    ("doctrine", "id", "PINTAR harus membuat manusia lebih terinformasi, "
                       "bukan membuat manusia tidak diperlukan."),
    ("doctrine", "en", "PINTAR should make the human better informed, not "
                       "make the human unnecessary."),
    ("observation", "id", "Selama asesmen, aktivitas sesi tertentu dapat "
                          "dicatat untuk menjaga integritas proses."),
    ("observation", "en", "During the assessment, certain session activity "
                          "may be recorded to support process integrity."),
    ("belum", "id", "BELUM ≠ TIDAK"),
    ("belum", "en", "NOT YET ≠ NO"),
]
by_key = {s["key"]: s for s in C.SLIDES}
for key, lang, phrase in VERBATIM:
    body = "\n".join(n[lang] for _p, n in walk(by_key[key]))
    if phrase not in re.sub(r"\s+", " ", body).replace("\n", " ") and \
            phrase not in body:
        FAIL.append(f"{key}: the canonical {lang} wording is not carried "
                    f"verbatim: {phrase[:48]}…")


# ---------------------------------------------------------------------------
def main():
    print(f"slides: {len(C.SLIDES)}   executive: {len(C.EXEC_KEYS)}   "
          f"language pairs checked: {len(NODES)}")
    for n in NOTE:
        print("  note   ", n)
    for f in FAIL:
        print("  FAIL   ", f)
    if FAIL:
        print(f"\n{len(FAIL)} problem(s)")
        sys.exit(1)
    print("\nlanguage audit: clean")


if __name__ == "__main__":
    main()
