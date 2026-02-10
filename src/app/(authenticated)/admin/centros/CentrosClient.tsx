"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createCentro,
  updateCentro,
  toggleCentroActive,
} from "@/app/actions/centros";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Centro = {
  id: number;
  codigo: string;
  nombre: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function CentroForm({
  defaultValues,
  onSubmit,
  onClose,
}: {
  defaultValues?: Partial<Centro>;
  onSubmit: (formData: FormData) => Promise<{ success?: boolean; error?: unknown }>;
  onClose: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        const result = await onSubmit(formData);
        if (result?.success) {
          toast.success(
            defaultValues ? "Centro actualizado correctamente" : "Centro creado correctamente"
          );
          onClose();
        } else if (result?.error) {
          toast.error("Error al guardar el centro");
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
            placeholder="Código del centro"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            name="nombre"
            defaultValue={defaultValues?.nombre ?? ""}
            placeholder="Nombre del centro"
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

export function CentrosClient({ data }: { data: Centro[] }) {
  const router = useRouter();

  const columns: ColumnDef<Centro>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
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
        const centro = row.original;
        return (
          <div className="flex items-center gap-2">
            <CrudDialog title="Editar Centro" mode="edit">
              {({ onClose }) => (
                <CentroForm
                  defaultValues={centro}
                  onSubmit={async (formData) => {
                    const result = await updateCentro(centro.id, formData);
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
                await toggleCentroActive(centro.id, !centro.active);
                toast.success(
                  centro.active ? "Centro desactivado" : "Centro activado"
                );
                router.refresh();
              }}
            >
              {centro.active ? "Desactivar" : "Activar"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CrudDialog title="Crear Centro" mode="create">
          {({ onClose }) => (
            <CentroForm
              onSubmit={async (formData) => {
                const result = await createCentro(formData);
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
