import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { LockKeyhole, Loader2, Eye, EyeOff, Shield, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiPost, errorMessage } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Me } from "@/lib/types";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const me = useMe();

  // Get redirect target from query param or state
  const from = (location.state as { from?: string })?.from || new URLSearchParams(location.search).get("from") || "/admin";

  const [email, setEmail] = useState("admin@blocodobeco.local");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = useMutation({
    mutationFn: () => apiPost<Me>("/auth/login", { email, password }),
    onSuccess: (data) => {
      qc.setQueryData(["auth", "me"], data);
      toast.success("Bem-vindo(a) ao painel do Bloco do Beco.");
      navigate(from, { replace: true });
    },
    onError: (err) => toast.error(errorMessage(err, "Não foi possível entrar.")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) login.mutate();
  };

  // If already admin, redirect to admin panel
  if (me.data?.is_admin) {
    return null; // Will be handled by the redirect in the component that renders this
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-[#FAF5EE]">
      <Card className="w-full max-w-md shadow-[0_30px_60px_-40px_rgba(120,53,15,0.4)] border-amber-900/10">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#FFEDD5] text-[#C2410C]">
            <LockKeyhole className="size-6" />
          </div>
          <CardTitle className="font-heading text-2xl font-extrabold tracking-tight">Área administrativa</CardTitle>
          <CardDescription className="text-stone-600">
            Aprovação de artistas, gestão de perfis e painel de dados.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {me.data?.user && !me.data?.is_admin && (
            <div className="mb-4 rounded-xl bg-[#FEF3C7] p-3 text-sm text-[#92400E]" role="alert">
              <div className="flex items-center gap-2">
                <Shield className="size-4 shrink-0" />
                <span>{me.data.user.email} não tem acesso de administrador.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@blocodobeco.local"
                  autoComplete="email"
                  required
                  disabled={login.isPending}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Senha</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={login.isPending}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#E65100] text-white hover:bg-[#C2410C] py-3"
              disabled={login.isPending || !email || !password}
            >
              {login.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar no painel"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-4 border-t border-amber-900/10">
          <p className="text-center text-xs text-stone-500">
            Apenas para administradores. Artistas usam <strong>Google OAuth</strong> em{" "}
            <a href="/cadastrar" className="text-[#C2410C] hover:underline">/cadastrar</a>.
          </p>
          <p className="text-center text-xs text-stone-500">
            Ou entre com Google se seu email estiver em <code className="bg-stone-100 px-1 rounded">ADMIN_EMAILS</code>.
          </p>
          <a
            href="/"
            className="text-center text-sm text-stone-600 hover:text-[#C2410C] transition-colors"
          >
            ← Voltar ao site
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}