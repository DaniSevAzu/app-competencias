"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

interface Trabajador9Box {
  id: string;
  nombre: string;
  centroId: number | null;
  areaId: number | null;
  puestoId: number | null;
  desempeno: "bajo" | "medio" | "alto";
  potencial: "bajo" | "medio" | "alto";
  statusPct: number;
  ncPotencial: string;
}

interface Config9Box {
  id: number;
  potencial: string;
  desempeno: string;
  etiqueta: string;
  recomendacion: string;
  color: string | null;
}

interface Props {
  data: {
    trabajadores: Trabajador9Box[];
    config: Config9Box[];
    centros: { id: number; nombre: string }[];
    areas: { id: number; nombre: string }[];
    puestos: { id: number; nombre: string }[];
  };
}

const EJES_POTENCIAL: ("alto" | "medio" | "bajo")[] = ["alto", "medio", "bajo"];
const EJES_DESEMPENO: ("bajo" | "medio" | "alto")[] = ["bajo", "medio", "alto"];

const DEFAULT_COLORS: Record<string, string> = {
  "alto-alto": "#22c55e",
  "alto-medio": "#86efac",
  "alto-bajo": "#fbbf24",
  "medio-alto": "#60a5fa",
  "medio-medio": "#93c5fd",
  "medio-bajo": "#fca5a5",
  "bajo-alto": "#fbbf24",
  "bajo-medio": "#f87171",
  "bajo-bajo": "#ef4444",
};

export function NineBoxClient({ data }: Props) {
  const [filtroCentro, setFiltroCentro] = useState("todos");
  const [filtroArea, setFiltroArea] = useState("todos");
  const [filtroPuesto, setFiltroPuesto] = useState("todos");
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const configMap = Object.fromEntries(
    data.config.map((c) => [`${c.potencial}-${c.desempeno}`, c])
  );

  const filteredTrabajadores = data.trabajadores.filter((t) => {
    if (filtroCentro !== "todos" && String(t.centroId) !== filtroCentro)
      return false;
    if (filtroArea !== "todos" && String(t.areaId) !== filtroArea)
      return false;
    if (filtroPuesto !== "todos" && String(t.puestoId) !== filtroPuesto)
      return false;
    return true;
  });

  function getCell(
    potencial: "bajo" | "medio" | "alto",
    desempeno: "bajo" | "medio" | "alto"
  ) {
    return filteredTrabajadores.filter(
      (t) => t.potencial === potencial && t.desempeno === desempeno
    );
  }

  const selectClass =
    "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm";

  const selectedWorkers = selectedCell
    ? (() => {
        const [pot, des] = selectedCell.split("-") as [
          "bajo" | "medio" | "alto",
          "bajo" | "medio" | "alto",
        ];
        return getCell(pot, des);
      })()
    : [];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroCentro}
          onChange={(e) => setFiltroCentro(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los centros</option>
          {data.centros.map((c) => (
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
          {data.areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
        <select
          value={filtroPuesto}
          onChange={(e) => setFiltroPuesto(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los puestos</option>
          {data.puestos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <span className="flex items-center text-sm text-muted-foreground">
          {filteredTrabajadores.length} trabajador(es)
        </span>
      </div>

      {/* 9-Box Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matriz 9-Box</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header: Desempeño */}
              <div className="grid grid-cols-4 gap-1 mb-1">
                <div className="flex items-end justify-center text-xs font-semibold text-muted-foreground p-2">
                  Potencial ↑ / Desempeño →
                </div>
                {EJES_DESEMPENO.map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-semibold uppercase p-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Grid rows (potencial alto → bajo) */}
              {EJES_POTENCIAL.map((potencial) => (
                <div key={potencial} className="grid grid-cols-4 gap-1 mb-1">
                  {/* Row label */}
                  <div className="flex items-center justify-center text-xs font-semibold uppercase p-2">
                    {potencial}
                  </div>
                  {/* Cells */}
                  {EJES_DESEMPENO.map((desempeno) => {
                    const cellKey = `${potencial}-${desempeno}`;
                    const cellConfig = configMap[cellKey];
                    const workers = getCell(potencial, desempeno);
                    const bgColor =
                      cellConfig?.color || DEFAULT_COLORS[cellKey] || "#e5e7eb";
                    const isSelected = selectedCell === cellKey;

                    return (
                      <button
                        key={cellKey}
                        type="button"
                        onClick={() =>
                          setSelectedCell(isSelected ? null : cellKey)
                        }
                        className={`rounded-lg p-3 text-center transition-all cursor-pointer min-h-[100px] flex flex-col items-center justify-center gap-1 ${
                          isSelected ? "ring-2 ring-primary ring-offset-2" : ""
                        }`}
                        style={{ backgroundColor: bgColor + "30", borderColor: bgColor, borderWidth: 2 }}
                      >
                        <span className="text-2xl font-bold">
                          {workers.length}
                        </span>
                        <span className="text-xs font-medium">
                          {cellConfig?.etiqueta ?? ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workers detail when cell clicked */}
      {selectedCell && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {configMap[selectedCell]?.etiqueta ??
                selectedCell.replace("-", " / ")}{" "}
              ({selectedWorkers.length} trabajadores)
            </CardTitle>
            {configMap[selectedCell]?.recomendacion && (
              <p className="text-sm text-muted-foreground">
                {configMap[selectedCell].recomendacion}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {selectedWorkers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay trabajadores en esta celda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Trabajador</th>
                      <th className="text-center py-2 px-2">NC Potencial</th>
                      <th className="text-center py-2 px-2">Status %</th>
                      <th className="text-center py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWorkers.map((w) => (
                      <tr key={w.id} className="border-b">
                        <td className="py-2 pr-4">{w.nombre}</td>
                        <td className="text-center py-2 px-2">
                          <Badge variant="outline">{w.ncPotencial}</Badge>
                        </td>
                        <td className="text-center py-2 px-2">
                          {w.statusPct.toFixed(1)}%
                        </td>
                        <td className="text-center py-2 px-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/informes/trabajador/${w.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
