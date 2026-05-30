# Portal del Cliente — Escenario A: Acceso autenticado

**Estado:** Pendiente de implementación  
**Prioridad:** Media — útil una vez que haya base de clientes frecuentes  
**Depende de:** Escenario B (tracking anónimo) ya implementado

---

## Descripción

Un portal donde el cliente puede crear una cuenta con su correo y ver todo el historial de servicios de sus vehículos. No requiere que el taller intervenga en cada consulta.

---

## Flujo esperado

1. El cliente accede a `/portal` y se registra con correo + contraseña (Supabase Auth).
2. En el primer acceso, el sistema busca si existe un registro en `clientes` cuyo `correo` coincida con el del usuario recién registrado.
   - Si coincide → se vincula automáticamente (`clientes.user_id = auth.users.id`).
   - Si no coincide → el cliente ve un formulario para ingresar su teléfono o placa para que el taller lo vincule manualmente.
3. Una vez vinculado, el portal muestra:
   - Lista de vehículos registrados a su nombre.
   - Por cada vehículo: historial completo de servicios con estado, fechas, bitácora y fotos.
   - Si hay un servicio activo: enlace directo a la vista de seguimiento en vivo.

---

## Cambios de base de datos requeridos

```sql
-- Vincular usuario de Supabase Auth al registro de cliente
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS clientes_user_id_idx ON clientes(user_id);

-- RLS: cada cliente solo ve sus propios datos
CREATE POLICY "cliente_own_data" ON clientes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cliente_own_vehiculos" ON vehiculos
  FOR SELECT USING (
    cliente_id IN (SELECT id FROM clientes WHERE user_id = auth.uid())
  );

CREATE POLICY "cliente_own_servicios" ON servicios
  FOR SELECT USING (
    vehiculo_id IN (
      SELECT v.id FROM vehiculos v
      JOIN clientes c ON c.id = v.cliente_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "cliente_own_bitacoras" ON bitacoras
  FOR SELECT USING (
    servicio_id IN (
      SELECT s.id FROM servicios s
      JOIN vehiculos v ON v.id = s.vehiculo_id
      JOIN clientes c ON c.id = v.cliente_id
      WHERE c.user_id = auth.uid()
    )
  );
```

---

## Páginas a crear

| Ruta | Descripción |
|------|-------------|
| `/portal` | Redirect → `/portal/login` o `/portal/dashboard` |
| `/portal/login` | Formulario login/registro para clientes |
| `/portal/dashboard` | Lista de vehículos del cliente autenticado |
| `/portal/vehiculos/[id]` | Historial de servicios de un vehículo |

---

## Consideraciones de UX

- **Sin contraseña olvidada fácil**: El cliente probablemente no recuerde su contraseña entre visitas (puede pasar meses). Considerar magic link por correo como método principal.
- **Vinculación manual**: Si el cliente no dio correo al taller, el staff necesita una interfaz en el dashboard para vincular `clientes.user_id` manualmente.
- **Privacidad**: No mostrar nombre de los técnicos ni información interna del taller en el portal.
- **Separación visual**: El portal debe tener diseño distinto al dashboard (colores del taller, sin sidebar de admin).

---

## Dependencias técnicas

- Supabase Auth ya configurado (usado para el staff — mismo proyecto).
- Necesita un segundo tipo de sesión diferenciado: `rol = 'cliente'` vs `rol = 'staff'`. Se puede manejar con `user_metadata.rol` al registrar.
- El middleware de Next.js deberá leer el rol y redirigir según corresponda: clientes solo pueden acceder a `/portal/**`, staff solo a `/dashboard/**`.

---

## Estimación

- Base de datos + RLS: ~1 hora
- Flujo de auth (registro/login/vinculación): ~2 horas  
- Páginas del portal: ~3 horas  
- Vinculación manual desde dashboard: ~1 hora  
- **Total estimado: ~7 horas**
