# PRD: Aplicación Web de Evaluación de Competencias de Seguridad y Prevención (SyP)

## Contexto

La empresa actualmente utiliza hojas de cálculo Excel para realizar evaluaciones de competencias de Seguridad y Prevención (SyP) a su plantilla. El proceso consiste en que un evaluador entrevista a un trabajador, le hace preguntas organizadas por pilares y niveles de competencia, y registra las respuestas. Posteriormente, se calculan niveles de competencia (Real, Esperado, Potencial) y se generan informes individuales y globales.

Este proceso manual presenta limitaciones: no permite gestionar históricos, dificulta la generación de informes agregados, no escala a múltiples centros de trabajo y carece de trazabilidad.

**Objetivo**: Digitalizar completamente este proceso en una aplicación web que permita configurar cuestionarios, realizar evaluaciones, calcular automáticamente los niveles de competencia, generar informes y visualizar la evolución de los trabajadores en el tiempo.

---

## 1. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Lenguaje** | TypeScript |
| **Base de datos** | PostgreSQL 16 |
| **ORM** | Drizzle ORM |
| **Autenticación** | Token de sesión validado contra API externa (launchpad corporativo) |
| **UI** | Tailwind CSS + shadcn/ui (diseño responsive mobile-first: PC, tablet y móvil) |
| **Gráficos** | Recharts |
| **Exportación PDF** | @react-pdf/renderer |
| **Exportación Excel** | ExcelJS |
| **Validación** | Zod |
| **Tablas** | TanStack Table (incluido con shadcn/ui DataTable) |
| **Idioma** | Español (sin i18n) |

---

## 2. Roles y Permisos

| Rol | Descripción | Permisos principales |
|---|---|---|
| **Admin** | Administrador del sistema | Gestión completa: usuarios, datos maestros, configuración de cuestionarios, acceso a todas las evaluaciones e informes |
| **Evaluador** | Realiza las evaluaciones | Crear/editar evaluaciones asignadas, crear planes de acción, ver informes de sus evaluaciones |
| **Consulta** | Solo lectura (RRHH, directivos) | Ver todos los informes y dashboards, exportar datos. Sin capacidad de crear/editar evaluaciones |

---

## 3. Modelo de Datos (PostgreSQL)

### 3.1 Usuarios

```
users
├── id                  UUID PK
├── email               VARCHAR UNIQUE NOT NULL
├── name                VARCHAR NOT NULL
├── role                ENUM('admin', 'evaluador', 'consulta') NOT NULL
├── external_token_id   VARCHAR NULL  (identificador del usuario en el launchpad)
├── active              BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

> **Autenticación**: La app no gestiona login propio. Está embebida en un launchpad corporativo que lanza la URL con un token de sesión. La validación del token se implementará en el Hito 2 (ver Fase 2.1).

### 3.2 Datos Maestros (Organización)

```
centros
├── id                  SERIAL PK
├── codigo              VARCHAR NOT NULL  (ej: "22")
├── nombre              VARCHAR NOT NULL
├── active              BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

areas
├── id                  SERIAL PK
├── nombre              VARCHAR NOT NULL  (ej: "Operaciones", "RRHH")
├── active              BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

colectivos
├── id                  SERIAL PK
├── nombre              VARCHAR NOT NULL  (ej: "Línea de Mando", "MOD")
├── active              BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

uaps
├── id                  SERIAL PK
├── codigo              VARCHAR NOT NULL  (ej: "Mto1")
├── nombre              VARCHAR NULL
├── centro_id           FK -> centros(id)
├── active              BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

puestos
├── id                  SERIAL PK
├── codigo              VARCHAR UNIQUE  (ej: "F-001")
├── nombre              VARCHAR NOT NULL  (ej: "Jefe de Turno")
├── area_id             FK -> areas(id) NULL
├── perfil_syp          VARCHAR NULL  (ej: "Línea de mando")
├── subperfil_syp       VARCHAR NULL  (ej: "Mandos Intermedios")
├── agrupacion_comp     VARCHAR NULL  (ej: "DIRECCIÓN Y LÍNEA DE MANDO")
├── ambito              VARCHAR NULL  (ej: "CENTROS OPERATIVOS")
├── active              BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
```

### 3.3 Trabajadores

```
trabajadores
├── id                  UUID PK
├── external_id         VARCHAR UNIQUE NULL  (ID del sistema externo/ERP)
├── nombre              VARCHAR NOT NULL
├── apellidos           VARCHAR NOT NULL
├── email               VARCHAR NULL
├── puesto_id           FK -> puestos(id)
├── area_id             FK -> areas(id)
├── centro_id           FK -> centros(id)
├── uap_id              FK -> uaps(id) NULL
├── colectivo_id        FK -> colectivos(id)
├── fecha_incorporacion_puesto  DATE NOT NULL  (para calcular antigüedad)
├── active              BOOLEAN DEFAULT true
├── synced_at           TIMESTAMP NULL  (última sincronización con ERP)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

ÍNDICES:
- idx_trabajadores_centro ON (centro_id)
- idx_trabajadores_area ON (area_id)
- idx_trabajadores_colectivo ON (colectivo_id)
- idx_trabajadores_puesto ON (puesto_id)
- idx_trabajadores_external ON (external_id)
```

### 3.4 Configuración de Cuestionarios (Dinámico)

```
plantillas_evaluacion
├── id                  SERIAL PK
├── nombre              VARCHAR NOT NULL  (ej: "Competencias SyP - Línea de Mando")
├── descripcion         TEXT NULL
├── colectivo_id        FK -> colectivos(id) NULL  (a qué colectivo aplica)
├── nc_esperado_default VARCHAR DEFAULT 'Avanzado'
├── umbral_antiguedad_baja  DECIMAL DEFAULT 80  (% para < X años)
├── umbral_antiguedad_alta  DECIMAL DEFAULT 95  (% para >= X años)
├── anos_umbral         INTEGER DEFAULT 3  (años de corte de antigüedad)
├── version             INTEGER DEFAULT 1
├── activa              BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

niveles
├── id                  SERIAL PK
├── plantilla_id        FK -> plantillas_evaluacion(id) ON DELETE CASCADE
├── nombre              VARCHAR NOT NULL  (ej: "01 Inicial")
├── codigo              VARCHAR NOT NULL  (ej: "inicial")
├── orden               INTEGER NOT NULL  (1, 2, 3, 4)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
UNIQUE(plantilla_id, orden)

pilares
├── id                  SERIAL PK
├── plantilla_id        FK -> plantillas_evaluacion(id) ON DELETE CASCADE
├── nombre              VARCHAR NOT NULL  (ej: "Contratas")
├── orden               INTEGER NOT NULL
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
UNIQUE(plantilla_id, orden)

items_evaluacion
├── id                  SERIAL PK
├── pilar_id            FK -> pilares(id) ON DELETE CASCADE
├── nivel_id            FK -> niveles(id) ON DELETE CASCADE
├── texto               TEXT NOT NULL  (la pregunta/criterio de evaluación)
├── tipo_criterio       ENUM('subjetivo', 'objetivo') NOT NULL
├── expectativa         TEXT NULL  (descripción de qué se espera en este nivel/pilar)
├── orden               INTEGER NOT NULL
├── active              BOOLEAN DEFAULT true
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
ÍNDICES:
- idx_items_pilar_nivel ON (pilar_id, nivel_id)
```

### 3.5 Evaluaciones

```
evaluaciones
├── id                  UUID PK
├── trabajador_id       FK -> trabajadores(id)
├── evaluador_id        FK -> users(id)
├── plantilla_id        FK -> plantillas_evaluacion(id)
├── fecha_evaluacion    DATE NOT NULL
├── antiguedad_anos     DECIMAL NOT NULL  (calculada a fecha de evaluación)
├── estado              ENUM('borrador', 'en_curso', 'completada', 'validada') DEFAULT 'borrador'
├── observaciones       TEXT NULL  (observaciones generales del informe)
├── nc_potencial_global VARCHAR NULL  (calculado: No evaluable/Estático/Lateral/Promocionable/Potencial Alto)
├── status_global_pct   DECIMAL NULL  (% global calculado)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

ÍNDICES:
- idx_evaluaciones_trabajador ON (trabajador_id)
- idx_evaluaciones_evaluador ON (evaluador_id)
- idx_evaluaciones_fecha ON (fecha_evaluacion)
- idx_evaluaciones_estado ON (estado)

respuestas
├── id                  UUID PK
├── evaluacion_id       FK -> evaluaciones(id) ON DELETE CASCADE
├── item_id             FK -> items_evaluacion(id)
├── valor               ENUM('alcanzado', 'parcialmente_alcanzado', 'no_alcanzado') NULL
├── puntuacion          INTEGER NULL  (5, 2 o 0 - calculada automáticamente)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
UNIQUE(evaluacion_id, item_id)

ÍNDICE:
- idx_respuestas_evaluacion ON (evaluacion_id)

resultados_pilar
├── id                  UUID PK
├── evaluacion_id       FK -> evaluaciones(id) ON DELETE CASCADE
├── pilar_id            FK -> pilares(id)
├── nivel_real_id       FK -> niveles(id) NULL  (nivel de competencia real alcanzado)
├── nc_esperado         VARCHAR DEFAULT 'Avanzado'
├── puntuacion_nivel_1  DECIMAL NULL  (% obtenido en nivel Inicial)
├── puntuacion_nivel_2  DECIMAL NULL  (% obtenido en nivel Básico)
├── puntuacion_nivel_3  DECIMAL NULL  (% obtenido en nivel Avanzado)
├── puntuacion_nivel_4  DECIMAL NULL  (% obtenido en nivel Experto)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
UNIQUE(evaluacion_id, pilar_id)
```

### 3.6 Plan de Acción

```
planes_accion
├── id                  UUID PK
├── evaluacion_id       FK -> evaluaciones(id) ON DELETE CASCADE
├── pilar_id            FK -> pilares(id) NULL
├── tipo_accion         VARCHAR NULL  (Mentoring, Tutelaje, Form. Técnica, etc.)
├── accion_concreta     TEXT NOT NULL
├── fecha_inicio        DATE NULL
├── fecha_seguimiento   DATE NULL
├── observaciones       TEXT NULL
├── estado              ENUM('pendiente', 'en_curso', 'completado') DEFAULT 'pendiente'
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP

ÍNDICE:
- idx_planes_evaluacion ON (evaluacion_id)
```

### 3.7 Configuración 9-Box

```
ninebox_config
├── id                  SERIAL PK
├── potencial           ENUM('bajo', 'medio', 'alto') NOT NULL
├── desempeno           ENUM('bajo', 'medio', 'alto') NOT NULL
├── etiqueta            VARCHAR NOT NULL  (ej: "Futuro líder")
├── recomendacion       TEXT NOT NULL  (ej: "Listo para promoción")
├── color               VARCHAR NULL  (código de color para la UI)
├── created_at          TIMESTAMP
└── updated_at          TIMESTAMP
UNIQUE(potencial, desempeno)
```

### 3.8 Integración API Externa

```
sync_logs
├── id                  UUID PK
├── tipo                VARCHAR NOT NULL  ('trabajadores', 'puestos', 'centros')
├── estado              ENUM('iniciado', 'completado', 'error')
├── registros_procesados INTEGER DEFAULT 0
├── registros_errores   INTEGER DEFAULT 0
├── detalle_error       TEXT NULL
├── iniciado_por        FK -> users(id)
├── created_at          TIMESTAMP
└── completed_at        TIMESTAMP NULL
```

---

## 4. Motor de Cálculo de Competencias

### 4.1 NC Real (Nivel de Competencia Real)

```
Para cada pilar de la evaluación:
  1. Recorrer los niveles en orden (Inicial → Básico → Avanzado → Experto)
  2. Para cada nivel:
     a. Sumar puntuaciones de todos los ítems del pilar en ese nivel
     b. Calcular % = (suma / (num_items × 5)) × 100
     c. Determinar umbral según antigüedad:
        - Si antigüedad < 3 años → umbral = 80%
        - Si antigüedad >= 3 años → umbral = 95%
     d. Si % >= umbral → nivel alcanzado, continuar al siguiente
     e. Si % < umbral → DETENER. NC Real = último nivel alcanzado
  3. NC Real del pilar = nivel más alto alcanzado secuencialmente
```

### 4.2 NC Esperado

```
Valor fijo configurable en la plantilla de evaluación.
Por defecto: "Avanzado" para todos los colectivos y pilares.
```

### 4.3 NC Potencial

```
1. Si antigüedad en puesto < 6 meses → "No evaluable"
2. Contar pilares donde NC Real >= Avanzado (con mismos umbrales de %)
3. Contar pilares donde NC Real >= Experto
4. Calcular:
   - porcentaje_avanzado = pilares_avanzado / total_pilares
   - porcentaje_experto = pilares_experto / total_pilares
5. Clasificar:
   - Si porcentaje_experto = 100% → "Potencial Alto"
   - Si porcentaje_avanzado = 100% → "Promocionable"
   - Si porcentaje_avanzado >= 60% → "Lateral"
   - Si porcentaje_avanzado < 60% → "Estático"
```

### 4.4 Status Global (%)

```
Promedio de los porcentajes obtenidos en todos los pilares,
considerando el nivel más alto alcanzado.
```

### 4.5 Mapeo 9-Box (Potencial x Desempeño)

```
Desempeño se deriva del Status Global (%):
  - BAJO: < 40%
  - MEDIO: 40% - 70%
  - ALTO: > 70%

Potencial se deriva del NC Potencial:
  - BAJO: Estático o No evaluable
  - MEDIO: Lateral
  - ALTO: Promocionable o Potencial Alto

Se cruzan para obtener la recomendación de la matriz 9-Box.
```

---

## 5. Pantallas de la Aplicación

### 5.1 Dashboard
| Pantalla | Ruta | Roles | Descripción |
|---|---|---|---|
| Dashboard principal | `/dashboard` | Todos | KPIs: evaluaciones completadas, pendientes, distribución por nivel potencial, resumen por centro. Gráfico comparativo de evaluaciones por centro (media de Status Global, distribución de NC Potencial por centro). Widgets adaptados al rol |

### 5.2 Gestión de Evaluaciones
| Pantalla | Ruta | Roles | Descripción |
|---|---|---|---|
| Lista de evaluaciones | `/evaluaciones` | Evaluador, Admin | Tabla con filtros (estado, centro, área, fecha). Evaluador ve solo las suyas |
| Nueva evaluación | `/evaluaciones/nueva` | Evaluador, Admin | Seleccionar trabajador → se carga plantilla correspondiente a su colectivo |
| Realizar evaluación | `/evaluaciones/[id]` | Evaluador, Admin | Formulario con ítems agrupados por pilar y nivel. El evaluador marca Alcanzado / Parcialmente / No Alcanzado. Guardado automático (borrador). Botón finalizar |
| Ver evaluación | `/evaluaciones/[id]/ver` | Todos | Vista de solo lectura de una evaluación completada con resultados calculados |

### 5.3 Informes
| Pantalla | Ruta | Roles | Descripción |
|---|---|---|---|
| Informe Individual | `/informes/trabajador/[id]` | Todos | Reproduce la pestaña "Inf.Trabj" del Excel: datos del trabajador, matriz de puntuaciones (mínima vs obtenida) por pilar y nivel, NC Real/Esperado/Potencial, gráfico de barras, plan de acción, observaciones. Botones exportar PDF/Excel |
| Informe Global | `/informes/global` | Admin, Consulta | Tabla con todos los trabajadores y sus NC Real + NC Esperado por pilar, Status Global, NC Potencial. Filtros por centro, área, colectivo, UAP. Exportar PDF/Excel |
| Evolución Trabajador | `/informes/evolucion/[trabajadorId]` | Todos | Gráfico temporal mostrando la evolución de NC Real por pilar a lo largo de las evaluaciones. Línea de tiempo |
| Análisis por Pilares | `/informes/pilares` | Admin, Consulta | Análisis de situación agrupado por pilar: cuántos trabajadores en cada nivel, distribución por centro/área |
| Análisis Potencial | `/informes/potencial` | Admin, Consulta | Distribución de NC Potencial por centro/área/colectivo |
| 9-Box Grid | `/informes/ninebox` | Admin, Consulta | Visualización de la matriz 9-Box con trabajadores posicionados. Filtros por centro/área. Click en celda muestra lista de trabajadores |

### 5.4 Administración - Datos Maestros
| Pantalla | Ruta | Descripción |
|---|---|---|
| Trabajadores | `/admin/trabajadores` | CRUD de trabajadores + botón sincronizar con ERP. Tabla con filtros |
| Centros | `/admin/centros` | CRUD de centros de trabajo |
| Áreas | `/admin/areas` | CRUD de áreas/departamentos |
| Puestos | `/admin/puestos` | CRUD de puestos con sus clasificaciones (perfil SyP, agrupación, ámbito) |
| Colectivos | `/admin/colectivos` | CRUD de colectivos |
| UAPs | `/admin/uaps` | CRUD de UAPs por centro |
| Usuarios | `/admin/usuarios` | CRUD de usuarios con asignación de rol |

### 5.5 Administración - Cuestionarios
| Pantalla | Ruta | Descripción |
|---|---|---|
| Plantillas | `/admin/plantillas` | Lista de plantillas de evaluación. Crear nueva / duplicar / editar |
| Editor de plantilla | `/admin/plantillas/[id]` | Configuración completa: nombre, colectivo asociado, umbrales de antigüedad, NC esperado. Gestión de niveles (orden, nombre). Gestión de pilares (orden, nombre). Gestión de ítems por pilar/nivel (texto, tipo subjetivo/objetivo, expectativa) |
| Configuración 9-Box | `/admin/ninebox` | Editar etiquetas y recomendaciones de la matriz 9-Box |
| Tipos Plan Acción | `/admin/tipos-accion` | CRUD de tipos de plan de acción (Mentoring, Tutelaje, etc.) |

### 5.6 Administración - Sistema
| Pantalla | Ruta | Descripción |
|---|---|---|
| Integraciones | `/admin/integraciones` | Configuración de la API externa (ERP). Log de sincronizaciones. Botón sincronizar manual |

---

## 6. API Endpoints

### 6.1 Evaluaciones
```
GET    /api/evaluaciones                    Listar (con filtros)
POST   /api/evaluaciones                    Crear nueva evaluación
GET    /api/evaluaciones/[id]               Obtener detalle
PATCH  /api/evaluaciones/[id]               Actualizar (guardar borrador)
POST   /api/evaluaciones/[id]/finalizar     Finalizar y calcular resultados
DELETE /api/evaluaciones/[id]               Eliminar (solo borrador)
GET    /api/evaluaciones/[id]/respuestas    Obtener respuestas
PUT    /api/evaluaciones/[id]/respuestas    Guardar respuestas (bulk)
GET    /api/evaluaciones/[id]/resultados    Obtener resultados calculados
```

### 6.2 Planes de Acción
```
GET    /api/evaluaciones/[id]/planes        Listar planes de una evaluación
POST   /api/evaluaciones/[id]/planes        Crear plan de acción
PATCH  /api/planes/[id]                     Actualizar plan
DELETE /api/planes/[id]                     Eliminar plan
```

### 6.3 Informes
```
GET    /api/informes/trabajador/[id]        Informe individual (última evaluación)
GET    /api/informes/trabajador/[id]/evolucion  Datos de evolución temporal
GET    /api/informes/global                 Informe global (con filtros)
GET    /api/informes/pilares                Análisis por pilares
GET    /api/informes/potencial              Análisis de potencial
GET    /api/informes/ninebox                Datos para 9-Box Grid
```

### 6.4 Exportación
```
GET    /api/export/trabajador/[id]/pdf      Exportar informe individual PDF
GET    /api/export/trabajador/[id]/excel    Exportar informe individual Excel
GET    /api/export/global/pdf               Exportar informe global PDF
GET    /api/export/global/excel             Exportar informe global Excel
```

### 6.5 Datos Maestros
```
GET/POST         /api/admin/trabajadores
GET/PATCH/DELETE /api/admin/trabajadores/[id]
GET/POST         /api/admin/centros
GET/PATCH/DELETE /api/admin/centros/[id]
GET/POST         /api/admin/areas
GET/PATCH/DELETE /api/admin/areas/[id]
GET/POST         /api/admin/puestos
GET/PATCH/DELETE /api/admin/puestos/[id]
GET/POST         /api/admin/colectivos
GET/PATCH/DELETE /api/admin/colectivos/[id]
GET/POST         /api/admin/uaps
GET/PATCH/DELETE /api/admin/uaps/[id]
```

### 6.6 Cuestionarios
```
GET/POST         /api/admin/plantillas
GET/PATCH/DELETE /api/admin/plantillas/[id]
POST             /api/admin/plantillas/[id]/duplicar
GET/POST         /api/admin/plantillas/[id]/niveles
PATCH/DELETE     /api/admin/niveles/[id]
GET/POST         /api/admin/plantillas/[id]/pilares
PATCH/DELETE     /api/admin/pilares/[id]
GET/POST         /api/admin/pilares/[id]/items
PATCH/DELETE     /api/admin/items/[id]
```

### 6.7 Usuarios y Sistema
```
GET/POST         /api/admin/usuarios
GET/PATCH/DELETE /api/admin/usuarios/[id]
POST             /api/admin/sync/trabajadores   Sincronizar con ERP
GET              /api/admin/sync/logs            Historial de sincronizaciones
GET/PATCH        /api/admin/ninebox              Configuración 9-Box
```

### 6.8 API Externa (Integración ERP)
```
POST   /api/external/trabajadores     Webhook/endpoint para recibir datos del ERP
POST   /api/external/puestos          Webhook/endpoint para recibir puestos
```

---

## 7. Estructura del Proyecto Next.js

```
app-competencias/
├── drizzle/
│   └── migrations/                # Migraciones generadas por Drizzle Kit
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout principal
│   │   ├── page.tsx               # Redirect a /dashboard
│   │   ├── (authenticated)/       # Route group con middleware de validación de token
│   │   │   ├── layout.tsx         # Layout con sidebar + header
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── evaluaciones/
│   │   │   │   ├── page.tsx                    # Lista
│   │   │   │   ├── nueva/page.tsx              # Nueva evaluación
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx                # Realizar evaluación
│   │   │   │       └── ver/page.tsx            # Ver evaluación
│   │   │   ├── informes/
│   │   │   │   ├── global/page.tsx
│   │   │   │   ├── pilares/page.tsx
│   │   │   │   ├── potencial/page.tsx
│   │   │   │   ├── ninebox/page.tsx
│   │   │   │   ├── trabajador/[id]/page.tsx
│   │   │   │   └── evolucion/[trabajadorId]/page.tsx
│   │   │   └── admin/
│   │   │       ├── trabajadores/page.tsx
│   │   │       ├── centros/page.tsx
│   │   │       ├── areas/page.tsx
│   │   │       ├── puestos/page.tsx
│   │   │       ├── colectivos/page.tsx
│   │   │       ├── uaps/page.tsx
│   │   │       ├── usuarios/page.tsx
│   │   │       ├── plantillas/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── ninebox/page.tsx
│   │   │       ├── tipos-accion/page.tsx
│   │   │       └── integraciones/page.tsx
│   │   └── api/
│   │       ├── auth/validate/route.ts       # Validación de token del launchpad
│   │       ├── evaluaciones/
│   │       ├── informes/
│   │       ├── export/
│   │       ├── admin/
│   │       └── external/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   ├── evaluacion/
│   │   │   ├── EvaluacionForm.tsx         # Formulario de evaluación
│   │   │   ├── ItemRespuesta.tsx          # Componente individual de respuesta
│   │   │   ├── PilarSection.tsx           # Sección agrupada por pilar
│   │   │   ├── NivelTabs.tsx             # Tabs de niveles dentro de pilar
│   │   │   └── ResumenEvaluacion.tsx      # Resumen con resultados
│   │   ├── informes/
│   │   │   ├── InformeTrabajador.tsx      # Informe individual completo
│   │   │   ├── MatrizPuntuaciones.tsx     # Tabla puntuación mínima vs obtenida
│   │   │   ├── GraficoBarrasPilares.tsx   # Gráfico de barras por pilar
│   │   │   ├── GraficoEvolucion.tsx       # Gráfico de evolución temporal
│   │   │   ├── TablaInformeGlobal.tsx     # Tabla del informe global
│   │   │   ├── NineBoxGrid.tsx            # Componente visual 9-Box
│   │   │   └── AnalisisPilares.tsx        # Visualización análisis por pilares
│   │   ├── planes/
│   │   │   ├── PlanAccionForm.tsx
│   │   │   └── PlanAccionList.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx              # Tabla reutilizable con filtros
│   │       ├── FilterBar.tsx              # Barra de filtros (centro, área, etc.)
│   │       ├── ExportButtons.tsx          # Botones exportar PDF/Excel
│   │       └── WorkerSelector.tsx         # Selector de trabajador
│   ├── lib/
│   │   ├── db.ts                          # Cliente Drizzle singleton
│   │   ├── auth.ts                        # Validación de token del launchpad
│   │   ├── scoring-engine.ts              # Motor de cálculo de competencias
│   │   ├── export/
│   │   │   ├── pdf-generator.ts           # Generación de PDF
│   │   │   └── excel-generator.ts         # Generación de Excel
│   │   ├── validators/                    # Esquemas Zod
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── useEvaluacion.ts
│   │   ├── useInformes.ts
│   │   └── useAuth.ts
│   └── types/
│       └── index.ts                       # Tipos TypeScript compartidos
├── public/
│   └── logo.svg
├── docs/
│   └── (archivos Excel actuales)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env
```

---

## 8. Flujo Principal: Realizar una Evaluación

1. **Evaluador** accede a `/evaluaciones/nueva`
2. Selecciona un **trabajador** (buscador con autocompletado)
3. El sistema determina automáticamente la **plantilla** según el colectivo del trabajador
4. Se calcula la **antigüedad** en el puesto a la fecha actual
5. Se crea la evaluación en estado **"borrador"**
6. Se muestra el formulario organizado por **pilar**, con un toggle para que el usuario elija entre vista **tabs** o vista **acordeón** (la preferencia se guarda en localStorage):
   - Dentro de cada pilar, los ítems se agrupan por **nivel** (Inicial → Experto)
   - Cada ítem muestra: texto de la pregunta, tipo (Subjetivo/Objetivo), campo de respuesta (Alcanzado / Parcialmente / No Alcanzado)
   - Se muestra la **expectativa** del nivel/pilar como contexto
7. El evaluador va respondiendo. Se **guarda automáticamente** cada respuesta (auto-save). Estado pasa a **"en_curso"** con la primera respuesta
8. **Cálculo parcial bajo demanda**: el evaluador puede pulsar **"Ver resumen parcial"** en cualquier momento. Se ejecuta el motor de cálculo con las respuestas actuales y los resultados se **persisten en `resultados_pilar`** y en los campos calculados de `evaluaciones` (se irán sobrescribiendo en sucesivos cálculos parciales y al finalizar)
9. Al terminar, pulsa **"Finalizar evaluación"**
10. El **motor de cálculo** ejecuta el cálculo definitivo y persiste los resultados finales:
    - Calcula NC Real por pilar
    - Calcula NC Potencial global
    - Calcula Status Global (%)
11. Se muestra el **informe individual** con los resultados
12. El evaluador puede añadir **Plan de Acción** y **Observaciones**
13. Estado pasa a **"completada"**

### 8.1 Estrategia del Motor de Cálculo

| Momento | Acción | Persistencia |
|---|---|---|
| **Auto-save (cada respuesta)** | Solo se guarda la respuesta en `respuestas` | Solo la respuesta |
| **"Ver resumen parcial" (bajo demanda)** | Se ejecuta el motor completo con las respuestas actuales | Se persisten resultados en `resultados_pilar` y campos calculados de `evaluaciones` (se sobrescriben en cada ejecución) |
| **"Finalizar evaluación"** | Se ejecuta el motor completo como cálculo definitivo | Se persisten resultados finales. Estado → "completada" |

> **Nota**: No se ejecuta el motor en cada auto-save (sería excesivo) ni periódicamente (no hay necesidad, los cálculos son deterministas). El recálculo masivo ante cambios de umbrales de plantilla se contempla en el Hito 2.

---

## 9. Datos Iniciales (Seed)

La aplicación se inicializará con:

1. **Plantilla "Competencias SyP - Línea de Mando"** con los 6 pilares, 4 niveles y 69 ítems extraídos del Excel actual
2. **Configuración 9-Box** con las 9 combinaciones y sus recomendaciones
3. **Tipos de Plan de Acción**: Mentoring, Tutelaje, Formación Técnica, Supervisión, Plan de Carrera, Promoción, Formación Relacional
4. **Catálogo de Puestos**: Los 174 puestos del archivo "Agrupación Puestos"
5. **Usuario admin** por defecto

---

## 10. Hitos y Fases de Implementación

### Hito 1: Demo para Usuarios (sin integración SAP)

Objetivo: Tener la aplicación completamente funcional con datos de demostración poblados en la BD, para poder enseñar a los usuarios todas las pantallas, realizar evaluaciones, ver informes y exportar PDFs.

**Fase 1.1 - Infraestructura y Base** ✅ COMPLETADA
- Setup del proyecto Next.js + Drizzle + PostgreSQL
- Esquema de BD completo (migraciones)
- Layout principal (sidebar, header, navegación por roles)
- Roles (Admin, Evaluador, Consulta)
- Autenticación provisional: usuario simulado por configuración (sin token real) para poder desarrollar y hacer demo. La validación real del token del launchpad se implementa en Hito 2

> **Resumen implementación Fase 1.1:**
> - Proyecto: Next.js 16.1.6 + TypeScript + Tailwind v4 + shadcn/ui (20 componentes)
> - BD: Drizzle ORM con esquema completo de 17 tablas + 8 enums, migración aplicada en PostgreSQL
> - Auth provisional: `getCurrentUser()` con 3 usuarios demo (admin, evaluador, consulta)
> - Layout: Sidebar con navegación filtrada por rol + Header con badge/avatar
> - 21 rutas creadas y funcionando, build exitoso, app respondiendo en localhost:3000

**Fase 1.2 - Datos Maestros y Configuración** ✅ COMPLETADA
- CRUD de centros, áreas, puestos, colectivos, UAPs
- CRUD de trabajadores (alta manual)
- Configuración de plantillas de evaluación (pilares, niveles, ítems)
- Configuración 9-Box y tipos de plan de acción

> **Resumen implementación Fase 1.2:**
> - **Server Actions** para todos los datos maestros: centros, áreas, colectivos, puestos, UAPs, trabajadores, usuarios, plantillas, niveles, pilares, ítems, 9-Box, tipos de acción. Cada una con validación Zod, create/update/toggle.
> - **Componentes reutilizables**: `DataTable` (TanStack Table con sorting, filtros, paginación), `CrudDialog` (diálogo modal para crear/editar)
> - **7 páginas CRUD completas**: Centros, Áreas, Colectivos, Puestos, UAPs, Usuarios, Tipos de Acción. Cada una con Server Component (data fetching) + Client Component (tabla interactiva, formularios, toast notifications)
> - **CRUD Trabajadores**: formulario completo con selectores de centro, área, puesto, colectivo, UAP, fecha incorporación
> - **CRUD Plantillas**: listado con crear/activar/desactivar + editor de detalle con 4 tabs (Configuración general, Niveles, Pilares, Ítems). Gestión completa de niveles de competencia, pilares e ítems de evaluación por pilar/nivel
> - **Configuración 9-Box**: grid visual 3x3 (potencial x desempeño) con formularios inline para editar etiqueta, recomendación y color de cada celda
> - **Tabla `tipos_accion`** añadida al schema (no estaba en el PRD original)
> - 18 tablas en BD (17 originales + tipos_accion). Build exitoso

**Fase 1.3 - Evaluaciones** ✅ COMPLETADA
- Crear/realizar evaluaciones con formulario completo
- Motor de cálculo de competencias (NC Real, Esperado, Potencial, Status Global)
- Auto-guardado de respuestas
- Flujo completo: borrador → en curso → completada
- Plan de acción (registro simple)
- Observaciones

> **Resumen implementación Fase 1.3:**
> - **Motor de cálculo** (`src/lib/scoring-engine.ts`): Implementación completa del algoritmo de competencias — NC Real por pilar (recorrido secuencial de niveles con umbrales por antigüedad 80%/95%), NC Potencial global (5 categorías: No evaluable/Estático/Lateral/Promocionable/Potencial Alto), Status Global (%), y mapeo 9-Box (desempeño × potencial).
> - **Server Actions** (`src/app/actions/evaluaciones.ts`): 10 funciones — getEvaluaciones, getEvaluacion, getEvaluacionCompleta (carga completa con plantilla/trabajador/niveles/pilares/items/respuestas/resultados/planes), crearEvaluacion (pre-crea respuestas vacías para todos los ítems), guardarRespuesta (auto-save con upsert + cambio automático de estado borrador→en_curso), calcularResultadosParciales, finalizarEvaluacion, guardarObservaciones, crearPlanAccion, eliminarPlanAccion, eliminarEvaluacion.
> - **Lista de evaluaciones** (`/evaluaciones`): Tabla con columnas fecha/trabajador/evaluador/plantilla/estado/NC Potencial/Status%. Filtros por estado, centro y área. Botones editar (borrador/en_curso) o ver (completada/validada). Eliminar con confirmación AlertDialog.
> - **Nueva evaluación** (`/evaluaciones/nueva`): Buscador autocompletado de trabajadores, selección automática de plantilla según colectivo, cálculo de antigüedad en tiempo real, creación de evaluación con redirección al formulario.
> - **Formulario de evaluación** (`/evaluaciones/[id]`): Ítems agrupados por pilar con sub-agrupación por nivel. Toggle tabs/acordeón (preferencia persistida en localStorage). Botones coloreados Alcanzado/Parcial/No alcanzado con auto-save por respuesta. Barra de progreso (ítems respondidos/total). Botón "Calcular" para resultados parciales. Botón "Finalizar" con confirmación. Tabla de resultados parciales con % por nivel y NC Real/Esperado. Sección de observaciones con auto-save debounce. Plan de acción con crear (modal)/eliminar.
> - **Vista evaluación** (`/evaluaciones/[id]/ver`): Vista solo lectura con KPIs (NC Potencial, Status Global, Estado, Ítems respondidos), tabla de resultados por pilar con colores por umbral, detalle de respuestas en acordeón, observaciones y planes de acción.
> - 5 nuevos componentes shadcn/ui instalados: textarea, alert-dialog, progress, radio-group, scroll-area. Build exitoso con todas las rutas.

**Fase 1.4 - Informes y Exportación** ✅ COMPLETADA
- Informe individual del trabajador (con gráfico de barras)
- Informe global con filtros (centro, área, colectivo, UAP)
- Evolución temporal del trabajador
- Análisis por pilares
- Análisis de potencial
- 9-Box Grid
- Dashboard con KPIs
- Exportación PDF + Excel

> **Resumen implementación Fase 1.4:**
> - **Server Actions para informes** (`src/app/actions/informes.ts`): 6 funciones de agregación — getDashboardData (KPIs + datos por centro + distribución potencial), getInformeTrabajador (informe individual con última evaluación completada + lookup centro/área/colectivo/evaluador), getInformeGlobal (tabla con última evaluación por trabajador + NC Real por pilar + filtros), getEvolucionTrabajador (serie temporal de NC Real por pilar y Status Global), getAnalisisPilares (distribución trabajadores por nivel en cada pilar), getAnalisisPotencial (distribución NC Potencial por centro/área/colectivo), getNineboxData (clasificación 9-Box con config).
> - **Dashboard** (`/dashboard`): 4 KPIs cards (total evaluaciones, pendientes, completadas, status global medio). 2 gráficos Recharts: BarChart comparativo por centro (media status + completadas), PieChart distribución NC Potencial con colores.
> - **Informe Individual** (`/informes/trabajador/[id]`): Datos trabajador, KPIs, tabla matriz puntuaciones por pilar×nivel con colores (verde/amarillo/rojo vs umbral), referencia umbral (min), BarChart por pilar y nivel con ReferenceLine del umbral, plan de acción, observaciones. Botones exportar Excel/PDF. Link a evolución.
> - **Informe Global** (`/informes/global`): Tabla completa con trabajador, centro, área, NC Real por pilar, Status %, NC Potencial. Filtros por centro/área/colectivo + buscador por nombre. Botón exportar Excel. Link a informe individual por trabajador.
> - **Evolución Temporal** (`/informes/evolucion/[trabajadorId]`): LineChart con NC Real (orden de nivel) por pilar a lo largo del tiempo. LineChart Status Global %. Tabla detalle por evaluación con fecha/status/potencial/nivel por pilar.
> - **Análisis por Pilares** (`/informes/pilares`): BarChart stacked con distribución de trabajadores por nivel en cada pilar. Tabla detalle pilar×nivel→count.
> - **Análisis de Potencial** (`/informes/potencial`): PieChart distribución global NC Potencial. BarChart stacked por agrupación (selector centro/área/colectivo). Tabla detalle por trabajador con badge coloreado.
> - **9-Box Grid** (`/informes/ninebox`): Grid visual 3×3 (potencial×desempeño) con conteo por celda, colores según config, etiquetas de la BD. Click en celda muestra lista de trabajadores con NC Potencial, Status %, link a informe. Filtros por centro/área.
> - **Exportación Excel** (`/api/export/trabajador/[id]/excel`, `/api/export/global/excel`): Genera .xlsx con ExcelJS — cabecera, datos trabajador, tabla resultados con celdas coloreadas (verde/amarillo/rojo), planes de acción, observaciones. Informe global con filtros opcionales por query params.
> - **Exportación PDF** (`/api/export/trabajador/[id]/pdf`): Genera informe HTML imprimible (sin dependencia de rendering React server-side) con estilos inline, tabla coloreada, KPIs, plan de acción.
> - Build exitoso con 28 rutas (incluyendo 3 API routes de exportación).

**Fase 1.5 - Datos de Demo (Seed/Populate)** ✅ COMPLETADA

> **Implementación** (`src/lib/db/seed.ts` - ejecutar con `npx tsx src/lib/db/seed.ts`):
> - Script re-ejecutable (limpia todas las tablas antes de insertar) con 627 líneas.
> - **3 usuarios**: admin@demo.com (Admin Demo), evaluador@demo.com (Ada Fanjul), consulta@demo.com (Carlos López).
> - **5 centros**: Azucarera Toro, Miranda de Ebro, La Bañeza, Jerez de la Frontera, Guadalete.
> - **12 áreas**: Operaciones, Mantenimiento, Calidad, Laboratorio, Logística, Administración, RRHH, SyP, Ingeniería, Compras, IT, Agrícola.
> - **6 colectivos**: Línea de Mando, MOD, MOI, Técnicos, Administrativos, Dirección.
> - **40 UAPs**: 8 UAPs por centro (Mto1, Mto2, Fab1, Fab2, CES, Env1, Lab, Alm).
> - **173 puestos**: Cargados dinámicamente desde `docs/Agrupación Puestos - Modelo Competencias.xlsx`.
> - **7 tipos de acción**: Mentoring, Tutelaje, Formación Técnica, Supervisión, Plan de Carrera, Promoción, Formación Relacional.
> - **9 configuraciones 9-Box**: Con etiquetas, recomendaciones y colores.
> - **1 plantilla** "Competencias SyP - Línea de Mando" con 6 pilares, 4 niveles y 69 ítems (extraídos textualmente del Excel original).
> - **50 trabajadores** ficticios distribuidos por centros/áreas/colectivos (35 Línea de Mando + 15 otros).
> - **46 evaluaciones completadas** con 5 perfiles de respuesta (experto/avanzado/básico/inicial/irregular) y motor de cálculo ejecutado.
> - **10 trabajadores con evaluaciones históricas** (2 fechas) para demostrar evolución temporal.
> - **33 planes de acción** de ejemplo vinculados a 15 evaluaciones.

### Hito 2: Integración SAP (Producción)

Objetivo: Conectar la aplicación con los web services de SAP para sincronizar datos maestros en tiempo real y preparar la puesta en producción.

**Fase 2.1 - Autenticación por Token (Launchpad)**
- La app se lanza desde un launchpad corporativo que pasa un token de sesión en la URL
- Middleware que intercepta todas las peticiones y valida el token contra la API del launchpad
- Si el token es válido: se permite el acceso y se identifica al usuario (rol, nombre, etc.)
- Si el token es inválido o ha caducado: se muestra pantalla de error indicando que la sesión ha expirado
- El token caduca periódicamente y se renueva automáticamente. Si el usuario tiene la app abierta y el token caduca, al realizar cualquier acción (navegación, guardado, etc.) se revalida el token y se muestra error si ha expirado
- Mapeo de usuarios del launchpad → usuarios de la app

**Fase 2.2 - Web Services SAP**
- API de sincronización de trabajadores (lectura desde SAP)
- API de sincronización de puestos y estructura organizativa
- API de escritura: enviar resultados de evaluaciones a SAP (si aplica)
- Gestión de errores y reintentos
- Log de sincronizaciones
- Panel de administración de integraciones

**Fase 2.3 - Seguimiento de Planes de Acción**
- Estados del plan (pendiente/en curso/completado)
- Notificaciones por email
- Recordatorios automáticos de fechas de seguimiento

**Fase 2.4 - Recálculo Masivo**
- Botón en admin para recalcular todas las evaluaciones completadas de una plantilla (ante cambios de umbrales o configuración)
- Ejecución en background con progreso visible
- Log de recálculos realizados

**Fase 2.5 - Puesta en Producción**
- Migración de datos reales desde SAP
- Testing con usuarios reales
- Ajustes de rendimiento
- Auditoría de cambios (log de quién modificó qué)

---

## 11. Verificación y Testing

### Para verificar la implementación:
1. **Crear la plantilla seed** con los datos del Excel y verificar que los 69 ítems están correctamente distribuidos por pilar y nivel
2. **Realizar una evaluación de prueba** con los mismos datos del Excel (trabajador "Pepe Perez", evaluadora "Ada Fanjul") y verificar que los cálculos coinciden
3. **Probar los umbrales**: crear evaluaciones con antigüedad < 3 años y >= 3 años y verificar que los umbrales 80% y 95% se aplican correctamente
4. **Verificar la regla secuencial**: comprobar que si un nivel no se alcanza, los superiores no se evalúan
5. **Verificar NC Potencial**: crear evaluaciones con distintas distribuciones de pilares y verificar las 5 categorías
6. **Exportar informes** y comparar visualmente con las pestañas 3 y 4 del Excel original
7. **Probar filtros** del informe global por centro, área, colectivo, UAP
