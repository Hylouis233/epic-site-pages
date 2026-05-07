# EPIC Public Dashboard

This repository publishes a static infectious-disease monitoring dashboard and public JSON snapshots.

## What Is Included

- `index.html`: static dashboard shell for web deployment
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

The current public site intentionally excludes payment links, QR codes, wallet addresses, funding pages, ad slots, forums, user posting, diagnosis, treatment, and transaction workflows.

## Refresh

The scheduled workflow refreshes public data from a repository secret named `EPIC_PUBLIC_SOURCE_BASE_URL`. The value is not stored in the repository.

## License

Proprietary. All rights reserved. See `LICENSE`.
