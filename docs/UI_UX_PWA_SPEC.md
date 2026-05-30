# UI/UX & PWA — Spec de Rediseño Responsivo

**Estado:** Pendiente de implementación  
**Prioridad:** Alta — el uso primario es desde celular/tablet por parte del staff del taller  
**Depende de:** Fases 1–6 completadas

---

## Tabla de contenidos

1. [Diagnóstico del estado actual](#1-diagnóstico)
2. [Sistema de diseño base](#2-sistema-de-diseño)
3. [Navegación móvil](#3-navegación-móvil)
4. [Mejoras por pantalla](#4-mejoras-por-pantalla)
5. [PWA — Configuración técnica](#5-pwa)
6. [Micro-interacciones y polish](#6-polish)
7. [Plan de implementación por fases](#7-plan-de-implementación)

---

## 1. Diagnóstico

### Problemas críticos de navegación

| Problema | Pantalla afectada | Impacto |
|---|---|---|
| El sidebar ocupa ancho completo en móvil antes del contenido | Todas las del dashboard | Alto — el staff hace scroll antes de ver la información |
| No hay patrón de navegación inferior (bottom nav) | Todas las del dashboard | Alto — patrón estándar en apps móviles |
| El sidebar en tablet (`lg:flex-row`) aparece en ~1024px, dejando un hueco a ~768-1023px | Todas | Medio |

### Problemas de layout por pantalla

**F-07 Lista de servicios**
- Las pestañas de filtro (Todos/Pendiente/En Progreso/Finalizado/Entregado) no caben en una línea en móviles pequeños — hacen scroll horizontal invisible
- Cada tarjeta de servicio tiene demasiada información sin jerarquía visual clara en pantallas pequeñas

**F-08 Detalle de servicio**
- En móvil, la columna izquierda (info del vehículo + estado) y la columna derecha (bitácora) se apilan — la bitácora queda muy lejos del scroll
- El formulario de agregar nota requiere mucho scroll hacia abajo
- La cuadrícula de fotos de bitácora en `grid-cols-4` resulta en miniaturas de ~60px — difícil de tocar

**F-06 Crear servicio**
- Step 1 tiene muchos estados condicionales; en móvil la jerarquía visual se pierde
- El campo de búsqueda de cliente y de placa se ven como inputs planos sin feedback táctil claro

**F-09 Entrega / firma**
- El canvas de firma está bien para móvil (PointerEvents), pero el padding lateral reduce el área útil
- En tablets el canvas podría ser más grande

**F-05 Detalle de cliente**
- Los formularios de edición de vehículo son muy largos en móvil
- El grid `xl:grid-cols-[0.88fr_1.12fr]` no se activa hasta 1280px — en tablets iPad se ve en una sola columna muy estrecha

### Problemas de toque

- Los botones secundarios (`py-2 px-4`) tienen ~36px de alto — por debajo del mínimo recomendado de 44px (Apple HIG / Material Design)
- Las imágenes en cuadrícula `grid-cols-3` o `grid-cols-4` resultan en targets de ~70-80px en un iPhone 13 — aceptable pero justo

---

## 2. Sistema de diseño

### 2.1 Breakpoints

```
xs:  < 480px   → iPhone SE, teléfonos pequeños
sm:  480–639px → iPhone estándar (principal target)
md:  640–767px → iPhone Plus / Android grande
lg:  768–1023px → iPad mini / iPad (principal target tablet)
xl:  1024px+   → iPad Pro / escritorio
```

> **Cambio:** Actualmente `lg:` se usa para "columna lateral" (1024px). Propuesta: usar `lg:` en 768px para que iPad mini entre al layout de dos columnas.

### 2.2 Tokens de espaciado para touch

| Token | Valor | Uso |
|---|---|---|
| `touch-target` | min 44px | Altura mínima de botones e inputs |
| `touch-target-lg` | 52px | Botones primarios en formularios |
| `bottom-nav-height` | 64px | Altura de la barra inferior |
| `safe-bottom` | `env(safe-area-inset-bottom)` | Padding extra en iPhone con home indicator |

### 2.3 Tipografía

| Elemento | Actual | Propuesto |
|---|---|---|
| Título de página (h1) | `text-3xl` | `text-2xl sm:text-3xl` |
| Subtítulo de sección | `text-2xl` | `text-xl sm:text-2xl` |
| Etiqueta de formulario | `text-sm font-medium` | Sin cambio (correcto) |
| Texto secundario | `text-sm text-slate-500` | Sin cambio |
| Placa (badge) | `text-xs tracking-[0.2em]` | Sin cambio (correcto) |

### 2.4 Paleta confirmada

La paleta actual es correcta para PWA. No se proponen cambios de color, solo consistencia:

```css
--background: #f7f3ec;   /* crema cálido — fondo general */
--card: #ffffff;          /* tarjetas */
--slate-950: #020617;    /* acciones primarias, sidebar */
--orange-700: #c2410c;   /* acentos de marca */
--emerald-600: #059669;  /* estados positivos, entregas */
--rose-600: #e11d48;     /* acciones destructivas */
```

---

## 3. Navegación móvil

### 3.1 Patrón propuesto: Bottom Navigation + Sidebar condicional

- **Móvil (< 1024px)**: Bottom navigation bar fija en la parte inferior, sidebar oculto
- **Escritorio (≥ 1024px)**: Sidebar izquierdo, sin bottom nav (comportamiento actual)

```
┌─────────────────────────┐
│  Taller Mecánico   [👤] │  ← Header compacto en móvil (56px)
├─────────────────────────┤
│                         │
│      Contenido          │
│      de la página       │
│                         │
│                         │
├─────────────────────────┤
│ [⚙️Inicio] [📋] [👥] [🔧] │  ← Bottom nav (64px + safe area)
└─────────────────────────┘
```

### 3.2 Componente `<BottomNav />`

```tsx
// src/components/dashboard/bottom-nav.tsx
// "use client" — necesita usePathname para active state

const items = [
  { href: "/dashboard",           icon: LayoutGrid,    label: "Inicio"    },
  { href: "/dashboard/servicios", icon: ClipboardList, label: "Servicios" },
  { href: "/dashboard/clientes",  icon: CarFront,      label: "Clientes"  },
  { href: "/dashboard/usuarios",  icon: Users,         label: "Usuarios"  },
]
```

**Estilos:**
- Fondo: `bg-slate-950`
- Item activo: `text-orange-400` con indicador puntito arriba
- Item inactivo: `text-slate-400`
- Altura: `h-16` + `pb-[env(safe-area-inset-bottom)]`

### 3.3 Cambios al Dashboard Layout (`layout.tsx`)

```tsx
// Aside: solo visible en lg+
<aside className="hidden lg:flex lg:flex-col lg:w-72 ...">
  ...
</aside>

// Header compacto solo en móvil
<header className="lg:hidden flex items-center justify-between px-5 py-3 bg-slate-950 text-white rounded-2xl">
  <span className="text-sm font-semibold">Taller Mecánico</span>
  <span className="text-sm text-slate-300">{staff.nombre}</span>
</header>

// Bottom nav solo en móvil
<BottomNav className="lg:hidden" />

// Padding inferior del contenido para no quedar bajo el bottom nav
<div className="... pb-20 lg:pb-0">
  {children}
</div>
```

### 3.4 Safe Area en iOS

En `globals.css`:

```css
body {
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
```

En `layout.tsx` (root):
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

---

## 4. Mejoras por pantalla

### 4.1 F-02 Dashboard Home

**Problema:** 4 tarjetas de navegación en grid — en móvil se ven demasiado grandes verticalmente.

**Propuesta:**
- Grid `grid-cols-2` siempre (en vez de `flex-col` en móvil)
- Tarjetas más compactas: icon + label, sin descripción larga
- Agregar un banner de "Servicios activos hoy" con contador rápido

```
┌──────────┬──────────┐
│ ➕ Nuevo │ 📋 Lista │
│ servicio │servicios │
├──────────┼──────────┤
│ 👥 Clien │ 👤 Usua  │
│   tes    │  rios    │
└──────────┴──────────┘
```

---

### 4.2 F-07 Lista de servicios

**Problema:** Las pestañas de estado no caben en línea horizontal en pantallas < 380px.

**Propuesta:**
- Scroll horizontal en las pestañas con `overflow-x-auto snap-x`
- Estilo pill con snap points: `snap-start flex-shrink-0`
- Mostrar solo el label corto en móvil: "Pendiente" → solo el badge de color + texto

**Tarjeta de servicio mejorada para móvil:**
```
┌─────────────────────────────────────┐
│ [HGS-3456]  Honda Civic    🟡 Pend  │
│ Cliente: Juan Torres                │
│ Hace 2 horas · "Cambio de aceite…" │
└─────────────────────────────────────┘
```
- Placa, status badge y nombre en una sola línea de "header"
- Segunda línea: cliente + fecha relativa
- Tercera línea (opcional): descripción truncada

---

### 4.3 F-08 Detalle de servicio

**Problema mayor:** En móvil, el usuario tiene que hacer mucho scroll para llegar a la bitácora.

**Propuesta — Tabs en móvil:**

```tsx
// Solo en móvil (< lg), mostrar un tab switcher:
// [Información] [Bitácora (3)]
// En desktop, mantener el layout de dos columnas actual
```

```
┌──────────────────────────────────┐
│ [ℹ️ Información] [📝 Bitácora 3] │  ← Tabs solo en móvil
├──────────────────────────────────┤
│                                  │
│  Contenido del tab activo        │
│                                  │
└──────────────────────────────────┘
```

**Grid de fotos de bitácora:**
- Cambiar `grid-cols-4` a `grid-cols-2 sm:grid-cols-4`
- Esto da ~150px por foto en iPhone → tocable cómodamente

**Botón "Agregar nota":**
- En móvil: botón FAB (floating action button) en esquina inferior derecha que abre un sheet/drawer con el formulario
- En desktop: mantener el panel de la derecha como está

---

### 4.4 F-06 Crear servicio (wizard)

**Step 1 en móvil:**
- Separar visualmente las dos búsquedas (por placa vs por cliente) con tabs o acordeón
- El banner de confirmación del vehículo resuelto debe ser sticky en la parte superior al hacer scroll

**Step 2 en móvil:**
- El input de imágenes debe mostrar "Tomar foto" como primera opción (`capture="environment"` en el input)
- Agregar thumbnails con X para eliminar antes de subir

```tsx
// Input con cámara como opción primaria en móvil
<input
  type="file"
  accept="image/*"
  capture="environment"   // abre la cámara directamente en móvil
  multiple
  name="imagenes"
/>
```

---

### 4.5 F-09 Entrega / firma

**Problema:** El canvas de firma pierde área útil por el padding lateral en móviles pequeños.

**Propuesta:**
- En móvil: mostrar el canvas de firma en ancho completo (`-mx-6` para romper el padding del contenedor)
- En tablet/desktop: mantener el layout actual de dos columnas
- Altura del canvas: aumentar de 220px a 260px en móvil (más espacio para firmar con el dedo)

---

### 4.6 F-05 Detalle de cliente

**Problema:** El grid `xl:grid-cols-[0.88fr_1.12fr]` no aparece hasta 1280px.

**Propuesta:** Cambiar a `lg:grid-cols-[0.88fr_1.12fr]` — así iPad Pro (1024px) ya ve el layout de dos columnas.

Los formularios de edición de vehículo: en móvil, colapsar por defecto y expandir con un toggle "Editar" para no mostrar 5 inputs por cada vehículo.

---

### 4.7 Página de seguimiento (`/seguimiento/[token]`)

**Estado actual:** Ya es mobile-first. ✅

**Mejoras menores:**
- El stepper ya funciona bien. En pantallas < 380px los labels pueden superponerse — reducir a `text-[10px]` o truncar.
- Agregar botón "Compartir" nativo (`navigator.share()`) en móviles que lo soporten, además del link ya enviado.

---

## 5. PWA

### 5.1 Archivos requeridos

```
public/
├── manifest.json
├── icons/
│   ├── icon-192.png      (192×192)
│   ├── icon-512.png      (512×512)
│   ├── icon-maskable.png (512×512, con padding para maskable)
│   └── apple-touch-icon.png (180×180)
└── screenshots/
    ├── mobile-home.png   (para el install prompt en Android)
    └── tablet-home.png
```

### 5.2 `public/manifest.json`

```json
{
  "name": "Taller Mecánico",
  "short_name": "Taller",
  "description": "Sistema de gestión del taller mecánico",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#f7f3ec",
  "theme_color": "#020617",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/mobile-home.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screenshots/tablet-home.png", "sizes": "1024x1366", "type": "image/png", "form_factor": "wide" }
  ]
}
```

### 5.3 Meta tags en `src/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: "Taller Mecánico",
  description: "Sistema de gestión del taller mecánico",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Taller",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

// Viewport con viewport-fit=cover para safe areas
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020617",
};
```

### 5.4 Service Worker (básico)

Next.js no incluye SW por defecto. Opciones:

| Opción | Esfuerzo | Beneficio |
|---|---|---|
| `next-pwa` (plugin) | Bajo | Cache automático de assets estáticos |
| SW manual | Alto | Control total (offline pages, background sync) |
| Sin SW por ahora | Ninguno | La app se puede instalar igualmente via manifest |

**Recomendación para esta fase:** Empezar sin SW. El manifest es suficiente para que Android/iOS permitan "Agregar a pantalla de inicio" y la app se abra sin chrome del navegador. El SW se puede agregar en Phase 8 si se necesita soporte offline.

### 5.5 Checklist de instalabilidad

Para que Chrome/Safari ofrezcan instalar la PWA, se necesita:
- [x] HTTPS (Vercel lo provee automáticamente)
- [ ] `manifest.json` con `name`, `short_name`, `icons`, `start_url`, `display: "standalone"`
- [ ] Al menos un ícono de 192px y uno de 512px
- [ ] `<link rel="manifest">` en el `<head>` (lo pone Next.js con `metadata.manifest`)
- [ ] `theme-color` meta tag
- [ ] `viewport-fit=cover` en el viewport

---

## 6. Polish

### 6.1 Loading skeletons

Actualmente no hay estados de carga — las páginas son Server Components que bloquean hasta tener datos. Con `loading.tsx` de Next.js:

```
src/app/dashboard/servicios/loading.tsx     → skeleton de tarjetas
src/app/dashboard/servicios/[id]/loading.tsx → skeleton de detalle
src/app/dashboard/clientes/loading.tsx      → skeleton de tabla
```

Cada `loading.tsx` devuelve un layout de pulso (`animate-pulse bg-slate-200`) que coincide visualmente con la página real.

### 6.2 Toast notifications

Actualmente los errores y éxitos se muestran como banners en la URL (`?error=...`). Esto funciona pero se pierde si el usuario navega.

**Propuesta:** Instalar `sonner` (ya compatible con Next.js App Router) para toasts:
- Éxito al agregar nota → toast verde "Nota agregada"
- Error en cualquier acción → toast rojo con el mensaje
- Entrega completada → toast verde + confeti opcional 🎉

### 6.3 Empty states

Pantallas que necesitan un empty state visual en vez de nada:

| Pantalla | Estado vacío |
|---|---|
| Lista de servicios sin resultados | "No hay servicios con esos filtros" + botón limpiar |
| Bitácora sin notas | Ilustración + "El técnico aún no ha registrado notas" |
| Lista de clientes vacía | "Aún no hay clientes registrados" + botón agregar |
| Vehículos de cliente vacío | Ya tiene empty state ✅ |

### 6.4 Visor de imágenes full-screen

Actualmente las fotos abren en `target="_blank"` — funcional pero rompe el flujo de la app.

**Propuesta:** Componente `<ImageViewer>` (dialog modal):
- Se abre al tocar una miniatura
- Muestra la imagen a pantalla completa con fondo negro
- Swipe lateral para navegar entre fotos del mismo grupo
- Botón ✕ para cerrar
- En desktop: teclas ← → + Escape

### 6.5 Pull-to-refresh

En móvil los usuarios esperan poder hacer pull-to-refresh para actualizar la lista de servicios. Next.js Server Components no tienen esto nativo — se puede implementar con un botón de "Actualizar" o con `router.refresh()` en un Client Component.

### 6.6 Confirmación de acciones destructivas

Actualmente eliminar un cliente o vehículo ocurre directamente sin confirmar. En móvil es fácil tocar sin querer.

**Propuesta:** Dialog de confirmación antes de cualquier eliminación:
```tsx
// Componente genérico <ConfirmDialog>
// Mensaje configurable, botones "Cancelar" y "Eliminar"
// Activado desde el botón de eliminar via estado local
```

---

## 7. Plan de implementación

### Fase A — PWA rápida (1–2 horas)
Impacto alto, esfuerzo bajo. La app se puede instalar en el celular del técnico.

1. Crear íconos (192×512×maskable) — se pueden generar en realfavicongenerator.net
2. Crear `public/manifest.json`
3. Actualizar `src/app/layout.tsx` con metadata de PWA y `viewport-fit=cover`
4. Agregar `padding-bottom: env(safe-area-inset-bottom)` al bottom nav

### Fase B — Bottom navigation (2–3 horas)
Elimina el problema más grande: navegar desde el celular.

1. Crear `src/components/dashboard/bottom-nav.tsx`
2. Modificar `src/app/dashboard/layout.tsx`:
   - Ocultar sidebar en `< lg`
   - Agregar header compacto móvil
   - Agregar `<BottomNav>` fixed en bottom
   - Agregar `pb-20 lg:pb-0` al contenedor de contenido

### Fase C — Responsive por pantalla (4–6 horas)
Mejoras específicas de cada feature.

1. F-07: Pestañas con scroll horizontal + tarjeta de servicio mejorada
2. F-08: Tabs móvil (Información / Bitácora) + grid fotos `grid-cols-2`
3. F-05: Activar grid en `lg:` en vez de `xl:`
4. F-06: Input con `capture="environment"` para cámara
5. F-09: Canvas de firma full-width en móvil

### Fase D — Polish (3–4 horas)
1. `loading.tsx` skeletons para servicios y detalle
2. Instalar `sonner` + agregar toasts en todas las Server Actions
3. Empty states visuales
4. `<ImageViewer>` modal full-screen
5. `<ConfirmDialog>` para eliminaciones

### Estimación total: ~12–15 horas

---

*Documento creado: 2026-05-29*  
*Ver también: [PORTAL_CLIENTE_AUTH.md](./PORTAL_CLIENTE_AUTH.md) (Escenario A del portal)*
