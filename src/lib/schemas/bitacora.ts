import { z } from "zod";

export const CreateBitacoraSchema = z.object({
  servicioId: z.coerce.number().int().positive(),
  descripcion: z
    .string()
    .trim()
    .min(5, "La descripción debe tener al menos 5 caracteres."),
});

export const DeleteBitacoraSchema = z.object({
  id: z.coerce.number().int().positive(),
  servicioId: z.coerce.number().int().positive(),
});
