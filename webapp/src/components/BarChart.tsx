"use client";

import { useMemo, useState } from "react";

export function BarChart({
  title,
  data,
  color,
  formatter,
  maxBars = 12,
  paginationLabels,
  onBarClick,
  selectedLabel,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
  color: string;
  formatter?: (value: number) => string;
  maxBars?: number;
  paginationLabels?: {
    prev: string;
    next: string;
    showing: string;
  };
  onBarClick?: (label: string) => void;
  selectedLabel?: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / maxBars));

  const safePage = Math.min(page, totalPages - 1);

  const visibleData = useMemo(() => {
    const start = safePage * maxBars;
    return data.slice(start, start + maxBars);
  }, [data, safePage, maxBars]);

  const max = Math.max(1, ...visibleData.map((d) => d.value));
  const ySteps = 4;
  const ticks = Array.from({ length: ySteps + 1 }, (_, idx) => {
    const value = Math.round((max * (ySteps - idx)) / ySteps);
    return value;
  });

  return (
    <section className="card">
      <div className="chart-head">
        <h3 className="subtitle">{title}</h3>
        {totalPages > 1 && (
          <div className="chart-pagination">
            <button className="btn-secondary" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              {paginationLabels?.prev ?? "Prev"}
            </button>
            <span className="muted chart-page-info">
              {(paginationLabels?.showing ?? "Showing").replace("{from}", String(safePage * maxBars + 1)).replace("{to}", String(Math.min((safePage + 1) * maxBars, data.length))).replace("{total}", String(data.length))}
            </span>
            <button className="btn-secondary" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
              {paginationLabels?.next ?? "Next"}
            </button>
          </div>
        )}
      </div>
      <div className="histogram mt-3">
        <div className="hist-y-axis">
          {ticks.map((tick, idx) => (
            <div key={`${tick}-${idx}`} className="hist-y-tick">
              {formatter ? formatter(tick) : tick.toLocaleString("vi-VN")}
            </div>
          ))}
        </div>

        <div className="hist-plot">
          <div className="hist-grid">
            {ticks.map((_, idx) => (
              <div key={`line-${idx}`} className="hist-grid-line" />
            ))}
          </div>
          <div className="hist-bars">
            {visibleData.map((d) => (
              <div key={d.label} className="hist-col">
                <div className="hist-value">{formatter ? formatter(d.value) : d.value.toLocaleString("vi-VN")}</div>
                <div className="hist-track">
                  <div
                    className="hist-bar"
                    style={{
                      height: `${Math.max(4, (d.value / max) * 100)}%`,
                      background: color,
                      outline: selectedLabel === d.label ? "2px solid #1f3a66" : "none",
                    }}
                    title={`${d.label}: ${d.value.toLocaleString("vi-VN")}`}
                    onClick={() => onBarClick?.(d.label)}
                  />
                </div>
                <div className="hist-label">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
