# AJW Family Archive

A genealogical visualization of the Andrew Jackson White family, built for Professor Roberto Franzosi's SOC 190 course at Emory University. The app turns a small set of CSV spreadsheets into three connected views: an interactive family tree, a geo-temporal migration map, and an Ancestry-style profile page for each individual with a timeline of life events and the primary-source documents that back them.

## What you can do in it

**Family tree.** Click any person on the home page to open a side panel with the basics (dates, generation, related people, narrative facts grouped into life phases). The tree itself is a D3 force layout via the `family-chart` library, styled to read like an old paper chart instead of the library's defaults.

**Migration map.** A second tab plots every dated life event on a Deck.gl + MapLibre map, so you can watch where people lived, married, and died across the country and over time.

**Individual profile pages.** From the side panel, "View full profile" navigates to `/person/<id>`, which renders a vertical timeline modeled on Ancestry's LifeStory view. Each timeline entry has a year, a place, a short description, and (where we have it) a thumbnail of the actual record. Click a thumbnail and the image opens in an in-page lightbox you can dismiss with Esc, the close button, or a click outside.

## How the data is laid out

Everything lives in [`data/`](data/) as plain CSV. The site reads them at request time, so editing a CSV and refreshing is the whole authoring loop.

- [`Points.csv`](data/Points.csv) is the people. One row per person, with id, name, generation, birth and death years, photo URL, and a wide list of narrative sentences that get categorized into birth, family, education, occupation, etc.
- [`Links.csv`](data/Links.csv) is the relationships (spouse, parent-child) used to draw the tree.
- [`Migration.csv`](data/Migration.csv) is the timeline spine. Each row is a single dated event for one person with a county, state, lat/lng, an event type (Born, Died, Census, Marriage, Other), an optional `source_doc` filename, and a short description.

Documents go in [`public/documents/<person_id>/<filename>`](public/documents/), where `<filename>` matches the `source_doc` cell in `Migration.csv`. JPGs and PNGs render inline as thumbnails and open in the lightbox; PDFs render as a small file card and open in a new tab. If a referenced file is missing on disk, the timeline still renders the event, just without the attachment, so partial coverage is fine.

The CSV reader in [`lib/loadData.ts`](lib/loadData.ts) tries UTF-8 first and falls back to Windows-1252 if it sees the replacement character, which keeps Excel-exported spreadsheets from mangling smart quotes and en-dashes.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, framer-motion, family-chart on D3 v7, Deck.gl 9 with MapLibre and react-map-gl, and Inter from `next/font/google`. No database, no API routes, no auth. Read [`AGENTS.md`](AGENTS.md) before assuming anything about Next.js conventions; this is a recent enough version that several APIs (most notably `params` in dynamic routes) have changed.

## For non-technical users

See [`HELP.md`](../HELP.md) for step-by-step setup instructions, data editing guidance, and troubleshooting. Written for someone with no prior Node.js or command-line experience.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edits to files under `app/`, `components/`, `lib/`, or `data/` hot-reload in place.

To produce a production build:

```bash
npm run build
npm run start
```

## Where things live

```
app/
  page.tsx              home page (family tree + migration tabs)
  HomeClient.tsx        client-side state for the home page
  person/[id]/          individual profile route
    page.tsx            server component, loads timeline data
    PersonProfileClient.tsx   timeline + lightbox UI
    not-found.tsx
  layout.tsx, globals.css, icon.svg
components/
  FamilyTreeView.tsx    D3 family-chart wrapper
  DetailPanel.tsx       slide-in side panel
  DocumentAttachment.tsx, DocumentLightbox.tsx
  MigrationMapView.tsx, MigrationTimeline.tsx, MigrationStopPopup.tsx
  Tabs.tsx, ZoomControls.tsx, PersonSelector.tsx
lib/
  loadData.ts           CSV reading + timeline builder (server-only)
  convertData.ts        CSV parser, relationship inference
  personUtils.ts        shared categorize() and resolveName()
  types.ts, migrationTypes.ts
data/
  Points.csv, Links.csv, Migration.csv
public/
  documents/<person_id>/...    record images and PDFs
  photos/                      portraits
```

## Credits

Built by Thomas Benissan, Aiden, and Gabe for SOC 190, advised by Professor Roberto Franzosi, Emory University.
