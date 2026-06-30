"use client";

import { useActionState } from "react";

import { resetPasswordAction, type AuthActionState } from "@/actions/auth";

import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="correo">
          Correo
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
          id="correo"
          name="correo"
          placeholder="mecanico@taller.com"
          required
          type="email"
        />
      </div>

      {state.error ? (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "#00573314", color: "#005a33" }}
        >
          {state.success}
        </div>
      ) : null}

      <SubmitButton pendingLabel="Enviando…">
        Enviar enlace de recuperación
      </SubmitButton>
    </form>
  );
}
