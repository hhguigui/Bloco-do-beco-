import { useRef, useState } from "react";
import { Camera, Loader2, MapPin, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FieldSelect from "./FieldSelect";
import LocationPicker from "./LocationPicker";
import {
  ACTIVITY_LABELS,
  AGE_LABELS,
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  GENDER_LABELS,
  initials,
} from "@/lib/catalog";
import { useAiStream } from "@/lib/useAiStream";
import type { Activity, ActivityType, AgeRange, BioRequest, Category, Experience, Gender, TalentInput } from "@/lib/types";

type FormState = Omit<TalentInput, "category" | "age_range" | "experience"> & {
  category: Category | "";
  age_range: AgeRange | "";
  experience: Experience | "";
};

const EMPTY: FormState = {
  name: "",
  category: "",
  specialty: "",
  bio: "",
  gender: "nao_informado",
  age_range: "",
  experience: "",
  address: "",
  lat: null,
  lng: null,
  phone: "",
  instagram: "",
  photo: "",
  activities: [],
};

function resizeImage(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function SectionTitle({ n, title, hint }: { n: string; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-amber-900/10 pb-3">
      <span className="font-mono text-xs text-[#C2410C]">{n}</span>
      <div>
        <h3 className="font-heading text-lg font-bold text-stone-900">{title}</h3>
        {hint && <p className="text-sm text-stone-500">{hint}</p>}
      </div>
    </div>
  );
}

function ActivityForm({ initial, onSave, onCancel }: { 
  initial?: Activity; 
  onSave: (data: Omit<Activity, "id">) => void; 
  onCancel: () => void; 
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [type, setType] = useState<ActivityType>(initial?.type || "oficina");
  const [description, setDescription] = useState(initial?.description || "");
  const [date, setDate] = useState(initial?.date || "");
  const [schedule, setSchedule] = useState(initial?.schedule || "");
  const [price, setPrice] = useState(initial?.price || "Gratuito");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), type, description: description.trim(), date: date || null, schedule: schedule.trim(), price: price.trim() || "Gratuito" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="activity-title">Título *</Label>
        <Input id="activity-title" placeholder="Ex.: Oficina de violão" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white" autoFocus />
      </div>
      <div className="space-y-2">
        <Label htmlFor="activity-type">Tipo *</Label>
        <FieldSelect id="activity-type" value={type} onChange={(v) => setType(v as ActivityType)} options={ACTIVITY_LABELS} testId="activity-type-select" className="" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="activity-description">Descrição</Label>
        <Textarea id="activity-description" rows={3} placeholder="Descrição curta da atividade" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="activity-date">Data (opcional)</Label>
          <Input id="activity-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white" />
          <p className="text-[11px] text-stone-500">Vazio = recorrente</p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="activity-schedule">Dias e horários</Label>
          <Input id="activity-schedule" placeholder="Ex.: Sábados, 10h" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="bg-white" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="activity-price">Valor</Label>
        <Input id="activity-price" placeholder="Ex.: Gratuito, R$ 20" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-white" />
      </div>
      <div className="flex gap-2 pt-2 border-t border-amber-900/10">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1 bg-[#E65100] hover:bg-[#C2410C]">Salvar</Button>
      </div>
    </form>
  );
}

interface Props {
  initial?: TalentInput;
  prefill?: Partial<Pick<TalentInput, "name" | "photo">>; // e.g. Google account name/picture for new profiles
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: TalentInput) => void;
  activitiesOnly?: boolean; // only show activities section (for existing talent editing)
}

export default function TalentForm({ initial, prefill, submitLabel, pending, onSubmit, activitiesOnly }: Props) {
  const [form, setForm] = useState<FormState>(initial ?? { ...EMPTY, ...prefill });
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bioAi = useAiStream<BioRequest>("/ai/bio");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setActivity = (id: string, patch: Partial<Activity>) =>
    setForm((f) => ({ ...f, activities: f.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  const openAddActivity = () => {
    setEditingActivityId(null);
    setActivityDialogOpen(true);
  };

  const openEditActivity = (id: string) => {
    setEditingActivityId(id);
    setActivityDialogOpen(true);
  };

  const closeActivityDialog = () => {
    setActivityDialogOpen(false);
    setEditingActivityId(null);
  };

  const saveActivity = (data: Omit<Activity, "id">) => {
    if (editingActivityId) {
      setActivity(editingActivityId, data);
    } else {
      const newActivity: Activity = {
        id: crypto.randomUUID(),
        ...data,
      };
      setForm((f) => ({ ...f, activities: [...f.activities, newActivity] }));
    }
    closeActivityDialog();
  };

  const removeActivity = (id: string) =>
    setForm((f) => ({ ...f, activities: f.activities.filter((x) => x.id !== id) }));

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Envie um arquivo de imagem.");
    try {
      set("photo", await resizeImage(file));
    } catch {
      toast.error("Não foi possível ler a imagem.");
    }
  };

  const generateBio = async () => {
    const notes = form.bio.trim() || form.specialty.trim();
    if (notes.length < 3) {
      toast.info("Escreva algumas palavras sobre o artista no campo de biografia para a IA desenvolver.");
      return;
    }
    set("bio", "");
    await bioAi.run(
      { name: form.name, category: form.category, specialty: form.specialty, notes },
      (chunk) => setForm((f) => ({ ...f, bio: f.bio + chunk })),
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (form.name.trim().length < 2) missing.push("nome");
    if (!form.category) missing.push("categoria");
    if (!form.age_range) missing.push("faixa etária");
    if (!form.experience) missing.push("tempo de atuação");
    if (form.address.trim().length < 3) missing.push("endereço");
    if (missing.length) {
      toast.error(`Preencha: ${missing.join(", ")}.`);
      return;
    }
    const activities = form.activities.filter((a) => a.title.trim());
    if (activities.some((a) => a.title.trim().length < 2)) {
      toast.error("O título de cada atividade precisa de pelo menos 2 letras.");
      return;
    }
    onSubmit({
      ...form,
      category: form.category as Category,
      age_range: form.age_range as AgeRange,
      experience: form.experience as Experience,
      name: form.name.trim(),
      address: form.address.trim(),
      activities: activities.map((a) => ({ ...a, title: a.title.trim() })),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-10" data-testid="talent-form">
      {!activitiesOnly && (
        <>
          {/* 01 — identidade */}
          <section className="space-y-5">
        <SectionTitle n="01" title="Quem é o talento" hint="Nome artístico, área de atuação e uma foto." />
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              data-testid="photo-upload-button"
              className="group relative grid size-36 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-amber-900/20 bg-[#FAF5EE] transition-colors hover:border-[#E65100]"
            >
              {form.photo ? (
                <img src={form.photo} alt="Foto do perfil" className="h-full w-full object-cover" data-testid="photo-preview" />
              ) : form.name ? (
                <span className="font-heading text-4xl font-extrabold text-amber-900/40">{initials(form.name)}</span>
              ) : (
                <Camera className="size-8 text-amber-900/40" />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {form.photo ? "Trocar foto" : "Enviar foto"}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              data-testid="photo-file-input"
              onChange={(e) => void handlePhoto(e.target.files?.[0])}
            />
            {form.photo && (
              <button type="button" onClick={() => set("photo", "")} className="mt-2 text-xs text-stone-500 underline" data-testid="photo-remove-button">
                Remover foto
              </button>
            )}
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome ou nome artístico *</Label>
              <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="form-name-input" className="bg-white" />
            </div>
            <FieldSelect
              id="category"
              label="Categoria *"
              value={form.category}
              onChange={(v) => set("category", v as Category)}
              options={CATEGORY_LABELS}
              testId="form-category-select"
            />
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <Input
                id="specialty"
                placeholder="Ex.: violão, crochê, grafite…"
                value={form.specialty}
                onChange={(e) => set("specialty", e.target.value)}
                data-testid="form-specialty-input"
                className="bg-white"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="bio">Biografia</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void generateBio()}
              disabled={bioAi.isPending}
              data-testid="ai-generate-bio-button"
              className="border-[#E65100]/40 text-[#C2410C] hover:bg-[#FFEDD5]"
            >
              {bioAi.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {form.bio.trim() ? "Melhorar com IA" : "Gerar com IA"}
            </Button>
          </div>
          <Textarea
            id="bio"
            rows={5}
            placeholder="Conte em poucas palavras sua história, o que faz e há quanto tempo. A IA pode transformar suas anotações em uma biografia."
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            data-testid="form-bio-input"
            className="bg-white"
          />
        </div>
      </section>

      {/* 02 — perfil */}
      <section className="space-y-5">
        <SectionTitle n="02" title="Perfil" hint="Usado apenas de forma agregada no Painel de Dados." />
        <div className="grid gap-4 sm:grid-cols-3">
          <FieldSelect id="gender" label="Gênero" value={form.gender} onChange={(v) => set("gender", v as Gender)} options={GENDER_LABELS} testId="form-gender-select" />
          <FieldSelect id="age" label="Faixa etária *" value={form.age_range} onChange={(v) => set("age_range", v as AgeRange)} options={AGE_LABELS} testId="form-age-select" />
          <FieldSelect
            id="experience"
            label="Tempo de atuação *"
            value={form.experience}
            onChange={(v) => set("experience", v as Experience)}
            options={EXPERIENCE_LABELS}
            testId="form-experience-select"
          />
        </div>
      </section>

      {/* 03 — localização e contato */}
      <section className="space-y-5">
        <SectionTitle n="03" title="Onde encontrar" hint="Endereço no Jardim Ibirapuera e formas de contato." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Endereço (rua e número) *</Label>
            <Input
              id="address"
              placeholder="Ex.: Rua Teresa Carreño, 45"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value, lat: null, lng: null }))}
              data-testid="form-address-input"
              className="bg-white"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <p className="flex items-center gap-1.5 text-sm text-stone-600">
              <MapPin className="size-4 text-[#E65100]" />
              {form.lat !== null
                ? "Local marcado no mapa. Clique em outro ponto para ajustar."
                : "Opcional: clique no mapa para marcar o local exato. Se não marcar, localizamos pelo endereço."}
            </p>
            <LocationPicker lat={form.lat} lng={form.lng} onPick={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp</Label>
            <Input id="phone" placeholder="11 98888-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} data-testid="form-phone-input" className="bg-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" placeholder="@seuperfil" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} data-testid="form-instagram-input" className="bg-white" />
          </div>
        </div>
      </section>
        </>
      )}
      
      <Dialog open={activityDialogOpen} onOpenChange={closeActivityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingActivityId ? "Editar atividade" : "Nova atividade"}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da oficina, aula, serviço ou evento.
            </DialogDescription>
          </DialogHeader>
          <ActivityForm
            initial={editingActivityId ? form.activities.find(a => a.id === editingActivityId) : undefined}
            onSave={saveActivity}
            onCancel={closeActivityDialog}
          />
        </DialogContent>
      </Dialog>

      {/* 04 — atividades */}
      <section className="space-y-5">
        <SectionTitle n="04" title="Atividades oferecidas ao bairro" hint="Oficinas, aulas, serviços ou apresentações — é assim que os moradores encontram você." />
        <div className="space-y-3">
          {form.activities.map((a, i) => (
            <div key={a.id} className="rounded-xl border border-amber-900/10 bg-white p-4 hover:border-amber-900/30 transition-colors cursor-pointer" 
                 onClick={() => openEditActivity(a.id)}
                 data-testid={`activity-card-${i}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-base font-bold truncate">{a.title || "Sem título"}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-stone-600">
                    <span className="px-2 py-0.5 rounded-full bg-amber-900/10 text-amber-900 text-xs font-medium">
                      {ACTIVITY_LABELS[a.type as keyof typeof ACTIVITY_LABELS] || a.type}
                    </span>
                    {a.schedule && (
                      <span className="flex items-center gap-1">
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        {a.schedule}
                      </span>
                    )}
                    {a.date && (
                      <span className="flex items-center gap-1">
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {a.date}
                      </span>
                    )}
                    <span className="font-medium text-stone-900">{a.price}</span>
                  </div>
                  {a.description && <p className="mt-2 text-sm text-stone-500 line-clamp-2">{a.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditActivity(a.id); }} aria-label="Editar">
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={(e) => { e.stopPropagation(); removeActivity(a.id); }} aria-label="Excluir">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {form.activities.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-amber-900/20 p-8 text-center">
              <p className="text-stone-500">Nenhuma atividade cadastrada ainda.</p>
            </div>
          )}
          <Button 
            type="button" 
            variant="outline" 
            onClick={openAddActivity} 
            data-testid="add-activity-button" 
            className="w-full border-dashed py-4"
          >
            <Plus className="size-4 mr-2" /> Adicionar atividade
          </Button>
        </div>
      </section>

      <div className="flex justify-end border-t border-amber-900/10 pt-6">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          data-testid="talent-form-submit-button"
          className="bg-[#E65100] px-8 text-white transition-colors hover:bg-[#C2410C]"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
