"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Loader2, LogOut } from "lucide-react";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import UserManagementPanel from "@/components/layout/UserManagementPanel";
import LoginScreen from "@/components/auth/LoginScreen";
import PendingScreen from "@/components/auth/PendingScreen";
import OverviewPanel from "@/components/dashboard/OverviewPanel";
import TicketListPanel from "@/components/tickets/TicketListPanel";
import NewTicketPanel from "@/components/tickets/NewTicketPanel";
import ImportPanel from "@/components/tickets/ImportPanel";
import BranchesPanel from "@/components/master/BranchesPanel";
import { NAV, ADMIN_SECTION, ViewId, findSection, type NavSection } from "@/components/layout/workspaceNav";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { session, profile, loading, signOut } = useAuth();
  const [view, setView] = useState<ViewId>("dash-overview");
  const [panelKey, setPanelKey] = useState(0);
  const prevView = useRef<ViewId>("dash-overview");

  const handleViewChange = useCallback((v: ViewId) => {
    if (v === prevView.current) return;
    prevView.current = v;
    setPanelKey((k) => k + 1);
    setView(v);
  }, []);

  const visibleSections = useMemo<NavSection[]>(() => {
    if (!profile) return [];
    if (profile.role === "super_admin") return [...NAV, ADMIN_SECTION];
    return NAV; // all roles see the same core sections; adjust here if you add per-section access later
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main-bg">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  if (!session) return <LoginScreen />;
  if (!profile || !profile.is_active) return <PendingScreen />;

  const activeSection = findSection(visibleSections, view) ?? visibleSections[0];

  function renderContent() {
    switch (view) {
      case "dash-overview":
        return <OverviewPanel onNavigate={handleViewChange} />;
      case "tickets-list":
        return <TicketListPanel />;
      case "tickets-new":
        return <NewTicketPanel />;
      case "tickets-import":
        return <ImportPanel />;
      case "master-branches":
        return <BranchesPanel />;
      case "admin-users":
        return <UserManagementPanel />;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-main-bg overflow-hidden">
      <WorkspaceSidebar sections={visibleSections} activeView={view} onViewChange={handleViewChange} />
      <main className="flex-1 flex flex-col overflow-hidden pb-[60px] md:pb-0">
        <div className="md:hidden flex items-center gap-1.5 pl-3 pr-3 py-2 border-b border-slate-200 bg-white shrink-0">
          <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-thin">
            {activeSection?.items.map((item) => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive ? "bg-brand text-slate-900" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.shortLabel ?? item.label}
                </button>
              );
            })}
          </div>
          <button onClick={signOut} title="Keluar" className="shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
            <LogOut size={15} />
          </button>
        </div>

        <div className="hidden md:flex justify-end px-6 pt-4">
          <button onClick={signOut} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1.5">
            <LogOut size={13} /> Keluar
          </button>
        </div>

        <div key={panelKey} className="panel-enter flex-1 min-h-0">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
