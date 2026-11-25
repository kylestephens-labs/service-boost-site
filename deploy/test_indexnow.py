from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from deploy import indexnow


class NotificationTest(unittest.TestCase):
    def test_only_changed_live_pages_and_retry_after_failure(self):
        base = indexnow.ORIGIN
        key = indexnow.KEY_FILE.read_text().strip()
        urls = [base + '/', base + '/smart-home']
        replies = {base + '/' + key + '.txt': key.encode(),
                   base + '/sitemap.xml': ('<urlset>' + ''.join(
                       '<url><loc>' + url + '</loc></url>' for url in urls) + '</urlset>').encode(),
                   urls[0]: b'home', urls[1]: b'devices'}
        sent = []
        def record(batch, _key):
            sent.append(batch)

        with TemporaryDirectory() as folder:
            state = Path(folder) / 'pages.json'
            self.assertTrue(indexnow.sync(replies.__getitem__, record, state))
            self.assertFalse(indexnow.sync(replies.__getitem__, record, state))
            self.assertEqual(sent, [])
            replies[urls[1]] = b'updated'
            def fail(batch, _key):
                raise OSError('unavailable')
            with self.assertRaises(OSError):
                indexnow.sync(replies.__getitem__, fail, state)
            self.assertTrue(indexnow.sync(replies.__getitem__, record, state))
            self.assertEqual(sent, [[urls[1]]])
            state.unlink()
            self.assertTrue(indexnow.sync(replies.__getitem__, record, state))
            self.assertEqual(sent, [[urls[1]]])

    def test_foreign_url_rejected_before_fetch(self):
        with self.assertRaises(ValueError):
            indexnow.page_hashes(b'<urlset><url><loc>https://example.org/</loc></url></urlset>',
                                 lambda _: self.fail('foreign URL fetched'))
