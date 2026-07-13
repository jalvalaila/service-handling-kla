"use client";

import { useEffect, useState } from "react";
import { Branch, ServiceTicket, TicketStatus, TICKET_STATUS_LABEL, TICKET_STATUS_ORDER, ServiceCategory, SERVICE_CATEGORY_LABEL } from "@/types";
import { listBranches } from "@/lib/branches";
import { listTickets, ticketAgeDays, isStalled } from "@/lib/tickets";
import { useAuth } from "@/lib/auth";
import { formatDate, buildWaLink } from "@/lib/utils";
import TicketDetailModal from "./TicketDetailModal";
import { AlertTriangle, MessageCircle } from "lucide-react";

const STATUS_COLOR: Record<TicketStatus, string> = {
  baru: "bg-slate-100 text-slate-600",
  diproses: "bg-blue-100 text-blue-700",
  tunggu_sparepart: "bg-amber-100 text-amber-700",
  selesai: "bg-emerald-100 text-emerald-700",
};

export default function TicketListPanel() {
  const { profile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [kategoriFilter, setKategoriFilter] = useState<ServiceCategory | "">("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ServiceTicket | null>(null);

  const scope = profile?.branch_scope ?? [];

  async function load() {
    setLoading(true);
    try {
      const all = await listBranches();
      setBranches(scope.length ? all.filter((b) => scope.includes(b.id)) : all);
      const rows = await listTickets({
        branchId: branchFilter || undefined,
        status: (statusFilter as TicketStatus) || undefined,
        kategori: (kategoriFilter as ServiceCategory) || undefined,
      });
      setTickets(scope.length ? rows.filter((t) => scope.includes(t.branch_id)) : rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [branchFilter, statusFilter, kategoriFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold text-slate-900 mb-4">Daftar Tiket Servis</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">Semua Cabang</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TicketStatus)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">Semua Status</option>
          {TICKET_STATUS_ORDER.map((s) => <option key={s} value={s}>{TICKET_STATUS_LABEL[s]}</option>)}
        </select>
        <select value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value as ServiceCategory)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">Semua Kategori</option>
          {(Object.keys(SERVICE_CATEGORY_LABEL) as ServiceCategory[]).map((k) => <option key={k} value={k}>{SERVICE_CATEGORY_LABEL[k]}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-slate-400">Tidak ada tiket.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {tickets.map((t) => {
            const stalled = isStalled(t);
            const branch = branches.find((b) => b.id === t.branch_id);
            const waMessage = `Halo ${t.branch_name}, mau follow up progres servis unit.\nNo. Service: *${t.no_service}*\nKode Barang: ${t.kode_barang}\nSN: ${t.serial_number}\nStatus saat ini: *${TICKET_STATUS_LABEL[t.status]}*\nMohon info update-nya ya. Terima kasih.`;
            return (
              <div key={t.id} className="w-full flex items-center justify-between gap-3 hover:bg-slate-50">
                <button
                  onClick={() => setSelected(t)}
                  className="flex-1 min-w-0 text-left px-4 py-3"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-900 truncate">{t.no_service} · {t.kode_barang}</p>
                    {stalled && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {t.branch_name} · {SERVICE_CATEGORY_LABEL[t.kategori]} · SN {t.serial_number} · dilapor {formatDate(t.created_at)} · umur {ticketAgeDays(t)} hari
                  </p>
                </button>

                <div className="flex items-center gap-2 pr-4 shrink-0">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[t.status]}`}>
                    {TICKET_STATUS_LABEL[t.status]}
                  </span>
                  {branch?.wa_number ? (
                    <a
                      href={buildWaLink(branch.wa_number, waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Follow up WA ke ${t.branch_name}`}
                      className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200"
                    >
                      <MessageCircle size={14} />
                    </a>
                  ) : (
                    <span title="Nomor WA cabang belum diisi" className="w-7 h-7 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center">
                      <MessageCircle size={14} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <TicketDetailModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onChanged={() => { load(); }}
        />
      )}
    </div>
  );
}
