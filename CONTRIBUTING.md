# Contributing

This repository is proprietary and does not grant a general right to modify or redistribute the work. The maintainer may nevertheless review narrowly scoped reports or proposed patches submitted through GitHub.

## Data Corrections

Include the EPIC `event_id`, the field believed to be incorrect, a link to authoritative evidence, and the proposed correction. Do not paste full third-party articles.

## Code Changes

Before proposing a patch:

```bash
python tools/build_public_data.py --from-existing
python -m unittest discover -s tests -v
python tools/validate_release.py
```

Keep generated-data changes reproducible through `tools/build_public_data.py`; do not hand-edit generated event pages or v1 data files.
