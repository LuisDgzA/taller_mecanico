-- La migración 20260708000000 otorgó los permisos 1-17 pero no incluyó
-- INVENTARIO_VER (18), agregado después en src/lib/permissions.ts.
-- Esto provocaba que al hacer clic en "Inventario" el layout redirigiera
-- de vuelta a /dashboard por falta de permiso.

DO $$
DECLARE
  v_usuario_id integer;
BEGIN
  SELECT id INTO v_usuario_id
  FROM public.usuarios
  WHERE correo = 'luisdgza96@gmail.com'
    AND status = 1
  LIMIT 1;

  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION
      'Usuario luisdgza96@gmail.com no encontrado o inactivo en public.usuarios.';
  END IF;

  INSERT INTO public.seg_permiso (usuario_id, seg_accion_id)
  SELECT v_usuario_id, 18
  WHERE NOT EXISTS (
    SELECT 1 FROM public.seg_permiso
    WHERE usuario_id = v_usuario_id AND seg_accion_id = 18
  );

  RAISE NOTICE 'Permiso INVENTARIO_VER (18) otorgado a luisdgza96@gmail.com (usuarios.id = %)', v_usuario_id;
END;
$$;
