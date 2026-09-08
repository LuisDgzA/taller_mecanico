import { z } from "zod";

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export const CreateRefaccionSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(100),
  marca: z.preprocess(
    (value) => emptyToNull(String(value ?? "")),
    z.string().max(100).nullable(),
  ),
  uuid: z.string().trim().uuid("Ingresa un UUID valido."),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo."),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo."),
});

export const UpdateRefaccionSchema = z.object({
  id: z.coerce.number().int().positive(),
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(100),
  marca: z.preprocess(
    (value) => emptyToNull(String(value ?? "")),
    z.string().max(100).nullable(),
  ),
  uuid: z.string().trim().uuid("Ingresa un UUID valido."),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo."),
  status: z.coerce
    .number()
    .int()
    .refine((value) => value === 0 || value === 1, "El status debe ser 0 o 1."),
});

export const DeleteRefaccionSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ImportRefaccionRowSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(100),
  marca: z.preprocess(
    (value) => emptyToNull(String(value ?? "")),
    z.string().max(100).nullable(),
  ),
  uuid: z.string().trim().uuid("El UUID no es valido."),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo."),
  stock: z.preprocess(
    (value) => (value === null || value === undefined || value === "" ? 0 : value),
    z.coerce.number().int().min(0, "El stock no puede ser negativo."),
  ),
});

export const CreateRefaccionMovimientoSchema = z.object({
  id: z.coerce.number().int().positive(),
  tipo: z.enum(["entrada", "salida"]),
  cantidad: z.coerce.number().int().min(1, "La cantidad debe ser mayor a cero."),
  notas: z.preprocess(
    (value) => emptyToNull(String(value ?? "")),
    z.string().max(500).nullable(),
  ),
});