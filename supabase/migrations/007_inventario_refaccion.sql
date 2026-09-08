create table if not exists public.refaccion (
  id bigserial primary key,
  nombre varchar(100) not null,
  marca varchar(100),
  uuid varchar(36) not null unique,
  precio numeric(10, 2) not null default 0,
  status smallint not null default 1 check (status in (0, 1))
);

create index if not exists idx_refaccion_nombre
  on public.refaccion (nombre);

create index if not exists idx_refaccion_marca
  on public.refaccion (marca);

create index if not exists idx_refaccion_status
  on public.refaccion (status);