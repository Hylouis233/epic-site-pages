# Changelog

## 1.2.0 — 2026-08-15

- Replaced the warm editorial poster design with a precision-instrument console: cool neutral surfaces, hairline borders, monospace tabular numerals, and a single semantic blue accent.
- Made dark the default monitoring theme while preserving the light theme toggle.
- Removed all decorative CSS art (grid overlays, stamp motifs, serif display type, drop shadows, and gradients).
- Normalised metric cards, filter fields, table rows, and map markers to instrument-grade density.
- Fixed a CSS Grid minimum-size overflow on mobile caused by intrinsic code-block width.
- Rebuilt the homepage as a compact monitoring console: status chips, quick data actions, and first-screen metrics above the fold.
- Restored a real interactive map using self-hosted Leaflet and a border-free, label-free Natural Earth land silhouette with clustered event bubbles.
- Added a linked regional index sidebar, aggregation-intensity legend, and a sovereignty-neutral basemap footnote.
- Restored symptoms, response measures, transmission, source organisation, cases, and deaths columns with compact/comfortable density switching.
- Added deterministic English rendering for the restored Chinese detail fields without leaking source text into the English surface.
- Enriched mobile event cards and the EpiETL priority-event list with severity, source, and epidemiological-week context.
- Added a browser regression gate that fails on any non-same-origin runtime request, missing land layer, missing clusters, or Chinese leakage in English detail cells.

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
