insert into storage.buckets (id, name, public)
values
  ('servicios', 'servicios', false),
  ('bitacoras', 'bitacoras', false),
  ('firmas', 'firmas', false)
on conflict (id) do nothing;

drop policy if exists staff_read_servicios_bucket on storage.objects;
create policy staff_read_servicios_bucket
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'servicios');

drop policy if exists staff_insert_servicios_bucket on storage.objects;
create policy staff_insert_servicios_bucket
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'servicios');

drop policy if exists staff_update_servicios_bucket on storage.objects;
create policy staff_update_servicios_bucket
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'servicios')
  with check (bucket_id = 'servicios');

drop policy if exists staff_delete_servicios_bucket on storage.objects;
create policy staff_delete_servicios_bucket
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'servicios');

drop policy if exists staff_read_bitacoras_bucket on storage.objects;
create policy staff_read_bitacoras_bucket
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'bitacoras');

drop policy if exists staff_insert_bitacoras_bucket on storage.objects;
create policy staff_insert_bitacoras_bucket
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'bitacoras');

drop policy if exists staff_update_bitacoras_bucket on storage.objects;
create policy staff_update_bitacoras_bucket
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'bitacoras')
  with check (bucket_id = 'bitacoras');

drop policy if exists staff_delete_bitacoras_bucket on storage.objects;
create policy staff_delete_bitacoras_bucket
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'bitacoras');

drop policy if exists staff_read_firmas_bucket on storage.objects;
create policy staff_read_firmas_bucket
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'firmas');

drop policy if exists staff_insert_firmas_bucket on storage.objects;
create policy staff_insert_firmas_bucket
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'firmas');

drop policy if exists staff_update_firmas_bucket on storage.objects;
create policy staff_update_firmas_bucket
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'firmas')
  with check (bucket_id = 'firmas');

drop policy if exists staff_delete_firmas_bucket on storage.objects;
create policy staff_delete_firmas_bucket
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'firmas');
