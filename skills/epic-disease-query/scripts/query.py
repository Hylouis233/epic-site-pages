#!/usr/bin/env python3
import argparse
import json
from urllib.request import Request, urlopen


DEFAULT_RECORDS_URL = "https://epicdemic.hylouis.top/data/records.json"


def fetch_records(url):
    request = Request(url, headers={"User-Agent": "epic-disease-query/1.0"})
    with urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    if not isinstance(payload, list):
        raise ValueError("records payload must be a list")
    return payload


def clean(value):
    return str(value or "").strip()


def matches(record, args):
    fields = [
        clean(record.get("disease")),
        clean(record.get("location")),
        clean(record.get("source_org")),
        clean(record.get("description_cn")),
        clean(record.get("continent")),
    ]
    haystack = " ".join(fields).lower()
    if args.keyword and args.keyword.lower() not in haystack:
        return False
    if args.disease and args.disease.lower() not in clean(record.get("disease")).lower():
        return False
    if args.continent and args.continent.lower() not in clean(record.get("continent")).lower():
        return False
    return True


def main():
    parser = argparse.ArgumentParser(description="Query public EPIC disease records.")
    parser.add_argument("--records-url", default=DEFAULT_RECORDS_URL)
    parser.add_argument("--keyword", default="")
    parser.add_argument("--disease", default="")
    parser.add_argument("--continent", default="")
    parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()

    records = [record for record in fetch_records(args.records_url) if matches(record, args)]
    for record in records[: max(args.limit, 1)]:
        print(
            json.dumps(
                {
                    "date": record.get("original_date") or record.get("start_date"),
                    "disease": record.get("disease"),
                    "location": record.get("location"),
                    "source_org": record.get("source_org"),
                    "source": record.get("source"),
                    "summary": record.get("description_cn"),
                },
                ensure_ascii=False,
            )
        )
    print(f"matched={len(records)}")


if __name__ == "__main__":
    main()
