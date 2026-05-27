-- Seed base para un entorno local de Supabase.
-- Los usuarios internos NO se deben insertar aquí por separado, porque el login
-- real depende de auth.users. Crea esas cuentas con el script
-- `npm run create:admin -- --email=... --password=... --nombre=...`
-- para que se sincronicen auth.users y public.usuarios.

insert into public.clientes (nombre, correo, telefono)
values
  ('Cliente Demo', 'cliente.demo@correo.local', '5551112233')
on conflict do nothing;

with cliente_demo as (
  select id
  from public.clientes
  where correo = 'cliente.demo@correo.local'
  limit 1
)
insert into public.vehiculos (cliente_id, placa, marca, modelo, color, anio)
select id, 'ABC-123', 'Honda', 'Wave', 'Rojo', 2022
from cliente_demo
where not exists (
  select 1
  from public.vehiculos
  where placa = 'ABC-123'
);
