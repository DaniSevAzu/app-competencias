"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateNineboxCell } from "@/app/actions/ninebox";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type NineboxCell = {
  id: number;
  potencial: string;
  desempeno: string;
  etiqueta: string;
  recomendacion: string;
  color: string | null;
};

const potencialLabels = ["alto", "medio", "bajo"] as const;
const desempenoLabels = ["bajo", "medio", "alto"] as const;

const potencialDisplay: Record<string, string> = {
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

const desempenoDisplay: Record<string, string> = {
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

export function NineboxConfigClient({ data }: { data: NineboxCell[] }) {
  const router = useRouter();

  const getCell = (potencial: string, desempeno: string) =>
    data.find((c) => c.potencial === potencial && c.desempeno === desempeno);

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            No hay configuración 9-Box. Ejecute el seed para crear las 9
            celdas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 text-center text-sm font-medium text-muted-foreground">
        Desempeño →
      </div>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2">
        {/* Header row */}
        <div />
        {desempenoLabels.map((d) => (
          <div key={d} className="text-center text-sm font-semibold">
            {desempenoDisplay[d]}
          </div>
        ))}

        {/* Grid rows */}
        {potencialLabels.map((p) => (
          <React.Fragment key={p}>
            <div
              className="flex items-center text-sm font-semibold [writing-mode:vertical-lr] rotate-180"
            >
              {potencialDisplay[p]}
            </div>
            {desempenoLabels.map((d) => {
              const cell = getCell(p, d);
              if (!cell) return <div key={`${p}-${d}`} />;
              return (
                <Card
                  key={cell.id}
                  className="border-2"
                  style={{
                    borderColor: cell.color || "#e5e7eb",
                    backgroundColor: cell.color
                      ? `${cell.color}10`
                      : undefined,
                  }}
                >
                  <CardContent className="p-3">
                    <form
                      action={async (formData) => {
                        const result = await updateNineboxCell(cell.id, {
                          etiqueta: formData.get("etiqueta") as string,
                          recomendacion: formData.get(
                            "recomendacion"
                          ) as string,
                          color:
                            (formData.get("color") as string) || undefined,
                        });
                        if (result?.success) {
                          toast.success("Celda actualizada");
                          router.refresh();
                        }
                      }}
                    >
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Etiqueta</Label>
                          <Input
                            name="etiqueta"
                            defaultValue={cell.etiqueta}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Recomendación</Label>
                          <textarea
                            name="recomendacion"
                            defaultValue={cell.recomendacion}
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Color</Label>
                          <Input
                            name="color"
                            type="color"
                            defaultValue={cell.color || "#6366f1"}
                            className="h-8 w-16"
                          />
                        </div>
                        <Button type="submit" size="sm" className="w-full">
                          Guardar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-2 text-sm font-medium text-muted-foreground [writing-mode:vertical-lr] rotate-180 absolute left-2 top-1/2">
        ← Potencial
      </div>
    </div>
  );
}
