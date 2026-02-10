import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function seedUsers() {
  console.log("Creando usuarios de demo...");

  const passwordHash = await bcrypt.hash("demo1234", 10);

  await db
    .insert(users)
    .values([
      {
        email: "admin@demo.com",
        name: "Admin Demo",
        passwordHash,
        role: "admin",
      },
      {
        email: "evaluador@demo.com",
        name: "Eva García",
        passwordHash,
        role: "evaluador",
      },
      {
        email: "consulta@demo.com",
        name: "Carlos López",
        passwordHash,
        role: "consulta",
      },
    ])
    .onConflictDoNothing();

  console.log("Usuarios de demo creados.");
  process.exit(0);
}

seedUsers().catch((e) => {
  console.error(e);
  process.exit(1);
});
