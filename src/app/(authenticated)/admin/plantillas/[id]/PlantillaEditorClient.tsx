"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrudDialog } from "@/components/shared/CrudDialog";
import {
  createNivel,
  updateNivel,
  deleteNivel,
  createPilar,
  updatePilar,
  deletePilar,
  createItem,
  updatePlantilla,
} from "@/app/actions/plantillas";
import { SortableItemList } from "@/components/plantillas/SortableItemList";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/shared/ConfirmDeleteButton";

type Nivel = {
  id: number;
  nombre: string;
  codigo: string;
  orden: number;
  plantillaId: number;
};

type Pilar = {
  id: number;
  nombre: string;
  orden: number;
  plantillaId: number;
};

type Item = {
  id: number;
  pilarId: number;
  nivelId: number;
  texto: string;
  tipoCriterio: "subjetivo" | "objetivo";
  expectativa: string | null;
  orden: number;
};

type Plantilla = {
  id: number;
  nombre: string;
  descripcion: string | null;
  ncEsperadoDefault: string | null;
  umbralAntiguedadBaja: string | null;
  umbralAntiguedadAlta: string | null;
  anosUmbral: number | null;
  niveles: Nivel[];
  pilares: Pilar[];
  items: Item[];
};

export function PlantillaEditorClient({
  plantilla,
}: {
  plantilla: Plantilla;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("config");

  const getItemsForPilarNivel = (pilarId: number, nivelId: number) =>
    plantilla.items
      .filter((i) => i.pilarId === pilarId && i.nivelId === nivelId)
      .sort((a, b) => a.orden - b.orden);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="config">Configuración</TabsTrigger>
        <TabsTrigger value="niveles">
          Niveles ({plantilla.niveles.length})
        </TabsTrigger>
        <TabsTrigger value="pilares">
          Pilares ({plantilla.pilares.length})
        </TabsTrigger>
        <TabsTrigger value="items">
          Ítems ({plantilla.items.length})
        </TabsTrigger>
      </TabsList>

      {/* TAB: Configuración general */}
      <TabsContent value="config">
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                const result = await updatePlantilla(plantilla.id, formData);
                if (result?.success) {
                  toast.success("Plantilla actualizada");
                  router.refresh();
                }
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nombre</Label>
                  <Input name="nombre" defaultValue={plantilla.nombre} required />
                </div>
                <div>
                  <Label>NC Esperado por defecto</Label>
                  <Input
                    name="ncEsperadoDefault"
                    defaultValue={plantilla.ncEsperadoDefault ?? "Avanzado"}
                  />
                </div>
                <div>
                  <Label>Umbral baja antigüedad (%)</Label>
                  <Input
                    name="umbralAntiguedadBaja"
                    type="number"
                    defaultValue={plantilla.umbralAntiguedadBaja ?? "80"}
                  />
                </div>
                <div>
                  <Label>Umbral alta antigüedad (%)</Label>
                  <Input
                    name="umbralAntiguedadAlta"
                    type="number"
                    defaultValue={plantilla.umbralAntiguedadAlta ?? "95"}
                  />
                </div>
                <div>
                  <Label>Años umbral antigüedad</Label>
                  <Input
                    name="anosUmbral"
                    type="number"
                    defaultValue={plantilla.anosUmbral ?? 3}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB: Niveles */}
      <TabsContent value="niveles">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Niveles de Competencia</CardTitle>
            <CrudDialog title="Nuevo Nivel">
              {({ onClose }) => (
                <form
                  action={async (formData) => {
                    await createNivel({
                      plantillaId: plantilla.id,
                      nombre: formData.get("nombre") as string,
                      codigo: formData.get("codigo") as string,
                      orden: Number(formData.get("orden")),
                    });
                    toast.success("Nivel creado");
                    router.refresh();
                    onClose();
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <Label>Nombre *</Label>
                      <Input name="nombre" placeholder="ej: 01 Inicial" required />
                    </div>
                    <div>
                      <Label>Código *</Label>
                      <Input name="codigo" placeholder="ej: inicial" required />
                    </div>
                    <div>
                      <Label>Orden *</Label>
                      <Input
                        name="orden"
                        type="number"
                        defaultValue={plantilla.niveles.length + 1}
                        required
                      />
                    </div>
                    <Button type="submit">Crear</Button>
                  </div>
                </form>
              )}
            </CrudDialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plantilla.niveles.map((nivel) => (
                <div
                  key={nivel.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{nivel.orden}</Badge>
                    <span className="font-medium">{nivel.nombre}</span>
                    <span className="text-sm text-muted-foreground">
                      ({nivel.codigo})
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <CrudDialog title="Editar Nivel" mode="edit">
                      {({ onClose }) => (
                        <form
                          action={async (formData) => {
                            await updateNivel(nivel.id, {
                              nombre: formData.get("nombre") as string,
                              codigo: formData.get("codigo") as string,
                              orden: Number(formData.get("orden")),
                            });
                            toast.success("Nivel actualizado");
                            router.refresh();
                            onClose();
                          }}
                        >
                          <div className="space-y-4">
                            <div>
                              <Label>Nombre</Label>
                              <Input
                                name="nombre"
                                defaultValue={nivel.nombre}
                                required
                              />
                            </div>
                            <div>
                              <Label>Código</Label>
                              <Input
                                name="codigo"
                                defaultValue={nivel.codigo}
                                required
                              />
                            </div>
                            <div>
                              <Label>Orden</Label>
                              <Input
                                name="orden"
                                type="number"
                                defaultValue={nivel.orden}
                                required
                              />
                            </div>
                            <Button type="submit">Guardar</Button>
                          </div>
                        </form>
                      )}
                    </CrudDialog>
                    <ConfirmDeleteButton
                      description="El nivel y sus ítems asociados se eliminarán."
                      onConfirm={async () => {
                        await deleteNivel(nivel.id);
                        toast.success("Nivel eliminado");
                        router.refresh();
                      }}
                    />
                  </div>
                </div>
              ))}
              {plantilla.niveles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay niveles definidos. Cree al menos uno.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB: Pilares */}
      <TabsContent value="pilares">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pilares</CardTitle>
            <CrudDialog title="Nuevo Pilar">
              {({ onClose }) => (
                <form
                  action={async (formData) => {
                    await createPilar({
                      plantillaId: plantilla.id,
                      nombre: formData.get("nombre") as string,
                      orden: Number(formData.get("orden")),
                    });
                    toast.success("Pilar creado");
                    router.refresh();
                    onClose();
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <Label>Nombre *</Label>
                      <Input name="nombre" placeholder="ej: Contratas" required />
                    </div>
                    <div>
                      <Label>Orden *</Label>
                      <Input
                        name="orden"
                        type="number"
                        defaultValue={plantilla.pilares.length + 1}
                        required
                      />
                    </div>
                    <Button type="submit">Crear</Button>
                  </div>
                </form>
              )}
            </CrudDialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plantilla.pilares.map((pilar) => (
                <div
                  key={pilar.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{pilar.orden}</Badge>
                    <span className="font-medium">{pilar.nombre}</span>
                    <span className="text-sm text-muted-foreground">
                      (
                      {
                        plantilla.items.filter((i) => i.pilarId === pilar.id)
                          .length
                      }{" "}
                      ítems)
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <CrudDialog title="Editar Pilar" mode="edit">
                      {({ onClose }) => (
                        <form
                          action={async (formData) => {
                            await updatePilar(pilar.id, {
                              nombre: formData.get("nombre") as string,
                              orden: Number(formData.get("orden")),
                            });
                            toast.success("Pilar actualizado");
                            router.refresh();
                            onClose();
                          }}
                        >
                          <div className="space-y-4">
                            <div>
                              <Label>Nombre</Label>
                              <Input
                                name="nombre"
                                defaultValue={pilar.nombre}
                                required
                              />
                            </div>
                            <div>
                              <Label>Orden</Label>
                              <Input
                                name="orden"
                                type="number"
                                defaultValue={pilar.orden}
                                required
                              />
                            </div>
                            <Button type="submit">Guardar</Button>
                          </div>
                        </form>
                      )}
                    </CrudDialog>
                    <ConfirmDeleteButton
                      description="El pilar y sus ítems asociados se eliminarán."
                      onConfirm={async () => {
                        await deletePilar(pilar.id);
                        toast.success("Pilar eliminado");
                        router.refresh();
                      }}
                    />
                  </div>
                </div>
              ))}
              {plantilla.pilares.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay pilares definidos. Cree al menos uno.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB: Ítems */}
      <TabsContent value="items">
        <div className="space-y-6">
          {plantilla.pilares.map((pilar) => (
            <Card key={pilar.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{pilar.nombre}</CardTitle>
                <CrudDialog title={`Nuevo Ítem - ${pilar.nombre}`}>
                  {({ onClose }) => (
                    <form
                      action={async (formData) => {
                        await createItem({
                          pilarId: pilar.id,
                          nivelId: Number(formData.get("nivelId")),
                          texto: formData.get("texto") as string,
                          tipoCriterio: formData.get("tipoCriterio") as
                            | "subjetivo"
                            | "objetivo",
                          expectativa:
                            (formData.get("expectativa") as string) || undefined,
                        });
                        toast.success("Ítem creado");
                        router.refresh();
                        onClose();
                      }}
                    >
                      <div className="space-y-4">
                        <div>
                          <Label>Nivel *</Label>
                          <select
                            name="nivelId"
                            required
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          >
                            {plantilla.niveles.map((n) => (
                              <option key={n.id} value={n.id}>
                                {n.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Texto de la pregunta *</Label>
                          <textarea
                            name="texto"
                            required
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <Label>Tipo de criterio *</Label>
                          <select
                            name="tipoCriterio"
                            required
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          >
                            <option value="subjetivo">Subjetivo</option>
                            <option value="objetivo">Objetivo</option>
                          </select>
                        </div>
                        <div>
                          <Label>Expectativa</Label>
                          <textarea
                            name="expectativa"
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                          />
                        </div>
                        <Button type="submit">
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Ítem
                        </Button>
                      </div>
                    </form>
                  )}
                </CrudDialog>
              </CardHeader>
              <CardContent>
                {plantilla.niveles.map((nivel) => {
                  const items = getItemsForPilarNivel(pilar.id, nivel.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={nivel.id} className="mb-4">
                      <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                        {nivel.nombre}
                      </h4>
                      <SortableItemList items={items} />
                    </div>
                  );
                })}
                {plantilla.items.filter((i) => i.pilarId === pilar.id)
                  .length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sin ítems. Use el botón &quot;Crear&quot; para añadir.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
