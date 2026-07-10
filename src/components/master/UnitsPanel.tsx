"use client";

import { useEffect, useState } from "react";
import { Branch, Unit } from "@/types";
import { listBranches } from "@/lib/branches";
import { listUnits, createUnit, deleteUnit } from "@/lib/units";
import { Plus, Loader2, Trash2 } from "lucide-react";

export default function UnitsPanel({ branchScope }: { branchScope: string[] }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const allBranches = await listBranches();
      const scoped = branchScope.length ? allBranches.filter((b) => branchScope.includes(b.id)) : allBranches;
      setBranches(scoped);
      if (!branchId && scoped.length) setBranchId(scoped[0].id);
      setUnits(await listUnits());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !branchId) return;
    setBusy(true);
    setError(null);
    try {
      await createUnit({ branch_id: branchId, name, code, type });
      setName(""); setCode(""); setType("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah unit.");
    } finally {
      setBusy(false);
    }
  }

  const visibleUnits = units.filter((u) => branches.some((b) => b.id === u.branch_id));

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold text-slate-900 mb-4">Master Data Unit</h1>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6 bg-white p-4 rounded-xl border border-slate-200">
        <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama unit" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kode/plat (opsional)" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Jenis (opsional)" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        <button disabled={busy} className="sm:col-span-4 justify-self-start px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Tambah Unit
        </button>
      </form>
      {error && <p className="text-xs text-danger mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {visibleUnits.length === 0 && <p className="p-4 text-sm text-slate-400">Belum ada unit.</p>}
          {visibleUnits.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{u.name} {u.code && <span className="text-slate-400 font-normal">· {u.code}</span>}</p>
                <p className="text-xs text-slate-400">{branches.find((b) => b.id === u.branch_id)?.name ?? "-"} {u.type && `· ${u.type}`}</p>
              </div>
              <button onClick={async () => { await deleteUnit(u.id); load(); }} className="text-slate-400 hover:text-danger">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
