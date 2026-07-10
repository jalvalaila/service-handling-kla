export type TicketStatus = "baru" | "diproses" | "tunggu_sparepart" | "selesai";

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  baru: "Baru",
  diproses: "Diproses",
  tunggu_sparepart: "Tunggu Sparepart",
  selesai: "Selesai",
};

export const TICKET_STATUS_ORDER: TicketStatus[] = ["baru", "diproses", "tunggu_sparepart", "selesai"];

export type TicketPriority = "rendah" | "normal" | "tinggi" | "urgent";

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  rendah: "Rendah",
  normal: "Normal",
  tinggi: "Tinggi",
  urgent: "Urgent",
};

export interface Branch {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface Unit {
  id: string;
  branch_id: string;
  name: string;
  code: string | null;
  type: string | null;
  created_at: string;
}

export interface ServiceTicket {
  id: string;
  branch_id: string;
  unit_id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  reported_by: string | null;
  reported_by_name: string | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  // joined fields (filled client-side)
  unit_name?: string;
  branch_name?: string;
}

export interface TicketUpdate {
  id: string;
  ticket_id: string;
  note: string;
  status_from: TicketStatus | null;
  status_to: TicketStatus | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}
