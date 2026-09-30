# Renders checklist_data.py as docs/coordination/RELEASE-CHECKLIST.md, the copy the gate uses.
# Run: python3 docs/coordination/checklist/render_md.py
import os
import re

import checklist_data as d

STATUS = re.compile(r"^(PASS|FAIL|PARTIAL|BLOCKED|N-T|N-I|N/A|NOT VERIFIED)\b")
ORDER = ["PASS", "PARTIAL", "FAIL", "BLOCKED", "N-I", "N-T", "NOT VERIFIED", "N/A"]


def status(baseline):
    m = STATUS.match(baseline)
    return m.group(1) if m else "N-T"


def tail(baseline, s):
    """What follows the status word: 'FAIL: reason', 'BLOCKED by B4', or nothing when only punctuation is left."""
    rest = baseline[len(s):].lstrip(": ").strip()
    if not rest.strip(". "):
        return ""
    return (" " + rest) if re.match(r"^(\(|for |by )", rest) else (": " + rest)


def now(i, b):
    """The row's status now (v2.1, v2.2), or its baseline when it has not changed."""
    return getattr(d, "CURRENT", {}).get(i, b)


def now_cell(i, b):
    n = now(i, b)
    s = status(n)
    return f"**{s}**{cell(tail(n, s))}" if n is not b else f"**{s}** (unchanged)"


def cell(text):
    return str(text).replace("|", "\\|")


def summary_rows():
    """P0 checks by baseline status, per section; the release-day checks are counted apart."""
    rows = []
    sections = [(t, getattr(d, k)) for k, t, _ in d.ROLE_SECTIONS]
    sections.append(("Universal checks", [(i, c, "", "", g, b) for i, c, g, b in d.UNIVERSAL]))
    for title, checks in sections:
        p0 = [c for c in checks if c[4].startswith("P0")]
        counts = {s: 0 for s in ORDER}
        base = {s: 0 for s in ORDER}
        for c in p0:
            counts[status(now(c[0], c[5]))] += 1
            base[status(c[5])] += 1
        rows.append((title.split(" — ")[0], len(p0), counts, base))
    return rows


def render():
    out = []
    w = out.append
    m = d.META
    w(f"# {m['title']} — {m['subtitle']}")
    w("")
    w(f"**{m['version']}.** Rendered from `docs/coordination/checklist/checklist_data.py`; edit there and re-render. "
      "The Word copy for Yazid comes from the same data.")
    w("")
    w("| | |")
    w("|---|---|")
    for k, v in m["rows"]:
        w(f"| **{k}** | {cell(v)} |")
    w("")
    w(f"> {m['principle']}")
    w("")

    b = d.BASELINE
    nw = d.NOW
    w(f"## Status at a glance ({nw['label']} `{nw['sha']}`, {nw['date']})")
    w("")
    w("P0 checks only; each must be PASS on the release candidate before any push to live. "
      f"The baseline of {b['date']} (main `{b['sha']}`) is kept beside each row.")
    w("")
    w(f"**Evidence now:** {nw['evidence']}")
    w("")
    w("| Section | P0 checks | " + " | ".join(ORDER[:6]) + " | PASS at baseline |")
    w("|---|---:|" + "---:|" * 7)
    tot = {s: 0 for s in ORDER}
    tb = {s: 0 for s in ORDER}
    n = 0
    for title, count, counts, base in summary_rows():
        n += count
        for s in ORDER:
            tot[s] += counts[s]
            tb[s] += base[s]
        w(f"| {title} | {count} | " + " | ".join(str(counts[s]) for s in ORDER[:6]) + f" | {base['PASS']} |")
    w(f"| **Total** | **{n}** | " + " | ".join(f"**{tot[s]}**" for s in ORDER[:6]) + f" | **{tb['PASS']}** |")
    w("")
    w(f"**Baseline, for comparison:** {' · '.join(f'{tb[s]} {s}' for s in ORDER[:6])}. **Evidence at baseline:** {b['evidence']}")
    w("")
    w(f"**Verdict now:** {tot['PASS']} of {n} P0 checks pass (baseline {tb['PASS']}). {d.VERDICT_NOW}")
    w("")

    w("## 1. How to use this checklist")
    w("")
    for i, t in enumerate(d.HOW_TO_USE, 1):
        w(f"{i}. {t}")
    w("")
    w("**Gate:** P0 blocks go-live · P1 is fixed before go-live or accepted in writing by Yazid · P2 is tracked after go-live.  ")
    w("**How:** AUTO automated test or harness step · LOAD load test on staging (D-031) · RUN walked by hand with screenshots · PROD read-only check on production · CODE code or database inspection.  ")
    w("**Status:** PASS · FAIL · PARTIAL · BLOCKED (by another failing check) · N-I not implemented · N-T not yet tested · N/A.")
    w("")

    w("## 2. Roles and where they land")
    w("")
    w("| Role | Lands on (D-010) | Purpose | Authority boundary |")
    w("|---|---|---|---|")
    for r in d.ROLES:
        w("| " + " | ".join(cell(x) for x in r) + " |")
    w("")
    w(d.ROLES_NOTE)
    w("")

    for n_, (k, title, intro) in enumerate(d.ROLE_SECTIONS, 3):
        w(f"## {n_}. {title}")
        w("")
        w(intro)
        w("")
        w(f"| ID | Checkpoint | Expected | How | Gate | Baseline (main {d.BASELINE['sha']}) | Now ({d.NOW['sha']}) |")
        w("|---|---|---|---|---|---|---|")
        for r in getattr(d, k):
            i, c, e, how, g, b = r
            s = status(b)
            w(f"| {i} | {cell(c)} | {cell(e)} | {how} | {g} | **{s}**{cell(tail(b, s))} | {now_cell(i, b)} |")
        w("")

    sec = 3 + len(d.ROLE_SECTIONS)
    w(f"## {sec}. Universal checks (every flow)")
    w("")
    w(f"| ID | Check | Gate | Baseline | Now ({d.NOW['sha']}) |")
    w("|---|---|---|---|---|")
    for i, c, g, b in d.UNIVERSAL:
        s = status(b)
        w(f"| {i} | {cell(c)} | {g} | **{s}**{cell(tail(b, s))} | {now_cell(i, b)} |")
    w("")

    w(f"## {sec + 1}. Release-day checks (production, read-only)")
    w("")
    w("Run after the migrations and the deploy of the release candidate. None of them writes to production.")
    w("")
    w(f"| ID | Check | Gate | At baseline | Now ({d.NOW['sha']}) |")
    w("|---|---|---|---|---|")
    for i, c, g, b in d.RELEASE:
        s = status(b)
        w(f"| {i} | {cell(c)} | {g} | **{s}**{cell(tail(b, s))} | {now_cell(i, b)} |")
    w("")

    w(f"## {sec + 2}. Known findings and where they are fixed")
    w("")
    w("| Ref | Finding | Fix | State |")
    w("|---|---|---|---|")
    for r in d.FINDINGS:
        w("| " + " | ".join(cell(x) for x in r) + " |")
    w("")

    w(f"## {sec + 3}. Run record (kept for every run, in RELEASES.md)")
    w("")
    w("| Field | What to record |")
    w("|---|---|")
    for k, v in d.RUN_RECORD:
        w(f"| {k} | {cell(v)} |")
    w("")

    w(f"## {sec + 4}. Completion rule")
    w("")
    for t in d.COMPLETION:
        w(t)
        w("")

    w("## Appendix A — sources")
    w("")
    for t in d.SOURCES:
        w(f"- {t}")
    w("")
    w("## Appendix B — what changed from the 24 September draft")
    w("")
    for t in d.CHANGES_FROM_DRAFT:
        w(f"- {t}")
    w("")
    w("## Appendix C — what changed in v2.1 and v2.2")
    w("")
    for t in d.CHANGES_V21:
        w(f"- {t}")
    w("")
    return "\n".join(out)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    target = os.path.join(here, "..", "RELEASE-CHECKLIST.md")
    with open(target, "w", encoding="utf-8") as f:
        f.write(render())
    print(os.path.normpath(target))
