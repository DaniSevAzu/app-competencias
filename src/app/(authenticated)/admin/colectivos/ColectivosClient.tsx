"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createColectivo,
  updateColectivo,
  toggleColectivoActive,
} from "@/app/actions/colectivos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Colectivo = {
  id: number;
  nombre: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function ColectivoForm({
  defaultValues,
  onSubmit,
  onClose,
}: {
  defaultValues?: Partial<Colectivo>;
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: unknown }>;
  onClose: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        const result = await onSubmit(formData);
        if (result?.success) {
          toast.success(
            defaultValues ? "Colectivo actualizado correctamente" : "Colectivo creado correctamente"
          );
          onClose();
        } else if (result?.error) {
          toast.error("Error al guardar el colectivo");
        }
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={defaultValues?.nombre ?? ""}
            placeholder="Nombre del colectivo"
            required
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Guardar</Button>
        </div>
      </div>
    </form>
  );
}

export function ColectivosClient({ data }: { data: Colectivo[] }) {
  const router = useRouter();

  const columns: ColumnDef<Colectivo>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
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
        const colectivo = row.original;
        return (
          <div className="flex items-center gap-2">
            <CrudDialog title="Editar Colectivo" mode="edit">
              {({ onClose }) => (
                <ColectivoForm
                  defaultValues={colectivo}
                  onSubmit={async (formData) => {
                    const result = await updateColectivo(colectivo.id, formData);
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
                await toggleColectivoActive(colectivo.id, !colectivo.active);
                toast.success(
                  colectivo.active ? "Colectivo desactivado" : "Colectivo activado"
                );
                router.refresh();
              }}
            >
              {colectivo.active ? "Desactivar" : "Activar"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CrudDialog title="Crear Colectivo" mode="create">
          {({ onClose }) => (
            <ColectivoForm
              onSubmit={async (formData) => {
                const result = await createColectivo(formData);
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
