"use client";

export type MobileTab = "today" | "progress" | "settings";

type MobileTabsProps = {
  activeTab: MobileTab;
  onChange: (tab: MobileTab) => void;
};

const TAB_ITEMS: { id: MobileTab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "progress", label: "Progress" },
  { id: "settings", label: "Settings" }
];

export default function MobileTabs({ activeTab, onChange }: MobileTabsProps) {
  return (
    <nav className="mb-4 rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:hidden" aria-label="Mobile sections">
      <ul className="grid grid-cols-3 gap-1">
        {TAB_ITEMS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onChange(tab.id)}
                className={`inline-flex h-9 w-full items-center justify-center rounded-md text-xs font-medium transition ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
