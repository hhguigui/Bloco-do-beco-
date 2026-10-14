// Cascading facets: each filter's options (and counts) come only from items that pass the filters before it.

export interface Facet<T> {
  id: string;
  label: string;
  get: (item: T) => string | string[] | null | undefined;
  labels?: Record<string, string>; // fixed order + display labels; otherwise alphabetical raw values
  allLabel?: string;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export type Selection = Record<string, string>;

const values = (v: string | string[] | null | undefined): string[] =>
  (Array.isArray(v) ? v : [v]).map((x) => (x ?? "").trim()).filter(Boolean);

export function cascade<T>(items: T[], facets: Facet<T>[], selection: Selection) {
  let pool = items;
  const options: Record<string, FacetOption[]> = {};
  const effective: Selection = {};
  for (const f of facets) {
    const counts = new Map<string, number>();
    for (const item of pool) for (const v of new Set(values(f.get(item)))) counts.set(v, (counts.get(v) ?? 0) + 1);
    const order = f.labels ? Object.keys(f.labels) : [...counts.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));
    options[f.id] = order
      .filter((v) => counts.has(v))
      .map((v) => ({ value: v, label: f.labels?.[v] ?? v, count: counts.get(v) ?? 0 }));
    const chosen = selection[f.id];
    if (chosen && counts.has(chosen)) {
      effective[f.id] = chosen;
      pool = pool.filter((item) => values(f.get(item)).includes(chosen));
    }
  }
  return { options, effective, result: pool };
}

// Changing one facet clears every facet after it (the cascade).
export function selectFacet<T>(facets: Facet<T>[], selection: Selection, id: string, value: string): Selection {
  const idx = facets.findIndex((f) => f.id === id);
  const next: Selection = {};
  facets.forEach((f, i) => {
    if (i < idx && selection[f.id]) next[f.id] = selection[f.id];
  });
  if (value) next[id] = value;
  return next;
}
