"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import Link from "next/link";

interface Fila {
  evaluacionId: string;
  trabajadorId: string;
  evaluadorId: string;
  nombre: string;
  centroId: number | null;
  centro: string;
  areaId: number | null;
  area: string;
  colectivoId: number | null;
  colectivo: string;
  uapId: number | null;
  uap: string;
  fechaEvaluacion: string;
  ncPotencial: string;
  statusGlobal: number | null;
  resultadosPilar: {
    pilarId: number;
    pilarNombre: string;
    nivelRealNombre: string;
    ncEsperado: string;
  }[];
}

interface Props {
  data: {
    filas: Fila[];
    centros: { id: number; nombre: string }[];
    areas: { id: number; nombre: string }[];
    colectivos: { id: number; nombre: string }[];
    uaps: { id: number; codigo: string; nombre: string | null }[];
    pilaresUnicos: { id: number; nombre: string; orden: number }[];
  };
  evaluadores: { id: string; name: string }[];
  currentUserId: string;
}

export function InformeGlobalClient({ data, evaluadores, currentUserId }: Props) {
  const [filtroCentro, setFiltroCentro] = useState("todos");
  const [filtroArea, setFiltroArea] = useState("todos");
  const [filtroColectivo, setFiltroColectivo] = useState("todos");
  const [filtroEvaluador, setFiltroEvaluador] = useState(currentUserId);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFilas = data.filas.filter((f) => {
    if (filtroEvaluador !== "todos" && f.evaluadorId !== filtroEvaluador)
      return false;
    if (filtroCentro !== "todos" && String(f.centroId) !== filtroCentro)
      return false;
    if (filtroArea !== "todos" && String(f.areaId) !== filtroArea) return false;
    if (filtroColectivo !== "todos" && String(f.colectivoId) !== filtroColectivo)
      return false;
    if (
      searchTerm &&
      !f.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const selectClass =
    "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm";

  async function handleExportExcel() {
    try {
      const params = new URLSearchParams();
      if (filtroCentro !== "todos") params.set("centroId", filtroCentro);
      if (filtroArea !== "todos") params.set("areaId", filtroArea);
      if (filtroColectivo !== "todos")
        params.set("colectivoId", filtroColectivo);
      const res = await fetch(`/api/export/global/excel?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "informe_global.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al exportar");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-9 max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        />
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
          value={filtroColectivo}
          onChange={(e) => setFiltroColectivo(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los colectivos</option>
          {data.colectivos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <Download className="h-4 w-4 mr-1" />
          Excel
        </Button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-2 px-3 whitespace-nowrap">
                Trabajador
              </th>
              <th className="text-left py-2 px-3">Centro</th>
              <th className="text-left py-2 px-3">Área</th>
              {data.pilaresUnicos.map((p) => (
                <th
                  key={p.id}
                  className="text-center py-2 px-2 whitespace-nowrap"
                >
                  {p.nombre}
                </th>
              ))}
              <th className="text-center py-2 px-2 whitespace-nowrap">
                Status %
              </th>
              <th className="text-center py-2 px-2 whitespace-nowrap">
                NC Potencial
              </th>
              <th className="text-center py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredFilas.length === 0 ? (
              <tr>
                <td
                  colSpan={data.pilaresUnicos.length + 5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Sin resultados
                </td>
              </tr>
            ) : (
              filteredFilas.map((fila) => (
                <tr key={fila.evaluacionId} className="border-b">
                  <td className="py-2 px-3 font-medium whitespace-nowrap">
                    {fila.nombre}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {fila.centro}
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">
                    {fila.area}
                  </td>
                  {data.pilaresUnicos.map((p) => {
                    const rp = fila.resultadosPilar.find(
                      (r) => r.pilarNombre === p.nombre
                    );
                    return (
                      <td key={p.id} className="text-center py-2 px-2">
                        <span className="text-xs">
                          {rp?.nivelRealNombre ?? "-"}
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-center py-2 px-2">
                    {fila.statusGlobal !== null
                      ? `${fila.statusGlobal.toFixed(1)}%`
                      : "-"}
                  </td>
                  <td className="text-center py-2 px-2">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          ({
                            "Potencial Alto": "#22c55e",
                            Promocionable: "#3b82f6",
                            Lateral: "#f59e0b",
                            "Estático": "#ef4444",
                            "No evaluable": "#94a3b8",
                          } as Record<string, string>)[fila.ncPotencial] ?? "#94a3b8",
                      }}
                    >
                      {fila.ncPotencial}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        href={`/informes/trabajador/${fila.trabajadorId}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">
        {filteredFilas.length} trabajador(es)
      </p>
    </div>
  );
}
