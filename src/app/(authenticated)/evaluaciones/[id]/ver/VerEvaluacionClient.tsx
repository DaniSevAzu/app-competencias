"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

interface Props {
  evaluacion: {
    id: string;
    trabajadorId: string;
    evaluadorId: string;
    plantillaId: number;
    fechaEvaluacion: string;
    antiguedadAnos: string;
    estado: string;
    observaciones: string | null;
    ncPotencialGlobal: string | null;
    statusGlobalPct: string | null;
  };
  plantilla: {
    id: number;
    nombre: string;
  };
  trabajador: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  niveles: {
    id: number;
    nombre: string;
    codigo: string;
    orden: number;
  }[];
  pilares: {
    id: number;
    nombre: string;
    orden: number;
  }[];
  items: {
    id: number;
    pilarId: number;
    nivelId: number;
    texto: string;
    tipoCriterio: string;
    expectativa: string | null;
    orden: number;
  }[];
  respuestas: {
    id: string;
    evaluacionId: string;
    itemId: number;
    valor: string | null;
    puntuacion: number | null;
  }[];
  resultados: {
    id: string;
    pilarId: number;
    nivelRealId: number | null;
    ncEsperado: string | null;
    puntuacionNivel1: string | null;
    puntuacionNivel2: string | null;
    puntuacionNivel3: string | null;
    puntuacionNivel4: string | null;
  }[];
  planes: {
    id: string;
    pilarId: number | null;
    tipoAccion: string | null;
    accionConcreta: string;
    fechaInicio: string | null;
    fechaSeguimiento: string | null;
    observaciones: string | null;
    estado: string;
  }[];
}

const valorLabel: Record<string, string> = {
  alcanzado: "Alcanzado",
  parcialmente_alcanzado: "Parcial",
  no_alcanzado: "No alcanzado",
};

const valorColor: Record<string, string> = {
  alcanzado: "bg-green-100 text-green-800 border-green-300",
  parcialmente_alcanzado: "bg-yellow-100 text-yellow-800 border-yellow-300",
  no_alcanzado: "bg-red-100 text-red-800 border-red-300",
};

const estadoLabel: Record<string, string> = {
  borrador: "Borrador",
  en_curso: "En curso",
  completada: "Completada",
  validada: "Validada",
};

export function VerEvaluacionClient({
  evaluacion,
  plantilla,
  trabajador,
  niveles,
  pilares,
  items,
  respuestas,
  resultados,
  planes,
}: Props) {
  const nivelesOrdenados = [...niveles].sort((a, b) => a.orden - b.orden);
  const pilaresOrdenados = [...pilares].sort((a, b) => a.orden - b.orden);

  const respuestasMap = Object.fromEntries(
    respuestas.map((r) => [r.itemId, r.valor])
  );
  const nivelMap = Object.fromEntries(niveles.map((n) => [n.id, n.nombre]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/evaluaciones">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {trabajador.apellidos}, {trabajador.nombre}
            </h1>
            <Badge>{estadoLabel[evaluacion.estado] ?? evaluacion.estado}</Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            {plantilla.nombre} &middot;{" "}
            {new Date(evaluacion.fechaEvaluacion).toLocaleDateString("es-ES")} &middot;
            Antigüedad: {Number(evaluacion.antiguedadAnos).toFixed(1)} años
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/informes/trabajador/${evaluacion.trabajadorId}`}>
            <FileText className="h-4 w-4 mr-1" />
            Ver informe completo
          </Link>
        </Button>
      </div>

      {/* Resultados globales */}
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
            <p className="text-lg font-bold">{estadoLabel[evaluacion.estado] ?? evaluacion.estado}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Ítems respondidos</p>
            <p className="text-lg font-bold">
              {respuestas.filter((r) => r.valor !== null).length} / {items.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de resultados por pilar */}
      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resultados por pilar</CardTitle>
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
                  {pilaresOrdenados.map((pilar) => {
                    const res = resultados.find((r) => r.pilarId === pilar.id);
                    if (!res) return null;

                    const pcts = [
                      res.puntuacionNivel1,
                      res.puntuacionNivel2,
                      res.puntuacionNivel3,
                      res.puntuacionNivel4,
                    ];

                    return (
                      <tr key={pilar.id} className="border-b">
                        <td className="py-2 pr-4 font-medium">{pilar.nombre}</td>
                        {nivelesOrdenados.map((n, idx) => {
                          const pct = pcts[idx];
                          const pctNum = pct !== null ? Number(pct) : null;
                          return (
                            <td key={n.id} className="text-center py-2 px-2">
                              {pctNum !== null ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs ${
                                    pctNum >= 80
                                      ? "bg-green-100 text-green-800"
                                      : pctNum >= 50
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {pctNum.toFixed(0)}%
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                          );
                        })}
                        <td className="text-center py-2 px-2">
                          <Badge variant={res.nivelRealId ? "default" : "secondary"}>
                            {res.nivelRealId ? nivelMap[res.nivelRealId] ?? "-" : "Sin nivel"}
                          </Badge>
                        </td>
                        <td className="text-center py-2 px-2">{res.ncEsperado ?? "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Respuestas detalladas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle de respuestas</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple">
            {pilaresOrdenados.map((pilar) => (
              <AccordionItem key={pilar.id} value={String(pilar.id)}>
                <AccordionTrigger>{pilar.nombre}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {nivelesOrdenados.map((nivel) => {
                      const nivelItems = items
                        .filter((i) => i.pilarId === pilar.id && i.nivelId === nivel.id)
                        .sort((a, b) => a.orden - b.orden);

                      if (nivelItems.length === 0) return null;

                      return (
                        <div key={nivel.id} className="space-y-2">
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                            {nivel.nombre}
                          </h4>
                          {nivelItems.map((item) => {
                            const valor = respuestasMap[item.id];
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between border rounded-lg p-2 gap-2"
                              >
                                <span className="text-sm flex-1">{item.texto}</span>
                                {valor ? (
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs border ${valorColor[valor] ?? ""}`}
                                  >
                                    {valorLabel[valor] ?? valor}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Sin respuesta
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Observaciones */}
      {evaluacion.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{evaluacion.observaciones}</p>
          </CardContent>
        </Card>
      )}

      {/* Planes de acción */}
      {planes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan de Acción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {planes.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-3 space-y-1">
                  <p className="text-sm font-medium">{plan.accionConcreta}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {plan.tipoAccion && <span>Tipo: {plan.tipoAccion}</span>}
                    {plan.pilarId && (
                      <span>
                        Pilar: {pilaresOrdenados.find((p) => p.id === plan.pilarId)?.nombre ?? "-"}
                      </span>
                    )}
                    {plan.fechaInicio && (
                      <span>
                        Inicio: {new Date(plan.fechaInicio).toLocaleDateString("es-ES")}
                      </span>
                    )}
                    {plan.fechaSeguimiento && (
                      <span>
                        Seguimiento: {new Date(plan.fechaSeguimiento).toLocaleDateString("es-ES")}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {plan.estado}
                    </Badge>
                  </div>
                  {plan.observaciones && (
                    <p className="text-xs text-muted-foreground">{plan.observaciones}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
