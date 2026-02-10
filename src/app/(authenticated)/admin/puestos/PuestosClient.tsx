"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createPuesto,
  updatePuesto,
  togglePuestoActive,
} from "@/app/actions/puestos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Puesto = {
  id: number;
  codigo: string | null;
  nombre: string;
  areaId: number | null;
  perfilSyp: string | null;
  subperfilSyp: string | null;
  agrupacionComp: string | null;
  ambito: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function PuestoForm({
  defaultValues,
  onSubmit,
  onClose,
}: {
  defaultValues?: Partial<Puesto>;
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: unknown }>;
  onClose: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        const result = await onSubmit(formData);
        if (result?.success) {
          toast.success(
            defaultValues ? "Puesto actualizado correctamente" : "Puesto creado correctamente"
          );
          onClose();
        } else if (result?.error) {
          toast.error("Error al guardar el puesto");
        }
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código</Label>
          <Input
            id="codigo"
            name="codigo"
            defaultValue={defaultValues?.codigo ?? ""}
            placeholder="Código del puesto"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={defaultValues?.nombre ?? ""}
            placeholder="Nombre del puesto"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="perfilSyp">Perfil SyP</Label>
          <Input
            id="perfilSyp"
            name="perfilSyp"
            defaultValue={defaultValues?.perfilSyp ?? ""}
            placeholder="Perfil SyP"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subperfilSyp">Subperfil SyP</Label>
          <Input
            id="subperfilSyp"
            name="subperfilSyp"
            defaultValue={defaultValues?.subperfilSyp ?? ""}
            placeholder="Subperfil SyP"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agrupacionComp">Agrupación Competencias</Label>
          <Input
            id="agrupacionComp"
            name="agrupacionComp"
            defaultValue={defaultValues?.agrupacionComp ?? ""}
            placeholder="Agrupación de competencias"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ambito">Ámbito</Label>
          <Input
            id="ambito"
            name="ambito"
            defaultValue={defaultValues?.ambito ?? ""}
            placeholder="Ámbito"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Guardar</Button>
        </div>
      </div>
    </form>
  );
}

export function PuestosClient({ data }: { data: Puesto[] }) {
  const router = useRouter();

  const columns: ColumnDef<Puesto>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "perfilSyp",
      header: "Perfil SyP",
    },
    {
      accessorKey: "agrupacionComp",
      header: "Agrupación",
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
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const puesto = row.original;
        return (
          <div className="flex items-center gap-2">
            <CrudDialog title="Editar Puesto" mode="edit">
              {({ onClose }) => (
                <PuestoForm
                  defaultValues={puesto}
                  onSubmit={async (formData) => {
                    const result = await updatePuesto(puesto.id, formData);
                    if (result?.success) router.refresh();
                    return result;
                  }}
                  onClose={onClose}
                />
              )}
            </CrudDialog>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await togglePuestoActive(puesto.id, !puesto.active);
                toast.success(
                  puesto.active ? "Puesto desactivado" : "Puesto activado"
                );
                router.refresh();
              }}
            >
              {puesto.active ? "Desactivar" : "Activar"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CrudDialog title="Crear Puesto" mode="create">
          {({ onClose }) => (
            <PuestoForm
              onSubmit={async (formData) => {
                const result = await createPuesto(formData);
                if (result?.success) router.refresh();
                return result;
              }}
              onClose={onClose}
            />
          )}
        </CrudDialog>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="nombre"
        searchPlaceholder="Buscar por nombre..."
      />
    </div>
  );
}
