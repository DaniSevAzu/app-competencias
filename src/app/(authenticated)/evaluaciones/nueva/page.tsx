import { getTrabajadoresActivos } from "@/app/actions/trabajadores";
import { getPlantillas } from "@/app/actions/plantillas";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NuevaEvaluacionClient } from "./NuevaEvaluacionClient";
import { db } from "@/lib/db";
import { colectivos } from "@/lib/db/schema";

export default async function NuevaEvaluacionPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "evaluador")) {
    redirect("/evaluaciones");
  }

  const [trabajadores, plantillas, colectivosData] = await Promise.all([
    getTrabajadoresActivos(),
    getPlantillas(),
    db.select({ id: colectivos.id, nombre: colectivos.nombre }).from(colectivos),
  ]);

  const plantillasActivas = plantillas.filter((p) => p.activa);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Evaluación</h1>
        <p className="text-muted-foreground">
          Selecciona un trabajador para iniciar una nueva evaluación
        </p>
      </div>
      <NuevaEvaluacionClient
        trabajadores={trabajadores}
        plantillas={plantillasActivas}
        colectivos={colectivosData}
        evaluadorId={currentUser.id}
      />
    </div>
  );
}
