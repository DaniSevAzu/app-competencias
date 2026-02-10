import { getNineboxData } from "@/app/actions/informes";
import { NineBoxClient } from "./NineBoxClient";

export default async function NineBoxPage() {
  const data = await getNineboxData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">9-Box Grid</h1>
        <p className="text-muted-foreground">
          Matriz de potencial vs desempeño
        </p>
      </div>
      <NineBoxClient data={data} />
    </div>
  );
}
