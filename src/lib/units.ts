import { supabase } from "./supabase";
import { Unit } from "@/types";

export async function listUnits(branchId?: string): Promise<Unit[]> {
  let q = supabase.from("units").select("*").order("name", { ascending: true });
  if (branchId) q = q.eq("branch_id", branchId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Unit[];
}

export async function createUnit(input: { branch_id: string; name: string; code?: string; type?: string }): Promise<Unit> {
  const { data, error } = await supabase
    .from("units")
    .insert({
      branch_id: input.branch_id,
      name: input.name.trim(),
      code: input.code?.trim() || null,
      type: input.type?.trim() || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Unit;
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}
