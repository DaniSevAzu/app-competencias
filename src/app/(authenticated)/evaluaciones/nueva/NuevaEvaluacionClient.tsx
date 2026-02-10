"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crearEvaluacion } from "@/app/actions/evaluaciones";
import { toast } from "sonner";

type Trabajador = {
  id: string;
  nombre: string;
  apellidos: string;
  colectivoId: number | null;
  fechaIncorporacionPuesto: string;
  centroId: number | null;
  areaId: number | null;
};

type Plantilla = {
  id: number;
  nombre: string;
  colectivoId: number | null;
  activa: boolean;
};

interface Props {
  trabajadores: Trabajador[];
  plantillas: Plantilla[];
  colectivos: { id: number; nombre: string }[];
  evaluadorId: string;
}

function calcularAntiguedad(fechaIncorporacion: string, fechaEvaluacion: string): number {
  const inicio = new Date(fechaIncorporacion);
  const eval_ = new Date(fechaEvaluacion);
  const diff = eval_.getTime() - inicio.getTime();
  return Math.max(0, diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function NuevaEvaluacionClient({
  trabajadores,
  plantillas,
  colectivos,
  evaluadorId,
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<number | null>(null);
  const [fechaEvaluacion, setFechaEvaluacion] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  const filteredTrabajadores = searchTerm.length >= 2
    ? trabajadores.filter(
        (t) =>
          `${t.apellidos} ${t.nombre}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${t.nombre} ${t.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const plantillasDisponibles = selectedTrabajador
    ? plantillas.filter(
        (p) =>
          !p.colectivoId || p.colectivoId === selectedTrabajador.colectivoId
      )
    : [];

  // Auto-seleccionar plantilla si solo hay una
  const autoPlantilla =
    plantillasDisponibles.length === 1 ? plantillasDisponibles[0].id : selectedPlantillaId;

  const antiguedad = selectedTrabajador
    ? calcularAntiguedad(selectedTrabajador.fechaIncorporacionPuesto, fechaEvaluacion)
    : 0;

  const colectivoNombre = selectedTrabajador?.colectivoId
    ? colectivos.find((c) => c.id === selectedTrabajador.colectivoId)?.nombre
    : null;

  async function handleCrear() {
    if (!selectedTrabajador || !autoPlantilla) return;
    setLoading(true);
    try {
      const result = await crearEvaluacion({
        trabajadorId: selectedTrabajador.id,
        evaluadorId,
        plantillaId: autoPlantilla,
        fechaEvaluacion,
        antiguedadAnos: Math.round(antiguedad * 100) / 100,
      });
      if (result.success && result.id) {
        toast.success("Evaluación creada");
        router.push(`/evaluaciones/${result.id}`);
      } else {
        toast.error("Error al crear la evaluación");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>1. Seleccionar trabajador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="search">Buscar trabajador</Label>
            <Input
              id="search"
              placeholder="Escriba al menos 2 caracteres..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.length < 2) setSelectedTrabajador(null);
              }}
            />
          </div>
          {filteredTrabajadores.length > 0 && !selectedTrabajador && (
            <div className="max-h-60 overflow-y-auto rounded-md border">
              {filteredTrabajadores.slice(0, 20).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setSelectedTrabajador(t);
                    setSearchTerm(`${t.apellidos}, ${t.nombre}`);
                  }}
                >
                  <span className="font-medium">{t.apellidos}, {t.nombre}</span>
                </button>
              ))}
            </div>
          )}
          {selectedTrabajador && (
            <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
              <p>
                <strong>Trabajador:</strong> {selectedTrabajador.apellidos},{" "}
                {selectedTrabajador.nombre}
              </p>
              {colectivoNombre && (
                <p>
                  <strong>Colectivo:</strong> {colectivoNombre}
                </p>
              )}
              <p>
                <strong>Fecha incorporación:</strong>{" "}
                {new Date(selectedTrabajador.fechaIncorporacionPuesto).toLocaleDateString("es-ES")}
              </p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto"
                onClick={() => {
                  setSelectedTrabajador(null);
                  setSearchTerm("");
                  setSelectedPlantillaId(null);
                }}
              >
                Cambiar trabajador
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Configurar evaluación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fecha">Fecha de evaluación</Label>
            <Input
              id="fecha"
              type="date"
              value={fechaEvaluacion}
              onChange={(e) => setFechaEvaluacion(e.target.value)}
            />
          </div>

          {selectedTrabajador && (
            <>
              <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-sm">
                <p>
                  <strong>Antigüedad en puesto:</strong>{" "}
                  {antiguedad >= 1
                    ? `${Math.floor(antiguedad)} año(s) y ${Math.round(
                        (antiguedad % 1) * 12
                      )} mes(es)`
                    : `${Math.round(antiguedad * 12)} mes(es)`}
                </p>
              </div>

              <div>
                <Label htmlFor="plantilla">Plantilla de evaluación</Label>
                {plantillasDisponibles.length === 0 ? (
                  <p className="text-sm text-destructive mt-1">
                    No hay plantillas disponibles para el colectivo de este trabajador.
                  </p>
                ) : plantillasDisponibles.length === 1 ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    {plantillasDisponibles[0].nombre} (seleccionada automáticamente)
                  </p>
                ) : (
                  <select
                    id="plantilla"
                    value={selectedPlantillaId ?? ""}
                    onChange={(e) =>
                      setSelectedPlantillaId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm mt-1"
                  >
                    <option value="">-- Seleccionar plantilla --</option>
                    {plantillasDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <Button
                className="w-full"
                disabled={!autoPlantilla || loading}
                onClick={handleCrear}
              >
                {loading ? "Creando..." : "Crear evaluación e iniciar"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
