import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, Check, CheckCheck, History, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { confirmationMessage, formatDateBR, formatTime, maskPhoneBR, whatsappUrl } from "@/lib/booking";
import { Panel, StatusBadge, STATUS_LABEL, btnGhost, btnPrimary, inputCls, Label } from "./shared";
import { Empty } from "./AdminApp";

type Booking = Database["public"]["Tables"]["booking_requests"]["Row"];
type Status = Database["public"]["Enums"]["booking_status"];

function minutes(t: string) {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

export function findConflicts(list: Booking[]): Set<string> {
  const active = list.filter((b) => b.status === "pending" || b.status === "confirmed");
  const out = new Set<string>();
  for (let i = 0; i < active.length; i++)
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]!, b = active[j]!;
      if (a.appointment_date !== b.appointment_date) continue;
      const as = minutes(a.appointment_time), bs = minutes(b.appointment_time);
      if (as < bs + b.duration_minutes && bs < as + a.duration_minutes) {
        out.add(a.id);
        out.add(b.id);
      }
    }
  return out;
}

export function Bookings() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [date, setDate] = useState("");
  const [svc, setSvc] = useState("all");
  const [onlyConflicts, setOnlyConflicts] = useState(false);
  const [resched, setResched] = useState<Booking | null>(null);
  const [historyFor, setHistoryFor] = useState<Booking | null>(null);

  const q = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("booking_requests").select("*").order("appointment_date", { ascending: false }).order("appointment_time").limit(1000);
      if (error) throw error;
      return data;
    },
  });
  const conflicts = useMemo(() => findConflicts(q.data ?? []), [q.data]);
  const services = useMemo(() => [...new Set((q.data ?? []).map((b) => b.service_name))], [q.data]);
  const list = (q.data ?? []).filter(
    (b) =>
      (status === "all" || b.status === status) &&
      (!date || b.appointment_date === date) &&
      (svc === "all" || b.service_name === svc) &&
      (!onlyConflicts || conflicts.has(b.id)),
  );

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Booking> }) => {
      const { error } = await supabase.from("booking_requests").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("Agendamento atualizado.");
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  function setSt(b: Booking, s: Status) {
    if (s === "confirmed" && conflicts.has(b.id)) {
      const clash = (q.data ?? []).some((o) => o.id !== b.id && o.status === "confirmed" && o.appointment_date === b.appointment_date &&
        minutes(o.appointment_time) < minutes(b.appointment_time) + b.duration_minutes && minutes(b.appointment_time) < minutes(o.appointment_time) + o.duration_minutes);
      if (clash && !confirm("Já existe um atendimento confirmado neste horário. Confirmar mesmo assim?")) return;
    }
    update.mutate({ id: b.id, patch: { status: s } });
  }

  return (
    <div className="space-y-4">
      <Panel>
        <div className="grid gap-3 sm:grid-cols-4">
          <label><Label>Status</Label>
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Todos</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label><Label>Data</Label><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label><Label>Serviço</Label>
            <select className={inputCls} value={svc} onChange={(e) => setSvc(e.target.value)}>
              <option value="all">Todos</option>
              {services.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2.5 text-sm">
            <input type="checkbox" checked={onlyConflicts} onChange={(e) => setOnlyConflicts(e.target.checked)} /> Só conflitos ({conflicts.size})
          </label>
        </div>
      </Panel>

      {q.isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
      {q.data && list.length === 0 && <Panel><Empty text="Nenhuma solicitação encontrada." /></Panel>}
      <div className="grid gap-3">
        {list.map((b) => (
          <article key={b.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-xl">{b.client_name}</p>
                  <StatusBadge status={b.status} />
                  {conflicts.has(b.id) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive"><AlertTriangle className="h-3 w-3" /> Conflito de horário</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {b.service_name} · <strong className="text-foreground">{formatDateBR(b.appointment_date)} às {formatTime(b.appointment_time)}</strong> · {b.duration_minutes} min
                </p>
                <p className="text-sm text-muted-foreground">{maskPhoneBR(b.client_phone)} · Protocolo {b.protocol}</p>
                {b.notes && <p className="mt-2 rounded-xl bg-muted p-2 text-sm">{b.notes}</p>}
                {b.reference_image_url && (
                  <a href={b.reference_image_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-xs underline">
                    <img src={b.reference_image_url} alt="Referência" className="h-10 w-10 rounded-lg object-cover" /> Referência enviada
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <a className={btnGhost} href={whatsappUrl("55" + b.client_phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" /> Conversar</a>
                {b.status === "confirmed" && (
                  <a className={btnGhost} href={whatsappUrl("55" + b.client_phone, confirmationMessage(b.client_name, b.service_name, b.appointment_date, b.appointment_time))} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-3.5 w-3.5" /> Enviar confirmação
                  </a>
                )}
                {b.status === "pending" && <button className={btnPrimary} onClick={() => setSt(b, "confirmed")}><Check className="h-3.5 w-3.5" /> Confirmar</button>}
                {b.status === "confirmed" && <button className={btnPrimary} onClick={() => setSt(b, "completed")}><CheckCheck className="h-3.5 w-3.5" /> Concluído</button>}
                {(b.status === "pending" || b.status === "confirmed") && (
                  <>
                    <button className={btnGhost} onClick={() => setResched(b)}><CalendarClock className="h-3.5 w-3.5" /> Reagendar</button>
                    <button className={btnGhost} onClick={() => confirm("Cancelar esta solicitação?") && setSt(b, "cancelled")}><X className="h-3.5 w-3.5" /> Cancelar</button>
                  </>
                )}
                <button className={btnGhost} onClick={() => setHistoryFor(b)} aria-label="Histórico"><History className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Reschedule booking={resched} onClose={() => setResched(null)} onSave={(d, t) => { update.mutate({ id: resched!.id, patch: { appointment_date: d, appointment_time: t } }); setResched(null); }} />
      <HistoryDialog booking={historyFor} onClose={() => setHistoryFor(null)} />
    </div>
  );
}

function Reschedule({ booking, onClose, onSave }: { booking: Booking | null; onClose: () => void; onSave: (d: string, t: string) => void }) {
  const [d, setD] = useState("");
  const [t, setT] = useState("");
  useEffect(() => {
    if (booking) {
      setD(booking.appointment_date);
      setT(booking.appointment_time.slice(0, 5));
    }
  }, [booking]);
  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reagendar {booking?.client_name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <label><Label>Nova data</Label><input type="date" className={inputCls} value={d} onChange={(e) => setD(e.target.value)} /></label>
          <label><Label>Novo horário</Label><input type="time" step={300} className={inputCls} value={t} onChange={(e) => setT(e.target.value)} /></label>
        </div>
        <p className="text-xs text-muted-foreground">Depois de salvar, avise a cliente pelo WhatsApp.</p>
        <button className={btnPrimary} onClick={() => d && t && onSave(d, t)}>Salvar</button>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const h = useQuery({
    queryKey: ["history", booking?.id],
    enabled: !!booking,
    queryFn: async () => {
      const { data, error } = await supabase.from("booking_history").select("*").eq("booking_id", booking!.id).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Histórico · {booking?.protocol}</DialogTitle></DialogHeader>
        {h.isLoading && <Skeleton className="h-20" />}
        <ol className="space-y-3 text-sm">
          {h.data?.map((x) => (
            <li key={x.id} className="border-l-2 border-gold pl-3">
              <p className="text-xs text-muted-foreground">{new Date(x.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</p>
              {!x.old_status ? <p>Solicitação criada ({STATUS_LABEL[x.new_status ?? "pending"]})</p> : (
                <>
                  {x.old_status !== x.new_status && <p>Status: {STATUS_LABEL[x.old_status]} → {STATUS_LABEL[x.new_status!]}</p>}
                  {(x.old_date !== x.new_date || x.old_time !== x.new_time) && (
                    <p>Reagendado: {formatDateBR(x.old_date!)} {x.old_time?.slice(0, 5)} → {formatDateBR(x.new_date!)} {x.new_time?.slice(0, 5)}</p>
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
