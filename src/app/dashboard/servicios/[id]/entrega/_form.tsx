"use client";

import { useState } from "react";

import { entregarServicioAction } from "@/actions/servicios";
import { SignaturePad } from "@/components/dashboard/signature-pad";

export function EntregaForm({
  servicioId,
  error,
}: {
  servicioId: number;
  error?: string;
}) {
  const [signatureData, setSignatureData] = useState<string | null>(null);

  return (
    <form action={entregarServicioAction} className="space-y-6">
      <input name="servicioId" type="hidden" value={servicioId} />
      <input name="signatureData" type="hidden" value={signatureData ?? ""} />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Firma del cliente
        </p>
        <p className="mt-1 text-sm text-slate-400">
          El cliente debe firmar en el recuadro para confirmar la recepción.
        </p>
        <div className="mt-4">
          <SignaturePad onChange={setSignatureData} />
        </div>
      </div>

      <button
        className="h-12 w-full rounded-2xl bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
        disabled={!signatureData}
        type="submit"
      >
        {signatureData ? "Confirmar entrega" : "Firma requerida para continuar"}
      </button>
    </form>
  );
}
