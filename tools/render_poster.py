#!/usr/bin/env python3
import functools
import json
import re
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
            # The site defaults to the dark monitoring console; the social-card
            # capture intentionally renders the light variant.
            page.evaluate("localStorage.setItem('epic-theme', 'light'); location.reload();")
            page.wait_for_load_state("networkidle")
            assert page.locator("html").get_attribute("lang") == "en"
            assert page.locator("html").get_attribute("data-theme") == "light"
            assert "Global infectious-disease" in page.locator("#hero-title").inner_text()
            assert page.locator("#language-toggle").inner_text() == "中文"
            assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            page.locator("#language-toggle").focus()
            assert page.locator("#language-toggle").evaluate(
                "element => getComputedStyle(element).outlineStyle !== 'none'"
            )
            assert page.evaluate(
                """() => Array.from(document.querySelectorAll('a, button, input, select'))
                    .filter(element => element.offsetWidth || element.offsetHeight || element.getClientRects().length)
                    .filter(element => {
                        const labels = element.labels ? Array.from(element.labels).map(label => label.textContent).join(' ') : '';
                        const name = element.getAttribute('aria-label') || element.getAttribute('title') ||
                            element.textContent || labels || element.getAttribute('alt') || '';
                        return !name.trim();
                    }).length"""
            ) == 0
            page.wait_for_function("document.querySelectorAll('#disease-select option').length > 1")
            for selector in ("#disease-select", "#continent-select"):
                assert not re.search(r"[\u3400-\u9fff]", page.locator(selector).inner_text())
            assert page.locator("#date-from-input").get_attribute("type") == "text"
            assert page.locator("#date-from-input").get_attribute("placeholder") == "YYYY-MM-DD"
            page.locator("#date-from-input").fill("2026-99-99")
            page.locator("#date-from-input").dispatch_event("change")
            assert page.locator("#date-from-input").get_attribute("aria-invalid") == "true"
            assert "date_from=" not in page.url
            page.locator("#date-from-input").fill("")
            page.locator("#date-from-input").dispatch_event("change")
            assert page.locator("#date-from-input").get_attribute("aria-invalid") is None

            page.locator("#map-panel").scroll_into_view_if_needed()
            page.wait_for_selector(".land-shape")
            page.wait_for_selector(".cluster-badge")
            assert page.locator(".region-sidebar__item").count() > 0
            assert page.locator(".abstract-world").count() == 0

            page.locator("#table-panel").scroll_into_view_if_needed()
            page.wait_for_selector("#table-shell:not(.hidden) #table-body tr")
            visited_pages = 0
            while True:
                visited_pages += 1
                assert visited_pages < 100
                assert not re.search(r"[\u3400-\u9fff]", page.locator("#table-body").inner_text())
                next_button = page.get_by_role("button", name="Next", exact=True)
                if next_button.is_disabled():
                    break
                previous_status = page.locator("#table-page-status").inner_text()
                next_button.click()
                page.wait_for_function(
                    "previous => document.querySelector('#table-page-status').textContent !== previous",
                    arg=previous_status,
                )

            with page.expect_navigation(wait_until="networkidle"):
                page.locator("#language-toggle").click()
            assert page.locator("html").get_attribute("lang") == "zh-CN"
            assert "全球传染病" in page.locator("#hero-title").inner_text()
            assert page.locator("#language-toggle").inner_text() == "EN"

            page.evaluate("window.localStorage.removeItem('epic-lang')")
            event_id = records[0]["event_id"]
            page.goto(f"{base_url}/events/{event_id}/", wait_until="networkidle")
            assert page.locator("html").get_attribute("lang") == "en"
            assert page.locator('[data-language-content="en"]').is_visible()
            assert not page.locator('[data-language-content="zh-CN"]').is_visible()

            mobile_page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
            mobile_page.goto(f"{base_url}/", wait_until="networkidle")
            assert mobile_page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            mobile_page.locator("#table-panel").scroll_into_view_if_needed()
            mobile_page.wait_for_selector("#table-shell:not(.hidden) .event-card")
            assert not mobile_page.locator(".table-scroll").is_visible()
            assert mobile_page.locator("#event-cards .event-card").count() == min(8, len(records))
            assert not re.search(r"[\u3400-\u9fff]", mobile_page.locator("#event-cards").inner_text())
            mobile_detail_url = mobile_page.locator("#event-cards .event-card__detail").first.get_attribute("href")
            mobile_page.goto(f"{base_url}/{mobile_detail_url.removeprefix('./')}", wait_until="networkidle")
            assert mobile_page.locator("html").get_attribute("lang") == "en"
            assert mobile_page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
            status_label_box = mobile_page.locator(".detail-status strong").bounding_box()
            status_message_box = mobile_page.locator(".detail-status span").bounding_box()
            assert status_label_box and status_message_box
            assert status_message_box["y"] >= status_label_box["y"] + status_label_box["height"]
            mobile_page.close()
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
