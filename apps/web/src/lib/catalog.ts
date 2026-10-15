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

export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return "";
  const full = digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
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
  return rest;
}
