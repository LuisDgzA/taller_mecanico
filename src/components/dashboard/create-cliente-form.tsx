"use client";

import { useActionState, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  createClienteAction,
  type CreateClienteActionState,
} from "@/actions/clientes";

const initialCreateClienteActionState: CreateClienteActionState = {};

export function CreateClienteForm() {
  const [state, formAction, pending] = useActionState<CreateClienteActionState, FormData>(
    createClienteAction,
    initialCreateClienteActionState,
  );
  const [dismissedDuplicateKey, setDismissedDuplicateKey] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmDuplicateRef = useRef<HTMLInputElement>(null);

  const duplicateKey = state.duplicateMatches?.length
    ? `${state.duplicateName ?? ""}:${state.duplicateMatches.map((cliente) => cliente.id).join(",")}`
    : null;

  const showDuplicateModal = Boolean(duplicateKey && duplicateKey !== dismissedDuplicateKey);

  const handleCancelDuplicate = () => {
    if (confirmDuplicateRef.current) {
      confirmDuplicateRef.current.value = "0";
    }

    setDismissedDuplicateKey(duplicateKey);
  };

  const handleConfirmDuplicate = () => {
    if (confirmDuplicateRef.current) {
      confirmDuplicateRef.current.value = "1";
    }

    setDismissedDuplicateKey(duplicateKey);
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="mt-5 space-y-4"
        onSubmit={() => setDismissedDuplicateKey(null)}
      >
        <input name="redirectTo" type="hidden" value="/dashboard/clientes" />
        <input ref={confirmDuplicateRef} name="confirmDuplicate" type="hidden" value="0" />

        <label className="block text-sm font-medium text-slate-700">
          Nombre
          <input
            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
            name="nombre"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Correo
          <input
            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
            name="correo"
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Teléfono
          <input
            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
            name="telefono"
          />
        </label>

        {state.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </div>
        ) : null}

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creando...
            </>
          ) : (
            "Crear cliente"
          )}
        </button>
      </form>

      {showDuplicateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-700/80">
              Cliente duplicado
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Ya existe un cliente con este nombre
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Encontramos cliente{state.duplicateMatches && state.duplicateMatches.length === 1 ? "" : "s"} con el nombre{" "}
              <span className="font-semibold text-slate-950">{state.duplicateName}</span>.
              ¿Deseas continuar de todos modos?
            </p>

            <div className="mt-4 space-y-3 rounded-3xl bg-slate-50 p-4">
              {state.duplicateMatches?.map((cliente) => (
                <div key={cliente.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {cliente.nombre}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {cliente.telefono?.trim() || "Sin teléfono"}
                    {" · "}
                    {cliente.correo?.trim() || "Sin correo"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="h-11 rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-950"
                type="button"
                onClick={handleCancelDuplicate}
              >
                Cancelar
              </button>
              <button
                className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                type="button"
                onClick={handleConfirmDuplicate}
              >
                Sí, continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
