# The question check Studio runs at "Kunci terbitan" (run_mcq_quality, migration
# 20260919090000_staff_authoring_rpcs_check_their_capability.sql), run on a lesson package
# BEFORE it is uploaded, so an author sees the same findings the reviewer will.
#
# Five rules, as the database states them:
#   STEM_REVEALS_ANSWER (ERROR, blocks publishing): a word of 6+ characters in the correct
#     option appears in the question and in no distractor.
#   CORRECT_OPTION_LENGTH_IMBALANCE (WARNING): the correct option is more than twice as long
#     as the longest distractor.
#   IMPLAUSIBLE_DISTRACTOR (WARNING): a distractor shorter than a third of the average option.
#   WEAK_MISCONCEPTION_LINKAGE (WARNING): no distractor carries a misconception code.
#   ANSWER_POSITION_SKEW (WARNING, per course of 10+ questions): one letter holds more than
#     half of the correct answers.
#
# Run: python3 docs/onboarding/konten/periksa_mutu.py <package.json>
# Exit 1 on any ERROR; warnings are listed and counted.
import json
import sys
from collections import Counter


def periksa(paket):
    temuan = []
    for kursus in paket["courses"]:
        benar_per_label = Counter()
        jumlah_soal = 0
        for bab in kursus["modules"]:
            for pel in bab["lessons"]:
                for soal in pel.get("items", []):
                    jumlah_soal += 1
                    ref = soal.get("ref", "?")
                    opsi = soal["options"]
                    benar = [o for o in opsi if o["is_correct"]]
                    pengecoh = [o for o in opsi if not o["is_correct"]]
                    for o in benar:
                        benar_per_label[o["label"].upper()] += 1
                    stem = soal["stem"].lower()
                    # STEM_REVEALS_ANSWER: split on single spaces, as string_to_array(lower(body), ' ') does
                    for o in benar:
                        for kata in set(o["body"].lower().split(" ")):
                            if len(kata) >= 6 and kata in stem and not any(kata in d["body"].lower() for d in pengecoh):
                                temuan.append(("ERROR", "STEM_REVEALS_ANSWER", ref, f'"{kata}" is in the question and only in the correct option'))
                    if benar and pengecoh:
                        if len(benar[0]["body"]) > 2 * max(len(d["body"]) for d in pengecoh):
                            temuan.append(("WARNING", "CORRECT_OPTION_LENGTH_IMBALANCE", ref, "the correct option is over twice the longest distractor"))
                        rata = sum(len(o["body"]) for o in opsi) / len(opsi)
                        pendek = [d["label"] for d in pengecoh if len(d["body"]) * 3 < rata]
                        if pendek:
                            temuan.append(("WARNING", "IMPLAUSIBLE_DISTRACTOR", ref, f"too short beside the others: {', '.join(pendek)}"))
                        if (soal.get("item_type") or "MCQ_SINGLE") in ("MCQ_SINGLE", "MCQ_MULTI") \
                                and not any(d.get("misconception_code") for d in pengecoh):
                            temuan.append(("WARNING", "WEAK_MISCONCEPTION_LINKAGE", ref, "no distractor has a misconception code"))
        total = sum(benar_per_label.values())
        if jumlah_soal >= 10 and total and max(benar_per_label.values()) * 2 > total:
            temuan.append(("WARNING", "ANSWER_POSITION_SKEW", kursus["title"][:40],
                           f"correct answers by letter: {dict(sorted(benar_per_label.items()))}"))
    return temuan


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: periksa_mutu.py <package.json>", file=sys.stderr)
        sys.exit(2)
    t = periksa(json.load(open(sys.argv[1], encoding="utf-8")))
    for sev, pola, ref, apa in t:
        print(f"{sev:7} {pola:32} {ref:10} {apa}")
    hitung = Counter((sev, pola) for sev, pola, _, _ in t)
    print("TOTAL", {f"{s} {p}": n for (s, p), n in sorted(hitung.items())} or "no findings")
    sys.exit(1 if any(s == "ERROR" for s, _, _, _ in t) else 0)
