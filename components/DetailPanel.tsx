"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { FamilyChartDatum } from "@/lib/types";
import { categorize, resolveName, type Category } from "@/lib/personUtils";

interface DetailPanelProps {
  person: FamilyChartDatum | null;
  allPeople: FamilyChartDatum[];
  onClose: () => void;
}

function getInitials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return f + l || f || "?";
}

function formatDates(born: string, died: string): string {
  if (born && died) return `${born}\u2013${died}`;
  if (born) return `b. ${born}`;
  return "Dates unknown";
}

const generationLabels: Record<number, string> = {
  1: "1st Generation",
  2: "2nd Generation",
  3: "3rd Generation",
  4: "4th Generation",
  5: "5th Generation",
  6: "6th Generation",
};

const SECTION_ORDER: { key: Category; label: string }[] = [
  { key: "Birth", label: "Birth" },
  { key: "Family", label: "Family" },
  { key: "Education", label: "Education" },
  { key: "Marriage", label: "Marriage" },
  { key: "Residences", label: "Residences" },
  { key: "Occupation", label: "Occupation" },
  { key: "Records", label: "Records" },
  { key: "Death", label: "Death" },
  { key: "Lifespan", label: "Lifespan" },
  { key: "Other", label: "Other" },
];

function groupFacts(details: string[]): Record<Category, string[]> {
  const grouped = {
    Birth: [] as string[],
    Family: [] as string[],
    Education: [] as string[],
    Marriage: [] as string[],
    Residences: [] as string[],
    Occupation: [] as string[],
    Records: [] as string[],
    Death: [] as string[],
    Lifespan: [] as string[],
    Other: [] as string[],
  };
  for (const fact of details) {
    const clean = fact.trim();
    if (!clean) continue;
    grouped[categorize(clean)].push(clean);
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DetailPanel({
  person,
  allPeople,
  onClose,
}: DetailPanelProps) {
  const isOpen = person !== null;
  const grouped = person ? groupFacts(person.data.details) : null;
  const hasAnyFacts =
    grouped && SECTION_ORDER.some(({ key }) => grouped[key].length > 0);

  return (
    <AnimatePresence>
      {isOpen && person && grouped && (
        <motion.aside
            key={person.id}
            initial={{ x: 440 }}
            animate={{ x: 0 }}
            exit={{ x: 440 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed right-0 top-0 h-full z-50"
            style={{
              width: 440,
              backgroundColor: "#faf9f7",
              borderLeft: "1px solid #e8e3dd",
              boxShadow: "-4px 0 16px rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="flex flex-col h-full"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  border: "1px solid #e8e3dd",
                  borderRadius: 6,
                  background: "transparent",
                  color: "#8a8279",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  zIndex: 1,
                }}
                aria-label="Close panel"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="2" y1="2" x2="12" y2="12" />
                  <line x1="12" y1="2" x2="2" y2="12" />
                </svg>
              </button>

              {/* Scrollable content */}
              <div
                className="flex-1 overflow-y-auto"
                style={{ padding: "40px 28px 20px" }}
              >
                {/* Avatar */}
                <div
                  className="flex justify-center"
                  style={{ marginBottom: 20 }}
                >
                  {person.data["photo url"] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={person.data["photo url"]}
                      alt={`${person.data["first name"]} ${person.data["last name"]}`}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        backgroundColor:
                          person.data.gender === "F" ? "#b8917a" : "#7c9a92",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "#ffffff",
                          fontSize: 32,
                          fontWeight: 600,
                          letterSpacing: 1,
                        }}
                      >
                        {getInitials(
                          person.data["first name"],
                          person.data["last name"]
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#2c2c2c",
                    textAlign: "center",
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {`${person.data["first name"]} ${person.data["last name"]}`.trim()}
                </h2>

                {/* Dates */}
                <p
                  style={{
                    fontSize: 14,
                    color: "#8a8279",
                    textAlign: "center",
                    marginBottom: 6,
                    fontStyle:
                      !person.data.birthday && !person.data.death
                        ? "italic"
                        : "normal",
                  }}
                >
                  {formatDates(person.data.birthday, person.data.death)}
                </p>

                {/* Generation */}
                <p
                  style={{
                    fontSize: 12,
                    color: "#a39e96",
                    textAlign: "center",
                    marginBottom: 24,
                    letterSpacing: "0.3px",
                  }}
                >
                  {generationLabels[person.data.generation] ||
                    `Generation ${person.data.generation}`}
                </p>

                <Divider />

                {/* Key facts */}
                <Section label="Key Facts">
                  <DetailRow
                    label="Born"
                    value={person.data.birthday || "Unknown"}
                  />
                  <DetailRow
                    label="Died"
                    value={person.data.death || "Unknown"}
                  />
                  <DetailRow
                    label="Generation"
                    value={
                      generationLabels[person.data.generation] ||
                      String(person.data.generation)
                    }
                  />
                </Section>

                {/* Narrative sections */}
                {hasAnyFacts && (
                  <>
                    <Divider />
                    {SECTION_ORDER.map(({ key, label }) => {
                      const facts = grouped[key];
                      if (facts.length === 0) return null;
                      return (
                        <Section key={key} label={label}>
                          <FactList facts={facts} />
                        </Section>
                      );
                    })}
                  </>
                )}

                <Divider />

                {/* Related people (tree linkages) */}
                <Section label="Related People">
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
                  {person.rels.parents.length === 0 &&
                    person.rels.spouses.length === 0 &&
                    person.rels.children.length === 0 && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#a39e96",
                          fontStyle: "italic",
                        }}
                      >
                        No linked relatives in this dataset
                      </p>
                    )}
                </Section>
              </div>

              {/* Footer actions */}
              <div
                style={{
                  padding: "16px 28px",
                  borderTop: "1px solid #e8e3dd",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <Link
                  href={`/person/${person.id}`}
                  style={{
                    width: "100%",
                    padding: "8px 0",
                    fontSize: 13,
                    color: "#ffffff",
                    backgroundColor: "#7c9a92",
                    border: "1px solid #7c9a92",
                    borderRadius: 6,
                    textAlign: "center",
                    textDecoration: "none",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  View full profile →
                </Link>
                <button
                  onClick={onClose}
                  style={{
                    width: "100%",
                    padding: "8px 0",
                    fontSize: 13,
                    color: "#8a8279",
                    background: "transparent",
                    border: "1px solid #e8e3dd",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function Divider() {
  return <div style={{ height: 1, backgroundColor: "#e8e3dd", margin: "18px 0" }} />;
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      <h3 style={sectionHeaderStyle}>{label}</h3>
      {children}
    </section>
  );
}

function FactList({ facts }: { facts: string[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {facts.map((f, i) => (
        <li
          key={i}
          style={{
            fontSize: 13,
            color: "#3d3832",
            lineHeight: 1.55,
            marginBottom: 7,
            paddingLeft: 10,
            position: "relative",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: "0.55em",
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: "#c4bfb8",
            }}
          />
          {f}
        </li>
      ))}
    </ul>
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
    <div style={{ marginBottom: 12 }}>
      <p style={relLabelStyle}>{label}</p>
      {ids.map((id) => (
        <p key={id} style={relNameStyle}>
          {resolveName(id, allPeople)}
        </p>
      ))}
    </div>
  );
}

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#a39e96",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  marginBottom: 10,
};

const relLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#8a8279",
  marginBottom: 2,
};

const relNameStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#3d3832",
  marginBottom: 2,
  paddingLeft: 8,
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 6,
      }}
    >
      <span style={{ fontSize: 13, color: "#8a8279" }}>{label}</span>
      <span
        style={{ fontSize: 13, color: "#3d3832", textAlign: "right" }}
      >
        {value}
      </span>
    </div>
  );
}
