import datetime
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

from fetch_readings import FEED, MONTHS, PODCAST, add_audio, main, track_id

class DailyReadingsAudioTests(unittest.TestCase):
    def test_track_id_escaped(self):
        for url in [
            'https://api.soundcloud.com/tracks/2418304374',
            'https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F2418304374',
            'https%253A%252F%252Fapi.soundcloud.com%252Ftracks%252F2418304374',
        ]:
            self.assertEqual(track_id(url), '2418304374')

    def test_missing_audio_retries_and_preserves_existing(self):
        days = {'2026-11-23': {'audio': '123'}, '2026-11-24': {}}
        def unavailable(url):
            raise OSError('temporary failure')
        self.assertEqual(add_audio(days, unavailable), ['2026-11-24'])
        self.assertEqual(days['2026-11-23']['audio'], '123')
        def recovered(url):
            if url == PODCAST:
                return ''
            self.assertTrue(url.endswith('november-24-2026'))
            return 'https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F2418304374'
        self.assertEqual(add_audio(days, recovered), [])
        self.assertEqual(days['2026-11-24']['audio'], '2418304374')

    def test_near_term_podcast_can_arrive_before_its_readings(self):
        today = datetime.date(2026, 11, 27)
        days = {'2026-11-27': {'audio': '123', 'sections': [{'cite': 'Existing reading'}]}}
        requested = []

        def fetch(url):
            if url == PODCAST:
                return ''
            requested.append(url.rsplit('/', 1)[-1])
            if url.endswith('november-28-2026'):
                return ''
            return 'https://api.soundcloud.com/tracks/456'

        self.assertEqual(add_audio(days, fetch, preview_from=today), [])
        self.assertEqual(requested, [
            'daily-mass-reading-podcast-november-28-2026',
            'daily-mass-reading-podcast-november-29-2026',
        ])
        self.assertNotIn('2026-11-28', days)
        self.assertEqual(days[today.isoformat()]['sections'], [{'cite': 'Existing reading'}])
        self.assertEqual(days['2026-11-29'], {
            'link': 'https://bible.usccb.org/bible/readings/112926.cfm',
            'sections': [],
            'audio': '456',
        })

    def test_import_keeps_saved_readings_and_adds_audio_during_a_readings_feed_outage(self):
        today = datetime.datetime.now(ZoneInfo('America/New_York')).date()
        date = today.isoformat()
        suffix = '-day' if (today.month, today.day) == (12, 25) else ''
        slug = f'daily-mass-reading-podcast-{MONTHS[today.month - 1]}-{today.day}-{today.year}{suffix}'
        saved = {'sections': [{'label': 'Gospel', 'cite': 'John 1:1', 'text': 'Test fixture'}]}

        for failure in (TimeoutError('test timeout'), b'<html>Unavailable</html>'):
            with self.subTest(failure=failure), tempfile.TemporaryDirectory() as directory:
                archive = Path(directory, 'readings.json')
                archive.write_text(json.dumps({date: saved, '_copyright': 'Test source credit'}))

                def open_url(request, timeout):
                    url = request.full_url
                    if url == FEED:
                        if isinstance(failure, Exception):
                            raise failure
                        return io.BytesIO(failure)
                    if url == f'{PODCAST}/{slug}':
                        return io.BytesIO(b'https://api.soundcloud.com/tracks/456')
                    return io.BytesIO(b'')

                with (
                    patch('sys.argv', ['fetch_readings.py', '--out', str(archive), '--no-justice']),
                    patch('fetch_readings.urllib.request.urlopen', side_effect=open_url),
                    patch.dict('os.environ', {'ORA_READINGS_PUBLICATION_MODE': 'full'}),
                ):
                    main()

                updated = json.loads(archive.read_text())
                self.assertEqual(updated[date]['sections'], saved['sections'])
                self.assertEqual(updated[date]['audio'], '456')
                self.assertEqual(updated['_copyright'], 'Test source credit')

    def test_christmas_replaces_legacy_track_with_the_daytime_recording(self):
        date = '2026-12-25'
        base = f'{PODCAST}/daily-mass-reading-podcast-december-25-2026'
        days = {date: {'audio': '111'}}
        attempts = []

        def fetch(url):
            if url == PODCAST:
                return f'<a href="{base}-night">Night</a><a href="{base}-day">Day</a>'
            attempts.append(url)
            self.assertEqual(url, f'{base}-day')
            return 'https://api.soundcloud.com/tracks/333'

        self.assertEqual(add_audio(days, fetch), [])
        self.assertEqual(days[date], {'audio': '333', 'audio_suffix': 'day'})
        self.assertEqual(add_audio(days, fetch), [])
        self.assertEqual(attempts, [f'{base}-day'])

        days[date] = {}

        def missing_day(url):
            if url == PODCAST:
                return f'<a href="{base}-night">Night</a>'
            self.assertEqual(url, f'{base}-day')
            return ''

        self.assertEqual(add_audio(days, missing_day), [date])
        self.assertEqual(days[date], {})

    def test_an_indexed_alternate_keeps_its_suffix_with_its_track(self):
        date = '2026-11-26'
        base = f'{PODCAST}/daily-mass-reading-podcast-november-26-2026'
        days = {date: {}}
        urls = {
            PODCAST: f'<a href="{base}-weekday">Weekday</a>',
            base: '',
            f'{base}-weekday': 'https://api.soundcloud.com/tracks/456',
        }
        self.assertEqual(add_audio(days, urls.__getitem__), [])
        self.assertEqual(days[date], {'audio': '456', 'audio_suffix': 'weekday'})

        days[date] = {}
        urls[PODCAST] = f'<a href="{base}-thanksgiving">Thanksgiving</a>'
        urls[f'{base}-thanksgiving'] = 'https://api.soundcloud.com/tracks/789'
        self.assertEqual(add_audio(days, urls.__getitem__), [date])
        self.assertEqual(days[date], {})

if __name__ == '__main__':
    unittest.main()
