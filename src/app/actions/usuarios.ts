"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(1, "El nombre es obligatorio"),
  role: z.enum(["admin", "evaluador", "consulta"]),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
});

export async function getUsuarios() {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.name);
}

export async function createUsuario(formData: FormData) {
  const parsed = userSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 10)
    : null;

  await db.insert(users).values({
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    passwordHash,
  });
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function updateUsuario(id: string, formData: FormData) {
  const parsed = userSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    password: formData.get("password") || "",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const updateData: Record<string, unknown> = {
    email: parsed.data.email,
    name: parsed.data.name,
    role: parsed.data.role,
    updatedAt: new Date(),
  };

  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  await db.update(users).set(updateData).where(eq(users.id, id));
  revalidatePath("/admin/usuarios");
  return { success: true };
}

export async function toggleUsuarioActive(id: string, active: boolean) {
  await db.update(users).set({ active, updatedAt: new Date() }).where(eq(users.id, id));
  revalidatePath("/admin/usuarios");
}
