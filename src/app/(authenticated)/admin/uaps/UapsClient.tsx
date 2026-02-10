"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { createUap, updateUap, toggleUapActive } from "@/app/actions/uaps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Centro = { id: number; codigo: string; nombre: string };

type Uap = {
  id: number;
  codigo: string;
  nombre: string | null;
  centroId: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function UapForm({
  defaultValues,
  centros,
  onClose,
}: {
  defaultValues?: Uap;
  centros: Centro[];
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const result = defaultValues
          ? await updateUap(defaultValues.id, formData)
          : await createUap(formData);
        if (result?.success) {
          toast.success(defaultValues ? "UAP actualizada" : "UAP creada");
          router.refresh();
          onClose();
        } else {
          toast.error("Error de validación");
        }
      }}
    >
      <div className="space-y-4">
        <div>
          <Label>Código *</Label>
          <Input name="codigo" defaultValue={defaultValues?.codigo} required />
        </div>
        <div>
          <Label>Nombre</Label>
          <Input name="nombre" defaultValue={defaultValues?.nombre ?? ""} />
        </div>
        <div>
          <Label>Centro *</Label>
          <select
            name="centroId"
            defaultValue={defaultValues?.centroId ?? ""}
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">-- Seleccionar --</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Guardar</Button>
        </div>
      </div>
    </form>
  );
}

export function UapsClient({
  data,
  centros,
}: {
  data: Uap[];
  centros: Centro[];
}) {
  const router = useRouter();
  const centroMap = Object.fromEntries(centros.map((c) => [c.id, c.nombre]));

  const columns: ColumnDef<Uap>[] = [
    { accessorKey: "codigo", header: "Código" },
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => row.original.nombre || "-",
    },
    {
      accessorKey: "centroId",
      header: "Centro",
      cell: ({ row }) => centroMap[row.original.centroId] ?? "-",
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
          <CrudDialog title="Editar UAP" mode="edit">
            {({ onClose }) => (
              <UapForm
                defaultValues={row.original}
                centros={centros}
                onClose={onClose}
              />
            )}
          </CrudDialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await toggleUapActive(row.original.id, !row.original.active);
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
        <CrudDialog title="Nueva UAP">
          {({ onClose }) => (
            <UapForm centros={centros} onClose={onClose} />
          )}
        </CrudDialog>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="codigo"
        searchPlaceholder="Buscar por código..."
      />
    </div>
  );
}
