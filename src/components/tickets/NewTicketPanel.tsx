"use client";

import { useEffect, useState } from "react";
import { Branch, ServiceCategory, SERVICE_CATEGORY_LABEL, TicketStatus, TICKET_STATUS_LABEL, TICKET_STATUS_ORDER } from "@/types";
import { listBranches } from "@/lib/branches";
import { createTicket } from "@/lib/tickets";
import { useAuth } from "@/lib/auth";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function NewTicketPanel() {
  const { profile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [kategori, setKategori] = useState<ServiceCategory>("stok");
  const [noService, setNoService] = useState("");
  const [kodeBarang, setKodeBarang] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState<TicketStatus>("baru");
  const [posisiUnit, setPosisiUnit] = useState("");
  const [keterangan, setKeterangan] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !branchId || !noService.trim() || !kodeBarang.trim() || !serialNumber.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createTicket({
        no_service: noService,
        branch_id: branchId,
        kategori,
        kode_barang: kodeBarang,
        serial_number: serialNumber,
        status,
        posisi_unit: posisiUnit,
        keterangan,
        reported_by: profile.id,
        reported_by_name: profile.full_name ?? profile.email ?? "-",
      });
      setDone(true);
      setNoService("");
      setKodeBarang("");
      setSerialNumber("");
      setStatus("baru");
      setPosisiUnit("");
      setKeterangan("");
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat tiket.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full max-w-xl">
      <h1 className="text-lg font-bold text-slate-900 mb-1">Lapor Unit Servis</h1>
      <p className="text-sm text-slate-500 mb-5">Isi laporan, tim akan follow up progresnya lewat tiket ini.</p>

      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Cabang</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
          <div className="flex gap-2">
            {(Object.keys(SERVICE_CATEGORY_LABEL) as ServiceCategory[]).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setKategori(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  kategori === k ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600"
                }`}
              >
                {SERVICE_CATEGORY_LABEL[k]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">No. Service</label>
          <input value={noService} onChange={(e) => setNoService(e.target.value)} placeholder="Contoh: SRV/00051/202607" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Kode Barang</label>
          <input value={kodeBarang} onChange={(e) => setKodeBarang(e.target.value)} placeholder="Contoh: Aspire Lite AL14-32P-370Z" required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">SN (Serial Number)</label>
          <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
            {TICKET_STATUS_ORDER.map((s) => <option key={s} value={s}>{TICKET_STATUS_LABEL[s]}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Posisi Unit (opsional)</label>
          <input value={posisiUnit} onChange={(e) => setPosisiUnit(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Keterangan</label>
          <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} placeholder="Kendala/masalah unit" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        {done && (
          <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={13} /> Tiket berhasil dibuat.</p>
        )}

        <button
          disabled={busy || !branchId}
          className="px-4 py-2.5 rounded-lg bg-brand text-slate-900 text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          Buat Tiket
        </button>
      </form>
    </div>
  );
}
