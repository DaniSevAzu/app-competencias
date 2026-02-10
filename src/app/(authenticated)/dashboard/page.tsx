import { getDashboardData } from "@/app/actions/informes";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de evaluaciones de competencias SyP
        </p>
      </div>
      <DashboardClient data={data} />
    </div>
  );
}
