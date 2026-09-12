import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { errorMessage } from "@/lib/errors";

interface Props {
  /** What failed to load, e.g. "your transactions". */
  what: string;
  error?: unknown;
  onRetry?: () => void;
  retrying?: boolean;
}

/**
 * Shown when a data query fails, so a failed load is never mistaken for
 * "you have no data yet". Presentation only — it never mutates anything.
 */
export function LoadError({ what, error, onRetry, retrying = false }: Props) {
  return (
    <Card className="rounded-2xl border-destructive/25 elev-1" role="alert">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="section-title">Couldn't load {what}</p>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            {errorMessage(error, "Something went wrong on our side. Your data is safe.")}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} disabled={retrying} className="h-11 gap-2 rounded-xl press interactive">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> {retrying ? "Retrying…" : "Try again"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
