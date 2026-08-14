# EPIC Methodology

## Scope

EPIC transforms publicly accessible infectious-disease signals into event-level monitoring summaries for research and exploratory analysis. It does not claim complete global coverage and is not an official public-health alerting system.

## Time Semantics

EPIC keeps the following concepts separate:

| Field | Meaning |
| --- | --- |
| `event_start_date` | Earliest date attributed to the event itself |
| `event_end_date` | Latest date in the event window |
| `reporting_period_start` | Start of an aggregate reporting period |
| `reporting_period_end` | End of an aggregate reporting period |
| `published_at` | Date the source was published or extracted |
| `first_seen_at` | Timestamp EPIC first observed a signal |
| `updated_at` | Timestamp the EPIC representation changed |
| `build_generated_at` | Static artifact build time |
| `data_as_of` | Latest validated data date in the active snapshot |

Dates later than the build date plus a one-day tolerance are never used for sorting or `data_as_of`. If semantic context supplies a valid date, the raw future date is retained only as `date_raw` with a `future_original_date` quality flag.

## Disease Normalization

Raw disease labels are mapped to a stable `disease_id`, Chinese and English display names, and, where available, a subtype and pathogen. Multi-disease statistical bulletins remain aggregates (`disease_is_aggregate: true`) and are never represented as a single-disease event.

The raw label remains in `disease_raw` for auditability. Alias rules are deterministic and tested.

## Event Identity

- `signal_id` identifies a source signal using source URL, normalized disease and location.
- `event_id` is the stable public permalink identifier.
- `cluster_id` groups related disease/location/month signals for downstream review.
- `revision` increments when normalized content changes.

Identity never depends on the mutable summary text.

## Scale Semantics

Natural-language scale values are preserved in `scale_raw` and, when possible, split into `cases`, `deaths`, and `hospitalizations`. `period_type` labels cumulative, weekly, daily, event-specific, or unspecified values. Analyses must not aggregate counts across incompatible period types.

## Source Provenance

Each record includes the original link, source organization, source type, and a coarse source tier. Tiering supports research workflows; it is not a truth score. Public records contain only a short EPIC summary and structured facts, and exclude third-party full text.

## Quality Gates

A candidate ingest is rejected or degraded when any hard gate fails:

- upstream returns zero records;
- record count drops below 50% of the previous snapshot when the baseline is meaningful;
- fewer than half the normalized records retain a valid date.

Soft checks report future-date corrections, missing source URLs, invalid coordinates, duplicate signals and unclassified diseases. Records without a valid date are quarantined.

When the ingest is rejected, the build retains the last-known-good snapshot, marks `source_status` as `degraded`, does not update `data_as_of`, and exposes warnings in the manifest.

## Data Quality Score

The current score starts at 100 and subtracts deterministic penalties for quality flags and lower source tiers. It expresses record completeness and extraction confidence only. It is not a measure of outbreak severity, source truthfulness or public-health risk.

## EpiETL Risk Summary

EpiETL content is displayed as a research-oriented ranking. Its scores must not be interpreted as formal alert levels. Any operational use requires a public scoring specification, evaluation metrics, calibration, versioning and domain review.

## Verification

`tools/validate_release.py` validates schema conformance, unique IDs, the absence of future sort dates, source URLs, public-text minimization, event pages, checksums, RSS XML, and sitemap XML. Unit tests cover date semantics, disease aliases, scale parsing, stable identity, RSS selection, and snapshot-status separation.
