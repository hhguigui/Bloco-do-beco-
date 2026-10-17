import { Menu } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import RegisterCta from "./RegisterCta";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMe } from "@/lib/auth";
import { initials } from "@/lib/catalog";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início", id: "home" },
  { to: "/mapa", label: "Mapa", id: "mapa" },
  { to: "/talentos", label: "Talentos", id: "talentos" },
  { to: "/atividades", label: "Atividades", id: "atividades" },
  { to: "/meus-perfis", label: "Perfil", id: "perfil" },
];

function UserMenu() {
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:border-stone-400" data-testid="user-menu-button" />}>
        {user.picture ? <img src={user.picture} alt="" className="size-7 rounded-full" /> : <span className="grid size-7 place-items-center rounded-full bg-[#FFEDD5] text-xs font-bold text-[#C2410C]">{initials(user.name)}</span>}
        <span className="max-w-28 truncate">{user.name.split(" ")[0]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem render={<Link to="/meus-perfis" data-testid="user-menu-my-profiles" />}>Meus perfis</DropdownMenuItem>
        {me.data?.is_admin && <DropdownMenuItem render={<Link to="/admin" data-testid="user-menu-admin" />}>Painel admin</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => void endSession("/")} data-testid="user-menu-logout">Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" data-testid="brand-logo-link">
      {/* Container da Logo */}
      <span className="grid size-9 place-items-center rounded-xl bg-[#ffffff] font-heading text-sm font-extrabold text-white shadow-[3px_3px_0_#141210] overflow-hidden">
        <img 
          src="public/logo.png" 
          alt="Logo Bloco do Beco" 
          className="size-full object-cover"
        />
      </span>
      
      {/* Textos ao lado da Logo */}
      <span className="leading-none">
        <span className="block font-heading text-base font-extrabold tracking-tight text-stone-900">
          Bloco do Beco
        </span>
        <span className="block font-mono text-[10px] uppercase tracking-wider text-stone-500">
          Jardim Ibirapuera · SP
        </span>
      </span>
    </Link>
  );
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
    isActive ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-amber-900/5 hover:text-stone-900",
  );

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-amber-900/10 bg-[#FDFBF7]/85 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"} className={linkClass} data-testid={`nav-link-${n.id}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" data-testid="mobile-menu-button" aria-label="Abrir menu" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#FDFBF7] p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1">
                {[...NAV, { to: "/cadastrar", label: "Cadastrar talento", id: "cadastrar" }, { to: "/meus-perfis", label: "Meus perfis", id: "meus-perfis" }, { to: "/admin", label: "Admin", id: "admin" }].map((n) => (
                  <NavLink key={n.to} to={n.to} end={n.to === "/"} className={linkClass} data-testid={`mobile-nav-link-${n.id}`}>
                    {n.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-24 bg-[#141210] px-4 pb-10 pt-16 text-[#EDE8E1] sm:px-8" data-testid="site-footer">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 text-sm sm:grid-cols-3">
            <p className="text-[#A8A29E]">
              Fortalecendo a cultura periférica e conectando moradores aos talentos do Jardim Ibirapuera, Zona Sul de São Paulo.
            </p>
            <div className="flex flex-col gap-2">
              <RegisterCta className="text-left hover:text-white" testId="footer-link-cadastrar">Cadastrar um talento</RegisterCta>
              <Link to="/atividades" className="hover:text-white" data-testid="footer-link-atividades">Atividades no bairro</Link>
              <Link to="/mapa" className="hover:text-white" data-testid="footer-link-mapa">Mapa de talentos</Link>
            </div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716C]">
              Mapa © OpenStreetMap · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
      <Toaster richColors />
    </div>
  );
}
