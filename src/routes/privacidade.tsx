import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | Maria Ferreira Nail Designer" },
      { name: "description", content: "Como a Maria Ferreira Nail Designer coleta, usa e protege seus dados nas solicitações de agendamento." },
      { property: "og:title", content: "Política de Privacidade — Maria Ferreira Nail Designer" },
      { property: "og:description", content: "Saiba como seus dados de agendamento são tratados." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="min-h-screen bg-pearl-gradient px-5 py-20">
      <article className="mx-auto max-w-2xl space-y-6 rounded-[2rem] border border-border bg-card p-8 leading-relaxed shadow-soft sm:p-12">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-primary">← Voltar ao site</Link>
        <h1 className="text-4xl">Política de Privacidade</h1>
        <p>Esta política explica como a Maria Ferreira Nail Designer trata os dados informados no site, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>
        <h2 className="text-2xl">Dados coletados</h2>
        <p>Ao solicitar um agendamento, coletamos nome, WhatsApp, serviço, data, horário e observações opcionais. Esses dados são usados exclusivamente para analisar e confirmar seu atendimento e entrar em contato com você.</p>
        <h2 className="text-2xl">Navegação no calendário</h2>
        <p>Para entender quais datas são mais procuradas, registramos de forma anônima as datas e horários clicados no calendário, vinculados apenas a um identificador aleatório da sessão. Nenhum nome ou telefone é associado a esses registros, que são apagados automaticamente após 90 dias.</p>
        <h2 className="text-2xl">Compartilhamento e segurança</h2>
        <p>Seus dados não são vendidos nem compartilhados com terceiros. O acesso às solicitações é restrito à profissional, por meio de área protegida por senha.</p>
        <h2 className="text-2xl">Seus direitos</h2>
        <p>Você pode solicitar a consulta, correção ou exclusão dos seus dados a qualquer momento pelo WhatsApp (61) 99837-8967.</p>
      </article>
    </main>
  );
}
