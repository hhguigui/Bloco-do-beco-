import { motion } from "motion/react";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import CategoryBadge from "./CategoryBadge";
import { CATEGORY_META, initials } from "@/lib/catalog";
import type { Talent } from "@/lib/types";

export default function TalentCard({ talent, index = 0 }: { talent: Talent; index?: number }) {
  const meta = CATEGORY_META[talent.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.05, duration: 0.35 }}
    >
      <Link
        to={`/talento/${talent.id}`}
        data-testid={`talent-card-${talent.id}`}
        className="group block overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(120,53,15,0.45)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden" style={{ background: meta.bg }}>
          {talent.photo ? (
            <img
              src={talent.photo}
              alt={talent.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-heading text-5xl font-extrabold" style={{ color: meta.fg }}>
              {initials(talent.name)}
            </div>
          )}
          <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-stone-900 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
        <div className="space-y-2.5 p-5">
          <CategoryBadge category={talent.category} />
          <h3 className="font-heading text-lg font-bold leading-snug text-stone-900" data-testid="talent-card-name">
            {talent.name}
          </h3>
          {talent.specialty && <p className="text-sm text-stone-600">{talent.specialty}</p>}
          <div className="flex items-center justify-between pt-1 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1 truncate">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{talent.address}</span>
            </span>
            {talent.activities.length > 0 && (
              <span className="shrink-0 font-mono uppercase tracking-wider text-[#C2410C]">
                {talent.activities.length} {talent.activities.length === 1 ? "atividade" : "atividades"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
