# SDD — Rediseño: Usuarios & Detalles del Servicio

**Versión:** 1.0  
**Fecha:** 2026-07-10  
**Alcance:** Alineación visual de dos pantallas al diseño objetivo en `/design/`

---

## 1. Contexto

Las pantallas de **Usuarios** y **Detalles del Servicio (Paso 2)** son funcionales pero su presentación visual difiere del sistema de diseño objetivo definido en los mocks. Este documento describe los cambios de UI requeridos sin tocar la lógica de negocio, acciones de servidor ni queries de base de datos.

Referencia de diseño:
- `design/usuarios.png` — pantalla de gestión de personal
- `design/detalles_servicio.png` — paso 2 del wizard de nuevo servicio

---

## 2. Archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `src/app/dashboard/usuarios/page.tsx` | Rediseño JSX + Tailwind |
| `src/app/dashboard/servicios/nuevo/page.tsx` | Rediseño JSX + Tailwind (Step 2) |
| `src/components/dashboard/nuevo-servicio-step1.tsx` | Agregar stepper visual |
| `src/components/dashboard/service-wizard-stepper.tsx` | **Nuevo componente** — stepper de 3 pasos |

> No se modifican actions, queries Supabase, ni tipos. Solo presentación.

---

## 3. Pantalla 1 — Usuarios

### 3.1 Estado actual

- Layout desktop-first con `xl:grid-cols` de dos columnas.
- Cabeceras internas con patrón `text-xs uppercase tracking-[0.25em]`.
- Botón primario en `bg-slate-950` (negro).
- Campo de búsqueda con botón "Buscar" separado.
- Tarjeta de usuario expone formulario completo de edición inline (4 campos + contraseña).
- Sin avatar gráfico; sin ícono en botón "Desactivar".

### 3.2 Diseño objetivo (`design/usuarios.png`)

- Layout mobile-first, columna única, scroll vertical.
- Card "Nueva cuenta interna" con cabecera con fondo azul claro (`bg-blue-50` o `bg-indigo-50`).
- Inputs con placeholders descriptivos (`Nombre completo`, `ejemplo@workshoppro.com`, `+1 234 567 8900`).
- Botón "Crear Cuenta" en azul (`bg-blue-600`) con ícono de persona+plus.
- Sección "Personal Registrado":
  - Buscador inline con ícono de lupa a la izquierda (sin botón separado).
  - Cada usuario muestra:
    - Avatar circular con inicial (`w-10 h-10 rounded-full bg-slate-200`).
    - Nombre + badge `ACTIVO` / `INACTIVO` en línea.
    - Correo en texto secundario.
    - Botones compactos en fila: **Guardar** (outline gris) y **🚫 Desactivar** (outline rojo con ícono `Ban` de Lucide).
  - El formulario de edición inline permanece funcional pero en un diseño colapsado/compacto (los campos nombre y correo se muestran directamente, sin labels visibles salvo en focus).

### 3.3 Delta de cambios

#### Card "Nueva cuenta interna"

```
ANTES: <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
         <div className="border-b border-slate-200 pb-4">
           <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Agregar usuario</p>
           <h2 className="mt-2 text-2xl font-semibold...">Nueva cuenta interna</h2>

DESPUÉS: <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
           <div className="bg-blue-50 px-5 py-4">
             <h2 className="text-lg font-bold text-slate-800">Nueva cuenta interna</h2>
```

- Inputs: añadir `placeholder` apropiado en cada campo (`Nombre completo`, `ejemplo@workshoppro.com`, `+1 234 567 8900`, `••••••••`).
- Botón submit:
  ```
  ANTES: bg-slate-950 text-white → "Crear usuario"
  DESPUÉS: bg-blue-600 hover:bg-blue-700 text-white → ícono UserPlus + "Crear Cuenta"
  ```

#### Card "Personal Registrado" — buscador

```
ANTES: <input ... /> <button>Buscar</button>

DESPUÉS: <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
           <input className="... pl-9" placeholder="Buscar usuario..." />
         </div>
```

El `<form>` sigue existiendo para el submit nativo, pero eliminar el `<button>Buscar</button>` y dejar que el Enter dispare la búsqueda.

#### Tarjeta de usuario

```
ANTES: tarjeta con grid de 4 campos + password visibles siempre.

DESPUÉS:
  <div className="flex items-center gap-3 p-4">
    {/* Avatar */}
    <div className="flex h-10 w-10 shrink-0 items-center justify-center
                    rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
      {usuario.nombre.charAt(0).toUpperCase()}
    </div>
    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold truncate">{usuario.nombre}</p>
        <StatusBadge active={usuario.status === 1} />
      </div>
      <p className="text-xs text-slate-500 truncate">{usuario.correo}</p>
    </div>
  </div>
  {/* Acciones */}
  <div className="flex gap-2 px-4 pb-4">
    <ActionButton form="form-guardar-{id}" className="h-9 rounded-xl border border-slate-300 px-4 text-sm font-medium">
      Guardar
    </ActionButton>
    <ActionButton form="form-toggle-{id}" className="flex items-center gap-1.5 h-9 rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600">
      <Ban className="size-3.5" /> Desactivar
    </ActionButton>
  </div>
```

Los `<form>` con los campos editables se mantienen en el DOM pero visualmente se reducen. Los campos nombre/correo/teléfono quedan visibles dentro de la tarjeta (sin los labels grandes), con `id` en cada form para que los botones los referencien con el atributo `form`.

### 3.4 Comportamiento sin cambios

- Lógica de permisos (`canAddUser`, `canEditUsers`, `canDeactivateUsers`).
- Server actions `createUsuarioAction`, `updateUsuarioAction`, `toggleUsuarioStatusAction`.
- Paginación.
- Banner de advertencia de `isSupabaseAdminConfigured`.

---

## 4. Pantalla 2 — Detalles del Servicio (Paso 2 del wizard)

### 4.1 Estado actual (`src/app/dashboard/servicios/nuevo/page.tsx` — rama `step === "2"`)

- Layout `lg:grid-cols-[1fr_1.5fr]` con sidebar sticky de vehículo y cliente.
- Sin indicador de progreso (no hay stepper).
- Textarea simple, sin contador de caracteres.
- File input nativo para fotos.
- Botón final "Registrar servicio" en `bg-slate-950`.
- Vehículo y cliente en tarjetas separadas.

### 4.2 Diseño objetivo (`design/detalles_servicio.png`)

- Layout mobile-first, columna única, máx. `max-w-lg mx-auto`.
- **Stepper de 3 pasos** en la parte superior:
  - Paso 1: Identificación (completado, ícono check azul)
  - Paso 2: Detalles (activo, número en círculo azul sólido)
  - Paso 3: Revisión (pendiente, número en círculo gris)
  - Líneas de conexión entre pasos.
- Card **"Vehículo Seleccionado"** con ícono de auto:
  - Fila superior: etiqueta `PLACA` + valor grande (`HGS-345-6`) a la izquierda; `MODELO` + `Toyota Hilux 2021` a la derecha.
  - Fila inferior: avatar con iniciales del cliente (círculo azul claro `AP`) + etiqueta `CLIENTE` + nombre + ícono de lápiz.
- Card **"Descripción del problema"** con ícono de documento:
  - Textarea de altura generosa con placeholder técnico.
  - Contador `0/500` abajo a la izquierda.
- Card **"Fotografías de Ingreso"** con badge `Opcional`:
  - Grilla de miniaturas: primera celda muestra preview de foto subida; celdas siguientes son drop-zones con ícono de cámara y texto "Añadir".
  - Texto de ayuda debajo: "Agregue fotos del estado general...".
- **Footer fijo**: botón `Cancelar` (outline) a la izquierda + botón `Continuar →` (azul sólido) a la derecha.

### 4.3 Nuevo componente: `ServiceWizardStepper`

**Archivo:** `src/components/dashboard/service-wizard-stepper.tsx`

```tsx
// Props
type Step = { label: string; status: "completed" | "active" | "pending" };

export function ServiceWizardStepper({ steps, currentStep }: {
  steps: Step[];
  currentStep: number;
}) { ... }
```

Renderiza la barra de pasos. Se reutiliza en Step 1 y Step 2.

### 4.4 Delta de cambios — Step 2

#### Layout general

```
ANTES: <main className="flex-1 px-6 py-8 sm:px-8">
         <div ... grid lg:grid-cols-[1fr_1.5fr]>

DESPUÉS: <main className="flex-1 pb-24">  {/* padding bottom para el footer fijo */}
           <div className="mx-auto max-w-lg px-4 pt-4 space-y-4">
             <ServiceWizardStepper currentStep={2} />
```

#### Cabecera de página

Eliminar el `<h1>Detalles del servicio</h1>` y el link "← Volver al paso 1" como bloque separado. La navegación queda en el footer fijo con "Cancelar".

#### Card vehículo + cliente (unificada)

```tsx
<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <div className="flex items-center gap-2 mb-3">
    <Car className="size-5 text-blue-600" />
    <h3 className="font-semibold text-slate-800">Vehículo Seleccionado</h3>
  </div>
  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3 mb-3">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Placa</p>
      <p className="text-2xl font-bold text-slate-900">{vehiculo.placa}</p>
    </div>
    <div className="text-right">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Modelo</p>
      <p className="text-sm font-medium text-slate-700">
        {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
      </p>
    </div>
  </div>
  {vehiculo.cliente && (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center
                      rounded-full bg-blue-100 text-sm font-bold text-blue-700">
        {vehiculo.cliente.nombre?.charAt(0).toUpperCase() ?? "?"}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cliente</p>
        <p className="text-sm font-medium text-slate-800">{vehiculo.cliente.nombre}</p>
      </div>
    </div>
  )}
</div>
```

#### Textarea descripción con contador

Convertir el bloque de descripción en un `"use client"` sub-componente `<DescripcionField />` para poder manejar el `useState` del contador de caracteres:

```tsx
// src/components/dashboard/descripcion-field.tsx  (nuevo, client component)
"use client";
export function DescripcionField() {
  const [len, setLen] = useState(0);
  return (
    <div>
      <textarea
        maxLength={500}
        onChange={(e) => setLen(e.target.value.length)}
        ...
      />
      <div className="flex items-center mt-1">
        <span className="text-xs text-slate-400">{len}/500</span>
      </div>
    </div>
  );
}
```

#### Fotografías de Ingreso

```tsx
<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Camera className="size-5 text-blue-600" />
      <h3 className="font-semibold text-slate-800">Fotografías de Ingreso</h3>
    </div>
    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
      Opcional
    </span>
  </div>
  {/* Grid de previews — se mantiene el input[type=file] multiple existente
      pero se envuelve en un grid visual con celdas de "Añadir" */}
  <input accept="image/*" className="hidden" id="fotos-input" multiple name="imagenes" type="file" />
  <label htmlFor="fotos-input" className="...grid de drop zones...">
    <Camera className="size-6 text-slate-400" />
    <span className="text-xs text-slate-400">Añadir</span>
  </label>
  <p className="mt-2 text-xs text-slate-400">
    Agregue fotos del estado general del vehículo y daños específicos...
  </p>
</div>
```

> Las previews de imágenes seleccionadas requieren un `"use client"` wrapper (nuevo componente `<FotoIngreso />`).

#### Footer fijo

```tsx
<div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-3 flex gap-3">
  <Link href="/dashboard/servicios/nuevo"
        className="flex-1 h-11 flex items-center justify-center rounded-xl border border-slate-300 text-sm font-medium text-slate-700">
    Cancelar
  </Link>
  <ActionButton className="flex-1 h-11 rounded-xl bg-blue-600 text-sm font-semibold text-white">
    Continuar →
  </ActionButton>
</div>
```

> El `ActionButton` envuelve el submit del `<form action={createServicioAction}>` existente.

### 4.5 Step 1 — cambios mínimos

Solo se agrega el `<ServiceWizardStepper currentStep={1} />` en la cabecera del Step 1. El resto del componente `NuevoServicioStep1Form` no cambia.

### 4.6 Comportamiento sin cambios

- `createServicioAction` y todos sus parámetros (`vehiculoId`, `descripcion`, `imagenes`).
- Query de vehículo desde Supabase.
- Redirección post-submit.
- Guard de permisos `PERMISOS.SERVICIOS_ADD`.

---

## 5. Token de diseño compartido

Ambas pantallas convergen en la misma paleta. Los valores a usar:

| Token | Valor Tailwind | Uso |
|---|---|---|
| Primario | `blue-600` / `blue-700` (hover) | Botones CTA, iconos activos |
| Superficie card | `bg-white` + `border-slate-200` + `shadow-sm` | Todas las cards |
| Radio card | `rounded-2xl` | Cards contenedoras |
| Radio input | `rounded-xl` | Inputs y botones secundarios |
| Avatar background | `bg-blue-100 text-blue-700` | Iniciales de usuario/cliente |
| Badge activo | `bg-blue-50 text-blue-700 border-blue-100` | `ACTIVO` |
| Badge inactivo | `bg-slate-100 text-slate-500` | `INACTIVO` |
| Texto primario | `text-slate-900` / `text-slate-800` | Nombres, valores clave |
| Texto secundario | `text-slate-500` | Correos, subtítulos |
| Texto label | `text-[10px] uppercase tracking-wider text-slate-400` | Etiquetas de campo |

---

## 6. Componentes nuevos requeridos

| Componente | Archivo | Tipo | Propósito |
|---|---|---|---|
| `ServiceWizardStepper` | `src/components/dashboard/service-wizard-stepper.tsx` | Server | Barra de progreso 3 pasos |
| `DescripcionField` | `src/components/dashboard/descripcion-field.tsx` | Client | Textarea con contador de chars |
| `FotoIngreso` | `src/components/dashboard/foto-ingreso.tsx` | Client | Grid de previews de imágenes |

---

## 7. Orden de implementación sugerido

1. Crear `ServiceWizardStepper` e integrarlo en Step 1 y Step 2.
2. Rediseñar Step 2: card unificada vehículo+cliente → `DescripcionField` → `FotoIngreso` → footer fijo.
3. Rediseñar la página `Usuarios`: card de nueva cuenta → buscador inline → tarjetas de usuario con avatar y botones compactos.
4. Verificar en mobile (375 px) que el footer fijo de Step 2 no tape contenido (el `pb-24` en `<main>` lo previene).
5. Smoke test de permisos: usuario sin `USUARIOS_ADD` no ve la card de creación; usuario sin `USUARIOS_DESACTIVAR` no ve el botón de desactivar.

---

## 8. Fuera de alcance

- Paso 3 "Revisión" del wizard (no existe aún en el diseño actual; se diseñará en un SDD separado).
- Rediseño de la vista de **detalle de servicio existente** (`/dashboard/servicios/[id]/page.tsx`).
- Cambios en la DB, RLS o Edge Functions.
