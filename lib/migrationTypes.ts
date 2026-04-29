export interface MigrationWaypoint {
  personId: string;
  year: number;
  county: string;
  state: string;
  coords: [number, number]; // [longitude, latitude]
  event: "Born" | "Died" | "Census" | "Marriage" | "Other";
  sourceDoc: string | null;
  details: string;
}

export interface PersonMigration {
  personId: string;
  personName: string; // looked up from family tree data
  waypoints: MigrationWaypoint[];
}

export type TimelineEventKind =
  | "Born"
  | "Died"
  | "Census"
  | "Marriage"
  | "Residence"
  | "Military"
  | "Education"
  | "Other";

export interface TimelineEntry {
  year: number;
  event: TimelineEventKind;
  location: string | null;
  details: string;
  documentPath: string | null;
  documentKind: "pdf" | "image" | null;
  documentFilename: string | null;
  source: "migration" | "narrative";
}
