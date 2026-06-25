"use client";

export function HelpModal({
  open,
  title,
  lines,
  onClose,
}: {
  open: boolean;
  title: string;
  lines: string[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.85rem" }}>
          <h3 className="subtitle">{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "999px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: "0.8rem",
              color: "var(--muted)",
              transition: "all 0.12s ease",
              lineHeight: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#eef2f8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.7)"; }}
          >
            {"\u2715"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {lines.map((line, idx) => (
            <p key={`${idx}-${line}`} className="muted" style={{ lineHeight: 1.6, paddingLeft: "1rem", position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: "var(--muted)", opacity: 0.4 }}>&mdash;</span>
              {line}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
