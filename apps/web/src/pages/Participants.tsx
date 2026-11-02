import { Loader2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { useMe } from "@/lib/auth";
import type { ParticipantActivity, Participation } from "@/lib/types";
import { formatDate } from "@/lib/catalog";

export default function Participants() {
  const { id = "" } = useParams();
  const me = useMe();
  const isAdmin = me.isError ? false : (me.data?.is_admin ?? false);
  const isOwner = me.isError ? false : (me.data?.user?.role === "talent");

  const canAccess = isAdmin || isOwner;

  const query = useQuery({
    queryKey: ["talent-participants", id],
    queryFn: () =>
      apiGet<ParticipantActivity[]>(
        isAdmin ? `/admin/talents/${id}/participants` : `/me/talents/${id}/participants`
      ),
    enabled: !!id && canAccess,
  });

  const data = query.data ?? [];
  const totalCount = data.reduce((s, g) => s + g.participants.length, 0);
  const hasAny = totalCount > 0;

  if (!canAccess && !query.isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <RouterLink
          to="/meus-perfis"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
          data-testid="participants-back-link"
        >
          <ArrowLeft className="size-4" /> Voltar a Meus perfis
        </RouterLink>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-testid="participants-forbidden">
          Você não tem permissão para ver os participantes deste perfil.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <RouterLink
        to="/meus-perfis"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        data-testid="participants-back-link"
      >
        <ArrowLeft className="size-4" /> Voltar a Meus perfis
      </RouterLink>

      <div className="mt-6 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-full bg-[#CCFBF1]">
          <Users className="size-5 text-[#115E59]" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight">Participantes</h1>
          <p className="text-sm text-stone-500">
            Inscrições recebidas nas atividades deste talento
            {query.isLoading && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Loader2 className="size-3.5 animate-spin" /> Carregando…
              </span>
            )}
          </p>
        </div>
      </div>

      {query.isError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-testid="participants-error">
          Não foi possível carregar os participantes.
        </div>
      )}

      {!query.isLoading && !hasAny && (
        <div className="mt-6 rounded-2xl border border-amber-900/10 bg-white p-10 text-center text-stone-500" data-testid="participants-empty">
          {totalCount === 0
            ? "Nenhuma inscrição recebida ainda."
            : "Nenhum participante encontrado."}
        </div>
      )}

      {hasAny && (
        <div className="mt-6 space-y-4" data-testid="participants-list">
          <p className="font-mono text-xs text-stone-400">{totalCount} inscrito{(totalCount > 1 ? "s" : "")}</p>
          {data.map((group) => (
            <section
              key={group.activity_id}
              className="rounded-2xl border border-amber-900/10 bg-white p-5"
              data-testid={`participants-group-${group.activity_id}`}
            >
              <h2 className="font-semibold text-stone-800">{group.activity_title}</h2>
              <p className="mt-1 text-xs text-stone-500">{group.participants.length} pessoa{(group.participants.length > 1 ? "s" : "")}</p>
              <div className="mt-3 space-y-2">
                {group.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-[#FAF5EE] px-3 py-2 text-sm"
                    data-testid={`participant-${p.id}`}
                  >
                    {p.participant_picture ? (
                      <img src={p.participant_picture} alt="" className="size-6 rounded-full" />
                    ) : (
                      <span className="grid size-6 place-items-center rounded-full bg-[#FFEDD5] text-[10px] font-bold text-[#C2410C]">
                        {p.participant_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium text-stone-900">{p.participant_name}</span>
                    {p.participant_email && (
                      <span className="text-stone-500">{p.participant_email}</span>
                    )}
                    {p.participant_phone && (
                      <span className="text-stone-500">· {p.participant_phone}</span>
                    )}
                    <span className="ml-auto font-mono text-[11px] text-stone-400">
                      {formatDate(p.created_at.slice(0, 10), "dd/MM/yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
