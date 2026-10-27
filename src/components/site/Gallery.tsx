import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Instagram, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGallery, useSettings, bookingIntent } from "@/lib/site-data";
import { DEFAULT_INSTAGRAM } from "@/lib/booking";
import { Eyebrow, Ornament, Reveal } from "./motion";

const CATS = ["Todas", "Alongamentos", "Francesinhas", "Unhas de Gel", "Nail Art", "Delicadas", "Trabalhos Recentes"];
const SPANS = ["md:row-span-2", "", "", "md:row-span-2", "", "md:col-span-2", "", ""];

export function Gallery() {
  const { data, isLoading } = useGallery();
  const { data: s } = useSettings();
  const [cat, setCat] = useState("Todas");
  const [open, setOpen] = useState<number | null>(null);
  const items = useMemo(() => (data ?? []).filter((g) => cat === "Todas" || g.category === cat), [data, cat]);
  const current = open != null ? items[open] : null;

  useEffect(() => {
    if (open == null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o! + 1) % items.length);
      if (e.key === "ArrowLeft") setOpen((o) => (o! - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, items.length]);

  return (
    <section id="galeria" className="py-24 lg:py-36">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="text-center">
          <Eyebrow>Galeria</Eyebrow>
          <h2 className="mt-4 text-4xl sm:text-5xl">Nail Art <em className="italic text-primary">Experience</em></h2>
          <Ornament className="mt-6 justify-center" />
        </Reveal>
        <div className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 sm:flex-wrap sm:justify-center" role="tablist">
          {CATS.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={cn("shrink-0 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.15em] transition-colors", cat === c ? "border-cocoa bg-cocoa text-pearl" : "border-border hover:border-gold")}
            >
              {c}
            </button>
          ))}
        </div>

        <motion.div layout className="mt-10 grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-4 md:gap-4">
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className={cn("rounded-2xl", SPANS[i])} />)}
          <AnimatePresence>
            {items.map((g, i) => (
              <motion.button
                layout
                key={g.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                onClick={() => setOpen(i)}
                className={cn("group relative overflow-hidden rounded-2xl", SPANS[i % SPANS.length])}
                aria-label={`Ampliar: ${g.caption ?? g.category}`}
              >
                <img src={g.image_url} alt={g.caption ?? g.category} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-cocoa/70 via-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-3 left-3 right-3 translate-y-2 text-left text-sm text-pearl opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="block text-[10px] uppercase tracking-[0.25em] text-gold-light">{g.category}</span>
                  {g.caption}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
        {!isLoading && items.length === 0 && <p className="mt-8 text-center text-sm text-muted-foreground">Em breve, novos trabalhos nesta categoria.</p>}
        <div className="mt-10 text-center">
          <a href={s?.instagram_url ?? DEFAULT_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-cocoa/25 px-6 py-3 text-xs uppercase tracking-[0.2em] hover:border-gold">
            <Instagram className="h-4 w-4" /> Mais trabalhos no Instagram
          </a>
        </div>
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa/90 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Visualização ampliada"
          >
            <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-pearl/10 text-pearl" aria-label="Fechar"><X /></button>
            <button className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-pearl/10 text-pearl sm:left-6" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setOpen((open! - 1 + items.length) % items.length); }}><ChevronLeft /></button>
            <button className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-pearl/10 text-pearl sm:right-6" aria-label="Próxima" onClick={(e) => { e.stopPropagation(); setOpen((open! + 1) % items.length); }}><ChevronRight /></button>
            <motion.figure key={current.id} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="flex max-h-full max-w-3xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img src={current.image_url} alt={current.caption ?? current.category} className="max-h-[70vh] rounded-2xl object-contain" />
              <figcaption className="mt-4 text-center text-pearl">
                <span className="block text-[10px] uppercase tracking-[0.3em] text-gold-light">{current.category}</span>
                <span className="font-display text-xl italic">{current.caption}</span>
              </figcaption>
              <button
                onClick={() => {
                  setOpen(null);
                  bookingIntent.set({ reference: { url: current.image_url, caption: current.caption } });
                }}
                className="mt-5 rounded-full bg-pearl px-7 py-3 text-xs uppercase tracking-[0.2em] text-cocoa"
              >
                Quero unhas assim
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
