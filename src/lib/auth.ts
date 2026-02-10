import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "admin" | "evaluador" | "consulta";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Autenticación provisional para desarrollo y demo.
 * En Hito 2 se reemplazará por validación de token del launchpad.
 *
 * Por defecto devuelve el primer usuario admin activo de la BD.
 * Se puede forzar un usuario específico con la variable DEMO_USER_EMAIL.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const demoEmail = process.env.DEMO_USER_EMAIL;

    let user;
    if (demoEmail) {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, demoEmail))
        .limit(1);
      user = result[0];
    } else {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.active, true))
        .limit(1);
      user = result[0];
    }

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica que el usuario tiene uno de los roles permitidos.
 */
export function hasRole(user: SessionUser, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role);
}
