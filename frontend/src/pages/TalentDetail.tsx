import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, CalendarDays, Instagram, MapPin, MessageCircle, Tag } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import CategoryBadge from "@/components/CategoryBadge";
import TalentsMap from "@/components/TalentsMap";
import { apiGet } from "@/lib/api";
import {
  ACTIVITY_LABELS,
  AGE_LABELS,
  CATEGORY_META,
  EXPERIENCE_LABELS,
  formatDate,
  initials,
  STATUS_META,
  instagramLink,
  whatsappLink,
} from "@/lib/catalog";
import type { Talent } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TalentDetail() {
  const { id = "" } = useParams();
  const query = useQuery({ queryKey: ["talent", id], queryFn: () => apiGet<Talent>(`/talents/${id}`), retry: false });
  const t = query.isError ? undefined : query.data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <Link to="/talentos" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900" data-testid="talent-back-link">
        <ArrowLeft className="size-4" /> Voltar ao catálogo
      </Link>

      {query.isLoading && <div className="mt-8 h-96 animate-pulse rounded-3xl bg-[#FAF5EE]" />}
      {!query.isLoading && !t && (
        <div className="mt-8 rounded-2xl border border-dashed border-amber-900/20 p-10 text-center text-stone-500" data-testid="talent-not-found">
          Não foi possível carregar este perfil.
        </div>
      )}

      {t && t.status !== "approved" && (
        <div className="mt-6 rounded-2xl border p-4 text-sm" style={{ background: STATUS_META[t.status].bg, color: STATUS_META[t.status].fg }} data-testid="talent-status-banner">
          <strong>{STATUS_META[t.status].label}.</strong>{" "}
          {t.status === "pending" ? "Este perfil só é visível para você e para a equipe até ser aprovado." : "Este perfil não está publicado. Edite em “Meus perfis” para reenviar."}
        </div>
      )}

      {t && (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <article>
            <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
              <div className="aspect-square overflow-hidden rounded-3xl border-4 border-white shadow-xl" style={{ background: CATEGORY_META[t.category].bg }}>
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="h-full w-full object-cover" data-testid="talent-photo" />
                ) : (
                  <div className="grid h-full place-items-center font-heading text-6xl font-extrabold" style={{ color: CATEGORY_META[t.category].fg }}>
                    {initials(t.name)}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-end">
                <CategoryBadge category={t.category} className="self-start" />
                <h1 className="mt-3 font-heading text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl" data-testid="talent-name">
                  {t.name}
                </h1>
                {t.specialty && <p className="mt-2 text-lg text-stone-600" data-testid="talent-specialty">{t.specialty}</p>}
                <div className="mt-5 flex flex-wrap gap-2">
                  {t.phone && whatsappLink(t.phone) && (
                    <a
                      href={whatsappLink(t.phone, `Olá ${t.name}! Vi seu perfil no site do Bloco do Beco.`)}
                      target="_blank"
                      rel="noreferrer"
                      data-testid="talent-whatsapp-button"
                      className={cn(buttonVariants(), "bg-[#16A34A] text-white hover:bg-[#15803D]")}
                    >
                      <MessageCircle className="size-4" /> Falar no WhatsApp
                    </a>
                  )}
                  {t.instagram && (
                    <a href={instagramLink(t.instagram)} target="_blank" rel="noreferrer" data-testid="talent-instagram-link" className={buttonVariants({ variant: "outline" })}>
                      <Instagram className="size-4" /> {t.instagram}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-amber-900/10 bg-amber-900/10 sm:grid-cols-3">
              {[
                { label: "Faixa etária", value: AGE_LABELS[t.age_range], id: "age" },
                { label: "Tempo de atuação", value: EXPERIENCE_LABELS[t.experience], id: "experience" },
                { label: "Atividades", value: String(t.activities.length), id: "activities" },
              ].map((f) => (
                <div key={f.id} className="bg-white p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{f.label}</p>
                  <p className="mt-1 font-semibold text-stone-900" data-testid={`talent-fact-${f.id}`}>{f.value}</p>
                </div>
              ))}
            </div>

            {t.bio && (
              <section className="mt-10">
                <h2 className="font-heading text-xl font-bold">Sobre</h2>
                <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-stone-700" data-testid="talent-bio">{t.bio}</p>
              </section>
            )}

            <section className="mt-10">
              <h2 className="font-heading text-xl font-bold">Atividades oferecidas</h2>
              {t.activities.length === 0 && <p className="mt-3 text-stone-500">Nenhuma atividade cadastrada ainda.</p>}
              <div className="mt-4 space-y-3">
                {t.activities.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-amber-900/10 bg-white p-5" data-testid={`talent-activity-${a.id}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-heading text-lg font-bold">{a.title}</h3>
                      <span className="rounded-full bg-[#CCFBF1] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-[#115E59]">{ACTIVITY_LABELS[a.type]}</span>
                    </div>
                    {a.description && <p className="mt-2 text-stone-600">{a.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-600">
                      {a.date && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-stone-800"><CalendarDays className="size-4 text-[#0D9488]" /> {formatDate(a.date)}</span>
                      )}
                      {a.schedule && (
                        <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-4 text-[#E65100]" /> {a.schedule}</span>
                      )}
                      {a.price && (
                        <span className="inline-flex items-center gap-1.5"><Tag className="size-4 text-[#E65100]" /> {a.price}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-amber-900/10 bg-white p-4">
              <p className="flex items-start gap-2 px-1 pb-3 text-sm text-stone-700" data-testid="talent-address">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#E65100]" />
                {t.address} — Jardim Ibirapuera, São Paulo
              </p>
              <TalentsMap talents={[t]} focus={[t.lat, t.lng]} zoom={16} className="h-80" testId="talent-detail-map" />
              <a
                href={`https://www.openstreetmap.org/?mlat=${t.lat}&mlon=${t.lng}#map=18/${t.lat}/${t.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block px-1 text-sm font-semibold text-[#C2410C] hover:underline"
                data-testid="talent-directions-link"
              >
                Abrir no mapa →
              </a>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
