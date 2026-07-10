"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile, Role } from "@/lib/auth";
import { Branch } from "@/types";
import { listBranches } from "@/lib/branches";
import { Loader2, Plus, Copy, Check } from "lucide-react";

export default function UserManagementPanel() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [branchScope, setBranchScope] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [{ data: profs }, br] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        listBranches(),
      ]);
      setUsers((profs ?? []) as Profile[]);
      setBranches(br);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(u: Profile) {
    await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id);
    load();
  }

  async function updateRole(u: Profile, newRole: Role) {
    await supabase.from("profiles").update({ role: newRole }).eq("id", u.id);
    load();
  }

  function toggleScope(id: string) {
    setBranchScope((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, fullName, role, branchScope }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Gagal membuat akun.");
        return;
      }
      setCreated({ email: json.email, password: json.password });
      setEmail(""); setFullName(""); setRole("staff"); setBranchScope([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat akun.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 md:p-6 overflow-y-auto h-full">
      <h1 className="text-lg font-bold text-slate-900 mb-4">Kelola Akun</h1>

      <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl border border-slate-200 mb-6 space-y-3">
        <p className="text-sm font-semibold text-slate-900">Buat Akun Baru</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama lengkap" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-1.5">Batasi ke cabang (kosongkan = semua cabang)</p>
          <div className="flex flex-wrap gap-1.5">
            {branches.map((b) => (
              <button
                type="button"
                key={b.id}
                onClick={() => toggleScope(b.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                  branchScope.includes(b.id) ? "bg-slate-900 text-white border-slate-900" : "border-slate-200 text-slate-600"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
        {created && (
          <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between gap-2">
            <span>
              Akun dibuat: <b>{created.email}</b> / password: <b>{created.password}</b> (catat &amp; kirim ke user)
            </span>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(created.password); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="shrink-0 text-emerald-700"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}

        <button disabled={busy} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-60">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Buat Akun
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat...</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{u.full_name || "-"}</p>
                <p className="text-xs text-slate-400">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={u.role} onChange={(e) => updateRole(u, e.target.value as Role)} className="text-xs px-2 py-1 rounded-lg border border-slate-200">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <button
                  onClick={() => toggleActive(u)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {u.is_active ? "Aktif" : "Nonaktif"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
