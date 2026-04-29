"use client";

interface ZoomControlsProps {
  onFitToScreen: () => void;
}

const buttonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#faf9f7",
  border: "1px solid #e8e3dd",
  borderRadius: 6,
  cursor: "pointer",
  color: "#5a5550",
  transition: "background 150ms ease, color 150ms ease",
};

export default function ZoomControls({ onFitToScreen }: ZoomControlsProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-40"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <button
        onClick={onFitToScreen}
        style={buttonStyle}
        title="Fit to screen"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f0ede8";
          e.currentTarget.style.color = "#2c2c2c";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#faf9f7";
          e.currentTarget.style.color = "#5a5550";
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2,6 2,2 6,2" />
          <polyline points="10,2 14,2 14,6" />
          <polyline points="14,10 14,14 10,14" />
          <polyline points="6,14 2,14 2,10" />
        </svg>
      </button>
    </div>
  );
}
