import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── WhatsApp helpers ─────────────────────────────────────────────────────
// Normalizes an Indonesian phone number (08xx, +62xx, 62xx, spaces/dashes) to
// the digits-only 62xx format that wa.me expects.
export function normalizeWaNumber(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, "");
  digits = digits.replace(/^\+/, "");
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

export function buildWaLink(rawNumber: string, message: string): string {
  const number = normalizeWaNumber(rawNumber);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
