import type { FamilyChartDatum } from "./types";

export type Category =
  | "Birth"
  | "Family"
  | "Education"
  | "Marriage"
  | "Residences"
  | "Occupation"
  | "Records"
  | "Death"
  | "Lifespan"
  | "Other";

export function categorize(fact: string): Category {
  const t = fact.trim();
  const first = t.split(/\s+/)[0]?.toLowerCase() ?? "";
  const lower = t.toLowerCase();

  if (first === "his" || first === "her") return "Family";

  if (/\bwas born\b/.test(lower)) return "Birth";
  if (/\blived to the age\b/.test(lower)) return "Lifespan";
  if (
    /\b(died|was buried|\bburial\b|\bburied\b|obituary|entered probate|funeral)\b/.test(
      lower
    )
  )
    return "Death";
  if (/\b(marriage|married)\b/.test(lower)) return "Marriage";
  if (
    /\b(graduated|enrolled|attending|attended|began attending|moses brown|medical school|college|university|\bschool\b)\b/.test(
      lower
    )
  )
    return "Education";
  if (/\b(lived (in|at)|moved to|relocated|lives in|resided)\b/.test(lower))
    return "Residences";
  if (
    /\b(worked as|served as|was employed|occupation|associated with|was a physician|private secretary|practiced|traveled)\b/.test(
      lower
    )
  )
    return "Occupation";
  if (/\brecorded as\b/.test(lower)) return "Records";
  if (
    /\b(was the (son|daughter)|had (one|two|three|a|no|an) (son|daughter|child|children|sister|brother|half)|never married|no known children)\b/.test(
      lower
    )
  )
    return "Family";

  return "Other";
}

export function resolveName(id: string, allPeople: FamilyChartDatum[]): string {
  const p = allPeople.find((d) => d.id === id);
  if (!p) return id;
  return `${p.data["first name"]} ${p.data["last name"]}`.trim();
}
