"use client";

import { useActionState, useState } from "react";

import { loginAction, type AuthActionState } from "@/actions/auth";

import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = {};

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="correo">
          Correo
        </label>
        <input
          autoComplete="email"
          className={inputClass}
          id="correo"
          name="correo"
          placeholder="mecanico@taller.com"
          required
          type="email"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-on-surface" htmlFor="password">
          Contraseña
        </label>
        <div className="relative">
          <input
            autoComplete="current-password"
            className={`${inputClass} pr-11`}
            id="password"
            name="password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition hover:text-on-surface"
            onClick={() => setShowPassword((v) => !v)}
            type="button"
          >
            {showPassword ? (
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" x2="23" y1="1" y2="23" />
              </svg>
            ) : (
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-on-surface-variant">
        <input
          className="size-4 rounded accent-primary"
          defaultChecked
          name="recordarme"
          type="checkbox"
        />
        Recordarme en este dispositivo
      </label>

      {state.error ? (
        <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {state.error}
        </div>
      ) : null}

      <SubmitButton pendingLabel="Entrando…">Iniciar sesión</SubmitButton>
    </form>
  );
}
