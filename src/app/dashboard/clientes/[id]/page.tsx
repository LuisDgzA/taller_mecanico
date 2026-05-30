import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteClienteAction, updateClienteAction } from "@/actions/clientes";
import { createVehiculoAction, deleteVehiculoAction, updateVehiculoAction } from "@/actions/vehiculos";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { PlateLookupCard } from "@/components/dashboard/plate-lookup-card";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type ClienteDetail = {
  id: number;
  nombre: string | null;
  correo: string | null;
  telefono: string | null;
};

type VehiculoRow = {
  id: number;
  cliente_id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
};

export default async function ClienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const feedback = await searchParams;
  const clienteId = Number(id);
  const error = feedback.error?.trim() ?? "";
  const success = feedback.success?.trim() ?? "";

  if (!Number.isFinite(clienteId) || clienteId <= 0) {
    notFound();
  }

  const supabase = await createSupabaseServerComponentClient();
  const [{ data: cliente }, { data: vehiculos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, correo, telefono")
      .eq("id", clienteId)
      .maybeSingle<ClienteDetail>(),
    supabase
      .from("vehiculos")
      .select("id, cliente_id, placa, marca, modelo, color, anio")
      .eq("cliente_id", clienteId)
      .order("placa")
      .returns<VehiculoRow[]>(),
  ]);

  if (!cliente) {
    notFound();
  }

  const vehicleList = vehiculos ?? [];
  const serviciosCount = vehicleList.length
    ? (
        await supabase
          .from("servicios")
          .select("id", { count: "exact", head: true })
          .in(
            "vehiculo_id",
            vehicleList.map((vehiculo) => vehiculo.id),
          )
      ).count ?? 0
    : 0;

  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
            F-05
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {cliente.nombre?.trim() || "Cliente sin nombre"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Administra vehículos desde el contexto del cliente y usa la búsqueda
            por placa para evitar duplicados.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-slate-950"
          href="/dashboard/clientes"
        >
          Volver a clientes
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="border-b border-slate-200 pb-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Datos del cliente
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Ficha general
              </h2>
            </div>

            <form action={updateClienteAction} className="mt-5 space-y-4">
              <input
                name="redirectTo"
                type="hidden"
                value={`/dashboard/clientes/${cliente.id}`}
              />
              <input name="id" type="hidden" value={cliente.id} />
              <label className="block text-sm font-medium text-slate-700">
                Nombre
                <input
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                  defaultValue={cliente.nombre ?? ""}
                  name="nombre"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Correo
                <input
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                  defaultValue={cliente.correo ?? ""}
                  name="correo"
                  type="email"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Teléfono
                <input
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                  defaultValue={cliente.telefono ?? ""}
                  name="telefono"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  type="submit"
                >
                  Guardar cliente
                </button>
              </div>
            </form>

            <form action={deleteClienteAction} className="mt-4 border-t border-slate-200 pt-4">
              <input name="redirectTo" type="hidden" value="/dashboard/clientes" />
              <input name="id" type="hidden" value={cliente.id} />
              <ConfirmSubmitButton
                className="h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                confirmMessage="Se eliminará el cliente y todos sus vehículos. ¿Deseas continuar?"
              >
                Eliminar cliente y sus vehículos
              </ConfirmSubmitButton>
            </form>
          </div>

          <PlateLookupCard />
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Vehículos del cliente
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {vehicleList.length} vehículo{vehicleList.length === 1 ? "" : "s"}
                </h2>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Servicios asociados detectados: {serviciosCount ?? 0}
              </div>
            </div>

            <form action={createVehiculoAction} className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                name="redirectTo"
                type="hidden"
                value={`/dashboard/clientes/${cliente.id}`}
              />
              <input name="clienteId" type="hidden" value={cliente.id} />
              <label className="text-sm font-medium text-slate-700">
                Placa
                <input
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                  name="placa"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Marca
                <input
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                  name="marca"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Modelo
                <input
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                  name="modelo"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Color
                <input
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                  name="color"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Año
                <input
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                  max={new Date().getFullYear()}
                  min={1900}
                  name="anio"
                  type="number"
                />
              </label>
              <div className="md:col-span-2">
                <button
                  className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  type="submit"
                >
                  Agregar vehículo
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-4">
              {vehicleList.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  Este cliente todavía no tiene vehículos registrados.
                </div>
              ) : (
                vehicleList.map((vehiculo) => (
                  <div key={vehiculo.id} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        {vehiculo.placa}
                      </span>
                      <p className="text-sm text-slate-500">
                        {vehiculo.marca ?? "Sin marca"} · {vehiculo.modelo ?? "Sin modelo"}
                      </p>
                    </div>

                    <details className="mt-4 lg:hidden">
                      <summary className="cursor-pointer list-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                        Editar vehículo
                      </summary>
                      <div className="mt-4 space-y-4">
                        <form action={updateVehiculoAction} className="grid gap-3 md:grid-cols-2">
                          <input
                            name="redirectTo"
                            type="hidden"
                            value={`/dashboard/clientes/${cliente.id}`}
                          />
                          <input name="id" type="hidden" value={vehiculo.id} />
                          <input name="clienteId" type="hidden" value={cliente.id} />
                          <label className="text-sm font-medium text-slate-700">
                            Placa
                            <input
                              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                              defaultValue={vehiculo.placa}
                              name="placa"
                              required
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Marca
                            <input
                              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                              defaultValue={vehiculo.marca ?? ""}
                              name="marca"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Modelo
                            <input
                              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                              defaultValue={vehiculo.modelo ?? ""}
                              name="modelo"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Color
                            <input
                              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                              defaultValue={vehiculo.color ?? ""}
                              name="color"
                            />
                          </label>
                          <label className="text-sm font-medium text-slate-700">
                            Año
                            <input
                              className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                              defaultValue={vehiculo.anio ?? ""}
                              max={new Date().getFullYear()}
                              min={1900}
                              name="anio"
                              type="number"
                            />
                          </label>
                          <div className="md:col-span-2 flex flex-wrap gap-2">
                            <button
                              className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                              type="submit"
                            >
                              Guardar vehículo
                            </button>
                            <Link
                              className="inline-flex h-11 items-center rounded-2xl border border-slate-300 px-4 text-sm font-medium transition hover:border-slate-950"
                              href={`/dashboard/servicios/nuevo?step=2&vehiculoId=${vehiculo.id}`}
                            >
                              Crear servicio →
                            </Link>
                          </div>
                        </form>

                        <form action={deleteVehiculoAction}>
                          <input
                            name="redirectTo"
                            type="hidden"
                            value={`/dashboard/clientes/${cliente.id}`}
                          />
                          <input name="id" type="hidden" value={vehiculo.id} />
                          <input name="clienteId" type="hidden" value={cliente.id} />
                          <ConfirmSubmitButton
                            className="h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                            confirmMessage="Se eliminará este vehículo. ¿Deseas continuar?"
                          >
                            Eliminar
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </details>

                    <div className="mt-4 hidden gap-4 lg:grid lg:grid-cols-[1fr_auto]">
                      <form action={updateVehiculoAction} className="grid gap-3 md:grid-cols-2">
                        <input
                          name="redirectTo"
                          type="hidden"
                          value={`/dashboard/clientes/${cliente.id}`}
                        />
                        <input name="id" type="hidden" value={vehiculo.id} />
                        <input name="clienteId" type="hidden" value={cliente.id} />
                        <label className="text-sm font-medium text-slate-700">
                          Placa
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                            defaultValue={vehiculo.placa}
                            name="placa"
                            required
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Marca
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                            defaultValue={vehiculo.marca ?? ""}
                            name="marca"
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Modelo
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                            defaultValue={vehiculo.modelo ?? ""}
                            name="modelo"
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Color
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                            defaultValue={vehiculo.color ?? ""}
                            name="color"
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Año
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                            defaultValue={vehiculo.anio ?? ""}
                            max={new Date().getFullYear()}
                            min={1900}
                            name="anio"
                            type="number"
                          />
                        </label>
                        <div className="md:col-span-2 flex flex-wrap gap-2">
                          <button
                            className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                            type="submit"
                          >
                            Guardar vehículo
                          </button>
                          <Link
                            className="inline-flex h-11 items-center rounded-2xl border border-slate-300 px-4 text-sm font-medium transition hover:border-slate-950"
                            href={`/dashboard/servicios/nuevo?step=2&vehiculoId=${vehiculo.id}`}
                          >
                            Crear servicio →
                          </Link>
                        </div>
                      </form>

                      <form action={deleteVehiculoAction} className="flex items-start">
                        <input
                          name="redirectTo"
                          type="hidden"
                          value={`/dashboard/clientes/${cliente.id}`}
                        />
                        <input name="id" type="hidden" value={vehiculo.id} />
                        <input name="clienteId" type="hidden" value={cliente.id} />
                        <ConfirmSubmitButton
                          className="h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          confirmMessage="Se eliminará este vehículo. ¿Deseas continuar?"
                        >
                          Eliminar
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
