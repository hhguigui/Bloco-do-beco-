import { useState, useEffect } from "react";
import { Loader2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiGet } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/catalog";
import type { Report } from "@/lib/types";

interface Props {
  talentId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReportPanel({ talentId, isOpen, onOpenChange }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet<Report[]>(`/admin/talents/${talentId}/reports`);
      setReports(data);
    } catch {
      toast.error("Não foi possível carregar as denúncias.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-5 text-red-600" /> Denúncias do talento
          </DialogTitle>
          <DialogDescription>Visível apenas para administradores.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {loading ? (
            <p>Carregando...</p>
          ) : reports.length === 0 ? (
            <p className="text-stone-500">Nenhuma denúncia registrada.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="rounded-lg border border-red-200 bg-white p-3 text-sm">
                <div className="flex justify-between text-xs text-stone-500">
                  <span>{r.reporter_email || "Anônimo"}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
                <p className="mt-1 text-stone-800">{r.message}</p>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}