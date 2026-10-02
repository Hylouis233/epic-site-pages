"""Table transport contract tests, independent of record normalization."""

import unittest
from unittest.mock import patch

from test_build_public_data import builder


class TablePaginationTests(unittest.TestCase):
    BASE_URL = "https://example.invalid/"

    def fetch_pages(self, pages):
        with patch.object(builder, "fetch_json", side_effect=pages) as fetch:
            records = builder.fetch_table_records(self.BASE_URL)
        return records, fetch

    def test_complete_multiple_pages_are_returned_in_order(self):
        rows = [{"id": "first"}, {"id": "second"}, {"id": "third"}]
        records, fetch = self.fetch_pages([
            {"items": rows[:2], "total": 3},
            {"items": rows[2:], "total": 3},
        ])
        self.assertEqual(records, rows)
        self.assertEqual(fetch.call_count, 2)
        self.assertEqual(
            [call.args[1] for call in fetch.call_args_list],
            [f"/api/data/table/?page={page}&page_size=200" for page in (1, 2)],
        )

    def test_complete_single_page_does_not_request_an_extra_page(self):
        rows = [{"id": "first"}]
        records, fetch = self.fetch_pages([{"items": rows, "total": 1}])
        self.assertEqual(records, rows)
        self.assertEqual(fetch.call_count, 1)

    def test_explicitly_empty_table_is_complete(self):
        records, fetch = self.fetch_pages([{"items": [], "total": 0}])
        self.assertEqual(records, [])
        self.assertEqual(fetch.call_count, 1)

    def test_integer_compatible_totals_remain_supported(self):
        rows = [{"id": "first"}]
        for total in ("1", " 1 ", "+1", 1.0):
            with self.subTest(total=total):
                records, _ = self.fetch_pages([{"items": rows, "total": total}])
                self.assertEqual(records, rows)

    def test_absent_total_requires_empty_page_to_prove_completion(self):
        rows = [{"id": "first"}, {"id": "second"}]
        records, fetch = self.fetch_pages([
            {"items": rows[:1]},
            {"items": rows[1:], "total": None},
            {"items": []},
        ])
        self.assertEqual(records, rows)
        self.assertEqual(fetch.call_count, 3)

    def test_absent_later_total_does_not_erase_declared_count(self):
        with self.assertRaisesRegex(ValueError, "incomplete"):
            self.fetch_pages([
                {"items": [{"id": "first"}], "total": 2},
                {"items": []},
            ])

    def test_early_empty_page_rejects_partial_records(self):
        with self.assertRaisesRegex(ValueError, "incomplete.*1.*2"):
            self.fetch_pages([
                {"items": [{"id": "first"}], "total": 2},
                {"items": [], "total": 2},
            ])

    def test_empty_first_page_cannot_satisfy_positive_total(self):
        with self.assertRaisesRegex(ValueError, "incomplete"):
            self.fetch_pages([{"items": [], "total": 2}])

    def test_changed_total_cannot_hide_incomplete_pagination(self):
        for changed_total in (1, 3):
            with self.subTest(total=changed_total), self.assertRaisesRegex(ValueError, "total changed"):
                self.fetch_pages([
                    {"items": [{"id": "first"}], "total": 2},
                    {"items": [{"id": "second"}], "total": changed_total},
                ])

    def test_records_cannot_exceed_declared_total(self):
        with self.assertRaisesRegex(ValueError, "exceeds.*total"):
            self.fetch_pages([{"items": [{"id": "first"}, {"id": "second"}], "total": 1}])

    def test_repeated_page_cannot_satisfy_declared_total(self):
        with self.assertRaisesRegex(ValueError, "repeated.*page"):
            self.fetch_pages([
                {"items": [{"id": "first"}], "total": 2},
                {"items": [{"id": "first"}], "total": 2},
            ])

    def test_reordered_or_partially_repeated_page_is_rejected(self):
        rows = [{"id": "first"}, {"id": "second"}, {"id": "third"}]
        for second_page in (list(reversed(rows[:2])), [rows[0], rows[2]]):
            with self.subTest(second_page=second_page), self.assertRaisesRegex(ValueError, "repeated"):
                self.fetch_pages([
                    {"items": rows[:2], "total": 4},
                    {"items": second_page, "total": 4},
                ])

    def test_within_page_duplicates_remain_for_existing_quality_gate(self):
        rows = [{"id": "first"}, {"id": "first"}]
        records, _ = self.fetch_pages([{"items": rows, "total": 2}])
        self.assertEqual(records, rows)

    def test_changed_metadata_cannot_hide_cross_page_overlap(self):
        row = {"source": "https://example.org/report", "disease": "influenza", "location": "Example"}
        with self.assertRaisesRegex(ValueError, "repeated"):
            self.fetch_pages([
                {"items": [row], "total": 2},
                {"items": [{**row, "updated_at": "2026-10-02T00:00:00Z"}], "total": 2},
            ])

    def test_different_disease_or_location_at_same_source_remains_distinct(self):
        row = {"source": "https://example.org/report", "disease": "influenza", "location": "Example"}
        for other in ({**row, "disease": "measles"}, {**row, "location": "Elsewhere"}):
            with self.subTest(other=other):
                records, _ = self.fetch_pages([
                    {"items": [row], "total": 2},
                    {"items": [other], "total": 2},
                ])
                self.assertEqual(records, [row, other])

    def test_malformed_items_cannot_be_silently_discarded(self):
        for items in (None, {}, "", [None], [{"id": "first"}, "invalid"]):
            with self.subTest(items=items), self.assertRaises(ValueError):
                self.fetch_pages([{"items": items, "total": 1}])

    def test_missing_items_are_not_a_valid_empty_table(self):
        with self.assertRaises(ValueError):
            self.fetch_pages([{"total": 0}])

    def test_invalid_total_cannot_be_inferred_from_partial_records(self):
        for total in ("", "unknown", -1, "-1", 1.5, True, {}, []):
            with self.subTest(total=total), self.assertRaises(ValueError):
                self.fetch_pages([{"items": [{"id": "first"}], "total": total}])


if __name__ == "__main__":
    unittest.main()
