#!/usr/bin/env python3
import argparse
import csv
import hashlib
import html
import io
import json
import os
import re
import shutil
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
V1_DATA_DIR = DATA_DIR / "v1"
EVENTS_DIR = ROOT / "events"
INDEX_PATH = ROOT / "index.html"
TIMEOUT_SECONDS = 60
PUBLIC_SITE_URL = "https://hylouis233.github.io/epic-site-pages/"
MAX_TABLE_PAGE_SIZE = 200
RSS_TIMEZONE = timezone(timedelta(hours=8), name="Asia/Shanghai")
BACKUP_DIR = ROOT / "BACKUP"
SCHEMA_VERSION = "1.0.0"
STALE_AFTER_HOURS = 72
RECORD_DROP_QUARANTINE_RATIO = 0.50
MAX_PUBLIC_SUMMARY_LENGTH = 600

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

TABLE_RECORD_COMPATIBILITY_FIELDS = {
    FIELD_ORIGINAL_DATE: "original_date",
    FIELD_START_DATE: "start_date",
    FIELD_LOCATION: "location",
    FIELD_DISEASE: "disease",
    FIELD_SCALE: "scale",
    FIELD_SYMPTOMS: "symptoms",
    FIELD_MEASURES: "measures",
    FIELD_TRANSMISSION: "transmission",
    FIELD_SOURCE: "source",
    FIELD_SOURCE_ORG: "source_org",
    FIELD_LONGITUDE: "longitude",
    FIELD_LATITUDE: "latitude",
    FIELD_DESCRIPTION_CN: "description_cn",
    FIELD_CONTINENT: "continent",
    FIELD_IS_RESPIRATORY: "is_respiratory",
    FIELD_ORIGINAL_TEXT: "original_text",
}

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
]

PUBLIC_TEXT_DROP_MARKERS = (
    "\u5e7f\u544a \u66f4\u591a\u5185\u5bb9\u8bf7\u7ee7\u7eed\u5f80\u4e0b\u9605\u8bfb",
    "\u5e7f\u544a",
    "AD" + "VERTISEMENT",
    "Advertise" + "ment",
)

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

DISEASE_RULES = (
    (("h5n1",), "avian-influenza", "禽流感", "Avian influenza", "H5N1"),
    (("h7n9",), "avian-influenza", "禽流感", "Avian influenza", "H7N9"),
    (("h1n1", "甲型h1n1"), "influenza", "流行性感冒", "Influenza", "H1N1"),
    (("h3n2",), "influenza", "流行性感冒", "Influenza", "H3N2"),
    (("covid-19", "covid19", "新冠", "新型冠状病毒"), "covid-19", "新型冠状病毒感染", "COVID-19", None),
    (("m痘", "猴痘", "mpox"), "mpox", "猴痘", "Mpox", None),
    (("军团", "legion"), "legionellosis", "军团菌病", "Legionellosis", None),
    (("肠病毒d68", "ev-d68"), "enterovirus-d68", "肠病毒 D68 型感染", "Enterovirus D68 infection", "EV-D68"),
    (("肠病毒", "enterovirus"), "enterovirus-infection", "肠病毒感染", "Enterovirus infection", None),
    (("登革", "dengue"), "dengue", "登革热", "Dengue", None),
    (("疟疾", "malaria"), "malaria", "疟疾", "Malaria", None),
    (("诺如", "norovirus"), "norovirus-infection", "诺如病毒感染", "Norovirus infection", None),
    (("环孢子", "cyclospora"), "cyclosporiasis", "环孢子虫病", "Cyclosporiasis", None),
    (("恙虫", "scrub typhus"), "scrub-typhus", "恙虫病", "Scrub typhus", None),
    (("绦虫", "taeniasis"), "taeniasis", "绦虫病", "Taeniasis", None),
    (("链球菌肺炎", "pneumococcal"), "pneumococcal-disease", "肺炎链球菌病", "Pneumococcal disease", None),
    (("腹泻", "diarr"), "acute-diarrheal-disease", "急性腹泻病", "Acute diarrheal disease", None),
    (("急性上呼吸道",), "acute-upper-respiratory-infection", "急性上呼吸道感染", "Acute upper respiratory infection", None),
    (("流感", "influenza"), "influenza", "流行性感冒", "Influenza", None),
)

MULTI_DISEASE_MARKERS = (
    "多种法定传染病",
    "等法定及重点监测传染病",
    "病毒性肝炎、",
)

MONTH_NAMES = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}

PUBLIC_GEO_FIELDS = (
    "geo_status",
    "geo_status_label",
    "geo_precision",
    "geo_confidence",
    "geo_confidence_label",
    "geo_confidence_score",
    "geo_resolution_level",
    "geo_resolution_label",
    "geo_source",
    "geo_source_label",
    "country_code",
    "geo_audit_status",
    "geo_audit_label",
    "geo_coordinates",
    "geo_x",
    "geo_y",
    "geo_note",
)

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


def current_utc_datetime():
    return datetime.now(timezone.utc).replace(microsecond=0)


def format_utc_timestamp(value):
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def clean_text(value):
    if value is None:
        return ""
    try:
        if value != value:
            return ""
    except Exception:
        pass
    return str(value).strip()


def clean_rss_text(value, fallback="未注明"):
    text = clean_text(value)
    return text if text else fallback


def get_record_value(record, *keys):
    for key in keys:
        if key in record and record.get(key) not in (None, ""):
            return record.get(key)
    return ""


def parse_utc_timestamp(value):
    text = clean_text(value)
    if not text:
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def parse_flexible_date(value):
    text = clean_text(value)
    if not text:
        return None

    numeric_match = re.search(r"(?<!\d)(20\d{2})\D{0,3}(\d{1,2})\D{0,3}(\d{1,2})(?!\d)", text)
    if numeric_match:
        try:
            return datetime(
                int(numeric_match.group(1)),
                int(numeric_match.group(2)),
                int(numeric_match.group(3)),
                tzinfo=RSS_TIMEZONE,
            ).date()
        except ValueError:
            pass

    english_match = re.search(
        r"(?<!\d)(\d{1,2})\s+([A-Za-z]+)\s+(20\d{2})(?!\d)",
        text,
        flags=re.IGNORECASE,
    )
    if english_match:
        month = MONTH_NAMES.get(english_match.group(2).lower())
        if month:
            try:
                return datetime(
                    int(english_match.group(3)),
                    month,
                    int(english_match.group(1)),
                    tzinfo=RSS_TIMEZONE,
                ).date()
            except ValueError:
                pass
    return None


def format_date(value):
    return value.isoformat() if value else ""


def is_future_date(value, build_utc, allowance_days=1):
    if value is None:
        return False
    build_date = build_utc.astimezone(RSS_TIMEZONE).date()
    return value > build_date + timedelta(days=allowance_days)


def parse_labeled_date_range(text, label_pattern):
    if not text:
        return None, None
    pattern = re.compile(
        rf"{label_pattern}[^\d]{{0,20}}"
        r"(\d{1,2}\s+[A-Za-z]+\s+20\d{2})\s+(?:to|through|[-–—])\s+"
        r"(\d{1,2}\s+[A-Za-z]+\s+20\d{2})",
        flags=re.IGNORECASE,
    )
    match = pattern.search(text)
    if not match:
        return None, None
    return parse_flexible_date(match.group(1)), parse_flexible_date(match.group(2))


def extract_date_fields(record, build_utc):
    raw_original = clean_text(get_record_value(record, "date_raw", "original_date", FIELD_ORIGINAL_DATE))
    raw_start = clean_text(get_record_value(record, "start_date", FIELD_START_DATE))
    original_text = clean_text(get_record_value(record, "original_text", FIELD_ORIGINAL_TEXT))

    raw_original_date = parse_flexible_date(raw_original)
    original_date = parse_flexible_date(get_record_value(record, "published_at")) or raw_original_date
    start_date = parse_flexible_date(get_record_value(record, "event_start_date")) or parse_flexible_date(raw_start)
    quality_flags = list(record.get("quality_flags") or [])
    if is_future_date(raw_original_date, build_utc):
        quality_flags.append("future_original_date")
    if is_future_date(original_date, build_utc):
        quality_flags.append("future_original_date")
        original_date = None
    if is_future_date(start_date, build_utc):
        quality_flags.append("future_start_date")
        start_date = None

    reporting_start = parse_flexible_date(get_record_value(record, "reporting_period_start"))
    reporting_end = parse_flexible_date(get_record_value(record, "reporting_period_end"))
    parsed_reporting_start, parsed_reporting_end = parse_labeled_date_range(original_text, r"reporting\s+period")
    reporting_start = reporting_start or parsed_reporting_start
    reporting_end = reporting_end or parsed_reporting_end
    event_start = parse_flexible_date(get_record_value(record, "event_start_date"))
    event_end = parse_flexible_date(get_record_value(record, "event_end_date"))
    parsed_event_start, parsed_event_end = parse_labeled_date_range(original_text, r"(?:in\s+)?week\s+\d+\s*\(")
    event_start = event_start or parsed_event_start
    event_end = event_end or parsed_event_end
    extraction_match = re.search(
        r"date\s+of\s+data\s+extraction\s*:\s*(\d{1,2}\s+[A-Za-z]+\s+20\d{2})",
        original_text,
        flags=re.IGNORECASE,
    )
    extracted_date = parse_flexible_date(extraction_match.group(1)) if extraction_match else None

    for name, value in (
        ("reporting_period_start", reporting_start),
        ("reporting_period_end", reporting_end),
        ("event_start_date", event_start),
        ("event_end_date", event_end),
        ("published_at", extracted_date),
    ):
        if is_future_date(value, build_utc):
            quality_flags.append(f"future_{name}")
            if name == "reporting_period_start":
                reporting_start = None
            elif name == "reporting_period_end":
                reporting_end = None
            elif name == "event_start_date":
                event_start = None
            elif name == "event_end_date":
                event_end = None
            elif name == "published_at":
                extracted_date = None

    event_start = event_start or start_date or original_date
    event_end = event_end or event_start
    published_at = original_date or extracted_date or event_end or event_start
    date_sort = published_at or event_end or event_start
    return {
        "date_raw": raw_original,
        "original_date": format_date(published_at),
        "event_start_date": format_date(event_start),
        "event_end_date": format_date(event_end),
        "reporting_period_start": format_date(reporting_start),
        "reporting_period_end": format_date(reporting_end),
        "published_at": format_date(published_at),
        "date_sort": format_date(date_sort),
        "quality_flags": quality_flags,
    }


def build_rss_window(build_utc):
    build_local = build_utc.astimezone(RSS_TIMEZONE)
    window_start = build_local.replace(hour=0, minute=0, second=0, microsecond=0)
    window_end = build_local.replace(hour=23, minute=59, second=59, microsecond=0)
    return {
        "generated_at": format_utc_timestamp(build_utc),
        "timezone": "Asia/Shanghai",
        "window_start": window_start.isoformat(),
        "window_end": window_end.isoformat(),
        "target_date": build_local.date().isoformat(),
    }


def parse_record_date(value):
    return parse_flexible_date(value)


def get_record_date(record):
    for key in ("first_seen_at", "updated_at", "date_sort", "original_date", FIELD_ORIGINAL_DATE):
        record_date = parse_record_date(record.get(key))
        if record_date is not None:
            return record_date
    return None


def select_daily_records(records, build_utc):
    target_date = build_utc.astimezone(RSS_TIMEZONE).date()
    selected = []
    dated_count = 0
    source_count = 0
    for record in records or []:
        if not isinstance(record, dict):
            continue
        source_count += 1
        activity_dates = [
            parse_record_date(record.get("first_seen_at")),
            parse_record_date(record.get("updated_at")),
        ]
        activity_dates = [value for value in activity_dates if value is not None]
        if not activity_dates:
            continue
        dated_count += 1
        if target_date in activity_dates:
            selected.append(record)
    return selected, {
        "rss_source_record_count": source_count,
        "rss_dated_record_count": dated_count,
        "rss_target_date": target_date.isoformat(),
    }


def clean_public_text(value):
    text = clean_text(value)
    if not text:
        return ""
    lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if any(marker in stripped for marker in PUBLIC_TEXT_DROP_MARKERS):
            continue
        lines.append(line)
    return "\n".join(lines).strip()


def normalize_source_url(value):
    text = clean_text(value)
    if not text:
        return ""
    if text.startswith("http://") or text.startswith("https://"):
        try:
            parts = urlsplit(text)
        except ValueError:
            return text
        return urlunsplit(
            (
                parts.scheme,
                parts.netloc.encode("idna").decode("ascii"),
                quote(parts.path, safe="/%:@!$&'()*+,;=-._~"),
                quote(parts.query, safe="=&?/:@!$'()*+,;%-._~"),
                quote(parts.fragment, safe="?/:@!$&'()*+,;=%-._~"),
            )
        )
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
    return format_date(parse_flexible_date(value))


def canonicalize_disease(value):
    raw = clean_text(value)
    normalized = re.sub(r"[\s（）()_]+", "", raw).lower()
    if not normalized:
        return {
            "disease_id": "unclassified",
            "disease_name_zh": "未分类",
            "disease_name_en": "Unclassified",
            "subtype": None,
            "pathogen": None,
            "disease_raw": raw,
            "disease_is_aggregate": False,
        }
    if any(marker.lower().replace(" ", "") in normalized for marker in MULTI_DISEASE_MARKERS):
        return {
            "disease_id": "multiple-notifiable-diseases",
            "disease_name_zh": "多种法定传染病",
            "disease_name_en": "Multiple notifiable diseases",
            "subtype": None,
            "pathogen": None,
            "disease_raw": raw,
            "disease_is_aggregate": True,
        }
    if raw in {"乙类传染病", "法定传染病"}:
        return {
            "disease_id": "notifiable-diseases-group",
            "disease_name_zh": raw,
            "disease_name_en": "Notifiable diseases group",
            "subtype": None,
            "pathogen": None,
            "disease_raw": raw,
            "disease_is_aggregate": True,
        }
    for aliases, disease_id, name_zh, name_en, subtype in DISEASE_RULES:
        if any(alias.replace(" ", "").lower() in normalized for alias in aliases):
            pathogen = None
            if disease_id == "influenza":
                pathogen = "Influenza virus"
            elif disease_id == "covid-19":
                pathogen = "SARS-CoV-2"
            elif disease_id == "mpox":
                pathogen = "Monkeypox virus"
            return {
                "disease_id": disease_id,
                "disease_name_zh": name_zh,
                "disease_name_en": name_en,
                "subtype": subtype,
                "pathogen": pathogen,
                "disease_raw": raw,
                "disease_is_aggregate": False,
            }
    return {
        "disease_id": "unclassified-" + hashlib.sha1(raw.encode("utf-8")).hexdigest()[:8],
        "disease_name_zh": raw,
        "disease_name_en": "Unclassified",
        "subtype": None,
        "pathogen": None,
        "disease_raw": raw,
        "disease_is_aggregate": False,
    }


def parse_scale(value, description=""):
    raw = clean_text(value)
    context = f"{raw} {clean_text(description)}"

    def extract_count(patterns):
        for pattern in patterns:
            match = re.search(pattern, context, flags=re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1).replace(",", ""))
                except (TypeError, ValueError):
                    continue
        return None

    cases = extract_count(
        (
            r"(\d[\d,]*)\s*(?:例[^,，;；]{0,12})?(?:cases?|病例)",
            r"病例\s*(\d[\d,]*)",
            r"累计(?:报告)?\s*(\d[\d,]*)(?:\s*\([^)]*\))?\s*(?:cases?|例)",
        )
    )
    deaths = extract_count(
        (
            r"(\d[\d,]*)\s*(?:例)?\s*(?:deaths?|死亡)",
            r"死亡(?:病例)?\s*(\d[\d,]*)",
            r"死亡\s*(\d[\d,]*)(?:\s*例)?",
        )
    )
    hospitalizations = extract_count(
        (
            r"(\d[\d,]*)\s*(?:例)?\s*(?:hospitali[sz](?:ations?|ed)|住院)",
            r"住院(?:病例)?\s*(\d[\d,]*)",
        )
    )
    lower = context.lower()
    if any(token in lower for token in ("cumulative", "累计", "since ")):
        period_type = "cumulative"
    elif any(token in lower for token in ("weekly", "week ", "本周", "周新增")):
        period_type = "weekly"
    elif any(token in lower for token in ("daily", "today", "当日", "今日")):
        period_type = "daily"
    elif raw:
        period_type = "event"
    else:
        period_type = "unspecified"
    return {
        "scale_raw": raw,
        "cases": cases,
        "deaths": deaths,
        "hospitalizations": hospitalizations,
        "period_type": period_type,
    }


def classify_source(source_url, source_org=""):
    source_url = clean_text(source_url)
    source_org = clean_text(source_org)
    domain = ""
    try:
        domain = urlparse(source_url).netloc.lower()
    except ValueError:
        pass
    joined = f"{domain} {source_org}".lower()
    if "promed" in joined:
        return "promed", 2
    if any(token in joined for token in ("who.int", "world health organization")):
        return "international_organization", 1
    if domain.endswith(".gov") or domain.endswith(".gov.cn") or any(
        token in joined for token in ("cdc", "nicd", "health department", "ministry of health", "卫生健康")
    ):
        return "official_health_authority", 1
    if domain.endswith(".edu") or any(token in joined for token in ("university", "journal", "institute")):
        return "academic", 2
    if any(
        token in joined
        for token in ("news", "radio", "today", "yahoo", "7news", "wral", "wltx", "wusf", "wbtv")
    ):
        return "news_media", 3
    return "other_open_source", 4


def normalize_id_text(value):
    return re.sub(r"[^\w]+", " ", clean_text(value).lower(), flags=re.UNICODE).strip()


def stable_hash(prefix, *parts):
    joined = "|".join(normalize_id_text(part) for part in parts if clean_text(part))
    return f"{prefix}_{hashlib.sha256(joined.encode('utf-8')).hexdigest()[:20]}"


def trim_public_summary(value):
    text = re.sub(r"\s+", " ", clean_public_text(value)).strip()
    if len(text) <= MAX_PUBLIC_SUMMARY_LENGTH:
        return text
    return text[: MAX_PUBLIC_SUMMARY_LENGTH - 1].rstrip() + "…"


def derive_record_ids(source, disease_id, location, event_start_date):
    signal_basis = source or "source-unavailable"
    signal_id = stable_hash("sig", signal_basis, disease_id, location)
    event_id = stable_hash("evt", source or signal_id, disease_id, location)
    cluster_id = stable_hash("cluster", disease_id, location, event_start_date[:7] if event_start_date else "unknown")
    return event_id, signal_id, cluster_id


def build_record_id(record):
    source = get_record_value(record, "source", FIELD_SOURCE)
    disease = get_record_value(record, "disease_raw", "disease", FIELD_DISEASE)
    location = get_record_value(record, "location", FIELD_LOCATION)
    return stable_hash("evt", source, disease, location)


def normalize_record(record, build_utc=None, observed_at="", previous_record=None):
    build_utc = build_utc or current_utc_datetime()
    previous_record = previous_record or {}
    location = clean_text(get_record_value(record, "location", FIELD_LOCATION))
    continent = clean_text(get_record_value(record, "continent", FIELD_CONTINENT))
    longitude = parse_coordinate(get_record_value(record, "longitude", FIELD_LONGITUDE))
    latitude = parse_coordinate(get_record_value(record, "latitude", FIELD_LATITUDE))
    continent, longitude, latitude = apply_location_correction(location, continent, longitude, latitude)
    longitude = apply_continent_correction(longitude, continent)

    source = clean_text(get_record_value(record, "source", FIELD_SOURCE))
    normalized_source = normalize_source_url(source) or source
    source_org = infer_source_org_from_url(
        normalized_source,
        get_record_value(record, "source_org", FIELD_SOURCE_ORG),
    )
    disease = canonicalize_disease(get_record_value(record, "disease_raw", "disease", FIELD_DISEASE))
    date_fields = extract_date_fields(record, build_utc)
    description = trim_public_summary(get_record_value(record, "description_cn", FIELD_DESCRIPTION_CN))
    scale = parse_scale(get_record_value(record, "scale_raw", "scale", FIELD_SCALE), description)
    source_type, source_tier = classify_source(normalized_source, source_org)
    event_id, signal_id, cluster_id = derive_record_ids(
        normalized_source,
        disease["disease_id"],
        location,
        date_fields["event_start_date"],
    )

    has_previous_record = bool(previous_record)
    first_seen_at = clean_text(previous_record.get("first_seen_at")) or clean_text(
        get_record_value(record, "first_seen_at")
    )
    if not first_seen_at and not has_previous_record:
        first_seen_at = observed_at
    previous_content_hash = clean_text(previous_record.get("content_hash"))
    content_hash = stable_hash(
        "rev",
        normalized_source,
        disease["disease_id"],
        location,
        date_fields["published_at"],
        description,
        scale["scale_raw"],
    )
    previous_revision = int(previous_record.get("revision") or 1)
    changed = bool(previous_content_hash and previous_content_hash != content_hash)
    updated_at = clean_text(previous_record.get("updated_at")) or clean_text(
        get_record_value(record, "updated_at")
    ) or first_seen_at
    if changed and observed_at:
        updated_at = observed_at
    revision = previous_revision + 1 if changed else previous_revision

    quality_flags = list(date_fields.pop("quality_flags"))
    if not is_public_http_url(normalized_source):
        quality_flags.append("missing_or_invalid_source_url")
    if not location:
        quality_flags.append("missing_location")
    if disease["disease_id"].startswith("unclassified"):
        quality_flags.append("unclassified_disease")
    if not date_fields["date_sort"]:
        quality_flags.append("missing_valid_date")
    if not has_valid_coordinates({"latitude": latitude, "longitude": longitude}):
        quality_flags.append("invalid_or_missing_coordinates")
    score = max(0, 100 - 12 * len(set(quality_flags)) - (8 if source_tier >= 3 else 0))
    quality_status = "warning" if quality_flags else "validated"
    extraction_confidence = round(score / 100, 2)
    seen_at_status = "observed" if first_seen_at else "unavailable_for_legacy_snapshot"

    normalized = {
        "id": event_id,
        "event_id": event_id,
        "signal_id": signal_id,
        "cluster_id": cluster_id,
        "revision": revision,
        **date_fields,
        "start_date": date_fields["event_start_date"],
        "location": location,
        "disease": disease["disease_name_zh"],
        **disease,
        "scale": scale["scale_raw"],
        **scale,
        "symptoms": clean_text(get_record_value(record, "symptoms", FIELD_SYMPTOMS)),
        "measures": clean_text(get_record_value(record, "measures", FIELD_MEASURES)),
        "transmission": clean_text(get_record_value(record, "transmission", FIELD_TRANSMISSION)),
        "source": normalized_source,
        "source_org": source_org,
        "source_type": source_type,
        "source_tier": source_tier,
        "source_rights": "third-party; consult the linked source for reuse terms",
        "license": "not_asserted",
        "attribution_required": True,
        "longitude": longitude,
        "latitude": latitude,
        "description_cn": description,
        "continent": continent,
        "is_respiratory": clean_text(get_record_value(record, "is_respiratory", FIELD_IS_RESPIRATORY)),
        "first_seen_at": first_seen_at,
        "updated_at": updated_at,
        "seen_at_status": seen_at_status,
        "review_status": clean_text(get_record_value(record, "review_status")) or "unreviewed",
        "extraction_confidence": extraction_confidence,
        "data_quality_score": score,
        "quality_status": quality_status,
        "quality_flags": sorted(set(quality_flags)),
        "content_hash": content_hash,
    }
    for field in PUBLIC_GEO_FIELDS:
        if field in record:
            normalized[field] = record[field]
    return normalized


def normalize_records(records, build_utc=None, observed_at="", previous_records=None):
    build_utc = build_utc or current_utc_datetime()
    previous_records = [item for item in (previous_records or []) if isinstance(item, dict)]
    previous_by_signal = {item.get("signal_id"): item for item in previous_records if item.get("signal_id")}
    previous_by_source = {item.get("source"): item for item in previous_records if item.get("source")}
    normalized = []
    seen_signals = set()
    for record in records or []:
        if not isinstance(record, dict):
            continue
        source = clean_text(get_record_value(record, "source", FIELD_SOURCE))
        disease = canonicalize_disease(get_record_value(record, "disease_raw", "disease", FIELD_DISEASE))
        location = clean_text(get_record_value(record, "location", FIELD_LOCATION))
        event_start = extract_date_fields(record, build_utc)["event_start_date"]
        _, signal_id, _ = derive_record_ids(source, disease["disease_id"], location, event_start)
        previous = previous_by_signal.get(signal_id) or previous_by_source.get(source) or {}
        item = normalize_record(record, build_utc, observed_at, previous)
        if item["signal_id"] in seen_signals:
            continue
        seen_signals.add(item["signal_id"])
        normalized.append(item)
    normalized.sort(key=lambda item: (item.get("date_sort") or "", item.get("original_date") or ""), reverse=True)
    return normalized


def ensure_compatibility_payload(records):
    payload = []
    for record in records or []:
        if not isinstance(record, dict):
            continue
        item = {}
        for field in FULL_COMPATIBILITY_FIELDS:
            table_field = TABLE_RECORD_COMPATIBILITY_FIELDS.get(field)
            item[field] = clean_text(record.get(field) if field in record else record.get(table_field))
        payload.append(item)
    return payload


def table_record_to_compatibility_record(record):
    if not isinstance(record, dict):
        return {}
    if any(clean_text(record.get(field)) for field in TABLE_RECORD_COMPATIBILITY_FIELDS):
        return {field: clean_text(record.get(field)) for field in FULL_COMPATIBILITY_FIELDS}
    return {
        compatibility_field: clean_text(record.get(table_field))
        for compatibility_field, table_field in TABLE_RECORD_COMPATIBILITY_FIELDS.items()
    }


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
            "event_id": record.get("event_id", record["id"]),
            "original_date": record.get("original_date", ""),
            "disease": record.get("disease", ""),
            "disease_id": record.get("disease_id", ""),
            "location": record.get("location", ""),
            "latitude": record.get("latitude", 0.0),
            "longitude": record.get("longitude", 0.0),
            "description_cn": record.get("description_cn", ""),
            "continent": record.get("continent", ""),
            "source_org": record.get("source_org", ""),
            "quality_status": record.get("quality_status", ""),
            "data_quality_score": record.get("data_quality_score"),
        }
        for record in records
        if has_valid_coordinates(record)
    ]


def build_overview_payload(records):
    diseases = sorted({record["disease"] for record in records if record.get("disease")})
    continents = sorted({record["continent"] for record in records if record.get("continent")})
    valid_dates = [record.get("date_sort") for record in records if record.get("date_sort")]
    return {
        "total_records": len(records),
        "disease_count": len(diseases),
        "continent_count": len(continents),
        "latest_date": max(valid_dates, default=""),
        "filter_options": {
            "diseases": diseases,
            "continents": continents,
        },
    }


def is_public_http_url(url):
    try:
        parsed = urlparse(str(url or ""))
    except ValueError:
        return False
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def event_url(record, public_site_url):
    event_id = clean_text(record.get("event_id") or record.get("id"))
    return urljoin(public_site_url.rstrip("/") + "/", f"events/{event_id}/")


def html_escape(value):
    return html.escape(clean_text(value), quote=True)


def build_english_event_summary(record):
    disease = clean_text(record.get("disease_name_en")) or "infectious-disease"
    parts = [f"EPIC recorded a public-source {disease.lower()} signal in this event snapshot."]
    counts = []
    if record.get("cases") is not None:
        counts.append(f"{record.get('cases'):,} cases")
    if record.get("deaths") is not None:
        counts.append(f"{record.get('deaths'):,} deaths")
    if record.get("hospitalizations") is not None:
        counts.append(f"{record.get('hospitalizations'):,} hospitalizations")
    if counts:
        parts.append(f"Structured fields report {', '.join(counts)}.")
    parts.append("Use the linked original source to verify context, definitions, and current status.")
    return " ".join(parts)


def render_event_page(record, status, public_site_url):
    disease_name_en = clean_text(record.get("disease_name_en")) or "Infectious-disease"
    title = f"{disease_name_en} event record"
    chinese_title = f"{record.get('disease_name_zh') or record.get('disease')} · {record.get('location') or '地点未注明'}"
    description = build_english_event_summary(record)
    chinese_description = trim_public_summary(record.get("description_cn")) or "EPIC 公开来源传染病事件监测记录。"
    detail_url = event_url(record, public_site_url)
    source_link = record.get("source") if is_public_http_url(record.get("source")) else ""
    source_html = (
        f'<a class="button button--primary" href="{html_escape(source_link)}" target="_blank" rel="noopener noreferrer" data-zh="查看原始来源 ↗">Original source ↗</a>'
        if source_link
        else '<span class="button button--disabled" data-zh="原始来源不可用">Original source unavailable</span>'
    )
    warning_html = "".join(
        f"<li>{html_escape(flag)}</li>" for flag in (record.get("quality_flags") or [])
    ) or '<li data-zh="未触发自动质量警告">No automated quality warnings were triggered.</li>'
    json_ld = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": title,
        "description": description,
        "url": detail_url,
        "dateModified": record.get("updated_at") or status.get("build_generated_at"),
        "creator": {"@type": "Organization", "name": "EPIC"},
        "isBasedOn": source_link or None,
        "spatialCoverage": record.get("location"),
        "temporalCoverage": record.get("event_start_date") or record.get("published_at"),
        "license": urljoin(public_site_url, "LICENSE"),
    }
    json_ld = {key: value for key, value in json_ld.items() if value not in (None, "")}
    json_ld_text = json.dumps(json_ld, ensure_ascii=False).replace("</", "<" + "\\/")
    facts = (
        ("Event start", "事件开始", record.get("event_start_date") or "Not reported"),
        ("Event end", "事件结束", record.get("event_end_date") or "Not reported"),
        ("Published", "发布日期", record.get("published_at") or "Not reported"),
        ("First observed", "首次发现", record.get("first_seen_at") or "Unavailable for historical snapshot"),
        ("Source organization", "来源机构", record.get("source_org") or "Not reported"),
        ("Source type", "来源类型", record.get("source_type") or "Unclassified"),
        ("Cases", "病例", record.get("cases") if record.get("cases") is not None else "Not structured"),
        ("Deaths", "死亡", record.get("deaths") if record.get("deaths") is not None else "Not structured"),
    )
    facts_html = "".join(
        f'<div class="detail-fact"><span data-zh="{html_escape(chinese_label)}">{html_escape(label)}</span><strong>{html_escape(value)}</strong></div>'
        for label, chinese_label, value in facts
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html_escape(title)} | EPIC</title>
  <meta name="description" content="{html_escape(description)}">
  <link rel="canonical" href="{html_escape(detail_url)}">
  <link rel="alternate" type="application/rss+xml" title="EPIC daily updates" href="{html_escape(urljoin(public_site_url, 'rss.xml'))}">
  <link rel="icon" href="../../favicon.svg" type="image/svg+xml">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{html_escape(title)}">
  <meta property="og:description" content="{html_escape(description)}">
  <meta property="og:url" content="{html_escape(detail_url)}">
  <meta property="og:image" content="{html_escape(urljoin(public_site_url, 'og-image.svg'))}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="../../assets/epic/css/app.css?v=20260814-visual">
  <script>(function(){{try{{var l=localStorage.getItem("epic-lang")==="zh-CN"?"zh-CN":"en";document.documentElement.lang=l;document.documentElement.dataset.language=l;var s=localStorage.getItem("epic-theme");document.documentElement.dataset.theme=s||"light";}}catch(e){{document.documentElement.dataset.theme="light";}}}})();</script>
  <script type="application/ld+json">{json_ld_text}</script>
</head>
<body class="detail-page">
  <div class="detail-shell">
    <nav class="detail-nav" aria-label="Breadcrumb">
      <div class="detail-nav__trail"><a href="../../">EPIC</a><span>/</span><a href="../../#events" data-zh="事件">Events</a><span>/</span><span>{html_escape(record.get('event_id'))}</span></div>
      <div class="detail-nav__controls"><button class="language-toggle" id="language-toggle" type="button">中文</button><a href="../../" data-zh="返回首页">Back to dashboard</a></div>
    </nav>
    <main>
      <header class="detail-hero">
        <div class="detail-hero__signal">PUBLIC-SOURCE SIGNAL · {html_escape((status.get('source_status') or 'unknown').upper())}</div>
        <p class="detail-hero__eyebrow">{html_escape(record.get('disease_name_en') or 'Infectious-disease event')}</p>
        <h1 data-zh="{html_escape(chinese_title)}">{html_escape(title)}</h1>
        <p class="detail-hero__summary" data-language-content="en">{html_escape(description)}</p>
        <p class="detail-hero__summary" data-language-content="zh-CN" hidden>{html_escape(chinese_description)}</p>
        <div class="detail-actions">{source_html}<a class="button button--secondary" href="../../#data-access" data-zh="使用数据接口">Use the data</a></div>
      </header>
      <section class="detail-status status-banner status-banner--{html_escape(status.get('source_status'))}">
        <strong data-zh="数据状态：{html_escape(status.get('source_status_label'))}">DATA STATUS: {html_escape(status.get('source_status_label_en') or status.get('source_status', 'unknown').upper())}</strong>
        <span data-zh="{html_escape(status.get('status_message_zh'))}">{html_escape(status.get('status_message_en') or 'Data status is unavailable.')}</span>
      </section>
      <section class="detail-grid">
        <article class="detail-card detail-card--facts">
          <p class="panel-heading__eyebrow">EVENT FACTS</p><h2 data-zh="事件字段">Structured fields</h2>
          <div class="detail-facts">{facts_html}</div>
        </article>
        <article class="detail-card">
          <p class="panel-heading__eyebrow">PROVENANCE</p><h2 data-zh="来源与可追溯性">Source &amp; traceability</h2>
          <p data-zh="本页是公开来源信号的结构化摘要，不替代原始公告，也不构成正式公共卫生预警或医疗建议。">This page is a structured summary of a public-source signal. It does not replace the original notice and is not an official public-health alert or medical advice.</p>
          <dl class="detail-provenance">
            <dt>Signal ID</dt><dd>{html_escape(record.get('signal_id'))}</dd>
            <dt>Cluster ID</dt><dd>{html_escape(record.get('cluster_id'))}</dd>
            <dt data-zh="修订">Revision</dt><dd>v{html_escape(record.get('revision'))}</dd>
            <dt data-zh="来源权利">Source rights</dt><dd>{html_escape(record.get('source_rights'))}</dd>
          </dl>
        </article>
        <article class="detail-card">
          <p class="panel-heading__eyebrow">QUALITY</p><h2 data-zh="数据质量">Data quality</h2>
          <div class="quality-score"><strong>{html_escape(record.get('data_quality_score'))}</strong><span>/ 100</span></div>
          <p data-zh="抽取置信度 {html_escape(record.get('extraction_confidence'))} · 复核状态 {html_escape(record.get('review_status'))}">Extraction confidence {html_escape(record.get('extraction_confidence'))} · Review status {html_escape(record.get('review_status'))}</p>
          <ul class="quality-flags">{warning_html}</ul>
          <a class="text-link" href="../../methodology.html" data-zh="阅读方法与质量控制 →">Read methodology &amp; quality control →</a>
        </article>
        <article class="detail-card detail-card--citation">
          <p class="panel-heading__eyebrow">CITE THIS RECORD</p><h2 data-zh="推荐引用">Suggested citation</h2>
          <p>EPIC. “{html_escape(title)}.” EPIC infectious-disease event record, revision {html_escape(record.get('revision'))}. {html_escape(detail_url)}</p>
        </article>
      </section>
    </main>
  </div>
  <script src="../../assets/epic/js/i18n.js?v=20260814-visual"></script>
</body>
</html>
"""


def build_event_pages(records, status, public_site_url):
    EVENTS_DIR.mkdir(parents=True, exist_ok=True)
    expected = set()
    for record in records:
        event_id = clean_text(record.get("event_id"))
        if not event_id:
            continue
        target = EVENTS_DIR / event_id
        target.mkdir(parents=True, exist_ok=True)
        (target / "index.html").write_text(
            render_event_page(record, status, public_site_url), encoding="utf-8"
        )
        expected.add(event_id)
    for child in EVENTS_DIR.iterdir():
        if child.is_dir() and child.name.startswith("evt_") and child.name not in expected:
            shutil.rmtree(child)


def build_sitemap(records, public_site_url, status):
    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    ET.register_namespace("", namespace)
    root = ET.Element(f"{{{namespace}}}urlset")
    pages = (
        (public_site_url, "1.0"),
        (urljoin(public_site_url, "methodology.html"), "0.6"),
        (urljoin(public_site_url, "limitations.html"), "0.6"),
    )
    lastmod = clean_text(status.get("build_generated_at"))[:10]
    for location, priority in pages:
        url = ET.SubElement(root, f"{{{namespace}}}url")
        ET.SubElement(url, f"{{{namespace}}}loc").text = location
        ET.SubElement(url, f"{{{namespace}}}lastmod").text = lastmod
        ET.SubElement(url, f"{{{namespace}}}priority").text = priority
    for record in records:
        url = ET.SubElement(root, f"{{{namespace}}}url")
        ET.SubElement(url, f"{{{namespace}}}loc").text = event_url(record, public_site_url)
        modified = clean_text(record.get("updated_at"))[:10] or lastmod
        ET.SubElement(url, f"{{{namespace}}}lastmod").text = modified
        ET.SubElement(url, f"{{{namespace}}}priority").text = "0.7"
    try:
        ET.indent(root, space="  ")
    except AttributeError:
        pass
    return ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")


def build_rss_item_title(record):
    disease = clean_rss_text(record.get("disease_name_en"), "Infectious-disease")
    return f"{disease} event record"


def build_rss_description(record):
    summary = build_english_event_summary(record)
    fields = [
        ("Disease", record.get("disease_name_en")),
        ("Location (source language)", record.get("location")),
        ("Event date", record.get("event_start_date")),
        ("Publication date", record.get("published_at")),
        ("Scale (source language)", record.get("scale")),
        ("Source organization", record.get("source_org")),
        ("Data quality", f"{record.get('data_quality_score', '—')}/100"),
    ]
    details = "".join(f"<li><strong>{label}: </strong>{clean_rss_text(value)}</li>" for label, value in fields)
    return f"<p>{summary}</p><ul>{details}</ul>"


def build_rss_xml(records, build_utc, public_site_url):
    daily_records, meta = select_daily_records(records, build_utc)
    rss_window = build_rss_window(build_utc)
    pub_date = build_utc.astimezone(RSS_TIMEZONE)

    root = ET.Element("rss", {"version": "2.0"})
    channel = ET.SubElement(root, "channel")
    ET.SubElement(channel, "title").text = "EPIC Daily Infectious-disease Event Monitor"
    ET.SubElement(channel, "link").text = public_site_url
    ET.SubElement(channel, "description").text = "Public-source infectious-disease event records first observed or updated in the current daily window."
    ET.SubElement(channel, "language").text = "en-US"
    ET.SubElement(channel, "lastBuildDate").text = pub_date.strftime("%a, %d %b %Y %H:%M:%S %z")
    ET.SubElement(channel, "generator").text = "EPIC Public Pages Builder"
    ET.SubElement(channel, "ttl").text = "1440"

    for record in daily_records:
        source_url = clean_text(record.get("source"))
        item_link = event_url(record, public_site_url)
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = build_rss_item_title(record)
        ET.SubElement(item, "link").text = item_link
        guid = ET.SubElement(item, "guid")
        guid.set("isPermaLink", "true")
        guid.text = item_link
        activity_at = parse_utc_timestamp(record.get("updated_at") or record.get("first_seen_at"))
        ET.SubElement(item, "pubDate").text = format_datetime(activity_at or pub_date)
        ET.SubElement(item, "description").text = build_rss_description(record)
        ET.SubElement(item, "category").text = clean_rss_text(record.get("disease_name_en"), "Infectious disease")
        source = ET.SubElement(item, "source")
        if is_public_http_url(source_url):
            source.set("url", source_url)
        source.text = clean_rss_text(record.get("source_org"))

    try:
        ET.indent(root, space="  ")
    except AttributeError:
        pass
    rss_text = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
    return rss_text, {
        "rss_generated_at": rss_window["generated_at"],
        "rss_timezone": rss_window["timezone"],
        "rss_window_start": rss_window["window_start"],
        "rss_window_end": rss_window["window_end"],
        "rss_item_count": len(daily_records),
        **meta,
    }


def build_daily_archive_markdown(records, build_utc, public_site_url):
    daily_records, meta = select_daily_records(records, build_utc)
    target_date = meta["rss_target_date"]
    lines = [
        f"# EPIC Daily Infectious-disease Event Monitor — {target_date}",
        "",
        f"- Generated at: {format_utc_timestamp(build_utc)}",
        f"- Daily window: {target_date} 00:00-23:59 Asia/Shanghai",
        f"- Records in window: {len(daily_records)}",
        "",
        f"Dashboard: {public_site_url}",
        "",
    ]
    if not daily_records:
        lines.extend(["No newly observed or updated public records fall within this 24-hour window.", ""])
        return "\n".join(lines)

    for index, record in enumerate(daily_records, start=1):
        lines.extend(
            [
                f"## {index}. {build_rss_item_title(record)}",
                "",
                build_english_event_summary(record),
                "",
                f"- Location (source language): {clean_rss_text(record.get('location'))}",
                f"- Event date: {clean_rss_text(record.get('event_start_date'))}",
                f"- Publication date: {clean_rss_text(record.get('published_at'))}",
                f"- Scale (source language): {clean_rss_text(record.get('scale'))}",
                f"- Source organization: {clean_rss_text(record.get('source_org'))}",
                f"- EPIC detail page: {event_url(record, public_site_url)}",
                f"- Original source: {clean_rss_text(record.get('source'))}",
                "",
            ]
        )
    return "\n".join(lines)


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


def fetch_text(base_url, path, accept="text/plain"):
    return fetch_bytes(base_url, path, accept).decode("utf-8")


def fetch_json(base_url, path):
    return json.loads(fetch_bytes(base_url, path, "application/json").decode("utf-8"))


def fetch_table_records(base_url):
    records = []
    page = 1
    total = None
    while True:
        payload = fetch_json(base_url, f"/api/data/table/?page={page}&page_size={MAX_TABLE_PAGE_SIZE}")
        if not isinstance(payload, dict):
            raise ValueError("table data response must be an object")
        items = payload.get("items") or []
        if not isinstance(items, list):
            raise ValueError("table data items must be a list")
        records.extend([item for item in items if isinstance(item, dict)])
        try:
            total = int(payload.get("total") or len(records))
        except Exception:
            total = len(records)
        if not items or len(records) >= total:
            break
        page += 1
    return records


def rewrite_rss_site_url(rss_text, public_site_url):
    root = ET.fromstring(rss_text)
    channel = root.find("channel")
    if channel is not None:
        link = channel.find("link")
        if link is None:
            link = ET.SubElement(channel, "link")
        link.text = public_site_url
    try:
        ET.indent(root, space="  ")
    except AttributeError:
        pass
    return ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_json(path, expected_type):
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return expected_type()
    return payload if isinstance(payload, expected_type) else expected_type()


def calculate_staleness_hours(last_successful_ingest_at, build_utc):
    last_success = parse_utc_timestamp(last_successful_ingest_at)
    if last_success is None:
        return None
    return max(0, round((build_utc - last_success).total_seconds() / 3600, 1))


def quality_gate_records(records, upstream_count, previous_count):
    checks = []
    quarantined = []
    accepted = []
    hard_failure = False

    checks.append(
        {
            "id": "upstream_nonzero",
            "status": "pass" if upstream_count > 0 else "fail",
            "value": upstream_count,
            "threshold": "> 0",
        }
    )
    if upstream_count == 0:
        hard_failure = True

    record_ratio = (upstream_count / previous_count) if previous_count else 1.0
    drop_status = "pass"
    if previous_count >= 10 and record_ratio < RECORD_DROP_QUARANTINE_RATIO:
        drop_status = "fail"
        hard_failure = True
    checks.append(
        {
            "id": "record_count_change",
            "status": drop_status,
            "value": round(record_ratio, 3),
            "threshold": f">= {RECORD_DROP_QUARANTINE_RATIO}",
        }
    )

    for record in records:
        flags = set(record.get("quality_flags") or [])
        if "missing_valid_date" in flags:
            quarantined.append(
                {
                    "signal_id": record.get("signal_id"),
                    "source": record.get("source"),
                    "reason": "missing_valid_date",
                }
            )
            continue
        accepted.append(record)

    total = max(len(records), 1)
    future_corrected = sum(
        1
        for record in records
        if any(str(flag).startswith("future_") for flag in (record.get("quality_flags") or []))
    )
    missing_source = sum(
        1 for record in accepted if "missing_or_invalid_source_url" in (record.get("quality_flags") or [])
    )
    missing_coordinates = sum(
        1 for record in accepted if "invalid_or_missing_coordinates" in (record.get("quality_flags") or [])
    )
    coordinate_completeness = round(
        1 - missing_coordinates / max(len(accepted), 1),
        3,
    )
    duplicate_count = max(upstream_count - len(records), 0)
    checks.extend(
        [
            {
                "id": "valid_dates",
                "status": "pass" if not quarantined else "warning",
                "value": round(len(accepted) / total, 3),
                "threshold": "1.0 preferred",
            },
            {
                "id": "future_dates",
                "status": "warning" if future_corrected else "pass",
                "value": future_corrected,
                "threshold": "0 raw future dates",
            },
            {
                "id": "source_urls",
                "status": "warning" if missing_source else "pass",
                "value": round(1 - missing_source / max(len(accepted), 1), 3),
                "threshold": "1.0 preferred",
            },
            {
                "id": "coordinates",
                "status": "pass" if coordinate_completeness >= 0.9 else "warning",
                "value": coordinate_completeness,
                "threshold": ">= 0.9 preferred",
            },
            {
                "id": "duplicate_signals",
                "status": "warning" if duplicate_count else "pass",
                "value": duplicate_count,
                "threshold": "0 after normalization",
            },
        ]
    )

    if records and len(accepted) / len(records) < RECORD_DROP_QUARANTINE_RATIO:
        hard_failure = True
    return accepted, {
        "gate_passed": not hard_failure,
        "checks": checks,
        "upstream_record_count": upstream_count,
        "accepted_record_count": len(accepted),
        "quarantined_record_count": len(quarantined),
        "quarantined": quarantined,
    }


def build_status_payload(
    build_utc,
    records,
    warnings,
    retained_existing_snapshot,
    ingest_accepted,
    previous_meta,
    quality_report,
    bootstrap_last_success="",
):
    build_generated_at = format_utc_timestamp(build_utc)
    derived_data_as_of = max((record.get("date_sort") or "" for record in records), default="")
    previous_data_as_of = clean_text(previous_meta.get("data_as_of"))
    previous_last_success = clean_text(previous_meta.get("last_successful_ingest_at"))

    if ingest_accepted:
        last_successful_ingest_at = build_generated_at
        data_as_of = derived_data_as_of
    else:
        last_successful_ingest_at = previous_last_success or clean_text(bootstrap_last_success)
        data_as_of = previous_data_as_of or derived_data_as_of

    staleness_hours = calculate_staleness_hours(last_successful_ingest_at, build_utc)
    if not records:
        source_status = "failed"
        status_message_zh = "没有可用的公开快照。"
        status_message_en = "No public snapshot is available."
    elif retained_existing_snapshot or not quality_report.get("gate_passed", False):
        source_status = "degraded"
        status_message_zh = "上游采集未通过质量闸门，继续提供最近一次成功快照。"
        status_message_en = "Upstream ingest did not pass the quality gate; the latest successful snapshot remains available."
    elif staleness_hours is None or staleness_hours > STALE_AFTER_HOURS:
        source_status = "stale"
        status_message_zh = "数据快照已超过新鲜度阈值，请谨慎使用。"
        status_message_en = "The data snapshot exceeds the freshness threshold; use with caution."
    else:
        source_status = "healthy"
        status_message_zh = "上游采集与公开数据质量检查通过。"
        status_message_en = "Upstream ingest and public-data quality checks passed."

    labels = {"healthy": "正常", "degraded": "降级", "stale": "陈旧", "failed": "失败"}
    labels_en = {"healthy": "Healthy", "degraded": "Degraded", "stale": "Stale", "failed": "Failed"}
    return {
        "schema_version": SCHEMA_VERSION,
        "build_generated_at": build_generated_at,
        "data_as_of": data_as_of,
        "last_successful_ingest_at": last_successful_ingest_at,
        "source_status": source_status,
        "source_status_label": labels[source_status],
        "source_status_label_en": labels_en[source_status],
        "status_message_zh": status_message_zh,
        "status_message_en": status_message_en,
        "staleness_hours": staleness_hours,
        "stale_after_hours": STALE_AFTER_HOURS,
        "warnings": list(dict.fromkeys(clean_text(item) for item in warnings if clean_text(item))),
    }


def write_csv(path, records):
    fields = [
        "event_id",
        "signal_id",
        "cluster_id",
        "revision",
        "event_start_date",
        "event_end_date",
        "published_at",
        "first_seen_at",
        "updated_at",
        "disease_id",
        "disease_name_zh",
        "disease_name_en",
        "subtype",
        "location",
        "continent",
        "cases",
        "deaths",
        "hospitalizations",
        "period_type",
        "source_org",
        "source_type",
        "source_tier",
        "source",
        "description_cn",
        "review_status",
        "extraction_confidence",
        "data_quality_score",
        "quality_status",
    ]
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(
        buffer,
        fieldnames=fields,
        extrasaction="ignore",
        lineterminator="\n",
    )
    writer.writeheader()
    writer.writerows(records)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buffer.getvalue().encode("utf-8-sig"))


def build_geojson(records):
    features = []
    for record in records:
        if not has_valid_coordinates(record):
            continue
        properties = {
            key: record.get(key)
            for key in (
                "event_id",
                "published_at",
                "disease_id",
                "disease_name_zh",
                "location",
                "continent",
                "source_org",
                "source_type",
                "source",
                "description_cn",
                "data_quality_score",
            )
        }
        features.append(
            {
                "type": "Feature",
                "id": record.get("event_id"),
                "geometry": {
                    "type": "Point",
                    "coordinates": [record.get("longitude"), record.get("latitude")],
                },
                "properties": properties,
            }
        )
    return {"type": "FeatureCollection", "features": features}


def build_schema_payload():
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": f"{PUBLIC_SITE_URL}data/v1/schema.json",
        "title": "EPIC infectious-disease event record",
        "description": "Versioned public contract for event-level public-source monitoring summaries.",
        "type": "array",
        "items": {
            "type": "object",
            "required": [
                "event_id",
                "signal_id",
                "schema_version",
                "disease_id",
                "disease_name_zh",
                "location",
                "source",
                "quality_status",
            ],
            "properties": {
                "event_id": {"type": "string", "pattern": "^evt_[a-f0-9]{20}$"},
                "signal_id": {"type": "string", "pattern": "^sig_[a-f0-9]{20}$"},
                "cluster_id": {"type": "string", "pattern": "^cluster_[a-f0-9]{20}$"},
                "schema_version": {"const": SCHEMA_VERSION},
                "revision": {"type": "integer", "minimum": 1},
                "event_start_date": {"type": ["string", "null"], "format": "date"},
                "event_end_date": {"type": ["string", "null"], "format": "date"},
                "reporting_period_start": {"type": ["string", "null"], "format": "date"},
                "reporting_period_end": {"type": ["string", "null"], "format": "date"},
                "published_at": {"type": ["string", "null"], "format": "date"},
                "first_seen_at": {"type": ["string", "null"]},
                "updated_at": {"type": ["string", "null"]},
                "disease_id": {"type": "string"},
                "disease_name_zh": {"type": "string"},
                "disease_name_en": {"type": "string"},
                "disease_raw": {"type": "string"},
                "location": {"type": "string"},
                "continent": {"type": "string"},
                "cases": {"type": ["integer", "null"], "minimum": 0},
                "deaths": {"type": ["integer", "null"], "minimum": 0},
                "hospitalizations": {"type": ["integer", "null"], "minimum": 0},
                "source": {"type": "string", "format": "uri"},
                "source_org": {"type": "string"},
                "source_type": {"type": "string"},
                "description_cn": {"type": "string", "maxLength": MAX_PUBLIC_SUMMARY_LENGTH},
                "data_quality_score": {"type": "integer", "minimum": 0, "maximum": 100},
                "quality_status": {"enum": ["validated", "warning"]},
                "quality_flags": {"type": "array", "items": {"type": "string"}},
            },
            "additionalProperties": True,
        },
    }


def file_sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_versioned_data(records, status, quality_report):
    V1_DATA_DIR.mkdir(parents=True, exist_ok=True)
    nullable_fields = (
        "event_start_date",
        "event_end_date",
        "reporting_period_start",
        "reporting_period_end",
        "published_at",
        "first_seen_at",
        "updated_at",
        "subtype",
        "pathogen",
    )
    contract_records = []
    for record in records:
        contract_record = {"schema_version": SCHEMA_VERSION, **record}
        for field in nullable_fields:
            if contract_record.get(field) == "":
                contract_record[field] = None
        contract_records.append(contract_record)
    write_json(V1_DATA_DIR / "records.json", contract_records)
    (V1_DATA_DIR / "events.ndjson").write_text(
        "".join(json.dumps(record, ensure_ascii=False) + "\n" for record in contract_records),
        encoding="utf-8",
    )
    write_csv(V1_DATA_DIR / "events.csv", contract_records)
    write_json(V1_DATA_DIR / "events.geojson", build_geojson(contract_records))
    write_json(V1_DATA_DIR / "schema.json", build_schema_payload())
    write_json(V1_DATA_DIR / "quality-report.json", quality_report)

    parquet_written = False
    try:
        import pyarrow as pa
        import pyarrow.parquet as pq

        parquet_records = []
        for record in contract_records:
            parquet_record = dict(record)
            for field in ("quality_flags",):
                parquet_record[field] = json.dumps(parquet_record.get(field) or [], ensure_ascii=False)
            parquet_records.append(parquet_record)
        pq.write_table(pa.Table.from_pylist(parquet_records), V1_DATA_DIR / "events.parquet")
        parquet_written = True
    except (ImportError, ValueError, TypeError):
        parquet_written = False

    artifact_names = [
        "records.json",
        "events.ndjson",
        "events.csv",
        "events.geojson",
        "schema.json",
        "quality-report.json",
    ]
    if parquet_written:
        artifact_names.append("events.parquet")
    checksums = {name: file_sha256(V1_DATA_DIR / name) for name in artifact_names}
    manifest = {
        **status,
        "record_count": len(records),
        "event_count": len({record.get("event_id") for record in records}),
        "signal_count": len({record.get("signal_id") for record in records}),
        "source_count": len({record.get("source") for record in records if record.get("source")}),
        "disease_count": len({record.get("disease_id") for record in records if record.get("disease_id")}),
        "continent_count": len({record.get("continent") for record in records if record.get("continent")}),
        "formats": {
            "json": "records.json",
            "ndjson": "events.ndjson",
            "csv": "events.csv",
            "geojson": "events.geojson",
            "schema": "schema.json",
            "quality_report": "quality-report.json",
        },
        "checksums_sha256": checksums,
        "license": {
            "repository": "proprietary-source-available",
            "structured_data": "no public reuse license asserted",
            "third_party_sources": "follow each linked source's terms",
        },
        "quality_gate": {
            "passed": quality_report.get("gate_passed", False),
            "ingest_accepted": status.get("source_status") == "healthy",
            "accepted_record_count": quality_report.get("accepted_record_count", 0),
            "quarantined_record_count": quality_report.get("quarantined_record_count", 0),
        },
    }
    if parquet_written:
        manifest["formats"]["parquet"] = "events.parquet"
    write_json(V1_DATA_DIR / "manifest.json", manifest)
    write_json(DATA_DIR / "manifest.json", manifest)
    return manifest


def retain_existing_snapshot_if_upstream_empty(compatibility_payload, records, warnings):
    if records and not compatibility_payload:
        compatibility_payload = [table_record_to_compatibility_record(record) for record in records]
        warnings.append(f"rebuilt compatibility payload from {len(records)} table records")
        return compatibility_payload, records, False

    if compatibility_payload and not records:
        records = normalize_records(compatibility_payload)
        warnings.append(f"normalized {len(records)} records from the compatibility payload")
        return compatibility_payload, records, False

    if compatibility_payload or records:
        return compatibility_payload, records, False

    existing_compatibility = read_json(DATA_DIR / "data.json", list)
    existing_records = read_json(DATA_DIR / "records.json", list)
    if existing_compatibility and existing_records:
        warnings.append(
            "upstream returned no records; retained the existing public snapshot "
            f"with {len(existing_records)} records"
        )
        return existing_compatibility, existing_records, True

    warnings.append("upstream returned no records and no existing public snapshot was available")
    return compatibility_payload, records, False


def complete_overview_payload(payload, records, warnings):
    fallback = build_overview_payload(records)
    required_fields = (
        "total_records",
        "disease_count",
        "continent_count",
        "latest_date",
        "filter_options",
    )
    if not isinstance(payload, dict):
        warnings.append("overview response was not an object; rebuilt it from public records")
        return fallback

    missing_fields = [field for field in required_fields if field not in payload]
    if not missing_fields:
        return payload

    warnings.append(
        f"overview response missing {', '.join(missing_fields)}; rebuilt those fields from public records"
    )
    return {**fallback, **payload}


def update_index_timestamp(generated_at):
    if not INDEX_PATH.exists():
        return
    text = INDEX_PATH.read_text(encoding="utf-8")
    updated = re.sub(r'("generatedAt":\s*")[^"]*(")', rf"\g<1>{generated_at}\2", text, count=1)
    if updated != text:
        INDEX_PATH.write_text(updated, encoding="utf-8")


def resolve_bootstrap_last_success(previous_meta):
    return (
        clean_text(previous_meta.get("last_successful_ingest_at"))
        or clean_text(os.getenv("EPIC_BOOTSTRAP_LAST_SUCCESSFUL_INGEST_AT"))
        or "2026-07-11T05:23:39Z"
    )


def build_from_existing(build_utc, public_site_url, warnings=None):
    warnings = list(warnings or [])
    raw_records = read_json(DATA_DIR / "records.json", list)
    previous_meta = read_json(DATA_DIR / "build_meta.json", dict)
    observed_at = clean_text(previous_meta.get("last_successful_ingest_at")) or resolve_bootstrap_last_success(
        previous_meta
    )
    records = normalize_records(
        raw_records,
        build_utc=build_utc,
        observed_at="",
        previous_records=raw_records,
    )
    accepted_records, quality_report = quality_gate_records(
        records,
        upstream_count=len(raw_records),
        previous_count=len(raw_records),
    )
    warnings.extend(
        [
            "rebuilt public artifacts from the retained local snapshot",
            "upstream was not contacted during local rebuild",
        ]
    )
    status = build_status_payload(
        build_utc,
        accepted_records,
        warnings,
        retained_existing_snapshot=True,
        ingest_accepted=False,
        previous_meta=previous_meta,
        quality_report=quality_report,
        bootstrap_last_success=resolve_bootstrap_last_success(previous_meta),
    )
    return accepted_records, quality_report, status, previous_meta


def write_public_artifacts(
    records,
    compatibility_payload,
    epietl_payload,
    weekly_embedded,
    build_utc,
    public_site_url,
    quality_report,
    status,
):
    overview = build_overview_payload(records)
    overview.update(status)
    overview["last_modified"] = status.get("data_as_of")
    map_payload = build_map_payload(records)
    rss_text, rss_meta = build_rss_xml(records, build_utc, public_site_url)
    archive_date = rss_meta["rss_target_date"]
    archive_path = BACKUP_DIR / f"{archive_date}.md"
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    archive_path.write_text(build_daily_archive_markdown(records, build_utc, public_site_url), encoding="utf-8")

    manifest = build_versioned_data(records, status, quality_report)
    write_csv(DATA_DIR / "weekly_merged_latest.csv", records)
    build_meta = {
        **status,
        "generated_at": status["build_generated_at"],
        "record_count": len(records),
        "map_point_count": len(map_payload),
        "disease_count": overview["disease_count"],
        "continent_count": overview["continent_count"],
        "epietl_channel_count": int(((epietl_payload.get("meta") or {}).get("channel_count") or 0)),
        "download_week_embedded": weekly_embedded,
        "daily_archive_path": f"BACKUP/{archive_date}.md",
        "daily_archive_item_count": rss_meta["rss_item_count"],
        "quality_gate": manifest["quality_gate"],
        **rss_meta,
    }

    compatibility_payload = ensure_compatibility_payload(records)
    write_json(DATA_DIR / "data.json", compatibility_payload)
    write_json(DATA_DIR / "records.json", records)
    write_json(DATA_DIR / "overview.json", overview)
    write_json(DATA_DIR / "map.json", map_payload)
    write_json(DATA_DIR / "epietl_public.json", epietl_payload)
    write_json(DATA_DIR / "build_meta.json", build_meta)
    (ROOT / "rss.xml").write_text(rss_text, encoding="utf-8")
    build_event_pages(records, status, public_site_url)
    (ROOT / "sitemap.xml").write_text(
        build_sitemap(records, public_site_url, status), encoding="utf-8"
    )
    update_index_timestamp(status["build_generated_at"])
    return build_meta


def main(argv=None):
    parser = argparse.ArgumentParser(description="Build EPIC public static data artifacts.")
    parser.add_argument(
        "--from-existing",
        action="store_true",
        help="Rebuild normalized public artifacts from the retained local snapshot without contacting upstream.",
    )
    parser.add_argument(
        "--build-at",
        default="",
        help="Optional ISO-8601 build timestamp used for deterministic tests and local reconstruction.",
    )
    args = parser.parse_args(argv)

    build_utc = parse_utc_timestamp(args.build_at) if args.build_at else current_utc_datetime()
    if build_utc is None:
        raise SystemExit("--build-at must be a valid ISO-8601 timestamp")
    public_base = clean_text(os.getenv("EPIC_PUBLIC_SOURCE_BASE_URL"))
    public_site_url = clean_text(os.getenv("EPIC_PUBLIC_SITE_URL")) or PUBLIC_SITE_URL

    if args.from_existing:
        records, quality_report, status, previous_meta = build_from_existing(build_utc, public_site_url)
        compatibility_payload = ensure_compatibility_payload(records)
        epietl_payload = read_json(DATA_DIR / "epietl_public.json", dict) or empty_epietl_payload()
        weekly_embedded = (DATA_DIR / "weekly_merged_latest.csv").exists()
        write_public_artifacts(
            records,
            compatibility_payload,
            epietl_payload,
            weekly_embedded,
            build_utc,
            public_site_url,
            quality_report,
            status,
        )
        print(
            "Rebuilt public artifacts from retained snapshot: "
            f"records={len(records)} status={status['source_status']}"
        )
        return

    if not public_base:
        raise SystemExit("EPIC_PUBLIC_SOURCE_BASE_URL secret is required.")
    warnings = []
    previous_records = read_json(DATA_DIR / "records.json", list)
    previous_meta = read_json(DATA_DIR / "build_meta.json", dict)

    table_records = []
    try:
        raw_records = fetch_json(public_base, "/api/data/")
        if not isinstance(raw_records, list):
            raise ValueError("public data response must be a list")
        compatibility_payload = ensure_compatibility_payload(raw_records)
    except Exception as exc:
        warnings.append(f"api data fetch failed, fell back to table endpoint: {exc}")
        table_records = fetch_table_records(public_base)
        compatibility_payload = [table_record_to_compatibility_record(record) for record in table_records]
        warnings.append(f"table fallback loaded {len(table_records)} records")

    if not table_records:
        try:
            table_records = fetch_table_records(public_base)
        except Exception as exc:
            warnings.append(f"table data fetch failed, normalized compatibility payload instead: {exc}")
            table_records = normalize_records(
                compatibility_payload,
                build_utc=build_utc,
                observed_at=format_utc_timestamp(build_utc),
                previous_records=previous_records,
            )
    (
        compatibility_payload,
        table_records,
        retained_existing_snapshot,
    ) = retain_existing_snapshot_if_upstream_empty(compatibility_payload, table_records, warnings)
    if retained_existing_snapshot:
        records = normalize_records(
            table_records,
            build_utc=build_utc,
            observed_at="",
            previous_records=previous_records,
        )
        quality_report = {
            "gate_passed": False,
            "checks": [
                {"id": "upstream_nonzero", "status": "fail", "value": 0, "threshold": "> 0"},
            ],
            "upstream_record_count": 0,
            "accepted_record_count": len(records),
            "quarantined_record_count": 0,
            "quarantined": [],
        }
        ingest_accepted = False
    else:
        normalized_records = normalize_records(
            table_records,
            build_utc=build_utc,
            observed_at=format_utc_timestamp(build_utc),
            previous_records=previous_records,
        )
        accepted_records, quality_report = quality_gate_records(
            normalized_records,
            upstream_count=len(table_records),
            previous_count=len(previous_records),
        )
        if quality_report["gate_passed"]:
            records = accepted_records
            ingest_accepted = True
        else:
            warnings.append("upstream payload failed quality gates; retained the last-known-good snapshot")
            records = normalize_records(
                previous_records,
                build_utc=build_utc,
                observed_at="",
                previous_records=previous_records,
            )
            retained_existing_snapshot = True
            ingest_accepted = False

    if retained_existing_snapshot:
        overview = read_json(DATA_DIR / "overview.json", dict)
    else:
        try:
            overview = fetch_json(public_base, "/api/data/overview/")
        except Exception as exc:
            warnings.append(f"overview fetch failed; rebuilt it from public records: {exc}")
            overview = build_overview_payload(records)
    overview = complete_overview_payload(overview, records, warnings)

    if retained_existing_snapshot:
        map_payload = read_json(DATA_DIR / "map.json", list)
        if not map_payload:
            map_payload = build_map_payload(records)
    else:
        try:
            map_payload = fetch_json(public_base, "/api/data/map/")
            if not isinstance(map_payload, list) or (records and not map_payload):
                map_payload = build_map_payload(records)
        except Exception:
            map_payload = build_map_payload(records)

    if retained_existing_snapshot:
        epietl_payload = read_json(DATA_DIR / "epietl_public.json", dict)
        if not epietl_payload:
            epietl_payload = empty_epietl_payload()
    else:
        try:
            epietl_payload = fetch_json(public_base, "/api/data/epietl/")
            if not isinstance(epietl_payload, dict):
                epietl_payload = empty_epietl_payload()
        except Exception:
            epietl_payload = empty_epietl_payload()

    # The upstream weekly CSV may contain full third-party article text. Rebuild the
    # compatibility CSV exclusively from normalized public fields instead of embedding it.
    weekly_embedded = False

    status = build_status_payload(
        build_utc,
        records,
        warnings,
        retained_existing_snapshot,
        ingest_accepted,
        previous_meta,
        quality_report,
        bootstrap_last_success=resolve_bootstrap_last_success(previous_meta),
    )
    write_public_artifacts(
        records,
        compatibility_payload,
        epietl_payload,
        weekly_embedded,
        build_utc,
        public_site_url,
        quality_report,
        status,
    )

    print(
        f"Updated public data snapshot: records={len(records)} "
        f"map_points={len(build_map_payload(records))} status={status['source_status']}"
    )


if __name__ == "__main__":
    main()
