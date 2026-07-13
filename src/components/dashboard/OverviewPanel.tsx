"use client";

import { useEffect, useState } from "react";
import { ServiceTicket, TICKET_STATUS_LABEL, TICKET_STATUS_ORDER } from "@/types";
import { listTickets, isStalled, ticketAgeDays } from "@/lib/tickets";
import { useAuth } from "@/lib/auth";
import { AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function OverviewPanel({ onNavigate }: { onNavigate?: (v: any) => void }) {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const scope = profile?.branch_scope ?? [];

  useEffect(() => {
    listTickets().then((rows) => {
      setTickets(scope.length ? rows.filter((t) => scope.includes(t.branch_id)) : rows);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = TICKET_STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = tickets.filter((t) => t.status === s).length;
    return acc;
  }, {});
  const stalledTickets = tickets.filter(isStalled).sort((a, b) => ticketAgeDays(b) - ticketAgeDays(a));

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold text-slate-900 mb-1">Ringkasan</h1>
      <p className="text-sm text-slate-500 mb-5">Selamat datang{profile?.full_name ? `, ${profile.full_name}` : ""}.</p>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {TICKET_STATUS_ORDER.map((s) => (
              <div key={s} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-2xl font-bold text-slate-900">{counts[s] ?? 0}</p>
                <p className="text-xs text-slate-500">{TICKET_STATUS_LABEL[s]}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-500" />
              <p className="text-sm font-semibold text-slate-900">Tiket Macet (belum update &gt;3 hari)</p>
            </div>
            {stalledTickets.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-400">Tidak ada tiket macet. Mantap!</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {stalledTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onNavigate?.("tickets-list")}
                    className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.no_service} · {t.kode_barang}</p>
                      <p className="text-xs text-slate-400">{t.branch_name} · SN {t.serial_number} · dilapor {formatDate(t.created_at)}</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 shrink-0">{ticketAgeDays(t)} hari</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
