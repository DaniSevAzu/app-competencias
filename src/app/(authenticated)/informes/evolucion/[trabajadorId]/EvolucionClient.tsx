"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  data: {
    trabajador: { id: string; nombre: string; apellidos: string };
    evolucion: Record<string, string | number>[];
    pilares: string[];
    niveles: { id: number; nombre: string; orden: number }[];
  };
}

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export function EvolucionClient({ data }: Props) {
  const { evolucion, pilares, niveles } = data;

  if (evolucion.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            No hay suficientes evaluaciones completadas para mostrar la evolución.
          </p>
          <div className="flex justify-center mt-4">
            <Button variant="outline" asChild>
              <Link href={`/informes/trabajador/${data.trabajador.id}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver al informe
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Custom tick formatter for Y axis (nivel orden → nombre)
  const nivelTicks = niveles.map((n) => n.orden);
  const nivelLabels = Object.fromEntries(
    niveles.map((n) => [n.orden, n.nombre])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/informes/trabajador/${data.trabajador.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al informe
          </Link>
        </Button>
      </div>

      {/* NC Real por pilar a lo largo del tiempo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Evolución NC Real por Pilar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={evolucion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) =>
                  new Date(val).toLocaleDateString("es-ES", {
                    month: "short",
                    year: "2-digit",
                  })
                }
              />
              <YAxis
                domain={[0, Math.max(...nivelTicks, 4)]}
                ticks={nivelTicks}
                tickFormatter={(val) => nivelLabels[val] ?? String(val)}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                labelFormatter={(val) =>
                  new Date(val as string).toLocaleDateString("es-ES")
                }
                formatter={(value: number | undefined) =>
                  value !== undefined ? (nivelLabels[value] ?? String(value)) : "-"
                }
              />
              <Legend />
              {pilares.map((pilar, idx) => (
                <Line
                  key={pilar}
                  type="monotone"
                  dataKey={pilar}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Global a lo largo del tiempo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Evolución Status Global (%)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolucion}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11 }}
                tickFormatter={(val) =>
                  new Date(val).toLocaleDateString("es-ES", {
                    month: "short",
                    year: "2-digit",
                  })
                }
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(val) =>
                  new Date(val as string).toLocaleDateString("es-ES")
                }
                formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}%` : "-"}
              />
              <Line
                type="monotone"
                dataKey="statusGlobal"
                name="Status Global %"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla de detalle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Fecha</th>
                  <th className="text-center py-2 px-2">Status %</th>
                  <th className="text-center py-2 px-2">NC Potencial</th>
                  {pilares.map((p) => (
                    <th key={p} className="text-center py-2 px-2">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evolucion.map((row, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 pr-4">
                      {new Date(row.fecha as string).toLocaleDateString("es-ES")}
                    </td>
                    <td className="text-center py-2 px-2">
                      {Number(row.statusGlobal).toFixed(1)}%
                    </td>
                    <td className="text-center py-2 px-2">
                      {row.ncPotencial as string}
                    </td>
                    {pilares.map((p) => (
                      <td key={p} className="text-center py-2 px-2">
                        {nivelLabels[row[p] as number] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
