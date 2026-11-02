# Studio's MCQ quality pass, run on a lesson package before it is uploaded.
#
# Mirrors public.run_mcq_quality (supabase/migrations/20260919090000_staff_authoring_rpcs_
# check_their_capability.sql) rule for rule, so a package that is clean here is clean in
# Studio:
#   STEM_REVEALS_ANSWER             ERROR    a 6+ character word of the correct option (split on
#                                            single spaces, lower case) is in the question and in
#                                            no distractor; blocks publishing
#   CORRECT_OPTION_LENGTH_IMBALANCE WARNING  correct option longer than twice the longest distractor
#   IMPLAUSIBLE_DISTRACTOR          WARNING  a distractor shorter than a third of the average option
#   WEAK_MISCONCEPTION_LINKAGE      WARNING  no distractor carries a misconception code
#   ANSWER_POSITION_SKEW            WARNING  10+ questions and one letter holds more than half the answers
#
# and Studio's student-text check, validate_course_content: every pattern of public.doctrine_lexicon
# (supabase/migrations/20260912200500_validator_and_publish_readiness.sql), case-insensitive, on
# every field in public.learner_readable_fields: lesson title, summary, body and objective; question
# stem, stimulus and petunjuk; option body and Alasan; and, with --miskonsepsi, the CSV's
# remediation. An ERROR there blocks "Kunci terbitan" and cannot be acknowledged.
#
# With --miskonsepsi <csv> the codes the CSV proposes (column `questions`, e.g. "PB3:C;L2S4:B")
# count as linked, to show what the pass will say once the codes are registered and filled in.
#
# Also checked here, because Studio refuses the upload or the brief requires it: every option has
# an Alasan, exactly one correct option, four options A-D, a difficulty on every question.
#
# Run: python3 docs/onboarding/konten/periksa_mutu.py <package.json> [--miskonsepsi <csv>]
# e.g. python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten-sintetis/SD5-Sintetis-Bab1.paket.json
# F-4 (D-145(b)): the real chapters and their misconception CSVs left this public tree for the private content store;
# the synthetic corpus in docs/onboarding/konten-sintetis is clean here (0 ERROR, 0 WARNING per chapter).
import csv
import json
import re
import sys
from collections import Counter


def like(hay, token):
    """Postgres `hay LIKE '%' || token || '%'`, where _ and % in the token are wildcards."""
    pola = "".join("." if ch == "_" else ".*" if ch == "%" else re.escape(ch) for ch in token)
    return re.search(pola, hay, re.S) is not None


# public.doctrine_lexicon, pattern for pattern (Postgres \y is \b here), with its label and severity.
LEKSIKON = [
    (r"\bsalah\b(?!\s+satu)", 'kata menghakimi: "salah"', "ERROR"),
    (r"\b(gagal|bodoh|malas)\b", "kata menghakimi tentang siswa", "ERROR"),
    (r"\b(wrong|incorrect|failed|stupid|penalty)\b", "judgemental English term", "ERROR"),
    (r"\b(INGESTED|STRUCTURED|VALIDATED|VALIDATION_FAILED|IN_REVIEW|APPROVED|FROZEN|SUPERSEDED)\b",
     "status internal bocor ke teks siswa", "ERROR"),
    (r"\b(evidence_class|OFFICIAL|PREVIEW|SYNTHETIC|PUBLIC_DEMO)\b", "istilah bukti internal bocor ke teks siswa", "ERROR"),
    (r"\bPINTAR\s*4\.0\b", "nama versi internal", "WARNING"),
]


def periksa_teks(teks, tempat):
    """public.validate_learner_text: every lexicon rule the text breaks, with the words that broke it."""
    hasil = []
    for pola, label, sev in LEKSIKON:
        kena = [m.group(0) for m in re.finditer(pola, teks or "", re.I)]
        if kena:
            hasil.append((sev, "DOCTRINE_LEXICON", tempat, f"{label}: {', '.join(sorted(set(kena)))}"))
    return hasil


def soal_dari(paket):
    for c in paket["courses"]:
        for m in c["modules"]:
            for l in m["lessons"]:
                for i in l["items"]:
                    yield l, i


def periksa(paket, tautan=None):
    tautan = tautan or set()
    temuan = []
    semua = list(soal_dari(paket))

    # the student-text check, lesson fields first
    for c in paket["courses"]:
        for m in c["modules"]:
            for l in m["lessons"]:
                obj = (l.get("objective") or {}).get("statement")
                for kolom, teks in (("title", l.get("title")), ("summary", l.get("summary")),
                                    ("body_markdown", l.get("body_markdown")), ("objective", obj)):
                    temuan += periksa_teks(teks, f"pelajaran {l['ordinal']} {kolom}")
    for l, i in semua:
        for kolom in ("stem", "stimulus", "petunjuk"):
            temuan += periksa_teks(i.get(kolom), f"{i['ref']} {kolom}")
        for o in i["options"]:
            temuan += periksa_teks(o.get("body"), f"{i['ref']}:{o['label']} body")
            temuan += periksa_teks(o.get("rationale"), f"{i['ref']}:{o['label']} Alasan")

    for l, i in semua:
        ref = i["ref"]
        opsi = i["options"]
        benar = [o for o in opsi if o["is_correct"]]
        salah = [o for o in opsi if not o["is_correct"]]
        tempat = f"{ref} (pelajaran {l['ordinal']})"

        # the upload contract and the brief
        if len(benar) != 1:
            temuan.append(("ERROR", "ONE_CORRECT_OPTION", tempat, f"{len(benar)} correct options"))
        if sorted(o["label"] for o in opsi) != ["A", "B", "C", "D"]:
            temuan.append(("ERROR", "FOUR_OPTIONS_A_TO_D", tempat, ",".join(o["label"] for o in opsi)))
        for o in opsi:
            if not (o.get("rationale") or "").strip():
                temuan.append(("ERROR", "OPTION_REASON_MISSING", tempat, o["label"]))
        if not i.get("difficulty"):
            temuan.append(("ERROR", "DIFFICULTY_MISSING", tempat, ""))
        # ITEM_HINT_REVEALS_ANSWER: public.hint_reveals_answer_shape, and the hint naming the answer
        hint = i.get("petunjuk") or ""
        if hint and (re.search(r"(jawab\w*|answer|kunci|key)[^.!?]{0,24}(adalah|ialah|is|:|=)\s*\(?[a-e]\)?\b", hint, re.I)
                     or re.search(r"\b(bukan|not|selain|exclude[sd]?|eliminate)\s+\(?[a-e]\)?\b", hint, re.I)
                     or re.search(r"\b\(?[a-e]\)?\s+(atau|or)\s+\(?[a-e]\)?\b", hint, re.I)
                     or any(o["body"].lower() in hint.lower() for o in benar)):
            temuan.append(("ERROR", "ITEM_HINT_REVEALS_ANSWER", tempat, hint))
        if not benar:
            continue
        oc = benar[0]

        # CORRECT_OPTION_LENGTH_IMBALANCE
        if salah and len(oc["body"]) > 2 * max(len(o["body"]) for o in salah):
            temuan.append(("WARNING", "CORRECT_OPTION_LENGTH_IMBALANCE", tempat,
                           f"correct {len(oc['body'])} chars, longest distractor {max(len(o['body']) for o in salah)}"))

        # STEM_REVEALS_ANSWER
        stem = i["stem"].lower()
        for token in sorted({t for t in oc["body"].lower().split(" ") if len(t) >= 6}):
            if like(stem, token) and not any(like(o["body"].lower(), token) for o in salah):
                temuan.append(("ERROR", "STEM_REVEALS_ANSWER", tempat, f"'{token}' is in the question and only in {oc['label']}"))

        # IMPLAUSIBLE_DISTRACTOR
        # one finding per question, as Studio raises it; the detail names every short option
        rata = sum(len(o["body"]) for o in opsi) / len(opsi)
        pendek = [o for o in salah if len(o["body"]) * 3 < rata]
        if pendek:
            temuan.append(("WARNING", "IMPLAUSIBLE_DISTRACTOR", tempat,
                           ", ".join(f"{o['label']} is {len(o['body'])} chars" for o in pendek) + f"; option average {rata:.1f}"))

        # WEAK_MISCONCEPTION_LINKAGE
        if salah and not any(o.get("misconception_code") or f"{ref}:{o['label']}" in tautan for o in salah):
            temuan.append(("WARNING", "WEAK_MISCONCEPTION_LINKAGE", tempat, "no distractor carries a misconception code"))

    # ANSWER_POSITION_SKEW, over the whole course
    huruf = Counter(o["label"] for _, i in semua for o in i["options"] if o["is_correct"])
    if len(semua) >= 10 and max(huruf.values()) * 2 > sum(huruf.values()):
        temuan.append(("WARNING", "ANSWER_POSITION_SKEW", "course", dict(sorted(huruf.items()))))
    return temuan, semua, huruf


def periksa_miskonsepsi(path):
    """The CSV's remediation is student-readable (misconception_taxonomy.remediation)."""
    temuan, tautan = [], set()
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            tautan |= {q.strip() for q in r["questions"].split(";") if q.strip()}
            temuan += periksa_teks(r.get("remediation"), f"{r['code']} remediation")
    return temuan, tautan


def main(argv):
    if not argv or argv[0].startswith("-"):
        print(__doc__ or "usage: periksa_mutu.py <package.json> [--miskonsepsi <csv>]")
        return 2
    paket = json.load(open(argv[0], encoding="utf-8"))
    temuan_csv, tautan = [], set()
    if "--miskonsepsi" in argv:
        temuan_csv, tautan = periksa_miskonsepsi(argv[argv.index("--miskonsepsi") + 1])

    temuan, semua, huruf = periksa(paket, tautan)
    temuan += temuan_csv
    for sev, kode, tempat, rinci in temuan:
        print(f"{sev:7} {kode:32} {tempat:22} {rinci}")
    guna = Counter(i.get("use") or "PRACTICE" for _, i in semua)
    # not a Studio rule: how often the correct option is the (strictly) longest, a pattern students learn
    terpanjang = sum(1 for _, i in semua
                     if any(o["is_correct"] and all(len(o["body"]) > len(p["body"]) for p in i["options"] if p is not o)
                            for o in i["options"]))
    print(f"questions {len(semua)}: pre {guna['PRE_TEST']}, post {guna['POST_TEST']}, practice {guna['PRACTICE']}; "
          f"answers " + " ".join(f"{k}={huruf.get(k, 0)}" for k in "ABCD")
          + f"; correct option strictly longest in {terpanjang}")
    per = Counter(k for _, k, _, _ in temuan)
    err = sum(1 for s, *_ in temuan if s == "ERROR")
    print(f"TOTAL: {err} ERROR, {len(temuan) - err} WARNING"
          + (f" ({', '.join(f'{k} {n}' for k, n in sorted(per.items()))})" if per else ""))
    return 1 if err else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
