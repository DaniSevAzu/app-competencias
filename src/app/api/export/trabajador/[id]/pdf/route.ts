import { getInformeTrabajador } from "@/app/actions/informes";
import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  // --- Header ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Informe de Competencias SyP", 14, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`${plantilla?.nombre ?? ""} - ${evaluacion.fechaEvaluacion}`, 14, y);
  doc.setTextColor(0);
  y += 10;

  // --- Datos del trabajador ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Datos del trabajador", 14, y);
  y += 2;
  doc.setDrawColor(200);
  doc.line(14, y, pageW - 14, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const info = [
    [`Trabajador: ${trabajador.apellidos}, ${trabajador.nombre}`, `Centro: ${data.centro?.nombre ?? "-"}`],
    [`Área: ${data.area?.nombre ?? "-"}`, `Colectivo: ${data.colectivo?.nombre ?? "-"}`],
    [`Antigüedad: ${Number(evaluacion.antiguedadAnos).toFixed(1)} años`, `Evaluador: ${data.evaluador?.name ?? "-"}`],
  ];
  for (const row of info) {
    doc.text(row[0], 14, y);
    doc.text(row[1], pageW / 2, y);
    y += 5;
  }
  y += 3;

  // --- KPIs ---
  const kpis = [
    { label: "NC Potencial", value: evaluacion.ncPotencialGlobal ?? "-" },
    { label: "Status Global", value: evaluacion.statusGlobalPct ? `${Number(evaluacion.statusGlobalPct).toFixed(1)}%` : "-" },
    { label: "Umbral", value: `${umbral}%` },
  ];
  const kpiW = 45;
  const kpiStartX = 14;
  for (let i = 0; i < kpis.length; i++) {
    const x = kpiStartX + i * (kpiW + 10);
    doc.setDrawColor(180);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(x, y, kpiW, 16, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(kpis[i].label, x + kpiW / 2, y + 5, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(kpis[i].value, x + kpiW / 2, y + 13, { align: "center" });
    doc.setFont("helvetica", "normal");
  }
  y += 24;

  // --- Tabla de resultados ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resultados por Pilar y Nivel", 14, y);
  y += 2;
  doc.setDrawColor(200);
  doc.line(14, y, pageW - 14, y);
  y += 3;

  const tableHead = ["Pilar", ...nivelesOrd.map((n) => n.nombre), "NC Real", "NC Esperado"];
  const tableBody = pilaresOrd.map((pilar) => {
    const res = (resultados ?? []).find((r) => r.pilarId === pilar.id);
    const pcts = [
      res?.puntuacionNivel1,
      res?.puntuacionNivel2,
      res?.puntuacionNivel3,
      res?.puntuacionNivel4,
    ];
    const cells: string[] = [pilar.nombre];
    for (let idx = 0; idx < nivelesOrd.length; idx++) {
      const pct = pcts[idx];
      cells.push(pct !== null && pct !== undefined ? `${Number(pct).toFixed(0)}%` : "-");
    }
    cells.push(res?.nivelRealId ? nivelMap[res.nivelRealId] ?? "-" : "Sin nivel");
    cells.push(res?.ncEsperado ?? "-");
    return cells;
  });

  autoTable(doc, {
    startY: y,
    head: [tableHead],
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [50, 50, 50], fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
    didParseCell(hookData) {
      // Colorear celdas de porcentaje
      if (hookData.section === "body" && hookData.column.index >= 1 && hookData.column.index <= nivelesOrd.length) {
        const txt = String(hookData.cell.raw ?? "");
        if (txt !== "-") {
          const val = parseInt(txt);
          if (val >= umbral) {
            hookData.cell.styles.fillColor = [198, 239, 206]; // green
          } else if (val >= 50) {
            hookData.cell.styles.fillColor = [255, 235, 156]; // yellow
          } else {
            hookData.cell.styles.fillColor = [255, 199, 206]; // red
          }
        }
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable?.finalY ?? y + 40;
  y += 8;

  // --- Planes de acción ---
  if (planes && planes.length > 0) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Plan de Acción", 14, y);
    y += 2;
    doc.setDrawColor(200);
    doc.line(14, y, pageW - 14, y);
    y += 5;

    doc.setFontSize(9);
    for (const plan of planes) {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.setFont("helvetica", "bold");
      doc.text(`• ${plan.accionConcreta}`, 14, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const details: string[] = [];
      if (plan.tipoAccion) details.push(`Tipo: ${plan.tipoAccion}`);
      if (plan.fechaInicio) details.push(`Inicio: ${plan.fechaInicio}`);
      if (plan.fechaSeguimiento) details.push(`Seguimiento: ${plan.fechaSeguimiento}`);
      if (details.length > 0) {
        doc.text(details.join("  |  "), 18, y);
        y += 5;
      }
      doc.setTextColor(0);
    }
    y += 3;
  }

  // --- Observaciones ---
  if (evaluacion.observaciones) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones", 14, y);
    y += 2;
    doc.setDrawColor(200);
    doc.line(14, y, pageW - 14, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(evaluacion.observaciones, pageW - 28);
    doc.text(lines, 14, y);
  }

  // --- Footer ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generado el ${new Date().toLocaleDateString("es-ES")} - Competencias SyP`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe_${trabajador.apellidos}_${trabajador.nombre}.pdf"`,
    },
  });
}
