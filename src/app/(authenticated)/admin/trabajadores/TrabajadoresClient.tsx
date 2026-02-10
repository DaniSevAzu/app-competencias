"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createTrabajador,
  updateTrabajador,
  toggleTrabajadorActive,
} from "@/app/actions/trabajadores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Lookup = { id: number; nombre: string };

type Trabajador = {
  id: string;
  nombre: string;
  apellidos: string;
  email: string | null;
  externalId: string | null;
  puestoId: number | null;
  areaId: number | null;
  centroId: number | null;
  uapId: number | null;
  colectivoId: number | null;
  fechaIncorporacionPuesto: string;
  active: boolean;
};

interface Props {
  data: Trabajador[];
  centros: Lookup[];
  areas: Lookup[];
  puestos: { id: number; nombre: string; codigo: string | null }[];
  colectivos: Lookup[];
  uaps: { id: number; codigo: string; nombre: string | null; centroId: number }[];
}

function TrabajadorForm({
  defaultValues,
  centros,
  areas,
  puestos,
  colectivos,
  uaps,
  onClose,
}: {
  defaultValues?: Trabajador;
  centros: Lookup[];
  areas: Lookup[];
  puestos: { id: number; nombre: string; codigo: string | null }[];
  colectivos: Lookup[];
  uaps: { id: number; codigo: string; nombre: string | null; centroId: number }[];
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const result = defaultValues
          ? await updateTrabajador(defaultValues.id, formData)
          : await createTrabajador(formData);
        if (result?.success) {
          toast.success(defaultValues ? "Trabajador actualizado" : "Trabajador creado");
          router.refresh();
          onClose();
        } else if (result?.error) {
          toast.error("Error de validación");
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input name="nombre" defaultValue={defaultValues?.nombre} required />
        </div>
        <div>
          <Label htmlFor="apellidos">Apellidos *</Label>
          <Input name="apellidos" defaultValue={defaultValues?.apellidos} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        </div>
        <div>
          <Label htmlFor="externalId">ID Externo</Label>
          <Input name="externalId" defaultValue={defaultValues?.externalId ?? ""} />
        </div>
        <div>
          <Label htmlFor="centroId">Centro</Label>
          <select name="centroId" defaultValue={defaultValues?.centroId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">-- Seleccionar --</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="areaId">Área</Label>
          <select name="areaId" defaultValue={defaultValues?.areaId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">-- Seleccionar --</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="puestoId">Puesto</Label>
          <select name="puestoId" defaultValue={defaultValues?.puestoId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">-- Seleccionar --</option>
            {puestos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="colectivoId">Colectivo</Label>
          <select name="colectivoId" defaultValue={defaultValues?.colectivoId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">-- Seleccionar --</option>
            {colectivos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="uapId">UAP</Label>
          <select name="uapId" defaultValue={defaultValues?.uapId ?? ""} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
            <option value="">-- Seleccionar --</option>
            {uaps.map((u) => (
              <option key={u.id} value={u.id}>{u.codigo}{u.nombre ? ` - ${u.nombre}` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="fechaIncorporacionPuesto">Fecha incorporación puesto *</Label>
          <Input name="fechaIncorporacionPuesto" type="date" defaultValue={defaultValues?.fechaIncorporacionPuesto} required />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}

export function TrabajadoresClient({ data, centros, areas, puestos, colectivos, uaps }: Props) {
  const router = useRouter();

  const centroMap = Object.fromEntries(centros.map((c) => [c.id, c.nombre]));
  const areaMap = Object.fromEntries(areas.map((a) => [a.id, a.nombre]));
  const puestoMap = Object.fromEntries(puestos.map((p) => [p.id, p.nombre]));
  const colectivoMap = Object.fromEntries(colectivos.map((c) => [c.id, c.nombre]));

  const columns: ColumnDef<Trabajador>[] = [
    {
      accessorFn: (row) => `${row.apellidos}, ${row.nombre}`,
      id: "nombreCompleto",
      header: "Nombre",
    },
    {
      accessorKey: "centroId",
      header: "Centro",
      cell: ({ row }) => centroMap[row.original.centroId ?? 0] ?? "-",
    },
    {
      accessorKey: "areaId",
      header: "Área",
      cell: ({ row }) => areaMap[row.original.areaId ?? 0] ?? "-",
    },
    {
      accessorKey: "puestoId",
      header: "Puesto",
      cell: ({ row }) => puestoMap[row.original.puestoId ?? 0] ?? "-",
    },
    {
      accessorKey: "colectivoId",
      header: "Colectivo",
      cell: ({ row }) => colectivoMap[row.original.colectivoId ?? 0] ?? "-",
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
          <CrudDialog title="Editar Trabajador" mode="edit">
            {({ onClose }) => (
              <TrabajadorForm
                defaultValues={row.original}
                centros={centros}
                areas={areas}
                puestos={puestos}
                colectivos={colectivos}
                uaps={uaps}
                onClose={onClose}
              />
            )}
          </CrudDialog>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await toggleTrabajadorActive(row.original.id, !row.original.active);
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
        <CrudDialog title="Nuevo Trabajador">
          {({ onClose }) => (
            <TrabajadorForm
              centros={centros}
              areas={areas}
              puestos={puestos}
              colectivos={colectivos}
              uaps={uaps}
              onClose={onClose}
            />
          )}
        </CrudDialog>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="nombreCompleto"
        searchPlaceholder="Buscar por nombre..."
      />
    </div>
  );
}
