import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatDateBR, parseYMD, toISODate } from "@/lib/booking";
import { Panel, StatusBadge, WEEKDAYS, btnGhost, btnPrimary, inputCls, Label } from "./shared";
import { Empty } from "./AdminApp";

type Rule = Database["public"]["Tables"]["availability_rules"]["Row"];

export function Availability() {
  return (
    <div className="space-y-6">
      <Agenda />
      <div className="grid gap-6 lg:grid-cols-2">
        <Rules />
        <div className="space-y-6">
          <Blocks />
          <Special />
          <HoldPolicy />
        </div>
      </div>
    </div>
  );
}

function Rules() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("availability_rules").select("*").order("weekday");
      if (error) throw error;
      return data;
    },
  });
  const [rows, setRows] = useState<Rule[]>([]);
  useEffect(() => { if (q.data) setRows(q.data); }, [q.data]);
  const save = useMutation({
    mutationFn: async () => {
      for (const r of rows) {
        if (r.closing_time <= r.opening_time) throw new Error(`${WEEKDAYS[r.weekday]}: o fechamento deve ser depois da abertura.`);
      }
      const { error } = await supabase.from("availability_rules").upsert(rows.map(({ id, weekday, opening_time, closing_time, interval_minutes, slot_step_minutes, is_active }) => ({ id, weekday, opening_time, closing_time, interval_minutes, slot_step_minutes, is_active })));
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Horários de funcionamento salvos."); qc.invalidateQueries(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar."),
  });
  const set = (i: number, patch: Partial<Rule>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  return (
    <Panel title="Dias e horários de funcionamento" actions={<button className={btnPrimary} disabled={save.isPending} onClick={() => save.mutate()}>Salvar</button>}>
      {q.isLoading && <Skeleton className="h-64" />}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.id} className={cn("grid grid-cols-2 items-end gap-2 rounded-2xl border border-border p-3 sm:grid-cols-6", !r.is_active && "opacity-60")}>
            <label className="col-span-2 flex items-center gap-2 text-sm font-medium sm:col-span-1">
              <Switch checked={r.is_active} onCheckedChange={(v) => set(i, { is_active: v })} /> {WEEKDAYS[r.weekday]}
            </label>
            <label><Label>Abre</Label><input type="time" className={inputCls} value={r.opening_time.slice(0, 5)} onChange={(e) => set(i, { opening_time: e.target.value })} /></label>
            <label><Label>Fecha</Label><input type="time" className={inputCls} value={r.closing_time.slice(0, 5)} onChange={(e) => set(i, { closing_time: e.target.value })} /></label>
            <label><Label>Grade (min)</Label><input type="number" min={10} max={240} className={inputCls} value={r.slot_step_minutes} onChange={(e) => set(i, { slot_step_minutes: Number(e.target.value) })} /></label>
            <label className="col-span-2 sm:col-span-2"><Label>Intervalo entre atend. (min)</Label><input type="number" min={0} max={240} className={inputCls} value={r.interval_minutes} onChange={(e) => set(i, { interval_minutes: Number(e.target.value) })} /></label>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">“Grade” define de quanto em quanto tempo os horários aparecem (ex.: 30 = 9:00, 9:30...). O intervalo é a pausa mínima entre um atendimento e outro.</p>
    </Panel>
  );
}

function Blocks() {
  const qc = useQueryClient();
  const [f, setF] = useState({ blocked_date: "", end_date: "", start_time: "", end_time: "", reason: "" });
  const q = useQuery({
    queryKey: ["admin-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blocked_dates").select("*").gte("end_date", toISODate(new Date())).order("blocked_date");
      const { data: single, error: e2 } = await supabase.from("blocked_dates").select("*").is("end_date", null).gte("blocked_date", toISODate(new Date())).order("blocked_date");
      if (error || e2) throw error ?? e2;
      return [...(data ?? []), ...(single ?? [])].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date));
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      if (!f.blocked_date) throw new Error("Informe a data.");
      if ((f.start_time && !f.end_time) || (!f.start_time && f.end_time)) throw new Error("Informe início e fim do horário, ou deixe ambos vazios para bloquear o dia todo.");
      const { error } = await supabase.from("blocked_dates").insert({
        blocked_date: f.blocked_date,
        end_date: f.end_date || null,
        start_time: f.start_time || null,
        end_time: f.end_time || null,
        reason: f.reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { setF({ blocked_date: "", end_date: "", start_time: "", end_time: "", reason: "" }); toast.success("Bloqueio criado."); qc.invalidateQueries(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao bloquear."),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("blocked_dates").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries(),
  });
  return (
    <Panel title="Bloqueios, férias e folgas">
      <div className="grid grid-cols-2 gap-2">
        <label><Label>De</Label><input type="date" className={inputCls} value={f.blocked_date} onChange={(e) => setF({ ...f, blocked_date: e.target.value })} /></label>
        <label><Label>Até (opcional)</Label><input type="date" className={inputCls} value={f.end_date} onChange={(e) => setF({ ...f, end_date: e.target.value })} /></label>
        <label><Label>Das (opcional)</Label><input type="time" className={inputCls} value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} /></label>
        <label><Label>Às (opcional)</Label><input type="time" className={inputCls} value={f.end_time} onChange={(e) => setF({ ...f, end_time: e.target.value })} /></label>
        <label className="col-span-2"><Label>Motivo (privado)</Label><input className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Férias, folga, compromisso..." /></label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Sem horários = dia inteiro bloqueado. Com “Até” = período (férias).</p>
      <button className={cn(btnPrimary, "mt-3")} onClick={() => add.mutate()} disabled={add.isPending}>Adicionar bloqueio</button>
      <ul className="mt-4 divide-y divide-border text-sm">
        {q.data?.map((b) => (
          <li key={b.id} className="flex items-center justify-between gap-2 py-2">
            <span>
              {formatDateBR(b.blocked_date)}{b.end_date && b.end_date !== b.blocked_date ? ` → ${formatDateBR(b.end_date)}` : ""}
              {" · "}{b.start_time ? `${b.start_time.slice(0, 5)}–${b.end_time?.slice(0, 5)}` : "dia inteiro"}
              {b.reason && <span className="text-muted-foreground"> · {b.reason}</span>}
            </span>
            <button aria-label="Remover" onClick={() => del.mutate(b.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
          </li>
        ))}
        {q.data?.length === 0 && <li className="py-3 text-muted-foreground">Nenhum bloqueio futuro.</li>}
      </ul>
    </Panel>
  );
}

function Special() {
  const qc = useQueryClient();
  const [f, setF] = useState({ special_date: "", opening_time: "", closing_time: "", note: "" });
  const q = useQuery({
    queryKey: ["admin-special"],
    queryFn: async () => {
      const { data, error } = await supabase.from("special_hours").select("*").gte("special_date", toISODate(new Date())).order("special_date");
      if (error) throw error;
      return data;
    },
  });
  const add = useMutation({
    mutationFn: async () => {
      if (!f.special_date || !f.opening_time || !f.closing_time) throw new Error("Preencha data, abertura e fechamento.");
      if (f.closing_time <= f.opening_time) throw new Error("O fechamento deve ser depois da abertura.");
      const { error } = await supabase.from("special_hours").upsert({ ...f, note: f.note || null }, { onConflict: "special_date" });
      if (error) throw error;
    },
    onSuccess: () => { setF({ special_date: "", opening_time: "", closing_time: "", note: "" }); toast.success("Horário especial salvo."); qc.invalidateQueries(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro."),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("special_hours").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries(),
  });
  return (
    <Panel title="Horários especiais e feriados">
      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-3 sm:col-span-1"><Label>Data</Label><input type="date" className={inputCls} value={f.special_date} onChange={(e) => setF({ ...f, special_date: e.target.value })} /></label>
        <label><Label>Abre</Label><input type="time" className={inputCls} value={f.opening_time} onChange={(e) => setF({ ...f, opening_time: e.target.value })} /></label>
        <label><Label>Fecha</Label><input type="time" className={inputCls} value={f.closing_time} onChange={(e) => setF({ ...f, closing_time: e.target.value })} /></label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Substitui o horário normal daquele dia. Para fechar um feriado, use “Bloqueios”.</p>
      <button className={cn(btnPrimary, "mt-3")} onClick={() => add.mutate()}>Salvar horário especial</button>
      <ul className="mt-4 divide-y divide-border text-sm">
        {q.data?.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2">
            <span>{formatDateBR(s.special_date)} · {s.opening_time.slice(0, 5)}–{s.closing_time.slice(0, 5)}</span>
            <button aria-label="Remover" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function HoldPolicy() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
  const [on, setOn] = useState(true);
  const [min, setMin] = useState(120);
  useEffect(() => { if (q.data) { setOn(q.data.pending_hold_enabled); setMin(q.data.pending_hold_minutes); } }, [q.data]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("studio_settings").update({ pending_hold_enabled: on, pending_hold_minutes: min }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Política salva."); qc.invalidateQueries(); },
    onError: () => toast.error("Erro ao salvar."),
  });
  return (
    <Panel title="Reserva temporária de pedidos pendentes">
      <label className="flex items-center gap-3 text-sm"><Switch checked={on} onCheckedChange={setOn} /> Segurar o horário enquanto a solicitação está pendente</label>
      <label className="mt-3 block max-w-[200px]"><Label>Por quantos minutos</Label><input type="number" min={0} max={10080} className={inputCls} value={min} onChange={(e) => setMin(Number(e.target.value))} /></label>
      <p className="mt-2 text-xs text-muted-foreground">Evita que duas clientes peçam o mesmo horário ao mesmo tempo. Após esse prazo, o horário volta a aparecer se você não confirmar. Atendimentos confirmados sempre bloqueiam o horário.</p>
      <button className={cn(btnPrimary, "mt-3")} onClick={() => save.mutate()}>Salvar</button>
    </Panel>
  );
}

function Agenda() {
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [anchor, setAnchor] = useState(toISODate(new Date()));
  const range = useMemo((): [string, string] => {
    const [y, m, d] = parseYMD(anchor);
    const a = new Date(y, m - 1, d);
    if (view === "day") return [anchor, anchor];
    if (view === "week") {
      const s = new Date(a); s.setDate(a.getDate() - a.getDay());
      const e = new Date(s); e.setDate(s.getDate() + 6);
      return [toISODate(s), toISODate(e)];
    }
    return [toISODate(new Date(y, m - 1, 1)), toISODate(new Date(y, m, 0))];
  }, [anchor, view]);
  const q = useQuery({
    queryKey: ["admin-agenda", range],
    queryFn: async () => {
      const { data, error } = await supabase.from("booking_requests").select("*").gte("appointment_date", range[0]).lte("appointment_date", range[1]).in("status", ["pending", "confirmed", "completed"]).order("appointment_date").order("appointment_time");
      if (error) throw error;
      return data;
    },
  });
  const grouped = useMemo(() => {
    const m = new Map<string, NonNullable<typeof q.data>>();
    (q.data ?? []).forEach((b) => m.set(b.appointment_date, [...(m.get(b.appointment_date) ?? []), b]));
    return [...m];
  }, [q.data]);
  return (
    <Panel
      title="Agenda"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {(["day", "week", "month"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn(btnGhost, view === v && "border-cocoa bg-cocoa text-pearl")}>{v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}</button>
          ))}
          <input type="date" className={cn(inputCls, "w-auto")} value={anchor} onChange={(e) => e.target.value && setAnchor(e.target.value)} />
        </div>
      }
    >
      <p className="mb-3 text-xs text-muted-foreground">{formatDateBR(range[0])} a {formatDateBR(range[1])}</p>
      {q.isLoading && <Skeleton className="h-24" />}
      {q.data && grouped.length === 0 && <Empty text="Nenhum atendimento neste período." />}
      <div className="space-y-4">
        {grouped.map(([d, list]) => (
          <div key={d}>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">{WEEKDAYS[new Date(d + "T12:00").getDay()]}, {formatDateBR(d)}</p>
            <ul className="mt-2 divide-y divide-border rounded-2xl border border-border">
              {list.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-12 font-medium">{b.appointment_time.slice(0, 5)}</span>
                  <span className="flex-1">{b.client_name} · <span className="text-muted-foreground">{b.service_name}</span></span>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}
