import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

export interface Profile {
  id: string;
  display_name: string | null;
  currency: string;
  theme: string;
}

/**
 * Profile of the signed-in user. The query key is scoped to the user id so a
 * different account can never read a previous session's cached profile.
 */
export function useProfile() {
  const { user } = useAuthUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, currency, theme")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Pick<Profile, "display_name" | "currency" | "theme">>) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("Your session expired. Please sign in again.");
      // Upsert (never delete): guarantees settings save even if a profile row is missing.
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userData.user.id, ...input }, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
