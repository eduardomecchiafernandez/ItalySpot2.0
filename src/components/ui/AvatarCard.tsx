import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";

import type { MonumentDetail, MonumentSummary } from "@/types/monument";

type CardMonument = MonumentSummary & Partial<MonumentDetail>;

interface AvatarCardProps {
  monument: CardMonument;
  onClose?: () => void;
  ctaLabel?: string;
}

export function AvatarCard({ monument, onClose, ctaLabel = "Scopri di più" }: AvatarCardProps) {
  const subtitle = useMemo(() => {
    const location = [monument.city, monument.region].filter(Boolean).join(" • ");
    const era = monument.era ? `Fondato nel ${monument.era}` : undefined;
    return [location, era].filter(Boolean).join(" • ");
  }, [monument.city, monument.region, monument.era]);

  return (
    <motion.aside
      aria-live="polite"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="glass-card max-w-md p-8 text-ink dark:text-sand"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-ochre/70">Monumento</p>
          <h2 className="font-display text-3xl text-ink dark:text-sand">{monument.name}</h2>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ochre/50 bg-ochre/10 text-ink transition hover:bg-ochre/30 focus:outline-none focus-visible:ring focus-visible:ring-ochre/60"
            aria-label="Chiudi dettagli"
          >
            ×
          </button>
        ) : null}
      </div>

      {subtitle ? <p className="mt-2 text-sm text-ink/70 dark:text-sand/70">{subtitle}</p> : null}

      {monument.description ? (
        <p className="mt-4 leading-relaxed text-ink/80 dark:text-sand/80">{monument.description}</p>
      ) : (
        <p className="mt-4 leading-relaxed text-ink/60 dark:text-sand/60">
          Nessuna descrizione disponibile al momento.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={`/monument/${monument.slug}`}
          className="group flex items-center gap-2 rounded-full border border-ochre/50 bg-ochre/20 px-6 py-3 font-display text-sm uppercase tracking-wide text-ink shadow-glow transition hover:bg-ochre/40 focus:outline-none focus-visible:ring focus-visible:ring-ochre/60"
        >
          <span>{ctaLabel}</span>
          <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
        </Link>

        {monument.source ? (
          <a
            className="rounded-full border border-sage/50 bg-sage/10 px-5 py-3 text-sm text-ink transition hover:bg-sage/25 focus:outline-none focus-visible:ring focus-visible:ring-sage/60"
            href={monument.source}
            target="_blank"
            rel="noreferrer"
          >
            Fonte dati
          </a>
        ) : null}
      </div>
    </motion.aside>
  );
}
