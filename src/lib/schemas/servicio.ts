import { z } from "zod";

export const CreateServicioSchema = z.object({
  vehiculoId: z.coerce.number().int().positive("El vehículo es obligatorio."),
  descripcion: z.string().trim().optional(),
});

export const UpdateServicioStatusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.coerce.number().int().min(1).max(2),
});
