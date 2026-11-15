import importlib.util
import unittest
from pathlib import Path

path=Path(__file__).resolve().parents[1]/"tools"/"import_oor_gregory_dialogues.py"
spec=importlib.util.spec_from_file_location("dialogues",path)
dialogues=importlib.util.module_from_spec(spec)
spec.loader.exec_module(dialogues)

class DialogueTests(unittest.TestCase):
    def fixture(self):
        para="Scholastica and Benedict spoke in prayer together; at last rain came from heaven. " * 8
        headings="<p>Chapter Thirty-three: of a miracle wrought by his sister Scholastica.</p>"
        narrative="".join("<p>"+para+str(n)+"</p>" for n in range(1,7))
        return ("<html><p>Chapter Thirty-three: of a miracle wrought by his sister Scholastica.</p>"
                "<p>Chapter Thirty-four: a miracle.</p>"+headings+narrative+
                "<p>Chapter Thirty-four: how Benedict saw the soul of his sister ascend.</p>"+
                "<p>Different chapter that must never appear.</p></html>")

    def test_extract_last_heading_and_stop_before_next_chapter(self):
        entry,n=dialogues.import_reading(self.fixture(),{})
        self.assertEqual(n,1)
        v=entry[dialogues.KEY]
        self.assertEqual(len(v["p"]),6)
        self.assertNotIn("Different chapter",str(v))
        self.assertEqual(v["edition"],"historical-alternative")
        self.assertEqual(dialogues.import_reading(self.fixture(),entry)[1],0)

    def test_reject_missing_boundary_or_conflicting_text(self):
        with self.assertRaises(ValueError):
            dialogues.parse("<p>Chapter Thirty-three: of a miracle wrought by his sister Scholastica.</p>")
        with self.assertRaises(ValueError):
            dialogues.import_reading(self.fixture(),{dialogues.KEY:{"p":["other"]}})

if __name__=="__main__":
    unittest.main()
