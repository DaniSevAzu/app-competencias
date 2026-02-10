"use server";

import { db } from "@/lib/db";
import { nineboxConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNineboxConfig() {
  return db.select().from(nineboxConfig).orderBy(nineboxConfig.id);
}

export async function updateNineboxCell(
  id: number,
  data: { etiqueta: string; recomendacion: string; color?: string }
) {
  await db
    .update(nineboxConfig)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(nineboxConfig.id, id));
  revalidatePath("/admin/ninebox");
  return { success: true };
}
