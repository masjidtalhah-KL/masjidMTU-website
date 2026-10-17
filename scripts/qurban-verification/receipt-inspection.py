"""Local PDF visual-contract checks; run after receipt.test.ts using PDF skill Python dependencies."""
import json
import unittest
from pathlib import Path
import pdfplumber
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / ".cache/qurban-91/visual"
STEMS = ["receipt-1-participant", "receipt-normal", "receipt-7-participants", "receipt-long-multipage"]
NOTE = "Maklumat lembu/bahagian adalah susunan pada waktu resit dikeluarkan dan tertakluk kepada perubahan"

class ReceiptInspection(unittest.TestCase):
    def data(self, stem):
        s = json.loads((ARTIFACTS / (stem + ".json")).read_text(encoding="utf-8"))
        r = PdfReader(ARTIFACTS / (stem + ".pdf"))
        return s, r, [p.extract_text() for p in r.pages]

    def test_official_malay_labels_and_public_mosque_information(self):
        _, _, pages = self.data("receipt-normal")
        t = " ".join(" ".join(pages).split())
        for v in ["RESIT PEMBAYARAN", "MASJID TALHAH BIN UBAIDILLAH", "TAMAN ALAM SUTERA", "57000 BUKIT JALIL, WILAYAH PERSEKUTUAN", "KUALA LUMPUR", "03-8074 7414", "masjidtalhahubaidillah@gmail.com", "Tarikh Bayaran", "Tarikh Disahkan", "No. Resit", "No. Rujukan QBN", "DITERIMA DARIPADA", "Nama Pemohon:", "Kempen:"]:
            self.assertIn(v, t)
        for v in ["Receipt No.", "Bill To", "Email Pemohon", "Alamat Pemohon", "Telefon Pemohon"]:
            self.assertNotIn(v, t)

    def test_immutable_values_dates_campaign_and_exact_total(self):
        s, _, pages = self.data("receipt-normal")
        t = "".join("".join(pages).split())
        for v in [s["reference"], s["receipt_number"], s["applicant_name"], s["campaign_title"], "2044", "16/10/2026", "17/10/2026 08:00 MYT", "RM 2,640.00"]:
            self.assertIn("".join(v.split()), t)

    def test_exact_dynamic_participant_rows_and_per_share_money(self):
        for stem in STEMS:
            s, _, pages = self.data(stem)
            t = " ".join(" ".join(pages).split())
            self.assertEqual(t.count("880.00") - (1 if s["amount_minor"] == 88000 else 0), len(s["participants"]))
            self.assertEqual(t.count("Jumlah Bayaran"), 1)
            self.assertEqual(t.count("Aqiqah"), sum(p["purpose"] == "aqiqah" for p in s["participants"]) + t.count("Qurban / Aqiqah"))
        for stem in STEMS[:3]:
            s, _, _ = self.data(stem)
            with pdfplumber.open(ARTIFACTS / (stem + ".pdf")) as pdf:
                tables = pdf.pages[0].extract_tables()
                rows = [row for table in tables for row in table if row and row[-1] == "880.00"]
                self.assertEqual(len(rows), len(s["participants"]))
                for row, p in zip(rows, s["participants"]):
                    self.assertEqual(row[0].replace("\n", " "), p["participant_name"])
                    self.assertEqual(row[1], "Qurban" if p["purpose"] == "qurban" else "Aqiqah")
                    self.assertEqual(row[2], str(p["cattle_number"]))
                    self.assertEqual(row[3], str(p["slot_number"]))

    def test_payment_method_exact_note_and_digital_footer(self):
        for stem in STEMS:
            _, _, pages = self.data(stem)
            t = " ".join(" ".join(pages).split())
            for value in ["Kaedah Pembayaran: Pindahan Bank — Bank Islam", "Terima kasih atas penyertaan anda.", NOTE, "Resit ini dijana secara digital dan tidak memerlukan tandatangan."]:
                self.assertIn(value, t)

    def test_a4_normal_seven_and_repeated_multipage_headers(self):
        for stem in STEMS:
            s, r, pages = self.data(stem)
            self.assertGreater(len(r.pages), 5) if stem == STEMS[-1] else self.assertEqual(len(r.pages), 1)
            for i, (p, text) in enumerate(zip(r.pages, pages)):
                self.assertAlmostEqual(float(p.mediabox.width), 595.28, places=2)
                self.assertAlmostEqual(float(p.mediabox.height), 841.89, places=2)
                self.assertIn(s["receipt_number"], text)
                self.assertIn("Halaman " + str(i+1) + " / " + str(len(pages)), text)
                if "880.00" in text:
                    for heading in ["Nama Peserta", "Tujuan", "No. Lembu", "Bahagian", "Jumlah (RM)"]:
                        self.assertIn(heading, text)

    def test_text_remains_searchable_with_no_clipping_or_page_overflow(self):
        for stem in STEMS:
            with pdfplumber.open(ARTIFACTS / (stem + ".pdf")) as pdf:
                for p in pdf.pages:
                    self.assertGreater(len(p.chars), 80)
                    for c in p.chars:
                        self.assertGreaterEqual(c["x0"], 41)
                        self.assertLessEqual(c["x1"], 554)
                        self.assertGreaterEqual(c["top"], 22)
                        self.assertLessEqual(c["bottom"], 817)
                    # Table text must stay inside its own cell, including multiline names.
                    for table in p.find_tables():
                        for row in table.rows:
                            for cell in row.cells:
                                if not cell:
                                    continue
                                x0, top, x1, bottom = cell
                                inside = [c for c in p.chars if x0 < (c["x0"]+c["x1"])/2 < x1 and top < (c["top"]+c["bottom"])/2 < bottom]
                                for c in inside:
                                    self.assertGreaterEqual(c["x0"], x0+3)
                                    self.assertLessEqual(c["x1"], x1-3)
                                    self.assertGreaterEqual(c["top"], top+2)
                                    self.assertLessEqual(c["bottom"], bottom-2)

    def test_only_official_logo_image_native_document_not_raster_background(self):
        for stem in STEMS:
            with pdfplumber.open(ARTIFACTS / (stem + ".pdf")) as pdf:
                for p in pdf.pages:
                    self.assertEqual(len(p.images), 1)
                    image = p.images[0]
                    self.assertLessEqual(image["width"], 95)
                    self.assertLessEqual(image["height"], 95)
                    self.assertGreater(len(p.lines), 0)
                    self.assertGreater(len(p.rects), 0)

    def test_no_script_or_external_resource_actions(self):
        for stem in STEMS:
            _, r, _ = self.data(stem)
            root = r.trailer["/Root"]
            for key in ["/OpenAction", "/AA"]:
                self.assertNotIn(key, root)
            for p in r.pages:
                self.assertFalse(p.get("/Annots"))

if __name__ == "__main__":
    unittest.main(verbosity=2)
