import { getInformeTrabajador } from "@/app/actions/informes";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getInformeTrabajador(id);
  if (!data || !data.evaluacion) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { trabajador, evaluacion, plantilla, pilares, niveles, resultados, planes } = data;
  const pilaresOrd = (pilares ?? []).sort((a, b) => a.orden - b.orden);
  const nivelesOrd = (niveles ?? []).sort((a, b) => a.orden - b.orden);
  const nivelMap = Object.fromEntries((niveles ?? []).map((n) => [n.id, n.nombre]));
  const umbral = Number(evaluacion.antiguedadAnos) < 3 ? 80 : 95;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Informe Individual");

  // Datos del trabajador
  ws.addRow(["Informe de Competencias SyP"]).font = { bold: true, size: 14 };
  ws.addRow([]);
  ws.addRow(["Trabajador:", `${trabajador.apellidos}, ${trabajador.nombre}`]);
  ws.addRow(["Centro:", data.centro?.nombre ?? "-"]);
  ws.addRow(["Área:", data.area?.nombre ?? "-"]);
  ws.addRow(["Colectivo:", data.colectivo?.nombre ?? "-"]);
  ws.addRow(["Antigüedad:", `${Number(evaluacion.antiguedadAnos).toFixed(1)} años`]);
  ws.addRow(["Evaluador:", data.evaluador?.name ?? "-"]);
  ws.addRow(["Fecha:", evaluacion.fechaEvaluacion]);
  ws.addRow(["Plantilla:", plantilla?.nombre ?? "-"]);
  ws.addRow([]);

  // Resultados
  ws.addRow(["NC Potencial:", evaluacion.ncPotencialGlobal ?? "-"]);
  ws.addRow(["Status Global:", evaluacion.statusGlobalPct ? `${Number(evaluacion.statusGlobalPct).toFixed(1)}%` : "-"]);
  ws.addRow([]);

  // Tabla de resultados por pilar
  const headerRow = ["Pilar", ...nivelesOrd.map((n) => n.nombre), "NC Real", "NC Esperado"];
  const hr = ws.addRow(headerRow);
  hr.font = { bold: true };
  hr.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
    cell.border = { bottom: { style: "thin" } };
  });

  for (const pilar of pilaresOrd) {
    const res = (resultados ?? []).find((r) => r.pilarId === pilar.id);
    const pcts = [
      res?.puntuacionNivel1,
      res?.puntuacionNivel2,
      res?.puntuacionNivel3,
      res?.puntuacionNivel4,
    ];
    const row = ws.addRow([
      pilar.nombre,
      ...nivelesOrd.map((_, idx) => pcts[idx] !== null && pcts[idx] !== undefined ? `${Number(pcts[idx]).toFixed(0)}%` : "-"),
      res?.nivelRealId ? nivelMap[res.nivelRealId] ?? "-" : "Sin nivel",
      res?.ncEsperado ?? "-",
    ]);

    // Color coding
    nivelesOrd.forEach((_, idx) => {
      const cellIdx = idx + 2;
      const pct = pcts[idx];
      if (pct !== null && pct !== undefined) {
        const val = Number(pct);
        const cell = row.getCell(cellIdx);
        if (val >= umbral) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC6EFCE" } };
        } else if (val >= 50) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFEB9C" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC7CE" } };
        }
      }
    });
  }

  ws.addRow([]);
  ws.addRow([`Umbral aplicado: ${umbral}%`]);

  // Planes de acción
  if (planes && planes.length > 0) {
    ws.addRow([]);
    ws.addRow(["Plan de Acción"]).font = { bold: true };
    ws.addRow(["Acción", "Tipo", "Pilar", "Fecha inicio"]).font = { bold: true };
    for (const plan of planes) {
      ws.addRow([
        plan.accionConcreta,
        plan.tipoAccion ?? "-",
        plan.pilarId ? pilaresOrd.find((p) => p.id === plan.pilarId)?.nombre ?? "-" : "-",
        plan.fechaInicio ?? "-",
      ]);
    }
  }

  // Observaciones
  if (evaluacion.observaciones) {
    ws.addRow([]);
    ws.addRow(["Observaciones"]).font = { bold: true };
    ws.addRow([evaluacion.observaciones]);
  }

  // Auto-size columns
  ws.columns.forEach((col) => {
    col.width = 18;
  });
  if (ws.columns[0]) ws.columns[0].width = 25;

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="informe_${trabajador.apellidos}_${trabajador.nombre}.xlsx"`,
    },
  });
}
