"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  data: {
    pilares: {
      nombre: string;
      niveles: Record<string, number>;
      total: number;
    }[];
    niveles: string[];
    centros: { id: number; nombre: string }[];
    areas: { id: number; nombre: string }[];
  };
}

const NIVEL_COLORS: Record<string, string> = {
  "Sin nivel": "#94a3b8",
};
const DEFAULT_COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6"];

export function AnalisisPilaresClient({ data }: Props) {
  const { pilares, niveles } = data;

  // Assign colors to niveles
  const nivelColors: Record<string, string> = { ...NIVEL_COLORS };
  let colorIdx = 0;
  for (const n of niveles) {
    if (!nivelColors[n]) {
      nivelColors[n] = DEFAULT_COLORS[colorIdx % DEFAULT_COLORS.length];
      colorIdx++;
    }
  }

  // Chart data
  const chartData = pilares.map((p) => {
    const entry: Record<string, string | number> = { pilar: p.nombre };
    for (const n of niveles) {
      entry[n] = p.niveles[n] || 0;
    }
    return entry;
  });

  if (pilares.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* Stacked bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Distribución de trabajadores por nivel en cada pilar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pilar" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {niveles.map((n) => (
                <Bar
                  key={n}
                  dataKey={n}
                  stackId="a"
                  fill={nivelColors[n]}
                  name={n}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabla detalle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por pilar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Pilar</th>
                  {niveles.map((n) => (
                    <th key={n} className="text-center py-2 px-2">
                      {n}
                    </th>
                  ))}
                  <th className="text-center py-2 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {pilares.map((p) => (
                  <tr key={p.nombre} className="border-b">
                    <td className="py-2 pr-4 font-medium">{p.nombre}</td>
                    {niveles.map((n) => (
                      <td key={n} className="text-center py-2 px-2">
                        {p.niveles[n] || 0}
                      </td>
                    ))}
                    <td className="text-center py-2 px-2 font-medium">
                      {p.total}
                    </td>
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
