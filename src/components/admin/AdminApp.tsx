import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, LayoutDashboard, Loader2, LogOut, Palette, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateBR } from "@/lib/booking";
import { Panel, btnPrimary, inputCls, Label } from "./shared";
import { Bookings } from "./Bookings";
import { Availability } from "./Availability";
import { Content } from "./Content";

type Tab = "dashboard" | "bookings" | "availability" | "content";

export function AdminApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setUser(session?.user ?? null);
        qc.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const role = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  if (user === undefined || (user && role.isLoading))
    return <div className="grid min-h-screen place-items-center bg-pearl-gradient"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Login />;
  if (!role.data)
    return (
      <div className="grid min-h-screen place-items-center bg-pearl-gradient px-5 text-center">
        <div className="max-w-sm space-y-4">
          <h1 className="text-3xl">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">Esta conta não tem permissão de administradora.</p>
          <button className={btnPrimary} onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </div>
    );
  return <Shell email={user.email ?? ""} />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="grid min-h-screen place-items-center bg-pearl-gradient px-5">
      <form
        className="w-full max-w-sm space-y-4 rounded-[2rem] border border-border bg-card p-8 shadow-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw });
          setBusy(false);
          if (error) toast.error("E-mail ou senha incorretos.");
        }}
      >
        <div className="text-center">
          <p className="font-display text-3xl">Maria Ferreira</p>
          <p className="text-[10px] uppercase tracking-[0.5em] text-gold">Painel privado</p>
        </div>
        <label className="block"><Label>E-mail</Label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" /></label>
        <label className="block"><Label>Senha</Label><input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} autoComplete="current-password" /></label>
        <button disabled={busy} className={cn(btnPrimary, "w-full py-3")}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Entrar</button>
        <button
          type="button"
          className="w-full text-xs text-muted-foreground underline"
          onClick={async () => {
            if (!email) {
              toast.error("Digite seu e-mail acima.");
              return;
            }
            await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
            toast.success("Se o e-mail estiver cadastrado, você receberá um link.");
          }}
        >
          Esqueci minha senha
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground">← Voltar ao site</Link>
      </form>
    </main>
  );
}

function Shell({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
    { id: "bookings", label: "Agendamentos", icon: ClipboardList },
    { id: "availability", label: "Disponibilidade", icon: CalendarDays },
    { id: "content", label: "Conteúdo", icon: Palette },
  ];
  return (
    <div className="min-h-screen bg-pearl-gradient">
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-display text-xl leading-none">Maria Ferreira</p>
            <p className="text-[9px] uppercase tracking-[0.4em] text-gold">Painel</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{email}</span>
            <button onClick={() => supabase.auth.signOut()} className="grid h-9 w-9 place-items-center rounded-full border border-border" aria-label="Sair"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors", tab === t.id ? "bg-cocoa text-pearl" : "hover:bg-blush/60")}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === "dashboard" && <Dashboard />}
        {tab === "bookings" && <Bookings />}
        {tab === "availability" && <Availability />}
        {tab === "content" && <Content />}
      </main>
    </div>
  );
}

function Dashboard() {
  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("booking_requests").select("*").order("appointment_date", { ascending: false }).limit(1000);
      if (error) throw error;
      return data;
    },
  });
  const selections = useQuery({
    queryKey: ["admin-selections"],
    queryFn: async () => {
      const since = new Date(Date.now() - 90 * 864e5).toISOString();
      const { data, error } = await supabase.from("date_selection_events").select("selected_date, selected_time, service_id").gte("created_at", since).limit(1000);
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const b = bookings.data ?? [];
    const c = (s: string) => b.filter((x) => x.status === s).length;
    const bySvc = new Map<string, number>();
    b.forEach((x) => bySvc.set(x.service_name, (bySvc.get(x.service_name) ?? 0) + 1));
    const byDate = new Map<string, number>();
    (selections.data ?? []).forEach((x) => byDate.set(x.selected_date, (byDate.get(x.selected_date) ?? 0) + 1));
    return {
      total: b.length,
      pending: c("pending"),
      confirmed: c("confirmed"),
      completed: c("completed"),
      cancelled: c("cancelled"),
      services: [...bySvc].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 7),
      dates: [...byDate].map(([d, total]) => ({ name: formatDateBR(d).slice(0, 5), d, total })).sort((a, b) => b.total - a.total).slice(0, 10),
    };
  }, [bookings.data, selections.data]);

  const cards = [
    { l: "Solicitações recebidas", v: stats.total },
    { l: "Pendentes", v: stats.pending },
    { l: "Confirmados", v: stats.confirmed },
    { l: "Concluídos", v: stats.completed },
    { l: "Cancelados", v: stats.cancelled },
  ];
  const upcoming = (bookings.data ?? [])
    .filter((b) => b.status === "confirmed" && b.appointment_date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => (a.appointment_date + a.appointment_time).localeCompare(b.appointment_date + b.appointment_time))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <div key={c.l} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{c.l}</p>
            {bookings.isLoading ? <Skeleton className="mt-2 h-9 w-12" /> : <p className="mt-1 font-display text-4xl">{c.v}</p>}
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Serviços mais solicitados">
          {stats.services.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.services} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                <Tooltip />
                <Bar dataKey="total" fill="var(--rose)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
        <Panel title="Datas mais procuradas (90 dias)">
          {stats.dates.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.dates}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="total" name="Cliques" fill="var(--gold)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>
      <Panel title="Próximos atendimentos confirmados">
        {upcoming.length === 0 ? <Empty text="Nenhum atendimento confirmado à frente." /> : (
          <ul className="divide-y divide-border">
            {upcoming.map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                <span className="font-medium">{formatDateBR(b.appointment_date)} · {b.appointment_time.slice(0, 5)}</span>
                <span>{b.client_name}</span>
                <span className="text-muted-foreground">{b.service_name}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

export function Empty({ text = "Ainda não há dados suficientes." }: { text?: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}
