import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { ME_KEY } from "@/lib/auth";
import { beginSession } from "@/lib/session";
import type { Me, SessionRequest } from "@/lib/types";

// Handles `#session_id=...` after Emergent Google sign-in, then returns to the same path.
export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const match = location.hash.match(/session_id=([^&]+)/);
    const back = () => navigate(location.pathname + location.search, { replace: true });
    if (!match) {
      void back();
      return;
    }
    const body: SessionRequest = { session_id: decodeURIComponent(match[1]) };
    apiPost<Me>("/auth/session", body)
      .then((me) => {
        beginSession();
        qc.setQueryData(ME_KEY, me);
        toast.success(`Olá, ${me.user?.name ?? ""}! Você entrou com Google.`);
      })
      .catch(() => toast.error("Não foi possível entrar com Google. Tente novamente."))
      .finally(() => void back());
  }, [location, navigate, qc]);

  return (
    <div className="grid min-h-svh place-items-center bg-background text-stone-500" data-testid="auth-callback">
      <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Entrando…</span>
    </div>
  );
}
