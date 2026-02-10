import { getAnalisisPotencial } from "@/app/actions/informes";
import { AnalisisPotencialClient } from "./AnalisisPotencialClient";

export default async function AnalisisPotencialPage() {
  const data = await getAnalisisPotencial();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Análisis de Potencial
        </h1>
        <p className="text-muted-foreground">
          Distribución de NC Potencial por centro, área y colectivo
        </p>
      </div>
      <AnalisisPotencialClient data={data} />
    </div>
  );
}
