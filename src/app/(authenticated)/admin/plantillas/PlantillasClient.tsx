"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createPlantilla,
  togglePlantillaActiva,
} from "@/app/actions/plantillas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";

type Plantilla = {
  id: number;
  nombre: string;
  descripcion: string | null;
  colectivoId: number | null;
  ncEsperadoDefault: string | null;
  activa: boolean;
  version: number | null;
};

type Colectivo = { id: number; nombre: string };

function PlantillaForm({
  colectivos,
  onClose,
}: {
  colectivos: Colectivo[];
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const result = await createPlantilla(formData);
        if (result?.success) {
          toast.success("Plantilla creada");
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
          <Input name="nombre" required />
        </div>
        <div>
          <Label>Descripción</Label>
          <Input name="descripcion" />
        </div>
        <div>
          <Label>Colectivo</Label>
          <select
            name="colectivoId"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">-- Todos --</option>
            {colectivos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>NC Esperado por defecto</Label>
            <Input name="ncEsperadoDefault" defaultValue="Avanzado" />
          </div>
          <div>
            <Label>Años umbral antigüedad</Label>
            <Input name="anosUmbral" type="number" defaultValue="3" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Umbral baja antigüedad (%)</Label>
            <Input
              name="umbralAntiguedadBaja"
              type="number"
              defaultValue="80"
            />
          </div>
          <div>
            <Label>Umbral alta antigüedad (%)</Label>
            <Input
              name="umbralAntiguedadAlta"
              type="number"
              defaultValue="95"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Crear Plantilla</Button>
        </div>
      </div>
    </form>
  );
}

export function PlantillasClient({
  data,
  colectivos,
}: {
  data: Plantilla[];
  colectivos: Colectivo[];
}) {
  const router = useRouter();
  const colectivoMap = Object.fromEntries(
    colectivos.map((c) => [c.id, c.nombre])
  );

  const columns: ColumnDef<Plantilla>[] = [
    { accessorKey: "nombre", header: "Nombre" },
    {
      accessorKey: "colectivoId",
      header: "Colectivo",
      cell: ({ row }) =>
        colectivoMap[row.original.colectivoId ?? 0] ?? "Todos",
    },
    {
      accessorKey: "ncEsperadoDefault",
      header: "NC Esperado",
    },
    {
      accessorKey: "version",
      header: "Versión",
    },
    {
      accessorKey: "activa",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.activa ? "default" : "secondary"}>
          {row.original.activa ? "Activa" : "Inactiva"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/plantillas/${row.original.id}`}>
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await togglePlantillaActiva(
                row.original.id,
                !row.original.activa
              );
              router.refresh();
            }}
          >
            {row.original.activa ? "Desactivar" : "Activar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CrudDialog title="Nueva Plantilla">
          {({ onClose }) => (
            <PlantillaForm colectivos={colectivos} onClose={onClose} />
          )}
        </CrudDialog>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="nombre"
        searchPlaceholder="Buscar plantilla..."
      />
    </div>
  );
}
