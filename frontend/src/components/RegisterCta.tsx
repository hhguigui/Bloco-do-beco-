import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { signInWithGoogle, useMe } from "@/lib/auth";

// "Cadastrar talento" entry point: signed-in users go to the form; anonymous visitors go straight to Google sign-in.
export default function RegisterCta({ className, testId, children }: { className?: string; testId: string; children: ReactNode }) {
  const me = useMe();
  const signedIn = !me.isError && !!me.data?.user;
  if (signedIn) {
    return (
      <Link to="/cadastrar" className={className} data-testid={testId}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => signInWithGoogle("/cadastrar")} className={className} data-testid={testId}>
      {children}
    </button>
  );
}
