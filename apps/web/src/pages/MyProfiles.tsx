import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CategoryBadge from "@/components/CategoryBadge";
import GoogleSignInCard from "@/components/GoogleSignInCard";
import StatusBadge from "@/components/StatusBadge";
import TalentForm from "@/components/TalentForm";
import { apiDelete, apiGet, apiPost, apiPut, errorMessage } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { toInput, initials } from "@/lib/catalog";
import type { Talent, TalentInput } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function MyProfiles() {
  const qc = useQueryClient();
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  const mine = useQuery({ queryKey: ["my-talents"], queryFn: () => apiGet<Talent[]>("/me/talents"), enabled: !!user });
  const list = mine.isError ? [] : (mine.data ?? []);
  const [editing, setEditing] = useState<Talent | null>(null);
  const [deleting, setDeleting] = useState<Talent | null>(null);

  const refresh = (id: string) => {
    for (const key of ["my-talents", "talents", "activities", "summary", "admin-talents"]) void qc.invalidateQueries({ queryKey: [key] });
    void qc.invalidateQueries({ queryKey: ["talent", id] });
  };

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TalentInput }) => apiPut<Talent>(`/talents/${id}`, values),
    onSuccess: (t) => { refresh(t.id); setEditing(null); toast.success("Perfil atualizado."); },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/talents/${id}`),
    onSuccess: (_r, id) => { refresh(id); setDeleting(null); toast.success("Perfil excluído."); },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Minha conta</p>
      <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight">Meu perfil</h1>

      <div className="mt-8">
        {me.isLoading ? (
          <div className="h-96 animate-pulse rounded-3xl bg-[#FAF5EE]" />
        ) : !user ? (
          <GoogleSignInCard returnPath="/perfil" title="Entre para ver seu perfil" text="Acompanhe a aprovação e edite os talentos que você cadastrou." />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            {/* Sidebar — User Profile */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(120,53,15,0.4)] sm:p-10">
                <div className="flex items-start gap-4">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="size-20 rounded-2xl object-cover" />
                  ) : (
                    <span className="grid size-20 place-items-center rounded-2xl bg-[#FFEDD5] text-2xl font-bold text-[#C2410C]">
                      {initials(user.name)}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-xl font-bold truncate">{user.name}</p>
                    <p className="mt-1 text-sm text-stone-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-6 border-t border-amber-900/10 pt-6">
                  {list.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-stone-600">Você ainda não cadastrou nenhum talento.</p>
                      <Button
                        className="w-full bg-[#E65100] text-white hover:bg-[#C2410C]"
                        onClick={() => window.location.href = "/perfil"}
                        data-testid="complete-profile-button"
                      >
                        Completar cadastro
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-stone-900">
                      {list.length} talento{list.length > 1 ? "s" : ""} cadastrad{list.length > 1 ? "os" : "o"}
                      {list.some(t => t.status === "pending") && " • Em análise"}
                      {list.some(t => t.status === "rejected") && " • Precisa revisão"}
                    </p>
                  )}
                  {list.length > 0 && (
                    <div className="mt-4 space-y-3" data-testid="my-profiles-list">
                      {list.map((t) => (
                        <div key={t.id} className="flex flex-col gap-2 rounded-xl border border-amber-900/10 bg-white p-3 sm:flex-row sm:items-center" data-testid={`my-profile-${t.id}`}>
                          {t.photo ? <img src={t.photo} alt="" className="size-12 rounded-lg object-cover" /> : <span className="size-12 rounded-lg bg-[#FAF5EE]" />}
                          <div className="flex-1 space-y-1">
                            <p className="font-heading text-sm font-bold truncate">{t.name}</p>
                            <div className="flex flex-wrap gap-1.5">
                              <StatusBadge status={t.status} />
                              <CategoryBadge category={t.category} />
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Link to={`/talento/${t.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Ver" data-testid={`my-profile-view-${t.id}`}>
                              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </Link>
                            <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEditing(t)} data-testid={`my-profile-edit-${t.id}`}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" aria-label="Excluir" onClick={() => setDeleting(t)} className="text-red-600" data-testid={`my-profile-delete-${t.id}`}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Main — Talent Form */}
            <div>
              <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-[0_30px_60px_-40px_rgba(120,53,15,0.4)] sm:p-10">
                {editing ? (
                  <>
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Editar talento</p>
                        <h2 className="mt-1 font-heading text-2xl font-extrabold">Editar <span className="text-[#E65100]">{editing.name}</span></h2>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="border-stone-300 text-stone-700 hover:bg-stone-100">
                        Cancelar
                      </Button>
                    </div>
                    <TalentForm
                      key={editing.id}
                      initial={toInput(editing)}
                      submitLabel="Salvar alterações"
                      pending={update.isPending}
                      onSubmit={(values) => update.mutate({ id: editing.id, values })}
                      activitiesOnly={true}
                    />
                  </>
                ) : (
                  <TalentForm
                    key={`new-${user.user_id}`}
                    prefill={{ name: user.name, photo: user.picture }}
                    submitLabel="Enviar para aprovação"
                    pending={false}
                    onSubmit={(values) => {
                      apiPost<Talent>("/talents", values)
                        .then((t) => {
                          refresh(t.id);
                          toast.success("Perfil enviado! A equipe vai revisar e aprovar em breve.");
                        })
                        .catch((err) => toast.error(errorMessage(err)));
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent data-testid="my-profile-delete-dialog">
          <DialogHeader>
            <DialogTitle>Excluir perfil?</DialogTitle>
            <DialogDescription>O perfil de <strong>{deleting?.name}</strong> será removido permanentemente.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)} data-testid="my-profile-delete-confirm">
              {remove.isPending && <Loader2 className="size-4 animate-spin" />} Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}