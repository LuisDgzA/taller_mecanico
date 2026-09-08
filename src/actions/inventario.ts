"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildActionRedirect, getRedirectTarget } from "@/lib/action-feedback";
import { requireCurrentStaffProfile } from "@/lib/current-staff";
import { parseRefaccionesWorkbook } from "@/lib/inventario-import";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import {
  CreateRefaccionMovimientoSchema,
  CreateRefaccionSchema,
  DeleteRefaccionSchema,
  ImportRefaccionRowSchema,
  UpdateRefaccionSchema,
} from "@/lib/schemas/inventario";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

const IMPORT_MAX_ROWS = 500;
const IMPORT_ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

export async function createRefaccionAction(formData: FormData): Promise<void> {
  const redirectTo = getRedirectTarget(formData, "/dashboard/inventario");
  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect(buildActionRedirect(redirectTo, { error: "No tienes permiso para administrar inventario." }));
  }

  const parsed = CreateRefaccionSchema.safeParse({
    nombre: formData.get("nombre"),
    marca: formData.get("marca"),
    uuid: formData.get("uuid"),
    precio: formData.get("precio"),
    stock: formData.get("stock"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: parsed.error.issues[0]?.message ?? "No se pudo crear la refaccion.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();
  const { data: createdRefaccion, error } = await supabase
    .from("refaccion")
    .insert({
      nombre: parsed.data.nombre,
      marca: parsed.data.marca,
      uuid: parsed.data.uuid,
      precio: parsed.data.precio,
    })
    .select("id")
    .single();

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  if (parsed.data.stock > 0) {
    const staff = await requireCurrentStaffProfile();
    const { error: kardexError } = await supabase.from("refaccion_kardex").insert({
      refaccion_id: createdRefaccion.id,
      usuario_id: staff.id,
      tipo: 1,
      inicial: 0,
      cantidad: parsed.data.stock,
      final: parsed.data.stock,
    });

    if (kardexError) {
      await supabase.from("refaccion").delete().eq("id", createdRefaccion.id);
      redirect(buildActionRedirect(redirectTo, { error: kardexError.message }));
    }
  }

  revalidatePath("/dashboard/inventario");
  redirect(buildActionRedirect(redirectTo, { success: "Refaccion creada correctamente." }));
}

export async function updateRefaccionAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/inventario");
  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect(buildActionRedirect(redirectTo, { error: "No tienes permiso para administrar inventario." }));
  }

  const parsed = UpdateRefaccionSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    marca: formData.get("marca"),
    uuid: formData.get("uuid"),
    precio: formData.get("precio"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: parsed.error.issues[0]?.message ?? "No se pudo actualizar la refaccion.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase
    .from("refaccion")
    .update({
      nombre: parsed.data.nombre,
      marca: parsed.data.marca,
      uuid: parsed.data.uuid,
      precio: parsed.data.precio,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath("/dashboard/inventario");
  revalidatePath(`/dashboard/inventario/${parsed.data.id}`);
  redirect(buildActionRedirect(redirectTo, { success: "Refaccion actualizada correctamente." }));
}

export async function deleteRefaccionAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/inventario");
  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect(buildActionRedirect(redirectTo, { error: "No tienes permiso para administrar inventario." }));
  }

  const parsed = DeleteRefaccionSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    redirect(buildActionRedirect(redirectTo, { error: "No se pudo eliminar la refaccion." }));
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase.from("refaccion").delete().eq("id", parsed.data.id);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath("/dashboard/inventario");
  redirect(buildActionRedirect(redirectTo, { success: "Refaccion eliminada correctamente." }));
}

export async function createRefaccionMovimientoAction(formData: FormData) {
  const redirectTo = getRedirectTarget(
    formData,
    `/dashboard/inventario/${String(formData.get("id") ?? "")}`,
  );
  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect(buildActionRedirect(redirectTo, { error: "No tienes permiso para administrar inventario." }));
  }

  const parsed = CreateRefaccionMovimientoSchema.safeParse({
    id: formData.get("id"),
    tipo: formData.get("tipo"),
    cantidad: formData.get("cantidad"),
    notas: formData.get("notas"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: parsed.error.issues[0]?.message ?? "No se pudo registrar el movimiento.",
      }),
    );
  }

  const staff = await requireCurrentStaffProfile();
  const supabase = await createSupabaseServerActionClient();
  const { data: lastMovimiento, error: lastMovimientoError } = await supabase
    .from("refaccion_kardex")
    .select("final")
    .eq("refaccion_id", parsed.data.id)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastMovimientoError) {
    redirect(buildActionRedirect(redirectTo, { error: lastMovimientoError.message }));
  }

  const inicial = lastMovimiento?.final ?? 0;
  const tipo = parsed.data.tipo === "entrada" ? 1 : -1;
  const final = inicial + tipo * parsed.data.cantidad;

  if (final < 0) {
    redirect(buildActionRedirect(redirectTo, { error: "No hay stock suficiente para esta salida." }));
  }

  const { error } = await supabase.from("refaccion_kardex").insert({
    refaccion_id: parsed.data.id,
    usuario_id: staff.id,
    tipo,
    inicial,
    cantidad: parsed.data.cantidad,
    final,
    notas: parsed.data.notas,
  });

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath("/dashboard/inventario");
  revalidatePath(`/dashboard/inventario/${parsed.data.id}`);
  redirect(buildActionRedirect(redirectTo, { success: "Movimiento registrado correctamente." }));
}

function joinErrors(errors: string[]) {
  const MAX_VISIBLE = 6;
  const visible = errors.slice(0, MAX_VISIBLE).join(" | ");
  const remaining = errors.length - MAX_VISIBLE;
  return remaining > 0 ? `${visible} | y ${remaining} error(es) mas.` : visible;
}

export async function importRefaccionesAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/inventario");
  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect(buildActionRedirect(redirectTo, { error: "No tienes permiso para administrar inventario." }));
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(buildActionRedirect(redirectTo, { error: "Selecciona un archivo de Excel para importar." }));
  }

  const lowerName = file.name.toLowerCase();
  const hasValidExtension = IMPORT_ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

  if (!hasValidExtension) {
    redirect(buildActionRedirect(redirectTo, { error: "El archivo debe tener formato .xlsx o .xls." }));
  }

  let rawRows;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    rawRows = await parseRefaccionesWorkbook(buffer);
  } catch {
    redirect(buildActionRedirect(redirectTo, { error: "No se pudo leer el archivo. Verifica que sea un Excel valido." }));
  }

  if (rawRows.length === 0) {
    redirect(buildActionRedirect(redirectTo, { error: "El archivo no contiene filas para importar." }));
  }

  if (rawRows.length > IMPORT_MAX_ROWS) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: `El archivo excede el limite de ${IMPORT_MAX_ROWS} filas por importacion.`,
      }),
    );
  }

  const errors: string[] = [];
  const validRows: { rowNumber: number; nombre: string; marca: string | null; uuid: string; precio: number; stock: number }[] = [];
  const seenUuids = new Set<string>();
  const seenNombres = new Set<string>();

  for (const raw of rawRows) {
    const parsed = ImportRefaccionRowSchema.safeParse({
      nombre: raw.nombre,
      marca: raw.marca,
      uuid: raw.uuid,
      precio: raw.precio,
      stock: raw.stock,
    });

    if (!parsed.success) {
      errors.push(`Fila ${raw.rowNumber}: ${parsed.error.issues[0]?.message ?? "datos invalidos."}`);
      continue;
    }

    const uuidKey = parsed.data.uuid.toLowerCase();
    const nombreKey = parsed.data.nombre.toLowerCase();

    if (seenUuids.has(uuidKey)) {
      errors.push(`Fila ${raw.rowNumber}: el UUID esta repetido en el archivo.`);
      continue;
    }

    if (seenNombres.has(nombreKey)) {
      errors.push(`Fila ${raw.rowNumber}: la refaccion "${parsed.data.nombre}" esta repetida en el archivo.`);
      continue;
    }

    seenUuids.add(uuidKey);
    seenNombres.add(nombreKey);
    validRows.push({ rowNumber: raw.rowNumber, ...parsed.data });
  }

  const supabase = await createSupabaseServerActionClient();
  const { data: existingRefacciones, error: existingError } = await supabase
    .from("refaccion")
    .select("nombre, uuid");

  if (existingError) {
    redirect(buildActionRedirect(redirectTo, { error: existingError.message }));
  }

  const existingUuids = new Set((existingRefacciones ?? []).map((row) => String(row.uuid).toLowerCase()));
  const existingNombres = new Set((existingRefacciones ?? []).map((row) => String(row.nombre).toLowerCase()));

  const rowsToInsert = validRows.filter((row) => {
    const uuidKey = row.uuid.toLowerCase();
    const nombreKey = row.nombre.toLowerCase();

    if (existingUuids.has(uuidKey)) {
      errors.push(`Fila ${row.rowNumber}: ya existe una refaccion con ese UUID.`);
      return false;
    }

    if (existingNombres.has(nombreKey)) {
      errors.push(`Fila ${row.rowNumber}: ya existe una refaccion con el nombre "${row.nombre}".`);
      return false;
    }

    return true;
  });

  if (errors.length > 0) {
    redirect(buildActionRedirect(redirectTo, { error: joinErrors(errors) }));
  }

  const staff = await requireCurrentStaffProfile();
  let insertedCount = 0;
  const insertErrors: string[] = [];

  for (const row of rowsToInsert) {
    const { data: createdRefaccion, error: insertError } = await supabase
      .from("refaccion")
      .insert({ nombre: row.nombre, marca: row.marca, uuid: row.uuid, precio: row.precio })
      .select("id")
      .single();

    if (insertError || !createdRefaccion) {
      insertErrors.push(`Fila ${row.rowNumber}: ${insertError?.message ?? "no se pudo crear."}`);
      continue;
    }

    if (row.stock > 0) {
      const { error: kardexError } = await supabase.from("refaccion_kardex").insert({
        refaccion_id: createdRefaccion.id,
        usuario_id: staff.id,
        tipo: 1,
        inicial: 0,
        cantidad: row.stock,
        final: row.stock,
      });

      if (kardexError) {
        await supabase.from("refaccion").delete().eq("id", createdRefaccion.id);
        insertErrors.push(`Fila ${row.rowNumber}: ${kardexError.message}`);
        continue;
      }
    }

    insertedCount += 1;
  }

  revalidatePath("/dashboard/inventario");

  if (insertErrors.length > 0) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: joinErrors(insertErrors),
        success: insertedCount > 0 ? `${insertedCount} refaccion(es) importada(s) correctamente.` : undefined,
      }),
    );
  }

  redirect(
    buildActionRedirect(redirectTo, {
      success: `${insertedCount} refaccion(es) importada(s) correctamente.`,
    }),
  );
}