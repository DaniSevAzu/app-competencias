"use server";

import { db } from "@/lib/db";
import { puestos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const puestoSchema = z.object({
  codigo: z.string().optional(),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  areaId: z.coerce.number().nullable().optional(),
  perfilSyp: z.string().optional(),
  subperfilSyp: z.string().optional(),
  agrupacionComp: z.string().optional(),
  ambito: z.string().optional(),
});

export async function getPuestos() {
  return db.select().from(puestos).orderBy(puestos.nombre);
}

export async function getPuestosActivos() {
  return db.select().from(puestos).where(eq(puestos.active, true)).orderBy(puestos.nombre);
}

export async function createPuesto(formData: FormData) {
  const parsed = puestoSchema.safeParse({
    codigo: formData.get("codigo") || undefined,
    nombre: formData.get("nombre"),
    areaId: formData.get("areaId") ? Number(formData.get("areaId")) : null,
    perfilSyp: formData.get("perfilSyp") || undefined,
    subperfilSyp: formData.get("subperfilSyp") || undefined,
    agrupacionComp: formData.get("agrupacionComp") || undefined,
    ambito: formData.get("ambito") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.insert(puestos).values(parsed.data);
  revalidatePath("/admin/puestos");
  return { success: true };
}

export async function updatePuesto(id: number, formData: FormData) {
  const parsed = puestoSchema.safeParse({
    codigo: formData.get("codigo") || undefined,
    nombre: formData.get("nombre"),
    areaId: formData.get("areaId") ? Number(formData.get("areaId")) : null,
    perfilSyp: formData.get("perfilSyp") || undefined,
    subperfilSyp: formData.get("subperfilSyp") || undefined,
    agrupacionComp: formData.get("agrupacionComp") || undefined,
    ambito: formData.get("ambito") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db.update(puestos).set({ ...parsed.data, updatedAt: new Date() }).where(eq(puestos.id, id));
  revalidatePath("/admin/puestos");
  return { success: true };
}

export async function togglePuestoActive(id: number, active: boolean) {
  await db.update(puestos).set({ active, updatedAt: new Date() }).where(eq(puestos.id, id));
  revalidatePath("/admin/puestos");
}
