"use client";

import { useMemo, useState } from "react";

export function DonutChart({
  title,
  data,
  totalLabel,
}: {
  title: string;
  data: Array<{ label: string; value: number; color: string }>;
  totalLabel: string;
}) {
  const [activeLabel, setActiveLabel] = useState("");
  const total = Math.max(0, data.reduce((s, x) => s + Math.max(0, x.value), 0));
  const segments = data.reduce<Array<{ label: string; value: number; color: string; start: number; size: number }>>((arr, item) => {
    const start = arr.length > 0 ? arr[arr.length - 1].start + arr[arr.length - 1].size : 0;
    const pct = total > 0 ? (Math.max(0, item.value) / total) * 100 : 0;
    arr.push({ ...item, start, size: pct });
    return arr;
  }, []);

  const gradient = segments.map((s) => `${s.color} ${s.start}% ${Math.min(100, s.start + s.size)}%`).join(", ");

  const active = useMemo(() => {
    if (!activeLabel) return null;
    return segments.find((s) => s.label === activeLabel) ?? null;
  }, [activeLabel, segments]);

  return (
    <section className="card">
      <h3 className="subtitle">{title}</h3>
      <div className="donut-wrap mt-3">
        <div className="donut-stage" onMouseLeave={() => setActiveLabel("")}> 
          <div className={`donut ${active ? "donut-active" : ""}`} style={{ background: `conic-gradient(${gradient || "#d9e6f7 0 100%"})` }}>
            <div className="donut-hole">
              <p className="muted">{active ? active.label : totalLabel}</p>
              <p className="value">{(active ? active.value : total).toLocaleString("vi-VN")}</p>
              {active && <p className="muted">{Math.round((active.size || 0) * 10) / 10}%</p>}
            </div>
          </div>
          {active && (
            <div className="donut-tooltip">
              <strong>{active.label}</strong>
              <span>{active.value.toLocaleString("vi-VN")}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {segments.map((s) => (
            <button
              type="button"
              className={`donut-legend ${activeLabel === s.label ? "active" : ""}`}
              key={s.label}
              onMouseEnter={() => setActiveLabel(s.label)}
              onFocus={() => setActiveLabel(s.label)}
              onMouseLeave={() => setActiveLabel("")}
              onBlur={() => setActiveLabel("")}
            >
              <span className="legend-dot" style={{ background: s.color }} /> {s.label}: {s.value.toLocaleString("vi-VN")}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
