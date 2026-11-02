import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Eye, EyeOff, Loader2, LogOut, Pencil, Search, Trash2, X, Flag, Stethoscope, UserCog, Users } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminDashboard from "@/components/AdminDashboard";
import CategoryBadge from "@/components/CategoryBadge";
import StatusBadge from "@/components/StatusBadge";
import TalentForm from "@/components/TalentForm";
import ReportPanel from "@/components/ReportPanel";
import ObservationPanel from "@/components/ObservationPanel";
import ParticipantsList from "@/components/ParticipantsList";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, errorMessage } from "@/lib/api";
import { ME_KEY, useMe } from "@/lib/auth";
import { AGE_LABELS, CATEGORY_LABELS, EXPERIENCE_LABELS, formatDate, GENDER_LABELS, STATUS_META, toInput } from "@/lib/catalog";
import { endSession } from "@/lib/session";
import type { Me, StatusUpdate, Talent, TalentInput, TalentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function exportCsv(list: Talent[]) {
  const header = ["nome", "status", "categoria", "especialidade", "genero", "faixa_etaria", "tempo_atuacao", "endereco", "lat", "lng", "telefone", "instagram", "email_cadastro", "atividades"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = list.map((t) =>
    [
      t.name,
      STATUS_META[t.status].label,
      CATEGORY_LABELS[t.category],
      t.specialty,
      t.gender ? GENDER_LABELS[t.gender] : "",
      t.age_range ? AGE_LABELS[t.age_range] : "",
      t.experience ? EXPERIENCE_LABELS[t.experience] : "",
      t.address,
      t.lat,
      t.lng,
      t.phone,
      t.instagram,
      t.owner_email,
      t.activities.map((a) => a.title).join("; "),
    ]
      .map(esc)
      .join(","),
  );
  const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "talentos-bloco-do-beco.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const qc = useQueryClient();
  const me = useMe();
  const authed = !me.isError && !!me.data?.is_admin;

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<TalentStatus | "">("");
  const [editing, setEditing] = useState<Talent | null>(null);
  const [deleting, setDeleting] = useState<Talent | null>(null);
  const [reportPanel, setReportPanel] = useState<string | null>(null);
  const [obsPanel, setObsPanel] = useState<string | null>(null);
  const [participantsPanel, setParticipantsPanel] = useState<string | null>(null);
  const [tab, setTab] = useState("approvals");

  // Fetch reports and observations counts for all talents
  const reportsQ = useQuery({ 
    queryKey: ["admin-talent-reports-count"], 
    queryFn: async () => {
      const allTalents = await apiGet<Talent[]>("/admin/talents");
      const results: Record<string, number> = {};
      for (const t of allTalents) {
        try {
          const reports = await apiGet<any[]>(`/admin/talents/${t.id}/reports`);
          results[t.id] = reports.length;
        } catch {
          results[t.id] = 0;
        }
      }
      return results;
    }, 
    enabled: authed 
  });
  
  const obsQ = useQuery({ 
    queryKey: ["admin-talent-obs-count"], 
    queryFn: async () => {
      const allTalents = await apiGet<Talent[]>("/admin/talents");
      const results: Record<string, number> = {};
      for (const t of allTalents) {
        try {
          const obs = await apiGet<any[]>(`/admin/talents/${t.id}/observations`);
          results[t.id] = obs.length;
        } catch {
          results[t.id] = 0;
        }
      }
      return results;
    }, 
    enabled: authed 
  });
  
  const reportCounts = reportsQ.isError ? {} : (reportsQ.data ?? {});
  const obsCounts = obsQ.isError ? {} : (obsQ.data ?? {});

  const allQ = useQuery({ queryKey: ["admin-talents", "all"], queryFn: () => apiGet<Talent[]>("/admin/talents"), enabled: authed });
  const all = allQ.isError ? [] : (allQ.data ?? []);
  const pending = all.filter((t) => t.status === "pending");
  const term = q.trim().toLowerCase();
  const list = all
    .filter((t) => !statusFilter || t.status === statusFilter)
    .filter((t) => !term || `${t.name} ${t.specialty} ${t.address} ${t.owner_email}`.toLowerCase().includes(term));

  const refresh = (id?: string) => {
    for (const key of ["admin-talents", "talents", "activities", "summary", "my-talents"]) void qc.invalidateQueries({ queryKey: [key] });
    if (id) void qc.invalidateQueries({ queryKey: ["talent", id] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TalentStatus }) => apiPatch<Talent>(`/talents/${id}/status`, { status } satisfies StatusUpdate),
    onSuccess: (t) => {
      refresh(t.id);
      toast.success(t.status === "approved" ? `${t.name} aprovado e publicado.` : t.status === "rejected" ? `${t.name} recusado.` : "Status atualizado.");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
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
  
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => apiGet<any[]>("/admin/users"), enabled: authed });
  
  const changeRole = useMutation({
    mutationFn: ({ user_id, role }: { user_id: string; role: string }) => apiPatch<Me>(`/auth/admin/users/${user_id}/role`, { role }),
    onSuccess: () => {
      toast.success("Role alterada.");
      users.refetch();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const navigate = useNavigate();
  
  if (me.isLoading) return <div className="mx-auto mt-20 h-64 max-w-md animate-pulse rounded-3xl bg-[#FAF5EE]" />;
  if (!authed) {
    return <Navigate to="/admin/login" replace state={{ from: "/admin" }} />;
  }

  const actionButtons = (t: Talent) => (
    <>
      <Button size="sm" variant="outline" onClick={() => setReportPanel(t.id)} data-testid={`admin-reports-button-${t.id}`}>
        <Flag className="size-4 mr-1.5" /> Denúncias
        {reportCounts[t.id] > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white min-w-[18px] h-[18px] px-1">
            {reportCounts[t.id]}
          </span>
        )}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setObsPanel(t.id)} data-testid={`admin-obs-button-${t.id}`}>
        <Stethoscope className="size-4 mr-1.5" /> Observações
        {obsCounts[t.id] > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-600 text-[11px] font-bold text-white min-w-[18px] h-[18px] px-1">
            {obsCounts[t.id]}
          </span>
        )}
      </Button>
      {t.status !== "approved" && (
        <Button size="sm" onClick={() => setStatus.mutate({ id: t.id, status: "approved" })} disabled={setStatus.isPending} className="bg-[#16A34A] text-white hover:bg-[#15803D]" data-testid={`admin-approve-button-${t.id}`}>
          <Check className="size-4" /> Aprovar
        </Button>
      )}
      {t.status !== "rejected" && (
        <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: t.id, status: "rejected" })} disabled={setStatus.isPending} data-testid={`admin-reject-button-${t.id}`}>
          <X className="size-4" /> {t.status === "approved" ? "Despublicar" : "Recusar"}
        </Button>
      )}
    </>
  );

  const editActionButtons = (t: Talent) => (
    <>
      <Button size="sm" variant="outline" onClick={() => setReportPanel(t.id)} data-testid={`admin-reports-button-${t.id}`}>
        <Flag className="size-4 mr-1.5" /> Denúncias
        {reportCounts[t.id] > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white min-w-[18px] h-[18px] px-1">
            {reportCounts[t.id]}
          </span>
        )}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setObsPanel(t.id)} data-testid={`admin-obs-button-${t.id}`}>
        <Stethoscope className="size-4 mr-1.5" /> Observações
        {obsCounts[t.id] > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-amber-600 text-[11px] font-bold text-white min-w-[18px] h-[18px] px-1">
            {obsCounts[t.id]}
          </span>
        )}
      </Button>
    </>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8" data-testid="admin-panel">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#C2410C]">Administração</p>
          <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight">Painel do Bloco do Beco</h1>
          <p className="mt-1 text-stone-600" data-testid="admin-total-count">{all.length} perfis · {pending.length} aguardando aprovação</p>
        </div>
        
        <Button variant="ghost" size="sm" onClick={() => void endSession("/")} className="text-red-600 hover:text-red-700 hover:bg-red-50" data-testid="admin-logout-button">
            <LogOut className="size-4 mr-1.5" />
            <span>Sair</span>
          </Button>
      </div>

      <div className="mt-8">
        <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="">
          <TabsList className="bg-[#F4EFE7]">
          <TabsTrigger value="approvals" data-testid="admin-tab-approvals">
            Aprovações {pending.length > 0 && <span className="ml-1.5 rounded-full bg-[#E65100] px-1.5 text-[11px] text-white">{pending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="talents" data-testid="admin-tab-talents">Talentos</TabsTrigger>
          <TabsTrigger value="dashboard" data-testid="admin-tab-dashboard">Painel de dados</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="mt-6 space-y-4" data-testid="admin-approvals">
          {pending.length === 0 && (
            <div className="rounded-2xl border border-dashed border-amber-900/20 p-10 text-center text-stone-500" data-testid="admin-approvals-empty">Nenhum perfil aguardando aprovação. 🎉</div>
          )}
          {pending.map((t) => (
            <article key={t.id} className="grid gap-5 rounded-2xl border border-amber-900/10 bg-white p-5 md:grid-cols-[96px_1fr_auto]" data-testid={`admin-pending-${t.id}`}>
              {t.photo ? <img src={t.photo} alt="" className="size-24 rounded-xl object-cover" /> : <span className="size-24 rounded-xl bg-[#FAF5EE]" />}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-heading text-lg font-bold">{t.name}</h3>
                  <CategoryBadge category={t.category} />
                </div>
                <p className="text-sm text-stone-600">{t.specialty} · {t.address} · {t.age_range ? AGE_LABELS[t.age_range] : ""} · {t.experience ? EXPERIENCE_LABELS[t.experience] : ""}</p>
                {t.bio && <p className="line-clamp-2 text-sm text-stone-700">{t.bio}</p>}
                <p className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
                  Enviado por {t.owner_email || "—"} · {formatDate(t.created_at.slice(0, 10), "dd/MM/yyyy")} · {t.activities.length} atividades
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-2 md:flex-col">
                <Link to={`/talento/${t.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })} data-testid={`admin-view-button-${t.id}`}><Eye className="size-4" /> Ver perfil</Link>
                {actionButtons(t)}
              </div>
            </article>
          ))}
        </TabsContent>

        <TabsContent value="talents" className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, endereço ou e-mail" className="bg-white pl-10" data-testid="admin-search-input" />
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-amber-900/10 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Talento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="hidden lg:table-cell">Cadastrado por</TableHead>
                  <TableHead>Avisos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t) => (
                  <TableRow key={t.id} data-testid={`admin-row-${t.id}`}>
                    <TableCell>
                      <Link to={`/talento/${t.id}`} className="flex items-center gap-3 font-semibold hover:underline">
                        {t.photo ? <img src={t.photo} alt="" className="size-9 rounded-lg object-cover" /> : <span className="size-9 rounded-lg bg-[#FAF5EE]" />}
                        {t.name}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="hidden md:table-cell"><CategoryBadge category={t.category} /></TableCell>
                    <TableCell className="hidden max-w-56 truncate text-stone-600 lg:table-cell">{t.owner_email || "Equipe / exemplo"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        {reportCounts[t.id] > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700" title={`${reportCounts[t.id]} denúncia(s)`}>
                            <Flag className="size-3" /> {reportCounts[t.id]}
                          </span>
                        )}
                        {obsCounts[t.id] > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700" title={`${obsCounts[t.id]} observação(ões)`}>
                            <Stethoscope className="size-3" /> {obsCounts[t.id]}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {t.status === "pending" && (
                        <Button variant="ghost" size="icon-sm" aria-label="Aprovar" onClick={() => setStatus.mutate({ id: t.id, status: "approved" })} className="text-green-700" data-testid={`admin-row-approve-${t.id}`}><Check className="size-4" /></Button>
                      )}
                      {t.status !== "approved" && (
                        <Button variant="ghost" size="icon-sm" aria-label="Publicar" onClick={() => setStatus.mutate({ id: t.id, status: "approved" })} title="Publicar" className="text-[#16A34A]" data-testid={`admin-row-publish-${t.id}`}><Eye className="size-4" /></Button>
                      )}
                      {t.status === "approved" && (
                        <Button variant="ghost" size="icon-sm" aria-label="Despublicar" onClick={() => setStatus.mutate({ id: t.id, status: "rejected" })} title="Despublicar" className="text-stone-500 hover:text-red-600" data-testid={`admin-row-unpublish-${t.id}`}><EyeOff className="size-4" /></Button>
                      )}
                      <Button variant="ghost" size="icon-sm" aria-label="Denúncias" onClick={() => setReportPanel(t.id)} title="Ver denúncias" data-testid={`admin-row-reports-${t.id}`}>
                        <Flag className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Observações" onClick={() => setObsPanel(t.id)} title="Ver observações" data-testid={`admin-row-obs-${t.id}`}>
                        <Stethoscope className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEditing(t)} data-testid={`admin-edit-button-${t.id}`}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Excluir" onClick={() => setDeleting(t)} data-testid={`admin-delete-button-${t.id}`} className="text-red-600 hover:text-red-700"><Trash2 className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-stone-500">Nenhum perfil encontrado.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <AdminDashboard pendingCount={pending.length} />
        </TabsContent>

        <TabsContent value="users" className="mt-6" data-testid="admin-tab-users-content">
          <h2 className="font-heading text-2xl font-bold">Gestão de Usuários</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-amber-900/10 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users.data ?? []).map((u: any) => (
                  <TableRow key={u.user_id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => changeRole.mutate({ user_id: u.user_id, role: u.role === "talent" ? "customer" : "talent" })} disabled={changeRole.isPending}>
                        {u.role === "talent" ? "Tornar cliente" : "Tornar talento"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      <ReportPanel talentId={reportPanel ?? ""} isOpen={!!reportPanel} onOpenChange={() => setReportPanel(null)} />
      <ObservationPanel talentId={obsPanel ?? ""} isOpen={!!obsPanel} onOpenChange={() => setObsPanel(null)} />
      {participantsPanel && (
        <Dialog open={!!participantsPanel} onOpenChange={(o) => !o && setParticipantsPanel(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#FDFBF7] sm:max-w-3xl" data-testid="admin-participants-dialog">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Participantes</DialogTitle>
              <DialogDescription>Lista de inscritos nas atividades deste talento.</DialogDescription>
            </DialogHeader>
            <ParticipantsList
              talentId={participantsPanel}
              activities={(() => {
                const talent = list.find(t => t.id === participantsPanel);
                return talent?.activities ?? [];
              })()}
              apiPath={`/admin/talents/${participantsPanel}/participants`}
            />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#FDFBF7] sm:max-w-3xl" data-testid="admin-edit-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Editar {editing?.name}</DialogTitle>
            <DialogDescription>As alterações aparecem imediatamente no site.</DialogDescription>
          </DialogHeader>
          {editing && (
            <>
              <div className="flex flex-wrap items-center gap-2">{editActionButtons(editing)}</div>
              <TalentForm key={editing.id} initial={toInput(editing)} submitLabel="Salvar alterações" pending={update.isPending} onSubmit={(values) => update.mutate({ id: editing.id, values })} />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent data-testid="admin-delete-dialog">
          <DialogHeader>
            <DialogTitle>Excluir perfil?</DialogTitle>
            <DialogDescription>O perfil de <strong>{deleting?.name}</strong> e suas atividades serão removidos permanentemente.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} data-testid="admin-delete-cancel-button">Cancelar</Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)} data-testid="admin-delete-confirm-button">
              {remove.isPending && <Loader2 className="size-4 animate-spin" />} Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
