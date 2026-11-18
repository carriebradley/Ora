"""Offline parser regression fixtures: all content below is invented."""
import sys
import unittest
from pathlib import Path
from docx import Document
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from import_melkite_propers import extract, hymns

class MelkiteProperImportTests(unittest.TestCase):
    def fixture(self):
        book=Document()
        for n in [1,8,11,14,15,21,22,29]:
            book.add_paragraph(f'Sunday, November {n}, 2026')
            book.add_paragraph('Liturgy of St. John Chrysostom')
            if n not in (15,22):continue
            book.add_paragraph('Hymns:')
            book.add_paragraph('Troparion of Resurrection (Tone 8)')
            book.add_paragraph(f'Fictional long prayer words for {n} written for extraction testing.')
            book.add_paragraph('Troparion of the patron of the church')
            book.add_paragraph('Kondakion (Tone 4)')
            book.add_paragraph('An entirely fictional kontakion prayer about mercy and hope.')
            book.add_paragraph('Epistle: Ephesians 4:1-7')
            book.add_paragraph('PROKIMENON: (Tone 8)')
            book.add_paragraph('Fictional prokeimenon from a made-up verse.')
            book.add_paragraph('Stichon: Another fictional refrain.')
            book.add_paragraph('READING from the Epistle of Paul')
            book.add_paragraph('BRETHREN, private reading material must never be shown.')
            book.add_paragraph('ALLELUIA: (Tone 8)')
            book.add_paragraph('Fictional Alleluia refrain.')
            book.add_paragraph('Gospel: Luke 10:25-37')
            book.add_paragraph('At that time the long Gospel begins.')
            book.add_paragraph('Homily on the Gospel')
            book.add_paragraph('Confidential sermon must never be shown.')
            book.add_paragraph('يا رب ارحم')
        return book
    def test_trisagion_selection_is_not_mistaken_for_a_hymn(self):
        for selection in ['Trisagion or Instead of the Trisagion: fictional alternative',
                          'Instead of the Trisagion: fictional alternative']:
            prayers, unresolved = hymns(['Hymns:', 'Kondakion (Tone 2)', selection, 'Epistle: Sample'])
            self.assertEqual(prayers, [])
            self.assertEqual(unresolved, ['Kondakion (Tone 2)'])
        prayers, unresolved = hymns(['Hymns:', 'Kondakion (Tone 2)',
                                     'An entirely fictional hymn about mercy and hope.', 'Epistle: Sample'])
        self.assertEqual(len(prayers), 1)
        self.assertEqual(unresolved, [])

    def test_extract_only_appointed_english_hymns(self):
        days=extract(self.fixture())['days']
        self.assertEqual(set(days),{'2026-11-15','2026-11-22'})
        day=days['2026-11-15']
        self.assertEqual(day['church'],'melkite')
        self.assertEqual(day['iso'],'2026-11-15')
        self.assertEqual(set(day['groups']),{'troparia','prokeimenon','alleluia'})
        text=str(day)
        self.assertIn('Fictional long prayer words',text)
        self.assertNotIn('BRETHREN',text)
        self.assertNotIn('Confidential sermon',text)
        self.assertNotIn('يا رب',text)
        self.assertNotIn('Troparion of the patron of the church:',text)
        self.assertIn('Patronal hymn determined locally',day['unresolved'])

if __name__=='__main__':unittest.main()
