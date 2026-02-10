import { getInformeGlobal } from "@/app/actions/informes";
import { InformeGlobalClient } from "./InformeGlobalClient";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export default async function InformeGlobalPage() {
  const currentUser = await getCurrentUser();
  const [data, evaluadores] = await Promise.all([
    getInformeGlobal(),
    db.select({ id: users.id, name: users.name }).from(users),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Informe Global</h1>
        <p className="text-muted-foreground">
          Resumen de competencias de todos los trabajadores evaluados
        </p>
      </div>
      <InformeGlobalClient
        data={data}
        evaluadores={evaluadores}
        currentUserId={currentUser?.id ?? ""}
      />
    </div>
  );
}
