import { SiGoogle } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth";

export function GoogleButton({ returnPath, label = "Entrar com Google", testId = "google-signin-button" }: { returnPath: string; label?: string; testId?: string }) {
  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      onClick={() => signInWithGoogle(returnPath)}
      data-testid={testId}
      className="w-full gap-3 border-stone-300 bg-white text-stone-900 transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-md"
    >
      <SiGoogle size={16} color="#4285F4" /> {label}
    </Button>
  );
}

export default function GoogleSignInCard({ returnPath, title, text }: { returnPath: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl text-center border border-amber-900/10 bg-white p-8 shadow-[0_30px_60px_-40px_rgba(120,53,15,0.4)] sm:p-10" data-testid="google-signin-card">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Passo 1 de 2</span>
      <h2 className="mt-2 font-heading text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-2 text-stone-600">{text}</p>
      <div className="mt-6">
        <GoogleButton returnPath={returnPath} />
      </div>
      <p className="mt-4 text-xs text-stone-500">Usamos sua conta Google apenas para identificar quem cadastrou o perfil. Nada é publicado sem aprovação da equipe.</p>
    </div>
  );
}
