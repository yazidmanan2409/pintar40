#!/usr/bin/env python3
"""PINTAR E · J3's workbook: only the routed questions, only the columns J3 must decide, with both judges' reasons.

The routing itself is the frozen `nilai-juri.mjs j3` (it writes lembar-nilai-J3.csv: item_id, perlu_dinilai, alasan_J1,
alasan_J2, catatan_pemeriksa_kunci). This script only turns that list into a teacher-friendly Excel workbook and back,
like lembar_penilaian.py does for J1 and J2. lembar_penilaian.py is unchanged.

  python3 lembar_j3.py make <lembar-nilai-J3.csv> <items.json> <out.xlsx> [--catatan ID=TEXT ...]
      -> Lembar-Penilaian-J3.xlsx. --catatan adds a wording note for the educators, shown below the table and never scored
         (E-KFLAG-RECORD: B1-016).
  python3 lembar_j3.py tocsv <filled.xlsx> <lembar-nilai-J3.csv> <items.json> <out.csv>
      -> J3.csv for `nilai-juri.mjs json`: item_id, juri=J3, only the routed columns, alasan. Refuses a changed or
         reordered code, a routed column that is missing or out of range, a column that was not routed but is filled,
         and an empty reason.
  python3 lembar_j3.py --self-test
"""
import csv, json, sys, os, tempfile
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation

FORMAT = 'pintar-lembar-penilaian-j3/1'
COLS = ['item_id', 'juri', 'benar', 'keselarasan', 'pengecoh', 'bahasa', 'beban_tinjau', 'alasan']
SCORES = [('benar', 'Kunci benar?\n1 = ya · 0 = tidak', 1),
          ('keselarasan', 'Sesuai tujuan\n0 · 1 · 2', 2),
          ('pengecoh', 'Mutu pengecoh\n0 · 1 · 2', 2),
          ('bahasa', 'Bahasa\n0 · 1 · 2', 2),
          ('beban_tinjau', 'Perlu diperbaiki?\n2 = tidak · 1 = sedikit · 0 = banyak', 2)]
FIRST = 6
TEAL, SOFT, LINE, OFF = '0B4F52', 'E6F0F0', 'C9D6D6', 'EDEDED'


class Refused(Exception):
    pass


def read_routing(path):
    with open(path, encoding='utf-8') as f:
        first = f.readline(); f.seek(0)
        rows = list(csv.DictReader(f, delimiter=';' if first.count(';') > first.count(',') else ','))
    out = []
    for r in rows:
        need = [x for x in (r.get('perlu_dinilai') or '').split() if x]
        if not need or any(x not in dict((n, 1) for n, _, _ in SCORES) for x in need):
            raise Refused(f'{r.get("item_id")}: perlu_dinilai {r.get("perlu_dinilai")!r}')
        out.append({'id': r['item_id'], 'need': need, 'j1': r.get('alasan_J1', ''), 'j2': r.get('alasan_J2', ''),
                    'flag': r.get('catatan_pemeriksa_kunci', '')})
    return out


def numbers(items_path):
    with open(items_path, encoding='utf-8') as f:
        return {it['item_id']: i + 1 for i, it in enumerate(json.load(f))}


def make(routing_path, items_path, out_xlsx, catatan=()):
    rows, no = read_routing(routing_path), numbers(items_path)
    thin = Side(style='thin', color=LINE)
    box = Border(left=thin, right=thin, top=thin, bottom=thin)
    wb = Workbook(); ws = wb.active; ws.title = 'Penilaian'
    ws['B1'] = 'Lembar Penilaian Soal · Juri J3'
    ws['B1'].font = Font(name='Calibri', size=16, bold=True, color=TEAL)
    ws['B2'] = ('Hanya soal-soal di bawah ini yang perlu Anda putuskan. Isi kolom yang berwarna putih saja '
                '(kolom abu-abu tidak perlu diisi), lalu tulis alasan singkat. Alasan J1 dan J2 ada di sebelah kanan. '
                'Nomor soal sama dengan nomor di Buku Soal.')
    ws['B2'].alignment = Alignment(wrap_text=True, vertical='top')
    ws.merge_cells('B2:K2'); ws.row_dimensions[2].height = 46
    headers = ['Kode soal', 'No. soal'] + [h for _, h, _ in SCORES] + ['Alasan Anda (wajib)', 'Alasan J1', 'Alasan J2', 'Catatan pemeriksa kunci']
    for c, h in enumerate(headers, 1):
        cell = ws.cell(row=FIRST - 1, column=c, value=h)
        cell.font = Font(bold=True, color='FFFFFF'); cell.fill = PatternFill('solid', fgColor=TEAL)
        cell.alignment = Alignment(wrap_text=True, horizontal='center', vertical='center'); cell.border = box
    ws.row_dimensions[FIRST - 1].height = 62
    for i, r in enumerate(rows):
        row = FIRST + i
        ws.cell(row=row, column=1, value=r['id'])
        c = ws.cell(row=row, column=2, value=no[r['id']]); c.font = Font(bold=True); c.border = box
        c.alignment = Alignment(horizontal='center', vertical='top')
        for k, (name, _, mx) in enumerate(SCORES):
            cell = ws.cell(row=row, column=3 + k); cell.border = box
            cell.alignment = Alignment(horizontal='center', vertical='top')
            if name in r['need']:
                cell.protection = Protection(locked=False)
                dv = DataValidation(type='whole', operator='between', formula1='0', formula2=str(mx), allow_blank=True,
                                    showErrorMessage=True, errorTitle='Nilai tidak sesuai',
                                    error=f'Ketik {"0 atau 1" if mx == 1 else "0, 1 atau 2"}.')
                ws.add_data_validation(dv); dv.add(cell.coordinate)
            else:
                cell.value = '—'; cell.fill = PatternFill('solid', fgColor=OFF)
        a = ws.cell(row=row, column=8); a.protection = Protection(locked=False); a.border = box
        a.alignment = Alignment(wrap_text=True, vertical='top')
        for col, key in ((9, 'j1'), (10, 'j2'), (11, 'flag')):
            cc = ws.cell(row=row, column=col, value=r[key] or '—'); cc.border = box
            cc.alignment = Alignment(wrap_text=True, vertical='top'); cc.fill = PatternFill('solid', fgColor=SOFT)
        ws.row_dimensions[row].height = 60
    nrow = FIRST + len(rows) + 1
    for iid, text in catatan:
        ws.cell(row=nrow, column=2, value=f'Catatan untuk pendidik (tidak dinilai) · Soal {no.get(iid, "?")} ({iid}): {text}')
        ws.cell(row=nrow, column=2).alignment = Alignment(wrap_text=True, vertical='top')
        ws.cell(row=nrow, column=2).font = Font(italic=True, color=TEAL)
        ws.merge_cells(start_row=nrow, start_column=2, end_row=nrow, end_column=11)
        ws.row_dimensions[nrow].height = 48; nrow += 1
    ws.column_dimensions['A'].hidden = True
    for k, v in {'B': 8, 'C': 13, 'D': 12, 'E': 12, 'F': 10, 'G': 20, 'H': 44, 'I': 34, 'J': 34, 'K': 22}.items():
        ws.column_dimensions[k].width = v
    ws.freeze_panes = f'C{FIRST}'
    ws.protection.sheet = True; ws.protection.formatColumns = False; ws.protection.formatRows = False
    ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    m = wb.create_sheet('_pintar')
    m['A1'], m['B1'] = 'format', FORMAT
    m['A2'], m['B2'] = 'juri', 'J3'
    m['A3'], m['B3'] = 'n', len(rows)
    m.sheet_state = 'hidden'
    wb.save(out_xlsx)
    return len(rows)


def _int(v, mx, where):
    if v is None or (isinstance(v, str) and not v.strip()):
        raise Refused(f'{where}: kosong')
    try:
        f = float(str(v).strip().replace(',', '.'))
    except ValueError:
        raise Refused(f'{where}: {v!r} bukan angka')
    if f != int(f) or not 0 <= int(f) <= mx:
        raise Refused(f'{where}: {v!r} di luar 0–{mx}')
    return int(f)


def tocsv(xlsx, routing_path, items_path, out_csv):
    rows, no = read_routing(routing_path), numbers(items_path)
    wb = load_workbook(xlsx, data_only=True)
    if '_pintar' not in wb.sheetnames or wb['_pintar']['B1'].value != FORMAT or wb['_pintar']['B2'].value != 'J3':
        raise Refused('not the J3 workbook')
    ws = wb['Penilaian']; out, problems = [], []
    for i, r in enumerate(rows):
        row = FIRST + i
        if ws.cell(row=row, column=1).value != r['id'] or ws.cell(row=row, column=2).value != no[r['id']]:
            raise Refused(f'row {row}: code {ws.cell(row=row, column=1).value!r}, expected {r["id"]}')
        rec = {k: '' for k in COLS}; rec.update(item_id=r['id'], juri='J3')
        for k, (name, _, mx) in enumerate(SCORES):
            v = ws.cell(row=row, column=3 + k).value
            if name in r['need']:
                try:
                    rec[name] = _int(v, mx, f'{r["id"]}, {name}')
                except Refused as e:
                    problems.append(str(e))
            elif v not in (None, '', '—'):
                problems.append(f'{r["id"]}, {name}: tidak perlu diisi')
        a = ws.cell(row=row, column=8).value
        a = '' if a is None else str(a).strip()
        if not a:
            problems.append(f'{r["id"]}, alasan: kosong')
        rec['alasan'] = a; out.append(rec)
    if problems:
        raise Refused('incomplete: ' + '; '.join(problems))
    with open(out_csv, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=COLS, lineterminator='\n'); w.writeheader(); w.writerows(out)
    return len(out)


def self_test():
    d = tempfile.mkdtemp(); ok = True
    items = [{'item_id': f'B1-00{i}'} for i in range(1, 6)]
    json.dump(items, open(os.path.join(d, 'items.json'), 'w'))
    with open(os.path.join(d, 'route.csv'), 'w', encoding='utf-8') as f:
        f.write('item_id;juri;perlu_dinilai;benar;keselarasan;pengecoh;bahasa;beban_tinjau;alasan;alasan_J1;alasan_J2;catatan_pemeriksa_kunci\n')
        f.write('B1-002;J3;bahasa beban_tinjau;;;;;;;"kata ""x"", kurang";oke;\n')
        f.write('B1-004;J3;pengecoh;;;;;;;a;b;\n')
    x = os.path.join(d, 'J3.xlsx')
    def check(c, msg):
        nonlocal ok
        print(('PASS ' if c else 'FAIL ') + msg); ok = ok and c
    check(make(os.path.join(d, 'route.csv'), os.path.join(d, 'items.json'), x, [('B1-001', 'catatan')]) == 2, 'make: two routed rows')
    wb = load_workbook(x); ws = wb['Penilaian']
    check(ws['C6'].value == '—' and ws['I6'].value == 'kata "x", kurang' and ws['B6'].value == 2, 'make: unrouted columns closed; J1 reason with quotes and comma shown; booklet number')
    refused = False
    try: tocsv(x, os.path.join(d, 'route.csv'), os.path.join(d, 'items.json'), os.path.join(d, 'o.csv'))
    except Refused: refused = True
    check(refused, 'tocsv refuses an empty sheet')
    ws['F6'] = 1; ws['G6'] = 0; ws['H6'] = 'istilah kurang lazim'; ws['E7'] = 2; ws['H7'] = 'baik'; wb.save(x)
    check(tocsv(x, os.path.join(d, 'route.csv'), os.path.join(d, 'items.json'), os.path.join(d, 'o.csv')) == 2, 'tocsv: two rows')
    rows = list(csv.DictReader(open(os.path.join(d, 'o.csv'), encoding='utf-8')))
    check(rows[0]['bahasa'] == '1' and rows[0]['beban_tinjau'] == '0' and rows[0]['pengecoh'] == '' and rows[1]['pengecoh'] == '2', 'tocsv: only routed columns carried')
    ws['C7'] = 1; wb.save(x); refused = False
    try: tocsv(x, os.path.join(d, 'route.csv'), os.path.join(d, 'items.json'), os.path.join(d, 'o.csv'))
    except Refused: refused = True
    check(refused, 'tocsv refuses a filled column that was not routed')
    return ok


if __name__ == '__main__':
    a = sys.argv[1:]
    try:
        if a == ['--self-test']:
            sys.exit(0 if self_test() else 1)
        if a[:1] == ['make'] and len(a) >= 4:
            cat = []
            rest = a[4:]
            while rest:
                if rest[0] != '--catatan' or len(rest) < 2 or '=' not in rest[1]:
                    raise Refused('usage')
                cat.append(tuple(rest[1].split('=', 1))); rest = rest[2:]
            print(f'{make(a[1], a[2], a[3], cat)} questions for J3')
        elif a[:1] == ['tocsv'] and len(a) == 5:
            print(f'{tocsv(*a[1:])} rows written')
        else:
            print(__doc__); sys.exit(2)
    except Refused as e:
        print('REFUSED  ' + str(e)); sys.exit(1)
