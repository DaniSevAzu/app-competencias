import { getNineboxConfig } from "@/app/actions/ninebox";
import { NineboxConfigClient } from "./NineboxConfigClient";

export default async function ConfiguracionNineBoxPage() {
  const config = await getNineboxConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Configuración 9-Box
        </h1>
        <p className="text-muted-foreground">
          Editar etiquetas y recomendaciones de la matriz 9-Box
        </p>
      </div>
      <NineboxConfigClient data={config} />
    </div>
  );
}
