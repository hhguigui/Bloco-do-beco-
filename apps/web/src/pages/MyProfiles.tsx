import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, Phone, Plus, Trash2, UserCog, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CategoryBadge from "@/components/CategoryBadge";
import GoogleSignInCard from "@/components/GoogleSignInCard";
import StatusBadge from "@/components/StatusBadge";
import TalentForm from "@/components/TalentForm";
import ActivityForm from "@/components/ActivityForm";
import { apiDelete, apiGet, apiPatch, apiPut, errorMessage } from "@/lib/api";
import { ME_KEY, useMe } from "@/lib/auth";
import { toInput } from "@/lib/catalog";
import type { Me, Talent, TalentInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MyProfiles() {
  const qc = useQueryClient();
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  const mine = useQuery({ queryKey: ["my-talents"], queryFn: () => apiGet<Talent[]>("/me/talents"), enabled: !!user });
  const list = mine.isError ? [] : (mine.data ?? []);
  const [editing, setEditing] = useState<Talent | null>(null);
  const [deleting, setDeleting] = useState<Talent | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [editingActivities, setEditingActivities] = useState<string | null>(null);
  const [activitiesPending, setActivitiesPending] = useState(false);

  const refresh = (id: string) => {
    for (const key of ["my-talents", "talents", "activities", "summary", "admin-talents"]) void qc.invalidateQueries({ queryKey: [key] });
    void qc.invalidateQueries({ queryKey: ["talent", id] });
    void qc.invalidateQueries({ queryKey: ["auth", "me"] });
  };

  const changeRole = useMutation({
    mutationFn: (role: string) => apiPatch<Me>("/auth/me/role", { role }),
    onMutate: () => setUpdatingRole(true),
    onSuccess: (_data, role) => {
      toast.success(role === "talent" ? "Agora você é talento." : "Agora você é cliente.");
      refresh("");
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      setUpdatingRole(false);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TalentInput }) => apiPut<Talent>(`/talents/${id}`, values),
    onSuccess: (t) => { refresh(t.id); setEditing(null); toast.success("Perfil atualizado."); },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const addActivity = useMutation({
    mutationFn: ({ id, activity }: { id: string; activity: any }) => apiPatch<Talent>(`/talents/${id}/activities`, { activity }),
    onSuccess: (t) => { refresh(t.id); toast.success("Atividade adicionada."); },
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
        {user && list.length > 0 && (
          <p className="text-sm text-stone-500">Seus talentos cadastrados</p>
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
                <div className="flex gap-1 flex-wrap">
                  <Link to={`/talento/${t.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Ver" data-testid={`my-profile-view-${t.id}`}><Eye className="size-4" /></Link>
                  <Link to={`/meus-perfis/${t.id}/participantes`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label="Ver inscritos" data-testid={`my-profile-participants-${t.id}`}><Users className="size-4" /></Link>
                  <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEditing(t)} data-testid={`my-profile-edit-${t.id}`}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Excluir" onClick={() => setDeleting(t)} className="text-red-600" data-testid={`my-profile-delete-${t.id}`}><Trash2 className="size-4" /></Button>
                </div>
              </div>
            ))}
            {list.length === 0 && !mine.isLoading && (
              <div className="rounded-2xl border border-dashed border-amber-900/20 p-10 text-center text-stone-500" data-testid="my-profiles-empty">
                {user?.role === "talent"
                  ? <>Você ainda não finalizou seu perfil de talento. <Link to="/cadastrar" className="font-semibold text-[#C2410C] underline">Finalizar perfil</Link></>
                  : <>Faça login com Google e escolha o perfil de <strong>talento</strong> para começar a cadastrar atividades.</>}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Activities management */}
      {user && list.length > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-900/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <Plus className="size-5 text-stone-600" />
            <h2 className="font-heading text-lg font-bold">Gerenciar atividades</h2>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Adicione, edite ou remova as atividades de cada talento.
          </p>
          <div className="mt-4 space-y-2">
            {list.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-[#FAF5EE] px-4 py-3">
                <div className="flex items-center gap-3">
                  {t.photo ? <img src={t.photo} alt="" className="size-8 rounded-full object-cover" /> : <span className="size-8 rounded-full bg-white" />}
                  <div>
                    <p className="font-semibold text-stone-800 text-sm">{t.name}</p>
                    <p className="text-xs text-stone-500">{t.activities.length} atividade{t.activities.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditingActivities(t.id)} data-testid={`my-profile-activity-${t.id}`}>
                  <Plus className="size-4 mr-1" /> Gerenciar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Phone section */}
      {user && (
        <div className="mt-4 rounded-2xl border border-amber-900/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <Phone className="size-5 text-stone-600" />
            <h2 className="font-heading text-lg font-bold">Telefones de contato</h2>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Adicione um ou mais telefones. O primeiro será usado nas inscrições, mas você pode gerenciar todos aqui.
          </p>
          <PhonesManager initialPhones={user.phones ?? []} />
        </div>
      )}


      {/* Role selector */}
      {user && (
        <div className="mt-8 rounded-2xl border border-amber-900/10 bg-white p-5">
          <div className="flex items-center gap-2">
            <UserCog className="size-5 text-stone-600" />
            <h2 className="font-heading text-lg font-bold">Seu perfil na comunidade</h2>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Você pode participar como <strong>cliente</strong> (apenas visualizar atividades) ou como <strong>talento</strong> (cadastrar e gerenciar suas atividades).
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => changeRole.mutate("talent")}
              disabled={updatingRole || user.role === "talent"}
              className={cn(
                buttonVariants({ size: "sm" }),
                user.role === "talent"
                  ? "bg-[#16A34A] text-white cursor-default"
                  : "bg-[#16A34A] text-white hover:bg-[#15803D]"
              )}
              data-testid="role-select-talent"
            >
              {user.role === "talent" ? "Talento" : "Seja talento"}
            </button>
            <button
              type="button"
              onClick={() => changeRole.mutate("customer")}
              disabled={updatingRole || user.role === "customer"}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                user.role === "customer" && "border-stone-900 bg-stone-900 text-white"
              )}
              data-testid="role-select-customer"
            >
              {user.role === "customer" ? "Cliente" : "Seja cliente"}
            </button>
          </div>
        </div>
      )}


      {/* Activity dialog */}
      <Dialog open={!!editingActivities} onOpenChange={(o) => !o && setEditingActivities(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#FDFBF7] sm:max-w-2xl" data-testid="my-profile-activity-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Gerenciar atividades</DialogTitle>
            <DialogDescription>Adicione ou edite as atividades do seu talento.</DialogDescription>
          </DialogHeader>
          {editingActivities && (() => {
            const talent = list.find((t) => t.id === editingActivities);
            if (!talent) return null;
            return (
              <ActivityForm
                key={editingActivities}
                initialActivities={talent.activities}
                pending={activitiesPending}
                onSubmit={async (activities) => {
                  setActivitiesPending(true);
                  try {
                    await apiPut<Talent>(`/talents/${editingActivities}`, { ...toInput(talent), activities });
                    toast.success("Atividades salvas com sucesso!");
                    setEditingActivities(null);
                    refresh("");
                  } catch (err) {
                    toast.error(errorMessage(err));
                  } finally {
                    setActivitiesPending(false);
                  }
                }}
              />
            );
          })()}
        </DialogContent>
      </Dialog>

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

function PhonesManager({ initialPhones }: { initialPhones: string[] }) {
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  const [phones, setPhones] = useState<string[]>(initialPhones);

  const addPhone = async () => {
    const trimmed = newPhone.trim();
    if (!trimmed || trimmed.length < 10) {
      toast.error("Telefone deve ter pelo menos 10 dígitos.");
      return;
    }
    if (phones.includes(trimmed)) {
      toast.error("Este telefone já está cadastrado.");
      return;
    }
    setSaving(true);
    try {
      await apiPatch("/auth/me/phone", { action: "add", phone: trimmed });
      setPhones((prev) => [...prev, trimmed]);
      setNewPhone("");
      toast.success("Telefone adicionado!");
      void qc.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Não foi possível adicionar o telefone.");
    } finally {
      setSaving(false);
    }
  };

  const removePhone = async (phone: string) => {
    setSaving(true);
    try {
      await apiPatch("/auth/me/phone", { action: "remove", phone });
      setPhones((prev) => prev.filter((p) => p !== phone));
      toast.success("Telefone removido.");
      void qc.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err: any) {
      toast.error("Não foi possível remover o telefone.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mt-4 space-y-3">
      {phones.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Seus telefones</p>
          <div className="space-y-1">
            {phones.map((p, i) => (
              <div key={p} className="flex items-center gap-2 rounded-lg bg-[#FAF5EE] px-3 py-2">
                <Phone className="size-4 text-stone-400" />
                <span className="flex-1 text-sm text-stone-700">{p}</span>
                {i === 0 && <span className="text-[10px] font-medium text-[#16A34A]">principal</span>}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removePhone(p)}
                  disabled={saving}
                  className="size-6 text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="(XX) XXXXX-XXXX"
          className="flex-1"
        />
        <Button
          onClick={addPhone}
          disabled={saving || newPhone.trim().length < 10}
          className="bg-[#16A34A] text-white hover:bg-[#15803D]"
        >
          <Plus className="size-4 mr-1" />
          Adicionar
        </Button>
      </div>
      {phones.length === 0 && (
        <p className="text-xs text-stone-400 italic">Nenhum telefone cadastrado ainda.</p>
      )}
    </div>
  );
}
