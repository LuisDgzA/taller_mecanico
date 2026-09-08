create table if not exists public.refaccion_kardex (
  id bigserial primary key,
  fecha timestamptz not null default now(),
  refaccion_id bigint not null references public.refaccion (id) on delete set null,
  usuario_id bigint references public.usuarios (id) on delete set null,
  tipo smallint not null check (tipo in (1, -1)),
  inicial integer not null,
  cantidad integer not null check (cantidad > 0),
  final integer not null,
  status smallint not null default 1 check (status in (0, 1))
);

create index if not exists idx_refaccion_kardex_refaccion_id
  on public.refaccion_kardex (refaccion_id);