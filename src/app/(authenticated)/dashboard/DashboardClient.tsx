"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Clock, CheckCircle, TrendingUp } from "lucide-react";
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

interface DashboardData {
  total: number;
  pendientes: number;
  completadas: number;
  statusGlobalMedio: number | null;
  potencialDist: Record<string, number>;
  datosPorCentro: {
    nombre: string;
    total: number;
    completadas: number;
    mediaStatus: number;
  }[];
}

const POTENCIAL_COLORS: Record<string, string> = {
  "Potencial Alto": "#22c55e",
  Promocionable: "#3b82f6",
  Lateral: "#f59e0b",
  "Estático": "#ef4444",
  "No evaluable": "#94a3b8",
};

export function DashboardClient({ data }: { data: DashboardData }) {
  const potencialData = Object.entries(data.potencialDist).map(
    ([name, value]) => ({ name, value })
  );

  return (
    <>
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Evaluaciones
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-2">
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total}</div>
            <p className="text-xs text-muted-foreground">
              Evaluaciones registradas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <div className="rounded-md bg-amber-500/10 p-2">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendientes}</div>
            <p className="text-xs text-muted-foreground">
              En borrador o en curso
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <div className="rounded-md bg-emerald-500/10 p-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completadas}</div>
            <p className="text-xs text-muted-foreground">
              Evaluaciones finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status Global Medio
            </CardTitle>
            <div className="rounded-md bg-violet-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.statusGlobalMedio !== null
                ? `${data.statusGlobalMedio.toFixed(1)}%`
                : "--%"}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de evaluaciones completadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar chart: Comparativo por centro */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo por Centro</CardTitle>
          </CardHeader>
          <CardContent>
            {data.datosPorCentro.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.datosPorCentro}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="mediaStatus"
                    name="Media Status %"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completadas"
                    name="Completadas"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin datos. Complete evaluaciones para ver el comparativo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pie chart: Distribución NC Potencial */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución NC Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            {potencialData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={potencialData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {potencialData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={POTENCIAL_COLORS[entry.name] ?? "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sin datos. Complete evaluaciones para ver la distribución.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
