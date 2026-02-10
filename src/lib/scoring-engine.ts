/**
 * Motor de Cálculo de Competencias SyP
 *
 * Calcula:
 * - NC Real (Nivel de Competencia Real) por pilar
 * - NC Potencial global
 * - Status Global (%)
 * - Mapeo 9-Box
 */

export type RespuestaValor = "alcanzado" | "parcialmente_alcanzado" | "no_alcanzado";

export interface RespuestaInput {
  itemId: number;
  pilarId: number;
  nivelId: number;
  nivelOrden: number;
  valor: RespuestaValor | null;
}

export interface NivelInfo {
  id: number;
  nombre: string;
  codigo: string;
  orden: number;
}

export interface PilarInfo {
  id: number;
  nombre: string;
  orden: number;
}

export interface PlantillaConfig {
  umbralAntiguedadBaja: number; // % para < X años (default 80)
  umbralAntiguedadAlta: number; // % para >= X años (default 95)
  anosUmbral: number; // años de corte (default 3)
  ncEsperadoDefault: string; // default "Avanzado"
}

export interface ResultadoPilar {
  pilarId: number;
  pilarNombre: string;
  nivelRealId: number | null;
  nivelRealNombre: string | null;
  ncEsperado: string;
  puntuacionesPorNivel: { nivelId: number; nivelOrden: number; porcentaje: number }[];
}

export interface ResultadoGlobal {
  resultadosPilar: ResultadoPilar[];
  ncPotencialGlobal: string;
  statusGlobalPct: number;
  nineboxDesempeno: "bajo" | "medio" | "alto";
  nineboxPotencial: "bajo" | "medio" | "alto";
}

/** Convierte valor de respuesta a puntuación numérica */
export function valorAPuntuacion(valor: RespuestaValor | null): number {
  switch (valor) {
    case "alcanzado":
      return 5;
    case "parcialmente_alcanzado":
      return 2;
    case "no_alcanzado":
      return 0;
    default:
      return 0;
  }
}

/**
 * Determina el umbral según la antigüedad del trabajador.
 */
function getUmbral(antiguedadAnos: number, config: PlantillaConfig): number {
  return antiguedadAnos < config.anosUmbral
    ? config.umbralAntiguedadBaja
    : config.umbralAntiguedadAlta;
}

/**
 * Calcula el NC Real para un pilar específico.
 *
 * Recorre los niveles en orden (Inicial → Experto).
 * Para cada nivel, calcula el % de puntuación obtenida.
 * Si el % >= umbral → nivel alcanzado, continúa al siguiente.
 * Si el % < umbral → DETENER. NC Real = último nivel alcanzado.
 */
function calcularNCRealPilar(
  pilarId: number,
  pilarNombre: string,
  niveles: NivelInfo[],
  respuestas: RespuestaInput[],
  antiguedadAnos: number,
  config: PlantillaConfig
): ResultadoPilar {
  const umbral = getUmbral(antiguedadAnos, config);
  const nivelesOrdenados = [...niveles].sort((a, b) => a.orden - b.orden);

  let nivelRealId: number | null = null;
  let nivelRealNombre: string | null = null;
  const puntuacionesPorNivel: { nivelId: number; nivelOrden: number; porcentaje: number }[] = [];

  for (const nivel of nivelesOrdenados) {
    const respuestasNivel = respuestas.filter(
      (r) => r.pilarId === pilarId && r.nivelId === nivel.id
    );

    if (respuestasNivel.length === 0) {
      puntuacionesPorNivel.push({
        nivelId: nivel.id,
        nivelOrden: nivel.orden,
        porcentaje: 0,
      });
      break; // Sin ítems para este nivel, no se puede alcanzar
    }

    const suma = respuestasNivel.reduce(
      (acc, r) => acc + valorAPuntuacion(r.valor),
      0
    );
    const maxPosible = respuestasNivel.length * 5;
    const porcentaje = maxPosible > 0 ? (suma / maxPosible) * 100 : 0;

    puntuacionesPorNivel.push({
      nivelId: nivel.id,
      nivelOrden: nivel.orden,
      porcentaje,
    });

    if (porcentaje >= umbral) {
      nivelRealId = nivel.id;
      nivelRealNombre = nivel.nombre;
      // Nivel alcanzado, continuar al siguiente
    } else {
      // No alcanza el umbral, detenerse
      break;
    }
  }

  return {
    pilarId,
    pilarNombre,
    nivelRealId,
    nivelRealNombre,
    ncEsperado: config.ncEsperadoDefault,
    puntuacionesPorNivel,
  };
}

/**
 * Calcula el NC Potencial global.
 *
 * 1. Si antigüedad < 6 meses → "No evaluable"
 * 2. Contar pilares donde NC Real >= Avanzado (orden >= 3)
 * 3. Contar pilares donde NC Real >= Experto (orden >= 4)
 * 4. Clasificar según porcentajes
 */
function calcularNCPotencial(
  resultadosPilar: ResultadoPilar[],
  niveles: NivelInfo[],
  antiguedadAnos: number
): string {
  if (antiguedadAnos < 0.5) return "No evaluable";

  const totalPilares = resultadosPilar.length;
  if (totalPilares === 0) return "No evaluable";

  // Encontrar el orden del nivel "Avanzado" y "Experto"
  const nivelesOrdenados = [...niveles].sort((a, b) => a.orden - b.orden);
  const ordenAvanzado = nivelesOrdenados.length >= 3 ? nivelesOrdenados[2].orden : 3;
  const ordenExperto = nivelesOrdenados.length >= 4 ? nivelesOrdenados[3].orden : 4;

  let pilaresAvanzado = 0;
  let pilaresExperto = 0;

  for (const rp of resultadosPilar) {
    if (!rp.nivelRealId) continue;
    const nivelReal = niveles.find((n) => n.id === rp.nivelRealId);
    if (!nivelReal) continue;

    if (nivelReal.orden >= ordenAvanzado) pilaresAvanzado++;
    if (nivelReal.orden >= ordenExperto) pilaresExperto++;
  }

  const pctAvanzado = pilaresAvanzado / totalPilares;
  const pctExperto = pilaresExperto / totalPilares;

  if (pctExperto === 1) return "Potencial Alto";
  if (pctAvanzado === 1) return "Promocionable";
  if (pctAvanzado >= 0.6) return "Lateral";
  return "Estático";
}

/**
 * Calcula el Status Global (%).
 *
 * Promedio de los porcentajes del nivel más alto alcanzado en cada pilar.
 */
function calcularStatusGlobal(resultadosPilar: ResultadoPilar[]): number {
  if (resultadosPilar.length === 0) return 0;

  let sumaPorcentajes = 0;
  for (const rp of resultadosPilar) {
    // El porcentaje del pilar es el máximo porcentaje entre los niveles alcanzados
    if (rp.puntuacionesPorNivel.length > 0) {
      // Tomar el porcentaje del último nivel procesado como referencia
      // Calculamos un score general: (niveles alcanzados * 100 + último pct parcial) / total niveles
      const nivelesAlcanzados = rp.puntuacionesPorNivel.filter(
        (p, i, arr) => i < arr.length - 1 || (rp.nivelRealId !== null && p.nivelId === rp.nivelRealId)
      );

      // Score = promedio ponderado de todos los niveles evaluados
      const totalNiveles = rp.puntuacionesPorNivel.length;
      const sumaLocal = rp.puntuacionesPorNivel.reduce((acc, p) => acc + p.porcentaje, 0);
      sumaPorcentajes += totalNiveles > 0 ? sumaLocal / totalNiveles : 0;
    }
  }

  return Math.round((sumaPorcentajes / resultadosPilar.length) * 100) / 100;
}

/**
 * Mapeo 9-Box: Desempeño y Potencial.
 */
function mapearNinebox(
  statusGlobalPct: number,
  ncPotencial: string
): { desempeno: "bajo" | "medio" | "alto"; potencial: "bajo" | "medio" | "alto" } {
  // Desempeño se deriva del Status Global (%)
  let desempeno: "bajo" | "medio" | "alto";
  if (statusGlobalPct < 40) desempeno = "bajo";
  else if (statusGlobalPct <= 70) desempeno = "medio";
  else desempeno = "alto";

  // Potencial se deriva del NC Potencial
  let potencial: "bajo" | "medio" | "alto";
  switch (ncPotencial) {
    case "Promocionable":
    case "Potencial Alto":
      potencial = "alto";
      break;
    case "Lateral":
      potencial = "medio";
      break;
    default: // Estático, No evaluable
      potencial = "bajo";
      break;
  }

  return { desempeno, potencial };
}

/**
 * Función principal del motor de cálculo.
 *
 * Recibe las respuestas y la configuración, y devuelve todos los resultados.
 */
export function calcularResultados(
  respuestas: RespuestaInput[],
  pilares: PilarInfo[],
  niveles: NivelInfo[],
  antiguedadAnos: number,
  config: PlantillaConfig
): ResultadoGlobal {
  // 1. Calcular NC Real por pilar
  const resultadosPilar = pilares.map((pilar) =>
    calcularNCRealPilar(pilar.id, pilar.nombre, niveles, respuestas, antiguedadAnos, config)
  );

  // 2. Calcular NC Potencial global
  const ncPotencialGlobal = calcularNCPotencial(resultadosPilar, niveles, antiguedadAnos);

  // 3. Calcular Status Global (%)
  const statusGlobalPct = calcularStatusGlobal(resultadosPilar);

  // 4. Mapeo 9-Box
  const { desempeno, potencial } = mapearNinebox(statusGlobalPct, ncPotencialGlobal);

  return {
    resultadosPilar,
    ncPotencialGlobal,
    statusGlobalPct,
    nineboxDesempeno: desempeno,
    nineboxPotencial: potencial,
  };
}
