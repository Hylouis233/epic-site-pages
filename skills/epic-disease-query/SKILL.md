---
name: epic-disease-query
description: Query public EPIC infectious-disease dashboard snapshots from GitHub Pages.
---

# EPIC Disease Query

Use this skill when a user asks to search recent public infectious-disease monitoring records, inspect map-ready events, or summarize disease/location/source trends from the EPIC public dashboard data.

## Data Sources

- Public records: `https://hylouis233.github.io/epic-site-pages/data/records.json`
- Public overview: `https://hylouis233.github.io/epic-site-pages/data/overview.json`
- Public map points: `https://hylouis233.github.io/epic-site-pages/data/map.json`

## Query Workflow

1. Fetch `records.json`.
2. Filter by disease, location, source organization, continent, date, or free-text keyword.
3. Return concise results with disease, location, date, source organization, source link, and summary.
4. Mention that the dataset is a public monitoring snapshot, not clinical advice.

## Helper

Run:

```bash
python skills/epic-disease-query/scripts/query.py --keyword measles --limit 10
```

Useful options:

- `--keyword`: searches disease, location, source organization, and summary
- `--disease`: exact disease substring filter
- `--continent`: exact continent substring filter
- `--limit`: maximum records to print
