"use client";

import { useEffect, useState } from "react";
import { ServiceTicket, TicketUpdate, TicketStatus, TICKET_STATUS_LABEL, TICKET_STATUS_ORDER, PRIORITY_LABEL } from "@/types";
import { listTicketUpdates, updateTicketStatus, addFollowUpNote } from "@/lib/tickets";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { X, Loader2, Send } from "lucide-react";

const STATUS_COLOR: Record<TicketStatus, string> = {
  baru: "bg-slate-100 text-slate-600",
  diproses: "bg-blue-100 text-blue-700",
  tunggu_sparepart: "bg-amber-100 text-amber-700",
  selesai: "bg-emerald-100 text-emerald-700",
};

export default function TicketDetailModal({
  ticket,
  onClose,
  onChanged,
}: {
  ticket: ServiceTicket;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { profile } = useAuth();
  const [updates, setUpdates] = useState<TicketUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [nextStatus, setNextStatus] = useState<TicketStatus | "">("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setUpdates(await listTicketUpdates(ticket.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const actor = () => ({ id: profile?.id ?? "", name: profile?.full_name ?? profile?.email ?? "-" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim() && !nextStatus) return;
    setBusy(true);
    try {
      if (nextStatus && nextStatus !== ticket.status) {
        await updateTicketStatus(ticket.id, nextStatus, note.trim() || `Status diubah ke ${TICKET_STATUS_LABEL[nextStatus]}`, actor());
      } else if (note.trim()) {
        await addFollowUpNote(ticket.id, note.trim(), actor());
      }
      setNote("");
      setNextStatus("");
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400">{ticket.branch_name} · {ticket.unit_name}</p>
            <h2 className="text-base font-bold text-slate-900">{ticket.title}</h2>
            <div className="flex gap-1.5 mt-1.5">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[ticket.status]}`}>
                {TICKET_STATUS_LABEL[ticket.status]}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {PRIORITY_LABEL[ticket.priority]}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {ticket.description && <p className="text-sm text-slate-600">{ticket.description}</p>}

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-2">Riwayat Follow-up</p>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : updates.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada riwayat.</p>
          ) : (
            <div className="space-y-3 border-l-2 border-slate-100 pl-3">
              {updates.map((u) => (
                <div key={u.id}>
                  <p className="text-xs text-slate-400">{formatDateTime(u.created_at)} · {u.created_by_name ?? "-"}</p>
                  {u.status_to && (
                    <p className="text-xs font-medium text-slate-700">
                      Status → {TICKET_STATUS_LABEL[u.status_to]}
                    </p>
                  )}
                  <p className="text-sm text-slate-700">{u.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-100 px-5 py-4 space-y-2">
          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value as TicketStatus)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          >
            <option value="">-- ubah status (opsional) --</option>
            {TICKET_STATUS_ORDER.map((s) => (
              <option key={s} value={s} disabled={s === ticket.status}>
                {TICKET_STATUS_LABEL[s]}{s === ticket.status ? " (saat ini)" : ""}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan follow-up..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
            <button
              disabled={busy || (!note.trim() && !nextStatus)}
              className="px-3.5 py-2 rounded-lg bg-slate-900 text-white flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
