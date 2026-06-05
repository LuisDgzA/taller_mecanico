-- Fase 6B: Políticas de lectura anónima para el seguimiento público de servicios.
-- Los servicios y bitácoras son legibles sin login para permitir la actualización
-- en tiempo real en la página de seguimiento del cliente.
-- La seguridad la provee el tracking_token UUID (prácticamente imposible de adivinar).

create policy anon_read_servicios
  on public.servicios
  for select
  to anon
  using (true);

create policy anon_read_bitacoras
  on public.bitacoras
  for select
  to anon
  using (true);
