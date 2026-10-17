import { useRef, useState } from "react";
import { Camera, Loader2, MapPin, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

interface Props {
  initial?: TalentInput;
  prefill?: Partial<Pick<TalentInput, "name" | "photo">>; // e.g. Google account name/picture for new profiles
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: TalentInput) => void;
}

export default function TalentForm({ initial, prefill, submitLabel, pending, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(initial ?? { ...EMPTY, ...prefill });
  const fileRef = useRef<HTMLInputElement>(null);
  const bioAi = useAiStream<BioRequest>("/ai/bio");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const setActivity = (id: string, patch: Partial<Activity>) =>
    setForm((f) => ({ ...f, activities: f.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  const addActivity = () =>
    setForm((f) => ({
      ...f,
      activities: [
        ...f.activities,
        { id: crypto.randomUUID(), title: "", type: "oficina", description: "", date: null, schedule: "", price: "Gratuito" },
      ],
    }));

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

      {/* 04 — atividades */}
      <section className="space-y-5">
        <SectionTitle n="04" title="Atividades oferecidas ao bairro" hint="Oficinas, aulas, serviços ou apresentações — é assim que os moradores encontram você." />
        <div className="space-y-4">
          {form.activities.map((a, i) => (
            <div key={a.id} className="space-y-3 rounded-2xl border border-amber-900/10 bg-[#FAF5EE] p-4" data-testid={`activity-row-${i}`}>
              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
                <Input placeholder="Título da atividade" value={a.title} onChange={(e) => setActivity(a.id, { title: e.target.value })} data-testid={`activity-title-input-${i}`} className="bg-white" />
                <FieldSelect
                  id={`activity-type-${i}`}
                  value={a.type}
                  onChange={(v) => setActivity(a.id, { type: v as ActivityType })}
                  options={ACTIVITY_LABELS}
                  testId={`activity-type-select-${i}`}
                  className=""
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover atividade"
                  onClick={() => setForm((f) => ({ ...f, activities: f.activities.filter((x) => x.id !== a.id) }))}
                  data-testid={`activity-remove-button-${i}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Input
                    type="date"
                    aria-label="Data (opcional)"
                    value={a.date ?? ""}
                    onChange={(e) => setActivity(a.id, { date: e.target.value || null })}
                    data-testid={`activity-date-input-${i}`}
                    className="bg-white"
                  />
                  <p className="mt-1 text-[11px] text-stone-500">Data do evento (vazio = recorrente)</p>
                </div>
                <Input placeholder="Dias e horários (ex.: Sábados, 10h)" value={a.schedule} onChange={(e) => setActivity(a.id, { schedule: e.target.value })} data-testid={`activity-schedule-input-${i}`} className="bg-white" />
                <Input placeholder="Valor (ex.: Gratuito, R$ 20)" value={a.price} onChange={(e) => setActivity(a.id, { price: e.target.value })} data-testid={`activity-price-input-${i}`} className="bg-white" />
              </div>
              <Textarea rows={2} placeholder="Descrição curta" value={a.description} onChange={(e) => setActivity(a.id, { description: e.target.value })} data-testid={`activity-description-input-${i}`} className="bg-white" />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addActivity} data-testid="add-activity-button" className="border-dashed">
            <Plus className="size-4" /> Adicionar atividade
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
