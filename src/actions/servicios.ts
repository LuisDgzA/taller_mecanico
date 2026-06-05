"use server";

import sharp from "sharp";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildActionRedirect } from "@/lib/action-feedback";
import { requireCurrentStaffProfile } from "@/lib/current-staff";
import { CreateServicioSchema, UpdateServicioStatusSchema } from "@/lib/schemas/servicio";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";


const BASE = "/dashboard/servicios";
const NUEVO = "/dashboard/servicios/nuevo";

async function uploadImages(
  supabase: Awaited<ReturnType<typeof createSupabaseServerActionClient>>,
  bucket: string,
  recordId: number,
  files: File[],
  maxCount: number,
): Promise<Record<string, string | null>> {
  const fieldNames = ["imagen_uno", "imagen_dos", "imagen_tres", "imagen_cuatro", "imagen_cinco"].slice(0, maxCount);
  const result: Record<string, string | null> = {};

  for (let i = 0; i < Math.min(files.length, maxCount); i++) {
    const file = files[i];
    const path = `${recordId}/imagen_${i + 1}.webp`;

    const arrayBuffer = await file.arrayBuffer();
    const webpBuffer = await sharp(Buffer.from(arrayBuffer)).webp({ quality: 80 }).toBuffer();

    const { error } = await supabase.storage.from(bucket).upload(path, webpBuffer, {
      upsert: true,
      contentType: "image/webp",
    });

    if (!error) {
      result[fieldNames[i]] = path;
    }
  }

  return result;
}

export async function initServicioStep1Action(formData: FormData) {
  const rawVehiculoId = String(formData.get("vehiculoId") ?? "").trim();

  // Existing vehicle selected — skip directly to step 2
  if (rawVehiculoId) {
    const id = Number(rawVehiculoId);
    if (Number.isFinite(id) && id > 0) {
      redirect(`${NUEVO}?step=2&vehiculoId=${id}`);
    }
  }

  const supabase = await createSupabaseServerActionClient();
  const errorBase = NUEVO;

  // Resolve client
  const rawClienteId = String(formData.get("clienteId") ?? "").trim();
  let finalClienteId: number;

  if (rawClienteId) {
    finalClienteId = Number(rawClienteId);
  } else {
    const nombre = String(formData.get("nombre") ?? "").trim();
    const correo = String(formData.get("correo") ?? "").trim() || null;
    const telefono = String(formData.get("telefono") ?? "").trim() || null;

    if (!nombre) {
      redirect(buildActionRedirect(errorBase, { error: "El nombre del cliente es obligatorio." }));
    }

    const { data: newCliente, error: clienteError } = await supabase
      .from("clientes")
      .insert({ nombre, correo, telefono })
      .select("id")
      .single();

    if (clienteError || !newCliente) {
      redirect(
        buildActionRedirect(errorBase, {
          error: clienteError?.message ?? "No se pudo crear el cliente.",
        }),
      );
    }

    finalClienteId = newCliente.id;
  }

  // Resolve vehicle
  const placa = String(formData.get("placa") ?? "").trim();
  if (!placa) {
    redirect(buildActionRedirect(errorBase, { error: "La placa es obligatoria." }));
  }

  const marca = String(formData.get("marca") ?? "").trim() || null;
  const modelo = String(formData.get("modelo") ?? "").trim() || null;
  const color = String(formData.get("color") ?? "").trim() || null;
  const anioRaw = String(formData.get("anio") ?? "").trim();
  const anio = anioRaw ? Number(anioRaw) : null;

  const { data: newVehiculo, error: vehiculoError } = await supabase
    .from("vehiculos")
    .insert({ cliente_id: finalClienteId, placa, marca, modelo, color, anio })
    .select("id")
    .single();

  if (vehiculoError || !newVehiculo) {
    redirect(
      buildActionRedirect(errorBase, {
        error: vehiculoError?.message ?? "No se pudo registrar el vehículo.",
      }),
    );
  }

  redirect(`${NUEVO}?step=2&vehiculoId=${newVehiculo.id}`);
}

export async function createServicioAction(formData: FormData) {
  const staff = await requireCurrentStaffProfile();

  const parsed = CreateServicioSchema.safeParse({
    vehiculoId: formData.get("vehiculoId"),
    descripcion: formData.get("descripcion"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(`${NUEVO}?step=2&vehiculoId=${formData.get("vehiculoId")}`, {
        error: parsed.error.issues[0]?.message ?? "Datos inválidos.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();

  const { data: servicio, error: servicioError } = await supabase
    .from("servicios")
    .insert({
      vehiculo_id: parsed.data.vehiculoId,
      usuario_recibe: staff.id,
      descripcion: parsed.data.descripcion ?? null,
      status: 0,
    })
    .select("id")
    .single();

  if (servicioError || !servicio) {
    redirect(
      buildActionRedirect(`${NUEVO}?step=2&vehiculoId=${parsed.data.vehiculoId}`, {
        error: servicioError?.message ?? "No se pudo crear el servicio.",
      }),
    );
  }

  // Upload images if any
  const rawFiles = formData.getAll("imagenes");
  const files = rawFiles.filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > 0) {
    const imageFields = await uploadImages(supabase, "servicios", servicio.id, files, 5);

    if (Object.keys(imageFields).length > 0) {
      await supabase.from("servicios").update(imageFields).eq("id", servicio.id);
    }
  }

  revalidatePath(BASE);
  redirect(BASE);
}

export async function updateServicioStatusAction(formData: FormData) {
  const staff = await requireCurrentStaffProfile();

  const parsed = UpdateServicioStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(`${BASE}/${formData.get("id")}`, {
        error: "Estado inválido.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();

  const updates: Record<string, unknown> = { status: parsed.data.status };

  if (parsed.data.status === 2) {
    updates.fecha_fin = new Date().toISOString();
    updates.usuario_finaliza = staff.id;
  }

  // Atomic transition: only succeeds if current status is exactly status-1
  const { data, error } = await supabase
    .from("servicios")
    .update(updates)
    .eq("id", parsed.data.id)
    .eq("status", parsed.data.status - 1)
    .select("id");

  if (error) {
    redirect(buildActionRedirect(`${BASE}/${parsed.data.id}`, { error: error.message }));
  }

  if (!data || data.length === 0) {
    redirect(
      buildActionRedirect(`${BASE}/${parsed.data.id}`, {
        error: "Transición no permitida desde el estado actual.",
      }),
    );
  }

  revalidatePath(`${BASE}/${parsed.data.id}`);
  revalidatePath(BASE);
  redirect(`${BASE}/${parsed.data.id}`);
}

export async function entregarServicioAction(formData: FormData) {
  const staff = await requireCurrentStaffProfile();

  const servicioId = Number(formData.get("servicioId"));
  const signatureData = String(formData.get("signatureData") ?? "").trim();
  const entregaBase = `${BASE}/${servicioId}/entrega`;

  if (!Number.isFinite(servicioId) || servicioId <= 0) {
    redirect(BASE);
  }

  if (!signatureData.startsWith("data:image/png;base64,")) {
    redirect(buildActionRedirect(entregaBase, { error: "La firma es obligatoria." }));
  }

  const supabase = await createSupabaseServerActionClient();

  // Upload signature PNG to Storage bucket "firmas"
  const base64 = signatureData.split(",")[1];
  const bytes = Buffer.from(base64, "base64");
  const path = `${servicioId}/firma.png`;

  let firmaUrl: string | null = null;
  const { error: uploadError } = await supabase.storage
    .from("firmas")
    .upload(path, bytes, { contentType: "image/png", upsert: true });

  if (!uploadError) {
    firmaUrl = path;
  }

  // Atomic update: only succeeds when current status is 2 (Finalizado)
  const updates: Record<string, unknown> = {
    status: 3,
    fecha_entrega: new Date().toISOString(),
    usuario_entrega: staff.id,
    ...(firmaUrl ? { firma_entrega_url: firmaUrl } : {}),
  };

  const { data, error } = await supabase
    .from("servicios")
    .update(updates)
    .eq("id", servicioId)
    .eq("status", 2)
    .select("id");

  if (error) {
    redirect(buildActionRedirect(entregaBase, { error: error.message }));
  }

  if (!data || data.length === 0) {
    redirect(
      buildActionRedirect(entregaBase, {
        error: "No se pudo registrar la entrega. El servicio debe estar en estado Finalizado.",
      }),
    );
  }

  revalidatePath(`${BASE}/${servicioId}`);
  revalidatePath(BASE);
  redirect(BASE);
}
