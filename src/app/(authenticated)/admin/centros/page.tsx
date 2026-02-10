import { getCentros } from "@/app/actions/centros";
import { CentrosClient } from "./CentrosClient";

export default async function CentrosPage() {
  const centros = await getCentros();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Centros de Trabajo</h1>
        <p className="text-muted-foreground">Gestión de centros de trabajo</p>
      </div>
      <CentrosClient data={centros} />
    </div>
  );
}
