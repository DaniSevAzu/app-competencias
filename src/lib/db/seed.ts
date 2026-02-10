/**
 * Seed script para poblar la BD con datos de demo.
 *
 * Ejecutar: npx tsx src/lib/db/seed.ts
 *
 * Incluye:
 * - 3 usuarios (admin, evaluador, consulta)
 * - 5 centros, 12 áreas, 6 colectivos, UAPs
 * - 173 puestos del catálogo real (desde Excel)
 * - Plantilla "Competencias SyP - Línea de Mando" con 6 pilares, 4 niveles y 69 ítems
 * - 50 trabajadores ficticios
 * - ~30 evaluaciones completadas con respuestas variadas
 * - Evaluaciones históricas para evolución temporal
 * - Planes de acción de ejemplo
 * - Configuración 9-Box
 * - Tipos de plan de acción
 */

import "dotenv/config";
import { db } from "./index";
import {
  users,
  centros,
  areas,
  colectivos,
  uaps,
  puestos,
  trabajadores,
  plantillasEvaluacion,
  niveles,
  pilares,
  itemsEvaluacion,
  nineboxConfig,
  tiposAccion,
  evaluaciones,
  respuestas,
  resultadosPilar,
  planesAccion,
} from "./schema";
import { eq } from "drizzle-orm";
import {
  calcularResultados,
  valorAPuntuacion,
  type RespuestaInput,
  type NivelInfo,
  type PilarInfo,
  type PlantillaConfig,
} from "@/lib/scoring-engine";

// ==================== HELPERS ====================

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ==================== DATA ====================

const NOMBRES = [
  "Antonio", "María", "Manuel", "Carmen", "José", "Ana", "Francisco", "Laura",
  "David", "Marta", "Carlos", "Elena", "Javier", "Isabel", "Miguel", "Patricia",
  "Pedro", "Lucía", "Alejandro", "Cristina", "Rafael", "Sandra", "Fernando",
  "Raquel", "Daniel", "Beatriz", "Sergio", "Nuria", "Jorge", "Pilar",
  "Alberto", "Rosa", "Pablo", "Silvia", "Andrés", "Teresa", "Álvaro", "Sofía",
  "Luis", "Alicia", "Ricardo", "Eva", "Rubén", "Inés", "Óscar", "Irene",
  "Adrián", "Natalia", "Iván", "Verónica",
];

const APELLIDOS = [
  "García López", "Martínez Fernández", "López Rodríguez", "González Pérez",
  "Rodríguez Sánchez", "Fernández Ruiz", "Sánchez Díaz", "Pérez Torres",
  "Ruiz Moreno", "Díaz Jiménez", "Torres Navarro", "Moreno Romero",
  "Jiménez Domínguez", "Navarro Gil", "Romero Serrano", "Domínguez Blanco",
  "Gil Ortega", "Serrano Rubio", "Blanco Molina", "Ortega Morales",
  "Rubio Suárez", "Molina Castro", "Morales Delgado", "Suárez Prieto",
  "Castro Vega", "Delgado Mendoza", "Prieto León", "Vega Ramos",
  "Mendoza Crespo", "León Herrero", "Ramos Cabrera", "Crespo Medina",
  "Herrero Santos", "Cabrera Flores", "Medina Aguilar", "Santos Guerrero",
  "Flores Campos", "Aguilar Reyes", "Guerrero Calvo", "Campos Vidal",
  "Reyes Cruz", "Calvo Gallego", "Vidal Nieto", "Cruz Peña",
  "Gallego Carmona", "Nieto Lozano", "Peña Cortés", "Carmona Soto",
  "Lozano Pascual", "Cortés Herrera",
];

const CENTROS_DATA = [
  { codigo: "22", nombre: "Centro Azucarera Toro" },
  { codigo: "31", nombre: "Centro Miranda de Ebro" },
  { codigo: "44", nombre: "Centro La Bañeza" },
  { codigo: "55", nombre: "Centro Jerez de la Frontera" },
  { codigo: "66", nombre: "Centro Guadalete" },
];

const AREAS_DATA = [
  "Operaciones", "Mantenimiento", "Calidad", "Laboratorio", "Logística",
  "Administración", "RRHH", "SyP", "Ingeniería", "Compras", "IT", "Agrícola",
];

const COLECTIVOS_DATA = [
  "Línea de Mando", "MOD", "MOI", "Técnicos", "Administrativos", "Dirección",
];

const UAPS_DATA = [
  { codigo: "Mto1", nombre: "Mantenimiento Mecánico" },
  { codigo: "Mto2", nombre: "Mantenimiento Eléctrico" },
  { codigo: "Fab1", nombre: "Fabricación Zona 1" },
  { codigo: "Fab2", nombre: "Fabricación Zona 2" },
  { codigo: "CES", nombre: "Coordinación CES" },
  { codigo: "Env1", nombre: "Envasado" },
  { codigo: "Lab", nombre: "Laboratorio" },
  { codigo: "Alm", nombre: "Almacén" },
];

const TIPOS_ACCION_DATA = [
  "Mentoring", "Tutelaje", "Formación Técnica", "Supervisión",
  "Plan de Carrera", "Promoción", "Formación Relacional",
];

const NINEBOX_DATA = [
  { potencial: "alto" as const, desempeno: "alto" as const, etiqueta: "Futuro líder", recomendacion: "Listo para promoción. Asignar proyectos estratégicos.", color: "#22c55e" },
  { potencial: "alto" as const, desempeno: "medio" as const, etiqueta: "Alto potencial", recomendacion: "Necesita desarrollo. Plan de mentoring con directivos.", color: "#86efac" },
  { potencial: "alto" as const, desempeno: "bajo" as const, etiqueta: "Enigma", recomendacion: "Investigar barreras. Posible desajuste puesto-capacidad.", color: "#fbbf24" },
  { potencial: "medio" as const, desempeno: "alto" as const, etiqueta: "Profesional clave", recomendacion: "Retener y reconocer. Movimiento lateral enriquecedor.", color: "#60a5fa" },
  { potencial: "medio" as const, desempeno: "medio" as const, etiqueta: "Contribuidor sólido", recomendacion: "Formación técnica específica. Establecer objetivos claros.", color: "#93c5fd" },
  { potencial: "medio" as const, desempeno: "bajo" as const, etiqueta: "Inconsistente", recomendacion: "Supervisión cercana. Plan de mejora con hitos medibles.", color: "#fca5a5" },
  { potencial: "bajo" as const, desempeno: "alto" as const, etiqueta: "Experto técnico", recomendacion: "Valorar como referente técnico. Evitar sobrecarga de gestión.", color: "#fbbf24" },
  { potencial: "bajo" as const, desempeno: "medio" as const, etiqueta: "En desarrollo", recomendacion: "Formación y seguimiento. Evaluar progreso en 6 meses.", color: "#f87171" },
  { potencial: "bajo" as const, desempeno: "bajo" as const, etiqueta: "Acción urgente", recomendacion: "Plan de acción inmediato. Considerar reubicación si no mejora.", color: "#ef4444" },
];

// Ítems de evaluación extraídos del Excel "Evaluación Competencias Línea de Mando"
// 6 pilares × 4 niveles = estructura completa con 69 ítems
const ITEMS_DATA: {
  pilar: string;
  nivel: string;
  texto: string;
  tipo: "subjetivo" | "objetivo";
  expectativa: string;
}[] = [
  // === CONTRATAS (16 ítems) ===
  { pilar: "Contratas", nivel: "01 Inicial", texto: "¿Cuáles son los criterios de deshomologación de contratas?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo las obligaciones y procedimientos de seguridad de las contratas que trabajan en la UAP" },
  { pilar: "Contratas", nivel: "01 Inicial", texto: "En caso necesario, ¿cómo compruebas si un trabajador/empresa está homologado?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo las obligaciones y procedimientos de seguridad de las contratas que trabajan en la UAP" },
  { pilar: "Contratas", nivel: "01 Inicial", texto: "¿Conoces clasificación de contratas según trabajos?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo las obligaciones y procedimientos de seguridad de las contratas que trabajan en la UAP" },
  { pilar: "Contratas", nivel: "01 Inicial", texto: "Seleccionar 3 personas de la UAP y comprobar conocimiento sobre procedimientos de seguridad de contratas", tipo: "objetivo", expectativa: "Conoce y explica a su equipo las obligaciones y procedimientos de seguridad de las contratas que trabajan en la UAP" },
  { pilar: "Contratas", nivel: "02 Básico", texto: "¿Qué documentos apruebas tú en la gestión de contratas?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo las obligaciones y procedimientos de seguridad de las contratas que trabajan en la UAP" },
  { pilar: "Contratas", nivel: "02 Básico", texto: "Seleccionar aleatoriamente 3 SOLPED y comprobar clasificación correcta", tipo: "objetivo", expectativa: "Conoce y explica a su equipo las obligaciones y procedimientos de seguridad de las contratas que trabajan en la UAP" },
  { pilar: "Contratas", nivel: "03 Avanzado", texto: "¿Qué haces cuando llega una contrata al centro por 1ª vez?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "03 Avanzado", texto: "Respecto al panel de contratas ¿Dónde está, qué información hay y cómo la utilizas?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "03 Avanzado", texto: "¿Cómo planificas los trabajos y el seguimiento de las contratas?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "03 Avanzado", texto: "Visitar el panel y comprobar si está ok con las contratas del día", tipo: "objetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "03 Avanzado", texto: "Seleccionar aleatoriamente 2 Permisos/Bloqueos de esta UAP en la última semana", tipo: "objetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "03 Avanzado", texto: "Todos los trabajos de contratas completados están finalizados en el sistema", tipo: "objetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "04 Experto", texto: "¿Qué dinámicas/herramientas/buenas prácticas has implementado para mejorar la seguridad de contratas?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "04 Experto", texto: "Identifica 3 aspectos positivos/ideas de mejora que hayan surgido de la gestión de contratas", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "04 Experto", texto: "Seleccionar a un trabajador de contrata y comprobar que han recibido formación/información", tipo: "objetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },
  { pilar: "Contratas", nivel: "04 Experto", texto: "Existen NR puestas por contratas que están trabajando en la UAP", tipo: "objetivo", expectativa: "Conoce y explica a su equipo y las contratas las obligaciones y procedimientos de seguridad" },

  // === ESTRATEGIA (11 ítems) ===
  { pilar: "Estrategia", nivel: "01 Inicial", texto: "¿Cuáles son los Proyectos Clave de Salud y Prevención?", tipo: "subjetivo", expectativa: "Conoce e informa con cierta regularidad sobre los proyectos clave y KPIs de SyP" },
  { pilar: "Estrategia", nivel: "01 Inicial", texto: "Enumera alguno de los KPIs asociados a cada Proyecto Clave", tipo: "subjetivo", expectativa: "Conoce e informa con cierta regularidad sobre los proyectos clave y KPIs de SyP" },
  { pilar: "Estrategia", nivel: "01 Inicial", texto: "Puntuación del Traspaso de Inform. Visión 360º", tipo: "objetivo", expectativa: "Conoce e informa con cierta regularidad sobre los proyectos clave y KPIs de SyP" },
  { pilar: "Estrategia", nivel: "02 Básico", texto: "¿Qué tipo de tareas planificas?", tipo: "subjetivo", expectativa: "Planifica distribuyendo tareas concretas a todo el personal de la UAP" },
  { pilar: "Estrategia", nivel: "02 Básico", texto: "¿Cómo planificas y haces seguimiento de esas tareas?", tipo: "subjetivo", expectativa: "Planifica distribuyendo tareas concretas a todo el personal de la UAP" },
  { pilar: "Estrategia", nivel: "02 Básico", texto: "Explicar/Mostrar la planificación con las tareas concretas asignadas", tipo: "objetivo", expectativa: "Planifica distribuyendo tareas concretas a todo el personal de la UAP" },
  { pilar: "Estrategia", nivel: "03 Avanzado", texto: "¿Qué acciones llevas a cabo en tu UAP para dar visibilidad a la Estrategia de SyP?", tipo: "subjetivo", expectativa: "Da visibilidad e integra la implantación de la Estrategia de SyP en la gestión diaria" },
  { pilar: "Estrategia", nivel: "03 Avanzado", texto: "Resultado del Desempeño Preventivo del mes anterior al menos en nivel Bueno", tipo: "objetivo", expectativa: "Da visibilidad e integra la implantación de la Estrategia de SyP en la gestión diaria" },
  { pilar: "Estrategia", nivel: "04 Experto", texto: "¿Cómo has colaborado con otras UAPs para llegar a un Desempeño Preventivo Excelente?", tipo: "subjetivo", expectativa: "Crea sinergias con otras UAPs para alcanzar el Desempeño Preventivo Excelente" },
  { pilar: "Estrategia", nivel: "04 Experto", texto: "¿Qué propuestas has enviado a SyP para la Estrategia del próximo año?", tipo: "subjetivo", expectativa: "Crea sinergias con otras UAPs para alcanzar el Desempeño Preventivo Excelente" },
  { pilar: "Estrategia", nivel: "04 Experto", texto: "Estar en nivel Excelente del Desempeño Preventivo y disponer de evidencias de propuestas", tipo: "objetivo", expectativa: "Crea sinergias con otras UAPs para alcanzar el Desempeño Preventivo Excelente" },

  // === GESTIÓN DE RIESGOS - PLAN ACCIÓN (11 ítems) ===
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "01 Inicial", texto: "Enumera alguno de los Riesgos Críticos y principales medidas preventivas", tipo: "subjetivo", expectativa: "Explica con facilidad cuáles son los riesgos críticos de negocio" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "01 Inicial", texto: "Seleccionar 3 personas de la UAP y comprobar conocimiento sobre riesgos críticos", tipo: "objetivo", expectativa: "Explica con facilidad cuáles son los riesgos críticos de negocio" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "02 Básico", texto: "¿Cuáles son las acciones prioritarias (I-II) pendientes de tu UAP?", tipo: "subjetivo", expectativa: "Tiene predisposición para informar y mantener conversaciones sobre riesgos" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "02 Básico", texto: "% Avance acciones prioridad I y II de su UAP al menos 70%", tipo: "objetivo", expectativa: "Tiene predisposición para informar y mantener conversaciones sobre riesgos" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "03 Avanzado", texto: "¿Cómo compartes las acciones de tu UAP para impulsar su cierre?", tipo: "subjetivo", expectativa: "Informa de manera clara y regular sobre acciones, prioridades y estado de gestión de riesgos" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "03 Avanzado", texto: "¿Cómo/con qué periodicidad planificas y haces seguimiento en estándares?", tipo: "subjetivo", expectativa: "Informa de manera clara y regular sobre acciones, prioridades y estado de gestión de riesgos" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "03 Avanzado", texto: "Resultado del Desempeño Preventivo - Entorno Seguro del mes anterior al menos en nivel Bueno", tipo: "objetivo", expectativa: "Informa de manera clara y regular sobre acciones, prioridades y estado de gestión de riesgos" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "04 Experto", texto: "¿Cómo aseguras la resolución de acciones a lo largo de todo el año?", tipo: "subjetivo", expectativa: "Da visibilidad e influye en otros para conseguir una adecuada gestión de riesgos" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "04 Experto", texto: "Indica alguna acción en la que has dado soporte a otras UAPs", tipo: "subjetivo", expectativa: "Da visibilidad e influye en otros para conseguir una adecuada gestión de riesgos" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "04 Experto", texto: "¿Por qué tu gestión de acciones es excelente?", tipo: "subjetivo", expectativa: "Da visibilidad e influye en otros para conseguir una adecuada gestión de riesgos" },
  { pilar: "Gestión de Riesgos - Plan de Acción", nivel: "04 Experto", texto: "Estar en nivel Excelente del Desempeño Preventivo y existe un plan documentado", tipo: "objetivo", expectativa: "Da visibilidad e influye en otros para conseguir una adecuada gestión de riesgos" },

  // === GESTIÓN DE RIESGOS - DÍA A DÍA (11 ítems) ===
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "01 Inicial", texto: "¿Conoces cuáles son los Comportamientos Clave y algunas de las reglas que salvan vidas?", tipo: "subjetivo", expectativa: "Conoce y recuerda a su equipo con cierta regularidad los comportamientos clave" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "01 Inicial", texto: "Comprobar que ha realizado NR en el último año", tipo: "objetivo", expectativa: "Conoce y recuerda a su equipo con cierta regularidad los comportamientos clave" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "02 Básico", texto: "¿Cuáles son las preguntas mínimas (de SyP) a compartir en el cambio de turno?", tipo: "subjetivo", expectativa: "En el cambio de turno comparte información clave de SyP con su equipo" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "02 Básico", texto: "Seleccionar un bloqueo y auditar ficha, bloqueo en campo y conocimiento del operador", tipo: "objetivo", expectativa: "En el cambio de turno comparte información clave de SyP con su equipo" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "03 Avanzado", texto: "¿Cuáles son las 2 últimas conversaciones de seguridad mantenidas?", tipo: "subjetivo", expectativa: "Revisa y planifica las incidencias y tareas de gestión diaria de riesgos" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "03 Avanzado", texto: "¿Qué situación motivó la conversación, sobre qué y con quién?", tipo: "subjetivo", expectativa: "Revisa y planifica las incidencias y tareas de gestión diaria de riesgos" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "03 Avanzado", texto: "¿Cuál fue el último reconocimiento positivo?", tipo: "subjetivo", expectativa: "Revisa y planifica las incidencias y tareas de gestión diaria de riesgos" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "03 Avanzado", texto: "Comprobar 2 obras abiertas de Condiciones de Trabajo y verificar estado", tipo: "objetivo", expectativa: "Revisa y planifica las incidencias y tareas de gestión diaria de riesgos" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "04 Experto", texto: "¿Cómo gestionas durante campaña aquellas incidencias en proceso que no son urgentes?", tipo: "subjetivo", expectativa: "Da visibilidad a la importancia de la gestión diaria de riesgos" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "04 Experto", texto: "En tus últimas vueltas por fábrica ¿qué situaciones de riesgo has detectado?", tipo: "subjetivo", expectativa: "Da visibilidad a la importancia de la gestión diaria de riesgos" },
  { pilar: "Gestión de Riesgos - Día a Día", nivel: "04 Experto", texto: "Seleccionar a un trabajador de la UAP durante la visita a un área y evaluar conocimiento", tipo: "objetivo", expectativa: "Da visibilidad a la importancia de la gestión diaria de riesgos" },

  // === GESTIÓN DEL CAMBIO (10 ítems) ===
  { pilar: "Gestión del Cambio", nivel: "01 Inicial", texto: "¿En qué consiste el Procedimiento Gestión del Cambio?", tipo: "subjetivo", expectativa: "Conoce y explica a su equipo el protocolo de Gestión del Cambio" },
  { pilar: "Gestión del Cambio", nivel: "01 Inicial", texto: "Seleccionar 3 personas de la UAP y comprobar conocimiento sobre Gestión del Cambio", tipo: "objetivo", expectativa: "Conoce y explica a su equipo el protocolo de Gestión del Cambio" },
  { pilar: "Gestión del Cambio", nivel: "02 Básico", texto: "¿Cuándo lo aplicas? (Indicar algún ejemplo/s)", tipo: "subjetivo", expectativa: "Explica a su equipo el protocolo de Gestión del Cambio en Equipos e Instalaciones" },
  { pilar: "Gestión del Cambio", nivel: "02 Básico", texto: "¿Cómo queda constancia? (Especificar tanto para ingeniería como para mantenimiento)", tipo: "subjetivo", expectativa: "Explica a su equipo el protocolo de Gestión del Cambio en Equipos e Instalaciones" },
  { pilar: "Gestión del Cambio", nivel: "02 Básico", texto: "Seleccionar 1 obra/mantenimiento en su UAP y comprobar que se ha aplicado GdC", tipo: "objetivo", expectativa: "Explica a su equipo el protocolo de Gestión del Cambio en Equipos e Instalaciones" },
  { pilar: "Gestión del Cambio", nivel: "03 Avanzado", texto: "¿Qué aspectos de SyP tienes en cuenta para asignar tareas a trabajadores?", tipo: "subjetivo", expectativa: "De manera frecuente habla con su equipo sobre Gestión del Cambio" },
  { pilar: "Gestión del Cambio", nivel: "03 Avanzado", texto: "Una vez ejecutado un trabajo, ¿te han comunicado algún posible cambio no previsto?", tipo: "subjetivo", expectativa: "De manera frecuente habla con su equipo sobre Gestión del Cambio" },
  { pilar: "Gestión del Cambio", nivel: "04 Experto", texto: "Indica una iniciativa o propuesta que hayas hecho ¿Cómo has liderado su implementación?", tipo: "subjetivo", expectativa: "Sensibiliza e insta a su equipo y a otros a adoptar la Gestión del Cambio" },
  { pilar: "Gestión del Cambio", nivel: "04 Experto", texto: "Indica qué acciones estás llevando a cabo con otros para promover la Gestión del Cambio", tipo: "subjetivo", expectativa: "Sensibiliza e insta a su equipo y a otros a adoptar la Gestión del Cambio" },
  { pilar: "Gestión del Cambio", nivel: "04 Experto", texto: "Seleccionar 1 obra/mantenimiento fuera de su UAP y comprobar que se ha aplicado GdC", tipo: "objetivo", expectativa: "Sensibiliza e insta a su equipo y a otros a adoptar la Gestión del Cambio" },

  // === INCIDENTES (10 ítems) ===
  { pilar: "Incidentes", nivel: "01 Inicial", texto: "En caso de accidente e incidente ¿Qué tienes que hacer?", tipo: "subjetivo", expectativa: "Comunica los accidentes del personal a su cargo e incidentes relevantes" },
  { pilar: "Incidentes", nivel: "01 Inicial", texto: "Puntuación de participación del mando en investigación", tipo: "objetivo", expectativa: "Comunica los accidentes del personal a su cargo e incidentes relevantes" },
  { pilar: "Incidentes", nivel: "02 Básico", texto: "¿Cómo y con quién compartes los accidentes/incidentes?", tipo: "subjetivo", expectativa: "Comunica y registra en el sistema los accidentes e incidentes" },
  { pilar: "Incidentes", nivel: "02 Básico", texto: "Existen acciones abiertas autogestionables que deriven de un AT o incidente", tipo: "objetivo", expectativa: "Comunica y registra en el sistema los accidentes e incidentes" },
  { pilar: "Incidentes", nivel: "03 Avanzado", texto: "¿Qué información compartes sobre un accidente/incidente? (Detallar)", tipo: "subjetivo", expectativa: "Comunica y registra dentro del turno los accidentes e incidentes" },
  { pilar: "Incidentes", nivel: "03 Avanzado", texto: "Además del registro inmediato en SAP ¿De qué otra forma participas en la investigación?", tipo: "subjetivo", expectativa: "Comunica y registra dentro del turno los accidentes e incidentes" },
  { pilar: "Incidentes", nivel: "03 Avanzado", texto: "KPI 360 - traspaso de información por encima de 6,5 y seleccionar 1 AT para verificar", tipo: "objetivo", expectativa: "Comunica y registra dentro del turno los accidentes e incidentes" },
  { pilar: "Incidentes", nivel: "04 Experto", texto: "¿Qué acciones de otros centros derivadas de AT has implementado en tu UAP?", tipo: "subjetivo", expectativa: "Comunica y participa activamente en la investigación de accidentes e incidentes" },
  { pilar: "Incidentes", nivel: "04 Experto", texto: "¿En cuántos GRPs has participado este año? Explicación breve", tipo: "subjetivo", expectativa: "Comunica y participa activamente en la investigación de accidentes e incidentes" },
  { pilar: "Incidentes", nivel: "04 Experto", texto: "Tener 3 acciones planificadas/implementadas de un AT de otro centro", tipo: "objetivo", expectativa: "Comunica y participa activamente en la investigación de accidentes e incidentes" },
];

// ==================== MAIN SEED ====================

async function seed() {
  console.log("=== Iniciando seed de datos de demo ===\n");

  // 0. Limpiar datos existentes (orden inverso por FK)
  console.log("0. Limpiando datos existentes...");
  await db.delete(planesAccion);
  await db.delete(resultadosPilar);
  await db.delete(respuestas);
  await db.delete(evaluaciones);
  await db.delete(trabajadores);
  await db.delete(itemsEvaluacion);
  await db.delete(pilares);
  await db.delete(niveles);
  await db.delete(plantillasEvaluacion);
  await db.delete(nineboxConfig);
  await db.delete(tiposAccion);
  await db.delete(uaps);
  await db.delete(puestos);
  await db.delete(colectivos);
  await db.delete(areas);
  await db.delete(centros);
  await db.delete(users);
  console.log("   Tablas limpiadas");

  // 1. Usuarios
  console.log("1. Creando usuarios...");
  await db.insert(users).values([
    { email: "admin@demo.com", name: "Admin Demo", role: "admin" },
    { email: "evaluador@demo.com", name: "Ada Fanjul", role: "evaluador" },
    { email: "consulta@demo.com", name: "Carlos López", role: "consulta" },
  ]).onConflictDoNothing();
  const allUsers = await db.select().from(users);
  const adminUser = allUsers.find(u => u.role === "admin")!;
  const evaluadorUser = allUsers.find(u => u.role === "evaluador")!;
  console.log(`   ${allUsers.length} usuarios`);

  // 2. Centros
  console.log("2. Creando centros...");
  for (const c of CENTROS_DATA) {
    await db.insert(centros).values(c).onConflictDoNothing();
  }
  const allCentros = await db.select().from(centros);
  console.log(`   ${allCentros.length} centros`);

  // 3. Áreas
  console.log("3. Creando áreas...");
  for (const nombre of AREAS_DATA) {
    await db.insert(areas).values({ nombre }).onConflictDoNothing();
  }
  const allAreas = await db.select().from(areas);
  console.log(`   ${allAreas.length} áreas`);

  // 4. Colectivos
  console.log("4. Creando colectivos...");
  for (const nombre of COLECTIVOS_DATA) {
    await db.insert(colectivos).values({ nombre }).onConflictDoNothing();
  }
  const allColectivos = await db.select().from(colectivos);
  const colectivoLineaMando = allColectivos.find(c => c.nombre === "Línea de Mando")!;
  console.log(`   ${allColectivos.length} colectivos`);

  // 5. UAPs (distribuidas por centro)
  console.log("5. Creando UAPs...");
  for (const centro of allCentros) {
    for (const u of UAPS_DATA) {
      await db.insert(uaps).values({
        codigo: `${u.codigo}-${centro.codigo}`,
        nombre: u.nombre,
        centroId: centro.id,
      }).onConflictDoNothing();
    }
  }
  const allUaps = await db.select().from(uaps);
  console.log(`   ${allUaps.length} UAPs`);

  // 6. Puestos (desde el Excel)
  console.log("6. Creando puestos desde Excel...");
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("docs/Agrupación Puestos - Modelo Competencias.xlsx");
  const ws = wb.worksheets[0];
  let puestosCreados = 0;
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const codigo = row.getCell(1).value ? String(row.getCell(1).value).trim() : null;
    const nombre = row.getCell(2).value ? String(row.getCell(2).value).trim() : null;
    if (!codigo || !nombre) continue;
    const areaNombre = row.getCell(3).value ? String(row.getCell(3).value).trim() : null;
    const area = areaNombre ? allAreas.find(a => a.nombre.toLowerCase() === areaNombre.toLowerCase()) : null;
    await db.insert(puestos).values({
      codigo,
      nombre,
      areaId: area?.id ?? null,
      perfilSyp: row.getCell(4).value ? String(row.getCell(4).value).trim() : null,
      subperfilSyp: row.getCell(5).value ? String(row.getCell(5).value).trim() : null,
      agrupacionComp: row.getCell(6).value ? String(row.getCell(6).value).trim() : null,
      ambito: row.getCell(7).value ? String(row.getCell(7).value).trim() : null,
    }).onConflictDoNothing();
    puestosCreados++;
  }
  const allPuestos = await db.select().from(puestos);
  console.log(`   ${allPuestos.length} puestos`);

  // 7. Tipos de acción
  console.log("7. Creando tipos de acción...");
  for (const nombre of TIPOS_ACCION_DATA) {
    await db.insert(tiposAccion).values({ nombre }).onConflictDoNothing();
  }
  console.log(`   ${TIPOS_ACCION_DATA.length} tipos`);

  // 8. Configuración 9-Box
  console.log("8. Creando configuración 9-Box...");
  for (const cfg of NINEBOX_DATA) {
    await db.insert(nineboxConfig).values(cfg).onConflictDoNothing();
  }
  console.log("   9 celdas configuradas");

  // 9. Plantilla de evaluación + niveles + pilares + ítems
  console.log("9. Creando plantilla de evaluación...");
  const [plantilla] = await db.insert(plantillasEvaluacion).values({
    nombre: "Competencias SyP - Línea de Mando",
    descripcion: "Plantilla estándar para evaluar competencias de Seguridad y Prevención del colectivo Línea de Mando",
    colectivoId: colectivoLineaMando.id,
    ncEsperadoDefault: "Avanzado",
    umbralAntiguedadBaja: "80",
    umbralAntiguedadAlta: "95",
    anosUmbral: 3,
  }).returning();
  console.log(`   Plantilla: ${plantilla.nombre} (id=${plantilla.id})`);

  // Niveles
  const NIVELES = [
    { nombre: "01 Inicial", codigo: "inicial", orden: 1 },
    { nombre: "02 Básico", codigo: "basico", orden: 2 },
    { nombre: "03 Avanzado", codigo: "avanzado", orden: 3 },
    { nombre: "04 Experto", codigo: "experto", orden: 4 },
  ];
  const nivelesCreados = [];
  for (const n of NIVELES) {
    const [created] = await db.insert(niveles).values({
      plantillaId: plantilla.id,
      ...n,
    }).returning();
    nivelesCreados.push(created);
  }
  console.log(`   ${nivelesCreados.length} niveles`);
  const nivelMap = Object.fromEntries(nivelesCreados.map(n => [n.nombre, n]));

  // Pilares
  const PILARES_NOMBRES = [
    "Estrategia", "Contratas", "Gestión de Riesgos - Plan de Acción",
    "Gestión de Riesgos - Día a Día", "Gestión del Cambio", "Incidentes",
  ];
  const pilaresCreados = [];
  for (let i = 0; i < PILARES_NOMBRES.length; i++) {
    const [created] = await db.insert(pilares).values({
      plantillaId: plantilla.id,
      nombre: PILARES_NOMBRES[i],
      orden: i + 1,
    }).returning();
    pilaresCreados.push(created);
  }
  console.log(`   ${pilaresCreados.length} pilares`);
  const pilarMap = Object.fromEntries(pilaresCreados.map(p => [p.nombre, p]));

  // Ítems (orden por grupo pilar+nivel)
  let itemCount = 0;
  const ordenPorGrupo: Record<string, number> = {};
  for (const item of ITEMS_DATA) {
    const pilar = pilarMap[item.pilar];
    const nivel = nivelMap[item.nivel];
    if (!pilar || !nivel) {
      console.warn(`   WARN: pilar="${item.pilar}" nivel="${item.nivel}" no encontrado`);
      continue;
    }
    const key = `${pilar.id}-${nivel.id}`;
    ordenPorGrupo[key] = (ordenPorGrupo[key] ?? 0) + 1;
    await db.insert(itemsEvaluacion).values({
      pilarId: pilar.id,
      nivelId: nivel.id,
      texto: item.texto,
      tipoCriterio: item.tipo,
      expectativa: item.expectativa,
      orden: ordenPorGrupo[key],
    });
    itemCount++;
  }
  console.log(`   ${itemCount} ítems de evaluación`);

  // 10. Trabajadores
  console.log("10. Creando trabajadores...");
  const puestosLineaMando = allPuestos.filter(
    p => p.perfilSyp?.toLowerCase().includes("mando") || p.agrupacionComp?.toLowerCase().includes("mando")
  );
  const puestosParaTrabajadores = puestosLineaMando.length > 0 ? puestosLineaMando : allPuestos.slice(0, 20);

  const trabajadoresCreados = [];
  for (let i = 0; i < 50; i++) {
    const centro = randomFrom(allCentros);
    const uapsDelCentro = allUaps.filter(u => u.centroId === centro.id);
    // Primeros 10: antigüedad alta (>3 años) para perfiles potencial_alto y promocionable
    // 10-14: antigüedad baja (<3 años) para perfil lateral (umbral 80%)
    const fechaInc = i < 10
      ? randomDate(new Date("2018-01-01"), new Date("2020-06-01"))
      : i < 15
        ? randomDate(new Date("2022-06-01"), new Date("2024-01-01"))
        : randomDate(new Date("2018-01-01"), new Date("2024-06-01"));

    const [t] = await db.insert(trabajadores).values({
      nombre: NOMBRES[i],
      apellidos: APELLIDOS[i],
      email: `${NOMBRES[i].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${APELLIDOS[i].split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@empresa.com`,
      puestoId: randomFrom(puestosParaTrabajadores).id,
      areaId: randomFrom(allAreas).id,
      centroId: centro.id,
      uapId: uapsDelCentro.length > 0 ? randomFrom(uapsDelCentro).id : null,
      colectivoId: i < 35 ? colectivoLineaMando.id : randomFrom(allColectivos).id,
      fechaIncorporacionPuesto: dateStr(fechaInc),
    }).returning();
    trabajadoresCreados.push(t);
  }
  console.log(`   ${trabajadoresCreados.length} trabajadores`);

  // 11. Evaluaciones con respuestas
  console.log("11. Creando evaluaciones con respuestas...");

  // Cargar items para la plantilla
  const allItems = await db.select().from(itemsEvaluacion);
  const pilarIds = pilaresCreados.map(p => p.id);
  const plantillaItems = allItems.filter(i => pilarIds.includes(i.pilarId));

  const nivelesInfo: NivelInfo[] = nivelesCreados.map(n => ({
    id: n.id,
    nombre: n.nombre,
    codigo: n.codigo,
    orden: n.orden,
  }));
  const pilaresInfo: PilarInfo[] = pilaresCreados.map(p => ({
    id: p.id,
    nombre: p.nombre,
    orden: p.orden,
  }));
  const config: PlantillaConfig = {
    umbralAntiguedadBaja: 80,
    umbralAntiguedadAlta: 95,
    anosUmbral: 3,
    ncEsperadoDefault: "Avanzado",
  };

  // Perfiles de respuesta para variación
  // Weights = probabilidad de "alcanzado" por nivel (1=Inicial, 2=Básico, 3=Avanzado, 4=Experto)
  const PERFILES = [
    { name: "potencial_alto", weights: [1.00, 1.00, 1.00, 1.00] }, // Todo alcanzado → Experto en todos → Potencial Alto
    { name: "promocionable", weights: [1.00, 1.00, 1.00, 0.30] },  // Alcanza Avanzado en todos → Promocionable
    { name: "lateral", weights: [1.00, 1.00, 0.80, 0.05] },          // Mayoría de pilares alcanzan Avanzado, ninguno Experto → Lateral
    { name: "avanzado", weights: [0.95, 0.90, 0.70, 0.30] },       // Bueno hasta avanzado
    { name: "basico", weights: [0.90, 0.70, 0.30, 0.10] },         // Bueno hasta básico
    { name: "inicial", weights: [0.70, 0.30, 0.10, 0.05] },        // Solo inicial
    { name: "irregular", weights: [0.80, 0.60, 0.80, 0.20] },      // Irregular
  ];

  function generateRespuesta(nivelOrden: number, profile: typeof PERFILES[0]): "alcanzado" | "parcialmente_alcanzado" | "no_alcanzado" {
    const prob = profile.weights[nivelOrden - 1] ?? 0.5;
    if (prob >= 1.0) return "alcanzado"; // Determinista para perfiles garantizados
    const rand = Math.random();
    if (rand < prob) return "alcanzado";
    if (rand < prob + (1 - prob) * 0.4) return "parcialmente_alcanzado";
    return "no_alcanzado";
  }

  let evalCount = 0;
  // 30 trabajadores con 1 evaluación completada + 10 con 2 evaluaciones (histórico)
  const trabajadoresConEval = trabajadoresCreados.slice(0, 40);
  const trabajadoresConHistorico = trabajadoresCreados.slice(0, 10);

  for (const trab of trabajadoresConEval) {
    // Solo evaluar los que son Línea de Mando
    if (trab.colectivoId !== colectivoLineaMando.id) continue;

    const fechas = [randomDate(new Date("2024-06-01"), new Date("2024-12-31"))];
    if (trabajadoresConHistorico.includes(trab)) {
      // Añadir evaluación histórica anterior
      fechas.unshift(randomDate(new Date("2023-06-01"), new Date("2024-05-30")));
    }

    for (const fechaEval of fechas) {
      const antiguedad =
        (fechaEval.getTime() - new Date(trab.fechaIncorporacionPuesto).getTime()) /
        (1000 * 60 * 60 * 24 * 365.25);
      // Asignar perfiles deterministas a los primeros trabajadores para garantizar variedad
      const trabIdx = trabajadoresConEval.indexOf(trab);
      let perfil;
      if (trabIdx >= 0 && trabIdx < 4) {
        perfil = PERFILES.find(p => p.name === "potencial_alto")!;
      } else if (trabIdx >= 4 && trabIdx < 10) {
        perfil = PERFILES.find(p => p.name === "promocionable")!;
      } else if (trabIdx >= 10 && trabIdx < 15) {
        perfil = PERFILES.find(p => p.name === "lateral")!;
      } else {
        perfil = randomFrom(PERFILES);
      }

      const [ev] = await db.insert(evaluaciones).values({
        trabajadorId: trab.id,
        evaluadorId: randomFrom([evaluadorUser.id, adminUser.id]),
        plantillaId: plantilla.id,
        fechaEvaluacion: dateStr(fechaEval),
        antiguedadAnos: String(Math.max(0, antiguedad).toFixed(2)),
        estado: "completada",
      }).returning();

      // Crear respuestas
      const respuestasInput: RespuestaInput[] = [];
      for (const item of plantillaItems) {
        const nivel = nivelesCreados.find(n => n.id === item.nivelId);
        const valor = generateRespuesta(nivel?.orden ?? 1, perfil);
        const puntuacion = valorAPuntuacion(valor);

        await db.insert(respuestas).values({
          evaluacionId: ev.id,
          itemId: item.id,
          valor,
          puntuacion,
        });

        respuestasInput.push({
          itemId: item.id,
          pilarId: item.pilarId,
          nivelId: item.nivelId,
          nivelOrden: nivel?.orden ?? 0,
          valor,
        });
      }

      // Ejecutar motor de cálculo
      const resultados = calcularResultados(
        respuestasInput,
        pilaresInfo,
        nivelesInfo,
        Math.max(0, antiguedad),
        config
      );

      // Persistir resultados por pilar
      for (const rp of resultados.resultadosPilar) {
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

        await db.insert(resultadosPilar).values({
          evaluacionId: ev.id,
          pilarId: rp.pilarId,
          nivelRealId: rp.nivelRealId,
          ncEsperado: rp.ncEsperado,
          ...puntuacionesMap,
        });
      }

      // Actualizar evaluación con resultados globales
      await db.update(evaluaciones).set({
        ncPotencialGlobal: resultados.ncPotencialGlobal,
        statusGlobalPct: String(resultados.statusGlobalPct),
      }).where(eq(evaluaciones.id, ev.id));

      evalCount++;
    }
  }
  console.log(`   ${evalCount} evaluaciones completadas con respuestas y resultados`);

  // 12. Planes de acción de ejemplo
  console.log("12. Creando planes de acción...");
  const completedEvals = await db.select().from(evaluaciones).where(eq(evaluaciones.estado, "completada"));
  const evalsParaPlanes = completedEvals.slice(0, 15);
  let planesCount = 0;

  const accionesEjemplo = [
    "Realizar formación específica sobre gestión de contratas",
    "Asignar mentor para mejorar competencias de liderazgo",
    "Participar en programa de tutela con mando senior",
    "Completar curso de gestión de riesgos nivel avanzado",
    "Realizar visitas cruzadas a otras UAPs",
    "Liderar un proyecto de mejora de seguridad",
    "Participar en investigación de incidentes de otro centro",
    "Presentar propuesta de mejora para la estrategia SyP",
    "Supervisar cumplimiento de estándares durante campaña",
    "Formación en conversaciones de seguridad efectivas",
  ];

  for (const ev of evalsParaPlanes) {
    const numPlanes = randomBetween(1, 3);
    for (let j = 0; j < numPlanes; j++) {
      await db.insert(planesAccion).values({
        evaluacionId: ev.id,
        pilarId: randomFrom(pilaresCreados).id,
        tipoAccion: randomFrom(TIPOS_ACCION_DATA),
        accionConcreta: randomFrom(accionesEjemplo),
        fechaInicio: dateStr(randomDate(new Date("2025-01-01"), new Date("2025-06-01"))),
        fechaSeguimiento: dateStr(randomDate(new Date("2025-06-01"), new Date("2025-12-31"))),
      });
      planesCount++;
    }
  }
  console.log(`   ${planesCount} planes de acción`);

  console.log("\n=== Seed completado exitosamente ===");
  console.log(`
Resumen:
- ${allUsers.length} usuarios
- ${allCentros.length} centros
- ${allAreas.length} áreas
- ${allColectivos.length} colectivos
- ${allUaps.length} UAPs
- ${allPuestos.length} puestos
- ${TIPOS_ACCION_DATA.length} tipos de acción
- 9 configuraciones 9-Box
- 1 plantilla con ${pilaresCreados.length} pilares, ${nivelesCreados.length} niveles, ${itemCount} ítems
- ${trabajadoresCreados.length} trabajadores
- ${evalCount} evaluaciones completadas
- ${planesCount} planes de acción
`);

  process.exit(0);
}

seed().catch((e) => {
  console.error("Error en seed:", e);
  process.exit(1);
});
