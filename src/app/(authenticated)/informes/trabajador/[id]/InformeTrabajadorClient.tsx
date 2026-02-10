"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

interface Props {
  data: {
    trabajador: {
      id: string;
      nombre: string;
      apellidos: string;
      fechaIncorporacionPuesto: string;
    };
    evaluacion: {
      id: string;
      fechaEvaluacion: string;
      antiguedadAnos: string;
      estado: string;
      observaciones: string | null;
      ncPotencialGlobal: string | null;
      statusGlobalPct: string | null;
    } | null;
    plantilla?: { id: number; nombre: string };
    pilares?: { id: number; nombre: string; orden: number }[];
    niveles?: { id: number; nombre: string; codigo: string; orden: number }[];
    resultados?: {
      pilarId: number;
      nivelRealId: number | null;
      ncEsperado: string | null;
      puntuacionNivel1: string | null;
      puntuacionNivel2: string | null;
      puntuacionNivel3: string | null;
      puntuacionNivel4: string | null;
    }[];
    planes?: {
      id: string;
      pilarId: number | null;
      tipoAccion: string | null;
      accionConcreta: string;
      fechaInicio: string | null;
      fechaSeguimiento: string | null;
    }[];
    centro?: { nombre: string } | null;
    area?: { nombre: string } | null;
    colectivo?: { nombre: string } | null;
    evaluador?: { name: string } | null;
  };
}

export function InformeTrabajadorClient({ data }: Props) {
  const { trabajador, evaluacion } = data;

  if (!evaluacion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/informes/global">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {trabajador.apellidos}, {trabajador.nombre}
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No hay evaluaciones completadas para este trabajador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pilares = data.pilares?.sort((a, b) => a.orden - b.orden) ?? [];
  const nivelesOrdenados = data.niveles?.sort((a, b) => a.orden - b.orden) ?? [];
  const resultados = data.resultados ?? [];
  const planes = data.planes ?? [];
  const nivelMap = Object.fromEntries(
    nivelesOrdenados.map((n) => [n.id, n])
  );

  // Datos para gráfico de barras: porcentaje por pilar (media de niveles)
  const chartData = pilares.map((pilar) => {
    const res = resultados.find((r) => r.pilarId === pilar.id);
    const pcts = [
      res?.puntuacionNivel1,
      res?.puntuacionNivel2,
      res?.puntuacionNivel3,
      res?.puntuacionNivel4,
    ];

    const entry: Record<string, string | number> = { pilar: pilar.nombre };
    nivelesOrdenados.forEach((n, idx) => {
      entry[n.nombre] = pcts[idx] !== null && pcts[idx] !== undefined ? Number(pcts[idx]) : 0;
    });
    return entry;
  });

  const COLORS = ["#94a3b8", "#3b82f6", "#22c55e", "#f59e0b"];

  async function handleExportExcel() {
    try {
      const res = await fetch(
        `/api/export/trabajador/${trabajador.id}/excel`
      );
      if (!res.ok) throw new Error("Error al exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe_${trabajador.apellidos}_${trabajador.nombre}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al exportar Excel");
    }
  }

  async function handleExportPDF() {
    try {
      const res = await fetch(
        `/api/export/trabajador/${trabajador.id}/pdf`
      );
      if (!res.ok) throw new Error("Error al exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe_${trabajador.apellidos}_${trabajador.nombre}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al exportar PDF");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/informes/global">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Informe: {trabajador.apellidos}, {trabajador.nombre}
            </h1>
            <p className="text-sm text-muted-foreground">
              {data.plantilla?.nombre} &middot;{" "}
              {new Date(evaluacion.fechaEvaluacion).toLocaleDateString("es-ES")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-1" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      </div>

      {/* Datos del trabajador */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del trabajador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 text-sm">
            <div>
              <span className="text-muted-foreground">Nombre:</span>{" "}
              <strong>
                {trabajador.apellidos}, {trabajador.nombre}
              </strong>
            </div>
            {data.centro && (
              <div>
                <span className="text-muted-foreground">Centro:</span>{" "}
                {data.centro.nombre}
              </div>
            )}
            {data.area && (
              <div>
                <span className="text-muted-foreground">Área:</span>{" "}
                {data.area.nombre}
              </div>
            )}
            {data.colectivo && (
              <div>
                <span className="text-muted-foreground">Colectivo:</span>{" "}
                {data.colectivo.nombre}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Antigüedad:</span>{" "}
              {Number(evaluacion.antiguedadAnos).toFixed(1)} años
            </div>
            {data.evaluador && (
              <div>
                <span className="text-muted-foreground">Evaluador:</span>{" "}
                {data.evaluador.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {(() => {
          const pot = evaluacion.ncPotencialGlobal;
          const potColor = ({
            "Potencial Alto": "border-l-green-500 bg-green-50",
            Promocionable: "border-l-blue-500 bg-blue-50",
            Lateral: "border-l-yellow-500 bg-yellow-50",
            "Estático": "border-l-red-500 bg-red-50",
            "No evaluable": "border-l-gray-400 bg-gray-50",
          } as Record<string, string>)[pot ?? ""] ?? "";
          const potTextColor = ({
            "Potencial Alto": "text-green-700",
            Promocionable: "text-blue-700",
            Lateral: "text-yellow-700",
            "Estático": "text-red-700",
            "No evaluable": "text-gray-500",
          } as Record<string, string>)[pot ?? ""] ?? "";
          return (
            <Card className={`border-l-4 ${potColor}`}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">NC Potencial</p>
                <p className={`text-lg font-bold ${potTextColor}`}>{pot ?? "-"}</p>
              </CardContent>
            </Card>
          );
        })()}
        {(() => {
          const pct = evaluacion.statusGlobalPct ? Number(evaluacion.statusGlobalPct) : null;
          const statusColor = pct === null ? ""
            : pct > 70 ? "border-l-green-500 bg-green-50"
            : pct >= 40 ? "border-l-yellow-500 bg-yellow-50"
            : "border-l-red-500 bg-red-50";
          const statusTextColor = pct === null ? ""
            : pct > 70 ? "text-green-700"
            : pct >= 40 ? "text-yellow-700"
            : "text-red-700";
          return (
            <Card className={`border-l-4 ${statusColor}`}>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Status Global</p>
                <p className={`text-lg font-bold ${statusTextColor}`}>
                  {pct !== null ? `${pct.toFixed(1)}%` : "-"}
                </p>
              </CardContent>
            </Card>
          );
        })()}
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Estado</p>
            <p className="text-lg font-bold capitalize">{evaluacion.estado}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Fecha evaluación</p>
            <p className="text-lg font-bold">
              {new Date(evaluacion.fechaEvaluacion).toLocaleDateString("es-ES")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla: Puntuaciones por pilar y nivel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Matriz de Puntuaciones por Pilar y Nivel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Pilar</th>
                  {nivelesOrdenados.map((n) => (
                    <th key={n.id} className="text-center py-2 px-2">
                      {n.nombre}
                    </th>
                  ))}
                  <th className="text-center py-2 px-2">NC Real</th>
                  <th className="text-center py-2 px-2">NC Esperado</th>
                </tr>
              </thead>
              <tbody>
                {pilares.map((pilar) => {
                  const res = resultados.find((r) => r.pilarId === pilar.id);
                  const pcts = [
                    res?.puntuacionNivel1,
                    res?.puntuacionNivel2,
                    res?.puntuacionNivel3,
                    res?.puntuacionNivel4,
                  ];

                  const umbral =
                    Number(evaluacion.antiguedadAnos) < 3 ? 80 : 95;

                  return (
                    <tr key={pilar.id} className="border-b">
                      <td className="py-2 pr-4 font-medium">{pilar.nombre}</td>
                      {nivelesOrdenados.map((n, idx) => {
                        const pct = pcts[idx];
                        const val = pct !== null && pct !== undefined ? Number(pct) : null;
                        return (
                          <td key={n.id} className="text-center py-2 px-2">
                            {val !== null ? (
                              <div className="space-y-0.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    val >= umbral
                                      ? "bg-green-100 text-green-800"
                                      : val >= 50
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {val.toFixed(0)}%
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  min: {umbral}%
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center py-2 px-2">
                        <Badge
                          variant={res?.nivelRealId ? "default" : "secondary"}
                        >
                          {res?.nivelRealId
                            ? nivelMap[res.nivelRealId]?.nombre ?? "-"
                            : "Sin nivel"}
                        </Badge>
                      </td>
                      <td className="text-center py-2 px-2">
                        {res?.ncEsperado ?? "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de barras */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Puntuación por Pilar y Nivel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pilar" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <ReferenceLine
                  y={Number(evaluacion.antiguedadAnos) < 3 ? 80 : 95}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label="Umbral"
                />
                {nivelesOrdenados.map((n, idx) => (
                  <Bar
                    key={n.id}
                    dataKey={n.nombre}
                    fill={COLORS[idx % COLORS.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos de resultados.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan de acción */}
      {planes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan de Acción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {planes.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-3">
                  <p className="text-sm font-medium">{plan.accionConcreta}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    {plan.tipoAccion && <span>Tipo: {plan.tipoAccion}</span>}
                    {plan.pilarId && (
                      <span>
                        Pilar:{" "}
                        {pilares.find((p) => p.id === plan.pilarId)?.nombre ??
                          "-"}
                      </span>
                    )}
                    {plan.fechaInicio && (
                      <span>
                        Inicio:{" "}
                        {new Date(plan.fechaInicio).toLocaleDateString("es-ES")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observaciones */}
      {evaluacion.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {evaluacion.observaciones}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Link a evolución */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href={`/informes/evolucion/${trabajador.id}`}>
            Ver evolución temporal
          </Link>
        </Button>
      </div>
    </div>
  );
}
