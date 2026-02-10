import { getEvaluacionCompleta } from "@/app/actions/evaluaciones";
import { getTiposAccionActivos } from "@/app/actions/tipos-accion";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { EvaluacionFormClient } from "./EvaluacionFormClient";

export default async function EvaluacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/evaluaciones");

  const [data, tiposAccion] = await Promise.all([
    getEvaluacionCompleta(id),
    getTiposAccionActivos(),
  ]);

  if (!data) notFound();

  const { evaluacion } = data;

  // Si ya está completada/validada, redirigir a vista
  if (evaluacion.estado === "completada" || evaluacion.estado === "validada") {
    redirect(`/evaluaciones/${id}/ver`);
  }

  // Solo admin o evaluador pueden editar
  if (currentUser.role !== "admin" && currentUser.role !== "evaluador") {
    redirect(`/evaluaciones/${id}/ver`);
  }

  return (
    <EvaluacionFormClient
      evaluacion={data.evaluacion}
      plantilla={data.plantilla}
      trabajador={data.trabajador}
      niveles={data.niveles}
      pilares={data.pilares}
      items={data.items}
      respuestas={data.respuestas}
      resultados={data.resultados}
      planes={data.planes}
      tiposAccion={tiposAccion}
    />
  );
}
