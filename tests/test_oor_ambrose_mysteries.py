import importlib.util
import unittest
from pathlib import Path

FILE = Path(__file__).resolve().parents[1] / "tools" / "import_oor_ambrose_mysteries.py"
spec = importlib.util.spec_from_file_location("ambrose", FILE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class AmbroseImporterTests(unittest.TestCase):
    def fixture(self):
        return "<html><body><h2>Introduction</h2><p>Scholarly commentary.</p>" + "".join(
            f"<p><b>{n}.</b> Ambrose teaches in section {n}: " +
            ("The mysteries of baptism and the grace of Christ are celebrated. " * 3) +
            "</p>" for n in range(1, 59)) + "</body></html>"

    def test_all_numbered_sections_match_office_appointments(self):
        data, count = mod.import_readings(self.fixture(), {})
        self.assertEqual(count, 7)
        for work, sections in mod.APPOINTMENTS.items():
            entry = data["Ambrose of Milan|" + work]
            self.assertEqual(len(entry["p"]), len(sections))
            self.assertEqual(entry["edition"], "historical-alternative")
            self.assertNotIn("icel-web-policy", entry)
            self.assertIn("not the First Edition ICEL wording", entry["src"])
            for actual, number in zip(entry["p"], sections):
                self.assertIn("section " + str(number) + ":", actual)
        self.assertEqual(mod.import_readings(self.fixture(), data)[1], 0)

    def test_mismatches_are_rejected(self):
        doc = self.fixture().replace("<b>58.</b>", "<b>57.</b>")
        with self.assertRaises(ValueError):
            mod.parse(doc)
        old = {"Ambrose of Milan|On the Mysteries 1-7": {"p": ["wrong"]}}
        with self.assertRaises(ValueError):
            mod.import_readings(self.fixture(), old)

    def test_incomplete_source_does_not_import(self):
        with self.assertRaises(ValueError):
            mod.parse("<p>1. Ambrose on the sacraments.</p>")

if __name__ == "__main__":
    unittest.main()
