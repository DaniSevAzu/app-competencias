"use server";

import { db } from "@/lib/db";
import {
  evaluaciones,
  respuestas,
  resultadosPilar,
  trabajadores,
  plantillasEvaluacion,
  pilares,
  niveles,
  users,
  centros,
  areas,
  colectivos,
  uaps,
  puestos,
  nineboxConfig,
  planesAccion,
  itemsEvaluacion,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ==================== DASHBOARD ====================

export async function getDashboardData() {
  const allEvals = await db.select().from(evaluaciones);

  const total = allEvals.length;
  const pendientes = allEvals.filter(
    (e) => e.estado === "borrador" || e.estado === "en_curso"
  ).length;
  const completadas = allEvals.filter(
    (e) => e.estado === "completada" || e.estado === "validada"
  ).length;

  const completadasConStatus = allEvals.filter(
    (e) => e.statusGlobalPct !== null
  );
  const statusGlobalMedio =
    completadasConStatus.length > 0
      ? completadasConStatus.reduce(
          (acc, e) => acc + Number(e.statusGlobalPct),
          0
        ) / completadasConStatus.length
      : null;

  // Distribución NC Potencial
  const potencialDist: Record<string, number> = {};
  for (const e of allEvals) {
    if (e.ncPotencialGlobal) {
      potencialDist[e.ncPotencialGlobal] =
        (potencialDist[e.ncPotencialGlobal] || 0) + 1;
    }
  }

  // Datos por centro
  const allTrabajadores = await db.select().from(trabajadores);
  const allCentros = await db.select().from(centros);

  const trabajadorCentroMap = Object.fromEntries(
    allTrabajadores.map((t) => [t.id, t.centroId])
  );
  const centroNombreMap = Object.fromEntries(
    allCentros.map((c) => [c.id, c.nombre])
  );

  const porCentro: Record<
    string,
    { nombre: string; total: number; completadas: number; sumaStatus: number }
  > = {};

  for (const e of allEvals) {
    const centroId = trabajadorCentroMap[e.trabajadorId];
    if (!centroId) continue;
    const nombre = centroNombreMap[centroId] ?? `Centro ${centroId}`;
    if (!porCentro[centroId]) {
      porCentro[centroId] = { nombre, total: 0, completadas: 0, sumaStatus: 0 };
    }
    porCentro[centroId].total++;
    if (e.statusGlobalPct !== null) {
      porCentro[centroId].completadas++;
      porCentro[centroId].sumaStatus += Number(e.statusGlobalPct);
    }
  }

  const datosPorCentro = Object.values(porCentro).map((c) => ({
    nombre: c.nombre,
    total: c.total,
    completadas: c.completadas,
    mediaStatus: c.completadas > 0 ? c.sumaStatus / c.completadas : 0,
  }));

  return {
    total,
    pendientes,
    completadas,
    statusGlobalMedio,
    potencialDist,
    datosPorCentro,
  };
}

// ==================== INFORME INDIVIDUAL ====================

export async function getInformeTrabajador(trabajadorId: string) {
  const trabajador = await db
    .select()
    .from(trabajadores)
    .where(eq(trabajadores.id, trabajadorId))
    .limit(1);

  if (!trabajador[0]) return null;

  // Última evaluación completada
  const evals = await db
    .select()
    .from(evaluaciones)
    .where(
      and(
        eq(evaluaciones.trabajadorId, trabajadorId),
        eq(evaluaciones.estado, "completada")
      )
    )
    .orderBy(desc(evaluaciones.fechaEvaluacion))
    .limit(1);

  if (!evals[0]) return { trabajador: trabajador[0], evaluacion: null };

  const ev = evals[0];

  const [plantilla, pilaresData, nivelesData, resultadosData, respuestasData, planesData] =
    await Promise.all([
      db
        .select()
        .from(plantillasEvaluacion)
        .where(eq(plantillasEvaluacion.id, ev.plantillaId))
        .limit(1),
      db
        .select()
        .from(pilares)
        .where(eq(pilares.plantillaId, ev.plantillaId))
        .orderBy(pilares.orden),
      db
        .select()
        .from(niveles)
        .where(eq(niveles.plantillaId, ev.plantillaId))
        .orderBy(niveles.orden),
      db
        .select()
        .from(resultadosPilar)
        .where(eq(resultadosPilar.evaluacionId, ev.id)),
      db
        .select()
        .from(respuestas)
        .where(eq(respuestas.evaluacionId, ev.id)),
      db
        .select()
        .from(planesAccion)
        .where(eq(planesAccion.evaluacionId, ev.id)),
    ]);

  // Lookup data
  const centroData = trabajador[0].centroId
    ? await db
        .select()
        .from(centros)
        .where(eq(centros.id, trabajador[0].centroId))
        .limit(1)
    : [];
  const areaData = trabajador[0].areaId
    ? await db
        .select()
        .from(areas)
        .where(eq(areas.id, trabajador[0].areaId))
        .limit(1)
    : [];
  const colectivoData = trabajador[0].colectivoId
    ? await db
        .select()
        .from(colectivos)
        .where(eq(colectivos.id, trabajador[0].colectivoId))
        .limit(1)
    : [];

  const evaluadorData = await db
    .select()
    .from(users)
    .where(eq(users.id, ev.evaluadorId))
    .limit(1);

  return {
    trabajador: trabajador[0],
    evaluacion: ev,
    plantilla: plantilla[0],
    pilares: pilaresData,
    niveles: nivelesData,
    resultados: resultadosData,
    respuestas: respuestasData,
    planes: planesData,
    centro: centroData[0] ?? null,
    area: areaData[0] ?? null,
    colectivo: colectivoData[0] ?? null,
    evaluador: evaluadorData[0] ?? null,
  };
}

// ==================== INFORME GLOBAL ====================

export async function getInformeGlobal() {
  const completadas = await db
    .select()
    .from(evaluaciones)
    .where(eq(evaluaciones.estado, "completada"))
    .orderBy(desc(evaluaciones.fechaEvaluacion));

  const allTrabajadores = await db.select().from(trabajadores);
  const allCentros = await db.select().from(centros);
  const allAreas = await db.select().from(areas);
  const allColectivos = await db.select().from(colectivos);
  const allUaps = await db.select().from(uaps);

  // Para cada evaluación completada, obtener resultados por pilar
  const evalIds = completadas.map((e) => e.id);
  const allResultados =
    evalIds.length > 0
      ? await db.select().from(resultadosPilar)
      : [];

  // Filtrar resultados por las evaluaciones completadas
  const resultadosCompletadas = allResultados.filter((r) =>
    evalIds.includes(r.evaluacionId)
  );

  // Obtener niveles y pilares de las plantillas usadas
  const plantillaIds = [...new Set(completadas.map((e) => e.plantillaId))];
  const allNiveles =
    plantillaIds.length > 0
      ? await db.select().from(niveles)
      : [];
  const allPilares =
    plantillaIds.length > 0
      ? await db.select().from(pilares)
      : [];

  const trabajadorMap = Object.fromEntries(
    allTrabajadores.map((t) => [t.id, t])
  );
  const centroMap = Object.fromEntries(allCentros.map((c) => [c.id, c.nombre]));
  const areaMap = Object.fromEntries(allAreas.map((a) => [a.id, a.nombre]));
  const colectivoMap = Object.fromEntries(
    allColectivos.map((c) => [c.id, c.nombre])
  );
  const uapMap = Object.fromEntries(
    allUaps.map((u) => [u.id, u.codigo + (u.nombre ? ` - ${u.nombre}` : "")])
  );
  const nivelMap = Object.fromEntries(
    allNiveles.map((n) => [n.id, n.nombre])
  );
  const pilarMap = Object.fromEntries(
    allPilares.map((p) => [p.id, p.nombre])
  );

  // Agrupar: última evaluación por trabajador
  const ultimaEvalPorTrabajador: Record<string, (typeof completadas)[0]> = {};
  for (const ev of completadas) {
    if (!ultimaEvalPorTrabajador[ev.trabajadorId]) {
      ultimaEvalPorTrabajador[ev.trabajadorId] = ev;
    }
  }

  const filas = Object.values(ultimaEvalPorTrabajador).map((ev) => {
    const t = trabajadorMap[ev.trabajadorId];
    const resultadosEval = resultadosCompletadas.filter(
      (r) => r.evaluacionId === ev.id
    );

    return {
      evaluacionId: ev.id,
      trabajadorId: ev.trabajadorId,
      evaluadorId: ev.evaluadorId,
      nombre: t ? `${t.apellidos}, ${t.nombre}` : "Desconocido",
      centroId: t?.centroId ?? null,
      centro: t?.centroId ? centroMap[t.centroId] ?? "-" : "-",
      areaId: t?.areaId ?? null,
      area: t?.areaId ? areaMap[t.areaId] ?? "-" : "-",
      colectivoId: t?.colectivoId ?? null,
      colectivo: t?.colectivoId
        ? colectivoMap[t.colectivoId] ?? "-"
        : "-",
      uapId: t?.uapId ?? null,
      uap: t?.uapId ? uapMap[t.uapId] ?? "-" : "-",
      fechaEvaluacion: ev.fechaEvaluacion,
      ncPotencial: ev.ncPotencialGlobal ?? "-",
      statusGlobal: ev.statusGlobalPct
        ? Number(ev.statusGlobalPct)
        : null,
      resultadosPilar: resultadosEval.map((r) => ({
        pilarId: r.pilarId,
        pilarNombre: pilarMap[r.pilarId] ?? "-",
        nivelRealNombre: r.nivelRealId
          ? nivelMap[r.nivelRealId] ?? "-"
          : "Sin nivel",
        ncEsperado: r.ncEsperado ?? "-",
      })),
    };
  });

  // Pilares únicos (del primer eval para tener referencia)
  const pilaresUnicos = allPilares
    .filter((p) => plantillaIds.includes(p.plantillaId))
    .sort((a, b) => a.orden - b.orden)
    .filter(
      (p, i, arr) => arr.findIndex((x) => x.nombre === p.nombre) === i
    );

  return {
    filas,
    centros: allCentros,
    areas: allAreas,
    colectivos: allColectivos,
    uaps: allUaps,
    pilaresUnicos,
  };
}

// ==================== EVOLUCIÓN TEMPORAL ====================

export async function getEvolucionTrabajador(trabajadorId: string) {
  const trabajador = await db
    .select()
    .from(trabajadores)
    .where(eq(trabajadores.id, trabajadorId))
    .limit(1);

  if (!trabajador[0]) return null;

  const evals = await db
    .select()
    .from(evaluaciones)
    .where(
      and(
        eq(evaluaciones.trabajadorId, trabajadorId),
        eq(evaluaciones.estado, "completada")
      )
    )
    .orderBy(evaluaciones.fechaEvaluacion);

  const allResultados = await db.select().from(resultadosPilar);
  const evalIds = evals.map((e) => e.id);
  const resultadosFiltered = allResultados.filter((r) =>
    evalIds.includes(r.evaluacionId)
  );

  // Obtener pilares y niveles
  const plantillaIds = [...new Set(evals.map((e) => e.plantillaId))];
  const allPilares = await db.select().from(pilares);
  const allNiveles = await db.select().from(niveles);

  const pilarMap = Object.fromEntries(allPilares.map((p) => [p.id, p.nombre]));
  const nivelMap = Object.fromEntries(
    allNiveles.map((n) => [n.id, { nombre: n.nombre, orden: n.orden }])
  );

  const evolucion = evals.map((ev) => {
    const resultadosEval = resultadosFiltered.filter(
      (r) => r.evaluacionId === ev.id
    );

    const pilarResults: Record<string, number> = {};
    for (const r of resultadosEval) {
      const pilarNombre = pilarMap[r.pilarId] ?? `Pilar ${r.pilarId}`;
      pilarResults[pilarNombre] = r.nivelRealId
        ? nivelMap[r.nivelRealId]?.orden ?? 0
        : 0;
    }

    return {
      fecha: ev.fechaEvaluacion,
      statusGlobal: ev.statusGlobalPct ? Number(ev.statusGlobalPct) : 0,
      ncPotencial: ev.ncPotencialGlobal ?? "-",
      ...pilarResults,
    };
  });

  // Obtener nombres de pilares únicos
  const pilaresUsados = [
    ...new Set(
      resultadosFiltered.map((r) => pilarMap[r.pilarId] ?? `Pilar ${r.pilarId}`)
    ),
  ];

  // Niveles para eje Y
  const nivelesRef = allNiveles
    .filter((n) => plantillaIds.includes(n.plantillaId))
    .sort((a, b) => a.orden - b.orden)
    .filter((n, i, arr) => arr.findIndex((x) => x.orden === n.orden) === i);

  return {
    trabajador: trabajador[0],
    evolucion,
    pilares: pilaresUsados,
    niveles: nivelesRef,
  };
}

// ==================== ANÁLISIS POR PILARES ====================

export async function getAnalisisPilares() {
  const completadas = await db
    .select()
    .from(evaluaciones)
    .where(eq(evaluaciones.estado, "completada"));

  const allTrabajadores = await db.select().from(trabajadores);
  const allResultados = await db.select().from(resultadosPilar);
  const allPilares = await db.select().from(pilares);
  const allNiveles = await db.select().from(niveles);
  const allCentros = await db.select().from(centros);
  const allAreas = await db.select().from(areas);

  const evalIds = completadas.map((e) => e.id);
  const resultadosCompletadas = allResultados.filter((r) =>
    evalIds.includes(r.evaluacionId)
  );

  const trabajadorMap = Object.fromEntries(
    allTrabajadores.map((t) => [t.id, t])
  );
  const pilarMap = Object.fromEntries(allPilares.map((p) => [p.id, p.nombre]));
  const nivelMap = Object.fromEntries(
    allNiveles.map((n) => [n.id, { nombre: n.nombre, orden: n.orden }])
  );

  // Última evaluación por trabajador
  const ultimaEvalPorTrabajador: Record<string, (typeof completadas)[0]> = {};
  for (const ev of completadas.sort(
    (a, b) =>
      new Date(b.fechaEvaluacion).getTime() -
      new Date(a.fechaEvaluacion).getTime()
  )) {
    if (!ultimaEvalPorTrabajador[ev.trabajadorId]) {
      ultimaEvalPorTrabajador[ev.trabajadorId] = ev;
    }
  }

  const ultimasEvalIds = new Set(
    Object.values(ultimaEvalPorTrabajador).map((e) => e.id)
  );
  const resultadosUltimas = resultadosCompletadas.filter((r) =>
    ultimasEvalIds.has(r.evaluacionId)
  );

  // Agrupar por pilar → nivel → count
  const pilaresData: Record<
    string,
    { nombre: string; niveles: Record<string, number>; total: number }
  > = {};

  for (const r of resultadosUltimas) {
    const pilarNombre = pilarMap[r.pilarId] ?? `Pilar ${r.pilarId}`;
    if (!pilaresData[pilarNombre]) {
      pilaresData[pilarNombre] = { nombre: pilarNombre, niveles: {}, total: 0 };
    }
    const nivelNombre = r.nivelRealId
      ? nivelMap[r.nivelRealId]?.nombre ?? "Sin nivel"
      : "Sin nivel";
    pilaresData[pilarNombre].niveles[nivelNombre] =
      (pilaresData[pilarNombre].niveles[nivelNombre] || 0) + 1;
    pilaresData[pilarNombre].total++;
  }

  // Niveles únicos
  const nivelesUnicos = [
    "Sin nivel",
    ...allNiveles
      .sort((a, b) => a.orden - b.orden)
      .map((n) => n.nombre)
      .filter((n, i, arr) => arr.indexOf(n) === i),
  ];

  return {
    pilares: Object.values(pilaresData),
    niveles: nivelesUnicos,
    centros: allCentros,
    areas: allAreas,
  };
}

// ==================== ANÁLISIS POTENCIAL ====================

export async function getAnalisisPotencial() {
  const completadas = await db
    .select()
    .from(evaluaciones)
    .where(eq(evaluaciones.estado, "completada"))
    .orderBy(desc(evaluaciones.fechaEvaluacion));

  const allTrabajadores = await db.select().from(trabajadores);
  const allCentros = await db.select().from(centros);
  const allAreas = await db.select().from(areas);
  const allColectivos = await db.select().from(colectivos);

  const trabajadorMap = Object.fromEntries(
    allTrabajadores.map((t) => [t.id, t])
  );

  // Última evaluación por trabajador
  const ultimaEvalPorTrabajador: Record<string, (typeof completadas)[0]> = {};
  for (const ev of completadas) {
    if (!ultimaEvalPorTrabajador[ev.trabajadorId]) {
      ultimaEvalPorTrabajador[ev.trabajadorId] = ev;
    }
  }

  const datos = Object.values(ultimaEvalPorTrabajador).map((ev) => {
    const t = trabajadorMap[ev.trabajadorId];
    return {
      trabajadorId: ev.trabajadorId,
      nombre: t ? `${t.apellidos}, ${t.nombre}` : "Desconocido",
      centroId: t?.centroId ?? null,
      areaId: t?.areaId ?? null,
      colectivoId: t?.colectivoId ?? null,
      ncPotencial: ev.ncPotencialGlobal ?? "No evaluable",
      statusGlobal: ev.statusGlobalPct ? Number(ev.statusGlobalPct) : 0,
    };
  });

  return {
    datos,
    centros: allCentros,
    areas: allAreas,
    colectivos: allColectivos,
  };
}

// ==================== 9-BOX ====================

export async function getNineboxData() {
  const completadas = await db
    .select()
    .from(evaluaciones)
    .where(eq(evaluaciones.estado, "completada"))
    .orderBy(desc(evaluaciones.fechaEvaluacion));

  const allTrabajadores = await db.select().from(trabajadores);
  const allCentros = await db.select().from(centros);
  const allAreas = await db.select().from(areas);
  const allPuestos = await db.select().from(puestos);
  const config = await db.select().from(nineboxConfig);

  const trabajadorMap = Object.fromEntries(
    allTrabajadores.map((t) => [t.id, t])
  );

  // Última evaluación por trabajador
  const ultimaEvalPorTrabajador: Record<string, (typeof completadas)[0]> = {};
  for (const ev of completadas) {
    if (!ultimaEvalPorTrabajador[ev.trabajadorId]) {
      ultimaEvalPorTrabajador[ev.trabajadorId] = ev;
    }
  }

  // Clasificar en 9-box
  function clasificar(statusPct: number, ncPotencial: string) {
    let desempeno: "bajo" | "medio" | "alto";
    if (statusPct < 40) desempeno = "bajo";
    else if (statusPct <= 70) desempeno = "medio";
    else desempeno = "alto";

    let potencial: "bajo" | "medio" | "alto";
    switch (ncPotencial) {
      case "Promocionable":
      case "Potencial Alto":
        potencial = "alto";
        break;
      case "Lateral":
        potencial = "medio";
        break;
      default:
        potencial = "bajo";
    }

    return { desempeno, potencial };
  }

  const trabajadoresEnGrid = Object.values(ultimaEvalPorTrabajador).map((ev) => {
    const t = trabajadorMap[ev.trabajadorId];
    const statusPct = ev.statusGlobalPct ? Number(ev.statusGlobalPct) : 0;
    const { desempeno, potencial } = clasificar(
      statusPct,
      ev.ncPotencialGlobal ?? ""
    );

    return {
      id: ev.trabajadorId,
      nombre: t ? `${t.apellidos}, ${t.nombre}` : "Desconocido",
      centroId: t?.centroId ?? null,
      areaId: t?.areaId ?? null,
      puestoId: t?.puestoId ?? null,
      desempeno,
      potencial,
      statusPct,
      ncPotencial: ev.ncPotencialGlobal ?? "-",
    };
  });

  return {
    trabajadores: trabajadoresEnGrid,
    config,
    centros: allCentros,
    areas: allAreas,
    puestos: allPuestos,
  };
}
