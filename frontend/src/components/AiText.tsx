import { Fragment } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// Minimal renderer for Claude's output: paragraphs, "- " bullets, **bold** and [text](/path) links.
function inline(text: string, keyBase: string): ReactNode[] {
  const parts = text.split(/(\*\*(?:(?!\*\*).)+\*\*|\[[^\]]+\]\([^)\s]+\))/g);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      return href.startsWith("/") ? (
        <Link key={key} to={href} className="font-semibold text-[#C2410C] underline decoration-2 underline-offset-2 hover:text-[#E65100]" data-testid="ai-talent-link">
          {label}
        </Link>
      ) : (
        <a key={key} href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#C2410C] underline">
          {label}
        </a>
      );
    }
    const bold = part.match(/^\*\*((?:(?!\*\*).)+)\*\*$/);
    if (bold) return <strong key={key} className="font-semibold text-stone-900">{inline(bold[1], key)}</strong>;
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export default function AiText({ text, testId }: { text: string; testId?: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (k: number) => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${k}`} className="list-disc space-y-1 pl-5">
          {bullets.map((b, i) => (
            <li key={i}>{inline(b, `li-${k}-${i}`)}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };
  text.split("\n").forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (/^[-*•]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*•]\s+/, ""));
      return;
    }
    flush(i);
    if (line) blocks.push(<p key={`p-${i}`}>{inline(line.replace(/^#+\s*/, ""), `p-${i}`)}</p>);
  });
  flush(-1);
  return (
    <div className="space-y-3 leading-relaxed text-stone-700" data-testid={testId}>
      {blocks}
    </div>
  );
}
