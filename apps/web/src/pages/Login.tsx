import { useSearchParams } from "react-router-dom";
import GoogleSignInCard from "@/components/GoogleSignInCard";

export default function Login() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  
  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[320px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Entrar no Bloco do Beco</p>
        <h1 className="mt-2 font-heading text-4xl font-extrabold leading-tight tracking-tight">Acesse sua conta.</h1>
        <p className="mt-4 text-stone-600">
          Use sua conta Google para entrar. Assim mantemos o mapa confiável e você pode gerenciar seus talentos e acompanhar aprovações.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-stone-600">
          <li><strong className="text-stone-900">1.</strong> Clique em "Entrar com Google".</li>
          <li><strong className="text-stone-900">2.</strong> Escolha sua conta Google.</li>
          <li><strong className="text-stone-900">3.</strong> Pronto! Você será redirecionado de volta.</li>
        </ul>
      </aside>
      <div>
        <GoogleSignInCard
          returnPath={returnTo}
          title="Entre para acessar sua área"
          text="O login com Google é rápido e seguro. Não publicamos nada sem sua permissão."
        />
      </div>
    </div>
  );
}