import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AiText from "./AiText";
import { useAiStream } from "@/lib/useAiStream";
import type { RecommendRequest } from "@/lib/types";

const SUGGESTIONS = [
  "Quero aprender percussão perto de casa",
  "Preciso de uma costureira para ajustar roupas",
  "Atividades gratuitas para adolescentes",
  "Quem faz quitutes por encomenda?",
];

export default function AiAssistant() {
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState("");
  const ai = useAiStream<RecommendRequest>("/ai/recommend");

  const ask = (q: string) => {
    const clean = q.trim();
    if (clean.length < 3 || ai.isPending) return;
    setAsked(clean);
    void ai.run({ query: clean });
  };

  return (
    <section
      data-testid="ai-assistant"
      className="relative overflow-hidden rounded-3xl bg-[#141210] p-6 text-[#FFF8F0] sm:p-10"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-[#E65100]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-[#0D9488]/25 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-[#FACC15]">
            <Sparkles className="size-3.5" /> Assistente com IA · Claude
          </span>
          <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Encontre um talento do bairro.
          </h2>
          <p className="text-[#F3D5B5]">
            Conte o que você procura — uma aula, um conserto, uma apresentação — e o assistente indica quem faz isso
            aqui no Jardim Ibirapuera.
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                type="button"
                data-testid={`ai-suggestion-${i}`}
                onClick={() => {
                  setQuery(s);
                  ask(s);
                }}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-left text-xs text-[#FFF8F0] transition-colors duration-200 hover:border-[#FACC15]/60 hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(query);
            }}
            className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur"
          >
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: Minha filha quer aprender a dançar, tem algo aos sábados?"
              data-testid="ai-query-input"
              className="min-h-20 resize-none border-0 bg-transparent text-[#FFF8F0] placeholder:text-[#F3D5B5]/60 focus-visible:ring-0 dark:bg-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(query);
                }
              }}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                data-testid="ai-query-submit"
                disabled={ai.isPending || query.trim().length < 3}
                className="bg-[#E65100] text-white transition-colors hover:bg-[#C2410C]"
              >
                {ai.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Perguntar
              </Button>
            </div>
          </form>
          {(asked || ai.text) && (
            <div className="rounded-2xl bg-[#FDFBF7] p-5 text-sm shadow-xl" data-testid="ai-answer-panel">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-stone-500">Você perguntou: {asked}</p>
              {ai.text ? (
                <AiText text={ai.text} testId="ai-answer-text" />
              ) : (
                <p className="inline-flex items-center gap-2 text-stone-500">
                  <Loader2 className="size-4 animate-spin" /> Procurando talentos no bairro…
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
