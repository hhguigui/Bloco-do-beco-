import { useState } from "react";
import { Loader2, UserPlus, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiPost, apiPatch } from "@/lib/api";
import { toast } from "sonner";
import { useMe, signInWithGoogle } from "@/lib/auth";

interface Props {
  talentId: string;
  activityId: string;
  talentName: string;
  activityTitle: string;
}

export default function ParticipationForm({ talentId, activityId, talentName, activityTitle }: Props) {
  const me = useMe();
  const user = me.isError ? null : (me.data?.user ?? null);
  const [loading, setLoading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const handleRegister = async () => {
    if (!user) {
      signInWithGoogle(`/talento/${talentId}`);
      return;
    }

    const phones = user.phones || [];

    // If user has no phones, open modal to add one
    if (phones.length === 0) {
      setSelectedPhone("");
      setShowPhoneModal(true);
      return;
    }

    // If user has phones but none selected, default to first
    if (!selectedPhone && phones.length > 0) {
      setSelectedPhone(phones[0]);
    }

    await doRegister();
  };

  const doRegister = async () => {
    setLoading(true);
    try {
      // Send empty payload - backend will auto-fill from talent's MongoDB
      await apiPost(`/activities/${activityId}/register`, {});
      toast.success(`Você foi inscrito na atividade "${activityTitle}" de ${talentName}.`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Não foi possível inscrever.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhone = async () => {
    if (!selectedPhone || selectedPhone.trim().length < 10) {
      toast.error("Informe um telefone válido com pelo menos 10 dígitos.");
      return;
    }

    setSavingPhone(true);
    try {
      await apiPatch("/auth/me/phone", { action: "add", phone: selectedPhone.trim() });
      toast.success("Telefone adicionado com sucesso!");
      setShowPhoneModal(false);
      // Now register
      await doRegister();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Não foi possível salvar o telefone.";
      toast.error(msg);
    } finally {
      setSavingPhone(false);
    }
  };

  if (!user) {
    return (
      <div className="mt-4 rounded-xl border border-amber-900/10 bg-white p-4">
        <p className="font-semibold text-stone-800">Quero participar</p>
        <p className="mt-1 text-sm text-stone-500">Faça login para se inscrever nesta atividade.</p>
        <Button
          onClick={handleRegister}
          className="mt-3 w-full bg-[#16A34A] text-white hover:bg-[#15803D] sm:w-auto"
        >
          <UserPlus className="size-4 mr-2" />
          Entrar para participar
        </Button>
      </div>
    );
  }

  const phones = user.phones || [];

  return (
    <>
      <div className="mt-4 rounded-xl border border-amber-900/10 bg-white p-4">
        <div className="flex items-center gap-3">
          {user.picture && (
            <img src={user.picture} alt="" className="size-8 rounded-full" />
          )}
          <div>
            <p className="font-semibold text-stone-800">{user.name}</p>
            <p className="text-xs text-stone-500">{user.email}</p>
            {phones.length > 0 && (
              <p className="text-xs text-stone-400">
                <Phone className="size-3 inline mr-1" />
                {phones.join(" | ")}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleRegister}
          disabled={loading}
          className="mt-3 w-full bg-[#16A34A] text-white hover:bg-[#15803D] sm:w-auto"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          Inscrever-se nesta atividade
        </Button>
        {phones.length === 0 && (
          <p className="mt-2 text-xs text-amber-600">
            ⚠️ Você precisa adicionar um telefone em "Meu perfil" para participar.
          </p>
        )}
      </div>

      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="bg-[#FDFBF7]">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Adicionar telefone</DialogTitle>
            <DialogDescription>
              Adicione seu telefone para participar desta atividade.
              <br />
              <span className="text-xs text-stone-500">O talento usará para entrar em contato.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone-input">Telefone *</Label>
              <Input
                id="phone-input"
                value={selectedPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
                placeholder="(XX) XXXXX-XXXX"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddPhone}
              disabled={savingPhone || selectedPhone.length < 10}
              className="bg-[#16A34A] text-white hover:bg-[#15803D]"
            >
              {savingPhone ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
              Inscrever-se
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
