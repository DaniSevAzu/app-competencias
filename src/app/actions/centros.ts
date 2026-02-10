"use server";

import { db } from "@/lib/db";
import { centros } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const centroSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio"),
  nombre: z.string().min(1, "El nombre es obligatorio"),
});

export async function getCentros() {
  return db.select().from(centros).orderBy(centros.nombre);
}

export async function getCentrosActivos() {
  return db.select().from(centros).where(eq(centros.active, true)).orderBy(centros.nombre);
}

export async function createCentro(formData: FormData) {
  const parsed = centroSchema.safeParse({
    codigo: formData.get("codigo"),
    nombre: formData.get("nombre"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.insert(centros).values(parsed.data);
  revalidatePath("/admin/centros");
  return { success: true };
}

export async function updateCentro(id: number, formData: FormData) {
  const parsed = centroSchema.safeParse({
    codigo: formData.get("codigo"),
    nombre: formData.get("nombre"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db
    .update(centros)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(centros.id, id));
  revalidatePath("/admin/centros");
  return { success: true };
}

export async function toggleCentroActive(id: number, active: boolean) {
  await db
    .update(centros)
    .set({ active, updatedAt: new Date() })
    .where(eq(centros.id, id));
  revalidatePath("/admin/centros");
}
