import { Hammer, Music, Palette, Scissors, Shapes, Sparkles, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ActivityType, AgeRange, Category, Experience, Gender, Talent, TalentInput, TalentStatus } from "./types";

export const CATEGORY_META: Record<Category, { label: string; color: string; bg: string; fg: string; icon: LucideIcon }> = {
  musica: { label: "Música", color: "#E65100", bg: "#FEF3C7", fg: "#92400E", icon: Music },
  costura: { label: "Costura & Moda", color: "#BE185D", bg: "#FCE7F3", fg: "#9D174D", icon: Scissors },
  artesanato: { label: "Artesanato", color: "#C2410C", bg: "#FFEDD5", fg: "#9A3412", icon: Hammer },
  artes_visuais: { label: "Artes Visuais & Grafite", color: "#047857", bg: "#DCFCE7", fg: "#166534", icon: Palette },
  danca_teatro: { label: "Dança & Teatro", color: "#6D28D9", bg: "#EDE9FE", fg: "#5B21B6", icon: Sparkles },
  gastronomia: { label: "Gastronomia", color: "#B91C1C", bg: "#FEE2E2", fg: "#991B1B", icon: Utensils },
  outros: { label: "Outros talentos", color: "#475569", bg: "#F1F5F9", fg: "#334155", icon: Shapes },
};

export const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c, CATEGORY_META[c].label]),
) as Record<Category, string>;

export const GENDER_LABELS: Record<Gender, string> = {
  mulher: "Mulher",
  homem: "Homem",
  nao_binario: "Não-binário",
  nao_informado: "Prefere não informar",
};

export const AGE_LABELS: Record<AgeRange, string> = {
  "15-24": "15 a 24 anos",
  "25-34": "25 a 34 anos",
  "35-49": "35 a 49 anos",
  "50-64": "50 a 64 anos",
  "65+": "65 anos ou mais",
};

export const AGE_RANGES: AgeRange[] = Object.keys(AGE_LABELS) as AgeRange[];

/** Converts a birth year to the matching AgeRange used by the backend. */
export function birthYearToAgeRange(birthYear: number): AgeRange {
  const age = 2026 - birthYear;
  if (age < 15) return "15-24"; // edge: child treated as youngest bracket
  if (age <= 24) return "15-24";
  if (age <= 34) return "25-34";
  if (age <= 49) return "35-49";
  if (age <= 64) return "50-64";
  return "65+";
}

export const EXPERIENCE_LABELS: Record<Experience, string> = {
  "<2": "Menos de 2 anos",
  "2-5": "2 a 5 anos",
  "5-10": "5 a 10 anos",
  "10-20": "10 a 20 anos",
  "20+": "Mais de 20 anos",
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  oficina: "Oficina",
  aula: "Aula regular",
  servico: "Serviço / Encomenda",
  evento: "Apresentação / Evento",
};

export const WEEKDAY_LABELS: Record<string, string> = {
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
};

export const CHART_PALETTE = ["#E65100", "#0D9488", "#D97706", "#7C3AED", "#E11D48", "#0284C7", "#16A34A"];

export const STATUS_META: Record<TalentStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: "Aguardando aprovação", bg: "#FEF3C7", fg: "#92400E" },
  approved: { label: "Aprovado", bg: "#DCFCE7", fg: "#166534" },
  rejected: { label: "Recusado", bg: "#FEE2E2", fg: "#991B1B" },
};

export const isFree = (price: string) => price.toLowerCase().includes("gratu");

export function formatDate(iso: string, pattern = "EEE, dd 'de' MMM"): string {
  return format(parseISO(iso), pattern, { locale: ptBR });
}

export function formatDateActivity(date: string | null, schedule: string): { dateDisplay: string; dayOfWeek?: string } {
  if (!date) return { dateDisplay: "", dayOfWeek: undefined };
  const d = parseISO(date);
  const dateFormatted = format(d, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const day = format(d, "EEEE");
  return { dateDisplay: dateFormatted, dayOfWeek: day };
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return phone;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 12) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone;
}

export function instagramLink(handle: string): string {
  const h = handle.trim().replace(/^@/, "");
  return h ? `https://instagram.com/${h}` : "";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function toInput(t: Talent): TalentInput {
  const { id: _id, created_at: _c, status: _s, owner_id: _o, owner_email: _e, ...rest } = t;
  // Infer an approximate birth year from the stored age_range so the form pre-fills the year field.
  const yearMap: Record<AgeRange, number> = {
    "15-24": 1998, "25-34": 1990, "35-49": 1978, "50-64": 1958, "65+": 1945,
  };
  const inferred = rest.age_range ? yearMap[rest.age_range] : undefined;
  return { ...rest, birth_date: inferred ? `${inferred}-01-01` : undefined };
}
