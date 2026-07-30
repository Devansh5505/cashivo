import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so a single broken widget never blanks the whole app.
 * Purely presentational — it never touches or clears user data.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept for local debugging / future error-reporting integration.
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-subtle p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Something went wrong</h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Your data is safe. Reload the page to continue where you left off.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="rounded-xl press" onClick={() => window.location.reload()}>
            Reload app
          </Button>
          <Button variant="outline" className="rounded-xl press" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
}
