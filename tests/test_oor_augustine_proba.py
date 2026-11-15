import importlib.util
import unittest
from pathlib import Path

FILE = Path(__file__).resolve().parents[1]/"tools"/"import_oor_augustine_proba.py"
spec = importlib.util.spec_from_file_location("augustine_proba", FILE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ProbaImporterTests(unittest.TestCase):
    def fixture(self):
        paragraphs = []
        for n in range(1, 32):
            chapter = n if n <= 3 else (8 if n in (15,16,17) else 9 if n==18 else 10 if n in (19,20) else 11 if n==21 else 12 if n in (22,23) else 13 if n==24 else 14 if n in (25,26,27) else 15 if n==28 else 16 if n>=29 else 4)
            paragraphs.append(f"<h2>Chapter {chapter}</h2><p>{n}. Prayer to God in section {n}. " + "Let our hope grow in charity and patient prayer. "*8 + "</p>")
        return "<html>"+"".join(paragraphs)+"</html>"

    def test_exact_six_appointments(self):
        out,count=module.import_readings(self.fixture(), {})
        self.assertEqual(count,6)
        for name, numbers in module.APPOINTMENTS.items():
            rec=out["Augustine|"+name]
            self.assertEqual(len(rec["p"]),len(numbers))
            self.assertEqual(rec["edition"],"historical-alternative")
            for body,(_,n) in zip(rec["p"], numbers):
                self.assertIn(f"section {n}.",body)
        self.assertEqual(module.import_readings(self.fixture(),out)[1],0)

    def test_incomplete_and_wrong_editions_rejected(self):
        with self.assertRaises(ValueError):
            module.parse("<h2>Chapter 8</h2><p>15. Too short.</p>")
        with self.assertRaises(ValueError):
            module.import_readings(self.fixture(),{"Augustine|Letter 130 to Proba 14, 25-26":{"p":["other"]}})
    def test_number_same_but_wrong_chapter_rejected(self):
        doc=self.fixture().replace("<h2>Chapter 15</h2><p>28.", "<h2>Chapter 14</h2><p>28.")
        with self.assertRaises(ValueError):
            module.parse(doc)

if __name__=="__main__":
    unittest.main()
