import { getUsuarios } from "@/app/actions/usuarios";
import { UsuariosClient } from "./UsuariosClient";

export default async function UsuariosPage() {
  const usuarios = await getUsuarios();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
      </div>
      <UsuariosClient data={usuarios} />
    </div>
  );
}
