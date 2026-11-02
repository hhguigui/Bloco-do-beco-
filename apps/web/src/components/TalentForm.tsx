import { useRef, useState } from "react";
import { Camera, Loader2, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FieldSelect from "./FieldSelect";
import LocationPicker from "./LocationPicker";
import {
  AGE_LABELS,
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  GENDER_LABELS,
  initials,
} from "@/lib/catalog";
import { useAiStream } from "@/lib/useAiStream";
import type { AgeRange, BioRequest, Category, Experience, Gender, TalentInput } from "@/lib/types";
import { lookupCep, geocodeAddress } from "@/lib/cep";
import { apiPost } from "@/lib/api";

type FormState = Omit<TalentInput, "category" | "experience" | "birth_date"> & {
  category: Category | "";
  birth_date?: string;
  experience: Experience | "";
  logradouro?: string;
};

const EMPTY: FormState = {
  name: "",
  category: "",
  specialty: "",
  bio: "",
  gender: "nao_informado",
  experience: "",
  address: "",
  cep: "",
  logradouro: "",
  number: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  lat: null,
  lng: null,
  phone: "",
  instagram: "",
  photo: "",
  cover_image: "",
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

  const handlePhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Envie um arquivo de imagem.");
    try {
      set("photo", await resizeImage(file));
    } catch {
      toast.error("Não foi possível ler a imagem.");
    }
  };

  const handleCoverImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Envie um arquivo de imagem.");
    try {
      // Resize to reasonable size (1400px max dimension) to keep DB entry manageable
      const base64 = await resizeImage(file, 1400);
      set("cover_image", base64);
    } catch {
      toast.error("Não foi possível ler a imagem.");
    }
  };

  const coverFileRef = useRef<HTMLInputElement>(null);

  const generateBio = async () => {
    const notes = form.bio.trim() || form.specialty.trim();
    if (notes.length < 3) {
      toast.info("Escreva algumas palavras sobre o artista no campo de biografia para a IA desenvolver.");
      return;
    }
    set("bio", "");
    await bioAi.run(
      { name: form.name, category: form.category, specialty: form.specialty, gender: form.gender, notes },
      (chunk) => setForm((f) => ({ ...f, bio: f.bio + chunk })),
    );
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cep = raw.replace(/\D/g, "");
    set("cep", raw);
    if (cep.length === 8) {
      try {
        const data = await lookupCep(cep);
        if (data) {
          set("logradouro", data.logradouro || "");
          set("number", "");
          set("complemento", "");
          set("bairro", data.bairro || "");
          set("cidade", data.localidade || "");
          set("uf", data.uf || "");
          const fullAddress = data.logradouro ? `${data.logradouro}, ${form.number || ""}`.trim() : form.address;
          set("address", fullAddress || form.address);
          // Try to geocode the address and update the map
          const geo = await geocodeAddress(fullAddress);
          if (geo) {
            set("lat", geo.lat);
            set("lng", geo.lng);
            toast.success("Endereço encontrado e marcado no mapa!");
          } else {
            toast.success("Endereço encontrado!");
          }
        } else {
          toast.error("CEP não encontrado. Verifique o número.");
        }
      } catch {
        toast.error("Falha na consulta ao ViaCEP. Tente novamente.");
      }
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (form.name.trim().length < 2) missing.push("nome");
    if (!form.category) missing.push("categoria");
    if (!form.birth_date) missing.push("data de nascimento");
    if (!form.experience) missing.push("tempo de atuação");
    if (form.address.trim().length < 3) missing.push("endereço");
    if (missing.length) {
      toast.error(`Preencha: ${missing.join(", ")}.`);
      return;
    }
    onSubmit({
      ...form,
      birth_date: form.birth_date || undefined,
      category: form.category as Category,
      age_range: form.age_range || undefined,
      experience: form.experience as Experience,
      name: form.name.trim(),
      address: form.address.trim(),
      cep: (form.cep || "").trim(),
      number: form.number?.trim() || undefined,
      complemento: form.complemento?.trim() || undefined,
      bairro: form.bairro?.trim() || undefined,
      cidade: form.cidade?.trim() || undefined,
      uf: form.uf?.trim().toUpperCase() || undefined,
      activities: [],
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
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
            <FieldSelect
              id="category"
              value={form.category}
              onChange={(v) => set("category", v as Category)}
              options={CATEGORY_LABELS}
              testId="form-category-select"
            />
            </div>
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
              {form.bio.trim() ? "Corrigir com IA" : "Corrigindo com IA..."}
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

      {/* Banner upload */}
      <section className="space-y-3">
        <SectionTitle n="01b" title="Banner da capa" hint="Imagem de fundo do perfil. Recomendado: 1200×400px, PNG ou JPG." />
        <div className="flex flex-col px-5 items-center gap-4">
          <button
            type="button"
            onClick={() => coverFileRef.current?.click()}
            data-testid="banner-upload-button"
            className="group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-amber-900/20 bg-[#FAF5EE] transition-colors hover:border-[#E65100]"
          >
            {form.cover_image ? (
              <img src={form.cover_image} alt="Banner" className="h-24 w-full object-cover" data-testid="banner-preview" />
            ) : (
              <div className="flex h-24 items-center justify-center gap-2 text-stone-500">
                <Camera className="size-5" />
                <span className="text-sm">Clique para enviar o banner</span>
              </div>
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {form.cover_image ? "Trocar banner" : "Enviar banner"}
            </span>
          </button>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="banner-file-input"
            onChange={(e) => void handleCoverImage(e.target.files?.[0])}
          />
          {form.cover_image && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => set("cover_image", "")}
              data-testid="banner-remove-button"
            >
              Remover
            </Button>
          )}
        </div>
      </section>

      {/* 02 — perfil */}
      <section className="space-y-5">
        <SectionTitle n="02" title="Perfil" hint="Usado apenas de forma agregada no Painel de Dados." />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="gender">Gênero</Label>
          <FieldSelect id="gender" value={form.gender} onChange={(v) => set("gender", v as Gender)} options={GENDER_LABELS} testId="form-gender-select" />

          </div>
          <div className="space-y-2">
          <Label htmlFor="birth_date">Data de nascimento</Label>
          <Input
            id="birth_date"
            type="date"
            value={form.birth_date}
            onChange={(e) => set("birth_date", e.target.value)}
            data-testid="form-birth-date-input"
            className="bg-white"
          />
          </div>
          <div className="space-y-2">
          <Label htmlFor="experience">Experiência</Label>
          <FieldSelect
            id="experience"
            value={form.experience}
            onChange={(v) => set("experience", v as Experience)}
            options={EXPERIENCE_LABELS}
            testId="form-experience-select"
          />
          </div>
        </div>
      </section>

      {/* 03 — localização e contato */}
      <section className="space-y-5">
        <SectionTitle n="03" title="Onde encontrar" hint="Endereço no Jardim Ibirapuera e formas de contato." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              placeholder="00000-000"
              value={form.cep}
              onChange={handleCepChange}
              data-testid="form-cep-input"
              className="bg-white"
              maxLength={9}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logradouro">Rua / Avenida *</Label>
              <Input id="logradouro" placeholder="Ex.: Rua Teresa Carreño" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value, lat: null, lng: null }))} data-testid="form-address-input" className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" placeholder="45" value={form.number || ""} onChange={(e) => {
                set("number", e.target.value);
                // When number changes, try to update location on map
                const addr = `${form.address}${e.target.value ? `, ${e.target.value}` : ""}`;
                geocodeAddress(addr).then((r) => {
                  if (r) setForm((f) => ({ ...f, lat: r.lat, lng: r.lng }));
                }).catch(() => {});
              }} className="bg-white" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input id="complemento" placeholder="Apto, bloco..." value={form.complemento || ""} onChange={(e) => set("complemento", e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" placeholder="Ibirapuera" value={form.bairro || ""} onChange={(e) => set("bairro", e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" placeholder="São Paulo" value={form.cidade || ""} onChange={(e) => set("cidade", e.target.value)} className="bg-white" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input id="uf" placeholder="SP" maxLength={2} value={form.uf || ""} onChange={(e) => set("uf", e.target.value.toUpperCase())} className="bg-white" />
            </div>
            <div className="space-y-2 sm:col-span-1"></div>
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
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" placeholder="@seuperfil" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} data-testid="form-instagram-input" className="bg-white" />
          </div>
        </div>
      </section>

      {/* 04 — atividades */}
      <section className="space-y-5">
        <SectionTitle n="04" title="Atividades oferecidas ao bairro" hint="Oficinas, aulas, serviços ou apresentações — é assim que os moradores encontram você." />
        <div className="rounded-2xl border border-dashed border-amber-900/20 bg-[#FAF5EE] p-6 text-center text-sm text-stone-500">
          <p>As atividades serão gerenciadas após o cadastro, em <strong>Meus perfis</strong>.</p>
          <p className="mt-1">Clique em <strong>“Gerenciar atividades”</strong> no seu perfil para adicionar oficinas, aulas e eventos.</p>
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
