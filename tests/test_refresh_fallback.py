"""Refresh regressions using copies of the existing public snapshot only."""

import contextlib
import io
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from datetime import timedelta
from unittest.mock import patch

from test_build_public_data import ROOT, builder
from test_validate_release import validator


class RefreshFallbackTests(unittest.TestCase):
    TABLE_PATH = "/api/data/table/?page=1&page_size=200"

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.data = self.root / "data"
        self.data.mkdir()
        for name in ("records.json", "data.json", "build_meta.json", "epietl_public.json"):
            shutil.copyfile(ROOT / "data" / name, self.data / name)
        self.previous_records = self.read_json("records.json")
        self.previous_meta = self.read_json("build_meta.json")
        self.build_at = builder.format_utc_timestamp(
            builder.parse_utc_timestamp(self.previous_meta["build_generated_at"]) + timedelta(hours=1)
        )
        self.previous_ids = {row["event_id"] for row in self.previous_records}

    def read_json(self, name):
        return json.loads((self.data / name).read_text(encoding="utf-8"))

    def run_refresh(self, responses):
        def fetch(_base, path):
            if path not in responses:
                raise AssertionError(f"Unexpected upstream request: {path}")
            response = responses[path]
            if isinstance(response, Exception):
                raise response
            return response

        with contextlib.ExitStack() as stack:
            stack.enter_context(patch.multiple(
                builder,
                ROOT=self.root,
                DATA_DIR=self.data,
                V1_DATA_DIR=self.data / "v1",
                EVENTS_DIR=self.root / "events",
                INDEX_PATH=self.root / "index.html",
                BACKUP_DIR=self.root / "BACKUP",
            ))
            stack.enter_context(patch.dict(os.environ, {
                "EPIC_PUBLIC_SOURCE_BASE_URL": "https://example.invalid/",
                "EPIC_PUBLIC_SITE_URL": builder.PUBLIC_SITE_URL,
                "EPIC_BOOTSTRAP_LAST_SUCCESSFUL_INGEST_AT": "",
            }))
            fetch_mock = stack.enter_context(patch.object(builder, "fetch_json", side_effect=fetch))
            stack.enter_context(contextlib.redirect_stdout(io.StringIO()))
            builder.main(["--build-at", self.build_at])
        return self.read_json("v1/manifest.json"), fetch_mock

    def assert_retained(self, manifest):
        self.assertEqual(manifest["source_status"], "degraded")
        self.assertFalse(manifest["quality_gate"]["passed"])
        self.assertFalse(manifest["quality_gate"]["ingest_accepted"])
        self.assertEqual(manifest["build_generated_at"], self.build_at)
        self.assertEqual(manifest["data_as_of"], self.previous_meta["data_as_of"])
        self.assertEqual(
            manifest["last_successful_ingest_at"], self.previous_meta["last_successful_ingest_at"]
        )
        records = self.read_json("records.json")
        self.assertEqual(len(records), len(self.previous_records))
        self.assertEqual({row["event_id"] for row in records}, self.previous_ids)
        self.assertEqual(
            [(row["source"], row.get("first_seen_at"), row.get("updated_at")) for row in records],
            [(row["source"], row.get("first_seen_at"), row.get("updated_at")) for row in self.previous_records],
        )
        self.assertEqual(self.read_json("v1/quality-report.json")["upstream_record_count"], 0)
        self.assertEqual(self.read_json("build_meta.json")["warnings"], manifest["warnings"])
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            validator.validate_fresh_ingest(manifest)

    def healthy_responses(self):
        return {
            "/api/data/": self.read_json("data.json"),
            self.TABLE_PATH: {"items": self.previous_records, "total": len(self.previous_records)},
            "/api/data/overview/": builder.build_overview_payload(self.previous_records),
            "/api/data/map/": builder.build_map_payload(self.previous_records),
            "/api/data/epietl/": self.read_json("epietl_public.json"),
        }

    def test_both_endpoint_timeouts_write_retained_failure_diagnostics(self):
        manifest, fetch_mock = self.run_refresh({
            "/api/data/": TimeoutError("primary timeout"),
            self.TABLE_PATH: TimeoutError("table timeout"),
        })
        self.assert_retained(manifest)
        warnings = " ".join(manifest["warnings"])
        self.assertIn("primary timeout", warnings)
        self.assertIn("table timeout", warnings)
        self.assertEqual(fetch_mock.call_count, 2)

    def test_failed_primary_with_empty_fallback_does_not_retry_table(self):
        manifest, fetch_mock = self.run_refresh({
            "/api/data/": TimeoutError("primary timeout"),
            self.TABLE_PATH: {"items": [], "total": 0},
        })
        self.assert_retained(manifest)
        self.assertEqual(fetch_mock.call_count, 2)

    def test_partial_table_fetch_is_not_accepted_after_later_page_timeout(self):
        manifest, fetch_mock = self.run_refresh({
            "/api/data/": TimeoutError("primary timeout"),
            self.TABLE_PATH: {"items": self.previous_records[:1], "total": len(self.previous_records)},
            "/api/data/table/?page=2&page_size=200": TimeoutError("page two timeout"),
        })
        self.assert_retained(manifest)
        self.assertEqual(fetch_mock.call_count, 3)

    def test_early_empty_page_preserves_snapshot_and_failure_diagnostics(self):
        # This prefix is large enough to pass the ordinary record-drop gate.
        partial_count = len(self.previous_records) * 4 // 5
        manifest, fetch_mock = self.run_refresh({
            "/api/data/": TimeoutError("primary timeout"),
            self.TABLE_PATH: {
                "items": self.previous_records[:partial_count],
                "total": len(self.previous_records),
            },
            "/api/data/table/?page=2&page_size=200": {
                "items": [], "total": len(self.previous_records),
            },
        })
        self.assert_retained(manifest)
        self.assertIn("incomplete", " ".join(manifest["warnings"]))
        self.assertEqual(fetch_mock.call_count, 3)

    def test_healthy_primary_remains_accepted_when_table_is_incomplete(self):
        responses = self.healthy_responses()
        responses[self.TABLE_PATH] = {
            "items": self.previous_records[:1], "total": len(self.previous_records),
        }
        responses["/api/data/table/?page=2&page_size=200"] = {
            "items": [], "total": len(self.previous_records),
        }
        manifest, _ = self.run_refresh(responses)
        validator.validate_fresh_ingest(manifest)
        self.assertEqual(manifest["record_count"], len(self.previous_records))
        self.assertEqual(manifest["last_successful_ingest_at"], self.build_at)
        self.assertIn("incomplete", " ".join(manifest["warnings"]))

    def test_overlapping_pages_cannot_make_partial_snapshot_look_complete(self):
        partial_count = len(self.previous_records) * 4 // 5
        missing_count = len(self.previous_records) - partial_count
        manifest, fetch_mock = self.run_refresh({
            "/api/data/": TimeoutError("primary timeout"),
            self.TABLE_PATH: {
                "items": self.previous_records[:partial_count],
                "total": len(self.previous_records),
            },
            "/api/data/table/?page=2&page_size=200": {
                "items": self.previous_records[:missing_count],
                "total": len(self.previous_records),
            },
        })
        self.assert_retained(manifest)
        self.assertIn("repeated", " ".join(manifest["warnings"]))
        self.assertEqual(fetch_mock.call_count, 3)

    def test_invalid_primary_and_table_payloads_retain_snapshot(self):
        manifest, fetch_mock = self.run_refresh({
            "/api/data/": {"error": "unavailable"},
            self.TABLE_PATH: [],
        })
        self.assert_retained(manifest)
        self.assertEqual(fetch_mock.call_count, 2)

    def test_healthy_table_fallback_remains_accepted(self):
        responses = self.healthy_responses()
        responses["/api/data/"] = TimeoutError("primary timeout")
        manifest, fetch_mock = self.run_refresh(responses)
        validator.validate_fresh_ingest(manifest)
        self.assertEqual(manifest["record_count"], len(self.previous_records))
        self.assertEqual(manifest["last_successful_ingest_at"], self.build_at)
        self.assertEqual(sum(call.args[1] == self.TABLE_PATH for call in fetch_mock.call_args_list), 1)

    def test_healthy_primary_remains_accepted_when_table_fails(self):
        responses = self.healthy_responses()
        responses[self.TABLE_PATH] = TimeoutError("table timeout")
        manifest, _ = self.run_refresh(responses)
        validator.validate_fresh_ingest(manifest)
        self.assertEqual(manifest["record_count"], len(self.previous_records))
        self.assertEqual(manifest["last_successful_ingest_at"], self.build_at)

    def test_outage_without_retained_snapshot_is_failed(self):
        # An empty temporary checkout must not gain invented records or freshness.
        (self.data / "records.json").write_text("[]", encoding="utf-8")
        (self.data / "data.json").write_text("[]", encoding="utf-8")
        manifest, _ = self.run_refresh({
            "/api/data/": TimeoutError("primary timeout"),
            self.TABLE_PATH: TimeoutError("table timeout"),
        })
        self.assertEqual(manifest["source_status"], "failed")
        self.assertEqual(manifest["record_count"], 0)
        self.assertFalse(manifest["quality_gate"]["passed"])
        self.assertFalse(manifest["quality_gate"]["ingest_accepted"])
        self.assertEqual(
            manifest["last_successful_ingest_at"], self.previous_meta["last_successful_ingest_at"]
        )
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit):
            validator.validate_fresh_ingest(manifest)

    def test_outage_without_snapshot_or_metadata_does_not_invent_ingest_time(self):
        for name in ("records.json", "data.json", "build_meta.json"):
            (self.data / name).unlink()
        manifest, _ = self.run_refresh({
            "/api/data/": TimeoutError("primary timeout"),
            self.TABLE_PATH: TimeoutError("table timeout"),
        })
        self.assertEqual(manifest["source_status"], "failed")
        self.assertEqual(manifest["record_count"], 0)
        self.assertFalse(manifest["quality_gate"]["passed"])
        self.assertFalse(manifest["quality_gate"]["ingest_accepted"])
        self.assertEqual(manifest["last_successful_ingest_at"], "")
        self.assertEqual(manifest["data_as_of"], "")
        self.assertIsNone(manifest["staleness_hours"])
        self.assertEqual(self.read_json("build_meta.json")["last_successful_ingest_at"], "")


class BootstrapTimestampTests(unittest.TestCase):
    def test_absent_metadata_and_configuration_leave_timestamp_unknown(self):
        with patch.dict(os.environ, {"EPIC_BOOTSTRAP_LAST_SUCCESSFUL_INGEST_AT": ""}):
            self.assertEqual(builder.resolve_bootstrap_last_success({}), "")

    def test_explicit_bootstrap_remains_supported_without_overriding_metadata(self):
        with patch.dict(os.environ, {
            "EPIC_BOOTSTRAP_LAST_SUCCESSFUL_INGEST_AT": "2026-08-01T00:00:00Z",
        }):
            self.assertEqual(builder.resolve_bootstrap_last_success({}), "2026-08-01T00:00:00Z")
            self.assertEqual(builder.resolve_bootstrap_last_success({
                "last_successful_ingest_at": "2026-09-01T00:00:00Z",
            }), "2026-09-01T00:00:00Z")


if __name__ == "__main__":
    unittest.main()
