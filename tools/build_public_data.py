#!/usr/bin/env python3
import csv
import hashlib
import io
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
INDEX_PATH = ROOT / "index.html"
TIMEOUT_SECONDS = 60

FIELD_ORIGINAL_DATE = "原始日期"
FIELD_START_DATE = "开始日期"
FIELD_LOCATION = "暴发地点"
FIELD_DISEASE = "传染病"
FIELD_SCALE = "规模"
FIELD_SYMPTOMS = "症状"
FIELD_MEASURES = "扑灭措施"
FIELD_TRANSMISSION = "传播方式"
FIELD_SOURCE = "来源"
FIELD_SOURCE_ORG = "来源机构"
FIELD_LONGITUDE = "经度"
FIELD_LATITUDE = "纬度"
FIELD_DESCRIPTION_CN = "中文描述"
FIELD_CONTINENT = "洲划分"
FIELD_IS_RESPIRATORY = "呼吸道传染病"
FIELD_ORIGINAL_TEXT = "原文"

FULL_COMPATIBILITY_FIELDS = [
    FIELD_ORIGINAL_DATE,
    FIELD_START_DATE,
    FIELD_LOCATION,
    FIELD_DISEASE,
    FIELD_SCALE,
    FIELD_SYMPTOMS,
    FIELD_MEASURES,
    FIELD_TRANSMISSION,
    FIELD_SOURCE,
    FIELD_SOURCE_ORG,
    FIELD_LONGITUDE,
    FIELD_LATITUDE,
    FIELD_DESCRIPTION_CN,
    FIELD_CONTINENT,
    FIELD_IS_RESPIRATORY,
    FIELD_ORIGINAL_TEXT,
]

EMPTY_SOURCE_ORG_VALUES = {"", "未知", "unknown", "none", "null", "nan", "n/a", "-"}
SOURCE_ORG_DOMAIN_OVERRIDES = {
    "7news.com.au": "7NEWS",
    "wltx.com": "WLTX",
    "aspenpublicradio.org": "Aspen Public Radio",
    "wral.com": "WRAL",
    "wusf.org": "WUSF",
    "healthbeat.org": "Healthbeat",
    "wbtv.com": "WBTV",
    "yahoo.com": "Yahoo News",
    "pakistantoday.com.pk": "Pakistan Today",
}

LOCATION_CORRECTIONS = [
    {
        "tokens": ("菲律宾",),
        "continent": "亚洲",
        "latitude": 12.8797,
        "longitude": 121.7740,
    },
    {
        "tokens": ("斯巴达堡", "斯巴坦堡", "南卡罗来纳"),
        "continent": "北美洲",
        "latitude": 34.9496,
        "longitude": -81.9320,
    },
    {
        "tokens": ("阿散蒂", "Ashanti"),
        "continent": "非洲",
        "latitude": 6.7470,
        "longitude": -1.5209,
    },
    {
        "tokens": ("'Eua",),
        "continent": "大洋洲",
        "latitude": -21.3783,
        "longitude": -174.9332,
    },
    {
        "tokens": ("康科德医院", "Concord Repatriation General Hospital", "Concord Hospital"),
        "continent": "大洋洲",
        "latitude": -33.8374,
        "longitude": 151.0928,
    },
]


def current_utc_timestamp():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def clean_text(value):
    if value is None:
        return ""
    try:
        if value != value:
            return ""
    except Exception:
        pass
    return str(value).strip()


def normalize_source_url(value):
    text = clean_text(value)
    if not text:
        return ""
    if text.startswith("http://") or text.startswith("https://"):
        return text
    return text


def infer_source_org_from_url(source_url, current_source_org=""):
    current_text = clean_text(current_source_org)
    if current_text and current_text.lower() not in EMPTY_SOURCE_ORG_VALUES:
        return current_text

    normalized_source = normalize_source_url(source_url)
    if not normalized_source:
        return current_text

    try:
        domain = urlparse(normalized_source).netloc.lower()
    except Exception:
        return current_text
    if domain.startswith("www."):
        domain = domain[4:]
    if not domain:
        return current_text

    if domain in SOURCE_ORG_DOMAIN_OVERRIDES:
        return SOURCE_ORG_DOMAIN_OVERRIDES[domain]

    parts = [part for part in domain.split(".") if part]
    label = parts[-2] if len(parts) >= 2 else domain
    label = label.replace("-", " ").replace("_", " ").strip()
    if not label:
        return domain
    if len(label) <= 4:
        return label.upper()
    return " ".join(part.capitalize() for part in label.split())


def parse_coordinate(value):
    if value in (None, ""):
        return 0.0
    try:
        if value != value:
            return 0.0
    except Exception:
        pass
    if isinstance(value, (int, float)):
        return float(value)

    value_str = str(value).strip().upper()
    if not value_str:
        return 0.0
    is_negative = "S" in value_str or "W" in value_str
    clean_str = re.sub(r"[°'\"`´]", "", value_str)
    match = re.search(r"([-+]?\d*\.?\d+)", clean_str)
    if not match:
        return 0.0
    try:
        number = float(match.group(1))
    except (ValueError, TypeError):
        return 0.0
    if is_negative:
        return -abs(number)
    if "N" in value_str or "E" in value_str:
        return abs(number)
    return number


def apply_continent_correction(longitude, continent):
    continent_upper = clean_text(continent).upper()
    if not continent_upper:
        return longitude
    if (
        "NORTH AMERICA" in continent_upper
        or "SOUTH AMERICA" in continent_upper
        or "北美" in continent_upper
        or "南美" in continent_upper
    ):
        return -abs(longitude)
    if "ASIA" in continent_upper or "亚洲" in continent_upper or "CHINA" in continent_upper or "中国" in continent_upper:
        if longitude < -160:
            return longitude
        return abs(longitude)
    return longitude


def apply_location_correction(location, continent, longitude, latitude):
    location_text = clean_text(location)
    for correction in LOCATION_CORRECTIONS:
        if any(token and token in location_text for token in correction["tokens"]):
            return correction["continent"], float(correction["longitude"]), float(correction["latitude"])
    return continent, longitude, latitude


def extract_date_sort_key(value):
    text = clean_text(value)
    if not text:
        return ""
    compact_digits = re.sub(r"\D", "", text)
    if len(compact_digits) >= 8:
        return f"{compact_digits[:4]}-{compact_digits[4:6]}-{compact_digits[6:8]}"
    parts = re.findall(r"\d+", text)
    if len(parts) >= 3 and len(parts[0]) == 4:
        return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
    return ""


def build_record_id(record):
    joined = "|".join(
        [
            clean_text(record.get(FIELD_ORIGINAL_DATE)),
            clean_text(record.get(FIELD_DISEASE)),
            clean_text(record.get(FIELD_LOCATION)),
            clean_text(record.get(FIELD_SOURCE)),
            clean_text(record.get(FIELD_DESCRIPTION_CN))[:120],
        ]
    )
    return hashlib.sha1(joined.encode("utf-8")).hexdigest()[:16]


def normalize_record(record):
    location = clean_text(record.get(FIELD_LOCATION))
    continent = clean_text(record.get(FIELD_CONTINENT))
    longitude = parse_coordinate(record.get(FIELD_LONGITUDE))
    latitude = parse_coordinate(record.get(FIELD_LATITUDE))
    continent, longitude, latitude = apply_location_correction(location, continent, longitude, latitude)
    longitude = apply_continent_correction(longitude, continent)

    source = clean_text(record.get(FIELD_SOURCE))
    normalized_source = normalize_source_url(source) or source
    source_org = infer_source_org_from_url(normalized_source, record.get(FIELD_SOURCE_ORG))

    return {
        "id": build_record_id(record),
        "original_date": clean_text(record.get(FIELD_ORIGINAL_DATE)),
        "start_date": clean_text(record.get(FIELD_START_DATE)),
        "location": location,
        "disease": clean_text(record.get(FIELD_DISEASE)),
        "scale": clean_text(record.get(FIELD_SCALE)),
        "symptoms": clean_text(record.get(FIELD_SYMPTOMS)),
        "measures": clean_text(record.get(FIELD_MEASURES)),
        "transmission": clean_text(record.get(FIELD_TRANSMISSION)),
        "source": normalized_source,
        "source_org": source_org,
        "longitude": longitude,
        "latitude": latitude,
        "description_cn": clean_text(record.get(FIELD_DESCRIPTION_CN)),
        "continent": continent,
        "is_respiratory": clean_text(record.get(FIELD_IS_RESPIRATORY)),
        "original_text": clean_text(record.get(FIELD_ORIGINAL_TEXT)),
        "date_sort": extract_date_sort_key(record.get(FIELD_ORIGINAL_DATE)),
    }


def normalize_records(records):
    normalized = [normalize_record(record) for record in records or [] if isinstance(record, dict)]
    normalized.sort(key=lambda item: (item.get("date_sort") or "", item.get("original_date") or ""), reverse=True)
    return normalized


def ensure_compatibility_payload(records):
    payload = []
    for record in records or []:
        if not isinstance(record, dict):
            continue
        item = {field: clean_text(record.get(field)) for field in FULL_COMPATIBILITY_FIELDS}
        payload.append(item)
    return payload


def has_valid_coordinates(record):
    latitude = record.get("latitude", 0.0)
    longitude = record.get("longitude", 0.0)
    return (
        isinstance(latitude, (int, float))
        and isinstance(longitude, (int, float))
        and -90.0 <= latitude <= 90.0
        and -180.0 <= longitude <= 180.0
        and not (abs(latitude) < 1e-9 and abs(longitude) < 1e-9)
    )


def build_map_payload(records):
    return [
        {
            "id": record["id"],
            "original_date": record.get("original_date", ""),
            "disease": record.get("disease", ""),
            "location": record.get("location", ""),
            "latitude": record.get("latitude", 0.0),
            "longitude": record.get("longitude", 0.0),
            "description_cn": record.get("description_cn", ""),
            "continent": record.get("continent", ""),
            "source_org": record.get("source_org", ""),
        }
        for record in records
        if has_valid_coordinates(record)
    ]


def build_overview_payload(records):
    diseases = sorted({record["disease"] for record in records if record.get("disease")})
    continents = sorted({record["continent"] for record in records if record.get("continent")})
    return {
        "total_records": len(records),
        "disease_count": len(diseases),
        "continent_count": len(continents),
        "latest_date": next((record["original_date"] for record in records if record.get("original_date")), ""),
        "filter_options": {
            "diseases": diseases,
            "continents": continents,
        },
    }


def empty_epietl_payload():
    return {
        "meta": {
            "fetched_at": "",
            "base_url": "",
            "dashboard_days": 0,
            "channel_count": 0,
            "total_reports": 0,
            "complete_reports": 0,
            "pending_reports": 0,
            "failed_reports": 0,
            "reports_analyzed": 0,
            "risk_generated_at": "",
            "health": {"status": "", "agent_ready": False, "db_connected": False},
        },
        "breakdown": {"source_types": [], "languages": [], "regions": []},
        "risk_summary": {"global_summary": "", "country_risks": []},
        "events": [],
        "channels": [],
        "public_access": {
            "health": True,
            "channels": True,
            "dashboard_risk": True,
            "reports_requires_auth": True,
            "risk_events_requires_auth": True,
        },
    }


def fetch_bytes(base_url, path, accept):
    request = Request(
        urljoin(base_url.rstrip("/") + "/", path.lstrip("/")),
        headers={"User-Agent": "EPIC-Public-Data-Build/1.0", "Accept": accept},
    )
    with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return response.read()


def fetch_json(base_url, path):
    return json.loads(fetch_bytes(base_url, path, "application/json").decode("utf-8"))


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_index_timestamp(generated_at):
    if not INDEX_PATH.exists():
        return
    text = INDEX_PATH.read_text(encoding="utf-8")
    updated = re.sub(r'("generatedAt":\s*")[^"]*(")', rf"\g<1>{generated_at}\2", text, count=1)
    if updated != text:
        INDEX_PATH.write_text(updated, encoding="utf-8")


def main():
    public_base = clean_text(os.getenv("EPIC_PUBLIC_SOURCE_BASE_URL"))
    if not public_base:
        raise SystemExit("EPIC_PUBLIC_SOURCE_BASE_URL secret is required.")

    raw_records = fetch_json(public_base, "/api/data/")
    if not isinstance(raw_records, list):
        raise ValueError("public data response must be a list")

    try:
        epietl_payload = fetch_json(public_base, "/api/data/epietl/")
        if not isinstance(epietl_payload, dict):
            epietl_payload = empty_epietl_payload()
    except Exception:
        epietl_payload = empty_epietl_payload()

    weekly_embedded = False
    try:
        weekly_bytes = fetch_bytes(public_base, "/download_week/", "text/csv")
        (DATA_DIR / "weekly_merged_latest.csv").write_bytes(weekly_bytes)
        weekly_embedded = True
    except Exception:
        weekly_embedded = (DATA_DIR / "weekly_merged_latest.csv").exists()

    generated_at = current_utc_timestamp()
    compatibility_payload = ensure_compatibility_payload(raw_records)
    records = normalize_records(compatibility_payload)
    overview = build_overview_payload(records)
    overview["last_modified"] = generated_at
    map_payload = build_map_payload(records)
    build_meta = {
        "generated_at": generated_at,
        "record_count": len(records),
        "map_point_count": len(map_payload),
        "disease_count": overview["disease_count"],
        "continent_count": overview["continent_count"],
        "epietl_channel_count": int(((epietl_payload.get("meta") or {}).get("channel_count") or 0)),
        "download_week_embedded": weekly_embedded,
    }

    write_json(DATA_DIR / "data.json", compatibility_payload)
    write_json(DATA_DIR / "records.json", records)
    write_json(DATA_DIR / "overview.json", overview)
    write_json(DATA_DIR / "map.json", map_payload)
    write_json(DATA_DIR / "epietl_public.json", epietl_payload)
    write_json(DATA_DIR / "build_meta.json", build_meta)
    update_index_timestamp(generated_at)

    print(f"Updated public data snapshot: records={len(records)} map_points={len(map_payload)}")


if __name__ == "__main__":
    main()
