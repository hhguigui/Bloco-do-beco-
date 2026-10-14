import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center" data-testid="not-found-page">
      <p className="font-mono text-xs uppercase tracking-wider text-[#C2410C]">Erro 404</p>
      <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight">Esse beco não tem saída.</h1>
      <p className="mt-3 text-stone-600">A página que você procura não existe.</p>
      <Link to="/" className={`${buttonVariants()} mt-8`} data-testid="not-found-home-link">
        Voltar ao início
      </Link>
    </div>
  );
}
