"use client";

type Tab = "dashboard" | "fees" | "periods" | "obligations" | "households" | "residents" | "events" | "users" | "reports" | "handbook";

export function Sidebar({
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
  const tabs: Tab[] = visibleTabs && visibleTabs.length > 0 ? visibleTabs : ["dashboard", "fees", "periods", "obligations", "households", "residents", "events", "users", "reports", "handbook"];

  return (
    <aside className="card h-fit">
      <p className="eyebrow mb-2">{title}</p>
      <nav className="space-y-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onTab(t)}
            className={`w-full text-left rounded-md px-3 py-2 ${tab === t ? "bg-[#e9f2ff] text-[#0f5fdf] font-semibold" : "hover:bg-[#f5f8fd]"}`}
          >
            {labels[t]}
          </button>
        ))}
      </nav>
    </aside>
  );
}
