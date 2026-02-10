import { getEvolucionTrabajador } from "@/app/actions/informes";
import { notFound } from "next/navigation";
import { EvolucionClient } from "./EvolucionClient";

export default async function EvolucionTrabajadorPage({
  params,
}: {
  params: Promise<{ trabajadorId: string }>;
}) {
  const { trabajadorId } = await params;
  const data = await getEvolucionTrabajador(trabajadorId);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Evolución: {data.trabajador.apellidos}, {data.trabajador.nombre}
        </h1>
        <p className="text-muted-foreground">
          Evolución temporal de niveles de competencia
        </p>
      </div>
      <EvolucionClient data={data} />
    </div>
  );
}
