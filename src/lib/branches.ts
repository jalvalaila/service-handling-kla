import { supabase } from "./supabase";
import { Branch } from "@/types";

export async function listBranches(): Promise<Branch[]> {
  const { data, error } = await supabase.from("branches").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function createBranch(name: string, code: string): Promise<Branch> {
  const { data, error } = await supabase
    .from("branches")
    .insert({ name: name.trim(), code: code.trim().toUpperCase() })
    .select()
    .single();
  if (error) throw error;
  return data as Branch;
}

export async function setBranchActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("branches").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}
