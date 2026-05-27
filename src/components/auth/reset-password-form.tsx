"use client";

import { useActionState } from "react";

import {
  resetPasswordAction,
  type AuthActionState,
} from "@/actions/auth";

import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-100" htmlFor="correo">
          Correo
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-500/20"
          id="correo"
          name="correo"
          placeholder="mecanico@taller.com"
          required
          type="email"
        />
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {state.success}
        </div>
      ) : null}

      <SubmitButton pendingLabel="Enviando...">
        Enviar enlace de recuperación
      </SubmitButton>
    </form>
  );
}
