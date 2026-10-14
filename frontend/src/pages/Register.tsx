import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import GoogleSignInCard from "@/components/GoogleSignInCard";
import TalentForm from "@/components/TalentForm";
import { apiPost, errorMessage } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Talent, TalentInput } from "@/lib/types";

export default function Register() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);

  const create = useMutation({
    mutationFn: (values: TalentInput) => apiPost<Talent>("/talents", values),
    onSuccess: (t) => {
      void qc.invalidateQueries({ queryKey: ["my-talents"] });
      void qc.invalidateQueries({ queryKey: ["admin-talents"] });
      if (t.status === "approved") {
        void qc.invalidateQueries({ queryKey: ["talents"] });
        void qc.invalidateQueries({ queryKey: ["activities"] });
        void qc.invalidateQueries({ queryKey: ["summary"] });
      }
      toast.success(
        t.status === "approved"
          ? `${t.name} já está publicado no mapa.`
          : "Perfil enviado! A equipe do Bloco do Beco vai revisar e aprovar em breve.",
      );
      navigate("/meus-perfis");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[320px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Cadastro de talentos</p>
        <h1 className="mt-2 font-heading text-4xl font-extrabold leading-tight tracking-tight">Coloque seu talento no mapa.</h1>
        <p className="mt-4 text-stone-600">
          Músico, costureira, artesão, grafiteira, cozinheira, dançarino… Se você mora ou atua no Jardim Ibirapuera, seu talento conta.
        </p>
        <ol className="mt-6 space-y-3 text-sm text-stone-600">
          <li><strong className="text-stone-900">1.</strong> Entre com sua conta Google.</li>
          <li><strong className="text-stone-900">2.</strong> Preencha o perfil e as atividades que oferece.</li>
          <li><strong className="text-stone-900">3.</strong> A equipe aprova e seu perfil aparece no catálogo e no mapa.</li>
        </ol>
      </aside>
      <div>
        {me.isLoading ? (
          <div className="h-80 animate-pulse rounded-3xl bg-[#FAF5EE]" />
        ) : !user ? (
          <GoogleSignInCard
            returnPath="/cadastrar"
            title="Entre para cadastrar um talento"
            text="Para manter o mapa confiável, cada perfil é ligado a uma conta Google. Depois você pode acompanhar a aprovação e editar seus dados quando quiser."
          />
        ) : (
          <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(120,53,15,0.4)] sm:p-10">
            <p className="mb-8 flex items-center gap-3 rounded-2xl bg-[#FAF5EE] p-3 text-sm text-stone-600" data-testid="register-signed-in-as">
              {user.picture && <img src={user.picture} alt="" className="size-8 rounded-full" />}
              <span>
                Cadastrando como <strong className="text-stone-900">{user.email}</strong>. Nome e foto vieram da sua conta Google — ajuste se quiser.
              </span>
            </p>
            <TalentForm
              key={user.user_id}
              prefill={{ name: user.name, photo: user.picture }}
              submitLabel="Enviar para aprovação"
              pending={create.isPending}
              onSubmit={(v) => create.mutate(v)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
