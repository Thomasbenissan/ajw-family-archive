"use client";

import type { PersonMigration } from "@/lib/migrationTypes";

interface PersonSelectorProps {
  migrations: PersonMigration[];
  selectedPersonIds: Set<string>;
  palette: string[];
  onToggle: (personId: string) => void;
}

function formatLifespan(waypoints: PersonMigration["waypoints"]): string {
  const born = waypoints.find((w) => w.event === "Born");
  const died = waypoints.find((w) => w.event === "Died");
  if (born && died) return `${born.year}\u2013${died.year}`;
  if (born) return `b. ${born.year}`;
  return "";
}

export default function PersonSelector({
  migrations,
  selectedPersonIds,
  palette,
  onToggle,
}: PersonSelectorProps) {
  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        borderRight: "1px solid #e8e3dd",
        backgroundColor: "#faf9f7",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          padding: "16px 20px 10px",
          borderBottom: "1px solid #e8e3dd",
        }}
      >
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#a39e96",
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            margin: 0,
          }}
        >
          People
        </h2>
        <p
          style={{
            fontSize: 11,
            color: "#8a8279",
            margin: "4px 0 0",
            lineHeight: 1.4,
          }}
        >
          Click to add or remove from the map
        </p>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {migrations.map((m, idx) => {
          const isSelected = selectedPersonIds.has(m.personId);
          const color = palette[idx % palette.length];
          return (
            <button
              key={m.personId}
              onClick={() => onToggle(m.personId)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "10px 20px 10px 17px",
                border: "none",
                borderLeft: isSelected
                  ? `3px solid ${color}`
                  : "3px solid transparent",
                backgroundColor: isSelected ? "#f0ede8" : "transparent",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                transition:
                  "background-color 150ms ease, border-color 150ms ease",
              }}
            >
              {/* Color swatch — always visible so you know each person's color */}
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: isSelected ? color : "transparent",
                  border: `1.5px solid ${color}`,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? 500 : 400,
                    color: isSelected ? "#2c2c2c" : "#3d3832",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.personName}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#8a8279",
                    marginTop: 2,
                  }}
                >
                  {formatLifespan(m.waypoints)} &middot;{" "}
                  {m.waypoints.length} stops
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
