import type { FamilyChartDatum, PersonData } from "./types";

// Hardcoded gender map — 25 people, accuracy > elegance
const GENDER_MAP: Record<string, "M" | "F"> = {
  andrew_j_white: "M",
  hannah_white: "F",
  anna_l_white: "F",
  sarah_a_white_tighe: "F",
  william_e_white: "M",
  nathaniel_a_tighe: "M",
  harriet_b_hill: "F",
  gladys_h_white: "F",
  vera_a_white: "F",
  j_bernice_white: "F",
  albert_e_bierma: "M",
  roy_n_patrick: "M",
  lois_v_patrick_deangelis: "F",
  lucille_m_ryan: "F",
  craig_f_ferril: "M",
  brian_k_deangelis: "M",
  jerry_deangelis: "M",
  mary_r_furlong: "F",
  laura_deangelis: "F",
  benjamin_deangelis: "M",
  samuel_deangelis: "M",
  jeremy_deangelis: "M",
  courtney_deangelis: "F",
  samantha_deangelis: "F",
  michelle_deangelis: "F",
};

interface PointRow {
  ID: string;
  Name: string;
  Generation: string;
  Born: string;
  Died: string;
  "Photo URL": string;
  Details: string[];
}

interface LinkRow {
  Source: string;
  Target: string;
  Relationship: string;
}

/**
 * CSV line parser that handles quoted fields with embedded commas and escaped
 * quotes (RFC 4180 subset). Required because the new Points.csv has long
 * narrative cells like `"Andrew Jackson White was born on April 25, 1815, …"`.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function splitCsvLines(csv: string): string[] {
  // Split on newlines, but respect quoted multi-line fields. We keep it
  // simple: assume each logical row is one physical line (which is the
  // case for our data). Filter out blank lines.
  return csv
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((l) => l.trim().length > 0);
}

/**
 * Parses Points.csv. The header has the first-class columns (ID, Name, etc.)
 * followed by many repeated "Details" columns, one per narrative fact. All
 * non-empty Details cells are collected into a single `Details: string[]`.
 */
function parsePointsCsv(csv: string): PointRow[] {
  const lines = splitCsvLines(csv);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((v) => v.trim());
    const row: PointRow = {
      ID: "",
      Name: "",
      Generation: "",
      Born: "",
      Died: "",
      "Photo URL": "",
      Details: [],
    };

    headers.forEach((h, i) => {
      const v = values[i] ?? "";
      if (h === "Details") {
        if (v) row.Details.push(v);
      } else if (h === "Gen" || h === "Generation") {
        row.Generation = v;
      } else if (h in row) {
        (row as unknown as Record<string, string>)[h] = v;
      }
    });

    return row;
  });
}

function parseLinksCsv(csv: string): LinkRow[] {
  const lines = splitCsvLines(csv);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row as unknown as LinkRow;
  });
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

/**
 * Accept only real URLs — absolute (http/https) or root-relative. Anything
 * else (e.g. the literal placeholder "URL" in the source spreadsheet) is
 * dropped so components fall back cleanly to the initials avatar.
 */
function validPhotoUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|\/)/i.test(trimmed)) return trimmed;
  return "";
}

export function convertData(
  pointsCsv: string,
  linksCsv: string
): FamilyChartDatum[] {
  const points = parsePointsCsv(pointsCsv);
  const links = parseLinksCsv(linksCsv);

  // Build relationship sets
  const spouseMap = new Map<string, Set<string>>();
  const childrenMap = new Map<string, Set<string>>();
  const parentsMap = new Map<string, Set<string>>();

  // Pass 1: build all spouse relationships first
  for (const link of links) {
    if (link.Relationship === "spouse") {
      const { Source, Target } = link;
      if (!spouseMap.has(Source)) spouseMap.set(Source, new Set());
      if (!spouseMap.has(Target)) spouseMap.set(Target, new Set());
      spouseMap.get(Source)!.add(Target);
      spouseMap.get(Target)!.add(Source);
    }
  }

  // Pass 2: build parent-child relationships, propagating to spouses
  for (const link of links) {
    if (link.Relationship === "parent-child") {
      const { Source, Target } = link;
      if (!childrenMap.has(Source)) childrenMap.set(Source, new Set());
      childrenMap.get(Source)!.add(Target);

      if (!parentsMap.has(Target)) parentsMap.set(Target, new Set());
      parentsMap.get(Target)!.add(Source);

      // Also add children to the spouse of Source
      const sourceSpouses = spouseMap.get(Source);
      if (sourceSpouses) {
        for (const spouseId of sourceSpouses) {
          if (!childrenMap.has(spouseId))
            childrenMap.set(spouseId, new Set());
          childrenMap.get(spouseId)!.add(Target);
          parentsMap.get(Target)!.add(spouseId);
        }
      }
    }
  }

  return points
    .filter((p) => p.ID)
    .map((p) => {
      const { firstName, lastName } = splitName(p.Name);
      const gender = GENDER_MAP[p.ID] || "M";

      const data: PersonData = {
        "first name": firstName,
        "last name": lastName,
        birthday: p.Born || "",
        death: p.Died || "",
        gender,
        generation: parseInt(p.Generation, 10) || 0,
        details: p.Details,
        "photo url": validPhotoUrl(p["Photo URL"] || ""),
      };

      const rels: FamilyChartDatum["rels"] = {
        spouses: [...(spouseMap.get(p.ID) || [])],
        children: [...(childrenMap.get(p.ID) || [])],
        parents: [...(parentsMap.get(p.ID) || [])],
      };

      return { id: p.ID, data, rels };
    });
}
