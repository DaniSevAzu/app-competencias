import { getTiposAccion } from "@/app/actions/tipos-accion";
import { TiposAccionClient } from "./TiposAccionClient";

export default async function TiposAccionPage() {
  const tipos = await getTiposAccion();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tipos de Plan de Acción
        </h1>
        <p className="text-muted-foreground">
          Gestión de tipos de acción (Mentoring, Tutelaje, etc.)
        </p>
      </div>
      <TiposAccionClient data={tipos} />
    </div>
  );
}
