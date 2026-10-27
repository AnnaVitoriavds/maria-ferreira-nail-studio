import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Loader2, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useServices, useSettings, useBookingIntent, getAnonSessionId } from "@/lib/site-data";
import {
  BOOKING_NOTICE,
  DEFAULT_WHATSAPP,
  bookingErrorMessage,
  buildBookingMessage,
  formatDateBR,
  formatDuration,
  formatPrice,
  formatTime,
  maskPhoneBR,
  normalizePhoneBR,
  toISODate,
  parseYMD,
  todaySaoPaulo,
  whatsappUrl,
} from "@/lib/booking";
import { Eyebrow, Ornament, Reveal } from "./motion";

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const STEPS = ["Serviço", "Data", "Horário", "Seus dados", "Enviar"];

function track(date: string, time: string | null, serviceId: string | null) {
  supabase
    .rpc("record_date_selection", {
      p_session: getAnonSessionId(),
      p_date: date,
      p_time: time as string,
      p_service_id: serviceId as string,
    })
    .then(() => undefined);
}

export function Notice({ className }: { className?: string }) {
  const { data: s } = useSettings();
  return (
    <div className={cn("flex gap-3 rounded-2xl border border-gold/50 bg-champagne p-4 text-sm leading-relaxed", className)} role="note">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
      <p>
        <strong className="font-semibold">{(s?.booking_notice ?? BOOKING_NOTICE).split(":")[0]}:</strong>
        {(s?.booking_notice ?? BOOKING_NOTICE).split(":").slice(1).join(":")}
      </p>
    </div>
  );
}

export function Booking() {
  const { data: services, isLoading: loadingServices } = useServices();
  const { data: settings } = useSettings();
  const intent = useBookingIntent();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [reference, setReference] = useState<{ url: string; caption?: string | null } | null>(null);
  const today = todaySaoPaulo();
  const [month, setMonth] = useState(() => {
    const [y, m] = parseYMD(today);
    return new Date(y, m - 1, 1);
  });
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; notes?: string; privacy?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ protocol: string; url: string } | null>(null);
  const idemKey = useRef<string>("");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!intent.nonce) return;
    if (intent.serviceId) {
      setServiceId(intent.serviceId);
      setStep(2);
    } else setStep(1);
    if (intent.reference) setReference(intent.reference);
    setResult(null);
    setDate(null);
    setTime(null);
  }, [intent.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const service = services?.find((s) => s.id === serviceId) ?? null;

  const monthStart = toISODate(month);
  const monthEnd = toISODate(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const queryStart = monthStart < today ? today : monthStart;
  const availability = useQuery({
    queryKey: ["month-availability", serviceId, queryStart, monthEnd],
    enabled: !!serviceId && queryStart <= monthEnd,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_month_availability", {
        p_start: queryStart,
        p_end: monthEnd,
        p_service_id: serviceId!,
      });
      if (error) throw error;
      return new Map(data.map((d) => [d.day, d.slots]));
    },
  });

  const slots = useQuery({
    queryKey: ["slots", serviceId, date],
    enabled: !!serviceId && !!date,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_available_slots", { p_date: date!, p_service_id: serviceId! });
      if (error) throw error;
      return data.map((d) => d.slot_time);
    },
  });

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= total; d++) cells.push(toISODate(new Date(month.getFullYear(), month.getMonth(), d)));
    return cells;
  }, [month]);

  const canPrev = monthStart > today;
  const maxMonth = new Date();
  maxMonth.setMonth(maxMonth.getMonth() + 3);
  const canNext = month < maxMonth;

  function go(n: number) {
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function pickDate(d: string) {
    setDate(d);
    setTime(null);
    track(d, null, serviceId);
    go(3);
  }

  function pickTime(t: string) {
    setTime(t);
    if (date) track(date, t, serviceId);
    go(4);
  }

  function validate() {
    const e: { name?: string; phone?: string; notes?: string; privacy?: string } = {};
    if (name.trim().split(/\s+/).length < 2 || name.trim().length < 5) e.name = "Informe nome e sobrenome.";
    if (!normalizePhoneBR(phone)) e.phone = "Informe um WhatsApp válido com DDD.";
    if (notes.length > 500) e.notes = "Máximo de 500 caracteres.";
    if (!privacy) e.privacy = "É necessário aceitar a política de privacidade.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (submitting || !service || !date || !time) return;
    if (!validate()) {
      go(4);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    if (!idemKey.current) idemKey.current = crypto.randomUUID();
    // Open the tab synchronously so browsers don't block it; it's only pointed at WhatsApp after saving.
    const win = window.open("", "_blank");
    try {
      const { data, error } = await supabase.rpc("create_booking_request", {
        p_idempotency_key: idemKey.current,
        p_client_name: name.trim(),
        p_client_phone: normalizePhoneBR(phone)!,
        p_service_id: service.id,
        p_date: date,
        p_time: time,
        p_notes: notes.trim(),
        ...(reference?.url ? { p_reference_image_url: reference.url } : {}),
      });
      if (error) throw new Error(error.message);
      const row = data?.[0];
      if (!row) throw new Error("NO_RESULT");
      const message = buildBookingMessage({
        service: service.name,
        name,
        date,
        time,
        protocol: row.protocol,
        notes,
        reference: reference?.url
          ? reference.url.startsWith("http")
            ? reference.url
            : `${window.location.origin}${reference.url}`
          : null,
      });
      const url = whatsappUrl(settings?.whatsapp_number ?? DEFAULT_WHATSAPP, message);
      setResult({ protocol: row.protocol, url });
      idemKey.current = "";
      qc.invalidateQueries({ queryKey: ["slots"] });
      qc.invalidateQueries({ queryKey: ["month-availability"] });
      if (win) win.location.href = url;
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      win?.close();
      const msg = err instanceof Error ? err.message : undefined;
      setSubmitError(bookingErrorMessage(msg));
      if (msg?.includes("SLOT_UNAVAILABLE")) {
        idemKey.current = "";
        setTime(null);
        qc.invalidateQueries({ queryKey: ["slots"] });
        go(3);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setStep(1);
    setServiceId(null);
    setDate(null);
    setTime(null);
    setNotes("");
    setReference(null);
    setPrivacy(false);
  }

  return (
    <section id="agendamento" className="relative bg-pearl-gradient py-24 lg:py-36">
      <div ref={topRef} className="mx-auto max-w-5xl scroll-mt-24 px-5 lg:px-8">
        <Reveal className="text-center">
          <Eyebrow>Agendamento</Eyebrow>
          <h2 className="mt-4 text-4xl sm:text-5xl">
            Reserve seu <em className="italic text-primary">momento</em>
          </h2>
          <Ornament className="mt-6 justify-center" />
        </Reveal>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-border bg-card shadow-card backdrop-blur">
          {!result && (
            <ol className="flex border-b border-border text-[10px] uppercase tracking-[0.15em] sm:text-xs" aria-label="Etapas">
              {STEPS.map((s, i) => {
                const n = i + 1;
                const reachable = n < step || (n === 2 && serviceId) || (n === 3 && date) || (n === 4 && time) || (n === 5 && time);
                return (
                  <li key={s} className="flex-1">
                    <button
                      disabled={!reachable && n !== step}
                      onClick={() => reachable && go(n)}
                      aria-current={step === n ? "step" : undefined}
                      className={cn(
                        "flex w-full flex-col items-center gap-1.5 px-1 py-4 transition-colors sm:flex-row sm:justify-center sm:gap-2",
                        step === n ? "bg-blush/60 text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span className={cn("grid h-6 w-6 place-items-center rounded-full border text-[10px]", n < step ? "border-primary bg-primary text-primary-foreground" : step === n ? "border-cocoa" : "border-border")}>
                        {n < step ? <Check className="h-3 w-3" /> : n}
                      </span>
                      <span className="hidden sm:inline">{s}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="p-5 sm:p-10">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
                    className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rose-gradient text-primary-foreground shadow-card"
                  >
                    <Check className="h-9 w-9" />
                  </motion.div>
                  <h3 className="mt-6 text-3xl sm:text-4xl">Solicitação registrada!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Seu protocolo</p>
                  <p className="mt-1 font-display text-3xl tracking-wider text-gold-shine">{result.protocol}</p>
                  <p className="mx-auto mt-5 max-w-lg text-muted-foreground">
                    Status: <strong className="text-foreground">Pendente de confirmação</strong>. Preparamos uma mensagem com os dados do seu pedido —
                    abra o WhatsApp e toque em <strong>Enviar</strong> para que a Maria receba.
                  </p>
                  <Notice className="mx-auto mt-6 max-w-xl text-left" />
                  <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-cocoa px-8 py-4 text-xs uppercase tracking-[0.2em] text-pearl">
                      <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
                    </a>
                    <button onClick={reset} className="rounded-full border border-border px-8 py-4 text-xs uppercase tracking-[0.2em]">
                      Nova solicitação
                    </button>
                  </div>
                </motion.div>
              ) : step === 1 ? (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl">Qual serviço você deseja?</h3>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {loadingServices && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                    {services?.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setServiceId(s.id);
                          setDate(null);
                          setTime(null);
                          go(2);
                        }}
                        className={cn(
                          "flex items-center gap-4 rounded-2xl border p-3 text-left transition-all hover:border-gold hover:shadow-soft",
                          serviceId === s.id ? "border-primary bg-blush/40" : "border-border",
                        )}
                      >
                        {s.image_url && <img src={s.image_url} alt="" loading="lazy" className="h-14 w-14 rounded-xl object-cover" />}
                        <span className="flex-1">
                          <span className="block font-display text-lg">{s.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {[formatPrice(s.price), formatDuration(s.duration_minutes)].filter(Boolean).join(" · ") || "Valor sob consulta"}
                          </span>
                        </span>
                        {serviceId === s.id && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl">Escolha a data</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{service?.name}</p>
                  <div className="mx-auto mt-6 max-w-md">
                    <div className="flex items-center justify-between">
                      <button aria-label="Mês anterior" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-10 w-10 place-items-center rounded-full border border-border disabled:opacity-30">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <p className="font-display text-xl">{MONTHS[month.getMonth()]} {month.getFullYear()}</p>
                      <button aria-label="Próximo mês" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-10 w-10 place-items-center rounded-full border border-border disabled:opacity-30">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
                      {WEEK.map((w) => <span key={w}>{w}</span>)}
                    </div>
                    <div className="mt-2 grid grid-cols-7 gap-1.5">
                      {days.map((d, i) => {
                        if (!d) return <span key={i} />;
                        const past = d < today;
                        const count = availability.data?.get(d);
                        const loading = availability.isLoading && !past;
                        const available = !past && (count ?? 0) > 0;
                        return (
                          <button
                            key={d}
                            disabled={!available}
                            onClick={() => pickDate(d)}
                            aria-label={`${formatDateBR(d)}${available ? `, ${count} horários` : ", indisponível"}`}
                            className={cn(
                              "relative aspect-square rounded-xl text-sm transition-all",
                              date === d ? "bg-cocoa text-pearl shadow-soft" : available ? "bg-blush/40 hover:bg-blush hover:-translate-y-0.5" : "text-muted-foreground/40 line-through",
                              loading && "animate-pulse bg-muted no-underline",
                            )}
                          >
                            {Number(d.slice(8))}
                            {available && date !== d && <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blush" /> Disponível</span>
                      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-cocoa" /> Selecionada</span>
                      <span className="flex items-center gap-1.5 line-through">Indisponível</span>
                    </div>
                    {availability.isError && <p className="mt-4 text-center text-sm text-destructive">Não foi possível consultar a agenda. Tente novamente.</p>}
                    {availability.data && [...availability.data.values()].every((v) => v === 0) && (
                      <p className="mt-4 text-center text-sm text-muted-foreground">Sem horários disponíveis neste mês. Veja o próximo mês.</p>
                    )}
                  </div>
                </motion.div>
              ) : step === 3 ? (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl">Escolha o horário</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{service?.name} · {date && formatDateBR(date)}</p>
                  {submitError && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{submitError}</p>}
                  <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                    {slots.isLoading && Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                    {slots.data?.map((t) => (
                      <button
                        key={t}
                        onClick={() => pickTime(t)}
                        className={cn("h-12 rounded-xl border text-sm transition-all hover:-translate-y-0.5 hover:border-gold", time === t ? "border-cocoa bg-cocoa text-pearl" : "border-border bg-pearl")}
                      >
                        {formatTime(t)}
                      </button>
                    ))}
                  </div>
                  {slots.data?.length === 0 && (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                      Os horários deste dia acabaram de ser preenchidos.{" "}
                      <button className="underline" onClick={() => go(2)}>Escolher outra data</button>
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="grid gap-8 lg:grid-cols-5">
                    <form
                      className="space-y-5 lg:col-span-3"
                      noValidate
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (validate()) go(5);
                      }}
                    >
                      <h3 className="text-2xl">Seus dados</h3>
                      <Field label="Nome completo" error={errors.name}>
                        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} className="input-lux" placeholder="Seu nome e sobrenome" />
                      </Field>
                      <Field label="WhatsApp com DDD" error={errors.phone}>
                        <input value={phone} onChange={(e) => setPhone(maskPhoneBR(e.target.value))} inputMode="tel" autoComplete="tel-national" className="input-lux" placeholder="(61) 90000-0000" />
                      </Field>
                      <Field label="Observações (opcional)" error={errors.notes}>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={3} className="input-lux resize-none" placeholder="Cor desejada, formato, alguma preferência..." />
                      </Field>
                      {reference && (
                        <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
                          <img src={reference.url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                          <p className="flex-1 text-sm">Referência: <span className="text-muted-foreground">{reference.caption ?? "Foto da galeria"}</span></p>
                          <button type="button" aria-label="Remover referência" onClick={() => setReference(null)}><X className="h-4 w-4" /></button>
                        </div>
                      )}
                      <label className="flex items-start gap-3 text-sm">
                        <Checkbox checked={privacy} onCheckedChange={(v) => setPrivacy(v === true)} className="mt-0.5" />
                        <span>
                          Li e aceito a <a href="/privacidade" target="_blank" className="underline decoration-gold underline-offset-4">política de privacidade</a>. Meus dados serão usados apenas para este agendamento.
                        </span>
                      </label>
                      {errors.privacy && <p className="text-xs text-destructive">{errors.privacy}</p>}
                      {step === 4 && (
                        <button type="submit" className="w-full rounded-full bg-cocoa py-4 text-xs uppercase tracking-[0.2em] text-pearl">
                          Revisar solicitação
                        </button>
                      )}
                    </form>
                    <aside className="space-y-4 lg:col-span-2">
                      <div className="rounded-2xl bg-champagne p-5 text-sm">
                        <p className="font-display text-xl">Resumo</p>
                        <dl className="mt-3 space-y-2">
                          <Row k="Serviço" v={service?.name} />
                          <Row k="Data" v={date ? formatDateBR(date) : "—"} />
                          <Row k="Horário" v={time ? formatTime(time) : "—"} />
                          {formatPrice(service?.price) && <Row k="Valor" v={formatPrice(service?.price)!} />}
                        </dl>
                      </div>
                      <Notice />
                      {step === 5 && (
                        <>
                          {submitError && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{submitError}</p>}
                          <button
                            onClick={submit}
                            disabled={submitting}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-gradient py-4 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground shadow-card transition-transform hover:-translate-y-0.5 disabled:opacity-70"
                          >
                            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {submitting ? "Registrando..." : submitError ? "Tentar novamente" : "Solicitar meu agendamento"}
                          </button>
                          <p className="text-center text-xs text-muted-foreground">Após registrar, o WhatsApp abrirá com a mensagem pronta — você só precisa tocar em Enviar.</p>
                        </>
                      )}
                    </aside>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function Row({ k, v }: { k: string; v?: string | undefined }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v ?? "—"}</dd>
    </div>
  );
}
