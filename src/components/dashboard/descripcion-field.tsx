"use client";

import { useState } from "react";

export function DescripcionField() {
  const [len, setLen] = useState(0);

  return (
    <div>
      <textarea
        className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-700"
        maxLength={500}
        name="descripcion"
        onChange={(e) => setLen(e.target.value.length)}
        placeholder="Describa el motivo de ingreso o reporte del cliente en detalle técnico..."
        rows={5}
      />
      <div className="mt-1 flex items-center justify-end">
        <span className="text-xs text-slate-400">{len}/500</span>
      </div>
    </div>
  );
}
