import { z } from "zod";

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

export const CreateClienteSchema = z.object({
  nombre: z.preprocess((value) => emptyToNull(String(value ?? "")), z.string().max(100).nullable()),
  correo: z.preprocess(
    (value) => emptyToNull(String(value ?? "")),
    z.email("Ingresa un correo valido.").max(100).nullable(),
  ),
  telefono: z.preprocess((value) => emptyToNull(String(value ?? "")), z.string().max(15).nullable()),
});

export const UpdateClienteSchema = CreateClienteSchema.extend({
  id: z.coerce.number().int().positive(),
});

export const DeleteClienteSchema = z.object({
  id: z.coerce.number().int().positive(),
});
