# EPIC Data Dictionary — Schema v1

The canonical contract is `data/v1/schema.json`. In versioned data, empty or unknown values use JSON `null` where the schema permits it.

| Field | Type | Meaning |
| --- | --- | --- |
| `schema_version` | string | Contract version (`1.0.0`) |
| `event_id` | string | Stable public event permalink ID |
| `signal_id` | string | Stable source-signal ID |
| `cluster_id` | string | Candidate group of related signals |
| `revision` | integer | Normalized record revision |
| `date_raw` | string | Original date field before correction |
| `event_start_date` | date/null | Event window start |
| `event_end_date` | date/null | Event window end |
| `reporting_period_start` | date/null | Aggregate reporting-period start |
| `reporting_period_end` | date/null | Aggregate reporting-period end |
| `published_at` | date/null | Source publication or extraction date |
| `first_seen_at` | timestamp/null | First EPIC observation time |
| `updated_at` | timestamp/null | Last normalized revision time |
| `seen_at_status` | string | Availability status for the observation time |
| `disease_id` | string | Stable normalized disease identifier |
| `disease_name_zh` | string | Normalized Chinese disease name |
| `disease_name_en` | string | Normalized English disease name |
| `disease_raw` | string | Original disease label |
| `disease_is_aggregate` | boolean | Whether the record covers multiple diseases |
| `subtype` | string/null | Disease or pathogen subtype |
| `pathogen` | string/null | Normalized pathogen name |
| `location` | string | Human-readable place label |
| `continent` | string | Coarse continent classification |
| `longitude`, `latitude` | number | Approximate point shown on the public map |
| `scale_raw` | string | Unstructured source scale description |
| `cases` | integer/null | Parsed case count |
| `deaths` | integer/null | Parsed death count |
| `hospitalizations` | integer/null | Parsed hospitalization count |
| `period_type` | string | `cumulative`, `weekly`, `daily`, `event`, or `unspecified` |
| `description_cn` | string | Short public Chinese summary (max 600 characters) |
| `source` | URI | Original source URL |
| `source_org` | string | Source organization |
| `source_type` | string | Coarse source class |
| `source_tier` | integer | Coarse provenance tier, 1–4 |
| `source_rights` | string | Rights/reuse reminder |
| `license` | string | License assertion for the record content |
| `attribution_required` | boolean | Attribution reminder |
| `review_status` | string | Human-review state |
| `extraction_confidence` | number | Automated extraction confidence, 0–1 |
| `data_quality_score` | integer | Completeness/extraction quality score, 0–100 |
| `quality_status` | string | `validated` or `warning` |
| `quality_flags` | array | Machine-readable quality warnings |

Geolocation audit fields may also be present. They describe resolution, confidence, and whether a coordinate is a centroid; consumers should treat them as optional.
