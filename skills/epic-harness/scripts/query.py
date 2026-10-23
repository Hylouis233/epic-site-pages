#!/usr/bin/env python3
"""Read-only client for the public EpicDemic and EpicIntel websites.

The sites do not publish a separate MCP URL. This script is the skill's
connection to their public read APIs. It never calls admin, login, approval,
publish, alert, or other write routes.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

DEMIC = "https://epicdemic.hylouis.top"
INTEL = "https://epicintel.hylouis.top"
UA = "epic-harness-skill/1.0"
LIST_KEYS = ("items", "diseases", "countries", "pathogens", "reports", "events", "sources")


def fetch(url: str, timeout: float) -> object:
    request = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read(500).decode("utf-8", "replace")
        print(f"HTTP {exc.code} {url}\n{detail}", file=sys.stderr)
        raise SystemExit(1) from exc
    except urllib.error.URLError as exc:
        print(f"request failed: {url}: {exc.reason}", file=sys.stderr)
        raise SystemExit(1) from exc
    try:
        return json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as exc:
        print(f"invalid JSON from {url}: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


def with_query(url: str, params: dict) -> str:
    clean = {key: value for key, value in params.items() if value not in (None, "")}
    if not clean:
        return url
    return url + "?" + urllib.parse.urlencode(clean)


def trim(value: object, limit: int) -> object:
    if isinstance(value, list):
        return [trim(item, limit) for item in value[:limit]]
    if isinstance(value, dict):
        trimmed = {}
        for key, item in value.items():
            if key in LIST_KEYS and isinstance(item, list):
                trimmed[key] = trim(item, limit)
                trimmed[f"{key}_shown"] = min(len(item), limit)
                trimmed[f"{key}_total"] = len(item)
            elif isinstance(item, str) and len(item) > 500:
                trimmed[key] = item[:500] + "…"
            else:
                trimmed[key] = item
        return trimmed
    if isinstance(value, str) and len(value) > 500:
        return value[:500] + "…"
    return value


DEMIC_FIELDS = (
    "id",
    "original_date",
    "disease",
    "location",
    "continent",
    "scale",
    "source_org",
    "source",
    "description_cn",
)


def project_demic(payload: object) -> object:
    if isinstance(payload, list):
        return [project_demic(item) for item in payload]
    if isinstance(payload, dict) and "items" in payload:
        copied = dict(payload)
        copied["items"] = [project_demic(item) for item in payload.get("items") or []]
        return copied
    if isinstance(payload, dict) and "id" in payload and "disease" in payload:
        return {key: payload.get(key) for key in DEMIC_FIELDS}
    return payload


def emit(payload: object, raw: bool, limit: int) -> None:
    if not raw:
        payload = trim(payload, limit)
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


def demic_filters(args: argparse.Namespace) -> dict:
    return {
        "keyword": args.keyword,
        "disease": args.disease,
        "continent": args.continent,
        "date_from": args.date_from,
        "date_to": args.date_to,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Read-only EpicDemic / EpicIntel query")
    parser.add_argument(
        "command",
        choices=[
            "demic-overview",
            "demic-table",
            "demic-map",
            "demic-epietl",
            "intel-health",
            "intel-summary",
            "intel-sources",
            "intel-diseases",
            "intel-risk",
            "intel-reports",
            "intel-catalog",
        ],
    )
    parser.add_argument("--keyword")
    parser.add_argument("--disease")
    parser.add_argument("--continent")
    parser.add_argument("--date-from", dest="date_from")
    parser.add_argument("--date-to", dest="date_to")
    parser.add_argument("--page", type=int, default=1)
    parser.add_argument("--page-size", type=int, default=5)
    parser.add_argument("--slug")
    parser.add_argument("--status")
    parser.add_argument("--risk-level", dest="risk_level")
    parser.add_argument("--region")
    parser.add_argument("--report-kind", dest="report_kind")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--raw", action="store_true", help="print the API payload without trimming")
    args = parser.parse_args()
    limit = max(1, min(args.limit, 50))
    page_size = max(1, min(args.page_size, 20))

    if args.command == "demic-overview":
        url = with_query(f"{DEMIC}/api/data/overview/", demic_filters(args))
    elif args.command == "demic-table":
        params = demic_filters(args)
        params.update({"page": args.page, "page_size": page_size})
        url = with_query(f"{DEMIC}/api/data/table/", params)
    elif args.command == "demic-map":
        url = with_query(f"{DEMIC}/api/data/map/", demic_filters(args))
    elif args.command == "demic-epietl":
        url = f"{DEMIC}/api/data/epietl/"
    elif args.command == "intel-health":
        url = f"{INTEL}/api/health"
    elif args.command == "intel-summary":
        url = f"{INTEL}/api/dashboard/summary"
    elif args.command == "intel-sources":
        url = f"{INTEL}/api/datasources"
    elif args.command == "intel-catalog":
        url = f"{INTEL}/api/catalog"
    elif args.command == "intel-diseases":
        if args.slug:
            url = with_query(
                f"{INTEL}/api/disease-overview/{urllib.parse.quote(args.slug)}",
                {"canonical": "true"},
            )
        else:
            url = with_query(f"{INTEL}/api/disease-overview", {"canonical": "true"})
    elif args.command == "intel-risk":
        url = with_query(f"{INTEL}/api/risk-map", {"disease": args.disease})
    elif args.command == "intel-reports":
        url = with_query(
            f"{INTEL}/api/reports",
            {
                "disease": args.disease,
                "disease_slug": args.slug,
                "date_from": args.date_from,
                "date_to": args.date_to,
                "status": args.status,
                "risk_level": args.risk_level,
                "region": args.region,
                "report_kind": args.report_kind,
                "latest_only": "true",
                "limit": limit,
                "offset": 0,
            },
        )
    else:
        raise SystemExit(f"unknown command: {args.command}")

    payload = fetch(url, args.timeout)
    if args.command in {"demic-table", "demic-map"} and not args.raw:
        payload = project_demic(payload)
    emit(payload, args.raw, limit)


if __name__ == "__main__":
    main()
