import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, CalendarHeart, MapPinned, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import AiAssistant from "@/components/AiAssistant";
import RegisterCta from "@/components/RegisterCta";
import TalentCard from "@/components/TalentCard";
import TalentsMap from "@/components/TalentsMap";
import { apiGet } from "@/lib/api";
import { ACTIVITY_LABELS, CATEGORY_META } from "@/lib/catalog";
import type { ActivityListing, Category, Summary, Talent } from "@/lib/types";
import { cn } from "@/lib/utils";

const HERO_IMG =
  "https://images.unsplash.com/photo-1759352430310-275503e7df4a?crop=entropy&cs=srgb&fm=jpg&q=80&w=1400";

export default function Home() {
  const talents = useQuery({ queryKey: ["talents", "", ""], queryFn: () => apiGet<Talent[]>("/talents") });
  const stats = useQuery({ queryKey: ["summary"], queryFn: () => apiGet<Summary>("/summary") });
  const activities = useQuery({ queryKey: ["activities", "", ""], queryFn: () => apiGet<ActivityListing[]>("/activities") });

  const list = talents.isError ? [] : (talents.data ?? []);
  const s = stats.isError ? undefined : stats.data;
  const acts = activities.isError ? [] : (activities.data ?? []);

  const counters = [
    { label: "Talentos mapeados", value: s?.total_talents, icon: Users, id: "talents" },
    { label: "Atividades no bairro", value: s?.total_activities, icon: CalendarHeart, id: "activities" },
    { label: "Gratuitas", value: s?.free_activities, icon: MapPinned, id: "free" },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col justify-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Mapeamento cultural · Zona Sul de SP</p>
            <h1 className="mt-4 font-heading text-4xl font-extrabold leading-[1.02] tracking-tight text-stone-900 sm:text-6xl" data-testid="home-hero-title">
              Todo beco tem <span className="relative whitespace-nowrap text-[#E65100]">um talento<svg className="absolute -bottom-2 left-0 h-3 w-full" viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 9 C 50 2, 150 2, 198 8" stroke="#FACC15" strokeWidth="5" fill="none" strokeLinecap="round" /></svg></span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">
              O Bloco do Beco reúne e mede os músicos, costureiras, artesãos e artistas do <strong className="text-stone-900">Jardim Ibirapuera</strong> — e conecta
              quem mora aqui às aulas, oficinas e serviços que acontecem na esquina de casa.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <RegisterCta testId="hero-cta-cadastrar" className={cn(buttonVariants({ size: "lg" }), "bg-[#E65100] px-6 text-white shadow-[3px_3px_0_#141210] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:bg-[#C2410C]")}>
                Seja um talento
              </RegisterCta>
              <Link to="/mapa" data-testid="hero-cta-mapa" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "px-6")}>
                Ver o mapa <ArrowRight className="size-4" />
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-amber-900/10 rounded-2xl border border-amber-900/10 bg-white/70 backdrop-blur">
              {counters.map((c) => (
                <div key={c.id} className="p-4">
                  <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                    <c.icon className="size-3.5 text-[#E65100]" /> {c.label}
                  </dt>
                  <dd className="mt-1 font-heading text-3xl font-extrabold text-stone-900" data-testid={`home-stat-${c.id}`}>
                    {c.value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative">
            <img src={HERO_IMG} alt="Músicos tocando tambores na rua" className="bdb-float absolute -left-6 -top-4 z-10 hidden w-40 rounded-2xl border-4 border-white object-cover shadow-xl sm:block" />
            <TalentsMap talents={list} className="h-[420px] shadow-[0_30px_60px_-30px_rgba(120,53,15,0.5)] lg:h-[520px]" zoom={15} testId="home-map" />
            <div className="absolute -bottom-5 right-4 z-10 rounded-2xl border border-amber-900/10 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">Jardim Ibirapuera</p>
              <p className="font-heading text-sm font-bold text-stone-900">{list.length} talentos no mapa</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex flex-wrap gap-3">
          {(s?.by_category ?? []).filter((c) => c.count > 0).map((c) => {
            const meta = CATEGORY_META[c.key as Category];
            if (!meta) return null;
            return (
              <Link
                key={c.key}
                to={`/talentos?categoria=${c.key}`}
                data-testid={`home-category-${c.key}`}
                className="group flex items-center gap-3 rounded-2xl border border-amber-900/10 bg-white px-4 py-3 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-[var(--c)]"
                style={{ ["--c" as string]: meta.color }}
              >
                <span className="grid size-9 place-items-center rounded-xl" style={{ background: meta.bg, color: meta.fg }}>
                  <meta.icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-stone-900">{meta.label}</span>
                  <span className="block font-mono text-[11px] text-stone-500">{c.count} talentos</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Gente do bairro</p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Talentos recém-chegados</h2>
          </div>
          <Link to="/talentos" className="text-sm font-semibold text-[#C2410C] hover:underline" data-testid="home-see-all-talents">
            Ver todos →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.slice(0, 4).map((t, i) => (
            <TalentCard key={t.id} talent={t} index={i} />
          ))}
          {list.length === 0 && <p className="text-stone-500">Os talentos aparecerão aqui assim que forem carregados.</p>}
        </div>
      </section>
      {/* IA */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-8">
        <AiAssistant />
      </section>


      {/* ATIVIDADES */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-8">
        <div className="grid gap-10 rounded-3xl border border-amber-900/10 bg-[#FAF5EE] p-6 sm:p-10 lg:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#0D9488]">Acontece no bairro</p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold tracking-tight">Aprenda, encomende, participe.</h2>
            <p className="mt-3 text-stone-600">Oficinas, aulas, serviços e rodas oferecidos por quem vive no Jardim Ibirapuera.</p>
            <Link to="/atividades" className={cn(buttonVariants(), "mt-6 bg-[#0D9488] text-white hover:bg-[#0F766E]")} data-testid="home-see-activities">
              Ver todas as atividades
            </Link>
          </div>
          <ul className="divide-y divide-amber-900/10">
            {acts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <Link to={`/talento/${a.talent_id}`} className="group flex items-center justify-between gap-4 py-4" data-testid={`home-activity-${a.id}`}>
                  <div>
                    <p className="font-semibold text-stone-900 transition-colors group-hover:text-[#C2410C]">{a.title}</p>
                    <p className="text-sm text-stone-500">
                      {a.talent_name} · {a.schedule || "Horário a combinar"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-stone-600">
                    {ACTIVITY_LABELS[a.type]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
