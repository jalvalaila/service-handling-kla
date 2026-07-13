"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Branch, ServiceCategory, SERVICE_CATEGORY_LABEL } from "@/types";
import { listBranches } from "@/lib/branches";
import { importTicketsFromExcel, ExcelImportRow, ImportResult } from "@/lib/tickets";
import { useAuth } from "@/lib/auth";
import { UploadCloud, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

const HEADER_ALIASES: Record<string, string> = {
  "no. service": "noService",
  "no service": "noService",
  "kode barang": "kodeBarang",
  sn: "serialNumber",
  cabang: "cabangName",
  status: "statusRaw",
  "lama di-service": "lamaDiservice",
  "lama diservice": "lamaDiservice",
  est: "estimasi",
  "posisi unit": "posisiUnit",
  keterangan: "keterangan",
};

function parseWorkbook(buffer: ArrayBuffer): ExcelImportRow[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });

  const headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => typeof cell === "string" && cell.trim().toLowerCase() === "no. service")
  );
  if (headerRowIndex === -1) {
    throw new Error('Header kolom "No. Service" tidak ditemukan di file ini.');
  }

  const headerRow = rows[headerRowIndex];
  const colMap: Record<number, string> = {};
  headerRow.forEach((cell, idx) => {
    if (typeof cell !== "string") return;
    const key = HEADER_ALIASES[cell.trim().toLowerCase()];
    if (key) colMap[idx] = key;
  });

  const dataRows = rows.slice(headerRowIndex + 1).filter((row) => row.some((c) => c !== null && c !== undefined && c !== ""));

  return dataRows.map((row) => {
    const record: Record<string, unknown> = {};
    row.forEach((cell, idx) => {
      const key = colMap[idx];
      if (key) record[key] = cell;
    });
    const lamaRaw = record.lamaDiservice;
    const lama = typeof lamaRaw === "number" ? lamaRaw : parseInt(String(lamaRaw ?? ""), 10);
    return {
      noService: String(record.noService ?? "").trim(),
      kodeBarang: String(record.kodeBarang ?? "").trim(),
      serialNumber: String(record.serialNumber ?? "").trim(),
      cabangName: String(record.cabangName ?? "").trim(),
      statusRaw: String(record.statusRaw ?? "").trim(),
      lamaDiservice: Number.isFinite(lama) ? lama : null,
      estimasi: record.estimasi != null ? String(record.estimasi).trim() : null,
      posisiUnit: record.posisiUnit != null ? String(record.posisiUnit).trim() : null,
      keterangan: record.keterangan != null ? String(record.keterangan).trim() : null,
    } as ExcelImportRow;
  });
}

function UploadCard({ kategori, label, branches }: { kategori: ServiceCategory; label: string; branches: Branch[] }) {
  const { profile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleFile(file: File) {
    if (!profile) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const rows = parseWorkbook(buffer);
      if (rows.length === 0) throw new Error("Tidak ada baris data yang bisa dibaca dari file ini.");
      const res = await importTicketsFromExcel(rows, kategori, branches, {
        id: profile.id,
        name: profile.full_name ?? profile.email ?? "-",
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-bold text-slate-900 mb-1">{label}</h2>
      <p className="text-xs text-slate-500 mb-3">Kategori: {SERVICE_CATEGORY_LABEL[kategori]}. Kolom harus sesuai format data gudang servis.</p>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
        {busy ? "Memproses..." : "Pilih file Excel"}
      </button>

      {error && (
        <p className="mt-3 text-xs text-danger flex items-center gap-1"><AlertTriangle size={13} /> {error}</p>
      )}

      {result && (
        <div className="mt-3 text-xs space-y-1.5">
          <p className="text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={13} /> {result.inserted} tiket baru, {result.updated} tiket diperbarui.
          </p>
          {result.skipped.length > 0 && (
            <div className="text-amber-600">
              <p className="font-medium flex items-center gap-1"><AlertTriangle size={13} /> {result.skipped.length} baris dilewati:</p>
              <ul className="list-disc list-inside pl-1">
                {result.skipped.slice(0, 10).map((s) => (
                  <li key={s.row}>Baris {s.row} ({s.noService}): {s.reason}</li>
                ))}
              </ul>
              {result.skipped.length > 10 && <p>...dan {result.skipped.length - 10} lainnya.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImportPanel() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBranches().then((b) => {
      setBranches(b);
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full max-w-2xl">
      <h1 className="text-lg font-bold text-slate-900 mb-1">Import Excel</h1>
      <p className="text-sm text-slate-500 mb-5">
        Upload data dari file data gudang servis. Cabang di kolom &quot;Cabang&quot; dicocokkan dengan nama di Master Data Cabang —
        pastikan nama cabang sudah terdaftar dulu. Tiket dengan No. Service yang sama akan diperbarui, bukan diduplikasi.
      </p>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat data cabang...</p>
      ) : branches.length === 0 ? (
        <p className="text-sm text-amber-600">Belum ada cabang terdaftar. Tambahkan dulu di Master Data &gt; Cabang.</p>
      ) : (
        <div className="space-y-4">
          <UploadCard kategori="stok" label="Import Service Stok" branches={branches} />
          <UploadCard kategori="user" label="Import Service User" branches={branches} />
        </div>
      )}
    </div>
  );
}
