-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user_free', 
  updated_at timestamp with time zone
);

-- 2. Health Reports Table
create table public.health_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  input_text text,
  input_summary text,
  input_type text,
  ai_summary text,
  ai_details text,
  ai_recommendations text,
  preliminary_concern text,
  custom_title text,
  user_notes text,
  concern_override text,
  due_date timestamp with time zone,
  has_images boolean default false,
  has_audio boolean default false,
  has_documents boolean default false,
  status text default 'pending',
  meta jsonb,
  flagged boolean default false
);

-- 3. Health Files Table
create table public.health_files (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.health_reports on delete cascade,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  file_type text,
  storage_path text not null,
  original_name text,
  mime_type text,
  size_bytes bigint
);

-- 4. Security Audit Logs (Admin Only)
create table public.security_audit_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  event_type text,
  severity text,
  user_id uuid,
  user_email text,
  details jsonb
);

-- 5. Storage Buckets
insert into storage.buckets (id, name, public) values ('health_files', 'health_files', false);
