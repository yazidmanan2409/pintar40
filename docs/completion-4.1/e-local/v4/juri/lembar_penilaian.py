#!/usr/bin/env python3
"""PINTAR E · the teachers' scoring workbook (Lembar Penilaian, .xlsx) and its conversion back to the judges' CSV.

Teachers fill in an Excel workbook; PINTAR converts it, losslessly and with checks, to the CSV that nilai-juri.mjs
reads (columns item_id, juri, benar, keselarasan, pengecoh, bahasa, beban_tinjau, alasan). The criteria and scales are
the approved ones (E-DECISION-PACK §4.3a; PANDUAN-JURI §2): benar 0/1; keselarasan, pengecoh, bahasa, beban_tinjau
0/1/2; alasan required. Nothing in the frozen set is changed.

  python3 lembar_penilaian.py make <items.json> <out-dir>
      -> Lembar-Penilaian-J1.xlsx, Lembar-Penilaian-J2.xlsx (identical except the judge code). items.json is either
         judges' or key-checker's file: only item_id and its order are read.
  python3 lembar_penilaian.py tocsv <filled.xlsx> <J1|J2> <items.json> <out.csv>
      -> lembar-nilai-J1.csv / -J2.csv for nilai-juri.mjs. Refuses: wrong judge, changed or reordered question codes,
         a missing or out-of-range score, a missing reason.
  python3 lembar_penilaian.py --self-test
"""
import csv, json, sys, os, tempfile
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

FORMAT = 'pintar-lembar-penilaian/1'
COLS = ['item_id', 'juri', 'benar', 'keselarasan', 'pengecoh', 'bahasa', 'beban_tinjau', 'alasan']
# (csv column, header shown to teachers, max)
SCORES = [('benar', 'Kunci benar?\n1 = ya · 0 = tidak', 1),
          ('keselarasan', 'Sesuai tujuan\n0 · 1 · 2', 2),
          ('pengecoh', 'Mutu pengecoh\n0 · 1 · 2', 2),
          ('bahasa', 'Bahasa\n0 · 1 · 2', 2),
          ('beban_tinjau', 'Perlu diperbaiki?\n2 = tidak · 1 = sedikit · 0 = banyak', 2)]
FIRST = 6          # first data row
TEAL, SOFT, LINE = '0B4F52', 'E6F0F0', 'C9D6D6'


class Refused(Exception):
    pass


def item_ids(items_path):
    items = json.load(open(items_path, encoding='utf-8'))
    ids = [x['item_id'] for x in items]
    if len(ids) != len(set(ids)):
        raise Refused('items.json has a duplicated item_id')
    return ids


def make_one(ids, juri, path):
    wb = Workbook()
    ws = wb.active
    ws.title = 'Penilaian'
    n = len(ids)
    thin = Side(style='thin', color=LINE)
    box = Border(left=thin, right=thin, top=thin, bottom=thin)
    head_fill = PatternFill('solid', fgColor=TEAL)
    # A hidden: question code. B: number. C..G: scores. H: reason. I: done mark.
    ws['B1'] = f'Lembar Penilaian Soal · Juri {juri}'
    ws['B1'].font = Font(name='Calibri', size=16, bold=True, color=TEAL)
    ws['B2'] = ('Isi satu baris untuk setiap soal, dengan nomor yang sama seperti di Buku Soal. '
                'Ketik angkanya saja. Arti setiap nilai ada di lembar «Arti nilai» (tab di bawah).')
    ws['B2'].alignment = Alignment(wrap_text=True, vertical='top')
    ws.merge_cells('B2:I2')
    ws.row_dimensions[2].height = 32
    ws['B3'] = f'="Soal selesai: "&COUNTIF(I{FIRST}:I{FIRST + n - 1},"✓")&" dari {n}"'
    ws['B3'].font = Font(bold=True, color=TEAL, size=12)
    ws.merge_cells('B3:E3')
    headers = ['Kode soal', 'No. soal'] + [h for _, h, _ in SCORES] + ['Alasan singkat (wajib, 1–2 kalimat)', 'Lengkap']
    for c, h in enumerate(headers, 1):
        cell = ws.cell(row=FIRST - 1, column=c, value=h)
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = head_fill
        cell.alignment = Alignment(wrap_text=True, horizontal='center', vertical='center')
        cell.border = box
    ws.row_dimensions[FIRST - 1].height = 62
    for i, iid in enumerate(ids):
        r = FIRST + i
        ws.cell(row=r, column=1, value=iid)
        c = ws.cell(row=r, column=2, value=i + 1)
        c.font = Font(bold=True)
        c.alignment = Alignment(horizontal='center', vertical='top')
        for k in range(len(SCORES)):
            cell = ws.cell(row=r, column=3 + k)
            cell.alignment = Alignment(horizontal='center', vertical='top')
            cell.protection = Protection(locked=False)
            cell.border = box
        a = ws.cell(row=r, column=8)
        a.alignment = Alignment(wrap_text=True, vertical='top')
        a.protection = Protection(locked=False)
        a.border = box
        d = ws.cell(row=r, column=9, value=f'=IF(AND(COUNT(C{r}:G{r})=5,LEN(TRIM(H{r}))>0),"✓","")')
        d.alignment = Alignment(horizontal='center', vertical='top')
        d.font = Font(bold=True, color=TEAL)
        ws.cell(row=r, column=2).border = box
        d.border = box
        if i % 2:
            for col in (2, 9):
                ws.cell(row=r, column=col).fill = PatternFill('solid', fgColor=SOFT)
    last = FIRST + n - 1
    for k, (_, _, mx) in enumerate(SCORES):
        col = chr(ord('C') + k)
        dv = DataValidation(type='whole', operator='between', formula1='0', formula2=str(mx), allow_blank=True,
                            showErrorMessage=True, errorTitle='Nilai tidak sesuai',
                            error=f'Ketik {"0 atau 1" if mx == 1 else "0, 1 atau 2"}.',
                            showInputMessage=True, promptTitle='Nilai',
                            prompt=('1 = kunci benar, 0 = tidak' if mx == 1 else '0, 1 atau 2 (lihat «Arti nilai»)'))
        ws.add_data_validation(dv)
        dv.add(f'{col}{FIRST}:{col}{last}')
    # a gentle highlight for a row with scores but no reason
    ws.conditional_formatting.add(f'H{FIRST}:H{last}', FormulaRule(
        formula=[f'AND(COUNT($C{FIRST}:$G{FIRST})>0,LEN(TRIM($H{FIRST}))=0)'], fill=PatternFill('solid', fgColor='FCE8D5')))
    ws.column_dimensions['A'].hidden = True
    widths = {'A': 10, 'B': 8, 'C': 14, 'D': 12, 'E': 12, 'F': 10, 'G': 22, 'H': 58, 'I': 9}
    for k, v in widths.items():
        ws.column_dimensions[k].width = v
    ws.freeze_panes = f'C{FIRST}'
    ws.protection.sheet = True          # no password: protects headers and codes from accidental edits only
    ws.protection.formatColumns = False
    ws.protection.formatRows = False
    ws.page_setup.orientation = 'landscape'
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = f'{FIRST - 1}:{FIRST - 1}'
    # second sheet: what each score means (same wording as PANDUAN-JURI §2)
    g = wb.create_sheet('Arti nilai')
    rows = [
        ('Kolom', 'Yang dinilai', 'Nilai'),
        ('Kunci benar?', 'Kuncinya benar, pokok soalnya tidak ambigu, dan tepat satu pilihan yang benar.',
         '1 = ya · 0 = tidak (kunci salah, lebih dari satu jawaban benar, tidak ada jawaban benar, atau soal bisa dibaca dua cara)'),
        ('Sesuai tujuan', 'Soal mengukur tujuan yang tertulis, pada tingkat yang tepat untuk Kelas 5.', '2 baik · 1 kekurangan kecil · 0 kekurangan serius'),
        ('Mutu pengecoh', 'Pilihan yang salah masuk akal bagi murid, masing-masing berasal dari pemahaman keliru yang nyata, dan tidak ada yang ternyata juga benar.', '2 baik · 1 kekurangan kecil · 0 kekurangan serius'),
        ('Bahasa', 'Bahasa Indonesia yang benar, wajar, sesuai untuk anak Kelas 5, dengan istilah yang lazim di kelas.', '2 baik · 1 kekurangan kecil · 0 kekurangan serius'),
        ('Perlu diperbaiki?', 'Seberapa banyak perbaikan yang diperlukan sebelum Anda mau menyetujui soal ini.', '2 = setujui apa adanya · 1 = cukup suntingan ringan · 0 = harus ditulis ulang atau ditolak'),
        ('Alasan singkat', 'Wajib untuk setiap soal, satu atau dua kalimat. Bila memberi 0 atau 1 di kolom mana pun, sebutkan kekurangannya.', '—'),
    ]
    for r, row in enumerate(rows, 1):
        for c, v in enumerate(row, 1):
            cell = g.cell(row=r, column=c, value=v)
            cell.alignment = Alignment(wrap_text=True, vertical='top')
            cell.border = box
            if r == 1:
                cell.font = Font(bold=True, color='FFFFFF')
                cell.fill = head_fill
    g.column_dimensions['A'].width = 18
    g.column_dimensions['B'].width = 60
    g.column_dimensions['C'].width = 48
    g.protection.sheet = True
    # hidden metadata, for the conversion only
    m = wb.create_sheet('_pintar')
    m['A1'], m['B1'] = 'format', FORMAT
    m['A2'], m['B2'] = 'juri', juri
    m['A3'], m['B3'] = 'n', n
    m.sheet_state = 'veryHidden'
    wb.active = 0
    wb.save(path)


def make(items_path, out_dir):
    ids = item_ids(items_path)
    os.makedirs(out_dir, exist_ok=True)
    for j in ('J1', 'J2'):
        make_one(ids, j, os.path.join(out_dir, f'Lembar-Penilaian-{j}.xlsx'))
    return len(ids)


def _int(v, mx, where):
    if v is None or (isinstance(v, str) and not v.strip()):
        raise Refused(f'{where}: kosong')
    if isinstance(v, bool):
        raise Refused(f'{where}: bukan angka')
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    if isinstance(v, str) and v.strip().isdigit():
        v = int(v.strip())
    if not isinstance(v, int) or not 0 <= v <= mx:
        raise Refused(f'{where}: {v!r} di luar 0–{mx}')
    return v


def tocsv(xlsx, juri, items_path, out_csv):
    ids = item_ids(items_path)
    wb = load_workbook(xlsx, data_only=True)
    if '_pintar' not in wb.sheetnames or 'Penilaian' not in wb.sheetnames:
        raise Refused('not a PINTAR scoring workbook')
    m = wb['_pintar']
    if m['B1'].value != FORMAT:
        raise Refused(f'format {m["B1"].value!r}, expected {FORMAT}')
    if m['B2'].value != juri:
        raise Refused(f'this workbook is for {m["B2"].value}, not {juri}')
    ws = wb['Penilaian']
    rows, problems = [], []
    for i, iid in enumerate(ids):
        r = FIRST + i
        got = ws.cell(row=r, column=1).value
        no = ws.cell(row=r, column=2).value
        if got != iid or no != i + 1:
            raise Refused(f'row {r}: question code {got!r} / number {no!r}, expected {iid} / {i + 1}')
        rec = {'item_id': iid, 'juri': juri}
        for k, (name, _, mx) in enumerate(SCORES):
            try:
                rec[name] = _int(ws.cell(row=r, column=3 + k).value, mx, f'soal {i + 1} ({iid}), {name}')
            except Refused as e:
                problems.append(str(e))
        reason = ws.cell(row=r, column=8).value
        reason = '' if reason is None else str(reason).strip()
        if not reason:
            problems.append(f'soal {i + 1} ({iid}), alasan: kosong')
        rec['alasan'] = reason
        rows.append(rec)
    if ws.cell(row=FIRST + len(ids), column=1).value not in (None, ''):
        raise Refused('extra rows after the last question')
    if problems:
        raise Refused('incomplete: ' + '; '.join(problems[:20]) + (f' (+{len(problems) - 20} more)' if len(problems) > 20 else ''))
    with open(out_csv, 'w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=COLS, lineterminator='\n')
        w.writeheader()
        w.writerows(rows)
    return len(rows)


def self_test():
    ok = 0
    bad = 0

    def check(c, msg):
        nonlocal ok, bad
        print(('PASS ' if c else 'FAIL ') + msg)
        ok += bool(c)
        bad += (not c)

    d = tempfile.mkdtemp()
    ids = [f'B{1 + (i >= 30)}-{(i % 30) + 1:03d}' for i in range(60)]
    ip = os.path.join(d, 'items.json')
    json.dump([{'item_id': x} for x in ids], open(ip, 'w'))
    check(make(ip, d) == 60, 'make: 60 rows, two workbooks')
    p = os.path.join(d, 'Lembar-Penilaian-J1.xlsx')
    wb = load_workbook(p)
    ws = wb['Penilaian']
    check(ws.column_dimensions['A'].hidden and wb['_pintar'].sheet_state == 'veryHidden', 'codes hidden; metadata very hidden')
    check([ws.cell(row=FIRST + i, column=2).value for i in range(60)] == list(range(1, 61)), 'numbers 1–60 in order')
    # fill as a teacher would, with a comma and quotes in a reason
    for i in range(60):
        for k in range(5):
            ws.cell(row=FIRST + i, column=3 + k, value=(1 if k == 0 else (i + k) % 3))
        ws.cell(row=FIRST + i, column=8, value=f'Soal jelas, "kunci" tepat; nomor {i + 1}.')
    f = os.path.join(d, 'filled.xlsx')
    wb.save(f)
    out = os.path.join(d, 'J1.csv')
    check(tocsv(f, 'J1', ip, out) == 60, 'tocsv: 60 rows')
    rows = list(csv.DictReader(open(out, encoding='utf-8')))
    check([r['item_id'] for r in rows] == ids and all(r['juri'] == 'J1' for r in rows), 'tocsv: codes and judge preserved')
    check(rows[4]['alasan'] == 'Soal jelas, "kunci" tepat; nomor 5.' and rows[4]['keselarasan'] == str((4 + 1) % 3), 'tocsv: reason with comma and quotes kept exactly; scores kept')
    for args, what in [((f, 'J2', ip, out), 'wrong judge'),]:
        try:
            tocsv(*args)
            check(False, f'refuses {what}')
        except Refused:
            check(True, f'refuses {what}')
    wb = load_workbook(f)
    wb['Penilaian'].cell(row=FIRST + 3, column=5, value=3)
    wb['Penilaian'].cell(row=FIRST + 7, column=8, value='  ')
    g = os.path.join(d, 'bad.xlsx')
    wb.save(g)
    try:
        tocsv(g, 'J1', ip, out)
        check(False, 'refuses an out-of-range score and an empty reason')
    except Refused as e:
        check('di luar' in str(e) and 'alasan: kosong' in str(e), 'refuses an out-of-range score and an empty reason, naming both')
    wb = load_workbook(f)
    wb['Penilaian'].cell(row=FIRST + 2, column=1, value='B9-999')
    wb.save(g)
    try:
        tocsv(g, 'J1', ip, out)
        check(False, 'refuses a changed question code')
    except Refused:
        check(True, 'refuses a changed question code')
    print(f'{ok} passed, {bad} failed')
    return bad == 0


if __name__ == '__main__':
    a = sys.argv[1:]
    try:
        if a == ['--self-test']:
            sys.exit(0 if self_test() else 1)
        elif a[:1] == ['make'] and len(a) == 3:
            print(make(a[1], a[2]), 'rows per workbook')
        elif a[:1] == ['tocsv'] and len(a) == 5:
            print(tocsv(*a[1:]), 'rows written')
        else:
            print(__doc__)
            sys.exit(2)
    except Refused as e:
        print('REFUSED:', e)
        sys.exit(1)
