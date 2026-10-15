import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import CascadeFilters from "@/components/CascadeFilters";
import TalentCard from "@/components/TalentCard";
import { apiGet } from "@/lib/api";
import { cascade } from "@/lib/cascade";
import type { Facet, Selection } from "@/lib/cascade";
import { AGE_LABELS, CATEGORY_LABELS, EXPERIENCE_LABELS } from "@/lib/catalog";
import type { Talent } from "@/lib/types";

const FACETS: Facet<Talent>[] = [
  { id: "category", label: "Categoria", get: (t) => t.category, labels: CATEGORY_LABELS, allLabel: "Todas" },
  { id: "specialty", label: "Tipo", get: (t) => t.specialty, allLabel: "Todas" },
  { id: "experience", label: "Valor", get: (t) => t.experience, labels: EXPERIENCE_LABELS },
  { id: "age", label: "Talento", get: (t) => t.age_range, labels: AGE_LABELS, allLabel: "Todas" },
];

export default function Talents() {
  const [params] = useSearchParams();
  const [sel, setSel] = useState<Selection>((): Selection => {
    const c = params.get("categoria");
    return c ? { category: c } : {};
  });
  const [q, setQ] = useState("");

  const query = useQuery({ queryKey: ["talents", "", ""], queryFn: () => apiGet<Talent[]>("/talents") });
  const all = useMemo(() => (query.isError ? [] : (query.data ?? [])), [query.isError, query.data]);
  const term = q.trim().toLowerCase();
  const searched = term
    ? all.filter((t) => [t.name, t.specialty, t.bio, ...t.activities.map((a) => a.title)].join(" ").toLowerCase().includes(term))
    : all;
  const { options, effective, result } = cascade(searched, FACETS, sel);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Catálogo</p>
      <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Talentos do Jardim Ibirapuera</h1>
      <p className="mt-3 max-w-2xl text-stone-600">Busque por nome ou atividade e refine em cascata: categoria → tipo → valor → talento.</p>

      <div className="sticky top-[65px] z-30 -mx-4 mt-8 space-y-4 border-b border-amber-900/10 bg-[#FDFBF7]/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: pandeiro, costura, grafite…" className="h-11 bg-white pl-10" data-testid="talents-search-input" />
        </div>
        <CascadeFilters facets={FACETS} options={options} effective={effective} onChange={setSel} testId="talents-filters" />
      </div>

      <p className="mt-6 font-mono text-xs uppercase tracking-wider text-stone-500" data-testid="talents-result-count">
        {result.length} {result.length === 1 ? "talento encontrado" : "talentos encontrados"}
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {result.map((t, i) => (
          <TalentCard key={t.id} talent={t} index={i} />
        ))}
      </div>
      {result.length === 0 && !query.isLoading && (
        <div className="mt-6 rounded-2xl border border-dashed border-amber-900/20 p-10 text-center text-stone-500" data-testid="talents-empty-state">
          Nenhum talento encontrado com esses filtros.
        </div>
      )}
    </div>
  );
}
