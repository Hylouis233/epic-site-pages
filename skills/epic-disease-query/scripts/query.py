#!/usr/bin/env python3
import argparse
import json
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_BASE_URL = "https://hylouis233.github.io/epic-site-pages/"
DEFAULT_RECORDS_URL = DEFAULT_BASE_URL + "data/v1/records.json"
DEFAULT_MANIFEST_URL = DEFAULT_BASE_URL + "data/v1/manifest.json"
DEFAULT_FIELDS = (
    "event_start_date",
    "disease_name_zh",
    "location",
    "cases",
    "deaths",
    "source_org",
    "data_quality_score",
    "event_url",
    "source",
)

DISEASE_QUERY_ALIASES = {
    "流感": "influenza",
    "流行性感冒": "influenza",
    "甲型流感": "influenza",
    "h1n1": "influenza",
    "h3n2": "influenza",
    "禽流感": "avian-influenza",
    "h5n1": "avian-influenza",
    "h7n9": "avian-influenza",
    "登革热": "dengue",
    "猴痘": "mpox",
    "m痘": "mpox",
    "新冠": "covid-19",
    "新型冠状病毒感染": "covid-19",
}


class QueryError(RuntimeError):
    pass


def clean(value):
    return str(value or "").strip()


def read_json_file(path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise QueryError(f"cannot read {path}: {exc}") from exc


def fetch_json(url, timeout, retries):
    last_error = None
    for attempt in range(retries + 1):
        try:
            request = Request(url, headers={"User-Agent": "epic-disease-query/2.0"})
            with urlopen(request, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(min(0.4 * (2**attempt), 2.0))
    raise QueryError(f"request failed after {retries + 1} attempt(s): {url}: {last_error}")


def load_payload(file_path, url, timeout, retries):
    return read_json_file(file_path) if file_path else fetch_json(url, timeout, retries)


def validate_payload(records, manifest):
    if not isinstance(records, list):
        raise QueryError("records payload must be a list")
    if not isinstance(manifest, dict):
        raise QueryError("manifest payload must be an object")
    version = clean(manifest.get("schema_version"))
    if not version.startswith("1."):
        raise QueryError(f"unsupported EPIC schema_version={version or 'missing'}; expected major version 1")


def contains(value, needle):
    return not needle or needle.lower() in clean(value).lower()


def record_date(record):
    return clean(record.get("event_start_date") or record.get("published_at") or record.get("date_sort"))[:10]


def matches(record, args):
    searchable = " ".join(
        clean(record.get(field))
        for field in (
            "disease_id",
            "disease_name_zh",
            "disease_name_en",
            "disease_raw",
            "location",
            "continent",
            "source_org",
            "source_type",
            "description_cn",
        )
    ).lower()
    if args.keyword and args.keyword.lower() not in searchable:
        return False
    if args.disease:
        disease_query = args.disease.strip().lower()
        canonical_query = DISEASE_QUERY_ALIASES.get(disease_query)
        if canonical_query:
            if clean(record.get("disease_id")).lower() != canonical_query:
                return False
        else:
            disease_haystack = " ".join(
                clean(record.get(field))
                for field in ("disease_id", "disease_name_zh", "disease_name_en", "disease_raw")
            )
            if not contains(disease_haystack, args.disease):
                return False
    if not contains(record.get("location"), args.location):
        return False
    if not contains(record.get("continent"), args.continent):
        return False
    if not contains(record.get("source_type"), args.source_type):
        return False
    date = record_date(record)
    if args.from_date and (not date or date < args.from_date):
        return False
    if args.to_date and (not date or date > args.to_date):
        return False
    return True


def deduplicate(records, field):
    if not field:
        return records
    seen = set()
    output = []
    for record in records:
        value = record.get(field)
        if value in seen:
            continue
        seen.add(value)
        output.append(record)
    return output


def parse_sort(value):
    field, separator, direction = value.partition(":")
    direction = direction.lower() if separator else "asc"
    if direction not in {"asc", "desc"}:
        raise QueryError("--sort direction must be asc or desc")
    return field or "event_start_date", direction


def sort_records(records, sort_spec):
    field, direction = parse_sort(sort_spec)

    def key(record):
        value = record.get(field)
        missing = value is None or value == ""
        if isinstance(value, (int, float)):
            normalized = value
        else:
            normalized = clean(value).lower()
        return missing, normalized

    present = [record for record in records if record.get(field) not in (None, "")]
    missing = [record for record in records if record.get(field) in (None, "")]
    present.sort(key=key, reverse=direction == "desc")
    return present + missing


def enrich(record):
    output = dict(record)
    event_id = clean(record.get("event_id") or record.get("id"))
    output["event_url"] = DEFAULT_BASE_URL + f"events/{event_id}/" if event_id else ""
    return output


def select_fields(record, fields):
    return {field: record.get(field) for field in fields}


def render_value(value):
    if value is None or value == "":
        return "—"
    return str(value).replace("|", "\\|").replace("\n", " ")


def render_markdown(records, fields, manifest, total):
    status = manifest.get("source_status", "unknown")
    label = manifest.get("source_status_label", status)
    print(f"> 数据状态：{label} (`{status}`) · 数据截至 {manifest.get('data_as_of') or '未知'} · 快照年龄 {manifest.get('staleness_hours', '未知')} 小时")
    for warning in manifest.get("warnings") or []:
        print(f"> 警告：{warning}")
    print()
    print("| " + " | ".join(fields) + " |")
    print("| " + " | ".join("---" for _ in fields) + " |")
    for record in records:
        print("| " + " | ".join(render_value(record.get(field)) for field in fields) + " |")
    print()
    print(f"匹配 {total} 条，展示 {len(records)} 条。EPIC 是不完整的公开来源监测快照，不构成医疗建议或正式公共卫生预警。")


def render_json(records, fields, manifest, total):
    payload = {
        "data_status": {
            key: manifest.get(key)
            for key in (
                "schema_version",
                "source_status",
                "source_status_label",
                "data_as_of",
                "last_successful_ingest_at",
                "staleness_hours",
                "warnings",
            )
        },
        "matched": total,
        "returned": len(records),
        "records": [select_fields(record, fields) for record in records],
        "notice": "EPIC is incomplete public-source monitoring, not clinical advice or an official alert.",
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def render_ndjson(records, fields, manifest, total):
    print(json.dumps({"type": "meta", "matched": total, "returned": len(records), "data_status": manifest}, ensure_ascii=False))
    for record in records:
        print(json.dumps({"type": "record", **select_fields(record, fields)}, ensure_ascii=False))


def build_parser():
    parser = argparse.ArgumentParser(description="Query EPIC Schema v1 public disease event records.")
    parser.add_argument("--records-url", default=DEFAULT_RECORDS_URL)
    parser.add_argument("--manifest-url", default=DEFAULT_MANIFEST_URL)
    parser.add_argument("--records-file", default="")
    parser.add_argument("--manifest-file", default="")
    parser.add_argument("--keyword", default="")
    parser.add_argument("--disease", default="")
    parser.add_argument("--location", default="")
    parser.add_argument("--continent", default="")
    parser.add_argument("--source-type", default="")
    parser.add_argument("--from-date", default="")
    parser.add_argument("--to-date", default="")
    parser.add_argument("--sort", default="event_start_date:desc")
    parser.add_argument("--fields", default=",".join(DEFAULT_FIELDS))
    parser.add_argument("--format", choices=("markdown", "json", "ndjson"), default="markdown")
    parser.add_argument("--deduplicate", choices=("", "event_id", "signal_id", "cluster_id"), default="event_id")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--timeout", type=float, default=20.0)
    parser.add_argument("--retries", type=int, default=2)
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.limit < 1:
        raise QueryError("--limit must be at least 1")
    if args.retries < 0:
        raise QueryError("--retries cannot be negative")
    records = load_payload(args.records_file, args.records_url, args.timeout, args.retries)
    manifest = load_payload(args.manifest_file, args.manifest_url, args.timeout, args.retries)
    validate_payload(records, manifest)

    matched = [enrich(record) for record in records if isinstance(record, dict) and matches(record, args)]
    matched = deduplicate(matched, args.deduplicate)
    matched = sort_records(matched, args.sort)
    total = len(matched)
    selected = matched[: args.limit]
    fields = [field.strip() for field in args.fields.split(",") if field.strip()]
    if not fields:
        raise QueryError("--fields must include at least one field")

    if args.format == "json":
        render_json(selected, fields, manifest, total)
    elif args.format == "ndjson":
        render_ndjson(selected, fields, manifest, total)
    else:
        render_markdown(selected, fields, manifest, total)


if __name__ == "__main__":
    try:
        main()
    except QueryError as exc:
        print(f"EPIC query error: {exc}", file=sys.stderr)
        raise SystemExit(2)
