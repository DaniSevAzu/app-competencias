"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createArea,
  updateArea,
  toggleAreaActive,
} from "@/app/actions/areas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Area = {
  id: number;
  nombre: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function AreaForm({
  defaultValues,
  onSubmit,
  onClose,
}: {
  defaultValues?: Partial<Area>;
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: unknown }>;
  onClose: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        const result = await onSubmit(formData);
        if (result?.success) {
          toast.success(
            defaultValues ? "Área actualizada correctamente" : "Área creada correctamente"
          );
          onClose();
        } else if (result?.error) {
          toast.error("Error al guardar el área");
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
            placeholder="Nombre del área"
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

export function AreasClient({ data }: { data: Area[] }) {
  const router = useRouter();

  const columns: ColumnDef<Area>[] = [
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
        const area = row.original;
        return (
          <div className="flex items-center gap-2">
            <CrudDialog title="Editar Área" mode="edit">
              {({ onClose }) => (
                <AreaForm
                  defaultValues={area}
                  onSubmit={async (formData) => {
                    const result = await updateArea(area.id, formData);
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
                await toggleAreaActive(area.id, !area.active);
                toast.success(
                  area.active ? "Área desactivada" : "Área activada"
                );
                router.refresh();
              }}
            >
              {area.active ? "Desactivar" : "Activar"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CrudDialog title="Crear Área" mode="create">
          {({ onClose }) => (
            <AreaForm
              onSubmit={async (formData) => {
                const result = await createArea(formData);
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
