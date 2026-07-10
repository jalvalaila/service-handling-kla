"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Loader2, Wrench } from "lucide-react";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      } else {
        const { error, needsConfirm } = await signUp(email, password, fullName);
        if (error) setError(error);
        else if (needsConfirm) setInfo("Cek email kamu untuk konfirmasi akun.");
        else setInfo("Akun dibuat. Menunggu persetujuan Super Admin sebelum bisa masuk.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-main-bg px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <span className="w-10 h-10 rounded-full bg-brand flex items-center justify-center">
            <Wrench size={18} className="text-slate-900" />
          </span>
          <h1 className="text-lg font-bold text-slate-900">ServiceTrack</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "up" && (
            <input
              type="text"
              placeholder="Nama lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />

          {error && <p className="text-xs text-danger">{error}</p>}
          {info && <p className="text-xs text-emerald-600">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === "in" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(null); setInfo(null); }}
          className="w-full text-center text-xs text-slate-500 mt-4 hover:text-slate-800"
        >
          {mode === "in" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </div>
  );
}
