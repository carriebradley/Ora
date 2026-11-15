"""Synthetic-only test cases for the 12-month Newton source importer."""
import sys, unittest
from pathlib import Path
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
import import_melkite_propers_year as year

class MockDocument:
    def __init__(self,lines):
        self.paragraphs=[SimpleNamespace(text=line) for line in lines]

class MultiMonthTypikonTests(unittest.TestCase):
    def test_valid_dates_and_no_cross_day_hymn_leaks(self):
        fixture = MockDocument([
            "Sunday, February 1, 2026",
            "Liturgy of St. John Chrysostom",
            "Hymns:",
            "Troparion, Tone 8",
            "Completely fictional hymn about mercy used for parser testing only.",
            "Epistle: Sample",
            "PROKIMENON: (Tone 8)",
            "Sample verse for a fictional service.",
            "READING from the Epistle",
            "ALLELUIA: (Tone 8)",
            "Another fictional verse for a prayer.",
            "Gospel: Sample",
            "Sunday, February 8, 2026",
            "Liturgy of St. John Chrysostom",
            "Hymns:",
            "Troparion, Tone 1",
            "Another invented hymn specifically for the second Sunday.",
            "Epistle: Sample"
        ])
        result,seen = year.extract_month(fixture,"February")
        self.assertEqual(seen,["2026-02-01","2026-02-08"])
        self.assertEqual(set(result),set(seen))
        a,b=result[seen[0]],result[seen[1]]
        self.assertEqual(a["iso"],seen[0])
        self.assertEqual(a["typicon"],"February-2026.docx")
        self.assertIn("fictional service",str(a))
        self.assertNotIn("second Sunday",str(a))
        self.assertIn("second Sunday",str(b))
        self.assertNotIn("fictional service",str(b))

    def test_invalid_weekday_and_wrong_month_are_not_adopted(self):
        flagged=[]
        pairs=list(year.split_days(MockDocument([
            "Sunday, February 1, 2026",
            "PRIEST: First day's fictional words",
            "Sunday, February 2, 2026",
            "PRIEST: Wrong-weekday prayer must be quarantined",
            "Sunday, February 8, 2026",
            "PRIEST: Next valid day's fictional words"
        ]),"February",quarantined=flagged))
        self.assertEqual([d for d,_ in pairs],["2026-02-01","2026-02-08"])
        self.assertNotIn("Wrong-weekday",str(pairs))
        self.assertEqual(flagged[0]["date"],"2026-02-02")
        self.assertEqual(flagged[0]["actualWeekday"],"Monday")
        with self.assertRaisesRegex(ValueError,"No dated January"):
            list(year.split_days(MockDocument(["Sunday, February 1, 2026"]),"January"))

    def test_missing_or_unknown_source_is_rejected(self):
        with self.assertRaises(ValueError):
            year.extract_month(MockDocument(["Nothing usable"]),"December")
        with self.assertRaises(ValueError):
            year.document_url("2027")

    def test_november_baseline_must_be_unchanged(self):
        records={"2026-11-15":{"iso":"2026-11-15","church":"melkite","groups":{"troparia":["test"]}}}
        with self.assertRaises(Exception):
            year.verify_november(records,"melkite-propers-2026-11.json")

if __name__=="__main__":unittest.main()
