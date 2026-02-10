"use server";

import { db } from "@/lib/db";
import { uaps } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const uapSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio"),
  nombre: z.string().optional(),
  centroId: z.coerce.number({ error: "El centro es obligatorio" }),
});

export async function getUaps() {
  return db.select().from(uaps).orderBy(uaps.codigo);
}

export async function getUapsActivas() {
  return db.select().from(uaps).where(eq(uaps.active, true)).orderBy(uaps.codigo);
}

export async function createUap(formData: FormData) {
  const parsed = uapSchema.safeParse({
    codigo: formData.get("codigo"),
    nombre: formData.get("nombre") || undefined,
    centroId: formData.get("centroId"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.insert(uaps).values(parsed.data);
  revalidatePath("/admin/uaps");
  return { success: true };
}

export async function updateUap(id: number, formData: FormData) {
  const parsed = uapSchema.safeParse({
    codigo: formData.get("codigo"),
    nombre: formData.get("nombre") || undefined,
    centroId: formData.get("centroId"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.update(uaps).set({ ...parsed.data, updatedAt: new Date() }).where(eq(uaps.id, id));
  revalidatePath("/admin/uaps");
  return { success: true };
}

export async function toggleUapActive(id: number, active: boolean) {
  await db.update(uaps).set({ active, updatedAt: new Date() }).where(eq(uaps.id, id));
  revalidatePath("/admin/uaps");
}
