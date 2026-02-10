"use server";

import { db } from "@/lib/db";
import {
  plantillasEvaluacion,
  niveles,
  pilares,
  itemsEvaluacion,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const plantillaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
  colectivoId: z.coerce.number().nullable().optional(),
  ncEsperadoDefault: z.string().default("Avanzado"),
  umbralAntiguedadBaja: z.string().default("80"),
  umbralAntiguedadAlta: z.string().default("95"),
  anosUmbral: z.coerce.number().default(3),
});

export async function getPlantillas() {
  return db.select().from(plantillasEvaluacion).orderBy(plantillasEvaluacion.nombre);
}

export async function getPlantillaCompleta(id: number) {
  const plantilla = await db
    .select()
    .from(plantillasEvaluacion)
    .where(eq(plantillasEvaluacion.id, id))
    .limit(1);

  if (!plantilla[0]) return null;

  const nivelesData = await db
    .select()
    .from(niveles)
    .where(eq(niveles.plantillaId, id))
    .orderBy(niveles.orden);

  const pilaresData = await db
    .select()
    .from(pilares)
    .where(eq(pilares.plantillaId, id))
    .orderBy(pilares.orden);

  const itemsData = await db
    .select()
    .from(itemsEvaluacion)
    .where(eq(itemsEvaluacion.active, true))
    .orderBy(itemsEvaluacion.orden);

  // Filtrar items por pilares de esta plantilla
  const pilarIds = pilaresData.map((p) => p.id);
  const filteredItems = itemsData.filter((item) => pilarIds.includes(item.pilarId));

  return {
    ...plantilla[0],
    niveles: nivelesData,
    pilares: pilaresData,
    items: filteredItems,
  };
}

export async function createPlantilla(formData: FormData) {
  const parsed = plantillaSchema.safeParse({
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion") || undefined,
    colectivoId: formData.get("colectivoId") ? Number(formData.get("colectivoId")) : null,
    ncEsperadoDefault: formData.get("ncEsperadoDefault") || "Avanzado",
    umbralAntiguedadBaja: formData.get("umbralAntiguedadBaja") || "80",
    umbralAntiguedadAlta: formData.get("umbralAntiguedadAlta") || "95",
    anosUmbral: formData.get("anosUmbral") ? Number(formData.get("anosUmbral")) : 3,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const result = await db.insert(plantillasEvaluacion).values(parsed.data).returning({ id: plantillasEvaluacion.id });
  revalidatePath("/admin/plantillas");
  return { success: true, id: result[0].id };
}

export async function updatePlantilla(id: number, formData: FormData) {
  const parsed = plantillaSchema.safeParse({
    nombre: formData.get("nombre"),
    descripcion: formData.get("descripcion") || undefined,
    colectivoId: formData.get("colectivoId") ? Number(formData.get("colectivoId")) : null,
    ncEsperadoDefault: formData.get("ncEsperadoDefault") || "Avanzado",
    umbralAntiguedadBaja: formData.get("umbralAntiguedadBaja") || "80",
    umbralAntiguedadAlta: formData.get("umbralAntiguedadAlta") || "95",
    anosUmbral: formData.get("anosUmbral") ? Number(formData.get("anosUmbral")) : 3,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await db
    .update(plantillasEvaluacion)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(plantillasEvaluacion.id, id));
  revalidatePath("/admin/plantillas");
  return { success: true };
}

export async function togglePlantillaActiva(id: number, activa: boolean) {
  await db
    .update(plantillasEvaluacion)
    .set({ activa, updatedAt: new Date() })
    .where(eq(plantillasEvaluacion.id, id));
  revalidatePath("/admin/plantillas");
}

// --- Niveles ---

export async function createNivel(data: { plantillaId: number; nombre: string; codigo: string; orden: number }) {
  await db.insert(niveles).values(data);
  revalidatePath(`/admin/plantillas/${data.plantillaId}`);
}

export async function updateNivel(id: number, data: { nombre?: string; codigo?: string; orden?: number }) {
  await db.update(niveles).set({ ...data, updatedAt: new Date() }).where(eq(niveles.id, id));
  revalidatePath("/admin/plantillas");
}

export async function deleteNivel(id: number) {
  await db.delete(niveles).where(eq(niveles.id, id));
  revalidatePath("/admin/plantillas");
}

// --- Pilares ---

export async function createPilar(data: { plantillaId: number; nombre: string; orden: number }) {
  await db.insert(pilares).values(data);
  revalidatePath(`/admin/plantillas/${data.plantillaId}`);
}

export async function updatePilar(id: number, data: { nombre?: string; orden?: number }) {
  await db.update(pilares).set({ ...data, updatedAt: new Date() }).where(eq(pilares.id, id));
  revalidatePath("/admin/plantillas");
}

export async function deletePilar(id: number) {
  await db.delete(pilares).where(eq(pilares.id, id));
  revalidatePath("/admin/plantillas");
}

// --- Items ---

export async function createItem(data: {
  pilarId: number;
  nivelId: number;
  texto: string;
  tipoCriterio: "subjetivo" | "objetivo";
  expectativa?: string;
}) {
  // Auto-calcular orden como MAX(orden)+1 del mismo pilar+nivel
  const maxResult = await db
    .select({ maxOrden: sql<number>`coalesce(max(${itemsEvaluacion.orden}), 0)` })
    .from(itemsEvaluacion)
    .where(
      and(
        eq(itemsEvaluacion.pilarId, data.pilarId),
        eq(itemsEvaluacion.nivelId, data.nivelId),
        eq(itemsEvaluacion.active, true)
      )
    );
  const orden = (maxResult[0]?.maxOrden ?? 0) + 1;

  await db.insert(itemsEvaluacion).values({ ...data, orden });
  revalidatePath("/admin/plantillas");
}

export async function updateItem(
  id: number,
  data: { texto?: string; tipoCriterio?: "subjetivo" | "objetivo"; expectativa?: string }
) {
  await db.update(itemsEvaluacion).set({ ...data, updatedAt: new Date() }).where(eq(itemsEvaluacion.id, id));
  revalidatePath("/admin/plantillas");
}

export async function deleteItem(id: number) {
  await db.update(itemsEvaluacion).set({ active: false, updatedAt: new Date() }).where(eq(itemsEvaluacion.id, id));
  revalidatePath("/admin/plantillas");
}

export async function reorderItems(itemIds: number[]) {
  for (let i = 0; i < itemIds.length; i++) {
    await db
      .update(itemsEvaluacion)
      .set({ orden: i + 1, updatedAt: new Date() })
      .where(eq(itemsEvaluacion.id, itemIds[i]));
  }
  revalidatePath("/admin/plantillas");
}
