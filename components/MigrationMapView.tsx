"use client";

/**
 * MigrationMapView — animated migration map using react-map-gl (MapLibre)
 * with deck.gl overlay via MapboxOverlay + useControl.
 *
 * Head label pills are rendered as HTML via react-map-gl <Marker>, not via
 * deck.gl TextLayer, so they can be properly styled (rounded corners, soft
 * shadow, per-row color accents) and so clustered heads collapse into a
 * single grouped card instead of overlapping pills.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Map, Marker, useControl } from "react-map-gl/maplibre";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { TripsLayer } from "@deck.gl/geo-layers";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { LayersList } from "@deck.gl/core";
import "maplibre-gl/dist/maplibre-gl.css";

import PersonSelector from "./PersonSelector";
import MigrationTimeline from "./MigrationTimeline";
import MigrationStopPopup from "./MigrationStopPopup";
import type { MigrationWaypoint, PersonMigration } from "@/lib/migrationTypes";

interface MigrationMapViewProps {
  migrations: PersonMigration[];
}

// ---------------------------------------------------------------------------
// deck.gl ↔ react-map-gl bridge
// ---------------------------------------------------------------------------

function DeckGLOverlay(props: { layers: LayersList }) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: true }));
  overlay.setProps({ layers: props.layers });
  return null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";
const ANIMATION_MS_PER_YEAR = 1000;
const PADDING = 40;
const DWELL_FRACTION = 0.8;

const MIGRATION_PALETTE: string[] = [
  "#4d8c7f", // teal
  "#8a6534", // umber
  "#446891", // dusty blue
  "#6e7e3a", // olive
  "#824f73", // plum
  "#b35e3c", // terracotta
  "#3d5866", // slate
  "#5a8861", // sage
];

const CLUSTER_EPSILON_DEG = 0.01; // ~1 km — "same waypoint"
const CLUSTER_OFFSET_DEG = 0.05; // ~5 km fan-out radius

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Status =
  | { kind: "before" }
  | { kind: "dwell"; atIdx: number; yearsElapsed: number }
  | { kind: "transit"; fromIdx: number; toIdx: number; progress: number }
  | { kind: "after"; atIdx: number };

type ActiveHead = {
  personId: string;
  personName: string;
  status: Status;
  wps: MigrationWaypoint[];
  basePos: [number, number];
  color: string;
  rgb: [number, number, number];
  maxDwell: number;
};

type ClusterMember = ActiveHead & {
  effectivePos: [number, number];
  statusText: string;
};

type HeadCluster = {
  center: [number, number];
  members: ClusterMember[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function getPersonColor(
  personId: string,
  migrations: PersonMigration[]
): string {
  const idx = migrations.findIndex((m) => m.personId === personId);
  return MIGRATION_PALETTE[(idx >= 0 ? idx : 0) % MIGRATION_PALETTE.length];
}

function boundsFromWaypoints(
  wps: MigrationWaypoint[]
): [[number, number], [number, number]] {
  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const w of wps) {
    const [lng, lat] = w.coords;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function timestampOf(year: number, baseYear: number): number {
  return (year - baseYear) * ANIMATION_MS_PER_YEAR;
}

function buildTripData(wps: MigrationWaypoint[], baseYear: number) {
  if (wps.length === 0)
    return [{ path: [] as [number, number][], timestamps: [] as number[] }];
  const path: [number, number][] = [];
  const timestamps: number[] = [];

  for (let i = 0; i < wps.length; i++) {
    const ti = timestampOf(wps[i].year, baseYear);
    path.push(wps[i].coords);
    timestamps.push(ti);

    if (i < wps.length - 1) {
      const tNext = timestampOf(wps[i + 1].year, baseYear);
      const dwellEnd = ti + DWELL_FRACTION * (tNext - ti);
      path.push(wps[i].coords);
      timestamps.push(dwellEnd);
    }
  }
  return [{ path, timestamps }];
}

function getStatus(
  wps: MigrationWaypoint[],
  currentTime: number,
  baseYear: number
): Status {
  if (wps.length === 0) return { kind: "after", atIdx: 0 };
  const first = timestampOf(wps[0].year, baseYear);
  if (currentTime < first) return { kind: "before" };
  if (wps.length === 1) return { kind: "dwell", atIdx: 0, yearsElapsed: 0 };

  for (let i = 0; i < wps.length - 1; i++) {
    const ti = timestampOf(wps[i].year, baseYear);
    const tNext = timestampOf(wps[i + 1].year, baseYear);
    if (currentTime >= ti && currentTime < tNext) {
      const span = tNext - ti;
      const dwellEnd = ti + DWELL_FRACTION * span;
      if (currentTime < dwellEnd) {
        return {
          kind: "dwell",
          atIdx: i,
          yearsElapsed: (currentTime - ti) / ANIMATION_MS_PER_YEAR,
        };
      }
      const transitSpan = span - DWELL_FRACTION * span;
      return {
        kind: "transit",
        fromIdx: i,
        toIdx: i + 1,
        progress: transitSpan === 0 ? 1 : (currentTime - dwellEnd) / transitSpan,
      };
    }
  }
  return { kind: "after", atIdx: wps.length - 1 };
}

function positionFromStatus(
  wps: MigrationWaypoint[],
  status: Status
): [number, number] | null {
  if (status.kind === "before") return null;
  if (status.kind === "dwell" || status.kind === "after")
    return wps[status.atIdx].coords;
  const [lng0, lat0] = wps[status.fromIdx].coords;
  const [lng1, lat1] = wps[status.toIdx].coords;
  const t = status.progress;
  return [lng0 + (lng1 - lng0) * t, lat0 + (lat1 - lat0) * t];
}

function computeMaxDwellYears(wps: MigrationWaypoint[]): number {
  let max = 0;
  for (let i = 0; i < wps.length - 1; i++) {
    const span = wps[i + 1].year - wps[i].year;
    if (span > max) max = span;
  }
  return Math.max(max, 1);
}

function statusToText(status: Status, wps: MigrationWaypoint[]): string {
  if (status.kind === "dwell") return `since ${wps[status.atIdx].year}`;
  if (status.kind === "transit") return `→ ${wps[status.toIdx].county}`;
  return "";
}

/**
 * Groups heads that share a waypoint within CLUSTER_EPSILON_DEG and fans
 * them out radially so each person's marker is visible. Solo heads stay
 * on their true position. Returns clusters so the label pill can render
 * once per cluster instead of once per person.
 */
function buildHeadClusters(heads: ActiveHead[]): HeadCluster[] {
  if (heads.length === 0) return [];

  const groups: ActiveHead[][] = [];
  for (const h of heads) {
    let placed = false;
    for (const g of groups) {
      const [lng, lat] = g[0].basePos;
      if (
        Math.abs(lng - h.basePos[0]) < CLUSTER_EPSILON_DEG &&
        Math.abs(lat - h.basePos[1]) < CLUSTER_EPSILON_DEG
      ) {
        g.push(h);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([h]);
  }

  return groups.map((group) => {
    const center = group[0].basePos;

    if (group.length === 1) {
      const h = group[0];
      return {
        center,
        members: [
          {
            ...h,
            effectivePos: h.basePos,
            statusText: statusToText(h.status, h.wps),
          },
        ],
      };
    }

    const [cLng, cLat] = center;
    const latRad = (Math.PI / 180) * cLat;
    const lngCorrection = Math.max(Math.cos(latRad), 0.1);

    const members = group.map((h, i) => {
      const angle = (2 * Math.PI * i) / group.length;
      const effectivePos: [number, number] = [
        cLng + (Math.cos(angle) * CLUSTER_OFFSET_DEG) / lngCorrection,
        cLat + Math.sin(angle) * CLUSTER_OFFSET_DEG,
      ];
      return {
        ...h,
        effectivePos,
        statusText: statusToText(h.status, h.wps),
      };
    });

    return { center, members };
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MigrationMapView({ migrations }: MigrationMapViewProps) {
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(
    () => new Set(migrations[0] ? [migrations[0].personId] : [])
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [popup, setPopup] = useState<{
    waypoint: MigrationWaypoint;
    personName: string;
    x: number;
    y: number;
  } | null>(null);

  const mapRef = useRef<{
    fitBounds: (
      bounds: [[number, number], [number, number]],
      opts: Record<string, unknown>
    ) => void;
  } | null>(null);
  const animationRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  const selectedMigrations = useMemo(
    () => migrations.filter((m) => selectedPersonIds.has(m.personId)),
    [migrations, selectedPersonIds]
  );

  const { globalMinYear, globalMaxYear } = useMemo(() => {
    if (selectedMigrations.length === 0)
      return { globalMinYear: 0, globalMaxYear: 0 };
    let min = Infinity;
    let max = -Infinity;
    for (const m of selectedMigrations) {
      for (const w of m.waypoints) {
        if (w.year < min) min = w.year;
        if (w.year > max) max = w.year;
      }
    }
    return { globalMinYear: min, globalMaxYear: max };
  }, [selectedMigrations]);

  const totalDuration = (globalMaxYear - globalMinYear) * ANIMATION_MS_PER_YEAR;
  const currentYear = Math.min(
    globalMaxYear,
    Math.round(globalMinYear + currentTime / ANIMATION_MS_PER_YEAR)
  );

  // -----------------------------------------------------------------------
  // Fit map when selection grows
  // -----------------------------------------------------------------------
  const prevSelectionSizeRef = useRef(selectedPersonIds.size);
  useEffect(() => {
    const currentSize = selectedPersonIds.size;
    const grew = currentSize > prevSelectionSizeRef.current;
    prevSelectionSizeRef.current = currentSize;

    if (!grew) return;
    if (!mapRef.current || selectedMigrations.length === 0) return;
    const allWaypoints = selectedMigrations.flatMap((m) => m.waypoints);
    if (allWaypoints.length < 2) return;

    requestAnimationFrame(() => {
      mapRef.current?.fitBounds(boundsFromWaypoints(allWaypoints), {
        padding: PADDING,
        duration: 600,
      });
    });
  }, [selectedPersonIds, selectedMigrations]);

  // -----------------------------------------------------------------------
  // Animation loop
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!isPlaying || totalDuration <= 0) {
      cancelAnimationFrame(animationRef.current);
      return;
    }

    lastFrameRef.current = performance.now();

    function tick(now: number) {
      const delta = (now - lastFrameRef.current) * speed;
      lastFrameRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) return 0;
        return next;
      });

      animationRef.current = requestAnimationFrame(tick);
    }

    animationRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, speed, totalDuration]);

  // -----------------------------------------------------------------------
  // Callbacks
  // -----------------------------------------------------------------------

  const handleTogglePerson = useCallback((id: string) => {
    setSelectedPersonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setPopup(null);
  }, []);

  const handleScrub = useCallback(
    (progress: number) => {
      const t = Math.max(0, Math.min(1, progress)) * totalDuration;
      setCurrentTime(t);
    },
    [totalDuration]
  );

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleSpeedChange = useCallback((s: number) => {
    setSpeed(s);
  }, []);

  const handleStopClick = useCallback(
    (
      waypoint: MigrationWaypoint,
      personName: string,
      screenCoords: { x: number; y: number }
    ) => {
      setPopup({
        waypoint,
        personName,
        x: screenCoords.x,
        y: screenCoords.y,
      });
    },
    []
  );

  const handleClosePopup = useCallback(() => {
    setPopup(null);
  }, []);

  // -----------------------------------------------------------------------
  // Active heads + clustering — used by both deck.gl layers and Marker pills
  // -----------------------------------------------------------------------

  const activeHeads = useMemo<ActiveHead[]>(() => {
    const heads: ActiveHead[] = [];
    for (const migration of selectedMigrations) {
      const wps = migration.waypoints;
      if (wps.length === 0) continue;

      const colorHex = getPersonColor(migration.personId, migrations);
      const rgb = hexToRgb(colorHex);
      const status = getStatus(wps, currentTime, globalMinYear);
      if (status.kind !== "dwell" && status.kind !== "transit") continue;

      const basePos = positionFromStatus(wps, status);
      if (!basePos) continue;

      heads.push({
        personId: migration.personId,
        personName: migration.personName,
        status,
        wps,
        basePos,
        color: colorHex,
        rgb,
        maxDwell: computeMaxDwellYears(wps),
      });
    }
    return heads;
  }, [selectedMigrations, migrations, currentTime, globalMinYear]);

  const headClusters = useMemo(
    () => buildHeadClusters(activeHeads),
    [activeHeads]
  );

  // -----------------------------------------------------------------------
  // deck.gl layers
  // -----------------------------------------------------------------------

  const layers = useMemo(() => {
    const result: LayersList = [];
    if (selectedMigrations.length === 0) return result;

    // Per-person layers: trail, stops, stop labels
    for (const migration of selectedMigrations) {
      const wps = migration.waypoints;
      if (wps.length === 0) continue;

      const colorHex = getPersonColor(migration.personId, migrations);
      const rgb = hexToRgb(colorHex);
      const tripData = buildTripData(wps, globalMinYear);

      result.push(
        new TripsLayer({
          id: `trips-${migration.personId}`,
          data: tripData,
          getPath: (d: (typeof tripData)[0]) => d.path,
          getTimestamps: (d: (typeof tripData)[0]) => d.timestamps,
          getColor: rgb,
          widthMinPixels: 4,
          trailLength: Math.max(totalDuration, 1),
          currentTime,
          opacity: 0.9,
          capRounded: true,
          jointRounded: true,
        })
      );

      const scatterData = wps.map((w) => ({
        ...w,
        reached: timestampOf(w.year, globalMinYear) <= currentTime,
      }));

      result.push(
        new ScatterplotLayer({
          id: `stops-${migration.personId}`,
          data: scatterData,
          getPosition: (d: (typeof scatterData)[0]) => d.coords,
          getFillColor: (d: (typeof scatterData)[0]) =>
            d.reached
              ? [rgb[0], rgb[1], rgb[2], 255]
              : [rgb[0], rgb[1], rgb[2], 80],
          getLineColor: [255, 255, 255, 255],
          lineWidthMinPixels: 1.5,
          stroked: true,
          radiusMinPixels: 7,
          radiusMaxPixels: 7,
          pickable: true,
          onClick: (info: {
            object?: (typeof scatterData)[0];
            x: number;
            y: number;
          }) => {
            if (info.object) {
              handleStopClick(info.object, migration.personName, {
                x: info.x,
                y: info.y,
              });
            }
          },
        })
      );

      const labelData = wps.map((w) => ({
        ...w,
        label: `${w.county}, ${w.year}`,
        reached: timestampOf(w.year, globalMinYear) <= currentTime,
      }));

      result.push(
        new TextLayer({
          id: `labels-${migration.personId}`,
          data: labelData,
          getPosition: (d: (typeof labelData)[0]) => d.coords,
          getText: (d: (typeof labelData)[0]) => d.label,
          getColor: (d: (typeof labelData)[0]) =>
            d.reached ? [61, 56, 50, 255] : [61, 56, 50, 70],
          getSize: 11,
          getPixelOffset: [0, 18],
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          outlineColor: [255, 255, 255, 220],
          outlineWidth: 2,
          sizeUnits: "pixels",
          sizeMinPixels: 11,
          sizeMaxPixels: 11,
        })
      );
    }

    // Per-head graphics: halos + target (no label — that's a Marker)
    for (const cluster of headClusters) {
      for (const m of cluster.members) {
        const pos = m.effectivePos;
        const { rgb, status, maxDwell, personId } = m;

        if (status.kind === "dwell" && status.yearsElapsed > 0) {
          const dwellRadius =
            20 + Math.min(status.yearsElapsed / maxDwell, 1) * 18;
          result.push(
            new ScatterplotLayer({
              id: `dwell-halo-${personId}`,
              data: [{ position: pos }],
              getPosition: (d: { position: [number, number] }) => d.position,
              getFillColor: [rgb[0], rgb[1], rgb[2], 40],
              radiusMinPixels: dwellRadius,
              radiusMaxPixels: dwellRadius,
              stroked: false,
            })
          );
        }

        result.push(
          new ScatterplotLayer({
            id: `head-glow-${personId}`,
            data: [{ position: pos }],
            getPosition: (d: { position: [number, number] }) => d.position,
            getFillColor: [rgb[0], rgb[1], rgb[2], 70],
            radiusMinPixels: 18,
            radiusMaxPixels: 18,
            stroked: false,
          })
        );

        result.push(
          new ScatterplotLayer({
            id: `head-outer-${personId}`,
            data: [{ position: pos }],
            getPosition: (d: { position: [number, number] }) => d.position,
            getFillColor: [rgb[0], rgb[1], rgb[2], 255],
            radiusMinPixels: 13,
            radiusMaxPixels: 13,
            stroked: false,
          })
        );

        result.push(
          new ScatterplotLayer({
            id: `head-middle-${personId}`,
            data: [{ position: pos }],
            getPosition: (d: { position: [number, number] }) => d.position,
            getFillColor: [255, 255, 255, 255],
            radiusMinPixels: 7,
            radiusMaxPixels: 7,
            stroked: false,
          })
        );

        result.push(
          new ScatterplotLayer({
            id: `head-dot-${personId}`,
            data: [{ position: pos }],
            getPosition: (d: { position: [number, number] }) => d.position,
            getFillColor: [rgb[0], rgb[1], rgb[2], 255],
            radiusMinPixels: 3,
            radiusMaxPixels: 3,
            stroked: false,
          })
        );
      }
    }

    return result;
  }, [
    selectedMigrations,
    migrations,
    currentTime,
    globalMinYear,
    totalDuration,
    headClusters,
    handleStopClick,
  ]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const progressFraction = totalDuration > 0 ? currentTime / totalDuration : 0;
  const hasSelection = selectedMigrations.length > 0;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <PersonSelector
        migrations={migrations}
        selectedPersonIds={selectedPersonIds}
        palette={MIGRATION_PALETTE}
        onToggle={handleTogglePerson}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <Map
            ref={mapRef as React.Ref<never>}
            initialViewState={{
              longitude: -83.5,
              latitude: 33.5,
              zoom: 7,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={BASEMAP_STYLE}
          >
            <DeckGLOverlay layers={layers} />

            {/* One HTML-styled label pill per cluster of heads */}
            {headClusters.map((cluster, i) => (
              <Marker
                key={`head-cluster-${i}`}
                longitude={cluster.center[0]}
                latitude={cluster.center[1]}
                anchor="bottom"
                offset={[0, -44]}
              >
                <HeadLabelPill cluster={cluster} />
              </Marker>
            ))}

            {/* // TODO: swap in Newberry Atlas historical boundaries */}
          </Map>

          {!hasSelection && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <div
                style={{
                  background: "#faf9f7",
                  border: "1px solid #e8e3dd",
                  borderRadius: 8,
                  padding: "12px 20px",
                  fontSize: 13,
                  color: "#8a8279",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                Select a person from the list to view their migration
              </div>
            </div>
          )}

          {popup && (
            <MigrationStopPopup
              waypoint={popup.waypoint}
              personName={popup.personName}
              x={popup.x}
              y={popup.y}
              onClose={handleClosePopup}
            />
          )}
        </div>

        {hasSelection && (
          <div style={{ height: 64, flexShrink: 0 }}>
            <MigrationTimeline
              minYear={globalMinYear}
              maxYear={globalMaxYear}
              currentYear={currentYear}
              progressFraction={progressFraction}
              isPlaying={isPlaying}
              speed={speed}
              onScrub={handleScrub}
              onTogglePlay={handleTogglePlay}
              onSpeedChange={handleSpeedChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HeadLabelPill — the HTML card that sits above each cluster of active heads
// ---------------------------------------------------------------------------

function HeadLabelPill({ cluster }: { cluster: HeadCluster }) {
  return (
    <div
      style={{
        background: "rgba(250, 249, 247, 0.96)",
        backdropFilter: "saturate(1.1)",
        border: "1px solid #e8e3dd",
        borderRadius: 10,
        padding: "7px 11px 8px",
        boxShadow:
          "0 6px 20px rgba(44, 44, 44, 0.08), 0 1px 3px rgba(44, 44, 44, 0.04)",
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        lineHeight: 1.25,
        pointerEvents: "none",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {cluster.members.map((m, idx) => (
        <div
          key={m.personId}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: idx > 0 ? 6 : 0,
            paddingTop: idx > 0 ? 6 : 0,
            borderTop: idx > 0 ? "1px solid #eeeae3" : "none",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: m.color,
              flexShrink: 0,
              boxShadow: `0 0 0 2px rgba(255,255,255,0.9)`,
            }}
          />
          <span
            style={{
              fontWeight: 600,
              color: "#2c2c2c",
              letterSpacing: "-0.01em",
            }}
          >
            {m.personName}
          </span>
          {m.statusText && (
            <>
              <span
                aria-hidden
                style={{
                  color: "#c4bfb8",
                  fontWeight: 400,
                  margin: "0 -2px",
                }}
              >
                ·
              </span>
              <span
                style={{
                  color: "#8a8279",
                  fontWeight: 400,
                }}
              >
                {m.statusText}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
