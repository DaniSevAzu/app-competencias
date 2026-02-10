import { getAreas } from "@/app/actions/areas";
import { AreasClient } from "./AreasClient";

export default async function AreasPage() {
  const areas = await getAreas();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Áreas</h1>
        <p className="text-muted-foreground">Gestión de áreas y departamentos</p>
      </div>
      <AreasClient data={areas} />
    </div>
  );
}
