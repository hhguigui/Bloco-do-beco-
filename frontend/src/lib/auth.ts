import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";
import type { Me } from "./types";

export const ME_KEY = ["auth", "me"] as const;

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: () => apiGet<Me>("/auth/me"), retry: false, staleTime: 60_000 });
}

// Emergent-managed Google sign-in. The user returns to `returnPath#session_id=...`, handled by AuthCallback.
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export function signInWithGoogle(returnPath: string): void {
  const redirectUrl = window.location.origin + returnPath;
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}
