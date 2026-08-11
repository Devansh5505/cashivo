import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

/** Accessible, themed replacement for window.confirm() used before destructive actions. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  destructive = true,
  loading = false,
  onConfirm,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl elev-3 sm:max-w-sm">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="font-display text-lg">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm leading-relaxed">{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="rounded-xl h-11 press interactive">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={`rounded-xl h-11 press interactive ${destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {loading ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

