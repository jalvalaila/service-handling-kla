"use client";

import { useEffect, useState } from "react";
import { Branch } from "@/types";
import { listBranches, createBranch, setBranchActive, updateBranchWaNumber } from "@/lib/branches";
import { Plus, Loader2, MessageCircle, Check } from "lucide-react";

export default function BranchesPanel() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingWaId, setEditingWaId] = useState<string | null>(null);
  const [editingWaValue, setEditingWaValue] = useState("");

  async function load() {
    setLoading(true);
    try {
      setBranches(await listBranches());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createBranch(name, code, waNumber);
      setName("");
      setCode("");
      setWaNumber("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah cabang.");
    } finally {
      setBusy(false);
    }
  }

  async function saveWaNumber(id: string) {
    await updateBranchWaNumber(id, editingWaValue);
    setEditingWaId(null);
    load();
  }

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold text-slate-900 mb-4">Master Data Cabang</h1>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6 bg-white p-4 rounded-xl border border-slate-200">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama cabang"
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Kode (mis. JKT01)"
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        />
        <input
          value={waNumber}
          onChange={(e) => setWaNumber(e.target.value)}
          placeholder="No. WA (mis. 08123456789)"
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
        />
        <button
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Tambah
        </button>
      </form>
      {error && <p className="text-xs text-danger mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {branches.length === 0 && <p className="p-4 text-sm text-slate-400">Belum ada cabang.</p>}
          {branches.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-400">{b.code}</p>
              </div>

              <div className="flex items-center gap-2">
                {editingWaId === b.id ? (
                  <>
                    <input
                      autoFocus
                      value={editingWaValue}
                      onChange={(e) => setEditingWaValue(e.target.value)}
                      placeholder="08123456789"
                      className="w-36 px-2 py-1 rounded-lg border border-slate-200 text-xs"
                    />
                    <button onClick={() => saveWaNumber(b.id)} className="text-emerald-600">
                      <Check size={15} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setEditingWaId(b.id); setEditingWaValue(b.wa_number ?? ""); }}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    <MessageCircle size={13} />
                    {b.wa_number || "Belum ada no. WA"}
                  </button>
                )}

                <button
                  onClick={async () => { await setBranchActive(b.id, !b.is_active); load(); }}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    b.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {b.is_active ? "Aktif" : "Nonaktif"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

