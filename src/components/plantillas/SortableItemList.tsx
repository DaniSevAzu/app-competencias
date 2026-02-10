"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrudDialog } from "@/components/shared/CrudDialog";
import { Label } from "@/components/ui/label";
import { GripVertical } from "lucide-react";
import { ConfirmDeleteButton } from "@/components/shared/ConfirmDeleteButton";
import { updateItem, deleteItem, reorderItems } from "@/app/actions/plantillas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Item = {
  id: number;
  pilarId: number;
  nivelId: number;
  texto: string;
  tipoCriterio: "subjetivo" | "objetivo";
  expectativa: string | null;
  orden: number;
};

function SortableItem({
  item,
  onEdit,
  onDelete,
}: {
  item: Item;
  onEdit: (id: number, data: { texto: string; tipoCriterio: "subjetivo" | "objetivo"; expectativa?: string }) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const router = useRouter();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start justify-between rounded border bg-background p-2 text-sm"
    >
      <div className="flex flex-1 items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <p>{item.texto}</p>
          <div className="mt-1 flex gap-2">
            <Badge variant="outline" className="text-xs">
              {item.tipoCriterio}
            </Badge>
          </div>
        </div>
      </div>
      <div className="ml-2 flex gap-1">
        <CrudDialog title="Editar Ítem" mode="edit">
          {({ onClose }) => (
            <form
              action={async (formData) => {
                await updateItem(item.id, {
                  texto: formData.get("texto") as string,
                  tipoCriterio: formData.get("tipoCriterio") as
                    | "subjetivo"
                    | "objetivo",
                  expectativa:
                    (formData.get("expectativa") as string) || undefined,
                });
                toast.success("Ítem actualizado");
                router.refresh();
                onClose();
              }}
            >
              <div className="space-y-4">
                <div>
                  <Label>Texto *</Label>
                  <textarea
                    name="texto"
                    defaultValue={item.texto}
                    required
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <select
                    name="tipoCriterio"
                    defaultValue={item.tipoCriterio}
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
                    defaultValue={item.expectativa ?? ""}
                    rows={2}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          )}
        </CrudDialog>
        <ConfirmDeleteButton
          description="El ítem se eliminará permanentemente."
          onConfirm={async () => {
            await deleteItem(item.id);
            toast.success("Ítem eliminado");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}

export function SortableItemList({ items }: { items: Item[] }) {
  const [localItems, setLocalItems] = useState(items);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincronizar cuando llegan nuevos props (ej: tras crear/eliminar)
  if (items.length !== localItems.length || items.some((it, i) => it.id !== localItems[i]?.id)) {
    setLocalItems(items);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localItems.findIndex((i) => i.id === active.id);
    const newIndex = localItems.findIndex((i) => i.id === over.id);
    const newItems = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(newItems);

    await reorderItems(newItems.map((i) => i.id));
    router.refresh();
  }

  if (localItems.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localItems.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {localItems.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
