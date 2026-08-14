import importlib.util
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills" / "epic-disease-query" / "scripts" / "query.py"
SPEC = importlib.util.spec_from_file_location("epic_query", SCRIPT)
query = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = query
SPEC.loader.exec_module(query)


def args(disease):
    return SimpleNamespace(
        keyword="",
        disease=disease,
        location="",
        continent="",
        source_type="",
        from_date="",
        to_date="",
    )


class DiseaseQueryTests(unittest.TestCase):
    def test_plain_influenza_alias_does_not_match_avian_influenza(self):
        seasonal = {"disease_id": "influenza", "disease_name_zh": "流行性感冒"}
        avian = {"disease_id": "avian-influenza", "disease_name_zh": "禽流感"}
        self.assertTrue(query.matches(seasonal, args("流感")))
        self.assertFalse(query.matches(avian, args("流感")))

    def test_avian_influenza_alias_targets_avian_id(self):
        seasonal = {"disease_id": "influenza", "disease_name_zh": "流行性感冒"}
        avian = {"disease_id": "avian-influenza", "disease_name_zh": "禽流感"}
        self.assertFalse(query.matches(seasonal, args("禽流感")))
        self.assertTrue(query.matches(avian, args("禽流感")))


if __name__ == "__main__":
    unittest.main()
