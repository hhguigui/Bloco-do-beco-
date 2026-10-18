import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { addDays, endOfMonth, format, parseISO, getDay } from "date-fns";
import { CalendarClock, CalendarDays, MapPin, MessageCircle, Repeat, Tag, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CascadeFilters from "@/components/CascadeFilters";
import CategoryBadge from "@/components/CategoryBadge";
import { apiGet } from "@/lib/api";
import { cascade } from "@/lib/cascade";
import type { Facet, Selection } from "@/lib/cascade";
import { ACTIVITY_LABELS, CATEGORY_LABELS, formatDate, isFree, whatsappLink } from "@/lib/catalog";
import type { ActivityListing, TodayResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

// Day of week helpers
const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};
const DAY_SHORT: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

// Labels for the dayOfWeek facet (single days only)
const DAY_FACET_LABELS: Record<string, string> = {
  "1": "Segunda",
  "2": "Terça",
  "3": "Quarta",
  "4": "Quinta",
  "5": "Sexta",
  "6": "Sábado",
  "0": "Domingo",
};

// Extract day-of-week from schedule text (recurring activities)
function extractDaysFromSchedule(schedule: string): number[] {
  const days: number[] = [];
  const lower = schedule.toLowerCase();
  const dayPatterns: [RegExp, number][] = [
    /domingo|dom\b/, 0,
    /segunda|seg\b/, 1,
    /ter[çc]a|ter\b/, 2,
    /quarta|qua\b/, 3,
    /quinta|qui\b/, 4,
    /sexta|sex\b/, 5,
    /s[áa]bado|s[áa]b|sab\b/, 6,
  ];
  for (let i = 0; i < dayPatterns.length; i += 2) {
    if (dayPatterns[i] instanceof RegExp && dayPatterns[i].test(lower)) {
      days.push(dayPatterns[i + 1] as number);
    }
  }
  return days;
}

// Get day of week for an activity (from date or schedule)
// Returns null if multiple days or unknown
function getActivityDayOfWeek(activity: ActivityListing, _today: string): number | null {
  if (activity.date) {
    return getDay(parseISO(activity.date));
  }
  const days = extractDaysFromSchedule(activity.schedule || "");
  if (days.length === 1) return days[0];
  return null; // Multiple days or none
}

const FACETS: Facet<ActivityListing>[] = [
  { id: "category", label: "Categoria", get: (a) => a.talent_category, labels: CATEGORY_LABELS, allLabel: "Todas" },
  { id: "type", label: "Tipo", get: (a) => a.type, labels: ACTIVITY_LABELS },
  { id: "price", label: "Valor", get: (a) => (isFree(a.price) ? "gratuito" : "pago"), labels: { gratuito: "Gratuito", pago: "Pago / a combinar" }, allLabel: "Qualquer" },
  { id: "dayOfWeek", label: "Dia da semana", get: (a) => {
      const dow = getActivityDayOfWeek(a, "");
      return dow !== null ? String(dow) : null;
    }, labels: DAY_FACET_LABELS, allLabel: "Todos" },
];

type Preset = "all" | "today" | "week" | "month" | "upcoming" | "custom";
const PRESETS: { id: Preset; label: string }[] = [
  { id: "all", label: "Qualquer data" },
  { id: "today", label: "Hoje" },
  { id: "week", label: "Próximos 7 dias" },
  { id: "month", label: "Este mês" },
  { id: "upcoming", label: "Todas as próximas" },
  { id: "custom", label: "Escolher período" },
];

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export default function Activities() {
  const todayQ = useQuery({ queryKey: ["today"], queryFn: () => apiGet<TodayResponse>("/today"), staleTime: 3_600_000 });
  const query = useQuery({ queryKey: ["activities", "", ""], queryFn: () => apiGet<ActivityListing[]>("/activities") });
  const all = useMemo(() => (query.isError ? [] : (query.data ?? [])), [query.isError, query.data]);

  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sel, setSel] = useState<Selection>({});

  // Server-anchored "today" (America/Sao_Paulo); falls back to the browser date only if the API is unreachable.
  const today = todayQ.data?.today ?? iso(new Date());
  const range = ((): [string, string] | null => {
    const t = parseISO(today);
    switch (preset) {
      case "today": return [today, today];
      case "week": return [today, iso(addDays(t, 6))];
      case "month": return [today, iso(endOfMonth(t))];
      case "upcoming": return [today, "9999-12-31"];
      case "custom": return from || to ? [from || "0000-01-01", to || "9999-12-31"] : null;
      default: return null;
    }
  })();

  // Date is the first step of the cascade: facets below only count activities inside the chosen period.
  const dated = range ? all.filter((a) => a.date && a.date >= range[0] && a.date <= range[1]) : all;

  // Cascade includes dayOfWeek as a facet - it will show only days present in the date-filtered pool
  const { options, effective, result } = cascade(dated, FACETS, sel);
  const list = [...result].sort((a, b) => (a.date ?? "9999") .localeCompare(b.date ?? "9999"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#0D9488]">Conexões</p>
      <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Atividades e eventos no bairro</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Oficinas, aulas, serviços e apresentações oferecidos pelos talentos do Jardim Ibirapuera. Encontrou algo? Fale direto com quem faz.
      </p>

      <div className="mt-8 space-y-4 flex justify-center rounded-2xl border border-amber-900/10 bg-white p-4" data-testid="activities-filters-panel">

        <div className="border-amber-900/10 pt-4">
          <CascadeFilters facets={FACETS} options={options} effective={effective} onChange={setSel} testId="activities-filters" />
        </div>
      </div>

      <p className="mt-6 font-mono text-xs uppercase tracking-wider text-stone-500" data-testid="activities-result-count">
        {list.length} {list.length === 1 ? "atividade" : "atividades"}
      </p>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        {list.map((a, i) => {
          const wa = whatsappLink(a.phone, `Olá ${a.talent_name}! Tenho interesse em "${a.title}" (vi no site do Bloco do Beco).`);
          const dow = getActivityDayOfWeek(a, today);
          return (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.04 }}
              className="flex flex-col rounded-2xl border border-amber-900/10 bg-white p-5 transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(120,53,15,0.45)]"
              data-testid={`activity-card-${a.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-[#CCFBF1] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[#115E59]">{ACTIVITY_LABELS[a.type]}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-stone-800"><Tag className="size-3.5 text-[#E65100]" /> {a.price || "A combinar"}</span>
              </div>
              <h2 className="mt-3 font-heading text-xl font-bold text-stone-900">{a.title}</h2>
              {a.description && <p className="mt-1.5 text-stone-600">{a.description}</p>}
              <div className="mt-3 space-y-1 text-sm text-stone-600">
                {a.date ? (
                  <p className="flex items-center gap-1.5 font-semibold text-stone-800" data-testid={`activity-date-${a.id}`}>
                    <CalendarDays className="size-4 text-[#0D9488]" /> {formatDate(a.date)}{a.date === today && <span className="rounded-full bg-[#FACC15] px-2 py-0.5 text-[10px] uppercase">Hoje</span>}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5"><Repeat className="size-4 text-[#0D9488]" /> Recorrente</p>
                )}
                {dow !== null && (
                  <p className="flex items-center gap-1.5 text-stone-700">
                    <Calendar className="size-4 text-[#E65100]" /> {DAY_LABELS[dow]}
                  </p>
                )}
                <p className="flex items-center gap-1.5"><CalendarClock className="size-4 text-[#E65100]" /> {a.schedule || "Horário a combinar"}</p>
                <p className="flex items-center gap-1.5"><MapPin className="size-4 text-[#E65100]" /> {a.address}</p>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-amber-900/10 pt-4">
                <Link to={`/talento/${a.talent_id}`} className="flex items-center gap-2.5" data-testid={`activity-talent-link-${a.id}`}>
                  {a.talent_photo ? <img src={a.talent_photo} alt="" className="size-9 rounded-full object-cover" /> : <span className="size-9 rounded-full bg-[#FAF5EE]" />}
                  <span>
                    <span className="block text-sm font-semibold text-stone-900 hover:underline">{a.talent_name}</span>
                    <CategoryBadge category={a.talent_category} className="mt-0.5 px-2 py-0.5 text-[10px]" />
                  </span>
                </Link>
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" data-testid={`activity-whatsapp-${a.id}`} className={cn(buttonVariants({ size: "sm" }), "bg-[#16A34A] text-white hover:bg-[#15803D]")}>
                    <MessageCircle className="size-4" /> Quero participar
                  </a>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
      {list.length === 0 && !query.isLoading && (
        <div className="mt-6 rounded-2xl border border-dashed border-amber-900/20 p-10 text-center text-stone-500" data-testid="activities-empty-state">
          Nenhuma atividade com esses filtros.
        </div>
      )}
    </div>
  );
}