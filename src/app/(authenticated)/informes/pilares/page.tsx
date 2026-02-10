import { getAnalisisPilares } from "@/app/actions/informes";
import { AnalisisPilaresClient } from "./AnalisisPilaresClient";

export default async function AnalisisPilaresPage() {
  const data = await getAnalisisPilares();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Análisis por Pilares
        </h1>
        <p className="text-muted-foreground">
          Distribución de trabajadores por nivel en cada pilar
        </p>
      </div>
      <AnalisisPilaresClient data={data} />
    </div>
  );
}
