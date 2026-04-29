"use client";

import type { MigrationWaypoint } from "@/lib/migrationTypes";

interface MigrationStopPopupProps {
  waypoint: MigrationWaypoint;
  personName: string;
  x: number;
  y: number;
  onClose: () => void;
}

export default function MigrationStopPopup({
  waypoint,
  personName,
  x,
  y,
  onClose,
}: MigrationStopPopupProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -100%) translateY(-12px)",
        width: 300,
        backgroundColor: "#faf9f7",
        border: "1px solid #e8e3dd",
        borderRadius: 8,
        boxShadow:
          "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
        fontFamily: "'Inter', sans-serif",
        zIndex: 20,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: "1px solid #e8e3dd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              color: "#a39e96",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {personName}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#2c2c2c",
              lineHeight: 1.3,
            }}
          >
            {waypoint.county}, {waypoint.state}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#8a8279",
              marginTop: 2,
            }}
          >
            {waypoint.year}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #e8e3dd",
            borderRadius: 4,
            background: "transparent",
            color: "#8a8279",
            cursor: "pointer",
            fontSize: 14,
            flexShrink: 0,
          }}
          aria-label="Close popup"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="2" y1="2" x2="10" y2="10" />
            <line x1="10" y1="2" x2="2" y2="10" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 16px 14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 12, color: "#8a8279" }}>Event</span>
          <span style={{ fontSize: 12, color: "#3d3832", fontWeight: 500 }}>
            {waypoint.event}
          </span>
        </div>

        {waypoint.sourceDoc && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 12, color: "#8a8279" }}>Source</span>
            <span
              style={{
                fontSize: 12,
                color: "#3d3832",
                maxWidth: 180,
                textAlign: "right",
                wordBreak: "break-word",
              }}
            >
              {waypoint.sourceDoc}
            </span>
          </div>
        )}

        {waypoint.details && (
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                fontSize: 11,
                color: "#a39e96",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 4,
              }}
            >
              Details
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#3d3832",
                lineHeight: 1.5,
              }}
            >
              {waypoint.details}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
