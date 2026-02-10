"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  guardarRespuesta,
  guardarObservaciones,
  calcularResultadosParciales,
  finalizarEvaluacion,
  crearPlanAccion,
  eliminarPlanAccion,
} from "@/app/actions/evaluaciones";
import { toast } from "sonner";
import {
  LayoutList,
  LayoutGrid,
  Calculator,
  CheckCircle2,
  Save,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { ConfirmDeleteButton } from "@/components/shared/ConfirmDeleteButton";
import Link from "next/link";

type ValorRespuesta = "alcanzado" | "parcialmente_alcanzado" | "no_alcanzado";

interface Props {
  evaluacion: {
    id: string;
    trabajadorId: string;
    evaluadorId: string;
    plantillaId: number;
    fechaEvaluacion: string;
    antiguedadAnos: string;
    estado: string;
    observaciones: string | null;
    ncPotencialGlobal: string | null;
    statusGlobalPct: string | null;
  };
  plantilla: {
    id: number;
    nombre: string;
  };
  trabajador: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  niveles: {
    id: number;
    nombre: string;
    codigo: string;
    orden: number;
  }[];
  pilares: {
    id: number;
    nombre: string;
    orden: number;
  }[];
  items: {
    id: number;
    pilarId: number;
    nivelId: number;
    texto: string;
    tipoCriterio: string;
    expectativa: string | null;
    orden: number;
  }[];
  respuestas: {
    id: string;
    evaluacionId: string;
    itemId: number;
    valor: string | null;
    puntuacion: number | null;
  }[];
  resultados: {
    id: string;
    pilarId: number;
    nivelRealId: number | null;
    ncEsperado: string | null;
    puntuacionNivel1: string | null;
    puntuacionNivel2: string | null;
    puntuacionNivel3: string | null;
    puntuacionNivel4: string | null;
  }[];
  planes: {
    id: string;
    pilarId: number | null;
    tipoAccion: string | null;
    accionConcreta: string;
    fechaInicio: string | null;
    fechaSeguimiento: string | null;
    observaciones: string | null;
    estado: string;
  }[];
  tiposAccion: { id: number; nombre: string }[];
}

const STORAGE_KEY = "evaluacion-view-mode";

export function EvaluacionFormClient({
  evaluacion,
  plantilla,
  trabajador,
  niveles,
  pilares,
  items,
  respuestas: initialRespuestas,
  resultados: initialResultados,
  planes: initialPlanes,
  tiposAccion,
}: Props) {
  const router = useRouter();

  // View mode (tabs vs accordion) persisted in localStorage
  const [viewMode, setViewMode] = useState<"tabs" | "accordion">("tabs");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as "tabs" | "accordion" | null;
    if (saved) setViewMode(saved);
  }, []);

  // Local state for respuestas (optimistic updates)
  const [respuestasMap, setRespuestasMap] = useState<Record<number, string | null>>(() => {
    const map: Record<number, string | null> = {};
    for (const r of initialRespuestas) {
      map[r.itemId] = r.valor;
    }
    return map;
  });

  const [resultados, setResultados] = useState(initialResultados);
  const [planes, setPlanes] = useState(initialPlanes);
  const [observaciones, setObservaciones] = useState(evaluacion.observaciones ?? "");
  const [saving, setSaving] = useState<number | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [activeTab, setActiveTab] = useState(String(pilares[0]?.id ?? ""));
  const [openAccordion, setOpenAccordion] = useState<string[]>(pilares.map((p) => String(p.id)));
  const [finalizando, setFinalizando] = useState(false);
  const [obsTimer, setObsTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode);
  }, [viewMode]);

  // Calculate progress
  const totalItems = items.length;
  const respondedItems = Object.values(respuestasMap).filter((v) => v !== null).length;
  const progressPct = totalItems > 0 ? (respondedItems / totalItems) * 100 : 0;

  // Auto-save respuesta
  const handleRespuesta = useCallback(
    async (itemId: number, valor: ValorRespuesta) => {
      setRespuestasMap((prev) => ({ ...prev, [itemId]: valor }));
      setSaving(itemId);
      try {
        await guardarRespuesta(evaluacion.id, itemId, valor);
      } catch {
        toast.error("Error al guardar respuesta");
      } finally {
        setSaving(null);
      }
    },
    [evaluacion.id]
  );

  // Auto-save observaciones with debounce
  const handleObservaciones = useCallback(
    (value: string) => {
      setObservaciones(value);
      if (obsTimer) clearTimeout(obsTimer);
      const timer = setTimeout(async () => {
        try {
          await guardarObservaciones(evaluacion.id, value);
        } catch {
          toast.error("Error al guardar observaciones");
        }
      }, 1000);
      setObsTimer(timer);
    },
    [evaluacion.id, obsTimer]
  );

  // Calcular resultados parciales y navegar a Resumen
  const handleCalcular = async () => {
    setCalculando(true);
    try {
      const result = await calcularResultadosParciales(evaluacion.id);
      if (result.success) {
        toast.success("Resultados calculados");
        setActiveTab("resumen");
        if (!openAccordion.includes("resumen")) {
          setOpenAccordion((prev) => [...prev, "resumen"]);
        }
        router.refresh();
      }
    } catch {
      toast.error("Error al calcular");
    } finally {
      setCalculando(false);
    }
  };

  // Finalizar evaluación
  const handleFinalizar = async () => {
    setFinalizando(true);
    try {
      const result = await finalizarEvaluacion(evaluacion.id);
      if (result.success) {
        toast.success("Evaluación finalizada");
        router.push(`/evaluaciones/${evaluacion.id}/ver`);
      }
    } catch {
      toast.error("Error al finalizar");
    } finally {
      setFinalizando(false);
    }
  };

  const nivelesOrdenados = [...niveles].sort((a, b) => a.orden - b.orden);
  const pilaresOrdenados = [...pilares].sort((a, b) => a.orden - b.orden);

  // Count responses per pilar
  function getPilarProgress(pilarId: number) {
    const pilarItems = items.filter((i) => i.pilarId === pilarId);
    const responded = pilarItems.filter((i) => respuestasMap[i.id] !== null).length;
    return { total: pilarItems.length, responded };
  }

  // Render item response selector
  function renderItem(item: (typeof items)[0]) {
    const currentValue = respuestasMap[item.id];
    const isSaving = saving === item.id;

    return (
      <div key={item.id} className="border rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium">{item.texto}</p>
            {item.expectativa && (
              <p className="text-xs text-muted-foreground mt-1">{item.expectativa}</p>
            )}
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            {item.tipoCriterio === "subjetivo" ? "Subj." : "Obj."}
          </Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(
            [
              { value: "alcanzado", label: "Alcanzado", color: "bg-green-100 border-green-500 text-green-800" },
              { value: "parcialmente_alcanzado", label: "Parcial", color: "bg-yellow-100 border-yellow-500 text-yellow-800" },
              { value: "no_alcanzado", label: "No alcanzado", color: "bg-red-100 border-red-500 text-red-800" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={isSaving}
              className={`px-3 py-1.5 text-xs rounded-md border-2 transition-all ${
                currentValue === opt.value
                  ? opt.color + " font-semibold"
                  : "border-transparent bg-muted hover:bg-muted/80"
              }`}
              onClick={() => handleRespuesta(item.id, opt.value)}
            >
              {opt.label}
            </button>
          ))}
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Save className="h-3 w-3 animate-pulse" />
              Guardando...
            </span>
          )}
        </div>
      </div>
    );
  }

  // Render items grouped by nivel for a pilar
  function renderPilarContent(pilarId: number) {
    return (
      <div className="space-y-4">
        {nivelesOrdenados.map((nivel) => {
          const nivelItems = items
            .filter((i) => i.pilarId === pilarId && i.nivelId === nivel.id)
            .sort((a, b) => a.orden - b.orden);

          if (nivelItems.length === 0) return null;

          const respondedNivel = nivelItems.filter((i) => respuestasMap[i.id] !== null).length;

          return (
            <div key={nivel.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                  {nivel.nombre}
                </h4>
                <span className="text-xs text-muted-foreground">
                  ({respondedNivel}/{nivelItems.length})
                </span>
              </div>
              <div className="space-y-2">
                {nivelItems.map(renderItem)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Render resultados parciales
  function renderResultados() {
    if (resultados.length === 0) return null;

    const nivelMap = Object.fromEntries(niveles.map((n) => [n.id, n.nombre]));

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultados parciales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Pilar</th>
                  {nivelesOrdenados.map((n) => (
                    <th key={n.id} className="text-center py-2 px-2">{n.nombre}</th>
                  ))}
                  <th className="text-center py-2 px-2">NC Real</th>
                  <th className="text-center py-2 px-2">NC Esperado</th>
                </tr>
              </thead>
              <tbody>
                {pilaresOrdenados.map((pilar) => {
                  const res = resultados.find((r) => r.pilarId === pilar.id);
                  if (!res) return null;

                  const pcts = [
                    res.puntuacionNivel1,
                    res.puntuacionNivel2,
                    res.puntuacionNivel3,
                    res.puntuacionNivel4,
                  ];

                  return (
                    <tr key={pilar.id} className="border-b">
                      <td className="py-2 pr-4 font-medium">{pilar.nombre}</td>
                      {nivelesOrdenados.map((n, idx) => {
                        const pct = pcts[idx];
                        return (
                          <td key={n.id} className="text-center py-2 px-2">
                            {pct !== null ? `${Number(pct).toFixed(0)}%` : "-"}
                          </td>
                        );
                      })}
                      <td className="text-center py-2 px-2">
                        <Badge variant={res.nivelRealId ? "default" : "secondary"}>
                          {res.nivelRealId ? nivelMap[res.nivelRealId] ?? "-" : "Sin nivel"}
                        </Badge>
                      </td>
                      <td className="text-center py-2 px-2">{res.ncEsperado ?? "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {evaluacion.ncPotencialGlobal && (
            <div className="mt-4 flex gap-4 text-sm">
              <span>
                <strong>NC Potencial:</strong> {evaluacion.ncPotencialGlobal}
              </span>
              {evaluacion.statusGlobalPct && (
                <span>
                  <strong>Status Global:</strong>{" "}
                  {Number(evaluacion.statusGlobalPct).toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render planes de acción
  function renderPlanes() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Plan de Acción
            <PlanAccionDialog
              evaluacionId={evaluacion.id}
              pilares={pilaresOrdenados}
              tiposAccion={tiposAccion}
              onCreated={() => router.refresh()}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {planes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay planes de acción registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {planes.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{plan.accionConcreta}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        {plan.tipoAccion && <span>Tipo: {plan.tipoAccion}</span>}
                        {plan.pilarId && (
                          <span>
                            Pilar:{" "}
                            {pilaresOrdenados.find((p) => p.id === plan.pilarId)?.nombre ?? "-"}
                          </span>
                        )}
                        {plan.fechaInicio && (
                          <span>
                            Inicio: {new Date(plan.fechaInicio).toLocaleDateString("es-ES")}
                          </span>
                        )}
                        {plan.fechaSeguimiento && (
                          <span>
                            Seguimiento:{" "}
                            {new Date(plan.fechaSeguimiento).toLocaleDateString("es-ES")}
                          </span>
                        )}
                      </div>
                    </div>
                    <ConfirmDeleteButton
                      description="El plan de acción se eliminará permanentemente."
                      onConfirm={async () => {
                        await eliminarPlanAccion(plan.id, evaluacion.id);
                        router.refresh();
                      }}
                    />
                  </div>
                  {plan.observaciones && (
                    <p className="text-xs text-muted-foreground">{plan.observaciones}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/evaluaciones">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {trabajador.apellidos}, {trabajador.nombre}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            {plantilla.nombre} &middot;{" "}
            {new Date(evaluacion.fechaEvaluacion).toLocaleDateString("es-ES")} &middot;
            Antigüedad: {Number(evaluacion.antiguedadAnos).toFixed(1)} años
          </p>
        </div>
        <div className="flex items-center gap-2 ml-10 sm:ml-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "tabs" ? "accordion" : "tabs")}
          >
            {viewMode === "tabs" ? (
              <LayoutList className="h-4 w-4 mr-1" />
            ) : (
              <LayoutGrid className="h-4 w-4 mr-1" />
            )}
            {viewMode === "tabs" ? "Acordeón" : "Pestañas"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleCalcular} disabled={calculando}>
            <Calculator className="h-4 w-4 mr-1" />
            {calculando ? "Calculando..." : "Calcular"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" disabled={finalizando || respondedItems < totalItems}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Finalizar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar evaluación</AlertDialogTitle>
                <AlertDialogDescription>
                  Se calcularán los resultados definitivos y la evaluación pasará a estado
                  &quot;completada&quot;. No se podrán modificar las respuestas después.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinalizar}>
                  {finalizando ? "Finalizando..." : "Confirmar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progreso: {respondedItems} / {totalItems} ítems respondidos
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progressPct)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </CardContent>
      </Card>

      {/* Pilares + Resumen - Tabs or Accordion */}
      {viewMode === "tabs" ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {pilaresOrdenados.map((pilar) => {
              const { total, responded } = getPilarProgress(pilar.id);
              return (
                <TabsTrigger key={pilar.id} value={String(pilar.id)} className="text-xs sm:text-sm">
                  {pilar.nombre}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({responded}/{total})
                  </span>
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="resumen" className="text-xs sm:text-sm">
              Resumen y Plan
            </TabsTrigger>
          </TabsList>
          {pilaresOrdenados.map((pilar) => (
            <TabsContent key={pilar.id} value={String(pilar.id)} className="mt-4">
              {renderPilarContent(pilar.id)}
            </TabsContent>
          ))}
          <TabsContent value="resumen" className="mt-4 space-y-6">
            {renderResultados()}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observaciones generales</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Escriba observaciones generales sobre la evaluación..."
                  value={observaciones}
                  onChange={(e) => handleObservaciones(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
            {renderPlanes()}
          </TabsContent>
        </Tabs>
      ) : (
        <Accordion type="multiple" value={openAccordion} onValueChange={setOpenAccordion}>
          {pilaresOrdenados.map((pilar) => {
            const { total, responded } = getPilarProgress(pilar.id);
            return (
              <AccordionItem key={pilar.id} value={String(pilar.id)}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    {pilar.nombre}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({responded}/{total})
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>{renderPilarContent(pilar.id)}</AccordionContent>
              </AccordionItem>
            );
          })}
          <AccordionItem value="resumen">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                Resumen y Plan
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6 pt-2">
                {renderResultados()}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Observaciones generales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Escriba observaciones generales sobre la evaluación..."
                      value={observaciones}
                      onChange={(e) => handleObservaciones(e.target.value)}
                      rows={4}
                    />
                  </CardContent>
                </Card>
                {renderPlanes()}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

// Sub-component: Dialog para crear plan de acción
function PlanAccionDialog({
  evaluacionId,
  pilares,
  tiposAccion,
  onCreated,
}: {
  evaluacionId: string;
  pilares: { id: number; nombre: string }[];
  tiposAccion: { id: number; nombre: string }[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Añadir
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md shadow-lg mx-4">
            <h3 className="text-lg font-semibold mb-4">Nuevo Plan de Acción</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const fd = new FormData(e.currentTarget);
                try {
                  await crearPlanAccion({
                    evaluacionId,
                    pilarId: fd.get("pilarId") ? Number(fd.get("pilarId")) : undefined,
                    tipoAccion: (fd.get("tipoAccion") as string) || undefined,
                    accionConcreta: fd.get("accionConcreta") as string,
                    fechaInicio: (fd.get("fechaInicio") as string) || undefined,
                    fechaSeguimiento: (fd.get("fechaSeguimiento") as string) || undefined,
                    observaciones: (fd.get("observaciones") as string) || undefined,
                  });
                  toast.success("Plan de acción creado");
                  setOpen(false);
                  onCreated();
                } catch {
                  toast.error("Error al crear plan");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-3"
            >
              <div>
                <Label>Acción concreta *</Label>
                <Textarea name="accionConcreta" required rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pilar</Label>
                  <select name="pilarId" className={selectClass}>
                    <option value="">-- Ninguno --</option>
                    {pilares.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Tipo de acción</Label>
                  <select name="tipoAccion" className={selectClass}>
                    <option value="">-- Ninguno --</option>
                    {tiposAccion.map((t) => (
                      <option key={t.id} value={t.nombre}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha inicio</Label>
                  <Input name="fechaInicio" type="date" />
                </div>
                <div>
                  <Label>Fecha seguimiento</Label>
                  <Input name="fechaSeguimiento" type="date" />
                </div>
              </div>
              <div>
                <Label>Observaciones</Label>
                <Textarea name="observaciones" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
