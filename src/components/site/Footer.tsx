import { Link } from "@tanstack/react-router";
import { Calendar, Instagram, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_INSTAGRAM, DEFAULT_WHATSAPP, whatsappUrl } from "@/lib/booking";
import { useSettings } from "@/lib/site-data";
import { NAV } from "./Header";

export function Footer() {
  const { data: s } = useSettings();
  return (
    <footer className="bg-cocoa pb-28 pt-20 text-pearl lg:pb-10">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-display text-3xl">Maria Ferreira</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.5em] text-gold">Nail Designer</p>
          <p className="mt-6 max-w-xs font-display text-lg italic text-pearl/75">
            Realçando a beleza e a confiança da mulher através das unhas.
          </p>
        </div>
        <nav aria-label="Links rápidos">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Navegação</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 text-sm text-pearl/75">
            {NAV.map((n) => (
              <li key={n.href}><a href={`/${n.href}`} className="hover:text-pearl">{n.label}</a></li>
            ))}
            <li><Link to="/privacidade" className="hover:text-pearl">Privacidade</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Contato</p>
          <ul className="mt-5 space-y-3 text-sm text-pearl/75">
            <li><a href={whatsappUrl(s?.whatsapp_number ?? DEFAULT_WHATSAPP)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-pearl"><MessageCircle className="h-4 w-4" /> (61) 99837-8967</a></li>
            <li><a href={s?.instagram_url ?? DEFAULT_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-pearl"><Instagram className="h-4 w-4" /> @mariaf.naildesigner19</a></li>
            <li>{s?.address ? `${s.address} · ` : ""}{s?.city ?? "Valparaíso de Goiás – GO"}</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-2 border-t border-pearl/10 px-5 pt-6 text-xs text-pearl/50 sm:flex-row sm:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} Maria Ferreira Nail Designer. Todos os direitos reservados.</p>
        <Link to="/privacidade" className="hover:text-pearl">Política de privacidade</Link>
      </div>
    </footer>
  );
}

/** Discreet floating WhatsApp (desktop) + bottom bar on mobile. */
export function FloatingActions() {
  const { data: s } = useSettings();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 500);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const wa = whatsappUrl(s?.whatsapp_number ?? DEFAULT_WHATSAPP, "Olá, Maria! 💖");
  return (
    <>
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Conversar no WhatsApp"
        className="fixed bottom-6 right-6 z-40 hidden h-14 w-14 place-items-center rounded-full bg-cocoa text-pearl shadow-card transition-transform hover:scale-105 lg:grid"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
      <div
        className={`glass fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-500 lg:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
      >
        <a href="#agendamento" className="flex flex-1 items-center justify-center gap-2 rounded-full bg-cocoa py-3.5 text-xs uppercase tracking-[0.2em] text-pearl">
          <Calendar className="h-4 w-4" /> Agendar
        </a>
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid w-14 place-items-center rounded-full border border-border bg-pearl">
          <MessageCircle className="h-5 w-5" />
        </a>
      </div>
    </>
  );
}
