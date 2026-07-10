-- ============================================================
-- ServiceTrack — Master Data (Cabang & Unit) setup
-- Jalankan SETELAH supabase-auth-setup.sql
-- ============================================================

-- Cabang
create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        text not null unique,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.branches enable row level security;

drop policy if exists branches_select on public.branches;
create policy branches_select on public.branches
  for select using ( auth.uid() is not null );

drop policy if exists branches_write on public.branches;
create policy branches_write on public.branches
  for all using ( public.is_super_admin() ) with check ( public.is_super_admin() );
-- Catatan: kalau mau Admin (bukan cuma Super Admin) juga bisa tambah cabang,
-- ganti kondisi di atas jadi: public.is_super_admin() or exists (select 1 from
-- public.profiles where id = auth.uid() and role in ('super_admin','admin'))

-- Unit
create table if not exists public.units (
  id          uuid primary key default gen_random_uuid(),
  branch_id   uuid not null references public.branches(id) on delete cascade,
  name        text not null,
  code        text,
  type        text,
  created_at  timestamptz not null default now()
);

alter table public.units enable row level security;

drop policy if exists units_select on public.units;
create policy units_select on public.units
  for select using ( auth.uid() is not null );

drop policy if exists units_write on public.units;
create policy units_write on public.units
  for all using ( auth.uid() is not null ) with check ( auth.uid() is not null );
-- Semua user login boleh tambah/edit unit (staff cabang sering yang paling tahu
-- unit apa saja yang ada). Perketat kalau perlu.
