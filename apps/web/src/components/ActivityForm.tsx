import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FieldSelect from "./FieldSelect";
import { ACTIVITY_LABELS } from "@/lib/catalog";
import type { Activity, ActivityType } from "@/lib/types";

const WEEKDAYS = [
  { value: "segunda", label: "Segunda" },
  { value: "terca", label: "Terça" },
  { value: "quarta", label: "Quarta" },
  { value: "quinta", label: "Quinta" },
  { value: "sexta", label: "Sexta" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

interface Props {
  initialActivities: Activity[];
  onSubmit: (activities: Activity[]) => void;
  pending: boolean;
}

export default function ActivityForm({ initialActivities, onSubmit, pending }: Props) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const addActivity = () => {
    setActivities((prev) => [...prev, {
      id: crypto.randomUUID(),
      title: "",
      type: "oficina",
      description: "",
      schedule: "",
      price: "Gratuito",
      weekdays: [],
    }]);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const removeActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleWeekday = (id: string, day: string) => {
    setActivities((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      const current = a.weekdays || [];
      const next = current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day];
      return { ...a, weekdays: next };
    }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(activities); }} className="space-y-6">
      <div className="space-y-4">
        {activities.length === 0 && (
          <p className="text-sm text-stone-500">Nenhuma atividade cadastrada ainda.</p>
        )}
        {activities.map((a, i) => (
          <div key={a.id} className="space-y-3 rounded-2xl border border-amber-900/10 bg-[#FAF5EE] p-4" data-testid={`activity-row-${i}`}>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
              <div>
                <Label htmlFor={`title-${a.id}`}>Título *</Label>
                <Input id={`title-${a.id}`} placeholder="Título da atividade" value={a.title} onChange={(e) => updateActivity(a.id, { title: e.target.value })} data-testid={`activity-title-input-${i}`} className="bg-white" />
              </div>
              <div>
                <Label htmlFor={`type-${a.id}`}>Tipo</Label>
                <FieldSelect
                  id={`type-${a.id}`}
                  value={a.type}
                  onChange={(v) => updateActivity(a.id, { type: v as ActivityType })}
                  options={ACTIVITY_LABELS}
                  testId={`activity-type-select-${i}`}
                  className=""
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover atividade"
                onClick={() => removeActivity(a.id)}
                data-testid={`activity-remove-button-${i}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`schedule-${a.id}`}>Horário</Label>
                <Input id={`schedule-${a.id}`} placeholder="Ex.: 10h" value={a.schedule} onChange={(e) => updateActivity(a.id, { schedule: e.target.value })} data-testid={`activity-schedule-input-${i}`} className="bg-white" />
              </div>
              <div>
                <Label htmlFor={`price-${a.id}`}>Valor</Label>
                <Input id={`price-${a.id}`} placeholder="Gratuito" value={a.price} onChange={(e) => updateActivity(a.id, { price: e.target.value })} data-testid={`activity-price-input-${i}`} className="bg-white" />
              </div>
            </div>
            <div>
              <Label>Dias da semana</Label>
              <div className="mt-2 flex flex-wrap gap-2" data-testid={`weekdays-select-${i}`}>
                {WEEKDAYS.map((day) => {
                  const selected = (a.weekdays || []).includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(a.id, day.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selected
                          ? "bg-[#E65100] text-white"
                          : "bg-white border border-stone-200 text-stone-600 hover:border-[#E65100]"
                      }`}
                      data-testid={`weekday-${day.value}-${i}`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label htmlFor={`desc-${a.id}`}>Descrição</Label>
              <Textarea id={`desc-${a.id}`} rows={2} placeholder="Descrição curta" value={a.description} onChange={(e) => updateActivity(a.id, { description: e.target.value })} data-testid={`activity-description-input-${i}`} className="bg-white" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addActivity} data-testid="add-activity-button" className="border-dashed w-full py-8">
          <Plus className="size-4" /> Adicionar atividade
        </Button>
      </div>
      <div className="flex justify-end gap-2 border-t border-amber-900/10 pt-4">
        <Button type="submit" disabled={pending} className="bg-[#E65100] px-6 text-white hover:bg-[#C2410C]" data-testid="activity-form-submit">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Salvar atividades
        </Button>
      </div>
    </form>
  );
}
