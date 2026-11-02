import { Menu, LogIn } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import RegisterCta from "./RegisterCta";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMe } from "@/lib/auth";
import { initials } from "@/lib/catalog";
import { endSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const PUBLIC_NAV = [
  { to: "/", label: "Início", id: "home" },
  { to: "/mapa", label: "Mapa", id: "mapa" },
  { to: "/talentos", label: "Talentos", id: "talentos" },
  { to: "/atividades", label: "Atividades", id: "atividades" },
  { to: "/participantes", label: "Participantes", id: "participantes" },
];

function UserMenu() {
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  if (!user) return null;
  const isAdmin = me.data?.is_admin ?? false;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white py-1 pl-1 pr-3 text-sm font-medium transition-colors hover:border-stone-400" data-testid="user-menu-button" />}>
        {user.picture ? (
          <img src={user.picture} alt="" className="size-7 rounded-full" />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-[#FFEDD5] text-xs font-bold text-[#C2410C]">{initials(user.name)}</span>
        )}
        <span className="truncate max-w-24 font-medium text-sm">{user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Perfil info */}
        <div className="px-2 py-2 border-b border-amber-900/10">
          <p className="text-sm font-semibold text-stone-900">{user.name}</p>
          <p className="text-xs text-stone-500 truncate">{user.email}</p>
          <p className="text-xs font-semibold mt-0.5">
            {isAdmin ? (
              <span className="text-[#E65100]">★ Admin</span>
            ) : user.role === "talent" ? (
              <span className="text-[#16A34A]">★ Talento</span>
            ) : (
              <span className="text-stone-500">● Cliente</span>
            )}
          </p>
        </div>
        <DropdownMenuItem render={<Link to="/meus-perfis" data-testid="user-menu-my-profile" />}>Meu perfil</DropdownMenuItem>
        {isAdmin && <DropdownMenuItem render={<Link to="/admin" data-testid="user-menu-admin" />}>Painel admin</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => void endSession("/")} data-testid="user-menu-logout">Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoginButton() {
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  const location = useLocation();
  if (user) return null;
  
  const returnPath = location.pathname === "/entrar" ? "/" : location.pathname;
  
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 border-stone-300 bg-white text-stone-900 hover:bg-amber-900/5 hidden sm:flex"
      onClick={() => window.location.href = `/entrar?returnTo=${encodeURIComponent(returnPath)}`}
      data-testid="header-login-button"
    >
      <LogIn className="size-4" />
      <span>Entrar</span>
    </Button>
  );
}

function MobileMenuLinks() {
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  
  return (
    <>
      {PUBLIC_NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === "/"} className={linkClass} data-testid={`mobile-nav-link-${n.id}`}>
          {n.label}
        </NavLink>
      ))}
      <NavLink to="/cadastrar" className={linkClass} data-testid="mobile-nav-link-cadastrar">Cadastrar talento</NavLink>
      {user ? (
        <>
          <NavLink to="/meus-perfis" className={linkClass} data-testid="mobile-nav-link-meus-perfis">Meu perfil</NavLink>
          {me.data?.is_admin && <NavLink to="/admin" className={linkClass} data-testid="mobile-nav-link-admin">Admin</NavLink>}
        </>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-stone-300 bg-white text-stone-900 hover:bg-amber-900/5"
          onClick={() => window.location.href = "/entrar"}
          data-testid="mobile-login-button"
        >
          <LogIn className="size-4" />
          <span>Entrar</span>
        </Button>
      )}
    </>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" data-testid="brand-logo-link">
      <span className="grid size-9 place-items-center font-heading text-sm font-extrabold text-white overflow-hidden">
        <img 
          src="/logo.png" 
          alt="Logo Bloco do Beco" 
          className="size-full object-cover"
        />
      </span>
    
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
    isActive
      ? "bg-[#E65100] text-white font-bold shadow-md"
      : "bg-[#fff] text-write hover:bg-[#E65100] hover:text-white",
  );

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-amber-900/10 bg-[#FDFBF7]/85 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Logo />
          <nav className="hidden border-1 bg-[#FEFEFE] rounded-2xl items-center gap-1 lg:flex">
            {PUBLIC_NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"} className={linkClass} data-testid={`nav-link-${n.id}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
           
          <UserMenu />
          <LoginButton />
          
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" data-testid="mobile-menu-button" aria-label="Abrir menu" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#FDFBF7] p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1">
                <MobileMenuLinks />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
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
              <Link to="/participantes" className="hover:text-white" data-testid="footer-link-participantes">Participantes</Link>
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
