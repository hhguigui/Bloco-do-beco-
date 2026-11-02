import { useState } from "react";
import { Loader2, Users, ChevronDown, ChevronUp, Mail, Phone as PhoneIcon, Instagram, UserCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { Participation, ParticipantActivity } from "@/lib/types";
import { formatDate } from "@/lib/catalog";

interface PublicActivity {
  activity_id: string;
  activity_title: string;
  participant_count: number;
  participants?: Participation[];
}

interface PublicTalent {
  talent_id: string;
  talent_name: string;
  activities: PublicActivity[];
}

const GENDER_LABELS: Record<string, string> = {
  mulher: "Mulher",
  homem: "Homem",
  nao_binario: "Não binário",
  nao_informado: "Não informado",
};

export default function Participantes() {
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  const isAdmin = me.isError ? false : (me.data?.is_admin ?? false);

  // Public endpoint (counts only)
  const { data: publicData, isLoading: loadingPublic } = useQuery({
    queryKey: ["public-participants"],
    queryFn: () => apiGet<PublicTalent[]>("/participants"),
  });

  // Authenticated endpoint (full details) - only for owners/admins
  const { data: detailedData, isLoading: loadingDetailed } = useQuery({
    queryKey: ["my-participants"],
    queryFn: () => apiGet<PublicTalent[]>("/my-participants"),
    enabled: !!user,
  });

  // Use detailed data if available, otherwise fallback to public
  const allParticipants = detailedData ?? publicData ?? [];
  const isLoading = loadingPublic || loadingDetailed;

  const totalCount = allParticipants.reduce(
    (s, t) => s + t.activities.reduce((a, ac) => a + ac.participant_count, 0),
    0
  );
  const hasAny = totalCount > 0;
  const showDetails = !!user && detailedData !== undefined;

  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);

  const toggleParticipant = (id: string) => {
    setExpandedParticipant(expandedParticipant === id ? null : id);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-[#CCFBF1]">
          <Users className="size-5 text-[#115E59]" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Participantes</h1>
          <p className="text-sm text-stone-500">
            {showDetails
              ? "Inscrições nas atividades dos seus talentos"
              : "Total de inscrições nas atividades dos talentos do bairro"}
            {isLoading && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Loader2 className="size-3.5 animate-spin" /> Carregando…
              </span>
            )}
          </p>
        </div>
      </div>

      {!user && (
        <div className="mt-4 rounded-2xl border border-amber-900/10 bg-white p-4 text-sm text-stone-600">
          Faça login para ver detalhes completos dos participantes.
        </div>
      )}

      {isLoading && (
        <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-5 text-center">
          <Loader2 className="size-5 animate-spin mx-auto text-stone-400" />
        </div>
      )}

      {!isLoading && !hasAny && (
        <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-10 text-center text-stone-500" data-testid="participants-empty">
          Nenhuma inscrição recebida ainda.
        </div>
      )}

      {!isLoading && hasAny && (
        <div className="mt-6 space-y-6" data-testid="participants-list">
          <p className="font-mono text-xs text-stone-400">
            {totalCount} inscrição{(totalCount > 1 ? "ões" : "")}
          </p>

          {allParticipants.map((talent) => (
            <div key={talent.talent_id}>
              <h2 className="font-heading text-lg font-bold text-stone-800 flex items-center gap-2">
                <RouterLink
                  to={`/talento/${talent.talent_id}`}
                  className="hover:underline"
                >
                  {talent.talent_name}
                </RouterLink>
                {showDetails && (
                  <span className="text-xs font-normal text-stone-400">
                    (seu talento)
                  </span>
                )}
              </h2>
              <div className="mt-3 space-y-4">
                {talent.activities.map((activity) => (
                  <section
                    key={activity.activity_id}
                    className="rounded-2xl border border-amber-900/10 bg-white p-5"
                    data-testid={`participants-group-${activity.activity_id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-stone-800">
                        {activity.activity_title}
                      </h3>
                      <span className="rounded-full bg-[#CCFBF1] px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[#115E59]">
                        {activity.participant_count} inscrito{activity.participant_count !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {showDetails && activity.participants && activity.participants.length > 0 ? (
                      <div className="space-y-2">
                        {activity.participants.map((p) => {
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
                                  <img src={p.participant_picture} alt="" className="size-8 rounded-full flex-shrink-0" />
                                ) : (
                                  <span className="grid size-8 place-items-center rounded-full bg-[#FFEDD5] text-xs font-bold text-[#C2410C] flex-shrink-0">
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
                                <div className="mt-2 ml-11 rounded-xl bg-[#FFF9F5] border border-amber-900/10 p-3 text-sm space-y-2 animate-in fade-in slide-in-from-top-1" data-testid={`participant-details-${p.id}`}>
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
                                        @{p.participant_instagram.replace(/^@/, "")}
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
                    ) : (
                      <p className="text-xs text-stone-400 italic">
                        {showDetails ? "Sem detalhes disponíveis" : "Faça login para ver os participantes"}
                      </p>
                    )}
                  </section>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
