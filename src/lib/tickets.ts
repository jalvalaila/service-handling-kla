import { supabase } from "./supabase";
import { Branch, ServiceTicket, TicketUpdate, TicketStatus, ServiceCategory } from "@/types";

// ─── List tickets (joined with branch name for display) ──────────────────
export async function listTickets(filters?: {
  branchId?: string;
  status?: TicketStatus;
  kategori?: ServiceCategory;
}): Promise<ServiceTicket[]> {
  let q = supabase
    .from("service_tickets")
    .select("*, branches(name)")
    .order("created_at", { ascending: false });

  if (filters?.branchId) q = q.eq("branch_id", filters.branchId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.kategori) q = q.eq("kategori", filters.kategori);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    branch_name: row.branches?.name ?? "-",
  })) as ServiceTicket[];
}

export async function getTicket(id: string): Promise<ServiceTicket | null> {
  const { data, error } = await supabase
    .from("service_tickets")
    .select("*, branches(name)")
    .eq("id", id)
    .single();
  if (error) return null;
  return { ...data, branch_name: data.branches?.name ?? "-" } as ServiceTicket;
}

export async function createTicket(input: {
  no_service: string;
  branch_id: string;
  kategori: ServiceCategory;
  kode_barang: string;
  serial_number: string;
  status?: TicketStatus;
  posisi_unit?: string;
  keterangan?: string;
  reported_by: string;
  reported_by_name: string;
}): Promise<ServiceTicket> {
  const { data, error } = await supabase
    .from("service_tickets")
    .insert({
      no_service: input.no_service.trim(),
      branch_id: input.branch_id,
      kategori: input.kategori,
      kode_barang: input.kode_barang.trim(),
      serial_number: input.serial_number.trim(),
      status: input.status ?? "baru",
      posisi_unit: input.posisi_unit?.trim() || null,
      keterangan: input.keterangan?.trim() || null,
      reported_by: input.reported_by,
      reported_by_name: input.reported_by_name,
    })
    .select()
    .single();
  if (error) throw error;

  await addTicketUpdate(data.id, {
    note: "Tiket dibuat",
    status_from: null,
    status_to: data.status,
    created_by: input.reported_by,
    created_by_name: input.reported_by_name,
  });

  return data as ServiceTicket;
}

// ─── Update status + write a follow-up log entry in one call ────────────────
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  note: string,
  actor: { id: string; name: string }
): Promise<void> {
  const { data: current, error: fetchErr } = await supabase
    .from("service_tickets")
    .select("status")
    .eq("id", ticketId)
    .single();
  if (fetchErr) throw fetchErr;

  const patch: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };
  if (newStatus === "selesai") patch.resolved_at = new Date().toISOString();

  const { error } = await supabase.from("service_tickets").update(patch).eq("id", ticketId);
  if (error) throw error;

  await addTicketUpdate(ticketId, {
    note,
    status_from: current?.status ?? null,
    status_to: newStatus,
    created_by: actor.id,
    created_by_name: actor.name,
  });
}

// ─── Add a follow-up note without changing status ────────────────────────────
export async function addFollowUpNote(ticketId: string, note: string, actor: { id: string; name: string }): Promise<void> {
  await addTicketUpdate(ticketId, {
    note,
    status_from: null,
    status_to: null,
    created_by: actor.id,
    created_by_name: actor.name,
  });
  await supabase.from("service_tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
}

async function addTicketUpdate(
  ticketId: string,
  entry: { note: string; status_from: TicketStatus | null; status_to: TicketStatus | null; created_by: string | null; created_by_name: string | null }
): Promise<void> {
  const { error } = await supabase.from("ticket_updates").insert({ ticket_id: ticketId, ...entry });
  if (error) throw error;
}

export async function listTicketUpdates(ticketId: string): Promise<TicketUpdate[]> {
  const { data, error } = await supabase
    .from("ticket_updates")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TicketUpdate[];
}

// ─── Aging helper: how many days a ticket has sat without being resolved ────
export function ticketAgeDays(ticket: ServiceTicket): number {
  const start = new Date(ticket.created_at).getTime();
  const end = ticket.resolved_at ? new Date(ticket.resolved_at).getTime() : Date.now();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

// Tiket dianggap "macet" kalau masih terbuka dan sudah lebih dari N hari sejak update terakhir.
export function isStalled(ticket: ServiceTicket, staleDays = 3): boolean {
  if (ticket.status === "selesai") return false;
  const lastUpdate = new Date(ticket.updated_at).getTime();
  const days = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
  return days >= staleDays;
}

// ─── Excel import ────────────────────────────────────────────────────────
// Kolom sumber: #, No. Service, Kode Barang, SN, Cabang, Status, Lama di-service, Est, Posisi Unit, Keterangan
export interface ExcelImportRow {
  noService: string;
  kodeBarang: string;
  serialNumber: string;
  cabangName: string;
  statusRaw: string;
  lamaDiservice: number | null;
  estimasi: string | null;
  posisiUnit: string | null;
  keterangan: string | null;
}

export interface ImportResult {
  inserted: number;
  updated: number;
  skipped: { row: number; noService: string; reason: string }[];
}

function mapExcelStatus(raw: string | null | undefined): TicketStatus {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v || v === "-") return "baru";
  if (v.includes("progress") || v.includes("proses")) return "diproses";
  if (v.includes("sparepart") || v.includes("spare part") || v.includes("tunggu")) return "tunggu_sparepart";
  if (v.includes("selesai") || v.includes("done") || v.includes("beres")) return "selesai";
  return "baru";
}

export async function importTicketsFromExcel(
  rows: ExcelImportRow[],
  kategori: ServiceCategory,
  branches: Branch[],
  actor: { id: string; name: string }
): Promise<ImportResult> {
  const branchByName = new Map(branches.map((b) => [b.name.trim().toLowerCase(), b]));
  const result: ImportResult = { inserted: 0, updated: 0, skipped: [] };

  const validRows: { row: ExcelImportRow; index: number; branch: Branch }[] = [];
  rows.forEach((row, index) => {
    if (!row.noService?.trim()) {
      result.skipped.push({ row: index + 1, noService: row.noService || "-", reason: "No. Service kosong" });
      return;
    }
    const branch = branchByName.get(row.cabangName?.trim().toLowerCase());
    if (!branch) {
      result.skipped.push({ row: index + 1, noService: row.noService, reason: `Cabang "${row.cabangName}" tidak ditemukan di Master Data Cabang` });
      return;
    }
    validRows.push({ row, index, branch });
  });

  if (validRows.length === 0) return result;

  const noServiceList = validRows.map((v) => v.row.noService.trim());
  const { data: existing, error: existingErr } = await supabase
    .from("service_tickets")
    .select("id, no_service")
    .in("no_service", noServiceList);
  if (existingErr) throw existingErr;

  const existingByNoService = new Map((existing ?? []).map((r: any) => [r.no_service, r.id]));

  const toInsert: Record<string, unknown>[] = [];
  const toUpdate: { id: string; patch: Record<string, unknown> }[] = [];

  for (const { row, branch } of validRows) {
    const status = mapExcelStatus(row.statusRaw);
    const existingId = existingByNoService.get(row.noService.trim());

    const commonFields = {
      branch_id: branch.id,
      kategori,
      kode_barang: row.kodeBarang?.trim() || "-",
      serial_number: row.serialNumber?.trim() || "-",
      status,
      estimasi: row.estimasi?.trim() && row.estimasi.trim() !== "-" ? row.estimasi.trim() : null,
      posisi_unit: row.posisiUnit?.trim() || null,
      keterangan: row.keterangan?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (existingId) {
      toUpdate.push({ id: existingId as string, patch: commonFields });
    } else {
      const lama = row.lamaDiservice ?? 0;
      const createdAt = new Date(Date.now() - lama * 24 * 60 * 60 * 1000).toISOString();
      toInsert.push({
        no_service: row.noService.trim(),
        ...commonFields,
        created_at: createdAt,
        reported_by: actor.id,
        reported_by_name: actor.name,
      });
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from("service_tickets").insert(toInsert);
    if (error) throw error;
    result.inserted = toInsert.length;
  }

  for (const { id, patch } of toUpdate) {
    const { error } = await supabase.from("service_tickets").update(patch).eq("id", id);
    if (error) throw error;
  }
  result.updated = toUpdate.length;

  return result;
}
