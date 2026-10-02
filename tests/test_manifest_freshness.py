"""Exercise the production status renderer with a deterministic clock and DOM."""

import json
import shutil
import subprocess
import unittest
from datetime import datetime, timedelta, timezone

import test_frontend_rebuild as frontend


NODE = shutil.which("node")
INGEST = datetime(2026, 9, 30, 8, 44, 26, tzinfo=timezone.utc)
MANIFEST = {
    "source_status": "healthy",
    "source_status_label": "正常",
    "status_message_en": "Upstream ingest and public-data quality checks passed.",
    "status_message_zh": "上游采集与公开数据质量检查通过。",
    "last_successful_ingest_at": INGEST.isoformat(),
    "build_generated_at": INGEST.isoformat(),
    "data_as_of": "2026-09-29",
    "staleness_hours": 0,
    "stale_after_hours": 72,
    "record_count": 61,
    "quality_gate": {"passed": True, "ingest_accepted": True},
}

RENDER_SCRIPT = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
let now = input.now;
const nodes = {}, events = {}, intervals = [];
const before = JSON.stringify(input.manifest);
const sandbox = {
    Intl,
    Date: class extends Date { static now() { return now; } },
    window: {
        matchMedia: () => ({ matches: false }),
        EPIC_I18N: {
            t: (en, zh) => input.chinese ? zh : en,
            isChinese: () => Boolean(input.chinese),
        },
        setInterval: (callback, delay) => intervals.push({ callback, delay }),
        addEventListener: (name, callback) => { events[name] = callback; },
    },
    document: {
        hidden: false,
        getElementById: id => nodes[id] ??= { dataset: {}, classList: { remove() {}, add() {} } },
        addEventListener: (name, callback) => { events[name] = callback; },
    },
};
let source = fs.readFileSync('assets/epic/js/dashboard.js', 'utf8');
const registration = 'document.addEventListener("DOMContentLoaded", bootstrap);';
if (source.split(registration).length !== 2) throw Error('Bootstrap registration changed');
// Expose private functions only in this isolated test VM, never in the page.
source = source.replace(registration,
    'globalThis.testApi = { renderManifest, state, setupManifestFreshnessUpdates: '
    + 'typeof setupManifestFreshnessUpdates === "function" ? setupManifestFreshnessUpdates : () => {} };');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { timeout: 1000 });
sandbox.testApi.state.staticManifestPayload = input.manifest;
sandbox.testApi.renderManifest(input.manifest);
if (input.refresh) {
    sandbox.testApi.setupManifestFreshnessUpdates();
    now = input.refresh.now;
    sandbox.document.hidden = Boolean(input.refresh.hidden);
    if (input.refresh.event === 'interval') intervals[0]?.callback();
    else events[input.refresh.event]?.();
}
console.log(JSON.stringify({
    status: nodes['site-status'].dataset.status,
    label: nodes['brief-status'].textContent,
    age: nodes['staleness-hours'].textContent,
    message: nodes['status-message'].textContent,
    detail: nodes['status-detail'].textContent,
    records: nodes['hero-record-count'].textContent,
    unchanged: JSON.stringify(input.manifest) === before,
    interval: intervals[0]?.delay ?? null,
}));
"""


def milliseconds(hours):
    return (INGEST + timedelta(hours=hours)).timestamp() * 1000


@unittest.skipUnless(NODE, "node is not installed")
class ManifestFreshnessTests(unittest.TestCase):
    def render(self, hours, manifest=None, **options):
        result = subprocess.run(
            [NODE, "-e", RENDER_SCRIPT],
            cwd=frontend.ROOT,
            input=json.dumps({"now": milliseconds(hours), "manifest": manifest or MANIFEST, **options}),
            text=True, capture_output=True, check=True,
        )
        rendered = json.loads(result.stdout)
        self.assertTrue(rendered["unchanged"], "rendering must not rewrite the manifest")
        return rendered

    def test_age_uses_view_time_not_build_time_or_data_as_of(self):
        rendered = self.render(46.5)
        self.assertEqual(rendered["status"], "healthy")
        self.assertEqual(rendered["age"], "47h")
        self.assertEqual(rendered["records"], "61")
        self.assertIn("47h", rendered["detail"])

    def test_threshold_uses_exact_age_and_manifest_configuration(self):
        for hours, status, age in [(72, "healthy", "3d 0h"), (72.01, "stale", "3d 0h"), (73, "stale", "3d 1h")]:
            with self.subTest(hours=hours):
                rendered = self.render(hours)
                self.assertEqual(rendered["status"], status)
                self.assertEqual(rendered["age"], age)
        self.assertEqual(self.render(25, {**MANIFEST, "stale_after_hours": 24})["status"], "stale")
        self.assertEqual(self.render(0.01, {**MANIFEST, "stale_after_hours": 0})["status"], "stale")
        for invalid in (None, "", -1, "bad"):
            with self.subTest(threshold=invalid):
                self.assertEqual(self.render(73, {**MANIFEST, "stale_after_hours": invalid})["status"], "stale")

    def test_no_unknown_or_future_timestamp_becomes_zero_or_healthy(self):
        for timestamp in (None, "", "not-a-date", (INGEST + timedelta(days=10)).isoformat()):
            with self.subTest(timestamp=timestamp):
                rendered = self.render(1, {**MANIFEST, "last_successful_ingest_at": timestamp})
                self.assertEqual(rendered["age"], "Unknown")
                self.assertEqual(rendered["status"], "stale")
                self.assertIn("cannot be verified", rendered["message"])

    def test_published_nonhealthy_states_and_messages_are_preserved(self):
        for status in ("degraded", "failed", "stale"):
            for hours in (1, 100):
                with self.subTest(status=status, hours=hours):
                    rendered = self.render(hours, {**MANIFEST, "source_status": status, "status_message_en": "Published diagnostic"})
                    self.assertEqual(rendered["status"], status)
                    self.assertEqual(rendered["message"], "Published diagnostic")

    def test_computed_stale_status_has_consistent_localized_copy(self):
        rendered = self.render(73, chinese=True)
        self.assertEqual(rendered["label"], "陈旧")
        self.assertEqual(rendered["age"], "3 天 1 小时")
        self.assertIn("超过新鲜度阈值", rendered["message"])
        self.assertNotIn("质量检查通过", rendered["message"])

    def test_open_and_restored_pages_recalculate_without_new_data(self):
        for event in ("interval", "visibilitychange", "pageshow"):
            with self.subTest(event=event):
                rendered = self.render(71, refresh={"event": event, "now": milliseconds(73)})
                self.assertEqual(rendered["interval"], 60000)
                self.assertEqual(rendered["status"], "stale")
                self.assertEqual(rendered["age"], "3d 1h")
        self.assertEqual(self.render(71, refresh={"event": "interval", "now": milliseconds(73), "hidden": True})["status"], "healthy")

    def test_rounding_does_not_display_twenty_four_hour_remainder(self):
        self.assertEqual(self.render(71.6)["age"], "3d 0h")


@unittest.skipUnless(frontend.PLAYWRIGHT_AVAILABLE, "playwright is not installed")
class ManifestFreshnessBrowserTests(unittest.TestCase):
    setUp = frontend.FrontendRebuildBrowserTests.setUp
    tearDown = frontend.FrontendRebuildBrowserTests.tearDown

    def test_loaded_page_ages_and_keeps_stale_translation_after_reload(self):
        from playwright.sync_api import expect, sync_playwright

        with sync_playwright() as playwright:
            with playwright.chromium.launch() as browser:
                page = browser.new_page()
                page.route("https://webrd*.is.autonavi.com/**", lambda route: route.abort())
                page.route("**/data/v1/manifest.json*", lambda route: route.fulfill(json=MANIFEST))
                page.clock.install(time=INGEST + timedelta(hours=71))
                page.goto(self.base_url)
                expect(page.locator("#brief-status")).to_have_text("Healthy")
                expect(page.locator("#staleness-hours")).to_have_text("2d 23h")
                page.clock.fast_forward(2 * 60 * 60 * 1000)
                expect(page.locator("#brief-status")).to_have_text("Stale")
                expect(page.locator("#staleness-hours")).to_have_text("3d 1h")
                expect(page.locator("#status-message")).to_contain_text("older than")
                page.locator("#language-toggle").click()
                expect(page.locator("#brief-status")).to_have_text("陈旧")
                expect(page.locator("#status-message")).to_contain_text("超过新鲜度阈值")
                page.close()
