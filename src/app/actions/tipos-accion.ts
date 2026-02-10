"use server";

import { db } from "@/lib/db";
import { tiposAccion } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const tipoAccionSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
});

export async function getTiposAccion() {
  return db.select().from(tiposAccion).orderBy(tiposAccion.nombre);
}

export async function getTiposAccionActivos() {
  return db.select().from(tiposAccion).where(eq(tiposAccion.active, true)).orderBy(tiposAccion.nombre);
}

export async function createTipoAccion(formData: FormData) {
  const parsed = tipoAccionSchema.safeParse({ nombre: formData.get("nombre") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.insert(tiposAccion).values(parsed.data);
  revalidatePath("/admin/tipos-accion");
  return { success: true };
}

export async function updateTipoAccion(id: number, formData: FormData) {
  const parsed = tipoAccionSchema.safeParse({ nombre: formData.get("nombre") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.update(tiposAccion).set({ ...parsed.data, updatedAt: new Date() }).where(eq(tiposAccion.id, id));
  revalidatePath("/admin/tipos-accion");
  return { success: true };
}

export async function toggleTipoAccionActive(id: number, active: boolean) {
  await db.update(tiposAccion).set({ active, updatedAt: new Date() }).where(eq(tiposAccion.id, id));
  revalidatePath("/admin/tipos-accion");
}
