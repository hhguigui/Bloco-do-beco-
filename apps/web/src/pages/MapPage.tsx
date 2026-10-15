import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import CascadeFilters from "@/components/CascadeFilters";
import TalentsMap from "@/components/TalentsMap";
import { apiGet } from "@/lib/api";
import { cascade } from "@/lib/cascade";
import type { Facet, Selection } from "@/lib/cascade";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_META, EXPERIENCE_LABELS } from "@/lib/catalog";
import { ACTIVITY_LABELS } from "@/lib/catalog";
import type { Talent } from "@/lib/types";
import { cn } from "@/lib/utils";

const FACETS: Facet<Talent>[] = [
  { id: "category", label: "Categoria", get: (t) => t.category, labels: CATEGORY_LABELS, allLabel: "Todas" },
  { id: "specialty", label: "Tipo", get: (t) => t.specialty, allLabel: "Todas" },
  { id: "activity", label: "Valor", get: (t) => t.activities.map((a) => a.type), labels: ACTIVITY_LABELS, allLabel: "Qualquer" },
  { id: "experience", label: "Talento", get: (t) => t.experience, labels: EXPERIENCE_LABELS },
];

export default function MapPage() {
  const query = useQuery({ queryKey: ["talents", "", ""], queryFn: () => apiGet<Talent[]>("/talents") });
  const all = useMemo(() => (query.isError ? [] : (query.data ?? [])), [query.isError, query.data]);
  const [sel, setSel] = useState<Selection>({});
  const [selected, setSelected] = useState<Talent | null>(null);
  const { options, effective, result: visible } = cascade(all, FACETS, sel);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Geolocalização</p>
          <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Mapa de talentos</h1>
          <p className="mt-2 text-stone-600">Jardim Ibirapuera, São Paulo — clique em um pino para ver o perfil.</p>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-stone-500" data-testid="map-visible-count">
          {visible.length} de {all.length} no mapa
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-4">
        <CascadeFilters facets={FACETS} options={options} effective={effective} onChange={(s) => { setSel(s); setSelected(null); }} testId="map-filters" />
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-amber-900/10 pt-3" data-testid="map-legend">
          {CATEGORIES.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 text-xs text-stone-600">
              <span className="size-2.5 rounded-full" style={{ background: CATEGORY_META[c].color }} /> {CATEGORY_META[c].label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <TalentsMap talents={visible} className="h-[560px] lg:h-[640px]" focus={selected ? [selected.lat, selected.lng] : null} onSelect={setSelected} testId="map-page-map" />
        <aside className="max-h-[640px] space-y-2 overflow-y-auto rounded-2xl border border-amber-900/10 bg-white p-3" data-testid="map-talent-list">
          {visible.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t)}
              data-testid={`map-list-item-${t.id}`}
              className={cn("flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors duration-200 hover:bg-[#FAF5EE]", selected?.id === t.id && "bg-[#FFEDD5]")}
            >
              {t.photo ? <img src={t.photo} alt="" className="size-11 shrink-0 rounded-lg object-cover" /> : <span className="size-11 shrink-0 rounded-lg" style={{ background: CATEGORY_META[t.category].bg }} />}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-stone-900">{t.name}</span>
                <span className="flex items-center gap-1 truncate text-xs text-stone-500">
                  <MapPin className="size-3 shrink-0" style={{ color: CATEGORY_META[t.category].color }} /> {t.address}
                </span>
              </span>
            </button>
          ))}
          {visible.length === 0 && <p className="p-4 text-sm text-stone-500">Nenhum talento com esses filtros.</p>}
          {selected && (
            <Link to={`/talento/${selected.id}`} data-testid="map-selected-profile-link" className="sticky bottom-0 mt-2 block rounded-xl bg-stone-900 p-3 text-center text-sm font-semibold text-white">
              Ver perfil de {selected.name} →
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
