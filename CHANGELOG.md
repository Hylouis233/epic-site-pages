# Changelog

## 1.1.0 — 2026-08-14

- Made the dashboard, detail pages, metadata, RSS feed, documentation, and agent examples English-first.
- Added a persistent Chinese language switch while preserving English as the server-rendered default.
- Replaced the browser screenshot with a reproducible 2400 × 1260 repository poster and poster-derived social card.
- Added poster regeneration to the scheduled public-data refresh workflow.
- Added release checks that prevent regressions in the English-first surface, language switch, and poster-first README format.
- Aligned active canonical, RSS, sitemap, data, skill, and README links with the deployed GitHub Pages URL.

## 1.0.0 — 2026-08-13

- Separated build time, data cutoff and last successful ingest time.
- Added source health states, staleness, warnings and quality gates.
- Added semantic date normalization and future-date correction.
- Added normalized disease identifiers, scale fields, source classification and quality scores.
- Added stable event/signal/cluster IDs and static event detail pages.
- Added versioned JSON, NDJSON, CSV, Parquet, GeoJSON, schema, manifest, and quality-report artifacts.
- Changed RSS to select newly seen or updated records and link back to stable EPIC event pages.
- Removed long third-party source text from the public snapshot.
- Repositioned the dashboard as an event-intelligence product entry point.
- Added SEO metadata, a sitemap, robots directives, a favicon, a web manifest, methodology, limitations, a data dictionary, and citation metadata.
