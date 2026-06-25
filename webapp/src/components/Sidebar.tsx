"use client";

import { memo } from "react";

type Tab = "dashboard" | "fees" | "periods" | "obligations" | "households" | "residents" | "events" | "users" | "reports" | "account" | "handbook";

export const Sidebar = memo(function Sidebar({
  tab,
  onTab,
  labels,
  title,
  visibleTabs,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  labels: Record<Tab, string>;
  title: string;
  visibleTabs?: Tab[];
}) {
  const tabs: Tab[] = visibleTabs && visibleTabs.length > 0 ? visibleTabs : ["dashboard", "account", "fees", "periods", "obligations", "households", "residents", "events", "users", "reports", "handbook"];

  return (
    <aside className="card h-fit" style={{ padding: "0.65rem" }}>
      <div style={{ padding: "0.35rem 0.65rem 0.6rem", borderBottom: "1px solid var(--border)", marginBottom: "0.35rem" }}>
        <p className="eyebrow" style={{ margin: 0 }}>{title}</p>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {tabs.map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => onTab(t)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "left",
                padding: "0.5rem 0.65rem",
                borderRadius: "0.55rem",
                border: "none",
                fontSize: "0.85rem",
                fontWeight: isActive ? 600 : 450,
                color: isActive ? "var(--brand)" : "var(--foreground)",
                background: isActive ? "rgba(233, 242, 255, 0.7)" : "transparent",
                cursor: "pointer",
                transition: "all 0.12s ease",
                borderLeft: isActive ? "3px solid var(--brand)" : "3px solid transparent",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(245, 248, 253, 0.5)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span>{labels[t]}</span>
              {isActive && (
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--brand)",
                  opacity: 0.6,
                }} />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
});
