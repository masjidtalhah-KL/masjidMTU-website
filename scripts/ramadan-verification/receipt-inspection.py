import json, unittest
from pathlib import Path
import pdfplumber
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'.cache/ramadan-102b/visual'
STEMS=['receipt-normal','receipt-multi-item','receipt-long-multipage']
class ReceiptInspection(unittest.TestCase):
 def test_malay_branding_and_immutable_values(self):
  s=json.loads((OUT/'receipt-normal.json').read_text(encoding='utf-8')); r=PdfReader(OUT/'receipt-normal.pdf'); text=' '.join(' '.join(p.extract_text() for p in r.pages).split())
  for label in ['RESIT SUMBANGAN RAMADAN','MASJID TALHAH BIN UBAIDILLAH','Nama Penyumbang','No. Resit','Rujukan Tajaan','Tarikh Bayaran','Tarikh Disahkan','Pindahan Bank — Bank Islam','Jumlah Bayaran','Resit ini dijana secara digital dan tidak memerlukan tandatangan.']:
   self.assertIn(label,text)
  compact=''.join(text.split())
  for value in [s['receipt_number'],s['reference'],s['payer_name'],'RM 373.56','01/10/2026','18/10/2026 22:00 MYT']:
   self.assertIn(''.join(value.split()),compact)
 def test_exact_item_rows_and_open_semantics(self):
  for stem in STEMS:
   s=json.loads((OUT/(stem+'.json')).read_text(encoding='utf-8'));text=''.join(''.join(p.extract_text() for p in PdfReader(OUT/(stem+'.pdf')).pages).split())
   for item in s['items']:
    self.assertIn(''.join(item['offering_name'].split()),text)
   self.assertNotIn('lembu/bahagian',text);self.assertNotIn('0123456789',text);self.assertNotIn('synthetic@example.test',text);self.assertNotIn('RPF-',text)
 def test_a4_multipage_headers_and_final_total(self):
  r=PdfReader(OUT/'receipt-long-multipage.pdf');self.assertGreater(len(r.pages),5)
  for index,p in enumerate(r.pages):
   self.assertAlmostEqual(float(p.mediabox.width),595.28,places=1);self.assertAlmostEqual(float(p.mediabox.height),841.89,places=1)
   t=p.extract_text();self.assertIn('RESIT SUMBANGAN RAMADAN',t);self.assertIn('Halaman '+str(index+1),t)
   if index<len(r.pages)-1:self.assertIn('Program Tajaan',t)
  self.assertIn('Jumlah Bayaran',r.pages[-1].extract_text());self.assertIn('tidak memerlukan tandatangan',r.pages[-1].extract_text())
 def test_no_text_clipping(self):
  for stem in STEMS:
   with pdfplumber.open(OUT/(stem+'.pdf')) as doc:
    for p in doc.pages:
     for c in p.chars:
      self.assertGreaterEqual(c['x0'],40,stem);self.assertLessEqual(c['x1'],555,stem);self.assertGreaterEqual(c['top'],25,stem);self.assertLessEqual(c['bottom'],817,stem)
if __name__=='__main__':unittest.main()
