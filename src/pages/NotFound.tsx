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
        <h1 className="font-display text-5xl font-bold tracking-tight">404</h1>
        <p className="mt-3 text-muted-foreground">
          We couldn't find that page. It may have been moved or never existed.
        </p>
        <Button asChild className="mt-6 rounded-xl press">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
