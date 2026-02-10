"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

interface CrudDialogProps {
  title: string;
  trigger?: React.ReactNode;
  children: (props: { onClose: () => void }) => React.ReactNode;
  mode?: "create" | "edit";
}

export function CrudDialog({ title, trigger, children, mode = "create" }: CrudDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size={mode === "edit" ? "icon" : "default"} variant={mode === "edit" ? "ghost" : "default"}>
            {mode === "create" ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Crear
              </>
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children({ onClose: () => setOpen(false) })}
      </DialogContent>
    </Dialog>
  );
}
