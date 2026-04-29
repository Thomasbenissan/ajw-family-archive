"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import DocumentAttachment from "@/components/DocumentAttachment";
import { resolveName } from "@/lib/personUtils";
import type { FamilyChartDatum } from "@/lib/types";
import type { TimelineEntry, TimelineEventKind } from "@/lib/migrationTypes";

interface PersonProfileClientProps {
  person: FamilyChartDatum;
  allPeople: FamilyChartDatum[];
  timeline: TimelineEntry[];
  undatedFacts: string[];
}

const generationLabels: Record<number, string> = {
  1: "1st Generation",
  2: "2nd Generation",
  3: "3rd Generation",
  4: "4th Generation",
  5: "5th Generation",
  6: "6th Generation",
};

const eventLabels: Record<TimelineEventKind, string> = {
  Born: "Born",
  Died: "Died",
  Census: "Census record",
  Marriage: "Marriage",
  Residence: "Residence",
  Military: "Military service",
  Education: "Education",
  Other: "Life event",
};

function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return f + l || f || "?";
}

function formatLifespan(born: string, died: string): string {
  if (born && died) return `${born}–${died}`;
  if (born) return `b. ${born}`;
  if (died) return `d. ${died}`;
  return "Dates unknown";
}

function buildSummary(
  person: FamilyChartDatum,
  timeline: TimelineEntry[]
): string {
  const fullName = `${person.data["first name"]} ${person.data["last name"]}`.trim();
  const birth = timeline.find((e) => e.event === "Born");
  const death = timeline.find((e) => e.event === "Died");

  const parts: string[] = [];
  if (birth) {
    parts.push(
      `${fullName} was born in ${birth.location ?? "an unknown location"} in ${birth.year}`
    );
  } else if (person.data.birthday) {
    parts.push(`${fullName} was born in ${person.data.birthday}`);
  } else {
    parts.push(fullName);
  }
  if (death) {
    parts.push(
      `and died in ${death.location ?? "an unknown location"} in ${death.year}`
    );
  } else if (person.data.death) {
    parts.push(`and died in ${person.data.death}`);
  }
  return parts.join(" ") + ".";
}

export default function PersonProfileClient({
  person,
  allPeople,
  timeline,
  undatedFacts,
}: PersonProfileClientProps) {
  const fullName = `${person.data["first name"]} ${person.data["last name"]}`.trim();
  const lifespan = formatLifespan(person.data.birthday, person.data.death);
  const generation =
    generationLabels[person.data.generation] ||
    `Generation ${person.data.generation}`;
  const summary = buildSummary(person, timeline);
  const avatarBg = person.data.gender === "F" ? "#b8917a" : "#7c9a92";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f2ee",
        fontFamily: "'Inter', sans-serif",
        color: "#2c2c2c",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #e8e3dd",
          backgroundColor: "#faf9f7",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 13,
            color: "#8a8279",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Back to family tree
        </Link>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 36 }}>
          {person.data["photo url"] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={person.data["photo url"]}
              alt={fullName}
              style={{
                width: 112,
                height: 112,
                borderRadius: "50%",
                objectFit: "cover",
                margin: "0 auto 16px",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: "50%",
                backgroundColor: avatarBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <span
                style={{
                  color: "#ffffff",
                  fontSize: 36,
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                {getInitials(person.data["first name"], person.data["last name"])}
              </span>
            </div>
          )}
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#2c2c2c",
              margin: "0 0 6px",
              lineHeight: 1.2,
            }}
          >
            {fullName}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#8a8279",
              margin: "0 0 4px",
            }}
          >
            {lifespan} · {generation}
          </p>
          <p
            style={{
              fontSize: 15,
              color: "#3d3832",
              maxWidth: 520,
              margin: "16px auto 0",
              lineHeight: 1.55,
            }}
          >
            {summary}
          </p>
        </header>

        {/* Timeline */}
        <SectionHeader>Timeline</SectionHeader>
        {timeline.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#a39e96",
              fontStyle: "italic",
              marginBottom: 32,
            }}
          >
            No dated events recorded for this person yet.
          </p>
        ) : (
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 40px",
              position: "relative",
            }}
          >
            {timeline.map((entry, i) => (
              <TimelineRow
                key={`${entry.year}-${entry.event}-${i}`}
                entry={entry}
              />
            ))}
          </ol>
        )}

        {/* Undated narrative facts */}
        {undatedFacts.length > 0 && (
          <>
            <SectionHeader>Life notes</SectionHeader>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: "0 0 40px",
              }}
            >
              {undatedFacts.map((fact, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 14,
                    color: "#3d3832",
                    lineHeight: 1.6,
                    marginBottom: 10,
                    paddingLeft: 14,
                    position: "relative",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "0.6em",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      backgroundColor: "#c4bfb8",
                    }}
                  />
                  {fact}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Related People */}
        <SectionHeader>Related People</SectionHeader>
        {person.rels.parents.length === 0 &&
        person.rels.spouses.length === 0 &&
        person.rels.children.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#a39e96",
              fontStyle: "italic",
            }}
          >
            No linked relatives in this dataset.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {person.rels.parents.length > 0 && (
              <RelGroup
                label="Parents"
                ids={person.rels.parents}
                allPeople={allPeople}
              />
            )}
            {person.rels.spouses.length > 0 && (
              <RelGroup
                label={person.rels.spouses.length > 1 ? "Spouses" : "Spouse"}
                ids={person.rels.spouses}
                allPeople={allPeople}
              />
            )}
            {person.rels.children.length > 0 && (
              <RelGroup
                label="Children"
                ids={person.rels.children}
                allPeople={allPeople}
              />
            )}
          </div>
        )}
      </motion.main>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#a39e96",
        textTransform: "uppercase",
        letterSpacing: "0.8px",
        marginBottom: 16,
        marginTop: 0,
      }}
    >
      {children}
    </h2>
  );
}

function TimelineRow({ entry }: { entry: TimelineEntry }) {
  return (
    <li
      style={{
        display: "grid",
        gridTemplateColumns: "72px 1fr",
        columnGap: 20,
        position: "relative",
        paddingBottom: 24,
      }}
    >
      {/* Year + rail */}
      <div
        style={{
          position: "relative",
          textAlign: "right",
          paddingTop: 14,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "#8a8279",
            fontWeight: 500,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {entry.year}
        </span>
      </div>

      {/* Vertical rail (drawn in the gutter, between year and card) */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 80,
          top: 18,
          bottom: 0,
          width: 1,
          backgroundColor: "#e8e3dd",
        }}
      />
      {/* Marker */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 76,
          top: 20,
          width: 9,
          height: 9,
          borderRadius: "50%",
          backgroundColor: entry.source === "migration" ? "#7c9a92" : "#c4bfb8",
          border: "2px solid #faf9f7",
        }}
      />

      {/* Card */}
      <div
        style={{
          marginLeft: 12,
          backgroundColor: "#faf9f7",
          border: "1px solid #e8e3dd",
          borderRadius: 8,
          padding: "14px 16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#3d3832",
            marginBottom: 2,
          }}
        >
          {eventLabels[entry.event]}
        </div>
        {entry.location && (
          <div
            style={{
              fontSize: 12,
              color: "#8a8279",
              marginBottom: 6,
            }}
          >
            {entry.location}
          </div>
        )}
        <div
          style={{
            fontSize: 13,
            color: "#3d3832",
            lineHeight: 1.55,
          }}
        >
          {entry.details}
        </div>
        {entry.documentPath && entry.documentKind && entry.documentFilename && (
          <DocumentAttachment
            path={entry.documentPath}
            kind={entry.documentKind}
            filename={entry.documentFilename}
          />
        )}
      </div>
    </li>
  );
}

function RelGroup({
  label,
  ids,
  allPeople,
}: {
  label: string;
  ids: string[];
  allPeople: FamilyChartDatum[];
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          color: "#a39e96",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ids.map((id) => {
          const exists = allPeople.some((p) => p.id === id);
          const name = resolveName(id, allPeople);
          if (!exists) {
            return (
              <span
                key={id}
                style={{
                  fontSize: 13,
                  color: "#8a8279",
                  padding: "6px 12px",
                  borderRadius: 6,
                  backgroundColor: "#f5f2ee",
                  border: "1px solid #e8e3dd",
                }}
              >
                {name}
              </span>
            );
          }
          return (
            <Link
              key={id}
              href={`/person/${id}`}
              style={{
                fontSize: 13,
                color: "#3d3832",
                padding: "6px 12px",
                borderRadius: 6,
                backgroundColor: "#faf9f7",
                border: "1px solid #e8e3dd",
                textDecoration: "none",
              }}
            >
              {name} →
            </Link>
          );
        })}
      </div>
    </div>
  );
}
