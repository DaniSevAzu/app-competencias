import { getPlantillaCompleta } from "@/app/actions/plantillas";
import { notFound } from "next/navigation";
import { PlantillaEditorClient } from "./PlantillaEditorClient";

export default async function PlantillaEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plantilla = await getPlantillaCompleta(Number(id));

  if (!plantilla) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {plantilla.nombre}
        </h1>
        <p className="text-muted-foreground">
          Editor de plantilla de evaluación
        </p>
      </div>
      <PlantillaEditorClient plantilla={plantilla} />
    </div>
  );
}
