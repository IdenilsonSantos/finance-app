"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Confirmar exclusão",
  description = "Essa ação não pode ser desfeita. Deseja continuar?",
  confirmLabel = "Excluir",
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-slate-400">{description}</p>
        </DialogHeader>
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl h-11"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 rounded-2xl h-11 bg-red-500 hover:bg-red-600 text-white font-semibold"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Excluindo..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
