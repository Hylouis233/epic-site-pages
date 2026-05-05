# EPIC Public Dashboard

This repository publishes a static infectious-disease monitoring dashboard and public JSON snapshots for community reuse.

## What Is Included

- `index.html`: static dashboard shell for GitHub Pages
- `support/`: voluntary support, sponsor list, and ad-slot rental page
- `assets/epic/`: browser assets used by the dashboard
- `data/records.json`: normalized public event records
- `data/map.json`: map-ready public event records
- `data/overview.json`: public aggregate statistics
- `data/epietl_public.json`: public EpiETL risk snapshot
- `data/weekly_merged_latest.csv`: latest public weekly CSV when available
- `skills/epic-disease-query/`: a lightweight Codex skill for querying the public snapshots

## Data Contract

Records are public-health monitoring summaries derived from open sources. Each record may include disease, location, dates, source link, source organization, coordinates, symptoms, response measures, and a short Chinese summary.

The repository intentionally contains only public static assets and public data snapshots. Operational configuration, credentials, network settings, and internal logs are not part of this repository.

The support page may include public payment links, QR codes, and wallet addresses that are intended to be shown to visitors. It does not contain payment secrets or backend callbacks.

## Refresh

The scheduled workflow refreshes public data from a repository secret named `EPIC_PUBLIC_SOURCE_BASE_URL`. The value is not stored in the repository.

## License

AGPL-3.0. See `LICENSE`.
