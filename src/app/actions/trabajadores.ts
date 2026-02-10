"use server";

import { db } from "@/lib/db";
import { trabajadores } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const trabajadorSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  externalId: z.string().optional(),
  puestoId: z.coerce.number().nullable().optional(),
  areaId: z.coerce.number().nullable().optional(),
  centroId: z.coerce.number().nullable().optional(),
  uapId: z.coerce.number().nullable().optional(),
  colectivoId: z.coerce.number().nullable().optional(),
  fechaIncorporacionPuesto: z.string().min(1, "La fecha de incorporación es obligatoria"),
});

export async function getTrabajadores() {
  return db.select().from(trabajadores).orderBy(trabajadores.apellidos);
}

export async function getTrabajadoresActivos() {
  return db.select().from(trabajadores).where(eq(trabajadores.active, true)).orderBy(trabajadores.apellidos);
}

export async function createTrabajador(formData: FormData) {
  const parsed = trabajadorSchema.safeParse({
    nombre: formData.get("nombre"),
    apellidos: formData.get("apellidos"),
    email: formData.get("email") || "",
    externalId: formData.get("externalId") || undefined,
    puestoId: formData.get("puestoId") ? Number(formData.get("puestoId")) : null,
    areaId: formData.get("areaId") ? Number(formData.get("areaId")) : null,
    centroId: formData.get("centroId") ? Number(formData.get("centroId")) : null,
    uapId: formData.get("uapId") ? Number(formData.get("uapId")) : null,
    colectivoId: formData.get("colectivoId") ? Number(formData.get("colectivoId")) : null,
    fechaIncorporacionPuesto: formData.get("fechaIncorporacionPuesto"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { email, ...rest } = parsed.data;
  await db.insert(trabajadores).values({
    ...rest,
    email: email || null,
  });
  revalidatePath("/admin/trabajadores");
  return { success: true };
}

export async function updateTrabajador(id: string, formData: FormData) {
  const parsed = trabajadorSchema.safeParse({
    nombre: formData.get("nombre"),
    apellidos: formData.get("apellidos"),
    email: formData.get("email") || "",
    externalId: formData.get("externalId") || undefined,
    puestoId: formData.get("puestoId") ? Number(formData.get("puestoId")) : null,
    areaId: formData.get("areaId") ? Number(formData.get("areaId")) : null,
    centroId: formData.get("centroId") ? Number(formData.get("centroId")) : null,
    uapId: formData.get("uapId") ? Number(formData.get("uapId")) : null,
    colectivoId: formData.get("colectivoId") ? Number(formData.get("colectivoId")) : null,
    fechaIncorporacionPuesto: formData.get("fechaIncorporacionPuesto"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { email, ...rest } = parsed.data;
  await db
    .update(trabajadores)
    .set({ ...rest, email: email || null, updatedAt: new Date() })
    .where(eq(trabajadores.id, id));
  revalidatePath("/admin/trabajadores");
  return { success: true };
}

export async function toggleTrabajadorActive(id: string, active: boolean) {
  await db.update(trabajadores).set({ active, updatedAt: new Date() }).where(eq(trabajadores.id, id));
  revalidatePath("/admin/trabajadores");
}
