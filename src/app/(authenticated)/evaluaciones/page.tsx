import { getEvaluaciones } from "@/app/actions/evaluaciones";
import { getTrabajadoresActivos } from "@/app/actions/trabajadores";
import { getPlantillas } from "@/app/actions/plantillas";
import { getCurrentUser } from "@/lib/auth";
import { EvaluacionesClient } from "./EvaluacionesClient";
import { db } from "@/lib/db";
import { users, centros, areas } from "@/lib/db/schema";

export default async function EvaluacionesPage() {
  const currentUser = await getCurrentUser();
  const [evaluaciones, trabajadores, plantillas, evaluadores, centrosData, areasData] =
    await Promise.all([
      getEvaluaciones(),
      getTrabajadoresActivos(),
      getPlantillas(),
      db.select({ id: users.id, name: users.name }).from(users),
      db.select({ id: centros.id, nombre: centros.nombre }).from(centros),
      db.select({ id: areas.id, nombre: areas.nombre }).from(areas),
    ]);

  const trabajadoresMap = Object.fromEntries(
    trabajadores.map((t) => [t.id, `${t.apellidos}, ${t.nombre}`])
  );
  const trabajadoresCentro = Object.fromEntries(
    trabajadores.map((t) => [t.id, t.centroId])
  );
  const trabajadoresArea = Object.fromEntries(
    trabajadores.map((t) => [t.id, t.areaId])
  );
  const evaluadoresMap = Object.fromEntries(
    evaluadores.map((e) => [e.id, e.name])
  );
  const plantillasMap = Object.fromEntries(
    plantillas.map((p) => [p.id, p.nombre])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evaluaciones</h1>
        <p className="text-muted-foreground">
          Gestión y seguimiento de evaluaciones de competencias
        </p>
      </div>
      <EvaluacionesClient
        evaluaciones={evaluaciones}
        trabajadoresMap={trabajadoresMap}
        trabajadoresCentro={trabajadoresCentro}
        trabajadoresArea={trabajadoresArea}
        evaluadoresMap={evaluadoresMap}
        plantillasMap={plantillasMap}
        centros={centrosData}
        areas={areasData}
        evaluadores={evaluadores}
        userRole={currentUser?.role ?? "consulta"}
        currentUserId={currentUser?.id ?? ""}
      />
    </div>
  );
}
