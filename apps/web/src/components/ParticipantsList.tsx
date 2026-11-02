import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users, ChevronDown, ChevronUp, Mail, Phone as PhoneIcon, Instagram, UserCircle } from "lucide-react";
import { apiGet } from "@/lib/api";
import { formatDate } from "@/lib/catalog";
import type { ParticipantActivity } from "@/lib/types";

const GENDER_LABELS: Record<string, string> = {
  mulher: "Mulher",
  homem: "Homem",
  nao_binario: "Não binário",
  nao_informado: "Não informado",
};

export default function ParticipantsList({ talentId, activities, apiPath }: { talentId: string; activities: { id: string; title: string }[]; apiPath?: string }) {
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  
  const query = useQuery({
    queryKey: ["talent-participants", talentId],
    queryFn: () => apiGet<ParticipantActivity[]>(apiPath || `/me/talents/${talentId}/participants`),
    enabled: activities.length > 0,
  });

  const toggleParticipant = (id: string) => {
    setExpandedParticipant(expandedParticipant === id ? null : id);
  };

  if (query.isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-5" data-testid="participants-loading">
        <p className="inline-flex items-center gap-2 text-sm text-stone-500"><Loader2 className="size-4 animate-spin" /> Carregando participantes…</p>
      </div>
    );
  }

  if (query.isError) return null;

  const data = query.data ?? [];
  const hasAny = data.some((g) => g.participants.length > 0);

  if (!hasAny) {
    return (
      <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-5" data-testid="participants-empty">
        <p className="text-sm text-stone-500">Nenhuma inscrição recebida ainda.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4" data-testid="participants-list">
      <h2 className="font-heading text-xl font-bold flex items-center gap-2">
        <Users className="size-5 text-[#C2410C]" />
        Participantes
        <span className="font-mono text-sm font-normal text-stone-500">
          ({data.reduce((s, g) => s + g.participants.length, 0)} inscritos)
        </span>
      </h2>
      {data.map((group) => (
        <section key={group.activity_id} className="rounded-2xl border border-amber-900/10 bg-white p-5" data-testid={`participants-group-${group.activity_id}`}>
          <h3 className="font-semibold text-stone-800">{group.activity_title}</h3>
          <p className="mt-1 text-xs text-stone-500">{group.participants.length} pessoa(s)</p>
          <div className="mt-3 space-y-2">
            {group.participants.map((p) => {
              const isExpanded = expandedParticipant === p.id;
              const phones = p.participant_phones || (p.participant_phone ? [p.participant_phone] : []);
              
              return (
                <div key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggleParticipant(p.id)}
                    className="w-full flex flex-wrap items-center gap-3 rounded-xl bg-[#FAF5EE] px-3 py-2 text-sm hover:bg-[#F5EDE0] transition-colors text-left"
                    data-testid={`participant-${p.id}`}
                  >
                    {p.participant_picture ? (
                      <img src={p.participant_picture} alt="" className="size-6 rounded-full flex-shrink-0" />
                    ) : (
                      <span className="grid size-6 place-items-center rounded-full bg-[#FFEDD5] text-[10px] font-bold text-[#C2410C] flex-shrink-0">
                        {p.participant_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium text-stone-900 flex-1">{p.participant_name}</span>
                    {p.participant_email && (
                      <span className="text-stone-500 text-xs hidden sm:inline">{p.participant_email}</span>
                    )}
                    {phones[0] && (
                      <span className="text-stone-500 text-xs hidden sm:inline">· {phones[0]}</span>
                    )}
                    <span className="ml-auto font-mono text-[11px] text-stone-400 hidden sm:block">
                      {formatDate(p.created_at.slice(0, 10), "dd/MM/yyyy")}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="size-4 text-stone-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-stone-400 flex-shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 ml-9 rounded-xl bg-[#FFF9F5] border border-amber-900/10 p-3 text-sm space-y-2 animate-in fade-in slide-in-from-top-1">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-stone-600">
                        {p.participant_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3.5 text-[#C2410C]" />
                            {p.participant_email}
                          </span>
                        )}
                        {phones.length > 0 && (
                          <span className="flex items-center gap-1">
                            <PhoneIcon className="size-3.5 text-[#C2410C]" />
                            {phones.join(" | ")}
                          </span>
                        )}
                        {p.participant_gender && GENDER_LABELS[p.participant_gender] && (
                          <span className="flex items-center gap-1">
                            <UserCircle className="size-3.5 text-[#C2410C]" />
                            {GENDER_LABELS[p.participant_gender]}
                          </span>
                        )}
                        {p.participant_instagram && (
                          <span className="flex items-center gap-1">
                            <Instagram className="size-3.5 text-[#C2410C]" />
                            @{p.participant_instagram}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400">
                        Inscrito em {formatDate(p.created_at.slice(0, 10), "dd/MM/yyyy")}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
