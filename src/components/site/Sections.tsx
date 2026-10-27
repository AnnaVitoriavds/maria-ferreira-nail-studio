import { motion } from "framer-motion";
import { ArrowDown, Instagram, MapPin, MessageCircle, Star, Sparkles, Heart, Gem, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Reveal, RevealText, Parallax, Tilt, Ornament, Eyebrow } from "./motion";
import { useServices, useSettings, useTestimonials, bookingIntent } from "@/lib/site-data";
import { DEFAULT_INSTAGRAM, DEFAULT_WHATSAPP, formatDuration, formatPrice, whatsappUrl } from "@/lib/booking";

/* ---------------- HERO ---------------- */
export function Hero() {
  const { data: s } = useSettings();
  const hero = s?.hero_image_url || "/images/hero.jpg";
  return (
    <section id="inicio" className="relative min-h-[100svh] overflow-hidden bg-pearl-gradient pt-28 lg:pt-0">
      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-10 px-5 lg:grid-cols-12 lg:px-8">
        <div className="relative z-10 lg:col-span-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="font-display text-sm uppercase tracking-[0.55em] text-gold-shine">Maria Ferreira</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.6em] text-muted-foreground">Nail Designer · Valparaíso de Goiás</p>
          </motion.div>
          <h1 className="mt-8 text-5xl font-medium leading-[1.02] sm:text-6xl lg:text-7xl">
            <RevealText text="Suas unhas merecem um toque de" />{" "}
            <em className="font-display italic text-primary">
              <RevealText text="sofisticação." />
            </em>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9 }}
            className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Mais do que unhas bonitas, uma experiência de cuidado, delicadeza e autoestima em cada detalhe.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="#agendamento"
              className="group relative overflow-hidden rounded-full bg-cocoa px-8 py-4 text-center text-xs font-medium uppercase tracking-[0.22em] text-pearl shadow-card transition-transform hover:-translate-y-0.5"
            >
              <span className="relative z-10">Agendar meu horário</span>
              <span className="absolute inset-0 -translate-x-full bg-rose-gradient transition-transform duration-500 group-hover:translate-x-0" />
            </a>
            <a
              href="#servicos"
              className="rounded-full border border-cocoa/30 px-8 py-4 text-center text-xs font-medium uppercase tracking-[0.22em] transition-colors hover:border-gold hover:text-primary"
            >
              Conhecer os serviços
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative lg:col-span-6"
        >
          <div className="absolute -left-6 -top-6 hidden h-40 w-40 rounded-full border border-gold/50 lg:block" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[200px] rounded-b-3xl shadow-card lg:aspect-[4/5]">
            <img
              src={hero}
              alt="Mãos com unhas amendoadas nude e detalhes dourados"
              width={1600}
              height={1200}
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/30 to-transparent" />
          </div>
          <div className="glass absolute -bottom-6 left-4 rounded-2xl border border-pearl/60 px-5 py-4 shadow-soft sm:left-auto sm:right-6">
            <div className="flex items-center gap-1 text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">5,0 no Google</p>
          </div>
        </motion.div>
      </div>
      <a
        href="#sobre"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-muted-foreground lg:flex"
      >
        Deslize
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </a>
    </section>
  );
}

/* ---------------- ABOUT ---------------- */
export function About() {
  const { data: s } = useSettings();
  const img = s?.profile_image_url || "/images/manicure.jpg";
  const items = [
    { icon: Heart, t: "Atendimento individualizado", d: "Cada cliente é recebida com atenção exclusiva." },
    { icon: Gem, t: "Acabamento delicado", d: "Detalhes pensados para valorizar suas mãos." },
    { icon: Sparkles, t: "Seu estilo, sua personalidade", d: "Unhas que traduzem quem você é." },
  ];
  return (
    <section id="sobre" className="relative py-24 lg:py-36">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
        <Reveal className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-0 translate-x-5 translate-y-5 rounded-[2rem] border border-gold/60" />
          <Parallax className="relative aspect-[4/5] rounded-[2rem] shadow-card" amount={30}>
            <img src={img} alt={s?.profile_image_url ? "Maria Ferreira" : "Detalhe de manicure delicada"} loading="lazy" width={1024} height={1280} className="h-full w-full object-cover" />
          </Parallax>
          <div className="glass absolute -bottom-8 -right-2 rounded-2xl px-6 py-4 shadow-soft sm:-right-8">
            <p className="font-display text-xl italic">Maria Ferreira</p>
            <p className="text-[10px] uppercase tracking-[0.35em] text-gold">Nail Designer</p>
          </div>
        </Reveal>
        <div>
          <Reveal>
            <Eyebrow>Sobre Maria Ferreira</Eyebrow>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              {s?.about_title ?? "A beleza está nos detalhes."}
            </h2>
            <Ornament className="mt-6" />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {s?.about_text ??
                "Cada atendimento é uma oportunidade de valorizar sua beleza, respeitar seu estilo e realçar sua confiança."}
            </p>
            <blockquote className="mt-8 border-l-2 border-gold pl-5 font-display text-2xl italic text-primary">
              “Realçando a beleza e a confiança da mulher através das unhas.”
            </blockquote>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {items.map((it, i) => (
              <Reveal key={it.t} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-soft">
                  <it.icon className="h-5 w-5 text-gold" />
                  <p className="mt-3 text-sm font-medium">{it.t}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{it.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- SERVICES ---------------- */
export function Services() {
  const { data, isLoading, isError } = useServices();
  return (
    <section id="servicos" className="bg-champagne/60 py-24 lg:py-36">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Serviços</Eyebrow>
          <h2 className="mt-4 text-4xl sm:text-5xl">
            Cuidado sob medida <em className="italic text-primary">para você</em>
          </h2>
          <Ornament className="mt-6 justify-center" />
        </Reveal>
        {isError && <p className="mt-10 text-center text-sm text-destructive">Não foi possível carregar os serviços. Atualize a página.</p>}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)}
          {data?.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 0.08}>
              <Tilt className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow hover:shadow-card">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {s.image_url && (
                      <img
                        src={s.image_url}
                        alt={s.name}
                        loading="lazy"
                        width={1024}
                        height={1280}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-pearl/85 px-3 py-1 font-display text-sm italic">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-2xl">{s.name}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                    {(s.price != null || s.duration_minutes) && (
                      <div className="mt-4 flex gap-4 text-sm">
                        {formatPrice(s.price) && <span className="font-medium text-primary">{formatPrice(s.price)}</span>}
                        {formatDuration(s.duration_minutes) && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" /> {formatDuration(s.duration_minutes)}
                          </span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => bookingIntent.set({ serviceId: s.id })}
                      className="mt-5 rounded-full border border-cocoa/25 py-3 text-xs uppercase tracking-[0.2em] transition-all hover:border-transparent hover:bg-cocoa hover:text-pearl"
                    >
                      Agendar este serviço
                    </button>
                  </div>
                </article>
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- EXPERIENCE ---------------- */
export function Experience() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-12 lg:px-8">
        <Reveal className="lg:col-span-5 lg:pt-16">
          <Eyebrow>A experiência</Eyebrow>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
            Um momento só seu. <em className="italic text-primary">Um cuidado em cada detalhe.</em>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Um atendimento pensado para transformar o cuidado com as unhas em um momento especial de beleza e autoestima.
          </p>
        </Reveal>
        <div className="grid grid-cols-5 gap-4 lg:col-span-7">
          <Parallax className="col-span-5 aspect-[16/10] rounded-3xl shadow-card" amount={40}>
            <img src="/images/experience.jpg" alt="Esmaltes nude e rosé com ferramentas douradas" loading="lazy" width={1600} height={1104} className="h-full w-full object-cover" />
          </Parallax>
          <Reveal className="col-span-2" delay={0.1}>
            <img src="/images/nailart.jpg" alt="Nail art delicada com pérolas" loading="lazy" width={1024} height={1280} className="aspect-square w-full rounded-3xl object-cover" />
          </Reveal>
          <Reveal className="col-span-3" delay={0.2}>
            <img src="/images/esmaltacao.jpg" alt="Esmaltação nude rosé" loading="lazy" width={1024} height={1280} className="aspect-[3/2] w-full rounded-3xl object-cover" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- REVIEWS ---------------- */
export function Reviews() {
  const { data: s } = useSettings();
  const { data: t, isLoading } = useTestimonials();
  const rating = Number(s?.google_rating ?? 5).toFixed(1).replace(".", ",");
  const count = s?.google_review_count ?? 1;
  return (
    <section id="avaliacoes" className="bg-blush/50 py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-5 text-center lg:px-8">
        <Reveal>
          <Eyebrow>Avaliações</Eyebrow>
          <h2 className="mt-4 text-4xl sm:text-5xl">Quem conhece, recomenda.</h2>
          <div className="mx-auto mt-10 inline-flex flex-col items-center rounded-3xl border border-gold/40 bg-card px-12 py-8 shadow-soft">
            <p className="font-display text-7xl text-gold-shine">{rating}</p>
            <div className="mt-2 flex gap-1 text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Avaliação no Google · {count} {count === 1 ? "avaliação" : "avaliações"}
            </p>
            {s?.google_reviews_url && (
              <a
                href={s.google_reviews_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 rounded-full bg-cocoa px-6 py-3 text-xs uppercase tracking-[0.2em] text-pearl"
              >
                Ver avaliações no Google
              </a>
            )}
          </div>
        </Reveal>
        {isLoading && <Skeleton className="mx-auto mt-10 h-32 max-w-xl rounded-3xl" />}
        {t && t.length > 0 && (
          <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
            {t.map((x, i) => (
              <Reveal key={x.id} delay={i * 0.08}>
                <figure className="h-full rounded-3xl border border-border bg-card p-7 shadow-soft">
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: x.rating }).map((_, k) => (
                      <Star key={k} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 font-display text-xl italic leading-snug">“{x.content}”</blockquote>
                  <figcaption className="mt-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">{x.author_name}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- CONTACT ---------------- */
export function Contact() {
  const { data: s } = useSettings();
  const wa = s?.whatsapp_number ?? DEFAULT_WHATSAPP;
  const ig = s?.instagram_url ?? DEFAULT_INSTAGRAM;
  const directions = s?.maps_url || (s?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.address}, ${s.city}`)}` : null);
  return (
    <section id="contato" className="py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <Eyebrow>Contato</Eyebrow>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
            Seu próximo momento de beleza <em className="italic text-primary">começa aqui.</em>
          </h2>
          <div className="mt-10 space-y-5 text-base">
            <p className="font-display text-2xl">Maria Ferreira Nail Designer</p>
            <p className="flex items-start gap-3 text-muted-foreground">
              <MapPin className="mt-0.5 h-5 w-5 text-gold" />
              <span>
                {s?.address && <>{s.address}<br /></>}
                {s?.city ?? "Valparaíso de Goiás – GO"}
              </span>
            </p>
            <p className="flex items-center gap-3 text-muted-foreground">
              <MessageCircle className="h-5 w-5 text-gold" /> WhatsApp: (61) 99837-8967
            </p>
            <p className="flex items-center gap-3 text-muted-foreground">
              <Instagram className="h-5 w-5 text-gold" /> @mariaf.naildesigner19
            </p>
            {s?.business_hours && (
              <p className="flex items-start gap-3 whitespace-pre-line text-muted-foreground">
                <Clock className="mt-0.5 h-5 w-5 text-gold" /> {s.business_hours}
              </p>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="flex h-full flex-col justify-center gap-4 rounded-[2rem] bg-cocoa p-8 text-pearl shadow-card sm:p-12">
            <p className="font-display text-3xl italic">Vamos conversar?</p>
            <a href={whatsappUrl(wa, "Olá, Maria! Gostaria de agendar um horário. 💖")} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-pearl py-4 text-xs uppercase tracking-[0.2em] text-cocoa transition-transform hover:-translate-y-0.5">
              <MessageCircle className="h-4 w-4" /> Agendar pelo WhatsApp
            </a>
            <a href={ig} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-pearl/30 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:border-gold">
              <Instagram className="h-4 w-4" /> Ver Instagram
            </a>
            {directions ? (
              <a href={directions} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full border border-pearl/30 py-4 text-xs uppercase tracking-[0.2em] transition-colors hover:border-gold">
                <MapPin className="h-4 w-4" /> Como chegar
              </a>
            ) : (
              <p className="rounded-full border border-dashed border-pearl/25 py-4 text-center text-xs text-pearl/70">
                Endereço completo informado no agendamento pelo WhatsApp
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
