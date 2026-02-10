import { getColectivos } from "@/app/actions/colectivos";
import { ColectivosClient } from "./ColectivosClient";

export default async function ColectivosPage() {
  const colectivos = await getColectivos();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Colectivos</h1>
        <p className="text-muted-foreground">Gestión de colectivos</p>
      </div>
      <ColectivosClient data={colectivos} />
    </div>
  );
}
