import json,unittest,zipfile
from pathlib import Path
import pdfplumber,openpyxl
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.cache/ramadan-103'
class OfficeInspection(unittest.TestCase):
 def test_native_ooxml_read_by_independent_office_reader(self):
  w=openpyxl.load_workbook(OUT/'artifacts/ramadan-report-live.xlsx',read_only=False,data_only=False)
  self.assertEqual(w.sheetnames,['Ringkasan','Jadual Tajaan','Bayaran Disahkan','Butiran Program','Tindakan Admin'])
  self.assertFalse(w._external_links)
  for s in w:
   self.assertEqual(s.freeze_panes,'A4')
   for row in s:
    self.assertFalse(any(c.data_type=='f' for c in row))
 def test_ledger_matches_db_capture_exact_cents(self):
  v=json.loads((OUT/'workbook-validation.json').read_text(encoding='utf-8'))
  from decimal import Decimal
  w=openpyxl.load_workbook(OUT/'artifacts/ramadan-report-live.xlsx',data_only=True)
  total=sum(int(Decimal(str(w['Bayaran Disahkan'].cell(row=n,column=4).value))*100)for n in range(4,w['Bayaran Disahkan'].max_row+1))
  self.assertEqual(total,v['dbVerifiedMinor'])
  refs={w['Bayaran Disahkan'].cell(row=n,column=1).value for n in range(4,w['Bayaran Disahkan'].max_row+1)}
  self.assertEqual(len(refs),v['transactions'])
 def test_libreoffice_open_and_render_contains_all_five_sheets_and_safe_names(self):
  p=OUT/'render/ramadan-report-live.pdf'
  self.assertTrue(p.exists())
  with pdfplumber.open(p)as doc:
   self.assertGreaterEqual(len(doc.pages),5)
   text=' '.join((page.extract_text()or'')for page in doc.pages)
   for name in ['Ringkasan','Jadual Tajaan','Bayaran Disahkan','Butiran Program','Tindakan Admin','Hamba Allah','Belum ditaja']:
    self.assertIn(name,text)
   for n,page in enumerate(doc.pages):
    if n<5:page.to_image(resolution=95).save(OUT/'render'/('sheet-page-'+str(n+1)+'.png'))
 def test_schedule_sheet_contains_no_private_payer_contact_or_storage(self):
  w=openpyxl.load_workbook(OUT/'artifacts/ramadan-report-live.xlsx',data_only=True)
  text=' '.join(str(c.value)for row in w['Jadual Tajaan']for c in row if c.value is not None)
  for value in ['LOCAL CALENDAR PRIVATE','0123456789','storage.objects','access_secret','@example.test']:
   self.assertNotIn(value,text)
if __name__=='__main__':unittest.main()
