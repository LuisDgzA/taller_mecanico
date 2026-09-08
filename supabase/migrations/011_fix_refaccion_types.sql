-- The refaccion/refaccion_kardex tables were originally created via the
-- dashboard UI with mismatched column types (boolean/varchar) instead of
-- the smallint types the app expects. Normalize them here.

-- refaccion_con_stock depends on refaccion.status, so it must be dropped
-- before the column type can change and recreated afterwards.
drop view if exists public.refaccion_con_stock;

alter table public.refaccion
  alter column status drop default;
alter table public.refaccion
  alter column status type smallint using (case when status::text in ('1', 'true', 't') then 1 else 0 end);
alter table public.refaccion
  alter column status set default 1;
alter table public.refaccion
  drop constraint if exists refaccion_status_check;
alter table public.refaccion
  add constraint refaccion_status_check check (status in (0, 1));

alter table public.refaccion_kardex
  alter column tipo type smallint using (tipo::smallint);
alter table public.refaccion_kardex
  drop constraint if exists refaccion_kardex_tipo_check;
alter table public.refaccion_kardex
  add constraint refaccion_kardex_tipo_check check (tipo in (1, -1));

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

