import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  serial,
  integer,
  decimal,
  date,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ==================== ENUMS ====================

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "evaluador",
  "consulta",
]);

export const tipoCriterioEnum = pgEnum("tipo_criterio", [
  "subjetivo",
  "objetivo",
]);

export const estadoEvaluacionEnum = pgEnum("estado_evaluacion", [
  "borrador",
  "en_curso",
  "completada",
  "validada",
]);

export const valorRespuestaEnum = pgEnum("valor_respuesta", [
  "alcanzado",
  "parcialmente_alcanzado",
  "no_alcanzado",
]);

export const estadoPlanEnum = pgEnum("estado_plan", [
  "pendiente",
  "en_curso",
  "completado",
]);

export const nineboxNivelEnum = pgEnum("ninebox_nivel", [
  "bajo",
  "medio",
  "alto",
]);

export const estadoSyncEnum = pgEnum("estado_sync", [
  "iniciado",
  "completado",
  "error",
]);

// ==================== 3.1 USUARIOS ====================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: userRoleEnum("role").notNull().default("consulta"),
  externalTokenId: varchar("external_token_id", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== 3.2 DATOS MAESTROS ====================

export const centros = pgTable("centros", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const colectivos = pgTable("colectivos", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const uaps = pgTable("uaps", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull(),
  nombre: varchar("nombre", { length: 255 }),
  centroId: integer("centro_id")
    .references(() => centros.id)
    .notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const puestos = pgTable("puestos", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 50 }).unique(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  areaId: integer("area_id").references(() => areas.id),
  perfilSyp: varchar("perfil_syp", { length: 255 }),
  subperfilSyp: varchar("subperfil_syp", { length: 255 }),
  agrupacionComp: varchar("agrupacion_comp", { length: 255 }),
  ambito: varchar("ambito", { length: 255 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== 3.3 TRABAJADORES ====================

export const trabajadores = pgTable(
  "trabajadores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    externalId: varchar("external_id", { length: 255 }).unique(),
    nombre: varchar("nombre", { length: 255 }).notNull(),
    apellidos: varchar("apellidos", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    puestoId: integer("puesto_id").references(() => puestos.id),
    areaId: integer("area_id").references(() => areas.id),
    centroId: integer("centro_id").references(() => centros.id),
    uapId: integer("uap_id").references(() => uaps.id),
    colectivoId: integer("colectivo_id").references(() => colectivos.id),
    fechaIncorporacionPuesto: date("fecha_incorporacion_puesto").notNull(),
    active: boolean("active").default(true).notNull(),
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_trabajadores_centro").on(table.centroId),
    index("idx_trabajadores_area").on(table.areaId),
    index("idx_trabajadores_colectivo").on(table.colectivoId),
    index("idx_trabajadores_puesto").on(table.puestoId),
    index("idx_trabajadores_external").on(table.externalId),
  ]
);

// ==================== 3.4 CONFIGURACIÓN DE CUESTIONARIOS ====================

export const plantillasEvaluacion = pgTable("plantillas_evaluacion", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  colectivoId: integer("colectivo_id").references(() => colectivos.id),
  ncEsperadoDefault: varchar("nc_esperado_default", { length: 50 }).default(
    "Avanzado"
  ),
  umbralAntiguedadBaja: decimal("umbral_antiguedad_baja").default("80"),
  umbralAntiguedadAlta: decimal("umbral_antiguedad_alta").default("95"),
  anosUmbral: integer("anos_umbral").default(3),
  version: integer("version").default(1),
  activa: boolean("activa").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const niveles = pgTable(
  "niveles",
  {
    id: serial("id").primaryKey(),
    plantillaId: integer("plantilla_id")
      .references(() => plantillasEvaluacion.id, { onDelete: "cascade" })
      .notNull(),
    nombre: varchar("nombre", { length: 255 }).notNull(),
    codigo: varchar("codigo", { length: 50 }).notNull(),
    orden: integer("orden").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_niveles_plantilla_orden").on(
      table.plantillaId,
      table.orden
    ),
  ]
);

export const pilares = pgTable(
  "pilares",
  {
    id: serial("id").primaryKey(),
    plantillaId: integer("plantilla_id")
      .references(() => plantillasEvaluacion.id, { onDelete: "cascade" })
      .notNull(),
    nombre: varchar("nombre", { length: 255 }).notNull(),
    orden: integer("orden").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_pilares_plantilla_orden").on(
      table.plantillaId,
      table.orden
    ),
  ]
);

export const itemsEvaluacion = pgTable(
  "items_evaluacion",
  {
    id: serial("id").primaryKey(),
    pilarId: integer("pilar_id")
      .references(() => pilares.id, { onDelete: "cascade" })
      .notNull(),
    nivelId: integer("nivel_id")
      .references(() => niveles.id, { onDelete: "cascade" })
      .notNull(),
    texto: text("texto").notNull(),
    tipoCriterio: tipoCriterioEnum("tipo_criterio").notNull(),
    expectativa: text("expectativa"),
    orden: integer("orden").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_items_pilar_nivel").on(table.pilarId, table.nivelId),
  ]
);

// ==================== 3.5 EVALUACIONES ====================

export const evaluaciones = pgTable(
  "evaluaciones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trabajadorId: uuid("trabajador_id")
      .references(() => trabajadores.id)
      .notNull(),
    evaluadorId: uuid("evaluador_id")
      .references(() => users.id)
      .notNull(),
    plantillaId: integer("plantilla_id")
      .references(() => plantillasEvaluacion.id)
      .notNull(),
    fechaEvaluacion: date("fecha_evaluacion").notNull(),
    antiguedadAnos: decimal("antiguedad_anos").notNull(),
    estado: estadoEvaluacionEnum("estado").default("borrador").notNull(),
    observaciones: text("observaciones"),
    ncPotencialGlobal: varchar("nc_potencial_global", { length: 50 }),
    statusGlobalPct: decimal("status_global_pct"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_evaluaciones_trabajador").on(table.trabajadorId),
    index("idx_evaluaciones_evaluador").on(table.evaluadorId),
    index("idx_evaluaciones_fecha").on(table.fechaEvaluacion),
    index("idx_evaluaciones_estado").on(table.estado),
  ]
);

export const respuestas = pgTable(
  "respuestas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    evaluacionId: uuid("evaluacion_id")
      .references(() => evaluaciones.id, { onDelete: "cascade" })
      .notNull(),
    itemId: integer("item_id")
      .references(() => itemsEvaluacion.id)
      .notNull(),
    valor: valorRespuestaEnum("valor"),
    puntuacion: integer("puntuacion"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_respuestas_evaluacion_item").on(
      table.evaluacionId,
      table.itemId
    ),
    index("idx_respuestas_evaluacion").on(table.evaluacionId),
  ]
);

export const resultadosPilar = pgTable(
  "resultados_pilar",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    evaluacionId: uuid("evaluacion_id")
      .references(() => evaluaciones.id, { onDelete: "cascade" })
      .notNull(),
    pilarId: integer("pilar_id")
      .references(() => pilares.id)
      .notNull(),
    nivelRealId: integer("nivel_real_id").references(() => niveles.id),
    ncEsperado: varchar("nc_esperado", { length: 50 }).default("Avanzado"),
    puntuacionNivel1: decimal("puntuacion_nivel_1"),
    puntuacionNivel2: decimal("puntuacion_nivel_2"),
    puntuacionNivel3: decimal("puntuacion_nivel_3"),
    puntuacionNivel4: decimal("puntuacion_nivel_4"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_resultados_evaluacion_pilar").on(
      table.evaluacionId,
      table.pilarId
    ),
  ]
);

// ==================== 3.6 PLAN DE ACCIÓN ====================

export const planesAccion = pgTable(
  "planes_accion",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    evaluacionId: uuid("evaluacion_id")
      .references(() => evaluaciones.id, { onDelete: "cascade" })
      .notNull(),
    pilarId: integer("pilar_id").references(() => pilares.id),
    tipoAccion: varchar("tipo_accion", { length: 255 }),
    accionConcreta: text("accion_concreta").notNull(),
    fechaInicio: date("fecha_inicio"),
    fechaSeguimiento: date("fecha_seguimiento"),
    observaciones: text("observaciones"),
    estado: estadoPlanEnum("estado").default("pendiente").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_planes_evaluacion").on(table.evaluacionId)]
);

// ==================== TIPOS DE PLAN DE ACCIÓN ====================

export const tiposAccion = pgTable("tipos_accion", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== 3.7 CONFIGURACIÓN 9-BOX ====================

export const nineboxConfig = pgTable(
  "ninebox_config",
  {
    id: serial("id").primaryKey(),
    potencial: nineboxNivelEnum("potencial").notNull(),
    desempeno: nineboxNivelEnum("desempeno").notNull(),
    etiqueta: varchar("etiqueta", { length: 255 }).notNull(),
    recomendacion: text("recomendacion").notNull(),
    color: varchar("color", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_ninebox_potencial_desempeno").on(
      table.potencial,
      table.desempeno
    ),
  ]
);

// ==================== 3.8 INTEGRACIÓN API EXTERNA ====================

export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  estado: estadoSyncEnum("estado").notNull(),
  registrosProcesados: integer("registros_procesados").default(0),
  registrosErrores: integer("registros_errores").default(0),
  detalleError: text("detalle_error"),
  iniciadoPor: uuid("iniciado_por").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
