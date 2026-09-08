alter table public.refaccion enable row level security;
alter table public.refaccion_kardex enable row level security;

drop policy if exists staff_full_access_refaccion on public.refaccion;
create policy staff_full_access_refaccion
  on public.refaccion
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists staff_full_access_refaccion_kardex on public.refaccion_kardex;
create policy staff_full_access_refaccion_kardex
  on public.refaccion_kardex
  for all
  to authenticated
  using (true)
  with check (true);

-- Read model exposing current stock as the latest kardex "final" value.
create or replace view public.refaccion_con_stock
  with (security_invoker = true) as
select
  r.id,
  r.nombre,
  r.marca,
  r.uuid,
  r.precio,
  r.status,
  coalesce(k.final, 0) as stock
from public.refaccion r
left join lateral (
  select final
  from public.refaccion_kardex
  where refaccion_id = r.id
  order by fecha desc, id desc
  limit 1
) k on true;
