alter table public.usuarios enable row level security;
alter table public.clientes enable row level security;
alter table public.vehiculos enable row level security;
alter table public.servicios enable row level security;
alter table public.bitacoras enable row level security;
alter table public.cliente_portal_links enable row level security;

drop policy if exists staff_full_access_usuarios on public.usuarios;
create policy staff_full_access_usuarios
  on public.usuarios
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists staff_full_access_clientes on public.clientes;
create policy staff_full_access_clientes
  on public.clientes
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists staff_full_access_vehiculos on public.vehiculos;
create policy staff_full_access_vehiculos
  on public.vehiculos
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists staff_full_access_servicios on public.servicios;
create policy staff_full_access_servicios
  on public.servicios
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists staff_full_access_bitacoras on public.bitacoras;
create policy staff_full_access_bitacoras
  on public.bitacoras
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists staff_full_access_cliente_portal_links on public.cliente_portal_links;
create policy staff_full_access_cliente_portal_links
  on public.cliente_portal_links
  for all
  to authenticated
  using (true)
  with check (true);
