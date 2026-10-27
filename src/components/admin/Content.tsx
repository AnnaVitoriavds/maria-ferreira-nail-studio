import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Panel, btnGhost, btnPrimary, inputCls, Label, uploadMedia } from "./shared";

type Service = Database["public"]["Tables"]["services"]["Row"];
type Settings = Database["public"]["Tables"]["studio_settings"]["Row"];
const CATS = ["Alongamentos", "Francesinhas", "Unhas de Gel", "Nail Art", "Delicadas", "Trabalhos Recentes"];

function ImagePicker({ value, onChange, folder, className }: { value?: string | null; onChange: (url: string) => void; folder: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className={cn("relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted", className)}>
      {value ? <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
      <span className="relative z-10 flex items-center gap-1 rounded-full bg-pearl/90 px-3 py-1 text-xs">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />} {value ? "Trocar" : "Enviar foto"}
      </span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setBusy(true);
          try {
            onChange(await uploadMedia(f, folder));
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Falha no envio.");
          } finally {
            setBusy(false);
            e.target.value = "";
          }
        }}
      />
    </label>
  );
}

export function Content() {
  return (
    <div className="space-y-6">
      <ServicesEditor />
      <GalleryEditor />
      <SettingsEditor />
      <TestimonialsEditor />
    </div>
  );
}

function ServicesEditor() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const [rows, setRows] = useState<Service[]>([]);
  useEffect(() => { if (q.data) setRows(q.data); }, [q.data]);
  const save = useMutation({
    mutationFn: async (s: Service) => {
      if (s.name.trim().length < 2) throw new Error("Informe o nome do serviço.");
      const { id, created_at, updated_at, ...rest } = s;
      const { error } = await supabase.from("services").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Serviço salvo."); qc.invalidateQueries(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar."),
  });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("services").insert({ name: "Novo serviço", description: "", display_order: rows.length + 1, is_active: false });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("services").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Serviço removido."); qc.invalidateQueries(); },
  });
  const set = (i: number, p: Partial<Service>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));

  return (
    <Panel title="Serviços" actions={<button className={btnGhost} onClick={() => add.mutate()}><Plus className="h-3.5 w-3.5" /> Novo serviço</button>}>
      {q.isLoading && <Skeleton className="h-40" />}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((s, i) => (
          <div key={s.id} className="grid grid-cols-[96px_1fr] gap-3 rounded-2xl border border-border p-3">
            <ImagePicker value={s.image_url} folder="services" onChange={(url) => set(i, { image_url: url })} className="h-28 w-24" />
            <div className="space-y-2">
              <input className={inputCls} value={s.name} onChange={(e) => set(i, { name: e.target.value })} aria-label="Nome" />
              <textarea className={cn(inputCls, "resize-none")} rows={2} value={s.description} onChange={(e) => set(i, { description: e.target.value })} aria-label="Descrição" maxLength={400} />
              <div className="grid grid-cols-3 gap-2">
                <label><Label>Preço R$</Label><input type="number" min={0} step="0.01" className={inputCls} value={s.price ?? ""} onChange={(e) => set(i, { price: e.target.value === "" ? null : Number(e.target.value) })} placeholder="—" /></label>
                <label><Label>Duração min</Label><input type="number" min={10} max={600} className={inputCls} value={s.duration_minutes ?? ""} onChange={(e) => set(i, { duration_minutes: e.target.value === "" ? null : Number(e.target.value) })} placeholder="60" /></label>
                <label><Label>Ordem</Label><input type="number" className={inputCls} value={s.display_order} onChange={(e) => set(i, { display_order: Number(e.target.value) })} /></label>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs"><Switch checked={s.is_active} onCheckedChange={(v) => set(i, { is_active: v })} /> Visível no site</label>
                <div className="flex gap-2">
                  <button className={btnGhost} aria-label="Excluir" onClick={() => confirm("Excluir este serviço?") && del.mutate(s.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                  <button className={btnPrimary} onClick={() => save.mutate(s)}>Salvar</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Sem duração cadastrada, a agenda considera 60 minutos. Preço vazio não aparece no site.</p>
    </Panel>
  );
}

function GalleryEditor() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });
  const [cat, setCat] = useState<string>("Alongamentos");
  const [caption, setCaption] = useState("");
  const inv = () => { qc.invalidateQueries({ queryKey: ["admin-gallery"] }); qc.invalidateQueries({ queryKey: ["gallery"] }); };
  const add = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase.from("gallery").insert({ image_url: url, category: cat, caption: caption || null, display_order: (q.data?.length ?? 0) + 1 });
      if (error) throw error;
    },
    onSuccess: () => { setCaption(""); toast.success("Foto adicionada."); inv(); },
    onError: () => toast.error("Erro ao adicionar."),
  });
  const upd = useMutation({
    mutationFn: async ({ id, p }: { id: string; p: Database["public"]["Tables"]["gallery"]["Update"] }) => { const { error } = await supabase.from("gallery").update(p).eq("id", id); if (error) throw error; },
    onSuccess: inv,
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("gallery").delete().eq("id", id); if (error) throw error; },
    onSuccess: inv,
  });
  return (
    <Panel title="Galeria">
      <div className="grid items-end gap-3 rounded-2xl bg-champagne/60 p-3 sm:grid-cols-[1fr_1fr_160px]">
        <label><Label>Categoria</Label><select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label><Label>Legenda</Label><input className={inputCls} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={160} /></label>
        <ImagePicker folder="gallery" onChange={(url) => add.mutate(url)} className="h-11" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Use apenas fotos próprias ou com autorização da cliente.</p>
      {q.isLoading && <Skeleton className="mt-4 h-40" />}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {q.data?.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-2xl border border-border">
            <img src={g.image_url} alt={g.caption ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
            <div className="space-y-1.5 p-2">
              <select className={cn(inputCls, "py-1.5 text-xs")} defaultValue={g.category} onChange={(e) => upd.mutate({ id: g.id, p: { category: e.target.value } })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              <input className={cn(inputCls, "py-1.5 text-xs")} defaultValue={g.caption ?? ""} onBlur={(e) => e.target.value !== (g.caption ?? "") && upd.mutate({ id: g.id, p: { caption: e.target.value || null } })} placeholder="Legenda" />
              <div className="flex items-center gap-1.5">
                <input type="number" className={cn(inputCls, "py-1.5 text-xs")} defaultValue={g.display_order} onBlur={(e) => upd.mutate({ id: g.id, p: { display_order: Number(e.target.value) } })} aria-label="Ordem" />
                <button className={btnGhost} aria-label="Excluir foto" onClick={() => confirm("Excluir esta foto?") && del.mutate(g.id)}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SettingsEditor() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("studio_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => { if (q.data) setS(q.data); }, [q.data]);
  const save = useMutation({
    mutationFn: async () => {
      if (!s) return;
      const wa = s.whatsapp_number.replace(/\D/g, "");
      if (wa.length < 12) throw new Error("WhatsApp deve incluir 55 + DDD + número.");
      const { id, updated_at, ...rest } = s;
      const { error } = await supabase.from("studio_settings").update({ ...rest, whatsapp_number: wa }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Informações salvas."); qc.invalidateQueries(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar."),
  });
  if (!s) return <Skeleton className="h-64 rounded-3xl" />;
  const f = (k: keyof Settings) => ({
    value: (s[k] as string | number | null) ?? "",
    onChange: (e: { target: { value: string } }) => setS({ ...s, [k]: e.target.value === "" && k !== "about_text" && k !== "about_title" ? null : e.target.value }),
  });
  const F = ({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) => (
    <label className={cn("block", wide && "sm:col-span-2")}><Label>{label}</Label>{children}</label>
  );
  return (
    <Panel title="Textos, contatos e fotos" actions={<button className={btnPrimary} onClick={() => save.mutate()} disabled={save.isPending}>Salvar</button>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex gap-3 sm:col-span-2">
          <div><Label>Foto de perfil (Sobre)</Label><ImagePicker value={s.profile_image_url} folder="profile" onChange={(u) => setS({ ...s, profile_image_url: u })} className="h-32 w-28" /></div>
          <div><Label>Foto de abertura</Label><ImagePicker value={s.hero_image_url} folder="hero" onChange={(u) => setS({ ...s, hero_image_url: u })} className="h-32 w-44" /></div>
        </div>
        {F({ label: "Título da seção Sobre", wide: true, children: <input className={inputCls} {...f("about_title")} /> })}
        {F({ label: "Texto institucional", wide: true, children: <textarea rows={4} className={cn(inputCls, "resize-none")} {...f("about_text")} /> })}
        {F({ label: "WhatsApp (55 + DDD + número)", children: <input className={inputCls} {...f("whatsapp_number")} /> })}
        {F({ label: "Instagram (link)", children: <input className={inputCls} {...f("instagram_url")} /> })}
        {F({ label: "Endereço completo", children: <input className={inputCls} {...f("address")} placeholder="Rua, número, bairro" /> })}
        {F({ label: "Cidade", children: <input className={inputCls} {...f("city")} /> })}
        {F({ label: "Link do mapa / rotas (opcional)", children: <input className={inputCls} {...f("maps_url")} placeholder="https://maps.app.goo.gl/..." /> })}
        {F({ label: "Link das avaliações no Google", children: <input className={inputCls} {...f("google_reviews_url")} /> })}
        {F({ label: "Nota no Google", children: <input type="number" step="0.1" min={1} max={5} className={inputCls} {...f("google_rating")} /> })}
        {F({ label: "Nº de avaliações no Google", children: <input type="number" min={0} className={inputCls} {...f("google_review_count")} /> })}
        {F({ label: "Horário de atendimento (texto exibido no site)", wide: true, children: <textarea rows={2} className={cn(inputCls, "resize-none")} {...f("business_hours")} placeholder="Ex.: Segunda a sábado, das 9h às 19h" /> })}
        {F({ label: "Aviso de agendamento", wide: true, children: <textarea rows={3} className={cn(inputCls, "resize-none")} {...f("booking_notice")} /> })}
      </div>
    </Panel>
  );
}

function TestimonialsEditor() {
  const qc = useQueryClient();
  const [f, setF] = useState({ author_name: "", content: "", rating: 5, authorized: false });
  const q = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const inv = () => qc.invalidateQueries();
  const add = useMutation({
    mutationFn: async () => {
      if (!f.authorized) throw new Error("Confirme que a cliente autorizou a publicação.");
      const { error } = await supabase.from("testimonials").insert({ ...f, is_published: true });
      if (error) throw error;
    },
    onSuccess: () => { setF({ author_name: "", content: "", rating: 5, authorized: false }); toast.success("Depoimento publicado."); inv(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro."),
  });
  const upd = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => { const { error } = await supabase.from("testimonials").update({ is_published }).eq("id", id); if (error) throw error; },
    onSuccess: inv,
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("testimonials").delete().eq("id", id); if (error) throw error; },
    onSuccess: inv,
  });
  return (
    <Panel title="Depoimentos reais">
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <input className={inputCls} placeholder="Nome da cliente" value={f.author_name} onChange={(e) => setF({ ...f, author_name: e.target.value })} />
        <select className={inputCls} value={f.rating} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select>
        <textarea className={cn(inputCls, "resize-none sm:col-span-2")} rows={3} placeholder="Depoimento" maxLength={600} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.authorized} onChange={(e) => setF({ ...f, authorized: e.target.checked })} /> A cliente autorizou a publicação</label>
      <button className={cn(btnPrimary, "mt-3")} onClick={() => add.mutate()}>Publicar depoimento</button>
      <ul className="mt-4 divide-y divide-border text-sm">
        {q.data?.map((t) => (
          <li key={t.id} className="flex items-start justify-between gap-3 py-3">
            <div><p className="font-medium">{t.author_name} · {t.rating}★</p><p className="text-muted-foreground">{t.content}</p></div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch checked={t.is_published} onCheckedChange={(v) => upd.mutate({ id: t.id, is_published: v })} aria-label="Publicado" />
              <button aria-label="Excluir" onClick={() => confirm("Excluir depoimento?") && del.mutate(t.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
