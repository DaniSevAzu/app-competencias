import { getEvaluacionCompleta } from "@/app/actions/evaluaciones";
import { notFound } from "next/navigation";
import { VerEvaluacionClient } from "./VerEvaluacionClient";

export default async function VerEvaluacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEvaluacionCompleta(id);
  if (!data) notFound();

  return (
    <VerEvaluacionClient
      evaluacion={data.evaluacion}
      plantilla={data.plantilla}
      trabajador={data.trabajador}
      niveles={data.niveles}
      pilares={data.pilares}
      items={data.items}
      respuestas={data.respuestas}
      resultados={data.resultados}
      planes={data.planes}
    />
  );
}
