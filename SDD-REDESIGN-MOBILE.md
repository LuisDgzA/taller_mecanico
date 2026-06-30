# SDD — Rediseño Mobile-First "Native App Feel"
> Basado en `DESIGN.md` (Precision Industrial Light) y mockups en `/design/`
> Fecha: 2026-06-17

---

## Resumen ejecutivo

El objetivo es transformar la aplicación de un layout desktop-first con sidebar oscuro y múltiples cards con borders y sombras, a una experiencia mobile-first que se sienta como una app nativa iOS/Android: navegación inferior fija, headers compactos por pantalla, listas con separadores en lugar de cards, y un sistema de color/tipografía limpio basado en `DESIGN.md`.

**Lo que se elimina:**
- Sidebar oscuro de escritorio
- Fondo degradado beige (`#f7f3ec → #efe5d7`)
- Cards con `border + shadow + rounded-[2rem]` para todo
- Font stack `Segoe UI / Aptos`
- Paddings generosos (`px-5 py-6`, `p-4` en casi todo)

**Lo que entra:**
- Bottom navigation bar fija (4 ítems)
- Header por pantalla con back arrow y action icon
- Listas separadas con `divider` en lugar de card por ítem
- Inter como única fuente
- Tokens de color de `DESIGN.md`
- FAB (`+`) para acciones primarias de creación

---

## Design Tokens (globals.css)

Reemplazar el bloque `:root` y `@theme inline` completo:

```css
:root {
  --color-surface:                #faf8ff;
  --color-surface-container:      #eaedff;
  --color-surface-container-low:  #f2f3ff;
  --color-on-surface:             #131b2e;
  --color-on-surface-variant:     #434655;
  --color-outline:                #737686;
  --color-outline-variant:        #c3c6d7;
  --color-primary:                #004ac6;
  --color-primary-container:      #2563eb;
  --color-on-primary:             #ffffff;
  --color-on-primary-container:   #eeefff;
  --color-secondary:              #505f76;
  --color-error:                  #ba1a1a;
  --color-error-container:        #ffdad6;
  --color-on-error-container:     #93000a;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

Agregar carga de Inter en `src/app/layout.tsx` via `next/font/google`.

---

## Etapa 1 — Foundation: Tokens, fuente y layout raíz

**Archivos:**
- `src/app/globals.css`
- `src/app/layout.tsx`

**Cambios:**
1. Reemplazar `:root` con los tokens de arriba.
2. `body`: `background: var(--color-surface); color: var(--color-on-surface);` — fondo blanco azulado, sin degradado.
3. Importar `Inter` desde `next/font/google` con `subsets: ['latin']` y aplicar `className` en el `<html>`.
4. Eliminar la variable `--font-sans` del CSS (queda manejada por Next.js font).

**Criterio de éxito:** La app carga con fondo `#faf8ff`, tipografía Inter, sin el degradado beige.

---

## Etapa 2 — Shell: Bottom Navigation + Header compacto

**Archivos:**
- `src/app/dashboard/layout.tsx`
- `src/components/dashboard/bottom-nav.tsx` *(nuevo)*
- `src/components/dashboard/page-header.tsx` *(nuevo)*

### 2a. Eliminar el sidebar

El `<aside>` con la nav lateral y la tarjeta de sesión desaparece completamente del layout. El `DashboardLayout` pasa a ser:

```tsx
<div className="flex min-h-screen flex-col bg-[var(--color-surface)]">
  <main className="flex-1 pb-20">   {/* pb-20 deja espacio para la bottom nav */}
    {children}
  </main>
  <BottomNav />
</div>
```

### 2b. `BottomNav` component

Bottom nav fija, altura `56px`, fondo `white`, border-top `1px solid var(--color-outline-variant)`.  
4 ítems: **Inicio · Servicios · Clientes · Usuarios**.  
Ítem activo: ícono y label en `var(--color-primary)`. Inactivo: `var(--color-on-surface-variant)`.  
Usar `usePathname()` para detectar ruta activa.

```
[ Inicio ]  [ Servicios ]  [ Clientes ]  [ Usuarios ]
  🏠 activo      🔧              👤             👥
```

Cada ítem es un `<Link>` con flex-col (ícono arriba, label 10px abajo), tap target mínimo `44px`.

### 2c. `PageHeader` component

Header estándar para todas las páginas interiores:

```
← [Título]                    [action icon?]
```

Props: `title: string`, `backHref?: string`, `action?: ReactNode`  
Altura `48px`, `px-4`, `border-bottom: 1px solid var(--color-outline-variant)`.  
Background `var(--color-surface)`. Sticky top.

**Criterio de éxito:** En mobile se ve la bottom nav fija y las páginas tienen header compacto. El sidebar dark desaparece.

---

## Etapa 3 — Lista de Servicios

**Archivo:** `src/app/dashboard/servicios/page.tsx`

### Patrón de lista (referencia: `design/servicios.png`)

Reemplazar las cards con `border + shadow` por una lista dividida:

```
[ PageHeader title="Órdenes de Servicio" ]

[ filtro chips: Todos | En Proceso | Demorado | Entregado ]

—————————————————————————————————
  LETY-09  Toyota Corolla      [EN PROCESO]
  Leticia Hernández
  Ruido metálico en la suspension...
  🔧 Elevador 2        hace 2 horas
—————————————————————————————————
  XYZ-88   Ford Ranger         [DEMORADO]
  ...
—————————————————————————————————

                        [+ FAB]
```

**Reglas de implementación:**
- Cada ítem: `<Link>` que ocupa todo el ancho, `px-4 py-3`, sin border individual, con `border-bottom: 1px solid var(--color-outline-variant)`.
- Placa: badge `font-mono text-xs border rounded px-1.5` estilo técnico.
- Status badge: chip sin border, background 10% opacity del color de estado, texto del mismo tono (ver Etapa 5).
- Descripción: 2 líneas max, `text-sm text-[var(--color-on-surface-variant)]`.
- Footer del ítem: `text-xs text-[var(--color-on-surface-variant)]` con ícono pequeño a la izquierda.
- **Sin sombras, sin `rounded-xl` en el ítem**.

**FAB:** Botón `+` fijo `bottom-24 right-4` (arriba de la bottom nav), `56px` redondo, fondo `var(--color-primary)`, ícono blanco. Navega a `/dashboard/servicios/nuevo`.

**Criterio de éxito:** La lista se ve como la captura `servicios.png`, ítems de borde a borde, sin boxes flotantes.

---

## Etapa 4 — Lista de Clientes

**Archivo:** `src/app/dashboard/clientes/page.tsx`

Mismo patrón de lista dividida que Servicios:

```
[ PageHeader title="Clientes" action=<SearchIcon> ]

[ Search bar (visible si se toca el ícono de búsqueda) ]

—————————————————————————————————
  Aldo Plata
  aldo.plata@example.com  |  2 vehículos →
—————————————————————————————————
  ...
```

- Cada ítem: `px-4 py-3.5`, `border-bottom`.
- Nombre: `text-sm font-medium`.
- Correo + contador de vehículos: `text-xs text-[var(--color-on-surface-variant)]`.
- Chevron `›` a la derecha para indicar navegación.
- El buscador se colapsa en un input que aparece al presionar el ícono en el PageHeader (no un formulario fijo).

**Criterio de éxito:** Lista compacta sin cards, searchbar colapsable.

---

## Etapa 5 — Status Badges

**Archivo:** `src/components/dashboard/servicio-status-badge.tsx`

Actualizar los colores de los badges al sistema del DESIGN.md:

| Status      | Background (10% opacity) | Texto        |
|-------------|--------------------------|--------------|
| En Proceso  | `#2563eb1a`              | `#004ac6`    |
| Demorado    | `#ba1a1a1a`              | `#93000a`    |
| Entregado   | `#0057331a`              | `#005a33`    |
| Pendiente   | `#7356001a`              | `#735600`    |

Forma: `rounded` (4px), `text-xs font-medium px-2 py-0.5`. Sin border.

---

## Etapa 6 — Detalle del Cliente

**Archivo:** `src/app/dashboard/clientes/[id]/page.tsx`

Referencia: `design/detalle_del_cliente.png`

### Estructura

```
[ PageHeader title="Detalle del Cliente" backHref="/dashboard/clientes" action=<EditIcon> ]

[ Sección: Ficha general ]
  Label: Nombre
  [ Input read-only ]
  Label: Correo
  [ Input read-only ]
  Label: Teléfono
  [ Input read-only ]

[ Sección: Vehículos Asociados ]          [ + Añadir Vehículo ]
  ——————————————————————————————————
  🚗  Toyota Corolla          ABC-123
      Sedán 2019 · Rojo
      [ Ver detalles ]  [ Crear servicio ]
  ——————————————————————————————————
  ...

[ Zona de peligro ]
  Eliminar permanentemente...
  [ Eliminar cliente ]
```

**Implementación:**
- `Ficha general`: `<section>` con header `text-xs font-semibold uppercase tracking-wide text-[var(--color-on-surface-variant)] px-4 py-2 bg-[var(--color-surface-container-low)]` (línea separadora de sección estilo iOS).
- Fields: sin inputs con border visible en modo read-only. Usar un `<dl>` con `<dt>` (label gris 12px) y `<dd>` (valor 14px). Separados por `border-bottom`. `px-4 py-3`.
- Vehículos: cada ítem `px-4 py-3 border-bottom`. Ícono de vehículo en círculo `bg-[var(--color-surface-container)] rounded-full p-2`.
- Placa: badge técnico `font-mono border rounded px-1.5 text-xs`.
- Botones de ítem: pequeños, `text-sm`, el secundario solo texto/outline, el primario fill `var(--color-primary)`.
- Zona de peligro: `border border-[var(--color-error)] rounded-lg mx-4 p-4`. Botón: outline en rojo.

---

## Etapa 7 — Detalle del Servicio + Bitácora

**Archivo:** `src/app/dashboard/servicios/[id]/page.tsx`

Referencia: `design/bitacora.png`

### Estructura

```
[ PageHeader title="Servicio #N" backHref="..." ]

[ Subtítulo: descripción corta ]
[ Status badge ]

[ Tabs: Información  |  Bitácora (N) ]
————————————————

[Tab Información]
  — Vehículo
  — Cliente + teléfono
  — Fechas
  — Fotos (grid 2x, sin cards)
  — Botón avanzar estado

[Tab Bitácora]
  Timeline vertical:
  Avatar ── autor, fecha
            Texto de la entrada
            [ imagen si aplica ]
  ...
  FIN DE BITÁCORA
  [ + Agregar nota ]
```

**Implementación:**
- Tabs: `border-bottom` como línea, tab activo con `border-bottom: 2px solid var(--color-primary)` y texto `var(--color-primary)`. Sin background pill.
- Timeline: línea vertical izquierda `2px solid var(--color-outline-variant)`. Cada entrada: avatar circular 36px a la izquierda. Contenido en bloque sin card, solo `mb-4`.
- Imagen en bitácora: `rounded-lg` dentro del bloque de texto, max-width 100%.
- `FIN DE BITÁCORA`: icono + texto `text-xs text-[var(--color-on-surface-variant)]` centrado.

---

## Etapa 8 — Pantallas de Autenticación

**Archivos:** `src/app/login/page.tsx`, `src/app/forgot-password/page.tsx`

- Fondo `var(--color-surface)`.
- Logo/marca arriba centrado.
- Inputs con `border: 1px solid var(--color-outline-variant)`, focus ring `var(--color-primary)`, `rounded` (4px).
- Botón primario: `bg-[var(--color-primary)] text-white rounded px-4 py-2.5 w-full`.
- Sin tarjeta flotante. El form va directo sobre el fondo.

---

## Etapa 9 — Página de Inicio (Dashboard Home)

**Archivo:** `src/app/dashboard/page.tsx`

Reemplazar el grid de "cards de acceso rápido" + lista de milestones por:

```
[ PageHeader title="WorkshopPro" action=<SettingsIcon> ]

Bienvenido, [nombre]
[ texto del rol ]

[ Acciones rápidas — grid 2x2 ]
  [ + Nuevo Servicio ]  [ Buscar Cliente ]
  [ Ver Reportes ]      [ Usuarios ]

[ Actividad reciente — lista dividida (últimos 5 servicios) ]
```

- Grid de acciones: `rounded-lg border` (sí se usa card aquí, pero mínima — 8px radius, 1px border, sin shadow).
- Cada acción: ícono grande, label debajo, `text-center p-4`.

---

## Consideraciones transversales

### Espaciado
- Gutter horizontal: `px-4` (`16px`) en mobile.
- Secciones: separadas por headers de sección (fondo `var(--color-surface-container-low)`) o `border-top`, no por gap entre cards.
- Evitar `py-6`, `p-5`, `gap-4` entre ítems de lista.

### Tap targets
- Mínimo `44px` de alto para cualquier elemento interactivo.
- Links de lista full-width para que el tap sea fácil.

### Tipografía (DESIGN.md)
- Títulos de página: `headline-md` → 20px / 600 / -0.01em.
- Body: `body-md` → 14px / 400.
- Labels/metadata: `label-md` → 12px / 500 / 0.02em uppercase.
- Datos técnicos (placa, ID): `mono-data` → 13px / 500 / Inter.

### Lo que NO cambia
- Server actions y data fetching (sin tocar lógica de negocio).
- Rutas y estructura de carpetas.
- Supabase client/server helpers.
- Schemas de validación.

---

## Orden de ejecución recomendado

| # | Etapa | Impacto | Riesgo |
|---|-------|---------|--------|
| 1 | Tokens + fuente | Global | Bajo |
| 2 | Shell (bottom nav + header) | Global | Medio |
| 3 | Lista Servicios | Alta visibilidad | Bajo |
| 4 | Lista Clientes | Alta visibilidad | Bajo |
| 5 | Status Badges | Transversal | Bajo |
| 6 | Detalle Cliente | Medio | Bajo |
| 7 | Detalle Servicio + Bitácora | Medio | Bajo |
| 8 | Auth screens | Bajo tráfico | Bajo |
| 9 | Dashboard Home | Medio | Bajo |

Cada etapa es desplegable de forma independiente sin romper las demás.
