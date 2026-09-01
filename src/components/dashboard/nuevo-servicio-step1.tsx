"use client";

import { useState, useTransition } from "react";

import { Loader2, Search } from "lucide-react";

import { initServicioStep1Action } from "@/actions/servicios";
import { ActionButton } from "@/components/ui/action-button";

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
      <span className="rounded border border-outline-variant px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-widest text-on-surface">
        {placa}
      </span>
      <span className="text-sm text-on-surface">
        {[marca, modelo].filter(Boolean).join(" ") || "Sin datos"}
      </span>
      {color ? <span className="text-sm text-on-surface-variant">{color}</span> : null}
      {anio ? <span className="text-sm text-on-surface-variant">{anio}</span> : null}
    </div>
  );
}

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary";

// ── Main component ─────────────────────────────────────────────────────────

export function NuevoServicioStep1Form({ error }: { error?: string }) {
  const [placaQuery, setPlacaQuery] = useState("");
  const [plateResult, setPlateResult] = useState<{
    found: boolean;
    vehiculo?: PlateVehiculo;
  } | null>(null);
  const [plateError, setPlateError] = useState<string | null>(null);

  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResults, setClienteResults] = useState<ClienteResult[]>([]);
  const [clienteError, setClienteError] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<ClienteResult | null>(null);

  // null = none picked yet, -1 = "add new vehicle", >0 = existing vehicle id
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();

  const plateVehiculo = plateResult?.found ? plateResult.vehiculo : null;
  const clientVehiculo =
    selectedCliente && selectedVehiculoId && selectedVehiculoId > 0
      ? selectedCliente.vehiculos.find((v) => v.id === selectedVehiculoId) ?? null
      : null;
  const resolvedVehiculo = plateVehiculo ?? clientVehiculo ?? null;
  const resolvedCliente = plateVehiculo?.cliente ?? selectedCliente ?? null;

  const showVehicleForm =
    !resolvedVehiculo &&
    (selectedVehiculoId === -1 || !selectedCliente);
  const showClientForm = !resolvedCliente && showVehicleForm;

  const handlePlateLookup = () => {
    const query = placaQuery.trim();
    if (!query) return;
    setSelectedCliente(null);
    setClienteResults([]);
    setClienteQuery("");
    setSelectedVehiculoId(null);
    startTransition(async () => {
      setPlateError(null);
      try {
        const res = await fetch(`/api/vehiculos/search?placa=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { found: boolean; vehiculo?: PlateVehiculo; error?: string };
        if (!res.ok) throw new Error(data.error ?? "No se pudo consultar.");
        setPlateResult(data);
      } catch (e) {
        setPlateResult(null);
        setPlateError(e instanceof Error ? e.message : "Error al buscar la placa.");
      }
    });
  };

  const handleClienteSearch = () => {
    const query = clienteQuery.trim();
    if (query.length < 2) return;
    setPlateResult(null);
    setPlacaQuery("");
    setSelectedCliente(null);
    setSelectedVehiculoId(null);
    startTransition(async () => {
      setClienteError(null);
      try {
        const res = await fetch(`/api/clientes/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { clientes?: ClienteResult[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "No se pudo buscar.");
        setClienteResults(data.clientes ?? []);
        if ((data.clientes ?? []).length === 0) {
          setClienteError("No se encontraron clientes con ese nombre o teléfono.");
        }
      } catch (e) {
        setClienteError(e instanceof Error ? e.message : "Error al buscar clientes.");
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

  return (
    <form action={initServicioStep1Action} className="space-y-4">
      {error ? (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      {resolvedVehiculo && (
        <input name="vehiculoId" type="hidden" value={resolvedVehiculo.id} />
      )}
      {!resolvedVehiculo && resolvedCliente && (
        <input name="clienteId" type="hidden" value={resolvedCliente.id} />
      )}

      {/* ── Search section: plate OR client ── */}
      {!resolvedVehiculo && !selectedCliente ? (
        <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-low p-4">
          {/* Plate search */}
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">
              Busca por placa
            </p>
            <div className="mt-3 flex gap-2">
              <input
                className="h-11 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ej. ABC-123-A"
                value={placaQuery}
                onChange={(e) => setPlacaQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handlePlateLookup(); }
                }}
              />
              <button
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-4"
                disabled={isPending || !placaQuery.trim()}
                type="button"
                onClick={handlePlateLookup}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : (
                  <>
                    <Search className="size-4 sm:hidden" />
                    <span className="hidden text-sm font-semibold sm:block">Buscar</span>
                  </>
                )}
              </button>
            </div>
            {plateError && (
              <p className="mt-2 text-sm text-error">{plateError}</p>
            )}
            {plateResult && !plateResult.found && (
              <p className="mt-2 text-sm text-on-surface-variant">
                Placa no registrada — completa los datos abajo.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <span className="flex-1 border-t border-outline-variant" />
            O BIEN
            <span className="flex-1 border-t border-outline-variant" />
          </div>

          {/* Client search */}
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">
              Busca el cliente por nombre o teléfono
            </p>
            <div className="mt-3 flex gap-2">
              <input
                className="h-11 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ej. Aldo o 9991234567"
                value={clienteQuery}
                onChange={(e) => setClienteQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleClienteSearch(); }
                }}
              />
              <button
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-4"
                disabled={isPending || clienteQuery.trim().length < 2}
                type="button"
                onClick={handleClienteSearch}
              >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : (
                  <>
                    <Search className="size-4 sm:hidden" />
                    <span className="hidden text-sm font-semibold sm:block">Buscar</span>
                  </>
                )}
              </button>
            </div>
            {clienteError && (
              <p className="mt-2 text-sm text-on-surface-variant">{clienteError}</p>
            )}

            {clienteResults.length > 0 && (
              <ul className="mt-2 space-y-1">
                {clienteResults.map((cliente) => (
                  <li key={cliente.id}>
                    <button
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-left text-sm transition hover:border-primary hover:bg-surface-container-low"
                      type="button"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      <span className="font-medium text-on-surface">
                        {cliente.nombre ?? "Sin nombre"}
                      </span>
                      {cliente.telefono && (
                        <span className="ml-2 text-on-surface-variant">
                          · {cliente.telefono}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-on-surface-variant">
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

      {/* ── Client selected — vehicle picker ── */}
      {selectedCliente && !resolvedVehiculo ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                Cliente seleccionado
              </p>
              <p className="mt-1 font-medium text-on-surface">
                {selectedCliente.nombre ?? "Sin nombre"}
              </p>
              {selectedCliente.telefono && (
                <p className="text-sm text-on-surface-variant">
                  {selectedCliente.telefono}
                </p>
              )}
            </div>
            <button
              className="text-xs text-on-surface-variant underline hover:text-on-surface"
              type="button"
              onClick={handleClearAll}
            >
              Cambiar
            </button>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">
              Selecciona un vehículo
            </p>
            <div className="mt-2 space-y-2">
              {selectedCliente.vehiculos.map((v) => (
                <button
                  key={v.id}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    selectedVehiculoId === v.id
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant bg-surface-container-low text-on-surface hover:border-primary"
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

              <button
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                  selectedVehiculoId === -1
                    ? "border-primary bg-primary text-on-primary"
                    : "border-dashed border-outline-variant text-on-surface hover:border-primary"
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

      {/* ── Resolved vehicle — read-only summary ── */}
      {resolvedVehiculo ? (
        <div
          className="sticky top-3 z-10 rounded-xl border p-4"
          style={{ background: "#00573314", color: "#005a33", borderColor: "#00573340" }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider opacity-70">
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
                <p className="text-sm">
                  Cliente:{" "}
                  <span className="font-medium">
                    {resolvedCliente.nombre ?? "Sin nombre"}
                  </span>
                  {resolvedCliente.telefono ? ` · ${resolvedCliente.telefono}` : ""}
                </p>
              )}
            </div>
            <button
              className="text-xs underline opacity-70 hover:opacity-100"
              type="button"
              onClick={handleClearAll}
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Vehicle form — new vehicle entry ── */}
      {showVehicleForm ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            Datos del vehículo
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-on-surface">
              Placa *
              <input className={inputClass} defaultValue={placaQuery} name="placa" required />
            </label>
            <label className="text-sm font-medium text-on-surface">
              Marca
              <input className={inputClass} name="marca" />
            </label>
            <label className="text-sm font-medium text-on-surface">
              Modelo
              <input className={inputClass} name="modelo" />
            </label>
            <label className="text-sm font-medium text-on-surface">
              Color
              <input className={inputClass} name="color" />
            </label>
            <label className="text-sm font-medium text-on-surface">
              Año
              <input
                className={inputClass}
                max={new Date().getFullYear()}
                min={1900}
                name="anio"
                type="number"
              />
            </label>
          </div>
        </div>
      ) : null}

      {/* ── Client form — only when no client resolved ── */}
      {showClientForm ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">
            Datos del cliente
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-on-surface md:col-span-2">
              Nombre
              <input className={inputClass} name="nombre" required />
            </label>
            <label className="text-sm font-medium text-on-surface">
              Teléfono
              <input className={inputClass} name="telefono" />
            </label>
            <label className="text-sm font-medium text-on-surface">
              Correo
              <input className={inputClass} name="correo" type="email" />
            </label>
          </div>
        </div>
      ) : null}

      {(resolvedVehiculo ||
        (selectedCliente && selectedVehiculoId !== null) ||
        (!selectedCliente && !plateResult?.found)) ? (
        <ActionButton
          className="h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-60"
          disabled={!!(selectedCliente && selectedVehiculoId === null)}
        >
          Continuar →
        </ActionButton>
      ) : null}
    </form>
  );
}
