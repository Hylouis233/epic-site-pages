# EPIC Limitations

EPIC is an experimental, OSINT-style monitoring dataset preview. Use it with the following limitations in mind.

## Coverage

- Sources are selected and may omit countries, languages, agencies and local reporting channels.
- Record counts cannot be interpreted as disease incidence or global burden.
- A missing event means “not present in this snapshot,” not “did not occur.”

## Timeliness

- Ingestion can fail or become stale. Always inspect `data/v1/manifest.json`.
- `build_generated_at` only shows when static assets were built.
- Historical records may lack reliable `first_seen_at`; EPIC returns `null` and `seen_at_status: unavailable_for_legacy_snapshot` instead of inventing timestamps.

## Extraction and Normalization

- Automatically extracted dates, diseases, counts, locations, and summaries may be wrong.
- Aggregate bulletins may cover many diseases and periods; they are labeled as aggregate records.
- Count fields can mix cumulative and incident values unless `period_type` is respected.
- Duplicate detection is deterministic but may over-merge or under-merge signals.

## Geography

- Coordinates may be approximate administrative or country centroids.
- Map points are for overview only and should not guide field operations.
- No guarantee is made about coordinate system conversion or street-level precision.

## Sources and Rights

- Public availability of a link does not imply permission to reproduce its content.
- EPIC removes long third-party text from public records, but users must still follow each source’s terms.
- This repository is publicly accessible but proprietary; it is not open source and does not currently grant data reuse rights.

## Risk and Health Decisions

- EpiETL scores are research rankings, not official risk assessments.
- EPIC has not published validated sensitivity, specificity, false-positive rate, lead time or coverage benchmarks.
- The project does not provide diagnosis, treatment, clinical guidance or emergency response advice.

Verify every material claim against the linked primary source and the relevant public-health authority.
