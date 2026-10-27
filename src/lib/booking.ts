// Pure helpers for the booking flow (no I/O) — covered by booking.test.ts.

export const DEFAULT_WHATSAPP = "5561998378967";
export const DEFAULT_INSTAGRAM = "https://www.instagram.com/mariaf.naildesigner19/";
export const BOOKING_NOTICE =
  "Atenção: o horário solicitado está sujeito à disponibilidade e à confirmação da profissional. Seu agendamento só estará confirmado após o retorno da Maria pelo WhatsApp.";

export type BookingMessageInput = {
  service: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or HH:MM:SS
  protocol: string;
  notes?: string | null;
  reference?: string | null;
};

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatTime(t: string): string {
  return t.slice(0, 5);
}

export function buildBookingMessage(i: BookingMessageInput): string {
  const notes = i.notes?.trim() ? i.notes.trim() : "Nenhuma";
  const lines = [
    "Olá, Maria! 💖",
    "",
    "Gostaria de solicitar um agendamento no seu estúdio!",
    "",
    `💅 Serviço: ${i.service}`,
    `👩 Cliente: ${i.name.trim()}`,
    `📅 Data desejada: ${formatDateBR(i.date)}`,
    `🕒 Horário desejado: ${formatTime(i.time)}`,
    `📋 Protocolo: ${i.protocol}`,
    `📝 Observações: ${notes}`,
  ];
  if (i.reference) lines.push(`🖼️ Referência: ${i.reference}`);
  lines.push("", "Aguardo sua confirmação de disponibilidade. ✨");
  return lines.join("\n");
}

export function whatsappUrl(number: string, message?: string): string {
  const digits = number.replace(/\D/g, "");
  return message
    ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${digits}`;
}

/** Brazilian phone with DDD: returns 10–11 digits or null. */
export function normalizePhoneBR(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (!/^[1-9][0-9]{9,10}$/.test(d)) return null;
  if (d.length === 11 && d[2] !== "9") return null;
  return d;
}

export function maskPhoneBR(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function confirmationMessage(name: string, service: string, date: string, time: string) {
  return `Olá, ${name.split(" ")[0]}! 💖\n\nSeu agendamento de ${service} para ${formatDateBR(
    date,
  )} às ${formatTime(time)} está confirmado. ✨\n\nQualquer imprevisto, me avise por aqui.\nMaria Ferreira Nail Designer`;
}

export const BOOKING_ERRORS: Record<string, string> = {
  INVALID_NAME: "Informe seu nome completo.",
  INVALID_PHONE: "Informe um WhatsApp válido com DDD.",
  INVALID_NOTES: "As observações podem ter no máximo 500 caracteres.",
  INVALID_SERVICE: "Este serviço não está disponível no momento.",
  RATE_LIMIT: "Recebemos muitas solicitações deste número. Tente novamente mais tarde ou fale pelo WhatsApp.",
  DUPLICATE: "Você já tem uma solicitação para este dia e horário.",
  SLOT_UNAVAILABLE: "Este horário acabou de ficar indisponível. Escolha outro horário, por favor.",
};

export function bookingErrorMessage(raw: string | undefined): string {
  if (raw) for (const k of Object.keys(BOOKING_ERRORS)) if (raw.includes(k)) return BOOKING_ERRORS[k]!;
  return "Não foi possível registrar sua solicitação. Verifique sua conexão e tente novamente.";
}

export function parseYMD(iso: string): [number, number, number] {
  const [y = 1970, m = 1, d = 1] = iso.split("-").map(Number);
  return [y, m, d];
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date in America/Sao_Paulo as YYYY-MM-DD. */
export function todaySaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

export function formatPrice(p: number | null | undefined) {
  if (p == null) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(p));
}

export function formatDuration(m: number | null | undefined) {
  if (!m) return null;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
}
