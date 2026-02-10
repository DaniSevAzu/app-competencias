import { getPuestos } from "@/app/actions/puestos";
import { PuestosClient } from "./PuestosClient";

export default async function PuestosPage() {
  const puestos = await getPuestos();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Puestos</h1>
        <p className="text-muted-foreground">Gestión de puestos de trabajo</p>
      </div>
      <PuestosClient data={puestos} />
    </div>
  );
}
