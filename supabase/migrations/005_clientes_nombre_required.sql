-- Hace obligatorio el nombre del cliente y evita cadenas vacías.
update public.clientes
set nombre = concat('Cliente ', id)
where nombre is null or btrim(nombre) = '';

alter table public.clientes
  alter column nombre set not null;

alter table public.clientes
  drop constraint if exists clientes_nombre_not_blank;

alter table public.clientes
  add constraint clientes_nombre_not_blank
  check (char_length(btrim(nombre)) > 0);
