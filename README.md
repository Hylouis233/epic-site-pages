<div align="center">

![EPIC public event intelligence poster](assets/epic/poster.jpg)

# EPIC

**Turn scattered outbreak signals into traceable, machine-readable event data.**

[Live dashboard](https://hylouis233.github.io/epic-site-pages/) · [Versioned data](https://hylouis233.github.io/epic-site-pages/data/v1/records.json) · [RSS](https://hylouis233.github.io/epic-site-pages/rss.xml) · [Methodology](METHODOLOGY.md) · [Limitations](LIMITATIONS.md)

</div>

EPIC is public-source infectious-disease event intelligence infrastructure for public-health monitoring and early-warning research. It brings together health-agency notices, ProMED, RSS feeds, and open reporting, then publishes normalized records with stable identifiers, provenance, explicit freshness, and quality status.

The website and documentation are English-first. A persistent **中文** switch in the interface restores the Chinese view.

> [!IMPORTANT]
> EPIC is not complete global disease coverage, a validated official warning system, or medical advice. Record counts describe the current public snapshot—not disease burden. Always verify the linked original source.

## Three access paths

- **Human-readable dashboard** — search, filters, low-precision map overview, and stable event pages.
- **Machine-readable data** — versioned JSON, NDJSON, CSV, GeoJSON, Parquet, schema, manifest, checksums, and quality report.
- **Agent-ready query skill** — query by disease, place, continent, date, source, cases, and quality.

## Data status is part of the contract

[`data/v1/manifest.json`](data/v1/manifest.json) is the authoritative status record:

- `build_generated_at` — when the public artifacts were built;
- `data_as_of` — latest validated date represented in the snapshot;
- `last_successful_ingest_at` — most recent upstream ingest accepted by the quality gate;
- `source_status` — `healthy`, `degraded`, `stale`, or `failed`;
- `staleness_hours` — time since the last accepted ingest;
- `warnings` — build and upstream warnings;
- `quality_gate` — whether this refresh passed and accepted upstream data.

Build time is never presented as data time. An empty, unavailable, or anomalously small upstream response retains the last-known-good snapshot and makes the scheduled GitHub Actions refresh fail visibly instead of reporting false success.

## Quick examples

### Shell

```bash
curl -s https://hylouis233.github.io/epic-site-pages/data/v1/records.json \
  | jq '.[] | select(.disease_id == "dengue") | {
      event_id, location, event_start_date, cases, source
    }'
```

### Python

```python
import requests

events = requests.get(
    "https://hylouis233.github.io/epic-site-pages/data/v1/records.json",
    timeout=30,
).json()

ranked = sorted(
    (
        event for event in events
        if event["disease_id"] == "dengue"
        and event["continent"] in {"Asia", "亚洲"}
    ),
    key=lambda event: event.get("cases") or -1,
    reverse=True,
)
```

### Agent query skill

```bash
python skills/epic-disease-query/scripts/query.py \
  --data data/v1/records.json \
  --manifest data/v1/manifest.json \
  --disease dengue --continent Asia \
  --sort cases:desc --format markdown
```

## Public data contract

| Artifact | Purpose |
|---|---|
| [`data/v1/records.json`](data/v1/records.json) | Complete versioned event records |
| [`data/v1/events.ndjson`](data/v1/events.ndjson) | Stream-friendly line-delimited records |
| [`data/v1/events.csv`](data/v1/events.csv) | Flat analysis table |
| [`data/v1/events.parquet`](data/v1/events.parquet) | Columnar analytics format |
| [`data/v1/events.geojson`](data/v1/events.geojson) | Low-precision spatial features |
| [`data/v1/schema.json`](data/v1/schema.json) | JSON Schema 2020-12 contract |
| [`data/v1/manifest.json`](data/v1/manifest.json) | Status, counts, formats, and checksums |
| [`data/v1/quality-report.json`](data/v1/quality-report.json) | Quality-gate results and quarantines |

Compatibility endpoints under `data/` remain available for the static dashboard.

## Identity and time semantics

Each record separates three identifiers:

- `event_id` — stable public event identity;
- `signal_id` — stable source signal identity;
- `cluster_id` — optional grouping identity.

Time fields are intentionally distinct:

- event start and end;
- reporting-period start and end;
- source publication date;
- first observation and last update;
- snapshot data-as-of and build time.

Historical rows without reliable observation time remain null rather than receiving invented timestamps.

## Quality and publication boundary

The builder checks:

- zero-record and sudden record-count drops;
- future dates and missing valid dates;
- invalid source URLs;
- missing or low-precision coordinates;
- duplicate signals;
- JSON Schema validity;
- generated-page links and artifact checksums;
- accidental inclusion of third-party full text or sensitive deployment markers.

Public records contain structured facts, a short source-language summary where available, and the original link. Full third-party source text is not republished.

## Rebuild and validate

Rebuild from the retained local snapshot:

```bash
python tools/build_public_data.py --from-existing
```

Run tests and release validation:

```bash
python -m unittest discover -s tests -v
python tools/validate_release.py
```

The scheduled workflow pulls the public snapshot from `https://epicdemic.hylouis.top/`, the VPS endpoint backed by the private EPIC pipeline, and refreshes once daily. It may also be triggered manually. A scheduled refresh additionally runs:

```bash
python tools/validate_release.py --require-fresh-ingest
```

That strict mode accepts only a healthy, quality-gated upstream ingest. Failure diagnostics are uploaded without replacing the published last-known-good snapshot.

## Poster workflow

The repository hero is a reproducible poster rather than a browser screenshot:

- source layout: [`poster/index.html`](poster/index.html);
- generated map texture: [`assets/epic/poster-atlas.webp`](assets/epic/poster-atlas.webp);
- README asset: [`assets/epic/poster.jpg`](assets/epic/poster.jpg), rendered at 2400 × 1260.

Render the poster and its 1200 × 630 social card after installing the pinned dependencies, Playwright Chromium, and Pillow:

```bash
python -m pip install --require-hashes -r requirements-poster.txt
python -m playwright install chromium
python tools/render_poster.py
```

The scheduled data-refresh workflow runs the same renderer and commits the updated poster and social card with every accepted snapshot.

The poster follows the same high-level repository presentation pattern as [EpicIntel Harness](https://github.com/Hylouis233/epic-intel-harness)—poster first, project title second—while retaining EPIC's own editorial field-atlas identity.

## Documentation

- [Methodology](METHODOLOGY.md)
- [Known limitations](LIMITATIONS.md)
- [Data dictionary](DATA_DICTIONARY.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Citation metadata](CITATION.cff)

## License

This repository is publicly accessible and source-available for inspection, but it is **not open source**. No permission is granted to copy, modify, redistribute, sublicense, or create derivative works unless separately authorized. Third-party linked sources remain subject to their own terms. See [`LICENSE`](LICENSE).

## Citation

> Liu, H. (2026). *EPIC: Infectious-disease event intelligence infrastructure*. Version 1.0.0.
