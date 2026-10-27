import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "#inicio", label: "Início" },
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#galeria", label: "Galeria" },
  { href: "#avaliacoes", label: "Avaliações" },
  { href: "#agendamento", label: "Agendamento" },
  { href: "#contato", label: "Contato" },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a href="#inicio" className="group flex flex-col leading-none" aria-label="Maria Ferreira Nail Designer — início">
      <span className={cn("font-display text-2xl font-semibold tracking-wide", light ? "text-pearl" : "text-foreground")}>
        Maria Ferreira
      </span>
      <span className="mt-1 text-[9px] uppercase tracking-[0.5em] text-gold">Nail Designer</span>
    </a>
  );
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "glass border-b border-border/60 py-3 shadow-soft" : "py-5",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Principal">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="relative text-sm text-foreground/80 transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <a
          href="#agendamento"
          className="hidden rounded-full bg-cocoa px-5 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-pearl transition-all hover:-translate-y-0.5 hover:bg-primary hover:shadow-card lg:inline-flex"
        >
          Agendar meu horário
        </a>
        <button
          className="relative z-50 grid h-11 w-11 place-items-center rounded-full border border-border bg-pearl/70 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col bg-pearl-gradient px-8 pt-28 lg:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Menu móvel">
              {NAV.map((n, i) => (
                <motion.a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="border-b border-border/60 py-4 font-display text-3xl"
                >
                  {n.label}
                </motion.a>
              ))}
            </nav>
            <a
              href="#agendamento"
              onClick={() => setOpen(false)}
              className="mt-8 rounded-full bg-cocoa py-4 text-center text-sm uppercase tracking-[0.2em] text-pearl"
            >
              Agendar meu horário
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
