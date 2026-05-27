"use client";

import { useState, useTransition } from "react";

type LookupResponse = {
  found: boolean;
  vehiculo?: {
    id: number;
    placa: string;
    marca: string | null;
    modelo: string | null;
    color: string | null;
    anio: number | null;
    cliente: {
      id: number;
      nombre: string | null;
      correo: string | null;
      telefono: string | null;
    } | null;
  };
};

export function PlateLookupCard() {
  const [placa, setPlaca] = useState("");
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLookup = () => {
    const query = placa.trim();

    if (!query) {
      setError("Escribe una placa para consultar.");
      setResult(null);
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch(`/api/vehiculos/search?placa=${encodeURIComponent(query)}`);
        const payload = (await response.json()) as LookupResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo consultar la placa.");
        }

        setResult(payload);
      } catch (lookupError) {
        setResult(null);
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : "No se pudo consultar la placa.",
        );
      }
    });
  };

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-700/70">
          Busqueda por placa
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Verifica si el vehiculo ya existe
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Esta consulta usa el endpoint de fase 3 y sirve como base para el alta
          de servicios en la siguiente etapa.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          className="h-12 flex-1 rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
          onChange={(event) => setPlaca(event.target.value)}
          placeholder="Ej. ABC-123-A"
          value={placa}
        />
        <button
          className="h-12 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isPending}
          onClick={handleLookup}
          type="button"
        >
          {isPending ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {result ? (
        result.found && result.vehiculo ? (
          <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">
              Vehiculo encontrado
            </p>
            <div className="mt-3 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              <p><strong>Placa:</strong> {result.vehiculo.placa}</p>
              <p><strong>Marca:</strong> {result.vehiculo.marca ?? "Sin dato"}</p>
              <p><strong>Modelo:</strong> {result.vehiculo.modelo ?? "Sin dato"}</p>
              <p><strong>Color:</strong> {result.vehiculo.color ?? "Sin dato"}</p>
              <p><strong>Anio:</strong> {result.vehiculo.anio ?? "Sin dato"}</p>
              <p><strong>Cliente:</strong> {result.vehiculo.cliente?.nombre ?? "Sin asignar"}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Vehiculo no registrado. Ya puedes capturarlo manualmente en el cliente correspondiente.
          </p>
        )
      ) : null}
    </section>
  );
}
