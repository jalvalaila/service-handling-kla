export type TicketStatus = "baru" | "diproses" | "tunggu_sparepart" | "selesai";

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  baru: "Baru",
  diproses: "On Progress",
  tunggu_sparepart: "Tunggu Sparepart",
  selesai: "Selesai",
};

export const TICKET_STATUS_ORDER: TicketStatus[] = ["baru", "diproses", "tunggu_sparepart", "selesai"];

export interface Branch {
  id: string;
  name: string;
  code: string;
  wa_number: string | null;
  is_active: boolean;
  created_at: string;
}

export type ServiceCategory = "stok" | "user";

export const SERVICE_CATEGORY_LABEL: Record<ServiceCategory, string> = {
  stok: "Stok",
  user: "User",
};

export interface ServiceTicket {
  id: string;
  no_service: string;
  branch_id: string;
  kategori: ServiceCategory;
  kode_barang: string;
  serial_number: string;
  status: TicketStatus;
  estimasi: string | null;
  posisi_unit: string | null;
  keterangan: string | null;
  reported_by: string | null;
  reported_by_name: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  // joined fields (filled client-side)
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
