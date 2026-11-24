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

if __name__ == '__main__':
    unittest.main()
