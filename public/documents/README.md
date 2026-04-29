# Documents

Drop genealogical records (PDFs, images) here, organized by person.

## Naming convention

```
public/documents/<person_id>/<source_doc>
```

- `<person_id>` matches the `person_id` column in `data/Migration.csv` (e.g. `andrew_j_white`).
- `<source_doc>` matches the `source_doc` column on the same row (e.g. `1850_census.pdf`).

Example:

```
public/documents/andrew_j_white/1850_census.pdf
public/documents/andrew_j_white/1860_census.pdf
public/documents/sarah_a_white_tighe/marriage_tighe.pdf
```

## Supported types

- `.pdf` — opens in a new tab on click
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` — shown inline as a thumbnail; click to open full-size

Files referenced in `Migration.csv` but not present on disk are silently skipped — the timeline entry still renders, just without an attachment card.
