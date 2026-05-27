import { z } from "zod";

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const currentYear = new Date().getFullYear();

export const CreateVehiculoSchema = z.object({
  clienteId: z.coerce.number().int().positive(),
  placa: z.string().trim().min(1, "La placa es obligatoria.").max(45),
  marca: z.preprocess((value) => emptyToNull(String(value ?? "")), z.string().max(45).nullable()),
  modelo: z.preprocess((value) => emptyToNull(String(value ?? "")), z.string().max(45).nullable()),
  color: z.preprocess((value) => emptyToNull(String(value ?? "")), z.string().max(45).nullable()),
  anio: z.preprocess(
    (value) => {
      const raw = String(value ?? "").trim();
      return raw === "" ? null : Number(raw);
    },
    z.number().int().min(1900).max(currentYear).nullable(),
  ),
});

export const UpdateVehiculoSchema = CreateVehiculoSchema.extend({
  id: z.coerce.number().int().positive(),
});

export const DeleteVehiculoSchema = z.object({
  id: z.coerce.number().int().positive(),
  clienteId: z.coerce.number().int().positive(),
});
