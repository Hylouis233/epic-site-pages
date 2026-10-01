import json
import unittest
from urllib.parse import parse_qs, urlencode, urlparse

import test_frontend_rebuild as frontend

PLAYWRIGHT_AVAILABLE = frontend.PLAYWRIGHT_AVAILABLE

if PLAYWRIGHT_AVAILABLE:
    from playwright.sync_api import expect, sync_playwright


@unittest.skipUnless(PLAYWRIGHT_AVAILABLE, "playwright is not installed")
class FilterStateBrowserTests(unittest.TestCase):
    setUp = frontend.FrontendRebuildBrowserTests.setUp
    tearDown = frontend.FrontendRebuildBrowserTests.tearDown

    def open_page(self, browser, query="", width=1440):
        page = browser.new_page(viewport={"width": width, "height": 1000})
        page.route("https://webrd*.is.autonavi.com/**", lambda route: route.abort())
        page.goto(self.base_url + query)
        page.locator("#overview-grid .metric-card").first.wait_for()
        return page

    def test_shared_select_filters_survive_reload_and_language_switch(self):
        with sync_playwright() as playwright:
            with playwright.chromium.launch() as browser:
                page = self.open_page(browser)
                records = json.loads((frontend.ROOT / 'data/records.json').read_text())
                record = next(item for item in records if item.get('disease') and item.get('continent')
                              and page.locator('#disease-select').evaluate(
                                  '(select, disease) => Array.from(select.options).some(o => o.value === disease)',
                                  item['disease']))
                disease, continent = record['disease'], record['continent']
                page.locator('#disease-select').select_option(disease)
                page.locator('#continent-select').select_option(continent)
                page.wait_for_timeout(350)
                expected = page.locator('#filter-result').inner_text()
                self.assertNotEqual(expected, '0 matches')
                for action in (lambda: page.reload(), lambda: page.locator('#language-toggle').click()):
                    action()
                    page.locator("#overview-grid .metric-card").first.wait_for()
                    self.assertEqual(page.locator('#disease-select').input_value(), disease)
                    self.assertEqual(page.locator('#continent-select').input_value(), continent)
                page.goto(self.base_url + '?' + urlencode({'disease': disease, 'continent': continent, 'lang': 'en'}))
                page.locator("#overview-grid .metric-card").first.wait_for()
                expect(page.locator('#filter-result')).to_have_text(expected)

    def test_reset_clears_both_search_fields_on_desktop_and_mobile(self):
        with sync_playwright() as playwright:
            with playwright.chromium.launch() as browser:
                for width in (1440, 390):
                    with self.subTest(width=width):
                        page = self.open_page(browser, '?keyword=dengue', width)
                        page.locator('#reset-filters').click()
                        self.assertEqual(page.locator('#keyword-input').input_value(), '')
                        self.assertEqual(page.locator('#header-keyword').input_value(), '')
                        self.assertNotIn('keyword', parse_qs(urlparse(page.url).query))
                        page.locator('#keyword-input').fill('measles')
                        page.wait_for_timeout(400)
                        self.assertEqual(page.locator('#header-keyword').input_value(), 'measles')
                        page.locator('#reset-filters').click()
                        self.assertEqual(page.locator('#header-keyword').input_value(), '')
                        page.close()

    def test_filter_changes_keep_explicit_language(self):
        with sync_playwright() as playwright:
            with playwright.chromium.launch() as browser:
                page = self.open_page(browser, '?lang=zh-CN')
                page.locator('#keyword-input').fill('dengue')
                page.wait_for_timeout(400)
                self.assertEqual(parse_qs(urlparse(page.url).query).get('lang'), ['zh-CN'])
                page.reload()
                page.locator("#overview-grid .metric-card").first.wait_for()
                self.assertEqual(page.locator('html').get_attribute('lang'), 'zh-CN')
                page.locator('#reset-filters').click()
                self.assertEqual(parse_qs(urlparse(page.url).query).get('lang'), ['zh-CN'])

    def test_old_shared_link_keeps_unavailable_filters_visible(self):
        with sync_playwright() as playwright:
            with playwright.chromium.launch() as browser:
                page = self.open_page(browser, '?' + urlencode({
                    'disease': 'Retired disease', 'continent': 'Retired region',
                }))
                expect(page.locator('#disease-select')).to_have_value('Retired disease')
                expect(page.locator('#continent-select')).to_have_value('Retired region')
                expect(page.locator('#filter-result')).to_have_text('0 matches')
                page.locator('#reset-filters').click()
                expect(page.locator('#disease-select')).to_have_value('')
                expect(page.locator('#continent-select')).to_have_value('')
                expect(page.locator('#filter-result')).not_to_have_text('0 matches')
