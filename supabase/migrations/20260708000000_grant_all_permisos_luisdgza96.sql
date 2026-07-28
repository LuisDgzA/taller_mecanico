-- Otorga todos los permisos del sistema al usuario luisdgza96@gmail.com.
-- Requiere que el usuario ya exista en public.usuarios (status = 1).
-- Crear con: npm run create:admin -- --email=luisdgza96@gmail.com --password=... --nombre=...

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
      'Usuario luisdgza96@gmail.com no encontrado o inactivo en public.usuarios. '
      'Créalo primero con npm run create:admin.';
  END IF;

  -- Reemplaza todos los permisos existentes del usuario
  DELETE FROM public.seg_permiso
  WHERE usuario_id = v_usuario_id;

  -- Inserta los 17 permisos definidos en src/lib/permissions.ts (PERMISOS)
  -- 1  SERVICIOS_VER          4  SERVICIOS_DEL_NOTA     7  CLIENTES_ADD
  -- 2  SERVICIOS_ADD          5  SERVICIOS_ENTREGAR_V   8  CLIENTES_DEL
  -- 3  SERVICIOS_ADD_NOTA     6  CLIENTES_VER           9  CLIENTES_ADD_VEHICULO
  -- 10 CLIENTES_DEL_VEHICULO  11 USUARIOS_VER           12 USUARIOS_ADD
  -- 13 USUARIOS_EDIT          14 USUARIOS_DESACTIVAR    15 USUARIOS_PERMISOS
  -- 16 CLIENTES_EDIT          17 CLIENTES_EDIT_VEHICULO
  INSERT INTO public.seg_permiso (usuario_id, seg_accion_id)
  SELECT v_usuario_id, accion_id
  FROM unnest(ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]) AS accion_id;

  RAISE NOTICE 'Permisos otorgados a luisdgza96@gmail.com (usuarios.id = %)', v_usuario_id;
END;
$$;
