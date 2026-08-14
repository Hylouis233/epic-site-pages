#!/usr/bin/env python3
import argparse
import hashlib
import csv
import json
import re
import sys
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
V1 = ROOT / "data" / "v1"


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attribute in ("href", "src"):
            if attrs.get(attribute):
                self.targets.append(attrs[attribute])


def fail(message):
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def read_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        fail(f"cannot read {path.relative_to(ROOT)}: {exc}")


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_internal_links():
    html_files = [ROOT / "index.html", ROOT / "404.html", ROOT / "methodology.html", ROOT / "limitations.html"]
    html_files.extend((ROOT / "events").glob("*/index.html"))
    for html_file in html_files:
        parser = LinkParser()
        parser.feed(html_file.read_text(encoding="utf-8"))
        for target in parser.targets:
            parsed = urlparse(target)
            if parsed.scheme in {"http", "https", "mailto", "data"} or target.startswith("#"):
                continue
            path_text = unquote(parsed.path)
            if not path_text:
                continue
            if path_text.startswith("/"):
                resolved = ROOT / path_text.lstrip("/")
            else:
                resolved = (html_file.parent / path_text).resolve()
            if resolved.is_dir():
                resolved = resolved / "index.html"
            if not resolved.exists():
                fail(f"broken internal link in {html_file.relative_to(ROOT)}: {target}")


def validate_fresh_ingest(manifest):
    quality_gate = manifest.get("quality_gate") or {}
    if manifest.get("source_status") != "healthy":
        fail(
            "scheduled refresh did not produce a healthy snapshot "
            f"(status={manifest.get('source_status') or 'missing'})"
        )
    if quality_gate.get("passed") is not True:
        fail("scheduled refresh did not pass the public quality gate")
    if quality_gate.get("ingest_accepted") is not True:
        fail("scheduled refresh retained an old snapshot instead of accepting upstream data")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate EPIC public release artifacts.")
    parser.add_argument(
        "--require-fresh-ingest",
        action="store_true",
        help="Fail unless this build accepted a healthy, quality-gated upstream snapshot.",
    )
    args = parser.parse_args(argv)
    manifest = read_json(V1 / "manifest.json")
    records = read_json(V1 / "records.json")
    schema = read_json(V1 / "schema.json")

    try:
        import jsonschema

        validator = jsonschema.Draft202012Validator(
            schema,
            format_checker=jsonschema.FormatChecker(),
        )
        errors = sorted(validator.iter_errors(records), key=lambda error: list(error.path))
        if errors:
            first = errors[0]
            fail(f"schema validation: {list(first.path)} {first.message}")
    except ImportError:
        print("WARN: jsonschema is unavailable; skipped JSON Schema validation")

    if len(records) != manifest.get("record_count"):
        fail("manifest record_count does not match records.json")
    if manifest.get("source_status") not in {"healthy", "degraded", "stale", "failed"}:
        fail("manifest source_status is invalid")
    if not manifest.get("build_generated_at") or not manifest.get("data_as_of"):
        fail("manifest must separate build_generated_at and data_as_of")
    if args.require_fresh_ingest:
        validate_fresh_ingest(manifest)

    build_date = datetime.fromisoformat(manifest["build_generated_at"].replace("Z", "+00:00")).date()
    ids = set()
    signals = set()
    for index, record in enumerate(records):
        event_id = record.get("event_id")
        signal_id = record.get("signal_id")
        if event_id in ids:
            fail(f"duplicate event_id at record {index}: {event_id}")
        if signal_id in signals:
            fail(f"duplicate signal_id at record {index}: {signal_id}")
        ids.add(event_id)
        signals.add(signal_id)
        if "original_text" in record:
            fail(f"record {event_id} leaks original_text")
        if len(record.get("description_cn") or "") > 600:
            fail(f"record {event_id} summary exceeds public limit")
        date_sort = record.get("date_sort")
        if date_sort and datetime.fromisoformat(date_sort).date() > build_date:
            fail(f"record {event_id} has a future date_sort")
        source = urlparse(record.get("source") or "")
        if source.scheme not in {"http", "https"} or not source.netloc:
            fail(f"record {event_id} has invalid source URL")
        detail_page = ROOT / "events" / event_id / "index.html"
        if not detail_page.exists():
            fail(f"missing event detail page for {event_id}")

    for name, expected in manifest.get("checksums_sha256", {}).items():
        path = V1 / name
        if not path.exists() or sha256(path) != expected:
            fail(f"checksum mismatch for {name}")

    ET.parse(ROOT / "rss.xml")
    ET.parse(ROOT / "sitemap.xml")
    validate_internal_links()
    with (ROOT / "data" / "weekly_merged_latest.csv").open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = {header.lower() for header in (reader.fieldnames or [])}
        if "原文" in headers or "original_text" in headers:
            fail("public weekly CSV contains a full-text column")
        for row_index, row in enumerate(reader, start=2):
            if any(len(value or "") > 2000 for value in row.values()):
                fail(f"public weekly CSV contains an oversized cell at row {row_index}")
    rss_text = (ROOT / "rss.xml").read_text(encoding="utf-8")
    for link in re.findall(r"<link>(.*?)</link>", rss_text):
        if "/events/" in link and not link.rstrip("/").split("/")[-1].startswith("evt_"):
            fail(f"RSS event link is not stable: {link}")

    print(
        "Release validation passed: "
        f"records={len(records)} events={len(ids)} status={manifest['source_status']}"
    )


if __name__ == "__main__":
    main()
