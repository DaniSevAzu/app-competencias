"use server";

import { db } from "@/lib/db";
import { colectivos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const colectivoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
});

export async function getColectivos() {
  return db.select().from(colectivos).orderBy(colectivos.nombre);
}

export async function getColectivosActivos() {
  return db.select().from(colectivos).where(eq(colectivos.active, true)).orderBy(colectivos.nombre);
}

export async function createColectivo(formData: FormData) {
  const parsed = colectivoSchema.safeParse({ nombre: formData.get("nombre") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.insert(colectivos).values(parsed.data);
  revalidatePath("/admin/colectivos");
  return { success: true };
}

export async function updateColectivo(id: number, formData: FormData) {
  const parsed = colectivoSchema.safeParse({ nombre: formData.get("nombre") });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.update(colectivos).set({ ...parsed.data, updatedAt: new Date() }).where(eq(colectivos.id, id));
  revalidatePath("/admin/colectivos");
  return { success: true };
}

export async function toggleColectivoActive(id: number, active: boolean) {
  await db.update(colectivos).set({ active, updatedAt: new Date() }).where(eq(colectivos.id, id));
  revalidatePath("/admin/colectivos");
}
