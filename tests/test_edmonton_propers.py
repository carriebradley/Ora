"""Pure parser checks; fixtures contain invented hymn and Scripture text."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from import_edmonton_propers import extract


class EdmontonPropersTests(unittest.TestCase):
    def test_sections_exclude_scripture_and_other_offices(self):
        html = """<main><article>
          <div class="liturgical-day-service-body">
            <h3>Troparia and Kontakia</h3>
            <p>Troparion, Tone 8: Fixture hymn about the Resurrection.</p>
            <p>Kontakion, Tone 8: Fixture hymn about mercy.</p>
            <h3>Prokeimenon, Tone 8</h3>
            <p>Fixture prokeimenon.</p><p>verse: Fixture psalm verse.</p>
            <h3>Epistle</h3><p>Ephesians 4:1-6</p>
            <p>Brothers and Sisters, this is fictional Scripture prose.</p>
            <h3>Alleluia, Tone 8</h3><p>verse: Fictional Alleluia.</p>
            <h3>Gospel</h3><p>Luke 10:25-37</p>
            <p>At that time, this is fictional Gospel prose.</p>
            <h3>Communion Hymn</h3><p>Fixture communion verse.</p>
          </div>
          <div class="liturgical-day-service-body">
            <h3>Other Office</h3><p>This material must not appear.</p>
          </div></article></main>"""
        day = extract(html, '2026-11-15')
        groups = day['groups']
        self.assertEqual(day['church'], 'ukrainian')
        self.assertEqual(groups['troparia'], [
            'Troparion, Tone 8: Fixture hymn about the Resurrection.',
            'Kontakion, Tone 8: Fixture hymn about mercy.'])
        self.assertEqual(groups['prokeimenon'], [
            'Prokeimenon, Tone 8', 'Fixture prokeimenon.',
            'verse: Fixture psalm verse.'])
        self.assertEqual(groups['alleluia'], ['Alleluia, Tone 8', 'verse: Fictional Alleluia.'])
        self.assertEqual(groups['communion'], ['Fixture communion verse.'])
        self.assertNotIn('Ephesians', str(day))
        self.assertNotIn('Luke', str(day))
        self.assertNotIn('Other Office', str(day))

    def test_english_lookalike_is_normalized(self):
        html = ('<main><div class="liturgical-day-service-body">'
                '<p>Troparia and Kontakia</p>'
                '<p>Тeach us through mercy.</p></div></main>')
        result = extract(html, '2026-11-20')
        self.assertEqual(result['groups']['troparia'], ['Teach us through mercy.'])

    def test_fail_closed_when_no_liturgy_section(self):
        with self.assertRaisesRegex(ValueError, 'missing liturgical-day'):
            extract('<main><h2>Hours</h2></main>', '2026-11-15')

    def test_fail_closed_if_scripture_is_mislabeled_as_hymn(self):
        html = ('<main><div class="liturgical-day-service-body">'
                '<p>Troparia and Kontakia</p>'
                '<p>Brothers and Sisters, should not be imported.</p></div></main>')
        with self.assertRaisesRegex(ValueError, 'Scripture prose'):
            extract(html, '2026-11-15')


if __name__ == '__main__':
    unittest.main()
