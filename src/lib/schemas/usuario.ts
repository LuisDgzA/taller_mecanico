import { z } from "zod";

const emptyToUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const CreateUsuarioSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  correo: z.email("Ingresa un correo valido.").max(100),
  telefono: z.preprocess(
    (value) => emptyToUndefined(String(value ?? "")),
    z.string().max(15, "El telefono no puede exceder 15 caracteres.").optional(),
  ),
  password: z.preprocess(
    (value) => emptyToUndefined(String(value ?? "")),
    z.string().min(8, "La contrasena debe tener al menos 8 caracteres.").optional(),
  ),
});

export const UpdateUsuarioSchema = z.object({
  id: z.coerce.number().int().positive(),
  authId: z.string().uuid().nullable().optional(),
  nombre: z.string().trim().min(2).max(100),
  correo: z.email().max(100),
  telefono: z.preprocess(
    (value) => emptyToUndefined(String(value ?? "")),
    z.string().max(15).optional(),
  ),
  password: z.preprocess(
    (value) => emptyToUndefined(String(value ?? "")),
    z.string().min(8).optional(),
  ),
});

export const ToggleUsuarioSchema = z.object({
  id: z.coerce.number().int().positive(),
  authId: z.string().uuid().nullable().optional(),
  status: z.coerce.number().int().refine((value) => value === 0 || value === 1),
});
