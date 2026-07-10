import { supabase } from "./supabase";
import { ServiceTicket, TicketUpdate, TicketStatus, TicketPriority } from "@/types";

// ─── List tickets (joined with unit + branch name for display) ──────────────
export async function listTickets(filters?: {
  branchId?: string;
  status?: TicketStatus;
}): Promise<ServiceTicket[]> {
  let q = supabase
    .from("service_tickets")
    .select("*, units(name), branches(name)")
    .order("created_at", { ascending: false });

  if (filters?.branchId) q = q.eq("branch_id", filters.branchId);
  if (filters?.status) q = q.eq("status", filters.status);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    unit_name: row.units?.name ?? "-",
    branch_name: row.branches?.name ?? "-",
  })) as ServiceTicket[];
}

export async function getTicket(id: string): Promise<ServiceTicket | null> {
  const { data, error } = await supabase
    .from("service_tickets")
    .select("*, units(name), branches(name)")
    .eq("id", id)
    .single();
  if (error) return null;
  return { ...data, unit_name: data.units?.name ?? "-", branch_name: data.branches?.name ?? "-" } as ServiceTicket;
}

export async function createTicket(input: {
  branch_id: string;
  unit_id: string;
  title: string;
  description?: string;
  priority: TicketPriority;
  reported_by: string;
  reported_by_name: string;
}): Promise<ServiceTicket> {
  const { data, error } = await supabase
    .from("service_tickets")
    .insert({
      branch_id: input.branch_id,
      unit_id: input.unit_id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      priority: input.priority,
      status: "baru",
      reported_by: input.reported_by,
      reported_by_name: input.reported_by_name,
    })
    .select()
    .single();
  if (error) throw error;

  // Initial log entry
  await addTicketUpdate(data.id, {
    note: "Tiket dibuat",
    status_from: null,
    status_to: "baru",
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
