import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Concluído",
};
export const STATUS_STYLE: Record<string, string> = {
  pending: "bg-champagne text-cocoa border-gold/50",
  confirmed: "bg-blush text-cocoa border-rose/50",
  cancelled: "bg-muted text-muted-foreground border-border",
  completed: "bg-cocoa text-pearl border-cocoa",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function Panel({ title, children, actions, className }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-2xl">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{children}</span>;
}

export const inputCls = "w-full rounded-xl border border-input bg-pearl px-3 py-2.5 text-sm outline-none focus:border-gold";
export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-full bg-cocoa px-5 py-2.5 text-xs uppercase tracking-[0.15em] text-pearl transition-opacity hover:opacity-90 disabled:opacity-50";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-xs transition-colors hover:border-gold disabled:opacity-50";

/** Uploads to the private media bucket and returns a long-lived signed URL. */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Envie apenas imagens.");
  if (file.size > 8 * 1024 * 1024) throw new Error("A imagem deve ter até 8 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("Falha ao gerar link da imagem.");
  return data.signedUrl;
}

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
