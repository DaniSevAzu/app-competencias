"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createTipoAccion,
  updateTipoAccion,
  toggleTipoAccionActive,
} from "@/app/actions/tipos-accion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type TipoAccion = {
  id: number;
  nombre: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function TipoAccionForm({
  defaultValues,
  onClose,
}: {
  defaultValues?: TipoAccion;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const result = defaultValues
          ? await updateTipoAccion(defaultValues.id, formData)
          : await createTipoAccion(formData);
        if (result?.success) {
          toast.success(
            defaultValues ? "Tipo actualizado" : "Tipo creado"
          );
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
          <Input
            name="nombre"
            defaultValue={defaultValues?.nombre}
            required
            placeholder="ej: Mentoring"
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Guardar</Button>
        </div>
      </div>
    </form>
  );
}

export function TiposAccionClient({ data }: { data: TipoAccion[] }) {
  const router = useRouter();

  const columns: ColumnDef<TipoAccion>[] = [
    { accessorKey: "nombre", header: "Nombre" },
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
          <CrudDialog title="Editar Tipo de Acción" mode="edit">
            {({ onClose }) => (
              <TipoAccionForm
                defaultValues={row.original}
                onClose={onClose}
              />
            )}
          </CrudDialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await toggleTipoAccionActive(
                row.original.id,
                !row.original.active
              );
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
        <CrudDialog title="Nuevo Tipo de Acción">
          {({ onClose }) => <TipoAccionForm onClose={onClose} />}
        </CrudDialog>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="nombre"
        searchPlaceholder="Buscar tipo..."
      />
    </div>
  );
}
