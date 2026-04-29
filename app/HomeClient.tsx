"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import FamilyTreeView from "@/components/FamilyTreeView";
import DetailPanel from "@/components/DetailPanel";
import ZoomControls from "@/components/ZoomControls";
import Tabs from "@/components/Tabs";
import type { FamilyChartDatum } from "@/lib/types";
import type { PersonMigration } from "@/lib/migrationTypes";

const MigrationMapView = dynamic(
  () => import("@/components/MigrationMapView"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f2ee",
          fontFamily: "'Inter', sans-serif",
          color: "#8a8279",
          fontSize: 14,
        }}
      >
        Loading map...
      </div>
    ),
  }
);

const TABS = [
  { id: "tree", label: "Family Tree" },
  { id: "migration", label: "Migration" },
];

interface HomeClientProps {
  familyData: FamilyChartDatum[];
  migrations: PersonMigration[];
}

export default function HomeClient({
  familyData,
  migrations,
}: HomeClientProps) {
  const [activeTab, setActiveTab] = useState("tree");
  const [selectedPerson, setSelectedPerson] =
    useState<FamilyChartDatum | null>(null);
  const zoomRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    fitToScreen: () => void;
  } | null>(null);

  const handlePersonClick = useCallback(
    (personId: string) => {
      const person = familyData.find((p) => p.id === personId) || null;
      setSelectedPerson(person);
    },
    [familyData]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedPerson(null);
  }, []);

  return (
    <>
      {/* Header */}
      <header
        style={{
          padding: "18px 24px 14px",
          borderBottom: "none",
          backgroundColor: "#faf9f7",
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "#3d3832",
            lineHeight: 1.3,
            margin: 0,
          }}
        >
          The Andrew Jackson White Family
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "#8a8279",
            margin: "2px 0 0",
            lineHeight: 1.4,
          }}
        >
          A genealogical visualization for SOC 190 — Emory University
        </p>
      </header>

      {/* Tab bar */}
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} tabs={TABS} />

      {/* Family Tree view — hidden via CSS when inactive to preserve D3 state */}
      <main
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          display: activeTab === "tree" ? "flex" : "none",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <FamilyTreeView
            data={familyData}
            onPersonClick={handlePersonClick}
            zoomRef={zoomRef}
          />
        </div>
      </main>

      {/* Detail panel (tree) */}
      {activeTab === "tree" && (
        <DetailPanel
          person={selectedPerson}
          allPeople={familyData}
          onClose={handleClosePanel}
        />
      )}

      {/* Zoom controls (tree) */}
      {activeTab === "tree" && (
        <ZoomControls
          onFitToScreen={() => zoomRef.current?.fitToScreen()}
        />
      )}

      {/* Migration view */}
      {activeTab === "migration" && (
        <main
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <MigrationMapView migrations={migrations} />
        </main>
      )}
    </>
  );
}
