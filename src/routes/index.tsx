import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { Header } from "@/components/site/Header";
import { Hero, About, Services, Experience, Reviews, Contact } from "@/components/site/Sections";
import { Gallery } from "@/components/site/Gallery";
import { Booking } from "@/components/site/Booking";
import { Footer, FloatingActions } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maria Ferreira Nail Designer | Alongamento e Unhas em Valparaíso de Goiás" },
      {
        name: "description",
        content:
          "Alongamento de unhas, unhas de gel, manicure, francesinha, esmaltação, design e stiletto em Valparaíso de Goiás – GO. Solicite seu horário online.",
      },
      { property: "og:title", content: "Maria Ferreira Nail Designer — Luxury Beauty Experience" },
      {
        property: "og:description",
        content: "Realçando a beleza e a confiança da mulher através das unhas. Agende seu horário em Valparaíso de Goiás.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <MotionConfig reducedMotion="user">
      <Header />
      <main>
        <Hero />
        <About />
        <Services />
        <Gallery />
        <Experience />
        <Reviews />
        <Booking />
        <Contact />
      </main>
      <Footer />
      <FloatingActions />
    </MotionConfig>
  );
}
