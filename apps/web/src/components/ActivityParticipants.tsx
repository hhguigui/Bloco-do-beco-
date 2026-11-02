import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

interface ActivityCount {
  activity_id: string;
  activity_title: string;
  participant_count: number;
}

interface Props {
  talentId: string;
  activities: { id: string; title: string }[];
}

export default function ActivityParticipants({ talentId, activities }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["talent-participant-counts", talentId],
    queryFn: () => apiGet<{ activities: ActivityCount[] }>(`/talents/${talentId}/participants-count`),
    enabled: activities.length > 0,
  });

  const counts = data?.activities ?? [];
  const total = counts.reduce((s, a) => s + a.participant_count, 0);

  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-5" data-testid="participants-loading">
        <p className="inline-flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="size-4 animate-spin" /> Carregando participantes…
        </p>
      </div>
    );
  }

  if (total === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-5" data-testid="activity-participants">
      <h2 className="font-heading text-lg font-bold flex items-center gap-2">
        <span className="text-[#C2410C]">👥</span>
        Participantes
        <span className="font-mono text-sm font-normal text-stone-500">
          ({total} {total === 1 ? "inscrito" : "inscritos"})
        </span>
      </h2>
      <div className="mt-3 space-y-2">
        {counts.map((a) => (
          <div
            key={a.activity_id}
            className="flex items-center justify-between rounded-xl bg-[#FAF5EE] px-3 py-2 text-sm"
            data-testid={`activity-participants-${a.activity_id}`}
          >
            <span className="font-medium text-stone-800">{a.activity_title}</span>
            <span className="rounded-full bg-[#CCFBF1] px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-[#115E59]">
              {a.participant_count} inscrito{a.participant_count !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
