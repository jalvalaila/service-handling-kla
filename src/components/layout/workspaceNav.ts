export type ViewId =
  | "dash-overview"
  | "tickets-list"
  | "tickets-new"
  | "master-branches"
  | "master-units"
  | "admin-users";

export interface NavItem {
  id: ViewId;
  label: string;
  shortLabel?: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    items: [{ id: "dash-overview", label: "Ringkasan" }],
  },
  {
    id: "tickets",
    label: "Servis Unit",
    items: [
      { id: "tickets-list", label: "Daftar Tiket", shortLabel: "Tiket" },
      { id: "tickets-new", label: "Lapor Unit Baru", shortLabel: "Lapor" },
    ],
  },
  {
    id: "master",
    label: "Master Data",
    items: [
      { id: "master-branches", label: "Cabang", shortLabel: "Cabang" },
      { id: "master-units", label: "Unit", shortLabel: "Unit" },
    ],
  },
];

export const ADMIN_SECTION: NavSection = {
  id: "admin",
  label: "Admin",
  items: [{ id: "admin-users", label: "Kelola Akun" }],
};

export function findSection(sections: NavSection[], view: ViewId): NavSection | undefined {
  return sections.find((s) => s.items.some((i) => i.id === view));
}
