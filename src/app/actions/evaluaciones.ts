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
  itemsEvaluacion,
  planesAccion,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  calcularResultados,
  valorAPuntuacion,
  type RespuestaInput,
  type NivelInfo,
  type PilarInfo,
  type PlantillaConfig,
} from "@/lib/scoring-engine";

// ==================== QUERIES ====================

export async function getEvaluaciones() {
  return db
    .select()
    .from(evaluaciones)
    .orderBy(desc(evaluaciones.fechaEvaluacion));
}

export async function getEvaluacion(id: string) {
  const result = await db
    .select()
    .from(evaluaciones)
    .where(eq(evaluaciones.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getEvaluacionCompleta(id: string) {
  const evaluacion = await getEvaluacion(id);
  if (!evaluacion) return null;

  const plantilla = await db
    .select()
    .from(plantillasEvaluacion)
    .where(eq(plantillasEvaluacion.id, evaluacion.plantillaId))
    .limit(1);

  const trabajador = await db
    .select()
    .from(trabajadores)
    .where(eq(trabajadores.id, evaluacion.trabajadorId))
    .limit(1);

  const nivelesData = await db
    .select()
    .from(niveles)
    .where(eq(niveles.plantillaId, evaluacion.plantillaId))
    .orderBy(niveles.orden);

  const pilaresData = await db
    .select()
    .from(pilares)
    .where(eq(pilares.plantillaId, evaluacion.plantillaId))
    .orderBy(pilares.orden);

  const pilarIds = pilaresData.map((p) => p.id);
  const allItems = await db
    .select()
    .from(itemsEvaluacion)
    .where(eq(itemsEvaluacion.active, true))
    .orderBy(itemsEvaluacion.orden);
  const items = allItems.filter((item) => pilarIds.includes(item.pilarId));

  const respuestasData = await db
    .select()
    .from(respuestas)
    .where(eq(respuestas.evaluacionId, id));

  const resultadosData = await db
    .select()
    .from(resultadosPilar)
    .where(eq(resultadosPilar.evaluacionId, id));

  const planesData = await db
    .select()
    .from(planesAccion)
    .where(eq(planesAccion.evaluacionId, id));

  return {
    evaluacion,
    plantilla: plantilla[0],
    trabajador: trabajador[0],
    niveles: nivelesData,
    pilares: pilaresData,
    items,
    respuestas: respuestasData,
    resultados: resultadosData,
    planes: planesData,
  };
}

// ==================== CREAR EVALUACIÓN ====================

export async function crearEvaluacion(data: {
  trabajadorId: string;
  evaluadorId: string;
  plantillaId: number;
  fechaEvaluacion: string;
  antiguedadAnos: number;
}) {
  const result = await db
    .insert(evaluaciones)
    .values({
      trabajadorId: data.trabajadorId,
      evaluadorId: data.evaluadorId,
      plantillaId: data.plantillaId,
      fechaEvaluacion: data.fechaEvaluacion,
      antiguedadAnos: String(data.antiguedadAnos),
      estado: "borrador",
    })
    .returning({ id: evaluaciones.id });

  // Pre-crear las respuestas vacías para todos los ítems
  const pilaresData = await db
    .select()
    .from(pilares)
    .where(eq(pilares.plantillaId, data.plantillaId));
  const pilarIds = pilaresData.map((p) => p.id);

  const allItems = await db
    .select()
    .from(itemsEvaluacion)
    .where(eq(itemsEvaluacion.active, true));
  const items = allItems.filter((item) => pilarIds.includes(item.pilarId));

  if (items.length > 0) {
    await db.insert(respuestas).values(
      items.map((item) => ({
        evaluacionId: result[0].id,
        itemId: item.id,
        valor: null,
        puntuacion: null,
      }))
    );
  }

  revalidatePath("/evaluaciones");
  return { success: true, id: result[0].id };
}

// ==================== GUARDAR RESPUESTA (AUTO-SAVE) ====================

export async function guardarRespuesta(
  evaluacionId: string,
  itemId: number,
  valor: "alcanzado" | "parcialmente_alcanzado" | "no_alcanzado"
) {
  const puntuacion = valorAPuntuacion(valor);

  // Upsert: actualizar si existe, insertar si no
  const existing = await db
    .select()
    .from(respuestas)
    .where(
      and(
        eq(respuestas.evaluacionId, evaluacionId),
        eq(respuestas.itemId, itemId)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(respuestas)
      .set({ valor, puntuacion, updatedAt: new Date() })
      .where(eq(respuestas.id, existing[0].id));
  } else {
    await db.insert(respuestas).values({
      evaluacionId,
      itemId,
      valor,
      puntuacion,
    });
  }

  // Cambiar estado a en_curso si era borrador
  const evaluacion = await getEvaluacion(evaluacionId);
  if (evaluacion && evaluacion.estado === "borrador") {
    await db
      .update(evaluaciones)
      .set({ estado: "en_curso", updatedAt: new Date() })
      .where(eq(evaluaciones.id, evaluacionId));
  }

  return { success: true };
}

// ==================== CALCULAR RESULTADOS ====================

async function ejecutarMotorCalculo(evaluacionId: string) {
  const data = await getEvaluacionCompleta(evaluacionId);
  if (!data) throw new Error("Evaluación no encontrada");

  const { evaluacion, plantilla, niveles: nivelesData, pilares: pilaresData, items, respuestas: respuestasData } = data;

  // Preparar inputs para el motor
  const respuestasInput: RespuestaInput[] = respuestasData.map((r) => {
    const item = items.find((i) => i.id === r.itemId);
    const nivel = nivelesData.find((n) => n.id === item?.nivelId);
    return {
      itemId: r.itemId,
      pilarId: item?.pilarId ?? 0,
      nivelId: item?.nivelId ?? 0,
      nivelOrden: nivel?.orden ?? 0,
      valor: r.valor as RespuestaInput["valor"],
    };
  });

  const pilaresInput: PilarInfo[] = pilaresData.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    orden: p.orden,
  }));

  const nivelesInput: NivelInfo[] = nivelesData.map((n) => ({
    id: n.id,
    nombre: n.nombre,
    codigo: n.codigo,
    orden: n.orden,
  }));

  const config: PlantillaConfig = {
    umbralAntiguedadBaja: Number(plantilla.umbralAntiguedadBaja) || 80,
    umbralAntiguedadAlta: Number(plantilla.umbralAntiguedadAlta) || 95,
    anosUmbral: plantilla.anosUmbral ?? 3,
    ncEsperadoDefault: plantilla.ncEsperadoDefault ?? "Avanzado",
  };

  const antiguedadAnos = Number(evaluacion.antiguedadAnos);

  // Ejecutar motor
  const resultados = calcularResultados(
    respuestasInput,
    pilaresInput,
    nivelesInput,
    antiguedadAnos,
    config
  );

  // Persistir resultados por pilar (upsert)
  for (const rp of resultados.resultadosPilar) {
    const existing = await db
      .select()
      .from(resultadosPilar)
      .where(
        and(
          eq(resultadosPilar.evaluacionId, evaluacionId),
          eq(resultadosPilar.pilarId, rp.pilarId)
        )
      )
      .limit(1);

    const puntuacionesMap: Record<string, string | null> = {
      puntuacionNivel1: null,
      puntuacionNivel2: null,
      puntuacionNivel3: null,
      puntuacionNivel4: null,
    };
    for (const pn of rp.puntuacionesPorNivel) {
      const key = `puntuacionNivel${pn.nivelOrden}` as keyof typeof puntuacionesMap;
      if (key in puntuacionesMap) {
        puntuacionesMap[key] = String(pn.porcentaje);
      }
    }

    const values = {
      evaluacionId,
      pilarId: rp.pilarId,
      nivelRealId: rp.nivelRealId,
      ncEsperado: rp.ncEsperado,
      puntuacionNivel1: puntuacionesMap.puntuacionNivel1,
      puntuacionNivel2: puntuacionesMap.puntuacionNivel2,
      puntuacionNivel3: puntuacionesMap.puntuacionNivel3,
      puntuacionNivel4: puntuacionesMap.puntuacionNivel4,
    };

    if (existing[0]) {
      await db
        .update(resultadosPilar)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(resultadosPilar.id, existing[0].id));
    } else {
      await db.insert(resultadosPilar).values(values);
    }
  }

  // Persistir resultados globales en la evaluación
  await db
    .update(evaluaciones)
    .set({
      ncPotencialGlobal: resultados.ncPotencialGlobal,
      statusGlobalPct: String(resultados.statusGlobalPct),
      updatedAt: new Date(),
    })
    .where(eq(evaluaciones.id, evaluacionId));

  return resultados;
}

export async function calcularResultadosParciales(evaluacionId: string) {
  const resultados = await ejecutarMotorCalculo(evaluacionId);
  revalidatePath(`/evaluaciones/${evaluacionId}`);
  return { success: true, resultados };
}

// ==================== FINALIZAR EVALUACIÓN ====================

export async function finalizarEvaluacion(evaluacionId: string) {
  await ejecutarMotorCalculo(evaluacionId);

  await db
    .update(evaluaciones)
    .set({ estado: "completada", updatedAt: new Date() })
    .where(eq(evaluaciones.id, evaluacionId));

  revalidatePath(`/evaluaciones/${evaluacionId}`);
  revalidatePath("/evaluaciones");
  return { success: true };
}

// ==================== OBSERVACIONES ====================

export async function guardarObservaciones(evaluacionId: string, observaciones: string) {
  await db
    .update(evaluaciones)
    .set({ observaciones, updatedAt: new Date() })
    .where(eq(evaluaciones.id, evaluacionId));
  revalidatePath(`/evaluaciones/${evaluacionId}`);
  return { success: true };
}

// ==================== PLANES DE ACCIÓN ====================

export async function crearPlanAccion(data: {
  evaluacionId: string;
  pilarId?: number;
  tipoAccion?: string;
  accionConcreta: string;
  fechaInicio?: string;
  fechaSeguimiento?: string;
  observaciones?: string;
}) {
  await db.insert(planesAccion).values({
    evaluacionId: data.evaluacionId,
    pilarId: data.pilarId ?? null,
    tipoAccion: data.tipoAccion ?? null,
    accionConcreta: data.accionConcreta,
    fechaInicio: data.fechaInicio ?? null,
    fechaSeguimiento: data.fechaSeguimiento ?? null,
    observaciones: data.observaciones ?? null,
  });
  revalidatePath(`/evaluaciones/${data.evaluacionId}`);
  return { success: true };
}

export async function eliminarPlanAccion(planId: string, evaluacionId: string) {
  await db.delete(planesAccion).where(eq(planesAccion.id, planId));
  revalidatePath(`/evaluaciones/${evaluacionId}`);
  return { success: true };
}

// ==================== ELIMINAR EVALUACIÓN (solo borrador) ====================

export async function eliminarEvaluacion(id: string) {
  const evaluacion = await getEvaluacion(id);
  if (!evaluacion) return { error: "No encontrada" };
  if (evaluacion.estado !== "borrador" && evaluacion.estado !== "en_curso") {
    return { error: "Solo se pueden eliminar evaluaciones en borrador o en curso" };
  }

  await db.delete(evaluaciones).where(eq(evaluaciones.id, id));
  revalidatePath("/evaluaciones");
  return { success: true };
}
