import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "validate_release",
    ROOT / "tools" / "validate_release.py",
)
validator = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = validator
SPEC.loader.exec_module(validator)


class FreshIngestValidationTests(unittest.TestCase):
    def test_accepts_healthy_quality_gated_ingest(self):
        validator.validate_fresh_ingest(
            {
                "source_status": "healthy",
                "quality_gate": {"passed": True, "ingest_accepted": True},
            }
        )

    def test_rejects_retained_snapshot_false_success(self):
        with self.assertRaises(SystemExit):
            validator.validate_fresh_ingest(
                {
                    "source_status": "degraded",
                    "quality_gate": {"passed": False, "ingest_accepted": False},
                }
            )

    def test_rejects_healthy_label_without_accepted_ingest(self):
        with self.assertRaises(SystemExit):
            validator.validate_fresh_ingest(
                {
                    "source_status": "healthy",
                    "quality_gate": {"passed": True, "ingest_accepted": False},
                }
            )


class PublicSurfaceValidationTests(unittest.TestCase):
    def test_repository_is_english_first_with_chinese_switch(self):
        validator.validate_english_surface()

    def test_scheduled_refresh_uses_the_vps_public_endpoint(self):
        workflow = (ROOT / ".github" / "workflows" / "update-public-data.yml").read_text(
            encoding="utf-8"
        )

        self.assertIn(
            "EPIC_PUBLIC_SOURCE_BASE_URL: https://epicdemic.hylouis.top/",
            workflow,
        )
        self.assertNotIn("secrets.EPIC_PUBLIC_SOURCE_BASE_URL", workflow)


if __name__ == "__main__":
    unittest.main()
