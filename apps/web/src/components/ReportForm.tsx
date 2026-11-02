import { useState } from "react";
import { Loader2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  talentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReportForm({ talentId, open, onOpenChange }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (message.trim().length < 3) return toast.error("Descreva o motivo da denúncia.");
    setLoading(true);
    try {
      await apiPost(`/talents/${talentId}/reports`, { message: message.trim() });
      toast.success("Denúncia registrada com sigilo.");
      setMessage("");
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Não foi possível registrar a denúncia.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-5 text-red-600" /> Denunciar talento
          </DialogTitle>
          <DialogDescription>Sua identidade não será compartilhada com o talento. Apenas administradores terão acesso à denúncia.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="report-message">Motivo da denúncia</Label>
          <Textarea
            id="report-message"
            rows={4}
            placeholder="Descreva o motivo..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Enviar denúncia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}