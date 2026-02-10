"use server";

import { db } from "@/lib/db";
import { areas } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const areaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
});

export async function getAreas() {
  return db.select().from(areas).orderBy(areas.nombre);
}

export async function getAreasActivas() {
  return db.select().from(areas).where(eq(areas.active, true)).orderBy(areas.nombre);
}

export async function createArea(formData: FormData) {
  const parsed = areaSchema.safeParse({ nombre: formData.get("nombre") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.insert(areas).values(parsed.data);
  revalidatePath("/admin/areas");
  return { success: true };
}

export async function updateArea(id: number, formData: FormData) {
  const parsed = areaSchema.safeParse({ nombre: formData.get("nombre") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.update(areas).set({ ...parsed.data, updatedAt: new Date() }).where(eq(areas.id, id));
  revalidatePath("/admin/areas");
  return { success: true };
}

export async function toggleAreaActive(id: number, active: boolean) {
  await db.update(areas).set({ active, updatedAt: new Date() }).where(eq(areas.id, id));
  revalidatePath("/admin/areas");
}
