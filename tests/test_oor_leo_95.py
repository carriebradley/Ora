import importlib.util
import unittest
from pathlib import Path
FILE = Path(__file__).resolve().parents[1] / "tools" / "import_oor_leo_95.py"
spec = importlib.util.spec_from_file_location("leo", FILE)
leo = importlib.util.module_from_spec(spec)
spec.loader.exec_module(leo)

class LeoParserTests(unittest.TestCase):
    def fixture(self):
        words = "Blessed are those who seek righteousness and mercy in the kingdom of Christ. " * 5
        return "<html><h1>Sermon 95</h1>" + "".join(
            f"<h2>{roman}. This part of the Beatitudes</h2><p>{words}{n}.</p>"
            for roman,n in zip(leo.ROMAN,range(1,10))) + "<h2>About this page</h2><p>NOT PART OF SERMON</p></html>"

    def test_all_five_liturgical_excerpt_groups(self):
        result, count = leo.import_readings(self.fixture(), {})
        self.assertEqual(count, 5)
        for work, numbers in leo.APPOINTMENTS.items():
            entry = result["Leo the Great|" + work]
            self.assertEqual(len(entry["p"]),len(numbers))
            self.assertEqual(entry["edition"],"historical-alternative")
            self.assertNotIn("NOT PART", " ".join(entry["p"]))
            for number in numbers:
                self.assertTrue(any(p.endswith(f"{number}.") for p in entry["p"]))
        self.assertEqual(leo.import_readings(self.fixture(), result)[1],0)

    def test_missing_or_replaced_sections_fail_closed(self):
        with self.assertRaises(ValueError):
            leo.parse(self.fixture().replace("<h2>IX.", "<h2>End."))
        with self.assertRaises(ValueError):
            leo.import_readings(self.fixture(), {"Leo the Great|Sermon 95, 2-3": {"p":["other"]}})

if __name__ == "__main__":
    unittest.main()
