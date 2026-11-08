"""Keep browser workflows on an explicit image supported by pinned Playwright."""

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class WorkflowRunnerTests(unittest.TestCase):
    def test_browser_workflows_pin_the_same_supported_runner(self):
        for name in ("update-public-data.yml", "validate-public-site.yml"):
            with self.subTest(workflow=name):
                workflow = (ROOT / ".github" / "workflows" / name).read_text()
                runners = re.findall(r"^\s+runs-on:\s*(\S+)\s*$", workflow, re.MULTILINE)
                self.assertEqual(runners, ["ubuntu-24.04"])


if __name__ == "__main__":
    unittest.main()
