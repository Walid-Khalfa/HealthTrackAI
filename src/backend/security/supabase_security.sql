-- RLS Policies for public.profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete own profile" on public.profiles for delete
  using (auth.uid() = id);


-- RLS Policies for public.health_reports
alter table public.health_reports enable row level security;

create policy "Users can view own reports" on public.health_reports for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reports" on public.health_reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reports" on public.health_reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own reports" on public.health_reports for delete
  using (auth.uid() = user_id);


-- RLS Policies for public.health_files
alter table public.health_files enable row level security;

create policy "Users can view own files" on public.health_files for select
  using (auth.uid() = user_id);

create policy "Users can insert their own files" on public.health_files for insert
  with check (auth.uid() = user_id);

create policy "Users can update own files" on public.health_files for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own files" on public.health_files for delete
  using (auth.uid() = user_id);


-- RLS Policies for public.security_audit_logs
alter table public.security_audit_logs enable row level security;

create policy "Authenticated users can insert audit logs" on public.security_audit_logs for insert
  with check (auth.role() = 'authenticated');

-- Admin select policy for audit logs (requires a custom function or role check)
-- For a real application, consider a dedicated admin role rather than service_role
-- or a specific hardcoded UID for admin access to audit logs.
-- Example: create policy "Admins can view audit logs" on public.security_audit_logs for select using (is_admin(auth.uid()));
-- For now, no SELECT policy to maintain audit log integrity from client-side access.


-- Storage RLS Policies for 'health_files' bucket
-- Important: storage.buckets (health_files) was set to public: false in db_setup.sql

-- Policy for INSERT (Upload)
create policy "Users can upload their own files" on storage.objects for insert
  with check (bucket_id = 'health_files' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Policy for SELECT (Download)
create policy "Users can view their own files" on storage.objects for select
  using (bucket_id = 'health_files' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Policy for DELETE
create policy "Users can delete their own files" on storage.objects for delete
  using (bucket_id = 'health_files' AND auth.uid()::text = (storage.foldername(name))[2]);

-- No UPDATE policy for storage objects as files are generally immutable after upload
