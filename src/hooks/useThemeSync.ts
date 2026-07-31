import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useProfile } from "@/hooks/useProfile";

/**
 * Applies the theme saved on the user's profile once, right after it loads.
 * Runs a single time per session so the in-app toggle always wins afterwards.
 */
export function useThemeSync() {
  const { data: profile } = useProfile();
  const { setTheme } = useTheme();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || !profile?.theme) return;
    if (["light", "dark", "system"].includes(profile.theme)) {
      applied.current = true;
      setTheme(profile.theme);
    }
  }, [profile?.theme, setTheme]);
}
