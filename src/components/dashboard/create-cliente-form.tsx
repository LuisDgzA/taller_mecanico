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
    ? `${state.duplicateName ?? ""}:${state.duplicateMatches.map((c) => c.id).join(",")}`
    : null;

  const showDuplicateModal = Boolean(duplicateKey && duplicateKey !== dismissedDuplicateKey);

  const handleCancelDuplicate = () => {
    if (confirmDuplicateRef.current) confirmDuplicateRef.current.value = "0";
    setDismissedDuplicateKey(duplicateKey);
  };

  const handleConfirmDuplicate = () => {
    if (confirmDuplicateRef.current) confirmDuplicateRef.current.value = "1";
    setDismissedDuplicateKey(duplicateKey);
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className="space-y-3"
        onSubmit={() => setDismissedDuplicateKey(null)}
      >
        <input name="redirectTo" type="hidden" value="/dashboard/clientes" />
        <input ref={confirmDuplicateRef} name="confirmDuplicate" type="hidden" value="0" />

        <label className="block text-sm font-medium text-on-surface">
          Nombre
          <input
            className="mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
            name="nombre"
            required
          />
        </label>
        <label className="block text-sm font-medium text-on-surface">
          Correo
          <input
            className="mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
            name="correo"
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-on-surface">
          Teléfono
          <input
            className="mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
            name="telefono"
          />
        </label>

        {state.error ? (
          <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
            {state.error}
          </div>
        ) : null}

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-on-primary transition disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 px-4">
          <div className="w-full max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-xl">
            <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
              Cliente duplicado
            </p>
            <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-on-surface">
              Ya existe un cliente con este nombre
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Encontramos cliente{state.duplicateMatches && state.duplicateMatches.length === 1 ? "" : "s"} con el nombre{" "}
              <span className="font-semibold text-on-surface">{state.duplicateName}</span>.
              ¿Deseas continuar de todos modos?
            </p>

            <div className="mt-3 space-y-2 rounded-lg bg-surface-container-low p-3">
              {state.duplicateMatches?.map((cliente) => (
                <div
                  key={cliente.id}
                  className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2"
                >
                  <p className="text-sm font-semibold text-on-surface">{cliente.nombre}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">
                    {cliente.telefono?.trim() || "Sin teléfono"} · {cliente.correo?.trim() || "Sin correo"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                className="h-11 flex-1 rounded-lg border border-outline-variant text-sm font-medium text-on-surface transition"
                type="button"
                onClick={handleCancelDuplicate}
              >
                Cancelar
              </button>
              <button
                className="h-11 flex-1 rounded-lg bg-primary text-sm font-semibold text-on-primary transition"
                type="button"
                onClick={handleConfirmDuplicate}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
