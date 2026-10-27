import { createFileRoute } from "@tanstack/react-router";
import { AdminApp } from "@/components/admin/AdminApp";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel | Maria Ferreira Nail Designer" },
      { name: "description", content: "Área administrativa privada do estúdio Maria Ferreira Nail Designer." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel administrativo" },
      { property: "og:description", content: "Área privada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminApp,
});
