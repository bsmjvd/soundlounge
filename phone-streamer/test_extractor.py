# python -m unittest phone-streamer/test_extractor.py  (stdlib only; yt-dlp not needed)
import os
import socket
import sys
import time
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(__file__))
import extractor  # noqa: E402

V6 = [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("2001:db8::1", 443, 0, 0))]
DOH = [(socket.AF_INET6, socket.SOCK_STREAM, 6, "", ("2001:db8::2", 443, 0, 0))]


def failing(*_args, **_kwargs):
    raise socket.gaierror(7, "No address associated with hostname")


class RacingResolverTest(unittest.TestCase):
    def setUp(self):
        extractor._dns_cache.clear()

    def resolve(self, real, doh, host="rr1.googlevideo.com"):
        with mock.patch.object(extractor, "_real_getaddrinfo", real), mock.patch.object(extractor, "_doh", doh):
            return extractor._getaddrinfo(host, 443, socket.AF_INET6, socket.SOCK_STREAM)

    def test_fast_system_answer_is_used_and_cached(self):
        doh = mock.Mock(return_value=DOH)
        self.assertEqual(self.resolve(lambda *a: V6, doh), V6)
        self.assertEqual(self.resolve(failing, doh), V6)  # served from cache
        doh.assert_not_called()

    def test_stalled_system_lookup_is_beaten_by_doh(self):
        t = time.time()
        self.assertEqual(self.resolve(lambda *a: time.sleep(3) or V6, lambda *a: DOH), DOH)
        self.assertLess(time.time() - t, 2)

    def test_failed_system_lookup_falls_through_to_doh(self):
        t = time.time()
        self.assertEqual(self.resolve(failing, lambda *a: DOH), DOH)
        self.assertLess(time.time() - t, 0.5)  # no 1 s wait when the system lookup already failed

    def test_both_failing_reuses_an_expired_answer(self):
        extractor._dns_cache[("rr1.googlevideo.com", 443, socket.AF_INET6)] = (time.time() - 1, V6)
        self.assertEqual(self.resolve(failing, failing), V6)

    def test_both_failing_without_history_raises(self):
        with self.assertRaises(socket.gaierror):
            self.resolve(failing, failing)

    def test_ip_literals_skip_the_race(self):
        real = mock.Mock(return_value=V6)
        doh = mock.Mock()
        self.assertEqual(self.resolve(real, doh, host="2606:4700:4700::1111"), V6)
        doh.assert_not_called()


if __name__ == "__main__":
    unittest.main()
