import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const ADMIN_AUTH_SESSION_QUERY_KEY = ["admin-auth-session"] as const;

async function fetchAdminSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return data.session ?? null;
}

export const useAdminAuth = () => {
  const queryClient = useQueryClient();

  const { data: session = null, isLoading } = useQuery({
    queryKey: ADMIN_AUTH_SESSION_QUERY_KEY,
    queryFn: fetchAdminSession,
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    onSuccess: async ({ error }) => {
      if (!error) {
        await queryClient.invalidateQueries({ queryKey: ADMIN_AUTH_SESSION_QUERY_KEY });
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      return { error: error?.message ?? null };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_AUTH_SESSION_QUERY_KEY });
    },
  });

  return {
    session,
    isLoading,
    signIn: async (email: string, password: string) => signInMutation.mutateAsync({ email, password }),
    signOut: async () => signOutMutation.mutateAsync(),
  };
};
