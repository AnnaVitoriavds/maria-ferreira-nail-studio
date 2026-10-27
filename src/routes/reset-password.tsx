import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha | Maria Ferreira Nail Designer" },
      { name: "description", content: "Defina uma nova senha de acesso ao painel." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Redefinir senha" },
      { property: "og:description", content: "Defina uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  return (
    <main className="grid min-h-screen place-items-center bg-pearl-gradient px-5">
      <form
        className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-8 shadow-card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) {
            toast.error("Use pelo menos 8 caracteres.");
            return;
          }
          setBusy(true);
          const { error } = await supabase.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) {
            toast.error("Não foi possível atualizar. Abra novamente o link do e-mail.");
            return;
          }
          toast.success("Senha atualizada.");
          nav({ to: "/admin" });
        }}
      >
        <h1 className="text-3xl">Nova senha</h1>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="input-lux" placeholder="Nova senha" autoComplete="new-password" />
        <button disabled={busy} className="w-full rounded-full bg-cocoa py-3 text-xs uppercase tracking-[0.2em] text-pearl">Salvar</button>
      </form>
    </main>
  );
}
