"use client";

import type { Lang } from "@/lib/types";

export function LanguageSwitch({
  lang,
  onChange,
  label,
}: {
  lang: Lang;
  onChange: (next: Lang) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <select
        className="input !w-auto"
        value={lang}
        onChange={(e) => onChange(e.target.value as Lang)}
      >
        <option value="en">English</option>
        <option value="vi">Tieng Viet</option>
      </select>
    </label>
  );
}
