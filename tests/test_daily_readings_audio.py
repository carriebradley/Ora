import unittest
from fetch_readings import add_audio, track_id, PODCAST

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
