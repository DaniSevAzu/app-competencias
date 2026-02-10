"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Dato {
  trabajadorId: string;
  nombre: string;
  centroId: number | null;
  areaId: number | null;
  colectivoId: number | null;
  ncPotencial: string;
  statusGlobal: number;
}

interface Props {
  data: {
    datos: Dato[];
    centros: { id: number; nombre: string }[];
    areas: { id: number; nombre: string }[];
    colectivos: { id: number; nombre: string }[];
  };
}

const POTENCIAL_COLORS: Record<string, string> = {
  "Potencial Alto": "#22c55e",
  Promocionable: "#3b82f6",
  Lateral: "#f59e0b",
  "Estático": "#ef4444",
  "No evaluable": "#94a3b8",
};

const POTENCIAL_ORDER = [
  "Potencial Alto",
  "Promocionable",
  "Lateral",
  "Estático",
  "No evaluable",
];

export function AnalisisPotencialClient({ data }: Props) {
  const [agrupacion, setAgrupacion] = useState<"centro" | "area" | "colectivo">(
    "centro"
  );
  const [filtroPotencial, setFiltroPotencial] = useState<string | null>(null);
  const [filtroGrupo, setFiltroGrupo] = useState<string | null>(null);

  if (data.datos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No hay evaluaciones completadas para analizar.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Distribución global
  const globalDist: Record<string, number> = {};
  for (const d of data.datos) {
    globalDist[d.ncPotencial] = (globalDist[d.ncPotencial] || 0) + 1;
  }
  const pieData = Object.entries(globalDist)
    .sort(
      (a, b) =>
        POTENCIAL_ORDER.indexOf(a[0]) - POTENCIAL_ORDER.indexOf(b[0])
    )
    .map(([name, value]) => ({ name, value }));

  // Distribución por agrupación
  const groupMap =
    agrupacion === "centro"
      ? Object.fromEntries(data.centros.map((c) => [c.id, c.nombre]))
      : agrupacion === "area"
        ? Object.fromEntries(data.areas.map((a) => [a.id, a.nombre]))
        : Object.fromEntries(data.colectivos.map((c) => [c.id, c.nombre]));

  const groupField =
    agrupacion === "centro"
      ? "centroId"
      : agrupacion === "area"
        ? "areaId"
        : "colectivoId";

  const groupedData: Record<string, Record<string, number>> = {};

  for (const d of data.datos) {
    const groupId = d[groupField];
    if (!groupId) continue;
    const groupName = groupMap[groupId] ?? `ID ${groupId}`;
    if (!groupedData[groupName]) groupedData[groupName] = {};
    groupedData[groupName][d.ncPotencial] =
      (groupedData[groupName][d.ncPotencial] || 0) + 1;
  }

  const barData = Object.entries(groupedData).map(([grupo, dist]) => ({
    grupo,
    ...dist,
  }));

  // Filtrar tabla según selección
  const filteredDatos = data.datos.filter((d) => {
    if (filtroPotencial && d.ncPotencial !== filtroPotencial) return false;
    if (filtroGrupo) {
      const groupId = d[groupField];
      const groupName = groupId ? (groupMap[groupId] ?? `ID ${groupId}`) : null;
      if (groupName !== filtroGrupo) return false;
    }
    return true;
  });

  const hasFilter = filtroPotencial || filtroGrupo;

  const selectClass =
    "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm";

  // Click en porción de la tarta
  const handlePieClick = (_: unknown, index: number) => {
    const clicked = pieData[index]?.name;
    if (!clicked) return;
    if (filtroPotencial === clicked) {
      setFiltroPotencial(null);
    } else {
      setFiltroPotencial(clicked);
    }
    setFiltroGrupo(null);
  };

  // Click en barra del gráfico
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarClick = (barData: any, ncPotencial: string) => {
    const grupo = barData.grupo as string;
    if (filtroGrupo === grupo && filtroPotencial === ncPotencial) {
      setFiltroGrupo(null);
      setFiltroPotencial(null);
    } else {
      setFiltroGrupo(grupo);
      setFiltroPotencial(ncPotencial);
    }
  };

  const clearFilters = () => {
    setFiltroPotencial(null);
    setFiltroGrupo(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart global */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Distribución global de NC Potencial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  onClick={handlePieClick}
                  cursor="pointer"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={POTENCIAL_COLORS[entry.name] ?? "#94a3b8"}
                      opacity={filtroPotencial && filtroPotencial !== entry.name ? 0.3 : 1}
                      stroke={filtroPotencial === entry.name ? "#000" : undefined}
                      strokeWidth={filtroPotencial === entry.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stacked bar by group */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Distribución por</span>
              <select
                value={agrupacion}
                onChange={(e) => {
                  setAgrupacion(e.target.value as "centro" | "area" | "colectivo");
                  setFiltroGrupo(null);
                }}
                className={selectClass}
              >
                <option value="centro">Centro</option>
                <option value="area">Área</option>
                <option value="colectivo">Colectivo</option>
              </select>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grupo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {POTENCIAL_ORDER.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={POTENCIAL_COLORS[cat]}
                    name={cat}
                    cursor="pointer"
                    onClick={(barEntry) => handleBarClick(barEntry, cat)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla detalle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              Detalle por trabajador
              {hasFilter && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredDatos.length} de {data.datos.length})
                </span>
              )}
            </span>
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar filtro
              </Button>
            )}
          </CardTitle>
          {hasFilter && (
            <div className="flex gap-2 flex-wrap">
              {filtroPotencial && (
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: POTENCIAL_COLORS[filtroPotencial] ?? "#94a3b8" }}
                >
                  {filtroPotencial}
                </span>
              )}
              {filtroGrupo && (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted">
                  {filtroGrupo}
                </span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Trabajador</th>
                  <th className="text-center py-2 px-2">NC Potencial</th>
                  <th className="text-center py-2 px-2">Status Global</th>
                </tr>
              </thead>
              <tbody>
                {filteredDatos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-muted-foreground">
                      Sin resultados para este filtro
                    </td>
                  </tr>
                ) : (
                  filteredDatos.map((d) => (
                    <tr key={d.trabajadorId} className="border-b">
                      <td className="py-2 pr-4">{d.nombre}</td>
                      <td className="text-center py-2 px-2">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{
                            backgroundColor:
                              POTENCIAL_COLORS[d.ncPotencial] ?? "#94a3b8",
                          }}
                        >
                          {d.ncPotencial}
                        </span>
                      </td>
                      <td className="text-center py-2 px-2">
                        {d.statusGlobal.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {filteredDatos.length} trabajador(es)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
