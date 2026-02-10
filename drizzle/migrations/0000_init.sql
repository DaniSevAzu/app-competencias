CREATE TYPE "public"."estado_evaluacion" AS ENUM('borrador', 'en_curso', 'completada', 'validada');--> statement-breakpoint
CREATE TYPE "public"."estado_plan" AS ENUM('pendiente', 'en_curso', 'completado');--> statement-breakpoint
CREATE TYPE "public"."estado_sync" AS ENUM('iniciado', 'completado', 'error');--> statement-breakpoint
CREATE TYPE "public"."ninebox_nivel" AS ENUM('bajo', 'medio', 'alto');--> statement-breakpoint
CREATE TYPE "public"."tipo_criterio" AS ENUM('subjetivo', 'objetivo');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'evaluador', 'consulta');--> statement-breakpoint
CREATE TYPE "public"."valor_respuesta" AS ENUM('alcanzado', 'parcialmente_alcanzado', 'no_alcanzado');--> statement-breakpoint
CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "centros" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "colectivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trabajador_id" uuid NOT NULL,
	"evaluador_id" uuid NOT NULL,
	"plantilla_id" integer NOT NULL,
	"fecha_evaluacion" date NOT NULL,
	"antiguedad_anos" numeric NOT NULL,
	"estado" "estado_evaluacion" DEFAULT 'borrador' NOT NULL,
	"observaciones" text,
	"nc_potencial_global" varchar(50),
	"status_global_pct" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items_evaluacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"pilar_id" integer NOT NULL,
	"nivel_id" integer NOT NULL,
	"texto" text NOT NULL,
	"tipo_criterio" "tipo_criterio" NOT NULL,
	"expectativa" text,
	"orden" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ninebox_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"potencial" "ninebox_nivel" NOT NULL,
	"desempeno" "ninebox_nivel" NOT NULL,
	"etiqueta" varchar(255) NOT NULL,
	"recomendacion" text NOT NULL,
	"color" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "niveles" (
	"id" serial PRIMARY KEY NOT NULL,
	"plantilla_id" integer NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"orden" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilares" (
	"id" serial PRIMARY KEY NOT NULL,
	"plantilla_id" integer NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"orden" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planes_accion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluacion_id" uuid NOT NULL,
	"pilar_id" integer,
	"tipo_accion" varchar(255),
	"accion_concreta" text NOT NULL,
	"fecha_inicio" date,
	"fecha_seguimiento" date,
	"observaciones" text,
	"estado" "estado_plan" DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plantillas_evaluacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"descripcion" text,
	"colectivo_id" integer,
	"nc_esperado_default" varchar(50) DEFAULT 'Avanzado',
	"umbral_antiguedad_baja" numeric DEFAULT '80',
	"umbral_antiguedad_alta" numeric DEFAULT '95',
	"anos_umbral" integer DEFAULT 3,
	"version" integer DEFAULT 1,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "puestos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50),
	"nombre" varchar(255) NOT NULL,
	"area_id" integer,
	"perfil_syp" varchar(255),
	"subperfil_syp" varchar(255),
	"agrupacion_comp" varchar(255),
	"ambito" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "puestos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "respuestas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluacion_id" uuid NOT NULL,
	"item_id" integer NOT NULL,
	"valor" "valor_respuesta",
	"puntuacion" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resultados_pilar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluacion_id" uuid NOT NULL,
	"pilar_id" integer NOT NULL,
	"nivel_real_id" integer,
	"nc_esperado" varchar(50) DEFAULT 'Avanzado',
	"puntuacion_nivel_1" numeric,
	"puntuacion_nivel_2" numeric,
	"puntuacion_nivel_3" numeric,
	"puntuacion_nivel_4" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"estado" "estado_sync" NOT NULL,
	"registros_procesados" integer DEFAULT 0,
	"registros_errores" integer DEFAULT 0,
	"detalle_error" text,
	"iniciado_por" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "trabajadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(255),
	"nombre" varchar(255) NOT NULL,
	"apellidos" varchar(255) NOT NULL,
	"email" varchar(255),
	"puesto_id" integer,
	"area_id" integer,
	"centro_id" integer,
	"uap_id" integer,
	"colectivo_id" integer,
	"fecha_incorporacion_puesto" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trabajadores_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "uaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nombre" varchar(255),
	"centro_id" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"role" "user_role" DEFAULT 'consulta' NOT NULL,
	"external_token_id" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_trabajador_id_trabajadores_id_fk" FOREIGN KEY ("trabajador_id") REFERENCES "public"."trabajadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_evaluador_id_users_id_fk" FOREIGN KEY ("evaluador_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_plantilla_id_plantillas_evaluacion_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas_evaluacion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_evaluacion" ADD CONSTRAINT "items_evaluacion_pilar_id_pilares_id_fk" FOREIGN KEY ("pilar_id") REFERENCES "public"."pilares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_evaluacion" ADD CONSTRAINT "items_evaluacion_nivel_id_niveles_id_fk" FOREIGN KEY ("nivel_id") REFERENCES "public"."niveles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "niveles" ADD CONSTRAINT "niveles_plantilla_id_plantillas_evaluacion_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas_evaluacion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilares" ADD CONSTRAINT "pilares_plantilla_id_plantillas_evaluacion_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas_evaluacion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planes_accion" ADD CONSTRAINT "planes_accion_evaluacion_id_evaluaciones_id_fk" FOREIGN KEY ("evaluacion_id") REFERENCES "public"."evaluaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planes_accion" ADD CONSTRAINT "planes_accion_pilar_id_pilares_id_fk" FOREIGN KEY ("pilar_id") REFERENCES "public"."pilares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantillas_evaluacion" ADD CONSTRAINT "plantillas_evaluacion_colectivo_id_colectivos_id_fk" FOREIGN KEY ("colectivo_id") REFERENCES "public"."colectivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "puestos" ADD CONSTRAINT "puestos_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_evaluacion_id_evaluaciones_id_fk" FOREIGN KEY ("evaluacion_id") REFERENCES "public"."evaluaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_item_id_items_evaluacion_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items_evaluacion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados_pilar" ADD CONSTRAINT "resultados_pilar_evaluacion_id_evaluaciones_id_fk" FOREIGN KEY ("evaluacion_id") REFERENCES "public"."evaluaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados_pilar" ADD CONSTRAINT "resultados_pilar_pilar_id_pilares_id_fk" FOREIGN KEY ("pilar_id") REFERENCES "public"."pilares"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados_pilar" ADD CONSTRAINT "resultados_pilar_nivel_real_id_niveles_id_fk" FOREIGN KEY ("nivel_real_id") REFERENCES "public"."niveles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_iniciado_por_users_id_fk" FOREIGN KEY ("iniciado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_puesto_id_puestos_id_fk" FOREIGN KEY ("puesto_id") REFERENCES "public"."puestos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_centro_id_centros_id_fk" FOREIGN KEY ("centro_id") REFERENCES "public"."centros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_uap_id_uaps_id_fk" FOREIGN KEY ("uap_id") REFERENCES "public"."uaps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_colectivo_id_colectivos_id_fk" FOREIGN KEY ("colectivo_id") REFERENCES "public"."colectivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uaps" ADD CONSTRAINT "uaps_centro_id_centros_id_fk" FOREIGN KEY ("centro_id") REFERENCES "public"."centros"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_evaluaciones_trabajador" ON "evaluaciones" USING btree ("trabajador_id");--> statement-breakpoint
CREATE INDEX "idx_evaluaciones_evaluador" ON "evaluaciones" USING btree ("evaluador_id");--> statement-breakpoint
CREATE INDEX "idx_evaluaciones_fecha" ON "evaluaciones" USING btree ("fecha_evaluacion");--> statement-breakpoint
CREATE INDEX "idx_evaluaciones_estado" ON "evaluaciones" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "idx_items_pilar_nivel" ON "items_evaluacion" USING btree ("pilar_id","nivel_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ninebox_potencial_desempeno" ON "ninebox_config" USING btree ("potencial","desempeno");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_niveles_plantilla_orden" ON "niveles" USING btree ("plantilla_id","orden");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pilares_plantilla_orden" ON "pilares" USING btree ("plantilla_id","orden");--> statement-breakpoint
CREATE INDEX "idx_planes_evaluacion" ON "planes_accion" USING btree ("evaluacion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_respuestas_evaluacion_item" ON "respuestas" USING btree ("evaluacion_id","item_id");--> statement-breakpoint
CREATE INDEX "idx_respuestas_evaluacion" ON "respuestas" USING btree ("evaluacion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_resultados_evaluacion_pilar" ON "resultados_pilar" USING btree ("evaluacion_id","pilar_id");--> statement-breakpoint
CREATE INDEX "idx_trabajadores_centro" ON "trabajadores" USING btree ("centro_id");--> statement-breakpoint
CREATE INDEX "idx_trabajadores_area" ON "trabajadores" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "idx_trabajadores_colectivo" ON "trabajadores" USING btree ("colectivo_id");--> statement-breakpoint
CREATE INDEX "idx_trabajadores_puesto" ON "trabajadores" USING btree ("puesto_id");--> statement-breakpoint
CREATE INDEX "idx_trabajadores_external" ON "trabajadores" USING btree ("external_id");