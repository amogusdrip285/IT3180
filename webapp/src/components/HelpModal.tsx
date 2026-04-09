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
        <div className="flex items-center justify-between gap-2">
          <h3 className="subtitle">{title}</h3>
          <button className="btn-secondary" onClick={onClose}>x</button>
        </div>
        <div className="mt-2 space-y-2">
          {lines.map((line, idx) => (
            <p key={`${idx}-${line}`} className="muted">- {line}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
