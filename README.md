# Competencias SyP

Aplicaci&oacute;n web para la gesti&oacute;n de evaluaciones de competencias de **Seguridad y Prevenci&oacute;n (SyP)** en entornos industriales. Digitaliza el proceso que anteriormente se realizaba con hojas Excel: configurar cuestionarios, realizar evaluaciones, calcular niveles de competencia y generar informes.

## Stack Tecnol&oacute;gico

| Componente | Tecnolog&iacute;a |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL 16 |
| ORM | Drizzle ORM |
| UI | Tailwind CSS v4 + shadcn/ui |
| Tablas | TanStack Table |
| Gr&aacute;ficos | Recharts |
| Export PDF | jsPDF + jspdf-autotable |
| Export Excel | ExcelJS |
| Validaci&oacute;n | Zod |

## Estructura del Proyecto

```
src/
├── app/
│   ├── (authenticated)/       # Rutas protegidas con layout + sidebar
│   │   ├── admin/             # Datos maestros y configuraci&oacute;n
│   │   │   ├── areas/
│   │   │   ├── centros/
│   │   │   ├── colectivos/
│   │   │   ├── ninebox/       # Configuraci&oacute;n matriz 9-Box
│   │   │   ├── plantillas/    # Editor de plantillas de evaluaci&oacute;n
│   │   │   ├── puestos/
│   │   │   ├── tipos-accion/
│   │   │   ├── trabajadores/
│   │   │   ├── uaps/
│   │   │   └── usuarios/
│   │   ├── dashboard/         # Panel principal con KPIs
│   │   ├── evaluaciones/      # CRUD y formulario de evaluaci&oacute;n
│   │   └── informes/          # 6 informes distintos
│   │       ├── evolucion/     # Evoluci&oacute;n temporal por trabajador
│   │       ├── global/        # Informe global agregado
│   │       ├── ninebox/       # Matriz 9-Box interactiva
│   │       ├── pilares/       # An&aacute;lisis por pilares
│   │       ├── potencial/     # An&aacute;lisis de potencial
│   │       └── trabajador/    # Ficha individual
│   ├── actions/               # Server Actions (mutaciones)
│   └── api/export/            # Endpoints de exportaci&oacute;n Excel/PDF
├── components/
│   ├── layout/                # Sidebar y Header
│   ├── plantillas/            # SortableItemList (drag & drop)
│   ├── shared/                # CrudDialog, DataTable, ConfirmDeleteButton
│   └── ui/                    # Componentes shadcn/ui
└── lib/
    ├── db/                    # Drizzle: schema, conexi&oacute;n, seed
    ├── auth.ts                # Autenticaci&oacute;n provisional
    ├── scoring-engine.ts      # Motor de c&aacute;lculo de competencias
    └── utils.ts
```

## M&oacute;dulos Principales

### Datos Maestros (`/admin`)
Gesti&oacute;n CRUD de: centros de trabajo, &aacute;reas, colectivos, UAPs (Unidades Aut&oacute;nomas de Producci&oacute;n), puestos de trabajo, trabajadores y usuarios. Cada entidad tiene su p&aacute;gina con tabla filtrable y di&aacute;logos de creaci&oacute;n/edici&oacute;n.

### Plantillas de Evaluaci&oacute;n (`/admin/plantillas`)
Editor de plantillas que define la estructura de un cuestionario:
- **Niveles** de competencia (ej: Inicial, B&aacute;sico, Avanzado, Experto)
- **Pilares** tem&aacute;ticos (ej: Contratas, Estrategia, Gesti&oacute;n de Riesgos...)
- **&Iacute;tems** de evaluaci&oacute;n por cada combinaci&oacute;n pilar+nivel, con drag & drop para reordenar

### Motor de Evaluaci&oacute;n (`/evaluaciones`)
- Formulario paso a paso: el evaluador responde cada &iacute;tem con "Alcanzado", "Parcialmente alcanzado" o "No alcanzado"
- **Motor de c&aacute;lculo** (`scoring-engine.ts`): calcula autom&aacute;ticamente el NC Real por pilar, el NC Potencial Global y el Status Global %, teniendo en cuenta la antig&uuml;edad del trabajador
- Planes de acci&oacute;n asociados a cada evaluaci&oacute;n

### Informes (`/informes`)
| Informe | Descripci&oacute;n |
|---|---|
| **Dashboard** | 4 KPIs + gr&aacute;fico por centro + distribuci&oacute;n de potencial |
| **Ficha Trabajador** | Resultados detallados con tabla pilar&times;nivel coloreada |
| **Informe Global** | Tabla agregada de todos los trabajadores evaluados |
| **An&aacute;lisis por Pilares** | Comparativa de puntuaciones medias por pilar |
| **An&aacute;lisis de Potencial** | Distribuci&oacute;n de NC Potencial con filtros |
| **9-Box Grid** | Matriz potencial vs desempe&ntilde;o interactiva |
| **Evoluci&oacute;n** | Comparativa temporal entre evaluaciones de un trabajador |

### Exportaci&oacute;n
- **Excel**: informe individual del trabajador e informe global (ExcelJS)
- **PDF**: ficha individual del trabajador con tabla coloreada (jsPDF)

## Instalaci&oacute;n

### Requisitos
- Node.js 18+
- PostgreSQL 16

### Configuraci&oacute;n

1. Clonar el repositorio:
```bash
git clone https://github.com/DaniSevAzu/app-competencias.git
cd app-competencias
npm install
```

2. Crear archivos de entorno:

`.env` (para Drizzle Kit):
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/COMPETENCIASYP
```

`.env.local` (para Next.js):
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/COMPETENCIASYP
```

3. Ejecutar migraciones y seed:
```bash
npx drizzle-kit push
npx tsx src/lib/db/seed.ts
```

4. Iniciar el servidor:
```bash
npm run dev
```

La aplicaci&oacute;n estar&aacute; disponible en [http://localhost:3000](http://localhost:3000).

### Desarrollo vs Producci&oacute;n

El servidor de desarrollo corre en el puerto **3000** (usa Turbopack, hot reload, etc.) mientras producci&oacute;n sigue corriendo en el **3701** v&iacute;a PM2. Son procesos independientes, cada uno con su puerto. Cuando termines de desarrollar, haz build y reinicia PM2 para que producci&oacute;n refleje los cambios:

```bash
npm run build
pm2 restart competencias
```

### Datos de Demo
El seed crea un conjunto completo de datos para pruebas:
- 3 usuarios (admin, evaluador, consulta)
- 5 centros, 12 &aacute;reas, 6 colectivos, 40 UAPs
- 173 puestos de trabajo (importados desde Excel)
- 1 plantilla con 6 pilares, 4 niveles y 69 &iacute;tems
- 50 trabajadores ficticios
- ~46 evaluaciones completadas con respuestas y resultados calculados
- Planes de acci&oacute;n de ejemplo
- Configuraci&oacute;n 9-Box

## Roles de Usuario

| Rol | Permisos |
|---|---|
| **Admin** | Gesti&oacute;n completa: datos maestros, plantillas, evaluaciones, informes |
| **Evaluador** | Crear/editar evaluaciones, planes de acci&oacute;n, ver informes |
| **Consulta** | Solo lectura: informes, dashboard, exportaciones |

## Patrones de Desarrollo

- **Server Actions** para todas las mutaciones (no API routes)
- **Server Components** para data fetching, **Client Components** para interactividad
- Componentes reutilizables: `DataTable`, `CrudDialog`, `ConfirmDeleteButton`
- Validaci&oacute;n con Zod en server actions
- `revalidatePath` para actualizaci&oacute;n de datos tras mutaciones
