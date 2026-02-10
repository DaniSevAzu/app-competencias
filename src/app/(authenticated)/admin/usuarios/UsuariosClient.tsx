"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createUsuario,
  updateUsuario,
  toggleUsuarioActive,
} from "@/app/actions/usuarios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Usuario = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "evaluador" | "consulta";
  active: boolean;
  createdAt: Date;
};

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  evaluador: "Evaluador",
  consulta: "Consulta",
};

const roleBadgeVariant: Record<string, "destructive" | "default" | "secondary"> = {
  admin: "destructive",
  evaluador: "default",
  consulta: "secondary",
};

function UsuarioForm({
  defaultValues,
  onClose,
}: {
  defaultValues?: Usuario;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const result = defaultValues
          ? await updateUsuario(defaultValues.id, formData)
          : await createUsuario(formData);
        if (result?.success) {
          toast.success(defaultValues ? "Usuario actualizado" : "Usuario creado");
          router.refresh();
          onClose();
        } else {
          toast.error("Error de validación");
        }
      }}
    >
      <div className="space-y-4">
        <div>
          <Label>Nombre *</Label>
          <Input name="name" defaultValue={defaultValues?.name} required />
        </div>
        <div>
          <Label>Email *</Label>
          <Input name="email" type="email" defaultValue={defaultValues?.email} required />
        </div>
        <div>
          <Label>Rol *</Label>
          <select
            name="role"
            defaultValue={defaultValues?.role ?? "evaluador"}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="admin">Administrador</option>
            <option value="evaluador">Evaluador</option>
            <option value="consulta">Consulta</option>
          </select>
        </div>
        <div>
          <Label>Contraseña {!defaultValues && "*"}</Label>
          <Input
            name="password"
            type="password"
            placeholder={defaultValues ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Guardar</Button>
        </div>
      </div>
    </form>
  );
}

export function UsuariosClient({ data }: { data: Usuario[] }) {
  const router = useRouter();

  const columns: ColumnDef<Usuario>[] = [
    { accessorKey: "name", header: "Nombre" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => (
        <Badge variant={roleBadgeVariant[row.original.role]}>
          {roleLabels[row.original.role]}
        </Badge>
      ),
    },
    {
      accessorKey: "active",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.active ? "default" : "secondary"}>
          {row.original.active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <CrudDialog title="Editar Usuario" mode="edit">
            {({ onClose }) => (
              <UsuarioForm defaultValues={row.original} onClose={onClose} />
            )}
          </CrudDialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await toggleUsuarioActive(row.original.id, !row.original.active);
              router.refresh();
            }}
          >
            {row.original.active ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CrudDialog title="Nuevo Usuario">
          {({ onClose }) => <UsuarioForm onClose={onClose} />}
        </CrudDialog>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="name"
        searchPlaceholder="Buscar por nombre..."
      />
    </div>
  );
}
