# SDD — Adecuación Desktop (Responsive Shell + Todas las Páginas)

**Versión:** 1.0  
**Fecha:** 2026-07-10  
**Alcance:** Convertir toda la interfaz de mobile-first a responsive, con sidebar lateral fija en desktop (`lg:`) y layout de dos columnas donde aplica, siguiendo los mocks en `design/desktop/`.

---

## 1. Contexto

La app actual es 100 % mobile: navegación en `BottomNav` fija en la parte inferior, `PageHeader` compacto de 48 px, y páginas en columna única. Los mocks de `design/desktop/` definen un shell radicalmente distinto:

- **Sidebar izquierda fija** (~240 px) con logo, ítems de navegación y usuario al pie.
- **Cabecera de página desktop** alineada a la derecha del sidebar, con título a la izquierda e íconos globales (campana, engranaje, ayuda, avatar) a la derecha.
- **Layouts de dos columnas** en Detalle de Cliente, Usuarios y Permisos.
- El **BottomNav se oculta** en `lg:` y arriba.

Referencia visual:
| Mock | Pantalla |
|---|---|
| `design/desktop/home.png` | Inicio |
| `design/desktop/servicios.png` | Órdenes de Servicio |
| `design/desktop/clientes.png` | Lista de Clientes |
| `design/desktop/detalle_clientes.png` | Detalle del Cliente |
| `design/desktop/permisos.png` | Gestión de Permisos |

> Las pantallas de **Usuarios**, **Detalle de Servicio**, **Nuevo Servicio** y **Entrega** no tienen mock desktop. El plan infiere su layout a partir de los patrones establecidos en los mocks disponibles.

---

## 2. Archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `src/app/dashboard/layout.tsx` | Agregar `DesktopSidebar`, ocultar `BottomNav` en `lg:`, ajustar padding |
| `src/components/dashboard/bottom-nav.tsx` | Agregar `lg:hidden` |
| `src/components/dashboard/page-header.tsx` | Añadir variante desktop (título + íconos derechos) |
| `src/components/dashboard/desktop-sidebar.tsx` | **Nuevo componente** — sidebar fija |
| `src/app/dashboard/page.tsx` | Layout desktop: grid de 4 acciones, sin sección "Sesión" en sidebar |
| `src/app/dashboard/servicios/page.tsx` | Padding desktop, lista más cómoda |
| `src/app/dashboard/servicios/[id]/page.tsx` | Layout de dos columnas `lg:grid-cols-[1fr_1.5fr]` |
| `src/app/dashboard/servicios/nuevo/page.tsx` | Centering desktop `lg:max-w-2xl lg:mx-auto` |
| `src/app/dashboard/servicios/[id]/entrega/page.tsx` | Centering desktop `lg:max-w-lg lg:mx-auto` |
| `src/app/dashboard/clientes/page.tsx` | Padding desktop, FAB alineado |
| `src/app/dashboard/clientes/[id]/page.tsx` | Layout de dos columnas `lg:grid-cols-[minmax(320px,380px)_1fr]` |
| `src/app/dashboard/usuarios/page.tsx` | Layout de dos columnas `lg:grid-cols-[minmax(320px,380px)_1fr]` |
| `src/app/dashboard/permisos/page.tsx` | Layout de dos columnas `lg:grid-cols-[minmax(320px,360px)_1fr]` |

> No se modifican actions, queries Supabase, RLS, tipos ni Edge Functions. Solo presentación.

---

## 3. Shell del Layout — cambio estructural principal

### 3.1 `DashboardLayout` (`src/app/dashboard/layout.tsx`)

**Estado actual:**
```tsx
<div className="min-h-screen bg-surface text-on-surface">
  <OfflineGuard>
    <main className="pb-20">{children}</main>
  </OfflineGuard>
  <BottomNav ... />
</div>
```

**Estado objetivo:**
```tsx
<div className="min-h-screen bg-surface text-on-surface lg:flex">
  {/* Sidebar — sólo desktop */}
  <DesktopSidebar
    canViewServicios={canViewServicios}
    canViewClientes={canViewClientes}
    canViewUsuarios={canViewUsuarios}
    canViewPermisos={canViewPermisos}
    userNombre={staff.nombre}
    userCorreo={staff.correo}
  />

  {/* Contenido principal */}
  <div className="flex min-h-screen flex-1 flex-col lg:ml-60">
    <OfflineGuard>
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
    </OfflineGuard>
  </div>

  {/* Bottom nav — sólo mobile */}
  <BottomNav className="lg:hidden" ... />
</div>
```

Cambios clave:
- `lg:flex` en el wrapper convierte el shell en columna sidebar + contenido.
- `DesktopSidebar` se renderiza pero es `hidden lg:flex flex-col` internamente.
- `lg:ml-60` desplaza el contenido para no solaparse con el sidebar.
- `pb-20 lg:pb-0` elimina el padding inferior del bottom nav en desktop.
- Se pasan `userNombre` y `userCorreo` (ya disponibles en el layout) al sidebar.

### 3.2 `BottomNav` — agregar clase de ocultado

```tsx
// Antes
<nav className={cn("fixed inset-x-0 bottom-0 z-50 flex ...", className)}>

// Después
<nav className={cn("fixed inset-x-0 bottom-0 z-50 flex ... lg:hidden", className)}>
```

No se toca la lógica interna ni los ítems de navegación.

---

## 4. Nuevo componente: `DesktopSidebar`

**Archivo:** `src/components/dashboard/desktop-sidebar.tsx`

**Estructura visual** (según `home.png` y `permisos.png`):

```
┌─────────────────────────┐
│  WorkshopPro            │  ← Logo + subtítulo
│  Management Suite       │
├─────────────────────────┤
│  🏠  Inicio             │  ← Nav items (activo con bg azul)
│  🔧  Servicios          │
│  👥  Clientes           │
│  👤  Usuarios           │
│  🛡  Permisos           │
├─────────────────────────┤
│  [WP]  Admin User       │  ← Avatar + nombre + correo
│         View Profile    │
└─────────────────────────┘
```

**Props:**
```tsx
type DesktopSidebarProps = {
  canViewServicios?: boolean;
  canViewClientes?: boolean;
  canViewUsuarios?: boolean;
  canViewPermisos?: boolean;
  userNombre: string | null;
  userCorreo: string | null;
};
```

**JSX:**
```tsx
"use client";   // necesita usePathname para el estado activo

export function DesktopSidebar({ canViewServicios, canViewClientes,
                                  canViewUsuarios, canViewPermisos,
                                  userNombre, userCorreo }: DesktopSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60
                      border-r border-outline-variant bg-surface-container-lowest z-50">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-outline-variant">
        <p className="text-sm font-bold text-primary">WorkshopPro</p>
        <p className="text-[11px] text-on-surface-variant mt-0.5">Management Suite</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              )}>
              <Icon className={cn("size-5", active ? "stroke-[2]" : "stroke-[1.75]")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-outline-variant px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-full bg-primary text-sm font-bold text-on-primary">
            {userNombre?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">{userNombre ?? "—"}</p>
            <p className="truncate text-[11px] text-on-surface-variant">{userCorreo ?? "—"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

El filtro de visibilidad de ítems (`canViewServicios`, etc.) replica la lógica ya existente en `BottomNav`. La función `isActivePath` se mueve a `navigation-items.ts` para reutilizarla en ambos componentes.

---

## 5. `PageHeader` — variante desktop

**Estado actual:** barra de 48 px, compacta.

**Estado objetivo en desktop:** barra de 64 px con título a la izquierda. En desktop, el botón "Volver" se convierte en un link textual con chevron en lugar del icono circular compacto de mobile.

```tsx
// Antes (sólo mobile)
<header className="sticky top-0 z-40 flex h-12 items-center gap-1 border-b border-outline-variant bg-surface px-2">

// Después (responsive)
<header className="sticky top-0 z-40 flex h-12 lg:h-16 items-center gap-1
                   border-b border-outline-variant bg-surface px-2 lg:px-6">
  {/* Back button — sólo mobile cuando hay backHref */}
  {backHref && (
    <Link href={backHref} className="lg:hidden flex h-10 w-10 ...">
      <ChevronLeft className="size-5" />
    </Link>
  )}

  {/* Back link estilo desktop cuando hay backHref */}
  {backHref && (
    <Link href={backHref}
      className="hidden lg:flex items-center gap-1 text-sm text-on-surface-variant
                 hover:text-on-surface mr-4 transition-colors">
      <ChevronLeft className="size-4" />
      Volver
    </Link>
  )}

  <h1 className={cn(
    "flex-1 truncate text-base lg:text-lg font-semibold tracking-tight text-on-surface",
    !backHref && "pl-3 lg:pl-0",
  )}>
    {title}
  </h1>

  {/* Slot de acción custom */}
  {action && <div className="shrink-0 pr-1 lg:pr-0 lg:ml-2">{action}</div>}
</header>
```

---

## 6. Página: Inicio (`/dashboard`)

### 6.1 Estado actual
- `PageHeader title="WorkshopPro"` — el nombre de la app como título de página.
- Sección "Sesión" con nombre, correo y botón "Cerrar sesión" al fondo.
- `grid-cols-2` para acciones rápidas.

### 6.2 Diseño objetivo (`home.png`)
- El header muestra `"Hola, Luis"` como título (no el nombre de la app).
- Acciones rápidas en 4 columnas en desktop.
- Sección "Sesión" desaparece en desktop (la info de usuario y logout quedan en el sidebar o en un menú de perfil futuro).
- La lista de actividad reciente se muestra con más padding horizontal.

### 6.3 Delta de cambios

#### Header
```tsx
// Antes
<PageHeader title="WorkshopPro" />
<div className="border-b ..."><p>Hola, {nombre}</p></div>

// Después
<PageHeader title={`Hola, ${staff?.nombre?.split(" ")[0] ?? "usuario"}`} />
// Eliminar el bloque <div> de bienvenida separado
```

#### Quick actions grid
```tsx
// Antes
<div className="grid grid-cols-2 gap-3 px-4 py-4">

// Después
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 lg:px-8 py-4 lg:py-6">
```

#### Actividad reciente
```tsx
// Antes
<div className="divide-y divide-outline-variant">
  <Link className="flex flex-col gap-1.5 px-4 py-3 ...">

// Después
<div className="divide-y divide-outline-variant lg:mx-0">
  <Link className="flex flex-col gap-1.5 px-4 lg:px-8 py-3 lg:py-4 ...">
```

#### Sección "Sesión"
```tsx
// Envolver con lg:hidden para ocultarla en desktop
<div className="lg:hidden mt-4 bg-surface-container-low ...">
  {/* ... nombre, correo, botón logout ... */}
</div>
```

> El logout permanece en la sección "Sesión" que sólo se muestra en mobile (`lg:hidden`). En desktop el usuario puede navegar a mobile o usar un dispositivo touch para cerrar sesión hasta que se implemente un menú de perfil en el sidebar.

---

## 7. Página: Órdenes de Servicio (`/dashboard/servicios`)

### 7.1 Estado actual
Columna única. Filtros de estado, buscador y lista de tarjetas.

### 7.2 Diseño objetivo (`servicios.png`)
En desktop es prácticamente igual pero con más ancho de respiro. No hay cambio estructural de columnas.

### 7.3 Delta de cambios

#### Contenedor general
```tsx
// Agregar max-width en desktop y padding lateral mayor
<div className="lg:max-w-4xl lg:mx-auto lg:px-8 lg:py-6">
  {/* filtros, buscador, lista */}
</div>
```

#### Tarjeta de servicio
```tsx
// Antes: padding compacto
<Link className="... px-4 py-3">

// Después: más cómodo en desktop
<Link className="... px-4 lg:px-6 py-3 lg:py-4">
```

#### Buscador
```tsx
// Agregar padding desktop
<div className="px-4 lg:px-0 py-3">
  <ServiciosSearch ... />
</div>
```

---

## 8. Página: Detalle de Servicio (`/dashboard/servicios/[id]`)

### 8.1 Estado actual
Columna única con `PageHeader` + tabs + imágenes + bitácora + acciones.

### 8.2 Diseño objetivo (inferido de los patrones de los mocks)
Dos columnas en desktop:
- **Izquierda (1fr):** info del vehículo + cliente + imágenes de ingreso + botón de avance de estado.
- **Derecha (1.5fr):** descripción del problema + tabs de bitácora + entradas de bitácora.

### 8.3 Delta de cambios

#### Layout principal
```tsx
// Antes: columna única
<div className="px-4 py-4 space-y-4">

// Después: dos columnas en desktop
<div className="px-4 lg:px-8 py-4 lg:py-6
                lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-8 lg:items-start">

  {/* Columna izquierda */}
  <div className="space-y-4">
    {/* Card: vehículo */}
    {/* Card: cliente */}
    {/* Fotos de ingreso */}
    {/* Botón avance de estado */}
  </div>

  {/* Columna derecha */}
  <div className="space-y-4 mt-4 lg:mt-0">
    {/* Card: descripción */}
    {/* Tabs: Bitácora / Historial */}
    {/* Entradas de bitácora */}
    {/* Formulario nueva entrada (si tiene permiso) */}
  </div>
</div>
```

#### `SectionHeader` existente
Sólo necesita ajuste de padding:
```tsx
// Antes
function SectionHeader({ children }) {
  return <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide bg-surface-container-low">

// Después
function SectionHeader({ children }) {
  return <div className="px-4 lg:px-0 py-2 text-xs font-semibold uppercase tracking-wide
                         bg-surface-container-low lg:bg-transparent lg:pt-0">
```

---

## 9. Página: Nuevo Servicio (`/dashboard/servicios/nuevo`)

### 9.1 Diseño objetivo
Wizard centrado en desktop. El ancho máximo evita que los inputs se estiren en pantallas grandes.

### 9.2 Delta de cambios

#### Step 1 y Step 2 — centering
```tsx
// En NuevoServicioStep1Form y en la rama step==="2"
// Envolver el contenido en:
<div className="lg:max-w-2xl lg:mx-auto lg:px-0 px-4">
  {/* contenido del step */}
</div>
```

El `ServiceWizardStepper` (del SDD anterior) también hereda este centering.

---

## 10. Página: Entrega de Servicio (`/dashboard/servicios/[id]/entrega`)

### 10.1 Diseño objetivo (inferido)
Formulario centrado, sin columnas. Máximo `lg:max-w-lg`.

### 10.2 Delta de cambios
```tsx
// Antes: contenedor full-width
<div className="px-4 py-4">

// Después
<div className="px-4 py-4 lg:max-w-lg lg:mx-auto lg:py-8">
```

---

## 11. Página: Lista de Clientes (`/dashboard/clientes`)

### 11.1 Estado actual
Lista de tarjetas con buscador inline y paginación.

### 11.2 Diseño objetivo (`clientes.png`)
Estructura casi idéntica al mobile pero con:
- Buscador en ancho completo con más padding.
- Tarjetas de cliente con más padding horizontal.
- FAB `+` en la esquina inferior derecha (ya existe, sólo ajustar posición desktop).

### 11.3 Delta de cambios

#### Contenedor
```tsx
// Antes
<div className="px-4 py-4">

// Después
<div className="px-4 lg:max-w-3xl lg:mx-auto lg:px-0 py-4 lg:py-6">
```

#### Buscador
```tsx
// En ClientesPage: ajustar padding del wrapper
<div className="px-4 lg:px-0 py-3">
  <input placeholder="Buscar por nombre, correo o teléfono" className="... w-full" />
</div>
```

#### Tarjeta de cliente
```tsx
// Antes
<Link className="flex items-center gap-3 px-4 py-3">

// Después
<Link className="flex items-center gap-3 px-4 lg:px-6 py-3 lg:py-4">
```

#### FAB
El botón `+` ya existe en la esquina inferior derecha. En desktop `bottom-6 right-6` (actualmente `bottom-20` por el BottomNav). Ajustar:
```tsx
// Antes
<div className="fixed bottom-20 right-4 ...">

// Después
<div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 ...">
```

---

## 12. Página: Detalle del Cliente (`/dashboard/clientes/[id]`)

### 12.1 Estado actual
Columna única: info del cliente + formulario + vehículos + zona de peligro.

### 12.2 Diseño objetivo (`detalle_clientes.png`)
Dos columnas en desktop:
- **Izquierda:** "Ficha General" (formulario de edición) + "Zona de peligro".
- **Derecha:** "Vehículos Asociados" (lista + add).

La cabecera muestra "← Back to Clients | Detalle del Cliente" + íconos derecha (bell, settings, help).  
Botón "Editar Perfil" como acción en el header (slot `action` del `PageHeader`).

### 12.3 Delta de cambios

#### PageHeader
```tsx
// Sin cambio en la llamada — sólo ajuste de estilos internos del componente
<PageHeader title="Detalle del Cliente" backHref="/dashboard/clientes" />
```

#### Layout de dos columnas
```tsx
// Antes: columna única
<div className="px-4 py-4 space-y-4">
  {/* ficha general */}
  {/* vehículos */}
  {/* zona de peligro */}
</div>

// Después
<div className="px-4 lg:px-8 py-4 lg:py-6
                lg:grid lg:grid-cols-[minmax(320px,380px)_1fr] lg:gap-8 lg:items-start">

  {/* Columna izquierda */}
  <div className="space-y-4">
    {/* --- Ficha General --- */}
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <UserRound className="size-4 text-slate-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Ficha General
        </h2>
      </div>
      <div className="p-5 space-y-4">
        {/* Avatar / badge Cliente Frecuente */}
        {/* Formulario: Nombre, Correo, Teléfono */}
        {/* Botón Guardar cambios */}
      </div>
    </div>

    {/* --- Zona de peligro --- */}
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="size-4 text-red-500" />
        <h3 className="text-sm font-semibold text-red-700">Zona de peligro</h3>
      </div>
      <p className="text-xs text-red-600 mb-3">
        Eliminar permanentemente a este cliente y todos sus datos asociados.
        Esta acción no se puede deshacer y borrará el historial de servicios.
      </p>
      {/* Botón Eliminar cliente */}
    </div>
  </div>

  {/* Columna derecha */}
  <div className="space-y-4 mt-4 lg:mt-0">
    {/* --- Vehículos Asociados --- */}
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Car className="size-4 text-slate-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vehículos Asociados
          </h2>
        </div>
        {/* Botón + Añadir Vehículo */}
      </div>
      <div className="p-4 space-y-3">
        {/* Tarjetas de vehículo con Ver detalles + Crear servicio */}
        {/* Placeholder ¿Tiene otro vehículo? */}
      </div>
    </div>
  </div>
</div>
```

#### Tarjetas de vehículo (columna derecha)
Cada vehículo muestra en desktop el mismo contenido del mock: placa badge, modelo, año, color, último servicio, km. Los botones "Ver detalles" y "Crear servicio" se alinean horizontalmente:

```tsx
<div className="flex gap-2 mt-3">
  <Link href={`/dashboard/servicios?vehiculo=${v.id}`}
    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
               border border-slate-200 text-sm font-medium text-slate-700">
    <Eye className="size-4" /> Ver detalles
  </Link>
  <Link href={`/dashboard/servicios/nuevo?vehiculoId=${v.id}`}
    className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
               bg-blue-600 text-sm font-semibold text-white">
    <Wrench className="size-4" /> Crear servicio
  </Link>
</div>
```

---

## 13. Página: Usuarios (`/dashboard/usuarios`)

### 13.1 Estado actual
Columna única: card "Nueva cuenta" + lista de usuarios. El SDD `SDD-USUARIOS-DETALLES-SERVICIO.md` ya rediseñó el look mobile.

### 13.2 Diseño objetivo (inferido)
En desktop: dos columnas alineadas al mismo nivel, simétricas al patrón de Permisos y Detalle de Cliente.

- **Izquierda:** Card "Nueva cuenta interna" (formulario de creación).
- **Derecha:** Card "Personal Registrado" (buscador + lista de usuarios con avatares).

### 13.3 Delta de cambios

#### Layout
```tsx
// Antes: columna única
<div className="px-4 py-4 space-y-6">

// Después
<div className="px-4 lg:px-8 py-4 lg:py-6
                lg:grid lg:grid-cols-[minmax(320px,380px)_1fr] lg:gap-8 lg:items-start">

  {/* Izquierda: Nueva cuenta */}
  <div>
    {/* card con header azul, inputs, botón Crear Cuenta */}
  </div>

  {/* Derecha: Personal registrado */}
  <div>
    {/* buscador + lista de tarjetas de usuario */}
  </div>
</div>
```

En mobile, el orden del DOM (nueva cuenta primero, lista después) se preserva. En desktop ambas columnas aparecen al mismo nivel.

---

## 14. Página: Gestión de Permisos (`/dashboard/permisos`)

### 14.1 Estado actual
Columna única con buscador de usuario, dropdowns de módulos y botón guardar.

### 14.2 Diseño objetivo (`permisos.png`)
Dos columnas fijas en desktop (el mock sólo muestra desktop):

- **Izquierda (~360 px):** Panel "GESTIÓN DE ACCESOS" con buscador de usuario, instrucción placeholder y botón "Guardar permisos".
- **Derecha (1fr):** Panel "MÓDULOS DISPONIBLES" con grid `grid-cols-2` de tarjetas de módulo colapsables.

### 14.3 Delta de cambios

#### Layout
```tsx
// Antes: columna única dentro del componente client
<div className="px-4 py-4 space-y-4">

// Después
<div className="px-4 lg:px-8 py-4 lg:py-6
                lg:grid lg:grid-cols-[minmax(320px,360px)_1fr] lg:gap-8 lg:items-start">

  {/* Columna izquierda — Gestión de accesos */}
  <div className="space-y-4">
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
        Gestión de Accesos
      </h2>
      {/* Buscador de usuario */}
      {/* Dropdown de resultados */}
      {/* Placeholder informativo */}
    </div>
    {/* Botón guardar permisos */}
    <button className="w-full ...">Guardar permisos</button>
    {/* Texto "Selecciona un usuario para continuar" cuando no hay usuario */}
  </div>

  {/* Columna derecha — Módulos disponibles */}
  <div>
    <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
      Módulos Disponibles
    </h2>
    {/* Grid de módulos */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {moduleCards.map((modulo) => (
        <ModuloCard key={modulo.id} modulo={modulo} ... />
      ))}
    </div>
  </div>
</div>
```

#### Tarjetas de módulo
```tsx
<div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {/* ícono del módulo en círculo */}
      <ModuloIcon className="size-5 text-primary" />
      <div>
        <p className="text-sm font-semibold text-slate-800">{modulo.title}</p>
        <p className="text-xs text-slate-400">
          {countActive}/{modulo.permissions.length} permisos activos
        </p>
      </div>
    </div>
    {/* Chevron colapsable */}
    <ChevronDown className="size-4 text-slate-400 transition-transform ..." />
  </div>
  {/* Lista de permisos con checkboxes (colapsable) */}
</div>
```

---

## 15. Tokens de diseño desktop

Misma paleta que el SDD anterior. Adiciones específicas para el shell desktop:

| Token | Valor Tailwind | Uso |
|---|---|---|
| Sidebar width | `w-60` (240 px) | Ancho fijo del `DesktopSidebar` |
| Content offset | `lg:ml-60` | Desplazamiento del área principal |
| Desktop header height | `lg:h-16` | `PageHeader` en desktop |
| Sidebar bg | `bg-surface-container-lowest` | Mismo token que el fondo de página |
| Nav item activo | `bg-primary/10 text-primary` | Ítem seleccionado en sidebar |
| Nav item hover | `hover:bg-surface-container` | Estado hover |
| Desktop padding lateral | `lg:px-8` | Contenido de páginas en desktop |
| Desktop padding vertical | `lg:py-6` | Separación superior de contenido |
| Max width contenido | `lg:max-w-4xl lg:mx-auto` | Para listas (servicios, clientes) |
| Two-col left width | `minmax(320px, 380px)` | Columna de formulario/panel |

---

## 16. Nuevo componente requerido

| Componente | Archivo | Tipo | Propósito |
|---|---|---|---|
| `DesktopSidebar` | `src/components/dashboard/desktop-sidebar.tsx` | Client | Sidebar fija con nav y usuario para `lg:` |

Además, mover `isActivePath` de `bottom-nav.tsx` a `navigation-items.ts` para reutilizarla.

---

## 17. Orden de implementación sugerido

1. **Shell primero** — `DesktopSidebar` + cambios en `layout.tsx` + `BottomNav lg:hidden`. En este paso todo el contenido ya queda desplazado correctamente en desktop aunque sin rediseño interno de páginas.
2. **`PageHeader`** — variante desktop con íconos globales. Todas las páginas mejoran el header automáticamente.
3. **Home** — grid de 4 columnas, ocultar sección "Sesión" en desktop.
4. **Detalle Cliente** — dos columnas, es el mock más detallado disponible.
5. **Permisos** — dos columnas, el mock desktop es la única referencia que existe para esta pantalla.
6. **Usuarios** — dos columnas (complementa el SDD de rediseño mobile).
7. **Detalle Servicio** — dos columnas (inferido).
8. **Lista Servicios + Lista Clientes** — ajustes de padding y max-width (cambios menores).
9. **Nuevo Servicio + Entrega** — centering desktop (cambios mínimos).
10. **Smoke test visual** a `lg:` en todas las rutas. Verificar que el `BottomNav` desaparece en desktop y el `DesktopSidebar` aparece.

---

## 18. Fuera de alcance

- Logout desde el sidebar desktop (la acción de cierre de sesión queda sólo en mobile hasta que se añada un menú de perfil).
- Diseño de pantallas de autenticación (`/login`, `/reset-password`).
- Cambios en DB, RLS, Edge Functions o Server Actions.
- Inventario (módulo mencionado en el mock de Permisos pero no implementado).
- Inventario (módulo mencionado en el mock de Permisos pero no implementado).
