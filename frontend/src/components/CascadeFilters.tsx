import { ChevronRight, X } from "lucide-react";
import { Fragment } from "react";
import FieldSelect from "./FieldSelect";
import { selectFacet } from "@/lib/cascade";
import type { Facet, FacetOption, Selection } from "@/lib/cascade";

const ALL = "__all";

interface Props<T> {
  facets: Facet<T>[];
  options: Record<string, FacetOption[]>;
  effective: Selection;
  onChange: (next: Selection) => void;
  testId: string;
}

export default function CascadeFilters<T>({ facets, options, effective, onChange, testId }: Props<T>) {
  const active = Object.keys(effective).length;
  return (
    <div className="flex flex-wrap items-end gap-2" data-testid={testId}>
      {facets.map((f, i) => {
        const opts = options[f.id] ?? [];
        const total = opts.reduce((n, o) => n + o.count, 0);
        const map: Record<string, string> = { [ALL]: `${f.allLabel ?? "Todos"}${total ? ` (${total})` : ""}` };
        opts.forEach((o) => (map[o.value] = `${o.label} (${o.count})`));
        return (
          <Fragment key={f.id}>
            {i > 0 && <ChevronRight className="mb-2.5 hidden size-4 text-stone-300 sm:block" aria-hidden />}
            <div className="min-w-44 flex-1 sm:flex-none">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-stone-500">
                {i + 1}. {f.label}
              </p>
              <FieldSelect
                id={`${testId}-${f.id}`}
                value={effective[f.id] ?? ALL}
                onChange={(v) => onChange(selectFacet(facets, effective, f.id, v === ALL ? "" : v))}
                options={map}
                testId={`${testId}-${f.id}`}
                className="w-full sm:w-52"
              />
            </div>
          </Fragment>
        );
      })}
      {active > 0 && (
        <button
          type="button"
          onClick={() => onChange({})}
          data-testid={`${testId}-clear`}
          className="mb-1 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-[#C2410C] transition-colors hover:bg-[#FFEDD5]"
        >
          <X className="size-3.5" /> Limpar filtros
        </button>
      )}
    </div>
  );
}
