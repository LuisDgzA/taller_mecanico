"use client";

import { useState, useTransition } from "react";

import { initServicioStep1Action } from "@/actions/servicios";

// ── Types ──────────────────────────────────────────────────────────────────

type PlateVehiculo = {
  id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
  cliente: {
    id: number;
    nombre: string | null;
    telefono: string | null;
  } | null;
};

type ClienteResult = {
  id: number;
  nombre: string | null;
  telefono: string | null;
  vehiculos: {
    id: number;
    placa: string;
    marca: string | null;
    modelo: string | null;
  }[];
};

// ── Sub-components ─────────────────────────────────────────────────────────

function VehiculoSummary({
  placa,
  marca,
  modelo,
  color,
  anio,
}: {
  placa: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
        {placa}
      </span>
      <span className="text-sm text-slate-700">
        {[marca, modelo].filter(Boolean).join(" ") || "Sin datos"}
      </span>
      {color ? <span className="text-sm text-slate-400">{color}</span> : null}
      {anio ? <span className="text-sm text-slate-400">{anio}</span> : null}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function NuevoServicioStep1Form({ error }: { error?: string }) {
  // Plate lookup state
  const [placaQuery, setPlacaQuery] = useState("");
  const [plateResult, setPlateResult] = useState<{
    found: boolean;
    vehiculo?: PlateVehiculo;
  } | null>(null);
  const [plateError, setPlateError] = useState<string | null>(null);

  // Client search state
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResults, setClienteResults] = useState<ClienteResult[]>([]);
  const [clienteError, setClienteError] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<ClienteResult | null>(null);

  // Vehicle selection from a known client's list
  // null = none picked yet, -1 = "add new vehicle", >0 = existing vehicle id
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  // ── Derived state ────────────────────────────────────────────────────────

  // Vehicle that came from the plate lookup
  const plateVehiculo = plateResult?.found ? plateResult.vehiculo : null;

  // Vehicle that came from picking one of the client's existing vehicles
  const clientVehiculo =
    selectedCliente && selectedVehiculoId && selectedVehiculoId > 0
      ? selectedCliente.vehiculos.find((v) => v.id === selectedVehiculoId) ?? null
      : null;

  // The fully-resolved vehicle (we know its ID → skip creation in the action)
  const resolvedVehiculo = plateVehiculo ?? clientVehiculo ?? null;

  // The resolved client (from plate lookup or client search)
  const resolvedCliente = plateVehiculo?.cliente ?? selectedCliente ?? null;

  // Show vehicle form when: no resolved vehicle yet AND
  // either nothing has been searched, or the plate was not found,
  // or a client was selected and "nuevo vehículo" was chosen
  const showVehicleForm =
    !resolvedVehiculo &&
    (selectedVehiculoId === -1 || !selectedCliente);

  // Show client form only when there's no client resolved at all
  const showClientForm = !resolvedCliente && showVehicleForm;

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handlePlateLookup = () => {
    const query = placaQuery.trim();
    if (!query) return;

    // Clear client search state when doing a plate lookup
    setSelectedCliente(null);
    setClienteResults([]);
    setClienteQuery("");
    setSelectedVehiculoId(null);

    startTransition(async () => {
      setPlateError(null);
      try {
        const res = await fetch(
          `/api/vehiculos/search?placa=${encodeURIComponent(query)}`,
        );
        const data = (await res.json()) as {
          found: boolean;
          vehiculo?: PlateVehiculo;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "No se pudo consultar.");
        setPlateResult(data);
      } catch (e) {
        setPlateResult(null);
        setPlateError(
          e instanceof Error ? e.message : "Error al buscar la placa.",
        );
      }
    });
  };

  const handleClienteSearch = () => {
    const query = clienteQuery.trim();
    if (query.length < 2) return;

    // Clear plate lookup state when doing a client search
    setPlateResult(null);
    setPlacaQuery("");
    setSelectedCliente(null);
    setSelectedVehiculoId(null);

    startTransition(async () => {
      setClienteError(null);
      try {
        const res = await fetch(
          `/api/clientes/search?q=${encodeURIComponent(query)}`,
        );
        const data = (await res.json()) as {
          clientes?: ClienteResult[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "No se pudo buscar.");
        setClienteResults(data.clientes ?? []);
        if ((data.clientes ?? []).length === 0) {
          setClienteError("No se encontraron clientes con ese nombre o teléfono.");
        }
      } catch (e) {
        setClienteError(
          e instanceof Error ? e.message : "Error al buscar clientes.",
        );
      }
    });
  };

  const handleSelectCliente = (cliente: ClienteResult) => {
    setSelectedCliente(cliente);
    setClienteResults([]);
    setSelectedVehiculoId(null);
  };

  const handleClearAll = () => {
    setPlateResult(null);
    setPlacaQuery("");
    setPlateError(null);
    setClienteResults([]);
    setClienteQuery("");
    setClienteError(null);
    setSelectedCliente(null);
    setSelectedVehiculoId(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form action={initServicioStep1Action} className="space-y-5">
      {/* Action-level error (from redirect) */}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* ── Hidden IDs passed to the Server Action ── */}
      {resolvedVehiculo && (
        <input name="vehiculoId" type="hidden" value={resolvedVehiculo.id} />
      )}
      {!resolvedVehiculo && resolvedCliente && (
        <input name="clienteId" type="hidden" value={resolvedCliente.id} />
      )}

      {/* ════════════════════════════════════════════
          SEARCH SECTION — Plate OR Client
      ════════════════════════════════════════════ */}
      {!resolvedVehiculo && !selectedCliente ? (
        <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 sm:p-5">
          {/* Plate search */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Busca por placa
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
                placeholder="Ej. ABC-123-A"
                value={placaQuery}
                onChange={(e) => setPlacaQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handlePlateLookup();
                  }
                }}
              />
              <button
                className="h-12 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400 sm:min-w-28"
                disabled={isPending || !placaQuery.trim()}
                type="button"
                onClick={handlePlateLookup}
              >
                {isPending ? "…" : "Buscar"}
              </button>
            </div>
            {plateError && (
              <p className="mt-2 text-sm text-rose-700">{plateError}</p>
            )}
            {plateResult && !plateResult.found && (
              <p className="mt-2 text-sm text-amber-700">
                Placa no registrada — completa los datos abajo.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex-1 border-t border-slate-200" />
            O BIEN
            <span className="flex-1 border-t border-slate-200" />
          </div>

          {/* Client search */}
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Busca el cliente por nombre o teléfono
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-12 flex-1 rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950"
                placeholder="Ej. Aldo o 9991234567"
                value={clienteQuery}
                onChange={(e) => setClienteQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleClienteSearch();
                  }
                }}
              />
              <button
                className="h-12 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400 sm:min-w-28"
                disabled={isPending || clienteQuery.trim().length < 2}
                type="button"
                onClick={handleClienteSearch}
              >
                {isPending ? "…" : "Buscar"}
              </button>
            </div>
            {clienteError && (
              <p className="mt-2 text-sm text-amber-700">{clienteError}</p>
            )}

            {/* Client results list */}
            {clienteResults.length > 0 && (
              <ul className="mt-2 space-y-1">
                {clienteResults.map((cliente) => (
                  <li key={cliente.id}>
                    <button
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-slate-950 hover:bg-slate-50"
                      type="button"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      <span className="font-medium">
                        {cliente.nombre ?? "Sin nombre"}
                      </span>
                      {cliente.telefono && (
                        <span className="ml-2 text-slate-400">
                          · {cliente.telefono}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-slate-400">
                        {cliente.vehiculos.length} vehículo
                        {cliente.vehiculos.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════════════════════
          CLIENT SELECTED — show vehicle picker
      ════════════════════════════════════════════ */}
      {selectedCliente && !resolvedVehiculo ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Cliente seleccionado
              </p>
              <p className="mt-1 font-medium">
                {selectedCliente.nombre ?? "Sin nombre"}
              </p>
              {selectedCliente.telefono && (
                <p className="text-sm text-slate-400">
                  {selectedCliente.telefono}
                </p>
              )}
            </div>
            <button
              className="text-xs text-slate-400 underline hover:text-slate-700"
              type="button"
              onClick={handleClearAll}
            >
              Cambiar
            </button>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Selecciona un vehículo
            </p>
            <div className="mt-2 space-y-2">
              {selectedCliente.vehiculos.map((v) => (
                <button
                  key={v.id}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    selectedVehiculoId === v.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 hover:border-slate-950"
                  }`}
                  type="button"
                  onClick={() => setSelectedVehiculoId(v.id)}
                >
                  <span className="font-semibold">{v.placa}</span>
                  {(v.marca || v.modelo) && (
                    <span className="ml-2 opacity-70">
                      {[v.marca, v.modelo].filter(Boolean).join(" ")}
                    </span>
                  )}
                </button>
              ))}

              {/* Option: new vehicle */}
              <button
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  selectedVehiculoId === -1
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-dashed border-slate-300 hover:border-slate-950"
                }`}
                type="button"
                onClick={() => setSelectedVehiculoId(-1)}
              >
                + Agregar vehículo nuevo
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════════════════════
          RESOLVED VEHICLE — show read-only summary
      ════════════════════════════════════════════ */}
      {resolvedVehiculo ? (
        <div className="sticky top-3 z-10 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
                Vehículo confirmado
              </p>
              <VehiculoSummary
                placa={resolvedVehiculo.placa}
                marca={resolvedVehiculo.marca}
                modelo={resolvedVehiculo.modelo}
                color={"color" in resolvedVehiculo ? (resolvedVehiculo.color as string | null) : null}
                anio={"anio" in resolvedVehiculo ? (resolvedVehiculo.anio as number | null) : null}
              />
              {resolvedCliente && (
                <p className="text-sm text-emerald-800">
                  Cliente:{" "}
                  <span className="font-medium">
                    {resolvedCliente.nombre ?? "Sin nombre"}
                  </span>
                  {resolvedCliente.telefono
                    ? ` · ${resolvedCliente.telefono}`
                    : ""}
                </p>
              )}
            </div>
            <button
              className="text-xs text-emerald-600 underline hover:text-emerald-800"
              type="button"
              onClick={handleClearAll}
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════════════════════
          VEHICLE FORM — new vehicle entry
      ════════════════════════════════════════════ */}
      {showVehicleForm ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Datos del vehículo
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Placa *
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                defaultValue={placaQuery}
                name="placa"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Marca
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="marca"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Modelo
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="modelo"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Color
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="color"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Año
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                max={new Date().getFullYear()}
                min={1900}
                name="anio"
                type="number"
              />
            </label>
          </div>
        </div>
      ) : null}

      {/* ════════════════════════════════════════════
          CLIENT FORM — only when no client resolved
      ════════════════════════════════════════════ */}
      {showClientForm ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Datos del cliente
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700 md:col-span-2">
              Nombre
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="nombre"
                required
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Teléfono
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="telefono"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Correo
              <input
                className="mt-2 h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="correo"
                type="email"
              />
            </label>
          </div>
        </div>
      ) : null}

      {/* Submit — only enabled when we have enough to proceed */}
      {(resolvedVehiculo ||
        (selectedCliente && selectedVehiculoId !== null) ||
        (!selectedCliente && !plateResult?.found)) ? (
        <button
          className="min-h-[52px] w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          disabled={
            // Client selected but hasn't picked/chosen a vehicle option yet
            !!(selectedCliente && selectedVehiculoId === null)
          }
          type="submit"
        >
          Continuar →
        </button>
      ) : null}
    </form>
  );
}
