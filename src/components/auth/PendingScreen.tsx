"use client";

import { useAuth } from "@/lib/auth";
import { Clock3, LogOut } from "lucide-react";

export default function PendingScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-main-bg px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        <span className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock3 size={20} className="text-amber-600" />
        </span>
        <h1 className="text-base font-bold text-slate-900 mb-1">Menunggu Persetujuan</h1>
        <p className="text-sm text-slate-500 mb-6">
          Akun kamu sudah terdaftar tapi belum diaktifkan Super Admin. Hubungi Super Admin untuk mengaktifkan akses.
        </p>
        <button
          onClick={signOut}
          className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> Keluar
        </button>
      </div>
    </div>
  );
}
