# EPIC

> 将分散在卫生机构公告、ProMED、RSS 与公开报道中的疫情信号，转化为可查询、可追溯、机器可读的事件级监测数据。

**EPIC — Infectious-disease event intelligence infrastructure for public-health monitoring and early-warning research.**

[Live Dashboard](https://epicdemic.hylouis.top/) · [Explore JSON](https://epicdemic.hylouis.top/data/v1/records.json) · [Download CSV](https://epicdemic.hylouis.top/data/v1/events.csv) · [Subscribe RSS](https://epicdemic.hylouis.top/rss.xml) · [Agent Skill](./skills/epic-disease-query/)

![EPIC dashboard preview](./assets/epic/preview.png)

## Why EPIC

公开疫情信号分散在格式、语言和机构各异的来源中。EPIC 把这些信号规范为事件记录，并同时提供三个入口：

- **Human-readable Dashboard**：浏览、筛选、地图概览与独立事件详情页；
- **Machine-readable Data**：带 Schema、Manifest、质量报告和校验和的版本化数据预览；
- **AI-native Agent Skill**：按疾病、地点、洲别、日期、来源和数据质量查询。

EPIC 不是完整的全球疾病覆盖，也不是经过效能评估的正式预警系统。它是面向公共卫生监测与早期预警研究的开放来源事件情报基础设施。

## Current Data Status

构建产物中的 [`data/v1/manifest.json`](./data/v1/manifest.json) 是状态真源，明确区分：

- `build_generated_at`：页面/产物构建时间；
- `data_as_of`：当前快照中通过验证的数据截止日期；
- `last_successful_ingest_at`：最近一次通过采集闸门的时间；
- `source_status`：`healthy` / `degraded` / `stale` / `failed`；
- `staleness_hours`：距最近成功采集的小时数；
- `warnings`：本次构建警告。

当前仓库快照处于 **degraded** 状态：上游未返回新记录，页面继续提供 last-known-good 快照；构建时间不会被冒充为数据时间。

## Try It in 30 Seconds

### curl + jq

```bash
curl -s https://epicdemic.hylouis.top/data/v1/records.json \
  | jq '.[] | select(.disease_id == "dengue") | {event_id, location, event_start_date, cases, source}'
```

### Python

```python
import requests

events = requests.get(
    "https://epicdemic.hylouis.top/data/v1/records.json",
    timeout=30,
).json()

asia_dengue = [
    event for event in events
    if event["disease_id"] == "dengue" and event["continent"] == "亚洲"
]
```

### R

```r
events <- jsonlite::fromJSON(
  "https://epicdemic.hylouis.top/data/v1/records.json"
)
subset(events, disease_id == "dengue" & continent == "亚洲")
```

### Agent query

```bash
python skills/epic-disease-query/scripts/query.py \
  --disease dengue --continent 亚洲 --sort cases:desc --format markdown
```

## Data Products

| Endpoint | Purpose |
| --- | --- |
| `data/v1/records.json` | Full event records |
| `data/v1/events.ndjson` | Streaming / CLI workflows |
| `data/v1/events.csv` | Flat analytical table |
| `data/v1/events.parquet` | Columnar analytics |
| `data/v1/events.geojson` | GIS-ready points |
| `data/v1/schema.json` | JSON Schema 2020-12 contract |
| `data/v1/manifest.json` | Status, counts, formats and checksums |
| `data/v1/quality-report.json` | Build quality-gate results |

Compatibility endpoints such as `data/records.json`, `data/map.json`, and `data/overview.json` remain available for the static dashboard.

See [`DATA_DICTIONARY.md`](./DATA_DICTIONARY.md) for field semantics and nullability.

## Data Model and Provenance

Each record distinguishes event, signal, and cluster identity:

```json
{
  "event_id": "evt_...",
  "signal_id": "sig_...",
  "cluster_id": "cluster_...",
  "revision": 1,
  "event_start_date": "2026-06-22",
  "event_end_date": "2026-06-28",
  "reporting_period_start": "2025-12-29",
  "reporting_period_end": "2026-06-28",
  "published_at": "2026-07-02",
  "first_seen_at": null,
  "seen_at_status": "unavailable_for_legacy_snapshot"
}
```

Public records retain structured facts, a short summary and the original source link. Long third-party source text is not republished in the public snapshot. Fields such as `source_rights`, `license`, and `attribution_required` describe reuse constraints without overriding the source publisher’s terms.

## Methodology and Quality Controls

The build pipeline applies:

- future-date detection and semantic date extraction;
- disease alias normalization and aggregate-report labeling;
- cases, deaths and hospitalizations extraction without mixing period types;
- source type and source-tier classification;
- duplicate signal removal and stable identifiers;
- record-count anomaly detection and last-known-good retention;
- JSON Schema validation, checksums, RSS and sitemap validation;
- public-text minimization and source-rights notices.

Read [`METHODOLOGY.md`](./METHODOLOGY.md) and the current [`quality-report.json`](./data/v1/quality-report.json).

## Limitations

- Source coverage is incomplete and can be geographically or linguistically biased.
- Automated extraction, disease normalization, deduplication and geolocation may be wrong.
- Coordinates may represent country or administrative centroids rather than outbreak sites.
- Historical records may lack reliable `first_seen_at`; they are explicitly marked rather than backfilled with invented timestamps.
- EpiETL scores are research-oriented rankings, not official risk levels.
- The public snapshot is not clinical advice and must be verified against original sources.

See [`LIMITATIONS.md`](./LIMITATIONS.md) for details.

## Local Development

Rebuild all derived artifacts from the retained local snapshot:

```bash
python tools/build_public_data.py --from-existing
```

Run tests and release validation:

```bash
python -m unittest discover -s tests -v
python tools/validate_release.py
```

Serve the site locally:

```bash
python -m http.server 8000
```

The scheduled workflow requires `EPIC_PUBLIC_SOURCE_BASE_URL`; the value is never stored in this repository.
Scheduled refreshes must accept a fresh upstream snapshot and pass the public quality gate. If the upstream API is unavailable, empty, or anomalously small, the published last-known-good snapshot remains online while the GitHub Actions run fails and uploads diagnostics instead of reporting a false-success update.

## Repository Status and License

This is a **publicly accessible demonstration and data preview**. It is source-available for viewing, **not open source**. No permission is granted to copy, modify, redistribute, mirror, scrape, translate or create derivative works unless separately authorized in writing.

Third-party sources remain subject to their own terms. Read [`LICENSE`](./LICENSE) before using any repository content.

## Citation

GitHub can expose a “Cite this repository” action from [`CITATION.cff`](./CITATION.cff). A suggested citation is:

> Liu, H. (2026). EPIC: Infectious-disease event intelligence infrastructure for public-health monitoring and early-warning research. Version 1.0.0.

## Roadmap

- Measure timeliness, signal discovery rate, false-positive rate and deduplication accuracy.
- Add documented human-review states and cross-validation evidence.
- Publish disease-, country- and source-level static landing pages.
- Separate source code, deployment artifacts and versioned data releases.
- Add a formally licensed reuse path only after rights review and an explicit owner decision.

## Security and Feedback

Report security issues through [`SECURITY.md`](./SECURITY.md). For data corrections, use the data-correction issue template and include the event ID and original source evidence.
