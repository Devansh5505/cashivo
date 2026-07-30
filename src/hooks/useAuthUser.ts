import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Single source of truth for the auth session.
 * Registers the listener before reading the existing session (avoids missed events),
 * and clears cached queries on sign-out so no data leaks between accounts.
 */
export function useAuthUser() {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (event === "SIGNED_OUT") {
        // Drop every cached query so the next account starts from a clean slate.
        qc.clear();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);

  return { user, session, loading };
}
