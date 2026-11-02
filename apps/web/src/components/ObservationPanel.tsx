import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/catalog";
import type { Observation } from "@/lib/types";

interface Props {
  talentId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ObservationPanel({ talentId, isOpen, onOpenChange }: Props) {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Load observations when dialog opens
  const load = useCallback(async () => {
    if (!talentId) return;
    setLoading(true);
    try {
      const data = await apiGet<Observation[]>(`/admin/talents/${talentId}/observations`);
      setObservations(data);
    } catch {
      toast.error("Não foi possível carregar as observações.");
    } finally {
      setLoading(false);
    }
  }, [talentId]);

  // Reload when dialog opens
  useEffect(() => {
    if (isOpen && talentId) {
      load();
    }
  }, [isOpen, talentId, load]);

  const add = async () => {
    if (!newNote.trim()) return toast.error("Escreva uma observação.");
    if (!talentId) return toast.error("ID do talento não encontrado.");
    setSaving(true);
    try {
      const obs = await apiPost<Observation>(`/admin/talents/${talentId}/observations`, { note: newNote.trim() });
      setObservations((prev) => [obs, ...prev]);
      setNewNote("");
      toast.success("Observação adicionada.");
    } catch (err: any) {
      console.error("Observation error:", err);
      const msg = err?.response?.data?.detail || err?.message || errorMessage(err);
      toast.error(msg || "Não foi possível salvar a observação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="size-5 text-amber-700" /> Observações do talento
          </DialogTitle>
          <DialogDescription>Visível apenas para administradores.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Adicionar observação..." rows={2} />
            <Button onClick={add} disabled={saving} className="self-end">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p>Carregando...</p>
            ) : observations.length === 0 ? (
              <p className="text-stone-500">Nenhuma observação registrada.</p>
            ) : (
              observations.map((o) => (
                <div key={o.id} className="rounded-lg border border-amber-900/10 bg-white p-3 text-sm">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>{o.author_email}</span>
                    <span>{formatDate(o.created_at)}</span>
                  </div>
                  <p className="mt-1 text-stone-800">{o.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}