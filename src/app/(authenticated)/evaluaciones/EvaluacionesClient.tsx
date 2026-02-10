"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { eliminarEvaluacion } from "@/app/actions/evaluaciones";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type Evaluacion = {
  id: string;
  trabajadorId: string;
  evaluadorId: string;
  plantillaId: number;
  fechaEvaluacion: string;
  estado: string;
  ncPotencialGlobal: string | null;
  statusGlobalPct: string | null;
};

interface Props {
  evaluaciones: Evaluacion[];
  trabajadoresMap: Record<string, string>;
  trabajadoresCentro: Record<string, number | null>;
  trabajadoresArea: Record<string, number | null>;
  evaluadoresMap: Record<string, string>;
  plantillasMap: Record<number, string>;
  centros: { id: number; nombre: string }[];
  areas: { id: number; nombre: string }[];
  evaluadores: { id: string; name: string }[];
  userRole: string;
  currentUserId: string;
}

const estadoBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  borrador: "secondary",
  en_curso: "outline",
  completada: "default",
  validada: "default",
};

const estadoLabel: Record<string, string> = {
  borrador: "Borrador",
  en_curso: "En curso",
  completada: "Completada",
  validada: "Validada",
};

export function EvaluacionesClient({
  evaluaciones,
  trabajadoresMap,
  trabajadoresCentro,
  trabajadoresArea,
  evaluadoresMap,
  plantillasMap,
  centros,
  areas,
  evaluadores,
  userRole,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroCentro, setFiltroCentro] = useState<string>("todos");
  const [filtroArea, setFiltroArea] = useState<string>("todos");
  const [filtroEvaluador, setFiltroEvaluador] = useState<string>(currentUserId);

  const filteredData = evaluaciones.filter((ev) => {
    if (filtroEstado !== "todos" && ev.estado !== filtroEstado) return false;
    if (filtroEvaluador !== "todos" && ev.evaluadorId !== filtroEvaluador) return false;
    if (filtroCentro !== "todos") {
      const centro = trabajadoresCentro[ev.trabajadorId];
      if (String(centro) !== filtroCentro) return false;
    }
    if (filtroArea !== "todos") {
      const area = trabajadoresArea[ev.trabajadorId];
      if (String(area) !== filtroArea) return false;
    }
    return true;
  });

  const columns: ColumnDef<Evaluacion>[] = [
    {
      accessorKey: "fechaEvaluacion",
      header: "Fecha",
      cell: ({ row }) => {
        const fecha = row.original.fechaEvaluacion;
        return new Date(fecha).toLocaleDateString("es-ES");
      },
    },
    {
      id: "trabajador",
      header: "Trabajador",
      accessorFn: (row) => trabajadoresMap[row.trabajadorId] ?? "Desconocido",
    },
    {
      id: "evaluador",
      header: "Evaluador",
      cell: ({ row }) => evaluadoresMap[row.original.evaluadorId] ?? "Desconocido",
    },
    {
      id: "plantilla",
      header: "Plantilla",
      cell: ({ row }) => plantillasMap[row.original.plantillaId] ?? "-",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={estadoBadgeVariant[row.original.estado] ?? "secondary"}>
          {estadoLabel[row.original.estado] ?? row.original.estado}
        </Badge>
      ),
    },
    {
      id: "ncPotencial",
      header: "NC Potencial",
      cell: ({ row }) => {
        const val = row.original.ncPotencialGlobal;
        if (!val) return "-";
        const colors: Record<string, string> = {
          "Potencial Alto": "#22c55e",
          Promocionable: "#3b82f6",
          Lateral: "#f59e0b",
          "Estático": "#ef4444",
          "No evaluable": "#94a3b8",
        };
        return (
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
            style={{ backgroundColor: colors[val] ?? "#94a3b8" }}
          >
            {val}
          </span>
        );
      },
    },
    {
      id: "statusGlobal",
      header: "Status %",
      cell: ({ row }) =>
        row.original.statusGlobalPct
          ? `${Number(row.original.statusGlobalPct).toFixed(1)}%`
          : "-",
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const ev = row.original;
        const isEditable = ev.estado === "borrador" || ev.estado === "en_curso";
        const canDelete = isEditable && (userRole === "admin" || userRole === "evaluador");

        return (
          <div className="flex items-center gap-1">
            {isEditable && (userRole === "admin" || userRole === "evaluador") ? (
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/evaluaciones/${ev.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/evaluaciones/${ev.id}/ver`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar evaluación</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará la evaluación
                      y todas sus respuestas asociadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        const result = await eliminarEvaluacion(ev.id);
                        if (result.success) {
                          toast.success("Evaluación eliminada");
                          router.refresh();
                        } else {
                          toast.error(result.error ?? "Error al eliminar");
                        }
                      }}
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      },
    },
  ];

  const selectClass =
    "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {(userRole === "admin" || userRole === "evaluador") && (
          <Button asChild>
            <Link href="/evaluaciones/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva evaluación
            </Link>
          </Button>
        )}
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="en_curso">En curso</option>
          <option value="completada">Completada</option>
          <option value="validada">Validada</option>
        </select>
        <select
          value={filtroEvaluador}
          onChange={(e) => setFiltroEvaluador(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los evaluadores</option>
          {evaluadores.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.id === currentUserId ? `${ev.name} (Yo)` : ev.name}
            </option>
          ))}
        </select>
        <select
          value={filtroCentro}
          onChange={(e) => setFiltroCentro(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los centros</option>
          {centros.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          value={filtroArea}
          onChange={(e) => setFiltroArea(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todas las áreas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>
      <DataTable
        columns={columns}
        data={filteredData}
        searchColumn="trabajador"
        searchPlaceholder="Buscar por trabajador..."
      />
    </div>
  );
}
