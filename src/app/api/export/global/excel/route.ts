import { getInformeGlobal } from "@/app/actions/informes";
import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const centroId = searchParams.get("centroId");
  const areaId = searchParams.get("areaId");
  const colectivoId = searchParams.get("colectivoId");

  const data = await getInformeGlobal();

  let filas = data.filas;
  if (centroId) filas = filas.filter((f) => String(f.centroId) === centroId);
  if (areaId) filas = filas.filter((f) => String(f.areaId) === areaId);
  if (colectivoId) filas = filas.filter((f) => String(f.colectivoId) === colectivoId);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Informe Global");

  // Header
  const pilarNames = data.pilaresUnicos.map((p) => p.nombre);
  const headerRow = [
    "Trabajador",
    "Centro",
    "Área",
    "Colectivo",
    ...pilarNames.flatMap((p) => [`${p} - NC Real`, `${p} - NC Esperado`]),
    "Status Global %",
    "NC Potencial",
  ];

  const hr = ws.addRow(headerRow);
  hr.font = { bold: true };
  hr.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
    cell.border = { bottom: { style: "thin" } };
  });

  for (const fila of filas) {
    const pilarCells = data.pilaresUnicos.flatMap((p) => {
      const rp = fila.resultadosPilar.find((r) => r.pilarNombre === p.nombre);
      return [rp?.nivelRealNombre ?? "-", rp?.ncEsperado ?? "-"];
    });
    ws.addRow([
      fila.nombre,
      fila.centro,
      fila.area,
      fila.colectivo,
      ...pilarCells,
      fila.statusGlobal !== null ? `${fila.statusGlobal.toFixed(1)}%` : "-",
      fila.ncPotencial,
    ]);
  }

  // Auto-size
  ws.columns.forEach((col) => {
    col.width = 16;
  });
  if (ws.columns[0]) ws.columns[0].width = 30;

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="informe_global.xlsx"`,
    },
  });
}
