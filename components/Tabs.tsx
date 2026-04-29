"use client";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
}

export default function Tabs({ activeTab, onTabChange, tabs }: TabsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid #e8e3dd",
        backgroundColor: "#faf9f7",
        paddingLeft: 24,
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: "12px 24px",
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? "#2c2c2c" : "#8a8279",
              background: "transparent",
              border: "none",
              borderBottom: isActive
                ? "2px solid #7c9a92"
                : "2px solid transparent",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              marginBottom: -1,
              transition: "color 150ms ease, border-color 150ms ease",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
