import importlib.util
import csv
import json
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("build_public_data", ROOT / "tools" / "build_public_data.py")
builder = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = builder
SPEC.loader.exec_module(builder)


class DateNormalizationTests(unittest.TestCase):
    def setUp(self):
        self.build_utc = datetime(2026, 8, 13, 4, 22, 42, tzinfo=timezone.utc)

    def test_future_raw_date_is_replaced_by_semantic_report_dates(self):
        record = {
            "original_date": "2026-12-29",
            "start_date": "2026年06月29日",
            "original_text": (
                "Report week: 26; Reporting period: 29 December 2025 to 28 June 2026; "
                "Date of data extraction: 2 July 2026; "
                "In week 26 (22 June 2026 to 28 June 2026), 22 cases were detected."
            ),
        }
        dates = builder.extract_date_fields(record, self.build_utc)

        self.assertEqual(dates["event_start_date"], "2026-06-22")
        self.assertEqual(dates["event_end_date"], "2026-06-28")
        self.assertEqual(dates["reporting_period_start"], "2025-12-29")
        self.assertEqual(dates["reporting_period_end"], "2026-06-28")
        self.assertEqual(dates["published_at"], "2026-07-02")
        self.assertIn("future_original_date", dates["quality_flags"])

    def test_date_parser_does_not_concatenate_a_range(self):
        parsed = builder.parse_flexible_date("29 December 2025 to 28 June 2026")
        self.assertEqual(parsed.isoformat(), "2025-12-29")


class DiseaseAndScaleTests(unittest.TestCase):
    def test_aliases_collapse_to_stable_disease(self):
        aliases = ("流感", "H1N1流感", "甲型流感", "流行性感冒(甲型流感)")
        canonical = [builder.canonicalize_disease(value) for value in aliases]
        self.assertEqual({item["disease_id"] for item in canonical}, {"influenza"})
        self.assertEqual({item["disease_name_zh"] for item in canonical}, {"流行性感冒"})

    def test_multiple_disease_report_remains_an_aggregate(self):
        item = builder.canonicalize_disease("病毒性肝炎、肺结核、新型冠状病毒感染、流行性感冒")
        self.assertEqual(item["disease_id"], "multiple-notifiable-diseases")
        self.assertTrue(item["disease_is_aggregate"])

    def test_chinese_scale_extracts_cases_and_deaths(self):
        scale = builder.parse_scale("累计报告56,422例登革热病例,死亡35例")
        self.assertEqual(scale["cases"], 56422)
        self.assertEqual(scale["deaths"], 35)
        self.assertEqual(scale["period_type"], "cumulative")


class IdentityAndFeedTests(unittest.TestCase):
    def test_source_url_encodes_spaces_without_changing_structure(self):
        normalized = builder.normalize_source_url(
            "https://example.org/reports/Weekly Bulletin 26.pdf?lang=zh cn"
        )
        self.assertEqual(
            normalized,
            "https://example.org/reports/Weekly%20Bulletin%2026.pdf?lang=zh%20cn",
        )

    def test_signal_id_is_stable_when_event_date_is_corrected(self):
        first = builder.derive_record_ids("https://example.org/report", "influenza", "South Africa", "2026-06-22")
        second = builder.derive_record_ids("https://example.org/report", "influenza", "South Africa", "2026-06-23")
        self.assertEqual(first[1], second[1])
        self.assertEqual(first[0], second[0])

    def test_rss_uses_first_seen_not_event_date(self):
        records = [
            {
                "event_id": "evt_123",
                "first_seen_at": "2026-08-13T01:00:00Z",
                "updated_at": "2026-08-13T01:00:00Z",
                "event_start_date": "2026-08-01",
            },
            {
                "event_id": "evt_456",
                "first_seen_at": "2026-08-12T01:00:00Z",
                "updated_at": "2026-08-12T01:00:00Z",
                "event_start_date": "2026-08-13",
            },
        ]
        selected, _ = builder.select_daily_records(records, datetime(2026, 8, 13, 4, tzinfo=timezone.utc))
        self.assertEqual([record["event_id"] for record in selected], ["evt_123"])

    def test_legacy_record_does_not_become_new_when_ingest_recovers(self):
        build_utc = datetime(2026, 8, 13, 4, tzinfo=timezone.utc)
        raw = {
            "source": "https://example.org/legacy",
            "disease": "登革热",
            "location": "亚洲",
            "original_date": "2026-07-01",
        }
        previous = {
            "source": "https://example.org/legacy",
            "first_seen_at": "",
            "updated_at": "",
            "content_hash": "",
            "revision": 1,
        }
        normalized = builder.normalize_record(
            raw,
            build_utc=build_utc,
            observed_at="2026-08-13T04:00:00Z",
            previous_record=previous,
        )
        self.assertEqual(normalized["first_seen_at"], "")
        self.assertEqual(normalized["seen_at_status"], "unavailable_for_legacy_snapshot")

    def test_new_signal_receives_first_seen_time(self):
        build_utc = datetime(2026, 8, 13, 4, tzinfo=timezone.utc)
        normalized = builder.normalize_record(
            {
                "source": "https://example.org/new",
                "disease": "登革热",
                "location": "亚洲",
                "original_date": "2026-08-12",
            },
            build_utc=build_utc,
            observed_at="2026-08-13T04:00:00Z",
            previous_record=None,
        )
        self.assertEqual(normalized["first_seen_at"], "2026-08-13T04:00:00Z")
        self.assertEqual(normalized["seen_at_status"], "observed")


class SnapshotTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = json.loads((ROOT / "data" / "records.json").read_text(encoding="utf-8"))
        cls.manifest = json.loads((ROOT / "data" / "v1" / "manifest.json").read_text(encoding="utf-8"))

    def test_public_snapshot_excludes_original_full_text(self):
        self.assertFalse(any("original_text" in record for record in self.records))

    def test_snapshot_has_no_future_sort_dates(self):
        self.assertFalse(any((record.get("date_sort") or "") > "2026-08-14" for record in self.records))

    def test_manifest_separates_build_and_data_time(self):
        self.assertNotEqual(self.manifest["build_generated_at"][:10], self.manifest["data_as_of"])
        self.assertEqual(self.manifest["source_status"], "degraded")
        self.assertFalse(self.manifest["quality_gate"]["ingest_accepted"])

    def test_compatibility_csv_excludes_third_party_full_text(self):
        with (ROOT / "data" / "weekly_merged_latest.csv").open(
            encoding="utf-8-sig", newline=""
        ) as handle:
            reader = csv.DictReader(handle)
            headers = set(reader.fieldnames or [])
            rows = list(reader)
        self.assertNotIn("原文", headers)
        self.assertNotIn("original_text", headers)
        self.assertTrue(all(len(value or "") <= 2000 for row in rows for value in row.values()))


if __name__ == "__main__":
    unittest.main()
