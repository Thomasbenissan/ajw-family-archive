"use client";

interface MigrationTimelineProps {
  minYear: number;
  maxYear: number;
  currentYear: number;
  /** Continuous 0..1 progress for smooth playhead position */
  progressFraction: number;
  isPlaying: boolean;
  speed: number;
  /** Scrub callback — emits a fractional progress 0..1 */
  onScrub: (progress: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [1, 2, 4];

function getDecadeTicks(min: number, max: number): number[] {
  const ticks: number[] = [];
  const firstDecade = Math.ceil(min / 10) * 10;
  for (let d = firstDecade; d <= max; d += 10) {
    ticks.push(d);
  }
  return ticks;
}

export default function MigrationTimeline({
  minYear,
  maxYear,
  currentYear,
  progressFraction,
  isPlaying,
  speed,
  onScrub,
  onTogglePlay,
  onSpeedChange,
}: MigrationTimelineProps) {
  const range = maxYear - minYear || 1;
  const progressPct = Math.max(0, Math.min(1, progressFraction)) * 100;
  const decades = getDecadeTicks(minYear, maxYear);

  function pctFromEvent(e: React.MouseEvent<HTMLDivElement>): number {
    const rect = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }

  function handleBarClick(e: React.MouseEvent<HTMLDivElement>) {
    onScrub(pctFromEvent(e));
  }

  function handleDrag(e: React.MouseEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    onScrub(pctFromEvent(e));
  }

  return (
    <div
      style={{
        height: "100%",
        backgroundColor: "#faf9f7",
        borderTop: "1px solid #e8e3dd",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 16,
        fontFamily: "'Inter', sans-serif",
        flexShrink: 0,
      }}
    >
      {/* Play/Pause */}
      <button
        onClick={onTogglePlay}
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "1px solid #e8e3dd",
          borderRadius: 6,
          cursor: "pointer",
          color: "#5a5550",
          flexShrink: 0,
        }}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
          >
            <rect x="2" y="1" width="3.5" height="12" rx="0.5" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="0.5" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
          >
            <polygon points="3,1 13,7 3,13" />
          </svg>
        )}
      </button>

      {/* Speed selector */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            style={{
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: speed === s ? 600 : 400,
              color: speed === s ? "#2c2c2c" : "#8a8279",
              background: speed === s ? "#e8e3dd" : "transparent",
              border: "1px solid #e8e3dd",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Current year label */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#2c2c2c",
          minWidth: 48,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {currentYear}
      </div>

      {/* Scrubber track */}
      <div
        style={{
          flex: 1,
          position: "relative",
          height: 40,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
        onClick={handleBarClick}
        onMouseMove={handleDrag}
      >
        {/* Track background */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: "#e8e3dd",
            borderRadius: 2,
          }}
        />
        {/* Progress fill — smooth, no transition so rAF drives it */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `${progressPct}%`,
            height: 4,
            backgroundColor: "#7c9a92",
            borderRadius: 2,
          }}
        />
        {/* Playhead — smooth, no transition so rAF drives it */}
        <div
          style={{
            position: "absolute",
            left: `${progressPct}%`,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#7c9a92",
            border: "2px solid #ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            transform: "translateX(-50%)",
          }}
        />
        {/* Decade ticks */}
        {decades.map((d) => {
          const pct = ((d - minYear) / range) * 100;
          return (
            <div
              key={d}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: 28,
                transform: "translateX(-50%)",
                fontSize: 9,
                color: "#a39e96",
                whiteSpace: "nowrap",
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
