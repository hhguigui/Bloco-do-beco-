import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import AiText from "./AiText";
import CascadeFilters from "./CascadeFilters";
import { apiGet } from "@/lib/api";
import { cascade } from "@/lib/cascade";
import type { Facet, Selection } from "@/lib/cascade";
import {
  ACTIVITY_LABELS,
  AGE_LABELS,
  CATEGORY_LABELS,
  CATEGORY_META,
  CHART_PALETTE,
  EXPERIENCE_LABELS,
  GENDER_LABELS,
  isFree,
} from "@/lib/catalog";
import { useAiStream } from "@/lib/useAiStream";
import type { Category, Talent } from "@/lib/types";

interface Row {
  key: string;
  name: string;
  value: number;
  color: string;
}

const FACETS: Facet<Talent>[] = [
  { id: "category", label: "Categoria", get: (t) => t.category, labels: CATEGORY_LABELS, allLabel: "Todas" },
  { id: "gender", label: "Gênero", get: (t) => t.gender, labels: GENDER_LABELS },
  { id: "age", label: "Faixa etária", get: (t) => t.age_range, labels: AGE_LABELS, allLabel: "Todas" },
  { id: "experience", label: "Tempo de atuação", get: (t) => t.experience, labels: EXPERIENCE_LABELS },
];

function tally(values: string[], labels: Record<string, string>, color: (k: string, i: number) => string): Row[] {
  const c = new Map<string, number>();
  values.forEach((v) => c.set(v, (c.get(v) ?? 0) + 1));
  return Object.keys(labels).map((k, i) => ({ key: k, name: labels[k], value: c.get(k) ?? 0, color: color(k, i) }));
}

function ChartCard({ title, subtitle, children, testId, className }: { title: string; subtitle?: string; children: ReactNode; testId: string; className?: string }) {
  return (
    <section className={`rounded-2xl border border-amber-900/10 bg-white p-5 ${className ?? ""}`} data-testid={testId}>
      <h3 className="font-heading text-lg font-bold">{title}</h3>
      {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
      <div className="mt-4 h-64">{children}</div>
    </section>
  );
}

function Bars({ data, vertical = false }: { data: Row[]; vertical?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {vertical ? (
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 16 }}>
          <CartesianGrid horizontal={false} stroke="#EFE7DB" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => [v, "Talentos"]} cursor={{ fill: "#FAF5EE" }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((d) => <Cell key={d.key} fill={d.color} />)}
          </Bar>
        </BarChart>
      ) : (
        <BarChart data={data} margin={{ left: -16, right: 8 }}>
          <CartesianGrid vertical={false} stroke="#EFE7DB" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => [v, "Quantidade"]} cursor={{ fill: "#FAF5EE" }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d) => <Cell key={d.key} fill={d.color} />)}
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

export default function AdminDashboard({ pendingCount }: { pendingCount: number }) {
  const query = useQuery({ queryKey: ["admin-talents", "approved"], queryFn: () => apiGet<Talent[]>("/admin/talents?status=approved") });
  const all = useMemo(() => (query.isError ? [] : (query.data ?? [])), [query.isError, query.data]);
  const [sel, setSel] = useState<Selection>({});
  const { options, effective, result } = cascade(all, FACETS, sel);
  const report = useAiStream<Record<string, never>>("/ai/report");

  const acts = result.flatMap((t) => t.activities);
  const categories = tally(result.map((t) => t.category), CATEGORY_LABELS, (k) => CATEGORY_META[k as Category].color);
  const genders = tally(result.map((t) => t.gender), GENDER_LABELS, (_k, i) => CHART_PALETTE[i]).filter((r) => r.value > 0);
  const ages = tally(result.map((t) => t.age_range), AGE_LABELS, () => "#0D9488").map((r) => ({ ...r, name: r.key }));
  const experience = tally(result.map((t) => t.experience), EXPERIENCE_LABELS, () => "#D97706");
  const activityTypes = tally(acts.map((a) => a.type), ACTIVITY_LABELS, (_k, i) => CHART_PALETTE[i]);

  const cards = [
    { id: "total-talents", label: "Talentos (filtro)", value: result.length, accent: "#E65100" },
    { id: "total-activities", label: "Atividades oferecidas", value: acts.length, accent: "#0D9488" },
    { id: "free-activities", label: "Atividades gratuitas", value: acts.filter((a) => isFree(a.price)).length, accent: "#16A34A" },
    { id: "masters", label: "Mestres (20+ anos)", value: result.filter((t) => t.experience === "20+").length, accent: "#D97706" },
    { id: "pending", label: "Aguardando aprovação", value: pendingCount, accent: "#7C3AED" },
  ];

  return (
    <div data-testid="admin-dashboard">
      <div className="rounded-2xl border border-amber-900/10 bg-white p-4">
        <p className="mb-3 text-sm text-stone-600">Filtros em cascata — cada filtro mostra só as opções que existem dentro dos anteriores.</p>
        <CascadeFilters facets={FACETS} options={options} effective={effective} onChange={setSel} testId="dashboard-filters" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.id} className="relative overflow-hidden rounded-2xl border border-amber-900/10 bg-white p-5">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: c.accent }} />
            <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500">{c.label}</p>
            <p className="mt-2 font-heading text-4xl font-extrabold text-stone-900" data-testid={`stat-${c.id}`}>{query.isLoading ? "—" : c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Talentos por categoria" testId="chart-categories" className="lg:col-span-2">
          <Bars data={categories} vertical />
        </ChartCard>
        <ChartCard title="Gênero" subtitle="Autodeclarado" testId="chart-gender">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={genders} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {genders.map((g) => <Cell key={g.key} fill={g.color} />)}
              </Pie>
              <Tooltip formatter={(v: number, n: string) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="-mt-2 flex flex-wrap justify-center gap-3 text-xs text-stone-600">
            {genders.map((g) => (
              <span key={g.key} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: g.color }} />{g.name} ({g.value})</span>
            ))}
          </div>
        </ChartCard>
        <ChartCard title="Faixa etária" subtitle="Em anos" testId="chart-age">
          <Bars data={ages} />
        </ChartCard>
        <ChartCard title="Tempo de atuação" testId="chart-experience">
          <Bars data={experience} />
        </ChartCard>
        <ChartCard title="Atividades por tipo" testId="chart-activity-types">
          <Bars data={activityTypes} />
        </ChartCard>
      </div>

      <section className="mt-10 rounded-3xl border border-amber-900/10 bg-[#FAF5EE] p-6 sm:p-8" data-testid="ai-report-section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#C2410C]"><Sparkles className="size-3.5" /> Análise com IA · Claude</p>
            <h3 className="mt-2 font-heading text-2xl font-extrabold tracking-tight">Relatório do território</h3>
            <p className="mt-1 text-stone-600">Texto com destaques, perfil dos talentos aprovados e lacunas — pronto para editais e prestação de contas.</p>
          </div>
          <Button onClick={() => void report.run({})} disabled={report.isPending} data-testid="ai-report-generate-button" className="bg-stone-900 text-white hover:bg-stone-800">
            {report.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            {report.text ? "Gerar novamente" : "Gerar relatório"}
          </Button>
        </div>
        {(report.text || report.isPending) && (
          <div className="mt-6 rounded-2xl bg-white p-6">
            {report.text ? (
              <AiText text={report.text} testId="ai-report-text" />
            ) : (
              <p className="inline-flex items-center gap-2 text-stone-500"><Loader2 className="size-4 animate-spin" /> Analisando os dados do bairro…</p>
            )}
            {report.text && !report.isPending && (
              <Button variant="outline" size="sm" className="mt-5" data-testid="ai-report-copy-button" onClick={() => void navigator.clipboard.writeText(report.text)}>
                Copiar texto
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
