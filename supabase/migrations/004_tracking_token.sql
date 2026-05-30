-- Fase 6B: Link de seguimiento anónimo para clientes
-- Cada servicio tiene un token UUID único que permite ver el seguimiento sin login.

ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid();

-- Rellenar servicios existentes
UPDATE servicios SET tracking_token = gen_random_uuid() WHERE tracking_token IS NULL;

ALTER TABLE servicios ALTER COLUMN tracking_token SET NOT NULL;

-- Índice para lookup eficiente por token
CREATE UNIQUE INDEX IF NOT EXISTS servicios_tracking_token_idx ON servicios(tracking_token);
