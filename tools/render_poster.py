#!/usr/bin/env python3
import functools
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
POSTER_PATH = ROOT / "assets" / "epic" / "poster.jpg"
OG_IMAGE_PATH = ROOT / "og-image.png"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


def render_poster():
    manifest = json.loads((ROOT / "data" / "v1" / "manifest.json").read_text(encoding="utf-8"))
    records = json.loads((ROOT / "data" / "v1" / "records.json").read_text(encoding="utf-8"))
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    base_url = f"http://127.0.0.1:{server.server_port}"

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 2400, "height": 1260}, device_scale_factor=1)
            page.goto(f"{base_url}/poster/", wait_until="networkidle")
            assert page.locator("h1").inner_text() == "Trace the signal.\nVerify the source."
            assert int(page.locator("#poster-records").inner_text()) == manifest["record_count"]
            page.screenshot(path=str(POSTER_PATH), type="jpeg", quality=94)

            page.goto(f"{base_url}/", wait_until="networkidle")
            assert page.locator("html").get_attribute("lang") == "en"
            assert "Turn scattered outbreak signals into" in page.locator("#hero-title").inner_text()
            assert page.locator("#language-toggle").inner_text() == "中文"
            with page.expect_navigation(wait_until="networkidle"):
                page.locator("#language-toggle").click()
            assert page.locator("html").get_attribute("lang") == "zh-CN"
            assert "把分散的疫情公开信号" in page.locator("#hero-title").inner_text()
            assert page.locator("#language-toggle").inner_text() == "EN"

            page.evaluate("window.localStorage.removeItem('epic-lang')")
            event_id = records[0]["event_id"]
            page.goto(f"{base_url}/events/{event_id}/", wait_until="networkidle")
            assert page.locator("html").get_attribute("lang") == "en"
            assert page.locator('[data-language-content="en"]').is_visible()
            assert not page.locator('[data-language-content="zh-CN"]').is_visible()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join(timeout=5)

    with Image.open(POSTER_PATH) as poster:
        if poster.size != (2400, 1260):
            raise ValueError(f"unexpected poster dimensions: {poster.size}")
        poster.resize((1200, 630), Image.Resampling.LANCZOS).save(
            OG_IMAGE_PATH,
            "PNG",
            optimize=True,
        )

    print(f"Rendered {POSTER_PATH.relative_to(ROOT)} and {OG_IMAGE_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    render_poster()
