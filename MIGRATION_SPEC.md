# Taller Mecánico — Migration Spec: Next.js + Supabase

> Spec-Driven Development (SDD) document for migrating the existing Flutter + NestJS system to a Next.js web application with Supabase as the backend platform.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack Decision](#2-tech-stack-decision)
3. [Database Schema (Supabase / PostgreSQL)](#3-database-schema)
4. [Authentication System](#4-authentication-system)
5. [Feature Specifications](#5-feature-specifications)
   - [F-01 Login & Session](#f-01-login--session)
   - [F-02 Dashboard / Home](#f-02-dashboard--home)
   - [F-03 User Management](#f-03-user-management)
   - [F-04 Client Management](#f-04-client-management)
   - [F-05 Vehicle Management](#f-05-vehicle-management)
   - [F-06 Create Service (Multi-step)](#f-06-create-service-multi-step)
   - [F-07 Service List & Tracking (Continuar Servicio)](#f-07-service-list--tracking)
   - [F-08 Service Detail & Bitácora](#f-08-service-detail--bitácora)
   - [F-09 Vehicle Delivery & Signature](#f-09-vehicle-delivery--signature)
   - [F-10 Image Upload](#f-10-image-upload)
   - [F-11 Client Portal (Public)](#f-11-client-portal-public)
   - [F-12 Portal Link Management](#f-12-portal-link-management)
6. [API / Data Layer Spec](#6-api--data-layer-spec)
7. [File & Folder Structure](#7-file--folder-structure)
8. [Routing Map](#8-routing-map)
9. [UI Component Inventory](#9-ui-component-inventory)
10. [State Management](#10-state-management)
11. [Row Level Security (RLS) Policies](#11-row-level-security-rls-policies)
12. [Supabase Storage Buckets](#12-supabase-storage-buckets)
13. [Migration Checklist](#13-migration-checklist)

---

## 1. System Overview

**Taller Mecánico** is a motorcycle repair shop management system. Staff (mechanics/admins) log into a private admin interface to manage clients, vehicles, and repair services. Each service tracks lifecycle states from intake to delivery, including a detailed work log (bitácora) with photos.

Clients can optionally access a read-only public portal via a unique link to view their vehicle's service progress.

### Current Stack
| Layer | Technology |
|---|---|
| Mobile Frontend | Flutter |
| Backend API | NestJS (REST) |
| Database | MySQL via Prisma ORM |
| Image Storage | Server filesystem |
| Auth | Custom JWT (HS256) + refresh tokens |

### Target Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router) |
| Backend | Supabase (PostgreSQL + RLS + Edge Functions) |
| Auth | Supabase Auth (email/password) |
| Image Storage | Supabase Storage |
| Validation | Zod |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand (global) + React Query (server state) |

---

## 2. Tech Stack Decision

### Why Next.js App Router
- Server Components reduce client bundle size for data-heavy admin views
- Server Actions simplify form submissions without building REST endpoints
- Layouts handle shared navigation/auth wrappers cleanly
- Native Image component for optimized vehicle/service photos

### Why Supabase
- PostgreSQL is structurally compatible with existing MySQL schema (~95%)
- Built-in Auth replaces custom JWT + refresh logic entirely
- Storage buckets replace server filesystem for images
- RLS enforces data access at database level
- Realtime subscriptions available for service status updates (optional)

### Why Zustand over Context API
- Avoids Provider hell for session + filter state
- Simpler DevEx for managing global service filters and UI state

---

## 3. Database Schema

All tables are created in the `public` schema of the Supabase PostgreSQL instance.

### 3.1 `usuarios` (Internal Staff Users)

> Note: Admin staff are managed via Supabase Auth (`auth.users`) AND this table. The `auth_id` links both.

```sql
CREATE TABLE usuarios (
  id           SERIAL PRIMARY KEY,
  auth_id      UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre       VARCHAR(100) NOT NULL,
  correo       VARCHAR(100) NOT NULL UNIQUE,
  telefono     VARCHAR(15),
  status       SMALLINT NOT NULL DEFAULT 1 CHECK (status IN (0, 1))
);
```

**Field Notes:**
- `auth_id` — UUID from Supabase Auth. Null if the staff account has been deactivated but their history must be preserved.
- `status` — 1 = active, 0 = inactive (soft delete).
- Password is managed entirely by Supabase Auth; no password field here.

### 3.2 `clientes` (Repair Shop Customers)

```sql
CREATE TABLE clientes (
  id        SERIAL PRIMARY KEY,
  nombre    VARCHAR(100),
  correo    VARCHAR(100),
  telefono  VARCHAR(15)
);
```

### 3.3 `vehiculos` (Vehicles)

```sql
CREATE TABLE vehiculos (
  id          SERIAL PRIMARY KEY,
  cliente_id  INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  placa       VARCHAR(45) NOT NULL,
  marca       VARCHAR(45),
  modelo      VARCHAR(45),
  color       VARCHAR(45),
  anio        SMALLINT
);

CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);
CREATE INDEX idx_vehiculos_cliente_id ON vehiculos(cliente_id);
```

### 3.4 `servicios` (Repair Orders)

```sql
CREATE TABLE servicios (
  id                SERIAL PRIMARY KEY,
  vehiculo_id       INT NOT NULL REFERENCES vehiculos(id),
  usuario_recibe    INT REFERENCES usuarios(id),   -- staff member who received vehicle
  usuario_entrega   INT REFERENCES usuarios(id),   -- staff member who delivered vehicle
  usuario_finaliza  INT REFERENCES usuarios(id),   -- staff member who finished the service
  descripcion       TEXT,
  fecha_inicio      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_fin         TIMESTAMPTZ,
  fecha_entrega     TIMESTAMPTZ,
  status            SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2, 3)),
  imagen_uno        VARCHAR(255),
  imagen_dos        VARCHAR(255),
  imagen_tres       VARCHAR(255),
  imagen_cuatro     VARCHAR(255),
  imagen_cinco      VARCHAR(255)
);

CREATE INDEX idx_servicios_status ON servicios(status);
CREATE INDEX idx_servicios_vehiculo_id ON servicios(vehiculo_id);
CREATE INDEX idx_servicios_fecha_inicio ON servicios(fecha_inicio DESC);
```

**Status Values:**
| Value | Label | Color |
|---|---|---|
| 0 | Pendiente | Orange |
| 1 | En Progreso | Blue |
| 2 | Finalizado | Green |
| 3 | Entregado | Gray |

### 3.5 `bitacoras` (Service Work Log)

```sql
CREATE TABLE bitacoras (
  id           SERIAL PRIMARY KEY,
  servicio_id  INT NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  usuario_id   INT REFERENCES usuarios(id),
  fecha        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  descripcion  TEXT NOT NULL,
  imagen_uno   VARCHAR(255),
  imagen_dos   VARCHAR(255),
  imagen_tres  VARCHAR(255),
  imagen_cuatro VARCHAR(255)
);

CREATE INDEX idx_bitacoras_servicio_id ON bitacoras(servicio_id);
```

### 3.6 `cliente_portal_links` (Client Public Access Tokens)

```sql
CREATE TABLE cliente_portal_links (
  id              SERIAL PRIMARY KEY,
  cliente_id      INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  token_hash      VARCHAR(255) NOT NULL UNIQUE,   -- SHA-256 of raw token
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_en       TIMESTAMPTZ NOT NULL,
  revocado_en     TIMESTAMPTZ,
  ultimo_acceso   TIMESTAMPTZ,
  status          SMALLINT NOT NULL DEFAULT 1 CHECK (status IN (0, 1))
);
```

**Token Lifecycle:**
- Token is generated as a cryptographically random 32-byte hex string
- Only the SHA-256 hash is stored in the database
- The raw token is sent once to the requesting staff member via the API response
- Token is valid when: `status = 1` AND `expira_en > NOW()` AND `revocado_en IS NULL`

---

## 4. Authentication System

### 4.1 Strategy

Use **Supabase Auth** with email/password provider. Staff accounts are created by other admins (not self-registration).

### 4.2 Session Flow

```
1. Staff navigates to /login
2. Enters correo + password
3. Next.js calls supabase.auth.signInWithPassword()
4. Supabase returns session (access_token + refresh_token)
5. Session is stored in httpOnly cookie via @supabase/ssr
6. All subsequent requests include cookie automatically
7. Middleware validates session on every protected route
8. Supabase auto-refreshes access_token before expiry
```

### 4.3 Middleware Guard

```ts
// middleware.ts — protects all routes under /dashboard/**
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

### 4.4 Admin User Creation Flow

- Admins create new staff via the Users screen
- System calls `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
- Then inserts a row in `public.usuarios` with `auth_id = newUser.id`
- This requires a Server Action with the Supabase service role key (never exposed to client)

### 4.5 Password Reset

- Staff can request password reset via `/forgot-password`
- Calls `supabase.auth.resetPasswordForEmail(email)`
- Supabase sends the reset email automatically
- No custom token management required

---

## 5. Feature Specifications

---

### F-01 Login & Session

**Route:** `/login`

**Purpose:** Authenticate staff members before accessing the admin interface.

#### UI Elements
- Email input (type="email", autocomplete="email")
- Password input (type="password", autocomplete="current-password", show/hide toggle)
- "Recordarme" checkbox (persists session in cookie with longer expiry)
- "Olvidé mi contraseña" link → `/forgot-password`
- Submit button: "Iniciar Sesión"
- Error alert for invalid credentials

#### Behavior
- On success: redirect to `/dashboard`
- On error: show error message below the form (do not clear fields)
- If user is already logged in and navigates to `/login`: redirect to `/dashboard`
- Session cookie persists across browser restarts

#### Server Action
```ts
// action: loginAction(formData)
const { error } = await supabase.auth.signInWithPassword({
  email: formData.get('correo'),
  password: formData.get('password'),
})
if (error) return { error: 'Credenciales incorrectas' }
redirect('/dashboard')
```

#### Forgot Password Route: `/forgot-password`
- Single email input
- On submit: calls `supabase.auth.resetPasswordForEmail()`
- Shows success message regardless of whether email exists (security)

---

### F-02 Dashboard / Home

**Route:** `/dashboard`

**Purpose:** Main navigation hub after login.

#### UI Elements
- 4 large navigation cards:
  1. **Agregar Servicio** → `/dashboard/servicios/nuevo`
  2. **Continuar Servicio** → `/dashboard/servicios`
  3. **Usuarios** → `/dashboard/usuarios`
  4. **Clientes** → `/dashboard/clientes`
- Top navigation bar with:
  - Shop logo / name
  - Current user name
  - Logout button (calls `supabase.auth.signOut()` → redirect `/login`)

#### Notes
- Cards are visually distinct with icons
- Layout is responsive (2-column on desktop, 1-column on mobile)

---

### F-03 User Management

**Route:** `/dashboard/usuarios`

**Purpose:** Admins manage staff accounts (create, edit, deactivate).

#### UI Elements
- Search input: filter by name, email, or phone (client-side filter)
- Data table columns:
  - Nombre
  - Correo
  - Teléfono
  - Estado (badge: Activo / Inactivo)
  - Actions (Edit, Deactivate/Activate)
- Pagination: 10 rows per page (configurable)
- "Agregar Usuario" button → opens modal/drawer

#### Add User Modal
**Fields:**
| Field | Type | Validation |
|---|---|---|
| Nombre | text | required, min 2 chars |
| Correo | email | required, valid email, unique |
| Teléfono | text | optional, max 15 chars |
| Contraseña | password | required, min 8 chars |

**On Submit (Server Action):**
1. Call `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
2. Insert into `public.usuarios` with `auth_id`
3. Revalidate users list

#### Edit User Modal
- Same fields as Add, except password is optional (only updated if provided)
- Cannot change own email (guard against lockout)

#### Deactivate / Activate
- Toggle `status` field on `usuarios` table
- If deactivating: also call `supabase.auth.admin.updateUserById(auth_id, { ban_duration: 'none' })` to invalidate sessions
- Confirm dialog before deactivating

#### Data Fetching
```ts
// Server Component fetches initial data
const { data: usuarios } = await supabase
  .from('usuarios')
  .select('id, nombre, correo, telefono, status')
  .order('nombre')
```

---

### F-04 Client Management

**Route:** `/dashboard/clientes`

**Purpose:** Manage repair shop customers.

#### UI Elements
- Search input: filter by name, email, phone (server-side debounced search)
- Data table columns:
  - Nombre
  - Correo
  - Teléfono
  - Vehículos (count badge)
  - Actions (Edit, Delete)
- Pagination: 10 rows per page
- "Agregar Cliente" button → opens modal

#### Add / Edit Client Modal
**Fields:**
| Field | Type | Validation |
|---|---|---|
| Nombre | text | optional (but warn if empty) |
| Correo | email | optional |
| Teléfono | text | optional, max 15 chars |

#### Delete Client
- Show confirmation dialog with warning: "Se eliminarán también todos sus vehículos"
- Hard delete (no soft delete for clients)

#### Search Behavior
- Debounce 300ms on input change
- Searches `nombre`, `correo`, `telefono` columns (ILIKE)

```ts
// Server Action or route handler
const { data } = await supabase
  .from('clientes')
  .select('*, vehiculos(count)')
  .ilike('nombre', `%${query}%`)
  .order('nombre')
  .range(offset, offset + limit - 1)
```

---

### F-05 Vehicle Management

Vehicle management is embedded within Client context (not a standalone page).

#### Client Detail Page: `/dashboard/clientes/[id]`
- Shows client info at the top (editable inline or via modal)
- Lists all vehicles for that client
- Each vehicle row: placa, marca, modelo, color, año + Edit / Delete actions
- "Agregar Vehículo" button → modal

#### Add / Edit Vehicle Modal
**Fields:**
| Field | Type | Validation |
|---|---|---|
| Placa | text | required, max 45 chars |
| Marca | text | optional |
| Modelo | text | optional |
| Color | text | optional |
| Año | number | optional, 1900–current year |

#### Plate Lookup (also used in Create Service flow)
- Input: plate number
- Calls: `GET /api/vehiculos/search?placa={plate}`
- Returns: vehicle + client info if found
- If found: auto-fill all vehicle and client fields
- If not found: show "Vehículo no registrado — ingresa los datos manualmente"

---

### F-06 Create Service (Multi-step)

**Route:** `/dashboard/servicios/nuevo`

**Purpose:** Register a new vehicle intake for repair.

This is a 2-step wizard implemented with URL state (`?step=1` and `?step=2`) or a client-side state machine.

---

#### Step 1 — Client & Vehicle

**Client Section:**
- Autocomplete search by client name (fetches from `clientes` as user types, debounce 300ms)
- If match selected: auto-fill correo and teléfono (readonly)
- If no match: toggle "Nuevo Cliente" mode — all fields become editable
- "Nuevo Cliente" fields: nombre, correo (optional), teléfono (optional)

**Vehicle Section (depends on Client):**
- If existing client with vehicles: show dropdown of their vehicles
  - Option to "Agregar otro vehículo"
- If new client OR "Agregar otro vehículo": show plate lookup field + manual form
  - User enters plate → button "Buscar" → looks up in DB
  - If found: auto-fill marca, modelo, color, año
  - If not found: all fields editable manually
- Vehicle fields: placa (required), marca, modelo, color, año

**Validation before advancing to Step 2:**
- Either an existing client is selected OR nombre is filled for new client
- Placa field is filled

---

#### Step 2 — Service Details

**Fields:**
| Field | Type | Validation |
|---|---|---|
| Descripción | textarea | optional |
| Imágenes | file input (multiple) | max 5 files, images only |

**Image Upload Area:**
- Drag-and-drop zone OR "Tomar/Seleccionar Foto" button
- Shows grid of selected image thumbnails (max 5)
- Each thumbnail has an X button to remove it
- Counter badge: "n/5 imágenes"

**Submit Behavior (Server Action):**
1. If new client: `INSERT INTO clientes` → get `cliente_id`
2. If new vehicle: `INSERT INTO vehiculos` → get `vehiculo_id`
3. Upload each image to Supabase Storage → get public URLs
4. `INSERT INTO servicios` with `vehiculo_id`, `usuario_recibe = currentUser.id`, description, image URLs, `status = 0`
5. Redirect to `/dashboard/servicios`

---

### F-07 Service List & Tracking

**Route:** `/dashboard/servicios`

**Purpose:** View all services in progress and search/filter them.

#### UI Elements
- Search input: filter by plate, client name, or description
- Status filter tabs or dropdown: All | Pendiente | En Progreso | Finalizado | Entregado
- Service cards / table rows ordered by: most recent first
- "Agregar Servicio" shortcut button (top right)

#### Service Card / Row Data
| Field | Notes |
|---|---|
| Placa badge | pill-style, prominent |
| Marca + Modelo | vehicle info |
| Cliente nombre | |
| Status badge | color-coded |
| Fecha de ingreso | relative (e.g., "hace 2 días") |
| Descripción | truncated to 80 chars |
| "Entregar Vehículo" button | visible only when `status = 2` (Finalizado) |

#### Click Behavior
- Clicking a service card → `/dashboard/servicios/[id]`
- Clicking "Entregar Vehículo" → `/dashboard/servicios/[id]/entrega`

#### Data Fetching
```ts
// Server Component with searchParams
const { data: servicios } = await supabase
  .from('servicios')
  .select(`
    id, descripcion, status, fecha_inicio, imagen_uno,
    vehiculo:vehiculos(id, placa, marca, modelo, color,
      cliente:clientes(id, nombre, telefono)
    )
  `)
  .eq('status', statusFilter ?? undefined)
  .ilike('vehiculos.placa', `%${search}%`)
  .order('fecha_inicio', { ascending: false })
```

---

### F-08 Service Detail & Bitácora

**Route:** `/dashboard/servicios/[id]`

**Purpose:** View full service details and add/view work log entries.

#### Top Section — Service Summary
- Vehicle: placa, marca, modelo, color, año
- Client: nombre, teléfono
- Received by: staff name
- Date received: formatted date
- Status badge (with inline status update control)
- Description
- Initial photos grid (up to 5, clickable to full-screen)

#### Status Update Control
- Dropdown or segmented control to change status
- Transitions allowed:
  - `0 Pendiente` → `1 En Progreso`
  - `1 En Progreso` → `2 Finalizado` (sets `fecha_fin` and `usuario_finaliza`)
  - Cannot go backwards
  - Status `3 Entregado` is set via the Delivery flow only

#### Bitácora Section (Work Log)
- Chronological list of entries (oldest first)
- Each entry shows:
  - Timestamp (date + time)
  - Staff name (avatar/initials)
  - Description text
  - Photo thumbnails (up to 4), clickable to full-screen

**Add Bitácora Entry Form (at bottom of list):**
| Field | Type | Validation |
|---|---|---|
| Descripción | textarea | required, min 5 chars |
| Imágenes | file input | optional, max 4 files, images only |

- Submit button: "Agregar Nota"
- On submit: upload images → insert into `bitacoras` → optimistic UI update

#### Image Full-Screen Viewer
- Modal/dialog with full-size image
- Previous/Next navigation if multiple images

---

### F-09 Vehicle Delivery & Signature

**Route:** `/dashboard/servicios/[id]/entrega`

**Purpose:** Capture customer signature and mark service as delivered.

#### UI Elements
- Service summary (readonly): vehicle plate, client name, service description
- Current date/time displayed
- **Signature Pad:**
  - Canvas element (responsive width)
  - Touch and mouse support
  - "Limpiar" button to reset
- "Confirmar Entrega" button (disabled if signature is empty)

#### Submit Behavior (Server Action)
1. Serialize signature canvas to PNG data URL or SVG path data
2. Upload signature image to Supabase Storage bucket `firmas/`
3. `UPDATE servicios SET status = 3, fecha_entrega = NOW(), usuario_entrega = currentUser.id WHERE id = {id}`
4. Store signature URL in a new column or as a bitácora entry with description "Firma de entrega"
5. Redirect to `/dashboard/servicios`

> **DB Note:** Add `firma_entrega_url VARCHAR(255)` column to `servicios` table for the delivery signature image URL.

#### Signature Pad Component Spec
```ts
// Component: SignaturePad
// Props: onChange(dataUrl: string | null) => void
// Internals:
//   - useRef<HTMLCanvasElement>
//   - PointerEvents (pointerdown, pointermove, pointerup) for cross-device support
//   - getContext('2d') for drawing
//   - clear(): reset canvas + call onChange(null)
//   - toDataURL(): call onChange(canvas.toDataURL('image/png'))
```

---

### F-10 Image Upload

**Service:** Supabase Storage

#### Buckets

| Bucket | Path Pattern | Access |
|---|---|---|
| `servicios` | `{servicio_id}/imagen_{n}.{ext}` | Private (staff only) |
| `bitacoras` | `{bitacora_id}/imagen_{n}.{ext}` | Private (staff only) |
| `firmas` | `{servicio_id}/firma.png` | Private (staff only) |

#### Upload Server Action
```ts
async function uploadImage(file: File, bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false })
  
  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}
```

#### File Validation (Zod)
```ts
const ImageFile = z.instanceof(File).refine(
  (f) => f.size <= 10 * 1024 * 1024,
  'La imagen no puede pesar más de 10MB'
).refine(
  (f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
  'Solo se aceptan imágenes JPG, PNG o WebP'
)
```

---

### F-11 Client Portal (Public Access)

**Route:** `/portal/[token]`

**Purpose:** Customers can view their vehicle's service status without logging in. The link is shared by the mechanic.

#### Access Flow
1. Staff generates a token link from the admin panel
2. Customer receives the URL: `https://tallerdomain.com/portal/{rawToken}`
3. Page server-component hashes the token → looks up `cliente_portal_links` by `token_hash`
4. Validates: `status = 1` AND `expira_en > NOW()` AND `revocado_en IS NULL`
5. If valid: update `ultimo_acceso = NOW()`; render portal page
6. If invalid/expired: show "Este enlace no es válido o ha expirado" page

#### Portal Page Content
- Client name (no personal data beyond what's needed)
- List of services with `status = 2` (Finalizado) only
- Per service:
  - Vehicle: placa, marca, modelo, color
  - Date finished
  - Description
  - Initial photos (up to 5)
  - Bitácora entries:
    - Date
    - Description
    - Photos (up to 4 per entry)
- No editing, no auth, no navigation to other clients

#### This page has no Supabase Auth — it uses a service role query via a route handler or Server Action that validates the token itself.

---

### F-12 Portal Link Management

**Route:** Embedded in `/dashboard/clientes/[id]`

**Purpose:** Generate, view, and revoke client portal links.

#### UI Elements
- Section "Enlace de Portal" on client detail page
- List of existing links for this client:
  - Created date
  - Expiry date
  - Status badge (Active / Expired / Revoked)
  - Last accessed timestamp
  - "Revocar" button (only for active links)
  - "Copiar enlace" button (for active, non-expired links)
- "Generar nuevo enlace" button

#### Generate Link Flow
- Optional: expiration days input (default 90, max 365)
- On submit (Server Action):
  1. Generate `crypto.randomBytes(32).toString('hex')` as rawToken
  2. Compute `SHA256(rawToken)` as tokenHash
  3. `INSERT INTO cliente_portal_links` with tokenHash, expiraEn
  4. Return rawToken to client (displayed once with "Copiar" button)
  5. Do NOT store rawToken anywhere

#### Revoke Link
- `UPDATE cliente_portal_links SET status = 0, revocado_en = NOW() WHERE id = {id}`
- Confirm dialog before revoking

---

## 6. API / Data Layer Spec

All data mutations use **Next.js Server Actions** (no separate API layer needed). Data reads happen in **Server Components** for initial page load, with React Query for client-side refetches.

### Naming Convention for Server Actions
```
actions/
  usuarios.ts   → createUsuario, updateUsuario, deactivateUsuario
  clientes.ts   → createCliente, updateCliente, deleteCliente
  vehiculos.ts  → createVehiculo, updateVehiculo, deleteVehiculo
  servicios.ts  → createServicio, updateServicioStatus, deleteServicio
  bitacoras.ts  → createBitacora, deleteBitacora
  portal.ts     → generatePortalLink, revokePortalLink
  auth.ts       → login, logout, resetPassword
```

### Zod Validation Schemas
Each Server Action validates its input with Zod before hitting Supabase.

```ts
// schemas/servicio.ts
export const CreateServicioSchema = z.object({
  vehiculoId: z.number().int().positive(),
  descripcion: z.string().optional(),
  imagenes: z.array(ImageFile).max(5).optional(),
})

// schemas/cliente.ts
export const CreateClienteSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  correo: z.string().email().optional().or(z.literal('')),
  telefono: z.string().max(15).optional(),
})

// schemas/vehiculo.ts
export const CreateVehiculoSchema = z.object({
  clienteId: z.number().int().positive(),
  placa: z.string().min(1).max(45),
  marca: z.string().max(45).optional(),
  modelo: z.string().max(45).optional(),
  color: z.string().max(45).optional(),
  anio: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
})
```

---

## 7. File & Folder Structure

```
taller-mecanico-web/
├── app/
│   ├── layout.tsx                      # Root layout (fonts, providers)
│   ├── page.tsx                        # Redirects to /dashboard or /login
│   ├── login/
│   │   └── page.tsx                    # F-01
│   ├── forgot-password/
│   │   └── page.tsx                    # F-01 (password reset)
│   ├── dashboard/
│   │   ├── layout.tsx                  # Sidebar + top nav (auth-guarded)
│   │   ├── page.tsx                    # F-02 Home
│   │   ├── usuarios/
│   │   │   └── page.tsx                # F-03
│   │   ├── clientes/
│   │   │   ├── page.tsx                # F-04
│   │   │   └── [id]/
│   │   │       └── page.tsx            # F-05 + F-12
│   │   └── servicios/
│   │       ├── page.tsx                # F-07
│   │       ├── nuevo/
│   │       │   └── page.tsx            # F-06
│   │       └── [id]/
│   │           ├── page.tsx            # F-08
│   │           └── entrega/
│   │               └── page.tsx        # F-09
│   └── portal/
│       └── [token]/
│           └── page.tsx                # F-11
│
├── components/
│   ├── ui/                             # shadcn/ui primitives
│   ├── signature-pad.tsx               # F-09 canvas component
│   ├── image-uploader.tsx              # F-10 drag-drop upload
│   ├── image-viewer.tsx                # Full-screen modal viewer
│   ├── service-card.tsx                # F-07 service list card
│   ├── service-status-badge.tsx        # Colored status pill
│   ├── bitacora-entry.tsx              # F-08 log entry item
│   ├── data-table.tsx                  # Generic paginated table
│   ├── client-search-combobox.tsx      # F-06 autocomplete client
│   ├── plate-search.tsx                # F-05/F-06 plate lookup
│   └── portal-link-manager.tsx         # F-12 link list + generate
│
├── actions/
│   ├── auth.ts
│   ├── usuarios.ts
│   ├── clientes.ts
│   ├── vehiculos.ts
│   ├── servicios.ts
│   ├── bitacoras.ts
│   └── portal.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server Supabase client (cookies)
│   │   └── admin.ts                    # Service role client (admin ops)
│   ├── schemas/                        # Zod schemas
│   │   ├── cliente.ts
│   │   ├── vehiculo.ts
│   │   ├── servicio.ts
│   │   ├── bitacora.ts
│   │   └── usuario.ts
│   └── utils.ts                        # Shared helpers (cn, dates, etc.)
│
├── stores/
│   └── service-filters.ts              # Zustand: search + status filter state
│
├── middleware.ts                        # Auth guard for /dashboard/**
├── .env.local                          # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY
└── supabase/
    ├── migrations/
    │   ├── 001_initial_schema.sql
    │   ├── 002_rls_policies.sql
    │   └── 003_storage_buckets.sql
    └── seed.sql
```

---

## 8. Routing Map

| Flutter Screen | Next.js Route | Feature |
|---|---|---|
| SplashScreen | `/` (middleware redirect) | — |
| LoginScreen | `/login` | F-01 |
| ForgotPasswordScreen | `/forgot-password` | F-01 |
| HomeScreen | `/dashboard` | F-02 |
| UsersScreen | `/dashboard/usuarios` | F-03 |
| ClientsScreen | `/dashboard/clientes` | F-04 |
| — (new) | `/dashboard/clientes/[id]` | F-05 + F-12 |
| AddServiceScreen (Step 1) | `/dashboard/servicios/nuevo?step=1` | F-06 |
| AddServiceDetailsScreen (Step 2) | `/dashboard/servicios/nuevo?step=2` | F-06 |
| ContinueServiceScreen | `/dashboard/servicios` | F-07 |
| ServiceHistoryScreen | `/dashboard/servicios/[id]` | F-08 |
| DeliveryScreen | `/dashboard/servicios/[id]/entrega` | F-09 |
| Public portal (no Flutter equivalent) | `/portal/[token]` | F-11 |

---

## 9. UI Component Inventory

### Primitives (shadcn/ui)
- Button, Input, Textarea, Label
- Dialog / Sheet (for modals and mobile drawers)
- Select, Combobox (for dropdowns and autocomplete)
- Badge (for status pills)
- Table, DataTable (paginated)
- Tabs (for status filter)
- Toast / Sonner (for success/error notifications)
- Skeleton (loading states)
- AlertDialog (confirmation dialogs)
- Separator

### Custom Components

#### `<SignaturePad />`
```ts
interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void
  className?: string
}
// Canvas with pointer events; exposes clear() via ref
```

#### `<ImageUploader />`
```ts
interface ImageUploaderProps {
  maxFiles?: number        // default 5
  onChange: (files: File[]) => void
  existingUrls?: string[]  // for edit mode
}
// Drag-drop zone + file input, shows thumbnail grid, X to remove
```

#### `<ImageViewer />`
```ts
interface ImageViewerProps {
  images: string[]
  initialIndex?: number
}
// Full-screen modal with prev/next navigation
```

#### `<ClientSearchCombobox />`
```ts
interface ClientSearchComboboxProps {
  onSelect: (cliente: Cliente | null) => void
  onNewClient: () => void  // callback when no match
}
// Debounced server search, shows existing clients, "Nuevo Cliente" option
```

#### `<PlateSearch />`
```ts
interface PlateSearchProps {
  onFound: (vehiculo: VehiculoWithCliente) => void
  onNotFound: (placa: string) => void
}
// Input + button, calls /api/vehiculos/search?placa=XXX
```

#### `<ServiceStatusBadge />`
```ts
interface ServiceStatusBadgeProps {
  status: 0 | 1 | 2 | 3
}
// Colored pill: Pendiente(orange), En Progreso(blue), Finalizado(green), Entregado(gray)
```

#### `<BitacoraEntry />`
```ts
interface BitacoraEntryProps {
  entry: Bitacora & { usuario: Pick<Usuario, 'nombre'> }
  onDelete?: () => void  // only shown for current user's entries or admin
}
```

#### `<PortalLinkManager />`
```ts
interface PortalLinkManagerProps {
  clienteId: number
  links: ClientePortalLink[]
}
// Lists links, generate button, revoke action, copy-to-clipboard
```

---

## 10. State Management

### Server State — React Query (TanStack Query)

Used for data that needs client-side refetching (after mutations, polling for status updates).

```ts
// Queries
useServiciosQuery({ status, search })
useServicioQuery(id)
useBitacorasQuery(servicioId)
useClientesQuery({ search })
```

### Global UI State — Zustand

```ts
// stores/service-filters.ts
interface ServiceFiltersState {
  search: string
  statusFilter: 0 | 1 | 2 | 3 | null
  setSearch: (s: string) => void
  setStatusFilter: (s: number | null) => void
}
```

### Form State — React Hook Form

All forms use React Hook Form with Zod resolvers. Server Actions are called from `onSubmit` handlers.

---

## 11. Row Level Security (RLS) Policies

All tables are protected. Staff access requires a valid Supabase Auth session.

```sql
-- Enable RLS on all tables
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE bitacoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_portal_links ENABLE ROW LEVEL SECURITY;

-- Staff can read/write all data (authenticated users)
CREATE POLICY "staff_full_access" ON usuarios
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access" ON clientes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access" ON vehiculos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access" ON servicios
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access" ON bitacoras
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "staff_full_access" ON cliente_portal_links
  FOR ALL USING (auth.role() = 'authenticated');

-- Portal public access: NO RLS policy needed — queries use service_role key
-- validated in the Server Component after manual token validation
```

> Portal public queries bypass RLS intentionally by using the service role key server-side, after the token is validated manually. This keeps the public data query secure.

---

## 12. Supabase Storage Buckets

```sql
-- Bucket: servicios (private, staff only)
INSERT INTO storage.buckets (id, name, public) VALUES ('servicios', 'servicios', false);

-- Bucket: bitacoras (private, staff only)  
INSERT INTO storage.buckets (id, name, public) VALUES ('bitacoras', 'bitacoras', false);

-- Bucket: firmas (private, staff only)
INSERT INTO storage.buckets (id, name, public) VALUES ('firmas', 'firmas', false);

-- Storage RLS: only authenticated users can upload/read
CREATE POLICY "staff_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('servicios', 'bitacoras', 'firmas'));

CREATE POLICY "staff_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('servicios', 'bitacoras', 'firmas'));
```

**Signed URL Strategy:**

Images served in the admin UI use signed URLs (60-minute expiry). Portal page images use longer-lived signed URLs generated server-side (7-day expiry).

```ts
const { data } = await supabase.storage
  .from('servicios')
  .createSignedUrl(`${servicioId}/imagen_1.jpg`, 3600)
```

---

## 13. Migration Checklist

### Phase 0 — Setup
- [ ] Create Supabase project
- [ ] Bootstrap Next.js 14 app with App Router
- [ ] Install: `@supabase/ssr`, `@supabase/supabase-js`, `shadcn/ui`, `zustand`, `@tanstack/react-query`, `zod`, `react-hook-form`, `@hookform/resolvers`
- [ ] Configure `.env.local` with Supabase URL, anon key, service role key
- [ ] Set up `middleware.ts` auth guard

### Phase 1 — Database
- [ ] Run migration `001_initial_schema.sql` (all tables)
- [ ] Run migration `002_rls_policies.sql`
- [ ] Run migration `003_storage_buckets.sql`
- [ ] Add `firma_entrega_url VARCHAR(255)` column to `servicios`
- [ ] Export MySQL data and import into Supabase PostgreSQL
- [ ] Validate row counts match after import

### Phase 2 — Auth (F-01)
- [ ] Implement `/login` page and Server Action
- [ ] Implement `/forgot-password` page
- [ ] Create Supabase Auth accounts for existing staff (migration script)
- [ ] Test session persistence and auto-refresh

### Phase 3 — Core Admin (F-02, F-03, F-04, F-05)
- [ ] Dashboard home page with 4 nav cards
- [ ] Users CRUD (Supabase Auth + public.usuarios sync)
- [ ] Clients CRUD with search and pagination
- [ ] Vehicle management on client detail page
- [ ] Plate lookup search

### Phase 4 — Service Flow (F-06, F-07, F-08)
- [ ] Create Service multi-step form (client/vehicle selection + details)
- [ ] Service list with search and status filters
- [ ] Service detail page with status updates
- [ ] Bitácora entries (add, view, delete)
- [ ] Image upload integration for service creation and bitácora

### Phase 5 — Delivery (F-09)
- [ ] Signature pad component
- [ ] Delivery confirmation page
- [ ] Signature upload to Supabase Storage
- [ ] Service status → Entregado update

### Phase 6 — Client Portal (F-10, F-11, F-12)
- [ ] Portal link generation and management UI
- [ ] Public `/portal/[token]` page (no auth)
- [ ] Token validation and last-access tracking
- [ ] Portal shows only Finalizado services

### Phase 7 — Polish & QA
- [ ] Mobile responsiveness (all pages)
- [ ] Loading skeletons for all data fetches
- [ ] Error boundaries and user-facing error messages
- [ ] Empty states (no services, no clients, etc.)
- [ ] Image full-screen viewer
- [ ] Toast notifications for all mutations
- [ ] Accessibility audit (ARIA labels, keyboard navigation)
- [ ] Cross-browser testing

### Phase 8 — Deployment
- [ ] Deploy Next.js to Vercel (or similar)
- [ ] Set production environment variables in Vercel
- [ ] Configure Supabase Auth redirect URLs for production domain
- [ ] Set up Supabase Storage CDN / signed URL caching
- [ ] DNS + SSL setup
- [ ] Smoke test all features in production

---

*Document version: 1.0 — generated 2026-05-25*
*Source analyzed: `flutter_login_app/lib/` (Flutter) + `cars-backend/src/` (NestJS)*
