export type TicketStatus = "baru" | "diproses" | "tunggu_sparepart" | "selesai";

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  baru: "Baru",
  diproses: "Diproses",
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

export type StokPenjualan = "stok" | "penjualan";

export const STOK_PENJUALAN_LABEL: Record<StokPenjualan, string> = {
  stok: "Stok",
  penjualan: "Penjualan",
};

export interface ServiceTicket {
  id: string;
  branch_id: string;
  tanggal_masuk: string;
  stok_penjualan: StokPenjualan;
  brand: string;
  laptop_type: string;
  serial_number: string;
  kendala: string;
  posisi_unit: string;
  keterangan: string | null;
  status: TicketStatus;
  reported_by: string | null;
  reported_by_name: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
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
