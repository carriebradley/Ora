import importlib.util
import unittest
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1] / "tools" / "import_oor_public_domain.py"
spec = importlib.util.spec_from_file_location("historical_import", MODULE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class HistoricalLetterImportTests(unittest.TestCase):
    def test_third_letter_with_subtitle_and_long_paragraphs(self):
        intro = "Bassula and Martin visited Condate. " * 65
        middle = "Martin continued to serve his flock. " * 80
        ending = "Abraham welcomed Martin to heaven. " * 75 + "while you read them."
        html = ("<h2>Letter 2. To Aurelius</h2><p>Wrong letter. " + "Other text " * 70 + "</p>"
                "<h2>Letter 3. To Bassula, His Mother-In-Law.</h2>"
                "<h3>How St. Martin passed from this Life to Life Eternal.</h3>"
                "<p>" + intro + "</p><p>" + middle + "</p><p>" + ending + "</p>"
                "<h2>About this page</h2><p>" + "Unrelated footer " * 80 + "</p>")
        parser = mod.Extract()
        parser.feed(html)
        self.assertEqual(len(parser.paragraphs), 3)
        self.assertTrue(mod.valid_letter(parser.paragraphs))
        self.assertNotIn("Unrelated footer", " ".join(parser.paragraphs))

    def test_incomplete_capture_is_rejected(self):
        self.assertFalse(mod.valid_letter(["Martin", "Bassula", "Condate"]))
        self.assertFalse(mod.valid_letter(["Martin " * 200, "Bassula " * 200, "Condate Abraham " * 200]))

if __name__ == "__main__":
    unittest.main()
