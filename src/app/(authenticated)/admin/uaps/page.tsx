import { getUaps } from "@/app/actions/uaps";
import { getCentrosActivos } from "@/app/actions/centros";
import { UapsClient } from "./UapsClient";

export default async function UapsPage() {
  const [uaps, centros] = await Promise.all([getUaps(), getCentrosActivos()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">UAPs</h1>
        <p className="text-muted-foreground">Gestión de Unidades de Actividad Preventiva</p>
      </div>
      <UapsClient data={uaps} centros={centros} />
    </div>
  );
}
