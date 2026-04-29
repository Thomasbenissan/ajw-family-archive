/**
 * Server-only data loader. Reads the CSV spreadsheets in /data at request
 * time and returns parsed structures for the UI. Keep this module out of
 * any "use client" component — the `fs` import will break the client bundle.
 */

import fs from "node:fs";
import path from "node:path";
import { convertData, parseCsvLine } from "./convertData";
import { categorize } from "./personUtils";
import type { FamilyChartDatum } from "./types";
import type {
  MigrationWaypoint,
  PersonMigration,
  TimelineEntry,
  TimelineEventKind,
} from "./migrationTypes";

const DATA_DIR = path.join(process.cwd(), "data");
const DOCS_ROOT = path.join(process.cwd(), "public", "documents");

function readCsv(filename: string): string {
  // Excel exports CSVs as Windows-1252 by default. Try UTF-8 first; if the
  // result contains the U+FFFD replacement char, the file is cp1252 — re-decode.
  const buf = fs.readFileSync(path.join(DATA_DIR, filename));
  const utf8 = buf.toString("utf8");
  if (!utf8.includes("�")) return utf8;
  return new TextDecoder("windows-1252").decode(buf);
}

export function getFamilyData(): FamilyChartDatum[] {
  return convertData(readCsv("Points.csv"), readCsv("Links.csv"));
}

export function getMigrations(): PersonMigration[] {
  const waypoints = parseWaypointsCsv(readCsv("Migration.csv"));
  const familyData = getFamilyData();

  const grouped = new Map<string, MigrationWaypoint[]>();
  for (const wp of waypoints) {
    if (!grouped.has(wp.personId)) grouped.set(wp.personId, []);
    grouped.get(wp.personId)!.push(wp);
  }

  const migrations: PersonMigration[] = [];
  for (const [personId, wps] of grouped) {
    wps.sort((a, b) => a.year - b.year);
    migrations.push({
      personId,
      personName: lookupName(personId, familyData),
      waypoints: wps,
    });
  }
  return migrations;
}

export function getPersonTimeline(personId: string): TimelineEntry[] {
  const waypoints = parseWaypointsCsv(readCsv("Migration.csv")).filter(
    (wp) => wp.personId === personId
  );
  const family = getFamilyData();
  const person = family.find((p) => p.id === personId);

  const entries: TimelineEntry[] = [];

  for (const wp of waypoints) {
    const location = [wp.county, wp.state].filter(Boolean).join(", ") || null;
    const { path: docPath, kind: docKind, filename } = resolveDocument(
      personId,
      wp.sourceDoc
    );
    entries.push({
      year: wp.year,
      event: mapMigrationEvent(wp.event),
      location,
      details: wp.details || `${wp.event} in ${location ?? "unknown location"}`,
      documentPath: docPath,
      documentKind: docKind,
      documentFilename: filename,
      source: "migration",
    });
  }

  if (person) {
    for (const fact of person.data.details) {
      const clean = fact.trim();
      if (!clean) continue;
      const yearMatch = clean.match(/\b(1[6-9]\d{2}|20\d{2})\b/);
      if (!yearMatch) continue;
      const year = parseInt(yearMatch[1], 10);
      const event = narrativeToEvent(clean);
      if (isDuplicateOfMigration(entries, year, event)) continue;
      entries.push({
        year,
        event,
        location: null,
        details: clean,
        documentPath: null,
        documentKind: null,
        documentFilename: null,
        source: "narrative",
      });
    }
  }

  entries.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    // Within a year, migration (structured) rows come first
    if (a.source !== b.source) return a.source === "migration" ? -1 : 1;
    return 0;
  });

  return entries;
}

export function getUndatedFacts(personId: string): string[] {
  const family = getFamilyData();
  const person = family.find((p) => p.id === personId);
  if (!person) return [];
  return person.data.details
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && !/\b(1[6-9]\d{2}|20\d{2})\b/.test(f));
}

function parseWaypointsCsv(csv: string): MigrationWaypoint[] {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const validEvents: MigrationWaypoint["event"][] = [
    "Born",
    "Died",
    "Census",
    "Marriage",
    "Other",
  ];

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    const event = row.event as MigrationWaypoint["event"];
    return {
      personId: row.person_id,
      year: parseInt(row.year, 10),
      county: row.county,
      state: row.state,
      coords: [parseFloat(row.longitude), parseFloat(row.latitude)],
      event: validEvents.includes(event) ? event : "Other",
      sourceDoc: row.source_doc || null,
      details: row.details || "",
    };
  });
}

function lookupName(personId: string, familyData: FamilyChartDatum[]): string {
  const person = familyData.find((p) => p.id === personId);
  if (!person) return personId;
  return `${person.data["first name"]} ${person.data["last name"]}`.trim();
}

function mapMigrationEvent(event: MigrationWaypoint["event"]): TimelineEventKind {
  switch (event) {
    case "Born":
    case "Died":
    case "Census":
    case "Marriage":
      return event;
    case "Other":
    default:
      return "Other";
  }
}

function narrativeToEvent(fact: string): TimelineEventKind {
  const category = categorize(fact);
  switch (category) {
    case "Birth":
      return "Born";
    case "Death":
      return "Died";
    case "Marriage":
      return "Marriage";
    case "Residences":
      return "Residence";
    case "Education":
      return "Education";
    default:
      // Military mention via occupation / narrative
      if (/\b(military|served in the|army|navy|confederate|union)\b/i.test(fact)) {
        return "Military";
      }
      return "Other";
  }
}

function isDuplicateOfMigration(
  entries: TimelineEntry[],
  year: number,
  event: TimelineEventKind
): boolean {
  return entries.some(
    (e) => e.source === "migration" && e.year === year && e.event === event
  );
}

function resolveDocument(
  personId: string,
  sourceDoc: string | null
): { path: string | null; kind: "pdf" | "image" | null; filename: string | null } {
  if (!sourceDoc) return { path: null, kind: null, filename: null };
  const filename = sourceDoc.trim();
  if (!filename) return { path: null, kind: null, filename: null };

  const absPath = path.join(DOCS_ROOT, personId, filename);
  if (!fs.existsSync(absPath)) {
    return { path: null, kind: null, filename };
  }

  const ext = path.extname(filename).toLowerCase();
  let kind: "pdf" | "image" | null = null;
  if (ext === ".pdf") kind = "pdf";
  else if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) kind = "image";
  else return { path: null, kind: null, filename };

  return {
    path: `/documents/${encodeURIComponent(personId)}/${encodeURIComponent(filename)}`,
    kind,
    filename,
  };
}
