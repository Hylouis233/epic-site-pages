import functools
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


class FrontendRebuildBrowserTests(unittest.TestCase):
    def setUp(self):
        handler = functools.partial(QuietHandler, directory=str(ROOT))
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        self.base_url = f"http://127.0.0.1:{self.server.server_port}/"
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    @unittest.skipUnless(PLAYWRIGHT_AVAILABLE, "playwright is not installed")
    def test_console_rebuild_desktop_and_mobile(self):
        external_requests = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)

            context = browser.new_context(viewport={"width": 1440, "height": 1000})
            page = context.new_page()
            page.on("request", lambda request: external_requests.append(request.url) if request.url.startswith("http") and not request.url.startswith(self.base_url) else None)
            page.goto(self.base_url, wait_until="networkidle")
            page.wait_for_timeout(1200)

            self.assertEqual(page.locator("html").get_attribute("lang"), "en")
            self.assertEqual(page.locator("html").get_attribute("data-theme"), "dark")

            # First-screen density: metrics and filters must sit above the fold.
            self.assertLessEqual(page.locator("#overview-grid").bounding_box()["y"], 1000)
            self.assertLessEqual(page.locator("#filters-form").bounding_box()["y"], 1000)

            # Real map: land silhouette and clustered markers must exist.
            page.locator("#map-panel").scroll_into_view_if_needed()
            page.wait_for_timeout(1200)
            self.assertGreater(page.locator(".land-shape").count(), 0)
            self.assertGreater(page.locator(".cluster-badge").count(), 0)
            self.assertGreater(page.locator(".region-sidebar__item").count(), 0)

            # Register density: compact restores the four data-bearing fields.
            page.locator("#table-panel").scroll_into_view_if_needed()
            page.wait_for_timeout(1600)
            headers = page.locator(".data-table th").all_inner_texts()
            for expected in ("SYMPTOMS", "MEASURES", "TRANSMISSION", "SOURCE ORG"):
                self.assertIn(expected, headers)
            detail_cells = page.locator(".data-table td.table-cell--detail").all_inner_texts()
            self.assertTrue(detail_cells)
            self.assertFalse([text for text in detail_cells if any("\u3400" <= char <= "\u9fff" for char in text)])
            page.click("#density-comfortable")
            hidden_headers = page.locator('body[data-density="comfortable"] .data-table th.th--detail')
            self.assertEqual(hidden_headers.count(), 3)
            page.click("#density-compact")

            # Chinese switch keeps the compliance footnote localised.
            page.goto(self.base_url + "?lang=zh-CN", wait_until="networkidle")
            page.wait_for_timeout(900)
            self.assertIn("不代表任何主权主张", page.locator(".map-footnote").inner_text())

            context.close()

            context = browser.new_context(viewport={"width": 390, "height": 844})
            page = context.new_page()
            page.goto(self.base_url, wait_until="networkidle")
            page.wait_for_timeout(900)
            overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            self.assertLessEqual(overflow, 0)
            page.locator("#table-panel").scroll_into_view_if_needed()
            page.wait_for_timeout(1400)
            self.assertGreater(page.locator(".event-card").count(), 0)
            card_details = page.locator(".event-card__details dd").all_inner_texts()
            self.assertTrue(card_details)
            self.assertFalse([text for text in card_details if any("\u3400" <= char <= "\u9fff" for char in text)])
            context.close()
            browser.close()

        self.assertEqual(external_requests, [])


if __name__ == "__main__":
    unittest.main()
