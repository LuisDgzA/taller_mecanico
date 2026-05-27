create table if not exists public.usuarios (
  id bigserial primary key,
  auth_id uuid unique references auth.users (id) on delete set null,
  nombre varchar(100) not null,
  correo varchar(100) not null unique,
  telefono varchar(15),
  status smallint not null default 1 check (status in (0, 1))
);

create table if not exists public.clientes (
  id bigserial primary key,
  nombre varchar(100),
  correo varchar(100),
  telefono varchar(15)
);

create table if not exists public.vehiculos (
  id bigserial primary key,
  cliente_id bigint not null references public.clientes (id) on delete cascade,
  placa varchar(45) not null,
  marca varchar(45),
  modelo varchar(45),
  color varchar(45),
  anio smallint check (anio between 1900 and 9999)
);

create index if not exists idx_vehiculos_placa
  on public.vehiculos (placa);

create index if not exists idx_vehiculos_cliente_id
  on public.vehiculos (cliente_id);

create table if not exists public.servicios (
  id bigserial primary key,
  vehiculo_id bigint not null references public.vehiculos (id),
  usuario_recibe bigint references public.usuarios (id),
  usuario_entrega bigint references public.usuarios (id),
  usuario_finaliza bigint references public.usuarios (id),
  descripcion text,
  fecha_inicio timestamptz not null default timezone('utc', now()),
  fecha_fin timestamptz,
  fecha_entrega timestamptz,
  status smallint not null default 0 check (status in (0, 1, 2, 3)),
  imagen_uno varchar(255),
  imagen_dos varchar(255),
  imagen_tres varchar(255),
  imagen_cuatro varchar(255),
  imagen_cinco varchar(255)
);

create index if not exists idx_servicios_status
  on public.servicios (status);

create index if not exists idx_servicios_vehiculo_id
  on public.servicios (vehiculo_id);

create index if not exists idx_servicios_fecha_inicio
  on public.servicios (fecha_inicio desc);

create table if not exists public.bitacoras (
  id bigserial primary key,
  servicio_id bigint not null references public.servicios (id) on delete cascade,
  usuario_id bigint references public.usuarios (id),
  fecha timestamptz not null default timezone('utc', now()),
  descripcion text not null,
  imagen_uno varchar(255),
  imagen_dos varchar(255),
  imagen_tres varchar(255),
  imagen_cuatro varchar(255)
);

create index if not exists idx_bitacoras_servicio_id
  on public.bitacoras (servicio_id);

create table if not exists public.cliente_portal_links (
  id bigserial primary key,
  cliente_id bigint not null references public.clientes (id) on delete cascade,
  token_hash varchar(255) not null unique,
  creado_en timestamptz not null default timezone('utc', now()),
  expira_en timestamptz not null,
  revocado_en timestamptz,
  ultimo_acceso timestamptz,
  status smallint not null default 1 check (status in (0, 1))
);

alter table public.servicios
  add column if not exists firma_entrega_url varchar(255);
