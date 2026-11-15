import importlib.util
import unittest
from pathlib import Path

path = Path(__file__).resolve().parents[1] / "tools" / "import_oor_gregory_pastoral.py"
spec = importlib.util.spec_from_file_location("gregory", path)
gregory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gregory)

class GregoryTests(unittest.TestCase):
    def fixture(self):
        return "<html><h1>Pastoral Rule Book II</h1>" + "".join(
            f"<h2>Chapter {i}</h2><p>Title chapter {i}</p><p>" +
            (("The ruler should be discreet in keeping silence, profitable in speech. "
              if i == 4 else f"Gregory treats the conduct of pastors in chapter {i}. ") * 20) +
            "</p>" for i in range(1, 7)) + "<h2>About this page</h2><p>Editorial material.</p></html>"

    def test_import_matching_chapter(self):
        result, count = gregory.import_reading(self.fixture(), {})
        self.assertEqual(count, 1)
        entry = result[gregory.KEY]
        self.assertEqual(len(entry["p"]), 1)
        self.assertIn("keeping silence", entry["p"][0])
        self.assertNotIn("Editorial material", str(entry))
        self.assertEqual(entry["edition"],"historical-alternative")
        self.assertEqual(gregory.import_reading(self.fixture(), result)[1],0)

    def test_reject_incomplete_or_mismatched(self):
        with self.assertRaises(ValueError):
            gregory.parse(self.fixture().replace("<h2>Chapter 4</h2>", "<h2>Unknown section</h2>"))
        with self.assertRaises(ValueError):
            gregory.import_reading(self.fixture(), {gregory.KEY: {"p":["different"]}})

if __name__ == "__main__":
    unittest.main()
