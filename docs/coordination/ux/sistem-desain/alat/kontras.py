"""Every text-and-ground pair PINTAR v3 uses, with its WCAG 2 contrast, computed
from project/tokens.json (rgba values composited over the ground). Writes
render/kontras.md and exits non-zero if any pair is under its floor.
   python3 docs/coordination/ux/sistem-desain/alat/kontras.py"""
import json, re, sys, os
sini = os.path.dirname(os.path.abspath(__file__))
tok = json.load(open(os.path.join(sini, '..', 'project', 'tokens.json')))
W = {t['name']: t['value'] for t in tok['color']['tokens']}
def rgb(v):
    v = W.get(v, v)
    m = re.match(r'^\{(.+)\}$', v)
    if m: return rgb(m.group(1))
    if v.startswith('#'):
        return tuple(int(v[i:i+2], 16) for i in (1, 3, 5)), 1.0
    n = [float(x) for x in re.findall(r'[\d.]+', v)]
    return (n[0], n[1], n[2]), (n[3] if len(n) > 3 else 1.0)
def di_atas(fg, bg):
    (f, a), (b, _) = rgb(fg), rgb(bg)
    return tuple(round(x * a + y * (1 - a)) for x, y in zip(f, b))
def lin(c):
    c /= 255; return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def L(c): return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
def rasio(fg, bg):
    b = rgb(bg)[0]; f = di_atas(fg, bg)
    x, y = sorted([L(f), L(b)], reverse=True); return (x + 0.05) / (y + 0.05)
# (what, foreground, ground, floor)
PASANGAN = [
  ('Body text', 'ink-1', 'surface-0', 4.5), ('Body text', 'ink-1', 'surface-1', 4.5), ('Body text', 'ink-1', 'surface-2', 4.5), ('Body text', 'ink-1', 'surface-3', 4.5),
  ('Body text, selected', 'ink-1', 'pintar-primary-soft', 4.5),
  ('Secondary text', 'ink-2', 'surface-0', 4.5), ('Secondary text', 'ink-2', 'surface-1', 4.5), ('Secondary text', 'ink-2', 'surface-2', 4.5), ('Secondary text', 'ink-2', 'pintar-primary-soft', 4.5),
  ('Metadata', 'ink-3', 'surface-0', 4.5), ('Metadata', 'ink-3', 'surface-1', 4.5), ('Metadata', 'ink-3', 'surface-2', 4.5), ('Metadata', 'ink-3', 'pintar-primary-soft', 4.5),
  ('Disabled text (WCAG-exempt; kept readable)', 'ink-disabled', 'surface-2', 3.0), ('Disabled text', 'ink-disabled', 'surface-1', 3.0),
  ('Link, quiet button', 'pintar-primary', 'surface-0', 4.5), ('Link, quiet button', 'pintar-primary', 'surface-1', 4.5), ('Link on hover ground', 'pintar-primary', 'surface-2', 4.5),
  ('Selected segment, current page', 'pintar-primary-ink', 'pintar-primary', 4.5), ('Selected segment on its track (non-text)', 'pintar-primary', 'surface-2', 3.0),
  ('Context band (question 12)', 'context-ink', 'context', 4.5),
  ('Table header label', 'ink-2', 'table-head', 4.5), ('Table text, alternate row', 'ink-1', 'table-row-alt', 4.5), ('Table metadata, alternate row', 'ink-3', 'table-row-alt', 4.5),
  ('Table text, row under the pointer', 'ink-1', 'table-row-hover', 4.5), ('Table secondary, row under the pointer', 'ink-2', 'table-row-hover', 4.5), ('Table metadata, row under the pointer', 'ink-3', 'table-row-hover', 4.5),
  ('Table link, row under the pointer', 'pintar-primary', 'table-row-hover', 4.5), ('Table metadata, selected row', 'ink-3', 'table-row-selected', 4.5), ('Table link, selected row', 'pintar-primary', 'table-row-selected', 4.5),
  ('Selected row edge (non-text)', 'pintar-primary', 'table-row-selected', 3.0),
  ('Wordmark, green on white', 'pintar-primary', 'surface-1', 4.5), ('Wordmark, green on the canvas', 'pintar-primary', 'surface-0', 4.5), ('Wordmark, white on green', 'surface-1', 'pintar-primary', 4.5), ('Wordmark, white on deep ink', 'surface-1', 'ink-1', 4.5),
  ('Primary button', 'pintar-primary-ink', 'pintar-primary', 4.5), ('Primary, hover', 'pintar-primary-ink', 'pintar-primary-hover', 4.5), ('Primary, pressed', 'pintar-primary-ink', 'pintar-primary-pressed', 4.5),
  ('Destructive confirm', 'pintar-primary-ink', 'status-blocked', 4.5), ('Destructive, hover', 'pintar-primary-ink', 'status-blocked-hover', 4.5), ('Destructive, pressed', 'pintar-primary-ink', 'status-blocked-pressed', 4.5),
  ('Destructive words', 'status-blocked', 'surface-1', 4.5), ('Destructive words, hover', 'status-blocked', 'status-blocked-soft', 4.5),
  ('Success badge / result', 'status-ok', 'status-ok-soft', 4.5), ('Success on white', 'status-ok', 'surface-1', 4.5),
  ('Attention badge', 'status-attention', 'status-attention-soft', 4.5), ('Error badge, error text', 'status-blocked', 'status-blocked-soft', 4.5),
  ('Info badge', 'status-info', 'status-info-soft', 4.5), ('Text in a banner', 'ink-1', 'status-attention-soft', 4.5), ('Text in a banner', 'ink-1', 'status-blocked-soft', 4.5),
  ('Text in a banner', 'ink-1', 'status-ok-soft', 4.5), ('Text in a banner', 'ink-1', 'status-info-soft', 4.5),
  ('Field outline (non-text, 1.4.11)', 'line-control', 'surface-1', 3.0), ('Field outline', 'line-control', 'surface-0', 3.0), ('Field outline', 'line-control', 'surface-2', 3.0),
  ('Focus ring (non-text)', 'focus-ring', 'surface-0', 3.0), ('Focus ring', 'focus-ring', 'surface-1', 3.0), ('Focus ring', 'focus-ring', 'surface-2', 3.0), ('Focus ring', 'focus-ring', 'pintar-primary-soft', 3.0),
  ('Checked control fill (non-text)', 'pintar-primary', 'surface-1', 3.0), ('Error edge (non-text)', 'status-blocked', 'surface-1', 3.0),
]
baris, gagal = [], 0
for apa, f, g, batas in PASANGAN:
    r = rasio(f, g); ok = r >= batas
    gagal += 0 if ok else 1
    baris.append(f"| {apa} | `{f}` | `{g}` | {r:.2f}:1 | {batas:g}:1 | {'pass' if ok else '**FAIL**'} |")
catatan = [
  "",
  "**For information, not a pass:**",
  f"- `line` (the hairline) on `surface-1` is {rasio('line','surface-1'):.2f}:1 and `line-strong` {rasio('line-strong','surface-1'):.2f}:1. Neither identifies a control on its own: a field uses `line-control`, and a secondary button is identified by its words.",
  f"- `status-ok` against `pintar-primary` differs by {rasio('status-ok','pintar-primary'):.2f}:1 in lightness. That is why success always carries ✓ and a word.",
]
md = "| Pair | Text or mark | Ground | Contrast | Floor | |\n|---|---|---|---|---|---|\n" + "\n".join(baris) + "\n" + "\n".join(catatan) + "\n"
os.makedirs(os.path.join(sini, '..', 'render'), exist_ok=True)
open(os.path.join(sini, '..', 'render', 'kontras.md'), 'w').write(md)
print(md); print(f"{len(PASANGAN)} pairs, {gagal} under the floor")
sys.exit(1 if gagal else 0)
