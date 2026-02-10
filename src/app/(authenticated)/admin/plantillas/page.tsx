import { getPlantillas } from "@/app/actions/plantillas";
import { getColectivosActivos } from "@/app/actions/colectivos";
import { PlantillasClient } from "./PlantillasClient";

export default async function PlantillasPage() {
  const [plantillas, colectivos] = await Promise.all([
    getPlantillas(),
    getColectivosActivos(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Plantillas de Evaluación
        </h1>
        <p className="text-muted-foreground">
          Configuración de plantillas de evaluación
        </p>
      </div>
      <PlantillasClient data={plantillas} colectivos={colectivos} />
    </div>
  );
}
