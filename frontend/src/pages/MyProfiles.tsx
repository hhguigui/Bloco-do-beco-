import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CategoryBadge from "@/components/CategoryBadge";
import GoogleSignInCard from "@/components/GoogleSignInCard";
import StatusBadge from "@/components/StatusBadge";
import TalentForm from "@/components/TalentForm";
import { apiDelete, apiGet, apiPut, errorMessage } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { toInput } from "@/lib/catalog";
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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Minha conta</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">Meus perfis</h1>
        {user && (
          <Link to="/cadastrar" className={cn(buttonVariants(), "bg-[#E65100] text-white hover:bg-[#C2410C]")} data-testid="my-profiles-new-button">
            <Plus className="size-4" /> Novo perfil
          </Link>
        )}
      </div>

      <div className="mt-8">
        {me.isLoading ? (
          <div className="h-60 animate-pulse rounded-3xl bg-[#FAF5EE]" />
        ) : !user ? (
          <GoogleSignInCard returnPath="/meus-perfis" title="Entre para ver seus perfis" text="Acompanhe a aprovação e edite os talentos que você cadastrou." />
        ) : (
          <div className="space-y-4" data-testid="my-profiles-list">
            {list.map((t) => (
              <div key={t.id} className="flex flex-col gap-4 rounded-2xl border border-amber-900/10 bg-white p-4 sm:flex-row sm:items-center" data-testid={`my-profile-${t.id}`}>
                {t.photo ? <img src={t.photo} alt="" className="size-16 rounded-xl object-cover" /> : <span className="size-16 rounded-xl bg-[#FAF5EE]" />}
                <div className="flex-1 space-y-1.5">
                  <p className="font-heading text-lg font-bold">{t.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={t.status} />
                    <CategoryBadge category={t.category} />
                  </div>
                  {t.status === "pending" && <p className="text-sm text-stone-500">Em análise pela equipe. Você será publicado assim que for aprovado.</p>}
                  {t.status === "rejected" && <p className="text-sm text-red-700">Não aprovado. Revise as informações e salve para reenviar.</p>}
                </div>
                <div className="flex gap-1">
                  <Link to={`/talento/${t.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Ver" data-testid={`my-profile-view-${t.id}`}><Eye className="size-4" /></Link>
                  <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEditing(t)} data-testid={`my-profile-edit-${t.id}`}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Excluir" onClick={() => setDeleting(t)} className="text-red-600" data-testid={`my-profile-delete-${t.id}`}><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
            {list.length === 0 && !mine.isLoading && (
              <div className="rounded-2xl border border-dashed border-amber-900/20 p-10 text-center text-stone-500" data-testid="my-profiles-empty">
                Você ainda não cadastrou nenhum talento. <Link to="/cadastrar" className="font-semibold text-[#C2410C] underline">Cadastrar agora</Link>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#FDFBF7] sm:max-w-3xl" data-testid="my-profile-edit-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Editar {editing?.name}</DialogTitle>
            <DialogDescription>Perfis recusados voltam para a fila de aprovação ao salvar.</DialogDescription>
          </DialogHeader>
          {editing && (
            <TalentForm key={editing.id} initial={toInput(editing)} submitLabel="Salvar alterações" pending={update.isPending} onSubmit={(values) => update.mutate({ id: editing.id, values })} />
          )}
        </DialogContent>
      </Dialog>

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
