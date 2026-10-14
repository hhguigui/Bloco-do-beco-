import { STATUS_META } from "@/lib/catalog";
import type { TalentStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: TalentStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider"
      style={{ background: m.bg, color: m.fg }}
      data-testid={`status-badge-${status}`}
    >
      <span className="size-1.5 rounded-full" style={{ background: m.fg }} />
      {m.label}
    </span>
  );
}
