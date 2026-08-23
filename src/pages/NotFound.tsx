import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Warn (not error): an unknown URL is user input, not an application fault.
    console.warn("404: no route for", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Logo size={44} showWordmark={false} />
        </div>
        <p className="eyebrow">Page not found</p>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We couldn't find that page. It may have been moved or never existed.
        </p>
        <Button asChild className="mt-6 h-11 rounded-xl px-6 press interactive">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
