"use client";

import { NavSection, ViewId } from "./workspaceNav";
import { Wrench } from "lucide-react";

export default function WorkspaceSidebar({
  sections,
  activeView,
  onViewChange,
}: {
  sections: NavSection[];
  activeView: ViewId;
  onViewChange: (v: ViewId) => void;
}) {
  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-white border-r border-slate-200 h-screen overflow-y-auto">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-100">
        <span className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
          <Wrench size={15} className="text-slate-900" />
        </span>
        <span className="font-bold text-slate-900 text-sm">ServiceTrack</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.id}>
            <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.id === activeView;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? "bg-brand/20 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
