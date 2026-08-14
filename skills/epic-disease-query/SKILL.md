---
name: epic-disease-query
description: Query and summarize EPIC public infectious-disease event records with source provenance, date ranges, sorting, field selection and data-status warnings. Use this skill whenever a user asks to search recent outbreak signals, compare infectious-disease events by disease or geography, inspect EPIC records, retrieve machine-readable event data, or prepare a source-linked public-health monitoring table—even if they do not explicitly mention EPIC.
compatibility: Python 3.9+ with standard library; network access unless a local --records-file is supplied.
---

# EPIC Disease Query

Use EPIC for exploratory public-health monitoring and event-intelligence research. Treat every result as a source-linked monitoring signal, not a confirmed diagnosis, complete global inventory or official risk alert.

## Query Workflow

1. Read `data/v1/manifest.json` before querying records. Surface `source_status`, `data_as_of`, `last_successful_ingest_at`, `staleness_hours` and warnings.
2. If status is `degraded`, `stale`, or `failed`, place that warning before the results. Do not describe the build timestamp as the data update time.
3. Query `data/v1/records.json` and filter only on documented Schema v1 fields.
4. Preserve `event_id`, the EPIC detail URL, original `source`, source organization, dates and quality score unless the user explicitly asks for fewer fields.
5. State that EPIC is incomplete public-source monitoring and not clinical advice.

## Helper

Run `scripts/query.py` from this skill directory or pass an explicit path.

```bash
python scripts/query.py \
  --disease dengue \
  --continent Asia \
  --from-date 2026-06-01 \
  --sort cases:desc \
  --format markdown \
  --limit 10
```

Useful options:

- `--keyword`: search normalized/raw disease, location, source organization and summary;
- `--disease`: match disease ID, Chinese/English normalized name or raw alias;
- `--location`, `--continent`, `--source-type`: narrow by geography or provenance;
- `--from-date`, `--to-date`: filter `event_start_date`, falling back to `published_at`;
- `--sort FIELD:asc|desc`: sort by cases, deaths, dates, quality score or another public scalar field;
- `--fields`: comma-separated output field selection;
- `--format markdown|json|ndjson`: output mode;
- `--deduplicate`: deduplicate by `event_id`, `signal_id` or `cluster_id`;
- `--records-file`, `--manifest-file`: deterministic local/offline query inputs;
- `--timeout`, `--retries`: network failure handling.

## Result Rules

- Keep nulls distinct from zero. “No parsed case count” does not mean zero cases.
- Do not sum values across different `period_type` values without explaining the incompatibility.
- Prefer `disease_id` for filtering; display `disease_name_zh` and retain `disease_raw` when alias context matters.
- Link to `https://epicdemic.hylouis.top/events/{event_id}/` for EPIC context and to `source` for source verification.
- If the schema version is not compatible with major version 1, stop with a clear schema error instead of guessing.
- On timeout, invalid JSON or unavailable files, return a nonzero exit code and an actionable error on stderr.

## Default Output

For natural-language answers, lead with the data-status warning, then a concise table with:

`event date | disease | location | cases | source organization | quality | EPIC event | original source`

End with the active filters, total matches before truncation, `data_as_of`, and the monitoring/medical limitation.
