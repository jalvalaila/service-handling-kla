"use client";

import { useEffect, useState } from "react";
import { Branch, Unit, TicketPriority, PRIORITY_LABEL } from "@/types";
import { listBranches } from "@/lib/branches";
import { listUnits } from "@/lib/units";
import { createTicket } from "@/lib/tickets";
import { useAuth } from "@/lib/auth";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function NewTicketPanel() {
  const { profile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [branchId, setBranchId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const scope = profile?.branch_scope ?? [];

  useEffect(() => {
    (async () => {
      const all = await listBranches();
      const scoped = scope.length ? all.filter((b) => scope.includes(b.id)) : all;
      setBranches(scoped);
      if (scoped.length) setBranchId(scoped[0].id);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!branchId) return;
    listUnits(branchId).then(setUnits);
    setUnitId("");
  }, [branchId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !branchId || !unitId || !title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createTicket({
        branch_id: branchId,
        unit_id: unitId,
        title,
        description,
        priority,
        reported_by: profile.id,
        reported_by_name: profile.full_name ?? profile.email ?? "-",
      });
      setDone(true);
      setTitle("");
      setDescription("");
      setPriority("normal");
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat tiket.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full max-w-xl">
      <h1 className="text-lg font-bold text-slate-900 mb-1">Lapor Unit Bermasalah</h1>
      <p className="text-sm text-slate-500 mb-5">Isi laporan, tim akan follow up progresnya lewat tiket ini.</p>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Cabang</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Unit</label>
          <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
            <option value="">-- pilih unit --</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.name}{u.code ? ` (${u.code})` : ""}</option>)}
          </select>
          {units.length === 0 && branchId && (
            <p className="text-xs text-amber-600 mt-1">Belum ada unit terdaftar di cabang ini — tambahkan dulu di Master Data &gt; Unit.</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Judul masalah</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: AC tidak dingin" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Detail (opsional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Prioritas</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPriority(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  priority === p ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600"
                }`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        {done && (
          <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={13} /> Tiket berhasil dibuat.</p>
        )}

        <button
          disabled={busy || !unitId}
          className="px-4 py-2.5 rounded-lg bg-brand text-slate-900 text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          Buat Tiket
        </button>
      </form>
    </div>
  );
}
