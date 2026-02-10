import { getTrabajadores } from "@/app/actions/trabajadores";
import { getCentrosActivos } from "@/app/actions/centros";
import { getAreasActivas } from "@/app/actions/areas";
import { getPuestosActivos } from "@/app/actions/puestos";
import { getColectivosActivos } from "@/app/actions/colectivos";
import { getUapsActivas } from "@/app/actions/uaps";
import { TrabajadoresClient } from "./TrabajadoresClient";

export default async function TrabajadoresPage() {
  const [trabajadores, centros, areas, puestos, colectivos, uaps] =
    await Promise.all([
      getTrabajadores(),
      getCentrosActivos(),
      getAreasActivas(),
      getPuestosActivos(),
      getColectivosActivos(),
      getUapsActivas(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trabajadores</h1>
        <p className="text-muted-foreground">Gestión de trabajadores</p>
      </div>
      <TrabajadoresClient
        data={trabajadores}
        centros={centros}
        areas={areas}
        puestos={puestos}
        colectivos={colectivos}
        uaps={uaps}
      />
    </div>
  );
}
